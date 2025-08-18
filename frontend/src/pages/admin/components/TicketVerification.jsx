import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import {
  QrCodeIcon,
  TicketIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  GiftIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
  ArrowRightIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../../contexts/ThemeContext";
import WithdrawalForm from "../../../components/WithdrawalForm";

const TicketVerification = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("verification");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    code: "",
    status: "",
    dateDebut: "",
    dateFin: "",
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  // Fermer le menu d'export lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fonction pour vérifier un ticket
  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setTicket(null);

    try {
      const response = await axios.get(`/api/admin/tickets/${code}`);
      if (response.data.success) {
        setTicket(response.data.ticket);
      } else {
        setError(response.data.message || "Ticket non trouvé ou invalide");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la vérification du ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer un ticket comme consommé
  const handleConsume = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `/api/admin/tickets/consommer/${ticket.id}`
      );
      if (response.data.success) {
        setSuccess("Ticket marqué comme consommé avec succès");
        setTicket(response.data.ticket);
      } else {
        setError(
          response.data.message || "Erreur lors de la consommation du ticket"
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Erreur lors de la consommation du ticket"
      );
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour récupérer l'historique des tickets
  const fetchHistory = async (page = 1, filters = {}) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await axios.get(
        `/api/admin/tickets/my-history?page=${page}`,
        { params: filters }
      );
      if (response.data.success) {
        setHistory(response.data.tickets);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.last_page);
      } else {
        setHistoryError(
          response.data.message || "Erreur lors du chargement de l'historique"
        );
      }
    } catch (error) {
      setHistoryError(
        error.response?.data?.message ||
          "Erreur lors du chargement de l'historique"
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Charger l'historique lorsque l'onglet historique est actif
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory(1, filters);
    }
  }, [activeTab]);

  // Fonction pour gérer la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchHistory(page, filters);
  };

  // Fonction pour appliquer les filtres
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchHistory(1, filters);
    setShowFilters(false);
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      code: "",
      status: "",
      dateDebut: "",
      dateFin: "",
    });
    fetchHistory(1, {});
    setShowFilters(false);
  };

  // Fonction pour exporter l'historique en Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      history.map((item) => ({
        Code: item.code,
        Statut: item.consomme ? "Consommé" : "Non consommé",
        "Date de création": formatDate(item.created_at),
        "Date d'expiration": formatDate(item.date_expiration),
        "Date de consommation": item.date_consommation
          ? formatDate(item.date_consommation)
          : "N/A",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");
    XLSX.writeFile(workbook, "historique_tickets.xlsx");
    setShowExportMenu(false);
  };

  // Fonction pour exporter l'historique en CSV
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      history.map((item) => ({
        Code: item.code,
        Statut: item.consomme ? "Consommé" : "Non consommé",
        "Date de création": formatDate(item.created_at),
        "Date d'expiration": formatDate(item.date_expiration),
        "Date de consommation": item.date_consommation
          ? formatDate(item.date_consommation)
          : "N/A",
      }))
    );
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "historique_tickets.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <QrCodeIcon className="h-8 w-8 mr-2 text-primary-600" />
        Vérification des tickets
      </h1>

      {/* Navigation par onglets */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "verification"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("verification")}
        >
          Vérification
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "history"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Historique
        </button>
      </div>

      {/* Contenu de l'onglet Vérification */}
      {activeTab === "verification" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TicketIcon className="h-6 w-6 mr-2 text-primary-600" />
            Vérifier un ticket
          </h2>

          <form onSubmit={handleVerification} className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Code du ticket
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Entrez le code du ticket"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md flex items-center"
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
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
                  ) : (
                    "Vérifier"
                  )}
                </button>
              </div>
            </div>
          </form>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <p>{success}</p>
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium">Comment ça marche ?</h4>
                  <ol className="mt-2 ml-5 list-decimal">
                    <li className="mb-1">
                      Demandez à l'utilisateur son code de vérification
                      personnel (reçu par notification).
                    </li>
                    <li className="mb-1">
                      Entrez le code de vérification dans le champ ci-dessus et
                      cliquez sur "Vérifier".
                    </li>
                    <li className="mb-1">
                      Vérifiez les détails du ticket (cadeau, utilisateur, date
                      d'expiration).
                    </li>
                    <li>
                      Si le ticket est valide, cliquez sur "Marquer comme
                      consommé" pour valider la remise du cadeau.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {ticket && (
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <TicketIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Détails du ticket
                </h3>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ticket.consomme
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  }`}
                >
                  {ticket.consomme ? "Consommé" : "Valide"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="mb-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Code
                  </h4>
                  <div className="flex items-center">
                    <QrCodeIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">{ticket.code}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Cadeau
                  </h4>
                  <div className="flex items-center">
                    <GiftIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">
                      {ticket.cadeau?.nom || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Utilisateur
                  </h4>
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">
                      {ticket.user?.name || "N/A"} (
                      {ticket.user?.email || "N/A"})
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Date de création
                  </h4>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Date d'expiration
                  </h4>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">
                      {formatDate(ticket.date_expiration)}
                    </span>
                  </div>
                </div>
                {ticket.consomme && (
                  <div className="mb-3">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Date de consommation
                    </h4>
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                      <span className="font-medium">
                        {formatDate(ticket.date_consommation)}
                      </span>
                    </div>
                  </div>
                )}

                {!ticket.consomme && (
                  <div className="mt-6">
                    <button
                      onClick={handleConsume}
                      disabled={loading}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
                    >
                      {loading ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
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
                      ) : (
                        "Marquer comme consommé"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Historique */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-primary-600" />
              Historique des tickets
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md flex items-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filtres
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md flex items-center"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Exporter
                </button>
                {showExportMenu && (
                  <div
                    ref={exportMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                  >
                    <button
                      onClick={exportToExcel}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Exporter en Excel
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Exporter en CSV
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => fetchHistory(1, filters)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md flex items-center"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Filtres */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-medium mb-4">Filtres</h3>
              <form onSubmit={handleApplyFilters}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={filters.code}
                      onChange={(e) =>
                        setFilters({ ...filters, code: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                      placeholder="Rechercher par code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Statut
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                    >
                      <option value="">Tous</option>
                      <option value="true">Consommé</option>
                      <option value="false">Non consommé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date début
                    </label>
                    <input
                      type="date"
                      value={filters.dateDebut}
                      onChange={(e) =>
                        setFilters({ ...filters, dateDebut: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date fin
                    </label>
                    <input
                      type="date"
                      value={filters.dateFin}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFin: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                  >
                    Appliquer
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Tableau d'historique */}
          {historyLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-primary-600"
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
            </div>
          ) : historyError ? (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <p>{historyError}</p>
              </div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun ticket trouvé
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Code
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date de création
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date d'expiration
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date de consommation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.consomme
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }`}
                        >
                          {item.consomme ? "Consommé" : "Non consommé"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.date_expiration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.date_consommation
                          ? formatDate(item.date_consommation)
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {!historyLoading && history?.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Portefeuille */}
      {activeTab === "wallet" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <WalletIcon className="h-6 w-6 mr-2 text-primary-600" />
            Mon portefeuille
          </h2>

          {walletLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-primary-600"
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
            </div>
          ) : walletError ? (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2" />
                <p>{walletError}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Solde et actions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Solde actuel
                    </h3>
                    <div className="text-3xl font-bold text-primary-600">
                      {userWallet?.balance || "0"} $
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowWithdrawalModal(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center justify-center"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Demander un retrait
                    </button>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md flex items-center justify-center"
                    >
                      <ArrowRightIcon className="h-5 w-5 mr-2" />
                      Transférer
                    </button>
                  </div>
                </div>
              </div>
              {/* Historique des transactions */}
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                Historique des transactions
              </h3>

              {walletLoading ? (
                <div className="flex justify-center items-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-primary-600"
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
                </div>
              ) : walletTransactions.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune transaction trouvée
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setWalletShowExportMenu(!walletShowExportMenu)
                        }
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Exporter
                      </button>
                      {walletShowExportMenu && (
                        <div
                          ref={walletExportMenuRef}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                        >
                          <button
                            onClick={exportWalletToExcel}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Exporter en Excel
                          </button>
                          <button
                            onClick={exportWalletToCSV}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Exporter en CSV
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Montant
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {walletTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.type === "credit"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                }`}
                              >
                                {transaction.type === "credit"
                                  ? "Crédit"
                                  : "Débit"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {transaction.amount} $
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {transaction.description || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          {/* Modal de retrait */}
          {showWithdrawalModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <WithdrawalForm
                  walletId={userWallet?.id}
                  walletType="user"
                  onClose={() => setShowWithdrawalModal(false)}
                />
              </div>
            </div>
          )}
          {/* Modal de transfert */}
          {showTransferModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <ArrowRightIcon className="h-5 w-5 mr-2 text-primary-600" />
                  Transfert de fonds
                </h3>
                <form onSubmit={handleTransfer}>
                  <div className="mb-4">
                    <label
                      htmlFor="transferEmail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email du destinataire
                    </label>
                    <input
                      type="email"
                      id="transferEmail"
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      placeholder="email@exemple.com"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="transferAmount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Montant ($)
                    </label>
                    <input
                      type="number"
                      id="transferAmount"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Frais de transfert:
                      </span>
                      <span className="font-medium">{transferFees} $</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 font-medium">
                      <span>Total:</span>
                      <span>
                        {parseFloat(transferAmount || 0) +
                          parseFloat(transferFees)}{" "}
                        $
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowTransferModal(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-md"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={transferLoading}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center"
                    >
                      {transferLoading ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
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
                      ) : null}
                      Confirmer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketVerification;
