// src/features/auth/hooks/useSignIn.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { ENV } from '@/config/env';
import { useAuthStore } from '../store/authStore';

type SignInResponse = {
  status: string;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
  };
};

type SignInFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type SignInFieldErrors = Partial<Record<'email' | 'password', string>>;

export type UseSignInResult = {
  values: SignInFormValues;
  errors: SignInFieldErrors;
  isPasswordVisible: boolean;
  isValid: boolean;
  status: ReturnType<typeof useAuthStore.getState>['status'];
  isSubmitting: boolean;
  submittedEmail: string | null;
  globalError: string | null;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRememberMeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  togglePasswordVisibility: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 6;

const sanitizeEmailInput = (value: string): string => {
  return value.trim().toLowerCase();
};

const sanitizePasswordInput = (value: string): string => {
  return value.trim();
};

const validate = (values: SignInFormValues): SignInFieldErrors => {
  const nextErrors: SignInFieldErrors = {};

  if (!EMAIL_REGEX.test(values.email)) {
    nextErrors.email = 'Enter a valid email address.';
  }

  if (values.password.length < PASSWORD_MIN_LENGTH) {
    nextErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return nextErrors;
};

const getSigninUrl = () => {
  if (window.location.port === '8000') {
    return `${window.location.origin}/api/signin`;
  }

  return `${ENV.API_BASE_URL}/api/signin`;
};

export const useSignIn = (): UseSignInResult => {
  const [values, setValues] = useState<SignInFormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<SignInFieldErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const submittedEmail = useAuthStore((state) => state.submittedEmail);
  const globalError = useAuthStore((state) => state.errorMessage);
  const startTyping = useAuthStore((state) => state.startTyping);
  const startSubmit = useAuthStore((state) => state.startSubmit);
  const submitFailure = useAuthStore((state) => state.submitFailure);
  const submitSuccess = useAuthStore((state) => state.submitSuccess);
  const startRedirect = useAuthStore((state) => state.startRedirect);
  const resetStatus = useAuthStore((state) => state.resetStatus);

  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      resetStatus();
    };
  }, [resetStatus]);

  const onEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = sanitizeEmailInput(event.target.value);

      setValues((previous) => ({ ...previous, email: nextValue }));
      setErrors((previous) => ({ ...previous, email: undefined }));
      startTyping();
    },
    [startTyping],
  );

  const onPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = sanitizePasswordInput(event.target.value);

      setValues((previous) => ({ ...previous, password: nextValue }));
      setErrors((previous) => ({ ...previous, password: undefined }));
      startTyping();
    },
    [startTyping],
  );

  const onRememberMeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((previous) => ({ ...previous, rememberMe: event.target.checked }));
      startTyping();
    },
    [startTyping],
  );

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous);
  }, []);

  const isValid = Object.keys(validate(values)).length === 0;

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      const nextErrors = validate(values);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        submitFailure('Please fix the highlighted fields.');
        return;
      }

      setErrors({});
      startSubmit();

      try {
        const signinUrl = getSigninUrl();

        console.info('[Auth] Sending signin request', { url: signinUrl, email: values.email });

        const response = await axios.post<SignInResponse>(signinUrl, {
          email: values.email,
          password: values.password,
        });

        const token = response.data?.token;

        if (!token) {
          submitFailure('Login succeeded but no token was returned by the server.');
          return;
        }

        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        console.info('[Auth] Authorization header prepared from login token');

        console.info('[Auth] Signin response received', {
          status: response.status,
          apiStatus: response.data?.status,
          hasToken: Boolean(token),
        });

        submitSuccess(values.email, token, 'user');

        redirectTimerRef.current = window.setTimeout(() => {
          startRedirect();
        }, 650);
      } catch (error: unknown) {
        console.error('[Auth] Signin request failed', error);

        if (axios.isAxiosError(error)) {
          const responseData = error.response?.data as {
            message?: string;
            errors?: Record<string, string[] | string>;
          } | undefined;

          const firstValidationError = responseData?.errors
            ? Object.values(responseData.errors)[0]
            : undefined;

          const validationMessage = Array.isArray(firstValidationError)
            ? firstValidationError[0]
            : firstValidationError;

          if (error.response?.status === 401) {
            submitFailure(responseData?.message || 'Invalid email or password');
            return;
          }

          if (error.response?.status === 422) {
            submitFailure(validationMessage || responseData?.message || 'Validation failed');
            return;
          }

          if ((error.response?.status ?? 500) >= 500) {
            submitFailure('Server error. Please try again in a moment.');
            return;
          }

          submitFailure(responseData?.message || validationMessage || 'Unable to sign in right now. Please try again.');
          return;
        }

        submitFailure('Unable to sign in right now. Please try again.');
      }
    },
    [isSubmitting, startRedirect, startSubmit, submitFailure, submitSuccess, values],
  );

  return {
    values,
    errors,
    isPasswordVisible,
    isValid,
    status,
    isSubmitting,
    submittedEmail,
    globalError,
    onEmailChange,
    onPasswordChange,
    onRememberMeChange,
    togglePasswordVisibility,
    onSubmit,
  };
};
