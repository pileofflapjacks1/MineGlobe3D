import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Settings, Trash2, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLlmSettings } from '../../store/useLlmSettings';
import { useAppStore } from '../../store/useAppStore';
import { chatCompletion, type ChatMessage } from '../../services/llm';
import { buildMiningSystemPrompt } from '../../utils/aiContext';
import { companyById, siteById } from '../../data/miningData';

const SUGGESTIONS = [
  'Summarize the selected company and its key mines.',
  'What metals and production metrics are shown for this site?',
  'Compare gold AISC across sites I can see in the demo data.',
  'How would I use a pasted 10-Q excerpt to update site metrics?',
];

export function AskAiPanel() {
  const open = useLlmSettings((s) => s.aiPanelOpen);
  const setOpen = useLlmSettings((s) => s.setAiPanelOpen);
  const setSettingsOpen = useLlmSettings((s) => s.setSettingsOpen);
  const apiKey = useLlmSettings((s) => s.apiKey);
  const hasKey = apiKey.trim().length > 0;
  const model = useLlmSettings((s) => s.model);
  const providerId = useLlmSettings((s) => s.providerId);
  const resolvedBaseUrl = useLlmSettings((s) => s.resolvedBaseUrl);

  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const selectedCountryId = useAppStore((s) => s.selectedCountryId);
  const period = useAppStore((s) => s.period);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!open) return null;

  const contextLabel = (() => {
    if (selectedSiteId && siteById[selectedSiteId]) return siteById[selectedSiteId].name;
    if (selectedCompanyId && companyById[selectedCompanyId])
      return companyById[selectedCompanyId].ticker;
    if (selectedCountryId) return selectedCountryId.toUpperCase();
    return 'Globe overview';
  })();

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    if (!hasKey) {
      toast.error('Add your LLM API key in Settings');
      setSettingsOpen(true);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: q };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const system = buildMiningSystemPrompt({
        selectedCompanyId,
        selectedSiteId,
        selectedCountryId,
        period,
      });
      const result = await chatCompletion({
        baseUrl: resolvedBaseUrl(),
        apiKey,
        model,
        messages: [{ role: 'system', content: system }, ...nextMessages],
      });
      setMessages((m) => [...m, { role: 'assistant', content: result.content }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      toast.error(msg);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `**Error:** ${msg}\n\nCheck Settings (API key, model) and that \`npm run dev:api\` is running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[80] flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-2xl"
      style={{ height: 'min(560px, calc(100vh - 6rem))' }}
      role="dialog"
      aria-label="Ask AI"
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)]">
            <Sparkles size={14} className="text-[var(--color-gold)]" />
            Ask AI
            <span className="rounded-full bg-[var(--color-bg)] px-1.5 py-0.5 font-mono text-[9px] font-normal text-[var(--color-text-dim)]">
              {providerId === 'xai' ? 'Grok' : providerId}
            </span>
          </div>
          <p className="truncate text-[10px] text-[var(--color-text-dim)]">
            Context: {contextLabel} · {model || 'no model'}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMessages([])}
            className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
            title="LLM settings"
            aria-label="LLM settings"
          >
            <Settings size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {!messages.length && (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              <Bot size={16} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
              <div>
                Ask about the selected mine, company, or country using the demo catalog. Paste
                filing text to extract metrics. Configure your key under Settings (xAI Grok
                recommended).
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-2 text-left text-[11px] text-[var(--color-text-muted)] transition hover:border-[var(--color-gold)]/30 hover:text-[var(--color-text)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'ml-6 bg-[var(--color-gold)]/15 text-[var(--color-text)]'
                : 'mr-2 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
            }`}
          >
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="text-[11px] text-[var(--color-text-dim)]">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-[var(--color-border)] p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasKey ? 'Ask about mines, metals, filings…' : 'Add API key in Settings…'}
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-gold)]/40"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[var(--color-gold)] px-3 text-[var(--color-bg)] disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
