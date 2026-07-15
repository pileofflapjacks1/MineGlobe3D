import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Built-in OpenAI-compatible providers */
export type LlmProviderId = 'xai' | 'openai' | 'custom';

export interface LlmProviderPreset {
  id: LlmProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  docsUrl: string;
  keyHint: string;
}

export const LLM_PROVIDERS: LlmProviderPreset[] = [
  {
    id: 'xai',
    label: 'xAI · Grok',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.5',
    models: ['grok-4.5', 'grok-4.3', 'grok-4.20-0309-non-reasoning', 'grok-4.20-0309-reasoning'],
    docsUrl: 'https://console.x.ai',
    keyHint: 'XAI_API_KEY from console.x.ai',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini'],
    docsUrl: 'https://platform.openai.com/api-keys',
    keyHint: 'OpenAI API key',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    defaultModel: '',
    models: [],
    docsUrl: '',
    keyHint: 'Any OpenAI-compatible /chat/completions endpoint',
  },
];

export function getProviderPreset(id: LlmProviderId): LlmProviderPreset {
  return LLM_PROVIDERS.find((p) => p.id === id) ?? LLM_PROVIDERS[0];
}

interface LlmSettingsState {
  providerId: LlmProviderId;
  apiKey: string;
  model: string;
  /** Only used when provider is custom; otherwise preset base URL is used */
  customBaseUrl: string;
  settingsOpen: boolean;
  aiPanelOpen: boolean;

  setProviderId: (id: LlmProviderId) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setCustomBaseUrl: (url: string) => void;
  setSettingsOpen: (open: boolean) => void;
  setAiPanelOpen: (open: boolean) => void;
  clearApiKey: () => void;
  resolvedBaseUrl: () => string;
  hasApiKey: () => boolean;
}

export const useLlmSettings = create<LlmSettingsState>()(
  persist(
    (set, get) => ({
      providerId: 'xai',
      apiKey: '',
      model: 'grok-4.5',
      customBaseUrl: '',
      settingsOpen: false,
      aiPanelOpen: false,

      setProviderId: (id) => {
        const preset = getProviderPreset(id);
        set({
          providerId: id,
          model: preset.defaultModel || get().model,
        });
      },
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setCustomBaseUrl: (customBaseUrl) => set({ customBaseUrl }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      clearApiKey: () => set({ apiKey: '' }),

      resolvedBaseUrl: () => {
        const s = get();
        if (s.providerId === 'custom') {
          return s.customBaseUrl.replace(/\/$/, '');
        }
        return getProviderPreset(s.providerId).baseUrl;
      },

      hasApiKey: () => get().apiKey.trim().length > 0,
    }),
    {
      name: 'mineglobe-llm-settings',
      partialize: (s) => ({
        providerId: s.providerId,
        apiKey: s.apiKey,
        model: s.model,
        customBaseUrl: s.customBaseUrl,
      }),
    },
  ),
);
