"""
MineGlobe 3D — local API (yfinance quotes + LLM chat proxy).

Run:
  cd server && bash ./run.sh
  # or: uvicorn main:app --reload --port 8000

Endpoints:
  GET  /api/health
  GET  /api/quotes?tickers=NEM,B,AEM
  GET  /api/quote/{ticker}
  GET  /api/edgar/filings/{cik}
  POST /api/llm/chat   (proxies OpenAI-compatible chat; user supplies API key)
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("mineglobe-api")

app = FastAPI(
    title="MineGlobe API",
    description="yfinance quotes + OpenAI-compatible LLM proxy for MineGlobe 3D",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Short in-memory cache to avoid hammering Yahoo on every panel open
_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_CACHE_TTL_SEC = 60.0
_SPARKLINE_POINTS = 30


class Quote(BaseModel):
    ticker: str
    price: float | None = None
    changePct: float | None = Field(None, description="Day change %")
    previousClose: float | None = None
    currency: str | None = "USD"
    marketState: str | None = None
    sparkline: list[float] = Field(default_factory=list)
    asOf: str | None = None
    source: str = "yfinance"
    error: str | None = None


class QuotesResponse(BaseModel):
    quotes: dict[str, Quote]
    fetchedAt: str
    source: str = "yfinance"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sparkline_from_history(ticker: str) -> list[float]:
    """Last ~2 months of daily closes, downsampled for sparkline display."""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="2mo", interval="1d", auto_adjust=True)
        if hist is None or hist.empty or "Close" not in hist.columns:
            return []
        closes = [float(x) for x in hist["Close"].dropna().tolist() if x == x]
        if len(closes) <= _SPARKLINE_POINTS:
            return closes
        # Evenly sample
        step = (len(closes) - 1) / (_SPARKLINE_POINTS - 1)
        return [closes[int(round(i * step))] for i in range(_SPARKLINE_POINTS)]
    except Exception as e:  # noqa: BLE001
        log.warning("sparkline failed for %s: %s", ticker, e)
        return []


def _fetch_one(ticker: str) -> Quote:
    key = ticker.upper().strip()
    now = time.time()
    cached = _CACHE.get(key)
    if cached and now - cached[0] < _CACHE_TTL_SEC:
        return Quote(**cached[1])

    try:
        t = yf.Ticker(key)
        info: dict[str, Any] = {}
        # fast_info is lighter; fall back to history last close
        price = None
        prev = None
        change_pct = None
        currency = "USD"
        market_state = None

        try:
            fi = t.fast_info
            # fast_info may be a dict-like or object
            def g(name: str, default=None):
                try:
                    if hasattr(fi, name):
                        return getattr(fi, name)
                    if isinstance(fi, dict):
                        return fi.get(name, default)
                except Exception:  # noqa: BLE001
                    return default
                return default

            price = g("last_price") or g("lastPrice") or g("regular_market_price")
            prev = g("previous_close") or g("previousClose")
            currency = g("currency") or "USD"
            market_state = g("market_state") or g("marketState")
        except Exception as e:  # noqa: BLE001
            log.debug("fast_info unavailable for %s: %s", key, e)

        if price is None:
            hist = t.history(period="5d", interval="1d", auto_adjust=True)
            if hist is not None and not hist.empty and "Close" in hist.columns:
                closes = hist["Close"].dropna()
                if len(closes) >= 1:
                    price = float(closes.iloc[-1])
                if len(closes) >= 2:
                    prev = float(closes.iloc[-2])

        if price is not None:
            price = float(price)
        if prev is not None:
            prev = float(prev)

        if price is not None and prev is not None and prev != 0:
            change_pct = ((price - prev) / prev) * 100.0

        # Secondary: info fields if still missing change
        if change_pct is None:
            try:
                info = t.info or {}
                if price is None and info.get("currentPrice"):
                    price = float(info["currentPrice"])
                if prev is None and info.get("previousClose"):
                    prev = float(info["previousClose"])
                if info.get("regularMarketChangePercent") is not None:
                    change_pct = float(info["regularMarketChangePercent"])
                elif price is not None and prev is not None and prev != 0:
                    change_pct = ((price - prev) / prev) * 100.0
                currency = info.get("currency") or currency
            except Exception as e:  # noqa: BLE001
                log.debug("info fallback failed for %s: %s", key, e)

        spark = _sparkline_from_history(key)

        payload = {
            "ticker": key,
            "price": price,
            "changePct": round(change_pct, 4) if change_pct is not None else None,
            "previousClose": prev,
            "currency": currency,
            "marketState": market_state,
            "sparkline": spark,
            "asOf": _now_iso(),
            "source": "yfinance",
            "error": None if price is not None else "No price data returned",
        }
        _CACHE[key] = (now, payload)
        return Quote(**payload)
    except Exception as e:  # noqa: BLE001
        log.exception("quote failed for %s", key)
        return Quote(ticker=key, error=str(e), asOf=_now_iso())


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "mineglobe-api",
        "quotes": "yfinance",
        "edgar": "sec-submissions-proxy",
        "llm": "openai-compatible-proxy",
    }


# ─── SEC EDGAR filings proxy ──────────────────────────────────────────────────

# SEC requires a descriptive User-Agent; no personal email in open-source builds.
_SEC_UA = "MineGlobe3D/1.0 (open-source; https://github.com/pileofflapjacks1/MineGlobe3D)"
_EDGAR_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_EDGAR_TTL = 300.0  # 5 minutes


class EdgarFilingOut(BaseModel):
    accessionNumber: str
    filingDate: str
    reportDate: str | None = None
    form: str
    primaryDocument: str
    primaryDocDescription: str = ""
    size: int | None = None
    filingUrl: str
    documentUrl: str | None = None


class EdgarFilingsResponse(BaseModel):
    cik: str
    ticker: str | None = None
    name: str | None = None
    filings: list[EdgarFilingOut]
    fetchedAt: str
    source: str = "SEC EDGAR submissions"
    error: str | None = None


def _pad_cik(cik: str) -> str:
    digits = "".join(ch for ch in cik if ch.isdigit())
    if not digits:
        raise HTTPException(status_code=400, detail="Invalid CIK")
    return digits.zfill(10)


def _accession_path(accession: str) -> str:
    # 0001164727-26-000012 → 000116472726000012
    return accession.replace("-", "")


def _build_filing_urls(cik: str, accession: str, primary_doc: str) -> tuple[str, str | None]:
    cik_int = str(int(cik))  # archives use unpadded CIK
    acc_nodash = _accession_path(accession)
    index_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_nodash}/{accession}-index.html"
    doc_url = None
    if primary_doc:
        doc_url = f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_nodash}/{primary_doc}"
    return index_url, doc_url


@app.get("/api/edgar/filings/{cik}", response_model=EdgarFilingsResponse)
def edgar_filings(
    cik: str,
    limit: int = Query(15, ge=1, le=40),
    forms: str | None = Query(
        None,
        description="Comma-separated form filter, e.g. 10-K,10-Q,8-K. Empty = all recent.",
    ),
) -> EdgarFilingsResponse:
    """
    Proxy SEC company submissions JSON and return recent filings.
    Requires User-Agent per SEC fair-access policy (set server-side).
    """
    padded = _pad_cik(cik)
    form_set = None
    if forms and forms.strip():
        form_set = {f.strip().upper() for f in forms.split(",") if f.strip()}

    cache_key = f"{padded}|{limit}|{forms or ''}"
    now = time.time()
    cached = _EDGAR_CACHE.get(cache_key)
    if cached and now - cached[0] < _EDGAR_TTL:
        return EdgarFilingsResponse(**cached[1])

    url = f"https://data.sec.gov/submissions/CIK{padded}.json"
    headers = {
        "User-Agent": _SEC_UA,
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
    }

    try:
        with httpx.Client(timeout=30.0, headers=headers, follow_redirects=True) as client:
            r = client.get(url)
    except httpx.RequestError as e:
        log.warning("EDGAR network error for %s: %s", padded, e)
        raise HTTPException(status_code=502, detail=f"SEC network error: {e}") from e

    if r.status_code == 404:
        raise HTTPException(status_code=404, detail=f"No EDGAR submissions for CIK {padded}")
    if r.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"SEC returned {r.status_code}: {r.text[:300]}",
        )

    data = r.json()
    recent = (data.get("filings") or {}).get("recent") or {}
    accessions = recent.get("accessionNumber") or []
    filing_dates = recent.get("filingDate") or []
    report_dates = recent.get("reportDate") or []
    form_list = recent.get("form") or []
    primary_docs = recent.get("primaryDocument") or []
    primary_descs = recent.get("primaryDocDescription") or []
    sizes = recent.get("size") or []

    n = len(accessions)
    out: list[EdgarFilingOut] = []
    for i in range(n):
        form = (form_list[i] if i < len(form_list) else "") or ""
        if form_set is not None:
            form_u = form.upper()
            base = form_u.split("/")[0]
            # Match exact form or base (so 8-K filter includes 8-K/A if 8-K listed)
            if form_u not in form_set and base not in form_set:
                continue

        accession = accessions[i]
        primary = primary_docs[i] if i < len(primary_docs) else ""
        filing_url, document_url = _build_filing_urls(padded, accession, primary)
        report = report_dates[i] if i < len(report_dates) else ""
        size_val = sizes[i] if i < len(sizes) else None
        try:
            size_int = int(size_val) if size_val is not None and size_val != "" else None
        except (TypeError, ValueError):
            size_int = None

        out.append(
            EdgarFilingOut(
                accessionNumber=accession,
                filingDate=filing_dates[i] if i < len(filing_dates) else "",
                reportDate=report or None,
                form=form,
                primaryDocument=primary or "",
                primaryDocDescription=(primary_descs[i] if i < len(primary_descs) else "") or "",
                size=size_int,
                filingUrl=filing_url,
                documentUrl=document_url,
            )
        )
        if len(out) >= limit:
            break

    # tickers may be list
    tickers = data.get("tickers") or []
    ticker = tickers[0] if isinstance(tickers, list) and tickers else None
    if isinstance(ticker, str):
        pass
    else:
        ticker = None

    payload = {
        "cik": padded,
        "ticker": ticker,
        "name": data.get("name"),
        "filings": [f.model_dump() for f in out],
        "fetchedAt": _now_iso(),
        "source": "SEC EDGAR submissions",
        "error": None,
    }
    _EDGAR_CACHE[cache_key] = (now, payload)
    return EdgarFilingsResponse(**payload)


# ─── LLM chat proxy (user API key; avoids browser CORS) ───────────────────────


class ChatMessageIn(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class LlmChatRequest(BaseModel):
    baseUrl: str = Field(..., description="e.g. https://api.x.ai/v1")
    apiKey: str
    model: str
    messages: list[ChatMessageIn]
    temperature: float = 0.4


class LlmChatResponse(BaseModel):
    content: str
    model: str | None = None
    usage: dict[str, Any] | None = None


_ALLOWED_LLM_HOSTS = {
    "api.x.ai",
    "api.openai.com",
    "api.anthropic.com",  # if user points OpenAI-compat gateway
}


def _validate_base_url(base_url: str) -> str:
    raw = base_url.strip().rstrip("/")
    parsed = urlparse(raw)
    if parsed.scheme not in ("https", "http"):
        raise HTTPException(status_code=400, detail="baseUrl must be http(s)")
    if not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid baseUrl")
    # Allow localhost for self-hosted OpenAI-compatible servers
    host = parsed.hostname or ""
    if host in ("localhost", "127.0.0.1") or host in _ALLOWED_LLM_HOSTS:
        return raw
    # Custom providers: allow any https host (user-chosen); still no open redirect tricks
    if parsed.scheme == "https":
        return raw
    raise HTTPException(
        status_code=400,
        detail="Custom LLM baseUrl must use https (or localhost)",
    )


@app.post("/api/llm/chat", response_model=LlmChatResponse)
def llm_chat(body: LlmChatRequest) -> LlmChatResponse:
    """
    Forward chat completions to an OpenAI-compatible API.
    The browser never calls api.x.ai directly (CORS); the user's key is
    provided per-request and not stored on the server.
    """
    if not body.apiKey.strip():
        raise HTTPException(status_code=400, detail="apiKey is required")
    if not body.model.strip():
        raise HTTPException(status_code=400, detail="model is required")
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages required")

    base = _validate_base_url(body.baseUrl)
    url = f"{base}/chat/completions"
    payload = {
        "model": body.model,
        "messages": [m.model_dump() for m in body.messages],
        "temperature": body.temperature,
    }
    headers = {
        "Authorization": f"Bearer {body.apiKey.strip()}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=90.0) as client:
            r = client.post(url, json=payload, headers=headers)
    except httpx.RequestError as e:
        log.warning("LLM proxy network error: %s", e)
        raise HTTPException(status_code=502, detail=f"Upstream network error: {e}") from e

    if r.status_code >= 400:
        detail = r.text[:800]
        try:
            err_json = r.json()
            detail = (
                err_json.get("error", {}).get("message")
                or err_json.get("message")
                or detail
            )
        except Exception:  # noqa: BLE001
            pass
        raise HTTPException(status_code=r.status_code, detail=str(detail))

    data = r.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise HTTPException(status_code=502, detail="Unexpected upstream response shape") from e

    if not content:
        raise HTTPException(status_code=502, detail="Empty model content")

    return LlmChatResponse(
        content=content,
        model=data.get("model"),
        usage=data.get("usage"),
    )


@app.get("/api/quote/{ticker}", response_model=Quote)
def quote_one(ticker: str) -> Quote:
    q = _fetch_one(ticker)
    if q.error and q.price is None:
        raise HTTPException(status_code=502, detail=q.error)
    return q


@app.get("/api/quotes", response_model=QuotesResponse)
def quotes_batch(
    tickers: str = Query(..., description="Comma-separated tickers, e.g. NEM,B,AEM"),
) -> QuotesResponse:
    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not symbols:
        raise HTTPException(status_code=400, detail="No tickers provided")
    if len(symbols) > 50:
        raise HTTPException(status_code=400, detail="Max 50 tickers per request")

    results: dict[str, Quote] = {}
    # Parallel fetch — yfinance is I/O bound
    with ThreadPoolExecutor(max_workers=min(8, len(symbols))) as pool:
        futures = {pool.submit(_fetch_one, s): s for s in symbols}
        for fut in as_completed(futures):
            q = fut.result()
            results[q.ticker] = q

    return QuotesResponse(quotes=results, fetchedAt=_now_iso())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
