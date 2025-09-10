import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

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
  isDarkMode: isDarkModeProp,
  type = 'danger', // 'danger', 'warning', 'info'
  isLoading = false // Nouvel état pour le chargement
}) => {
  // Utiliser le contexte de thème global de l'application
  const { isDarkMode: contextDarkMode } = useTheme();
  
  // Utiliser la valeur fournie en prop si disponible, sinon utiliser le contexte
  const isDarkMode = isDarkModeProp !== undefined ? isDarkModeProp : contextDarkMode;
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
      className={`fixed inset-0 ${isDarkMode ? 'bg-black bg-opacity-60' : 'bg-black bg-opacity-50'} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}
      onClick={onClose} // Fermer le modal en cliquant à l'extérieur
    >
      <div 
        className={`max-w-md w-full rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 border border-gray-700 dark:animate-glow' : 'bg-white'
        } p-6 relative animate__animated animate__fadeInUp animate__faster`}
        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture en cliquant sur le contenu
        style={{
          boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' : '',
          backdropFilter: isDarkMode ? 'blur(4px)' : 'none'
        }}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 rounded-full p-1 transition-all duration-200 ${
            isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        
        <div className="flex items-center mb-4">
          <div className={`mr-3 ${typeStyles.icon} transition-all duration-300 ${isDarkMode ? 'dark:animate-dark-pulse' : ''}`} 
            style={{
              filter: isDarkMode ? 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.2))' : 'none',
              transform: 'translateZ(0)'
            }}>
            <ExclamationTriangleIcon className="h-6 w-6 animate__animated animate__pulse animate__infinite animate__slow" />
          </div>
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          style={{ 
            textShadow: isDarkMode ? '0 0 1px rgba(255, 255, 255, 0.2)' : 'none' 
          }}>
            {title}
          </h2>
        </div>
        
        <p className={`mb-6 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        } leading-relaxed transition-colors duration-300`}
        style={{
          maxWidth: '100%',
          overflowWrap: 'break-word',
          lineHeight: '1.6'
        }}>
          {message}
        </p>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isDarkMode ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} ${isDarkMode ? 'hover:scale-105 dark:hover:animate-dark-float' : ''} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${typeStyles.confirmButton} border ${typeStyles.confirmButtonBorder} ${isDarkMode ? 'hover:scale-105 dark:animate-glow dark:hover:animate-dark-pulse' : ''} ${isLoading ? 'opacity-90 cursor-wait' : ''} flex items-center justify-center`}
            style={{
              boxShadow: isDarkMode ? `0 2px 8px ${type === 'danger' ? 'rgba(239, 68, 68, 0.3)' : type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` : '',
              transform: 'translateZ(0)',
              minWidth: '120px'
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement...
              </>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
