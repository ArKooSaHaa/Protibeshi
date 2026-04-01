import axios, { AxiosError } from 'axios';
import { ENV } from '@/config/env';
import { getBearerTokenHeader } from '@/features/auth/utils/tokenStorage';
import type { AdminFeedPost } from '../types/adminFeed.types';

type AdminFeedApiPayload = {
  success?: boolean;
  message?: string;
  posts?: AdminFeedPost[];
  post?: AdminFeedPost;
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

  const payload = error.response?.data as AdminFeedApiPayload | undefined;
  return payload?.message || error.message || fallback;
};

export const fetchAdminFeedPosts = async (): Promise<AdminFeedPost[]> => {
  try {
    const response = await apiClient.get<AdminFeedApiPayload>('/admin/posts');
    return Array.isArray(response.data.posts) ? response.data.posts : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not load moderation posts.'));
  }
};

export const verifyAdminFeedPost = async (postId: string): Promise<AdminFeedPost> => {
  try {
    const response = await apiClient.post<AdminFeedApiPayload>(`/admin/posts/${postId}/verify`);

    if (!response.data.post) {
      throw new Error('Updated post payload was not returned.');
    }

    return response.data.post;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not verify post.'));
  }
};

export const ignoreAdminFeedReports = async (postId: string): Promise<AdminFeedPost> => {
  try {
    const response = await apiClient.post<AdminFeedApiPayload>(`/admin/posts/${postId}/ignore-reports`);

    if (!response.data.post) {
      throw new Error('Updated post payload was not returned.');
    }

    return response.data.post;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not ignore reports.'));
  }
};

export const deleteAdminFeedPost = async (postId: string): Promise<AdminFeedPost> => {
  try {
    const response = await apiClient.delete<AdminFeedApiPayload>(`/admin/posts/${postId}`);

    if (!response.data.post) {
      throw new Error('Deleted post payload was not returned.');
    }

    return response.data.post;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Could not delete post.'));
  }
};
