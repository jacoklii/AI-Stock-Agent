"""Tool registry + per-task allowlist — an execution-rule "stop".

Two of the architecture's execution rules are enforced here:

- *"The agent sees only the tools relevant to the current task."* Tools register themselves
  with a name and the set of tasks they're permitted in; ``get_tools_for(task)`` resolves the
  allowlist for a task. An agent step is handed only that slice — it cannot reach a tool that
  wasn't granted to its task.
- *"Tools are predefined."* The registry is the single, closed catalogue of what the AI may
  call. The future MCP server exposes exactly this set; nothing reaches the database or an
  external API except through a registered tool.

This module holds the mechanism only. It imports nothing from the tool modules; instead each
tool module imports ``@tool`` and registers on import. ``app.tools`` imports every tool module
so the registry is fully populated whenever it is consulted.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field

# Task identifiers. These name the agent steps that will exist once the researcher agent is
# built; the allowlist is keyed by them. Kept as plain strings (not an enum) because the agent
# owns the authoritative task list and will extend it — the registry only needs to match names.
TASK_ARTICLE_SUMMARY = "article_summary"
TASK_SIGNIFICANCE = "significance_classification"
TASK_SECTION_SNAPSHOT = "section_snapshot"
TASK_COMPANY_PROSE = "company_prose"
TASK_PULSE_SNAPSHOT = "pulse_snapshot"
TASK_TOP_SNAPSHOT = "top_snapshot"
TASK_FOLLOWUP = "followup"
TASK_DEEP_RESEARCH = "deep_research"


@dataclass(frozen=True)
class ToolSpec:
    """One registered tool: its callable plus the metadata the agent/MCP layer needs.

    ``input_model`` / ``output_model`` are the Pydantic contract types (or ``None`` where a
    tool's inputs are plain scalars). They document the structured-IO rule — a tool returns a
    typed result model, never free-form text or an ORM row.
    """

    name: str
    fn: Callable[..., object]
    description: str
    tasks: frozenset[str]
    input_model: type | None = None
    output_model: type | None = None
    # Read tools (the default) are invoked under a read-only session and physically cannot
    # write. The few predefined write tools (research-state, cache) set this; ``invoke_tool``
    # hands them a writable session. No production-data table has a write tool.
    writes: bool = False


@dataclass
class _Registry:
    _by_name: dict[str, ToolSpec] = field(default_factory=dict)

    def add(self, spec: ToolSpec) -> None:
        if spec.name in self._by_name:
            raise ValueError(f"tool {spec.name!r} is already registered")
        self._by_name[spec.name] = spec

    def get(self, name: str) -> ToolSpec:
        return self._by_name[name]

    def __contains__(self, name: object) -> bool:
        return name in self._by_name

    def __iter__(self):
        return iter(self._by_name)

    def __len__(self) -> int:
        return len(self._by_name)

    def names(self) -> list[str]:
        return sorted(self._by_name)

    def for_task(self, task: str) -> list[ToolSpec]:
        return [s for s in self._by_name.values() if task in s.tasks]


REGISTRY = _Registry()


def tool(
    *,
    name: str,
    description: str,
    tasks: set[str] | frozenset[str],
    input_model: type | None = None,
    output_model: type | None = None,
    writes: bool = False,
) -> Callable[[Callable[..., object]], Callable[..., object]]:
    """Register a function as a predefined tool. Returns the function unchanged, so tools stay
    ordinary callables that workflows/tests can also call directly."""

    def decorate(fn: Callable[..., object]) -> Callable[..., object]:
        REGISTRY.add(
            ToolSpec(
                name=name,
                fn=fn,
                description=description,
                tasks=frozenset(tasks),
                input_model=input_model,
                output_model=output_model,
                writes=writes,
            )
        )
        return fn

    return decorate


def get_tools_for(task: str) -> list[ToolSpec]:
    """The allowlist for ``task`` — the only tools an agent step on that task may use."""
    return REGISTRY.for_task(task)
