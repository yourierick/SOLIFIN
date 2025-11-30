import React, { useState, useEffect } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';
import serviceWorker from '../utils/serviceWorkerRegistration';

/**
 * Composant qui gère les mises à jour du service worker
 * et affiche une notification lorsqu'une mise à jour est disponible
 */
const ServiceWorkerUpdater = () => {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Ajouter un délai initial avant de vérifier les mises à jour
    // Cela évite d'afficher la notification immédiatement après le chargement
    const initialDelay = setTimeout(() => {
      // Écouter les événements de mise à jour du service worker
      const onUpdate = (event) => {
        if (event.detail && event.detail.hasUpdate) {
          setShowReload(true);
        }
      };

      window.addEventListener('serviceWorkerUpdate', onUpdate);

      // Vérifier les mises à jour périodiquement, mais beaucoup moins fréquemment
      const checkInterval = setInterval(() => {
        serviceWorker.checkForUpdates()
          .then(hasUpdate => {
            if (hasUpdate) {
              setShowReload(true);
            }
          });
      }, 24 * 60 * 60 * 1000); // Vérifier une fois par jour au lieu de chaque heure

      // Nettoyer le cache périodiquement
      const cleanInterval = setInterval(() => {
        serviceWorker.cleanCache();
      }, 7 * 24 * 60 * 60 * 1000); // Nettoyer une fois par semaine au lieu de chaque jour
    }, 30000); // Attendre 30 secondes avant de commencer à vérifier les mises à jour

    return () => {
      clearTimeout(initialDelay);
    };
  }, []);

  // Fonction pour appliquer la mise à jour
  const handleUpdate = () => {
    serviceWorker.applyUpdate()
      .then(updated => {
        if (updated) {
          // Recharger la page pour appliquer les changements
          window.location.reload();
        }
        setShowReload(false);
      });
  };

  return (
    <Snackbar
      open={showReload}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        severity="info"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleUpdate}
          >
            Mettre à jour
          </Button>
        }
      >
        Une nouvelle version est disponible !
      </Alert>
    </Snackbar>
  );
};

export default ServiceWorkerUpdater;
