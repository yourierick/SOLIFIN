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
 * Composant de sélection d'indicatif téléphonique par pays
 * @param {function} onChange - Fonction appelée lorsque l'indicatif est modifié
 * @param {string} value - Valeur actuelle de l'indicatif (pour le mode édition)
 */
export default function CountryCodeSelector({ onChange, value }) {
  // Ajouter les styles pour l'ascenseur fin au composant
  useEffect(() => {
    // Vérifier si les styles sont déjà ajoutés pour éviter les doublons
    if (!document.getElementById('scrollbar-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'scrollbar-styles';
      styleElement.innerHTML = scrollbarStyles;
      document.head.appendChild(styleElement);
      
      // Nettoyage lors du démontage du composant
      return () => {
        // Ne pas supprimer les styles si d'autres instances du composant existent encore
        if (!document.querySelector('.country-selector-container')) {
          const styleEl = document.getElementById('scrollbar-styles');
          if (styleEl) styleEl.remove();
        }
      };
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCode, setSelectedCode] = useState(value || '+225'); // Valeur par défaut: Côte d'Ivoire
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
          code: country.phoneCode,
          flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
          countryCode: country.code
        };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Tri par nom de pays
      
      setFilteredCountries(countriesData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du traitement des données de pays:', err);
      setError('Impossible de charger les indicatifs téléphoniques');
      
      // Fallback: quelques indicatifs courants
      setFilteredCountries([
        { name: 'Côte d\'Ivoire', code: '+225', flag: 'https://flagcdn.com/ci.svg', countryCode: 'CI' },
        { name: 'France', code: '+33', flag: 'https://flagcdn.com/fr.svg', countryCode: 'FR' },
        { name: 'États-Unis', code: '+1', flag: 'https://flagcdn.com/us.svg', countryCode: 'US' },
        { name: 'Sénégal', code: '+221', flag: 'https://flagcdn.com/sn.svg', countryCode: 'SN' }
      ]);
      setLoading(false);
    }
  }, []);

  // Filtrer les pays en fonction de la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Si la recherche est vide, afficher tous les pays
      const countriesData = countries.map(country => ({
        name: country.name,
        code: country.phoneCode,
        flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
        countryCode: country.code
      })).sort((a, b) => a.name.localeCompare(b.name));
      
      setFilteredCountries(countriesData);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = countries
      .filter(country => 
        country.name.toLowerCase().includes(query) || 
        country.phoneCode.includes(query) ||
        country.code.toLowerCase().includes(query)
      )
      .map(country => ({
        name: country.name,
        code: country.phoneCode,
        flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
        countryCode: country.code
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setFilteredCountries(filtered);
  }, [searchQuery]);

  // Gérer le changement d'indicatif
  const handleCodeChange = (code) => {
    setSelectedCode(code);
    onChange(code);
  };

  // Gérer le changement de la recherche
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Fonction pour trouver le pays sélectionné
  const getSelectedCountry = () => {
    return filteredCountries.find(country => country.code === selectedCode) || null;
  };
  
  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.country-selector-container')) {
        setIsOpen(false);
        // Réinitialiser la recherche quand on ferme le dropdown
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <div className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white">
        <div className="flex items-center justify-between">
          <span className="text-red-500 dark:text-red-400">Erreur de chargement</span>
        </div>
      </div>
    );
  }

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
                <span>{getSelectedCountry().code}</span>
              </>
            ) : (
              <span>{selectedCode}</span>
            )}
          </div>
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Dropdown des pays */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto scrollbar-thin">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b dark:border-gray-600">
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 pl-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
          ) : filteredCountries.length === 0 ? (
            <div className="p-4 text-gray-500 dark:text-gray-400 text-center">Aucun pays trouvé</div>
          ) : (
            <ul className="py-1">
              {filteredCountries.map((country) => (
                <li
                  key={`${country.countryCode}-${country.code}`}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                  onClick={() => {
                    handleCodeChange(country.code);
                    setIsOpen(false);
                  }}
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
                  <span className="mr-2">{country.code}</span>
                  {/* Le nom du pays est caché visuellement mais reste accessible pour la recherche et les lecteurs d'écran */}
                  <span className="sr-only">{country.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
