//client/src/app/Router.tsx
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Navigate, createBrowserRouter, RouteObject, useLocation } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';
import { ROUTES } from '@/config/routes.config';
import { FeedPage } from '@/features/feed/pages/FeedPage';
import { MessagesPage } from '@/features/messages/pages/MessagesPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { RentPage } from '@/features/rent/pages/RentPage';
import { ServicesPage } from '@/features/services/pages/ServicesPage';
import { ComplaintsPage } from '@/features/complaints/pages/ComplaintsPage';
import { AdminComplaintsModerationPage } from '@/features/admin-complaints';
import { ReliefPage } from '@/features/relief/pages/ReliefPage';
import { AdminReliefModerationPage } from '@/features/admin-relief';
import { AdminMarketplaceModerationPage } from '@/features/admin-marketplace';
import { AdminRentModerationPage } from '@/features/admin-rent';
import { AdminServicesModerationPage } from '@/features/admin-services';
import { AccountPage, AdminAccountPage } from '@/features/account';
import { AdminFeedDashboardPage } from '@/features/admin-feed';
import { AdminMessagesPage } from '@/features/admin-messages';
import { AdminAuthPage, SignInPage, SignUpPage } from '@/features/auth';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { useAuthStore } from '@/features/auth/store/authStore';

const SPLASH_FADE_DURATION_MS = 720;

const getPostAuthRoute = (isAdmin: boolean) => (isAdmin ? ROUTES.ADMIN_FEED : ROUTES.HOME);

const AdminFeedRoute = ({ children }: { children: ReactElement }) => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <Navigate to={ROUTES.ADMIN_FEED} replace />;
  }

  return children;
};


const MessagesRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminMessagesPage />;
  }

  return <MessagesPage />;
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

const ServicesRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminServicesModerationPage />;
  }

  return <ServicesPage />;
};

const ComplaintsRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminComplaintsModerationPage />;
  }

  return <ComplaintsPage />;
};

const ReliefRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminReliefModerationPage />;
  }

  return <ReliefPage />;
};

const AccountRoute = () => {
  const role = useAuthStore((state) => state.role);

  if (role === 'admin') {
    return <AdminAccountPage />;
  }

  return <AccountPage />;
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
  const location = useLocation();
  const isRootPath = location.pathname === ROUTES.HOME;
  const [isSplashCompleted, setIsSplashCompleted] = useState(() => isAuthenticated || !isRootPath);
  const [isSplashFading, setIsSplashFading] = useState(false);
  const splashFadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (splashFadeTimerRef.current !== null) {
        window.clearTimeout(splashFadeTimerRef.current);
      }
    };
  }, []);

  const handleSplashFinished = () => {
    if (isSplashCompleted || isSplashFading) {
      return;
    }

    setIsSplashFading(true);
    splashFadeTimerRef.current = window.setTimeout(() => {
      setIsSplashCompleted(true);
    }, SPLASH_FADE_DURATION_MS);
  };

  const isLandingVisible = isSplashFading || isSplashCompleted;

  if (!isAuthenticated) {
    if (isRootPath) {
      return (
        <div className={`relative bg-slate-950 ${isLandingVisible ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
          <div
            className={`absolute inset-0 z-20 transform-gpu transition-all duration-700 ease-out ${isLandingVisible ? 'pointer-events-none opacity-0 scale-105' : 'opacity-100 scale-100'}`}
          >
            <video
              className="absolute inset-0 h-full w-full object-cover object-[center_42%] brightness-110 saturate-125"
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={handleSplashFinished}
              onError={handleSplashFinished}
            >
              <source src="/splash.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-linear-to-br from-slate-900/20 via-slate-900/10 to-emerald-900/22" />
          </div>

          <div
            className={`z-10 transform-gpu transition-opacity duration-700 ease-out ${isLandingVisible ? 'relative opacity-100' : 'absolute inset-0 pointer-events-none overflow-hidden opacity-0'}`}
          >
            <LandingPage />
          </div>
        </div>
      );
    }

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
      { path: ROUTES.MESSAGES, element: <MessagesRoute /> },
      { path: ROUTES.MARKETPLACE, element: <MarketplaceRoute /> },
      { path: ROUTES.RENT, element: <RentRoute /> },
      { path: ROUTES.SERVICES, element: <ServicesRoute /> },
      { path: ROUTES.COMPLAINTS, element: <ComplaintsRoute /> },
      { path: ROUTES.RELIEF, element: <ReliefRoute /> },
      { path: ROUTES.ACCOUNT, element: <AccountRoute /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
