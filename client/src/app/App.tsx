import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { Providers } from './providers';
import { Analytics } from '@vercel/analytics/react';
import '@/styles/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Analytics />
    </Providers>
  );
}

export default App;
