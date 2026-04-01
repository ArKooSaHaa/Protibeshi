const DEFAULT_API_BASE = 'http://127.0.0.1:8000';

export type FeedUser = {
  id: number;
  name: string;
};

export type FeedComment = {
  id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: FeedUser | null;
};

export type FeedPost = {
  id: number;
  title: string;
  short_description: string | null;
  content: string;
  label: string | null;
  image: string | null;
  post_type: string;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count?: number;
  moderation_status?: 'pending' | 'verified' | 'reported';
  location: string | null;
  distance: number | null;
  created_at: string;
  updated_at: string;
  user: FeedUser | null;
  comments?: FeedComment[];
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: BodyInit;
  protected?: boolean;
  headers?: Record<string, string>;
};

type ApiErrorDetails = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export class FeedApiError extends Error {
  status: number;
  data: ApiErrorDetails | null;

  constructor(message: string, status: number, data: ApiErrorDetails | null) {
    super(message);
    this.name = 'FeedApiError';
    this.status = status;
    this.data = data;
  }
}

const getApiBaseUrl = () => {
  const envApi = import.meta.env.VITE_API_URL;

  if (envApi) {
    return envApi;
  }

  return DEFAULT_API_BASE;
};

const normalizeTokenValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
};

const parseJsonSafely = (value: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getNestedToken = (source: Record<string, unknown> | null): string | null => {
  if (!source) {
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

  const state = source.state;
  if (state && typeof state === 'object') {
    return getNestedToken(state as Record<string, unknown>);
  }

  return null;
};

const getToken = () => {
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
    const parsed = parseJsonSafely(window.localStorage.getItem(key));
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

const buildHeaders = (isProtected: boolean, customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders || {}),
  };

  if (isProtected) {
    const token = getToken();
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

  let data: ApiErrorDetails | null = null;
  try {
    data = (await response.json()) as ApiErrorDetails;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Request failed with status ${response.status}`;
    throw new FeedApiError(errorMessage, response.status, data);
  }

  return data as T;
};

const normalizePosts = (payload: unknown): FeedPost[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const typed = payload as { posts?: unknown };
  if (Array.isArray(typed.posts)) {
    return typed.posts as FeedPost[];
  }

  return [];
};

export const resolvePostImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const baseUrl = getApiBaseUrl();
  if (imagePath.startsWith('/storage/')) {
    return `${baseUrl}${imagePath}`;
  }

  if (imagePath.startsWith('storage/')) {
    return `${baseUrl}/${imagePath}`;
  }

  return `${baseUrl}/storage/posts/${imagePath}`;
};

export const getPosts = async (): Promise<FeedPost[]> => {
  const response = await request<{ posts?: FeedPost[] }>('/posts');
  return normalizePosts(response);
};

export const getPost = async (id: number | string): Promise<FeedPost> => {
  const response = await request<{ post?: FeedPost; data?: { post?: FeedPost } }>(`/posts/${id}`);
  return response.post || response.data?.post || ({} as FeedPost);
};

export const createPost = async (formData: FormData): Promise<FeedPost> => {
  const response = await request<{ post: FeedPost }>('/posts', {
    method: 'POST',
    body: formData,
    protected: true,
  });

  return response.post;
};

export const deletePost = async (id: number | string): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/posts/${id}`, {
    method: 'DELETE',
    protected: true,
  });
};

export const likePost = async (id: number | string): Promise<{ liked: boolean; likes_count: number }> => {
  const response = await request<{
    liked?: boolean;
    likes_count?: number;
    data?: { liked?: boolean; likes_count?: number };
  }>(`/posts/${id}/like`, {
    method: 'POST',
    protected: true,
  });

  return {
    liked: response.liked ?? response.data?.liked ?? false,
    likes_count: response.likes_count ?? response.data?.likes_count ?? 0,
  };
};

export const commentPost = async (
  id: number | string,
  comment: string,
): Promise<{ comments_count: number; comment: FeedComment }> => {
  const response = await request<{
    comments_count?: number;
    comment?: FeedComment;
    data?: { comments_count?: number; comment?: FeedComment };
  }>(`/posts/${id}/comment`, {
    method: 'POST',
    protected: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });

  return {
    comments_count: response.comments_count ?? response.data?.comments_count ?? 0,
    comment: response.comment ?? response.data?.comment ?? ({} as FeedComment),
  };
};

export const savePost = async (id: number | string): Promise<{ saved: boolean }> => {
  const response = await request<{ saved?: boolean; data?: { saved?: boolean } }>(`/posts/${id}/save`, {
    method: 'POST',
    protected: true,
  });

  return {
    saved: response.saved ?? response.data?.saved ?? false,
  };
};

export const reportPost = async (id: number | string, reason: string): Promise<{ success: boolean; message: string }> => {
  return request<{ success: boolean; message: string }>(`/posts/${id}/report`, {
    method: 'POST',
    protected: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
};