import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  Alert,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
// import CountryCodeSelector from "./CountryCodeSelector";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import axios from "../utils/axios";
import { countries } from "../data/countries";
import { useToast } from "../contexts/ToastContext";
import Notification from "./Notification";
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from "../config";

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
  
  /* Correction pour le dropdown de l'indicatif téléphonique */
  .country-selector-container {
    position: relative;
  }
  
  .country-selector-container .absolute {
    z-index: 9999 !important;
    position: absolute !important;
    backdrop-filter: none !important;
  }
  
  /* S'assurer que le modal ne bloque pas le dropdown */
  .fixed.inset-0 {
    z-index: 40;
  }
  
  /* Style spécifique pour le menu du sélecteur d'indicatif téléphonique */
  .phone-code-menu {
    z-index: 9999 !important;
    position: absolute !important;
  }
  
  /* Styles pour les modes clair et sombre */
  .country-selector-container .absolute {
    background-color: #fff !important;
  }
  
  .dark .country-selector-container .absolute {
    background-color: #1f2937 !important;
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

// Composant local pour l'indicatif téléphonique
const SimplePhoneCode = ({ value, onChange }) => {
  // Utiliser un select standard de Material UI avec Autocomplete
  const [open, setOpen] = useState(false);
  
  // Codes prioritaires à afficher en haut de la liste
  const priorityCodes = ['CD', 'CI', 'FR', 'US', 'SN', 'CM', 'BE', 'CA', 'MA', 'DZ', 'TN'];
  
  // Créer une liste ordonnée avec les pays prioritaires en premier
  const priorityCountries = [];
  const otherCountries = [];
  
  // Trier les pays
  countries.forEach(country => {
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
  const selectedCountry = allCountries.find(country => country.phoneCode === value) || null;
  
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
            style: { paddingRight: '8px' }
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.code}>
          {option.phoneCode} ({option.name})
        </li>
      )}
      ListboxProps={{
        style: { maxHeight: 300 }
      }}
      componentsProps={{
        popper: {
          style: { zIndex: 9999 },
          className: 'phone-code-menu'
        }
      }}
      disablePortal={false}
    />
  );
};

