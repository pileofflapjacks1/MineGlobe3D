import { useState } from 'react';
import { X, Eye, EyeOff, Trash2, ExternalLink, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getProviderPreset,
  LLM_PROVIDERS,
  useLlmSettings,
  type LlmProviderId,
} from '../../store/useLlmSettings';
import { testLlmConnection } from '../../services/llm';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const providerId = useLlmSettings((s) => s.providerId);
  const apiKey = useLlmSettings((s) => s.apiKey);
  const model = useLlmSettings((s) => s.model);
  const customBaseUrl = useLlmSettings((s) => s.customBaseUrl);
  const setProviderId = useLlmSettings((s) => s.setProviderId);
  const setApiKey = useLlmSettings((s) => s.setApiKey);
  const setModel = useLlmSettings((s) => s.setModel);
  const setCustomBaseUrl = useLlmSettings((s) => s.setCustomBaseUrl);
  const clearApiKey = useLlmSettings((s) => s.clearApiKey);
  const resolvedBaseUrl = useLlmSettings((s) => s.resolvedBaseUrl);

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [draftKey, setDraftKey] = useState<string | null>(null);

  if (!open) return null;

  const preset = getProviderPreset(providerId);
  const keyValue = draftKey ?? apiKey;
  const modelOptions = preset.models;

  const saveKey = () => {
    if (draftKey !== null) {
      setApiKey(draftKey.trim());
      setDraftKey(null);
      toast.success('API key saved locally');
    }
  };

  const handleTest = async () => {
    const key = (draftKey ?? apiKey).trim();
    if (!key) {
      toast.error('Enter an API key first');
      return;
    }
    if (draftKey !== null) setApiKey(draftKey.trim());
    setTesting(true);
    try {
      const reply = await testLlmConnection({
        baseUrl: resolvedBaseUrl(),
        apiKey: key,
        model: model || preset.defaultModel,
      });
      toast.success(`Connected · model replied: ${reply.slice(0, 80)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="settings-title" className="flex items-center gap-2 text-lg font-semibold text-[var(--color-gold)]">
              <KeyRound size={18} />
              Settings
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Connect your preferred LLM (Grok by default) for in-app analysis
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <section className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
              Provider
            </label>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {LLM_PROVIDERS.map((p) => {
                const active = providerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProviderId(p.id as LlmProviderId)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                      active
                        ? 'border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {providerId === 'custom' && (
            <Field label="Base URL">
              <input
                type="url"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="field-input"
              />
            </Field>
          )}

          <Field
            label="API key"
            hint={`${preset.keyHint}. Stored only in this browser (localStorage). Sent to the local MineGlobe proxy, never bundled in source.`}
          >
            <div className="flex gap-1.5">
              <div className="relative min-w-0 flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyValue}
                  onChange={(e) => setDraftKey(e.target.value)}
                  onBlur={saveKey}
                  placeholder={providerId === 'xai' ? 'xai-…' : 'sk-…'}
                  autoComplete="off"
                  spellCheck={false}
                  className="field-input w-full pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearApiKey();
                  setDraftKey('');
                  toast.success('API key cleared');
                }}
                className="rounded-lg border border-[var(--color-border)] px-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
                title="Clear key"
                aria-label="Clear API key"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </Field>

          <Field label="Model">
            {modelOptions.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={modelOptions.includes(model) ? model : ''}
                  onChange={(e) => {
                    if (e.target.value) setModel(e.target.value);
                  }}
                  className="field-input"
                >
                  <option value="" disabled>
                    Choose preset…
                  </option>
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Or type model id"
                  className="field-input font-mono text-xs"
                />
              </div>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="model-id"
                className="field-input font-mono text-xs"
              />
            )}
          </Field>

          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg)]/50 px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text-dim)]">
            <div>
              Endpoint:{' '}
              <span className="font-mono text-[var(--color-silver)]">
                {resolvedBaseUrl() || '(set custom base URL)'}
              </span>
            </div>
            {preset.docsUrl && (
              <a
                href={preset.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[var(--color-teal)] hover:underline"
              >
                Get an API key <ExternalLink size={10} />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                saveKey();
                void handleTest();
              }}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-gold)] px-3 py-2 text-xs font-semibold text-[var(--color-bg)] disabled:opacity-50"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Test connection
            </button>
            <button
              type="button"
              onClick={() => {
                saveKey();
                onClose();
              }}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            >
              Done
            </button>
          </div>

          <p className="text-[10px] leading-relaxed text-[var(--color-text-dim)]">
            Requires the local API server (<code className="text-[var(--color-silver)]">npm run dev:api</code>)
            to proxy chat requests (avoids browser CORS). Your key is forwarded only to the provider you
            choose. Not financial advice — model output can be wrong.
          </p>
        </section>
      </div>

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          color: var(--color-text);
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          outline: none;
        }
        .field-input:focus {
          border-color: color-mix(in srgb, var(--color-gold) 50%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[10px] leading-snug text-[var(--color-text-dim)]">{hint}</p>}
    </div>
  );
}
