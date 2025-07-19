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
  Dialog,
  Avatar,
  Autocomplete,
} from "@mui/material";
import {
  XMarkIcon,
  CreditCardIcon,
  PhoneIcon,
  WalletIcon,
  BanknotesIcon,
  ArrowPathIcon,
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
import axios from "../utils/axios";
import Notification from "./Notification";
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from "../config";
import { countries } from "../data/countries";

// Import des icônes pour les options de paiement
import airtelIcon from "../assets/icons-mobil-money/airtel.png";
import mtnIcon from "../assets/icons-mobil-money/mtn.png";
import moovIcon from "../assets/icons-mobil-money/moov.png";
import africellIcon from "../assets/icons-mobil-money/afrimoney.png";
import mpesaIcon from "../assets/icons-mobil-money/mpesa.png";
import orangeIcon from "../assets/icons-mobil-money/orange.png";
import visaIcon from "../assets/icons-mobil-money/visa.png";
import mastercardIcon from "../assets/icons-mobil-money/mastercard.png";
import amexIcon from "../assets/icons-mobil-money/americanexpress.png";

// Mapping des méthodes de paiement avec leurs icônes
const paymentMethodsMap = {
  [PAYMENT_TYPES.MOBILE_MONEY]: {
    name: "Mobile Money",
    icon: PhoneIcon,
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
    name: "Carte de crédit",
    icon: CreditCardIcon,
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
    name: "Portefeuille",
    icon: WalletIcon,
  },
};

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
};

// Transformation des méthodes de paiement pour l'interface utilisateur
const paymentMethods = [
  {
    id: PAYMENT_TYPES.WALLET,
    name: "Mon Wallet",
    icon: <WalletIcon2 sx={{ color: "#3B82F6" }} />,
    heroIcon: <WalletIcon className="h-5 w-5 text-blue-500" />,
    color: "#3B82F6", // Bleu
    category: "direct",
    options: PAYMENT_METHODS[PAYMENT_TYPES.WALLET],
  },
  {
    id: PAYMENT_TYPES.CREDIT_CARD,
    name: "Carte de crédit",
    icon: <CreditCardIcon2 sx={{ color: "#8B5CF6" }} />,
    heroIcon: <CreditCardIcon className="h-5 w-5 text-purple-500" />,
    color: "#8B5CF6", // Violet
    category: "card",
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD].map((option) => ({
      ...option,
      icon:
        option.id === "visa" ? (
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/800px-Visa_Inc._logo.svg.png"
            alt="Visa"
            variant="square"
            sx={{ width: 40, height: 24, bgcolor: "transparent" }}
          />
        ) : option.id === "mastercard" ? (
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/800px-Mastercard-logo.svg.png"
            alt="Mastercard"
            variant="square"
            sx={{ width: 40, height: 24, bgcolor: "transparent" }}
          />
        ) : (
          <CreditScoreIcon sx={{ color: "#8B5CF6" }} />
        ),
    })),
    fields: paymentMethodFields[PAYMENT_TYPES.CREDIT_CARD],
  },
  {
    id: PAYMENT_TYPES.MOBILE_MONEY,
    name: "Mobile Money",
    icon: <PhoneIcon2 sx={{ color: "#10B981" }} />,
    heroIcon: <PhoneIcon className="h-5 w-5 text-green-500" />,
    color: "#10B981", // Vert
    category: "mobile",
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY].map((option) => ({
      ...option,
      icon:
        option.id === "m-pesa" ? (
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/M-PESA_LOGO-01.svg/320px-M-PESA_LOGO-01.svg.png"
            alt="M-Pesa"
            sx={{ width: 24, height: 24 }}
          />
        ) : option.id === "orange-money" ? (
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/fr/thumb/8/83/Orange_Money.svg/320px-Orange_Money.svg.png"
            alt="Orange Money"
            sx={{ width: 24, height: 24 }}
          />
        ) : option.id === "airtel-money" ? (
          <Avatar
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Airtel_logo.svg/320px-Airtel_logo.svg.png"
            alt="Airtel Money"
            sx={{ width: 24, height: 24, bgcolor: "#ff0000" }}
          />
        ) : (
          <PhoneIcon2 sx={{ color: "#10B981" }} />
        ),
    })),
    fields: paymentMethodFields[PAYMENT_TYPES.MOBILE_MONEY],
  },
];

// Fonction pour déterminer le pas de durée en fonction du type d'abonnement
const getSubscriptionStep = (subscriptionType) => {
  switch (subscriptionType?.toLowerCase()) {
    case "monthly":
    case "mensuel":
      return 1;
    case "quarterly":
    case "trimestriel":
      return 3;
    case "semi-annual":
    case "semestriel":
      return 6;
    case "annual":
    case "annuel":
      return 12;
    case "triennal":
      return 36;
    case "quinquennal":
      return 60;
    default:
      return 1;
  }
};

