import { ENV } from '@/config/env';
import { resolveMediaUrl } from '@/lib/mediaUrl';

const getConfiguredApiHost = () => String(ENV.API_BASE_URL || '').trim().replace(/\/$/, '');

const getApiBaseUrl = () => {
  return `${getConfiguredApiHost()}/api`;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch (error) {
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

const normalizeListingMedia = (listing) => {
  if (!listing || typeof listing !== 'object') {
    return listing;
  }

  const resolvedPhotoUrl = resolveMediaUrl(listing.photo_url) || resolveMediaUrl(listing.photo);

  return {
    ...listing,
    photo_url: resolvedPhotoUrl,
  };
};

const normalizeListingCollection = (listings) => {
  if (!Array.isArray(listings)) {
    return [];
  }

  return listings.map((listing) => normalizeListingMedia(listing));
};

export const createListing = async (formData, token) => {
  const response = await fetch(`${getApiBaseUrl()}/listings`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to create listing'));
  }

  return {
    message: data?.message || 'Listing created successfully',
    listing: normalizeListingMedia(data?.listing || null),
  };
};

export const getListings = async () => {
  const response = await fetch(`${getApiBaseUrl()}/listings`, {
    method: 'GET',
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(data, 'Failed to fetch listings'));
  }

  if (Array.isArray(data)) {
    return normalizeListingCollection(data);
  }

  return normalizeListingCollection(data?.listings ?? []);
};

export const deleteListing = async (listingId, token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid listing selected for deletion.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in again to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/listings/${resolvedListingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/json',
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

    if (response.status === 404) {
      throw new Error('Listing not found.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to delete listing'));
  }

  return {
    message: data?.message || 'Listing deleted successfully',
    listing: normalizeListingMedia(data?.listing || null),
  };
};

export const getAdminListings = async (token) => {
  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/listings`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to fetch admin listings'));
  }

  if (Array.isArray(data?.listings)) {
    return normalizeListingCollection(data.listings);
  }

  return [];
};

export const deleteAdminListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid listing selected for deletion.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before removing this listing.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/listings/${resolvedListingId}`, {
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
      throw new Error('You are not authorized to remove listings.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to delete listing'));
  }

  return {
    message: data?.message || 'Listing removed from marketplace',
    listing: normalizeListingMedia(data?.listing || null),
  };
};

export const banListingSeller = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid listing selected for user ban.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in as admin to continue.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) {
    throw new Error('Please provide a moderation message before banning this user.');
  }

  const response = await fetch(`${getApiBaseUrl()}/admin/listings/${resolvedListingId}/ban-user`, {
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
      throw new Error('Your admin session has expired. Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error('You are not authorized to ban users.');
    }

    throw new Error(extractApiErrorMessage(data, 'Failed to ban user'));
  }

  return {
    message: data?.message || 'User banned successfully',
    affectedListings: Number(data?.affected_listings ?? 0),
    seller: data?.seller || null,
  };
};

export const reportListing = async (listingId, reason = '', token) => {
  const resolvedListingId = Number(listingId);
  if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
    throw new Error('Invalid listing selected for report.');
  }

  const authToken = resolveAuthToken(token);
  if (!authToken) {
    throw new Error('Please sign in to report this listing.');
  }

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';

  const response = await fetch(`${getApiBaseUrl()}/listings/${resolvedListingId}/report`, {
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

    throw new Error(extractApiErrorMessage(data, 'Failed to report listing'));
  }

  return {
    message: data?.message || 'Listing reported successfully',
    reportId: data?.report_id ?? null,
  };
};
