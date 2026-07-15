import { useCallback, useEffect, useMemo, useState } from 'react';
import { companies } from '../data/miningData';
import type { Company } from '../data/types';
import { fetchQuotes, type LiveQuote } from '../services/quotes';

export type QuoteStatus = 'idle' | 'loading' | 'live' | 'fallback' | 'error';

export interface ResolvedPrice {
  price: number;
  changePct: number;
  sparkline: number[];
  isLive: boolean;
  asOf: string | null;
  currency: string;
  error: string | null;
}

function fromCompanyFallback(c: Company): ResolvedPrice {
  return {
    price: c.mockPrice,
    changePct: c.mockPriceChangePct,
    sparkline: c.mockSparkline,
    isLive: false,
    asOf: null,
    currency: 'USD',
    error: null,
  };
}

function fromLive(q: LiveQuote, fallback: Company): ResolvedPrice {
  if (q.price == null || Number.isNaN(q.price)) {
    return { ...fromCompanyFallback(fallback), error: q.error };
  }
  return {
    price: q.price,
    changePct: q.changePct ?? 0,
    sparkline: q.sparkline?.length ? q.sparkline : fallback.mockSparkline,
    isLive: true,
    asOf: q.asOf,
    currency: q.currency ?? 'USD',
    error: q.error,
  };
}

/**
 * Loads yfinance-backed quotes for all (or selected) company tickers.
 * Refreshes every `refreshMs` (default 2 min). Uses mock data if API is down.
 */
export function useStockQuotes(options?: {
  tickers?: string[];
  refreshMs?: number;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  const refreshMs = options?.refreshMs ?? 120_000;
  const tickers = useMemo(
    () => options?.tickers ?? companies.map((c) => c.ticker),
    [options?.tickers],
  );

  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setStatus((s) => (s === 'live' ? 'live' : 'loading'));
    const res = await fetchQuotes(tickers);
    if (!res) {
      setStatus('fallback');
      setLastError('Quote API offline — showing cached mock prices');
      return;
    }
    setQuotes(res.quotes);
    setFetchedAt(res.fetchedAt);
    const anyPrice = Object.values(res.quotes).some((q) => q.price != null);
    setStatus(anyPrice ? 'live' : 'error');
    setLastError(anyPrice ? null : 'No prices returned from yfinance');
  }, [enabled, tickers]);

  useEffect(() => {
    void load();
    if (!enabled || refreshMs <= 0) return;
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
  }, [load, enabled, refreshMs]);

  const getPrice = useCallback(
    (company: Company): ResolvedPrice => {
      const q = quotes[company.ticker.toUpperCase()];
      if (!q) return fromCompanyFallback(company);
      return fromLive(q, company);
    },
    [quotes],
  );

  const getPriceByTicker = useCallback(
    (ticker: string): ResolvedPrice | null => {
      const company = companies.find((c) => c.ticker.toUpperCase() === ticker.toUpperCase());
      if (!company) {
        const q = quotes[ticker.toUpperCase()];
        if (!q || q.price == null) return null;
        return {
          price: q.price,
          changePct: q.changePct ?? 0,
          sparkline: q.sparkline ?? [],
          isLive: true,
          asOf: q.asOf,
          currency: q.currency ?? 'USD',
          error: q.error,
        };
      }
      return getPrice(company);
    },
    [quotes, getPrice],
  );

  return {
    quotes,
    status,
    fetchedAt,
    lastError,
    refresh: load,
    getPrice,
    getPriceByTicker,
    isLive: status === 'live',
    isLoading: status === 'loading',
  };
}
