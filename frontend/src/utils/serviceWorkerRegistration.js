/**
 * Service Worker Registration
 * Ce fichier gère l'enregistrement et la mise à jour du service worker
 */

// Vérifier si le service worker est supporté
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Enregistrer le service worker
 * @returns {Promise} Promise qui résout à l'enregistrement du service worker
 */
export const register = () => {
  if (!isServiceWorkerSupported) {
    return Promise.resolve(null);
  }
  
  return navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      // Vérifier les mises à jour
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Une nouvelle version est disponible
              notifyUserUpdate();
            }
          }
        };
      };
      
      return registration;
    })
    .catch(() => {
      return null;
    });
};

/**
 * Désinscrire le service worker
 * @returns {Promise} Promise qui résout à true si désactivé avec succès
 */
export const unregister = () => {
  if (!isServiceWorkerSupported) return Promise.resolve(false);
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.unregister();
    })
    .then(success => {
      return success;
    })
    .catch(() => {
      return false;
    });
};

/**
 * Nettoyer le cache du service worker
 * @returns {Promise} Promise qui résout quand le nettoyage est terminé
 */
export const cleanCache = () => {
  if (!isServiceWorkerSupported) return Promise.resolve(false);
  
  return navigator.serviceWorker.ready
    .then(registration => {
      // Envoyer un message au service worker pour nettoyer le cache
      registration.active.postMessage({
        type: 'CLEAN_CACHE'
      });
      return true;
    })
    .catch(() => {
      return false;
    });
};

/**
 * Vérifier les mises à jour du service worker
 * @returns {Promise} Promise qui résout à true si une mise à jour est disponible
 */
export const checkForUpdates = () => {
  if (!isServiceWorkerSupported) return Promise.resolve(false);
  
  return navigator.serviceWorker.ready
    .then(registration => {
      return registration.update()
        .then(() => {
          if (registration.waiting) {
            // Une mise à jour est disponible
            return true;
          }
          return false;
        });
    })
    .catch(() => {
      return false;
    });
};

/**
 * Appliquer la mise à jour du service worker
 * @returns {Promise} Promise qui résout quand la mise à jour est appliquée
 */
export const applyUpdate = () => {
  if (!isServiceWorkerSupported) return Promise.resolve(false);
  
  return navigator.serviceWorker.ready
    .then(registration => {
      if (!registration.waiting) {
        return false;
      }
      
      // Envoyer un message au service worker en attente pour qu'il prenne le contrôle
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    })
    .catch(() => {
      return false;
    });
};

/**
 * Notifier l'utilisateur qu'une mise à jour est disponible
 * Cette fonction peut être personnalisée pour afficher une notification UI
 */
const notifyUserUpdate = () => {
  // Vous pouvez implémenter ici une notification UI
  // Par exemple, afficher une bannière ou un toast
  const event = new CustomEvent('serviceWorkerUpdate', {
    detail: {
      hasUpdate: true
    }
  });
  
  window.dispatchEvent(event);
};

export default {
  register,
  unregister,
  cleanCache,
  checkForUpdates,
  applyUpdate,
  isSupported: isServiceWorkerSupported
};
