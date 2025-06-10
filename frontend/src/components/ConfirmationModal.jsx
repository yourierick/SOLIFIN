import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Composant modal de confirmation réutilisable
 * @param {boolean} isOpen - État d'ouverture du modal
 * @param {function} onClose - Fonction appelée à la fermeture du modal
 * @param {function} onConfirm - Fonction appelée à la confirmation
 * @param {string} title - Titre du modal
 * @param {string} message - Message de confirmation
 * @param {string} confirmButtonText - Texte du bouton de confirmation
 * @param {string} cancelButtonText - Texte du bouton d'annulation
 * @param {boolean} isDarkMode - Mode sombre activé ou non
 * @param {string} type - Type de confirmation ('danger', 'warning', 'info')
 */
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmation', 
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  isDarkMode = false,
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  // Empêcher le défilement du body lorsque le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Déterminer les couleurs en fonction du type
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          confirmButton: isDarkMode 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white',
          confirmButtonBorder: isDarkMode
            ? 'border-red-600'
            : 'border-red-500'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          confirmButton: isDarkMode 
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
            : 'bg-yellow-500 hover:bg-yellow-600 text-white',
          confirmButtonBorder: isDarkMode
            ? 'border-yellow-600'
            : 'border-yellow-500'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          confirmButton: isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white',
          confirmButtonBorder: isDarkMode
            ? 'border-blue-600'
            : 'border-blue-500'
        };
      default:
        return {
          icon: 'text-red-500',
          confirmButton: isDarkMode 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white',
          confirmButtonBorder: isDarkMode
            ? 'border-red-600'
            : 'border-red-500'
        };
    }
  };

  const typeStyles = getTypeStyles();

  // Créer un élément modal qui sera rendu directement dans le body
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose} // Fermer le modal en cliquant à l'extérieur
    >
      <div 
        className={`max-w-md w-full rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } p-6 relative`}
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture en cliquant sur le contenu
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${
            isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        
        <div className="flex items-center mb-4">
          <div className={`mr-3 ${typeStyles.icon}`}>
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h2>
        </div>
        
        <p className={`mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 border rounded-md text-sm font-medium ${typeStyles.confirmButton} ${typeStyles.confirmButtonBorder}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
