import { ENV } from '@/config/env';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

const getApiBaseUrl = () => {
  return `${getConfiguredApiHost()}/api`;
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

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildProviderName = (user) => {
  if (!user) {
    return 'Neighbor';
  }

  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || 'Neighbor';
};

export const normalizeService = (raw) => {
  const coverPhotoUrl = resolveMediaUrl(raw?.cover_photo_url || raw?.cover_photo);
  const userProfilePictureUrl = resolveMediaUrl(raw?.user?.profile_picture_url || raw?.user?.profile_picture);

  return {
    id: String(raw?.id ?? ''),
    ownerId: raw?.user?.id ?? null,
    providerName: buildProviderName(raw?.user),
    avatar: userProfilePictureUrl
      || coverPhotoUrl
      || 'https://i.pravatar.cc/120?img=11',
    coverPhoto: raw?.cover_photo || null,
    coverPhotoUrl,
    verified: Boolean(raw?.verified_provider),
    rating: 4.6,
    reviews: 0,
    distance: toNumber(raw?.service_radius, 0),
    category: raw?.category || 'Other',
    title: raw?.title || 'Untitled service',
    shortDescription: raw?.short_description || '',
    fullDescription: raw?.full_description || '',
    price: toNumber(raw?.price, 0),
    priceUnit: raw?.price_type || 'hour',
    availability: raw?.availability || 'Flexible',
    experience: toNumber(raw?.experience_years, 0),
    radius: toNumber(raw?.service_radius, 0),
    createdAt: raw?.created_at ? new Date(raw.created_at).getTime() : Date.now(),
    responseTime: 'Usually replies in 20 mins',
    skills: raw?.category ? [raw.category] : [],
    certifications: [],
    gallery: coverPhotoUrl ? [coverPhotoUrl] : [],
    schedule: raw?.working_hours
      ? raw.working_hours.split(',').map((item) => item.trim()).filter(Boolean)
      : ['Flexible schedule'],
    location: raw?.location || '',
  };
};

export const createService = async (formData, token) => {
  const response = await fetch(`${getApiBaseUrl()}/services`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to create service'));
  }

  return {
    message: data?.message || 'Service created successfully',
    service: data?.service ? normalizeService(data.service) : null,
  };
};

export const getServices = async () => {
  const response = await fetch(`${getApiBaseUrl()}/services`, {
    method: 'GET',
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, 'Failed to fetch services'));
  }

  const rawServices = Array.isArray(data) ? data : (data?.services || []);
  return rawServices.map(normalizeService);
};

export const deleteService = async (id, token) => {
  const response = await fetch(`${getApiBaseUrl()}/services/${id}`, {
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
      throw new Error('You are not authorized to delete this service.');
    }
    throw new Error(extractApiErrorMessage(data, 'Failed to delete service'));
  }

  return data;
};

export const reportService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for report.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in to report this service.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

  const response = await fetch(`${getApiBaseUrl()}/services/${resolvedServiceId}/report`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      reason: trimmedReason || null,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error(extractApiErrorMessage(data, 'You cannot report your own service.'));
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to report service'));
  }

  return {
    message: data?.message || 'Service reported successfully',
    reportId: Number(data?.report_id ?? 0),
  };
};

export const getAdminServices = async (token) => {
  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services`, {
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
      throw new Error('You are not authorized to access admin moderation tools.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch admin services'));
  }

  if (Array.isArray(data?.services)) {
    return data.services;
  }

  return [];
};

export const hideAdminService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for moderation.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation reason before hiding this service.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services/${resolvedServiceId}`, {
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
      throw new Error('You are not authorized to hide services.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to hide service'));
  }

  return {
    message: data?.message || 'Service hidden successfully',
    service: data?.service || null,
  };
};

export const verifyAdminService = async (serviceId, token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for verification.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services/${resolvedServiceId}/verify`, {
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
      throw new Error('You are not authorized to verify services.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to verify service'));
  }

  return {
    message: data?.message || 'Service verified successfully',
    service: data?.service || null,
    clearedReports: Number(data?.cleared_reports ?? 0),
  };
};

export const flagAdminService = async (serviceId, reason = '', token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for flagging.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation reason before flagging this service.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services/${resolvedServiceId}/flag`, {
    method: 'POST',
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
      throw new Error('You are not authorized to flag services.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to flag service'));
  }

  return {
    message: data?.message || 'Service flagged for moderation',
    service: data?.service || null,
  };
};

export const dismissAdminServiceReports = async (serviceId, token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for report dismissal.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services/${resolvedServiceId}/ignore-reports`, {
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
      throw new Error('You are not authorized to dismiss service reports.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to dismiss service reports'));
  }

  return {
    message: data?.message || 'Service reports dismissed successfully',
    service: data?.service || null,
    clearedReports: Number(data?.cleared_reports ?? 0),
  };
};

export const banServiceProvider = async (serviceId, reason = '', token) => {
  const resolvedServiceId = Number(serviceId);
  if (!Number.isFinite(resolvedServiceId) || resolvedServiceId <= 0) {
    throw new Error('Invalid service selected for provider ban.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation reason before banning this provider.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/services/${resolvedServiceId}/ban-user`, {
    method: 'POST',
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
      throw new Error('You are not authorized to ban service providers.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to ban service provider'));
  }

  return {
    message: data?.message || 'Provider banned successfully',
    affectedServices: Number(data?.affected_services ?? 0),
    seller: data?.seller || data?.user || null,
  };
};
