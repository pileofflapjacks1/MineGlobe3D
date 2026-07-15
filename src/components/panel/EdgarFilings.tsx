import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import type { EdgarFiling } from '../../data/types';
import {
  edgarCompanyBrowseUrl,
  fetchEdgarFilings,
  isPriorityForm,
} from '../../services/edgar';

interface Props {
  cik: string;
  ticker: string;
}

const DEFAULT_FORMS = ['10-K', '10-Q', '20-F', '40-F', '6-K', '8-K', '6-K/A', '8-K/A', '10-K/A', '10-Q/A'];

export function EdgarFilings({ cik, ticker }: Props) {
  const [filings, setFilings] = useState<EdgarFiling[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [showAllForms, setShowAllForms] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchEdgarFilings(cik, {
      limit: showAllForms ? 20 : 12,
      forms: showAllForms ? undefined : DEFAULT_FORMS,
    });
    setLoading(false);
    if (!res) {
      setError('EDGAR proxy offline. Start the API with npm run dev:api.');
      setFilings([]);
      return;
    }
    if (res.error) {
      setError(res.error);
      setFilings([]);
      return;
    }
    setFilings(res.filings);
    setName(res.name);
    setFetchedAt(res.fetchedAt);
  }, [cik, showAllForms]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            SEC EDGAR filings
          </p>
          <p className="text-[10px] text-[var(--color-text-dim)]">
            CIK {cik}
            {name ? ` · ${name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAllForms((v) => !v)}
            className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
          >
            {showAllForms ? 'Key forms' : 'All recent'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Refresh filings"
            title="Refresh filings"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <a
            href={edgarCompanyBrowseUrl(cik)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-teal)] hover:bg-[var(--color-bg-hover)]"
          >
            EDGAR <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs text-[var(--color-text-dim)]">
          <Loader2 size={14} className="animate-spin" />
          Loading filings from SEC…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-2 text-[11px] text-[var(--color-warning)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filings.length === 0 && (
        <p className="text-xs text-[var(--color-text-dim)]">
          No recent filings matched this filter for {ticker}.
        </p>
      )}

      {!loading && filings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-dim)]">
              <tr>
                <th className="px-2.5 py-2 font-medium">Form</th>
                <th className="px-2.5 py-2 font-medium">Filed</th>
                <th className="px-2.5 py-2 font-medium">Description</th>
                <th className="px-2.5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filings.map((f) => {
                const priority = isPriorityForm(f.form);
                return (
                  <tr
                    key={`${f.accessionNumber}-${f.primaryDocument}`}
                    className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)]"
                  >
                    <td className="px-2.5 py-2 align-top">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          priority
                            ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {f.form}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 align-top tabular-nums text-[var(--color-silver)]">
                      {f.filingDate}
                      {f.reportDate && f.reportDate !== f.filingDate && (
                        <div className="text-[9px] text-[var(--color-text-dim)]">
                          period {f.reportDate}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[140px] px-2.5 py-2 align-top text-[var(--color-text-muted)]">
                      <span className="line-clamp-2">
                        {f.primaryDocDescription || f.primaryDocument || '—'}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 align-top">
                      <div className="flex flex-col items-end gap-1">
                        <a
                          href={f.filingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[var(--color-teal)] hover:underline"
                        >
                          <FileText size={11} /> Index
                        </a>
                        {f.documentUrl && (
                          <a
                            href={f.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:underline"
                          >
                            Doc
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fetchedAt && !loading && (
        <p className="text-[9px] text-[var(--color-text-dim)]">
          Source: SEC EDGAR submissions API · fetched {new Date(fetchedAt).toLocaleString()}. Not
          financial advice — verify on sec.gov.
        </p>
      )}
    </div>
  );
}
