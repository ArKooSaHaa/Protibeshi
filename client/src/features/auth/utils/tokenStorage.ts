const TOKEN_STORAGE_KEY = 'token';
const AUTH_ROLE_STORAGE_KEY = 'auth_role';

export type StoredAuthRole = 'user' | 'admin';

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

export const getStoredAuthRole = (): StoredAuthRole | null => {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  if (value === 'admin' || value === 'user') {
    return value;
  }

  return null;
};

export const setStoredAuthRole = (role: StoredAuthRole) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
};

export const clearStoredAuthRole = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
};

export const getBearerTokenHeader = (): string | null => {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  return `Bearer ${token}`;
};
