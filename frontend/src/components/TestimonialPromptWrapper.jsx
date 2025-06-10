import React from 'react';
import TestimonialPrompt from './TestimonialPrompt';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wrapper pour le composant TestimonialPrompt
 * Ce wrapper vérifie si l'utilisateur est un administrateur et n'affiche
 * les invitations à témoigner que pour les utilisateurs normaux
 */
const TestimonialPromptWrapper = () => {
  const { user } = useAuth();
  
  // Ne pas afficher les invitations pour les administrateurs
  if (!user || user.is_admin === 1 || user.is_admin === true || user.role === 'admin') {
    return null;
  }
  
  return <TestimonialPrompt />;
};

export default TestimonialPromptWrapper;
