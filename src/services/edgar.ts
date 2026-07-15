/**
 * SEC EDGAR filings via local MineGlobe API proxy.
 * (Browser cannot call data.sec.gov reliably due to CORS + User-Agent rules.)
 */

import type { EdgarFilingsResponse } from '../data/types';

const API_BASE = import.meta.env.VITE_QUOTES_API_URL ?? '';

function url(path: string): string {
  return `${API_BASE}${path}`;
}

export async function fetchEdgarFilings(
  cik: string,
  opts?: { limit?: number; forms?: string[] },
): Promise<EdgarFilingsResponse | null> {
  const padded = cik.replace(/\D/g, '').padStart(10, '0');
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.forms?.length) params.set('forms', opts.forms.join(','));

  const qs = params.toString();
  const path = `/api/edgar/filings/${padded}${qs ? `?${qs}` : ''}`;

  try {
    const res = await fetch(url(path), { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.warn('EDGAR API error', res.status, await res.text());
      return null;
    }
    return (await res.json()) as EdgarFilingsResponse;
  } catch (err) {
    console.warn('EDGAR API unreachable', err);
    return null;
  }
}

/** Highlight common periodic / earnings-related forms */
export function isPriorityForm(form: string): boolean {
  const f = form.toUpperCase();
  return (
    f === '10-K' ||
    f === '10-Q' ||
    f === '20-F' ||
    f === '40-F' ||
    f === '6-K' ||
    f === '8-K' ||
    f.startsWith('10-K') ||
    f.startsWith('10-Q') ||
    f.startsWith('8-K')
  );
}

export function edgarCompanyBrowseUrl(cik: string): string {
  const n = cik.replace(/\D/g, '');
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${n}&owner=exclude&count=40&hidefilings=0`;
}
