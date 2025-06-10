/**
 * Button.jsx - Composant de bouton réutilisable
 * 
 * Composant de base pour tous les boutons de l'application.
 * Fournit une interface cohérente et personnalisable pour les interactions utilisateur.
 * 
 * Variantes :
 * - primary : Bouton principal avec couleur d'accent
 * - secondary : Bouton secondaire avec style plus léger
 * - success : Bouton pour actions réussies
 * - danger : Bouton pour actions destructives
 * - warning : Bouton pour actions d'avertissement
 * - info : Bouton pour actions d'information
 * - light : Bouton pour actions légères
 * - dark : Bouton pour actions sombres
 * - link : Bouton pour actions de lien
 * 
 * Props :
 * - variant : Type de bouton (primary, secondary, success, danger, warning, info, light, dark, link)
 * - size : Taille du bouton (xs, sm, md, lg, xl)
 * - className : Classe CSS supplémentaire
 * - disabled : État désactivé
 * - type : Type HTML (button, submit)
 * - onClick : Gestionnaire de clic
 * - title : Texte de titre
 * 
 * Caractéristiques :
 * - Design responsive
 * - États hover/focus/active
 * - Support du thème clair/sombre
 * - Animations de transition
 * - Accessibilité (ARIA)
 */

import React from 'react';
import { twMerge } from 'tailwind-merge';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  title,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
    light: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 hover:underline focus:ring-blue-500 dark:text-blue-400'
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  };

  const classes = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}
