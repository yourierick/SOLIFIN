import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Liste des routes fréquemment visitées et leurs dépendances
const frequentRoutes = {
  // Routes utilisateur
  '/dashboard': [
    () => import('../pages/user/Dashboard'),
    () => import('../pages/user/Stats'),
    () => import('../pages/user/Finances')
  ],
  '/dashboard/stats': [
    () => import('../pages/user/Stats')
  ],
  '/dashboard/finances': [
    () => import('../pages/user/Finances')
  ],
  '/dashboard/packs': [
    () => import('../pages/user/Packs')
  ],
  
  // Routes administrateur
  '/admin': [
    () => import('../pages/admin/Dashboard'),
    () => import('../pages/admin/UsersManagement')
  ],
  '/admin/users': [
    () => import('../pages/admin/UsersManagement')
  ],
  '/admin/finances': [
    () => import('../pages/admin/Finances')
  ],
  '/admin/packs': [
    () => import('../pages/admin/Packs')
  ]
};

// Routes associées (pages souvent visitées après la page actuelle)
const relatedRoutes = {
  '/dashboard': ['/dashboard/stats', '/dashboard/finances', '/dashboard/packs'],
  '/admin': ['/admin/users', '/admin/finances', '/admin/packs'],
  '/dashboard/packs': ['/dashboard/packs/:id'],
  '/admin/packs': ['/admin/packs/add', '/admin/packs/edit/:id']
};

/**
 * Hook personnalisé pour précharger les routes fréquemment visitées
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enabled - Activer/désactiver le préchargement
 * @param {number} options.delay - Délai avant de commencer le préchargement (ms)
 * @param {string[]} options.additionalRoutes - Routes supplémentaires à précharger
 */
const usePrefetch = (options = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    enabled = true,
    delay = 2000,
    additionalRoutes = []
  } = options;
  
  useEffect(() => {
    if (!enabled) return;
    
    // Obtenir le chemin actuel
    const currentPath = location.pathname;
    
    // Obtenir les routes associées au chemin actuel
    const routesToPrefetch = [...(relatedRoutes[currentPath] || []), ...additionalRoutes];
    
    if (routesToPrefetch.length === 0) return;
    
    // Timer pour retarder le préchargement
    const timer = setTimeout(() => {
      // Précharger les modules pour les routes associées
      routesToPrefetch.forEach(route => {
        const modulesToLoad = frequentRoutes[route];
        if (modulesToLoad) {
          modulesToLoad.forEach(moduleLoader => {
            moduleLoader()
              .then(() => {})
              .catch(() => {});
          });
        }
      });
      
      // Informer React Router des routes à précharger
      routesToPrefetch.forEach(route => {
        if (typeof navigate.prefetch === 'function') {
          // Utiliser l'API de préchargement de React Router si disponible
          navigate.prefetch(route);
        }
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [location.pathname, enabled, delay, additionalRoutes, navigate]);
  
  // Fonction pour précharger manuellement une route
  const prefetchRoute = (route) => {
    if (!enabled || !route) return;
    
    const modulesToLoad = frequentRoutes[route];
    if (modulesToLoad) {
      modulesToLoad.forEach(moduleLoader => {
        moduleLoader()
          .then(() => {})
          .catch(() => {});
      });
    }
    
    if (typeof navigate.prefetch === 'function') {
      navigate.prefetch(route);
    }
  };
  
  return { prefetchRoute };
};

export default usePrefetch;
