import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';

export const RootLayout: React.FC = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default RootLayout;
