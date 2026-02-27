import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} else {
  console.error(
    "Root element not found. Please ensure an element with id 'root' exists in the HTML."
  );
}
