// src/features/auth/store/authStore.ts
import { create } from 'zustand';

export type AuthStatus = 'idle' | 'typing' | 'error' | 'loading' | 'success' | 'redirect';

export type SignInPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type AuthStoreState = {
  status: AuthStatus;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  submittedEmail: string | null;
  startTyping: () => void;
  startSubmit: () => void;
  submitFailure: (message: string) => void;
  submitSuccess: (email: string) => void;
  startRedirect: () => void;
  resetStatus: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'idle',
  isAuthenticated: false,
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
  submitSuccess: (email) => {
    set({
      status: 'success',
      isAuthenticated: true,
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
  resetStatus: () => {
    set({
      status: 'idle',
      isSubmitting: false,
      errorMessage: null,
      submittedEmail: null,
    });
  },
}));
