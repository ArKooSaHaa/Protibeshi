import axios from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

export type AccountProfileApi = {
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
};

type AccountProfileResponse = {
  status: string;
  message?: string;
  data?: {
    user?: AccountProfileApi;
  };
};

type UpdateAccountProfilePayload = {
  full_name?: string;
  username?: string;
  phone?: string;
  city?: string;
  neighborhood?: string;
  full_address?: string;
  bio?: string;
  profile_picture?: string;
};

type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
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

const getUserFromResponse = (response: AccountProfileResponse): AccountProfileApi => {
  const user = response.data?.user;

  if (!user) {
    throw new Error('Profile response is missing user data.');
  }

  return user;
};

export const fetchAccountProfile = async (): Promise<AccountProfileApi> => {
  const response = await axios.get<AccountProfileResponse>('/api/account/profile', getRequestConfig());
  return getUserFromResponse(response.data);
};

export const updateAccountProfile = async (payload: UpdateAccountProfilePayload): Promise<AccountProfileApi> => {
  const response = await axios.put<AccountProfileResponse>('/api/account/profile', payload, getRequestConfig());
  return getUserFromResponse(response.data);
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await axios.post('/api/account/change-password', payload, getRequestConfig());
};

type DeleteAccountPayload = {
  password: string;
  confirmation: string;
};

export const deleteAccount = async (payload: DeleteAccountPayload): Promise<void> => {
  await axios.delete('/api/account', {
    ...getRequestConfig(),
    data: payload,
  });
};

export const getAccountErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseData = error.response?.data as {
    message?: string;
    errors?: Record<string, string[] | string>;
  } | undefined;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] || responseData.message || fallback;
    }

    return firstError || responseData.message || fallback;
  }

  return responseData?.message || error.message || fallback;
};