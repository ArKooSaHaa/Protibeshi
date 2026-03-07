/**
 * Application Routes Configuration
 * Centralized route definitions
 */

export const ROUTES = {
  HOME: '/',
  FEED: '/feed',
  MARKETPLACE: '/marketplace',
  RENT: '/rent',
  SERVICES: '/services',
  COMPLAINTS: '/complaints',
  AUTH: '/auth',
  LOGIN: '/auth/login',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  REGISTER: '/auth/register',
  SESSIONS: '/sessions',
  SESSION_DETAIL: '/sessions/:id',
  DASHBOARD: '/dashboard',
  RELIEF: '/relief',
  ACCOUNT: '/account',
  NOT_FOUND: '*',
} as const;

export type RouteKey = keyof typeof ROUTES;
