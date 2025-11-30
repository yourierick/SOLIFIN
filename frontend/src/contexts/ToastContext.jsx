/**
 * ToastContext.jsx - Contexte de gestion des notifications
 * 
 * Ce contexte fournit un système centralisé pour la gestion des notifications toast
 * dans toute l'application. Il gère l'état et le cycle de vie des notifications.
 * 
 * Fonctionnalités :
 * - Création de notifications avec type et message
 * - Gestion automatique de la durée d'affichage
 * - Suppression manuelle des notifications
 * - Animation fluide d'apparition/disparition
 * 
 * API exposée :
 * - showToast(message, type) : Affiche une nouvelle notification
 * - removeToast(id) : Supprime une notification spécifique
 * - toasts : Liste des notifications actives
 * 
 * Types de notifications supportés :
 * - success : Pour les opérations réussies
 * - error : Pour les erreurs
 * - info : Pour les informations générales
 * 
 * Cycle de vie d'une notification :
 * 1. Création avec ID unique
 * 2. Affichage avec animation
 * 3. Auto-suppression après 3s ou suppression manuelle
 * 4. Animation de sortie
 * 5. Suppression du DOM
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(currentToasts => [
      ...currentToasts,
      { id, message, type, visible: true }
    ]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(currentToasts => 
      currentToasts.map(toast => 
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    // Remove from DOM after animation (200ms)
    setTimeout(() => {
      setToasts(currentToasts => 
        currentToasts.filter(toast => toast.id !== id)
      );
    }, 200);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    addToast(message, type);
  }, [addToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <ExclamationCircleIcon className="h-6 w-6 text-red-400" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      default:
        return 'border-blue-400';
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const value = {
    toasts,
    showToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        {toasts.map(toast => (
          <Transition
            key={toast.id}
            show={toast.visible}
            enter="transition-transform duration-300 ease-out"
            enterFrom="translate-y-2 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="transition-transform duration-300 ease-in"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-2 opacity-0"
          >
            <div
              className={`max-w-md w-full ${getBgColor(toast.type)} ${getBorderColor(toast.type)} border shadow-lg rounded-lg pointer-events-auto`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">{getIcon(toast.type)}</div>
                  <div className="ml-3 w-0 flex-1">
                    <p className={`text-sm font-medium ${getTextColor(toast.type)}`}>{toast.message}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className={`rounded-md inline-flex ${getTextColor(toast.type)} hover:opacity-75 focus:outline-none`}
                      onClick={() => removeToast(toast.id)}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
