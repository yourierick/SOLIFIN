import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import serviceWorker from './utils/serviceWorkerRegistration';

// Configuration d'Axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true; // Pour gérer les cookies CSRF

// Enregistrer le service worker avec un délai pour éviter les notifications immédiates
if (import.meta.env.PROD) {
  // Attendre que l'application soit chargée avant d'enregistrer le service worker
  window.addEventListener('load', () => {
    // Attendre 10 secondes avant d'enregistrer le service worker
    setTimeout(() => {
      serviceWorker.register();
    }, 10000);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
