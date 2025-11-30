import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { countries } from '../data/countries';

// Styles pour l'ascenseur fin
const scrollbarStyles = `
  /* Style pour l'ascenseur fin */
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.8);
  }
  
  /* Mode sombre */
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.5);
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgba(75, 85, 99, 0.8);
  }
`;

/**
 * Composant de sélection de pays avec drapeaux
 * @param {function} onChange - Fonction appelée lorsque le pays est modifié
 * @param {string} value - Valeur actuelle du pays (pour le mode édition)
 * @param {string} placeholder - Texte à afficher quand aucun pays n'est sélectionné
 */
export default function CountrySelector({ onChange, value, placeholder }) {
  // Ajouter les styles pour l'ascenseur fin au composant
  useEffect(() => {
    // Vérifier si les styles sont déjà ajoutés pour éviter les doublons
    if (!document.getElementById('scrollbar-styles-country')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'scrollbar-styles-country';
      styleElement.innerHTML = scrollbarStyles;
      document.head.appendChild(styleElement);
      
      // Nettoyage lors du démontage du composant
      return () => {
        // Ne pas supprimer les styles si d'autres instances du composant existent encore
        if (!document.querySelector('.country-selector-container')) {
          const styleEl = document.getElementById('scrollbar-styles-country');
          if (styleEl) styleEl.remove();
        }
      };
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(value || ''); // Valeur par défaut vide
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fonction pour obtenir l'emoji du drapeau à partir du code pays
  const getFlagEmoji = (countryCode) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  useEffect(() => {
    try {
      setLoading(true);
      
      // Transformer les données des pays pour le format attendu par le composant
      const countriesData = countries.map(country => {
        return {
          name: country.name,
          code: country.code,
          flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
          countryCode: country.code
        };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Tri par nom de pays
      
      // Stocker la liste complète des pays
      setAllCountries(countriesData);
      setFilteredCountries(countriesData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du traitement des données de pays:', err);
      setError('Impossible de charger les pays');
      
      // Fallback: quelques pays courants
      const fallbackCountries = [
        { name: 'Côte d\'Ivoire', code: 'CI', flag: 'https://flagcdn.com/ci.svg', countryCode: 'CI' },
        { name: 'France', code: 'FR', flag: 'https://flagcdn.com/fr.svg', countryCode: 'FR' },
        { name: 'États-Unis', code: 'US', flag: 'https://flagcdn.com/us.svg', countryCode: 'US' },
        { name: 'Sénégal', code: 'SN', flag: 'https://flagcdn.com/sn.svg', countryCode: 'SN' }
      ];
      setAllCountries(fallbackCountries);
      setFilteredCountries(fallbackCountries);
      setLoading(false);
    }
  }, []);

  // Garder une référence à la liste complète des pays
  const [allCountries, setAllCountries] = useState([]);
  
  // Filtrer les pays en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Si la recherche est vide, afficher tous les pays
      setFilteredCountries(allCountries);
    } else {
      // Filtrer les pays qui correspondent à la recherche
      const query = searchQuery.toLowerCase();
      setFilteredCountries(
        allCountries
          .filter(country => 
            country.name.toLowerCase().includes(query) || 
            country.code.toLowerCase().includes(query)
          )
      );
    }
  }, [searchQuery, allCountries]);

  // Obtenir le pays sélectionné
  const getSelectedCountry = () => {
    if (!selectedCountry) return null;
    return filteredCountries.find(country => country.name === selectedCountry);
  };

  // Gérer la sélection d'un pays
  const handleSelectCountry = (country) => {
    setSelectedCountry(country.name);
    onChange(country.name);
    setIsOpen(false);
  };

  // Fermer le menu déroulant quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      const container = document.querySelector('.country-selector-container');
      if (container && !container.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="country-selector-container relative">
      {/* Bouton de sélection */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white dark:bg-gray-800 dark:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            {getSelectedCountry() ? (
              <>
                <img 
                  src={getSelectedCountry().flag} 
                  alt={getSelectedCountry().name} 
                  className="w-5 h-auto mr-2" 
                  onError={(e) => {
                    // Fallback vers emoji en cas d'erreur de chargement de l'image
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'inline';
                  }}
                />
                <span style={{ display: 'none' }}>
                  {getSelectedCountry().countryCode ? getFlagEmoji(getSelectedCountry().countryCode) : ''}
                </span>
                <span className="truncate">{getSelectedCountry().name}</span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {placeholder || "Sélectionner un pays"}
              </span>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </button>
      </div>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md max-h-60 overflow-auto scrollbar-thin">
          {/* Barre de recherche */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-white"
                placeholder="Rechercher un pays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Liste des pays */}
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Chargement des pays...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Aucun pays trouvé
            </div>
          ) : (
            <ul className="py-1">
              {filteredCountries.map((country) => (
                <li
                  key={country.code}
                  className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedCountry === country.name ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => handleSelectCountry(country)}
                >
                  <img 
                    src={country.flag} 
                    alt={country.name} 
                    className="w-5 h-auto mr-2"
                    onError={(e) => {
                      // Fallback vers emoji en cas d'erreur de chargement de l'image
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                  <span style={{ display: 'none' }}>
                    {country.countryCode ? getFlagEmoji(country.countryCode) : ''}
                  </span>
                  <span className="truncate">{country.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
