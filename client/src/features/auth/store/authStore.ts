// src/features/auth/store/authStore.ts
import { create } from 'zustand';
import axios from 'axios';
import {
  clearStoredAuthRole,
  clearStoredToken,
  getStoredAuthRole,
  getStoredToken,
  setStoredAuthRole,
  setStoredToken,
  type StoredAuthRole,
} from '../utils/tokenStorage';

export type AuthStatus = 'idle' | 'typing' | 'error' | 'loading' | 'success' | 'redirect';
export type AuthRole = StoredAuthRole;

export type SignInPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type AuthStoreState = {
  status: AuthStatus;
  isAuthenticated: boolean;
  token: string | null;
  role: AuthRole | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  submittedEmail: string | null;
  startTyping: () => void;
  startSubmit: () => void;
  submitFailure: (message: string) => void;
  submitSuccess: (email: string, token: string, role?: AuthRole) => void;
  submitSignupSuccess: (email: string) => void;
  startRedirect: () => void;
  logout: () => void;
  resetStatus: () => void;
};

const initialToken = getStoredToken();
const initialRole: AuthRole | null = initialToken ? (getStoredAuthRole() ?? 'user') : null;

if (initialToken) {
  axios.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'idle',
  isAuthenticated: Boolean(initialToken),
  token: initialToken,
  role: initialRole,
  isSubmitting: false,
  errorMessage: null,
  submittedEmail: null,
  startTyping: () => {
    set((state) => {
      if (state.isSubmitting) {
        return state;
      }

      return {
        ...state,
        status: 'typing',
        errorMessage: null,
      };
    });
  },
  startSubmit: () => {
    set({
      status: 'loading',
      isSubmitting: true,
      errorMessage: null,
    });
  },
  submitFailure: (message) => {
    set({
      status: 'error',
      isSubmitting: false,
      errorMessage: message,
    });
  },
  submitSuccess: (email, token, role = 'user') => {
    setStoredToken(token);
    setStoredAuthRole(role);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;

    set({
      status: 'success',
      isAuthenticated: true,
      token,
      role,
      isSubmitting: false,
      errorMessage: null,
      submittedEmail: email,
    });
  },
  submitSignupSuccess: (email) => {
    set({
      status: 'success',
      isAuthenticated: false,
      role: null,
      isSubmitting: false,
      errorMessage: null,
      submittedEmail: email,
    });
  },
  startRedirect: () => {
    set({
      status: 'redirect',
      isSubmitting: false,
    });
  },
  logout: () => {
    clearStoredToken();
    clearStoredAuthRole();
    delete axios.defaults.headers.common.Authorization;

    set({
      status: 'idle',
      isAuthenticated: false,
      token: null,
      role: null,
      isSubmitting: false,
      errorMessage: null,
      submittedEmail: null,
    });
  },
  resetStatus: () => {
    set({
      status: 'idle',
      isSubmitting: false,
      errorMessage: null,
      submittedEmail: null,
    });
  },
}));
