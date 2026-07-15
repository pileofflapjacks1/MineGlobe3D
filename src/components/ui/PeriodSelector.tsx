import type { Period } from '../../data/types';
import { PERIODS } from '../../data/miningData';

const VISIBLE: Period[] = ['FY 2025', 'Q1 2026', 'Q2 2026'];

interface Props {
  value: Period;
  onChange: (p: Period) => void;
  compact?: boolean;
}

export function PeriodSelector({ value, onChange, compact }: Props) {
  const options = compact ? VISIBLE : (PERIODS as unknown as Period[]);

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5"
      role="group"
      aria-label="Select reporting period"
    >
      {options.map((p) => {
        const active = p === value;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              active
                ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
            }`}
            aria-pressed={active}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
