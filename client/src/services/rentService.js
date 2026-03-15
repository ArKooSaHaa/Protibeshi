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
