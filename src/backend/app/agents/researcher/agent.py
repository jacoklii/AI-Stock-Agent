"""The ``researcher`` — the single agent that does all LLM work, as a thin task dispatcher.

One agent because every output shares the same role: read inputs, gather via the allowed tools,
produce a structured deliverable. Each *task* carries its own prompt, model, tool allowlist, and
output schema (``TASKS`` below); the agent itself just runs the loop.

How a task is autonomous, and how it is bounded:
- The workflow picks WHICH task runs and seeds the inputs. Within the task, the model decides HOW
  — which of its allowed tools to call, in what order, how many times — to gather what it needs.
- It is sandboxed by four execution-rule "stops": (1) the per-task tool **allowlist** from the
  registry (``get_tools_for``) — it cannot reach a tool not granted to its task; (2) every tool
  runs **read-only** via ``invoke_tool``; (3) a hard **iteration cap** on the tool loop; (4) the
  task must finish by calling its ``submit`` tool, whose schema IS the output model — forcing a
  **structured** result, never free-form chat.

This is "orchestrated pipelines + autonomous-within-task," not open agent planning.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ValidationError

from app.agents.budget import Budget
from app.agents.researcher import schemas
from app.config import DEEP_RESEARCH_MAX_ITERS, MODEL_HAIKU, MODEL_OPUS, MODEL_SONNET, get_settings
from app.providers.llm import LLMProvider, get_llm_provider
from app.tools.invoke import invoke_tool, tool_json_schema
from app.tools.registry import (
    TASK_ARTICLE_SUMMARY,
    TASK_COMPANY_PROSE,
    TASK_DEEP_RESEARCH,
    TASK_FOLLOWUP,
    TASK_PULSE_SNAPSHOT,
    TASK_SECTION_SNAPSHOT,
    TASK_SIGNIFICANCE,
    TASK_TOP_SNAPSHOT,
    get_tools_for,
)

_PROMPT_DIR = Path(__file__).parent

logger = logging.getLogger(__name__)

# Anthropic server-side web tools, attached to web-enabled tasks (``TaskSpec.web``). They run
# inside the model's turn on Anthropic's infrastructure — never through the client allowlist or
# ``invoke_tool``. One module-level constant so the tool list keeps a stable byte identity across
# loop iterations (a changing tool list would invalidate the prompt cache).
# Searches bill per-use on the Anthropic account ($10/1k), outside the token budget.
_SERVER_WEB_TOOLS: list[dict[str, Any]] = [
    {"type": "web_search_20260209", "name": "web_search", "max_uses": 5},
    {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 10, "max_content_tokens": 25_000},
]

# Reflection: how many times to send a finding back for citations before accepting it anyway.
_MAX_GROUNDING_NUDGES = 1
_GROUNDING_NUDGE = (
    "Every finding must be grounded: cite the news_event ids it draws on in `sources` and/or "
    "the web pages it draws on in `source_urls`. Add them, then resubmit."
)


def _needs_grounding(out: BaseModel) -> bool:
    """True when an output has findings but cites nothing — neither news ids (``sources``) nor
    external pages (``source_urls``). Either kind of citation grounds a finding."""
    findings = getattr(out, "findings", None)
    if not findings:
        return False
    sources = getattr(out, "sources", None)
    source_urls = getattr(out, "source_urls", None)
    if sources or source_urls:
        return False
    return sources is not None or source_urls is not None


def _usage_tokens(resp: Any) -> int:
    """Effective cost-weighted tokens for one call: cache writes cost 1.25x a plain input token,
    cache reads 0.1x. This is what ``Budget`` accumulates and what lands in ``tasks.tokens_used``
    — uncached calls reduce to input+output, so pre-caching rows stay comparable."""
    usage = getattr(resp, "usage", None)
    if usage is None:
        return 0
    inp = getattr(usage, "input_tokens", 0) or 0
    out = getattr(usage, "output_tokens", 0) or 0
    cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    return round(inp + out + 1.25 * cache_write + 0.1 * cache_read)


@dataclass(frozen=True)
class TaskSpec:
    """A researcher task: its prompt file, the model it runs on, and its output schema. The tool
    allowlist is not stored here — it is resolved live from the registry by task name."""

    name: str
    prompt_file: str
    model: str
    output_model: type[BaseModel]
    # Per-task loop bound; ``None`` falls back to the agent default (``agent_max_tool_iters``).
    # Deep research self-paces over many steps, so it sets a larger one.
    max_iters: int | None = None
    # Attach the Anthropic server-side web tools (search + fetch). Only the externally-facing
    # research tasks get the open web; ingest/synthesis tasks stay on internal data.
    web: bool = False


# Model choice mirrors the architecture: Haiku for high-volume ingest, Sonnet/Opus for synthesis.
TASKS: dict[str, TaskSpec] = {
    TASK_ARTICLE_SUMMARY: TaskSpec(
        TASK_ARTICLE_SUMMARY, "prompt_article.md", MODEL_HAIKU, schemas.ArticleSummaryOut
    ),
    TASK_SIGNIFICANCE: TaskSpec(
        TASK_SIGNIFICANCE, "prompt_significance.md", MODEL_HAIKU, schemas.SignificanceOut
    ),
    TASK_PULSE_SNAPSHOT: TaskSpec(
        TASK_PULSE_SNAPSHOT, "prompt_pulse.md", MODEL_HAIKU, schemas.SnapshotOut
    ),
    TASK_SECTION_SNAPSHOT: TaskSpec(
        TASK_SECTION_SNAPSHOT, "prompt_section.md", MODEL_SONNET, schemas.SectionSnapshotOut
    ),
    TASK_COMPANY_PROSE: TaskSpec(
        TASK_COMPANY_PROSE, "prompt_company_prose.md", MODEL_SONNET, schemas.CompanyProseOut
    ),
    TASK_TOP_SNAPSHOT: TaskSpec(
        TASK_TOP_SNAPSHOT, "prompt_top_snapshot.md", MODEL_OPUS, schemas.SnapshotOut
    ),
    TASK_FOLLOWUP: TaskSpec(
        TASK_FOLLOWUP, "prompt_followup.md", MODEL_SONNET, schemas.FollowupOut, web=True
    ),
    TASK_DEEP_RESEARCH: TaskSpec(
        TASK_DEEP_RESEARCH,
        "prompt_deep_research.md",
        MODEL_SONNET,
        schemas.DeepResearchOut,
        max_iters=DEEP_RESEARCH_MAX_ITERS,
        web=True,
    ),
}


# The shared system prompt — role, autonomy, learning, constraints, grounding — prepended to every
# task's card. One identity for the whole agent; the per-task file only says what *this* call's job
# is. It is byte-identical across tasks and rendered first, so the prompt-cache prefix is shared
# wherever the tool list also matches.
SYSTEM_FILE = "prompt_system.md"


@lru_cache(maxsize=None)
def _load_prompt(filename: str) -> str:
    return (_PROMPT_DIR / filename).read_text(encoding="utf-8")


@lru_cache(maxsize=None)
def _system_prompt(prompt_file: str) -> str:
    """The full system string for a task: shared + the task's card."""
    return f"{_load_prompt(SYSTEM_FILE)}\n\n---\n\n{_load_prompt(prompt_file)}"


