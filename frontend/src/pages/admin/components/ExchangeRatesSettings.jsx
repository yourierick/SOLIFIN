import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ExchangeRatesSettings = () => {
  const { isDarkMode } = useTheme();
  const [rates, setRates] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Couleurs pour le thème
  const themeColors = {
    bg: isDarkMode ? "bg-[#1f2937]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    card: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    input: isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/admin/exchange-rates");
      if (response.data.success) {
        setRates(response.data.data.rates);
        setCurrencies(response.data.data.currencies);
        setLastUpdate(response.data.data.last_update);
      } else {
        setError("Erreur lors de la récupération des taux de change");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de la récupération des taux de change:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeRates = async () => {
    setUpdating(true);
    setError(null);
    try {
      const response = await axios.post("/api/admin/exchange-rates/update", {
        base_currency: "USD", // Devise de base par défaut
      });

      if (response.data.success) {
        setRates(response.data.data.rates);
        setCurrencies(response.data.data.currencies);
        setLastUpdate(response.data.data.last_update);
        toast.success("Taux de change mis à jour avec succès");
      } else {
        setError("Erreur lors de la mise à jour des taux de change");
        toast.error("Erreur lors de la mise à jour des taux de change");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      toast.error("Erreur de connexion au serveur");
      console.error("Erreur lors de la mise à jour des taux de change:", err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Jamais";
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`${themeColors.bg} ${themeColors.text} rounded-lg p-4`}>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour: {formatDate(lastUpdate)}
          </p>
        </div>
        <button
          onClick={updateExchangeRates}
          disabled={updating}
          className={`${
            themeColors.button
          } flex items-center px-4 py-2 rounded-lg mt-4 md:mt-0 transition-all duration-200 ${
            updating ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {updating ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Mise à jour en cours...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Mettre à jour les taux
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg mb-6 flex items-start">
        <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Information</p>
          <p className="text-sm mt-1">
            Les taux de change sont récupérés depuis l'API externe
            open.er-api.com. Ils sont automatiquement mis à jour chaque jour à
            1h30 du matin. Vous pouvez également les mettre à jour manuellement
            en cliquant sur le bouton ci-dessus.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            Tableau des taux de change
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Ce tableau présente les taux de change entre les différentes devises
            supportées par le système. Chaque cellule indique combien vaut 1
            unité de la devise de la ligne en unités de la devise de la colonne.
          </p>

          <div
            className={`${themeColors.card} rounded-lg shadow-sm border ${themeColors.border} overflow-hidden`}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    De / Vers
                  </th>
                  {currencies.map((currency) => (
                    <th
                      key={currency}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getCurrencyFlag(currency)}
                        </span>
                        <span>{currency}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {currencies.map((fromCurrency, rowIndex) => (
                  <tr
                    key={fromCurrency}
                    className={
                      rowIndex % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/50"
                    }
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {getCurrencyFlag(fromCurrency)}
                        </span>
                        <span className="font-medium">{fromCurrency}</span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({getCurrencySymbol(fromCurrency)})
                        </span>
                      </div>
                    </td>
                    {currencies.map((toCurrency) => {
                      // Si c'est la même devise, afficher 1.0000
                      if (fromCurrency === toCurrency) {
                        return (
                          <td
                            key={`${fromCurrency}-${toCurrency}`}
                            className="px-4 py-3 whitespace-nowrap font-mono text-center bg-gray-100 dark:bg-gray-800"
                          >
                            1.0000
                          </td>
                        );
                      }

                      const rate = rates[fromCurrency]?.find(
                        (r) => r.target_currency === toCurrency
                      )?.rate;

                      return (
                        <td
                          key={`${fromCurrency}-${toCurrency}`}
                          className="px-4 py-3 whitespace-nowrap font-mono text-right"
                        >
                          {rate ? parseFloat(rate).toFixed(4) : "N/A"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">Détails des devises</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currencies.map((currency) => (
              <div
                key={`details-${currency}`}
                className={`${themeColors.card} rounded-lg shadow-sm border ${themeColors.border} p-4`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    {getCurrencyFlag(currency)}
                  </div>
                  <div>
                    <h4 className="font-medium">{currency}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getCurrencyName(currency)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span>Symbole:</span>
                    <span className="font-medium">
                      {getCurrencySymbol(currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction pour obtenir le drapeau d'une devise
const getCurrencyFlag = (currencyCode) => {
  const countryCodeMap = {
    USD: "us",
    EUR: "eu",
    XOF: "sn", // Utilisation du drapeau du Sénégal pour le Franc CFA BCEAO
    XAF: "cm", // Utilisation du drapeau du Cameroun pour le Franc CFA BEAC
    CDF: "cd",
  };

  const countryCode = countryCodeMap[currencyCode];

  if (!countryCode) return <span>🏳️</span>;

  return (
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={`Drapeau ${currencyCode}`}
      className="h-4 w-6 inline-block"
      onError={(e) => {
        // Fallback vers emoji si l'image ne charge pas
        e.target.onerror = null;
        e.target.style.display = "none";
        e.target.parentNode.innerHTML = getFlagEmoji(countryCode);
      }}
    />
  );
};

// Fonction de secours pour générer un emoji de drapeau si l'image ne charge pas
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🏳️";

  // Pour les emojis de drapeau, on convertit les lettres en leur équivalent regional indicator symbol
  const codePoints = [...countryCode.toUpperCase()].map(
    (char) => 127397 + char.charCodeAt(0)
  );

  return String.fromCodePoint(...codePoints);
};

// Fonction pour obtenir le nom complet d'une devise
const getCurrencyName = (currencyCode) => {
  const nameMap = {
    USD: "Dollar américain",
    EUR: "Euro",
    XOF: "Franc CFA BCEAO",
    XAF: "Franc CFA BEAC",
    CDF: "Franc Congolais",
  };

  return nameMap[currencyCode] || currencyCode;
};

// Fonction pour obtenir le symbole d'une devise
const getCurrencySymbol = (currencyCode) => {
  const symbolMap = {
    USD: "$",
    EUR: "€",
    XOF: "CFA",
    XAF: "FCFA",
    CDF: "FC",
  };

  return symbolMap[currencyCode] || currencyCode;
};

export default ExchangeRatesSettings;
