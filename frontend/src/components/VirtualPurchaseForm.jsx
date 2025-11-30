import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import axios from "../utils/axios";
import { toast } from "react-toastify";
import {
  XMarkIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { FaMoneyBillWave, FaCreditCard } from "react-icons/fa";
import { FaCoins } from "react-icons/fa";
import { PAYMENT_TYPES, PAYMENT_METHODS, CURRENCIES } from "../config";

// Import des icônes de mobile money
import airtelIcon from "../assets/icons-mobil-money/airtel.png";
import mpesaIcon from "../assets/icons-mobil-money/mpesa.png";
import orangeIcon from "../assets/icons-mobil-money/orange.png";
import africellIcon from "../assets/icons-mobil-money/afrimoney.png";

// Utiliser les devises depuis config.js
const currencies = Object.values(CURRENCIES).map((currency) => ({
  code: currency.code,
  name: currency.name,
  symbol: currency.symbol,
}));

// Utiliser les types de paiement depuis config.js
const paymentTypes = PAYMENT_TYPES;

// Mapper les icônes aux options de paiement Mobile Money depuis config.js
const mobileMoneyOptions = PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map(
  (option) => {
    let icon;
    let telecomCode;

    switch (option.id) {
      case "m-pesa":
        icon = mpesaIcon;
        telecomCode = "mpesa";
        break;
      case "orange-money":
        icon = orangeIcon;
        telecomCode = "orange";
        break;
      case "airtel-money":
        icon = airtelIcon;
        telecomCode = "airtel";
        break;
      case "afrimoney":
        icon = africellIcon;
        telecomCode = "africell";
        break;
      default:
        icon = null;
        telecomCode = option.id;
    }

    return { ...option, icon, telecomCode };
  }
);

// Utiliser les options de carte bancaire depuis config.js
const creditCardOptions = PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD];

// Le taux de change sera récupéré depuis l'API