def _jsonable(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    if hasattr(value, "__dataclass_fields__"):
        return {k: _jsonable(getattr(value, k)) for k in value.__dataclass_fields__}
    return value


def _submit_tool(spec: TaskSpec) -> dict[str, Any]:
    return {
        "name": f"submit_{spec.name}",
        "description": "Return the final, structured result for this task. Call this exactly once "
        "when you have everything you need.",
        "input_schema": spec.output_model.model_json_schema(),
    }


class Researcher:
    """The single agent. ``run_task`` dispatches one task and returns its validated output."""

    def __init__(self, llm: LLMProvider | None = None) -> None:
        self._llm = llm or get_llm_provider()
        self._max_iters = get_settings().agent_max_tool_iters

    async def run_task(
        self,
        task_name: str,
        *,
        inputs: dict[str, Any],
        max_tokens: int = 4096,
        budget: Budget | None = None,
    ) -> BaseModel:
        """Run one task to a structured result. If ``budget`` is given, each LLM call's token
        usage is accumulated onto it and the loop self-paces — once the ceiling is reached the
        agent is forced to submit on the next turn (a graceful stop, not a crash)."""
        spec = TASKS[task_name]
        max_iters = spec.max_iters or self._max_iters
        allowlist = {t.name: t for t in get_tools_for(task_name)}
        submit = _submit_tool(spec)
        tools = [
            {"name": t.name, "description": t.description, "input_schema": tool_json_schema(t)}
            for t in allowlist.values()
        ] + [submit]
        if spec.web:
            # Server-side tools execute on Anthropic's side; they are NOT in the allowlist and
            # never pass through _run_tool. The list must stay identical every iteration —
            # appending here (not mutating per attempt) keeps the prompt-cache prefix stable.
            tools = tools + _SERVER_WEB_TOOLS

        system = _system_prompt(spec.prompt_file)
        messages: list[dict[str, Any]] = [
            {"role": "user", "content": json.dumps(_jsonable(inputs), default=str)}
        ]
        grounding_nudges = 0
        # Server-side web tools execute in a server container; once a response carries its id,
        # every later call in this task must send it back or a paused turn cannot resume.
        container_id: str | None = None
        server_paused = False

        for attempt in range(max_iters):
            # Force the submit tool on the last attempt, or once the budget ceiling is hit, so we
            # always end with structured output and never overspend. Never force while a server
            # turn is paused — the API rejects a tool_choice over pending server tool uses; the
            # force defers to the next iteration instead.
            force_submit = not server_paused and (
                attempt == max_iters - 1 or (budget is not None and budget.over())
            )
            resp = await self._llm.create(
                model=spec.model,
                system=system,
                messages=messages,
                tools=tools,
                tool_choice=(
                    {"type": "tool", "name": submit["name"]} if force_submit else {"type": "auto"}
                ),
                max_tokens=max_tokens,
                container=container_id,
            )
            if budget is not None:
                budget.add(_usage_tokens(resp))
            messages.append({"role": "assistant", "content": resp.content})
            container_id = getattr(getattr(resp, "container", None), "id", None) or container_id

            server_uses = [
                b.name for b in resp.content if getattr(b, "type", None) == "server_tool_use"
            ]
            if server_uses:
                logger.info("server tools ran for %s: %s", task_name, server_uses)
            server_paused = getattr(resp, "stop_reason", None) == "pause_turn"
            if server_paused:
                # A long server-tool turn was checkpointed mid-flight. Re-send the conversation
                # unchanged (no user message) and the server resumes where it left off — this
                # must not fall through to the "no tool_uses -> nudge" branch below.
                continue

            tool_uses = [b for b in resp.content if getattr(b, "type", None) == "tool_use"]
            if not tool_uses:
                # The model answered without calling a tool; nudge it to submit and retry.
                messages.append(
                    {"role": "user", "content": f"Call {submit['name']} with the final result."}
                )
                continue

            submit_block = next((b for b in tool_uses if b.name == submit["name"]), None)
            if submit_block is not None:
                try:
                    out = spec.output_model.model_validate(submit_block.input)
                except ValidationError as exc:
                    if force_submit:  # a hard stop stays a visible failure in `tasks`
                        raise
                    # Self-correction: feed the validation error back and let the model resubmit.
                    messages.append(
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "tool_result",
                                    "tool_use_id": submit_block.id,
                                    "content": f"Invalid result, fix and resubmit: {exc}",
                                    "is_error": True,
                                }
                            ],
                        }
                    )
                    continue
                # Reflection: bounce an ungrounded result back for citations (unless we must stop).
                if not force_submit and grounding_nudges < _MAX_GROUNDING_NUDGES and _needs_grounding(out):
                    grounding_nudges += 1
                    messages.append(
                        {
                            "role": "user",
                            "content": [
                                {"type": "tool_result", "tool_use_id": submit_block.id, "content": _GROUNDING_NUDGE}
                            ],
                        }
                    )
                    continue
                return out

            tool_results: list[dict[str, Any]] = []
            for block in tool_uses:
                result = await self._run_tool(allowlist, block.name, block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, default=str),
                    }
                )
            messages.append({"role": "user", "content": tool_results})

        raise RuntimeError(
            f"researcher task {task_name!r} did not submit within {max_iters} iterations"
        )

    async def _run_tool(self, allowlist: dict, name: str, args: dict[str, Any]) -> Any:
        spec = allowlist.get(name)
        if spec is None:  # the registry allowlist is the stop — refuse anything off it
            return {"error": f"tool {name!r} is not permitted for this task"}
        try:
            return await invoke_tool(spec, args)
        except Exception as exc:
            # Self-correction: surface the failure (bad args, missing row, provider error) as a
            # tool result so the model can adjust, instead of crashing the whole task.
            return {"error": f"{type(exc).__name__}: {exc}"}


@lru_cache(maxsize=1)
def get_researcher() -> Researcher:
    return Researcher()
