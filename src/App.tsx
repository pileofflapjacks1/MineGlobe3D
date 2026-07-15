import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { GlobeView } from './components/globe/GlobeView';
import { GlobeControls } from './components/globe/GlobeControls';
import { Legend } from './components/globe/Legend';
import { DetailsPanel } from './components/panel/DetailsPanel';
import { InfoModal } from './components/ui/InfoModal';
import { DataNotesChip } from './components/ui/Disclaimer';
import { PeriodSelector } from './components/ui/PeriodSelector';
import { QuotesProvider } from './context/QuotesContext';
import { QuoteStatusChip } from './components/ui/QuoteStatusChip';
import { SettingsModal } from './components/settings/SettingsModal';
import { AskAiPanel } from './components/ai/AskAiPanel';
import { useAppStore } from './store/useAppStore';
import { useLlmSettings } from './store/useLlmSettings';
import { PanelBottom } from 'lucide-react';

function App() {
  const infoOpen = useAppStore((s) => s.infoOpen);
  const setInfoOpen = useAppStore((s) => s.setInfoOpen);
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  const setMobilePanelOpen = useAppStore((s) => s.setMobilePanelOpen);
  const setPanelView = useAppStore((s) => s.setPanelView);
  const panelView = useAppStore((s) => s.panelView);
  const settingsOpen = useLlmSettings((s) => s.settingsOpen);
  const setSettingsOpen = useLlmSettings((s) => s.setSettingsOpen);

  // Prefetch earth textures
  useEffect(() => {
    const imgs = [
      'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
      'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png',
    ];
    imgs.forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  return (
    <QuotesProvider>
    <div className="flex h-full flex-col bg-[var(--color-bg)]">
      <Navbar />

      <div className="relative flex min-h-0 flex-1">
        {/* Globe stage */}
        <main className="relative min-w-0 flex-1">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#121a2e_0%,_#0a0f1c_70%)]" />
          <GlobeView />

          {/* Overlays */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="pointer-events-auto absolute left-3 top-3">
              <GlobeControls />
            </div>
            <div className="pointer-events-auto absolute bottom-3 left-3 hidden sm:block">
              <Legend />
            </div>
            <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col items-end gap-2 lg:right-4">
              <QuoteStatusChip />
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 p-2 backdrop-blur-sm">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
                  Period
                </p>
                <PeriodSelector value={period} onChange={setPeriod} compact />
              </div>
              <DataNotesChip onClick={() => setInfoOpen(true)} />
            </div>
          </div>

          {/* Mobile open panel FAB */}
          <button
            type="button"
            className="absolute bottom-20 right-3 z-20 flex items-center gap-2 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-bg-panel)] px-4 py-2.5 text-xs font-semibold text-[var(--color-gold)] shadow-lg lg:hidden"
            onClick={() => {
              if (panelView === 'overview') setPanelView('overview');
              setMobilePanelOpen(true);
            }}
          >
            <PanelBottom size={16} />
            Details
          </button>
        </main>

        {/* Desktop panel */}
        <DetailsPanel />
      </div>

      {/* Mobile bottom sheet */}
      <DetailsPanel mobile />

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AskAiPanel />

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: '',
          style: {
            background: '#121a2e',
            color: '#e8edf5',
            border: '1px solid #1e2a42',
            fontSize: 13,
          },
        }}
      />
    </div>
    </QuotesProvider>
  );
}

export default App;