// Fonction pour déterminer le pas d'abonnement en mois selon le type d'abonnement
const getSubscriptionStep = (subscriptionType) => {
  switch (subscriptionType?.toLowerCase()) {
    case "monthly":
    case "mensuel":
      return 1;
    case "quarterly":
    case "trimestriel":
      return 3;
    case "biannual":
    case "semestriel":
      return 6;
    case "annual":
    case "yearly":
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

// Liste des méthodes de paiement disponibles pour l'inscription
const paymentMethods = [
  {
    id: PAYMENT_TYPES.CREDIT_CARD,
    name: "Carte de crédit",
    icon: "credit-card",
    category: "card",
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD],
    fields: [
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
  },
  {
    id: PAYMENT_TYPES.MOBILE_MONEY,
    name: "Mobile Money",
    icon: "phone",
    category: "mobile",
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY],
    fields: [
      {
        name: "phoneNumber",
        label: "Numéro de téléphone",
        type: "tel",
        required: true,
        useCountryCode: true,
      },
    ],
  },
];

export default function RegistrationPaymentForm({
  open,
  onClose,
  pack,
  onSubmit,
  loading = false,
}) {
  const { isDarkMode } = useTheme();
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_TYPES.CREDIT_CARD);
  const [selectedCardOption, setSelectedCardOption] = useState("");
  const [selectedMobileOption, setSelectedMobileOption] = useState("");
  const [formFields, setFormFields] = useState({});
  const [phoneCode, setPhoneCode] = useState("+243"); // Indicatif par défaut
  const [months, setMonths] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currentCurrency, setCurrentCurrency] = useState("USD"); // Ajout de l'état pour suivre la devise actuelle
  const [transactionFees, setTransactionFees] = useState(null);
  const [feePercentage, setFeePercentage] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [unitPriceConverted, setUnitPriceConverted] = useState(0); // Ajout de l'état pour le prix unitaire converti
  const [formIsValid, setFormIsValid] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (pack) {
      const step = getSubscriptionStep(pack.abonnement);
      setMonths(step);
      setTotalAmount(pack.price * step);
    }
  }, [pack]);

  // Recalculer le montant total lorsque le nombre de mois change
  useEffect(() => {
    if (pack) {
      const step = getSubscriptionStep(pack.abonnement);
      // Calculer le nombre de périodes d'abonnement
      const periods = Math.ceil(months / step);
      // Le montant total est le prix du pack multiplié par le nombre de périodes
      setTotalAmount(pack.price * periods);
      
      console.log('Calcul du montant total:', {
        prix_pack: pack.price,
        duree_mois: months,
        pas_abonnement: step,
        periodes: periods,
        montant_total: pack.price * periods
      });
    }
  }, [pack, months]);

  // Effet pour initialiser les données lorsque le modal s'ouvre
  useEffect(() => {
    if (open && pack) {
      const step = getSubscriptionStep(pack.abonnement);
      const periods = Math.ceil(months / step);
      setTotalAmount(pack.price * periods);

      console.log('Initialisation du montant total:', {
        prix_pack: pack.price,
        duree_mois: months,
        pas_abonnement: step,
        periodes: periods,
        montant_total: pack.price * periods
      });

      // Récupérer le pourcentage de frais global une seule fois à l'ouverture du modal
      const fetchGlobalFeePercentage = async () => {
        try {
          const response = await axios.post("/api/transaction-fees/purchase", {
            amount: 100, // Montant de référence pour obtenir le pourcentage
          });

          if (response.data.success) {
            const percentage = response.data.percentage || 0;
            setFeePercentage(percentage);

            // Après avoir récupéré le pourcentage, initialiser la conversion de devise
            convertCurrency(percentage);
          } else {
            setFeePercentage(0);
            convertCurrency(0);
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du pourcentage de frais:",
            error
          );
          setFeePercentage(0);
          convertCurrency(0);
        }
      };

      fetchGlobalFeePercentage();
    }
  }, [open, pack]);

  // Effet pour déclencher la conversion de devise lorsque le montant total ou la devise change
  useEffect(() => {
    if (
      pack &&
      totalAmount > 0 &&
      !localLoading &&
      open &&
      feePercentage !== null
    ) {
      convertCurrency();
    }
  }, [totalAmount, selectedCurrency]);

  // Nous n'avons plus besoin de recalculer les frais lorsque les options de paiement changent
  // car nous utilisons le pourcentage global récupéré à l'ouverture du modal

  useEffect(() => {
    // Réinitialiser les champs du formulaire et l'option mobile lors du changement de méthode
    setFormFields({});
    setSelectedMobileOption("");
    setSelectedCardOption("");
  }, [paymentMethod]);

  useEffect(() => {
    validateForm();
  }, [paymentMethod, formFields, selectedMobileOption, months, totalAmount]);

  // Récupérer les frais de transaction depuis l'API
  const fetchTransactionFees = async (amount, method, currency) => {
    try {
      setLocalLoading(true);
      const response = await axios.post("/api/transaction-fees/transfer", {
        amount: amount,
      });

      if (response.data.success) {
        // Stocker les frais et le pourcentage tels que retournés par l'API
        // L'API applique déjà la logique de fee_fixed pour toutes les devises
        const fee = response.data.fee || 0;
        const percentage = response.data.percentage || 0;
        setTransactionFees(fee);
        setFeePercentage(percentage);
        return { fee, percentage };
      } else {
        // En cas d'échec de l'API, réinitialiser les frais
        setTransactionFees(null);
        setFeePercentage(null);
        return { fee: 0, percentage: 0 };
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de transaction:",
        error
      );
      // En cas d'erreur, réinitialiser les frais
      setTransactionFees(null);
      setFeePercentage(null);
      return { fee: 0, percentage: 0 };
    } finally {
      setLocalLoading(false);
    }
  };

  const convertCurrency = async (globalFeePercentage = null) => {
    try {
      setLocalLoading(true);
      let convertedAmt = totalAmount;
      let localUnitPrice = pack ? pack.price : 0;
      let localUnitPriceConverted = unitPriceConverted; // Utiliser l'état existant

      // Calculer le pas d'abonnement et le nombre de périodes
      if (pack && months > 0) {
        const step = getSubscriptionStep(pack.abonnement);
        const periods = Math.ceil(months / step);
        
        // Vérifier si une conversion est nécessaire
        // Si la devise est USD, pas besoin de conversion
        if (selectedCurrency === "USD") {
          // Pas besoin de conversion pour USD
          setConvertedAmount(totalAmount);
          localUnitPriceConverted = localUnitPrice;
          setUnitPriceConverted(localUnitPrice);
          setCurrentCurrency("USD");
          console.log('Pas de conversion nécessaire (devise USD)');
        } 
        // Si on a déjà un prix unitaire converti pour cette devise, l'utiliser
        else if (unitPriceConverted > 0 && currentCurrency === selectedCurrency) {
          // Recalculer le montant total avec le prix unitaire déjà converti
          convertedAmt = unitPriceConverted * periods;
          convertedAmt = parseFloat(convertedAmt.toFixed(2));
          setConvertedAmount(convertedAmt);
          console.log('Utilisation du prix unitaire déjà converti:', unitPriceConverted);
        } 
        // Sinon, faire une nouvelle conversion
        else {
          console.log('Nouvelle conversion nécessaire');
          // Approche améliorée: convertir d'abord le prix unitaire (prix par période)
          // puis calculer le montant total converti
          
          // 1. Convertir le prix unitaire de USD vers la devise sélectionnée
          const response = await axios.post("/api/currency/convert", {
            amount: localUnitPrice,
            from: "USD",
            to: selectedCurrency,
          });

          if (response.data.success) {
            // 2. Obtenir le prix unitaire converti
            localUnitPriceConverted = response.data.convertedAmount;
            setUnitPriceConverted(localUnitPriceConverted);
            
            // 3. Calculer le montant total converti en multipliant par le nombre de périodes
            convertedAmt = localUnitPriceConverted * periods;
            
            // Arrondir à deux décimales pour éviter les problèmes d'affichage
            convertedAmt = parseFloat(convertedAmt.toFixed(2));
            
            setConvertedAmount(convertedAmt);
            setCurrentCurrency(selectedCurrency);
          } else {
            console.error("Erreur lors de la conversion:", response.data.message);
            // En cas d'erreur, on utilise le montant original
            setConvertedAmount(totalAmount);
            localUnitPriceConverted = localUnitPrice;
            setUnitPriceConverted(localUnitPrice);
          }
        }

        console.log('Conversion de devise (optimisée):', {
          prix_pack: localUnitPrice,
          duree_mois: months,
          pas_abonnement: step,
          periodes: periods,
          prix_unitaire_usd: localUnitPrice,
          prix_unitaire_converti: localUnitPriceConverted,
          montant_total_usd: totalAmount,
          montant_converti: convertedAmt,
          devise_actuelle: currentCurrency,
          devise_cible: selectedCurrency
        });
      }

      // Calculer les frais localement avec le pourcentage global
      const percentage =
        globalFeePercentage !== null ? globalFeePercentage : feePercentage;
      if (percentage > 0) {
        const fee = convertedAmt * (percentage / 100);
        setTransactionFees(fee);
        
        console.log('Calcul des frais:', {
          pourcentage: percentage,
          montant_converti: convertedAmt,
          frais: fee
        });
      } else {
        setTransactionFees(0);
      }
    } catch (error) {
      console.error("Erreur lors de la conversion:", error);
      setConvertedAmount(totalAmount);
      setTransactionFees(0);
    } finally {
      setLocalLoading(false);
    }
  };

  // Vérifier si le formulaire est valide
  const validateForm = () => {
    // Vérifier si tous les champs requis sont remplis
    let isValid = true;

    // Vérifier les champs selon la méthode de paiement
    if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      // Pour la carte de crédit, vérifier tous les champs requis et l'option de carte
      const requiredFields = ["cardNumber", "cardHolder", "expiryDate", "cvv"];
      isValid =
        isValid &&
        requiredFields.every(
          (field) => formFields[field] && formFields[field].trim() !== ""
        );
      isValid = isValid && selectedCardOption !== "";
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Pour le mobile money, vérifier l'option sélectionnée et le numéro de téléphone
      isValid =
        isValid &&
        selectedMobileOption !== "" &&
        formFields.phoneNumber &&
        formFields.phoneNumber.trim() !== "";
    }

    // Vérifier que le montant et la durée sont valides
    isValid = isValid && months > 0 && totalAmount > 0;

    // Vérifier qu'il n'y a pas d'erreur de calcul des frais
    isValid = isValid && !localLoading;

    setFormIsValid(isValid);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Veuillez remplir tous les champs requis");
      return;
    }

    setLocalLoading(true);
    setError("");

    // Vérifier que l'option mobile est sélectionnée si nécessaire
    if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY && !selectedMobileOption) {
      setError("Veuillez sélectionner un opérateur mobile");
      setLocalLoading(false);
      return;
    }

    // Vérifier que l'option de carte est sélectionnée si nécessaire
    if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD && !selectedCardOption) {
      setError("Veuillez sélectionner un type de carte");
      setLocalLoading(false);
      return;
    }

    // Préparer les données de paiement en fonction de la méthode sélectionnée
    let paymentDetails = {};

    // Ne conserver que les champs pertinents pour la méthode de paiement sélectionnée
    if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      // Pour carte de crédit, inclure seulement les champs de carte
      const { cardNumber, cardHolder, expiryDate, cvv } = formFields;
      paymentDetails = { cardNumber, cardHolder, expiryDate, cvv };
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Pour mobile money, inclure le numéro de téléphone complet avec indicatif et l'opérateur
      const fullPhoneNumber = formFields.phoneNumber 
        ? `${phoneCode} ${formFields.phoneNumber}`.trim() 
        : "";
      paymentDetails = { phoneNumber: fullPhoneNumber, operator: selectedMobileOption };
    }

    // Utiliser le montant converti
    const finalAmount = convertedAmount;
      
    const paymentData = {
      pack_id: pack.id,
      payment_method:
        paymentMethod === PAYMENT_TYPES.CREDIT_CARD
          ? selectedCardOption
          : selectedMobileOption,
      payment_type: paymentMethod,
      duration_months: months,
      amount: finalAmount, // Montant sans les frais
      currency: selectedCurrency,
      fees: transactionFees,
      payment_details: paymentDetails,
      // Le numéro de téléphone complet est déjà inclus dans payment_details.phoneNumber
    };

    // Utiliser la fonction onSubmit fournie par le parent
    try {
      await onSubmit(paymentData);
      setLocalLoading(false);
    } catch (error) {
      setError(
        error.message ||
          "Une erreur est survenue lors du traitement du paiement"
      );
      setLocalLoading(false);
    }
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
      default:
        return 1; // Par défaut, pas de 1 mois
    }
  };

  // Gérer le changement d'indicatif téléphonique
  const handlePhoneCodeChange = (code) => {
    setPhoneCode(code);
  };

  const handleFieldChange = (fieldName, value) => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    const field = selectedMethod?.fields?.find((f) => f.name === fieldName);

    // Appliquer le formatage si défini
    const formattedValue = field?.format ? field.format(value) : value;

    // Pour les numéros de téléphone, valider qu'il ne commence pas par 0
    if (fieldName === "phoneNumber") {
      if (value === "") {
        // Permettre de vider le champ
        setFormFields((prev) => ({
          ...prev,
          [fieldName]: "",
        }));
        return;
      } else if (/^[1-9][0-9]*$/.test(value)) {
        // Accepter uniquement les chiffres sans 0 au début
        setFormFields((prev) => ({
          ...prev,
          [fieldName]: value,
        }));
        return;
      }
      // Ne rien faire si la valeur ne correspond pas aux critères
      return;
    }

    setFormFields((prev) => ({
      ...prev,
      [fieldName]: formattedValue,
    }));
  };

  const renderPaymentFields = () => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
    if (!selectedMethod?.fields) return null;

    return (
      <div className="space-y-2">
        {paymentMethod === PAYMENT_TYPES.MOBILE_MONEY && (
          <div className="mb-2">
            <Typography variant="subtitle2" gutterBottom>
              Choisissez votre opérateur
            </Typography>
            <RadioGroup
              row
              value={selectedMobileOption}
              onChange={(e) => setSelectedMobileOption(e.target.value)}
              className="gap-4"
            >
              {selectedMethod.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio size="small" />}
                  label={option.name}
                />
              ))}
            </RadioGroup>
          </div>
        )}
        {paymentMethod === PAYMENT_TYPES.CREDIT_CARD && (
          <div className="mb-2">
            <Typography variant="subtitle2" gutterBottom>
              Choisissez votre type de carte
            </Typography>
            <RadioGroup
              row
              value={selectedCardOption}
              onChange={(e) => setSelectedCardOption(e.target.value)}
              className="gap-4"
            >
              {selectedMethod.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio size="small" />}
                  label={option.name}
                />
              ))}
            </RadioGroup>
          </div>
        )}
        {(paymentMethod !== PAYMENT_TYPES.MOBILE_MONEY ||
          selectedMobileOption) &&
          (paymentMethod !== PAYMENT_TYPES.CREDIT_CARD ||
            selectedCardOption) && (
            <div
              className={
                paymentMethod === PAYMENT_TYPES.CREDIT_CARD
                  ? "grid grid-cols-2 gap-2"
                  : ""
              }
            >
              {selectedMethod.fields.map((field) => (
                field.useCountryCode && field.name === "phoneNumber" ? (
                  <div key={field.name} className="w-full">
                    <div className="flex items-start space-x-2">
                      <div className="w-1/3" style={{ position: 'relative', zIndex: 9990 }}>
                        <SimplePhoneCode
                          value={phoneCode}
                          onChange={handlePhoneCodeChange}
                        />
                      </div>
                      <div className="flex-1">
                        <TextField
                          label={field.label}
                          type={field.type}
                          value={formFields[field.name] || ""}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          fullWidth
                          required={field.required}
                          size="small"
                          placeholder="Ex: 1234567 (sans indicatif)"
                          inputProps={{
                            maxLength: field.maxLength,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
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
                )
              ))}
            </div>
          )}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-10 flex items-center justify-center bg-black/60 ${
        isDarkMode ? "dark" : ""
      }`}
      style={{ zIndex: 40 }}
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
              ? "bg-gradient-to-r from-green-900 to-green-800 text-white"
              : "bg-gradient-to-r from-green-800 to-green-900 text-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <Typography variant="h5" component="h2" className="font-bold">
              Finaliser votre inscription
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
            Complétez les informations ci-dessous pour créer votre compte
          </Typography>
        </div>

        {error && (
          <Alert severity="error" className="mx-6 mt-4 mb-0">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto p-6 pt-4 custom-scrollbar">
            <h1 className="text-lg font-bold mb-3 text-secondary-600 dark:text-secondary-400">
              Vous souscrivez pour le pack {pack.name}
            </h1>
            {/* Section méthode de paiement */}
            <div className="slide-in" style={{ animationDelay: "0.2s" }}>
              <Typography
                variant="subtitle1"
                className="font-bold mb-3 text-primary-600 dark:text-primary-400"
              >
                Méthode de paiement
              </Typography>

              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => (
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
                      <div className="ml-2">
                        <Typography variant="subtitle2">
                          {method.name}
                        </Typography>
                        {method.id === PAYMENT_TYPES.CREDIT_CARD && (
                          <Typography variant="caption" color="textSecondary">
                            Visa, Mastercard, American Express
                          </Typography>
                        )}
                        {method.id === PAYMENT_TYPES.MOBILE_MONEY && (
                          <Typography variant="caption" color="textSecondary">
                            Orange Money, Airtel Money, M-Pesa
                          </Typography>
                        )}
                      </div>
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
                    fullWidth
                    inputProps={{
                      min: getSubscriptionStep(pack.abonnement),
                      step: getSubscriptionStep(pack.abonnement),
                    }}
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
                    {(paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                    paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
                      ? convertedAmount
                      : totalAmount
                    ).toFixed(2)}{" "}
                    {paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                    paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
                      ? CURRENCIES[selectedCurrency].symbol
                      : CURRENCIES.USD.symbol}
                  </Typography>
                </div>
                {/* Afficher les frais uniquement si une méthode de paiement spécifique est sélectionnée et si les frais sont disponibles */}
                {((paymentMethod === PAYMENT_TYPES.CREDIT_CARD &&
                  selectedCardOption) ||
                  (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY &&
                    selectedMobileOption)) &&
                  transactionFees !== null &&
                  feePercentage !== null && (
                    <div className="flex justify-between items-center mt-2">
                      <Typography
                        variant="subtitle2"
                        className="text-gray-600 dark:text-gray-300"
                      >
                        Frais ({feePercentage.toFixed(1)}%)
                      </Typography>
                      <Typography variant="body2">
                        {transactionFees.toFixed(2)}{" "}
                        {paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                        paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
                          ? CURRENCIES[selectedCurrency].symbol
                          : CURRENCIES.USD.symbol}
                      </Typography>
                    </div>
                  )}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <Typography variant="subtitle1" className="font-bold">
                    Total
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    className="font-bold"
                  >
                    {(
                      (paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                      paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
                        ? convertedAmount
                        : totalAmount) + (transactionFees || 0)
                    ).toFixed(2)}{" "}
                    {paymentMethod === PAYMENT_TYPES.CREDIT_CARD ||
                    paymentMethod === PAYMENT_TYPES.MOBILE_MONEY
                      ? CURRENCIES[selectedCurrency].symbol
                      : CURRENCIES.USD.symbol}
                  </Typography>
                </div>
              </div>

              {pack?.sponsorName && (
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-yellow-800 dark:text-yellow-200">
                  <Typography variant="body2">
                    Pour ce pack vous serez sous le parrainage de :{" "}
                    <span className="font-semibold">{pack.sponsorName}</span>
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Bouton de paiement - en dehors de la zone scrollable */}
          <div className="p-6 pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <Typography variant="body2" color="textSecondary">
              Procédez au paiement sécurisé
            </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                loading ||
                localLoading ||
                !formIsValid ||
                (paymentMethod === PAYMENT_TYPES.CREDIT_CARD &&
                  (!selectedCardOption || transactionFees === null)) ||
                (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY &&
                  (!selectedMobileOption || transactionFees === null))
              }
              className={`${
                loading || localLoading || !formIsValid ? "" : "pulse"
              }`}
              sx={{
                minWidth: 150,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              {loading || localLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Payer et créer mon compte"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
