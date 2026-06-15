"""The shared system prompt is prepended to every task — one identity, no per-card duplication.

The agent loads a single ``prompt_system.md`` and concatenates each task's thin card after it. The
system prompt must come first (so the prompt-cache prefix is shared) and the hard constraint must
live only there, not be copy-pasted into every card.
"""

from __future__ import annotations

from app.agents.researcher.agent import TASKS, _load_prompt, _system_prompt


def test_system_prompt_is_prepended_to_every_task() -> None:
    system = _load_prompt("prompt_system.md")
    assert system.strip()
    for spec in TASKS.values():
        composed = _system_prompt(spec.prompt_file)
        assert composed.startswith(system)  # system prompt first → shared cache prefix
        assert _load_prompt(spec.prompt_file) in composed  # the task card follows
        assert "# Who you are" in composed  # identity present
        assert "Never recommend buy, sell, or hold" in composed  # constraint in the system prompt


def test_cards_do_not_duplicate_the_shared_constraint() -> None:
    # The buy/sell/hold rule is stated once, in the system prompt — the slimmed cards must not repeat it.
    for spec in TASKS.values():
        card = _load_prompt(spec.prompt_file)
        assert "buy, sell, or hold" not in card
