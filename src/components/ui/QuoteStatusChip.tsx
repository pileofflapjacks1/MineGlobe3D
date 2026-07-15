import { Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuotes } from '../../context/QuotesContext';

export function QuoteStatusChip() {
  const { status, isLive, refresh, isLoading, fetchedAt } = useQuotes();

  const label =
    status === 'live'
      ? 'Live quotes (yfinance)'
      : status === 'loading'
        ? 'Loading quotes…'
        : status === 'fallback'
          ? 'Quotes offline · mock fallback'
          : status === 'error'
            ? 'Quote error'
            : 'Quotes idle';

  const color =
    status === 'live'
      ? 'border-[var(--color-success)]/40 text-[var(--color-success)]'
      : status === 'loading'
        ? 'border-[var(--color-teal)]/40 text-[var(--color-teal)]'
        : 'border-[var(--color-warning)]/40 text-[var(--color-warning)]';

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      title={
        fetchedAt
          ? `Last fetch ${new Date(fetchedAt).toLocaleString()} — click to refresh`
          : 'Click to refresh stock quotes'
      }
      className={`inline-flex items-center gap-1.5 rounded-full border bg-[var(--color-bg-elevated)]/90 px-3 py-1 text-[10px] font-medium backdrop-blur-sm transition hover:opacity-90 ${color}`}
    >
      {isLoading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isLive ? (
        <Activity size={11} />
      ) : (
        <AlertTriangle size={11} />
      )}
      {label}
    </button>
  );
}
