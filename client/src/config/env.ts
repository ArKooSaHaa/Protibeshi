/**
 * Environment Configuration
 * Load environment variables with proper typing
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  APP_ENV: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.DEV,
} as const;

export const validateEnv = () => {
  if (!ENV.API_BASE_URL) {
    console.warn('VITE_API_URL not set, using default');
  }
};
