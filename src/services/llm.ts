/**
 * LLM client — OpenAI-compatible chat via local proxy (avoids browser CORS).
 * User API key is stored in localStorage and sent only to the local MineGlobe server.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatResult {
  content: string;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

const API_BASE = import.meta.env.VITE_QUOTES_API_URL ?? '';

function url(path: string): string {
  return `${API_BASE}${path}`;
}

export async function chatCompletion(req: ChatRequest): Promise<ChatResult> {
  if (!req.apiKey.trim()) {
    throw new Error('Add an API key in Settings before chatting.');
  }
  if (!req.baseUrl.trim()) {
    throw new Error('Base URL is required (pick a provider or set a custom URL).');
  }
  if (!req.model.trim()) {
    throw new Error('Model name is required.');
  }

  const res = await fetch(url('/api/llm/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseUrl: req.baseUrl.replace(/\/$/, ''),
      apiKey: req.apiKey,
      model: req.model,
      messages: req.messages,
      temperature: req.temperature ?? 0.4,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    content?: string;
    model?: string;
    usage?: ChatResult['usage'];
    detail?: string | { msg?: string }[];
    error?: string;
  };

  if (!res.ok) {
    const detail =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d) => d.msg ?? JSON.stringify(d)).join('; ')
          : data.error || res.statusText;
    throw new Error(detail || `LLM request failed (${res.status})`);
  }

  if (!data.content) {
    throw new Error('Empty response from model');
  }

  return {
    content: data.content,
    model: data.model,
    usage: data.usage,
  };
}

export async function testLlmConnection(req: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<string> {
  const result = await chatCompletion({
    ...req,
    messages: [
      {
        role: 'user',
        content: 'Reply with exactly: MineGlobe OK',
      },
    ],
    temperature: 0,
  });
  return result.content;
}
