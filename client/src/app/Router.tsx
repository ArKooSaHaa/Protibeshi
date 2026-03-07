import { Navigate, createBrowserRouter, RouteObject } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';
import { ROUTES } from '@/config/routes.config';
import { FeedPage } from '@/features/feed/pages/FeedPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { RentPage } from '@/features/rent/pages/RentPage';
import { ServicesPage } from '@/features/services/pages/ServicesPage';
import { ComplaintsPage } from '@/features/complaints/pages/ComplaintsPage';
import { ReliefPage } from '@/features/relief/pages/ReliefPage';
import { AccountPage } from '@/features/account';
import { SignInPage, SignUpPage } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/authStore';

const PublicLoginRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <SignInPage />;
};

const PublicSignUpRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.FEED} replace />;
  }

  return <SignUpPage />;
};

const ProtectedRootLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <RootLayout />;
};

const routes: RouteObject[] = [
  {
    path: ROUTES.LOGIN,
    element: <PublicLoginRoute />,
  },
  {
    path: ROUTES.SIGNIN,
    element: <PublicLoginRoute />,
  },
  {
    path: ROUTES.SIGNUP,
    element: <PublicSignUpRoute />,
  },
  {
    path: ROUTES.HOME,
    element: <ProtectedRootLayout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: ROUTES.FEED, element: <FeedPage /> },
      { path: ROUTES.MARKETPLACE, element: <MarketplacePage /> },
      { path: ROUTES.RENT, element: <RentPage /> },
      { path: ROUTES.SERVICES, element: <ServicesPage /> },
      { path: ROUTES.COMPLAINTS, element: <ComplaintsPage /> },
      { path: ROUTES.RELIEF, element: <ReliefPage /> },
      { path: ROUTES.ACCOUNT, element: <AccountPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
