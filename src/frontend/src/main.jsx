// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './store/AuthContext';
import { AppProvider }  from './store/AppContext';
import AppRouter        from './routes/index';
import './styles/globals.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AuthProvider>
  </StrictMode>
);
