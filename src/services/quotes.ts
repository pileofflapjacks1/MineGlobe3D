/**
 * Live stock quotes via the MineGlobe yfinance API (server/).
 * Falls back gracefully when the API is offline.
 */

export interface LiveQuote {
  ticker: string;
  price: number | null;
  changePct: number | null;
  previousClose: number | null;
  currency: string | null;
  marketState: string | null;
  sparkline: number[];
  asOf: string | null;
  source: string;
  error: string | null;
}

export interface QuotesBatchResponse {
  quotes: Record<string, LiveQuote>;
  fetchedAt: string;
  source: string;
}

const API_BASE = import.meta.env.VITE_QUOTES_API_URL ?? '';

function quotesUrl(path: string): string {
  // In dev, Vite proxies /api → localhost:8000
  return `${API_BASE}${path}`;
}

export async function fetchQuotes(tickers: string[]): Promise<QuotesBatchResponse | null> {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase().trim()).filter(Boolean))];
  if (!unique.length) return null;

  const url = quotesUrl(`/api/quotes?tickers=${encodeURIComponent(unique.join(','))}`);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
    if (!res.ok) {
      console.warn('Quotes API error', res.status, await res.text());
      return null;
    }
    return (await res.json()) as QuotesBatchResponse;
  } catch (err) {
    console.warn('Quotes API unreachable — using fallback mock prices', err);
    return null;
  }
}

export async function fetchQuote(ticker: string): Promise<LiveQuote | null> {
  const url = quotesUrl(`/api/quote/${encodeURIComponent(ticker.toUpperCase())}`);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return (await res.json()) as LiveQuote;
  } catch {
    return null;
  }
}

export async function checkQuotesHealth(): Promise<boolean> {
  try {
    const res = await fetch(quotesUrl('/api/health'), { signal: AbortSignal.timeout(3_000) });
    return res.ok;
  } catch {
    return false;
  }
}
