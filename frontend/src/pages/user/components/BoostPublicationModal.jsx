import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Alert,
  CircularProgress,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Avatar,
} from "@mui/material";
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import axios from "../../../utils/axios";
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from "../../../config";
import { countries } from "../../../data/countries";

// Pas besoin d'importer des icônes de méthodes de paiement car on n'utilise que solifin-wallet
import Notification from "../../../components/Notification";

// Prix par défaut par jour pour le boost d'une publication (si le paramètre n'est pas défini)
const DEFAULT_PRICE_PER_DAY = 1; // USD

// Mapping des méthodes de paiement (uniquement wallet SOLIFIN)
const paymentMethodsMap = {
  [PAYMENT_TYPES.WALLET]: {
    name: "Wallet SOLIFIN",
    color: "#2196F3", // Bleu
    options: [],
  },
};

// Configuration des champs de formulaire pour chaque méthode de paiement
const paymentMethodFields = {
  [PAYMENT_TYPES.WALLET]: [],
};

// Transformation des méthodes de paiement pour l'interface utilisateur (uniquement wallet SOLIFIN)
const paymentMethods = [
  {
    id: PAYMENT_TYPES.WALLET,
    name: "Mon Wallet",
    icon: "wallet",
    category: "direct",
    options: PAYMENT_METHODS[PAYMENT_TYPES.WALLET],
  },
];

// Styles CSS personnalisés pour le modal
const customStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  
  .modal-animation {
    animation: modalFadeIn 0.3s ease-out forwards;
  }
  
  .modal-blur-overlay {
    backdrop-filter: blur(5px);
    transition: backdrop-filter 0.3s ease;
  }
  
  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  .slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }
  
  .pulse {
    animation: pulse 2s infinite;
  }
  
  .method-card {
    transition: all 0.3s ease;
    border: 2px solid transparent;
    border-radius: 8px;
    padding: 12px;
  }
  
  .method-card:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
  
  .method-card.selected {
    border-color: #1976d2;
    background-color: rgba(25, 118, 210, 0.05);
  }
  
  .dark .method-card:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .dark .method-card.selected {
    border-color: #90caf9;
    background-color: rgba(144, 202, 249, 0.1);
  }
  
  .summary-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
    backdrop-filter: blur(5px);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .dark .summary-card {
    background: linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.7) 100%);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
  
  .dark .summary-card:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
  
  /* Styles pour le menu déroulant en mode sombre */
  .MuiPaper-root.MuiMenu-paper.MuiPopover-paper.MuiPaper-elevation {
    background-color: #fff;
  }
  
  .dark .MuiPaper-root.MuiMenu-paper.MuiPopover-paper.MuiPaper-elevation {
    background-color: #1e283b !important;
    color: white;
  }
  
  .dark .MuiMenuItem-root:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
  }
