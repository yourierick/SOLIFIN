import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Dialog,
  Avatar,
  Autocomplete,
  Checkbox,
  InputLabel, // Import manquant ajouté
  ButtonGroup,
} from "@mui/material";
import {
  XMarkIcon,
  CreditCardIcon,
  PhoneIcon,
  WalletIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import {
  CreditCard as CreditCardIcon2,
  Wallet as WalletIcon2,
  Phone as PhoneIcon2,
  Payment as PaymentIcon,
  CreditScore as CreditScoreIcon,
  AccountBalance as BankIcon,
} from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import axios from "../utils/axios";
import { useToast } from "../contexts/ToastContext";
import Notification from "./Notification";
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from "../config";

// Importation des icônes pour les méthodes de paiement
import airtelIcon from "../assets/icons-mobil-money/airtel.png";
import mpesaIcon from "../assets/icons-mobil-money/mpesa.png";
import orangeIcon from "../assets/icons-mobil-money/orange.png";
import mtnIcon from "../assets/icons-mobil-money/mtn.png";
import moovIcon from "../assets/icons-mobil-money/moov.png";
import africellIcon from "../assets/icons-mobil-money/afrimoney.png";
import visaIcon from "../assets/icons-mobil-money/visa.png";
import mastercardIcon from "../assets/icons-mobil-money/mastercard.png";
import amexIcon from "../assets/icons-mobil-money/americanexpress.png";
import { countries } from "../data/countries";

// Composant local pour l'indicatif téléphonique
const SimplePhoneCode = ({ value, onChange }) => {
  // Utiliser un select standard de Material UI avec Autocomplete
  const [open, setOpen] = useState(false);

  // Codes prioritaires à afficher en haut de la liste
  const priorityCodes = [
    "CD",
    "CI",
    "FR",
    "US",
    "SN",
    "CM",
    "BE",
    "CA",
    "MA",
    "DZ",
    "TN",
  ];

  // Créer une liste ordonnée avec les pays prioritaires en premier
  const priorityCountries = [];
  const otherCountries = [];

  // Trier les pays
  countries.forEach((country) => {
    if (priorityCodes.includes(country.code)) {
      priorityCountries.push(country);
    } else {
      otherCountries.push(country);
    }
  });

  // Trier les pays prioritaires selon l'ordre défini
  priorityCountries.sort((a, b) => {
    return priorityCodes.indexOf(a.code) - priorityCodes.indexOf(b.code);
  });

  // Trier les autres pays par ordre alphabétique
  otherCountries.sort((a, b) => a.name.localeCompare(b.name));

  // Combiner les deux listes
  const allCountries = [...priorityCountries, ...otherCountries];

  // Trouver le pays correspondant à la valeur actuelle
  const selectedCountry =
    allCountries.find((country) => country.phoneCode === value) || null;

  return (
    <Autocomplete
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      size="small"
      options={allCountries}
      value={selectedCountry}
      onChange={(event, newValue) => {
        if (newValue) {
          onChange(newValue.phoneCode);
        }
      }}
      getOptionLabel={(option) => `${option.phoneCode} (${option.name})`}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Indicatif"
          InputProps={{
            ...params.InputProps,
            style: { paddingRight: "8px" },
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.code}>
          {option.phoneCode} ({option.name})
        </li>
      )}
      ListboxProps={{
        style: { maxHeight: 300 },
      }}
      componentsProps={{
        popper: {
          style: { zIndex: 9999 },
          className: "phone-code-menu",
        },
      }}
    />
  );
};

