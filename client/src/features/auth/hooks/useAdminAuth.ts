import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { ENV } from '@/config/env';
import { useAuthStore } from '../store/authStore';

type AdminAuthValues = {
  email: string;
  password: string;
};

type AdminAuthFieldErrors = Partial<Record<'email' | 'password', string>>;

export type UseAdminAuthResult = {
  values: AdminAuthValues;
  errors: AdminAuthFieldErrors;
  isPasswordVisible: boolean;
  isValid: boolean;
  adminEmail: string;
  adminPassword: string;
  status: ReturnType<typeof useAuthStore.getState>['status'];
  isSubmitting: boolean;
  globalError: string | null;
  submittedEmail: string | null;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  togglePasswordVisibility: () => void;
  fillAdminCredentials: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@123';

type AdminSigninResponse = {
  status: string;
  message: string;
  token?: string;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
};

const delay = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms);
});

const getAdminSigninUrl = () => {
  if (window.location.port === '8000') {
    return `${window.location.origin}/api/admin/signin`;
  }

  return `${ENV.API_BASE_URL}/api/admin/signin`;
};

const sanitizeEmailInput = (value: string): string => value.trim().toLowerCase();
const sanitizePasswordInput = (value: string): string => value.trim();

const validate = (values: AdminAuthValues): AdminAuthFieldErrors => {
  const nextErrors: AdminAuthFieldErrors = {};

  if (!EMAIL_REGEX.test(values.email)) {
    nextErrors.email = 'Enter a valid admin email.';
  }

  if (values.password.length < PASSWORD_MIN_LENGTH) {
    nextErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return nextErrors;
};

export const useAdminAuth = (): UseAdminAuthResult => {
  const [values, setValues] = useState<AdminAuthValues>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<AdminAuthFieldErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const globalError = useAuthStore((state) => state.errorMessage);
  const submittedEmail = useAuthStore((state) => state.submittedEmail);
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

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous);
  }, []);

  const fillAdminCredentials = useCallback(() => {
    setValues({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    setErrors({});
    startTyping();
  }, [startTyping]);

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
        submitFailure('Please check your admin credentials.');
        return;
      }

      setErrors({});
      startSubmit();

      await delay(200);

      try {
        const endpoint = getAdminSigninUrl();
        const response = await axios.post<AdminSigninResponse>(endpoint, {
          email: values.email,
          password: values.password,
        });

        const token = response.data?.token;

        if (!token) {
          submitFailure('Admin login succeeded but no token was returned.');
          return;
        }

        submitSuccess(values.email, token, 'admin');

        redirectTimerRef.current = window.setTimeout(() => {
          startRedirect();
        }, 380);
      } catch (error: unknown) {
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
            submitFailure(responseData?.message || 'Invalid admin email or password.');
            return;
          }

          if (error.response?.status === 422) {
            submitFailure(validationMessage || responseData?.message || 'Validation failed.');
            return;
          }

          if ((error.response?.status ?? 500) >= 500) {
            submitFailure('Server error. Please try again in a moment.');
            return;
          }

          submitFailure(responseData?.message || validationMessage || 'Unable to sign in right now.');
          return;
        }

        submitFailure('Unable to sign in right now.');
      }
    },
    [isSubmitting, startRedirect, startSubmit, submitFailure, submitSuccess, values],
  );

  return {
    values,
    errors,
    isPasswordVisible,
    isValid,
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    status,
    isSubmitting,
    globalError,
    submittedEmail,
    onEmailChange,
    onPasswordChange,
    togglePasswordVisibility,
    fillAdminCredentials,
    onSubmit,
  };
};