export default function VirtualPurchaseForm({ onClose, updateWalletBalance }) {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF, availableCurrencies } = useCurrency();
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(
    canUseCDF() ? currencies[0] : currencies.find((c) => c.code === "USD")
  ); // USD par défaut si CDF non disponible
  const [exchangeRate, setExchangeRate] = useState(2500); // Valeur par défaut en attendant l'API
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    phoneNumber: "",
    phoneCode: "+243", // Indicatif téléphonique par défaut (RDC)
    currency: "USD", // Devise par défaut
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  const [purchaseFee, setPurchaseFee] = useState(0);
  const [feePercentage, setFeePercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [step, setStep] = useState(1); // 1: Saisie du montant et devise, 2: Sélection du type de paiement, 3: Sélection du moyen de paiement, 4: Confirmation, 5: Résultat
  const [transactionResult, setTransactionResult] = useState(null);

  // Utilisation du taux de conversion défini globalement

  // Récupérer le pourcentage de frais d'achat
  useEffect(() => {
    const fetchFeePercentage = async () => {
      try {
        const response = await axios.get("/api/userwallet/purchase-fee");
        if (response.data.success) {
          setFeePercentage(response.data.fee_percentage);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des frais:", error);
        setFeesError(true);
      }
    };

    fetchFeePercentage();
  }, []);

  // Calculer les frais en fonction du montant
  useEffect(() => {
    const calculateFees = () => {
      if (formData.amount && !isNaN(parseFloat(formData.amount))) {
        const amount = parseFloat(formData.amount);
        const fee = amount * (feePercentage / 100);
        setPurchaseFee(fee);
      } else {
        setPurchaseFee(0);
      }
    };

    calculateFees();
  }, [formData.amount, feePercentage]);

  // Valider le formulaire
  useEffect(() => {
    const validateForm = () => {
      const { amount, phoneNumber, cardNumber, cardHolder, expiryDate, cvv } =
        formData;
      const amountValue = parseFloat(amount);

      // Vérifier que le montant est valide et supérieur à 0
      const isAmountValid = !isNaN(amountValue) && amountValue > 0;

      // Vérifier que le type de paiement est sélectionné (uniquement si on est à l'étape 2 ou plus)
      const isPaymentTypeValid = step <= 2 || selectedPaymentType !== null;

      // Vérifier qu'une option de paiement est sélectionnée (uniquement si on est à l'étape 3 ou plus)
      const isPaymentOptionValid = step <= 3 || selectedPaymentOption !== null;

      // Validation spécifique selon le type de paiement
      let isPaymentDetailsValid = true;

      if (step >= 3 && selectedPaymentType === paymentTypes.MOBILE_MONEY) {
        // Vérifier que le numéro de téléphone est renseigné
        isPaymentDetailsValid = phoneNumber && phoneNumber.length >= 9;
      } else if (
        step >= 3 &&
        selectedPaymentType === paymentTypes.CREDIT_CARD
      ) {
        // Vérifier les détails de la carte bancaire
        const isCardNumberValid =
          cardNumber && cardNumber.replace(/\s/g, "").length >= 16;
        const isCardHolderValid = cardHolder && cardHolder.trim().length > 0;
        const isExpiryDateValid =
          expiryDate && /^\d{2}\/\d{2}$/.test(expiryDate);
        const isCvvValid = cvv && cvv.length >= 3;

        isPaymentDetailsValid =
          isCardNumberValid &&
          isCardHolderValid &&
          isExpiryDateValid &&
          isCvvValid;
      }

      setFormIsValid(
        isAmountValid &&
          isPaymentTypeValid &&
          isPaymentOptionValid &&
          isPaymentDetailsValid
      );
    };

    validateForm();
  }, [formData, selectedPaymentType, selectedPaymentOption, step]);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Pour le montant, n'accepter que les nombres
    if (name === "amount") {
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData({ ...formData, [name]: numericValue });

      // Si la devise est CDF, mettre à jour le taux de change avec le nouveau montant
      if (
        selectedCurrency.code === "CDF" &&
        numericValue &&
        parseFloat(numericValue) > 0
      ) {
        // Attendre un peu pour éviter trop d'appels API lors de la saisie rapide
        const timeoutId = setTimeout(() => {
          fetchExchangeRate("USD", "CDF", parseFloat(numericValue));
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Sélectionner un type de paiement
  const handlePaymentTypeSelect = (type) => {
    setSelectedPaymentType(type);
    setSelectedPaymentOption(null); // Réinitialiser l'option de paiement
  };

  // Sélectionner une option de paiement
  const handlePaymentOptionSelect = (option) => {
    setSelectedPaymentOption(option);
  };

  // Récupérer le taux de change depuis l'API
  const fetchExchangeRate = async (from = "USD", to = "CDF", amount = null) => {
    try {
      setIsLoadingRate(true);
      const requestData = {
        amount: amount || formData.amount || 1,
        from: from,
        to: to,
        originalAmount: amount || formData.amount || 1, // Envoyer le montant original pour le cas des CDF
      };

      const response = await axios.post("/api/currency/convert", requestData);

      if (response.data.success) {
        setExchangeRate(response.data.rate);
      } else {
        console.error(
          "Erreur lors de la récupération du taux de change:",
          response.data.message
        );
        // Conserver la valeur par défaut
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du taux de change:", error);
      // Conserver la valeur par défaut
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Récupérer le taux de change au chargement du composant
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Sélectionner une devise
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setFormData({ ...formData, currency: currency.code });

    // Si on passe à CDF, s'assurer que le taux de change est à jour
    if (currency.code === "CDF") {
      fetchExchangeRate();
    }
  };

  // Passer à l'étape suivante
  const handleNextStep = () => {
    if (step === 1) {
      // Valider le montant et la devise avant de passer à l'étape suivante
      if (
        !formData.amount ||
        isNaN(parseFloat(formData.amount)) ||
        parseFloat(formData.amount) <= 0
      ) {
        toast.error("Veuillez entrer un montant valide");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Valider la sélection du type de paiement
      if (!selectedPaymentType) {
        toast.error("Veuillez sélectionner un type de paiement");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Valider la sélection de la méthode de paiement et les détails associés
      if (!selectedPaymentOption) {
        toast.error("Veuillez sélectionner une méthode de paiement");
        return;
      }

      // Valider les détails spécifiques selon le type de paiement
      if (selectedPaymentType === paymentTypes.MOBILE_MONEY) {
        if (!formData.phoneNumber || formData.phoneNumber.length < 9) {
          toast.error("Veuillez entrer un numéro de téléphone valide");
          return;
        }
      } else if (selectedPaymentType === paymentTypes.CREDIT_CARD) {
        if (
          !formData.cardNumber ||
          !formData.cardHolder ||
          !formData.expiryDate ||
          !formData.cvv
        ) {
          toast.error("Veuillez remplir tous les champs de la carte bancaire");
          return;
        }

        // Validation basique du format de carte
        const cardNumberClean = formData.cardNumber.replace(/\s/g, "");
        if (
          cardNumberClean.length < 13 ||
          cardNumberClean.length > 19 ||
          !/^\d+$/.test(cardNumberClean)
        ) {
          toast.error("Le numéro de carte n'est pas valide");
          return;
        }

        // Validation basique du format d'expiration (MM/YY)
        if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
          toast.error("La date d'expiration doit être au format MM/YY");
          return;
        }

        // Validation basique du CVV (3-4 chiffres)
        if (!/^\d{3,4}$/.test(formData.cvv)) {
          toast.error("Le code CVV doit contenir 3 ou 4 chiffres");
          return;
        }
      }

      setStep(4);
    }
    // Nous avons retiré la condition pour l'étape 4 car handleSubmit est maintenant appelé directement par le bouton
  };

  // Revenir à l'étape précédente
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);

      // Si on revient de l'étape 3 à l'étape 2, réinitialiser la sélection de méthode de paiement
      if (step === 3) {
        setSelectedPaymentOption(null);
      }
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Calculer le montant total avec les frais
      const amount = parseFloat(formData.amount);
      const fee = amount * (feePercentage / 100);
      const total = amount + fee;

      // Préparer les données pour l'API selon le format attendu par le backend
      const requestData = {
        payment_method: selectedPaymentOption.id,
        currency: selectedCurrency.code,
      };

      requestData.amount = amount.toFixed(2);
      requestData.fees = fee.toFixed(2);
      requestData.total = total.toFixed(2);
      requestData.payment_type = selectedPaymentType;
      requestData.transaction_type = "purchase_virtual";

      // Ajouter les détails spécifiques selon le type de paiement
      if (selectedPaymentType === paymentTypes.MOBILE_MONEY) {
        // Supprimer le caractère + du numéro de téléphone
        const phoneCode = formData.phoneCode.replace(/\+/g, "");
        requestData.payment_details = {
          phoneNumber: `${phoneCode}${formData.phoneNumber}`,
        };
        // Ajouter le code telecom pour SerdiPay si disponible
        requestData.telecom =
          selectedPaymentOption.telecomCode || selectedPaymentOption.id;
      } else if (selectedPaymentType === paymentTypes.CREDIT_CARD) {
        requestData.payment_details = {
          cardNumber: formData.cardNumber.replace(/\s/g, ""),
          cardHolder: formData.cardHolder,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
        };
      }

      // Log pour vérifier les données envoyées au backend
      console.log("Données envoyées au backend:", requestData);

      // Appel à l'API
      const response = await axios.post("/api/serdipay/payment", requestData);

      // Traiter la réponse
      if (response.data.success) {
        // Pour SerdiPay, le paiement est seulement initié à ce stade
        setTransactionResult({
          success: true,
          message:
            "Votre demande d'achat de virtuels a été initiée avec succès. Vous recevrez une notification dès que le paiement sera confirmé.",
          pending: true,
        });

        // Afficher un toast de succès
        toast.success(
          "Paiement initié avec succès! Vous recevrez une notification dès que le paiement sera confirmé.",
          {
            autoClose: 5000,
            closeButton: true,
            position: "top-center",
          }
        );

        // Fermer le modal après 3 secondes pour permettre à l'utilisateur de continuer sa navigation
        setTimeout(() => {
          if (typeof onClose === "function") onClose();
        }, 3000);
      } else {
        setTransactionResult({
          success: false,
          message: response.data.message || "La transaction a échoué.",
        });

        // Afficher un toast d'erreur
        toast.error(response.data.message || "La transaction a échoué.");
      }
    } catch (error) {
      console.error("Erreur lors de l'achat de virtuel:", error);
      setTransactionResult({
        success: false,
        message:
          error.response?.data?.message ||
          "Une erreur est survenue lors de la transaction",
      });

      // Afficher un toast d'erreur
      toast.error(
        error.response?.data?.message ||
          "Une erreur est survenue lors de la transaction"
      );
    } finally {
      setLoading(false);
      // Passer à l'étape de résultat seulement si nous ne sommes pas déjà à l'étape 5
      if (step !== 5) {
        setStep(5);
      }
    }
  };

  // Fermer le modal et réinitialiser le formulaire
  const handleClose = () => {
    // Si la transaction a réussi, recharger la page pour afficher le nouveau solde
    if (transactionResult && transactionResult.success) {
      window.location.reload();
    } else {
      onClose();
    }
  };

  // Styles CSS personnalisés pour l'animation et l'effet de flou
  const customStyles = `
    /* Styles pour le modal et l'overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${
        isDarkMode ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.5)"
      };
      z-index: 50;
      backdrop-filter: blur(5px);
    }
    
    .modal-container {
      width: 100%;
      max-width: 500px;
      margin: 1.5rem;
      animation: modalFadeIn 0.3s ease-out forwards;
    }
    
    .modal-content {
      max-height: 80vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: ${isDarkMode ? "#4b5563 #1f2937" : "#cbd5e1 #f1f5f9"};
    }
    
    /* Styles pour les scrollbars personnalisées (Chrome, Edge, Safari) */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .modal-content::-webkit-scrollbar-track {
      background: ${isDarkMode ? "#1f2937" : "#f1f5f9"};
      border-radius: 4px;
    }
    
    .modal-content::-webkit-scrollbar-thumb {
      background-color: ${isDarkMode ? "#4b5563" : "#cbd5e1"};
      border-radius: 4px;
    }
    
    .modal-content::-webkit-scrollbar-thumb:hover {
      background-color: ${isDarkMode ? "#6b7280" : "#94a3b8"};
    }
    
    /* Animation d'entrée du modal */
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Animation pour les transitions entre étapes */
    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Styles pour les cartes de méthode de paiement */
    .method-card {
      border-radius: 0.5rem;
      border: 1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"};
      transition: all 0.2s ease;
    }
    
    .method-card:hover {
      border-color: ${isDarkMode ? "#6b7280" : "#d1d5db"};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .method-card.selected {
      border-color: #3b82f6;
      background-color: ${
        isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"
      };
    }
    
    /* Styles additionnels pour assurer la compatibilité */
    .modal-container {
      z-index: 1001;
    }
    
    /* Style pour l'en-tête sticky avec transition fluide */
    .sticky {
      transition: box-shadow 0.3s ease;
    }
    
    .sticky.shadow-sm {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div className="modal-overlay">
        <div className="modal-container">
          <div
            className={`w-full max-w-md mx-auto rounded-xl overflow-hidden ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } shadow-2xl modal-content`}
          >
            {/* En-tête du modal (sticky) */}
            <div
              className={`px-6 py-4 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } flex justify-between items-center sticky top-0 z-10 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } shadow-sm`}
            >
              <h2 className="text-xl font-semibold flex items-center">
                <FaCoins className="mr-2 text-yellow-500" />
                Achat de Virtuel Solifin
              </h2>
              <button
                onClick={handleClose}
                className={`p-1 rounded-full hover:bg-opacity-10 ${
                  isDarkMode ? "hover:bg-gray-300" : "hover:bg-gray-700"
                }`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6">
              {/* Étape 1: Saisie du montant et sélection de la devise */}
              {step === 1 && (
                <div className="fade-in">
                  <h3 className="text-lg font-medium mb-4">
                    Montant à acheter
                  </h3>

                  {/* Sélection de la devise - uniquement si CDF est disponible */}
                  {canUseCDF() && (
                    <div className="mb-4">
                      <label
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Devise
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {currencies
                          .filter(
                            (currency) =>
                              currency.code === "USD" ||
                              (currency.code === "CDF" && canUseCDF())
                          )
                          .map((currency) => (
                            <div
                              key={currency.code}
                              className={`cursor-pointer p-3 rounded-md border ${
                                selectedCurrency.code === currency.code
                                  ? isDarkMode
                                    ? "border-blue-500 bg-blue-900 bg-opacity-20"
                                    : "border-blue-500 bg-blue-50"
                                  : isDarkMode
                                  ? "border-gray-600 hover:border-gray-500"
                                  : "border-gray-300 hover:border-gray-400"
                              } transition-colors`}
                              onClick={() => handleCurrencySelect(currency)}
                            >
                              <div className="flex items-center justify-center">
                                <span className="text-lg font-semibold mr-2">
                                  {currency.symbol}
                                </span>
                                <span>{currency.code}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Saisie du montant */}
                  <div className="mb-4">
                    <label
                      htmlFor="amount"
                      className={`block mb-2 text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Montant ({selectedCurrency.code})
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className={`pl-8 pr-4 py-2 w-full rounded-md ${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } border focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Entrez le montant"
                        min="1"
                        step="0.01"
                      />
                    </div>

                    {/* Affichage du taux de change si CDF est sélectionné */}
                    {selectedCurrency.code === "CDF" && (
                      <div
                        className={`mt-2 text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {isLoadingRate ? (
                          <span>Chargement du taux de change...</span>
                        ) : (
                          <span>
                            Taux de change: 1 USD = {exchangeRate} CDF
                          </span>
                        )}
                        {formData.amount &&
                          !isNaN(parseFloat(formData.amount)) && (
                            <div className="mt-1">
                              Équivalent en USD: $
                              {(
                                parseFloat(formData.amount) / exchangeRate
                              ).toFixed(2)}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Affichage des frais */}
                  {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                    <div
                      className={`p-4 rounded-md mb-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span>Montant:</span>
                        <span>
                          {selectedCurrency.symbol}
                          {parseFloat(formData.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Frais ({feePercentage}%):</span>
                        <span>
                          {selectedCurrency.symbol}
                          {purchaseFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total à payer:</span>
                        <span>
                          {selectedCurrency.symbol}
                          {(parseFloat(formData.amount) + purchaseFee).toFixed(
                            2
                          )}
                        </span>
                      </div>

                      {/* Affichage de la conversion si en CDF */}
                      {selectedCurrency.code === "CDF" && (
                        <div className="mt-2 pt-2 border-t border-gray-500">
                          <div className="text-xs text-center">
                            Équivalent en USD: $
                            {(
                              parseFloat(formData.amount) / exchangeRate
                            ).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Étape 2: Sélection du type de paiement */}
              {step === 2 && (
                <div className="fade-in">
                  <h3 className="text-lg font-medium mb-4">
                    Choisissez votre type de paiement
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Option Mobile Money */}
                    <div
                      className={`cursor-pointer p-4 rounded-md border transition-colors ${
                        selectedPaymentType === paymentTypes.MOBILE_MONEY
                          ? isDarkMode
                            ? "border-blue-500 bg-blue-900 bg-opacity-20"
                            : "border-blue-500 bg-blue-50"
                          : isDarkMode
                          ? "border-gray-600 hover:border-gray-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onClick={() =>
                        handlePaymentTypeSelect(paymentTypes.MOBILE_MONEY)
                      }
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          Mobile Money
                        </span>
                        <span
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          M-Pesa, Orange Money...
                        </span>
                      </div>
                    </div>

                    {/* Option Carte Bancaire */}
                    <div
                      className={`cursor-pointer p-4 rounded-md border transition-colors ${
                        selectedPaymentType === paymentTypes.CREDIT_CARD
                          ? isDarkMode
                            ? "border-blue-500 bg-blue-900 bg-opacity-20"
                            : "border-blue-500 bg-blue-50"
                          : isDarkMode
                          ? "border-gray-600 hover:border-gray-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onClick={() =>
                        handlePaymentTypeSelect(paymentTypes.CREDIT_CARD)
                      }
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <span
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          Carte Bancaire
                        </span>
                        <span
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Visa, Mastercard...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3: Sélection du moyen de paiement spécifique */}
              {step === 3 && (
                <div className="fade-in">
                  <h3 className="text-lg font-medium mb-4">
                    {selectedPaymentType === paymentTypes.MOBILE_MONEY
                      ? "Choisissez votre opérateur mobile"
                      : "Choisissez votre type de carte"}
                  </h3>

                  {/* Options de paiement mobile money */}
                  {selectedPaymentType === paymentTypes.MOBILE_MONEY && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {mobileMoneyOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`method-card cursor-pointer ${
                            selectedPaymentOption?.id === option.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => handlePaymentOptionSelect(option)}
                        >
                          <div className="flex flex-col items-center p-2">
                            <img
                              src={option.icon}
                              alt={option.name}
                              className="h-10 w-10 object-contain mb-2"
                            />
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {option.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Options de carte bancaire */}
                  {selectedPaymentType === paymentTypes.CREDIT_CARD && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {creditCardOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`method-card cursor-pointer ${
                            selectedPaymentOption?.id === option.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => handlePaymentOptionSelect(option)}
                        >
                          <div className="flex flex-col items-center p-2">
                            <div className="h-10 w-10 flex items-center justify-center mb-2">
                              {option.id === "visa" && (
                                <span className="text-blue-600 font-bold text-xl">
                                  VISA
                                </span>
                              )}
                              {option.id === "mastercard" && (
                                <span className="text-red-600 font-bold text-xl">
                                  MC
                                </span>
                              )}
                              {option.id === "american-express" && (
                                <span className="text-blue-800 font-bold text-xl">
                                  AMEX
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {option.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Détails du paiement selon le type */}
                  {selectedPaymentOption &&
                    selectedPaymentType === paymentTypes.MOBILE_MONEY && (
                      <div className="mb-4 fade-in">
                        <label
                          htmlFor="phoneNumber"
                          className={`block mb-2 text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Numéro de téléphone
                        </label>
                        <div className="flex">
                          <span
                            className={`inline-flex items-center px-3 rounded-l-md border ${
                              isDarkMode
                                ? "bg-gray-700 text-gray-300 border-gray-600"
                                : "bg-gray-200 text-gray-700 border-gray-300"
                            }`}
                          >
                            {formData.phoneCode}
                          </span>
                          <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`flex-1 rounded-r-md ${
                              isDarkMode
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-gray-900 border-gray-300"
                            } border focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Numéro de téléphone"
                          />
                        </div>
                        <p
                          className={`mt-1 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Entrez le numéro associé à votre compte{" "}
                          {selectedPaymentOption.name}
                        </p>
                      </div>
                    )}

                  {/* Formulaire de carte bancaire */}
                  {selectedPaymentOption &&
                    selectedPaymentType === paymentTypes.CREDIT_CARD && (
                      <div className="mb-4 fade-in space-y-4">
                        <div>
                          <label
                            htmlFor="cardNumber"
                            className={`block mb-2 text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Numéro de carte
                          </label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleChange}
                            className={`w-full rounded-md ${
                              isDarkMode
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-gray-900 border-gray-300"
                            } border focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="1234 5678 9012 3456"
                            maxLength="19"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="cardHolder"
                            className={`block mb-2 text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Nom du titulaire
                          </label>
                          <input
                            type="text"
                            id="cardHolder"
                            name="cardHolder"
                            value={formData.cardHolder}
                            onChange={handleChange}
                            className={`w-full rounded-md ${
                              isDarkMode
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-gray-900 border-gray-300"
                            } border focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="NOM PRÉNOM"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="expiryDate"
                              className={`block mb-2 text-sm font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Date d'expiration
                            </label>
                            <input
                              type="text"
                              id="expiryDate"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={handleChange}
                              className={`w-full rounded-md ${
                                isDarkMode
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-gray-900 border-gray-300"
                              } border focus:ring-blue-500 focus:border-blue-500`}
                              placeholder="MM/YY"
                              maxLength="5"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="cvv"
                              className={`block mb-2 text-sm font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              CVV
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              name="cvv"
                              value={formData.cvv}
                              onChange={handleChange}
                              className={`w-full rounded-md ${
                                isDarkMode
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-gray-900 border-gray-300"
                              } border focus:ring-blue-500 focus:border-blue-500`}
                              placeholder="123"
                              maxLength="4"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Étape 4: Confirmation */}
              {step === 4 && (
                <div className="fade-in">
                  <h3 className="text-lg font-medium mb-4">
                    Confirmez votre achat
                  </h3>

                  <div
                    className={`p-4 rounded-md mb-4 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span>Montant:</span>
                      <span>
                        {selectedCurrency.symbol}
                        {parseFloat(formData.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Frais ({feePercentage}%):</span>
                      <span>
                        {selectedCurrency.symbol}
                        {purchaseFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total à payer:</span>
                      <span>
                        {selectedCurrency.symbol}
                        {(parseFloat(formData.amount) + purchaseFee).toFixed(2)}
                      </span>
                    </div>

                    {/* Affichage de la conversion si en CDF */}
                    {selectedCurrency.code === "CDF" && (
                      <div className="mt-2 pt-2 border-t border-gray-500">
                        <div className="text-xs text-center">
                          {isLoadingRate ? (
                            <span>Chargement du taux de change...</span>
                          ) : (
                            <>
                              Taux de change: 1 USD = {exchangeRate} CDF
                              <br />
                              Équivalent en USD: $
                              {(formData.amount / exchangeRate).toFixed(2)}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-md mb-4 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span>Type de paiement:</span>
                      <span>
                        {selectedPaymentType === paymentTypes.MOBILE_MONEY
                          ? "Mobile Money"
                          : "Carte Bancaire"}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Méthode de paiement:</span>
                      <span className="flex items-center">
                        {selectedPaymentType === paymentTypes.MOBILE_MONEY ? (
                          <>
                            <img
                              src={selectedPaymentOption.icon}
                              alt={selectedPaymentOption.name}
                              className="h-5 w-5 mr-1"
                            />
                            {selectedPaymentOption.name}
                          </>
                        ) : (
                          selectedPaymentOption.name
                        )}
                      </span>
                    </div>

                    {/* Détails spécifiques selon le type de paiement */}
                    {selectedPaymentType === paymentTypes.MOBILE_MONEY && (
                      <div className="flex justify-between">
                        <span>Numéro de téléphone:</span>
                        <span>
                          {formData.phoneCode}
                          {formData.phoneNumber}
                        </span>
                      </div>
                    )}

                    {selectedPaymentType === paymentTypes.CREDIT_CARD && (
                      <>
                        <div className="flex justify-between">
                          <span>Carte:</span>
                          <span>
                            XXXX XXXX XXXX{" "}
                            {formData.cardNumber.replace(/\s/g, "").slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Titulaire:</span>
                          <span>{formData.cardHolder}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    } mb-4`}
                  >
                    En cliquant sur "Confirmer", vous autorisez le prélèvement
                    de{" "}
                    <strong>
                      {selectedCurrency.symbol}
                      {(parseFloat(formData.amount) + purchaseFee).toFixed(2)}
                    </strong>{" "}
                    {selectedPaymentType === paymentTypes.MOBILE_MONEY
                      ? `sur votre compte ${selectedPaymentOption.name}`
                      : "sur votre carte bancaire"}
                    .
                  </p>
                </div>
              )}

              {/* Étape 5: Résultat */}
              {step === 5 && (
                <div className="fade-in text-center">
                  {transactionResult?.success ? (
                    <>
                      <div className="flex justify-center mb-4">
                        <CheckCircleIcon className="h-16 w-16 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Transaction réussie!
                      </h3>
                      <p
                        className={`mb-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {transactionResult.message}
                      </p>
                      <div
                        className={`p-4 rounded-md mb-4 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between mb-2">
                          <span>Montant crédité:</span>
                          <span>
                            {selectedCurrency.code === "USD"
                              ? `$${transactionResult.amount}`
                              : `FC ${(
                                  transactionResult.amount * exchangeRate
                                ).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>ID de transaction:</span>
                          <span>{transactionResult.transactionId}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Nouveau solde:</span>
                          <span>
                            $
                            {parseFloat(transactionResult.newBalance).toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <XCircleIcon className="h-16 w-16 text-red-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Échec de la transaction
                      </h3>
                      <p
                        className={`mb-4 ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {transactionResult?.message ||
                          "Une erreur est survenue lors de la transaction."}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedPaymentType === paymentTypes.MOBILE_MONEY
                          ? "Vérifiez que votre numéro de téléphone est correct et que vous disposez de fonds suffisants."
                          : "Vérifiez les informations de votre carte et réessayez."}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Espace pour éviter que le contenu ne touche le bas du modal */}
              <div className="h-4"></div>
            </div>

            {/* Pied du modal avec boutons d'action */}
            <div
              className={`px-6 py-4 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } flex justify-between`}
            >
              {step < 5 ? (
                <>
                  {step > 1 && (
                    <button
                      onClick={handlePreviousStep}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      disabled={loading}
                    >
                      Retour
                    </button>
                  )}
                  <div className={step === 1 ? "ml-auto" : ""}>
                    <button
                      onClick={step === 4 ? handleSubmit : handleNextStep}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } ${
                        !formIsValid || loading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={!formIsValid || loading}
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 animate-spin inline mr-1" />
                          Traitement en cours...
                        </>
                      ) : step === 4 ? (
                        "Confirmer l'achat"
                      ) : step === 3 ? (
                        "Suivant"
                      ) : (
                        "Suivant"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded-md ml-auto ${
                    isDarkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
