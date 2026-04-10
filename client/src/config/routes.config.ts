/**
 * Application Routes Configuration
 * Centralized route definitions
 */

export const ROUTES = {
  HOME: '/',
  ADMIN_AUTH: '/admin/auth',
  FEED: '/feed',
  ADMIN_FEED: '/admin/feed',
  MESSAGES: '/messages',
  MARKETPLACE: '/marketplace',
  RENT: '/rent',
  SERVICES: '/services',
  COMPLAINTS: '/complaints',
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  RELIEF: '/relief',
  ACCOUNT: '/account',
  NOT_FOUND: '*',
} as const;

export type RouteKey = keyof typeof ROUTES;
