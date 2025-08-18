import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
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
  userWallet,
  userInfo,
  isAdmin = false,
}) => {
  const { isDarkMode } = useTheme();
  const [transferData, setTransferData] = useState({
    recipient_account_id: "",
    amount: "",
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

  // Récupérer les frais de transfert à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      fetchTransferFees();
      resetForm();
    }
  }, [isOpen]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setTransferData({
      recipient_account_id: "",
      amount: "",
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

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

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
    if (!isNaN(transferAmount)) {
      const totalAmount = transferAmount + totalFeeAmount;
      if (totalAmount > userWallet?.balance) {
        newErrors.amount =
          "Montant insuffisant dans votre portefeuille pour couvrir le transfert et les frais";
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

    setTransferLoading(true);
    try {
      // Calculer le montant total avec les frais et commissions
      const amount = parseFloat(transferData.amount);
      const totalAmount = amount + totalFeeAmount;

      // Préparer les données pour l'API
      const apiData = {
        amount: totalAmount.toFixed(2), // Montant total avec frais
        original_amount: amount.toFixed(2), // Montant original sans frais
        fee_amount: transferFeeAmount.toFixed(2), // Montant des frais de transfert
        fee_percentage: transferFeePercentage, // Pourcentage des frais de transfert
        commission_amount: transferCommissionAmount.toFixed(2), // Montant des frais de commission
        commission_percentage: transferCommissionPercentage, // Pourcentage des frais de commission
        total_fee_amount: totalFeeAmount.toFixed(2), // Montant total des frais
        recipient_account_id: transferData.recipient_account_id,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <AnimatePresence>
        {showConfirmTransferModal ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Confirmer le transfert
              </h3>
              <button
                onClick={handleBackToTransfer}
                className={`p-1 rounded-full ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`mb-6 p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center mb-4">
                <FaUser
                  className={`mr-2 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Destinataire
                  </p>
                  <p
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {recipientInfo.name || "Nom non disponible"}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    ID: {transferData.recipient_account_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <FaDollarSign
                  className={`mr-2 ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Montant à transférer
                  </p>
                  <p
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {parseFloat(transferData.amount).toFixed(2)} $
                  </p>
                </div>
              </div>

              {totalFeeAmount > 0 && (
                <div className="flex items-center mb-4">
                  <FaPercent
                    className={`mr-2 ${
                      isDarkMode ? "text-yellow-400" : "text-yellow-600"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Frais totaux
                    </p>
                    <p
                      className={`font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {totalFeeAmount.toFixed(2)} $ (
                      {(
                        transferFeePercentage + transferCommissionPercentage
                      ).toFixed(2)}
                      %)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <FaDollarSign
                  className={`mr-2 ${
                    isDarkMode ? "text-red-400" : "text-red-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Montant total à débiter
                  </p>
                  <p
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(parseFloat(transferData.amount) + totalFeeAmount).toFixed(
                      2
                    )}{" "}
                    $
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <FaLock className="inline-block mr-1" /> Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={transferData.password}
                onChange={handleTransferChange}
                placeholder="Entrez votre mot de passe pour confirmer"
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleBackToTransfer}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Retour
              </button>
              <button
                onClick={handleTransferFunds}
                disabled={transferLoading}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } ${transferLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {transferLoading ? "Traitement..." : "Confirmer le transfert"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <FaExchangeAlt className="inline-block mr-2" />
                Transfert de fonds
              </h3>
              <button
                onClick={onClose}
                className={`p-1 rounded-full ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-200 text-gray-700"
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
                  <FaDollarSign className="inline-block mr-1" /> Montant
                </label>
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
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
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
              {transferData.amount && parseFloat(transferData.amount) > 0 && (
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
                    <FaPercent className="inline-block mr-1" /> Détails des
                    frais
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
                        className={isDarkMode ? "text-white" : "text-gray-900"}
                      >
                        {parseFloat(transferData.amount).toFixed(2)} $
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
                          {transferFeeAmount.toFixed(2)} $
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
                          {transferCommissionAmount.toFixed(2)} $
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
                            parseFloat(transferData.amount) + totalFeeAmount
                          ).toFixed(2)}{" "}
                          $
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
                  } ${transferLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {transferLoading ? "Traitement..." : "Suivant"}
                </button>
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
