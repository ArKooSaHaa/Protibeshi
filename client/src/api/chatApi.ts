import { ENV } from '@/config/env';
import { getStoredToken } from '@/features/auth/utils/tokenStorage';

export type ChatUser = {
  id: number;
  name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
};

export type ChatConversation = {
  id: number;
  listing_id: number | null;
  last_message: string | null;
  unread_count: number;
  is_admin_inbox?: boolean;
  is_gemini_inbox?: boolean;
  is_read_only?: boolean;
  admin_contact_email?: string | null;
  created_at?: string;
  updated_at?: string;
  user: ChatUser | null;
};

export type ChatMessage = {
  id: number | string;
  conversation_id: number;
  message: string;
  sender_id: number;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  sender: ChatUser | null;
};

type JsonRecord = Record<string, unknown>;

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `${ENV.API_BASE_URL}/api`;
  }

  if (window.location.port === '5173') {
    return `${ENV.API_BASE_URL}/api`;
  }

  return new URL('api/', window.location.href).toString().replace(/\/$/, '');
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getAuthHeaders = (includeJsonContentType = true): Record<string, string> => {
  const token = getStoredToken();

  return {
    ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const throwIfNotOk = (response: Response, data: unknown, fallbackMessage: string): void => {
  if (response.ok) {
    return;
  }

  const payload = data as { message?: string } | null;

  const message =
    (typeof payload?.message === 'string' && payload.message.trim())
      ? payload.message
      : fallbackMessage;

  throw new Error(message);
};

export const startConversation = async (
  receiver_id: number,
  listing_id?: number | null,
): Promise<{ success: boolean; conversation: ChatConversation }> => {
  const response = await fetch(`${getApiBaseUrl()}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ receiver_id, listing_id: listing_id ?? null }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to start conversation');
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    conversation: payload.conversation as ChatConversation,
  };
};

export const getConversations = async (): Promise<ChatConversation[]> => {
  const response = await fetch(`${getApiBaseUrl()}/conversations`, {
    method: 'GET',
    headers: getAuthHeaders(false),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to load conversations');
  const payload = (data ?? {}) as JsonRecord;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(payload.conversations)) {
    return payload.conversations as ChatConversation[];
  }

  return [];
};

export const getMessages = async (conversationId: number | string): Promise<ChatMessage[]> => {
  const response = await fetch(`${getApiBaseUrl()}/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: getAuthHeaders(false),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to load messages');
  const payload = (data ?? {}) as JsonRecord;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(payload.messages)) {
    return payload.messages as ChatMessage[];
  }

  return [];
};

export const sendMessage = async (
  conversation_id: number,
  message: string,
): Promise<{ success: boolean; message: ChatMessage }> => {
  const response = await fetch(`${getApiBaseUrl()}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ conversation_id, message }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to send message');
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    message: payload.message as ChatMessage,
  };
};

export const saveGeminiReply = async (
  conversation_id: number,
  message: string,
): Promise<{ success: boolean; message: ChatMessage }> => {
  const response = await fetch(`${getApiBaseUrl()}/messages/gemini/reply`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ conversation_id, message }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to save Gemini reply');
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    message: payload.message as ChatMessage,
  };
};

export const markAsRead = async (
  conversation_id: number,
): Promise<{ success: boolean; updated_count: number }> => {
  const response = await fetch(`${getApiBaseUrl()}/messages/read`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ conversation_id }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to mark messages as read');
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    updated_count: Number(payload.updated_count ?? 0),
  };
};
