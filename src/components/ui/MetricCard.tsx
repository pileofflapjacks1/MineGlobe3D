import { formatAisc, formatProduction, formatYoy, yoyTone } from '../../utils/format';
import type { ProductionUnit } from '../../data/types';
import { METAL_COLORS, METAL_LABELS } from '../../utils/colors';
import type { Metal } from '../../data/types';

interface MetricCardProps {
  metal: Metal;
  production: number;
  unit: ProductionUnit;
  yoyPct: number | null;
  aisc?: number | null;
  period?: string;
}

export function MetricCard({ metal, production, unit, yoyPct, aisc, period }: MetricCardProps) {
  const tone = yoyTone(yoyPct);
  const yoyColor =
    tone === 'up'
      ? 'text-[var(--color-success)]'
      : tone === 'down'
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-text-muted)]';

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
          style={{ color: METAL_COLORS[metal] }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: METAL_COLORS[metal] }}
          />
          {METAL_LABELS[metal]}
        </span>
        {period && (
          <span className="font-mono text-[10px] text-[var(--color-text-dim)]">{period}</span>
        )}
      </div>
      <div className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
        {formatProduction(production, unit)}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={yoyColor}>YoY {formatYoy(yoyPct)}</span>
        {aisc != null && (
          <span className="text-[var(--color-text-muted)]">AISC {formatAisc(aisc)}</span>
        )}
      </div>
    </div>
  );
}
