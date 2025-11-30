import React from "react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import axios from "../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PhoneIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
// Import des icônes de mobile money
import airtelIcon from "../assets/icons-mobil-money/airtel.png";
import mpesaIcon from "../assets/icons-mobil-money/mpesa.png";
import orangeIcon from "../assets/icons-mobil-money/orange.png";
import africellIcon from "../assets/icons-mobil-money/afrimoney.png";
import mtnIcon from "../assets/icons-mobil-money/mtn.png";
import moovIcon from "../assets/icons-mobil-money/moov.png";

// Import des icônes de cartes de crédit
import visaIcon from "../assets/icons-mobil-money/visa.png";
import mastercardIcon from "../assets/icons-mobil-money/mastercard.png";
import amexIcon from "../assets/icons-mobil-money/americanexpress.png";
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from "../config";
import { countries } from "../data/countries";
import CountryCodeSelector from "./CountryCodeSelector";

// Style CSS pour les animations et effets visuels
const customStyles = `
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
    background-color: rgba(59, 130, 246, 0.05);
  }
  
  .dark .method-card:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  .method-card.selected {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
  }
  
  .dark .method-card.selected {
    border-color: #60a5fa;
    background-color: rgba(96, 165, 250, 0.15);
  }
  
  /* Masquer les flèches des champs de type number */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
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
  
  .input-field {
    transition: all 0.2s ease;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 0.75rem;
    width: 100%;
    background-color: white;
  }
  
  .dark .input-field {
    background-color: #1e283b;
    border-color: #2d3748;
    color: white;
  }
  
  .input-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .dark .input-field:focus {
    border-color: #90caf9;
    box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.1);
  }
  
  .input-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .dark .input-label {
    color: #e2e8f0;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background-color: #f3f4f6;
    color: #4b5563;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .dark .btn-secondary {
    background-color: #374151;
    color: #e5e7eb;
  }
  
  .btn-secondary:hover {
    background-color: #e5e7eb;
  }
  
  .dark .btn-secondary:hover {
    background-color: #4b5563;
  }
  
  .modal-overlay {
    backdrop-filter: blur(8px);
    background-color: rgba(0, 0, 0, 0.5);
    position: fixed;
    inset: 0;
    z-index: 40;
  }
  
  .modal-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    max-height: 90vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  
  .modal-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .modal-content::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  
  .dark .modal-content::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.5);
  }
`;

// Filtrer les méthodes de paiement pour exclure portefeuille et espèces
const filteredPaymentTypes = Object.keys(PAYMENT_TYPES)
  .filter(
    (key) =>
      PAYMENT_TYPES[key] !== PAYMENT_TYPES.WALLET &&
      PAYMENT_TYPES[key] !== PAYMENT_TYPES.CASH
  )
  .reduce((obj, key) => {
    obj[key] = PAYMENT_TYPES[key];
    return obj;
  }, {});

