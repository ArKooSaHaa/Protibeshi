// src/features/auth/hooks/useSignIn.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

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
const PASSWORD_MIN_LENGTH = 8;

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

const wait = (durationMs: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, durationMs);
});

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
        await wait(900);
        submitSuccess(values.email);

        redirectTimerRef.current = window.setTimeout(() => {
          startRedirect();
        }, 650);
      } catch {
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
