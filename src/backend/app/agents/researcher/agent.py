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

# Reflection: how many times to send a finding back for citations before accepting it anyway.
_MAX_GROUNDING_NUDGES = 1
_GROUNDING_NUDGE = (
    "Every finding must cite the news_event ids it draws on. Add them to `sources`, then resubmit."
)


def _needs_grounding(out: BaseModel) -> bool:
    """True when an output has findings but no cited sources (the deep-research grounding rule)."""
    findings = getattr(out, "findings", None)
    sources = getattr(out, "sources", None)
    return bool(findings) and sources is not None and len(sources) == 0


def _usage_tokens(resp: Any) -> int:
    usage = getattr(resp, "usage", None)
    if usage is None:
        return 0
    return (getattr(usage, "input_tokens", 0) or 0) + (getattr(usage, "output_tokens", 0) or 0)


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
        TASK_FOLLOWUP, "prompt_followup.md", MODEL_SONNET, schemas.FollowupOut
    ),
    TASK_DEEP_RESEARCH: TaskSpec(
        TASK_DEEP_RESEARCH,
        "prompt_deep_research.md",
        MODEL_SONNET,
        schemas.DeepResearchOut,
        max_iters=DEEP_RESEARCH_MAX_ITERS,
    ),
}


@lru_cache(maxsize=None)
def _load_prompt(filename: str) -> str:
    return (_PROMPT_DIR / filename).read_text(encoding="utf-8")


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

        system = _load_prompt(spec.prompt_file)
        messages: list[dict[str, Any]] = [
            {"role": "user", "content": json.dumps(_jsonable(inputs), default=str)}
        ]
        grounding_nudges = 0

        for attempt in range(max_iters):
            # Force the submit tool on the last attempt, or once the budget ceiling is hit, so we
            # always end with structured output and never overspend.
            force_submit = attempt == max_iters - 1 or (budget is not None and budget.over())
            resp = await self._llm.create(
                model=spec.model,
                system=system,
                messages=messages,
                tools=tools,
                tool_choice=(
                    {"type": "tool", "name": submit["name"]} if force_submit else {"type": "auto"}
                ),
                max_tokens=max_tokens,
            )
            if budget is not None:
                budget.add(_usage_tokens(resp))
            messages.append({"role": "assistant", "content": resp.content})

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
