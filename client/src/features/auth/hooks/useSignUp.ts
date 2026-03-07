import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpSchema } from '../schemas/signupSchema';
import { useAuthStore } from '../store/authStore';

type PasswordLevel = 'weak' | 'medium' | 'strong';

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const getPasswordScore = (password: string) => {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z\d]/.test(password),
  };
};

const getPasswordLevel = (password: string): PasswordLevel => {
  const score = Object.values(getPasswordScore(password)).filter(Boolean).length;

  if (score <= 2) {
    return 'weak';
  }

  if (score <= 4) {
    return 'medium';
  }

  return 'strong';
};

export const useSignUp = () => {
  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      city: '',
      neighborhood: '',
      password: '',
      confirmPassword: '',
      bio: '',
      profilePicture: null,
    },
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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

  const password = form.watch('password') ?? '';
  const passwordChecks = useMemo(() => getPasswordScore(password), [password]);
  const passwordLevel = useMemo(() => getPasswordLevel(password), [password]);

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      if (type === 'change' && !isSubmitting) {
        startTyping();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, isSubmitting, startTyping]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
      resetStatus();
    };
  }, [resetStatus]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    startSubmit();

    try {
      await wait(1000);
      submitSuccess(values.email.trim().toLowerCase());

      redirectTimerRef.current = window.setTimeout(() => {
        startRedirect();
      }, 750);
    } catch {
      submitFailure('Unable to create account at the moment. Please try again.');
    }
  });

  return {
    form,
    onSubmit,
    status,
    isSubmitting,
    submittedEmail,
    globalError,
    isPasswordVisible,
    isConfirmPasswordVisible,
    setIsPasswordVisible,
    setIsConfirmPasswordVisible,
    passwordLevel,
    passwordChecks,
  };
};
