import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  Box,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
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
  const [filteredRequestsArray, setFilteredRequestsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // États pour les filtres de l'onglet demandes en attente
  const [pendingFilters, setPendingFilters] = useState({
    payment_method: "",
    start_date: "",
    end_date: "",
    search: "",
  });
  const [showPendingFilters, setShowPendingFilters] = useState(false);

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
    // Réinitialiser la page courante lors du changement d'onglet
    setCurrentPage(1);

    if (activeTab === "pending") {
      fetchPendingRequests(1);
    } else if (activeTab === "all") {
      fetchAllRequests(1);
    }
  }, [activeTab]);

  // Effet pour filtrer les demandes en attente ou recharger avec les filtres
  useEffect(() => {
    if (activeTab === "pending") {
      // Si nous utilisons la pagination backend, refaire la requête avec les filtres
      fetchPendingRequests(1);
    } else if (requestsArray.length > 0) {
      // Sinon, appliquer les filtres côté client
      applyPendingFilters();
    } else {
      setFilteredRequestsArray([]);
    }
  }, [pendingFilters, activeTab]);

  // Fonction pour récupérer les demandes en attente avec pagination
  const fetchPendingRequests = async (page = 1) => {
    try {
      setLoading(true);

      // Construire l'URL avec les paramètres de pagination et filtrage
      let url = `/api/admin/withdrawal/requests?page=${page}`;

      if (pendingFilters.payment_method) {
        url += `&payment_method=${pendingFilters.payment_method}`;
      }

      if (pendingFilters.start_date) {
        url += `&start_date=${pendingFilters.start_date}`;
      }

      if (pendingFilters.end_date) {
        url += `&end_date=${pendingFilters.end_date}`;
      }

      if (pendingFilters.search) {
        url += `&search=${encodeURIComponent(pendingFilters.search)}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        // Vérifier si les données sont paginées
        if (response.data.data) {
          // Format paginé (nouvelle structure)
          const requests = response.data.data.data || [];
          setRequestsArray(requests);
          setFilteredRequestsArray(requests); // Initialiser filteredRequestsArray avec les mêmes données
          setAllRequestsMeta({
            current_page: response.data.data.current_page || 1,
            last_page: response.data.data.last_page || 1,
            per_page: response.data.data.per_page || 10,
            total: response.data.data.total || 0,
            from: response.data.data.from || 0,
            to: response.data.data.to || 0,
          });
        } else if (response.data.requests?.data) {
          // Format paginé (ancienne structure pour compatibilité)
          const requests = response.data.requests.data || [];
          setRequestsArray(requests);
          setFilteredRequestsArray(requests); // Initialiser filteredRequestsArray avec les mêmes données
          setAllRequestsMeta({
            current_page: response.data.requests.current_page || 1,
            last_page: response.data.requests.last_page || 1,
            per_page: response.data.requests.per_page || 10,
            total: response.data.requests.total || 0,
            from: response.data.requests.from || 0,
            to: response.data.requests.to || 0,
          });
        } else {
          // Format non paginé (pour compatibilité)
          const requests = response.data.requests || [];
          setRequestsArray(requests);
          setFilteredRequestsArray(requests); // Initialiser filteredRequestsArray avec les mêmes données
          setAllRequestsMeta(null);
        }

        // Mettre à jour la page courante
        if (response.data.data) {
          setCurrentPage(response.data.data.current_page || 1);
        } else {
          setCurrentPage(response.data.requests?.current_page || 1);
        }
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

  // Fonction pour appliquer les filtres aux demandes en attente
  const applyPendingFilters = () => {
    // Si nous utilisons la pagination backend, les filtres sont déjà appliqués via l'API
    // Cette fonction est maintenant principalement utilisée comme fallback pour le filtrage côté client
    if (activeTab !== "pending" || !allRequestsMeta) {
      let filtered = [...requestsArray];

      if (pendingFilters.payment_method) {
        filtered = filtered.filter(
          (request) => request.payment_method === pendingFilters.payment_method
        );
      }

      if (pendingFilters.start_date) {
        const startDate = new Date(pendingFilters.start_date);
        filtered = filtered.filter((request) => {
          const requestDate = new Date(request.created_at);
          return requestDate >= startDate;
        });
      }

      if (pendingFilters.end_date) {
        const endDate = new Date(pendingFilters.end_date);
        filtered = filtered.filter((request) => {
          const requestDate = new Date(request.created_at);
          return requestDate <= endDate;
        });
      }

      if (pendingFilters.search) {
        const searchLower = pendingFilters.search.toLowerCase();
        filtered = filtered.filter(
          (request) =>
            (request.user?.name &&
              request.user.name.toLowerCase().includes(searchLower)) ||
            (request.user?.email &&
              request.user.email.toLowerCase().includes(searchLower))
        );
      }

      setFilteredRequestsArray(filtered);
      setCurrentPage(1); // Réinitialiser à la première page après filtrage
    }
  };

  // Fonction pour réinitialiser les filtres des demandes en attente
  const resetPendingFilters = () => {
    setPendingFilters({
      payment_method: "",
      start_date: "",
      end_date: "",
      search: "",
    });

    // Réinitialiser la page courante et recharger les données
    if (activeTab === "pending") {
      fetchPendingRequests(1);
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

      if (response.data.success) {
        // Vérifier si les données sont paginées
        if (response.data.withdrawal_requests) {
          const requests = response.data.withdrawal_requests.data || [];
          setAllRequests(requests);
          setAllRequestsMeta({
            current_page: response.data.withdrawal_requests.current_page || 1,
            last_page: response.data.withdrawal_requests.last_page || 1,
            per_page: response.data.withdrawal_requests.per_page || 10,
            total: response.data.withdrawal_requests.total || 0,
            from: response.data.withdrawal_requests.from || 0,
            to: response.data.withdrawal_requests.to || 0,
          });
        } else {
          // Format non paginé (pour compatibilité)
          setAllRequests(response.data.withdrawal_requests || []);
          setAllRequestsMeta(null);
        }

        // Adapter les données pour correspondre à la structure attendue par le composant
        const statsData = response.data.stats || {};

        // S'assurer que toutes les propriétés nécessaires sont présentes
        const formattedStats = {
          ...statsData,
          // Utiliser les propriétés du backend ou des valeurs par défaut
          total_amount: statsData.total_amount || 0,
          pending_amount: statsData.pending_amount || 0,
          approved_amount: statsData.approved_amount || 0,
          rejected_amount: statsData.rejected_amount || 0,
          paid_amount: statsData.paid_amount || 0,

          // Renommer les propriétés pour correspondre à celles attendues par le composant
          pending_requests: statsData.pending_requests || 0,
          approved_requests: statsData.approved_requests || 0,
          rejected_requests: statsData.rejected_requests || 0,

          // Adapter les données pour les graphiques
          monthly_stats: statsData.monthly_stats || [],
          payment_method_stats: statsData.payment_method_stats || [],
        };

        setStats(formattedStats);
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

  // Fonction pour gérer le changement de page dans les deux onglets
  const handlePageChange = (page) => {
    if (activeTab === "pending") {
      fetchPendingRequests(page);
    } else if (activeTab === "all") {
      fetchAllRequests(page);
    }
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
      case "failed":
        return isDarkMode
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-800";
      case "paid":
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
      case "failed":
        return <XCircleIcon className="h-4 w-4" />;
      case "paid":
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Pagination pour l'onglet des demandes en attente
  // Si nous avons des métadonnées de pagination du backend, nous les utilisons
  // Sinon, nous utilisons la pagination côté client comme fallback
  let currentRequests = [];
  let pendingTotalPages = 1;

  if (allRequestsMeta && activeTab === "pending") {
    // Utilisation de la pagination du backend
    currentRequests = requestsArray;
    pendingTotalPages = allRequestsMeta.last_page || 1;
  } else {
    // Fallback à la pagination côté client
    const indexOfLastRequest = currentPage * requestsPerPage;
    const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
    currentRequests = filteredRequestsArray.slice(
      indexOfFirstRequest,
      indexOfLastRequest
    );
    pendingTotalPages = Math.max(
      1,
      Math.ceil(filteredRequestsArray.length / requestsPerPage)
    );
  }

  // Fonctions de pagination
  const handlePendingPageChange = (pageNumber) => {
    handlePageChange(pageNumber);
  };

  const nextPendingPage = () => {
    if (activeTab === "pending" && allRequestsMeta) {
      handlePageChange(
        Math.min(allRequestsMeta.current_page + 1, allRequestsMeta.last_page)
      );
    } else {
      setCurrentPage((prev) => Math.min(prev + 1, pendingTotalPages));
    }
  };

  const prevPendingPage = () => {
    if (activeTab === "pending" && allRequestsMeta) {
      handlePageChange(Math.max(allRequestsMeta.current_page - 1, 1));
    } else {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };
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
          {/* Section des filtres pour les demandes en attente */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Filtres
              </h4>
              <button
                onClick={() => setShowPendingFilters(!showPendingFilters)}
                className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none"
              >
                <FunnelIcon className="h-5 w-5 mr-1" />
                {showPendingFilters
                  ? "Masquer les filtres"
                  : "Afficher les filtres"}
              </button>
            </div>

            {showPendingFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Méthode de paiement
                  </label>
                  <select
                    value={pendingFilters.payment_method}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Toutes</option>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="orange-money">Orange Money</option>
                    <option value="airtel-money">Airtel Money</option>
                    <option value="afrimoney">Afrimoney</option>
                    <option value="m-pesa">M-Pesa</option>
                    <option value="american-express">American Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={pendingFilters.start_date}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        start_date: e.target.value,
                      })
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
                    value={pendingFilters.end_date}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        end_date: e.target.value,
                      })
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
                    value={pendingFilters.search}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        search: e.target.value,
                      })
                    }
                    placeholder="Rechercher par ID, utilisateur..."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={resetPendingFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          {filteredRequestsArray.length === 0 ? (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {requestsArray.length === 0
                ? "Aucune demande de retrait en cours"
                : "Aucune demande ne correspond aux critères de recherche"}
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
                          Statut de traitement
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Statut de paiement
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
                              currency: "USD",
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
                                  {request.status === "cancelled" && "Annulé"}
                                  {request.status === "failed" && "Échoué"}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                request.payment_status
                              )}`}
                            >
                              <span className="flex items-center">
                                {getStatusIcon(request.payment_status)}
                                <span className="ml-1">
                                  {request.payment_status === "pending" &&
                                    "En attente"}
                                  {request.payment_status === "paid" && "Payé"}
                                  {request.payment_status === "failed" &&
                                    "Échoué"}
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
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {allRequestsMeta ? (
                  // Affichage des informations de pagination du backend
                  <>
                    Affichage de {allRequestsMeta.from || 0} à{" "}
                    {allRequestsMeta.to || 0} sur {allRequestsMeta.total || 0}{" "}
                    demandes
                  </>
                ) : (
                  // Fallback à l'affichage client-side
                  <>
                    Affichage de{" "}
                    {filteredRequestsArray.length > 0
                      ? (currentPage - 1) * requestsPerPage + 1
                      : 0}{" "}
                    à{" "}
                    {Math.min(
                      currentPage * requestsPerPage,
                      filteredRequestsArray.length
                    )}{" "}
                    sur {filteredRequestsArray.length} demandes
                  </>
                )}
              </div>

              {(allRequestsMeta || filteredRequestsArray.length > 0) && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center">
                    <button
                      onClick={prevPendingPage}
                      disabled={
                        allRequestsMeta
                          ? allRequestsMeta.current_page === 1
                          : currentPage === 1
                      }
                      className={`px-3 py-1 rounded-l-md ${
                        (
                          allRequestsMeta
                            ? allRequestsMeta.current_page === 1
                            : currentPage === 1
                        )
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                          : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    {(() => {
                      // Logique similaire à celle de l'onglet "all"
                      const pages = [];
                      const maxVisiblePages = 5;
                      const totalPages = pendingTotalPages;
                      const currentPageNumber = allRequestsMeta
                        ? allRequestsMeta.current_page
                        : currentPage;

                      let startPage = Math.max(
                        1,
                        currentPageNumber - Math.floor(maxVisiblePages / 2)
                      );
                      let endPage = Math.min(
                        totalPages,
                        startPage + maxVisiblePages - 1
                      );

                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key="first"
                            onClick={() => handlePendingPageChange(1)}
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
                            onClick={() => handlePendingPageChange(i)}
                            className={`px-3 py-1 ${
                              i === currentPageNumber
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
                            onClick={() => handlePendingPageChange(totalPages)}
                            className="px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}

                    <button
                      onClick={nextPendingPage}
                      disabled={
                        allRequestsMeta
                          ? allRequestsMeta.current_page ===
                            allRequestsMeta.last_page
                          : currentPage === pendingTotalPages
                      }
                      className={`px-3 py-1 rounded-r-md ${
                        (
                          allRequestsMeta
                            ? allRequestsMeta.current_page ===
                              allRequestsMeta.last_page
                            : currentPage === pendingTotalPages
                        )
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
                    <option value="cancelled">Annulé</option>
                    <option value="failed">Échoué</option>
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
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="orange-money">Orange Money</option>
                    <option value="airtel-money">Airtel Money</option>
                    <option value="afrimoney">Afrimoney</option>
                    <option value="m-pesa">M-Pesa</option>
                    <option value="american-express">American Express</option>
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
                            {stats.pending_requests} (
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
                            {stats.rejected_requests} (
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
                        {stats.monthly_stats && (
                          <Bar
                            data={{
                              labels: stats.monthly_stats.map(
                                (item) => `${item.month}/${item.year}`
                              ),
                              datasets: [
                                {
                                  label: "Montant total",
                                  data: stats.monthly_stats.map(
                                    (item) => item.total_amount
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
                        {stats.payment_method_stats && (
                          <Pie
                            data={{
                              labels: stats.payment_method_stats.map(
                                (item) => item.payment_method
                              ),
                              datasets: [
                                {
                                  data: stats.payment_method_stats.map(
                                    (item) => item.total_amount
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
                            Statut de traitement
                          </th>
                          <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Statut de paiement
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
                                  currency: "USD",
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
                                      {request.status === "cancelled" &&
                                        "Annulé"}
                                      {request.status === "failed" && "Échoué"}
                                    </span>
                                  </span>
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    request.payment_status
                                  )}`}
                                >
                                  <span className="flex items-center">
                                    {getStatusIcon(request.payment_status)}
                                    <span className="ml-1">
                                      {request.payment_status === "pending" &&
                                        "En attente"}
                                      {request.payment_status === "paid" &&
                                        "Payé"}
                                      {request.status === "failed" && "Échoué"}
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
                {allRequestsMeta && (
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
      <Dialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 3,
            maxHeight: "90vh",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(20px)",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(255, 255, 255, 0.2)",
            overflow: "hidden",
          }),
        }}
        BackdropProps={{
          sx: (theme) => ({
            backdropFilter: "blur(8px)",
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.7)"
                : "rgba(0, 0, 0, 0.4)",
          }),
        }}
      >
        {selectedRequest && (
          <>
            <DialogTitle
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  backdropFilter: "blur(10px)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)",
                    borderRadius: "50%",
                    p: 1.5,
                    mr: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  }}
                >
                  <EyeIcon style={{ width: 24, height: 24, color: "white" }} />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Demande #{selectedRequest.id}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Détails de la demande de retrait
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setSelectedRequest(null)}
                size="large"
                sx={{
                  color: "white",
                  position: "relative",
                  zIndex: 1,
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  "&:hover": {
                    background: "rgba(255,255,255,0.2)",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <XMarkIcon style={{ width: 24, height: 24 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                p: 4,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              {/* Section des statuts */}
              <Box sx={{ mb: 5 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={(theme) => ({
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.08) 100%)"
                            : "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)",
                        backdropFilter: "blur(20px)",
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(76, 175, 80, 0.3)"
                            : "1px solid rgba(76, 175, 80, 0.2)",
                        borderRadius: 3,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                            : "0 8px 32px rgba(76, 175, 80, 0.1)",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                              : "0 12px 40px rgba(76, 175, 80, 0.15)",
                        },
                      })}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 40,
                              background:
                                "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                              borderRadius: 2,
                              mr: 2,
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            Statut de traitement
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(selectedRequest.status)}
                          label={
                            selectedRequest.status === "pending"
                              ? "En attente"
                              : selectedRequest.status === "approved"
                              ? "Approuvé"
                              : selectedRequest.status === "rejected"
                              ? "Rejeté"
                              : selectedRequest.status === "cancelled"
                              ? "Annulé"
                              : selectedRequest.status === "failed"
                              ? "Échoué"
                              : selectedRequest.status
                          }
                          color={
                            selectedRequest.status === "approved"
                              ? "success"
                              : selectedRequest.status === "rejected" ||
                                selectedRequest.status === "failed"
                              ? "error"
                              : selectedRequest.status === "cancelled"
                              ? "warning"
                              : "default"
                          }
                          variant="filled"
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={(theme) => ({
                        background:
                          theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(3, 169, 244, 0.08) 100%)"
                            : "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(3, 169, 244, 0.05) 100%)",
                        backdropFilter: "blur(20px)",
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(33, 150, 243, 0.3)"
                            : "1px solid rgba(33, 150, 243, 0.2)",
                        borderRadius: 3,
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                            : "0 8px 32px rgba(33, 150, 243, 0.1)",
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow:
                            theme.palette.mode === "dark"
                              ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                              : "0 12px 40px rgba(33, 150, 243, 0.15)",
                        },
                      })}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 40,
                              background:
                                "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                              borderRadius: 2,
                              mr: 2,
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            Statut de paiement
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(selectedRequest.payment_status)}
                          label={
                            selectedRequest.payment_status === "pending"
                              ? "En attente"
                              : selectedRequest.payment_status === "paid"
                              ? "Payé"
                              : selectedRequest.payment_status === "failed"
                              ? "Échoué"
                              : selectedRequest.payment_status === "initiated"
                              ? "Initialisé"
                              : selectedRequest.payment_status
                          }
                          color={
                            selectedRequest.payment_status === "paid"
                              ? "success"
                              : selectedRequest.payment_status === "failed"
                              ? "error"
                              : selectedRequest.payment_status === "initiated"
                              ? "warning"
                              : "default"
                          }
                          variant="filled"
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Section des informations principales */}
              <Box sx={{ mb: 5 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 3,
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 30,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: 3,
                      mr: 2,
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    }}
                  />
                  Informations générales
                </Typography>
                <Paper
                  sx={(theme) => ({
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)",
                    backdropFilter: "blur(20px)",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 3,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 32px rgba(0,0,0,0.4)"
                        : "0 8px 32px rgba(0,0,0,0.1)",
                    p: 4,
                    mb: 4,
                  })}
                >
                  <Grid container>
                    <Grid
                      item
                      xs={12}
                      md={6}
                      sx={{
                        borderRight: { md: 1 },
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      <Box sx={{ p: 4 }}>
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            ID de la demande
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            #{selectedRequest.id}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Utilisateur
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {selectedRequest.user
                              ? selectedRequest.user.name
                              : "Utilisateur inconnu"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Adresse email
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              wordBreak: "break-word",
                            }}
                          >
                            {selectedRequest.user
                              ? selectedRequest.user.email
                              : "Email inconnu"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 4 }}>
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Montant demandé
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              background:
                                "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: "USD",
                            }).format(selectedRequest.amount)}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Méthode de paiement
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {selectedRequest.payment_method}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Date de création
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {selectedRequest.created_at
                              ? format(
                                  new Date(selectedRequest.created_at),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "Date non disponible"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontWeight: 500,
                            }}
                          >
                            Dernière mise à jour
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: "text.primary" }}
                          >
                            {selectedRequest.updated_at
                              ? format(
                                  new Date(selectedRequest.updated_at),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "Date non disponible"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Section des détails de paiement */}
              <Box sx={{ mb: 5 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 3,
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 30,
                      background:
                        "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                      borderRadius: 3,
                      mr: 2,
                      boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                    }}
                  />
                  Détails du paiement
                </Typography>
                <Paper
                  sx={(theme) => ({
                    background:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                        : "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(3, 169, 244, 0.05) 100%)",
                    backdropFilter: "blur(20px)",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(33, 150, 243, 0.3)"
                        : "1px solid rgba(33, 150, 243, 0.2)",
                    borderRadius: 3,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                        : "0 8px 32px rgba(33, 150, 243, 0.1)",
                    p: 3,
                    maxHeight: 250,
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                      width: 8,
                    },
                    "&::-webkit-scrollbar-track": {
                      background:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.1)",
                      borderRadius: 4,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background:
                        "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                      borderRadius: 4,
                    },
                  })}
                >
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      fontFamily: "JetBrains Mono, Consolas, Monaco, monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      m: 0,
                      color: "text.primary",
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                    }}
                  >
                    {typeof selectedRequest.payment_details === "object"
                      ? JSON.stringify(selectedRequest.payment_details, null, 2)
                      : selectedRequest.payment_details ||
                        "Aucun détail fourni"}
                  </Typography>
                </Paper>
              </Box>

              {/* Section de la note administrative */}
              <Box>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 3,
                    fontWeight: 700,
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 30,
                      background:
                        "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                      borderRadius: 3,
                      mr: 2,
                      boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                    }}
                  />
                  Note administrative
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ajouter une note administrative..."
                  variant="outlined"
                  sx={(theme) => ({
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      background:
                        theme.palette.mode === "dark"
                          ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)",
                      backdropFilter: "blur(20px)",
                      borderRadius: 3,
                      "& fieldset": {
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(76, 175, 80, 0.3)"
                            : "1px solid rgba(76, 175, 80, 0.2)",
                      },
                      "&:hover fieldset": {
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(76, 175, 80, 0.5)"
                            : "1px solid rgba(76, 175, 80, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        border: "2px solid rgba(76, 175, 80, 0.6)",
                        boxShadow: "0 0 0 3px rgba(76, 175, 80, 0.1)",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "text.primary",
                      fontWeight: 500,
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "text.secondary",
                      opacity: 0.7,
                    },
                  })}
                />
              </Box>
            </DialogContent>

            <Box
              sx={(theme) => ({
                background:
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                borderTop:
                  theme.palette.mode === "dark"
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "1px solid rgba(255,255,255,0.1)",
              })}
            >
              <DialogActions sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    width: "100%",
                  }}
                >
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={
                          <CheckIcon style={{ width: 20, height: 20 }} />
                        }
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        disabled={isProcessing}
                        sx={{
                          minWidth: 140,
                          background:
                            "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(76, 175, 80, 0.3)",
                          borderRadius: 3,
                          boxShadow: "0 8px 32px rgba(76, 175, 80, 0.3)",
                          color: "white",
                          fontWeight: 600,
                          textTransform: "none",
                          fontSize: "0.95rem",
                          py: 1.5,
                          transition: "all 0.3s ease-in-out",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #66bb6a 0%, #9ccc65 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 12px 40px rgba(76, 175, 80, 0.4)",
                          },
                          "&:active": {
                            transform: "translateY(0px)",
                          },
                          "&:disabled": {
                            background: "rgba(76, 175, 80, 0.3)",
                            color: "rgba(255, 255, 255, 0.5)",
                          },
                        }}
                      >
                        {isProcessing ? "Traitement..." : "Approuver"}
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={
                          <XMarkIcon style={{ width: 20, height: 20 }} />
                        }
                        onClick={() => handleRejectRequest(selectedRequest.id)}
                        disabled={isProcessing}
                        sx={{
                          minWidth: 140,
                          background:
                            "linear-gradient(135deg, #f44336 0%, #e57373 100%)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(244, 67, 54, 0.3)",
                          borderRadius: 3,
                          boxShadow: "0 8px 32px rgba(244, 67, 54, 0.3)",
                          color: "white",
                          fontWeight: 600,
                          textTransform: "none",
                          fontSize: "0.95rem",
                          py: 1.5,
                          transition: "all 0.3s ease-in-out",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #ef5350 0%, #ef9a9a 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 12px 40px rgba(244, 67, 54, 0.4)",
                          },
                          "&:active": {
                            transform: "translateY(0px)",
                          },
                          "&:disabled": {
                            background: "rgba(244, 67, 54, 0.3)",
                            color: "rgba(255, 255, 255, 0.5)",
                          },
                        }}
                      >
                        {isProcessing ? "Traitement..." : "Rejeter"}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleSaveAdminNote}
                    disabled={isSavingNote}
                    sx={{
                      minWidth: 180,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(102, 126, 234, 0.3)",
                      borderRadius: 3,
                      boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                      color: "white",
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      py: 1.5,
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #7986cb 0%, #8e24aa 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 40px rgba(102, 126, 234, 0.4)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                      "&:disabled": {
                        background: "rgba(102, 126, 234, 0.3)",
                        color: "rgba(255, 255, 255, 0.5)",
                      },
                    }}
                  >
                    {isSavingNote ? "Enregistrement..." : "Enregistrer la note"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedRequest(null)}
                    sx={(theme) => ({
                      minWidth: 120,
                      background:
                        theme.palette.mode === "dark"
                          ? "rgba(31, 41, 55, 0.8)"
                          : "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(20px)",
                      border:
                        theme.palette.mode === "dark"
                          ? "1px solid rgba(255, 255, 255, 0.1)"
                          : "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: 3,
                      color: "text.primary",
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "0.95rem",
                      py: 1.5,
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        background:
                          theme.palette.mode === "dark"
                            ? "rgba(31, 41, 55, 0.9)"
                            : "rgba(255, 255, 255, 0.2)",
                        border:
                          theme.palette.mode === "dark"
                            ? "1px solid rgba(255, 255, 255, 0.2)"
                            : "1px solid rgba(255, 255, 255, 0.3)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                    })}
                  >
                    Fermer
                  </Button>
                </Box>
              </DialogActions>
            </Box>
          </>
        )}
      </Dialog>
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
