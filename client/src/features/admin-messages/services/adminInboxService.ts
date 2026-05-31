import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';
import type { ChatConversation, ChatMessage } from '@/api/chatApi';
import type { AdminInboxUser } from '../types/adminInbox.types';

type AdminInboxApiPayload = {
  success?: boolean;
  message?: unknown;
  conversations?: ChatConversation[];
  conversation?: ChatConversation;
  messages?: ChatMessage[];
  users?: AdminInboxUser[];
  updated_count?: number;
};

const apiClient = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api`,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getBearerTokenHeader();

  if (token) {
    config.headers.Authorization = token;
  }

  return config;
});

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  const payload = error.response?.data as AdminInboxApiPayload | undefined;
  if (payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return error.message || fallback;
};

export const fetchAdminInboxConversations = async (): Promise<ChatConversation[]> => {
  try {
    const response = await apiClient.get<AdminInboxApiPayload>('/admin/messages/conversations');
    return Array.isArray(response.data.conversations) ? response.data.conversations : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not load admin inbox conversations.'));
  }
};

export const searchAdminInboxUsers = async (query: string): Promise<AdminInboxUser[]> => {
  try {
    const response = await apiClient.get<AdminInboxApiPayload>('/admin/messages/users', {
      params: { q: query },
    });
    return Array.isArray(response.data.users) ? response.data.users : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not search users.'));
  }
};

export const startAdminInboxConversation = async (userId: number): Promise<ChatConversation> => {
  try {
    const response = await apiClient.post<AdminInboxApiPayload>('/admin/messages/conversations', {
      user_id: userId,
    });

    if (!response.data.conversation) {
      throw new Error('Conversation payload was not returned.');
    }

    return response.data.conversation;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not start conversation.'));
  }
};

export const fetchAdminInboxMessages = async (conversationId: number): Promise<ChatMessage[]> => {
  try {
    const response = await apiClient.get<AdminInboxApiPayload>(
      `/admin/messages/conversations/${conversationId}/messages`,
    );
    return Array.isArray(response.data.messages) ? response.data.messages : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not load messages.'));
  }
};

export const sendAdminInboxMessage = async (
  conversationId: number,
  message: string,
): Promise<ChatMessage> => {
  try {
    const response = await apiClient.post<AdminInboxApiPayload>('/admin/messages', {
      conversation_id: conversationId,
      message,
    });

    if (!response.data.message || typeof response.data.message !== 'object') {
      throw new Error('Message payload was not returned.');
    }

    return response.data.message as ChatMessage;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not send message.'));
  }
};

export const markAdminInboxRead = async (conversationId: number): Promise<number> => {
  try {
    const response = await apiClient.post<AdminInboxApiPayload>('/admin/messages/read', {
      conversation_id: conversationId,
    });

    return typeof response.data.updated_count === 'number' ? response.data.updated_count : 0;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not update read status.'));
  }
};