// Mapping des méthodes de paiement avec leurs icônes
const paymentMethodsMap = {
  [PAYMENT_TYPES.MOBILE_MONEY]: {
    name: "Mobile Money",
    icon: PhoneIcon,
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map((option) => {
      // Ajouter les icônes aux options de mobile money
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
  [PAYMENT_TYPES.WALLET]: {
    name: "Portefeuille",
    icon: WalletIcon,
  },
};

// Style CSS pour la barre de défilement personnalisée et les animations
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
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.2s ease;
    cursor: pointer;
    background: white;
  }
  
  .method-card:hover {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .method-card.selected {
    border-color: #1976d2;
    background-color: rgba(25, 118, 210, 0.04);
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
  }
  
  .dark .method-card {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  .dark .method-card:hover {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: #4b5563;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .dark .method-card.selected {
    border-color: #60a5fa;
    background-color: rgba(96, 165, 250, 0.1);
    box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
  }
  
  .summary-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 16px 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark .summary-card {
    background: linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.8) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }
  
  .dark .summary-card:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    border-color: rgba(96, 165, 250, 0.3);
  }
  
  /* Scrollbar personnalisée pour mobile */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 10px;
    transition: background 0.2s;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(75, 85, 99, 0.6);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(75, 85, 99, 0.8);
  }
  
  /* Animations */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .slide-in {
    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-in-out forwards;
  }
  
  /* Responsive styles */
  @media (max-width: 640px) {
    .method-card {
      padding: 10px 12px;
      border-radius: 10px;
    }
    
    .summary-card {
      padding: 12px 16px;
      border-radius: 12px;
    }
  }
  
  /* Modal centering and overflow protection */
  .modal-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    position: fixed;
    inset: 0;
    z-index: 50;
  }
  
  .modal-content {
    width: 100%;
    max-width: 42rem; /* max-w-2xl */
    max-height: 90vh;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
  
  .modal-scrollable-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0; /* Important for Firefox */
    overscroll-behavior: contain; /* Empêche le scroll de la page en arrière-plan */
  }
  
  .modal-footer {
    flex-shrink: 0;
    border-top: 1px solid;
  }
  
  .modal-footer.border-gray-200 {
    border-color: #e5e7eb;
  }
  
  .dark .modal-footer.border-gray-700 {
    border-color: #374151;
  }
  
  /* Amélioration pour mobile */
  @media (max-width: 640px) {
    .modal-container {
      padding: 0.75rem;
    }
    
    .modal-content {
      max-height: 85vh;
      border-radius: 0.75rem;
    }
    
    .modal-scrollable-content {
      /* Amélioration du scroll sur mobile */
      -webkit-overflow-scrolling: touch;
    }
  }
  
  /* Empêcher le body scroll quand le modal est ouvert */
  body.modal-open {
    overflow: hidden;
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

export default function PurchasePackForm({
  open,
  onClose,
  pack,
  onPurchaseSuccess,
  isRenewal = false, // Nouvelle prop pour différencier achat et renouvellement
}) {
  const { isDarkMode } = useTheme();
  const { isCDFEnabled, canUseCDF } = useCurrency();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_TYPES.WALLET); // Initialisation à Wallet par défaut
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState("solifin-wallet"); // Option par défaut pour wallet
  const [selectedCardOption, setSelectedCardOption] = useState("");
  const [selectedMobileOption, setSelectedMobileOption] = useState("");
  const [formFields, setFormFields] = useState({});
  const [formIsValid, setFormIsValid] = useState(false);
  const [months, setMonths] = useState(1);
  const [referralCode, setReferralCode] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(
    canUseCDF() ? null : "USD"
  );
  const [transactionFees, setTransactionFees] = useState(0);
  const [feePercentage, setFeePercentage] = useState(null);
  const [prix_du_pack, setPrixDuPack] = useState(0); // Prix du pack dans la devise sélectionnée
  const [totalAmount, setTotalAmount] = useState(0); // Montant total de l'achat
  const [walletBalance, setWalletBalance] = useState(0); // Solde du wallet
  const [loadingBalance, setLoadingBalance] = useState(false); // Chargement du solde
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+243"); // Indicatif par défaut
  const [localLoading, setLocalLoading] = useState(false);
  const [noSponsorCode, setNoSponsorCode] = useState(false);

  // État pour stocker les frais récupérés à l'ouverture du modal
  const [initialFees, setInitialFees] = useState({
    percentage: 0,
    fee: 0,
    loaded: false,
  });

  // Initialiser le nombre de mois en fonction du type d'abonnement lorsque le pack change
  useEffect(() => {
    if (pack) {
      const step = getSubscriptionStep(pack.abonnement);
      setMonths(step);

      // Initialiser la devise et le prix du pack
      if (!selectedCurrency) {
        // Vérifier si pack.cdf_price existe et n'est pas null
        if (
          pack.cdf_price !== null &&
          pack.cdf_price !== undefined &&
          pack.cdf_price > 0 &&
          canUseCDF()
        ) {
          setSelectedCurrency("USD"); // Commencer avec USD comme défaut (utilisateur pourra choisir)
        } else {
          setSelectedCurrency("USD"); // Forcer USD si cdf_price n'existe pas ou CDF désactivé
        }

        // Calculer le prix initial selon la devise disponible
        const prixInitial = pack.price * step;
        setPrixDuPack(prixInitial);
      }
    }
  }, [pack]);

  // Mettre à jour le prix du pack quand la devise change
  useEffect(() => {
    if (pack && selectedCurrency) {
      const step = getSubscriptionStep(pack.abonnement);
      let prixDeBase;

      if (selectedCurrency === "USD") {
        prixDeBase = pack.price * step;
      } else if (selectedCurrency === "CDF") {
        prixDeBase = pack.cdf_price * step;
      } else {
        prixDeBase = pack.price * step;
      }

      setPrixDuPack(prixDeBase);
    }
  }, [selectedCurrency, pack]);

  // Récupérer le solde du wallet et les frais initiaux à l'ouverture du modal
  useEffect(() => {
    if (open) {
      // Récupérer le solde du wallet
      getUserWalletBalance();

      // Récupérer les frais initiaux une seule fois à l'ouverture
      if (!initialFees.loaded) {
        fetchInitialFees();
      }

      // Empêcher le scroll du body quand le modal est ouvert
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      // Réactiver le scroll du body quand le modal est fermé
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }

    // Nettoyage quand le composant est démonté
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  // Gérer la touche Escape pour fermer le modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && open && !loading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [open, onClose, loading]);

  // Récupération des frais initiaux

  // Fonction pour rendre les options de paiement avec des icônes
  const renderPaymentOptionWithIcon = (option, type) => {
    // Récupérer les informations de la méthode de paiement depuis le mapping
    const methodInfo = paymentMethodsMap[type] || {};

    // Trouver l'option spécifique avec son icône dans le mapping
    const optionWithIcon =
      methodInfo.options?.find((opt) => opt.id === option.id) || option;

    // Déterminer l'icône à afficher
    if (optionWithIcon.icon) {
      // Si l'option a une icône personnalisée (image)
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm">
            <img
              src={optionWithIcon.icon}
              alt={option.name}
              className="w-5 h-5 object-contain"
            />
          </div>
          <span>{option.name}</span>
        </div>
      );
    } else if (type === PAYMENT_TYPES.MOBILE_MONEY) {
      // Icône par défaut pour Mobile Money
      return (
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-5 w-5 text-orange-500" />
          <span>{option.name}</span>
        </div>
      );
    } else if (type === PAYMENT_TYPES.CREDIT_CARD) {
      // Icônes spécifiques pour les cartes de crédit
      let icon = <PaymentIcon className="h-5 w-5 text-blue-500" />;

      if (option.id === "visa") {
        icon = <CreditCardIcon className="h-5 w-5 text-blue-600" />;
      } else if (option.id === "mastercard") {
        icon = <CreditScoreIcon className="h-5 w-5 text-red-600" />;
      } else if (option.id === "american-express") {
        icon = <PaymentIcon className="h-5 w-5 text-purple-600" />;
      }

      return (
        <div className="flex items-center gap-2">
          {icon}
          <span>{option.name}</span>
        </div>
      );
    }

    // Fallback pour tout autre type
    return <span>{option.name}</span>;
  };

  // Fonction pour assigner automatiquement un code parrain admin
  const handleAssignSponsorCode = async () => {
    try {
      setLocalLoading(true);

      // Récupérer les codes parrain pour le pack spécifique
      const response = await axios.get(`/api/admin-packs?pack_id=${pack?.id}`);

      if (
        response.data.success &&
        Array.isArray(response.data.packs) &&
        response.data.packs.length > 0
      ) {
        // Filtrer les codes qui correspondent au pack sélectionné
        const packSpecificCodes = response.data.packs.filter(
          (code) => code.pack_id === pack?.id || !code.pack_id
        );

        if (packSpecificCodes.length > 0) {
          // Prendre un code aléatoire parmi ceux qui correspondent au pack
          const randomCode =
            packSpecificCodes[
              Math.floor(Math.random() * packSpecificCodes.length)
            ];
          setReferralCode(randomCode.referral_code);
          Notification.success(
            `Code parrain "${randomCode.referral_code}" assigné automatiquement pour le pack "${pack?.name}"`
          );
        } else {
          // Si aucun code spécifique au pack, prendre un code général
          const generalCode = response.data.packs.find((code) => !code.pack_id);
          if (generalCode) {
            setReferralCode(generalCode.referral_code);
            Notification.success(
              `Code parrain "${generalCode.referral_code}" assigné automatiquement`
            );
          } else {
            Notification.error("Aucun code parrain disponible pour ce pack");
            setNoSponsorCode(false);
          }
        }
      } else {
        Notification.error("Aucun code parrain disponible");
        setNoSponsorCode(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation du code parrain:", error);
      Notification.error("Erreur lors de l'assignation du code parrain");
      setNoSponsorCode(false);
    } finally {
      setLocalLoading(false);
    }
  };

  // Fonction pour récupérer les frais initiaux une seule fois à l'ouverture du modal
  const fetchInitialFees = async () => {
    try {
      setLoadingFees(true);

      // Récupérer le pourcentage de frais global une seule fois à l'ouverture du modal
      const response = await axios.post("/api/transaction-fees/purchase", {
        amount: 100, // Montant de référence pour obtenir le pourcentage
      });

      if (response.data.success) {
        const percentage = response.data.percentage || 0;
        setFeePercentage(percentage);
        setInitialFees({
          percentage: percentage,
          fee: response.data.fee || 0,
          loaded: true,
        });
        setFeesError(false);

        // Initialiser la devise par défaut après avoir récupéré les frais
        if (!selectedCurrency && pack) {
          // Vérifier si pack.cdf_price existe et n'est pas null
          if (
            pack.cdf_price !== null &&
            pack.cdf_price !== undefined &&
            canUseCDF()
          ) {
            setSelectedCurrency("USD"); // Commencer avec USD comme défaut
          } else {
            setSelectedCurrency("USD"); // Forcer USD si cdf_price n'existe pas ou CDF désactivé
          }
        }

        // Calculer les frais
        calculateFees();

        return percentage;
      } else {
        setFeePercentage(0);
        setInitialFees({
          percentage: 0,
          fee: 0,
          loaded: true,
        });
        setFeesError(true);

        // Initialiser la devise par défaut même en cas d'erreur
        if (!selectedCurrency && pack) {
          setSelectedCurrency("USD");
        }

        calculateFees();

        return 0;
      }
    } catch (error) {
      setFeePercentage(0);
      setInitialFees({
        percentage: 0,
        fee: 0,
        loaded: true,
      });
      setFeesError(true);

      // Initialiser la devise par défaut même en cas d'erreur
      if (!selectedCurrency && pack) {
        setSelectedCurrency("USD");
      }

      calculateFees();

      return 0;
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    // Réinitialiser les champs du formulaire et les options uniquement lors du changement de méthode de paiement
    setFormFields({});
    setSelectedMobileOption("");
    setSelectedCardOption("");
    setSelectedPaymentOption("");
    setFeesError(false);

    // Pour le wallet, définir automatiquement l'option solifin-wallet
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      setSelectedPaymentOption("solifin-wallet");
      // Les frais sont à 0 pour le wallet
      setTransactionFees(0);
      setFeePercentage(0);
    } else {
      // Pour les autres méthodes, recalculer les frais si le montant total est disponible
      if (totalAmount > 0 && initialFees.loaded) {
        const fees = (totalAmount * initialFees.percentage) / 100;
        setTransactionFees(fees);
        setFeePercentage(initialFees.percentage);
      }
    }
  }, [paymentMethod]); // ← Seulement dépendant de paymentMethod

  useEffect(() => {
    // Recalculer les frais lorsque le montant total change (sans réinitialiser les champs)
    if (
      paymentMethod !== PAYMENT_TYPES.WALLET &&
      totalAmount > 0 &&
      initialFees.loaded
    ) {
      const fees = (totalAmount * initialFees.percentage) / 100;
      setTransactionFees(fees);
      setFeePercentage(initialFees.percentage);
    }
  }, [totalAmount, initialFees, paymentMethod]); // ← Calcul des frais quand totalAmount change

  useEffect(() => {
    // Calculer le montant total en fonction du nombre de mois et du prix_du_pack
    if (pack && selectedCurrency && prix_du_pack > 0) {
      // Récupérer le pas d'abonnement (fréquence)
      const step = getSubscriptionStep(pack.abonnement);

      // Calculer le nombre de périodes d'abonnement
      const periods = Math.ceil(months / step);

      // Le montant total est le prix_du_pack multiplié par le nombre de périodes
      const newTotal = prix_du_pack * periods;
      setTotalAmount(newTotal);

      console.log("Calcul du montant total:", {
        prix_mensuel: pack.price,
        pas_abonnement: step,
        prix_du_pack: prix_du_pack, // Prix de base (prix mensuel × pas)
        devise: selectedCurrency,
        duree_mois: months,
        periodes_totales: periods,
        montant_total: newTotal,
        explication: `Prix mensuel (${pack.price}) × pas (${step}) = ${prix_du_pack}, puis × périodes (${periods}) = ${newTotal}`,
      });

      // Les frais seront calculés par le useEffect séparé ci-dessus
    }
  }, [pack, months, prix_du_pack, selectedCurrency, paymentMethod]);

  // Fonction simple pour calculer les frais basés sur un montant
  const calculateFeesForAmount = (amount) => {
    // Si le moyen de paiement est le wallet, les frais sont toujours à 0
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      setTransactionFees(0);
      setFeePercentage(0);
      return;
    }

    // Utiliser le pourcentage de frais récupéré par fetchInitialFees
    let percentage = 0;

    if (initialFees.loaded) {
      percentage = initialFees.percentage;
    } else {
      percentage = feePercentage;
    }

    if (percentage > 0 && amount > 0) {
      const fee = amount * (percentage / 100);
      const roundedFee = parseFloat(fee.toFixed(2));
      setTransactionFees(roundedFee);
      setFeePercentage(percentage);
      console.log(
        `Frais calculés: ${roundedFee} ${selectedCurrency} (${percentage}% de ${amount})`
      );
    } else {
      setTransactionFees(0);
    }
  };

  const calculateFees = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      // Déterminer le montant à utiliser pour le calcul des frais
      const amount = totalAmount; // Utiliser toujours totalAmount qui est déjà dans la bonne devise

      // Si le moyen de paiement est le wallet, les frais sont toujours à 0
      if (paymentMethod === PAYMENT_TYPES.WALLET) {
        setTransactionFees(0);
        setFeePercentage(0);
        setFeesError(false);
        setLoadingFees(false);
        return;
      }

      // Pour les autres moyens de paiement, utiliser les frais récupérés à l'ouverture du modal
      if (initialFees.loaded) {
        // Vérifier que le montant est valide
        if (amount > 0) {
          // Calculer les frais en fonction du pourcentage récupéré initialement
          const calculatedFee = (amount * initialFees.percentage) / 100;
          // Limiter à deux chiffres après la virgule
          const roundedFee = parseFloat(calculatedFee.toFixed(2));
          setTransactionFees(roundedFee);
          setFeePercentage(initialFees.percentage);
          setFeesError(false);
        } else {
          setTransactionFees(0);
          setFeesError(true);
        }
      } else {
        await fetchInitialFees();

        if (initialFees.loaded && amount > 0) {
          const calculatedFee = (amount * initialFees.percentage) / 100;
          // Limiter à deux chiffres après la virgule
          const roundedFee = parseFloat(calculatedFee.toFixed(2));
          setTransactionFees(roundedFee);
          setFeePercentage(initialFees.percentage);
        } else {
          setFeesError(true);
          setTransactionFees(0);
          setFeePercentage(0);
        }
      }
    } catch (error) {
      setFeesError(true);
      setTransactionFees(0);
      setFeePercentage(0);
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    validateForm();
  }, [
    paymentMethod,
    formFields,
    selectedPaymentOption,
    months,
    totalAmount,
    referralCode,
    feesError,
  ]);

  const getUserWalletBalance = async (currency = selectedCurrency) => {
    setLoadingBalance(true);
    try {
      const response = await axios.get("/api/userwallet/balance");

      if (response.data.success) {
        // Récupérer le solde selon la devise
        let balance = 0;
        if (currency === "USD") {
          const usdBalance =
            response.data.balance_usd || response.data.balance || "0";
          // Nettoyer la chaîne USD (ex: "7.90 $" -> "7.90")
          balance = parseFloat(usdBalance.replace(/[^0-9.]/g, ""));
        } else if (currency === "CDF") {
          const cdfBalance = response.data.balance_cdf || "0";
          // Nettoyer la chaîne CDF (ex: "9,930.00 FC" -> "9930.00")
          balance = parseFloat(
            cdfBalance.replace(/[^0-9.]/g, "").replace(/,/g, "")
          );
        }

        setWalletBalance(balance);
      } else {
        console.error(
          "Erreur lors de la récupération du solde:",
          response.data.message
        );
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du solde:", error);
      setWalletBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Le getUserWalletBalance est déjà appelé dans un autre useEffect lors de l'ouverture du modal

  const handleCurrencyChange = async (currency) => {
    setSelectedCurrency(currency);

    // Réinitialiser certains états quand la devise change
    setTransactionFees(0);
    setTotalAmount(0);
    setFormFields({});
    setFormIsValid(false);

    // Utiliser directement le prix du pack selon la devise
    // Calculer le prix de base selon le pas d'abonnement
    const step = getSubscriptionStep(pack.abonnement);

    let prixDeBase;
    if (currency === "USD") {
      prixDeBase = pack.price * step; // Prix mensuel USD × nombre de mois du pas
    } else if (currency === "CDF") {
      prixDeBase = pack.cdf_price * step; // Prix mensuel CDF × nombre de mois du pas
    } else {
      prixDeBase = pack.price * step; // Par défaut, utiliser USD
    }

    console.log("Calcul du prix de base:", {
      prix_mensuel_usd: pack.price,
      prix_mensuel_cdf: pack.cdf_price,
      type_abonnement: pack.abonnement,
      pas_mois: step,
      devise_selectionnee: currency,
      prix_de_base: prixDeBase,
      explication: `Prix mensuel (${
        currency === "CDF" ? pack.cdf_price : pack.price
      } ${currency}) × pas (${step} mois) = ${prixDeBase} ${currency}`,
    });

    setPrixDuPack(prixDeBase);

    // Récupérer le solde du wallet pour la nouvelle devise
    getUserWalletBalance(currency);
  };

  const handleFieldChange = (fieldName, value) => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    const field = selectedMethod?.fields?.find((f) => f.name === fieldName);

    // Appliquer le formatage si défini
    const formattedValue = field?.format ? field.format(value) : value;

    setFormFields((prev) => ({
      ...prev,
      [fieldName]: formattedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      const totalWithFees = totalAmount + (transactionFees || 0);
      if (totalWithFees > walletBalance) {
        setError("Solde insuffisant dans votre wallet");
        setLoading(false);
        return;
      }
    }

    // Vérifier si tous les champs requis sont remplis
    if (!formIsValid) {
      setError("Veuillez remplir tous les champs obligatoires");
      setLoading(false);
      return;
    }

    // Vérifier si le code de parrainage est renseigné ou si l'option "Je n'ai pas de code parrain" est cochée (uniquement pour l'achat)
    if (!isRenewal && !referralCode && !noSponsorCode) {
      setError(
        "Veuillez entrer un code de parrainage ou cocher l'option 'Je n'ai pas de code parrain'"
      );
      setLoading(false);
      return;
    }

    try {
      // Déterminer la méthode spécifique de paiement
      let specificPaymentMethod = selectedPaymentOption;

      // Si aucune méthode spécifique n'est sélectionnée, utiliser une valeur par défaut selon le type
      if (!specificPaymentMethod) {
        setError("Veuillez choisir une méthode de paiement");
        setLoading(false);
        return;
      }

      // Préparer les données de paiement
      let paymentDetails = { ...formFields };

      // Pour Mobile Money, ajouter l'indicatif téléphonique
      if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
        // Utiliser l'indicatif fixe +243 mais sans le + pour l'API
        const phoneCode = "243";
        const phoneWithCode = `${phoneCode}${formFields.phoneNumber}`;

        paymentDetails = {
          ...paymentDetails,
          phoneNumber: phoneWithCode,
        };
      }

      // Calculer le montant correct en fonction de la fréquence du pack
      const step = getSubscriptionStep(pack.abonnement);
      const periods = Math.ceil(months / step);
      const correctAmount = pack.price * periods;

      // Préparer les données à envoyer
      const paymentData = {
        payment_method: specificPaymentMethod, // Méthode spécifique (visa, mastercard, m-pesa, etc.)
        payment_type: paymentMethod, // Type générique (wallet, credit-card, mobile-money)
        transaction_type: isRenewal ? "renew_pack" : "purchase_pack",
        payment_details: paymentDetails,
        duration_months: months,
        // N'envoyer le code de parrainage que pour l'achat
        ...(isRenewal
          ? {}
          : {
              referralCode: referralCode, // Envoyer toujours le referralCode (qui sera assigné automatiquement si coché)
              noSponsorCode: noSponsorCode, // Indiquer si l'utilisateur n'avait pas de code parrain initialement
            }),
        amount: totalAmount.toFixed(2), // Utiliser totalAmount qui est déjà dans la bonne devise
        currency:
          paymentMethod === PAYMENT_TYPES.WALLET ? "USD" : selectedCurrency,
        fees: transactionFees.toFixed(2) || 0,
        packId: pack?.id,
      };

      // Appel à l'API pour acheter le pack
      const response = await axios.post("/api/serdipay/payment", paymentData);

      if (response.data.success) {
        // Message différent selon la méthode de paiement et le type d'opération
        if (paymentMethod === PAYMENT_TYPES.WALLET) {
          // Pour le wallet Solifin, le paiement est traité immédiatement
          Notification.success(
            isRenewal
              ? "Pack renouvelé avec succès!"
              : "Pack acheté avec succès!"
          );
          if (typeof onPurchaseSuccess === "function") onPurchaseSuccess();
          onClose();
        } else {
          // Pour SerdiPay, le paiement est seulement initié à ce stade
          Notification.success(
            isRenewal
              ? "Renouvellement initié avec succès! Vous recevrez une notification dès que le paiement sera confirmé."
              : "Paiement initié avec succès! Vous recevrez une notification dès que le paiement sera confirmé."
          );

          // Fermer le modal après 3 secondes pour permettre à l'utilisateur de continuer sa navigation
          setTimeout(() => {
            if (typeof onPurchaseSuccess === "function") onPurchaseSuccess();
            onClose();
          }, 3000);

          navigate(`/dashboard/packs/:id`, { replace: true });
        }
      } else {
        setError(
          response.data.message ||
            `Une erreur est survenue lors de ${
              isRenewal ? "du renouvellement" : "l'achat"
            } du pack`
        );
      }
    } catch (error) {
      console.error(
        `Erreur lors de ${
          isRenewal ? "du renouvellement" : "l'achat"
        } du pack:`,
        error
      );
      setError(
        error.response?.data?.message ||
          `Une erreur est survenue lors de ${
            isRenewal ? "du renouvellement" : "l'achat"
          } du pack`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentFields = () => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    if (!selectedMethod?.fields) return null;

    return (
      <div className="space-y-2">
        {paymentMethod === PAYMENT_TYPES.MOBILE_MONEY && (
          <div className="mb-4">
            <Typography
              variant="subtitle2"
              gutterBottom
              className="text-primary-600 dark:text-primary-400"
            >
              Choisissez votre opérateur
            </Typography>
            <RadioGroup
              row
              value={selectedMobileOption || selectedPaymentOption}
              onChange={(e) => {
                setSelectedMobileOption(e.target.value);
                setSelectedPaymentOption(e.target.value);
              }}
              className="gap-2"
            >
              {selectedMethod.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio size="small" />}
                  label={renderPaymentOptionWithIcon(
                    option,
                    PAYMENT_TYPES.MOBILE_MONEY
                  )}
                />
              ))}
            </RadioGroup>
          </div>
        )}

        {paymentMethod === PAYMENT_TYPES.CREDIT_CARD && (
          <div className="mb-4">
            <Typography
              variant="subtitle2"
              gutterBottom
              className="text-primary-600 dark:text-primary-400"
            >
              Choisissez votre type de carte
            </Typography>
            <RadioGroup
              row
              value={selectedCardOption || selectedPaymentOption}
              onChange={(e) => {
                setSelectedCardOption(e.target.value);
                setSelectedPaymentOption(e.target.value);
              }}
              className="gap-2"
            >
              {selectedMethod.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio size="small" />}
                  label={renderPaymentOptionWithIcon(
                    option,
                    PAYMENT_TYPES.CREDIT_CARD
                  )}
                />
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Champs de formulaire pour Mobile Money avec indicatif téléphonique */}
        {paymentMethod === PAYMENT_TYPES.MOBILE_MONEY && (
          <div className="mb-4">
            <Typography
              variant="subtitle2"
              gutterBottom
              className="text-gray-600 dark:text-gray-300"
            >
              Numéro de téléphone
            </Typography>
            <div className="relative">
              <TextField
                fullWidth
                size="small"
                placeholder="Numéro sans indicatif"
                value={formFields.phoneNumber || ""}
                onChange={(e) => {
                  // Ne permettre que les chiffres
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleFieldChange("phoneNumber", value);
                }}
                required
                helperText="Entrez uniquement les chiffres sans l'indicatif"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" className="mr-0">
                      <div className="bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded-l-md border-r border-gray-300 dark:border-gray-600">
                        +243
                      </div>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    paddingLeft: "0",
                  },
                  "& .MuiInputAdornment-root": {
                    marginRight: "0",
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Champs de formulaire pour Carte de Crédit */}
        {paymentMethod === PAYMENT_TYPES.CREDIT_CARD && (
          <div className="grid grid-cols-2 gap-2">
            {selectedMethod.fields.map((field) => (
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
            ))}
          </div>
        )}

        {/* Champs pour le wallet (aucun champ supplémentaire nécessaire) */}
        {paymentMethod === PAYMENT_TYPES.WALLET && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              Le paiement sera effectué directement depuis votre wallet Solifin.
              <br />
              Solde disponible:{" "}
              <strong>
                {loadingBalance ? (
                  <CircularProgress size={12} />
                ) : (
                  <>
                    {walletBalance.toFixed(2)}{" "}
                    {selectedCurrency === "USD" ? "$" : "FC"}
                  </>
                )}
              </strong>
            </Typography>
          </div>
        )}
      </div>
    );
  };

  // Fonction pour déterminer le pas en fonction du type d'abonnement
  const getSubscriptionStep = (subscriptionType) => {
    switch (subscriptionType?.toLowerCase()) {
      case "monthly":
      case "mensuel":
        return 1; // Pas de 1 mois pour abonnement mensuel
      case "quarterly":
      case "trimestriel":
        return 3; // Pas de 3 mois pour abonnement trimestriel
      case "biannual":
      case "semestriel":
        return 6; // Pas de 6 mois pour abonnement semestriel
      case "annual":
      case "yearly":
      case "annuel":
        return 12; // Pas de 12 mois pour abonnement annuel
      case "triennal":
        return 36;
      case "quinquennal":
        return 60;
      default:
        return 1; // Par défaut, pas de 1 mois
    }
  };

  // Récupérer les frais de transfert globaux au chargement du modal
  const fetchTransferFees = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      // Appel à l'API qui retourne le pourcentage global des frais
      const response = await axios.post("/api/transaction-fees/purchase", {
        amount: 100, // Montant de référence pour calculer le pourcentage
      });

      if (response.data.success) {
        // Stocker le pourcentage plutôt que le montant des frais
        setFeePercentage(response.data.percentage);

        // Calculer les frais initiaux si nécessaire
        if (paymentMethod !== PAYMENT_TYPES.WALLET && totalAmount > 0) {
          const fees = (totalAmount * response.data.percentage) / 100;
          setTransactionFees(fees);
        } else {
          setTransactionFees(0);
        }

        setFeesError(false);
      } else {
        setFeesError(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des frais:", error);
      setFeesError(true);
    } finally {
      setLoadingFees(false);
    }
  };

  // Vérifier si le formulaire est valide
  const validateForm = () => {
    let isValid = true;

    // Vérifier si une méthode de paiement est sélectionnée
    isValid = isValid && paymentMethod !== "";

    // Pour le wallet, validation simplifiée
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Vérifier que le solde est suffisant
      if (totalAmount > walletBalance) {
        setFormIsValid(false);
        return false;
      }
      setFormIsValid(true);
      return true;
    }

    // Pour les autres méthodes, vérifier que tous les champs requis sont remplis
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    if (!selectedMethod) {
      setFormIsValid(false);
      return false;
    }

    // Vérifier qu'une option spécifique est sélectionnée si nécessaire
    if (selectedMethod.options && selectedMethod.options.length > 0) {
      if (!selectedPaymentOption) {
        setFormIsValid(false);
        return false;
      }
    }

    // Validation spécifique pour Mobile Money
    if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Vérifier que le numéro de téléphone est rempli
      const phoneNumber = formFields.phoneNumber || "";
      if (!phoneNumber || phoneNumber.trim() === "") {
        setFormIsValid(false);
        return false;
      }

      // Vérifier que l'indicatif téléphonique est sélectionné
      if (!phoneCode) {
        setFormIsValid(false);
        return false;
      }
    }

    // Validation pour Carte de Crédit
    if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD && selectedMethod.fields) {
      const requiredFields = selectedMethod.fields.filter((f) => f.required);
      const allFieldsFilled = requiredFields.every(
        (field) =>
          formFields[field.name] && formFields[field.name].trim() !== ""
      );

      if (!allFieldsFilled) {
        setFormIsValid(false);
        return false;
      }
    }

    // Vérifier que le montant est positif
    if (totalAmount <= 0) {
      setFormIsValid(false);
      return false;
    }

    // Vérifier qu'il n'y a pas d'erreur de calcul des frais
    if (feesError) {
      setFormIsValid(false);
      return false;
    }

    // Tout est valide
    setFormIsValid(true);
    return true;
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 modal-container bg-black/60 backdrop-blur-sm ${
        isDarkMode ? "dark" : ""
      }`}
      onClick={(e) => {
        // Fermer le modal si on clique sur l'arrière-plan (pas sur le contenu)
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <style>{customStyles}</style>
      <div
        className={`modal-content shadow-2xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
      >
        {/* En-tête avec dégradé */}
        <div
          className={`p-4 sm:p-6 ${
            isDarkMode
              ? "bg-gradient-to-r from-green-900 to-green-900"
              : "bg-gradient-to-r from-green-500 to-green-600"
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BanknotesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <Typography
                  variant="h5"
                  component="h2"
                  className="font-bold text-lg sm:text-xl"
                >
                  {isRenewal
                    ? `Renouveler ${pack?.name}`
                    : `Acheter ${pack?.name}`}
                </Typography>
                <Typography
                  variant="body2"
                  className="mt-1 opacity-80 text-xs sm:text-sm hidden sm:block"
                >
                  Complétez les informations ci-dessous pour finaliser votre
                  {isRenewal ? "renouvellement" : "achat"}
                </Typography>
              </div>
            </div>
            <IconButton
              onClick={onClose}
              size="small"
              className="text-white hover:bg-white/20 transition-all duration-200 rounded-lg"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </IconButton>
          </div>
        </div>

        {error && (
          <Alert severity="error" className="mx-4 sm:mx-6 mt-4 mb-0 rounded-lg">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-scrollable-content p-4 sm:p-6 pt-4 custom-scrollbar">
            {/* Sélecteur de devise - uniquement si pack.cdf_price est défini et CDF activé */}
            {pack &&
              pack.cdf_price !== null &&
              pack.cdf_price !== undefined &&
              pack.cdf_price > 0 &&
              canUseCDF() && (
                <div className="slide-in" style={{ animationDelay: "0.1s" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BanknotesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
                    <Typography
                      variant="subtitle1"
                      className="font-bold text-primary-600 dark:text-primary-400 text-sm sm:text-base"
                    >
                      Sélectionnez la devise
                    </Typography>
                  </div>

                  <div className="flex justify-center mb-8">
                    <div
                      className={`inline-flex rounded-full p-1 shadow-sm border ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {/* USD Button */}
                      <button
                        onClick={() => handleCurrencyChange("USD")}
                        disabled={loadingBalance}
                        className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedCurrency === "USD"
                            ? isDarkMode
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-blue-500 text-white shadow-md"
                            : isDarkMode
                            ? "text-gray-300 hover:text-white hover:bg-gray-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        } ${
                          loadingBalance
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {loadingBalance && selectedCurrency === "USD" ? (
                          <CircularProgress size={14} className="text-white" />
                        ) : (
                          <span className="flex items-center space-x-1">
                            <span className="font-semibold">USD</span>
                          </span>
                        )}
                      </button>

                      {/* CDF Button */}
                      {canUseCDF() && (
                        <button
                          onClick={() => handleCurrencyChange("CDF")}
                          disabled={loadingBalance}
                          className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                            selectedCurrency === "CDF"
                              ? isDarkMode
                                ? "bg-green-600 text-white shadow-md"
                                : "bg-green-500 text-white shadow-md"
                              : isDarkMode
                              ? "text-gray-300 hover:text-white hover:bg-gray-700"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          } ${
                            loadingBalance
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          {loadingBalance && selectedCurrency === "CDF" ? (
                            <CircularProgress
                              size={14}
                              className="text-white"
                            />
                          ) : (
                            <span className="flex items-center space-x-1">
                              <span className="font-semibold">CDF</span>
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Le reste du contenu n'est affiché que si une devise est sélectionnée */}
            {selectedCurrency && (
              <>
                {/* Sélection de la méthode de paiement */}
                <div className="slide-in" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <PaymentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
                    <Typography
                      variant="subtitle1"
                      className="font-bold text-primary-600 dark:text-primary-400 text-sm sm:text-base"
                    >
                      Méthode de paiement
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {paymentMethods.map((method) => {
                      const methodInfo = paymentMethodsMap[method.id] || {
                        name: method.name,
                      };
                      const Icon =
                        methodInfo.icon ||
                        (method.id === PAYMENT_TYPES.WALLET
                          ? WalletIcon2
                          : method.id === PAYMENT_TYPES.CREDIT_CARD
                          ? CreditCardIcon2
                          : method.id === PAYMENT_TYPES.MOBILE_MONEY
                          ? PhoneIcon2
                          : null);

                      const isSelected = paymentMethod === method.id;
                      const isWallet = method.id === PAYMENT_TYPES.WALLET;
                      const isCreditCard =
                        method.id === PAYMENT_TYPES.CREDIT_CARD;
                      const isMobileMoney =
                        method.id === PAYMENT_TYPES.MOBILE_MONEY;

                      return (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`relative group cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 transform hover:scale-[1.02] ${
                            isSelected
                              ? isDarkMode
                                ? "border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20"
                                : "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20"
                              : isDarkMode
                              ? "border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700/50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {/* Indicateur de sélection */}
                          {isSelected && (
                            <div
                              key="selection-indicator"
                              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}

                          <div className="flex items-center">
                            {/* Icône avec fond décoratif */}
                            <div
                              className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                                isWallet
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : isCreditCard
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : isMobileMoney
                                  ? "bg-orange-100 dark:bg-orange-900/30"
                                  : "bg-gray-100 dark:bg-gray-900/30"
                              }`}
                            >
                              {Icon && (
                                <Icon
                                  key="method-icon"
                                  className={`h-6 w-6 ${
                                    isWallet
                                      ? "text-green-600 dark:text-green-400"
                                      : isCreditCard
                                      ? "text-blue-600 dark:text-blue-400"
                                      : isMobileMoney
                                      ? "text-orange-600 dark:text-orange-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="subtitle1"
                                  className={`font-semibold text-sm sm:text-base truncate ${
                                    isSelected
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-gray-900 dark:text-gray-100"
                                  }`}
                                >
                                  {method.name}
                                </Typography>

                                {isWallet && (
                                  <div
                                    key="wallet-badge"
                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                      isDarkMode
                                        ? "bg-green-900/50 text-green-300"
                                        : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {walletBalance}{" "}
                                    {selectedCurrency === "USD" ? "$" : "FC"}
                                  </div>
                                )}
                              </div>

                              {/* Description et logos */}
                              <div className="mt-2">
                                {isWallet && (
                                  <Typography
                                    key="wallet-description"
                                    variant="body2"
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                  >
                                    Paiement instantané avec votre solde SOLIFIN
                                  </Typography>
                                )}

                                {isCreditCard && (
                                  <div
                                    key="credit-card-info"
                                    className="flex items-center gap-2"
                                  >
                                    <Typography
                                      variant="body2"
                                      className="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                      Cartes acceptées :
                                    </Typography>
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={visaIcon}
                                        alt="Visa"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={mastercardIcon}
                                        alt="Mastercard"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={amexIcon}
                                        alt="American Express"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                    </div>
                                  </div>
                                )}

                                {isMobileMoney && (
                                  <div
                                    key="mobile-money-info"
                                    className="flex items-center gap-2"
                                  >
                                    <Typography
                                      variant="body2"
                                      className="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                      Services mobiles :
                                    </Typography>
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={orangeIcon}
                                        alt="Orange Money"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={airtelIcon}
                                        alt="Airtel Money"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={mpesaIcon}
                                        alt="M-Pesa"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={mtnIcon}
                                        alt="MTN Mobile Money"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={moovIcon}
                                        alt="Moov Money"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                      <img
                                        src={africellIcon}
                                        alt="Afrimoney"
                                        className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Champs de paiement */}
                <div
                  className="mt-4 fade-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  {renderPaymentFields()}
                </div>

                {!isRenewal && (
                  /* Section code de parrainage */
                  <div className="slide-in" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CreditScoreIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        className="text-gray-600 dark:text-gray-300 text-sm sm:text-base"
                      >
                        Code de parrainage{" "}
                        <span className="text-red-500">*</span>
                      </Typography>
                    </div>
                    <TextField
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="Entrez le code"
                      required
                      disabled={noSponsorCode}
                      error={
                        !referralCode && formFields.cardNumber && !noSponsorCode
                      }
                      helperText={
                        !referralCode && formFields.cardNumber && !noSponsorCode
                          ? "Le code de parrainage est obligatoire"
                          : ""
                      }
                      className="text-sm"
                    />

                    <div className="mt-2">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={noSponsorCode}
                            onChange={(e) => {
                              setNoSponsorCode(e.target.checked);
                              if (e.target.checked) {
                                handleAssignSponsorCode();
                              } else {
                                setReferralCode("");
                              }
                            }}
                            disabled={localLoading}
                            size="small"
                            sx={{
                              color: "#2E7D32",
                              "&.Mui-checked": {
                                color: "#2E7D32",
                              },
                            }}
                          />
                        }
                        label={
                          <span
                            className={`text-xs sm:text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {localLoading
                              ? "Assignation d'un code..."
                              : "Je n'ai pas de code parrain"}
                          </span>
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Section durée et montant */}
                <div
                  className="summary-card mt-4 sm:mt-6 mb-4 sm:mb-6 fade-in p-3 sm:p-4 rounded-xl"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BanknotesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400" />
                    <Typography
                      variant="subtitle1"
                      className="font-bold text-primary-600 dark:text-primary-400 text-sm sm:text-base"
                    >
                      Détails de l'abonnement
                    </Typography>
                  </div>

                  <div className="space-y-8">
                    {/* Section Durée de souscription */}
                    <div>
                      <div className="flex items-center mb-3">
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <Typography
                          variant="subtitle2"
                          className="text-gray-700 dark:text-gray-300 text-sm font-semibold"
                        >
                          Durée de souscription
                        </Typography>
                      </div>
                      <TextField
                        type="number"
                        value={months}
                        onChange={(e) => {
                          // Déterminer le pas en fonction du type d'abonnement
                          const step = getSubscriptionStep(pack.abonnement);
                          // S'assurer que la valeur est un multiple du pas
                          const newValue = parseInt(e.target.value) || step;
                          const adjustedValue = Math.max(
                            step,
                            Math.round(newValue / step) * step
                          );
                          setMonths(adjustedValue);
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment
                              position="start"
                              className="text-gray-500 dark:text-gray-400"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment
                              position="end"
                              className="text-blue-600 dark:text-blue-400 font-medium text-sm"
                            >
                              mois
                            </InputAdornment>
                          ),
                          className: "bg-white dark:bg-gray-800 rounded-lg",
                        }}
                        inputProps={{
                          min: getSubscriptionStep(pack.abonnement),
                          step: getSubscriptionStep(pack.abonnement),
                          max: 24,
                        }}
                        fullWidth
                        size="medium"
                        className="text-sm"
                        placeholder="Durée en mois"
                      />
                      {pack?.abonnement && (
                        <Typography
                          variant="body2"
                          className="text-xs text-gray-500 dark:text-gray-400 mt-2"
                        >
                          Pas d'abonnement :{" "}
                          {getSubscriptionStep(pack.abonnement)} mois minimum
                        </Typography>
                      )}
                    </div>

                    {/* Section Récapitulatif du paiement */}
                    <div
                      className={`p-4 rounded-xl shadow-md border ${
                        isDarkMode
                          ? "bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600"
                          : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
                      }`}
                    >
                      {/* En-tête avec icône */}
                      <div className="flex items-center mb-4">
                        <div
                          className={`p-2 rounded-full ${
                            isDarkMode
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <Typography
                            variant="subtitle1"
                            className="font-semibold text-gray-800 dark:text-gray-100 text-sm"
                          >
                            Récapitulatif du paiement
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-gray-500 dark:text-gray-400 text-xs"
                          >
                            {selectedCurrency === "USD"
                              ? "Tarification en dollars américains"
                              : "Tarification en francs congolais"}
                          </Typography>
                        </div>
                      </div>

                      {/* Montant de base avec design amélioré */}
                      <div className="mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <Typography
                              variant="body2"
                              className="text-gray-600 dark:text-gray-400 text-xs font-medium"
                            >
                              Montant de base
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-xs text-gray-500 dark:text-gray-500 mt-0.5"
                            >
                              {pack?.abonnement && (
                                <>
                                  Prix par période (
                                  {getSubscriptionStep(pack.abonnement)} mois)
                                </>
                              )}
                            </Typography>
                          </div>
                          <div className="text-right">
                            <Typography
                              variant="subtitle1"
                              className="font-semibold text-gray-800 dark:text-gray-100 text-sm"
                            >
                              {totalAmount.toFixed(2)}{" "}
                              <span className="text-xs font-normal">
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </Typography>
                          </div>
                        </div>
                      </div>

                      {/* Prix du pack dans la devise sélectionnée */}
                      {selectedPaymentOption && (
                        <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <svg
                                className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <div>
                                <Typography
                                  variant="body2"
                                  className="text-amber-800 dark:text-amber-200 text-xs font-medium"
                                >
                                  Prix du pack
                                </Typography>
                                <Typography
                                  variant="caption"
                                  className="text-xs text-amber-600 dark:text-amber-400"
                                >
                                  {selectedCurrency === "USD"
                                    ? pack.price
                                    : pack.cdf_price}{" "}
                                  {selectedCurrency === "USD" ? "$" : "FC"}
                                </Typography>
                              </div>
                            </div>
                            <Typography
                              variant="subtitle1"
                              className="font-semibold text-amber-800 dark:text-amber-200 text-sm"
                            >
                              {selectedCurrency === "USD"
                                ? pack.price
                                : pack.cdf_price}{" "}
                              <span className="text-xs font-normal">
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </Typography>
                          </div>
                        </div>
                      )}

                      {/* Section d'information sur le prix */}
                      {selectedPaymentOption && (
                        <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <svg
                                className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <div>
                                <Typography
                                  variant="body2"
                                  className="text-amber-800 dark:text-amber-200 text-xs font-medium"
                                >
                                  Informations sur le prix
                                </Typography>
                                <Typography
                                  variant="caption"
                                  className="text-xs text-amber-600 dark:text-amber-400"
                                >
                                  {selectedCurrency === "USD"
                                    ? pack.price
                                    : pack.cdf_price}{" "}
                                  <span className="text-xs font-normal">
                                    {selectedCurrency === "USD" ? "$" : "FC"}
                                  </span>
                                </Typography>
                              </div>
                            </div>
                            <Typography
                              variant="subtitle1"
                              className="font-semibold text-amber-800 dark:text-amber-200 text-sm"
                            >
                              {selectedCurrency === "USD"
                                ? pack.price
                                : pack.cdf_price}{" "}
                              <span className="text-xs font-normal">
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </Typography>
                          </div>
                        </div>
                      )}

                      {/* Frais avec design amélioré */}
                      {selectedPaymentOption && (
                        <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <svg
                                className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <div>
                                <Typography
                                  variant="body2"
                                  className="text-amber-800 dark:text-amber-200 text-xs font-medium"
                                >
                                  Frais de transaction
                                </Typography>
                                {feePercentage !== null && (
                                  <Typography
                                    variant="caption"
                                    className="text-xs text-amber-600 dark:text-amber-400"
                                  >
                                    {feePercentage.toFixed(1)}% du montant
                                  </Typography>
                                )}
                              </div>
                            </div>
                            <Typography
                              variant="subtitle1"
                              className="font-semibold text-amber-800 dark:text-amber-200 text-sm"
                            >
                              {transactionFees !== null
                                ? transactionFees.toFixed(2)
                                : "0.00"}{" "}
                              <span className="text-xs font-normal">
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </Typography>
                          </div>
                        </div>
                      )}

                      {/* Total avec design striking */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                          <div>
                            <Typography
                              variant="subtitle1"
                              className="font-bold text-gray-800 dark:text-gray-100 text-sm"
                            >
                              Total à payer
                            </Typography>
                            <Typography
                              variant="caption"
                              className="text-xs text-gray-500 dark:text-gray-500 mt-0.5"
                            >
                              Incluant tous les frais applicables
                            </Typography>
                          </div>
                          <div className="flex items-center">
                            {feesError ? (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={fetchTransferFees}
                                className="mr-2"
                                title="Recalculer les frais"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
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
                                size={16}
                                className="mr-2 text-blue-600"
                              />
                            ) : null}
                            <div className="text-right">
                              <Typography
                                variant="h6"
                                className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-lg"
                              >
                                {(totalAmount + (transactionFees || 0)).toFixed(
                                  2
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="font-medium text-gray-600 dark:text-gray-400 text-xs"
                              >
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de paiement - en dehors de la zone scrollable */}
                <div className="modal-footer p-4 sm:p-6 pt-3 sm:pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="text-xs sm:text-sm"
                    >
                      {paymentMethod === PAYMENT_TYPES.WALLET
                        ? "Paiement direct depuis votre wallet"
                        : "Procédez au paiement sécurisé"}
                    </Typography>

                    {/* Alerte pour solde insuffisant */}
                    {paymentMethod === PAYMENT_TYPES.WALLET &&
                      totalAmount + (transactionFees || 0) > walletBalance && (
                        <Alert
                          severity="error"
                          className="mt-2 mb-0 rounded-lg text-xs"
                        >
                          Solde insuffisant. Besoin de{" "}
                          {(totalAmount + (transactionFees || 0)).toFixed(2)}{" "}
                          {selectedCurrency} mais votre solde est de{" "}
                          {walletBalance.toFixed(2)} {selectedCurrency}.
                        </Alert>
                      )}
                  </div>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      !selectedCurrency ||
                      !formIsValid ||
                      loading ||
                      loadingBalance ||
                      loadingFees ||
                      feesError ||
                      (!isRenewal && !referralCode && !noSponsorCode) ||
                      (paymentMethod === PAYMENT_TYPES.WALLET &&
                        totalAmount + (transactionFees || 0) > walletBalance)
                    }
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                    startIcon={
                      feesError ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      ) : loading ? (
                        <CircularProgress size={16} className="sm:hidden" />
                      ) : (
                        <CreditScoreIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )
                    }
                  >
                    {loading ? (
                      <span className="hidden sm:inline">Chargement...</span>
                    ) : paymentMethod === PAYMENT_TYPES.WALLET ? (
                      <span className="text-sm sm:text-base">
                        {isRenewal
                          ? "Renouveler maintenant"
                          : "Payer maintenant"}
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base">
                        {isRenewal
                          ? "Procéder au renouvellement"
                          : "Procéder au paiement"}
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
