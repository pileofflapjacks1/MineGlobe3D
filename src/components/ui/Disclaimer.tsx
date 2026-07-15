import { SHORT_DISCLAIMER } from '../../utils/format';

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-[10px] leading-relaxed text-[var(--color-text-dim)] ${className}`}
      role="note"
    >
      {SHORT_DISCLAIMER}
    </p>
  );
}

export function DataNotesChip({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 px-3 py-1 text-[10px] font-medium text-[var(--color-gold-dim)] backdrop-blur-sm transition hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold)]"
      aria-label="View data notes and disclaimer"
    >
      Data notes · Demo only
    </button>
  );
}
