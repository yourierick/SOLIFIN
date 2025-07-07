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
  Checkbox,
  InputLabel, // Import manquant ajouté
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
}) {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
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
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currentCurrency, setCurrentCurrency] = useState("USD"); // Variable pour suivre la devise actuelle du montant
  const [transactionFees, setTransactionFees] = useState(0);
  const [feePercentage, setFeePercentage] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0); // Montant total de l'achat
  const [walletBalance, setWalletBalance] = useState(0); // Solde du wallet
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [phoneCode, setPhoneCode] = useState("+243"); // Indicatif par défaut
  const [localLoading, setLocalLoading] = useState(false);
  const [noSponsorCode, setNoSponsorCode] = useState(false);
  const [openSponsorModal, setOpenSponsorModal] = useState(false); // État pour les codes parrains admin
  const [adminSponsorCodes, setAdminSponsorCodes] = useState([]);

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
    }
  }, [pack]);

  // Calcul du prix unitaire converti (prix par mois dans la devise sélectionnée)
  const [unitPriceConverted, setUnitPriceConverted] = useState(0);

  // Effet pour calculer le montant total en fonction du pack et de la durée
  useEffect(() => {
    if (pack) {
      // Récupérer le pas d'abonnement (fréquence)
      const step = getSubscriptionStep(pack.abonnement);

      // Le prix du pack est le prix pour une période complète (pas)
      // Par exemple, pour un pack annuel à 20$, c'est 20$ pour 12 mois
      // Si l'utilisateur choisit plusieurs périodes, il faut multiplier le prix

      // Calculer le nombre de périodes d'abonnement
      const periods = Math.ceil(months / step);

      // Le montant total est le prix du pack multiplié par le nombre de périodes
      const totalAmountUSD = pack.price * periods;
      console.log(
        `Montant total: ${pack.price}$ x ${periods} périodes = ${totalAmountUSD}$ (${months} mois / pas de ${step} mois)`
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

  // Récupérer le solde du wallet et les frais initiaux à l'ouverture du modal
  useEffect(() => {
    if (open) {
      // Récupérer le solde du wallet
      getUserWalletBalance();

      // Récupérer les frais initiaux une seule fois à l'ouverture
      if (!initialFees.loaded) {
        fetchInitialFees();
      }
    }
  }, [open]);

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

  // Fonction pour récupérer les codes parrains admin
  const fetchAdminSponsorCodes = async () => {
    try {
      setLocalLoading(true);
      const response = await axios.get("/api/admin-packs");
      if (response.data.success && Array.isArray(response.data.packs)) {
        // Vérifier et normaliser les données pour éviter les problèmes de rendu
        const normalizedCodes = response.data.packs.map((code) => ({
          id:
            code.id ||
            `id-${
              code.referral_code || Math.random().toString(36).substring(2, 11)
            }`,
          referral_code: code.referral_code || "",
          name: code.name || "Code administrateur",
        }));
        setAdminSponsorCodes(normalizedCodes);
      } else {
        setAdminSponsorCodes([]);
        Notification.error("Erreur lors de la récupération des codes parrains");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des codes parrains", error);
      Notification.error("Erreur lors de la récupération des codes parrains");
      setAdminSponsorCodes([]);
    } finally {
      setLocalLoading(false);
    }
  };

  // Fonction pour ouvrir le modal des codes parrains admin
  const handleOpenSponsorModal = () => {
    fetchAdminSponsorCodes();
    setOpenSponsorModal(true);
  };

  // Fonction pour sélectionner un code parrain admin
  const handleSelectSponsorCode = (code) => {
    setReferralCode(code);
    setOpenSponsorModal(false);
    setNoSponsorCode(false);
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
      // Récupérer le pas d'abonnement (fréquence)
      const step = getSubscriptionStep(pack.abonnement);

      // Calculer le nombre de périodes d'abonnement
      const periods = Math.ceil(months / step);

      // Le montant total est le prix du pack multiplié par le nombre de périodes
      const newTotal = pack.price * periods;
      setTotalAmount(newTotal);

      console.log("Calcul du montant total (effet secondaire):", {
        prix_pack: pack.price,
        duree_mois: months,
        pas_abonnement: step,
        periodes: periods,
        montant_total: newTotal,
      });

      // Mettre à jour les frais en fonction du type de paiement
      if (paymentMethod === PAYMENT_TYPES.WALLET) {
        // Pas de frais pour le wallet
        setTransactionFees(0);
      } else if (feePercentage > 0) {
        // Calculer les frais en fonction du pourcentage global
        const fees = (newTotal * feePercentage) / 100;
        setTransactionFees(fees);
      }
    }
  }, [pack, months, paymentMethod, feePercentage]);

  // Effet pour déclencher la conversion de devise lorsque le montant total, la devise ou la méthode de paiement change
  useEffect(() => {
    if (pack && totalAmount > 0 && !localLoading && open) {
      // Pour les méthodes autres que wallet, convertir la devise
      if (paymentMethod !== PAYMENT_TYPES.WALLET) {
        convertCurrency();
      } else {
        // Pour le wallet, utiliser directement le montant en USD
        // mais en tenant compte de la fréquence du pack
        const step = getSubscriptionStep(pack.abonnement);
        const periods = Math.ceil(months / step);

        // Le montant converti est le prix du pack multiplié par le nombre de périodes
        const walletAmount = pack.price * periods;
        setConvertedAmount(walletAmount);

        console.log("Montant pour wallet:", {
          prix_pack: pack.price,
          duree_mois: months,
          pas_abonnement: step,
          periodes: periods,
          montant_wallet: walletAmount,
        });

        calculateFees();
      }
    }
  }, [totalAmount, selectedCurrency, paymentMethod, open, months]);

  // La variable currentCurrency est déjà déclarée plus haut

  const convertCurrency = async (globalFeePercentage = null) => {
    setLoading(true); // Désactive le bouton de soumission pendant la conversion
    // Pour le wallet, pas besoin de conversion ni de frais
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Pour le wallet, pas besoin de conversion ni de frais
      setConvertedAmount(totalAmount);
      setCurrentCurrency("USD"); // Réinitialiser à USD pour le wallet
      setUnitPriceConverted(pack ? pack.price : 0);
      setTransactionFees(0);
      setLoading(false);
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
        setUnitPriceConverted(pack ? pack.price : 0);
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
          const step = getSubscriptionStep(pack.abonnement);
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

  const getUserWalletBalance = async () => {
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

  // Le getUserWalletBalance est déjà appelé dans un autre useEffect lors de l'ouverture du modal

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

    // Vérifier si le code de parrainage est renseigné ou si l'option "Je n'ai pas de code parrain" est cochée
    if (!referralCode && !noSponsorCode) {
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
        // Utiliser l'indicatif fixe +243 mais sans le + pour l'API
        const phoneCode = "243";
        const phoneWithCode = `${phoneCode}${formFields.phoneNumber}`;

        paymentDetails = {
          ...paymentDetails,
          phoneCode: phoneCode,
          phoneNumber: formFields.phoneNumber, // Garder le numéro sans indicatif
          fullPhoneNumber: phoneWithCode // Numéro complet sans le +
        };
      }

      // Calculer le montant correct en fonction de la fréquence du pack
      const step = getSubscriptionStep(pack.abonnement);
      const periods = Math.ceil(months / step);
      const correctAmount = pack.price * periods;

      console.log("Montant pour soumission:", {
        prix_pack: pack.price,
        duree_mois: months,
        pas_abonnement: step,
        periodes: periods,
        montant_calcule: correctAmount,
        montant_total_affiche: totalAmount,
        montant_converti: convertedAmount,
        methode_paiement: paymentMethod,
      });

      // Préparer les données à envoyer
      const paymentData = {
        payment_method: specificPaymentMethod, // Méthode spécifique (visa, mastercard, m-pesa, etc.)
        payment_type: paymentMethod, // Type générique (wallet, credit-card, mobile-money)
        payment_details: paymentDetails,
        duration_months: months,
        referralCode: noSponsorCode ? "ADMIN" : referralCode, // Code parrain spécifique à l'achat ou "ADMIN" si pas de code
        noSponsorCode: noSponsorCode, // Indiquer si l'utilisateur n'a pas de code parrain
        amount: convertedAmount, // Utiliser toujours le montant converti qui est correctement calculé
        currency:
          paymentMethod === PAYMENT_TYPES.WALLET ? "USD" : selectedCurrency,
        fees: transactionFees || 0,
        packId: pack?.id,
      };

      // Appel à l'API pour acheter le pack
      const response = await axios.post(
        "/api/packs/purchase_a_new_pack",
        paymentData
      );

      if (response.data.success) {
        if (typeof onPurchaseSuccess === "function") onPurchaseSuccess();
        Notification.success("Pack acheté avec succès!");
        onClose();
      } else {
        setError(
          response.data.message ||
            "Une erreur est survenue lors de l'achat du pack"
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'achat du pack:", error);
      setError(
        error.response?.data?.message ||
          "Une erreur est survenue lors de l'achat du pack"
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
                  '& .MuiOutlinedInput-root': {
                    paddingLeft: '0',
                  },
                  '& .MuiInputAdornment-root': {
                    marginRight: '0',
                  }
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
              Solde disponible: <strong>{walletBalance} USD</strong>
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <style>{customStyles}</style>
      <div
        className={`relative w-full max-w-2xl rounded-lg p-0 shadow-xl overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white"
        }`}
      >
        {/* En-tête avec dégradé */}
        <div
          className={`p-6 ${
            isDarkMode
              ? "bg-gradient-to-r from-green-900 to-green-900"
              : "bg-gradient-to-r from-green-500 to-green-600"
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <Typography variant="h5" component="h2" className="font-bold">
              Acheter {pack?.name}
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
            Complétez les informations ci-dessous pour finaliser votre achat
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

              <div className="grid grid-cols-1 gap-3">
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

                  return (
                    <div
                      key={method.id}
                      className={`method-card cursor-pointer ${
                        paymentMethod === method.id ? "selected" : ""
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="flex items-center">
                        <Radio
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          size="small"
                        />
                        {/* Icône en fonction du type de paiement */}
                        <div className="ml-2 mr-3">
                          {Icon && (
                            <Icon
                              className={`h-6 w-6 ${
                                method.id === PAYMENT_TYPES.WALLET
                                  ? "text-green-600 dark:text-green-400"
                                  : method.id === PAYMENT_TYPES.CREDIT_CARD
                                  ? "text-blue-600 dark:text-blue-400"
                                  : method.id === PAYMENT_TYPES.MOBILE_MONEY
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          )}
                        </div>
                        <div className="ml-2">
                          <Typography
                            variant="subtitle2"
                            className="font-medium"
                          >
                            {method.name}
                          </Typography>
                          {method.id === PAYMENT_TYPES.WALLET && (
                            <Typography variant="caption" color="textSecondary">
                              Solde disponible: {walletBalance} USD
                            </Typography>
                          )}
                          {method.id === PAYMENT_TYPES.CREDIT_CARD && (
                            <div className="flex items-center gap-1 mt-1">
                              <img
                                src={visaIcon}
                                alt="Visa"
                                className="h-4 w-auto"
                              />
                              <img
                                src={mastercardIcon}
                                alt="Mastercard"
                                className="h-4 w-auto"
                              />
                              <img
                                src={amexIcon}
                                alt="American Express"
                                className="h-4 w-auto"
                              />
                            </div>
                          )}
                          {method.id === PAYMENT_TYPES.MOBILE_MONEY && (
                            <div className="flex items-center gap-1 mt-1">
                              <img
                                src={orangeIcon}
                                alt="Orange Money"
                                className="h-4 w-auto"
                              />
                              <img
                                src={airtelIcon}
                                alt="Airtel Money"
                                className="h-4 w-auto"
                              />
                              <img
                                src={mpesaIcon}
                                alt="M-Pesa"
                                className="h-4 w-auto"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Champs de paiement */}
            <div className="mt-4 fade-in" style={{ animationDelay: "0.3s" }}>
              {renderPaymentFields()}
            </div>

            {/* Code de parrainage */}
            <div className="mt-6 slide-in" style={{ animationDelay: "0.4s" }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                className="text-gray-600 dark:text-gray-300"
              >
                Code de parrainage <span className="text-red-500">*</span>
              </Typography>
              <TextField
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                fullWidth
                size="small"
                placeholder="Entrez le code"
                required
                disabled={noSponsorCode}
                error={!referralCode && formFields.cardNumber && !noSponsorCode}
                helperText={
                  !referralCode && formFields.cardNumber && !noSponsorCode
                    ? "Le code de parrainage est obligatoire"
                    : ""
                }
              />

              <div className="mt-2">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={noSponsorCode}
                      onChange={(e) => {
                        setNoSponsorCode(e.target.checked);
                        if (e.target.checked) {
                          handleOpenSponsorModal();
                        } else {
                          setReferralCode("");
                        }
                      }}
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
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Je n'ai pas de code parrain
                    </span>
                  }
                />
              </div>
            </div>

            {/* Modal pour afficher les codes parrains admin - Version personnalisée pour éviter les problèmes d'accessibilité */}
            {openSponsorModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setOpenSponsorModal(false);
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sponsor-modal-title"
              >
                <div
                  className={`relative w-full max-w-md rounded-lg p-0 shadow-xl overflow-hidden ${
                    isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`p-6 ${
                      isDarkMode
                        ? "bg-gradient-to-r from-green-900 to-green-900"
                        : "bg-gradient-to-r from-green-500 to-green-600"
                    } text-white`}
                  >
                    <Typography
                      variant="h6"
                      className="font-bold"
                      id="sponsor-modal-title"
                    >
                      Codes parrains disponibles
                    </Typography>
                    <Typography variant="body2" className="mt-1 opacity-80">
                      Sélectionnez un code parrain pour continuer
                    </Typography>
                  </div>

                  <div className="p-6">
                    {localLoading ? (
                      <div className="flex justify-center p-4">
                        <CircularProgress size={30} />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {Array.isArray(adminSponsorCodes) &&
                        adminSponsorCodes.length > 0 ? (
                          adminSponsorCodes.map((code) => (
                            <div
                              key={code.id || `code-${code.referral_code}`}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-gray-100"
                              } flex items-center justify-between`}
                              onClick={() =>
                                handleSelectSponsorCode(code.referral_code)
                              }
                              role="button"
                              tabIndex="0"
                              aria-label={`Sélectionner le code parrain ${code.referral_code}`}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleSelectSponsorCode(code.referral_code);
                                }
                              }}
                            >
                              <div>
                                <Typography
                                  variant="subtitle2"
                                  className="font-medium"
                                >
                                  {code.referral_code}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  {code.name || "Code administrateur"}
                                </Typography>
                              </div>
                              <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          ))
                        ) : (
                          <Typography
                            variant="body2"
                            className="text-center py-4"
                          >
                            Aucun code parrain disponible
                          </Typography>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setOpenSponsorModal(false)}
                        variant="outlined"
                        color="primary"
                      >
                        Fermer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section durée et montant */}
            <div
              className="summary-card mt-6 mb-6 fade-in"
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
                      endAdornment: (
                        <InputAdornment position="end">mois</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: getSubscriptionStep(pack.abonnement),
                      step: getSubscriptionStep(pack.abonnement),
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
                      ? (totalAmount || 0).toFixed(2)
                      : (convertedAmount || 0).toFixed(2)}{" "}
                    {paymentMethod === PAYMENT_TYPES.WALLET
                      ? CURRENCIES.USD.symbol
                      : CURRENCIES[selectedCurrency].symbol}
                  </Typography>
                </div>

                {/* N'afficher la ligne des frais que si une méthode de paiement spécifique est sélectionnée */}
                {selectedPaymentOption && (
                  <div className="flex justify-between items-center mt-2">
                    <Typography
                      variant="subtitle2"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      Frais{" "}
                      {feePercentage !== null
                        ? `(${feePercentage.toFixed(1)}%)`
                        : ""}
                    </Typography>
                    <Typography variant="body2">
                      {transactionFees !== null
                        ? transactionFees.toFixed(2)
                        : "0.00"}{" "}
                      {paymentMethod === PAYMENT_TYPES.WALLET
                        ? CURRENCIES.USD.symbol
                        : CURRENCIES[selectedCurrency].symbol}
                    </Typography>
                  </div>
                )}

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <Typography variant="subtitle1" className="font-bold">
                    Total
                  </Typography>
                  <div className="flex items-center">
                    {feesError ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={fetchTransferFees}
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
                          ? totalAmount || 0
                          : convertedAmount || 0) + (transactionFees || 0)
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
              disabled={
                !formIsValid ||
                loading ||
                loadingFees ||
                feesError ||
                (paymentMethod === PAYMENT_TYPES.WALLET &&
                  totalAmount + (transactionFees || 0) > walletBalance)
              }
              className="px-6 py-2"
              startIcon={
                feesError ? (
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : null
              }
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : paymentMethod === PAYMENT_TYPES.WALLET ? (
                "Payer maintenant"
              ) : (
                "Procéder au paiement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
