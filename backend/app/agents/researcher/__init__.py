"""The researcher agent package — dispatcher (``agent.py``), output schemas, and task prompts."""

from app.agents.researcher.agent import Researcher, TASKS, get_researcher

__all__ = ["Researcher", "TASKS", "get_researcher"]
