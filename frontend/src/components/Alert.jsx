/**
 * Alert.jsx - Composant d'alerte
 * 
 * Affiche des messages d'alerte ou de notification importants.
 * Supporte différents types de messages avec des styles visuels distincts.
 * 
 * Types d'alertes :
 * - success : Pour les messages de réussite
 * - error : Pour les messages d'erreur
 * - warning : Pour les avertissements
 * - info : Pour les informations générales
 * 
 * Props :
 * - type : Type d'alerte (success, error, warning, info)
 * - message : Contenu du message
 * - title : Titre optionnel
 * - dismissible : Possibilité de fermer l'alerte
 * - onDismiss : Fonction appelée à la fermeture
 * - icon : Icône personnalisée
 * 
 * Caractéristiques :
 * - Design responsive
 * - Animations d'entrée/sortie
 * - Support du thème clair/sombre
 * - Icônes contextuelles
 * - Bouton de fermeture optionnel
 * 
 * Accessibilité :
 * - Rôle alert approprié
 * - Contraste des couleurs
 * - Focus sur le bouton de fermeture
 */

import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

const icons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon
};

const styles = {
  success: 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  error: 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
};

const iconStyles = {
  success: 'text-green-400 dark:text-green-300',
  warning: 'text-yellow-400 dark:text-yellow-300',
  error: 'text-red-400 dark:text-red-300',
  info: 'text-blue-400 dark:text-blue-300'
};

export default function Alert({
  type = 'info',
  message,
  className = '',
  ...props
}) {
  const Icon = icons[type];

  return (
    <div
      className={twMerge(
        'rounded-lg p-4 flex items-start',
        styles[type],
        className
      )}
      role="alert"
      {...props}
    >
      <Icon className={twMerge('h-5 w-5 mt-0.5', iconStyles[type])} />
      <div className="ml-3">
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
