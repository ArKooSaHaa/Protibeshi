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
