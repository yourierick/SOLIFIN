import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Composant ModalPortal qui utilise createPortal pour rendre les modals dans document.body
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.isOpen - Indique si le modal est ouvert
 * @param {React.ReactNode} props.children - Le contenu du modal
 * @param {Function} props.onClose - Fonction appelée quand l'utilisateur clique en dehors du modal (optionnel)
 * @param {boolean} props.hideBackdrop - Si true, ne montre pas le fond semi-transparent (optionnel)
 * @returns {React.ReactPortal|null} - Le portal ou null si le modal est fermé
 */
const ModalPortal = ({ isOpen, children, onClose, hideBackdrop = false }) => {
  // Empêcher le défilement du body quand le modal est ouvert
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
  
  // Gérer le clic en dehors du modal
  const handleBackdropClick = (e) => {
    if (onClose && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return createPortal(
    <div 
      className={`fixed inset-0 ${!hideBackdrop ? 'bg-black bg-opacity-50 backdrop-blur-sm' : ''} flex items-center justify-center z-50`}
      onClick={handleBackdropClick}
    >
      {children}
    </div>,
    document.body
  );
};

export default ModalPortal;
