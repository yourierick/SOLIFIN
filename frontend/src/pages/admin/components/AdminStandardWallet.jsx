/* Dashboard pour les utilisateurs admin non super-admin */

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import axios from "axios";
import Notification from "../../../components/Notification";
import WithdrawalForm from "../../../components/WithdrawalForm";
import FundsTransferModal from "../../../components/FundsTransferModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../../../styles/tooltip.css";
import "../../../styles/custom-scrollbar.css";

// Import des icônes Heroicons
import {
  BanknotesIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Import des icônes FontAwesome
import {
  FaFilter,
  FaTimes,
  FaFileExcel,
  FaCheckCircle,
  FaTags,
  FaCalendarAlt,
  FaExchangeAlt,
  FaUser,
  FaWallet,
  FaMoneyBillWave,
  FaHistory,
} from "react-icons/fa";

export default function AdminStandardWallet() {
  const { isDarkMode } = useTheme();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [selectedWalletForWithdrawal, setSelectedWalletForWithdrawal] =
    useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  // Fonction pour formater les dates (sans l'heure)
  const formatDate = (dateString) => {
    try {
      // Si la chaîne est vide ou null, retourner une valeur par défaut
      if (!dateString) {
        return "Non définie";
      }

      // Si la date est déjà au format français (JJ/MM/AAAA ou JJ-MM-AAAA), la retourner telle quelle
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateString)) {
        // Normaliser le format pour utiliser des slashes
        return dateString.replace(/-/g, "/");
      }

      // Si c'est une date au format français avec heure (JJ/MM/AAAA HH:MM), extraire seulement la date
      if (
        /^\d{2}[\/\-]\d{2}[\/\-]\d{4} \d{2}:\d{2}(:\d{2})?$/.test(dateString)
      ) {
        // Extraire seulement la partie date (avant l'espace)
        return dateString.split(" ")[0].replace(/-/g, "/");
      }

      // Sinon, formater la date (format ISO ou timestamp)
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return "Date invalide";
    }
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString) => {
    try {
      // Si la chaîne est vide ou null
      if (!dateString) {
        return "";
      }

      // Si c'est une date au format français avec heure (JJ/MM/AAAA HH:MM)
      if (
        /^\d{2}[\/\-]\d{2}[\/\-]\d{4} \d{2}:\d{2}(:\d{2})?$/.test(dateString)
      ) {
        // Extraire seulement la partie heure (après l'espace)
        return dateString.split(" ")[1].split(":").slice(0, 2).join(":");
      }

      // Sinon, formater l'heure à partir d'une date ISO ou timestamp
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `à ${hours}h${minutes}`;
    } catch (error) {
      console.error("Erreur lors du formatage de l'heure:", error);
      return "";
    }
  };

  // Fonction pour tronquer le texte
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Fonction pour obtenir la couleur du statut de transaction
  const getTransactionStatusColor = (status) => {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-yellow-900/30 text-yellow-400"
          : "bg-yellow-100 text-yellow-800";
      case "approved":
      case "completed":
        return isDarkMode
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-800";
      case "rejected":
      case "failed":
        return isDarkMode
          ? "bg-red-900/30 text-red-400"
          : "bg-red-100 text-red-800";
      case "cancelled":
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-200 text-gray-700";
      default:
        return isDarkMode
          ? "bg-blue-900/30 text-blue-400"
          : "bg-blue-100 text-blue-800";
    }
  };

  // Effet pour fermer le menu d'exportation lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // Chargement des données
  // Fonction pour récupérer les données du portefeuille
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/userwallet/data");
      if (response.data.success) {
        setWallets(response.data.userWallet ? [response.data.userWallet] : []);
        setTransactions(response.data.transactions || []);
        // Stocker les informations utilisateur si nécessaire
        if (response.data.user) {
          // Vous pouvez ajouter un état pour stocker les informations utilisateur si nécessaire
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Gestion des filtres
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (field) => (e) => {
    setDateFilter((prev) => ({ ...prev, [field]: e.target.value }));
    setCurrentPage(1);
  };

  // Filtrage des transactions
  const filteredTransactions = transactions.filter((transaction) => {
    // Filtre de recherche
    const searchMatch =
      searchQuery === "" ||
      transaction.id.toString().includes(searchQuery) ||
      (transaction.description &&
        transaction.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      transaction.amount.toString().includes(searchQuery) ||
      transaction.type.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre de statut
    const statusMatch =
      statusFilter === "all" || transaction.status === statusFilter;

    // Filtre de type
    const typeMatch = typeFilter === "all" || transaction.type === typeFilter;

    // Filtre de date
    let dateMatch = true;
    if (dateFilter.startDate) {
      const transactionDate = new Date(transaction.created_at);
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      dateMatch = dateMatch && transactionDate >= startDate;
    }
    if (dateFilter.endDate) {
      const transactionDate = new Date(transaction.created_at);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateMatch = dateMatch && transactionDate <= endDate;
    }

    return searchMatch && statusMatch && typeMatch && dateMatch;
  });
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Gestion des transactions
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleWithdrawalClick = (wallet) => {
    setSelectedWalletForWithdrawal(wallet);
    setShowWithdrawalForm(true);
  };

  const handleTransferClick = () => {
    setShowTransferModal(true);
  };

  // Exportation Excel
  const exportToExcel = (exportAll) => {
    const dataToExport = exportAll ? filteredTransactions : currentTransactions;

    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map((transaction) => ({
        ID: transaction.id,
        Type: transaction.type,
        Montant: transaction.amount,
        Statut: transaction.status,
        Description: transaction.description || "",
        "Date de création": formatDate(transaction.created_at),
        "Dernière mise à jour": formatDate(transaction.updated_at),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `transactions_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    saveAs(data, fileName);
    setShowExportMenu(false);
    toast.success(
      `${dataToExport.length} transactions exportées avec succès !`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Une erreur est survenue: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Portefeuille utilisateur */}
      <div className="mb-8">
        <h1
          className={`text-2xl font-bold mb-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          <FaWallet className="inline-block mr-2 text-blue-500" />
          Votre portefeuille
        </h1>

        {wallets.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-full overflow-hidden"
          >
            {/* On affiche uniquement le premier portefeuille */}
            {(() => {
              const wallet = wallets[0]; // On prend seulement le premier portefeuille
              return (
                <motion.div
                  key={wallet.id}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  className={`rounded-xl overflow-hidden shadow-lg ${
                    isDarkMode
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white"
                  }`}
                >
                  <div
                    className={`p-6 ${
                      isDarkMode
                        ? "border-b border-gray-700"
                        : "border-b border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div
                        className={`p-3 rounded-full ${
                          isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                        }`}
                      >
                        <BanknotesIcon
                          className={`h-6 w-6 ${
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isDarkMode
                            ? "bg-green-900/30 text-green-400"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        Actif
                      </span>
                    </div>
                    <h3
                      className={`text-lg font-semibold mb-1 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {wallet.type === "standard"
                        ? "Portefeuille Standard"
                        : "Portefeuille Virtuel"}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      ID: {wallet.id}
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Solde disponible
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {wallet.balance} $
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Dernière mise à jour
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {formatDate(wallet.updated_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWithdrawalClick(wallet)}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg ${
                          isDarkMode
                            ? "bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800/50"
                            : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <FaMoneyBillWave className="h-4 w-4 mr-2" />
                        <span>Retrait</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTransferClick}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg ${
                          isDarkMode
                            ? "bg-purple-900/40 hover:bg-purple-800/60 text-purple-400 border border-purple-800/50"
                            : "bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200"
                        }`}
                      >
                        <FaExchangeAlt className="h-5 w-5" />
                        <span>Transfert</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        ) : (
          <div
            className={`text-center p-8 rounded-lg ${
              isDarkMode
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <p>Aucun portefeuille disponible</p>
          </div>
        )}
      </div>

      {/* Historique des transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`mt-8 sm:mt-10 rounded-xl shadow-lg overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* En-tête de la section transactions */}
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}
              >
                <DocumentTextIcon
                  className={`h-5 w-5 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </div>
              <h2
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Historique des transactions
              </h2>
              {filteredTransactions.length > 0 && (
                <span
                  className={`text-sm px-2.5 py-1 rounded-full ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {filteredTransactions.length}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  showFilters
                    ? isDarkMode
                      ? "bg-blue-900/50 text-blue-400 border border-blue-800"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-gray-700 border border-gray-700"
                    : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
                title={
                  showFilters ? "Masquer les filtres" : "Afficher les filtres"
                }
              >
                {showFilters ? (
                  <>
                    <FaTimes className="w-4 h-4" />
                    <span className="text-sm">Filtres</span>
                  </>
                ) : (
                  <>
                    <FaFilter className="w-4 h-4" />
                    <span className="text-sm">Filtres</span>
                  </>
                )}
              </motion.button>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isDarkMode
                      ? "text-gray-300 hover:bg-gray-700 border border-gray-700"
                      : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                  } ${
                    showExportMenu
                      ? isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                      : ""
                  }`}
                  title="Options d'exportation Excel"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <FaFileExcel className="w-4 h-4" />
                  <span className="text-sm">Exporter</span>
                  <svg
                    className="w-3 h-3"
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
                </motion.button>

                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg ${
                      isDarkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    } z-10`}
                    ref={exportMenuRef}
                  >
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <button
                        onClick={() => exportToExcel(false)}
                        className={`flex items-center w-full text-left px-4 py-2.5 text-sm ${
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
                        className={`flex items-center w-full text-left px-4 py-2.5 text-sm ${
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
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon
                  className={`h-5 w-5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                />
              </div>
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchQuery}
                onChange={handleSearch}
                className={`w-full pl-10 pr-3 py-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                } transition-all duration-200 focus:outline-none focus:ring-2`}
              />
            </div>
          </div>
          {/* Filtres */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaCheckCircle className="inline-block mr-1.5 text-blue-500" />
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
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
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaTags className="inline-block mr-1.5 text-green-500" />
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={handleTypeFilter}
                    className={`w-full px-3 py-2.5 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                    } transition-all duration-200`}
                  >
                    <option value="all">Tous les types</option>
                    <option value="purchase">Achat</option>
                    <option value="virtual_purchase">Achat des virtuels</option>
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
                  </select>
                </div>

                <div className="w-full">
                  <label
                    className={`block text-sm font-medium mb-1.5 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaCalendarAlt className="inline-block mr-1.5 text-purple-500" />
                    Période
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={handleDateFilter("startDate")}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        } transition-all duration-200`}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={handleDateFilter("endDate")}
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                            : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        } transition-all duration-200`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDateFilter({ startDate: "", endDate: "" });
                    setSearchQuery("");
                  }}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Réinitialiser les filtres</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
        <div className="mt-4 pb-4 px-2 sm:px-4 md:px-6">
          {currentTransactions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden table-container"
              style={{
                boxShadow: isDarkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
                  : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <div
                className="overflow-x-auto"
                style={{ width: "100%", overflowX: "auto", display: "block" }}
              >
                <div className="force-overflow">
                  <table
                    className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto responsive-table"
                    style={{ minWidth: "800px" }}
                  >
                    <thead
                      className={`${
                        isDarkMode ? "bg-gray-700/80" : "bg-gray-50"
                      }`}
                    >
                      <tr>
                        <th
                          scope="col"
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-semibold ${
                            isDarkMode
                              ? "text-gray-200 uppercase tracking-wider"
                              : "text-gray-600 uppercase tracking-wider"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Date</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-semibold ${
                            isDarkMode
                              ? "text-gray-200 uppercase tracking-wider"
                              : "text-gray-600 uppercase tracking-wider"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-4 w-4" />
                            <span>Type</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-semibold ${
                            isDarkMode
                              ? "text-gray-200 uppercase tracking-wider"
                              : "text-gray-600 uppercase tracking-wider"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>Montant</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-semibold ${
                            isDarkMode
                              ? "text-gray-200 uppercase tracking-wider"
                              : "text-gray-600 uppercase tracking-wider"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <CheckBadgeIcon className="h-4 w-4" />
                            <span>Statut</span>
                          </div>
                        </th>
                        <th
                          scope="col"
                          className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-xs font-semibold ${
                            isDarkMode
                              ? "text-gray-200 uppercase tracking-wider"
                              : "text-gray-600 uppercase tracking-wider"
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <Cog6ToothIcon className="h-4 w-4" />
                            <span>Actions</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`${
                        isDarkMode
                          ? "bg-gray-800 divide-y divide-gray-700"
                          : "bg-white divide-y divide-gray-200"
                      }`}
                    >
                      {currentTransactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`${
                            isDarkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          } transition-colors duration-150`}
                        >
                          <td
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatDate(transaction.created_at)}
                              </span>
                              <span
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {formatTime(transaction.created_at)}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            <span className="capitalize">
                              {transaction.type}
                            </span>
                          </td>
                          <td
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap font-medium ${
                              transaction.type === "withdrawal" ||
                              transaction.type === "purchase" ||
                              transaction.type === "virtual_purchase" ||
                              transaction.type === "transfer"
                                ? isDarkMode
                                  ? "text-red-400"
                                  : "text-red-600"
                                : isDarkMode
                                ? "text-green-400"
                                : "text-green-600"
                            }`}
                          >
                            {transaction.type === "withdrawal" ||
                            transaction.type === "purchase" ||
                            transaction.type === "virtual_purchase" ||
                            transaction.type === "transfer"
                              ? `- ${transaction.amount}`
                              : `+ ${transaction.amount}`}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(
                                transaction.status
                              )}`}
                            >
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 whitespace-nowrap">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                handleTransactionClick(transaction)
                              }
                              className={`inline-flex items-center px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 border rounded-md text-xs sm:text-sm font-medium ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 hover:bg-gray-600 text-gray-200"
                                  : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Détails
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`flex flex-col items-center justify-center py-12 px-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <DocumentMagnifyingGlassIcon className="h-16 w-16 mb-4 opacity-50" />
              <h3
                className={`text-lg font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Aucune transaction trouvée
              </h3>
              <p className="text-sm text-center max-w-md mb-6">
                {searchQuery ||
                statusFilter !== "all" ||
                typeFilter !== "all" ||
                dateFilter.startDate ||
                dateFilter.endDate
                  ? "Aucune transaction ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                  : "Vous n'avez pas encore de transactions. Elles apparaîtront ici une fois effectuées."}
              </p>
              {(searchQuery ||
                statusFilter !== "all" ||
                typeFilter !== "all" ||
                dateFilter.startDate ||
                dateFilter.endDate) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDateFilter({ startDate: "", endDate: "" });
                    setSearchQuery("");
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800/50"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                  }`}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Réinitialiser les filtres</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div
            className={`px-6 py-4 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              <div
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } mb-4 sm:mb-0`}
              >
                Affichage de{" "}
                <span className="font-medium">
                  {indexOfFirstItem + 1}-
                  {indexOfLastItem > filteredTransactions.length
                    ? filteredTransactions.length
                    : indexOfLastItem}
                </span>{" "}
                sur{" "}
                <span className="font-medium">
                  {filteredTransactions.length}
                </span>{" "}
                transactions
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === 1
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Premier
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === 1
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Précédent
                </motion.button>

                <div className="hidden sm:flex space-x-1">
                  {[...Array(totalPages).keys()].map((number) => {
                    // Afficher seulement 5 pages à la fois
                    if (
                      number + 1 === 1 ||
                      number + 1 === totalPages ||
                      (number + 1 >= currentPage - 1 &&
                        number + 1 <= currentPage + 1)
                    ) {
                      return (
                        <motion.button
                          key={number}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentPage(number + 1)}
                          className={`px-3 py-1.5 rounded-md text-sm ${
                            currentPage === number + 1
                              ? isDarkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-500 text-white"
                              : isDarkMode
                              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                        >
                          {number + 1}
                        </motion.button>
                      );
                    } else if (
                      (number + 1 === currentPage - 2 && currentPage > 3) ||
                      (number + 1 === currentPage + 2 &&
                        currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={number}
                          className={`px-3 py-1.5 text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === totalPages
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Suivant
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === totalPages
                      ? isDarkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  Dernier
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      {/* Modal de détails de transaction */}
      {showTransactionDetails &&
        selectedTransaction &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTransactionDetails(false)}
          >
            <div
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
                    <DocumentTextIcon className="inline-block mr-2 text-blue-500" />
                    Détails de la transaction
                  </h2>
                  <button
                    onClick={() => setShowTransactionDetails(false)}
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
                  className={`grid grid-cols-2 gap-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      ID de transaction
                    </p>
                    <p className="font-medium">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Type
                    </p>
                    <p className="font-medium capitalize">
                      {selectedTransaction.type}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Montant
                    </p>
                    <p
                      className={`font-medium ${
                        selectedTransaction.type === "withdrawal" ||
                        selectedTransaction.type === "purchase" ||
                        selectedTransaction.type === "virtual_purchase" ||
                        selectedTransaction.type === "transfer"
                          ? isDarkMode
                            ? "text-red-400"
                            : "text-red-600"
                          : isDarkMode
                          ? "text-green-400"
                          : "text-green-600"
                      }`}
                    >
                      {selectedTransaction.type === "withdrawal" ||
                      selectedTransaction.type === "purchase" ||
                      selectedTransaction.type === "virtual_purchase" ||
                      selectedTransaction.type === "transfer"
                        ? `- ${selectedTransaction.amount} $`
                        : `+ ${selectedTransaction.amount} $`}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Statut
                    </p>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(
                        selectedTransaction.status
                      )}`}
                    >
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Date de création
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.created_at)} à{" "}
                      {formatTime(selectedTransaction.created_at)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Dernière mise à jour
                    </p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.updated_at)} à{" "}
                      {formatTime(selectedTransaction.updated_at)}
                    </p>
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div
                    className={`mt-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Description
                    </p>
                    <p
                      className={`p-3 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}

                {selectedTransaction.metadata && (
                  <div
                    className={`mt-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <p
                      className={`text-sm mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Métadonnées
                    </p>
                    <div
                      className={`p-3 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                      </pre>
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
      {/* Modal de transfert de fonds */}
      <FundsTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={fetchWalletData}
        userWallet={wallets[0]}
        userInfo={null}
        isAdmin={true}
      />
      {/* Notifications */}
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
