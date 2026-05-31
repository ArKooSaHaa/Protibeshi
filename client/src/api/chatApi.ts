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

export type ConversationCallSession = {
  id: number;
  conversation_id: number;
  initiator_id: number;
  call_type: string;
  status: string;
  room_name: string;
  jitsi_join_url: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  initiator: ChatUser | null;
};

export type CallSignalType = 'offer' | 'answer' | 'ice-candidate' | 'leave';

export type CallSignalPayload = Record<string, unknown>;

type JsonRecord = Record<string, unknown>;

const getApiBaseUrl = () => {
  const configuredBaseUrl = String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}/api`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  return 'http://127.0.0.1:8000/api';
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const throwIfJsonMissing = (data: unknown): void => {
  if (data !== null) {
    return;
  }

  throw new Error('Invalid API response. Check VITE_API_URL and deployment API routing.');
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
  throwIfJsonMissing(data);
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
  throwIfJsonMissing(data);
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
  throwIfJsonMissing(data);
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
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    message: payload.message as ChatMessage,
  };
};

export const startAudioCall = async (
  conversation_id: number,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ conversation_id }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to start audio call');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    call_session: payload.call_session as ConversationCallSession,
  };
};

export const getConversationCallSessions = async (
  conversationId: number | string,
): Promise<ConversationCallSession[]> => {
  const response = await fetch(`${getApiBaseUrl()}/conversations/${conversationId}/calls`, {
    method: 'GET',
    headers: getAuthHeaders(false),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to load call logs');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  if (Array.isArray(payload.call_sessions)) {
    return payload.call_sessions as ConversationCallSession[];
  }

  return [];
};

export const getCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls/${callSessionId}`, {
    method: 'GET',
    headers: getAuthHeaders(false),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to load call session');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    call_session: payload.call_session as ConversationCallSession,
  };
};

export const getActiveIncomingCallSession = async (): Promise<{ success: boolean; call_session: ConversationCallSession | null }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls/active`, {
    method: 'GET',
    headers: getAuthHeaders(false),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to load active incoming call');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    call_session: (payload.call_session as ConversationCallSession | null) ?? null,
  };
};

export const endCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls/${callSessionId}/end`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({}),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to end call session');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    call_session: payload.call_session as ConversationCallSession,
  };
};

export const acceptCallSession = async (
  callSessionId: number | string,
): Promise<{ success: boolean; call_session: ConversationCallSession }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls/${callSessionId}/accept`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({}),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to accept call session');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    call_session: payload.call_session as ConversationCallSession,
  };
};

export const sendCallSignal = async (
  callSessionId: number | string,
  signal_type: CallSignalType,
  signal_payload: CallSignalPayload,
): Promise<{ success: boolean; recipient_id: number }> => {
  const response = await fetch(`${getApiBaseUrl()}/calls/${callSessionId}/signal`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ signal_type, signal_payload }),
  });

  const data = await parseJsonSafely(response);
  throwIfNotOk(response, data, 'Failed to send call signal');
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    recipient_id: Number(payload.recipient_id ?? 0),
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
  throwIfJsonMissing(data);
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
  throwIfJsonMissing(data);
  const payload = (data ?? {}) as JsonRecord;

  return {
    success: Boolean(payload.success),
    updated_count: Number(payload.updated_count ?? 0),
  };
};
