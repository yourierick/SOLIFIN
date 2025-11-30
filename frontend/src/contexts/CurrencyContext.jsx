/**
 * CurrencyContext.jsx - Contexte pour la gestion des devises
 *
 * Ce contexte gère la configuration des devises disponibles dans l'application,
 * en particulier l'activation/désactivation de la devise CDF basée sur le paramètre
 * 'dual_currency' des settings du backend.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Création du contexte
const CurrencyContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency doit être utilisé dans un CurrencyProvider");
  }
  return context;
};

// Provider du contexte
export const CurrencyProvider = ({ children }) => {
  const [isCDFEnabled, setIsCDFEnabled] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour charger la configuration des devises
  const fetchCurrencySettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/settings/dual_currency");

      const dualCurrencyValue = response.data?.setting?.value || "non";

      // Activer CDF seulement si la valeur est 'oui'
      const isEnabled = dualCurrencyValue === "oui";

      setIsCDFEnabled(isEnabled);
    } catch (err) {
      setError(err);
      // En cas d'erreur, on désactive CDF par sécurité
      setIsCDFEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour basculer entre USD et CDF
  const toggleCurrency = () => {
    if (isCDFEnabled) {
      setSelectedCurrency((prev) => (prev === "USD" ? "CDF" : "USD"));
    }
  };

  // Fonction pour définir la devise
  const setCurrency = (currency) => {
    if (isCDFEnabled && (currency === "USD" || currency === "CDF")) {
      setSelectedCurrency(currency);
    } else if (currency === "USD") {
      setSelectedCurrency("USD");
    }
  };

  // Charger la configuration au montage du composant
  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  // Valeurs fournies par le contexte
  const value = {
    isCDFEnabled,
    selectedCurrency,
    setSelectedCurrency,
    toggleCurrency,
    setCurrency,
    loading,
    error,
    refetch: fetchCurrencySettings,
    // Helper pour vérifier rapidement
    canUseCDF: () => isCDFEnabled && !loading,
    // Liste des devises disponibles
    availableCurrencies: isCDFEnabled ? ["USD", "CDF"] : ["USD"],
    // Configuration par défaut
    defaultCurrency: "USD",
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
