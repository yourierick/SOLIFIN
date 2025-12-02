import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { useTheme } from '../../../contexts/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  PlusCircleIcon,
  TrashIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import { countries as availableCountriesList } from '../../../data/countries';

const CountryAccessSettings = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [isGlobalRestrictionEnabled, setIsGlobalRestrictionEnabled] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  // Fonction pour obtenir l'emoji du drapeau à partir du code pays
  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
      
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      console.error('Erreur lors de la génération de l\'emoji du drapeau:', e);
      return '🌍';
    }
  };

  // Charger les pays autorisés/bloqués depuis l'API
  useEffect(() => {
    const fetchCountrySettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/settings/countries');
        
        if (response.data.success) {
          // Récupérer les pays configurés
          const configuredCountries = response.data.data.countries || [];
          
          // Ajouter les emojis aux pays configurés en utilisant les données de availableCountriesList
          const countriesWithFlags = configuredCountries.map(country => {
            // Trouver le pays correspondant dans la liste complète
            const fullCountryData = availableCountriesList.find(c => c.code === country.code);
            
            return {
              ...country,
              name: fullCountryData?.name || country.name,
              flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
              emoji: getFlagEmoji(country.code)
            };
          });
          
          setCountries(countriesWithFlags);
          setIsGlobalRestrictionEnabled(response.data.data.is_restriction_enabled || false);
        } else {
          toast.error('Erreur lors du chargement des paramètres de pays', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching country settings:', error);
        toast.error('Erreur lors du chargement des paramètres de pays', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } finally {
        setLoading(false);
      }
    };

    // Ajouter les drapeaux et emojis aux pays disponibles
    const countriesWithFlags = availableCountriesList.map(country => {
      return {
        ...country,
        flag: `https://flagcdn.com/${country.code.toLowerCase()}.svg`,
        emoji: getFlagEmoji(country.code)
      };
    });
    
    setAvailableCountries(countriesWithFlags);
    fetchCountrySettings();
  }, []);

  // Filtrer les pays disponibles en fonction du terme de recherche
  useEffect(() => {
    if (showAddForm && searchTerm) {
      const filtered = availableCountries.filter(
        country => !countries.some(c => c.code === country.code) && 
                  (country.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   country.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries([]);
    }
  }, [searchTerm, availableCountries, countries, showAddForm]);

  // Sauvegarder les modifications
  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await axios.post('/api/admin/settings/countries', {
        countries: countries.map(country => ({
          code: country.code,
          is_allowed: country.is_allowed
        })),
        is_restriction_enabled: isGlobalRestrictionEnabled
      });
      
      if (response.data.success) {
        toast.success('Paramètres de pays enregistrés avec succès', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error('Erreur lors de l\'enregistrement des paramètres de pays', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error saving country settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres de pays', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // Ajouter un pays à la liste
  const addCountry = (country) => {
    // Vérifier si le pays est déjà dans la liste
    if (countries.some(c => c.code === country.code)) {
      toast.warning(`${country.name} est déjà dans la liste`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    
    // Ajouter le pays avec le statut autorisé par défaut
    const newCountry = {
      ...country,
      is_allowed: true
    };
    
    setCountries([...countries, newCountry]);
    setSearchTerm('');
    setShowAddForm(false);
    
    toast.success(`${country.name} ajouté à la liste`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Supprimer un pays de la liste
  const removeCountry = (countryCode) => {
    const countryToRemove = countries.find(c => c.code === countryCode);
    setCountries(countries.filter(country => country.code !== countryCode));
    
    toast.info(`${countryToRemove?.name || 'Pays'} retiré de la liste`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Changer le statut d'un pays (autorisé/bloqué)
  const toggleCountryStatus = (countryCode) => {
    const updatedCountries = countries.map(country => {
      if (country.code === countryCode) {
        const newStatus = !country.is_allowed;
        return { ...country, is_allowed: newStatus };
      }
      return country;
    });
    
    setCountries(updatedCountries);
    
    // Soumettre le changement de statut au serveur
    const updateCountryStatus = async () => {
      try {
        setSaving(true);
        const countryToUpdate = updatedCountries.find(country => country.code === countryCode);
        
        if (!countryToUpdate) return;
        
        const response = await axios.put(`/api/admin/settings/countries/${countryCode}/toggle-status`, {
          is_allowed: countryToUpdate.is_allowed
        });
        
        if (response.data.success) {
          toast.success('Statut du pays mis à jour avec succès', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        } else {
          // En cas d'échec, revenir à l'état précédent
          fetchCountrySettings();
          toast.error('Erreur lors de la mise à jour du statut du pays', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      } catch (error) {
        console.error('Error updating country status:', error);
        // En cas d'erreur, revenir à l'état précédent
        fetchCountrySettings();
        toast.error('Erreur lors de la mise à jour du statut du pays', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } finally {
        setSaving(false);
      }
    };
    
    updateCountryStatus();
  };

  // Changer le mode de restriction global
  const toggleGlobalRestriction = async () => {
    try {
      setSaving(true);
      const newStatus = !isGlobalRestrictionEnabled;
      
      const response = await axios.post('/api/admin/settings/countries/toggle-restriction', {
        is_restriction_enabled: newStatus
      });
      
      if (response.data.success) {
        setIsGlobalRestrictionEnabled(newStatus);
        toast.success(`Mode de restriction global ${newStatus ? 'activé' : 'désactivé'}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } else {
        toast.error('Erreur lors de la modification du mode de restriction global', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Error toggling global restriction:', error);
      toast.error('Erreur lors de la modification du mode de restriction global', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-10 blur-xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-30"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des accès par pays
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Configurez les restrictions géographiques pour votre plateforme
              </p>
            </div>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 w-full sm:w-auto ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
            } ${saving ? 'opacity-70 cursor-not-allowed scale-100' : ''}`}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sauvegarde...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4" />
                Sauvegarder
              </div>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600 border-opacity-30"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Section Mode de restriction */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-5 blur-xl"></div>
            <div className={`relative p-6 rounded-2xl shadow-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <GlobeAltIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Mode de restriction
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Activez ou désactivez les restrictions géographiques
                    </p>
                  </div>
                </div>
                {/* Toggle custom pour mobile */}
                <div className="flex items-center">
                  <button
                    onClick={toggleGlobalRestriction}
                    className={`relative inline-flex h-10 w-16 sm:h-8 sm:w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      isGlobalRestrictionEnabled 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                  >
                    <span className="sr-only">Activer les restrictions par pays</span>
                    <span
                      className={`${
                        isGlobalRestrictionEnabled 
                          ? 'translate-x-8 sm:translate-x-7' 
                          : 'translate-x-1'
                      } inline-block h-8 w-8 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform`}
                    />
                  </button>
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isGlobalRestrictionEnabled ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                isGlobalRestrictionEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isGlobalRestrictionEnabled 
                      ? 'bg-green-100 dark:bg-green-800' 
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    {isGlobalRestrictionEnabled ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isGlobalRestrictionEnabled 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {isGlobalRestrictionEnabled 
                        ? "Restrictions activées" 
                        : "Restrictions désactivées"}
                    </p>
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {isGlobalRestrictionEnabled 
                        ? "Le système vérifiera l'origine des utilisateurs et restreindra l'accès selon les règles ci-dessous." 
                        : "Les restrictions par pays sont actuellement désactivées. Tous les pays peuvent accéder à l'application."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isGlobalRestrictionEnabled && (
            <>
              {/* Section Liste des pays */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-5 blur-xl"></div>
                <div className={`relative p-6 rounded-2xl shadow-xl border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <ShieldCheckIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Liste des pays configurés
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {countries.length} pays configurés
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 w-full sm:w-auto ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                      }`}
                    >
                      <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm sm:text-base">{showAddForm ? 'Masquer' : 'Ajouter un pays'}</span>
                    </button>
                  </div>

                  {showAddForm && (
                    <div className={`p-6 rounded-xl mb-6 border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="mb-4">
                        <label htmlFor="country-search" className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                          Rechercher un pays
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="country-search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nom ou code du pays"
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-colors duration-200 ${
                              isDarkMode
                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none'
                            }`}
                          />
                          <div className="absolute right-3 top-3.5">
                            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {filteredCountries.length > 0 && (
                        <div className={`max-h-80 overflow-y-auto rounded-xl border ${
                          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          {filteredCountries.slice(0, 10).map(country => (
                            <div 
                              key={country.code}
                              className={`flex justify-between items-center p-4 hover:bg-opacity-10 hover:bg-purple-500 cursor-pointer transition-colors duration-200 ${
                                isDarkMode ? 'border-gray-700' : 'border-gray-200'
                              } ${filteredCountries.indexOf(country) !== filteredCountries.length - 1 ? 'border-b' : ''}`}
                              onClick={() => addCountry(country)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img 
                                    src={country.flag} 
                                    alt={country.name} 
                                    className="h-6 w-8 rounded shadow-sm"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'inline';
                                    }}
                                  />
                                  <span style={{ display: 'none' }} className="text-lg">{country.emoji || '🌍'}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{country.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{country.code}</div>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {country.code}
                              </div>
                            </div>
                          ))}
                          {filteredCountries.length > 10 && (
                            <div className={`p-4 text-center text-sm font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              + {filteredCountries.length - 10} autres résultats
                            </div>
                          )}
                        </div>
                      )}

                      {searchTerm && filteredCountries.length === 0 && (
                        <div className={`p-6 text-center rounded-xl ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <GlobeAltIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">Aucun pays trouvé</p>
                          <p className="text-sm mt-1">Essayez avec d'autres termes de recherche</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Liste des pays - Cards sur mobile, Tableau sur desktop */}
                  {countries.length > 0 ? (
                    <>
                      {/* Cards pour mobile */}
                      <div className="sm:hidden space-y-3">
                        {countries.map((country) => (
                          <div 
                            key={country.code}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img 
                                    src={country.flag} 
                                    alt={country.name} 
                                    className="h-8 w-10 rounded shadow-sm"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'inline';
                                    }}
                                  />
                                  <span style={{ display: 'none' }} className="text-xl">{country.emoji || '🌍'}</span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {country.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {country.code}
                                  </div>
                                </div>
                              </div>
                              
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                country.is_allowed
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700'
                              }`}>
                                {country.is_allowed ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    Autorisé
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <XCircleIcon className="h-3 w-3" />
                                    Bloqué
                                  </div>
                                )}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleCountryStatus(country.code)}
                                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                                  country.is_allowed
                                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                                    : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                                }`}
                              >
                                {country.is_allowed ? (
                                  <>
                                    <XCircleIcon className="h-4 w-4" />
                                    <span className="text-xs">Bloquer</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4" />
                                    <span className="text-xs">Autoriser</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => removeCountry(country.code)}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-all duration-200 transform hover:scale-105"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tableau pour desktop */}
                      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                              <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                  Pays
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                  Code
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                  Statut
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${
                              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                            }`}>
                              {countries.map((country) => (
                                <tr key={country.code} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} style={{transition: 'background-color 0.2s'}}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <img 
                                          src={country.flag} 
                                          alt={country.name} 
                                          className="h-6 w-8 rounded shadow-sm"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline';
                                          }}
                                        />
                                        <span style={{ display: 'none' }} className="text-lg">{country.emoji || '🌍'}</span>
                                      </div>
                                      <span className="font-medium text-gray-900 dark:text-white">{country.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {country.code}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                      country.is_allowed
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700'
                                    }`}>
                                      {country.is_allowed ? (
                                        <div className="flex items-center gap-1">
                                          <CheckCircleIcon className="h-3 w-3" />
                                          Autorisé
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <XCircleIcon className="h-3 w-3" />
                                          Bloqué
                                        </div>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => toggleCountryStatus(country.code)}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                                          country.is_allowed
                                            ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                                            : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                                        }`}
                                      >
                                        {country.is_allowed ? (
                                          <>
                                            <XCircleIcon className="h-4 w-4" />
                                            Bloquer
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Autoriser
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => removeCountry(country.code)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-all duration-200 transform hover:scale-105"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                        Supprimer
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`p-8 rounded-xl border text-center ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <GlobeAltIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Aucun pays configuré
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Ajoutez des pays pour définir des restrictions d'accès
                      </div>
                    </div>
                  )}

                  {/* Section Informations */}
                  <div className={`mt-6 p-6 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-yellow-900/20 border-yellow-700/30 text-yellow-200' 
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-yellow-800' : 'bg-yellow-100'
                        }`}>
                          <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-3">Informations importantes</h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400 mt-2 flex-shrink-0"></div>
                            <p className="text-sm">
                              Les restrictions par pays sont basées sur la géolocalisation des adresses IP.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400 mt-2 flex-shrink-0"></div>
                            <p className="text-sm">
                              Si aucun pays n'est configuré, tous les pays seront {isGlobalRestrictionEnabled ? 'bloqués' : 'autorisés'} par défaut.
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 dark:bg-yellow-400 mt-2 flex-shrink-0"></div>
                            <p className="text-sm">
                              Les utilisateurs des pays bloqués recevront un message d'erreur leur indiquant que le service n'est pas disponible dans leur région.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CountryAccessSettings;
