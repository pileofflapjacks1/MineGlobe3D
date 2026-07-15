import { X, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { OverviewPanel } from './OverviewPanel';
import { SiteView } from './SiteView';
import { CompanyView } from './CompanyView';
import { CountryView } from './CountryView';
import { WatchlistView } from './WatchlistView';
import { CompareView } from './CompareView';

export function DetailsPanel({ mobile = false }: { mobile?: boolean }) {
  const panelView = useAppStore((s) => s.panelView);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const selectedCountryId = useAppStore((s) => s.selectedCountryId);
  const resetSelection = useAppStore((s) => s.resetSelection);
  const setPanelView = useAppStore((s) => s.setPanelView);
  const setMobilePanelOpen = useAppStore((s) => s.setMobilePanelOpen);
  const mobilePanelOpen = useAppStore((s) => s.mobilePanelOpen);

  const close = () => {
    if (mobile) setMobilePanelOpen(false);
    if (panelView === 'site' || panelView === 'company' || panelView === 'country') {
      resetSelection();
    } else {
      setPanelView('overview');
    }
  };

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${panelView}-${selectedSiteId}-${selectedCompanyId}-${selectedCountryId}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        {panelView === 'overview' && <OverviewPanel />}
        {panelView === 'site' && selectedSiteId && <SiteView siteId={selectedSiteId} />}
        {panelView === 'company' && selectedCompanyId && (
          <CompanyView companyId={selectedCompanyId} />
        )}
        {panelView === 'country' && selectedCountryId && (
          <CountryView countryId={selectedCountryId} />
        )}
        {panelView === 'watchlist' && <WatchlistView />}
        {panelView === 'compare' && <CompareView />}
      </motion.div>
    </AnimatePresence>
  );

  if (mobile) {
    if (!mobilePanelOpen && panelView === 'overview') return null;
    if (!mobilePanelOpen) return null;
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-2xl lg:hidden">
        <div className="sheet-handle mt-2" />
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 pb-2">
          <button
            type="button"
            onClick={() => {
              setPanelView('overview');
              setMobilePanelOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]"
          >
            <ChevronLeft size={14} /> Overview
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(70vh - 52px)' }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <aside
      className="hidden h-full w-full max-w-md shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-panel)] lg:flex"
      aria-label="Details panel"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
        <nav className="flex gap-1" aria-label="Panel views">
          {(
            [
              ['overview', 'Overview'],
              ['watchlist', 'Watchlist'],
              ['compare', 'Compare'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanelView(id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                panelView === id ||
                (id === 'overview' &&
                  (panelView === 'site' || panelView === 'company' || panelView === 'country'))
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        {panelView !== 'overview' && (
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">{content}</div>
    </aside>
  );
}
