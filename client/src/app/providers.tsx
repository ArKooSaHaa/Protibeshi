import React from 'react';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {/* Add global providers here: Redux, Theme, Auth context, etc. */}
      {children}
    </>
  );
};
