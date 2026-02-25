/**
 * API Client Configuration
 */

const createApiClient = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  return {
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

export const apiConfig = createApiClient();
