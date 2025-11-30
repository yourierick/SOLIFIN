import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Composant modal plein écran qui utilise un portail React pour être rendu directement dans le body
 * Garantit que le modal est toujours au-dessus de tous les autres éléments
 */
const FullScreenModal = ({ isOpen, onClose, title, children, isDarkMode }) => {
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

  // Créer un élément modal qui sera rendu directement dans le body
  return ReactDOM.createPortal(
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 99999
      }}
    >
      <div 
        className="modal-content"
        style={{
          maxWidth: '32rem',
          width: '100%',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          padding: '1.5rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: '#9ca3af',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <XMarkIcon style={{ height: '1.5rem', width: '1.5rem' }} />
        </button>
        
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: isDarkMode ? '#ffffff' : '#111827'
        }}>
          {title}
        </h2>
        
        {children}
      </div>
    </div>,
    document.body
  );
};

export default FullScreenModal;
