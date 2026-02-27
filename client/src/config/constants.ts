/**
 * Global Application Constants
 */

export const APP = {
  NAME: 'Protibeshi',
  VERSION: '1.0.0',
  DESCRIPTION: 'Protibeshi',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const TIMING = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  DEBOUNCE_DELAY: 300,
  FETCH_RETRY_DELAY: 1000,
} as const;

export const API_ENDPOINTS = {
  SESSIONS: '/api/sessions',
  USERS: '/api/users',
  AUTH: '/api/auth',
} as const;
