import { RouterProvider } from 'react-router-dom';
import { router } from './Router';
import { Providers } from './providers';
import '@/styles/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