export default function RenewPackForm({ open, onClose, pack, onSubmit }) {
  const { isDarkMode } = useTheme();
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_TYPES.WALLET);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("");
  const [selectedCardOption, setSelectedCardOption] = useState("");
  const [selectedMobileOption, setSelectedMobileOption] = useState("");
  const [formFields, setFormFields] = useState({});
  const [months, setMonths] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currentCurrency, setCurrentCurrency] = useState("USD"); // Variable pour suivre la devise actuelle du montant
  const [unitPriceConverted, setUnitPriceConverted] = useState(0); // Prix unitaire converti (prix par mois)
  const [transactionFees, setTransactionFees] = useState(0);
  const [feePercentage, setFeePercentage] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [formIsValid, setFormIsValid] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+243"); // Indicatif par défaut
  const [localLoading, setLocalLoading] = useState(false);
  const [loading, setLoading] = useState(false); // État pour le chargement global

  // Fonction pour rendre une option de paiement avec son icône
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
      // Icônes spécifiques pour le mobile money
      let icon = <PhoneIcon className="h-5 w-5 text-orange-500" />;

      return (
        <div className="flex items-center gap-2">
          {icon}
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

  useEffect(() => {
    if (pack) {
      const step = getSubscriptionStep(pack.pack.abonnement);
      const basePrice = getPackPrice();
      const initialAmount = basePrice * step;

      setMonths(step);
      setTotalAmount(initialAmount);
    }
  }, [pack]);

  // Fonction utilitaire pour obtenir le prix du pack de façon robuste
  const getPackPrice = () => {
    if (!pack) return 0;
    if (typeof pack.pack?.price === "number") return pack.pack.price;
    if (typeof pack.pack?.price === "string")
      return Number(pack.pack.price) || 0;
    return 0;
  };

  useEffect(() => {
    if (pack) {
      // Récupérer le pas d'abonnement (fréquence)
      const step = getSubscriptionStep(pack.pack.abonnement);

      // Le prix du pack est le prix pour une période complète (pas)
      // Par exemple, pour un pack annuel à 20$, c'est 20$ pour 12 mois
      // Si l'utilisateur choisit plusieurs périodes, il faut multiplier le prix

      // Calculer le nombre de périodes d'abonnement
      const periods = Math.ceil(months / step);

      // Le montant total est le prix du pack multiplié par le nombre de périodes
      const basePrice = getPackPrice();
      const totalAmountUSD = basePrice * periods;
      console.log(
        `Montant total: ${basePrice}$ x ${periods} périodes = ${totalAmountUSD}$ (${months} mois / pas de ${step} mois)`
      );
      setTotalAmount(totalAmountUSD);

      // Si on est en USD ou en mode wallet, pas besoin de conversion spéciale
      if (currentCurrency === "USD" || paymentMethod === PAYMENT_TYPES.WALLET) {
        setConvertedAmount(totalAmountUSD);
      }
      // Si on a déjà un prix unitaire converti, l'utiliser pour calculer le montant total
      // Le prix unitaire converti est le prix pour une période complète
      else if (unitPriceConverted > 0) {
        // Calculer le nombre de périodes d'abonnement
        const periods = Math.ceil(months / step);

        // Le montant converti est le prix unitaire multiplié par le nombre de périodes
        const newConvertedAmount = unitPriceConverted * periods;
        console.log(
          `Calcul avec prix unitaire converti: ${unitPriceConverted} ${selectedCurrency} x ${periods} périodes = ${newConvertedAmount} ${selectedCurrency}`
        );
        setConvertedAmount(newConvertedAmount);
      }
      // Sinon, on laisse convertCurrency s'en occuper
    }
  }, [pack, months, currentCurrency, paymentMethod, unitPriceConverted]);

  // État pour stocker les frais récupérés à l'ouverture du modal
  const [initialFees, setInitialFees] = useState({
    percentage: 0,
    fee: 0,
    loaded: false,
  });

  // Récupérer le solde du wallet et les frais initiaux à l'ouverture du modal
  useEffect(() => {
    if (open) {
      // Récupérer le solde du wallet
      fetchWalletBalance();

      // Récupérer les frais initiaux une seule fois à l'ouverture
      if (!initialFees.loaded) {
        fetchInitialFees();
      }
    }
  }, [open]);

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

        // Après avoir récupéré le pourcentage, initialiser la conversion de devise
        if (paymentMethod !== PAYMENT_TYPES.WALLET) {
          convertCurrency(percentage);
        } else {
          // Pour le wallet, calculer directement les frais (qui seront à 0)
          calculateFees();
        }

        return percentage;
      } else {
        setFeePercentage(0);
        setInitialFees({
          percentage: 0,
          fee: 0,
          loaded: true,
        });
        setFeesError(true);

        if (paymentMethod !== PAYMENT_TYPES.WALLET) {
          convertCurrency(0);
        } else {
          calculateFees();
        }

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

      if (paymentMethod !== PAYMENT_TYPES.WALLET) {
        convertCurrency(0);
      } else {
        calculateFees();
      }

      return 0;
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    // Initialiser la durée en fonction du type d'abonnement du pack
    if (pack && pack.pack.abonnement) {
      const step = getSubscriptionStep(pack.pack.abonnement);
      setMonths(step);
    }
  }, [pack]);

  // Effet pour initialiser les données lorsque le modal s'ouvre
  useEffect(() => {
    if (open && pack) {
      setTotalAmount(getPackPrice() * months);

      // Récupérer le pourcentage de frais global une seule fois à l'ouverture du modal
      if (!initialFees.loaded) {
        fetchInitialFees();
      }
    }
  }, [open, pack]);

  // Effet pour déclencher la conversion de devise lorsque le montant total, la devise ou la méthode de paiement change
  useEffect(() => {
    if (pack && totalAmount > 0 && !localLoading && open) {
      // Pour les méthodes autres que wallet, convertir la devise
      if (paymentMethod !== PAYMENT_TYPES.WALLET) {
        convertCurrency();
      } else {
        // Pour le wallet, utiliser directement le montant en USD
        setConvertedAmount(totalAmount);
        calculateFees();
      }
    }
  }, [totalAmount, selectedCurrency, paymentMethod, open]);

  useEffect(() => {
    // Réinitialiser les champs du formulaire et les options lors du changement de méthode
    setFormFields({});
    setSelectedMobileOption("");
    setSelectedCardOption("");
    setSelectedPaymentOption("");
    setFeesError(false);

    // Pour le wallet, définir automatiquement l'option solifin-wallet
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      setSelectedPaymentOption("solifin-wallet");
      // Déclencher immédiatement le calcul des frais pour le wallet
      setTimeout(() => {
        calculateFees();
      }, 0);
    }
  }, [paymentMethod]);

  useEffect(() => {
    // Calculer le montant total en fonction du nombre de mois
    if (pack) {
      const basePrice = getPackPrice();
      const newTotal = basePrice * months;

      setTotalAmount(newTotal);

      // Recalculer les frais si nécessaire
      if (initialFees.loaded) {
        // Pour le wallet, recalculer directement les frais (qui seront à 0)
        if (paymentMethod === PAYMENT_TYPES.WALLET) {
          setTimeout(() => {
            calculateFees();
          }, 0);
        }
        // Pour les autres méthodes, la conversion et le calcul des frais seront déclenchés
        // par le useEffect qui surveille totalAmount
      }
    }
  }, [pack, months, paymentMethod]);

  useEffect(() => {
    validateForm();
  }, [
    paymentMethod,
    formFields,
    selectedMobileOption,
    selectedCardOption,
    months,
    totalAmount,
  ]);

  useEffect(() => {
    validateForm();
  }, [
    paymentMethod,
    formFields,
    selectedPaymentOption,
    months,
    totalAmount,
    feesError,
  ]);

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
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du solde:", error);
      setWalletBalance(0);
    }
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

  const convertCurrency = async (globalFeePercentage = null) => {
    setLoading(true); // Désactive le bouton de soumission pendant la conversion
    // Pour le wallet, pas besoin de conversion ni de frais
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Pour le wallet, pas besoin de conversion mais il faut calculer le montant correct
      // en tenant compte de la fréquence du pack
      const step = getSubscriptionStep(pack.pack.abonnement);
      const periods = Math.ceil(months / step);

      // Le montant converti est le prix du pack multiplié par le nombre de périodes
      const walletAmount = getPackPrice() * periods;
      setConvertedAmount(walletAmount);

      console.log("Montant pour wallet (convertCurrency):", {
        prix_pack: getPackPrice(),
        duree_mois: months,
        pas_abonnement: step,
        periodes: periods,
        montant_wallet: walletAmount,
      });

      setCurrentCurrency("USD"); // Réinitialiser à USD pour le wallet
      setUnitPriceConverted(0); // Réinitialiser le prix unitaire converti
      setTransactionFees(0);
      return;
    }

    setLocalLoading(true);
    let convertedAmt = totalAmount;

    try {
      // Vérifier que le montant total est valide
      if (totalAmount <= 0) {
        console.error(
          "Montant total invalide pour la conversion:",
          totalAmount
        );
        setConvertedAmount(0);
        setTransactionFees(0);
        setLocalLoading(false);
        return;
      }

      // Si la devise sélectionnée est la même que la devise actuelle du montant, pas besoin de conversion
      if (selectedCurrency === currentCurrency) {
        console.log(
          "Pas de conversion nécessaire, devise inchangée:",
          selectedCurrency
        );
        convertedAmt = convertedAmount || totalAmount;
      }
      // Si la devise est USD et que le montant est en USD, pas besoin de conversion
      else if (selectedCurrency === "USD" && currentCurrency === "USD") {
        convertedAmt = totalAmount;
        setConvertedAmount(totalAmount);
        // Réinitialiser le prix unitaire converti pour USD
        const basePrice = getPackPrice();
        setUnitPriceConverted(basePrice);
      }
      // Si on change de devise, conversion nécessaire
      else {
        console.log(
          `Conversion de ${currentCurrency} vers ${selectedCurrency}`
        );

        // Toujours passer par USD comme devise pivot pour assurer la cohérence
        let amountToConvert;

        // Si la devise actuelle n'est pas USD et la devise cible n'est pas USD,
        // on passe par USD comme devise pivot
        if (currentCurrency !== "USD" && selectedCurrency !== "USD") {
          console.log(
            `Conversion via USD: ${currentCurrency} -> USD -> ${selectedCurrency}`
          );

          // Étape 1: Convertir de la devise actuelle vers USD
          const responseToUSD = await axios.post("/api/currency/convert", {
            amount: convertedAmount,
            from: currentCurrency,
            to: "USD",
          });

          if (!responseToUSD.data.success) {
            console.error(
              `Échec de conversion de ${currentCurrency} vers USD:`,
              responseToUSD.data.message
            );
            throw new Error(
              `Échec de conversion de ${currentCurrency} vers USD`
            );
          }

          const usdAmount = responseToUSD.data.convertedAmount;
          console.log(`Montant intermédiaire en USD: ${usdAmount}`);

          // Étape 2: Convertir de USD vers la devise cible
          const responseFromUSD = await axios.post("/api/currency/convert", {
            amount: usdAmount,
            from: "USD",
            to: selectedCurrency,
          });

          if (!responseFromUSD.data.success) {
            console.error(
              `Échec de conversion de USD vers ${selectedCurrency}:`,
              responseFromUSD.data.message
            );
            throw new Error(
              `Échec de conversion de USD vers ${selectedCurrency}`
            );
          }

          convertedAmt = responseFromUSD.data.convertedAmount;
          console.log(
            `Montant final converti: ${convertedAmt} ${selectedCurrency}`
          );
        } else {
          // Conversion directe (une des devises est USD)
          const from = currentCurrency;
          const to = selectedCurrency;
          amountToConvert =
            currentCurrency === "USD" ? totalAmount : convertedAmount;

          console.log(
            `Conversion directe: ${amountToConvert} ${from} -> ${to}`
          );
          const response = await axios.post("/api/currency/convert", {
            amount: amountToConvert,
            from: from,
            to: to,
          });

          if (!response.data.success) {
            console.error(
              `Échec de conversion de ${from} vers ${to}:`,
              response.data.message
            );
            throw new Error(`Échec de conversion de ${from} vers ${to}`);
          }

          convertedAmt = response.data.convertedAmount;
          console.log(`Montant converti: ${convertedAmt} ${to}`);
        }

        // Mettre à jour le montant converti
        setConvertedAmount(convertedAmt);

        // Calculer le prix unitaire converti (prix pour une période)
        if (pack && months > 0) {
          const step = getSubscriptionStep(pack.pack.abonnement);
          // Calculer le nombre de périodes d'abonnement
          const periods = Math.ceil(months / step);

          // Le prix unitaire est le montant converti divisé par le nombre de périodes
          const unitPrice = convertedAmt / periods;
          console.log(
            `Prix unitaire converti: ${unitPrice} ${selectedCurrency} par période de ${step} mois (${convertedAmt} ${selectedCurrency} / ${periods} périodes)`
          );
          setUnitPriceConverted(unitPrice);
        }

        // Mettre à jour la devise actuelle du montant
        setCurrentCurrency(selectedCurrency);
      }

      // Utiliser le pourcentage de frais récupéré par fetchInitialFees
      // Priorité: 1. globalFeePercentage (paramètre), 2. initialFees.percentage, 3. feePercentage (état)
      let percentage = 0;

      if (globalFeePercentage !== null) {
        percentage = globalFeePercentage;
      } else if (initialFees.loaded) {
        percentage = initialFees.percentage;
      } else {
        percentage = feePercentage;
      }

      if (percentage > 0 && convertedAmt > 0) {
        const fee = convertedAmt * (percentage / 100);
        // Limiter à deux chiffres après la virgule
        const roundedFee = parseFloat(fee.toFixed(2));
        setTransactionFees(roundedFee);
        // Mettre à jour feePercentage pour la cohérence
        setFeePercentage(percentage);
      } else {
        setTransactionFees(0);
      }
    } catch (error) {
      console.error("Erreur lors de la conversion:", error);
      setConvertedAmount(totalAmount);
      setTransactionFees(0);
    } finally {
      setLocalLoading(false);
      setLoading(false); // Réactive le bouton de soumission après la conversion
    }
  };

  const calculateFees = async () => {
    setLoadingFees(true);
    setFeesError(false);

    try {
      // Déterminer le montant à utiliser pour le calcul des frais
      const amount =
        paymentMethod === PAYMENT_TYPES.WALLET ? totalAmount : convertedAmount;

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
      console.error("Erreur lors du calcul des frais:", error);
      setFeesError(true);
      setTransactionFees(0);
      setFeePercentage(0);
    } finally {
      setLoadingFees(false);
    }
  };

  // Cette fonction a été remplacée par la nouvelle version de convertCurrency ci-dessus

  // Vérifier si le formulaire est valide
  const validateForm = () => {
    let isValid = true;

    // Vérifier les champs selon la méthode de paiement
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Pour le wallet, vérifier que le solde est suffisant
      const totalWithFees = totalAmount + (transactionFees || 0);
      isValid = isValid && walletBalance >= totalWithFees;
    } else if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      // Vérifier que l'option de carte est sélectionnée
      isValid = isValid && selectedCardOption !== "";

      // Vérifier que tous les champs requis sont remplis
      isValid =
        isValid &&
        formFields.cardNumber &&
        formFields.cardNumber.trim() !== "" &&
        formFields.cardHolder &&
        formFields.cardHolder.trim() !== "" &&
        formFields.expiryDate &&
        formFields.expiryDate.trim() !== "" &&
        formFields.cvv &&
        formFields.cvv.trim() !== "";
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Vérifier que l'option mobile est sélectionnée
      isValid = isValid && selectedMobileOption !== "";

      // Vérifier que le numéro de téléphone est rempli
      isValid =
        isValid &&
        formFields.phoneNumber &&
        formFields.phoneNumber.trim() !== "" &&
        phoneCode &&
        phoneCode.trim() !== "";
    }

    // Vérifier que le montant est positif
    isValid = isValid && totalAmount > 0;

    // Vérifier qu'il n'y a pas d'erreur de calcul des frais
    isValid = isValid && !feesError;

    setFormIsValid(isValid);
    return isValid;
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

    try {
      // Déterminer la méthode spécifique de paiement
      let specificPaymentMethod = selectedPaymentOption;

      // Si aucune méthode spécifique n'est sélectionnée, utiliser une valeur par défaut selon le type
      if (!specificPaymentMethod) {
        if (paymentMethod === PAYMENT_TYPES.WALLET) {
          specificPaymentMethod = "solifin-wallet";
        } else if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
          specificPaymentMethod = "visa";
        } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
          specificPaymentMethod = "m-pesa";
        }
      }

      // Préparer les données de paiement
      let paymentDetails = { ...formFields };

      // Pour Mobile Money, ajouter l'indicatif téléphonique
      if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
        // Utiliser l'indicatif fixe 243 (sans le +) pour l'API
        const phoneCode = "243";

        // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
        const cleanPhoneNumber = formFields.phoneNumber.replace(/\D/g, "");

        // Créer le numéro complet sans le +
        const phoneWithCode = `${phoneCode}${cleanPhoneNumber}`;

        console.log("Numéro de téléphone formaté pour API:", phoneWithCode);

        paymentDetails = {
          ...paymentDetails,
          phoneCode: phoneCode,
          phoneNumber: phoneWithCode, // Numéro nettoyé sans indicatif
          fullPhoneNumber: phoneWithCode, // Numéro complet sans le +
        };
      }

      // Calculer le montant correct en fonction de la fréquence du pack
      const step = getSubscriptionStep(pack.pack.abonnement);
      const periods = Math.ceil(months / step);
      const correctAmount = getPackPrice() * periods;

      // Préparer les données à envoyer
      const paymentData = {
        payment_method: specificPaymentMethod, // Méthode spécifique (visa, mastercard, m-pesa, etc.)
        payment_type: paymentMethod, // Type générique (wallet, credit-card, mobile-money)
        payment_details: paymentDetails,
        duration_months: months,
        amount: convertedAmount, // Utiliser toujours le montant converti qui est correctement calculé
        currency:
          paymentMethod === PAYMENT_TYPES.WALLET ? "USD" : selectedCurrency,
        fees: transactionFees || 0,
        packId: pack?.pack_id,
        transaction_type: "renew_pack",
      };

      // Appel à l'API pour renouveler le pack
      const response = await axios.post(`/api/serdipay/payment`, paymentData);

      if (response.data.success) {
        // Message différent selon la méthode de paiement
        if (paymentMethod === PAYMENT_TYPES.WALLET) {
          // Pour le wallet Solifin, le paiement est traité immédiatement
          Notification.success("Pack renouvelé avec succès!");
          if (typeof onRenewSuccess === "function") onRenewSuccess();
          onClose();
        } else {
          // Pour SerdiPay, le paiement est seulement initié à ce stade
          Notification.success(
            "Paiement initié avec succès! Vous recevrez une notification dès que le paiement sera confirmé."
          );
          
          // Fermer le modal après 3 secondes pour permettre à l'utilisateur de continuer sa navigation
          setTimeout(() => {
            if (typeof onRenewSuccess === "function") onRenewSuccess();
            onClose();
          }, 3000);
        }
      } else {
        setError(
          response.data.message ||
            "Une erreur est survenue lors du renouvellement du pack"
        );
      }
    } catch (error) {
      console.error("Erreur lors du renouvellement du pack:", error);
      setError(
        error.response?.data?.message ||
          "Une erreur est survenue lors du renouvellement du pack"
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
            <div className="grid grid-cols-3 gap-3 mt-2">
              {selectedMethod.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    setSelectedMobileOption(option.id);
                    setSelectedPaymentOption(option.id);
                  }}
                  className={`border rounded-xl shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    selectedMobileOption === option.id
                      ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md transform -translate-y-1"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow"
                  }`}
                  style={{ height: "120px" }}
                >
                  <div
                    className="mb-3 flex flex-col items-center justify-center"
                    style={{
                      minHeight: "40px",
                    }}
                  >
                    {renderPaymentOptionWithIcon(
                      option,
                      PAYMENT_TYPES.MOBILE_MONEY
                    )}
                  </div>
                  <Radio
                    checked={selectedMobileOption === option.id}
                    size="small"
                    sx={{
                      padding: "2px",
                      "&.Mui-checked": { color: "#10B981" },
                    }}
                  />
                </div>
              ))}
            </div>
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
            <div className="grid grid-cols-3 gap-3 mt-2">
              {selectedMethod.options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    setSelectedCardOption(option.id);
                    setSelectedPaymentOption(option.id);
                  }}
                  className={`border rounded-xl shadow-sm p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    selectedCardOption === option.id
                      ? "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md transform -translate-y-1"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow"
                  }`}
                  style={{ height: "120px" }}
                >
                  <div
                    className="mb-3 flex flex-col items-center justify-center"
                    style={{
                      minHeight: "40px",
                    }}
                  >
                    {renderPaymentOptionWithIcon(
                      option,
                      PAYMENT_TYPES.CREDIT_CARD
                    )}
                  </div>
                  <Radio
                    checked={selectedCardOption === option.id}
                    size="small"
                    sx={{
                      padding: "2px",
                      "&.Mui-checked": { color: "#8B5CF6" },
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {(paymentMethod === PAYMENT_TYPES.WALLET ||
          (paymentMethod === PAYMENT_TYPES.CREDIT_CARD && selectedCardOption) ||
          (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY &&
            selectedMobileOption)) && (
          <div
            className={
              paymentMethod === PAYMENT_TYPES.CREDIT_CARD
                ? "grid grid-cols-2 gap-2"
                : ""
            }
          >
            {/* Champ téléphone avec indicatif fixe +243 pour Mobile Money */}
            {paymentMethod === PAYMENT_TYPES.MOBILE_MONEY &&
              selectedMobileOption && (
                <div className="mb-4">
                  {selectedMethod.fields
                    .filter((field) => field.name === "phoneNumber")
                    .map((field) => (
                      <TextField
                        key={field.name}
                        label={field.label}
                        type={field.type}
                        value={formFields[field.name] || ""}
                        onChange={(e) =>
                          handleFieldChange(field.name, e.target.value)
                        }
                        fullWidth
                        required={field.required}
                        size="small"
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
                        inputProps={{
                          maxLength: field.maxLength,
                          style: { paddingLeft: "4px" },
                        }}
                        helperText="Entrez votre numéro sans le code pays"
                      />
                    ))}
                </div>
              )}

            {/* Afficher les autres champs selon la méthode de paiement */}
            {selectedMethod.fields
              .filter(
                (field) =>
                  paymentMethod !== PAYMENT_TYPES.MOBILE_MONEY ||
                  field.name !== "phoneNumber"
              )
              .map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  value={formFields[field.name] || ""}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                  fullWidth
                  required={field.required}
                  size="small"
                  inputProps={{
                    maxLength: field.maxLength,
                    className: field.name === "cvv" ? "font-mono" : "",
                  }}
                  className={
                    field.name === "cardNumber" || field.name === "cardHolder"
                      ? "col-span-2"
                      : ""
                  }
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="renew-pack-dialog-title"
      disablePortal={false}
      keepMounted
      PaperProps={{
        sx: {
          backdropFilter: "blur(10px)",
          backgroundColor: isDarkMode
            ? "rgba(31,41,55,0.85)"
            : "rgba(255,255,255,0.85)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(3px)" },
      }}
    >
      <style>{customStyles}</style>
      <div
        className={`relative w-full max-w-2xl rounded-lg p-0 shadow-xl overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
        style={{
          overflow: "auto",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)", // pour Safari
        }}
      >
        {/* En-tête avec dégradé */}
        <div
          className={`p-6 ${
            isDarkMode
              ? "bg-gradient-to-r from-green-900 to-green-700"
              : "bg-gradient-to-r from-green-500 to-green-600"
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <Typography
              variant="h5"
              component="h2"
              className="font-bold"
              id="renew-pack-dialog-title"
            >
              Renouveler le {pack?.pack.name}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              className="text-white hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </IconButton>
          </div>
          <Typography variant="body2" className="mt-1 opacity-80">
            Complétez les informations ci-dessous pour finaliser votre
            renouvellement
          </Typography>
        </div>

        {error && (
          <Alert severity="error" className="mx-6 mt-4 mb-0">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-6 pt-4 custom-scrollbar">
            {/* Section méthode de paiement */}
            <div className="slide-in" style={{ animationDelay: "0.2s" }}>
              <Typography
                variant="subtitle1"
                className="font-bold mb-3 text-primary-600 dark:text-primary-400"
              >
                Méthode de paiement
              </Typography>

              <div className="grid grid-cols-3 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`method-card cursor-pointer rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                      paymentMethod === method.id
                        ? "border-2 shadow-md"
                        : "border border-gray-200 dark:border-gray-700"
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      borderColor:
                        paymentMethod === method.id ? method.color : undefined,
                      transform:
                        paymentMethod === method.id
                          ? "translateY(-2px)"
                          : "none",
                    }}
                  >
                    <div className="p-4 flex flex-col items-center text-center">
                      <div
                        className="mb-3 flex items-center justify-center"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          backgroundColor: `${method.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {method.icon}
                      </div>
                      <Typography
                        variant="subtitle2"
                        className="font-medium mb-1"
                      >
                        {method.name}
                      </Typography>
                      {method.id === PAYMENT_TYPES.WALLET && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          className="flex items-center justify-center"
                        >
                          <BanknotesIcon className="h-3 w-3 mr-1" />
                          Solde: {walletBalance} USD
                        </Typography>
                      )}
                      {method.id === PAYMENT_TYPES.CREDIT_CARD && (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                          <img
                            src={visaIcon}
                            alt="Visa"
                            className="h-4 w-6 object-contain"
                          />
                          <img
                            src={mastercardIcon}
                            alt="Mastercard"
                            className="h-4 w-6 object-contain"
                          />
                          <img
                            src={amexIcon}
                            alt="Amex"
                            className="h-4 w-6 object-contain"
                          />
                        </div>
                      )}
                      {method.id === PAYMENT_TYPES.MOBILE_MONEY && (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                          <img
                            src={orangeIcon}
                            alt="Orange"
                            className="h-4 w-4 object-contain"
                          />
                          <img
                            src={airtelIcon}
                            alt="Airtel"
                            className="h-4 w-4 object-contain"
                          />
                          <img
                            src={mpesaIcon}
                            alt="M-Pesa"
                            className="h-4 w-4 object-contain"
                          />
                          <img
                            src={africellIcon}
                            alt="Africa Money"
                            className="h-4 w-4 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Champs de paiement */}
            <div className="mt-4 fade-in" style={{ animationDelay: "0.3s" }}>
              {renderPaymentFields()}
            </div>

            {/* Section durée et montant */}
            <div
              className="summary-card mb-6 fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <Typography
                variant="subtitle1"
                className="font-bold mb-3 text-primary-600 dark:text-primary-400"
              >
                Détails de l'abonnement
              </Typography>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Durée de souscription
                  </Typography>
                  <TextField
                    type="number"
                    value={months}
                    onChange={(e) => {
                      if (!pack || !pack.pack.abonnement) {
                        setMonths(Math.max(1, parseInt(e.target.value) || 1));
                        return;
                      }

                      // Déterminer le pas en fonction du type d'abonnement
                      const step = getSubscriptionStep(pack.pack.abonnement);

                      // Obtenir la valeur saisie par l'utilisateur
                      let newValue = parseInt(e.target.value);

                      // Si la valeur n'est pas un nombre, utiliser le pas comme valeur par défaut
                      if (isNaN(newValue)) {
                        setMonths(step);
                        return;
                      }

                      // S'assurer que la valeur est au moins égale au pas minimum
                      newValue = Math.max(step, newValue);

                      // Ajuster la valeur pour qu'elle soit un multiple du pas
                      // Utiliser floor pour ne pas augmenter automatiquement la valeur
                      const adjustedValue = Math.floor(newValue / step) * step;

                      // Mettre à jour l'état avec la valeur ajustée
                      setMonths(adjustedValue);
                    }}
                    onBlur={() => {
                      if (!pack || !pack.pack.abonnement) return;

                      const step = getSubscriptionStep(pack.pack.abonnement);

                      // Si la valeur actuelle n'est pas un multiple du pas
                      if (months % step !== 0) {
                        // Arrondir au multiple supérieur du pas
                        setMonths(Math.ceil(months / step) * step);
                      }

                      // S'assurer que la valeur n'est pas inférieure au pas minimum
                      if (months < step) {
                        setMonths(step);
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">mois</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min:
                        pack && pack.pack.abonnement
                          ? getSubscriptionStep(pack.pack.abonnement)
                          : 1,
                      step:
                        pack && pack.pack.abonnement
                          ? getSubscriptionStep(pack.pack.abonnement)
                          : 1,
                    }}
                    fullWidth
                    size="small"
                  />
                </div>

                {(paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                  paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) && (
                  <div>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Devise
                    </Typography>
                    <TextField
                      select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      fullWidth
                      size="small"
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              bgcolor: isDarkMode ? "#1e283b" : "white",
                              color: isDarkMode ? "white" : "inherit",
                              "& .MuiMenuItem-root:hover": {
                                bgcolor: isDarkMode
                                  ? "rgba(255, 255, 255, 0.08)"
                                  : "rgba(0, 0, 0, 0.04)",
                              },
                            },
                          },
                        },
                      }}
                    >
                      {Object.keys(CURRENCIES).map((currencyCode) => (
                        <MenuItem key={currencyCode} value={currencyCode}>
                          {currencyCode} ({CURRENCIES[currencyCode].symbol}) -{" "}
                          {CURRENCIES[currencyCode].name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </div>
                )}
              </div>

              <div
                className={`mt-4 p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <Typography
                    variant="subtitle2"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Montant de base
                  </Typography>
                  <Typography variant="body2">
                    {paymentMethod === PAYMENT_TYPES.WALLET
                      ? totalAmount
                      : convertedAmount}{" "}
                    {paymentMethod === PAYMENT_TYPES.WALLET
                      ? CURRENCIES.USD.symbol
                      : CURRENCIES[selectedCurrency].symbol}
                  </Typography>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Typography
                    variant="subtitle2"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Frais ({(feePercentage || 0).toFixed(1)}%)
                  </Typography>
                  <Typography variant="body2">
                    {transactionFees || 0}{" "}
                    {paymentMethod === PAYMENT_TYPES.WALLET
                      ? CURRENCIES.USD.symbol
                      : CURRENCIES[selectedCurrency].symbol}
                  </Typography>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <Typography variant="subtitle1" className="font-bold">
                    Total
                  </Typography>
                  <div className="flex items-center">
                    {feesError ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={calculateFees}
                        className="mr-2"
                        title="Recalculer les frais"
                      >
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </IconButton>
                    ) : loadingFees ? (
                      <CircularProgress size={16} className="mr-2" />
                    ) : null}
                    <Typography
                      variant="subtitle1"
                      color="primary"
                      className="font-bold"
                    >
                      {(
                        (paymentMethod === PAYMENT_TYPES.WALLET
                          ? totalAmount
                          : convertedAmount) + (transactionFees || 0)
                      ).toFixed(2)}{" "}
                      {paymentMethod === PAYMENT_TYPES.WALLET
                        ? CURRENCIES.USD.symbol
                        : CURRENCIES[selectedCurrency].symbol}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton de paiement - en dehors de la zone scrollable */}
          <div className="p-6 pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <Typography variant="body2" color="textSecondary">
              {paymentMethod === PAYMENT_TYPES.WALLET
                ? "Paiement direct depuis votre wallet"
                : "Procédez au paiement sécurisé"}
            </Typography>

            {/* Alerte pour solde insuffisant */}
            {paymentMethod === PAYMENT_TYPES.WALLET &&
              totalAmount + (transactionFees || 0) > walletBalance && (
                <Alert
                  severity="error"
                  className="mb-3 absolute bottom-16 left-6 right-6"
                >
                  Solde insuffisant dans votre wallet. Vous avez besoin de{" "}
                  {(totalAmount + (transactionFees || 0)).toFixed(2)} USD mais
                  votre solde est de {walletBalance.toFixed(2)} USD.
                </Alert>
              )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !formIsValid || feesError || loadingFees}
              className={`${
                loading || !formIsValid || feesError || loadingFees
                  ? ""
                  : "pulse"
              }`}
              sx={{
                minWidth: 150,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : paymentMethod === PAYMENT_TYPES.WALLET ? (
                "Renouveler maintenant"
              ) : (
                "Procéder au renouvellement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
