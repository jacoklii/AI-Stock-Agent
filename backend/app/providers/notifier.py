"""Notifier provider wrapper — the two outbound transports.

The single file a notification-channel swap would touch. Two send shapes, matching the two
delivery shapes: ``send_email`` (the detailed digest, SMTP) and ``send_message`` (the brief
pulse, iMessage on a macOS host via AppleScript, or WhatsApp). Transport ONLY — it does not
dedupe and does not write ``notification_history``; that ledger write is a deterministic,
workflow-level concern (the read half is the ``check_dedupe`` tool).

Blocking sends (SMTP, the AppleScript subprocess) are dispatched off the event loop.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from app.db.enums import Channel
from app.config import get_settings


@dataclass
class SendReceipt:
    """Outcome of a single send — what the workflow records into the ledger."""

    channel: Channel
    ok: bool
    detail: str | None = None


class Notifier:
    """Stable surface over email + messaging transports."""

    def __init__(self) -> None:
        self._settings = get_settings()

    # --- Email (detailed digest) ---------------------------------------------

    def _send_email_blocking(self, to_addr: str, subject: str, body: str) -> None:
        import smtplib
        from email.message import EmailMessage

        s = self._settings
        msg = EmailMessage()
        msg["From"] = s.smtp_from or s.smtp_user or ""
        msg["To"] = to_addr
        msg["Subject"] = subject
        msg.set_content(body)
        with smtplib.SMTP(s.smtp_host or "", s.smtp_port) as server:
            server.starttls()
            if s.smtp_user:
                server.login(s.smtp_user, s.smtp_password or "")
            server.send_message(msg)

    async def send_email(self, *, to_addr: str, subject: str, body: str) -> SendReceipt:
        await asyncio.to_thread(self._send_email_blocking, to_addr, subject, body)
        return SendReceipt(channel=Channel.email, ok=True, detail=to_addr)

    # --- Brief message (pulse) -----------------------------------------------

    async def _send_imessage(self, to_addr: str, text: str) -> None:
        # AppleScript on a macOS host. Runs as a subprocess so it never blocks the loop.
        script = (
            'tell application "Messages" to send "{text}" to '
            'buddy "{to}" of (service 1 whose service type is iMessage)'
        ).format(text=text.replace('"', '\\"'), to=to_addr)
        proc = await asyncio.create_subprocess_exec(
            "osascript", "-e", script,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
        )
        _, err = await proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"osascript failed: {err.decode(errors='ignore')}")

    async def send_message(
        self, *, to_addr: str, text: str, channel: Channel = Channel.imessage
    ) -> SendReceipt:
        """Send the brief pulse. iMessage is wired (host AppleScript); WhatsApp is a placeholder
        until the WhatsApp Business API credential lands."""
        if channel is Channel.imessage:
            await self._send_imessage(to_addr, text)
            return SendReceipt(channel=channel, ok=True, detail=to_addr)
        if channel is Channel.whatsapp:
            raise NotImplementedError("TODO(notifier): WhatsApp Business API send")
        raise ValueError(f"unsupported message channel: {channel}")


def get_notifier() -> Notifier:
    return Notifier()
