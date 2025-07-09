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

// Importation des icônes de méthodes de paiement
import mtnIcon from "../../../assets/icons-mobil-money/mtn.png";
import airtelIcon from "../../../assets/icons-mobil-money/airtel.png";
import orangeIcon from "../../../assets/icons-mobil-money/orange.png";
import mpesaIcon from "../../../assets/icons-mobil-money/mpesa.png";
import africellIcon from "../../../assets/icons-mobil-money/afrimoney.png";
import moovIcon from "../../../assets/icons-mobil-money/moov.png";
import visaIcon from "../../../assets/icons-mobil-money/visa.png";
import mastercardIcon from "../../../assets/icons-mobil-money/mastercard.png";
import amexIcon from "../../../assets/icons-mobil-money/americanexpress.png";
import Notification from "../../../components/Notification";

// Prix par défaut par jour pour le boost d'une publication (si le paramètre n'est pas défini)
const DEFAULT_PRICE_PER_DAY = 1; // USD

// Mapping des icônes pour les méthodes de paiement
const paymentMethodsMap = {
  [PAYMENT_TYPES.MOBILE_MONEY]: {
    name: "Mobile Money",
    color: "#4CAF50", // Vert
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map((option) => {
      if (option.id === "airtel-money") {
        return { ...option, icon: airtelIcon };
      } else if (option.id === "mtn-mobile-money") {
        return { ...option, icon: mtnIcon };
      } else if (option.id === "moov-money") {
        return { ...option, icon: moovIcon };
      } else if (option.id === "afrimoney") {
        return { ...option, icon: africellIcon };
      } else if (option.id === "m-pesa") {
        return { ...option, icon: mpesaIcon };
      } else if (option.id === "orange-money") {
        return { ...option, icon: orangeIcon };
      }
      return option;
    }),
  },
  [PAYMENT_TYPES.CREDIT_CARD]: {
    name: "Carte de Crédit",
    color: "#9C27B0", // Violet
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD].map((option) => {
      if (option.id === "visa") {
        return { ...option, icon: visaIcon };
      } else if (option.id === "mastercard") {
        return { ...option, icon: mastercardIcon };
      } else if (option.id === "american-express") {
        return { ...option, icon: amexIcon };
      }
      return option;
    }),
  },
  [PAYMENT_TYPES.WALLET]: {
    name: "Wallet SOLIFIN",
    color: "#2196F3", // Bleu
    options: [],
  },
};

// Configuration des champs de formulaire pour chaque méthode de paiement
const paymentMethodFields = {
  [PAYMENT_TYPES.WALLET]: [],
  [PAYMENT_TYPES.CREDIT_CARD]: [
    {
      name: "cardNumber",
      label: "Numéro de carte",
      type: "text",
      required: true,
      maxLength: 19,
      format: (value) =>
        value
          .replace(/\s/g, "")
          .replace(/(\d{4})/g, "$1 ")
          .trim(),
    },
    {
      name: "cardHolder",
      label: "Nom sur la carte",
      type: "text",
      required: true,
    },
    {
      name: "expiryDate",
      label: "Date d'expiration",
      type: "text",
      required: true,
      maxLength: 5,
      format: (value) =>
        value.replace(/\D/g, "").replace(/(\d{2})(\d{0,2})/, "$1/$2"),
    },
    { name: "cvv", label: "CVV", type: "text", required: true, maxLength: 3 },
  ],
  [PAYMENT_TYPES.MOBILE_MONEY]: [
    {
      name: "phoneNumber",
      label: "Numéro de téléphone",
      type: "tel",
      required: true,
    },
  ],
  [PAYMENT_TYPES.BANK_TRANSFER]: [
    {
      name: "accountName",
      label: "Nom du compte",
      type: "text",
      required: true,
    },
    {
      name: "accountNumber",
      label: "Numéro de compte",
      type: "text",
      required: true,
    },
  ],
  [PAYMENT_TYPES.MONEY_TRANSFER]: [
    {
      name: "senderName",
      label: "Nom de l'expéditeur",
      type: "text",
      required: true,
    },
    {
      name: "referenceNumber",
      label: "Numéro de référence",
      type: "text",
      required: true,
    },
  ],
  [PAYMENT_TYPES.CASH]: [
    {
      name: "paymentLocation",
      label: "Lieu de paiement",
      type: "text",
      required: true,
    },
  ],
};

