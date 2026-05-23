import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

export type AdminRestaurantStatus = 'pending' | 'approved' | 'rejected';

export type AdminRestaurantRecord = {
  id: number;
  name: string;
  category: string;
  location: string;
  address: string;
  owner_name: string | null;
  phone: string;
  website: string | null;
  status: AdminRestaurantStatus;
  is_verified: boolean;
  created_at: string;
};

type AdminRestaurantListResponse = {
  success?: boolean;
  message?: string;
  data?: AdminRestaurantRecord[];
};

type AdminRestaurantUpdateResponse = {
  success?: boolean;
  message?: string;
  data?: {
    restaurant?: AdminRestaurantRecord;
  };
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

  const payload = error.response?.data as { message?: string } | undefined;
  return payload?.message || error.message || fallback;
};

export const fetchAdminRestaurants = async (
  mode: 'requests' | 'all',
): Promise<AdminRestaurantRecord[]> => {
  try {
    const response = await apiClient.get<AdminRestaurantListResponse>('/admin/restaurants');
    const list = Array.isArray(response.data?.data) ? response.data.data : [];

    if (mode === 'requests') {
      return list.filter((item) => item.status === 'pending');
    }

    return list;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not load restaurant moderation list.'));
  }
};

export const updateAdminRestaurantStatus = async (
  restaurantId: number,
  status: AdminRestaurantStatus,
): Promise<AdminRestaurantRecord> => {
  try {
    const response = await apiClient.patch<AdminRestaurantUpdateResponse>(
      `/admin/restaurants/${restaurantId}/status`,
      { status },
    );

    const restaurant = response.data?.data?.restaurant;
    if (!restaurant) {
      throw new Error('Updated restaurant payload was not returned.');
    }

    return restaurant;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not update restaurant status.'));
  }
};
