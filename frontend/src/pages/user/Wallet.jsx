import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import Notification from "../../components/Notification";
import WithdrawalForm from "../../components/WithdrawalForm";
import VirtualPurchaseForm from "../../components/VirtualPurchaseForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../../styles/tooltip.css";
import {
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
  FaFilter,
  FaTimes,
  FaExchangeAlt,
  FaFileExcel,
  FaUser,
  FaDollarSign,
  FaFileAlt,
  FaPercent,
  FaCheckCircle,
  FaMoneyBillWave,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

const getStatusColor = (status, isDarkMode) => {
  switch (status) {
    case "active":
      return isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800";
    case "pending":
      return isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800";
    case "inactive":
      return isDarkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800";
    default:
      return isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "active":
      return "Actif";
    case "pending":
      return "En attente";
    case "inactive":
      return "Inactif";
    default:
      return status;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "Non disponible";

  try {
    // Si la date est déjà au format français avec heure (JJ/MM/AAAA HH:MM:SS)
    if (typeof dateString === "string" && dateString.includes("/")) {
      // Extraire seulement la partie date (JJ/MM/AAAA)
      const dateParts = dateString.split(" ");
      if (dateParts.length > 0) {
        return dateParts[0]; // Retourne seulement la partie date
      }
      return dateString;
    }

    // Essayer de créer une date valide
    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error("Date invalide:", dateString);
      return "Format de date invalide";
    }

    // Formater la date en français sans l'heure
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  } catch (error) {
    console.error("Erreur de formatage de date:", error, dateString);
    return "Erreur de date";
  }
};

export default function Wallets() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [transactions, setTransactions] = useState([]);
  const [userWallet, setuserWallet] = useState(null);
  const [userBonusPoints, setUserBonusPoints] = useState(null);
  const [bonusPointsHistory, setBonusPointsHistory] = useState([]);
  const [showBonusPointsHistory, setShowBonusPointsHistory] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showVirtualPurchaseForm, setShowVirtualPurchaseForm] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawalToCancel, setWithdrawalToCancel] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedPackForConversion, setSelectedPackForConversion] =
    useState(null);
  const [showPointsPerPack, setShowPointsPerPack] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState(0);
  const [selectedPackInfo, setSelectedPackInfo] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [transferData, setTransferData] = useState({
    recipient_account_id: "",
    amount: "",
    description: "",
    password: "",
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [showConfirmTransferModal, setShowConfirmTransferModal] =
    useState(false);
  const [recipientInfo, setRecipientInfo] = useState({});
  const [transferFeePercentage, setTransferFeePercentage] = useState(0);
  const [transferCommissionPercentage, setTransferCommissionPercentage] =
    useState(0);
  const [transferFeeAmount, setTransferFeeAmount] = useState(0);
  const [transferCommissionAmount, setTransferCommissionAmount] = useState(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);

  // Styles CSS pour l'ascenseur personnalisé
  const scrollbarStyles = {
    ".custom-scrollbar::-webkit-scrollbar": {
      width: "8px",
    },
    ".custom-scrollbar::-webkit-scrollbar-track": {
      background: isDarkMode
        ? "rgba(55, 65, 81, 0.3)"
        : "rgba(229, 231, 235, 0.5)",
      borderRadius: "20px",
    },
    ".custom-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: isDarkMode
        ? "rgba(75, 85, 99, 0.8)"
        : "rgba(156, 163, 175, 0.8)",
      borderRadius: "20px",
      border: "2px solid transparent",
      backgroundClip: "padding-box",
    },
    ".dark .custom-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(75, 85, 99, 0.8)",
    },
    ".custom-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: isDarkMode
        ? "rgba(55, 65, 81, 0.9)"
        : "rgba(107, 114, 128, 0.9)",
    },
    ".dark .custom-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "rgba(55, 65, 81, 0.9)",
    },
    ".modal-scrollbar::-webkit-scrollbar": {
      width: "10px",
    },
    ".modal-scrollbar::-webkit-scrollbar-track": {
      background: isDarkMode
        ? "rgba(55, 65, 81, 0.5)"
        : "rgba(229, 231, 235, 0.7)",
      borderRadius: "10px",
    },
    ".modal-scrollbar::-webkit-scrollbar-thumb": {
      backgroundColor: isDarkMode
        ? "rgba(75, 85, 99, 0.9)"
        : "rgba(156, 163, 175, 0.9)",
      borderRadius: "10px",
      border: "2px solid transparent",
      backgroundClip: "padding-box",
    },
    ".modal-scrollbar::-webkit-scrollbar-thumb:hover": {
      backgroundColor: isDarkMode
        ? "rgba(55, 65, 81, 1)"
        : "rgba(107, 114, 128, 1)",
    },
  };

  // Ajouter les styles au document
  useEffect(() => {
    const styleEl = document.createElement("style");
    let cssRules = "";

    Object.entries(scrollbarStyles).forEach(([selector, rules]) => {
      cssRules += `${selector} { `;
      Object.entries(rules).forEach(([property, value]) => {
        cssRules += `${property}: ${value}; `;
      });
      cssRules += "} ";
    });

    styleEl.textContent = cssRules;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    fetchWalletData();
    fetchBonusPoints(); // Appel direct pour s'assurer que les points bonus sont chargés
    fetchBonusPointsHistory(); // Charger l'historique des points bonus
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, dateFilter]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/userwallet/data");
      if (response.data.success) {
        setuserWallet(response.data.userWallet);
        setTransactions(response.data.transactions);
        setUser(response.data.user);
      }

      // Récupérer les points bonus
      fetchBonusPoints();
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const fetchBonusPoints = async () => {
    try {
      const response = await axios.get("/api/user/bonus-points");
      if (response.data.success) {
        setUserBonusPoints(response.data.points);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des points bonus:", error);
    }
  };

  const fetchBonusPointsHistory = async () => {
    try {
      const response = await axios.get("/api/user/bonus-points/history");
      if (response.data.success) {
        setBonusPointsHistory(response.data.history);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement de l'historique des points bonus:",
        error
      );
    }
  };

  const handleConvertPoints = async (packId, points) => {
    try {
      const response = await axios.post("/api/user/bonus-points/convert", {
        pack_id: packId,
        points: points,
      });

      if (response.data.success) {
        toast.success("les points ont été convertis avec succès");
        // Rafraîchir les données
        fetchBonusPoints();
        fetchWalletData(); // Rafraîchir les données
        // Fermer le modal
        setShowConversionModal(false);
      }
    } catch (error) {
      console.error("Erreur lors de la conversion des points:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la conversion des points"
      );
    }
  };

  const handleRefresh = () => {
    fetchWalletData();
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleDateFilter = (field) => (e) => {
    setDateFilter((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  };

  const getTransactionStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return isDarkMode
          ? "bg-green-900/50 text-green-300"
          : "bg-green-100 text-green-800";
      case "pending":
        return isDarkMode
          ? "bg-yellow-900/50 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "rejected":
        return isDarkMode
          ? "bg-red-900/50 text-red-300"
          : "bg-red-100 text-red-800";
      case "cancelled":
        return isDarkMode
          ? "bg-gray-900/50 text-gray-300"
          : "bg-gray-100 text-gray-800";
      default:
        return isDarkMode
          ? "bg-gray-900/50 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const handleWithdrawalClick = (walletId, type) => {
    setSelectedWalletForWithdrawal({ id: walletId, type });
    setShowWithdrawalForm(true);
  };

  const handleCancelClick = (withdrawalId) => {
    if (!withdrawalId) {
      toast.error("Impossible d'annuler cette demande : identifiant manquant");
      return;
    }
    setWithdrawalToCancel(withdrawalId);
    setShowCancelModal(true);
  };

  const handleCancelWithdrawal = async () => {
    // Vérifier si l'ID de retrait est défini
    if (!withdrawalToCancel) {
      toast.error("Impossible d'annuler cette demande : identifiant manquant");
      setShowCancelModal(false);
      return;
    }

    axios
      .post(`/api/withdrawal/request/${withdrawalToCancel}/cancel`)
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          Notification.success(response.data.message);
          fetchWalletData(); // Rafraîchir les données
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(
          error.response?.data?.message ||
            "Une erreur s'est produite lors de l'annulation"
        );
      })
      .finally(() => {
        setShowCancelModal(false);
        setWithdrawalToCancel(null);
      });
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleViewBonusPointsHistory = () => {
    fetchBonusPointsHistory();
    setShowBonusPointsHistory(true);
  };

  const openConversionModal = (
    packId,
    packName,
    availablePoints,
    pointValue
  ) => {
    if (availablePoints > 0) {
      setSelectedPackForConversion(packId);
      setPointsToConvert(availablePoints);
      setSelectedPackInfo({
        packName,
        availablePoints,
        pointValue,
      });
      setShowConversionModal(true);
    } else {
      toast.info(
        `Vous n'avez pas de points disponibles pour le pack ${packName}`
      );
    }
  };

  // Fonction pour ouvrir le modal de transfert et récupérer les frais
  const handleTransferButtonClick = async () => {
    // Réinitialiser les données du formulaire de transfert
    setTransferData({
      recipient_account_id: "",
      amount: "",
      note: "",
      password: "",
    });

    // Réinitialiser les montants des frais
    setTransferFeeAmount(0);
    setTransferCommissionAmount(0);
    setTotalFeeAmount(0);

    // Ouvrir le modal
    setShowTransferModal(true);

    // Récupérer les frais de transfert et commissions
    try {
      const response = await axios.get(`/api/getTransferFees`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

  const handleVirtualPurchaseClick = () => {
    // Ouvrir le modal d'achat de virtuel
    setShowVirtualPurchaseForm(true);
  };

  // Fonction pour récupérer les frais de transfert
  const fetchTransferFees = async () => {
    try {
      const response = await axios.get(`/api/getTransferFees`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

  const fetchRecipientInfo = async () => {
    if (!transferData.recipient_account_id) {
      toast.error("Veuillez entrer l'identifiant du compte destinataire");
      return;
    }

    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    if (transferData.recipient_account_id === user.account_id) {
      toast.error("Vous ne pouvez pas vous transferer des fonds");
      return;
    }

    const transferAmount = parseFloat(transferData.amount);

    // Calculer le montant total avec les frais
    const feeAmount = transferAmount * (transferFeePercentage / 100);
    const commissionAmount =
      transferAmount * (transferCommissionPercentage / 100);
    const totalAmount = transferAmount + feeAmount + commissionAmount;

    if (totalAmount > userWallet.balance) {
      toast.error(
        "Montant insuffisant dans votre portefeuille pour couvrir le transfert et les frais"
      );
      return;
    }

    try {
      const response = await axios.get(
        `/api/recipient-info/${transferData.recipient_account_id}`
      );
      if (response.data.success) {
        setRecipientInfo(response.data.user);
        setShowConfirmTransferModal(true);
        setShowTransferModal(false); // Fermer le modal de transfert quand le modal de confirmation s'ouvre
      } else {
        toast.error(response.data.message || "Destinataire introuvable");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations du destinataire:",
        error
      );
      toast.error(
        "Erreur lors de la récupération des informations du destinataire"
      );
    }
  };

  const handleTransferFunds = async () => {
    if (!transferData.password) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }
    n;
    setTransferLoading(true);
    try {
      // Calculer le montant total avec les frais et commissions
      const totalAmount = parseFloat(transferData.amount) + totalFeeAmount;

      const response = await axios.post("/api/funds-transfer", {
        recipient_account_id: transferData.recipient_account_id,
        amount: totalAmount.toFixed(2), // Envoyer le montant total (avec frais et commissions)
        original_amount: parseFloat(transferData.amount).toFixed(2), // Montant original sans frais
        fee_amount: transferFeeAmount.toFixed(2), // Montant des frais de transfert
        fee_percentage: transferFeePercentage, // Pourcentage des frais de transfert
        commission_amount: transferCommissionAmount.toFixed(2), // Montant des frais de commission
        commission_percentage: transferCommissionPercentage, // Pourcentage des frais de commission
        total_fee_amount: totalFeeAmount.toFixed(2), // Montant total des frais
        note: transferData.note,
        password: transferData.password,
      });

      if (response.data.success) {
        toast.success("Transfert effectué avec succès");
        setShowConfirmTransferModal(false);
        setShowTransferModal(false);
        fetchWalletData(); // Rafraîchir les données du wallet
      } else {
        toast.error(response.data.message || "Erreur lors du transfert");
      }
    } catch (error) {
      console.error("Erreur lors du transfert de fonds:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors du transfert de fonds"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, dateFilter]);

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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = JSON.stringify(transaction.metadata)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      transaction.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;

    // Amélioration du filtrage par date
    let matchesDate = true;

    if (dateFilter.startDate || dateFilter.endDate) {
      try {
        // Convertir la date de transaction en objet Date
        let transactionDate;

        if (typeof transaction.created_at === "string") {
          // Si la date est au format "JJ/MM/AAAA HH:MM:SS" (format français)
          if (transaction.created_at.includes("/")) {
            // Extraire seulement la partie date (JJ/MM/AAAA)
            const parts = transaction.created_at.split("/");
            if (parts.length === 3) {
              // Format JJ/MM/AAAA
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript

              // Extraire l'année et l'heure si présente
              let year, time;
              if (parts[2].includes(" ")) {
                [year, time] = parts[2].split(" ");
                year = parseInt(year, 10);
              } else {
                year = parseInt(parts[2], 10);
              }

              transactionDate = new Date(year, month, day);
            } else {
              transactionDate = new Date(transaction.created_at);
            }
          } else {
            // Format standard ISO
            transactionDate = new Date(transaction.created_at);
          }
        } else {
          transactionDate = new Date(transaction.created_at);
        }

        // Convertir les dates de filtre en objets Date
        // Pour la date de début, on définit l'heure à 00:00:00
        let startDate = null;
        if (dateFilter.startDate) {
          startDate = new Date(dateFilter.startDate);
          startDate.setHours(0, 0, 0, 0);
        }

        // Pour la date de fin, on définit l'heure à 23:59:59
        let endDate = null;
        if (dateFilter.endDate) {
          endDate = new Date(dateFilter.endDate);
          endDate.setHours(23, 59, 59, 999);
        }

        // Vérifier si la date de transaction est dans la plage
        matchesDate =
          (!startDate || transactionDate >= startDate) &&
          (!endDate || transactionDate <= endDate);

        console.log("Transaction date:", transactionDate);
        console.log("Start date:", startDate);
        console.log("End date:", endDate);
        console.log("Matches date:", matchesDate);
      } catch (error) {
        console.error("Erreur lors du filtrage par date:", error);
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );

  // Vérifier si au moins une transaction a un bouton d'annulation
  const hasActionableTransactions = transactions.some(
    (transaction) =>
      transaction.type === "withdrawal" &&
      transaction.status === "pending" &&
      transaction.metadata?.withdrawal_request_id
  );

  // Fonction d'exportation Excel améliorée
  const exportToExcel = (exportAll = false) => {
    // Fermer le menu d'exportation
    setShowExportMenu(false);

    // Afficher un message si l'export concerne beaucoup de données
    if (exportAll && filteredTransactions.length > 100) {
      toast.info(
        `Préparation de l'export de ${filteredTransactions.length} transactions...`
      );
    }

    // Déterminer quelles données exporter (filtrées ou toutes)
    const dataToExport = exportAll ? filteredTransactions : currentTransactions;

    // Formater les données pour l'export
    const formattedData = dataToExport.map((transaction) => {
      // Formater les métadonnées pour une meilleure lisibilité
      let formattedMetadata = "";
      if (transaction.metadata) {
        try {
          // Si les métadonnées sont déjà un objet
          if (typeof transaction.metadata === "object") {
            // Parcourir les propriétés et les formater
            Object.entries(transaction.metadata).forEach(([key, value]) => {
              // Traduire les clés en français
              let frenchKey = key;
              if (key === "withdrawal_request_id")
                frenchKey = "demande_retrait_id";
              if (key === "bonus_points") frenchKey = "points_bonus";
              if (key === "bonus_rate") frenchKey = "taux_bonus";
              if (key === "pack_id") frenchKey = "pack_id";
              if (key === "referral_id") frenchKey = "filleul_id";
              if (key === "referral_code") frenchKey = "code_parrainage";
              if (key === "amount") frenchKey = "montant";
              if (key === "currency") frenchKey = "devise";
              if (key === "status") frenchKey = "statut";
              if (key === "created_at") frenchKey = "date_creation";
              if (key === "updated_at") frenchKey = "date_modification";

              // Formater les valeurs spéciales (comme les bonus sur délais)
              if (
                frenchKey === "points_bonus" ||
                frenchKey === "taux_bonus" ||
                frenchKey.includes("bonus")
              ) {
                formattedMetadata += `${frenchKey}: ${value} ★\n`;
              } else {
                formattedMetadata += `${frenchKey}: ${value}\n`;
              }
            });
          } else {
            // Si les métadonnées sont une chaîne JSON, les parser
            const metadataObj = JSON.parse(transaction.metadata);
            Object.entries(metadataObj).forEach(([key, value]) => {
              // Traduire les clés en français
              let frenchKey = key;
              if (key === "withdrawal_request_id")
                frenchKey = "demande_retrait_id";
              if (key === "bonus_points") frenchKey = "points_bonus";
              if (key === "bonus_rate") frenchKey = "taux_bonus";
              if (key === "pack_id") frenchKey = "pack_id";
              if (key === "referral_id") frenchKey = "filleul_id";
              if (key === "referral_code") frenchKey = "code_parrainage";
              if (key === "amount") frenchKey = "montant";
              if (key === "currency") frenchKey = "devise";
              if (key === "status") frenchKey = "statut";
              if (key === "created_at") frenchKey = "date_creation";
              if (key === "updated_at") frenchKey = "date_modification";

              // Mettre en évidence les informations liées aux bonus
              if (
                frenchKey === "points_bonus" ||
                frenchKey === "taux_bonus" ||
                frenchKey.includes("bonus")
              ) {
                formattedMetadata += `${frenchKey}: ${value} ★\n`;
              } else {
                formattedMetadata += `${frenchKey}: ${value}\n`;
              }
            });
          }
        } catch (error) {
          // Si le parsing échoue, utiliser les métadonnées brutes
          formattedMetadata = transaction.metadata.toString();
        }
      }

      // Traduire le type de transaction
      let typeTraduction = transaction.type;
      if (transaction.type === "deposit") typeTraduction = "Dépôt";
      if (transaction.type === "withdrawal") typeTraduction = "Retrait";
      if (transaction.type === "transfer") typeTraduction = "Transfert";
      if (transaction.type === "payment") typeTraduction = "Paiement";
      if (transaction.type === "refund") typeTraduction = "Remboursement";
      if (transaction.type === "commission") typeTraduction = "Commission";
      if (transaction.type === "bonus") typeTraduction = "Bonus";
      if (transaction.type === "conversion") typeTraduction = "Conversion";

      // Retourner l'objet formaté avec des en-têtes en français
      return {
        Type: typeTraduction,
        Montant: transaction.amount,
        Statut: getStatusText(transaction.status),
        "Date de création": transaction.created_at,
        Métadonnées: formattedMetadata,
      };
    });

    // Créer la feuille Excel
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 15 }, // Type
      { wch: 12 }, // Montant
      { wch: 15 }, // Statut
      { wch: 20 }, // Date de création
      { wch: 50 }, // Métadonnées
    ];
    worksheet["!cols"] = columnWidths;

    // Ajouter des informations supplémentaires en haut de la feuille
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          `Exporté le ${new Date().toLocaleDateString(
            "fr-FR"
          )} à ${new Date().toLocaleTimeString("fr-FR")}`,
        ],
        [
          `Filtres appliqués: ${
            statusFilter !== "all"
              ? `Statut: ${getStatusText(statusFilter)}`
              : "Tous les statuts"
          }, ${
            typeFilter !== "all"
              ? `Type: ${
                  typeFilter === "deposit"
                    ? "Dépôt"
                    : typeFilter === "withdrawal"
                    ? "Retrait"
                    : typeFilter === "transfer"
                    ? "Transfert"
                    : typeFilter === "payment"
                    ? "Paiement"
                    : typeFilter === "refund"
                    ? "Remboursement"
                    : typeFilter === "commission"
                    ? "Commission"
                    : typeFilter === "bonus"
                    ? "Bonus"
                    : typeFilter === "conversion"
                    ? "Conversion"
                    : typeFilter
                }`
              : "Tous les types"
          }`,
        ],
        [
          `Période: ${
            dateFilter.startDate
              ? `Du ${dateFilter.startDate} au ${dateFilter.endDate}`
              : "Toutes dates"
          }`,
        ],
        [`Recherche: ${searchQuery ? `"${searchQuery}"` : "Aucune"}`],
        [`Nombre de transactions: ${formattedData.length}`],
        [""], // Ligne vide pour séparer les en-têtes des données
      ],
      { origin: -1 }
    );

    // Créer le classeur et ajouter la feuille
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Générer le nom du fichier avec la date
    const now = new Date();
    const dateStr = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}`;
    const filename = `transactions_${dateStr}.xlsx`;

    // Exporter le fichier
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(dataBlob, filename);

    // Notification de succès
    toast.success(`${formattedData.length} transactions exportées avec succès`);
  };

  // Gestionnaire de clic à l'extérieur pour fermer le menu d'exportation
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target) &&
        !event.target.closest('button[title="Options d\'exportation Excel"]')
      ) {
        setShowExportMenu(false);
      }
    }

    // Ajouter l'écouteur d'événement lorsque le menu est ouvert
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:flex sm:items-center sm:justify-between"
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Mon portefeuille
        </h1>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          className={`p-2 rounded-md ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
          />
        </motion.button>
      </motion.div>

      {/* Débogage */}
      {/* <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
        <p>État des points bonus: {userBonusPoints ? 'Chargés' : 'Non chargés'}</p>
        {userBonusPoints && (
          <pre className="mt-2 text-xs">
            {JSON.stringify(userBonusPoints, null, 2)}
          </pre>
        )}
      </div> */}

      {/* Portefeuilles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portefeuille utilisateur */}
        {userWallet && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`p-6 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <WalletIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Portefeuille Personnel
                  </h3>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userWallet.balance} $
                  </p>
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total gagné: {userWallet.total_earned} $
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total retiré: {userWallet.total_withdrawn} $
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-center space-x-4">
                <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                  <button
                    onClick={() =>
                      handleWithdrawalClick(userWallet.id, "admin")
                    }
                    className={`p-3 border rounded-full transition-all duration-300 ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <BanknotesIcon className="h-6 w-6" />
                  </button>
                  <span className="tooltip-text">Faire un retrait</span>
                </div>

                <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                  <button
                    onClick={handleVirtualPurchaseClick}
                    className={`p-3 border rounded-full transition-all duration-300 ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <CurrencyDollarIcon className="h-6 w-6" />
                  </button>
                  <span className="tooltip-text">Acheter du virtuel</span>
                </div>

                <div className={`tooltip ${isDarkMode ? "dark-mode" : ""}`}>
                  <button
                    onClick={handleTransferButtonClick}
                    className={`p-3 border rounded-full transition-all duration-300 ${
                      isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <FaExchangeAlt className="h-6 w-6" />
                  </button>
                  <span className="tooltip-text">Transférer des fonds</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Portefeuille de points bonus */}
        {userBonusPoints && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`p-6 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Points Bonus
                  </h3>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {userBonusPoints.disponibles} points
                  </p>
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Valeur moyenne: {userBonusPoints.valeur_point} $ par point
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Valeur totale: {userBonusPoints.valeur_totale} $
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Points déjà utilisés: {userBonusPoints.utilises} points
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewBonusPointsHistory}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Historique
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPointsPerPack(!showPointsPerPack)}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {showPointsPerPack ? (
                    <FaTimes className="h-5 w-5 mr-2" />
                  ) : (
                    <FaFilter className="h-5 w-5 mr-2" />
                  )}
                  Points par pack
                </motion.button>
              </div>
            </div>

            {/* Liste des points bonus par pack */}
            {showPointsPerPack &&
              userBonusPoints.points_par_pack &&
              userBonusPoints.points_par_pack.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <h4
                    className={`text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Points par pack
                  </h4>
                  <div className="space-y-3 max-h-35 overflow-y-auto pr-2 custom-scrollbar">
                    {userBonusPoints.points_par_pack.map(
                      (packPoints, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`p-3 rounded-md ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h5
                                className={`text-sm font-medium ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {packPoints.pack_name}
                              </h5>
                              <p
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {packPoints.disponibles} points •{" "}
                                {packPoints.valeur_point} $ par point
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                openConversionModal(
                                  packPoints.pack_id,
                                  packPoints.pack_name,
                                  packPoints.disponibles,
                                  packPoints.valeur_point
                                )
                              }
                              disabled={!packPoints.disponibles}
                              className={`px-2 py-1 text-xs rounded flex items-center ${
                                packPoints.disponibles
                                  ? isDarkMode
                                    ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                    : "bg-yellow-500 hover:bg-yellow-600 text-white"
                                  : isDarkMode
                                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <FaExchangeAlt className="mr-1 h-3 w-3" />
                              Convertir
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
          </motion.div>
        )}
      </div>

      {/* Historique des transactions */}
      <div
        className={`mt-10 rounded-lg shadow-lg overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Titre et boutons de contrôle */}
            <div className="flex flex-wrap justify-between items-center">
              <h2
                className={`text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Historique de vos transactions
              </h2>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    showFilters
                      ? isDarkMode
                        ? "bg-gray-700 text-blue-400"
                        : "bg-gray-200 text-blue-600"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={
                    showFilters ? "Masquer les filtres" : "Afficher les filtres"
                  }
                >
                  {showFilters ? (
                    <FaTimes className="w-5 h-5" />
                  ) : (
                    <FaFilter className="w-5 h-5" />
                  )}
                </button>

                <div className="relative group">
                  <button
                    className={`flex items-center p-2 rounded-md transition-all duration-200 ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title="Options d'exportation Excel"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    <FaFileExcel className="w-5 h-5" />
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </button>

                  {showExportMenu && (
                    <div
                      className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg ${
                        isDarkMode ? "bg-gray-800" : "bg-white"
                      } ring-1 ring-black ring-opacity-5 z-10`}
                      ref={exportMenuRef}
                    >
                      <div
                        className="py-1"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <button
                          onClick={() => exportToExcel(false)}
                          className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                            isDarkMode
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          role="menuitem"
                        >
                          <FaFileExcel className="w-4 h-4 mr-2" />
                          Exporter la page actuelle
                        </button>
                        <button
                          onClick={() => exportToExcel(true)}
                          className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                            isDarkMode
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          role="menuitem"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                          Exporter toutes les transactions filtrées
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className={`h-5 w-5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchQuery}
                onChange={handleSearch}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                } transition-all duration-200 focus:outline-none focus:ring-2`}
              />
            </div>

            {/* Filtres */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-b py-4 mt-2 mb-2 border-gray-200 dark:border-gray-700"
              >
                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Refusé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={handleTypeFilter}
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les types</option>
                    <option value="purchase">Achat</option>
                    <option value="virtual">Achat des virtuels</option>
                    <option value="sale">Vente</option>
                    <option value="withdrawal">Retrait</option>
                    <option value="commission de parrainage">
                      Commission de parrainage
                    </option>
                    <option value="commission de retrait">
                      Commission de retrait
                    </option>
                    <option value="remboursement">Remboursement</option>
                    <option value="transfer">Transfert</option>
                    <option value="reception">Réception</option>
                    <option value="bonus">Points bonus</option>
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Période
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={handleDateFilter("startDate")}
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                      } transition-all duration-200`}
                    />
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={handleDateFilter("endDate")}
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                      } transition-all duration-200`}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="overflow-x-auto mt-4">
            {currentTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Type
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Montant
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Statut
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Date
                    </th>
                    {hasActionableTransactions && (
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode ? "divide-gray-700" : "divide-gray-200"
                  }`}
                >
                  {currentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`${
                        isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      } transition-colors duration-150`}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        } cursor-pointer`}
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        {transaction.type === "withdrawal"
                          ? "Retrait"
                          : transaction.type === "purchase"
                          ? "Achat"
                          : transaction.type === "virtual"
                          ? "Virtuels"
                          : transaction.type === "reception"
                          ? "Dépot des fonds"
                          : transaction.type === "transfer"
                          ? "Transfert des fonds"
                          : transaction.type === "remboursement"
                          ? "Remboursement"
                          : transaction.type === "sale"
                          ? "Vente"
                          : transaction.type}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          transaction.type === "withdrawal" ||
                          transaction.type === "purchase" ||
                          transaction.type === "transfer"
                            ? "text-red-500"
                            : "text-green-500"
                        } cursor-pointer`}
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        {transaction.type === "withdrawal" ||
                        transaction.type === "purchase" ||
                        transaction.type === "transfer"
                          ? "-"
                          : "+"}
                        {transaction.amount}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status === "pending"
                            ? "en attente"
                            : transaction.status === "approved"
                            ? "approuvé"
                            : transaction.status === "rejected"
                            ? "rejeté"
                            : transaction.status === "cancelled"
                            ? "annulé"
                            : transaction.status === "completed"
                            ? "completé"
                            : "inconnu"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        } cursor-pointer`}
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        {formatDate(transaction.created_at)}
                      </td>
                      {hasActionableTransactions && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.type === "withdrawal" &&
                            transaction.status === "pending" &&
                            transaction.metadata?.withdrawal_request_id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(
                                    transaction.metadata.withdrawal_request_id
                                  );
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Annuler
                              </button>
                            )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                {transactions.length === 0
                  ? "Aucune transaction n'a été trouvée"
                  : "Aucune transaction ne correspond aux filtres sélectionnés"}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && filteredTransactions.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 p-2 sm:p-4">
              {/* Bouton Précédent */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? `${
                        isDarkMode
                          ? "bg-gray-700 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                      } cursor-not-allowed`
                    : `${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`
                }`}
                aria-label="Page précédente"
              >
                <span className="hidden sm:inline">Précédent</span>
                <span className="sm:hidden">&laquo;</span>
              </button>

              {/* Pagination adaptative */}
              {(() => {
                // Logique pour afficher un nombre limité de boutons de page sur mobile
                const maxButtonsToShow = window.innerWidth < 640 ? 3 : 7;
                let startPage = 1;
                let endPage = totalPages;

                if (totalPages > maxButtonsToShow) {
                  // Calculer la plage de pages à afficher
                  const halfButtons = Math.floor(maxButtonsToShow / 2);
                  startPage = Math.max(1, currentPage - halfButtons);
                  endPage = Math.min(
                    totalPages,
                    startPage + maxButtonsToShow - 1
                  );

                  // Ajuster si on est proche de la fin
                  if (endPage - startPage + 1 < maxButtonsToShow) {
                    startPage = Math.max(1, endPage - maxButtonsToShow + 1);
                  }
                }

                const pageButtons = [];

                // Première page si nécessaire
                if (startPage > 1) {
                  pageButtons.push(
                    <button
                      key="first"
                      onClick={() => setCurrentPage(1)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      aria-label="Première page"
                    >
                      1
                    </button>
                  );

                  // Ellipsis si nécessaire
                  if (startPage > 2) {
                    pageButtons.push(
                      <span key="ellipsis1" className="px-1 text-gray-500">
                        ...
                      </span>
                    );
                  }
                }

                // Pages numériques
                for (let i = startPage; i <= endPage; i++) {
                  pageButtons.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors ${
                        currentPage === i
                          ? `${
                              isDarkMode ? "bg-blue-600" : "bg-blue-500"
                            } text-white`
                          : `${
                              isDarkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`
                      }`}
                      aria-label={`Page ${i}`}
                      aria-current={currentPage === i ? "page" : undefined}
                    >
                      {i}
                    </button>
                  );
                }

                // Ellipsis et dernière page si nécessaire
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pageButtons.push(
                      <span key="ellipsis2" className="px-1 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  pageButtons.push(
                    <button
                      key="last"
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      aria-label={`Dernière page (${totalPages})`}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pageButtons;
              })()}

              {/* Bouton Suivant */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? `${
                        isDarkMode
                          ? "bg-gray-700 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                      } cursor-not-allowed`
                    : `${
                        isDarkMode
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white`
                }`}
                aria-label="Page suivante"
              >
                <span className="hidden sm:inline">Suivant</span>
                <span className="sm:hidden">&raquo;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation d'annulation */}
      {showCancelModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowCancelModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  className={`text-lg font-medium mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Confirmer l'annulation
                </h3>
                <p
                  className={`mb-6 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Êtes-vous sûr de vouloir annuler cette demande de retrait ?
                  Cette action est irréversible.
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCancelModal(false)}
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelWithdrawal}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      {/* Modal de détails de transaction */}
      {showTransactionDetails &&
        selectedTransaction &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className={`relative p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Détails de la transaction
                </h3>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div
                className={`mb-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                } overflow-y-auto max-h-[60vh]`}
              >
                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ID de transaction
                    </p>
                    <p className="font-medium">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Type de transaction
                    </p>
                    <p className="font-medium capitalize">
                      {selectedTransaction.type === "withdrawal"
                        ? "retrait"
                        : selectedTransaction.type === "purchase"
                        ? "achat"
                        : selectedTransaction.type === "virtual"
                        ? "Virtuels"
                        : selectedTransaction.type === "transfer"
                        ? "Transfert des fonds"
                        : selectedTransaction.type === "reception"
                        ? "Réception des fonds"
                        : "commission"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Montant de la transaction
                    </p>
                    <p
                      className={`font-medium ${
                        selectedTransaction.type === "withdrawal" ||
                        selectedTransaction.type === "purchase"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {selectedTransaction.type === "withdrawal" ||
                      selectedTransaction.type === "purchase"
                        ? "-"
                        : "+"}
                      {selectedTransaction.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Statut de la transaction
                    </p>
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(
                        selectedTransaction.status
                      )}`}
                    >
                      {selectedTransaction.status === "pending"
                        ? "En attente"
                        : selectedTransaction.status === "approved"
                        ? "Approuvé"
                        : selectedTransaction.status === "rejected"
                        ? "Refusé"
                        : selectedTransaction.status === "completed"
                        ? "Completé"
                        : selectedTransaction.status === "failed"
                        ? "échouée"
                        : selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Date de la transaction
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Dernière mise à jour
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Métadonnées */}
                {selectedTransaction.metadata &&
                  Object.keys(selectedTransaction.metadata).length > 0 && (
                    <div>
                      <h4
                        className={`text-lg font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Informations supplémentaires
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        {Object.entries(selectedTransaction.metadata).map(
                          ([key, value]) => {
                            // Traduire les clés en français
                            const frenchLabels = {
                              withdrawal_request_id:
                                "Identifiant de la demande de retrait",
                              payment_method: "Méthode de paiement",
                              montant_a_retirer: "Montant à retirer",
                              fee_percentage: "Pourcentage de frais",
                              frais_de_retrait: "Frais de retrait",
                              frais_de_commission: "Frais de commission",
                              montant_total_a_payer: "Montant total à payer",
                              devise: "Dévise choisie pour le retrait",
                              payment_details: "Détails du paiement",
                              status: "Statut",
                              source: "Source",
                              type: "Type",
                              amount: "Montant",
                              currency: "Devise",
                              description: "Description",
                              reference: "Référence",
                            };

                            const label =
                              frenchLabels[key] ||
                              key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());

                            // Formater la valeur selon son type
                            let formattedValue = value;

                            // Traduction des statuts
                            if (key === "status" || key.endsWith("_status")) {
                              if (value === "pending")
                                formattedValue = "En attente";
                              else if (value === "approved")
                                formattedValue = "Approuvé";
                              else if (value === "rejected")
                                formattedValue = "Rejeté";
                              else if (
                                value === "cancelled" ||
                                value === "canceled"
                              )
                                formattedValue = "Annulé";
                              else if (value === "completed")
                                formattedValue = "Complété";
                              else if (value === "failed")
                                formattedValue = "Échoué";
                            }

                            // Ajout de symboles pour les valeurs monétaires
                            if (
                              key === "amount" ||
                              key === "montant_a_retirer" ||
                              key === "frais_de_retrait" ||
                              key === "frais_de_commission" ||
                              key === "montant_total_a_payer" ||
                              key.includes("montant") ||
                              key.includes("amount")
                            ) {
                              formattedValue = `${value} $`;
                            }

                            // Ajout de symboles pour les pourcentages
                            if (
                              key === "fee_percentage" ||
                              key.includes("percentage") ||
                              key.includes("pourcentage")
                            ) {
                              formattedValue = `${value} %`;
                            }

                            return (
                              <div key={key} className="mb-2">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                                  {label}
                                </p>
                                <p className="font-medium break-words">
                                  {typeof formattedValue === "object"
                                    ? JSON.stringify(formattedValue, null, 2)
                                    : String(formattedValue)}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Modal de retrait */}
      {showWithdrawalForm &&
        createPortal(
          <div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
            onClick={() => setShowWithdrawalForm(false)}
          >
            <div
              className={`max-w-md w-full relative z-[51] ${
                isDarkMode ? "shadow-2xl" : "shadow-xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <WithdrawalForm
                walletId={selectedWalletForWithdrawal?.id}
                walletType={selectedWalletForWithdrawal?.type}
                onClose={() => setShowWithdrawalForm(false)}
              />
            </div>
          </div>,
          document.body
        )}
      {/* Modal d'historique des points bonus */}
      {showBonusPointsHistory &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowBonusPointsHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* En-tête du modal - toujours visible */}
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Historique des points bonus
                  </h2>
                  <button
                    onClick={() => setShowBonusPointsHistory(false)}
                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Contenu avec défilement - un seul conteneur avec overflow */}
                <div className="overflow-y-auto pr-2 max-h-[60vh] modal-scrollbar">
                  {bonusPointsHistory.length > 0 ? (
                    bonusPointsHistory.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`mb-4 p-3 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Description
                            </p>
                            <p className="font-medium">{entry.description}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              entry.type === "gain"
                                ? isDarkMode
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : isDarkMode
                                ? "bg-yellow-900 text-yellow-300"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {entry.type === "gain" ? "+" : "-"}
                            {Math.abs(entry.points)} points
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p
                        className={`${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Aucun historique disponible
                      </p>
                    </div>
                  )}
                </div>

                {/* Pied du modal - toujours visible */}
                <div className="flex justify-end mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBonusPointsHistory(false)}
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Fermer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      {/* Modal de conversion des points bonus */}
      {showConversionModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowConversionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4 overflow-y-auto modal-scrollbar pr-2 max-h-[calc(90vh-140px)]">
                  <div className="flex justify-between items-center">
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Conversion des points bonus
                    </h2>
                    <button
                      onClick={() => setShowConversionModal(false)}
                      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[60vh] space-y-4">
                    <div
                      className={`p-4 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <div className="mb-3">
                        <h3
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {selectedPackInfo.packName}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Points disponibles
                          </p>
                          <p
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {selectedPackInfo.availablePoints}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Valeur par point
                          </p>
                          <p
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {selectedPackInfo.pointValue} $
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-3">
                      <h3
                        className={`text-lg font-medium text-center mb-3 ${
                          isDarkMode ? "text-yellow-400" : "text-yellow-600"
                        }`}
                      >
                        Combien de points voulez-vous convertir ?
                      </h3>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          max={selectedPackInfo.availablePoints}
                          value={pointsToConvert}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 1) {
                              setPointsToConvert(1);
                            } else if (
                              value > selectedPackInfo.availablePoints
                            ) {
                              setPointsToConvert(
                                selectedPackInfo.availablePoints
                              );
                            } else {
                              setPointsToConvert(value);
                            }
                          }}
                          placeholder="0"
                          className={`w-full px-4 py-3 rounded-md text-center text-lg font-bold ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              : "border-gray-300 text-gray-900 placeholder-gray-500"
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Valeur estimée:{" "}
                          <span className="font-bold">
                            {(
                              pointsToConvert * selectedPackInfo.pointValue
                            ).toFixed(2)}{" "}
                            $
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowConversionModal(false)}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      Annuler
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleConvertPoints(
                          selectedPackForConversion,
                          pointsToConvert
                        )
                      }
                      className={`px-4 py-2 rounded-md flex items-center ${
                        isDarkMode
                          ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                          : "bg-yellow-500 hover:bg-yellow-600 text-white"
                      }`}
                    >
                      <FaExchangeAlt className="mr-2" />
                      Convertir
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      {/* Modal de transfert de fonds */}
      {showTransferModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowTransferModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden ${
                  isDarkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-5 overflow-y-auto modal-scrollbar pr-2 max-h-[calc(90vh-140px)]">
                  <div className="flex justify-between items-center border-b pb-3 mb-2">
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <FaExchangeAlt className="inline-block mr-2 text-blue-500" />
                      Transférer des fonds
                    </h2>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className={`p-1.5 rounded-full transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                          : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>

                  <div
                    className={`p-4 rounded-lg shadow-sm ${
                      isDarkMode ? "bg-gray-700/70" : "bg-blue-50"
                    } border ${
                      isDarkMode ? "border-blue-800" : "border-blue-200"
                    }`}
                  >
                    <div className="mb-1">
                      <h3
                        className={`font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Solde disponible
                      </h3>
                      <p
                        className={`text-2xl font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {userWallet.balance}{" "}
                        <span className="text-sm font-normal">USD</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label
                        htmlFor="recipient_account_id"
                        className={`block text-sm font-medium mb-1.5 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <FaUser className="inline-block mr-1.5 text-blue-500" />
                        Identifiant du compte destinataire
                      </label>
                      <input
                        type="text"
                        id="recipient_account_id"
                        value={transferData.recipient_account_id}
                        onChange={(e) =>
                          setTransferData({
                            ...transferData,
                            recipient_account_id: e.target.value,
                          })
                        }
                        placeholder="Entrez l'identifiant du compte"
                        className={`w-full px-4 py-2.5 rounded-md border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                            : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        } transition-colors focus:outline-none focus:ring-2`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="amount"
                        className={`block text-sm font-medium mb-1.5 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <FaDollarSign className="inline-block mr-1.5 text-green-500" />
                        Montant à transférer
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="amount"
                          min="1"
                          step="0.01"
                          max={userWallet.balance}
                          value={transferData.amount}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) {
                              setTransferData({ ...transferData, amount: "" });
                              setTransferFeeAmount(0);
                              setTransferCommissionAmount(0);
                              setTotalFeeAmount(0);
                            } else if (value > userWallet.balance) {
                              setTransferData({
                                ...transferData,
                                amount: userWallet.balance.toString(),
                              });
                              // Calculer les frais pour le montant maximum
                              const feeAmount =
                                userWallet.balance *
                                (transferFeePercentage / 100);
                              const commissionAmount =
                                userWallet.balance *
                                (transferCommissionPercentage / 100);
                              setTransferFeeAmount(feeAmount);
                              setTransferCommissionAmount(commissionAmount);
                              setTotalFeeAmount(feeAmount + commissionAmount);
                            } else {
                              setTransferData({
                                ...transferData,
                                amount: e.target.value,
                              });
                              // Calculer les frais pour le montant saisi
                              const feeAmount =
                                value * (transferFeePercentage / 100);
                              const commissionAmount =
                                value * (transferCommissionPercentage / 100);
                              setTransferFeeAmount(feeAmount);
                              setTransferCommissionAmount(commissionAmount);
                              setTotalFeeAmount(feeAmount + commissionAmount);
                            }
                          }}
                          placeholder="0.00"
                          className={`w-full px-4 py-3 rounded-md text-center text-lg font-bold ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
                              : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500"
                          } transition-colors focus:outline-none focus:ring-2`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } font-medium`}
                          >
                            USD
                          </span>
                        </div>
                      </div>
                    </div>

                    {(transferFeePercentage > 0 ||
                      transferCommissionPercentage > 0) &&
                      transferData.amount && (
                        <div
                          className={`p-4 rounded-md shadow-sm ${
                            isDarkMode ? "bg-gray-700/70" : "bg-gray-100"
                          }`}
                        >
                          {transferFeePercentage > 0 && (
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                } flex items-center`}
                              >
                                <FaPercent className="inline-block mr-1.5 text-amber-500 h-3 w-3" />
                                Frais de transfert ({transferFeePercentage}%):
                              </span>
                              <span className="font-medium">
                                {transferFeeAmount.toFixed(2)} USD
                              </span>
                            </div>
                          )}

                          {transferCommissionPercentage > 0 && (
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                } flex items-center`}
                              >
                                <FaPercent className="inline-block mr-1.5 text-blue-500 h-3 w-3" />
                                Frais de commission (
                                {transferCommissionPercentage}%):
                              </span>
                              <span className="font-medium">
                                {transferCommissionAmount.toFixed(2)} USD
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                            <span
                              className={`font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              Montant total:
                            </span>
                            <span
                              className={`font-bold text-lg ${
                                isDarkMode ? "text-green-400" : "text-green-600"
                              }`}
                            >
                              {(
                                parseFloat(transferData.amount) + totalFeeAmount
                              ).toFixed(2)}{" "}
                              USD
                            </span>
                          </div>
                        </div>
                      )}

                    <div>
                      <label
                        htmlFor="description"
                        className={`block text-sm font-medium mb-1.5 flex items-center justify-between ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        <div>
                          <FaFileAlt className="inline-block mr-1.5 text-gray-500" />
                          Description
                        </div>
                        <span
                          className={`text-xs italic ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Optionnel
                        </span>
                      </label>
                      <textarea
                        id="description"
                        value={transferData.description}
                        onChange={(e) =>
                          setTransferData({
                            ...transferData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Ajoutez une description pour ce transfert (optionnel)"
                        rows="3"
                        className={`w-full px-4 py-2.5 rounded-md border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                            : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        } transition-colors focus:outline-none focus:ring-2`}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowTransferModal(false)}
                    className={`px-4 py-2.5 rounded-md transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <FaTimes className="inline-block mr-1.5 h-3 w-3" />
                    Annuler
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchRecipientInfo}
                    disabled={transferLoading}
                    className={`px-4 py-2.5 rounded-md flex items-center transition-colors ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    } ${
                      transferLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {transferLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <FaExchangeAlt className="mr-2" />
                        Continuer
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      {/* Modal de confirmation de transfert */}
      {showConfirmTransferModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowConfirmTransferModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden ${
                  isDarkMode
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-5 overflow-y-auto modal-scrollbar pr-2 max-h-[calc(90vh-140px)]">
                  <div className="flex justify-between items-center border-b pb-3 mb-2">
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <FaCheckCircle className="inline-block mr-2 text-green-500" />
                      Confirmer le transfert
                    </h2>
                    <button
                      onClick={() => {
                        setShowConfirmTransferModal(false);
                        setShowTransferModal(true); // Réouvrir le modal de transfert si l'utilisateur annule
                      }}
                      className={`p-1.5 rounded-full transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                          : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                    } border ${
                      isDarkMode ? "border-blue-800" : "border-blue-200"
                    }`}
                  >
                    <p
                      className={`text-center font-medium ${
                        isDarkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      Vous êtes sur le point de faire un transfert de{" "}
                      <span className="font-bold">
                        {parseFloat(transferData.amount).toFixed(2)} USD
                      </span>{" "}
                      à <span className="font-bold">{recipientInfo.name}</span>
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-gray-700/70" : "bg-gray-100"
                    }`}
                  >
                    <h3
                      className={`font-medium mb-3 flex items-center ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      <FaUser className="mr-2 text-blue-500" />
                      Informations du destinataire
                    </h3>
                    <ul className="space-y-2.5">
                      <li className="flex justify-between">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Account ID:
                        </span>
                        <span className="font-medium">
                          {recipientInfo.account_id}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Nom:
                        </span>
                        <span className="font-medium">
                          {recipientInfo.name}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Téléphone:
                        </span>
                        <span className="font-medium">
                          {recipientInfo.phone || "Non disponible"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          WhatsApp:
                        </span>
                        <span className="font-medium">
                          {recipientInfo.whatsapp || "Non disponible"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Adresse:
                        </span>
                        <span className="font-medium">
                          {recipientInfo.address || "Non disponible"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {(transferFeePercentage > 0 ||
                    transferCommissionPercentage > 0) && (
                    <div
                      className={`p-4 rounded-lg ${
                        isDarkMode ? "bg-gray-700/70" : "bg-gray-100"
                      }`}
                    >
                      <h3
                        className={`font-medium mb-3 flex items-center ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <FaMoneyBillWave className="mr-2 text-green-500" />
                        Détails du transfert
                      </h3>
                      <ul className="space-y-2.5">
                        <li className="flex justify-between">
                          <span
                            className={
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Montant:
                          </span>
                          <span className="font-medium">
                            {parseFloat(transferData.amount).toFixed(2)} USD
                          </span>
                        </li>
                        {transferFeePercentage > 0 && (
                          <li className="flex justify-between">
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Frais de transfert ({transferFeePercentage}%):
                            </span>
                            <span className="font-medium">
                              {transferFeeAmount.toFixed(2)} USD
                            </span>
                          </li>
                        )}
                        {transferCommissionPercentage > 0 && (
                          <li className="flex justify-between">
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Frais de commission (
                              {transferCommissionPercentage}%):
                            </span>
                            <span className="font-medium">
                              {transferCommissionAmount.toFixed(2)} USD
                            </span>
                          </li>
                        )}
                        <li className="flex justify-between font-medium border-t pt-2 mt-2">
                          <span
                            className={
                              isDarkMode ? "text-gray-300" : "text-gray-800"
                            }
                          >
                            Total:
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              isDarkMode ? "text-green-400" : "text-green-600"
                            }`}
                          >
                            {(
                              parseFloat(transferData.amount) + totalFeeAmount
                            ).toFixed(2)}{" "}
                            USD
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"
                    } border ${
                      isDarkMode ? "border-yellow-800" : "border-yellow-200"
                    }`}
                  >
                    <p
                      className={`mb-3 ${
                        isDarkMode ? "text-yellow-300" : "text-yellow-700"
                      }`}
                    >
                      <FaLock className="inline-block mr-1.5" />
                      Si les informations ci-dessus sont correctes, veuillez
                      confirmer le transfert en insérant votre mot de passe.
                    </p>
                    <input
                      type="password"
                      value={transferData.password}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Entrez votre mot de passe"
                      className={`w-full px-4 py-2.5 rounded-md border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-500 focus:border-yellow-500"
                          : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-yellow-500 focus:border-yellow-500"
                      } transition-colors focus:outline-none focus:ring-2`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowConfirmTransferModal(false);
                      setShowTransferModal(true); // Réouvrir le modal de transfert si l'utilisateur annule
                    }}
                    className={`px-4 py-2.5 rounded-md transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <FaArrowLeft className="inline-block mr-1.5 h-3 w-3" />
                    Retour
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTransferFunds}
                    disabled={transferLoading}
                    className={`px-4 py-2.5 rounded-md flex items-center transition-colors ${
                      isDarkMode
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    } ${
                      transferLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {transferLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2" />
                        Confirmer le transfert
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

      {/* Modal d'achat de virtuel */}
      {showVirtualPurchaseForm &&
        createPortal(
          <VirtualPurchaseForm
            onClose={() => {
              setShowVirtualPurchaseForm(false);
              // Rafraîchir les données du wallet après un achat réussi
              fetchWalletData();
            }}
          />,
          document.body
        )}

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
