import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';

export type ReliefApiUser = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
};

export type ReliefApiItem = {
  id: number;
  user_id: number;
  title: string;
  type: string;
  description: string;
  urgency: string;
  time_sensitivity: string | null;
  visibility: string;
  contact_preference: string;
  location: string;
  status: string;
  helpers_count: number;
  has_offered_help?: boolean;
  created_at: string;
  updated_at: string;
  user?: ReliefApiUser | null;
};

export type CreateReliefPayload = {
  title: string;
  type: string;
  description: string;
  urgency: string;
  time_sensitivity?: string;
  visibility: string;
  contact_preference: string;
  location: string;
};

export class ReliefApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ReliefApiError';
    this.status = status;
    this.data = data;
  }
}

const reliefClient = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api`,
  headers: {
    Accept: 'application/json',
  },
});

reliefClient.interceptors.request.use((config) => {
  const bearerToken = getBearerTokenHeader();

  if (bearerToken) {
    config.headers.Authorization = bearerToken;
  }

  return config;
});

const toReliefApiError = (error: unknown, fallback: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status ?? 500;
    const data = axiosError.response?.data ?? null;
    const message = data?.message || axiosError.message || fallback;
    throw new ReliefApiError(message, status, data);
  }

  throw new ReliefApiError(fallback, 500, null);
};

export const getReliefs = async (): Promise<ReliefApiItem[]> => {
  try {
    const response = await reliefClient.get<{ reliefs?: ReliefApiItem[] }>('/reliefs');
    return Array.isArray(response.data?.reliefs) ? response.data.reliefs : [];
  } catch (error) {
    return toReliefApiError(error, 'Failed to fetch relief requests');
  }
};

export const getRelief = async (id: number | string): Promise<ReliefApiItem | null> => {
  try {
    const response = await reliefClient.get<{ relief?: ReliefApiItem }>(`/reliefs/${id}`);
    return response.data?.relief || null;
  } catch (error) {
    return toReliefApiError(error, 'Failed to fetch relief request');
  }
};

export const createRelief = async (data: CreateReliefPayload): Promise<ReliefApiItem | null> => {
  try {
    const response = await reliefClient.post<{ relief?: ReliefApiItem }>('/reliefs', data);
    return response.data?.relief || null;
  } catch (error) {
    return toReliefApiError(error, 'Failed to create relief request');
  }
};

export const offerHelp = async (id: number | string): Promise<ReliefApiItem | null> => {
  try {
    const response = await reliefClient.post<{ relief?: ReliefApiItem }>(`/reliefs/${id}/offer-help`);
    return response.data?.relief || null;
  } catch (error) {
    return toReliefApiError(error, 'Failed to offer help');
  }
};

export const deleteRelief = async (id: number | string): Promise<{ success?: boolean; message?: string }> => {
  try {
    const response = await reliefClient.delete<{ success?: boolean; message?: string }>(`/reliefs/${id}`);
    return response.data || {};
  } catch (error) {
    return toReliefApiError(error, 'Failed to delete relief request');
  }
};
