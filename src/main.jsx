import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { DbProvider } from './context/DbContext';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { TransitionProvider } from './context/TransitionContext';
import './styles.css';
import './auth.css';
import './admin.css';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DbProvider>
        <AuthProvider>
          <StoreProvider>
            <TransitionProvider>
              <App />
            </TransitionProvider>
          </StoreProvider>
        </AuthProvider>
      </DbProvider>
    </BrowserRouter>
  </StrictMode>
);
