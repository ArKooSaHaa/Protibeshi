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
  const storageBase = getStorageBaseUrl();
  const coverPhotoPath = raw?.cover_photo || null;
  const userProfilePictureUrl = raw?.user?.profile_picture_url || null;

  return {
    id: String(raw?.id ?? ''),
    ownerId: raw?.user?.id ?? null,
    providerName: buildProviderName(raw?.user),
    avatar: userProfilePictureUrl
      || (coverPhotoPath ? `${storageBase}/storage/${coverPhotoPath}` : 'https://i.pravatar.cc/120?img=11'),
    coverPhoto: coverPhotoPath,
    coverPhotoUrl: coverPhotoPath ? `${storageBase}/storage/${coverPhotoPath}` : null,
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
    gallery: coverPhotoPath ? [`${storageBase}/storage/${coverPhotoPath}`] : [],
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
