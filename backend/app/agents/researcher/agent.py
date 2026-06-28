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
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ValidationError

from app.agents.budget import Budget
from app.agents.researcher import schemas
from app.config import DEEP_RESEARCH_MAX_ITERS, MODEL_HAIKU, MODEL_OPUS, MODEL_SONNET, get_settings
from app.providers.errors import ProviderError
from app.providers.llm import LLMProvider, get_llm_provider
from app.tools.invoke import invoke_tool, tool_json_schema
from app.tools.registry import (
    TASK_COMPANY_PROSE,
    TASK_DEEP_RESEARCH,
    TASK_FOLLOWUP,
    TASK_PULSE_SNAPSHOT,
    TASK_SECTION_SNAPSHOT,
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

# Prepended to a user redirect so the model treats it as a steer, not as a fact to research.
_STEER_PREFIX = (
    "↪ The user has redirected this research mid-session. Adjust your focus and priorities "
    "accordingly while keeping any prior findings that stay relevant: "
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


def _has_unresolved_server_tool(content: list[Any]) -> bool:
    """True when an assistant turn carries a ``server_tool_use`` block with no matching result
    block in the same content. This happens on a ``pause_turn``, but also when a server tool runs
    to completion yet its result is not surfaced as a client-visible block — notably the
    ``code_execution`` that ``web_search``/``web_fetch`` run *internally* for dynamic filtering
    (the result is consumed server-side, so only the ``server_tool_use`` lands in ``content``).

    Such a turn must be re-sent so the server resumes; appending a user/tool_result turn after it
    orphans the ``server_tool_use`` and the next request is rejected with a 400 ("``code_execution``
    tool use ... without a corresponding ``code_execution_tool_result`` block")."""
    server_ids = {
        getattr(b, "id", None) for b in content if getattr(b, "type", None) == "server_tool_use"
    }
    server_ids.discard(None)
    if not server_ids:
        return False
    resolved = {
        getattr(b, "tool_use_id", None)
        for b in content
        if str(getattr(b, "type", "")).endswith("_tool_result")
    }
    return bool(server_ids - resolved)


def _usage_components(resp: Any) -> tuple[int, int, int, int]:
    """The raw token components of one call: (input, output, cache_write, cache_read). ``Budget``
    keeps these split (so a session can report input vs output, each on its own scale) and derives
    the blended cost-weighted figure that lands in ``tasks.tokens_used``. Returns zeros when the
    response carries no usage (e.g. a paused server turn)."""
    usage = getattr(resp, "usage", None)
    if usage is None:
        return 0, 0, 0, 0
    inp = getattr(usage, "input_tokens", 0) or 0
    out = getattr(usage, "output_tokens", 0) or 0
    cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    return inp, out, cache_write, cache_read


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
        progress: Callable[[dict[str, Any]], Awaitable[None]] | None = None,
        steer: Callable[[], Awaitable[str | None]] | None = None,
    ) -> BaseModel:
        """Run one task to a structured result. If ``budget`` is given, each LLM call's token
        usage is accumulated onto it and the loop self-paces — once the ceiling is reached the
        agent is forced to submit on the next turn (a graceful stop, not a crash).

        ``progress``, if given, is awaited once per loop iteration with a DB-agnostic snapshot
        (phase, iteration, cumulative tool calls, tokens spent) so a caller can surface what the
        agent is doing live. The agent never lets a failing callback break the loop.

        ``steer``, if given, is polled each iteration for a mid-session user redirect; when it
        returns text the agent injects it as a user instruction at the next user turn, so a
        running session can actually be steered without restarting it."""
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
        tool_calls_total = 0  # cumulative client + server tool uses, for the heartbeat
        # Pending user redirects, delivered at the next user turn (tool results / submit nudge) so
        # we never break the API's strict user/assistant + tool_result turn structure.
        pending_steer: list[str] = []
        # Server-side web tools execute in a server container; once a response carries its id,
        # every later call in this task must send it back or a paused turn cannot resume.
        container_id: str | None = None
        # A server-tool turn that still needs to resume (paused, or completed with an unresolved
        # server_tool_use). While set, the loop re-sends instead of injecting a user turn.
        server_continuing = False

        for attempt in range(max_iters):
            # Poll for a mid-session redirect; buffer it for the next user turn.
            if steer is not None:
                steer_text = await self._steer_text(steer)
                if steer_text:
                    pending_steer.append(steer_text)
            # Force the submit tool on the last attempt, or once the budget ceiling is hit, so we
            # always end with structured output and never overspend. Never force while a server
            # turn is resuming — the API rejects a tool_choice over pending server tool uses; the
            # force defers to the next iteration instead.
            force_submit = not server_continuing and (
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
                budget.add_usage(*_usage_components(resp))
            messages.append({"role": "assistant", "content": resp.content})
            container_id = getattr(getattr(resp, "container", None), "id", None) or container_id

            server_uses = [
                b.name for b in resp.content if getattr(b, "type", None) == "server_tool_use"
            ]
            if server_uses:
                logger.info("server tools ran for %s: %s", task_name, server_uses)
                if budget is not None:
                    for name in server_uses:
                        budget.note_web(name)
            tool_uses = [b for b in resp.content if getattr(b, "type", None) == "tool_use"]
            submit_block = next((b for b in tool_uses if b.name == submit["name"]), None)
            # The turn must resume (rather than us appending a user turn) when it is explicitly
            # paused, OR when it left an unresolved server_tool_use — e.g. the code_execution that
            # web_search/web_fetch run internally, whose result is consumed server-side.
            server_continuing = getattr(resp, "stop_reason", None) == "pause_turn" or (
                _has_unresolved_server_tool(resp.content)
            )

            # Heartbeat: one beat per iteration so a watching caller sees live progress. Phase is
            # "gathering" while tools/web run, "synthesizing" once the model is producing the
            # structured result. Counters are cumulative across the session.
            tool_calls_total += len(server_uses) + len(tool_uses)
            gathering = server_continuing or server_uses or (tool_uses and submit_block is None)
            await self._beat(
                progress,
                phase="gathering" if gathering else "synthesizing",
                iteration=attempt + 1,
                max_iters=max_iters,
                tool_calls=tool_calls_total,
                tokens_spent=budget.spent if budget is not None else 0,
                input_tokens=budget.input if budget is not None else 0,
                output_tokens=budget.output if budget is not None else 0,
            )

            if server_continuing:
                # A server-tool turn is still in flight (checkpointed mid-flight, or carrying an
                # unresolved server_tool_use such as web search's internal code_execution).
                # Re-send the conversation unchanged (no user message) so the server resumes where
                # it left off — this must not fall through to the "no tool_uses -> nudge" branch
                # below, which would orphan the server_tool_use and make the next request a 400.
                continue

            if not tool_uses:
                # The model answered without calling a tool; nudge it to submit and retry. A
                # pending redirect rides along on this user turn (and may reopen the work).
                nudge = f"Call {submit['name']} with the final result."
                if pending_steer:
                    nudge = _STEER_PREFIX + " ".join(pending_steer) + "\n\n" + nudge
                    pending_steer.clear()
                messages.append({"role": "user", "content": nudge})
                continue

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
            # Deliver any pending redirect as a text block alongside the tool results (a valid
            # mixed user turn) — this is where a steer actually reaches the running session.
            if pending_steer:
                tool_results.append({"type": "text", "text": _STEER_PREFIX + " ".join(pending_steer)})
                pending_steer.clear()
            messages.append({"role": "user", "content": tool_results})

        raise RuntimeError(
            f"researcher task {task_name!r} did not submit within {max_iters} iterations"
        )

    @staticmethod
    async def _beat(
        progress: Callable[[dict[str, Any]], Awaitable[None]] | None, **snapshot: Any
    ) -> None:
        """Fire one heartbeat. Never lets a failing callback break the agent loop."""
        if progress is None:
            return
        try:
            await progress(snapshot)
        except Exception:  # noqa: BLE001 — visibility must never crash the work it observes
            logger.warning("progress callback failed", exc_info=True)

    @staticmethod
    async def _steer_text(steer: Callable[[], Awaitable[str | None]]) -> str | None:
        """Poll the steer callback for a pending redirect. A failing callback never breaks the loop."""
        try:
            return await steer()
        except Exception:  # noqa: BLE001 — a redirect hiccup must not crash the research
            logger.warning("steer callback failed", exc_info=True)
            return None

    async def _run_tool(self, allowlist: dict, name: str, args: dict[str, Any]) -> Any:
        spec = allowlist.get(name)
        if spec is None:  # the registry allowlist is the stop — refuse anything off it
            return {"error": f"tool {name!r} is not permitted for this task"}
        try:
            return await invoke_tool(spec, args)
        except ProviderError as exc:
            # An external dependency failed — already retried+backed-off inside the provider. Tell
            # the model NOT to retry (a transient stall won't clear by re-calling, and each retry
            # is a billed turn): proceed without this tool. This is what stops the rate-limit
            # token bleed — the agent moves on instead of hammering a wall.
            note = (
                f"{exc.provider} is temporarily unavailable — proceed without this tool; do not retry it."
                if exc.transient
                else f"{exc.provider} rejected the request — do not retry it."
            )
            return {"error": f"{type(exc).__name__}: {exc}", "retryable": False, "note": note}
        except Exception as exc:
            # Internal failure (bad args, missing row): surface it so the model can self-correct
            # its next call, instead of crashing the whole task.
            return {"error": f"{type(exc).__name__}: {exc}"}


@lru_cache(maxsize=1)
def get_researcher() -> Researcher:
    return Researcher()
