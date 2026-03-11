const TOKEN_STORAGE_KEY = 'token';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const getStoredToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredToken = (token: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const getBearerTokenHeader = (): string | null => {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  return `Bearer ${token}`;
};
