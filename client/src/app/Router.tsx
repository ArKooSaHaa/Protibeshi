//client/src/app/Router.tsx
import type { ReactElement } from 'react';
import { Navigate, createBrowserRouter, RouteObject } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';
import { ROUTES } from '@/config/routes.config';
import { FeedPage } from '@/features/feed/pages/FeedPage';
import { MessagesPage } from '@/features/messages/pages/MessagesPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { RentPage } from '@/features/rent/pages/RentPage';
import { ServicesPage } from '@/features/services/pages/ServicesPage';
import { ComplaintsPage } from '@/features/complaints/pages/ComplaintsPage';
import { ReliefPage } from '@/features/relief/pages/ReliefPage';
import { AdminMarketplaceModerationPage } from '@/features/admin-marketplace';
import { AdminRentModerationPage } from '@/features/admin-rent';
import { AccountPage } from '@/features/account';
import { AdminFeedDashboardPage, AdminUnderConstructionPage } from '@/features/admin-feed';
import { AdminAuthPage, SignInPage, SignUpPage } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/authStore';

const getPostAuthRoute = (isAdmin: boolean) => (isAdmin ? ROUTES.ADMIN_FEED : ROUTES.HOME);

const AdminFeedRoute = ({ children }: { children: ReactElement }) => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <Navigate to={ROUTES.ADMIN_FEED} replace />;
  }

  return children;
};

const AdminWorkInProgressRoute = ({ children }: { children: ReactElement }) => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminUnderConstructionPage />;
  }

  return children;
};

const MarketplaceRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminMarketplaceModerationPage />;
  }

  return <MarketplacePage />;
};

const RentRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminRentModerationPage />;
  }

  return <RentPage />;
};

const PublicLoginRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.role === 'admin');

  if (isAuthenticated) {
    return <Navigate to={getPostAuthRoute(isAdmin)} replace />;
  }

  return <SignInPage />;
};

const PublicSignUpRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.role === 'admin');

  if (isAuthenticated) {
    return <Navigate to={getPostAuthRoute(isAdmin)} replace />;
  }

  return <SignUpPage />;
};

const PublicAdminAuthRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.role === 'admin');

  if (isAuthenticated) {
    return <Navigate to={getPostAuthRoute(isAdmin)} replace />;
  }

  return <AdminAuthPage />;
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
    path: ROUTES.ADMIN_AUTH,
    element: <PublicAdminAuthRoute />,
  },
  {
    path: ROUTES.HOME,
    element: <ProtectedRootLayout />,
    children: [
      { index: true, element: <AdminFeedRoute><FeedPage /></AdminFeedRoute> },
      { path: ROUTES.FEED, element: <AdminFeedRoute><FeedPage /></AdminFeedRoute> },
      { path: ROUTES.ADMIN_FEED, element: <AdminFeedDashboardPage /> },
      { path: ROUTES.MESSAGES, element: <AdminWorkInProgressRoute><MessagesPage /></AdminWorkInProgressRoute> },
      { path: ROUTES.MARKETPLACE, element: <MarketplaceRoute /> },
      { path: ROUTES.RENT, element: <RentRoute /> },
      { path: ROUTES.SERVICES, element: <AdminWorkInProgressRoute><ServicesPage /></AdminWorkInProgressRoute> },
      { path: ROUTES.COMPLAINTS, element: <AdminWorkInProgressRoute><ComplaintsPage /></AdminWorkInProgressRoute> },
      { path: ROUTES.RELIEF, element: <AdminWorkInProgressRoute><ReliefPage /></AdminWorkInProgressRoute> },
      { path: ROUTES.ACCOUNT, element: <AdminWorkInProgressRoute><AccountPage /></AdminWorkInProgressRoute> },
    ],
  },
];

export const router = createBrowserRouter(routes);
