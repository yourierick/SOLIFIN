import { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CURRENCIES, PAYMENT_TYPES, PAYMENT_METHODS } from '../../../config';

// Prix par défaut par jour pour le boost d'une publication (si le paramètre n'est pas défini)
const DEFAULT_PRICE_PER_DAY = 1; // USD

// Configuration des champs de formulaire pour chaque méthode de paiement
const paymentMethodFields = {
  [PAYMENT_TYPES.WALLET]: [],
  [PAYMENT_TYPES.CREDIT_CARD]: [
    { name: 'cardNumber', label: 'Numéro de carte', type: 'text', required: true, maxLength: 19, 
      format: (value) => value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim() },
    { name: 'cardHolder', label: 'Nom sur la carte', type: 'text', required: true },
    { 
      name: 'expiryDate', 
      label: 'Date d\'expiration', 
      type: 'text', 
      required: true,
      maxLength: 5,
      format: (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2')
    },
    { name: 'cvv', label: 'CVV', type: 'text', required: true, maxLength: 3 }
  ],
  [PAYMENT_TYPES.MOBILE_MONEY]: [
    { name: 'phoneNumber', label: 'Numéro de téléphone', type: 'tel', required: true }
  ],
  [PAYMENT_TYPES.BANK_TRANSFER]: [
    { name: 'accountName', label: 'Nom du compte', type: 'text', required: true },
    { name: 'accountNumber', label: 'Numéro de compte', type: 'text', required: true }
  ],
  [PAYMENT_TYPES.MONEY_TRANSFER]: [
    { name: 'senderName', label: 'Nom de l\'expéditeur', type: 'text', required: true },
    { name: 'referenceNumber', label: 'Numéro de référence', type: 'text', required: true }
  ],
  [PAYMENT_TYPES.CASH]: [
    { name: 'paymentLocation', label: 'Lieu de paiement', type: 'text', required: true }
  ]
};

// Transformation des méthodes de paiement pour l'interface utilisateur
const paymentMethods = [
  {
    id: PAYMENT_TYPES.WALLET,
    name: 'Mon Wallet',
    icon: 'wallet',
    category: 'direct',
    options: PAYMENT_METHODS[PAYMENT_TYPES.WALLET]
  },
  {
    id: PAYMENT_TYPES.CREDIT_CARD,
    name: 'Carte de crédit',
    icon: 'credit-card',
    category: 'card',
    options: PAYMENT_METHODS[PAYMENT_TYPES.CREDIT_CARD],
    fields: paymentMethodFields[PAYMENT_TYPES.CREDIT_CARD]
  },
  {
    id: PAYMENT_TYPES.MOBILE_MONEY,
    name: 'Mobile Money',
    icon: 'phone',
    category: 'mobile',
    options: PAYMENT_METHODS[PAYMENT_TYPES.MOBILE_MONEY],
    fields: paymentMethodFields[PAYMENT_TYPES.MOBILE_MONEY]
  }
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

export default function BoostPublicationModal({ isOpen, onClose, publication, publicationType }) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_TYPES.WALLET);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('');
  const [formFields, setFormFields] = useState({});
  const [days, setDays] = useState(7);
  const [walletBalance, setWalletBalance] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(DEFAULT_PRICE_PER_DAY);
  const [totalAmount, setTotalAmount] = useState(DEFAULT_PRICE_PER_DAY * 7);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactionFees, setTransactionFees] = useState(0);
  const [feePercentage, setFeePercentage] = useState(0);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);

  // Récupérer le solde du wallet et le prix du boost au chargement
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalance();
      fetchBoostPrice();
      fetchTransferFees();
      
      // Réinitialiser les états pour les méthodes de paiement
      setSelectedPaymentOption(paymentMethod === PAYMENT_TYPES.WALLET ? 'solifin-wallet' : '');
      
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
      setSelectedPaymentOption('solifin-wallet');
      setSelectedCurrency('USD');
    } else if (selectedPaymentOption === 'solifin-wallet') {
      setSelectedPaymentOption('');
    }
    
    validateForm();
  }, [paymentMethod]);

  // Effet pour convertir la devise lorsque la devise sélectionnée change
  useEffect(() => {
    if (selectedCurrency !== 'USD' && paymentMethod !== PAYMENT_TYPES.WALLET) {
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
      const response = await axios.get('/api/userwallet/balance');
      if (response.data.success) {
        setWalletBalance(parseFloat(response.data.balance));
      } else {
        console.error('Erreur lors de la récupération du solde:', response.data.message);
        setWalletBalance(0);
        toast.error('Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
      setWalletBalance(0);
      toast.error('Impossible de récupérer le solde de votre wallet. Veuillez rafraîchir la page.');
    }
  };

  // Récupérer le prix du boost
  const fetchBoostPrice = async () => {
    try {
      const response = await axios.get('/api/boost-price');
      if (response.data.success) {
        setPricePerDay(parseFloat(response.data.price));
      } else {
        console.error('Erreur lors de la récupération du prix du boost:', response.data.message);
        setPricePerDay(DEFAULT_PRICE_PER_DAY);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du prix du boost:', error);
      setPricePerDay(DEFAULT_PRICE_PER_DAY);
    }
  };

  // Récupérer les frais de transfert globaux
  const fetchTransferFees = async () => {
    setLoadingFees(true);
    setFeesError(false);
    
    try {    
      const response = await axios.post('/api/transaction-fees/transfer', {
        amount: 100, // Montant de référence (à défaut) pour calculer le pourcentage
      });
      
      if (response.data.success) {
        // Stocker le pourcentage plutôt que le montant des frais
        setFeePercentage(response.data.percentage);
        setFeesError(false);
      } else {
        setFeesError(true);
        toast.error(response.data.message || 'Erreur lors de la récupération des frais de transaction');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des frais:', error);
      setFeesError(true);
      toast.error('Erreur lors de la récupération des frais de transaction. Veuillez réessayer.');
    } finally {
      setLoadingFees(false);
    }
  };
  
  // Fonction pour convertir la devise
  const convertCurrency = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/currency/convert', {
        amount: totalAmount,
        from: 'USD',
        to: selectedCurrency
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
        console.error('Erreur lors de la conversion:', response.data.message);
        // En cas d'erreur, on utilise le montant original
        setConvertedAmount({ convertedAmount: totalAmount, rate: 1 });
        setFeesError(true);
        toast.error(response.data.message || 'Erreur lors de la conversion de devise');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      console.error('Détails de l\'erreur:', error.response?.data || 'Pas de détails disponibles');
      setConvertedAmount({ convertedAmount: totalAmount, rate: 1 });
      setFeesError(true);
      toast.error('Erreur lors de la conversion de devise. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer les changements de champs de formulaire
  const handleFieldChange = (fieldName, value) => {
    // Appliquer le formatage si nécessaire
    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
    const field = selectedMethod?.fields?.find(f => f.name === fieldName);
    
    if (field && field.format) {
      value = field.format(value);
    }
    
    setFormFields({
      ...formFields,
      [fieldName]: value
    });
    
    validateForm();
  };

  // Fonction pour gérer le changement de méthode de paiement
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setSelectedPaymentOption('');
    setFormFields({});
    
    // Si on choisit le wallet, on sélectionne automatiquement solifin-wallet et on met les frais à 0
    if (method === PAYMENT_TYPES.WALLET) {
      setSelectedPaymentOption('solifin-wallet');
      setTransactionFees(0);
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
    isValid = isValid && selectedPaymentOption !== '';
    
    // Vérifier si le nombre de jours est valide
    isValid = isValid && days > 0;
    
    // Vérifier les champs selon la méthode de paiement
    if (paymentMethod === PAYMENT_TYPES.WALLET) {
      // Pour le wallet, pas besoin de vérifier le solde ici
      // La vérification du solde sera faite séparément pour l'activation du bouton
      isValid = isValid && true;
    } else if (paymentMethod === PAYMENT_TYPES.CREDIT_CARD) {
      // Pour la carte de crédit, vérifier les champs requis
      const requiredFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
      isValid = isValid && requiredFields.every(field => formFields[field] && formFields[field].trim() !== '');
    } else if (paymentMethod === PAYMENT_TYPES.MOBILE_MONEY) {
      // Pour le mobile money, vérifier le numéro de téléphone
      isValid = isValid && formFields.phoneNumber && formFields.phoneNumber.trim() !== '';
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
    setError('');
    
    // Vérifier si le solde du wallet est suffisant
    if (paymentMethod === PAYMENT_TYPES.WALLET && totalAmount > walletBalance) {
      setError('Solde insuffisant dans votre wallet');
      setLoading(false);
      return;
    }

    // Vérifier si tous les champs requis sont remplis
    if (!formIsValid) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }
    
    try {
      // Déterminer le type de publication pour l'API
      let apiEndpoint;
      switch (publicationType) {
        case 'advertisement':
          apiEndpoint = `/api/publicites/${publication.id}/boost`;
          break;
        case 'jobOffer':
          apiEndpoint = `/api/offres-emploi/${publication.id}/boost`;
          break;
        case 'businessOpportunity':
          apiEndpoint = `/api/opportunites-affaires/${publication.id}/boost`;
          break;
        default:
          throw new Error('Type de publication non pris en charge');
      }
      
      // Préparer les données pour l'API
      const paymentData = {
        ...formFields,
        days,
        paymentMethod: selectedPaymentOption, // Méthode spécifique (solifin-wallet, visa, etc.)
        paymentType: paymentMethod, // Type général (wallet, credit-card, etc.)
        paymentOption: selectedPaymentOption, // Garder pour compatibilité avec l'ancien code
        currency: selectedCurrency,
        amount: paymentMethod === PAYMENT_TYPES.WALLET ? totalAmount : convertedAmount.convertedAmount,
        fees: paymentMethod === PAYMENT_TYPES.WALLET ? 0 : transactionFees,
      };
      
      // Envoyer la demande de boost
      const response = await axios.post(apiEndpoint, paymentData);
      
      if (response.data.success) {
        toast.success('Publication boostée avec succès! La durée d\'affichage a été prolongée.');
        onClose(true); // Passer true pour indiquer que le boost a réussi
      } else {
        const errorMessage = response.data.message || 'Une erreur est survenue lors du boost de la publication.';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Erreur lors du boost de la publication:', error);
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors du boost de la publication.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour rendre les champs de formulaire spécifiques à la méthode de paiement
  const renderPaymentFields = () => {
    const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
    
    if (!selectedMethod) {
      return null;
    }

    return (
      <div className="space-y-2">
        {/* Afficher les options spécifiques pour chaque type de paiement */}
        {paymentMethod !== PAYMENT_TYPES.WALLET && selectedMethod.options && selectedMethod.options.length > 0 && (
          <div className="mb-2">
            <Typography variant="subtitle2" gutterBottom>
              {paymentMethod === PAYMENT_TYPES.CREDIT_CARD ? 'Choisissez votre type de carte' : 'Choisissez votre opérateur'}
            </Typography>
            <RadioGroup
              value={selectedPaymentOption}
              onChange={(e) => handlePaymentOptionChange(e.target.value)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedMethod.options.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio size="small" />}
                    label={
                      <div className="flex items-center">
                        {option.icon && (
                          <img src={option.icon} alt={option.name} className="w-6 h-6 mr-2" />
                        )}
                        <span>{option.name}</span>
                      </div>
                    }
                  />
                ))}
              </div>
            </RadioGroup>
          </div>
        )}
        
        {/* Afficher les champs de formulaire spécifiques à la méthode de paiement */}
        {selectedMethod.fields && selectedMethod.fields.length > 0 && (
          <div className="space-y-2">
            {selectedMethod.fields.map((field) => (
              <TextField
                key={field.name}
                label={field.label}
                type={field.type}
                value={formFields[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
                fullWidth
                size="small"
                margin="dense"
                inputProps={{
                  maxLength: field.maxLength
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'flex items-center justify-center' : 'hidden'}`}>
      {/* Overlay semi-transparent avec effet de flou */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm modal-blur-overlay"
        onClick={onClose}
      ></div>
      
      {/* Contenu du modal */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col ${isDarkMode ? 'dark' : ''} modal-animation`}>
        {/* En-tête du modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-primary-600 dark:bg-primary-800 text-white rounded-t-lg">
          <div>
            <Typography variant="h6" className="font-bold">
              Booster votre publication
            </Typography>
            <Typography variant="body2" className="text-gray-100">
              Prolongez la durée d'affichage de votre publication
            </Typography>
          </div>
          <IconButton onClick={onClose} size="small" className="text-white hover:text-gray-200">
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </div>
        
        {/* Corps du modal avec défilement */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Afficher les erreurs */}
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            {/* Détails de la publication */}
            <div className="mb-6 fade-in">
              <Typography variant="h6" className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                Détails de la publication
              </Typography>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                <Typography variant="subtitle1" className="font-medium">
                  {publication?.titre || 'Publication'}
                </Typography>
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300 mt-1">
                  Type: {
                    publicationType === 'advertisement' ? 'Publicité' :
                    publicationType === 'jobOffer' ? 'Offre d\'emploi' :
                    'Opportunité d\'affaire'
                  }
                </Typography>
                {publication?.duree_affichage && (
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-300 mt-1">
                    Durée d'affichage actuelle: {publication.duree_affichage} jours
                  </Typography>
                )}
              </div>
            </div>
            
            {/* Durée du boost */}
            <div className="mb-6 slide-in">
              <TextField
                label="Durée du boost en jours"
                type="number"
                value={days}
                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                fullWidth
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">jours</InputAdornment>,
                }}
                inputProps={{ min: 1 }}
                className="mb-2"
              />
              
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span>Prix par jour:</span>
                <span>${pricePerDay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-1">
                <span>Montant total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Méthodes de paiement */}
            <div className="mb-6 fade-in">
              <Typography variant="h6" className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                Méthode de paiement
              </Typography>
              
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className={`method-card cursor-pointer ${paymentMethod === method.id ? 'selected' : ''}`}
                    onClick={() => handlePaymentMethodChange(method.id)}
                  >
                    <div className="flex items-center">
                      <Radio
                        checked={paymentMethod === method.id}
                        onChange={() => handlePaymentMethodChange(method.id)}
                        name="payment-method-radio"
                        color="primary"
                      />
                      <div className="ml-2">
                        <Typography variant="subtitle2" className="font-medium">{method.name}</Typography>
                        {method.id === PAYMENT_TYPES.WALLET ? (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Solde disponible: {walletBalance.toFixed(2)} USD
                          </Typography>
                        ) : method.id === PAYMENT_TYPES.CARD ? (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Visa, Mastercard, American Express
                          </Typography>
                        ) : method.id === PAYMENT_TYPES.MOBILE ? (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Orange Money, Airtel Money, M-Pesa
                          </Typography>
                        ) : method.id === PAYMENT_TYPES.BANK ? (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Virement bancaire
                          </Typography>
                        ) : method.id === PAYMENT_TYPES.TRANSFER ? (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Western Union, MoneyGram
                          </Typography>
                        ) : (
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            Paiement en espèces
                          </Typography>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {paymentMethod !== PAYMENT_TYPES.WALLET && (
                <div className="mb-4">
                  <Typography variant="subtitle2" className="mb-2">
                    Sélectionnez votre devise
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    variant="outlined"
                  >
                    {Object.entries(CURRENCIES).map(([code, currency]) => (
                      <MenuItem key={code} value={code}>
                        {currency.symbol} {currency.name} ({code})
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              )}
              
              {renderPaymentFields()}
            </div>
            
            {/* Récapitulatif */}
            <div className="mb-6 fade-in">
              <Typography variant="h6" className="mb-2 font-semibold text-gray-800 dark:text-gray-100">
                Récapitulatif
              </Typography>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="body2">
                      Boost pour {days} jour{days > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2">
                      {paymentMethod === PAYMENT_TYPES.WALLET ? 
                        `${totalAmount.toFixed(2)} ${CURRENCIES.USD.symbol}` : 
                        `${convertedAmount?.convertedAmount?.toFixed(2)} ${CURRENCIES[selectedCurrency].symbol}`}
                    </Typography>
                  </div>
                  
                  {selectedCurrency !== 'USD' && paymentMethod !== PAYMENT_TYPES.WALLET && (
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Taux de change</span>
                      <span>1 USD = {convertedAmount.rate} {selectedCurrency}</span>
                    </div>
                  )}
                  
                  {transactionFees > 0 && (
                    <div className="flex justify-between items-center">
                      <Typography variant="body2">
                        Frais de transaction
                        {feePercentage > 0 && <span className="text-xs text-gray-500 ml-1">({feePercentage}%)</span>}
                      </Typography>
                      <Typography variant="body2">
                        {transactionFees.toFixed(2)} {paymentMethod === PAYMENT_TYPES.WALLET ? CURRENCIES.USD.symbol : CURRENCIES[selectedCurrency].symbol}
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
                          onClick={calculateFees} 
                          className="mr-2"
                          title="Recalculer les frais"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </IconButton>
                      ) : loadingFees ? (
                        <CircularProgress size={16} className="mr-2" />
                      ) : null}
                      <Typography variant="subtitle1" color="primary" className="font-bold">
                        {paymentMethod === PAYMENT_TYPES.WALLET 
                          ? (totalAmount || 0).toFixed(2) + ' ' + CURRENCIES.USD.symbol
                          : ((convertedAmount.convertedAmount || 0) + (transactionFees || 0)).toFixed(2) + ' ' + CURRENCIES[selectedCurrency].symbol
                        }
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Alerte pour solde insuffisant */}
        {paymentMethod === PAYMENT_TYPES.WALLET && totalAmount > walletBalance && (
          <Alert severity="error" className="mx-6 mb-3">
            Solde insuffisant dans votre wallet. Vous avez besoin de {totalAmount.toFixed(2)} USD mais votre solde est de {walletBalance.toFixed(2)} USD.
          </Alert>
        )}
        
        {/* Bouton de paiement - en dehors de la zone scrollable */}
        <div className="p-6 pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <Typography variant="body2" color="textSecondary" className="text-gray-500 dark:text-gray-400">
            {paymentMethod === PAYMENT_TYPES.WALLET ? 'Paiement direct depuis votre wallet' : 'Procédez au paiement sécurisé'}
          </Typography>
          
          <div className="flex space-x-3">
            <Button
              variant="outlined"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                !formIsValid || 
                loading || 
                loadingFees || 
                feesError || 
                (paymentMethod === PAYMENT_TYPES.WALLET && totalAmount > walletBalance)
              }
              className="px-6 py-2"
              onClick={handleSubmit}
              sx={{
                backgroundColor: 'rgb(22, 163, 74)',
                '&:hover': {
                  backgroundColor: 'rgb(21, 128, 61)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(22, 163, 74, 0.5)',
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                paymentMethod === PAYMENT_TYPES.WALLET ? 'Payer maintenant' : 'Procéder au paiement'
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
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
    </div>
  );
}
