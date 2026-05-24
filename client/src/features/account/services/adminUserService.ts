import axios from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

export type AdminUserRecord = {
  id: number | string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  full_address?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
  email_verified?: boolean;
  verification_status?: 'verified' | 'unverified';
  is_banned?: boolean;
  banned_at?: string | null;
  banned_until?: string | null;
  banned_reason?: string | null;
  posts_count?: number;
  listings_count?: number;
  services_count?: number;
  rent_listings_count?: number;
  complaints_count?: number;
  reliefs_count?: number;
};

export type AdminUserSummary = {
  total_users: number;
  filtered_users: number;
  verified_users: number;
  banned_users: number;
};

export type AdminUsersResponse = {
  status: string;
  data: {
    users: AdminUserRecord[];
    summary: AdminUserSummary;
    available_neighborhoods: string[];
    available_cities: string[];
  };
};

type AdminUserMutationResponse = {
  status: string;
  message?: string;
  data?: {
    user?: AdminUserRecord;
  };
};

export type AdminUsersQuery = {
  q?: string;
  city?: string;
  neighborhood?: string;
  verified_only?: boolean;
  banned_only?: boolean;
};

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.port === '8000') {
    return window.location.origin;
  }

  return ENV.API_BASE_URL;
};

const getRequestConfig = () => {
  const bearerToken = getBearerTokenHeader();

  return {
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: bearerToken } : {}),
    },
  };
};

export const getAdminUserErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data as { message?: string } | undefined;
  return responseData?.message || error.message || fallback;
};

export const fetchAdminUsers = async (query: AdminUsersQuery = {}): Promise<AdminUsersResponse['data']> => {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const endpoint = searchParams.toString() ? `/api/admin/users?${searchParams.toString()}` : '/api/admin/users';
  const response = await axios.get<AdminUsersResponse>(endpoint, getRequestConfig());

  if (response.data?.data) {
    return response.data.data;
  }

  throw new Error('Unable to load admin users.');
};

export const banAdminUser = async (
  userId: number | string,
  payload: { reason: string; duration_days?: number },
): Promise<AdminUserRecord> => {
  const response = await axios.post<AdminUserMutationResponse>(
    `/api/admin/users/${userId}/ban`,
    payload,
    getRequestConfig(),
  );

  if (response.data?.data?.user) {
    return response.data.data.user;
  }

  throw new Error(response.data?.message || 'Unable to ban user.');
};

export const unbanAdminUser = async (userId: number | string): Promise<AdminUserRecord> => {
  const response = await axios.post<AdminUserMutationResponse>(
    `/api/admin/users/${userId}/unban`,
    {},
    getRequestConfig(),
  );

  if (response.data?.data?.user) {
    return response.data.data.user;
  }

  throw new Error(response.data?.message || 'Unable to unban user.');
};
