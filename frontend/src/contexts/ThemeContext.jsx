/**
 * ThemeContext.jsx - Contexte de gestion du thème
 * 
 * Gère le thème global de l'application (clair/sombre)
 * et les préférences d'affichage de l'utilisateur.
 * 
 * Fonctionnalités :
 * - Basculement clair/sombre
 * - Détection automatique des préférences système
 * - Persistence des préférences
 * - Application dynamique des styles
 * 
 * État géré :
 * - Thème actuel
 * - Préférences utilisateur
 * - État de chargement
 * 
 * Méthodes exposées :
 * - toggleTheme()
 * - toggleSidebar()
 * 
 * Persistence :
 * - LocalStorage pour les préférences
 * - Détection des préférences système
 * - Mise à jour en temps réel
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { updateNotificationTheme } from '../components/Notification';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState === 'true';
  });

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#2E7D32',
            light: '#4CAF50',
            dark: '#1B5E20',
          },
          background: {
            default: isDarkMode ? '#121212' : '#f5f5f5',
            paper: isDarkMode ? '#1E1E1E' : '#ffffff',
          },
          text: {
            primary: isDarkMode ? '#ffffff' : '#000000',
            secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 600,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 500,
          },
          h6: {
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontSize: '1rem',
                padding: '8px 24px',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: isDarkMode 
                  ? '0 0 15px rgba(46, 125, 50, 0.2)'
                  : '0 2px 12px rgba(0, 0, 0, 0.1)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E7D32',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#2E7D32',
                },
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Mettre à jour le thème des notifications
    updateNotificationTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleTheme,
      isSidebarCollapsed,
      toggleSidebar
    }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}