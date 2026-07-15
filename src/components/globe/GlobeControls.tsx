import { LocateFixed, Pause, Play, Route } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function GlobeControls() {
  const autoRotate = useAppStore((s) => s.autoRotate);
  const setAutoRotate = useAppStore((s) => s.setAutoRotate);
  const showArcs = useAppStore((s) => s.showArcs);
  const setShowArcs = useAppStore((s) => s.setShowArcs);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const resetSelection = useAppStore((s) => s.resetSelection);

  return (
    <div className="flex flex-col gap-1.5">
      <CtrlBtn
        label={autoRotate ? 'Pause auto-rotate' : 'Resume auto-rotate'}
        onClick={() => setAutoRotate(!autoRotate)}
      >
        {autoRotate ? <Pause size={16} /> : <Play size={16} />}
      </CtrlBtn>
      <CtrlBtn
        label="Reset view"
        onClick={() => {
          resetSelection();
          requestFlyTo(20, 10, 2.4);
          setAutoRotate(true);
        }}
      >
        <LocateFixed size={16} />
      </CtrlBtn>
      <CtrlBtn
        label={showArcs ? 'Hide HQ → mine arcs' : 'Show HQ → mine arcs'}
        onClick={() => setShowArcs(!showArcs)}
        active={showArcs}
      >
        <Route size={16} />
      </CtrlBtn>
    </div>
  );
}

function CtrlBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg border p-2 shadow-lg backdrop-blur-sm transition ${
        active
          ? 'border-[var(--color-gold)]/50 bg-[var(--color-gold)]/15 text-[var(--color-gold)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  );
}
