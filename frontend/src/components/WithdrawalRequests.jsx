import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import {
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CurrencyEuroIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Bar, Pie } from "react-chartjs-2";
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

// Enregistrer les composants Chart.js
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
const WithdrawalRequests = () => {
  const { isDarkMode } = useTheme();

  // États principaux
  const [requestsArray, setRequestsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // États pour les actions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // États pour les modals
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // États pour la pagination des demandes en attente
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  // États pour les onglets
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' ou 'all'

  // États pour l'onglet d'analyse complète
  const [allRequests, setAllRequests] = useState([]);
  const [allRequestsLoading, setAllRequestsLoading] = useState(false);
  const [allRequestsMeta, setAllRequestsMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  // Effet pour charger les données initiales
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingRequests();
    } else if (activeTab === "all") {
      fetchAllRequests();
    }
  }, [activeTab]);

  // Fonction pour récupérer les demandes en attente
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/withdrawal/requests");
      if (response.data.success) {
        setRequestsArray(response.data.requests || []);
      } else {
        toast.error("Erreur lors de la récupération des demandes");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error);
      toast.error("Erreur lors de la récupération des demandes");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer toutes les demandes avec filtres
  const fetchAllRequests = async (page = 1) => {
    try {
      setAllRequestsLoading(true);

      // Construire l'URL avec les paramètres de filtrage
      let url = `/api/admin/withdrawal/all?page=${page}`;

      if (filters.status) {
        url += `&status=${filters.status}`;
      }

      if (filters.payment_method) {
        url += `&payment_method=${filters.payment_method}`;
      }

      if (filters.start_date) {
        url += `&start_date=${filters.start_date}`;
      }

      if (filters.end_date) {
        url += `&end_date=${filters.end_date}`;
      }

      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }

      const response = await axios.get(url);

      console.log(response.data);
      if (response.data.success) {
        setAllRequests(response.data.withdrawal_requests.data || []);
        setAllRequestsMeta(response.data.withdrawal_requests);
        setStats(response.data.stats);
      } else {
        toast.error("Erreur lors de la récupération des données d'analyse");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données d'analyse:",
        error
      );
      toast.error("Erreur lors de la récupération des données d'analyse");
    } finally {
      setAllRequestsLoading(false);
    }
  };
  // Fonctions pour gérer les actions sur les demandes
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setAdminNote(request.admin_note || "");
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `/api/admin/withdrawal/requests/${requestId}/approve`,
        {
          admin_note: adminNote,
        }
      );

      if (response.data.success) {
        toast.success("Demande approuvée avec succès");
        setSelectedRequest(null);

        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors de l'approbation de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation de la demande:", error);
      toast.error("Erreur lors de l'approbation de la demande");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `/api/admin/withdrawal/requests/${requestId}/reject`,
        {
          admin_note: adminNote,
        }
      );

      if (response.data.success) {
        toast.success("Demande rejetée avec succès");
        setSelectedRequest(null);

        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors du rejet de la demande");
      }
    } catch (error) {
      console.error("Erreur lors du rejet de la demande:", error);
      toast.error("Erreur lors du rejet de la demande");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/admin/withdrawal/requests/${requestToDelete.id}`
      );

      if (response.data.success) {
        toast.success("Demande supprimée avec succès");
        setShowDeleteConfirmation(false);
        setRequestToDelete(null);

        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors de la suppression de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la demande:", error);
      toast.error("Erreur lors de la suppression de la demande");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedRequest) return;

    try {
      setIsSavingNote(true);
      const response = await axios.post(
        `/api/admin/withdrawal/requests/${selectedRequest.id}/note`,
        {
          admin_note: adminNote,
        }
      );

      if (response.data.success) {
        toast.success("Note enregistrée avec succès");

        // Mettre à jour la note dans l'objet sélectionné
        setSelectedRequest({
          ...selectedRequest,
          admin_note: adminNote,
        });
      } else {
        toast.error("Erreur lors de l'enregistrement de la note");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la note:", error);
      toast.error("Erreur lors de l'enregistrement de la note");
    } finally {
      setIsSavingNote(false);
    }
  };
  // Fonctions pour les filtres
  const applyFilters = () => {
    fetchAllRequests(1); // Réinitialiser à la première page lors de l'application des filtres
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      payment_method: "",
      start_date: "",
      end_date: "",
      search: "",
    });
    fetchAllRequests(1);
  };

  // Fonction pour gérer le changement de page dans l'onglet d'analyse
  const handlePageChange = (page) => {
    fetchAllRequests(page);
  };

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return isDarkMode
          ? "bg-yellow-900 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
      case "approved":
        return isDarkMode
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-800";
      case "rejected":
        return isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800";
      case "processed":
        return isDarkMode
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-800";
      default:
        return isDarkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4" />;
      case "processed":
        return <CheckIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Pagination pour l'onglet des demandes en attente
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requestsArray.slice(
    indexOfFirstRequest,
    indexOfLastRequest
  );
  const totalPages = Math.ceil(requestsArray.length / requestsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  // Rendu du composant
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 xl:p-8">
      {/* En-tête */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Demandes de retrait
          </h3>
          <span className="text-base font-normal text-gray-500 dark:text-gray-400">
            Gestion et analyse des demandes de retrait
          </span>
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "pending"
                  ? "text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-b-2 border-transparent"
              }`}
            >
              Demandes en attente
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === "all"
                  ? "text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500"
                  : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-b-2 border-transparent"
              }`}
            >
              Analyse complète
            </button>
          </li>
        </ul>
      </div>
      {/* Indicateur de chargement */}
      {loading && activeTab === "pending" && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      {/* Contenu des onglets */}
      {activeTab === "pending" ? (
        // Onglet des demandes en attente
        <div>
          {requestsArray.length === 0 ? (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Aucune demande de retrait en cours
            </div>
          ) : (
            <>
              <div
                className={`rounded-lg shadow-lg overflow-hidden ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead
                      className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}
                    >
                      <tr>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          ID
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Utilisateur
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
                          Méthode de paiement
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
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDarkMode ? "divide-gray-700" : "divide-gray-200"
                      }`}
                    >
                      {currentRequests.map((request) => (
                        <tr
                          key={request.id}
                          className={
                            isDarkMode
                              ? "hover:bg-gray-700/50"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {request.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {request.user
                              ? request.user.name
                              : "Utilisateur inconnu"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            }).format(request.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {request.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                request.status
                              )}`}
                            >
                              <span className="flex items-center">
                                {getStatusIcon(request.status)}
                                <span className="ml-1">
                                  {request.status === "pending" && "En attente"}
                                  {request.status === "approved" && "Approuvé"}
                                  {request.status === "rejected" && "Rejeté"}
                                  {request.status === "processed" && "Traité"}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Date(request.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewRequest(request)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRequestToDelete(request);
                                  setShowDeleteConfirmation(true);
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                          : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-1 ${
                            pageNumber === currentPage
                              ? "bg-primary-600 text-white dark:bg-primary-500"
                              : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                          : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Onglet d'analyse complète
        <div>
          {/* Section des filtres */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Filtres
              </h4>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Rejeté</option>
                    <option value="processed">Traité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Méthode de paiement
                  </label>
                  <select
                    value={filters.payment_method}
                    onChange={(e) =>
                      setFilters({ ...filters, payment_method: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Toutes</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="w-full sm:w-1/2 mb-4 sm:mb-0">
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    placeholder="Rechercher par ID, utilisateur..."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Appliquer
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
          {/* Section des statistiques */}
          {allRequestsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {stats && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Statistiques générales
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-primary-500">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-full p-3">
                          <CurrencyDollarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Montant total
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(stats.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-full p-3">
                          <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            En attente
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.pending_count} (
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(stats.pending_amount)}
                            )
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-full p-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Payés
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.approved_requests} (
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(stats.approved_amount)}
                            )
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-red-500">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-full p-3">
                          <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Rejetés
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.rejected_count} (
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(stats.rejected_amount)}
                            )
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Section des graphiques */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Graphique en barres - Demandes par mois */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                      <h5 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Demandes par mois
                      </h5>
                      <div className="h-64">
                        {stats.monthly_data && (
                          <Bar
                            data={{
                              labels: stats.monthly_data.map(
                                (item) => item.month
                              ),
                              datasets: [
                                {
                                  label: "Montant total",
                                  data: stats.monthly_data.map(
                                    (item) => item.amount
                                  ),
                                  backgroundColor: isDarkMode
                                    ? "rgba(79, 70, 229, 0.7)"
                                    : "rgba(79, 70, 229, 0.5)",
                                  borderColor: "#4F46E5",
                                  borderWidth: 1,
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
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  },
                                  grid: {
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)",
                                  },
                                },
                                x: {
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
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
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Graphique en camembert - Méthodes de paiement */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                      <h5 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                        Méthodes de paiement
                      </h5>
                      <div className="h-64">
                        {stats.payment_methods && (
                          <Pie
                            data={{
                              labels: stats.payment_methods.map(
                                (item) => item.method
                              ),
                              datasets: [
                                {
                                  data: stats.payment_methods.map(
                                    (item) => item.amount
                                  ),
                                  backgroundColor: [
                                    "rgba(79, 70, 229, 0.7)",
                                    "rgba(245, 158, 11, 0.7)",
                                    "rgba(16, 185, 129, 0.7)",
                                    "rgba(239, 68, 68, 0.7)",
                                  ],
                                  borderColor: [
                                    "#4F46E5",
                                    "#F59E0B",
                                    "#10B981",
                                    "#EF4444",
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
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Tableau des demandes filtrées */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Liste des demandes
                </h4>

                <div
                  className={`rounded-lg shadow-lg overflow-hidden ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead
                        className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}
                      >
                        <tr>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            ID
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Utilisateur
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
                            Méthode de paiement
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
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDarkMode ? "divide-gray-700" : "divide-gray-200"
                        }`}
                      >
                        {allRequests.length === 0 ? (
                          <tr>
                            <td
                              colSpan="7"
                              className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              Aucune demande trouvée
                            </td>
                          </tr>
                        ) : (
                          allRequests.map((request) => (
                            <tr
                              key={request.id}
                              className={
                                isDarkMode
                                  ? "hover:bg-gray-700/50"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {request.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {request.user
                                  ? request.user.name
                                  : "Utilisateur inconnu"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: "EUR",
                                }).format(request.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {request.payment_method}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    request.status
                                  )}`}
                                >
                                  <span className="flex items-center">
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1">
                                      {request.status === "pending" &&
                                        "En attente"}
                                      {request.status === "approved" &&
                                        "Approuvé"}
                                      {request.status === "rejected" &&
                                        "Rejeté"}
                                      {request.status === "processed" &&
                                        "Traité"}
                                    </span>
                                  </span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewRequest(request)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    <EyeIcon className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRequestToDelete(request);
                                      setShowDeleteConfirmation(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Pagination pour les demandes filtrées */}
                {allRequestsMeta && allRequestsMeta.last_page > 1 && (
                  <div className="flex justify-center mt-6">
                    <nav className="flex items-center">
                      <button
                        onClick={() =>
                          handlePageChange(allRequestsMeta.current_page - 1)
                        }
                        disabled={allRequestsMeta.current_page === 1}
                        className={`px-3 py-1 rounded-l-md ${
                          allRequestsMeta.current_page === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>

                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        const totalPages = allRequestsMeta.last_page;
                        const currentPage = allRequestsMeta.current_page;

                        let startPage = Math.max(
                          1,
                          currentPage - Math.floor(maxVisiblePages / 2)
                        );
                        let endPage = Math.min(
                          totalPages,
                          startPage + maxVisiblePages - 1
                        );

                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(
                            1,
                            endPage - maxVisiblePages + 1
                          );
                        }

                        if (startPage > 1) {
                          pages.push(
                            <button
                              key="first"
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span
                                key="dots1"
                                className="px-3 py-1 text-gray-500 dark:text-gray-400"
                              >
                                ...
                              </span>
                            );
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-1 ${
                                i === currentPage
                                  ? "bg-primary-600 text-white dark:bg-primary-500"
                                  : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span
                                key="dots2"
                                className="px-3 py-1 text-gray-500 dark:text-gray-400"
                              >
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key="last"
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}

                      <button
                        onClick={() =>
                          handlePageChange(allRequestsMeta.current_page + 1)
                        }
                        disabled={
                          allRequestsMeta.current_page ===
                          allRequestsMeta.last_page
                        }
                        className={`px-3 py-1 rounded-r-md ${
                          allRequestsMeta.current_page ===
                          allRequestsMeta.last_page
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Supprimer la demande de retrait
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Êtes-vous sûr de vouloir supprimer cette demande de
                        retrait ? Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDeleteRequest}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de détails de la demande */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Détails de la demande #{selectedRequest.id}
                  </h3>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ID
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Statut
                      </p>
                      <p className="mt-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            selectedRequest.status
                          )}`}
                        >
                          <span className="flex items-center">
                            {getStatusIcon(selectedRequest.status)}
                            <span className="ml-1">
                              {selectedRequest.status === "pending" &&
                                "En attente"}
                              {selectedRequest.status === "approved" &&
                                "Approuvé"}
                              {selectedRequest.status === "rejected" &&
                                "Rejeté"}
                              {selectedRequest.status === "processed" &&
                                "Traité"}
                            </span>
                          </span>
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Utilisateur
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.user
                          ? selectedRequest.user.name
                          : "Utilisateur inconnu"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.user
                          ? selectedRequest.user.email
                          : "Email inconnu"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Montant
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(selectedRequest.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Méthode de paiement
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date de création
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(
                          new Date(selectedRequest.created_at),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Dernière mise à jour
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(
                          new Date(selectedRequest.updated_at),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Détails du paiement
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedRequest.payment_details || "Aucun détail fourni"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Note administrative
                    </p>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                      placeholder="Ajouter une note administrative..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(selectedRequest.id)}
                      disabled={isProcessing}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {isProcessing ? "Traitement..." : "Approuver"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(selectedRequest.id)}
                      disabled={isProcessing}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {isProcessing ? "Traitement..." : "Rejeter"}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleSaveAdminNote}
                  disabled={isSavingNote}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isSavingNote ? "Enregistrement..." : "Enregistrer la note"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast Container */}
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
};

export default WithdrawalRequests;
