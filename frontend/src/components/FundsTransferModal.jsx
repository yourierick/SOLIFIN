import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FaExchangeAlt,
  FaUser,
  FaDollarSign,
  FaFileAlt,
  FaPercent,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

const FundsTransferModal = ({
  isOpen,
  onClose,
  onSuccess,
  balance_usd,
  balance_cdf,
  userInfo,
  isAdmin = false,
}) => {
  const { isDarkMode } = useTheme();

  // Gestion sécurisée du contexte de devise avec fallback
  let currencyContext;
  try {
    currencyContext = useCurrency();
  } catch (error) {
    console.warn(
      "CurrencyContext non disponible, utilisation de USD par défaut"
    );
    currencyContext = { canUseCDF: () => false, selectedCurrency: "USD" };
  }

  const { canUseCDF, selectedCurrency: globalCurrency } = currencyContext;

  // Garantir USD par défaut si CDF non disponible ou contexte en erreur
  const [selectedCurrency, setSelectedCurrency] = useState(
    canUseCDF() ? "" : "USD"
  );
  const [walletData, setWalletData] = useState({
    balance_usd: parseFloat(balance_usd) || 0,
    balance_cdf: parseFloat(balance_cdf) || 0,
  });
  const [transferData, setTransferData] = useState({
    recipient_account_id: "",
    amount: "",
    currency: "", // Devise sélectionnée: USD ou CDF
    original_amount: "",
    fee_amount: 0,
    fee_percentage: 0,
    commission_amount: 0,
    commission_percentage: 0,
    total_fee_amount: 0,
    note: "",
    password: "",
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferFeePercentage, setTransferFeePercentage] = useState(0);
  const [transferCommissionPercentage, setTransferCommissionPercentage] =
    useState(0);
  const [transferFeeAmount, setTransferFeeAmount] = useState(0);
  const [transferCommissionAmount, setTransferCommissionAmount] = useState(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);
  const [showConfirmTransferModal, setShowConfirmTransferModal] =
    useState(false);
  const [recipientInfo, setRecipientInfo] = useState({});
  const [errors, setErrors] = useState({});

  // Mettre à jour walletData si les props changent
  useEffect(() => {
    setWalletData({
      balance_usd: parseFloat(balance_usd) || 0,
      balance_cdf: parseFloat(balance_cdf) || 0,
    });
  }, [balance_usd, balance_cdf]);

  // Récupérer les frais de transfert à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      fetchTransferFees();
      resetForm();
    }
  }, [isOpen]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    const defaultCurrency = canUseCDF() ? "" : "USD";
    setSelectedCurrency(defaultCurrency);
    setTransferData({
      recipient_account_id: "",
      amount: "",
      currency: defaultCurrency,
      original_amount: "",
      fee_amount: 0,
      fee_percentage: 0,
      commission_amount: 0,
      commission_percentage: 0,
      total_fee_amount: 0,
      note: "",
      password: "",
    });
    setErrors({});
    setTransferFeeAmount(0);
    setTransferCommissionAmount(0);
    setTotalFeeAmount(0);
  };

  // Fonction pour récupérer les frais de transfert
  const fetchTransferFees = async () => {
    try {
      const response = await axios.get(`/api/getTransferFees`);

      if (response.data.success) {
        setTransferFeePercentage(response.data.fee_percentage);
        setTransferCommissionPercentage(response.data.fee_commission);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de transfert:",
        error
      );
      toast.error("Impossible de récupérer les frais de transfert");
    }
  };

  // Effet pour calculer les frais de transfert lorsque le montant change
  useEffect(() => {
    if (transferData.amount) {
      const amount = parseFloat(transferData.amount);
      if (!isNaN(amount)) {
        // Calculer les frais de transfert
        const fee =
          transferFeePercentage > 0
            ? (amount * transferFeePercentage) / 100
            : 0;
        setTransferFeeAmount(fee);

        // Calculer les frais de commission
        const commission =
          transferCommissionPercentage > 0
            ? (amount * transferCommissionPercentage) / 100
            : 0;
        setTransferCommissionAmount(commission);

        // Calculer le total des frais
        setTotalFeeAmount(fee + commission);
      } else {
        setTransferFeeAmount(0);
        setTransferCommissionAmount(0);
        setTotalFeeAmount(0);
      }
    } else {
      setTransferFeeAmount(0);
      setTransferCommissionAmount(0);
      setTotalFeeAmount(0);
    }
  }, [
    transferData.amount,
    transferFeePercentage,
    transferCommissionPercentage,
  ]);

  // Gestion des changements dans le formulaire
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur lorsque l'utilisateur commence à corriger
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Initialiser automatiquement la devise selon le contexte global
  useEffect(() => {
    const initialCurrency = canUseCDF() ? globalCurrency : "USD";
    if (selectedCurrency !== initialCurrency) {
      setSelectedCurrency(initialCurrency);
      setTransferData((prev) => ({ ...prev, currency: initialCurrency }));
    }
  }, [canUseCDF, globalCurrency, selectedCurrency]);

  // Gestion de la sélection de devise
  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setTransferData((prev) => ({ ...prev, currency }));
  };

  // Initialiser automatiquement USD si CDF n'est pas disponible ou contexte en erreur
  useEffect(() => {
    if (!canUseCDF() && selectedCurrency !== "USD") {
      handleCurrencySelect("USD");
    }
  }, [canUseCDF, selectedCurrency]); // Se déclenche quand canUseCDF ou selectedCurrency change

  // Garantir l'initialisation au chargement du composant et à l'ouverture du modal
  useEffect(() => {
    if (!canUseCDF() && (!selectedCurrency || selectedCurrency === "")) {
      setSelectedCurrency("USD");
      setTransferData((prev) => ({ ...prev, currency: "USD" }));
    }
  }, [canUseCDF, selectedCurrency, isOpen]); // Se déclenche au montage et à l'ouverture du modal

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Garantir une devise par défaut si aucune n'est sélectionnée
    if (!selectedCurrency || selectedCurrency === "") {
      if (!canUseCDF()) {
        // Si CDF n'est pas disponible, utiliser USD automatiquement
        setSelectedCurrency("USD");
        setTransferData((prev) => ({ ...prev, currency: "USD" }));
      } else {
        // Si CDF est disponible, demander à l'utilisateur de choisir
        newErrors.currency = "Veuillez sélectionner une devise";
      }
    }

    // Validation du montant
    if (
      !transferData.amount ||
      isNaN(transferData.amount) ||
      parseFloat(transferData.amount) <= 0
    ) {
      newErrors.amount = "Veuillez entrer un montant valide";
    }

    // Validation du destinataire (ID du compte)
    if (!transferData.recipient_account_id) {
      newErrors.recipient_account_id =
        "L'identifiant du compte destinataire est requis";
    }

    // Vérifier si l'utilisateur essaie de se transférer des fonds à lui-même
    if (transferData.recipient_account_id === userInfo?.account_id) {
      newErrors.recipient_account_id =
        "Vous ne pouvez pas vous transférer des fonds";
    }

    // Vérifier si le portefeuille a suffisamment de fonds
    const transferAmount = parseFloat(transferData.amount);
    if (!isNaN(transferAmount) && selectedCurrency) {
      const totalAmount = transferAmount + totalFeeAmount;
      const availableBalance =
        selectedCurrency === "USD"
          ? walletData?.balance_usd
          : walletData?.balance_cdf;

      if (totalAmount > availableBalance) {
        newErrors.amount = `Montant insuffisant dans votre portefeuille ${selectedCurrency} pour couvrir le transfert et les frais`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Récupérer les informations du destinataire (pour les utilisateurs non-admin)
  const fetchRecipientInfo = async () => {
    if (!validateForm()) return;

    setTransferLoading(true);

    try {
      // Utiliser la même URL que celle utilisée dans Wallet.jsx
      const response = await axios.get(
        `/api/recipient-info/${transferData.recipient_account_id}`
      );

      if (response.data.success) {
        setRecipientInfo(response.data.recipient || response.data.user);
        setShowConfirmTransferModal(true);
      } else {
        toast.error(response.data.message || "Destinataire introuvable");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des informations du destinataire"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Afficher le modal de confirmation avec les informations du destinataire
    fetchRecipientInfo();
  };

  // Effectuer le transfert de fonds
  const handleTransferFunds = async () => {
    if (!transferData.password) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }

    // Garantir que la devise est toujours définie (USD par défaut)
    const finalCurrency = selectedCurrency || "USD";

    setTransferLoading(true);
    try {
      // Calculer le montant total avec les frais et commissions
      const amount = parseFloat(transferData.amount);
      const totalAmount = amount + totalFeeAmount;

      // Préparer les données pour l'API
      const apiData = {
        amount: amount.toFixed(2), // Montant à transférer
        frais_de_transaction: transferFeeAmount.toFixed(2), // Montant des frais de transfert
        frais_de_commission: transferCommissionAmount.toFixed(2), // Montant des frais de commission
        recipient_account_id: transferData.recipient_account_id,
        currency: finalCurrency, // Devise garantie (USD par défaut)
        note: transferData.note || "",
        password: transferData.password,
      };

      const response = await axios.post("/api/funds-transfer", apiData);

      if (response.data.success) {
        toast.success("Transfert effectué avec succès");
        setShowConfirmTransferModal(false);
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || "Erreur lors du transfert");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors du transfert de fonds"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // Fermer le modal de confirmation et revenir au modal de transfert
  const handleBackToTransfer = () => {
    setShowConfirmTransferModal(false);
  };

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <AnimatePresence>
        {showConfirmTransferModal ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-full ${
                    isDarkMode
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <FaExchangeAlt className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Confirmer le transfert
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Vérifiez les détails avant envoi
                  </p>
                </div>
              </div>
              <button
                onClick={handleBackToTransfer}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`mb-6 p-6 rounded-xl border ${
                isDarkMode
                  ? "bg-gray-700/50 border-gray-600"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
              }`}
            >
              <div className="flex items-center mb-6">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    isDarkMode
                      ? "bg-gray-600 text-gray-300"
                      : "bg-white text-blue-600 shadow-sm"
                  }`}
                >
                  <FaUser className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Destinataire
                  </p>
                  <p
                    className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {recipientInfo?.name ||
                      `ID: ${transferData.recipient_account_id}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    isDarkMode
                      ? "bg-green-600/20 text-green-400"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  <FaDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Montant à transférer
                  </p>
                  <p
                    className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {parseFloat(transferData.amount).toFixed(2)}{" "}
                    <span
                      className={`text-lg ${
                        selectedCurrency === "USD"
                          ? "text-blue-500"
                          : "text-green-500"
                      }`}
                    >
                      {selectedCurrency === "USD" ? "$" : "FC"}
                    </span>
                  </p>
                </div>
              </div>

              {totalFeeAmount > 0 && (
                <div className="flex items-center mb-6">
                  <div
                    className={`p-2 rounded-full mr-3 ${
                      isDarkMode
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    <FaPercent className="w-5 h-5" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Frais totaux
                    </p>
                    <p
                      className={`font-medium text-lg ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <span className="text-yellow-500">
                        {totalFeeAmount.toFixed(2)}{" "}
                        {selectedCurrency === "USD" ? "$" : "FC"}
                      </span>{" "}
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        (
                        {(
                          transferFeePercentage + transferCommissionPercentage
                        ).toFixed(2)}
                        %)
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center pt-4 border-t border-gray-600 dark:border-gray-600">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    isDarkMode
                      ? "bg-red-600/20 text-red-400"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <FaDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Montant total à débiter
                  </p>
                  <p
                    className={`font-bold text-xl ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(parseFloat(transferData.amount) + totalFeeAmount).toFixed(
                      2
                    )}{" "}
                    <span className="text-red-500">
                      {selectedCurrency === "USD" ? "$" : "FC"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-1 rounded mr-2 ${
                      isDarkMode
                        ? "bg-red-600/20 text-red-400"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <FaLock className="w-4 h-4" />
                  </div>
                  Mot de passe de confirmation
                </div>
              </label>
              <input
                type="password"
                name="password"
                value={transferData.password}
                onChange={handleTransferChange}
                placeholder="Entrez votre mot de passe pour confirmer"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-700"
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                } focus:outline-none`}
              />
              {errors.password && (
                <div className="mt-2 flex items-center text-sm text-red-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBackToTransfer}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 shadow-md hover:shadow-lg"
                }`}
              >
                <div className="flex items-center">
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </div>
              </button>
              <button
                onClick={handleTransferFunds}
                disabled={transferLoading}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                } ${
                  transferLoading
                    ? "opacity-70 cursor-not-allowed transform-none"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  {transferLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt className="w-4 h-4 mr-2" />
                      Confirmer le transfert
                    </>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`relative p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-3 rounded-full ${
                    isDarkMode
                      ? "bg-green-900/50 text-green-400"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  <FaExchangeAlt className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Transfert de fonds
                  </h3>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Envoyer de l'argent à un autre utilisateur
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <form onSubmit={handleSubmit}>
                {/* Affichage automatique de la devise selon le contexte global */}
                <div className="mb-6">
                  <label
                    className={`block text-sm font-medium mb-3 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Compte à débiter
                  </label>
                  <div className="grid gap-4 grid-cols-1">
                    {/* Portefeuille automatiquement sélectionné */}
                    <div
                      className={`p-5 rounded-2xl border-2 ${
                        selectedCurrency === "USD"
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-xl"
                          : "border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 shadow-xl"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedCurrency === "USD"
                              ? "bg-blue-500 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          <span className="text-lg font-bold">
                            {selectedCurrency === "USD" ? "$" : "FC"}
                          </span>
                        </div>
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          selectedCurrency === "USD"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {selectedCurrency === "USD"
                          ? "Portefeuille Dollars Américains"
                          : "Portefeuille Francs Congolais"}
                      </p>
                      <p
                        className={`text-xs mb-2 ${
                          selectedCurrency === "USD"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        Solde disponible
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          selectedCurrency === "USD"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {selectedCurrency === "USD"
                          ? `${walletData?.balance_usd?.toFixed(2) || "0.00"} USD`
                          : `${walletData?.balance_cdf?.toFixed(2) || "0.00"} CDF`}
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

                {/* Désactiver les champs si aucune devise n'est sélectionnée et que CDF est disponible */}
                <div
                  className={`${
                    canUseCDF() && !selectedCurrency
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <FaUser className="inline-block mr-1" />
                      ID du compte destinataire
                    </label>
                    <input
                      type="text"
                      name="recipient_account_id"
                      value={transferData.recipient_account_id}
                      onChange={handleTransferChange}
                      placeholder="ID du compte destinataire"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.recipient_account_id && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.recipient_account_id}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Montant
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2 font-bold dark:text-gray-300">
                        {selectedCurrency === "USD" ? "$" : "FC"}
                      </span>
                      <input
                        type="number"
                        name="amount"
                        value={transferData.amount}
                        onChange={handleTransferChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <FaFileAlt className="inline-block mr-1" /> Description
                      (optionnelle)
                    </label>
                    <textarea
                      name="note"
                      value={transferData.note}
                      onChange={handleTransferChange}
                      placeholder="Raison du transfert (optionnel)"
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>

                  {/* Affichage des frais de transfert */}
                  {transferData.amount &&
                    parseFloat(transferData.amount) > 0 && (
                      <div
                        className={`mb-4 p-3 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <h4
                          className={`font-medium mb-2 ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          <FaPercent className="inline-block mr-1" /> Détails
                          des frais
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span
                              className={
                                isDarkMode ? "text-gray-300" : "text-gray-600"
                              }
                            >
                              Montant du transfert:
                            </span>
                            <span
                              className={
                                isDarkMode ? "text-white" : "text-gray-900"
                              }
                            >
                              {parseFloat(transferData.amount).toFixed(2)}{" "}
                              {selectedCurrency === "USD" ? "$" : "FC"}
                            </span>
                          </div>
                          {transferFeePercentage > 0 && (
                            <div className="flex justify-between">
                              <span
                                className={
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }
                              >
                                Frais de transfert ({transferFeePercentage}%):
                              </span>
                              <span
                                className={
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }
                              >
                                {transferFeeAmount.toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                          )}
                          {transferCommissionPercentage > 0 && (
                            <div className="flex justify-between">
                              <span
                                className={
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }
                              >
                                Commission ({transferCommissionPercentage}%):
                              </span>
                              <span
                                className={
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }
                              >
                                {transferCommissionAmount.toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                          )}
                          {(transferFeePercentage > 0 ||
                            transferCommissionPercentage > 0) && (
                            <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                              <span
                                className={`font-medium ${
                                  isDarkMode ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Total à débiter:
                              </span>
                              <span
                                className={`font-medium ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {(
                                  parseFloat(transferData.amount) +
                                  totalFeeAmount
                                ).toFixed(2)}{" "}
                                {selectedCurrency === "USD" ? "$" : "FC"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="mb-4">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      * Votre mot de passe sera demandé à l'étape suivante pour
                      confirmer le transfert.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={transferLoading}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      } ${
                        transferLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {transferLoading ? "Traitement..." : "Suivant"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        zIndex={9999}
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>,
    document.body
  );
};

export default FundsTransferModal;