// Transformation des méthodes de paiement pour l'interface utilisateur
const paymentMethods = [
  {
    id: PAYMENT_TYPES.WALLET,
    name: "Mon Wallet",
    icon: "wallet",
    category: "direct",
    options: PAYMENT_METHODS[PAYMENT_TYPES.WALLET],
  },
  {
    id: PAYMENT_TYPES.CREDIT_CARD,
    name: "Carte de crédit",
    icon: "credit-card",
    category: "card",
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD],
    fields: paymentMethodFields[PAYMENT_TYPES.CREDIT_CARD],
  },
  {
    id: PAYMENT_TYPES.MOBILE_MONEY,
    name: "Mobile Money",
    icon: "phone",
    category: "mobile",
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY],
    fields: paymentMethodFields[PAYMENT_TYPES.MOBILE_MONEY],
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
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_TYPES.WALLET);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [formFields, setFormFields] = useState({});
  const [days, setDays] = useState(7);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(DEFAULT_PRICE_PER_DAY);
  const [totalAmount, setTotalAmount] = useState(DEFAULT_PRICE_PER_DAY * 7);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [transactionFees, setTransactionFees] = useState(0);
  const [feePercentage, setFeePercentage] = useState(0);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+243"); // Indicatif téléphonique par défaut (RDC)
  const [paymentOption, setPaymentOption] = useState(""); // Option de paiement sélectionnée (pour Mobile Money ou Carte de Crédit)

  // Récupérer le solde du wallet et le prix du boost au chargement
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      fetchBoostPrice();
      fetchTransferFees();

      // Réinitialiser les états pour les méthodes de paiement
      setSelectedPaymentOption(
        paymentMethod === PAYMENT_TYPES.WALLET ? "solifin-wallet" : ""
      );

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

    // Mettre à jour les frais si ce n'est pas un paiement par wallet
    if (paymentMethod !== PAYMENT_TYPES.WALLET && feePercentage > 0) {
      // Calculer les frais en fonction du pourcentage global
      const fees = (amount * feePercentage) / 100;
      setTransactionFees(fees);
    }

    // Vérifier la validité du formulaire
    validateForm();
  }, [days, pricePerDay, paymentMethod, feePercentage]);

  // Effet pour surveiller les changements de méthode de paiement
  useEffect(() => {
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      setSelectedPaymentOption("solifin-wallet");
      setSelectedCurrency("USD");
    } else if (selectedPaymentOption === "solifin-wallet") {
      setSelectedPaymentOption("");
    }

    validateForm();
  }, [paymentMethod]);

  // Effet pour surveiller les changements d'option de paiement (Mobile Money et Credit Card)
  useEffect(() => {
    if (paymentOption && (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY || paymentMethod === PAYMENT_TYPES.CREDIT_CARD)) {
      console.log("Option de paiement sélectionnée:", paymentOption);
      validateForm();
    }
  }, [paymentOption, paymentMethod]);

  // Effet pour convertir la devise lorsque la devise sélectionnée change
  useEffect(() => {
    if (selectedCurrency !== "USD" && paymentMethod !== PAYMENT_TYPES.WALLET) {
      convertCurrency();
    } else {
      setConvertedAmount({ convertedAmount: totalAmount, rate: 1 });
      setExchangeRate(1);

      // Mettre à jour les frais si ce n'est pas un paiement par wallet
      if (paymentMethod !== PAYMENT_TYPES.WALLET && feePercentage > 0) {
        const fees = (totalAmount * feePercentage) / 100;
        setTransactionFees(fees);
      }
    }
  }, [selectedCurrency, totalAmount, paymentMethod, feePercentage]);

  // Appliquer les frais lorsque les paramètres de paiement changent
  useEffect(() => {
    if (isOpen && selectedPaymentOption) {
      // Si le paiement est par wallet, pas de frais de transaction
      if (paymentMethod === PAYMENT_TYPES.WALLET) {
        setTransactionFees(0);
      }
      validateForm();
    }
  }, [selectedPaymentOption, convertedAmount, selectedCurrency, paymentMethod]);

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

  // Récupérer les frais de transfert globaux
  const fetchTransferFees = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      const response = await axios.post("/api/transaction-fees/purchase", {
        amount: 100, // Montant de référence (à défaut) pour calculer le pourcentage
      });

      if (response.data.success) {
        // Stocker le pourcentage plutôt que le montant des frais
        setFeePercentage(response.data.percentage);
        setFeesError(false);
      } else {
        setFeesError(true);
        Notification.error(
          response.data.message ||
            "Erreur lors de la récupération des frais de transaction"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des frais:", error);
      setFeesError(true);
      Notification.error(
        "Erreur lors de la récupération des frais de transaction. Veuillez réessayer."
      );
    } finally {
      setLoadingFees(false);
    }
  };

  // Fonction pour recalculer les frais de transaction
  const calculateFees = () => {
    setFeesError(false);
    if (
      convertedAmount &&
      convertedAmount.convertedAmount &&
      paymentMethod !== PAYMENT_TYPES.WALLET
    ) {
      const fees = (convertedAmount.convertedAmount * feePercentage) / 100;
      setTransactionFees(fees);
    } else if (paymentMethod === PAYMENT_TYPES.WALLET) {
      setTransactionFees(0);
    }
    validateForm();
  };

  // Fonction pour convertir la devise
  const convertCurrency = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/currency/convert", {
        amount: totalAmount,
        from: "USD",
        to: selectedCurrency,
      });

      if (response.data.success) {
        const convertedAmt = response.data;
        setConvertedAmount(convertedAmt);

        // Calculer les frais en fonction du pourcentage global
        if (paymentMethod !== PAYMENT_TYPES.WALLET && feePercentage > 0) {
          const fees = (convertedAmt.convertedAmount * feePercentage) / 100;
          setTransactionFees(fees);
        }
      } else {
        console.error("Erreur lors de la conversion:", response.data.message);
        // En cas d'erreur, on utilise le montant original
        setConvertedAmount({ convertedAmount: totalAmount, rate: 1 });
        setFeesError(true);
        Notification.error(
          response.data.message || "Erreur lors de la conversion de devise"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la conversion:", error);
      console.error(
        "Détails de l'erreur:",
        error.response?.data || "Pas de détails disponibles"
      );
      setConvertedAmount({ convertedAmount: totalAmount, rate: 1 });
      setFeesError(true);
      Notification.error(
        "Erreur lors de la conversion de devise. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer les changements de champs de formulaire
  const handleFieldChange = (fieldName, value) => {
    // Appliquer le formatage si nécessaire
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    const field = selectedMethod?.fields?.find((f) => f.name === fieldName);

    // Validation spécifique pour le numéro de téléphone (pas de 0 au début)
    if (fieldName === "phoneNumber") {
      // Supprimer le 0 initial si présent
      if (value.startsWith("0")) {
        value = value.substring(1);
      }
      // Ne garder que les chiffres
      value = value.replace(/[^0-9]/g, "");
    }

    if (field && field.format) {
      value = field.format(value);
    }

    setFormFields({
      ...formFields,
      [fieldName]: value,
    });

    validateForm();
  };

  // Fonction pour gérer le changement d'indicatif téléphonique (non utilisée avec l'indicatif fixe)
  const handlePhoneCodeChange = (code) => {
    setPhoneCode(code);
    validateForm();
  };

  // Fonction pour afficher l'icône de l'option de paiement
  const renderPaymentOptionWithIcon = (option, paymentType) => {
    // Vérifier si l'option a une icône spécifique dans le mapping
    const methodOptions = paymentMethodsMap[paymentType]?.options || [];
    const optionWithIcon = methodOptions.find((opt) => opt.id === option.id);

    if (optionWithIcon?.icon) {
      // Si c'est une image importée (pour mobile money ou cartes spécifiques)
      if (
        typeof optionWithIcon.icon === "string" &&
        optionWithIcon.icon.includes("/")
      ) {
        return (
          <div className="flex flex-col items-center">
            <img
              src={optionWithIcon.icon}
              alt={option.name}
              className="h-8 w-auto object-contain mb-1"
            />
            <Typography variant="caption" className="text-center">
              {option.name}
            </Typography>
          </div>
        );
      }

      // Si c'est une icône de composant
      return (
        <div className="flex flex-col items-center">
          {optionWithIcon.icon}
          <Typography variant="caption" className="text-center mt-1">
            {option.name}
          </Typography>
        </div>
      );
    }

    // Fallback si pas d'icône trouvée
    return <Typography variant="body2">{option.name}</Typography>;
  };

  // Fonction pour gérer le changement de méthode de paiement
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setSelectedPaymentOption("");
    setPaymentOption(""); // Réinitialiser l'option de paiement
    setFormFields({});

    // Si on choisit le wallet, on sélectionne automatiquement solifin-wallet et on met les frais à 0
    if (method === PAYMENT_TYPES.WALLET) {
      setSelectedPaymentOption("solifin-wallet");
      setTransactionFees(0);
    } else if (
      method === PAYMENT_TYPES.MOBILE_MONEY &&
      PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].length > 0
    ) {
      // Sélectionner la première option de Mobile Money par défaut
      setPaymentOption(PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY][0].id);
    } else if (
      method === PAYMENT_TYPES.CREDIT_CARD &&
      PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD].length > 0
    ) {
      // Sélectionner la première option de Carte de Crédit par défaut
      setPaymentOption(PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD][0].id);
    } else {
      // Pour les autres méthodes, calculer les frais en fonction du pourcentage global
      if (convertedAmount && convertedAmount.convertedAmount) {
        const fees = (convertedAmount.convertedAmount * feePercentage) / 100;
        setTransactionFees(fees);
      }
    }

    validateForm();
  };

  // Fonction pour gérer le changement d'option de paiement
  const handlePaymentOptionChange = (option) => {
    setSelectedPaymentOption(option);
    validateForm();
  };

  // Vérifier si le formulaire est valide
  const validateForm = () => {
    // Vérifier si tous les champs requis sont remplis
    let isValid = true;

    // Vérifier si une méthode de paiement spécifique est sélectionnée
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      isValid = isValid && selectedPaymentOption !== "";
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY || paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      isValid = isValid && paymentOption !== "";
    } else {
      isValid = isValid && selectedPaymentOption !== "";
    }

    // Vérifier si le nombre de jours est valide
    isValid = isValid && days > 0;

    // Vérifier les champs selon la méthode de paiement
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Pour le wallet, pas besoin de vérifier le solde ici
      // La vérification du solde sera faite séparément pour l'activation du bouton
      isValid = isValid && true;
    } else if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      // Pour la carte de crédit, vérifier les champs requis
      const requiredFields = ["cardNumber", "cardHolder", "expiryDate", "cvv"];
      isValid =
        isValid &&
        requiredFields.every(
          (field) => formFields[field] && formFields[field].trim() !== ""
        );
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Pour le mobile money, vérifier le numéro de téléphone
      isValid =
        isValid &&
        formFields.phoneNumber &&
        formFields.phoneNumber.trim() !== "";
    }

    // Vérifier que le montant est positif
    isValid = isValid && totalAmount > 0;

    // Vérifier qu'il n'y a pas d'erreur de calcul des frais
    isValid = isValid && !feesError;

    setFormIsValid(isValid);
    return isValid;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Vérifier si le solde du wallet est suffisant
    if (paymentMethod === PAYMENT_TYPES.WALLET && totalAmount > walletBalance) {
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

      // Préparer les données pour l'API
      // Déterminer la bonne option de paiement selon le type de paiement
      const finalPaymentOption = 
        paymentMethod === PAYMENT_TYPES.WALLET ? selectedPaymentOption :
        (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY || paymentMethod === PAYMENT_TYPES.CREDIT_CARD) ? paymentOption :
        selectedPaymentOption;
      
      console.log("Option de paiement envoyée:", finalPaymentOption);
      
      const paymentData = {
        ...formFields,
        days,
        paymentMethod: finalPaymentOption, // Méthode spécifique (solifin-wallet, visa, etc.)
        paymentType: paymentMethod, // Type général (wallet, credit-card, etc.)
        paymentOption: finalPaymentOption, // Garder pour compatibilité avec l'ancien code
        currency: selectedCurrency,
        amount:
          paymentMethod === PAYMENT_TYPES.WALLET
            ? totalAmount
            : convertedAmount.convertedAmount,
        fees: paymentMethod === PAYMENT_TYPES.WALLET ? 0 : transactionFees,
      };

      // Ajouter l'indicatif téléphonique au numéro de téléphone si c'est un paiement mobile money
      if (
        paymentMethod === PAYMENT_TYPES.MOBILE_MONEY &&
        formFields.phoneNumber
      ) {
        // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
        const cleanPhoneNumber = formFields.phoneNumber.replace(/\D/g, "");

        // Créer le numéro complet sans le +
        const phoneCode = "243";
        const phoneWithCode = `${phoneCode}${cleanPhoneNumber}`;

        console.log("Numéro de téléphone formaté pour API:", phoneWithCode);

        paymentData.phoneNumber = cleanPhoneNumber;
        paymentData.fullPhoneNumber = phoneWithCode;
      }

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

  // Fonction pour rendre les champs de formulaire spécifiques à la méthode de paiement
  const renderPaymentFields = () => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);

    if (
      !selectedMethod ||
      !selectedMethod.fields ||
      selectedMethod.fields.length === 0
    ) {
      return null;
    }

    return (
      <div className="space-y-2 mt-4">
        {/* Afficher les champs de formulaire spécifiques à la méthode de paiement */}
        <div key="payment-fields-container" className="space-y-2">
          {selectedMethod.fields.map((field) => {
            // Cas spécial pour le numéro de téléphone avec indicatif
            if (
              field.name === "phoneNumber" &&
              paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
            ) {
              return (
                <div key={field.name} className="mb-2">
                  <Typography variant="subtitle2" gutterBottom>
                    {field.label}
                  </Typography>
                  <TextField
                    placeholder="Numéro sans indicatif ni 0 initial"
                    type={field.type}
                    value={formFields[field.name] || ""}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    required={field.required}
                    fullWidth
                    size="small"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography
                            variant="body2"
                            className="text-gray-600 dark:text-gray-300 font-medium"
                          >
                            +243
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Entrez votre numéro sans le code pays"
                    inputProps={{
                      maxLength: field.maxLength,
                      style: { paddingLeft: "4px" },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: "40px",
                      },
                    }}
                  />
                </div>
              );
            }

            // Autres champs normaux
            return (
              <TextField
                key={field.name}
                label={field.label}
                type={field.type}
                value={formFields[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
                fullWidth
                size="small"
                margin="dense"
                inputProps={{
                  maxLength: field.maxLength,
                }}
              />
            );
          })}
        </div>
      </div>
    );
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

            {/* Méthodes de paiement */}
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
                <div
                  key="payment-methods-container"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2"
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={"method_" + method.id}
                      className={`method-card cursor-pointer rounded-xl shadow hover:shadow-lg transition-all duration-300 ${
                        paymentMethod === method.id
                          ? "ring-2 shadow-md"
                          : "border border-gray-200 dark:border-gray-700"
                      }`}
                      onClick={() => handlePaymentMethodChange(method.id)}
                      style={{
                        borderColor:
                          paymentMethod === method.id
                            ? "transparent"
                            : undefined,
                        ringColor:
                          paymentMethod === method.id
                            ? paymentMethodsMap[method.id]?.color || "#2196F3"
                            : "transparent",
                        transform:
                          paymentMethod === method.id
                            ? "translateY(-3px) scale(1.02)"
                            : "none",
                        backgroundColor:
                          paymentMethod === method.id
                            ? isDarkMode
                              ? "rgba(33, 150, 243, 0.1)"
                              : "white"
                            : isDarkMode
                            ? "rgba(31, 41, 55, 0.5)"
                            : "white",
                      }}
                    >
                      <div className="p-4 flex items-center">
                        <div
                          className="mr-4 flex items-center justify-center"
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "12px",
                            backgroundColor: `${
                              paymentMethodsMap[method.id]?.color || "#2196F3"
                            }15`,
                          }}
                        >
                          {method.id === PAYMENT_TYPES.CREDIT_CARD && (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              <img
                                src={visaIcon}
                                alt="Visa"
                                className="h-5 w-8 object-contain"
                              />
                              <img
                                src={mastercardIcon}
                                alt="Mastercard"
                                className="h-5 w-8 object-contain"
                              />
                            </div>
                          )}
                          {method.id === PAYMENT_TYPES.MOBILE_MONEY && (
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              <img
                                src={orangeIcon}
                                alt="Orange"
                                className="h-5 w-5 object-contain"
                              />
                              <img
                                src={airtelIcon}
                                alt="Airtel"
                                className="h-5 w-5 object-contain"
                              />
                            </div>
                          )}
                          {method.id === PAYMENT_TYPES.WALLET && (
                            <div className="flex items-center justify-center">
                              <span className="text-2xl font-bold text-blue-500">
                                $
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <Typography
                            variant="subtitle2"
                            className="font-medium"
                          >
                            {method.name}
                          </Typography>
                          {method.id === PAYMENT_TYPES.WALLET && (
                            <Typography
                              variant="caption"
                              className="text-gray-500 dark:text-gray-400 block"
                            >
                              Solde: {walletBalance.toFixed(2)} USD
                            </Typography>
                          )}
                        </div>

                        <Radio
                          checked={paymentMethod === method.id}
                          size="small"
                          sx={{
                            padding: "2px",
                            "&.Mui-checked": {
                              color:
                                paymentMethodsMap[method.id]?.color ||
                                "#2196F3",
                            },
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options de paiement spécifiques */}
              {paymentMethod === PAYMENT_TYPES.MOBILE_MONEY && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <Typography
                    variant="subtitle2"
                    className="mb-3 font-medium text-gray-700 dark:text-gray-200"
                  >
                    Sélectionnez votre opérateur
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map(
                      (option) => (
                        <div
                          key={option.id}
                          onClick={() => setPaymentOption(option.id)}
                          className={`cursor-pointer p-3 rounded-lg border transition-all duration-300 flex items-center ${
                            paymentOption === option.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm transform -translate-y-1"
                              : "border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700"
                          }`}
                        >
                          <Radio
                            checked={paymentOption === option.id}
                            size="small"
                            sx={{
                              padding: 0,
                              marginRight: "8px",
                              "&.Mui-checked": {
                                color: "#2196F3",
                              },
                            }}
                          />
                          {renderPaymentOptionWithIcon(
                            option,
                            PAYMENT_TYPES.MOBILE_MONEY
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === PAYMENT_TYPES.CREDIT_CARD && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <Typography
                    variant="subtitle2"
                    className="mb-3 font-medium text-gray-700 dark:text-gray-200"
                  >
                    Sélectionnez votre type de carte
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD].map(
                      (option) => (
                        <div
                          key={option.id}
                          onClick={() => setPaymentOption(option.id)}
                          className={`cursor-pointer p-3 rounded-lg border transition-all duration-300 flex items-center ${
                            paymentOption === option.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-sm transform -translate-y-1"
                              : "border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700"
                          }`}
                        >
                          <Radio
                            checked={paymentOption === option.id}
                            size="small"
                            sx={{
                              padding: 0,
                              marginRight: "8px",
                              "&.Mui-checked": {
                                color: "#2196F3",
                              },
                            }}
                          />
                          {renderPaymentOptionWithIcon(
                            option,
                            PAYMENT_TYPES.CREDIT_CARD
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {paymentMethod !== PAYMENT_TYPES.WALLET && (
                <div className="mt-4 mb-4 bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <Typography
                    variant="subtitle2"
                    className="mb-3 font-medium text-gray-700 dark:text-gray-200"
                  >
                    Sélectionnez votre devise
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    }}
                  >
                    {Object.entries(CURRENCIES).map(([code, currency]) => (
                      <MenuItem key={code} value={code}>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            {currency.symbol}
                          </span>
                          <span>{currency.name}</span>
                          <span className="ml-auto text-xs text-gray-500">
                            ({code})
                          </span>
                        </div>
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              )}

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

                  {transactionFees > 0 && (
                    <div
                      key="transaction-fees"
                      className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-amber-600 dark:text-amber-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <Typography variant="body2" className="font-medium">
                          Frais de transaction
                          {feePercentage > 0 && (
                            <span
                              key="fee-percentage"
                              className="text-xs text-gray-500 dark:text-gray-400 ml-1"
                            >
                              ({feePercentage}%)
                            </span>
                          )}
                        </Typography>
                      </div>
                      <Typography variant="body2" className="font-semibold">
                        {transactionFees.toFixed(2)}{" "}
                        {paymentMethod === PAYMENT_TYPES.WALLET
                          ? CURRENCIES.USD.symbol
                          : CURRENCIES[selectedCurrency].symbol}
                      </Typography>
                    </div>
                  )}

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
                      {feesError ? (
                        <IconButton
                          key="recalculate-fees"
                          size="small"
                          color="primary"
                          onClick={calculateFees}
                          className="mr-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50"
                          title="Recalculer les frais"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </IconButton>
                      ) : loadingFees ? (
                        <CircularProgress
                          key="loading-fees"
                          size={16}
                          className="mr-2"
                        />
                      ) : null}
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-bold"
                      >
                        {paymentMethod === PAYMENT_TYPES.WALLET
                          ? (totalAmount || 0).toFixed(2) +
                            " " +
                            CURRENCIES.USD.symbol
                          : (
                              (convertedAmount.convertedAmount || 0) +
                              (transactionFees || 0)
                            ).toFixed(2) +
                            " " +
                            CURRENCIES[selectedCurrency].symbol}
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
            {paymentMethod === PAYMENT_TYPES.WALLET ? (
              <>
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
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <Typography
                  variant="body2"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  Procédez au paiement sécurisé
                </Typography>
              </>
            )}
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
