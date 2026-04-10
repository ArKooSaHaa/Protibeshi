import { ENV } from '@/config/env';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `${ENV.API_BASE_URL}/api`;
  }

  if (window.location.port === '5173') {
    return `${ENV.API_BASE_URL}/api`;
  }

  return new URL('api/', window.location.href).toString().replace(/\/$/, '');
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeTokenValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
};

const parseJsonString = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getNestedToken = (source) => {
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

const resolveAuthToken = (providedToken) => {
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

const extractApiErrorMessage = (data, fallbackMessage) => {
  if (!data) {
    return fallbackMessage;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const firstFieldErrors = Object.values(data.errors)[0];

    if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
      return firstFieldErrors[0];
    }

    if (typeof firstFieldErrors === 'string' && firstFieldErrors.trim()) {
      return firstFieldErrors;
    }
  }

  return fallbackMessage;
};

export const createComplaint = async (formData, token) => {
  const response = await fetch(`${getApiBaseUrl()}/complaints`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to submit complaint'));
  }

  return data;
};

export const getComplaints = async () => {
  const response = await fetch(`${getApiBaseUrl()}/complaints`, {
    method: 'GET',
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, 'Failed to fetch complaints'));
  }

  return data;
};

export const getAdminComplaints = async (token) => {
  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/complaints`, {
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
      throw new Error('You are not authorized to access admin complaints moderation.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch admin complaints'));
  }

  return data;
};

export const getAdminComplaintDetails = async (complaintId, token) => {
  const resolvedComplaintId = Number(complaintId);
  if (!Number.isFinite(resolvedComplaintId) || resolvedComplaintId <= 0) {
    throw new Error('Invalid complaint selected for details view.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/complaints/${resolvedComplaintId}`, {
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
      throw new Error('You are not authorized to view complaint details.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch complaint details'));
  }

  return data;
};

export const updateAdminComplaintStatus = async (complaintId, payload, token) => {
  const resolvedComplaintId = Number(complaintId);
  if (!Number.isFinite(resolvedComplaintId) || resolvedComplaintId <= 0) {
    throw new Error('Invalid complaint selected for status update.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const status = typeof payload?.status === 'string' ? payload.status.trim() : '';
  const note = typeof payload?.note === 'string' ? payload.note.trim() : '';

  if (!status) {
    throw new Error('Please provide a valid complaint status.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/complaints/${resolvedComplaintId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      status,
      note: note || null,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to update complaint statuses.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to update complaint status'));
  }

  return data;
};

export const bulkUpdateAdminComplaintStatus = async (complaintIds, payload, token) => {
  const normalizedIds = Array.isArray(complaintIds)
    ? Array.from(new Set(complaintIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0)))
    : [];

  if (normalizedIds.length === 0) {
    throw new Error('Select at least one complaint for bulk moderation update.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const status = typeof payload?.status === 'string' ? payload.status.trim() : '';
  const note = typeof payload?.note === 'string' ? payload.note.trim() : '';

  if (!status) {
    throw new Error('Please provide a valid complaint status.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/complaints/status/bulk`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      complaint_ids: normalizedIds,
      status,
      note: note || null,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to update complaint statuses.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to run bulk complaint status update'));
  }

  return data;
};

export const deleteComplaint = async (id, token) => {
  const response = await fetch(`${getApiBaseUrl()}/complaints/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to delete this complaint.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to delete complaint'));
  }

  return data;
};
