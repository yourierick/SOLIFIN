import React from 'react';

/**
 * Composant pour afficher un indicateur individuel
 * @param {string} title - Titre de l'indicateur
 * @param {string|number} value - Valeur de l'indicateur
 * @param {string} unit - Unité de mesure (%, appels, min, etc.)
 * @param {string} className - Classes CSS additionnelles
 * @param {string} icon - Nom de l'icône (optionnel)
 */
export default function Indicateur({ title, value, unit, className, icon }) {
  return (
    <div className={`p-4 rounded-lg shadow-md ${className}`}>
      {icon && <div className="text-xl mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-2xl font-bold mt-2">
        {value} <span className="text-sm">{unit}</span>
      </div>
    </div>
  );
}
