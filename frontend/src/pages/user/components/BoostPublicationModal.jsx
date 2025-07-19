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
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../../contexts/ThemeContext";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Wallet SOLIFIN est la seule méthode de paiement disponible
  const paymentMethod = PAYMENT_TYPES.WALLET;
  const selectedPaymentOption = "solifin-wallet";
  const [days, setDays] = useState(7);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(DEFAULT_PRICE_PER_DAY);
  const [totalAmount, setTotalAmount] = useState(DEFAULT_PRICE_PER_DAY * 7);
  const [formIsValid, setFormIsValid] = useState(false);

  // Récupérer le solde du wallet et le prix du boost au chargement
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      fetchBoostPrice();

      // Calculer le montant total initial
      const amount = pricePerDay * days;
      setTotalAmount(amount);

      // Vérifier la validité du formulaire
      validateForm();
    }
  }, [isOpen]);

  // Effet pour mettre à jour le montant total lorsque le nombre de jours change
  useEffect(() => {
    const amount = pricePerDay * days;
    setTotalAmount(amount);

    // Vérifier la validité du formulaire
    validateForm();
  }, [days, pricePerDay]);

  // Récupérer le solde du wallet
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get("/api/userwallet/balance");
      if (response.data.success) {
        setWalletBalance(parseFloat(response.data.balance));
      } else {
        console.error(
          "Erreur lors de la récupération du solde:",
          response.data.message
        );
        setWalletBalance(0);
        Notification.error(
          "Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page."
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du solde:", error);
      setWalletBalance(0);
      Notification.error(
        "Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page."
      );
    }
  };

  // Récupérer le prix du boost
  const fetchBoostPrice = async () => {
    try {
      const response = await axios.get("/api/boost-price");
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

  // Vérifier si le formulaire est valide - simplifié pour n'utiliser que le wallet SOLIFIN
  const validateForm = () => {
    // Pour le wallet SOLIFIN, on vérifie uniquement que le nombre de jours est valide
    const isValid = days > 0;
    setFormIsValid(isValid);
    return isValid;
  };

  // Gérer la soumission du formulaire - simplifié pour wallet SOLIFIN uniquement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Vérifier si le solde du wallet est suffisant
    if (totalAmount > walletBalance) {
      setError("Solde insuffisant dans votre wallet");
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

      // Préparer les données pour l'API - simplifié pour wallet uniquement
      const paymentData = {
        days,
        paymentMethod: selectedPaymentOption, // solifin-wallet
        paymentType: PAYMENT_TYPES.WALLET,
        paymentOption: selectedPaymentOption,
        currency: "USD", // Le wallet utilise toujours USD
        amount: totalAmount,
        fees: 0, // Pas de frais pour le wallet
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
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col ${
          isDarkMode ? "dark" : ""
        } modal-animation transform transition-all duration-300 scale-100`}
        style={{
          boxShadow: isDarkMode
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* En-tête du modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-800 dark:to-primary-700 text-white rounded-t-xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <Typography variant="h6" className="font-bold text-white">
              Booster votre publication
            </Typography>
            <Typography
              variant="body2"
              className="text-gray-100 mt-1 opacity-90"
            >
              Prolongez la durée d'affichage de votre publication
            </Typography>
          </div>

          {/* Élément décoratif */}
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-8">
            <div className="w-full h-full rounded-full bg-white opacity-10"></div>
          </div>

          <IconButton
            onClick={onClose}
            size="small"
            className="text-white hover:text-gray-200 hover:bg-primary-700 dark:hover:bg-primary-900 transition-colors duration-200 relative z-10"
            sx={{ padding: "8px" }}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>

        {/* Corps du modal avec défilement */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Afficher les erreurs */}
            {error && (
              <Alert key="error-alert" severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Détails de la publication */}
            <div className="mb-8 fade-in">
              <div className="flex items-center mb-3">
                <div className="w-1 h-6 bg-primary-500 dark:bg-primary-400 rounded-full mr-2"></div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 dark:text-gray-100"
                >
                  Détails de la publication
                </Typography>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/90 p-5 rounded-xl shadow-sm mb-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="flex-grow">
                    <Typography
                      variant="subtitle1"
                      className="font-medium text-primary-700 dark:text-primary-300"
                    >
                      {publication?.titre || "Publication"}
                    </Typography>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {publicationType === "advertisement"
                          ? "Publicité"
                          : publicationType === "jobOffer"
                          ? "Offre d'emploi"
                          : "Opportunité d'affaire"}
                      </span>
                      {publication?.duree_affichage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {publication.duree_affichage} jours d'affichage
                        </span>
                      )}
                    </div>
                    <Typography
                      variant="body2"
                      className="text-gray-600 dark:text-gray-300 mt-3"
                    >
                      Augmentez la visibilité de votre publication en
                      prolongeant sa durée d'affichage.
                    </Typography>
                  </div>
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 ml-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Durée du boost */}
            <div className="mb-8 slide-in">
              <div className="flex items-center mb-3">
                <div className="w-1 h-6 bg-primary-500 dark:bg-primary-400 rounded-full mr-2"></div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 dark:text-gray-100"
                >
                  Durée du boost
                </Typography>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/90 p-5 rounded-xl shadow-sm mb-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-grow">
                    <TextField
                      label="Durée du boost en jours"
                      type="number"
                      value={days}
                      onChange={(e) =>
                        setDays(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">jours</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 1 }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="flex-shrink-0 bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 min-w-[150px]">
                    <div
                      key="price-per-day"
                      className="flex justify-between text-sm text-gray-600 dark:text-gray-300"
                    >
                      <span>Prix/jour:</span>
                      <span className="font-medium">
                        ${pricePerDay.toFixed(2)}
                      </span>
                    </div>
                    <div
                      key="total-amount-info"
                      className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-primary-700 dark:text-primary-300"
                    >
                      <span>Total:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Méthode de paiement (uniquement wallet SOLIFIN) */}
            <div className="mb-8 fade-in">
              <div className="flex items-center mb-3">
                <div className="w-1 h-6 bg-primary-500 dark:bg-primary-400 rounded-full mr-2"></div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 dark:text-gray-100"
                >
                  Méthode de paiement
                </Typography>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/90 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="mb-2">
                  {/* Affichage du wallet SOLIFIN uniquement */}
                  <div
                    className="method-card rounded-xl shadow-md ring-2 transition-all duration-300"
                    style={{
                      borderColor: "transparent",
                      ringColor: "#2196F3",
                      transform: "translateY(-3px) scale(1.02)",
                      backgroundColor: isDarkMode ? "rgba(33, 150, 243, 0.1)" : "white",
                    }}
                  >
                    <div className="p-4 flex items-center">
                      <div
                        className="mr-4 flex items-center justify-center"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "12px",
                          backgroundColor: "rgba(33, 150, 243, 0.15)",
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <span className="text-2xl font-bold text-blue-500">
                            $
                          </span>
                        </div>
                      </div>

                      <div className="flex-grow">
                        <Typography
                          variant="subtitle2"
                          className="font-medium"
                        >
                          Mon Wallet
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-gray-500 dark:text-gray-400 block"
                        >
                          Solde: {walletBalance.toFixed(2)} USD
                        </Typography>
                      </div>

                      <Radio
                        checked={true}
                        size="small"
                        sx={{
                          padding: "2px",
                          "&.Mui-checked": {
                            color: "#2196F3",
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pas d'options de paiement spécifiques car on n'utilise que le wallet SOLIFIN */}

              {renderPaymentFields()}
            </div>

            {/* Récapitulatif */}
            <div className="mb-8 fade-in">
              <div className="flex items-center mb-3">
                <div className="w-1 h-6 bg-primary-500 dark:bg-primary-400 rounded-full mr-2"></div>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-800 dark:text-gray-100"
                >
                  Récapitulatif
                </Typography>
              </div>

              <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="space-y-3">
                  <div
                    key="boost-duration"
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-600 dark:text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <Typography variant="body2" className="font-medium">
                        Boost pour {days} jour{days > 1 ? "s" : ""}
                      </Typography>
                    </div>
                    <Typography variant="body2" className="font-semibold">
                      {paymentMethod === PAYMENT_TYPES.WALLET
                        ? `${totalAmount.toFixed(2)} ${CURRENCIES.USD.symbol}`
                        : `${convertedAmount?.convertedAmount?.toFixed(2)} ${
                            CURRENCIES[selectedCurrency].symbol
                          }`}
                    </Typography>
                  </div>

                  {selectedCurrency !== "USD" &&
                    paymentMethod !== PAYMENT_TYPES.WALLET && (
                      <div
                        key="exchange-rate"
                        className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 px-2"
                      >
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                          Taux de change
                        </span>
                        <span className="font-medium">
                          1 USD = {convertedAmount.rate} {selectedCurrency}
                        </span>
                      </div>
                    )}

                  {/* Les frais de transaction sont à zéro pour le wallet SOLIFIN */}

                  <div
                    key="total-amount"
                    className="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-200 dark:border-gray-600"
                  >
                    <Typography
                      variant="subtitle1"
                      className="font-bold text-gray-800 dark:text-gray-100"
                    >
                      Total à payer
                    </Typography>
                    <div className="flex items-center">
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-bold"
                      >
                        {(totalAmount || 0).toFixed(2)} {CURRENCIES.USD.symbol}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Alerte pour solde insuffisant */}
        {paymentMethod === PAYMENT_TYPES.WALLET &&
          totalAmount > walletBalance && (
            <Alert
              key="insufficient-balance-alert"
              severity="error"
              className="mx-6 mb-3"
            >
              Solde insuffisant dans votre wallet. Vous avez besoin de{" "}
              {totalAmount.toFixed(2)} USD mais votre solde est de{" "}
              {walletBalance.toFixed(2)} USD.
            </Alert>
          )}

        {/* Bouton de paiement - en dehors de la zone scrollable */}
        <div className="p-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="mb-4 sm:mb-0 flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <Typography
              variant="body2"
              className="text-gray-700 dark:text-gray-300 font-medium"
            >
              Paiement direct depuis votre wallet
            </Typography>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outlined"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors duration-200"
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: "medium",
              }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading ||
                !formIsValid ||
                (paymentMethod === PAYMENT_TYPES.WALLET &&
                  totalAmount > walletBalance)
              }
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: "bold",
                padding: "8px 20px",
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )
              }
            >
              {loading ? "Traitement..." : "Payer maintenant"}
            </Button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
    </div>
  );
}
