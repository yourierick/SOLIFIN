import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import Notification from "../../components/Notification";
import WithdrawalForm from "../../components/WithdrawalForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  WalletIcon,
  CurrencyEuroIcon,
  ArrowDownTrayIcon,
  PhoneIcon,
  CreditCardIcon,
  CircleStackIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { FaFilter, FaTimes, FaExchangeAlt, FaFileExcel } from "react-icons/fa";

const paymentMethods = [
  {
    id: "orange-money",
    name: "Orange Money",
    icon: PhoneIcon,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "airtel-money",
    name: "Airtel Money",
    icon: PhoneIcon,
    color: "from-red-500 to-red-600",
  },
  {
    id: "m-pesa",
    name: "M-Pesa",
    icon: PhoneIcon,
    color: "from-green-500 to-green-600",
  },
  {
    id: "visa",
    name: "Visa",
    icon: CreditCardIcon,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    icon: CreditCardIcon,
    color: "from-red-500 to-red-600",
  },
  {
    id: "paypal",
    name: "PayPal",
    icon: CurrencyEuroIcon,
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    icon: CircleStackIcon,
    color: "from-yellow-500 to-yellow-600",
  },
  {
    id: "credit-card",
    name: "Carte de crédit",
    icon: CreditCardIcon,
    color: "from-gray-600 to-gray-700",
  },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [systemTransactions, setSystemTransactions] = useState([]);
  const [adminWallet, setAdminWallet] = useState(null);
  const [systemWallet, setSystemWallet] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("system"); // 'system' ou 'admin'
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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, dateFilter, activeTab]);

  // Gérer le clic en dehors du menu d'exportation
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    // Ajouter l'écouteur d'événement lorsque le menu est ouvert
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/wallets/data");
      if (response.data.success) {
        setAdminWallet(response.data.adminWallet);
        setSystemWallet(response.data.systemWallet);
        // Séparer les transactions par type de portefeuille
        // const adminTxs = response.data.transactions.filter(tx => tx.wallet_type === 'admin');
        // const systemTxs = response.data.transactions.filter(tx => tx.wallet_type === 'system');
        setAdminTransactions(response.data.adminwallettransactions);
        setSystemTransactions(response.data.systemwallettransactions);
      }
    } catch (error) {
      Notification.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWalletData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
      case "completed":
        return isDarkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800";
      case "pending":
        return isDarkMode
          ? "bg-yellow-900 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "failed":
        return isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const handleWithdrawalClick = (walletId, type) => {
    setSelectedWalletForWithdrawal({ id: walletId, type });
    setShowWithdrawalForm(true);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleTransferFunds = async () => {
    // Validation des données
    if (!transferData.recipient_account_id.trim()) {
      toast.error("Veuillez entrer l'identifiant du compte destinataire");
      return;
    }

    if (!transferData.amount || parseFloat(transferData.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    if (parseFloat(transferData.amount) > adminWallet.balance) {
      toast.error("Montant insuffisant dans votre portefeuille");
      return;
    }

    if (!transferData.description.trim()) {
      toast.error("Veuillez entrer une description pour ce transfert");
      return;
    }

    if (!transferData.password.trim()) {
      toast.error(
        "Veuillez entrer votre mot de passe pour confirmer le transfert"
      );
      return;
    }

    try {
      setTransferLoading(true);

      const response = await axios.post(
        "/api/admin/wallet/funds-transfer",
        transferData
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Réinitialiser le formulaire
        setTransferData({
          recipient_account_id: "",
          amount: "",
          description: "",
          password: "",
        });
        // Fermer le modal
        setShowTransferModal(false);
        // Rafraîchir les données du portefeuille
        fetchWalletData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Erreur lors du transfert de fonds:", error);
      toast.error(
        error.response?.data?.message ||
          "Une erreur s'est produite lors du transfert"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const exportToExcel = (exportAll = false) => {
    // Fermer le menu d'exportation
    setShowExportMenu(false);

    // Déterminer quelles transactions exporter selon l'onglet actif
    const transactions =
      activeTab === "admin"
        ? adminTransactions || []
        : systemTransactions || [];

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

              formattedMetadata += `${frenchKey}: ${value}, `;
            });
          } else {
            // Si les métadonnées sont une chaîne JSON
            const metadataObj = JSON.parse(transaction.metadata);
            Object.entries(metadataObj).forEach(([key, value]) => {
              formattedMetadata += `${key}: ${value}, `;
            });
          }
        } catch (error) {
          formattedMetadata = String(transaction.metadata);
        }
      }

      return {
        ID: transaction.id,
        Type: transaction.type,
        Montant: transaction.amount,
        Statut: transaction.status,
        Détails: formattedMetadata,
        Date: formatDate(transaction.created_at),
      };
    });

    // Créer un classeur Excel
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Ajuster la largeur des colonnes
    const columnsWidth = [
      { wch: 10 }, // ID
      { wch: 15 }, // Type
      { wch: 15 }, // Montant
      { wch: 15 }, // Statut
      { wch: 50 }, // Détails
      { wch: 15 }, // Date
    ];
    worksheet["!cols"] = columnsWidth;

    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Nom du fichier avec date
    const fileName = `transactions_${
      activeTab === "admin" ? "admin" : "system"
    }_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Télécharger le fichier
    saveAs(data, fileName);

    // Notification de succès
    toast.success(
      `Export Excel réussi : ${dataToExport.length} transactions exportées`
    );
  };

  const handleClickOutside = (event) => {
    if (
      exportMenuRef.current &&
      !exportMenuRef.current.contains(event.target)
    ) {
      setShowExportMenu(false);
    }
  };

  // Filtrer les transactions selon l'onglet actif
  const transactions =
    activeTab === "admin" ? adminTransactions || [] : systemTransactions || [];

  // Filtrer les transactions selon les critères de recherche
  const filteredTransactions = transactions.filter((transaction) => {
    // Filtrer par type si un filtre est sélectionné
    if (typeFilter && typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }

    // Filtrer par statut si un filtre est sélectionné
    if (
      statusFilter &&
      statusFilter !== "all" &&
      transaction.status !== statusFilter
    ) {
      return false;
    }

    // Filtrer par recherche textuelle si une recherche est effectuée
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (transaction.id &&
          transaction.id.toString().toLowerCase().includes(searchLower)) ||
        (transaction.type &&
          transaction.type.toLowerCase().includes(searchLower)) ||
        (transaction.status &&
          transaction.status.toLowerCase().includes(searchLower)) ||
        (transaction.amount &&
          transaction.amount.toString().toLowerCase().includes(searchLower)) ||
        (transaction.created_at &&
          formatDate(transaction.created_at)
            .toLowerCase()
            .includes(searchLower))
      );
    }

    return true;
  });

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );

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
          Gestion des portefeuilles
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

      {/* Portefeuilles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portefeuille Admin */}
        {adminWallet && (
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
                    Mon portefeuille
                  </h3>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {adminWallet.balance}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total gagné: {adminWallet.total_earned}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total retiré: {adminWallet.total_withdrawn}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-2">
                <button
                  onClick={() => handleWithdrawalClick(adminWallet.id, "admin")}
                  className={`inline-flex items-center mr-2 px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Faire un retrait
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FaExchangeAlt className="h-5 w-5 mr-2" />
                  Transférer des fonds
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Portefeuille Système */}
        {systemWallet && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`p-6 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <WalletIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Portefeuille Système
                  </h3>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {systemWallet.balance}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total entré: {systemWallet.total_in}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Total retiré: {systemWallet.total_out}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Historique des transactions */}
      <div
        className={`rounded-lg shadow-lg overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-6">
          <h2
            className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Historique des transactions
          </h2>

          {/* Navigation entre les onglets */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab("system")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "system"
                  ? `border-b-2 border-blue-500 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`
                  : `${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`
              }`}
            >
              Portefeuille Système
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === "admin"
                  ? `border-b-2 border-blue-500 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`
                  : `${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`
              }`}
            >
              Portefeuille Personnel
            </button>
          </div>

          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2">
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
                value={searchTerm}
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
                    <option value="completed">Complété</option>
                    <option value="failed">Echoué</option>
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
                    <option value="sales">Achat</option>
                    <option value="withdrawal">Retrait</option>
                    <option value="commission de parrainage">
                      Commission de parrainage
                    </option>
                    <option value="commission de retrait">
                      Commission de retrait
                    </option>
                    <option value="bonus">Bonus</option>
                    <option value="transfer">Transfert</option>
                    <option value="reception">Réception</option>
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
                      onClick={() => handleTransactionClick(transaction)}
                      className={`cursor-pointer transition-colors ${
                        isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`p-2 rounded-full ${
                              transaction.type === "withdrawal"
                                ? "bg-red-100 dark:bg-red-900"
                                : transaction.type === "reception"
                                ? "bg-green-100 dark:bg-green-900"
                                : transaction.type === "transfer"
                                ? "bg-blue-100 dark:bg-blue-900"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            {transaction.type === "withdrawal" ? (
                              <ArrowDownTrayIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : transaction.type === "reception" ? (
                              <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : transaction.type === "transfer" ? (
                              <FaExchangeAlt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <CurrencyDollarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {transaction.type === "withdrawal"
                                ? "Retrait"
                                : transaction.type === "transfer"
                                ? "Transfert des fonds"
                                : transaction.type === "reception"
                                ? "Dépot des fonds"
                                : transaction.type === "commission"
                                ? "Commission"
                                : transaction.type === "sales"
                                ? "Vente"
                                : transaction.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          transaction.type === "withdrawal"
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {transaction.type === "withdrawal" ? "-" : "+"}
                        {transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status === "completed"
                            ? "complété"
                            : transaction.status === "pending"
                            ? "en attente"
                            : transaction.status === "failed"
                            ? "échoué"
                            : transaction.status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {formatDate(transaction.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                className={`text-center py-8 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {transactions.length === 0
                  ? "Aucune transaction n'a été trouvée"
                  : "Aucune transaction ne correspond aux filtres sélectionnés"}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && filteredTransactions.length > 0 && (
            <div className="flex justify-center gap-2 p-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
              >
                Précédent
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentPage === index + 1
                      ? `${
                          isDarkMode ? "bg-blue-600" : "bg-blue-500"
                        } text-white`
                      : `${
                          isDarkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails de transaction */}
      {showTransactionDetails &&
        selectedTransaction &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]"
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
                        : selectedTransaction.type === "sales"
                        ? "achat"
                        : selectedTransaction.type === "transfer"
                        ? "Transfert des fonds"
                        : selectedTransaction.type === "reception"
                        ? "Réception des fonds"
                        : selectedTransaction.type === "commission"
                        ? "commission"
                        : selectedTransaction.type === "deposit"
                        ? "dépôt"
                        : selectedTransaction.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Montant de la transaction
                    </p>
                    <p
                      className={`font-medium ${
                        selectedTransaction.type === "withdrawal" ||
                        selectedTransaction.type === "transfer" ||
                        selectedTransaction.type === "sales"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {selectedTransaction.type === "withdrawal" ||
                      selectedTransaction.type === "transfer" ||
                      selectedTransaction.type === "sales"
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
                        ? "Rejeté"
                        : selectedTransaction.status === "cancelled"
                        ? "Annulé"
                        : selectedTransaction.status === "completed"
                        ? "Complété"
                        : selectedTransaction.status === "failed"
                        ? "Échouée"
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
                              devise: "Devise choisie pour le retrait",
                              payment_details: "Détails du paiement",
                              status: "Statut",
                              source: "Source",
                              type: "Type",
                              amount: "Montant",
                              currency: "Devise",
                              description: "Description",
                              reference: "Référence",
                              recipient_id: "ID du destinataire",
                              sender_id: "ID de l'expéditeur",
                              recipient_account_id: "ID du compte destinataire",
                              sender_account_id: "ID du compte expéditeur",
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
                                formattedValue = "Échouée";
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
            className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              minHeight: "100vh",
              height: "100%",
            }}
          >
            <div className="max-w-md w-full relative z-[51]">
              <WithdrawalForm
                walletId={selectedWalletForWithdrawal?.id}
                walletType={selectedWalletForWithdrawal?.type}
                onClose={() => setShowWithdrawalForm(false)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Modal de transfert */}
      {showTransferModal &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className={`max-w-md w-full rounded-lg shadow-xl ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } p-6`}
              >
                <h2
                  className={`text-xl font-semibold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Transférer des fonds
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="recipient_account_id"
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      ID du compte destinataire
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
                      placeholder="Entrez l'ID du compte destinataire"
                      className={`w-full px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="amount"
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Montant à transférer
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="amount"
                        value={transferData.amount}
                        onChange={(e) =>
                          setTransferData({
                            ...transferData,
                            amount: e.target.value,
                          })
                        }
                        placeholder="Entrez le montant à transférer"
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-2 rounded-md ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                            : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }
                        >
                          $
                        </span>
                      </div>
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Solde disponible: {adminWallet?.balance || 0} $
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Description (optionnel)
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
                      placeholder="Ajoutez une description pour ce transfert"
                      rows="3"
                      className={`w-full px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    ></textarea>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={transferData.password}
                      onChange={(e) =>
                        setTransferData({
                          ...transferData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Mot de passe pour confirmer le transfert"
                      className={`w-full px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                          : "border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTransferModal(false)}
                    disabled={transferLoading}
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
                    onClick={handleTransferFunds}
                    disabled={transferLoading}
                    className={`px-4 py-2 rounded-md flex items-center ${
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
                        Transférer
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
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