`;

export default function BoostPublicationModal({
  isOpen,
  onClose,
  publication,
  publicationType,
}) {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Wallet SOLIFIN est la seule méthode de paiement disponible
  const selectedPaymentOption = "solifin-wallet";
  const [days, setDays] = useState(7);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [walletBalanceUSD, setWalletBalanceUSD] = useState(0);
  const [walletBalanceCDF, setWalletBalanceCDF] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(DEFAULT_PRICE_PER_DAY);
  const [totalAmount, setTotalAmount] = useState(DEFAULT_PRICE_PER_DAY * 7);
  const [formIsValid, setFormIsValid] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: sélection devise, 1: configuration boost

  // Récupérer le solde du wallet au chargement et réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      setCurrentStep(0); // Toujours commencer à l'étape 0
      setSelectedCurrency("USD"); // Réinitialiser la devise
      setDays(7); // Réinitialiser les jours
      setFormIsValid(false); // Réinitialiser la validation
    }
  }, [isOpen]);

  // Effet pour récupérer le prix du boost lorsque la devise change
  useEffect(() => {
    if (isOpen && selectedCurrency) {
      fetchBoostPrice(selectedCurrency);
    }
  }, [selectedCurrency, isOpen]);

  // Effet pour mettre à jour le montant total lorsque le nombre de jours ou le prix change
  useEffect(() => {
    if (currentStep === 1) {
      // Ne calculer que si nous sommes à l'étape de configuration
      const amount = pricePerDay * days;
      setTotalAmount(amount);

      // Vérifier la validité du formulaire
      validateForm();
    }
  }, [days, pricePerDay, currentStep]);

  // Récupérer le solde du wallet
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get("/api/userwallet/balance");
      console.log(response);
      if (response.data.success) {
        // Nettoyer les valeurs avant de les parser
        const cleanBalanceUSD = (response.data.balance_usd || "0").replace(
          /[^0-9.-]/g,
          ""
        );
        const cleanBalanceCDF = (response.data.balance_cdf || "0").replace(
          /[^0-9.-]/g,
          ""
        );

        setWalletBalanceUSD(parseFloat(cleanBalanceUSD) || 0);
        setWalletBalanceCDF(parseFloat(cleanBalanceCDF) || 0);
      } else {
        console.error(
          "Erreur lors de la récupération du solde:",
          response.data.message
        );
        setWalletBalanceUSD(0);
        setWalletBalanceCDF(0);
        Notification.error(
          "Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page."
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du solde:", error);
      setWalletBalanceUSD(0);
      setWalletBalanceCDF(0);
      Notification.error(
        "Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page."
      );
    }
  };

  // Récupérer le prix du boost selon la devise
  const fetchBoostPrice = async (currency = "USD") => {
    try {
      const response = await axios.get(`/api/boost-price?currency=${currency}`);
      if (response.data.success) {
        setPricePerDay(parseFloat(response.data.price));
      } else {
        console.error(
          "Erreur lors de la récupération du prix du boost:",
          response.data.message
        );
        setPricePerDay(DEFAULT_PRICE_PER_DAY);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du prix du boost:", error);
      setPricePerDay(DEFAULT_PRICE_PER_DAY);
    }
  };

  // Vérifier si le formulaire est valide selon l'étape actuelle
  const validateForm = () => {
    if (currentStep === 0) {
      // Étape 0: sélection de devise
      const isValid = selectedCurrency === "USD" || selectedCurrency === "CDF";
      setFormIsValid(isValid);
      return isValid;
    } else {
      // Étape 1: configuration du boost
      const isValid = days > 0;
      setFormIsValid(isValid);
      return isValid;
    }
  };

  // Gérer la sélection de devise
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setCurrentStep(1); // Passer à l'étape de configuration
    setFormIsValid(false); // Réinitialiser la validation jusqu'à ce que le prix soit chargé
  };

  // Revenir à la sélection de devise
  const handleBackToCurrency = () => {
    setCurrentStep(0);
    setFormIsValid(selectedCurrency === "USD" || selectedCurrency === "CDF");
  };

  // Gérer la soumission du formulaire - simplifié pour wallet SOLIFIN uniquement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Vérifier si le solde du wallet est suffisant selon la devise sélectionnée
    const currentBalance =
      selectedCurrency === "USD" ? walletBalanceUSD : walletBalanceCDF;
    if (totalAmount > currentBalance) {
      setError(
        `Solde insuffisant dans votre wallet (${
          selectedCurrency === "USD" ? "USD" : "CDF"
        })`
      );
      setLoading(false);
      return;
    }

    // Vérifier si tous les champs requis sont remplis
    if (!formIsValid) {
      setError("Veuillez remplir tous les champs obligatoires");
      setLoading(false);
      return;
    }

    try {
      // Déterminer le type de publication pour l'API
      let apiEndpoint;
      switch (publicationType) {
        case "advertisement":
          apiEndpoint = `/api/publicites/${publication.id}/boost`;
          break;
        case "jobOffer":
          apiEndpoint = `/api/offres-emploi/${publication.id}/boost`;
          break;
        case "businessOpportunity":
          apiEndpoint = `/api/opportunites-affaires/${publication.id}/boost`;
          break;
        default:
          throw new Error("Type de publication non pris en charge");
      }

      // Préparer les données pour l'API - inclure la devise sélectionnée
      const paymentData = {
        days,
        paymentMethod: selectedPaymentOption, // solifin-wallet
        paymentType: "wallet",
        currency: selectedCurrency, // Utiliser la devise sélectionnée
        amount: totalAmount,
      };

      // Envoyer la demande de boost
      const response = await axios.post(apiEndpoint, paymentData);

      if (response.data.success) {
        Notification.success(
          "Publication boostée avec succès! La durée d'affichage a été prolongée."
        );
        onClose(true); // Passer true pour indiquer que le boost a réussi
      } else {
        const errorMessage =
          response.data.message ||
          "Une erreur est survenue lors du boost de la publication.";
        Notification.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Erreur lors du boost de la publication:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Une erreur est survenue lors du boost de la publication.";
      Notification.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour  // Rendu des champs de formulaire spécifiques à la méthode de paiement (simplifié pour wallet SOLIFIN)
  const renderPaymentFields = () => {
    // Pas de champs supplémentaires nécessaires pour le wallet SOLIFIN
    return null;
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "flex items-center justify-center" : "hidden"
      }`}
    >
      {/* Overlay semi-transparent avec effet de flou */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm modal-blur-overlay transition-all duration-300"
        onClick={onClose}
      ></div>

      {/* Contenu du modal */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col ${
          isDarkMode ? "dark" : ""
        } modal-animation transform transition-all duration-300 scale-100`}
        style={{
          boxShadow: isDarkMode
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* En-tête du modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white rounded-t-2xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <RocketLaunchIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-white">
                  Booster votre publication
                </Typography>
                <Typography
                  variant="body2"
                  className="text-blue-100 mt-1 opacity-90"
                >
                  Augmentez sa visibilité
                </Typography>
              </div>
            </div>
          </div>

          {/* Élément décoratif */}
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-8">
            <div className="w-full h-full rounded-full bg-white opacity-10"></div>
          </div>

          <IconButton
            onClick={onClose}
            size="small"
            className="text-white hover:text-gray-200 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 relative z-10"
            sx={{ padding: "8px" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Corps du modal avec défilement */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Stepper d'étapes */}
            <div className="mb-6">
              <Stepper
                activeStep={currentStep}
                alternativeLabel
                className="step-indicator"
              >
                <Step>
                  <StepLabel icon={<CurrencyDollarIcon className="h-5 w-5" />}>
                    <Typography
                      variant="body2"
                      className="hidden sm:block font-medium"
                    >
                      Devise
                    </Typography>
                    <Typography variant="caption" className="sm:hidden">
                      Devise
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel icon={<ArrowTrendingUpIcon className="h-5 w-5" />}>
                    <Typography
                      variant="body2"
                      className="hidden sm:block font-medium"
                    >
                      Configuration
                    </Typography>
                    <Typography variant="caption" className="sm:hidden">
                      Config
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </div>

            {/* Afficher les erreurs */}
            {error && (
              <Alert key="error-alert" severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Étape 0: Sélection de la devise */}
            {currentStep === 0 && (
              <div className="fade-in">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <CurrencyDollarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Typography
                        variant="h6"
                        className="font-bold text-gray-800 dark:text-gray-100"
                      >
                        Choisissez la devise
                      </Typography>
                      <Typography
                        variant="body2"
                        className="text-gray-600 dark:text-gray-400"
                      >
                        Sélectionnez votre devise de paiement
                      </Typography>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid gap-4 mb-6 ${
                    canUseCDF() ? "grid-cols-1" : "grid-cols-1"
                  }`}
                >
                  {/* Carte USD */}
                  <Card
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      selectedCurrency === "USD"
                        ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg"
                        : "border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300"
                    }`}
                    onClick={() => handleCurrencySelect("USD")}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedCurrency === "USD"
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            <span className="text-xl font-bold">$</span>
                          </div>
                          <div>
                            <Typography
                              variant="h6"
                              className={`font-bold ${
                                selectedCurrency === "USD"
                                  ? "text-blue-700 dark:text-blue-300"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              USD
                            </Typography>
                            <Typography
                              variant="body2"
                              className="text-gray-600 dark:text-gray-400"
                            >
                              Solde: ${walletBalanceUSD.toFixed(2)}
                            </Typography>
                          </div>
                        </div>
                        {selectedCurrency === "USD" && (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Carte CDF */}
                  {canUseCDF() && (
                    <Card
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                        selectedCurrency === "CDF"
                          ? "border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 shadow-lg"
                          : "border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-green-300"
                      }`}
                      onClick={() => handleCurrencySelect("CDF")}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                selectedCurrency === "CDF"
                                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
                                  : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              <span className="text-xl font-bold">FC</span>
                            </div>
                            <div>
                              <Typography
                                variant="h6"
                                className={`font-bold ${
                                  selectedCurrency === "CDF"
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                CDF
                              </Typography>
                              <Typography
                                variant="body2"
                                className="text-gray-600 dark:text-gray-400"
                              >
                                Solde:{" "}
                                {new Intl.NumberFormat("fr-CD", {
                                  style: "currency",
                                  currency: "CDF",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(walletBalanceCDF)}
                              </Typography>
                            </div>
                          </div>
                          {selectedCurrency === "CDF" && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="h-5 w-5 text-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Étape 1: Configuration du boost */}
            {currentStep === 1 && (
              <div className="fade-in">
                {/* Détails de la publication */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <RocketLaunchIcon className="h-6 w-6 text-white" />
                    </div>
                    <Typography
                      variant="h6"
                      className="font-bold text-gray-800 dark:text-gray-100"
                    >
                      Publication à booster
                    </Typography>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800/50 dark:to-gray-800/70 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <RocketLaunchIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-grow">
                        <Typography
                          variant="subtitle1"
                          className="font-bold text-gray-900 dark:text-gray-100 mb-2"
                        >
                          {publication?.titre || "Publication"}
                        </Typography>
                        <div className="flex flex-wrap gap-2">
                          <Chip
                            label={
                              publicationType === "advertisement"
                                ? "Publicité"
                                : publicationType === "jobOffer"
                                ? "Offre d'emploi"
                                : "Opportunité"
                            }
                            size="small"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium"
                          />
                          {publication?.duree_affichage && (
                            <Chip
                              label={`${publication.duree_affichage} jours`}
                              size="small"
                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Devise sélectionnée */}
                <div className="mb-6">
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-700/30 p-4 rounded-xl border border-blue-100 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedCurrency === "USD"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
                        }`}
                      >
                        <span className="text-lg font-bold">
                          {selectedCurrency === "USD" ? "$" : "FC"}
                        </span>
                      </div>
                      <div>
                        <Typography
                          variant="body1"
                          className="font-bold text-gray-800 dark:text-gray-200"
                        >
                          {selectedCurrency === "USD" ? "Dollars" : "Francs"}
                        </Typography>
                        <Typography
                          variant="body2"
                          className="text-gray-600 dark:text-gray-400"
                        >
                          Wallet {selectedCurrency}
                        </Typography>
                      </div>
                    </div>
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleBackToCurrency}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Modifier
                    </Button>
                  </div>
                </div>

                {/* Durée du boost */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                    </div>
                    <Typography
                      variant="h6"
                      className="font-bold text-gray-800 dark:text-gray-100"
                    >
                      Durée du boost
                    </Typography>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800/50 dark:to-gray-800/70 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
                    <div className="flex flex-col gap-4">
                      <TextField
                        label="Nombre de jours"
                        type="number"
                        value={days}
                        onChange={(e) =>
                          setDays(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                jours
                              </span>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ min: 1 }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            "&:hover fieldset": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "primary.main",
                            },
                          },
                        }}
                      />

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Prix/jour:
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {selectedCurrency === "USD" ? "$" : "FC"}
                            {pricePerDay.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            Total:
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {selectedCurrency === "USD" ? "$" : ""}
                            {totalAmount.toFixed(2)}
                            {selectedCurrency === "CDF" ? " FC" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solde du wallet */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <WalletIcon className="h-6 w-6 text-white" />
                    </div>
                    <Typography
                      variant="h6"
                      className="font-bold text-gray-800 dark:text-gray-100"
                    >
                      Solde disponible
                    </Typography>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800/50 dark:to-gray-800/70 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography
                          variant="body2"
                          className="text-gray-600 dark:text-gray-400 mb-1"
                        >
                          Wallet {selectedCurrency}
                        </Typography>
                        <Typography
                          variant="h5"
                          className="font-bold text-gray-900 dark:text-gray-100"
                        >
                          {selectedCurrency === "USD"
                            ? `$${(selectedCurrency === "USD"
                                ? walletBalanceUSD
                                : walletBalanceCDF
                              ).toFixed(2)}`
                            : new Intl.NumberFormat("fr-CD", {
                                style: "currency",
                                currency: "CDF",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(
                                selectedCurrency === "USD"
                                  ? walletBalanceUSD
                                  : walletBalanceCDF
                              )}
                        </Typography>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          totalAmount >
                          (selectedCurrency === "USD"
                            ? walletBalanceUSD
                            : walletBalanceCDF)
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        }`}
                      >
                        {totalAmount >
                        (selectedCurrency === "USD"
                          ? walletBalanceUSD
                          : walletBalanceCDF)
                          ? "Insuffisant"
                          : "Disponible"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              {currentStep === 1 && (
                <Button
                  variant="outlined"
                  onClick={handleBackToCurrency}
                  disabled={loading}
                  className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl"
                >
                  Retour
                </Button>
              )}

              <div className="flex gap-3 ml-auto">
                <Button
                  variant="outlined"
                  onClick={onClose}
                  disabled={loading}
                  className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl"
                >
                  Annuler
                </Button>

                {currentStep === 0 && (
                  <Button
                    variant="contained"
                    disabled={!formIsValid || loading}
                    onClick={() => handleCurrencySelect(selectedCurrency)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 rounded-xl shadow-lg"
                  >
                    Continuer
                  </Button>
                )}

                {currentStep === 1 && (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      !formIsValid ||
                      loading ||
                      totalAmount >
                        (selectedCurrency === "USD"
                          ? walletBalanceUSD
                          : walletBalanceCDF)
                    }
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 rounded-xl shadow-lg"
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading
                      ? "Traitement..."
                      : `Payer ${
                          selectedCurrency === "USD" ? "$" : ""
                        }${totalAmount.toFixed(2)}${
                          selectedCurrency === "CDF" ? " FC" : ""
                        }`}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
