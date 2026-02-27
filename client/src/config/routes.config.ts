/**
 * Application Routes Configuration
 * Centralized route definitions
 */

export const ROUTES = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  RENT: '/rent',
  SERVICES: '/services',
  COMPLAINTS: '/complaints',
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SESSIONS: '/sessions',
  SESSION_DETAIL: '/sessions/:id',
  DASHBOARD: '/dashboard',
  RELIEF: '/relief',
  NOT_FOUND: '*',
} as const;

export type RouteKey = keyof typeof ROUTES;
