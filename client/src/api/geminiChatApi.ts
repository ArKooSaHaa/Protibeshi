import { ENV } from '@/config/env';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODELS_ENDPOINT = `${GEMINI_API_BASE}/models`;
const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

let cachedWorkingModel: string | null = null;
let cachedSupportedModels: string[] | null = null;

export type GeminiConversationTurn = {
  role: 'user' | 'model';
  text: string;
};

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiModelsApiResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

const normalizeModelName = (name: string): string => name.replace(/^models\//, '').trim();

const getPreferredModel = (availableModels: string[]): string | null => {
  if (availableModels.length === 0) {
    return null;
  }

  for (const preferred of GEMINI_FALLBACK_MODELS) {
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
    const response = await fetch(`${GEMINI_MODELS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json().catch(() => null)) as GeminiModelsApiResponse | null;
    const models = (payload?.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => normalizeModelName(model.name || ''))
      .filter((model): model is string => Boolean(model));

    cachedSupportedModels = Array.from(new Set(models));
    return cachedSupportedModels;
  } catch {
    return [];
  }
};

const extractReplyText = (data: GeminiApiResponse | null): string => {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || ''
  );
};

const buildGenerateEndpoint = (model: string, apiKey: string): string => {
  return `${GEMINI_MODELS_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
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

export const generateGeminiReply = async (
  history: GeminiConversationTurn[],
  prompt: string,
): Promise<string> => {
  const apiKey = ENV.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini key missing. Set VITE_GEMINI_API_KEY in .env.');
  }

  const cleanedPrompt = prompt.trim();
  if (!cleanedPrompt) {
    throw new Error('Cannot send an empty prompt to Gemini.');
  }

  const turns = [...history, { role: 'user' as const, text: cleanedPrompt }]
    .map(sanitizeTurn)
    .filter((item): item is GeminiConversationTurn => Boolean(item))
    .slice(-20);

  const payload = {
    contents: turns.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    },
  };

  const discoveredModels = await listSupportedModels(apiKey);
  const preferredDiscoveredModel = getPreferredModel(discoveredModels);
  const modelCandidates = Array.from(
    new Set([
      cachedWorkingModel,
      preferredDiscoveredModel,
      ...discoveredModels,
      ...GEMINI_FALLBACK_MODELS,
    ].filter((model): model is string => Boolean(model))),
  );

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    const response = await fetch(buildGenerateEndpoint(model, apiKey), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as GeminiApiResponse | null;

    if (!response.ok) {
      lastError = new Error(data?.error?.message || `Gemini request failed with status ${response.status}`);

      // If model is unavailable for this API version/key, try the next candidate.
      if (response.status === 404) {
        continue;
      }

      throw lastError;
    }

    const reply = extractReplyText(data);
    if (!reply) {
      lastError = new Error('Gemini returned an empty response.');
      continue;
    }

    cachedWorkingModel = model;
    return reply;
  }

  throw (
    lastError
    || new Error('No supported Gemini model found for generateContent. Check model access for your API key.')
  );
};
