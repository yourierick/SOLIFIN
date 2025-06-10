/**
 * ValidationFilters.jsx - Filtres pour la validation de contenu
 * 
 * Composant de filtrage avancé pour les tables de validation.
 * Permet de filtrer et rechercher efficacement dans les contenus à modérer.
 * 
 * Types de filtres :
 * - Statut de validation
 * - Plage de dates
 * - Recherche textuelle
 * - Filtres spécifiques au type
 * 
 * Fonctionnalités :
 * - Filtres combinables
 * - Réinitialisation
 * - Sauvegarde des préférences
 * - Suggestions intelligentes
 * 
 * Interface :
 * - Champs de recherche
 * - Sélecteurs de date
 * - Menus déroulants
 * - Cases à cocher
 * - Boutons d'action
 * 
 * Props :
 * - filters : État des filtres
 * - onChange : Callback de changement
 * - onReset : Réinitialisation
 * - options : Options des filtres
 * 
 * État local :
 * - Valeurs des filtres
 * - État d'expansion
 * - Validité des entrées
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ValidationFilters({ filters, setFilters }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Filtre de statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Statut
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="pending">En attente</option>
              <option value="all">Tous</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>

          {/* Filtre de date */}
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Période
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">Toutes les dates</option>
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
            </select>
          </div>

          {/* Barre de recherche */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rechercher
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Rechercher..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
