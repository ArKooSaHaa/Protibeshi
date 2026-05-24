/**
 * Environment Configuration
 * Load environment variables with proper typing
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  GOOGLE_MAPS_API_KEY: String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim(),
  OPENWEATHER_API_KEY: String(import.meta.env.VITE_OPENWEATHER_API_KEY || '').trim(),
  GEMINI_API_KEY: String(import.meta.env.VITE_GEMINI_API_KEY || '').trim(),
  GROQ_CLOUD_API_KEY: String(import.meta.env.VITE_GROQ_CLOUD_API_KEY || '').trim(),
  APP_ENV: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.DEV,
} as const;

export const validateEnv = () => {
  if (!ENV.API_BASE_URL) {
    console.warn('VITE_API_URL not set, using default');
  }

  if (!ENV.GOOGLE_MAPS_API_KEY) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY not set, Google Maps location helpers will be disabled');
  }

  if (!ENV.OPENWEATHER_API_KEY) {
    console.warn('VITE_OPENWEATHER_API_KEY not set, feed weather panel will be disabled');
  }

  if (!ENV.GROQ_CLOUD_API_KEY) {
    console.warn('VITE_GROQ_CLOUD_API_KEY not set, Groq chat will be disabled');
  }
};
