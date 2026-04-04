// src/services/rentService.js
import { ENV } from '@/config/env';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return `${ENV.API_BASE_URL}/api`;
  }

  // Vite dev server calls Laravel backend directly.
  if (window.location.port === '5173') {
    return `${ENV.API_BASE_URL}/api`;
  }

  // Deployed/XAMPP: same origin as current page.
  return new URL('api/', window.location.href).toString().replace(/\/$/, '');
};

const getStorageBaseUrl = () => {
  if (typeof window === 'undefined') {
    return ENV.API_BASE_URL;
  }
  if (window.location.port === '5173') {
    return ENV.API_BASE_URL;
  }
  return window.location.origin;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractApiErrorMessage = (data, fallback) => {
  if (!data) return fallback;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
    if (typeof first === 'string' && first.trim()) return first;
  }

  return fallback;
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

/**
 * Normalize a raw API rent listing into the shape expected by RentListingCard.
 */
export const normalizeRentListing = (raw) => {
  const createdAt = raw.created_at ? new Date(raw.created_at) : null;
  const listedDays = createdAt
    ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
    : 0;

  const storageBase = getStorageBaseUrl();

  return {
    ...raw,
    image: raw.photo ? `${storageBase}/storage/${raw.photo}` : null,
    sqft: raw.size_sqft ?? null,
    verified: Boolean(raw.verified_landlord),
    views: 0,
    listedDays,
  };
};

export const createRentListing = async (formData, token) => {
  const response = await fetch(`${getApiBaseUrl()}/rent-listings`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to create rent listing'));
  }

  return {
    message: data?.message || 'Rent listing created successfully',
    listing: data?.listing ? normalizeRentListing(data.listing) : null,
  };
};

export const getRentListings = async () => {
  const response = await fetch(`${getApiBaseUrl()}/rent-listings`, {
    method: 'GET',
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, 'Failed to fetch rent listings'));
  }

  const rawList = Array.isArray(data) ? data : (data?.listings ?? []);

  return rawList.map(normalizeRentListing);
};

export const deleteRentListing = async (id, token) => {
  const response = await fetch(`${getApiBaseUrl()}/rent-listings/${id}`, {
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
      throw new Error('You are not authorized to delete this listing.');
    }
    throw new Error(extractApiErrorMessage(data, 'Failed to delete rent listing'));
  }

  return data;
};

export const reportRentListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for report.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in to report this listing.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

  const response = await fetch(`${getApiBaseUrl()}/rent-listings/${resolvedListingId}/report`, {
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
      throw new Error(extractApiErrorMessage(data, 'You cannot report your own rent listing.'));
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to report rent listing'));
  }

  return {
    message: data?.message || 'Rent listing reported successfully',
    reportId: Number(data?.report_id ?? 0),
  };
};

export const getAdminRentListings = async (token) => {
  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/rent-listings`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch admin rent listings'));
  }

  if (Array.isArray(data?.listings)) {
    return data.listings;
  }

  return [];
};

export const hideAdminRentListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for deletion.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before hiding this listing.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/rent-listings/${resolvedListingId}`, {
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
      throw new Error('You are not authorized to hide rent listings.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to hide rent listing'));
  }

  return {
    message: data?.message || 'Rent listing removed from feed',
    listing: data?.listing || null,
  };
};

export const banRentListingOwner = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid rent listing selected for user ban.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before banning this user.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/rent-listings/${resolvedListingId}/ban-user`, {
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
      throw new Error('You are not authorized to ban landlords.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to ban landlord'));
  }

  return {
    message: data?.message || 'Landlord banned successfully',
    affectedListings: Number(data?.affected_listings ?? 0),
    seller: data?.seller || null,
  };
};
