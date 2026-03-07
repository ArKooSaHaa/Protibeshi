import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';
import { AuthLayout } from '../components/AuthLayout';
import { SignInForm } from '../components/SignInForm';
import { useSignIn } from '../hooks/useSignIn';
import styles from './SignInPage.module.css';

export const SignInPage = () => {
  const signIn = useSignIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (signIn.status === 'redirect') {
      navigate(ROUTES.ACCOUNT, { replace: true });
    }
  }, [navigate, signIn.status]);

  return (
    <main className={styles.page}>
      <AuthLayout hasError={signIn.status === 'error'}>
        <SignInForm signIn={signIn} />
      </AuthLayout>
    </main>
  );
};
