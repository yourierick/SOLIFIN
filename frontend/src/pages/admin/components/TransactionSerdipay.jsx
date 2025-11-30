import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { toast } from "react-toastify";
import {
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

// Enregistrement des composants ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const TransactionSerdipay = () => {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    type: "",
    payment_type: "",
    direction: "",
    date_from: "",
    date_to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    paymentMethodStats: [],
    monthlyStats: [],
  });
  
  // États pour le modal de détails
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // État pour le menu d'export
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Effet pour fermer le menu d'export quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fonction pour charger les transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        ...filters,
      };

      const response = await axios.get("/api/admin/serdipay-transactions", {
        params,
      });
      setTransactions(response.data.transactions.data);
      setTotalPages(response.data.transactions.last_page);
      setStats(response.data.stats);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des transactions:", err);
      setError(
        "Impossible de charger les transactions. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour charger les détails d'une transaction
  const fetchTransactionDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`/api/admin/serdipay-transactions/${id}`);
      setSelectedTransaction(response.data.transaction);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Erreur lors du chargement des détails de la transaction:", err);
      toast.error("Impossible de charger les détails de la transaction.");
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Fonction pour exporter les transactions
  const exportTransactions = async (format) => {
    setExportLoading(true);
    try {
      const params = {
        format,
        search: searchTerm,
        ...filters,
      };
      
      // Créer une URL avec les paramètres
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/admin/serdipay-transactions/export?${queryString}`;
      
      // Ouvrir l'URL dans un nouvel onglet pour télécharger le fichier
      window.open(url, '_blank');
      
      toast.success(`Export des transactions au format ${format.toUpperCase()} lancé avec succès.`);
    } catch (err) {
      console.error("Erreur lors de l'export des transactions:", err);
      toast.error("Impossible d'exporter les transactions.");
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };
  
  // Fonction pour copier dans le presse-papier
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copié dans le presse-papier !"))
      .catch(() => toast.error("Impossible de copier dans le presse-papier."));
  };

  // Charger les transactions au chargement du composant et lorsque les filtres changent
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, perPage, filters]);

  // Fonction pour gérer la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Réinitialiser à la première page lors d'une nouvelle recherche
    fetchTransactions();
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      status: "",
      payment_method: "",
      type: "",
      payment_type: "",
      direction: "",
      date_from: "",
      date_to: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Fonction pour gérer le changement de page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Fonction pour formater le montant
  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Bouton d'export */}
      <div className="flex justify-end">
        <div className="relative" ref={exportMenuRef}>
          <button
            className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode ? "bg-primary-600" : "bg-primary-600"} text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Export en cours...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Exporter
              </>
            )}
          </button>
          {showExportMenu && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}
            >
              <div className="py-1">
                <button
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => exportTransactions("csv")}
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Exporter en CSV
                </button>
                <button
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  onClick={() => exportTransactions("excel")}
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Exporter en Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* En-tête et statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-2">Total des transactions</h3>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-2">Montant total</h3>
          <p className="text-2xl font-bold">
            {formatAmount(stats.totalAmount)}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-2">Transactions réussies</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.successfulTransactions}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-2">Transactions échouées</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.failedTransactions}
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des méthodes de paiement */}
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-4">Méthodes de paiement</h3>
          {stats.paymentMethodStats.length > 0 ? (
            <div className="h-64">
              <Pie
                data={{
                  labels: stats.paymentMethodStats.map(
                    (item) => item.payment_method
                  ),
                  datasets: [
                    {
                      data: stats.paymentMethodStats.map((item) => item.count),
                      backgroundColor: [
                        "#4F46E5", // indigo-600
                        "#0891B2", // cyan-600
                        "#059669", // emerald-600
                        "#D97706", // amber-600
                        "#DC2626", // red-600
                        "#7C3AED", // violet-600
                        "#2563EB", // blue-600
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: {
                        color: isDarkMode ? "#E5E7EB" : "#1F2937",
                      },
                    },
                    title: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Aucune donnée disponible
            </p>
          )}
        </div>

        {/* Graphique des transactions mensuelles */}
        <div
          className={`p-4 rounded-lg shadow ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3 className="text-lg font-medium mb-4">Transactions mensuelles</h3>
          {stats.monthlyStats.length > 0 ? (
            <div className="h-64">
              <Line
                data={{
                  labels: stats.monthlyStats.map((item) => item.month),
                  datasets: [
                    {
                      label: "Nombre de transactions",
                      data: stats.monthlyStats.map((item) => item.count),
                      borderColor: "#4F46E5",
                      backgroundColor: "rgba(79, 70, 229, 0.1)",
                      tension: 0.3,
                    },
                    {
                      label: "Montant total (XOF)",
                      data: stats.monthlyStats.map((item) => item.amount),
                      borderColor: "#059669",
                      backgroundColor: "rgba(5, 150, 105, 0.1)",
                      tension: 0.3,
                      yAxisID: "y1",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: isDarkMode ? "#E5E7EB" : "#1F2937",
                      },
                      grid: {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                      },
                    },
                    y1: {
                      beginAtZero: true,
                      position: "right",
                      ticks: {
                        color: isDarkMode ? "#E5E7EB" : "#1F2937",
                      },
                      grid: {
                        display: false,
                      },
                    },
                    x: {
                      ticks: {
                        color: isDarkMode ? "#E5E7EB" : "#1F2937",
                      },
                      grid: {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: isDarkMode ? "#E5E7EB" : "#1F2937",
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Aucune donnée disponible
            </p>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearch} className="w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par ID, référence, email..."
              className={`pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full md:w-80`}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
          <button
            onClick={resetFilters}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div
          className={`p-4 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Tous</option>
                <option value="completed">Complété</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoué</option>
                <option value="expired">Expiré</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Méthode de paiement
              </label>
              <select
                value={filters.payment_method}
                onChange={(e) =>
                  setFilters({ ...filters, payment_method: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Toutes</option>
                <option value="card">Carte</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Tous</option>
                <option value="payment">Paiement</option>
                <option value="withdrawal">Retrait</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Type de paiement
              </label>
              <select
                value={filters.payment_type}
                onChange={(e) =>
                  setFilters({ ...filters, payment_type: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Tous</option>
                <option value="card">Carte</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Direction
              </label>
              <select
                value={filters.direction}
                onChange={(e) =>
                  setFilters({ ...filters, direction: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Toutes</option>
                <option value="in">Entrée</option>
                <option value="out">Sortie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters({ ...filters, date_from: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters({ ...filters, date_to: e.target.value })
                }
                className={`w-full rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}

      {/* Tableau des transactions */}
      <div className="overflow-x-auto">
        <table
          className={`min-w-full divide-y ${
            isDarkMode ? "divide-gray-700" : "divide-gray-200"
          }`}
        >
          <thead className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Utilisateur
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Montant
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Méthode
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                Statut
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
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
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className={
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">{transaction.id}</span>
                      <button
                        onClick={() => fetchTransactionDetails(transaction.id)}
                        className="text-primary-600 hover:text-primary-800 focus:outline-none"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.user
                      ? transaction.user.name
                      : transaction.email || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(transaction.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détails */}
      {showDetailModal && selectedTransaction && (
        <div
          className={`fixed inset-0 z-50 overflow-y-auto ${isDarkMode ? "dark" : ""}`}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowDetailModal(false)}
            ></div>

            {/* Modal */}
            <div
              className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              {/* Header */}
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${isDarkMode ? "border-b border-gray-700" : "border-b border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <h3
                    className="text-lg leading-6 font-medium"
                    id="modal-title"
                  >
                    Détails de la transaction #{selectedTransaction.id}
                  </h3>
                  <button
                    type="button"
                    className={`rounded-md p-1 focus:outline-none ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                    onClick={() => setShowDetailModal(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                {loadingDetails ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">ID</h4>
                      <div className="flex items-center">
                        <p className="text-sm">{selectedTransaction.id}</p>
                        <button
                          className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          onClick={() => copyToClipboard(selectedTransaction.id)}
                          title="Copier l'ID"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Référence</h4>
                      <div className="flex items-center">
                        <p className="text-sm">{selectedTransaction.reference || "N/A"}</p>
                        {selectedTransaction.reference && (
                          <button
                            className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            onClick={() => copyToClipboard(selectedTransaction.reference)}
                            title="Copier la référence"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Utilisateur</h4>
                      <p className="text-sm">
                        {selectedTransaction.user
                          ? selectedTransaction.user.name
                          : selectedTransaction.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Email</h4>
                      <p className="text-sm">
                        {selectedTransaction.user
                          ? selectedTransaction.user.email
                          : selectedTransaction.email || "N/A"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Montant</h4>
                      <p className="text-sm font-semibold">
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Devise</h4>
                      <p className="text-sm">{selectedTransaction.currency}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Méthode de paiement</h4>
                      <p className="text-sm">{selectedTransaction.payment_method}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Type</h4>
                      <p className="text-sm">{selectedTransaction.type}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Type de paiement</h4>
                      <p className="text-sm">{selectedTransaction.payment_type || "N/A"}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Direction</h4>
                      <p className="text-sm">
                        {selectedTransaction.direction === "in" ? "Entrée" : selectedTransaction.direction === "out" ? "Sortie" : "N/A"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Statut</h4>
                      <p className="text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                            selectedTransaction.status
                          )}`}
                        >
                          {selectedTransaction.status}
                        </span>
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Date de création</h4>
                      <p className="text-sm">{formatDate(selectedTransaction.created_at)}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Date de mise à jour</h4>
                      <p className="text-sm">{formatDate(selectedTransaction.updated_at)}</p>
                    </div>

                    {selectedTransaction.metadata && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium mb-1">Métadonnées</h4>
                        <div className={`p-2 rounded text-xs font-mono overflow-auto max-h-40 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                          <pre>{JSON.stringify(selectedTransaction.metadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {selectedTransaction.description && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm">{selectedTransaction.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${isDarkMode ? "border-t border-gray-700" : "border-t border-gray-200"}`}>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination commence ici */}

      {/* Pagination */}
      {!loading && !error && transactions.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            >
              <option value="10">10 par page</option>
              <option value="25">25 par page</option>
              <option value="50">50 par page</option>
              <option value="100">100 par page</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="px-4 py-2">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSerdipay;
