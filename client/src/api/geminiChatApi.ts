import { ENV } from '@/config/env';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_CHAT_ENDPOINT = `${GROQ_API_BASE}/chat/completions`;
const GROQ_MODELS_ENDPOINT = `${GROQ_API_BASE}/models`;
const GROQ_FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
];

let cachedWorkingModel: string | null = null;
let cachedSupportedModels: string[] | null = null;

export type GeminiConversationTurn = {
  role: 'user' | 'model';
  text: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GroqModelsResponse = {
  data?: Array<{
    id?: string;
  }>;
};

const normalizeModelName = (name: string): string => name.replace(/^models\//, '').trim();

const getPreferredModel = (availableModels: string[]): string | null => {
  if (availableModels.length === 0) {
    return null;
  }

  for (const preferred of GROQ_FALLBACK_MODELS) {
    if (availableModels.includes(preferred)) {
      return preferred;
    }
  }

  return availableModels[0];
};

const listSupportedModels = async (apiKey: string): Promise<string[]> => {
  if (cachedSupportedModels) {
    return cachedSupportedModels;
  }

  try {
    const response = await fetch(GROQ_MODELS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => null)) as GroqModelsResponse | null;
    const models = (payload?.data || [])
      .map((model) => normalizeModelName(model.id || ''))
      .filter((model): model is string => Boolean(model));

    cachedSupportedModels = Array.from(new Set(models));
    return cachedSupportedModels;
  } catch {
    return [];
  }
};

const extractReplyText = (data: GroqChatResponse | null): string => {
  return data?.choices?.[0]?.message?.content?.trim() || '';
};

const sanitizeTurn = (turn: GeminiConversationTurn): GeminiConversationTurn | null => {
  const text = turn.text.trim();
  if (!text) {
    return null;
  }

  return {
    role: turn.role,
    text,
  };
};

const toGroqRole = (role: GeminiConversationTurn['role']): 'user' | 'assistant' => {
  return role === 'model' ? 'assistant' : 'user';
};

export const generateGeminiReply = async (
  history: GeminiConversationTurn[],
  prompt: string,
): Promise<string> => {
  const apiKey = ENV.GROQ_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('Groq key missing. Set VITE_GROQ_CLOUD_API_KEY in .env.');
  }

  const cleanedPrompt = prompt.trim();
  if (!cleanedPrompt) {
    throw new Error('Cannot send an empty prompt to Groq.');
  }

  const turns = [...history, { role: 'user' as const, text: cleanedPrompt }]
    .map(sanitizeTurn)
    .filter((item): item is GeminiConversationTurn => Boolean(item))
    .slice(-20);

  const payload = {
    messages: turns.map((turn) => ({
      role: toGroqRole(turn.role),
      content: turn.text,
    })),
    temperature: 0.7,
    max_tokens: 600,
  };

  const discoveredModels = await listSupportedModels(apiKey);
  const preferredDiscoveredModel = getPreferredModel(discoveredModels);
  const modelCandidates = Array.from(
    new Set([
      cachedWorkingModel,
      preferredDiscoveredModel,
      ...discoveredModels,
      ...GROQ_FALLBACK_MODELS,
    ].filter((model): model is string => Boolean(model))),
  );

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    const response = await fetch(GROQ_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...payload,
        model,
      }),
    });

    const data = (await response.json().catch(() => null)) as GroqChatResponse | null;

    if (!response.ok) {
      lastError = new Error(data?.error?.message || `Groq request failed with status ${response.status}`);

      if (response.status === 404) {
        continue;
      }

      throw lastError;
    }

    const reply = extractReplyText(data);
    if (!reply) {
      lastError = new Error('Groq returned an empty response.');
      continue;
    }

    cachedWorkingModel = model;
    return reply;
  }

  throw (
    lastError
    || new Error('No supported Groq model found for chat completions. Check model access for your API key.')
  );
};
