"""Hermetic tests for the chat routes — the persistent direction surface.

POST persists the user row, answers via the followup workflow, persists the assistant row with
its typed sources (event ids + resolved URLs), and returns both. GET pages the thread oldest-
first.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.agents.researcher.schemas import FollowupOut
from app.api.routes import chat as chat_routes
from app.db.enums import ChatRole
from app.db.models.chat import ChatMessage
from app.db.payloads import ChatSources

from fakes import FakeResult, FakeSession, use_session

_NOW = datetime(2026, 6, 11, 12, 0, tzinfo=timezone.utc)


def _msg(msg_id: int, role: ChatRole, content: str) -> ChatMessage:
    row = ChatMessage(role=role, content=content)
    row.id = msg_id
    row.created_at = _NOW
    return row


def test_post_message_persists_pair_with_sources(monkeypatch, client) -> None:
    async def _followup(*, query, company_id=None, industry_id=None):
        assert query == "what moved gold today?"
        return FollowupOut(answer="three things", sources=[5, 9])

    monkeypatch.setattr(chat_routes.followup_wf, "run", _followup)
    fake = FakeSession([FakeResult(scalars=["https://a.example", "https://b.example"])])
    use_session(fake)

    resp = client.post("/chat/messages", json={"content": "what moved gold today?"})
    assert resp.status_code == 200
    user_msg, assistant_msg = resp.json()
    assert user_msg["role"] == "user"
    assert assistant_msg["role"] == "assistant"
    assert assistant_msg["content"] == "three things"
    assert assistant_msg["news_event_ids"] == [5, 9]
    assert assistant_msg["source_urls"] == ["https://a.example", "https://b.example"]

    assert len(fake.added) == 2  # both rows persisted
    assert isinstance(fake.added[1].sources, ChatSources)


def test_post_message_no_sources_skips_url_lookup(monkeypatch, client) -> None:
    async def _followup(*, query, company_id=None, industry_id=None):
        return FollowupOut(answer="nothing cited", sources=[])

    monkeypatch.setattr(chat_routes.followup_wf, "run", _followup)
    use_session(FakeSession())  # any execute would raise — proves no URL lookup happens

    resp = client.post("/chat/messages", json={"content": "hi"})
    assert resp.status_code == 200
    assert resp.json()[1]["source_urls"] == []


def test_list_messages_oldest_first(client) -> None:
    rows = [_msg(2, ChatRole.assistant, "answer"), _msg(1, ChatRole.user, "question")]
    use_session(FakeSession([FakeResult(scalars=rows)]))  # DB returns id desc

    resp = client.get("/chat/messages")
    assert resp.status_code == 200
    body = resp.json()
    assert [m["id"] for m in body] == [1, 2]  # reversed to oldest-first
