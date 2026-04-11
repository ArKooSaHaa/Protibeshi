import { ENV } from '@/config/env';

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string | string[]>;
} | null;

type DismissReportsResponse = {
  message: string;
  relief: unknown;
  clearedReports: number;
};

type RemoveReliefResponse = {
  message: string;
  deletedRelief: unknown;
  notificationSent: boolean;
};

const getConfiguredApiHost = (): string => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

const getApiBaseUrl = (): string => {
  return `${getConfiguredApiHost()}/api`;
};

const parseJsonSafely = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractApiErrorMessage = (data: ApiErrorResponse, fallbackMessage: string): string => {
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const firstFieldErrors = Object.values(data.errors)[0];

    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return String(firstFieldErrors[0]);
    }

    if (typeof firstFieldErrors === 'string' && firstFieldErrors.trim()) {
      return firstFieldErrors;
    }
  }

  return fallbackMessage;
};

const normalizeTokenValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
};

const parseJsonString = (value: string | null): any => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getNestedToken = (source: any): string | null => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  const directCandidates = [
    source.token,
    source.authToken,
    source.accessToken,
    source.access_token,
    source.jwt,
    source.jwt_token,
  ];

  for (const candidate of directCandidates) {
    const token = normalizeTokenValue(candidate);
    if (token) {
      return token;
    }
  }

  if (source.state && typeof source.state === 'object') {
    return getNestedToken(source.state);
  }

  return null;
};

const resolveAuthToken = (providedToken?: string): string | null => {
  const explicitToken = normalizeTokenValue(providedToken);
  if (explicitToken) {
    return explicitToken;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const directKeys = ['token', 'auth_token', 'authToken', 'access_token', 'accessToken', 'jwt', 'jwt_token'];

  for (const key of directKeys) {
    const token = normalizeTokenValue(window.localStorage.getItem(key));
    if (token) {
      return token;
    }
  }

  const structuredKeys = ['auth', 'authStore', 'auth-storage', 'persist:auth'];
  for (const key of structuredKeys) {
    const parsed = parseJsonString(window.localStorage.getItem(key));
    const token = getNestedToken(parsed);
    if (token) {
      return token;
    }
  }

  for (const key of directKeys) {
    const token = normalizeTokenValue(window.sessionStorage.getItem(key));
    if (token) {
      return token;
    }
  }

  return null;
};

export const getAdminReliefs = async (token?: string): Promise<any[]> => {
  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/reliefs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to access admin relief moderation tools.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch relief moderation data'));
  }

  if (Array.isArray(data?.reliefs)) {
    return data.reliefs;
  }

  return [];
};

export const dismissAdminReliefReports = async (
  reliefId: number | string,
  token?: string,
): Promise<DismissReportsResponse> => {
  const resolvedReliefId = Number(reliefId);
  if (!Number.isFinite(resolvedReliefId) || resolvedReliefId <= 0) {
    throw new Error('Invalid relief request selected.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/reliefs/${resolvedReliefId}/ignore-reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
    },
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to dismiss relief reports.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to dismiss relief reports'));
  }

  return {
    message: data?.message || 'Relief reports dismissed successfully',
    relief: data?.relief || null,
    clearedReports: Number(data?.cleared_reports ?? 0),
  };
};

export const removeAdminReliefRequest = async (
  reliefId: number | string,
  reason: string = '',
  token?: string,
): Promise<RemoveReliefResponse> => {
  const resolvedReliefId = Number(reliefId);
  if (!Number.isFinite(resolvedReliefId) || resolvedReliefId <= 0) {
    throw new Error('Invalid relief request selected for removal.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation reason before removing this request.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/reliefs/${resolvedReliefId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      reason: trimmedReason,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to remove relief requests.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to remove relief request'));
  }

  return {
    message: data?.message || 'Relief request removed successfully',
    deletedRelief: data?.deleted_relief || null,
    notificationSent: Boolean(data?.notification_sent),
  };
};
