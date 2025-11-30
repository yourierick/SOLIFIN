import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const SearchFilterBar = ({
  searchTerm,
  setSearchTerm,
  onSearchChange,
  filters,
  handleFilterChange,
  onFilterChange,
  showFilters,
  setShowFilters,
  onToggleFilters,
  resetFilters,
}) => {
  // Détection mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Utiliser les fonctions alternatives si les principales ne sont pas définies
  const handleSearchChange = (value) => {
    if (setSearchTerm) {
      setSearchTerm(value);
    } else if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleToggleFilters = () => {
    if (setShowFilters) {
      setShowFilters(!showFilters);
    } else if (onToggleFilters) {
      onToggleFilters();
    }
  };
  return (
    <div className={`mb-${isMobile ? "3" : "4"}`}>
      {/* Barre de recherche */}
      <div className={`flex items-center ${isMobile ? "gap-1" : "gap-2"} mb-2`}>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon
              className={`${
                isMobile ? "h-4 w-4" : "h-5 w-5"
              } text-gray-400 dark:text-gray-500`}
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={
              isMobile
                ? "Rechercher..."
                : "Rechercher par titre, description, contact..."
            }
            className={`block w-full pl-${isMobile ? "9" : "10"} pr-3 ${
              isMobile ? "py-1.5" : "py-2"
            } border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 ${
              isMobile ? "rounded-sm" : "rounded-md"
            } shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
              isMobile ? "text-xs" : "sm:text-sm"
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XMarkIcon
                className={`${
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                } text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400`}
              />
            </button>
          )}
        </div>
        <button
          onClick={handleToggleFilters}
          className={`${isMobile ? "p-1.5" : "p-2"} ${
            isMobile ? "rounded-sm" : "rounded-md"
          } ${
            showFilters
              ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          } hover:bg-primary-50 dark:hover:bg-primary-800`}
        >
          <AdjustmentsHorizontalIcon
            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
          />
        </button>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div
          className={`bg-white dark:bg-gray-800 ${isMobile ? "p-2" : "p-3"} ${
            isMobile ? "rounded-sm" : "rounded-md"
          } shadow-sm border border-gray-200 dark:border-gray-700 mb-3`}
        >
          <div
            className={`grid ${
              isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
            } ${isMobile ? "gap-2" : "gap-3"}`}
          >
            {/* Filtre par statut */}
            <div>
              <label
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } font-medium text-gray-700 dark:text-gray-300 mb-1`}
              >
                Statut
              </label>
              <select
                value={filters.statut}
                onChange={(e) => {
                  if (handleFilterChange) {
                    handleFilterChange("statut", e.target.value);
                  } else if (onFilterChange) {
                    onFilterChange({ ...filters, statut: e.target.value });
                  }
                }}
                className={`block w-full ${
                  isMobile ? "px-2 py-1.5" : "px-3 py-2"
                } border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  isMobile ? "rounded-sm" : "rounded-md"
                } shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  isMobile ? "text-xs" : "sm:text-sm"
                }`}
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="approuvé">Approuvé</option>
                <option value="rejeté">Rejeté</option>
                <option value="expiré">Expiré</option>
              </select>
            </div>

            {/* Filtre par état */}
            <div>
              <label
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } font-medium text-gray-700 dark:text-gray-300 mb-1`}
              >
                État
              </label>
              <select
                value={filters.etat}
                onChange={(e) => {
                  if (handleFilterChange) {
                    handleFilterChange("etat", e.target.value);
                  } else if (onFilterChange) {
                    onFilterChange({ ...filters, etat: e.target.value });
                  }
                }}
                className={`block w-full ${
                  isMobile ? "px-2 py-1.5" : "px-3 py-2"
                } border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  isMobile ? "rounded-sm" : "rounded-md"
                } shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  isMobile ? "text-xs" : "sm:text-sm"
                }`}
              >
                <option value="tous">Tous les états</option>
                <option value="disponible">Disponible</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>

            {/* Filtre par date */}
            <div>
              <label
                className={`block ${
                  isMobile ? "text-xs" : "text-sm"
                } font-medium text-gray-700 dark:text-gray-300 mb-1`}
              >
                Date de création
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => {
                  if (handleFilterChange) {
                    handleFilterChange("dateRange", e.target.value);
                  } else if (onFilterChange) {
                    onFilterChange({ ...filters, dateRange: e.target.value });
                  }
                }}
                className={`block w-full ${
                  isMobile ? "px-2 py-1.5" : "px-3 py-2"
                } border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  isMobile ? "rounded-sm" : "rounded-md"
                } shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  isMobile ? "text-xs" : "sm:text-sm"
                }`}
              >
                <option value="tous">Toutes les dates</option>
                <option value="aujourd'hui">Aujourd'hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
              </select>
            </div>
          </div>

          {/* Bouton de réinitialisation */}
          <div className="mt-3">
            <button
              onClick={resetFilters}
              className={`${
                isMobile ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
              } bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${
                isMobile ? "rounded-sm" : "rounded-md"
              } hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200`}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
