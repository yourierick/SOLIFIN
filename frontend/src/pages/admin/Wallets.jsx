import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import axios from "axios";
import Notification from "../../components/Notification";
import WithdrawalForm from "../../components/WithdrawalForm";
import FundsTransferModal from "../../components/FundsTransferModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  CreditCardIcon,
  CircleStackIcon,
  CurrencyEuroIcon,
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
  FaPercentage,
} from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Alert,
} from "@mui/material";

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
  const { selectedCurrency, isCDFEnabled } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [user, setUser] = useState(null);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [systemTransactions, setSystemTransactions] = useState([]);
  const [adminWallet, setAdminWallet] = useState(null);
  const [systemWallet, setSystemWallet] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  
  // États pour la pagination Material-UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("system"); // 'system' ou 'admin'
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
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

  // Effet pour recharger les données lorsque les filtres changent
  useEffect(() => {
    setPage(0);
    fetchWalletData();
  }, [searchTerm, statusFilter, typeFilter, dateFilter, activeTab]);

  // Effet pour recharger les données lorsque la pagination change
  useEffect(() => {
    fetchWalletData();
  }, [page, rowsPerPage]);

  // Effet pour recharger les données lorsque la devise change
  useEffect(() => {
    if (selectedCurrency) {
      setPage(0); // Réinitialiser la page au changement de devise
      fetchWalletData();
    }
  }, [selectedCurrency]);

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
      const params = new URLSearchParams({
        page: page + 1, // Material-UI uses 0-based indexing
        per_page: rowsPerPage,
        currency: selectedCurrency,
        status: statusFilter || 'all',
        type: typeFilter || 'all',
        search: searchTerm || '',
        start_date: dateFilter.startDate || '',
        end_date: dateFilter.endDate || '',
      });

      const response = await axios.get(`/api/admin/wallets/data?${params}`);
      if (response.data.success) {
        setAdminWallet(response.data.adminWallet);
        setSystemWallet(response.data.systemWallet);
        setUser(response.data.adminWallet.user);
        setAdminTransactions(response.data.adminwallettransactions || []);
        setSystemTransactions(response.data.systemwallettransactions || []);
        
        // Utiliser le total correct selon l'onglet actif
        const totalForActiveTab = activeTab === 'admin' 
          ? response.data.totalAdminTransactions 
          : response.data.totalSystemTransactions;
        setTotalTransactions(totalForActiveTab || 0);
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

  // Gestionnaires de pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setPage(0); // Réinitialiser la pagination lors du changement de filtre
  };

  const handleDateFilter = (field) => (e) => {
    setDateFilter((prev) => ({ ...prev, [field]: e.target.value }));
    setPage(0); // Réinitialiser la pagination lors du changement de filtre
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
    setSelectedWalletForWithdrawal({ id: walletId, type, adminWallet });
    setShowWithdrawalForm(true);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  // La fonction fetchRecipientInfo a été supprimée car elle est maintenant gérée par le composant FundsTransferModal

  // La fonction fetchTransferFees a été supprimée car elle est maintenant gérée par le composant FundsTransferModal

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

  // Filtrer les transactions selon l'onglet actif (le backend gère déjà la pagination et les filtres)
  const transactions =
    activeTab === "admin" ? adminTransactions || [] : systemTransactions || [];

  // Utiliser directement les transactions du backend (déjà paginées et filtrées)
  const currentTransactions = transactions;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
            <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              <span className="hidden sm:inline">
                Gestion des portefeuilles
              </span>
              <span className="sm:hidden">Portefeuilles</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Gérez vos transactions et retraits
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className={`p-2 sm:p-2.5 rounded-lg shadow-md transition-all duration-200 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <ArrowPathIcon
              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                loading ? "animate-spin" : ""
              } ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Portefeuilles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Portefeuille Admin */}
        {adminWallet && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden rounded-2xl shadow-xl ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                : "bg-gradient-to-br from-white to-gray-50"
            } border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            {/* Badge décoratif */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -mr-16 -mt-16"></div>

            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <CurrencyDollarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Mon portefeuille
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${
                          selectedCurrency === 'USD' 
                            ? 'from-blue-600 to-blue-500' 
                            : 'from-green-600 to-green-500'
                        } bg-clip-text text-transparent`}
                      >
                        {parseFloat(
                          selectedCurrency === 'USD' 
                            ? adminWallet.balance_usd || 0
                            : adminWallet.balance_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {selectedCurrency === 'USD' ? '$' : 'FC'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques de la devise sélectionnée */}
              <div className="mb-4 sm:mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    selectedCurrency === 'USD'
                      ? isDarkMode
                        ? "bg-blue-900/20 border border-blue-800/30"
                        : "bg-blue-50 border border-blue-200"
                      : isDarkMode
                        ? "bg-green-900/20 border border-green-800/30"
                        : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${
                      selectedCurrency === 'USD' ? 'bg-blue-500/20' : 'bg-green-500/20'
                    }`}>
                      {selectedCurrency === 'USD' ? (
                        <FaDollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FaMoneyBillWave className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <h4
                      className={`text-sm font-semibold ${
                        selectedCurrency === 'USD'
                          ? isDarkMode ? "text-blue-300" : "text-blue-700"
                          : isDarkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      Statistiques {selectedCurrency}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total gagné
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {parseFloat(
                          selectedCurrency === 'USD'
                            ? adminWallet.total_earned_usd || 0
                            : adminWallet.total_earned_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {selectedCurrency === 'USD' ? '$' : 'FC'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total retiré
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        {parseFloat(
                          selectedCurrency === 'USD'
                            ? adminWallet.total_withdrawn_usd || 0
                            : adminWallet.total_withdrawn_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {selectedCurrency === 'USD' ? '$' : 'FC'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => handleWithdrawalClick(adminWallet.id, "admin")}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <BanknotesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Faire un retrait</span>
                  <span className="sm:hidden">Retrait</span>
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                      : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                  }`}
                >
                  <FaExchangeAlt className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Transférer</span>
                  <span className="sm:hidden">Transférer</span>
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
            className={`relative overflow-hidden rounded-2xl shadow-xl ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                : "bg-gradient-to-br from-white to-gray-50"
            } border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            {/* Badge décoratif */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -mr-16 -mt-16"></div>

            <div className="p-4 sm:p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <CircleStackIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Portefeuille Système
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent`}
                      >
                        {parseFloat(
                          systemWallet.balance_usd || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        $
                      </p>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        |
                      </span>
                      <p
                        className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent`}
                      >
                        {parseFloat(
                          systemWallet.balance_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        FC
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid des statistiques par devise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Section USD */}
                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode
                      ? "bg-green-900/20 border border-green-800/30"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <FaDollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      Mouvements USD
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total entré
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {parseFloat(
                          systemWallet.total_in_usd || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        $
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total sorti
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-orange-400" : "text-orange-600"
                        }`}
                      >
                        {parseFloat(
                          systemWallet.total_out_usd || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        $
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section CDF */}
                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode
                      ? "bg-emerald-900/20 border border-emerald-800/30"
                      : "bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <FaMoneyBillWave className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDarkMode ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      Mouvements CDF
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total entré
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {parseFloat(
                          systemWallet.total_in_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        FC
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Total sorti
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isDarkMode ? "text-orange-400" : "text-orange-600"
                        }`}
                      >
                        {parseFloat(
                          systemWallet.total_out_cdf || 0
                        ).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        FC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Historique des transactions */}
      <div
        className={`rounded-2xl shadow-xl overflow-hidden border ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
              <DocumentArrowDownIcon className="h-5 w-5 text-white" />
            </div>
            <h2
              className={`text-lg sm:text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Historique des transactions
            </h2>
          </div>

          {/* Navigation entre les onglets */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab("system")}
              className={`flex-1 sm:flex-none py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 ${
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
              <span className="hidden sm:inline">Portefeuille Système</span>
              <span className="sm:hidden">Système</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 sm:flex-none py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 ${
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
              <span className="hidden sm:inline">Portefeuille Personnel</span>
              <span className="sm:hidden">Personnel</span>
            </button>
          </div>

          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${
                    showFilters
                      ? isDarkMode
                        ? "bg-blue-900/50 text-blue-400 ring-1 ring-blue-500"
                        : "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={
                    showFilters ? "Masquer les filtres" : "Afficher les filtres"
                  }
                >
                  {showFilters ? (
                    <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FaFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                <button
                  onClick={() => exportToExcel(false)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                    isDarkMode
                      ? "bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-700/50"
                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  }`}
                  title="Exporter la page actuelle"
                >
                  <FaFileExcel className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Page actuelle
                  </span>
                </button>

                <button
                  onClick={() => exportToExcel(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-sm transition-all duration-200 ${
                    isDarkMode
                      ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-700/50"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  }`}
                  title="Exporter toutes les transactions filtrées"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline text-sm font-medium">
                    Tout exporter
                  </span>
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                } transition-all duration-200 focus:outline-none shadow-sm`}
              />
            </div>

            {/* Filtres */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-b py-4 mt-2 mb-2 border-gray-200 dark:border-gray-700"
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
                    <option value="pack_sale">Vente de pack</option>
                    <option value="renew_pack_sale">
                      Rénouvellement de pack
                    </option>
                    <option value="boost_sale">Boost de publication</option>
                    <option value="digital_product_sale">
                      Vente de produit numérique
                    </option>
                    <option value="virtual_sale">Vente des virtuels</option>
                    <option value="withdrawal">Retrait</option>
                    <option value="commission de parrainage">
                      Commission de parrainage
                    </option>
                    <option value="commission de retrait">
                      Commission de retrait
                    </option>
                    <option value="commission de transfert">
                      Commission de transfert
                    </option>
                    <option value="transfer">Transfert des fonds</option>
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

          {/* Tableau des transactions Material-UI */}
          <div className="mt-4">
            {currentTransactions.length > 0 ? (
              <Paper
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  boxShadow: isDarkMode
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead
                      sx={{
                        backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                      }}
                    >
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${
                              isDarkMode ? "#4b5563" : "#e5e7eb"
                            }`,
                          }}
                        >
                          Type
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${
                              isDarkMode ? "#4b5563" : "#e5e7eb"
                            }`,
                          }}
                        >
                          Montant
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${
                              isDarkMode ? "#4b5563" : "#e5e7eb"
                            }`,
                          }}
                        >
                          Statut
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${
                              isDarkMode ? "#4b5563" : "#e5e7eb"
                            }`,
                          }}
                        >
                          Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTransactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          onClick={() => handleTransactionClick(transaction)}
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                            },
                            borderBottom: `1px solid ${
                              isDarkMode ? "#4b5563" : "#e5e7eb"
                            }`,
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#ffffff" : "#111827",
                              py: 2,
                            }}
                          >
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-full ${
                                  transaction.type === "withdrawal"
                                    ? "bg-red-100 dark:bg-red-900"
                                    : transaction.type === "reception"
                                    ? "bg-green-100 dark:bg-green-900"
                                    : transaction.type === "transfer"
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : transaction.type === "remboursement"
                                    ? "bg-orange-100 dark:bg-orange-900"
                                    : transaction.type === "commission de retrait"
                                    ? "bg-yellow-100 dark:bg-yellow-900"
                                    : transaction.type === "commission de transfert"
                                    ? "bg-yellow-100 dark:bg-yellow-900"
                                    : transaction.type ===
                                      "commission de parrainage"
                                    ? "bg-yellow-100 dark:bg-yellow-900"
                                    : transaction.type === "digital_product_sale"
                                    ? "bg-green-100 dark:bg-green-800"
                                    : transaction.type === "pack_sale"
                                    ? "bg-green-100 dark:bg-green-800"
                                    : transaction.type === "boost_sale"
                                    ? "bg-green-100 dark:bg-green-800"
                                    : transaction.type === "renew_pack_sale"
                                    ? "bg-green-100 dark:bg-green-800"
                                    : transaction.type === "virtual_sale"
                                    ? "bg-green-100 dark:bg-green-800"
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
                                    : transaction.type ===
                                      "commission de parrainage"
                                    ? "Commission de parrainage"
                                    : transaction.type === "commission de retrait"
                                    ? "Commission de retrait"
                                    : transaction.type === "commission de transfert"
                                    ? "Commission de transfert"
                                    : transaction.type === "pack_sale"
                                    ? "Vente de pack"
                                    : transaction.type === "renew_pack_sale"
                                    ? "Rénouvellement de pack"
                                    : transaction.type === "boost_sale"
                                    ? "Boost de publication"
                                    : transaction.type === "virtual_sale"
                                    ? "Vente de virtuel"
                                    : transaction.type === "digital_product_sale"
                                    ? "Vente de produit numérique"
                                    : transaction.type}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color:
                                transaction.mouvment === "out"
                                  ? isDarkMode ? "#f87171" : "#dc2626"
                                  : isDarkMode ? "#34d399" : "#16a34a",
                              py: 2,
                              fontWeight: 500,
                            }}
                          >
                            {transaction.mouvment === "out" ? "-" : "+"}
                            {transaction.amount}{" "}
                            {transaction.currency === "USD" ? "$" : "FC"}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              py: 2,
                            }}
                          >
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
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              py: 2,
                            }}
                          >
                            {formatDate(transaction.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination Material-UI */}
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={totalTransactions}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                  }
                  sx={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                    borderTop: `1px solid ${
                      isDarkMode ? "#4b5563" : "#e5e7eb"
                    }`,
                    "& .MuiTablePagination-toolbar": {
                      color: isDarkMode ? "#d1d5db" : "#374151",
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                      {
                        color: isDarkMode ? "#d1d5db" : "#374151",
                      },
                    "& .MuiIconButton-root": {
                      color: isDarkMode ? "#d1d5db" : "#374151",
                    },
                  }}
                />
              </Paper>
            ) : (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  color: isDarkMode ? "#d1d5db" : "#374151",
                  "& .MuiAlert-icon": {
                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                  },
                }}
              >
                {transactions.length === 0
                  ? "Aucune transaction n'a été trouvée"
                  : "Aucune transaction ne correspond aux filtres sélectionnés"}
              </Alert>
            )}
          </div>
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
                        : selectedTransaction.type === "pack_sale"
                        ? "Achat de pack"
                        : selectedTransaction.type === "renew_pack_sale"
                        ? "Rénouvellement de pack"
                        : selectedTransaction.type === "boost_sale"
                        ? "Boost de publication"
                        : selectedTransaction.type === "virtual_sale"
                        ? "Vente de virtuel"
                        : selectedTransaction.type === "digital_product_sale"
                        ? "Vente de produits numériques"
                        : selectedTransaction.type === "transfer"
                        ? "Transfert des fonds"
                        : selectedTransaction.type === "reception"
                        ? "Réception des fonds"
                        : selectedTransaction.type ===
                          "commission de parrainage"
                        ? "Commission de parrainage"
                        : selectedTransaction.type === "commission de retrait"
                        ? "Commission de retrait"
                        : selectedTransaction.type === "commission de transfert"
                        ? "Commission de transfert"
                        : selectedTransaction.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Montant de la transaction
                    </p>
                    <p
                      className={`font-medium ${
                        selectedTransaction.mouvment === "out"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {selectedTransaction.mouvment === "out" ? "-" : "+"}
                      {selectedTransaction.amount}{" "}
                      {selectedTransaction.currency === "USD" ? "$" : "FC"}
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
                balance_usd={
                  selectedWalletForWithdrawal?.adminWallet?.balance_usd || 0
                }
                balance_cdf={
                  selectedWalletForWithdrawal?.adminWallet?.balance_cdf || 0
                }
                onClose={() => setShowWithdrawalForm(false)}
                onSuccess={() => {
                  // Mettre à jour les données des portefeuilles après un retrait réussi
                  // Utiliser un petit délai pour éviter les interférences avec la fermeture du modal
                  setTimeout(() => {
                    fetchWallets();
                  }, 100);
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Modal de transfert de fonds */}
      {showTransferModal && (
        <FundsTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            fetchWallets();
            toast.success("Transfert effectué avec succès");
          }}
          balance_usd={adminWallet?.balance_usd || 0}
          balance_cdf={adminWallet?.balance_cdf || 0}
          userInfo={user}
          isAdmin={true}
        />
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
