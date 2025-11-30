import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import usePrefetch from '../hooks/usePrefetch';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant qui gère le préchargement intelligent des routes
 * en fonction du comportement de l'utilisateur et de son rôle
 */
const PrefetchManager = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { prefetchRoute } = usePrefetch({
    enabled: true,
    delay: 1500, // 1.5 secondes de délai avant de commencer le préchargement
  });
  
  // Préchargement basé sur le rôle de l'utilisateur
  useEffect(() => {
    if (!user) return;
    
    const isAdmin = user.is_admin === 1 || user.is_admin === true || user.role === "admin";
    
    // Précharger les routes principales en fonction du rôle
    if (isAdmin) {
      if (location.pathname === '/admin') {
        // Précharger les routes les plus fréquentes pour les administrateurs
        prefetchRoute('/admin/users');
        prefetchRoute('/admin/finances');
      }
    } else {
      if (location.pathname === '/dashboard') {
        // Précharger les routes les plus fréquentes pour les utilisateurs
        prefetchRoute('/dashboard/stats');
        prefetchRoute('/dashboard/finances');
      }
    }
  }, [location.pathname, user, prefetchRoute]);
  
  // Préchargement basé sur le temps passé sur une page
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Si l'utilisateur reste sur une page spécifique pendant plus de 5 secondes,
    // précharger les routes associées plus en profondeur
    const timer = setTimeout(() => {
      if (currentPath.startsWith('/dashboard/packs')) {
        prefetchRoute('/dashboard/finances');
      } else if (currentPath.startsWith('/admin/packs')) {
        prefetchRoute('/admin/users');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [location.pathname, prefetchRoute]);
  
  // Ce composant ne rend rien visuellement
  return null;
};

export default PrefetchManager;