const paymentMethodsMap = {
  [PAYMENT_TYPES.MOBILE_MONEY]: {
    name: "Mobile Money",
    icon: PhoneIcon,
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map((option) => {
      // Ajouter les icônes aux options de mobile money
      if (option.id === "airtel-money") {
        return { ...option, icon: airtelIcon };
      } else if (option.id === "mtn-mobile-money") {
        // Pour MTN, on utilise une icône générique pour l'instant
        return { ...option, icon: mtnIcon }; // Couleur jaune pour MTN
      } else if (option.id === "moov-money") {
        // Pour Moov, on utilise une icône générique pour l'instant
        return { ...option, icon: moovIcon }; // Couleur bleue pour Moov
      } else if (option.id === "afrimoney") {
        // Pour Afrimoney, on utilise une icône générique pour l'instant
        return { ...option, icon: africellIcon }; // Couleur verte pour Afrimoney
      } else if (option.id === "m-pesa") {
        return { ...option, icon: mpesaIcon };
      } else if (option.id === "orange-money") {
        return { ...option, icon: orangeIcon };
      }
      return option;
    }),
  },
  [PAYMENT_TYPES.CREDIT_CARD]: {
    name: "Carte de crédit",
    icon: CreditCardIcon,
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD].map((option) => {
      // Ajouter les icônes aux options de carte de crédit
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
  // [PAYMENT_TYPES.MONEY_TRANSFER]: {
  //   name: "Transfert d'argent",
  //   icon: GlobeAltIcon,
  //   options: PAYMENT_METHODS[PAYMENT_TYPES.MONEY_TRANSFER],
  // },
};

export default function WithdrawalForm({
  walletId,
  walletType,
  balance_usd,
  balance_cdf,
  onClose,
  onSuccess,
}) {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF, selectedCurrency: globalCurrency } = useCurrency();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    accountNumber: "",
    accountName: "",
    phoneNumber: "",
    phoneCode: "+243", // Indicatif téléphonique par défaut
    country: "CD", // Pays par défaut: République Démocratique du Congo
    // fullName: "", // Nouveau champ pour transfert d'argent
    // recipientCountry: "", // Nouveau champ pour transfert d'argent
    password: "", // Mot de passe pour confirmer le retrait
    otpCode: "", // Champ OTP conservé pour compatibilité mais non utilisé
    currency: "", // Devise à sélectionner: USD ou CDF
  });
  const [selectedCurrency, setSelectedCurrency] = useState(""); // État pour la devise sélectionnée
  const [walletData, setWalletData] = useState({
    balance_usd: parseFloat(balance_usd) || 0,
    balance_cdf: parseFloat(balance_cdf) || 0,
    total_earned: 0, // Non utilisé dans ce composant
    total_withdrawn: 0, // Non utilisé dans ce composant
  });
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [feePercentage, setFeePercentage] = useState(0);
  const [referralCommission, setReferralCommission] = useState(0);
  const [referralCommissionPercentage, setReferralCommissionPercentage] =
    useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);

  // Ces variables sont définies avec des valeurs par défaut pour l'authentification par mot de passe uniquement
  const [showOtpField, setShowOtpField] = useState(false);
  const [usePasswordInsteadOfOtp, setUsePasswordInsteadOfOtp] = useState(true);
  const formRef = useRef(null);

  // Fonction pour formater le numéro de carte de crédit (ajouter des espaces tous les 4 chiffres)
  const formatCreditCardNumber = (value) => {
    // Supprimer tous les caractères non numériques
    const v = value.replace(/\D/g, "");

    // Ajouter un espace tous les 4 chiffres
    const matches = v.match(/\d{1,4}/g);
    const formatted = matches ? matches.join(" ") : "";

    return formatted;
  };

  // Fonction pour obtenir l'emoji du drapeau à partir du code pays
  const getFlagEmoji = (countryCode) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Fonction pour valider le numéro de téléphone en fonction du pays
  const validatePhoneNumber = (phoneNumber, country) => {
    // Supprimer tous les caractères non numériques
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Vérifier que le numéro n'est pas vide
    if (!cleanNumber) {
      return false;
    }

    // Longueurs attendues pour différents pays (sans l'indicatif)
    const expectedLengths = {
      CD: 9, // RD Congo
      CG: 9, // Congo-Brazzaville
      CI: 8, // Côte d'Ivoire
      CM: 9, // Cameroun
      SN: 9, // Sénégal
      FR: 9, // France
      BE: 9, // Belgique
      CA: 10, // Canada
      US: 10, // États-Unis
      GB: 10, // Royaume-Uni
      DE: 10, // Allemagne
    };

    // Vérifier la longueur du numéro
    const expectedLength = expectedLengths[country] || 9; // 9 par défaut

    return cleanNumber.length === expectedLength;
  };

  // Fonction pour concaténer l'indicatif téléphonique et le numéro de téléphone
  const formatFullPhoneNumber = (phoneCode, phoneNumber) => {
    // Supprimer le + de l'indicatif s'il existe
    const code = phoneCode.replace("+", "");
    // Supprimer tous les caractères non numériques du numéro
    const number = phoneNumber.replace(/\D/g, "");
    // Si le numéro commence par 0, le supprimer
    const cleanNumber = number.startsWith("0") ? number.substring(1) : number;
    // Concaténer l'indicatif et le numéro sans le +
    return `${code}${cleanNumber}`;
  };

  // Mettre à jour walletData si les props changent
  useEffect(() => {
    setWalletData({
      balance_usd: parseFloat(balance_usd) || 0,
      balance_cdf: parseFloat(balance_cdf) || 0,
      total_earned: 0, // Non utilisé dans ce composant
      total_withdrawn: 0, // Non utilisé dans ce composant
    });
  }, [balance_usd, balance_cdf]);

  // Initialiser la devise selon le contexte global
  useEffect(() => {
    const initialCurrency = canUseCDF() ? globalCurrency : "USD";
    setSelectedCurrency(initialCurrency);
    setFormData(prev => ({ ...prev, currency: initialCurrency }));
  }, [canUseCDF, globalCurrency]);

  // Récupérer les frais de retrait et commission
  useEffect(() => {
    const initializeFees = async () => {
      try {
        // Récupérer les pourcentages de frais
        await Promise.all([
          fetchWithdrawalFeePercentage(),
          fetchReferralCommissionPercentage(),
        ]);
      } catch (error) {
        console.error("Erreur lors de l'initialisation des frais:", error);
      } finally {
        setLoadingFees(false);
      }
    };

    initializeFees();
  }, []);

  // Fonction pour récupérer le pourcentage de commission de parrainage depuis les paramètres du système
  const fetchReferralCommissionPercentage = async () => {
    try {
      const response = await axios.get("/api/withdrawal/referral-commission");

      if (response.data.success) {
        const percentage = parseFloat(response.data.percentage) || 0;
        setReferralCommissionPercentage(percentage);
        return percentage;
      }
      setReferralCommissionPercentage(0);
      return 0;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du pourcentage de commission:",
        error
      );
      setReferralCommissionPercentage(0);
      return 0;
    }
  };

  // Fonction pour récupérer le pourcentage de frais de retrait global
  const fetchWithdrawalFeePercentage = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      // Appel à l'API qui retourne le pourcentage global des frais
      const response = await axios.post("/api/transaction-fees/withdrawal", {
        amount: 100, // Montant de référence pour calculer le pourcentage
      });

      if (response.data.status === "success") {
        // Stocker le pourcentage plutôt que le montant des frais
        const percentage = response.data.data.percentage || 0;
        setFeePercentage(percentage);
        setFeesError(false);
        return percentage;
      } else {
        setFeesError(true);
        toast.error("Erreur lors de la récupération des frais");
        setFeePercentage(0);
        return 0;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des frais:", error);
      setFeesError(true);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des frais: " + error.message
      );
      setFeePercentage(0);
      return 0;
    } finally {
      setLoadingFees(false);
    }
  };

  // Récupérer les frais de transaction depuis le backend
  // Fonction pour recalculer les frais manuellement (en cas d'erreur)
  const recalculateFees = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      // Récupérer les pourcentages à nouveau
      const [feePercentage, commissionPercentage] = await Promise.all([
        fetchWithdrawalFeePercentage(),
        fetchReferralCommissionPercentage(),
      ]);

      // Les frais seront recalculés automatiquement via l'effet qui surveille formData.amount et feePercentage
    } catch (error) {
      setFeesError(true);
      toast.error("Erreur lors du recalcul des frais");
    } finally {
      setLoadingFees(false);
    }
  };

  // Effet pour calculer les frais lorsque le montant ou les pourcentages changent
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      // Calculer les frais localement en fonction du pourcentage global
      const amount = parseFloat(formData.amount);

      // Calculer les frais de retrait
      if (feePercentage > 0) {
        const fee = amount * (feePercentage / 100);
        setWithdrawalFee(fee);
      }

      // Calculer la commission du parrain
      if (referralCommissionPercentage > 0) {
        const commission = amount * (referralCommissionPercentage / 100);
        setReferralCommission(commission);
      }
    } else {
      // Réinitialiser les frais si le montant n'est pas valide
      setWithdrawalFee(0);
      setReferralCommission(0);
    }
  }, [formData.amount, feePercentage, referralCommissionPercentage]);

  // Fonction handleSendOtp supprimée - Authentification par mot de passe uniquement

  // Fonction pour valider le formulaire
  const isFormValid = () => {
    // Vérifier si le montant est valide
    if (
      !formData.amount ||
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      return false;
    }

    // Vérifier si le montant total ne dépasse pas le solde disponible
    const totalAmount =
      parseFloat(formData.amount) + withdrawalFee + referralCommission;
    if (
      totalAmount >
      (selectedCurrency === "USD"
        ? walletData?.balance_usd
        : walletData?.balance_cdf)
    ) {
      return false;
    }

    // Vérifier si une méthode de paiement a été sélectionnée
    if (!selectedPaymentOption) {
      return false;
    }

    // Vérifier les champs spécifiques selon le type de paiement
    if (selectedType === PAYMENT_TYPES.MOBILE_MONEY) {
      if (
        !formData.phoneNumber ||
        !validatePhoneNumber(formData.phoneNumber, formData.country)
      ) {
        return false;
      }
    } else if (selectedType === PAYMENT_TYPES.BANK_TRANSFER) {
      if (
        !formData.accountNumber ||
        !formData.accountName ||
        !formData.bankName
      ) {
        return false;
      }
    } else if (selectedType === PAYMENT_TYPES.CREDIT_CARD) {
      if (!formData.accountNumber || !formData.accountName) {
        return false;
      }
    } else if (selectedType === PAYMENT_TYPES.MONEY_TRANSFER) {
      if (
        !formData.fullName ||
        !formData.recipientCity ||
        !formData.idType ||
        !formData.idNumber ||
        !formData.phoneNumber ||
        !validatePhoneNumber(formData.phoneNumber, formData.country)
      ) {
        return false;
      }
    }

    // Vérifier si le mot de passe est présent
    if (!formData.password) {
      return false;
    }

    return true;
  };

  // Vérifier si le formulaire est valide pour la soumission finale
  const isSubmitEnabled = () => {
    if (loadingFees) {
      return false;
    }

    if (!isFormValid()) {
      return false;
    }

    // Vérifier que le mot de passe est rempli
    if (!formData.password) {
      return false;
    }

    return true;
  };

  // Cette fonction n'est plus utilisée - Authentification par mot de passe uniquement
  const isOtpEnabled = () => {
    return false; // Désactivée car nous n'utilisons plus l'OTP
  };

  // Effet pour mettre à jour la validité du formulaire
  useEffect(() => {
    setFormIsValid(isFormValid());
  }, [formData, selectedPaymentOption, selectedType, feesError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSubmitEnabled()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      // Préparation des données de base communes à tous les types de paiement
      const requestData = {
        amount: parseFloat(formData.amount),
        payment_method: selectedPaymentOption,
        payment_type: selectedType,
        currency: formData.currency,
        // Résumé de la transaction
        withdrawal_fee: withdrawalFee,
        referral_commission: referralCommission,
        total_amount:
          parseFloat(formData.amount) + withdrawalFee + referralCommission,
        fee_percentage: feePercentage,
        // Authentification par mot de passe uniquement
        password: formData.password,
      };

      // Ajout des données spécifiques selon le type de paiement
      if (selectedType === PAYMENT_TYPES.MOBILE_MONEY) {
        requestData.phone_number = formatFullPhoneNumber(
          formData.phoneCode,
          formData.phoneNumber
        );
        requestData.country = formData.country; // Ajouter le pays sélectionné
      } else if (selectedType === PAYMENT_TYPES.CREDIT_CARD) {
        requestData.account_number = formData.accountNumber;
        requestData.account_name = formData.accountName;
        requestData.country = formData.country; // Ajouter le pays sélectionné
        requestData.payment_details = {
          account_number: formData.accountNumber,
          account_name: formData.accountName,
          country: formData.country,
        };
      }

      // Sinon, procéder au retrait
      const response = await axios.post(
        `/api/withdrawal/request/${walletId}`,
        requestData
      );

      if (response.data.success) {
        toast.success("Votre demande de retrait a été soumise avec succès");

        // Fermer le modal après 2 secondes ET notifier le parent juste avant
        setTimeout(() => {
          // Notifier le parent du succès pour mettre à jour l'état
          if (onSuccess) {
            onSuccess();
          }
          // Fermer le modal
          onClose();
        }, 2000);
      } else {
        console.error("Erreur lors du retrait:", response.data);
        toast.error(
          response.data.message ||
            "Une erreur est survenue lors du traitement de votre demande"
        );
      }
    } catch (error) {
      console.error("Erreur lors du retrait:", error);

      // Amélioration de la gestion des erreurs pour les réponses 422
      if (error.response && error.response.status === 422) {
        // Récupérer le message d'erreur spécifique du backend
        const errorMessage =
          error.response.data.message ||
          "Validation échouée. Veuillez vérifier vos informations.";

        // Si le backend renvoie des erreurs de validation détaillées
        if (error.response.data.errors) {
          const errorDetails = Object.values(error.response.data.errors)
            .flat()
            .join(", ");

          toast.error(`${errorMessage} (${errorDetails})`);
        } else {
          toast.error(errorMessage);
        }
      } else {
        // Pour les autres types d'erreurs
        toast.error(
          error.response?.data?.message ||
            "Une erreur est survenue lors du traitement de votre demande"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {Object.keys(filteredPaymentTypes).map((typeKey) => {
          const type = filteredPaymentTypes[typeKey];
          const methodInfo = paymentMethodsMap[type];

          if (!methodInfo) return null;

          const Icon = methodInfo.icon;

          return (
            <button
              key={type}
              type="button"
              className={`method-card flex items-center p-4 ${
                selectedType === type ? "selected" : ""
              } ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              onClick={() => {
                setSelectedType(type);
                setSelectedMethod(methodInfo);
                setSelectedPaymentOption(null); // Réinitialiser l'option spécifique

                // Si le type est mobile-money, forcer le pays à CD (République démocratique du Congo)
                if (type === PAYMENT_TYPES.MOBILE_MONEY) {
                  setFormData((prevData) => ({
                    ...prevData,
                    country: "CD",
                    phoneCode: "+243",
                  }));
                }
              }}
            >
              <Icon
                className={`h-6 w-6 mr-3 ${
                  selectedType === type
                    ? "text-primary-500"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              />
              <span
                className={`font-medium ${
                  selectedType === type
                    ? "text-primary-500"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                {methodInfo.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <style>{customStyles}</style>
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
      <div className="modal-overlay">
        <div className="modal-container">
          <div
            className={`inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:align-middle sm:max-w-lg sm:w-full ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="modal-content">
              {/* En-tête avec dégradé */}
              <div
                className={`sticky top-0 z-10 px-6 py-4 ${
                  isDarkMode
                    ? "bg-gradient-to-r from-gray-700 to-gray-800"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Retrait de fonds
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <XMarkIcon
                      className={`h-5 w-5 ${
                        isDarkMode
                          ? "text-gray-300 hover:text-white"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    />
                  </button>
                </div>
                <p
                  className={`mt-1 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Retirez des fonds de votre portefeuille{" "}
                  {walletType === "main" ? "principal" : "secondaire"}
                </p>
                <div
                  className={`mt-2 p-3 rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 bg-opacity-50"
                      : "bg-white bg-opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Solde disponible:
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {selectedCurrency === "USD"
                        ? `${walletData?.balance_usd?.toFixed(2) || "0.00"} $`
                        : selectedCurrency === "CDF"
                        ? `${walletData?.balance_cdf?.toFixed(2) || "0.00"} FC`
                        : "Sélectionnez une devise"}
                    </span>
                  </div>
                </div>
              </div>

              <form
                id="withdrawalForm"
                onSubmit={handleSubmit}
                className="px-6 py-4"
              >
                {/* Affichage automatique de la devise selon le contexte global */}
                <div className="mb-6 slide-in">
                  <h4
                    className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Compte à débiter
                  </h4>
                  <div className="grid gap-4 grid-cols-1">
                    {/* Portefeuille automatiquement sélectionné */}
                    <div
                      className={`p-4 rounded-xl border-2 ${
                        selectedCurrency === "USD"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-green-500 bg-green-50 dark:bg-green-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br ${
                            selectedCurrency === "USD"
                              ? "from-blue-500 to-blue-600"
                              : "from-green-500 to-green-600"
                          }`}
                        >
                          {selectedCurrency === "USD" ? (
                            <CurrencyDollarIcon className="h-5 w-5 text-white" />
                          ) : (
                            <BanknotesIcon className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <h5
                          className={`text-sm font-semibold ${
                            selectedCurrency === "USD"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {selectedCurrency === "USD"
                            ? "Portefeuille Dollars Américains"
                            : "Portefeuille Francs Congolais"}
                        </h5>
                      </div>
                      <p
                        className={`text-xl font-bold ${
                          selectedCurrency === "USD"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {selectedCurrency === "USD"
                          ? `${walletData?.balance_usd?.toFixed(2) || "0.00"} $`
                          : `${walletData?.balance_cdf?.toFixed(2) || "0.00"} FC`}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {selectedCurrency === "USD"
                          ? "Devise sélectionnée automatiquement (USD)"
                          : "Devise sélectionnée automatiquement (CDF)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection de la méthode de paiement */}
                <div
                  className={`mb-6 slide-in ${
                    !selectedCurrency ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Méthode de retrait
                  </h4>
                  {renderPaymentMethodCards()}
                </div>

                {/* Options de paiement spécifiques */}
                {selectedMethod && selectedMethod.options && (
                  <div
                    className={`mb-6 slide-in ${
                      !selectedCurrency ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Sélectionnez une option
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedMethod.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`method-card flex items-center gap-3 ${
                            selectedPaymentOption === option.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => setSelectedPaymentOption(option.id)}
                        >
                          {option.icon && (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm">
                              <img
                                src={option.icon}
                                alt={option.name}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                          )}
                          {!option.icon && option.iconColor && (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: option.iconColor,
                                }}
                              >
                                <PhoneIcon className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                          {!option.icon && !option.iconColor && (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                              <PhoneIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            </div>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              selectedPaymentOption === option.id
                                ? "text-primary-500"
                                : isDarkMode
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {option.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sélection du pays - affiché uniquement si le type de paiement n'est pas mobile-money */}
                {selectedType !== PAYMENT_TYPES.MOBILE_MONEY && (
                  <div
                    className={`mb-4 ${
                      !selectedCurrency ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <label className="input-label dark:text-gray-200">
                      Pays <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={(e) => {
                          // Trouver l'indicatif téléphonique correspondant au pays sélectionné
                          const selectedCountry = countries.find(
                            (c) => c.code === e.target.value
                          );
                          setFormData({
                            ...formData,
                            country: e.target.value,
                            phoneCode: selectedCountry
                              ? selectedCountry.phoneCode
                              : "+243",
                          });
                        }}
                        className="input-field pl-10"
                        required
                      >
                        {countries.map((country) => {
                          // Trouver l'indicatif téléphonique du pays
                          const phoneCode = country.phoneCode || "";
                          return (
                            <option key={country.code} value={country.code}>
                              {country.name} ({phoneCode})
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {formData.country && (
                          <img
                            src={`https://flagcdn.com/${formData.country.toLowerCase()}.svg`}
                            alt={formData.country}
                            className="w-5 h-auto"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "inline";
                            }}
                          />
                        )}
                        <span style={{ display: "none" }}>
                          {getFlagEmoji(formData.country)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Champs du formulaire */}
                {selectedType && (
                  <div
                    className={`mb-6 slide-in ${
                      !selectedCurrency ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {selectedType === PAYMENT_TYPES.MOBILE_MONEY && (
                      <div>
                        <div className="mb-4">
                          <label className="input-label dark:text-gray-200">
                            Numéro de téléphone{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="flex">
                            <div className="flex-none w-24 bg-gray-100 dark:bg-gray-700 rounded-l-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                              {formData.phoneCode}
                            </div>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={(e) => {
                                // Ne garder que les chiffres
                                const value = e.target.value.replace(/\D/g, "");
                                setFormData({
                                  ...formData,
                                  phoneNumber: value,
                                });
                              }}
                              placeholder="Numéro sans indicatif"
                              className="flex-1 input-field rounded-l-none border-l-0"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Exemple: pour {formData.phoneCode} 123456789
                          </p>
                          {formData.phoneNumber &&
                            !validatePhoneNumber(
                              formData.phoneNumber,
                              formData.country
                            ) && (
                              <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                                Numéro de téléphone invalide pour le pays
                                sélectionné.
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {selectedType === PAYMENT_TYPES.CREDIT_CARD && (
                      <div>
                        <div className="mb-4">
                          <label className="input-label dark:text-gray-200">
                            Numéro de carte{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="accountNumber"
                            value={formatCreditCardNumber(
                              formData.accountNumber
                            )}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountNumber: e.target.value.replace(
                                  /\D/g,
                                  ""
                                ),
                              })
                            }
                            placeholder="XXXX XXXX XXXX XXXX"
                            className="input-field"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="input-label dark:text-gray-200">
                            Nom du titulaire de la carte{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="accountName"
                            value={formData.accountName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accountName: e.target.value,
                              })
                            }
                            placeholder="Nom du titulaire de la carte"
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="input-label dark:text-gray-200">
                        Montant <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">
                          {selectedCurrency === "USD" ? "$" : "FC"}
                        </span>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          className="input-field flex-1"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Solde disponible:{" "}
                        {selectedCurrency === "USD"
                          ? `${walletData?.balance_usd?.toFixed(2) || "0.00"} $`
                          : `${
                              walletData?.balance_cdf?.toFixed(2) || "0.00"
                            } FC`}
                      </p>
                      {formData.amount &&
                        parseFloat(formData.amount) > 0 &&
                        parseFloat(formData.amount) +
                          withdrawalFee +
                          referralCommission >
                          (selectedCurrency === "USD"
                            ? walletData?.balance_usd
                            : walletData?.balance_cdf) && (
                          <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                            Solde insuffisant. Le montant total (montant + frais
                            + commission) dépasse votre solde disponible.
                          </p>
                        )}
                    </div>

                    {/* Champ de mot de passe */}
                    {selectedPaymentOption &&
                      formData.amount &&
                      parseFloat(formData.amount) > 0 && (
                        <div className="mb-4 fade-in">
                          <label className="input-label dark:text-gray-200">
                            Mot de passe <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            placeholder="Entrez votre mot de passe pour confirmer"
                            className="input-field"
                            required
                            autoComplete="current-password"
                          />
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <p>
                              Veuillez saisir votre mot de passe pour confirmer
                              cette demande de retrait
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Résumé de la transaction */}
                    {selectedPaymentOption &&
                      formData.amount &&
                      parseFloat(formData.amount) > 0 && (
                        <div
                          className={`mt-6 p-4 rounded-lg summary-card ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <h4
                              className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Résumé de la transaction
                            </h4>
                            {loadingFees && (
                              <div className="flex items-center">
                                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                                <span
                                  className={`text-xs ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Calcul des frais...
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                Montant à retirer:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-gray-200" : "text-gray-800"
                                }`}
                              >
                                {parseFloat(formData.amount).toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                Frais de retrait ({feePercentage.toFixed(1)}%):
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-gray-200" : "text-gray-800"
                                }`}
                              >
                                {withdrawalFee.toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                Commission parrainage (
                                {referralCommissionPercentage}%):
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-gray-200" : "text-gray-800"
                                }`}
                              >
                                {referralCommission.toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                            <div className="border-t border-dashed my-2"></div>
                            <div className="flex justify-between">
                              <span
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Total à débiter:
                              </span>
                              <span
                                className={`${
                                  isDarkMode ? "text-red-400" : "text-red-600"
                                } font-bold`}
                              >
                                {(
                                  parseFloat(formData.amount) +
                                  withdrawalFee +
                                  referralCommission
                                ).toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>

                            {/* Information sur la commission du parrain */}
                            <div className="mt-4 pt-3 border-t border-dashed">
                              <div className="flex items-start">
                                <UserGroupIcon
                                  className={`h-5 w-5 mr-2 ${
                                    isDarkMode
                                      ? "text-blue-400"
                                      : "text-blue-600"
                                  }`}
                                />
                                <div>
                                  <p
                                    className={`text-sm font-medium ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    Commission parrainage
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Votre parrain direct recevra{" "}
                                    {referralCommissionPercentage}% du montant
                                    demandé, soit{" "}
                                    {referralCommission.toFixed(2)}{" "}
                                    {selectedCurrency === "USD" ? "$" : "FC"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Bouton de rechargement des frais en cas d'erreur */}
                            {feesError && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={recalculateFees}
                                  className="flex items-center justify-center w-full py-2 px-3 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
                                >
                                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                                  Recalculer les frais
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Pied de page */}
                <div
                  className={`sticky bottom-0 z-10 p-4 border-t ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      form="withdrawalForm"
                      disabled={loading || loadingFees || !isSubmitEnabled()}
                      className={`btn-primary ${
                        isSubmitEnabled() && !loading && !loadingFees
                          ? "pulse"
                          : ""
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </span>
                      ) : loadingFees ? (
                        <span className="flex items-center justify-center">
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Calcul des frais...
                        </span>
                      ) : (
                        "Confirmer le retrait"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
