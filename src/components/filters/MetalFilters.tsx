import { METAL_FILTER_OPTIONS } from '../../utils/colors';
import { useAppStore, type MetalFilter } from '../../store/useAppStore';

export function MetalFilters() {
  const metalFilter = useAppStore((s) => s.metalFilter);
  const setMetalFilter = useAppStore((s) => s.setMetalFilter);

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Filter by metal"
    >
      {METAL_FILTER_OPTIONS.map((opt) => {
        const active = metalFilter === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMetalFilter(opt.id as MetalFilter)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              active
                ? 'border-transparent text-[var(--color-bg)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
            style={
              active
                ? { background: opt.color, color: opt.id === 'all' ? '#0a0f1c' : '#0a0f1c' }
                : undefined
            }
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
