import { getBackendOrigin, resolveMediaUrl } from '@/lib/mediaUrl';
import { getStoredToken } from '@/features/auth/utils/tokenStorage';
import type { Restaurant, RestaurantCategory, PriceRange } from '@/components/food-corner/types';
import type { RestaurantFormValues } from '@/components/food-corner/RestaurantForm';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

export type ApiRestaurant = {
  id: number;
  name: string;
  slug: string;
  category: string;
  location: string;
  address: string;
  phone: string;
  website: string | null;
  opening_time: string | null;
  closing_time: string | null;
  price_range: string;
  delivery_available: boolean;
  image_url: string | null;
  cover_image_url: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  status: string;
  views_count: number;
  is_favorited?: boolean;
  created_at: string;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
  errors?: Record<string, string[]>;
};

export class RestaurantApiError extends Error {
  status: number;
  data: ApiEnvelope<unknown> | null;

  constructor(message: string, status: number, data: ApiEnvelope<unknown> | null) {
    super(message);
    this.name = 'RestaurantApiError';
    this.status = status;
    this.data = data;
  }
}

export type RestaurantListParams = {
  q?: string;
  category?: string;
  location?: string;
  price_range?: string;
  delivery_available?: boolean;
  verified_only?: boolean;
  top_rated?: boolean;
  newest?: boolean;
  per_page?: number;
  page?: number;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: BodyInit;
  protected?: boolean;
  headers?: Record<string, string>;
};

const getApiBaseUrl = () => getBackendOrigin();

const buildHeaders = (isProtected: boolean, customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders || {}),
  };

  if (isProtected) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    protected: protectedRoute = false,
    headers: customHeaders,
  } = options;

  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    method,
    headers: buildHeaders(protectedRoute, customHeaders),
    body,
  });

  let data: ApiEnvelope<unknown> | null = null;
  try {
    data = (await response.json()) as ApiEnvelope<unknown>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new RestaurantApiError(message, response.status, data);
  }

  return data as T;
};

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isRestaurantOpen = (
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
): boolean => {
  if (!openingTime || !closingTime) {
    return true;
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(openingTime);
  const closeMinutes = parseTimeToMinutes(closingTime);

  if (openMinutes <= closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  }

  return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
};

export const mapApiRestaurantToUi = (api: ApiRestaurant): Restaurant => {
  const imageUrl =
    resolveMediaUrl(api.image_url) ||
    resolveMediaUrl(api.cover_image_url) ||
    FALLBACK_IMAGE;

  return {
    id: String(api.id),
    name: api.name,
    category: api.category as RestaurantCategory,
    location: api.location,
    rating: Number(api.rating) || 0,
    reviews: Number(api.total_reviews) || 0,
    eta: api.delivery_available ? 'Delivery available' : 'Pickup only',
    distanceKm: 0,
    priceRange: (api.price_range || '$$') as PriceRange,
    imageUrl,
    isOpen: isRestaurantOpen(api.opening_time, api.closing_time),
    isTrending: api.is_verified || Number(api.rating) >= 4.5,
    tags: [
      ...(api.delivery_available ? ['Delivery'] : []),
      ...(api.is_verified ? ['Verified'] : []),
    ],
    isSaved: Boolean(api.is_favorited),
  };
};

export const getRestaurants = async (
  params: RestaurantListParams = {},
): Promise<{ restaurants: Restaurant[]; pagination: PaginationMeta | null }> => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (typeof value === 'boolean') {
      searchParams.set(key, value ? '1' : '0');
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  const path = `/restaurants${query ? `?${query}` : ''}`;

  const hasToken = Boolean(getStoredToken());
  const response = await request<ApiEnvelope<ApiRestaurant[]>>(path, {
    protected: hasToken,
  });

  const list = Array.isArray(response.data) ? response.data : [];

  return {
    restaurants: list.map(mapApiRestaurantToUi),
    pagination: response.meta?.pagination ?? null,
  };
};

export const createRestaurant = async (values: RestaurantFormValues): Promise<Restaurant> => {
  const formData = new FormData();
  formData.append('name', values.name.trim());
  if (values.owner.trim()) {
    formData.append('owner_name', values.owner.trim());
  }
  formData.append('category', values.category);
  formData.append('address', values.address.trim());
  formData.append('location', values.location);
  formData.append('phone', values.phone.trim());
  if (values.website.trim()) {
    formData.append('website', values.website.trim());
  }
  if (values.openingTime) {
    formData.append('opening_time', values.openingTime);
  }
  if (values.closingTime) {
    formData.append('closing_time', values.closingTime);
  }
  formData.append('description', values.description.trim());
  if (values.image) {
    formData.append('image', values.image);
  }

  const response = await request<ApiEnvelope<ApiRestaurant>>('/restaurants', {
    method: 'POST',
    body: formData,
    protected: true,
  });

  return mapApiRestaurantToUi(response.data);
};

export const addRestaurantFavorite = async (restaurantId: string | number): Promise<void> => {
  await request<ApiEnvelope<unknown>>(`/restaurants/${restaurantId}/favorite`, {
    method: 'POST',
    protected: true,
  });
};

export const removeRestaurantFavorite = async (restaurantId: string | number): Promise<void> => {
  await request<ApiEnvelope<unknown>>(`/restaurants/${restaurantId}/favorite`, {
    method: 'DELETE',
    protected: true,
  });
};
