import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CalendarIcon,
  FunnelIcon,
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

  const handleFilterUpdate = (key, value) => {
    console.log('SearchFilterBar - Filter updated:', key, '=', value);
    console.log('SearchFilterBar - Current filters:', filters);
    if (handleFilterChange) {
      console.log('SearchFilterBar - Calling handleFilterChange');
      handleFilterChange(key, value);
    } else if (onFilterChange) {
      console.log('SearchFilterBar - Calling onFilterChange');
      onFilterChange({ ...filters, [key]: value });
    } else {
      console.log('SearchFilterBar - No filter change handler available');
    }
  };

  return (
    <div className={`mb-${isMobile ? "4" : "6"}`}>
      {/* Barre de recherche moderne */}
      <div className={`flex items-center ${isMobile ? "gap-2" : "gap-3"} mb-3`}>
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon
              className={`${
                isMobile ? "h-4 w-4" : "h-5 w-5"
              } text-gray-400 dark:text-gray-500 transition-colors duration-300 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400`}
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
            className={`block w-full pl-${isMobile ? "11" : "12"} pr-12 ${
              isMobile ? "py-3" : "py-4"
            } border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
              isMobile ? "rounded-xl" : "rounded-2xl"
            } focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:focus:border-primary-400 ${
              isMobile ? "text-sm" : "text-base"
            } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500`}
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center group hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-all duration-300"
            >
              <XMarkIcon
                className={`${
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                } text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-300`}
              />
            </button>
          )}
        </div>
        <button
          onClick={handleToggleFilters}
          className={`group relative overflow-hidden ${
            isMobile ? "p-3" : "p-4"
          } ${
            isMobile ? "rounded-xl" : "rounded-2xl"
          } ${
            showFilters
              ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25"
              : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500"
          } transition-all duration-300 hover:scale-105 transform hover:-translate-y-0.5`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 dark:from-white/0 dark:to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <FunnelIcon
            className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} relative z-10 transition-transform duration-300 group-hover:rotate-12 ${
              showFilters ? "text-white" : ""
            }`}
          />
        </button>
      </div>

      {/* Filtres modernes */}
      {showFilters && (
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 ${
            isMobile ? "p-5" : "p-7"
          } ${
            isMobile ? "rounded-2xl" : "rounded-3xl"
          } shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20 mb-4 transition-all duration-500`}
        >
          {/* Header des filtres */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="relative">
                <AdjustmentsHorizontalIcon className={`${
                  isMobile ? "h-5 w-5" : "h-6 w-6"
                } text-primary-600 dark:text-primary-400 mr-3 transition-transform duration-300 group-hover:rotate-12`} />
              </div>
              <div>
                <h3 className={`${
                  isMobile ? "text-base" : "text-lg"
                } font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent`}>
                  Filtres avancés
                </h3>
                <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1`}>
                  Affinez votre recherche
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs text-gray-600 dark:text-gray-400 font-medium`}>
                Actifs
              </span>
            </div>
          </div>

          <div
            className={`grid ${
              isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            } ${isMobile ? "gap-3" : "gap-4"}`}
          >
            {/* Filtre par statut */}
            <div className="space-y-3 group">
              <label className={`flex items-center ${
                isMobile ? "text-xs" : "text-sm"
              } font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-primary-600 dark:group-hover:text-primary-400`}>
                <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full mr-2 animate-pulse"></div>
                Statut
              </label>
              <select
                value={filters.statut || 'tous'}
                onChange={(e) => handleFilterUpdate("statut", e.target.value)}
                className={`block w-full ${
                  isMobile ? "px-4 py-3" : "px-4 py-3.5"
                } border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:focus:border-primary-400 ${
                  isMobile ? "text-sm" : "text-sm"
                } transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 font-medium`}
              >
                <option value="tous">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="approuvé">Approuvé</option>
                <option value="rejeté">Rejeté</option>
                <option value="expiré">Expiré</option>
              </select>
            </div>

            {/* Filtre par état */}
            <div className="space-y-3 group">
              <label className={`flex items-center ${
                isMobile ? "text-xs" : "text-sm"
              } font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400`}>
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-2 animate-pulse"></div>
                État
              </label>
              <select
                value={filters.etat || 'tous'}
                onChange={(e) => handleFilterUpdate("etat", e.target.value)}
                className={`block w-full ${
                  isMobile ? "px-4 py-3" : "px-4 py-3.5"
                } border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 dark:focus:border-green-400 ${
                  isMobile ? "text-sm" : "text-sm"
                } transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 font-medium`}
              >
                <option value="tous">Tous les états</option>
                <option value="disponible">Disponible</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>

            {/* Filtre date de début */}
            <div className="space-y-3 group">
              <label className={`flex items-center ${
                isMobile ? "text-xs" : "text-sm"
              } font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
                <CalendarIcon className={`${
                  isMobile ? "h-4 w-4" : "h-4 w-4"
                } text-blue-500 mr-2 transition-transform duration-300 group-hover:scale-110`} />
                Date de début
              </label>
              <input
                type="date"
                value={filters.date_debut || ''}
                onChange={(e) => handleFilterUpdate("date_debut", e.target.value)}
                className={`block w-full ${
                  isMobile ? "px-4 py-3" : "px-4 py-3.5"
                } border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 ${
                  isMobile ? "text-sm" : "text-sm"
                } transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 font-medium`}
              />
            </div>

            {/* Filtre date de fin */}
            <div className="space-y-3 group">
              <label className={`flex items-center ${
                isMobile ? "text-xs" : "text-sm"
              } font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-red-600 dark:group-hover:text-red-400`}>
                <CalendarIcon className={`${
                  isMobile ? "h-4 w-4" : "h-4 w-4"
                } text-red-500 mr-2 transition-transform duration-300 group-hover:scale-110`} />
                Date de fin
              </label>
              <input
                type="date"
                value={filters.date_fin || ''}
                onChange={(e) => handleFilterUpdate("date_fin", e.target.value)}
                min={filters.date_debut || ''}
                className={`block w-full ${
                  isMobile ? "px-4 py-3" : "px-4 py-3.5"
                } border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 dark:focus:border-red-400 ${
                  isMobile ? "text-sm" : "text-sm"
                } transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 font-medium`}
              />
            </div>
          </div>

          {/* Boutons d'action modernes */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className={`${
                isMobile ? "text-xs" : "text-sm"
              } text-gray-600 dark:text-gray-400 font-medium`}>
                Filtres actifs
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetFilters}
                className={`group relative overflow-hidden ${
                  isMobile ? "px-5 py-3 text-xs" : "px-6 py-3.5 text-sm"
                } bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 hover:scale-105 transform hover:-translate-y-0.5 font-medium`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 dark:from-white/0 dark:to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  Réinitialiser
                </span>
              </button>
              <button
                onClick={handleToggleFilters}
                className={`group relative overflow-hidden ${
                  isMobile ? "px-5 py-3 text-xs" : "px-6 py-3.5 text-sm"
                } bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white ${
                  isMobile ? "rounded-xl" : "rounded-xl"
                } hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-600/35 transition-all duration-300 hover:scale-105 transform hover:-translate-y-0.5 font-semibold`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 dark:from-white/0 dark:to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Appliquer
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;
