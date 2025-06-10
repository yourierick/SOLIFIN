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
    <div className="space-y-6">
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des accès par pays</h2>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-4 py-2 rounded-md ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GlobeAltIcon className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-medium">Mode de restriction</h3>
              </div>
              <Switch
                checked={isGlobalRestrictionEnabled}
                onChange={toggleGlobalRestriction}
                className={`${
                  isGlobalRestrictionEnabled ? 'bg-blue-600' : 'bg-gray-400'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span className="sr-only">Activer les restrictions par pays</span>
                <span
                  className={`${
                    isGlobalRestrictionEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isGlobalRestrictionEnabled 
                ? "Le système vérifiera l'origine des utilisateurs et restreindra l'accès selon les règles ci-dessous." 
                : "Les restrictions par pays sont actuellement désactivées. Tous les pays peuvent accéder à l'application."}
            </p>
          </div>

          {isGlobalRestrictionEnabled && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Liste des pays configurés
                </h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`flex items-center px-3 py-1 rounded-md text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <PlusCircleIcon className="h-4 w-4 mr-1" />
                  {showAddForm ? 'Masquer' : 'Ajouter un pays'}
                </button>
              </div>

              {showAddForm && (
                <div className={`p-4 rounded-lg mb-4 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="mb-4">
                    <label htmlFor="country-search" className="block text-sm font-medium mb-1">
                      Rechercher un pays
                    </label>
                    <input
                      type="text"
                      id="country-search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom ou code du pays"
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {filteredCountries.length > 0 && (
                    <div className={`max-h-60 overflow-y-auto rounded-md ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      {filteredCountries.slice(0, 10).map(country => (
                        <div 
                          key={country.code}
                          className={`flex justify-between items-center p-2 hover:bg-opacity-10 hover:bg-blue-500 cursor-pointer ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          } ${filteredCountries.indexOf(country) !== filteredCountries.length - 1 ? 'border-b' : ''}`}
                          onClick={() => addCountry(country)}
                        >
                          <div className="flex items-center">
                            <img 
                              src={country.flag} 
                              alt={country.name} 
                              className="h-4 w-4 mr-2"
                              onError={(e) => {
                                // Fallback vers emoji en cas d'erreur de chargement de l'image
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'inline';
                              }}
                            />
                            <span style={{ display: 'none' }}>{country.emoji || '🌍'}</span>
                            <span>{country.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {country.code}
                          </span>
                        </div>
                      ))}
                      {filteredCountries.length > 10 && (
                        <div className={`p-2 text-center text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          + {filteredCountries.length - 10} autres résultats
                        </div>
                      )}
                    </div>
                  )}

                  {searchTerm && filteredCountries.length === 0 && (
                    <div className={`p-3 text-center rounded-md ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      Aucun pays trouvé
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Pays
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Statut
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {countries.length > 0 ? (
                      countries.map((country) => (
                        <tr key={country.code} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={country.flag} 
                                alt={country.name} 
                                className="h-5 w-auto mr-2"
                                onError={(e) => {
                                  // Fallback vers emoji en cas d'erreur de chargement de l'image
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'inline';
                                }}
                              />
                              <span style={{ display: 'none' }}>{country.emoji || '🌍'}</span>
                              <span>{country.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {country.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              country.is_allowed
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {country.is_allowed ? 'Autorisé' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => toggleCountryStatus(country.code)}
                              className={`inline-flex items-center px-2 py-1 rounded ${
                                country.is_allowed
                                  ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                            >
                              {country.is_allowed ? (
                                <>
                                  <XCircleIcon className="h-4 w-4 mr-1" />
                                  Bloquer
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Autoriser
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => removeCountry(country.code)}
                              className="inline-flex items-center px-2 py-1 rounded text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Aucun pays configuré. Ajoutez des pays pour définir des restrictions d'accès.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`p-4 rounded-lg mt-4 ${
                isDarkMode ? 'bg-yellow-900 bg-opacity-30 text-yellow-200' : 'bg-yellow-50 text-yellow-800'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Informations importantes</h3>
                    <div className="mt-2 text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Les restrictions par pays sont basées sur la géolocalisation des adresses IP.</li>
                        <li>Si aucun pays n'est configuré, tous les pays seront {isGlobalRestrictionEnabled ? 'bloqués' : 'autorisés'} par défaut.</li>
                        <li>Les utilisateurs des pays bloqués recevront un message d'erreur leur indiquant que le service n'est pas disponible dans leur région.</li>
                      </ul>
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
