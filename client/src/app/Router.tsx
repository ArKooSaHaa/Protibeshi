import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';
import { ROUTES } from '@/config/routes.config';
import { FeedPage } from '@/features/feed/pages/FeedPage';
import { MarketplacePage } from '@/features/marketplace/pages/MarketplacePage';
import { RentPage } from '@/features/rent/pages/RentPage';
import { ServicesPage } from '@/features/services/pages/ServicesPage';
import { ComplaintsPage } from '@/features/complaints/pages/ComplaintsPage';
import { ReliefPage } from '@/features/relief/pages/ReliefPage';

const routes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <RootLayout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: ROUTES.MARKETPLACE, element: <MarketplacePage /> },
      { path: ROUTES.RENT, element: <RentPage /> },
      { path: ROUTES.SERVICES, element: <ServicesPage /> },
      { path: ROUTES.COMPLAINTS, element: <ComplaintsPage /> },
      { path: ROUTES.RELIEF, element: <ReliefPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
