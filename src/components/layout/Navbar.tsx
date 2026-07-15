import { Heart, Info, Download, GitCompare, Settings, Sparkles } from 'lucide-react';
import { GlobalSearch } from '../search/GlobalSearch';
import { MetalFilters } from '../filters/MetalFilters';
import { useAppStore } from '../../store/useAppStore';
import { useLlmSettings } from '../../store/useLlmSettings';
import { exportMetricsCsv, exportSitesCsv } from '../../utils/export';
import { miningSites, siteMetrics } from '../../data/miningData';
import toast from 'react-hot-toast';

export function Navbar() {
  const setPanelView = useAppStore((s) => s.setPanelView);
  const setInfoOpen = useAppStore((s) => s.setInfoOpen);
  const watchedCompanyIds = useAppStore((s) => s.watchedCompanyIds);
  const watchedSiteIds = useAppStore((s) => s.watchedSiteIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const watchCount = watchedCompanyIds.length + watchedSiteIds.length;
  const setSettingsOpen = useLlmSettings((s) => s.setSettingsOpen);
  const setAiPanelOpen = useLlmSettings((s) => s.setAiPanelOpen);
  const hasKey = useLlmSettings((s) => s.apiKey.trim().length > 0);

  return (
    <header className="relative z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-md">
      <div className="flex flex-col gap-3 px-3 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-gold)]/30 bg-gradient-to-br from-[var(--color-gold)]/20 to-transparent"
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="#d4af37" strokeWidth="2" />
                <circle cx="16" cy="16" r="5" fill="#d4af37" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--color-text)] sm:text-base">
                MineGlobe <span className="text-[var(--color-gold)]">3D</span>
              </h1>
              <p className="hidden text-[10px] text-[var(--color-text-dim)] sm:block">
                Precious metals mining explorer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <IconBtn
              label="Watchlist"
              onClick={() => setPanelView('watchlist')}
              badge={watchCount || undefined}
            >
              <Heart size={18} />
            </IconBtn>
            <IconBtn label="Ask AI" onClick={() => setAiPanelOpen(true)}>
              <Sparkles size={18} className={hasKey ? 'text-[var(--color-gold)]' : ''} />
            </IconBtn>
            <IconBtn label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings size={18} />
            </IconBtn>
            <IconBtn label="Info" onClick={() => setInfoOpen(true)}>
              <Info size={18} />
            </IconBtn>
          </div>
        </div>

        {/* Search */}
        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        {/* Filters + actions */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <MetalFilters />
          <div className="hidden h-6 w-px bg-[var(--color-border)] sm:block" />
          <div className="hidden items-center gap-1 sm:flex">
            <IconBtn
              label="Watchlist"
              onClick={() => setPanelView('watchlist')}
              badge={watchCount || undefined}
            >
              <Heart size={16} className={watchCount ? 'fill-[var(--color-gold)] text-[var(--color-gold)]' : ''} />
            </IconBtn>
            <IconBtn
              label="Compare"
              onClick={() => setPanelView('compare')}
              badge={compareIds.length || undefined}
            >
              <GitCompare size={16} />
            </IconBtn>
            <IconBtn
              label="Export CSV"
              onClick={() => {
                exportSitesCsv(miningSites);
                exportMetricsCsv(siteMetrics, miningSites);
                toast.success('Exported sites & metrics CSV');
              }}
            >
              <Download size={16} />
            </IconBtn>
            <IconBtn label="Ask AI" onClick={() => setAiPanelOpen(true)}>
              <Sparkles size={16} className={hasKey ? 'text-[var(--color-gold)]' : ''} />
            </IconBtn>
            <IconBtn label="LLM settings" onClick={() => setSettingsOpen(true)}>
              <Settings size={16} />
            </IconBtn>
            <IconBtn label="About & disclaimer" onClick={() => setInfoOpen(true)}>
              <Info size={16} />
            </IconBtn>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative rounded-lg p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-gold)] px-1 text-[9px] font-bold text-[var(--color-bg)]">
          {badge}
        </span>
      )}
    </button>
  );
}
