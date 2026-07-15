import { X } from 'lucide-react';
import { DATA_DISCLAIMER } from '../../utils/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InfoModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="info-title" className="text-lg font-semibold text-[var(--color-gold)]">
              About MineGlobe 3D
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Interactive precious metals mining explorer
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <section>
            <h3 className="mb-1 font-semibold text-[var(--color-text)]">Data provenance</h3>
            <p>{DATA_DISCLAIMER}</p>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-[var(--color-text)]">What is included</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>26 NYSE / NYSE American companies with precious metals exposure</li>
              <li>55+ mining sites across 13 countries</li>
              <li>Quarterly and annual production metrics (illustrative)</li>
              <li>Mock stock prices and sparklines (not live market data)</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-[var(--color-text)]">Not financial advice</h3>
            <p>
              MineGlobe 3D is an educational demonstration. Nothing here constitutes investment
              advice, a recommendation, or an offer to buy or sell securities. Always conduct your
              own research using official SEC filings (10-Q, 10-K), company IR materials, and
              licensed data providers.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-[var(--color-text)]">Keyboard</h3>
            <p>
              <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs">
                ⌘K
              </kbd>{' '}
              /{' '}
              <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-xs">
                Ctrl+K
              </kbd>{' '}
              opens global search.
            </p>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-[var(--color-text)]">AI assistant (optional)</h3>
            <p>
              Open <strong>Settings</strong> (gear) to add your own LLM API key — xAI Grok by
              default, or OpenAI / any OpenAI-compatible endpoint. Then use <strong>Ask AI</strong>{' '}
              for Q&amp;A over the selected mine/company. Keys stay in your browser; chat is
              proxied through the local API server. This does not auto-fetch SEC filings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
