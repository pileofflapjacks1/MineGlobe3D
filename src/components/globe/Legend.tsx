import { METAL_COLORS } from '../../utils/colors';

export function Legend() {
  return (
    <div className="pointer-events-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 p-3 text-xs backdrop-blur-sm">
      <div className="mb-2 font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
        Legend
      </div>
      <div className="space-y-1.5">
        {(
          [
            ['gold', 'Gold'],
            ['silver', 'Silver'],
            ['platinum', 'Platinum'],
            ['palladium', 'Palladium'],
            ['copper', 'Copper'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-black/30"
              style={{ background: METAL_COLORS[key] }}
            />
            {label}
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-[var(--color-border-subtle)] pt-2 text-[10px] leading-snug text-[var(--color-text-dim)]">
        Marker size ≈ relative production volume for selected period
      </div>
    </div>
  );
}
