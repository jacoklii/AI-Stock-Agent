"""SEC EDGAR provider wrapper.

The single file an EDGAR-access swap would touch. EDGAR is public and keyless but requires a
descriptive ``User-Agent`` on every request (``settings.sec_user_agent``). Two capabilities the
deep-research tools need: ``recent_filings`` (a company's recent filings, optionally by form
type) and ``fetch_document`` (the text of a filing URL). Reached over async ``httpx``.

Ticker -> CIK resolution uses EDGAR's public ticker map; filings come from the submissions API.
Transport only — no caching, no summarizing (the tool layer caches; the agent summarizes).
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.config import get_settings

_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
_SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik:010d}.json"


class FilingRef(BaseModel):
    """One filing — provider-agnostic shape the tools hand back."""

    form: str
    filed_at: date
    url: str
    title: str


class SECProvider:
    """Stable surface over EDGAR submissions + document fetch."""

    def __init__(self) -> None:
        self._headers = {"User-Agent": get_settings().sec_user_agent}

    async def _resolve_cik(self, client, ticker: str) -> int | None:
        resp = await client.get(_TICKERS_URL)
        resp.raise_for_status()
        target = ticker.upper()
        for row in resp.json().values():
            if row.get("ticker", "").upper() == target:
                return int(row["cik_str"])
        return None

    async def recent_filings(
        self, ticker: str, *, form_type: str | None = None, limit: int = 10
    ) -> list[FilingRef]:
        """Recent filings for ``ticker``, newest first, optionally filtered to ``form_type``
        (e.g. ``10-K``). Empty list when the ticker resolves to no CIK."""
        import httpx

        async with httpx.AsyncClient(headers=self._headers, timeout=20.0) as client:
            cik = await self._resolve_cik(client, ticker)
            if cik is None:
                return []
            resp = await client.get(_SUBMISSIONS_URL.format(cik=cik))
            resp.raise_for_status()
            recent = resp.json().get("filings", {}).get("recent", {})

        forms = recent.get("form", [])
        dates = recent.get("filingDate", [])
        accessions = recent.get("accessionNumber", [])
        primary_docs = recent.get("primaryDocument", [])
        out: list[FilingRef] = []
        for form, filed, accession, doc in zip(forms, dates, accessions, primary_docs):
            if form_type is not None and form != form_type:
                continue
            acc = accession.replace("-", "")
            url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc}/{doc}"
            out.append(FilingRef(form=form, filed_at=date.fromisoformat(filed), url=url, title=f"{form} ({filed})"))
            if len(out) >= limit:
                break
        return out

    async def fetch_document(self, url: str) -> str:
        """Raw text of a filing document at ``url``."""
        import httpx

        async with httpx.AsyncClient(headers=self._headers, timeout=30.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text


def get_sec_provider() -> SECProvider:
    return SECProvider()
