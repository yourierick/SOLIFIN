/**
 * Toast.jsx - Système de notifications toast
 * 
 * Ce composant gère l'affichage des notifications temporaires (toasts) dans l'application.
 * Il utilise Headless UI pour les transitions et s'intègre avec le contexte ToastContext.
 * 
 * Caractéristiques :
 * - Notifications empilées en haut à droite
 * - Types de notifications : success, error, info
 * - Animation d'entrée (slide depuis la droite)
 * - Animation de sortie (fade out)
 * - Auto-destruction après 3 secondes
 * - Possibilité de fermeture manuelle
 * 
 * Personnalisation :
 * - Largeur fixe de 320px
 * - Thème clair/sombre automatique
 * - Icônes spécifiques par type
 * - Bordures colorées selon le type
 * 
 * Utilisation :
 * const { showToast } = useToast();
 * showToast('Message de succès', 'success');
 */

import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="assertive"
      className="fixed top-4 right-4 z-50 flex flex-col space-y-2"
    >
      {toasts.map((toast) => (
        <Transition
          key={toast.id}
          show={toast.visible}
          as={Fragment}
          enter="transform ease-out duration-200 transition"
          enterFrom="translate-x-full opacity-0"
          enterTo="translate-x-0 opacity-100"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className={`w-[320px] bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 ${
              toast.type === 'error' ? 'ring-red-500' : 
              toast.type === 'success' ? 'ring-green-500' : 
              'ring-blue-500'
            }`}
          >
            <div className="p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  )}
                  {toast.type === 'error' && (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                  {toast.type === 'info' && (
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Fermer</span>
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      ))}
    </div>
  );
}
