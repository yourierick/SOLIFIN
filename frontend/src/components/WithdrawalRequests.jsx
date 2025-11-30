import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import ConfirmationModal from "./ConfirmationModal";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  Box,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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

// Fonction pour formater les montants
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return '0.00';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '0.00';
  
  // Symboles des devises
  const symbols = {
    USD: '$',
    CDF: 'FC'
  };
  
  // Formatage selon la devise
  if (currency === 'CDF') {
    return `${symbols[currency]} ${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    return `${symbols[currency]}${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
};

const WithdrawalRequests = () => {
  const { isDarkMode } = useTheme();
  const { selectedCurrency, toggleCurrency, isCDFEnabled } = useCurrency();

  // États principaux
  const [requestsArray, setRequestsArray] = useState([]);
  const [filteredRequestsArray, setFilteredRequestsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  // États pour les filtres de l'onglet demandes en attente
  const [pendingFilters, setPendingFilters] = useState({
    initiated_by: "",
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
  const [isCancelling, setIsCancelling] = useState(false);

  // États pour les modals
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState(null);

  // États pour la pagination des demandes en attente
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(25);

  // États pour la pagination Material-UI
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalPendingRequests, setTotalPendingRequests] = useState(0);
  const [totalAllRequests, setTotalAllRequests] = useState(0);

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

  // Effet pour recharger les données lorsque la devise change
  useEffect(() => {
    // Réinitialiser la page courante et recharger les données
    setCurrentPage(1);
    
    if (activeTab === "pending") {
      fetchPendingRequests(1);
    } else if (activeTab === "all") {
      fetchAllRequests(1);
    }
  }, [selectedCurrency]);

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
      let url = `/api/admin/withdrawal/requests?page=${page}&per_page=${rowsPerPage}`;

      // Toujours filtrer par devise sélectionnée
      if (isCDFEnabled) {
        url += `&currency=${selectedCurrency}`;
      } else {
        url += `&currency=USD`;
      }

      if (pendingFilters.payment_method) {
        url += `&payment_method=${pendingFilters.payment_method}`;
      }

      if (pendingFilters.initiated_by) {
        url += `&initiated_by=${pendingFilters.initiated_by}`;
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

      console.log(`Pending withdrawal requests for ${selectedCurrency}:`, response.data);

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
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalPendingRequests(response.data.data.total || 0);
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
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalPendingRequests(response.data.requests.total || 0);
        } else {
          // Format non paginé (pour compatibilité)
          setRequestsArray(response.data.requests || []);
          setFilteredRequestsArray(response.data.requests || []);
          
          // Mettre à jour les métadonnées de pagination
          const meta = response.data.meta || {
            current_page: 1,
            last_page: 1,
            per_page: rowsPerPage,
            total: (response.data.requests || []).length,
            from: 1,
            to: (response.data.requests || []).length,
          };
          setAllRequestsMeta(meta);
          setTotalPendingRequests(meta.total);
        }

        // Si nous avons des données paginées, mettre à jour la page courante
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

      if (pendingFilters.initiated_by) {
        // TODO: Remplacer par l'ID réel de l'utilisateur courant
        // Pour l'instant, nous utilisons une logique basique
        const currentUserId = 1; // À remplacer par l'ID réel de l'utilisateur connecté
        
        if (pendingFilters.initiated_by === "self") {
          filtered = filtered.filter(
            (request) => request.user_id === currentUserId
          );
        } else if (pendingFilters.initiated_by === "others") {
          filtered = filtered.filter(
            (request) => request.user_id !== currentUserId
          );
        }
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
      initiated_by: "",
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
      let url = `/api/admin/withdrawal/all?page=${page}&per_page=${rowsPerPage}`;

      // Toujours filtrer par devise sélectionnée
      if (isCDFEnabled) {
        url += `&currency=${selectedCurrency}`;
      } else {
        url += `&currency=USD`;
      }

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

      console.log(`All withdrawal requests for ${selectedCurrency}:`, response.data);

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
          
          // Mettre à jour le total pour la pagination Material-UI
          setTotalAllRequests(response.data.withdrawal_requests.total || 0);
        } else {
          // Format non paginé (pour compatibilité)
          setAllRequests(response.data.withdrawal_requests || []);
          setAllRequestsMeta(null);
          setTotalAllRequests((response.data.withdrawal_requests || []).length);
        }

        // Adapter les données pour correspondre à la structure attendue par le composant
        const statsData = response.data.stats || {};

        console.log(`Statistics for ${selectedCurrency}:`, statsData);

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

  const handleCancelRequest = async (requestId) => {
    try {
      setIsCancelling(true);
      const response = await axios.post(
        `/api/withdrawal/request/${requestId}/cancel`
      );

      if (response.data.success) {
        toast.success("Demande annulée avec succès");
        
        // Rafraîchir les données selon l'onglet actif
        if (activeTab === "pending") {
          fetchPendingRequests();
        } else {
          fetchAllRequests(allRequestsMeta.current_page);
        }
      } else {
        toast.error("Erreur lors de l'annulation de la demande");
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande:", error);
      toast.error("Erreur lors de l'annulation de la demande");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelClick = (request) => {
    setRequestToCancel(request);
    setShowCancelConfirmation(true);
  };

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    
    setShowCancelConfirmation(false);
    await handleCancelRequest(requestToCancel.id);
    setRequestToCancel(null);
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

  // Gestionnaires de pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    handlePageChange(newPage + 1); // Convertir en pagination 1-based pour le backend
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    handlePageChange(1); // Recharger à la première page avec le nouveau nombre de lignes
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
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Demandes de retrait
          </h3>
          <span className="text-base font-normal text-gray-500 dark:text-gray-400">
            Gestion et analyse des demandes de retrait ({selectedCurrency})
          </span>
        </div>
      </div>

      {/* Onglets avec design moderne et ascenseur horizontal pour mobile */}
      <div className="mb-6 relative">
        {/* Conteneur avec ascenseur horizontal pour mobile */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="min-w-max sm:min-w-0">
            {/* Ligne de séparation supérieure */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <ul className="flex text-sm font-medium">
                {/* Onglet "Demandes en attente" */}
                <li className="relative">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`group relative px-6 py-4 text-center font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === "pending"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-all duration-200 ${
                          activeTab === "pending" ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold">Demandes en attente</span>
                    </span>
                    {/* Indicateur actif */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transform transition-all duration-300 ${
                        activeTab === "pending" ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                </li>

                {/* Onglet "Analyse complète" */}
                <li className="relative">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`group relative px-6 py-4 text-center font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === "all"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-all duration-200 ${
                          activeTab === "all" ? "scale-110" : "scale-100 opacity-70 group-hover:opacity-100"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="font-semibold">Analyse complète</span>
                    </span>
                    {/* Indicateur actif */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 transform transition-all duration-300 ${
                        activeTab === "all" ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de défilement pour mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none sm:hidden z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none sm:hidden z-10" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initié par
                  </label>
                  <select
                    value={pendingFilters.initiated_by}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        initiated_by: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Tous</option>
                    <option value="self">Par moi</option>
                    <option value="others">Par d'autres</option>
                  </select>
                </div>
                
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
                ? `Aucune demande de retrait ${selectedCurrency} en cours`
                : `Aucune demande ${selectedCurrency} ne correspond aux critères de recherche`}
            </div>
          ) : (
            <>
              <Paper
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead
                      sx={{
                        backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                      }}
                    >
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          ID
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Utilisateur
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Montant
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Méthode de paiement
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Statut de traitement
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Statut de paiement
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRequestsArray.map((request) => (
                        <TableRow
                          key={request.id}
                          sx={{
                            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                            "&:hover": {
                              backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                            },
                            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                          }}
                        >
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: isDarkMode ? "#ffffff" : "#111827",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.id}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.user
                              ? request.user.name
                              : "Utilisateur inconnu"}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {new Intl.NumberFormat("fr-FR", {
                              style: "currency",
                              currency: selectedCurrency,
                            }).format(request.amount)}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {request.payment_method}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
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
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
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
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.875rem",
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            {new Date(request.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewRequest(request)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                              
                              {/* Bouton annuler - seulement pour les demandes de l'utilisateur courant */}
                              {request.user_id === 1 && request.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelClick(request)}
                                  disabled={isCancelling}
                                  className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                                  title="Annuler ma demande"
                                >
                                  {isCancelling ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                                  ) : (
                                    <XMarkIcon className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                              
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Pagination Material-UI pour les demandes en attente */}
              <TablePagination
                component="div"
                count={totalPendingRequests}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                }
                sx={{
                  color: isDarkMode ? "#fff" : "#475569",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  "& .MuiTablePagination-toolbar": {
                    minHeight: { xs: "40px", sm: "52px" },
                    padding: { xs: "8px", sm: "16px" },
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                  "& .MuiTablePagination-selectIcon": {
                    color: isDarkMode ? "#fff" : "#475569",
                  },
                  "& .MuiTablePagination-select": {
                    backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                    borderRadius: 1,
                    padding: "4px 8px",
                    border: isDarkMode
                      ? "1px solid #374151"
                      : "1px solid #e2e8f0",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                  "& .MuiTablePagination-actions button": {
                    color: isDarkMode ? "#fff" : "#475569",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                    },
                  },
                }}
              />
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
                    Statistiques générales ({selectedCurrency})
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
                              currency: selectedCurrency,
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
                              currency: selectedCurrency,
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
                              currency: selectedCurrency,
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
                              currency: selectedCurrency,
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

                <Paper
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  }}
                >
                  <TableContainer>
                    <Table>
                      <TableHead
                        sx={{
                          backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                        }}
                      >
                        <TableRow>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            ID
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Utilisateur
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Montant
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Méthode de paiement
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Statut de traitement
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Statut de paiement
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Date
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                            }}
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allRequests.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              sx={{
                                fontSize: "0.875rem",
                                color: isDarkMode ? "#d1d5db" : "#6b7280",
                                textAlign: "center",
                                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                              }}
                            >
                              Aucune demande {selectedCurrency} trouvée
                            </TableCell>
                          </TableRow>
                        ) : (
                          allRequests.map((request) => (
                            <TableRow
                              key={request.id}
                              sx={{
                                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                                "&:hover": {
                                  backgroundColor: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#f9fafb",
                                },
                                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  color: isDarkMode ? "#ffffff" : "#111827",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.id}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.user
                                  ? request.user.name
                                  : "Utilisateur inconnu"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {new Intl.NumberFormat("fr-FR", {
                                  style: "currency",
                                  currency: selectedCurrency,
                                }).format(request.amount)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {request.payment_method}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
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
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
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
                                      {request.payment_status === "failed" &&
                                        "Échoué"}
                                    </span>
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: "0.875rem",
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                }}
                              >
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewRequest(request)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    <EyeIcon className="w-5 h-5" />
                                  </button>
                                  
                                  {/* Bouton annuler - seulement pour les demandes de l'utilisateur courant */}
                                  {request.user_id === 1 && request.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelClick(request)}
                                      disabled={isCancelling}
                                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50"
                                      title="Annuler ma demande"
                                    >
                                      {isCancelling ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                                      ) : (
                                        <XMarkIcon className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                  
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
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Pagination Material-UI pour l'onglet d'analyse complète */}
                <TablePagination
                  component="div"
                  count={totalAllRequests}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                  }
                  sx={{
                    color: isDarkMode ? "#fff" : "#475569",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "& .MuiTablePagination-toolbar": {
                      minHeight: { xs: "40px", sm: "52px" },
                      padding: { xs: "8px", sm: "16px" },
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                    "& .MuiTablePagination-selectIcon": {
                      color: isDarkMode ? "#fff" : "#475569",
                    },
                    "& .MuiTablePagination-select": {
                      backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                      borderRadius: 1,
                      padding: "4px 8px",
                      border: isDarkMode
                        ? "1px solid #374151"
                        : "1px solid #e2e8f0",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                    "& .MuiTablePagination-actions button": {
                      color: isDarkMode ? "#fff" : "#475569",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                      },
                    },
                  }}
                />
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
              style={{
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
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
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "85vh",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
          },
        }}
      >
        {selectedRequest && (
          <>
            <DialogTitle
              sx={{
                background: isDarkMode ? "#1f2937" : "#ffffff",
                color: isDarkMode ? "#ffffff" : "#111827",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EyeIcon style={{ 
                    width: 20, 
                    height: 20, 
                    color: isDarkMode ? "#9ca3af" : "#6b7280" 
                  }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Demande #{selectedRequest.id}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      fontSize: "0.875rem"
                    }}
                  >
                    Détails de la demande de retrait
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setSelectedRequest(null)}
                size="small"
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                  },
                }}
              >
                <XMarkIcon style={{ width: 20, height: 20 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, backgroundColor: isDarkMode ? "#1f2937" : "#ffffff" }}>
              {/* Informations principales */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: isDarkMode ? "#ffffff" : "#111827",
                  mb: 2 
                }}>
                  Informations de la demande
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        ID de la demande
                      </Typography>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#111827",
                        fontWeight: 500 
                      }}>
                        #{selectedRequest.id}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Montant
                      </Typography>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#111827",
                        fontWeight: 500 
                      }}>
                        {formatCurrency(selectedRequest.amount, selectedCurrency)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Statut de traitement
                      </Typography>
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
                          size="small"
                        />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Statut de paiement
                      </Typography>
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
                            ? "info"
                            : "default"
                        }
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Détails supplémentaires */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: isDarkMode ? "#ffffff" : "#111827",
                  mb: 2 
                }}>
                  Détails supplémentaires
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Utilisateur
                      </Typography>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#111827",
                        fontWeight: 500 
                      }}>
                        {selectedRequest.user?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Méthode de paiement
                      </Typography>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#111827",
                        fontWeight: 500 
                      }}>
                        {selectedRequest.payment_method || 'N/A'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        mb: 0.5 
                      }}>
                        Date de demande
                      </Typography>
                      <Typography sx={{ 
                        color: isDarkMode ? "#ffffff" : "#111827",
                        fontWeight: 500 
                      }}>
                        {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
              </Box>

              {/* Métadonnées */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: isDarkMode ? "#ffffff" : "#111827",
                  mb: 2 
                }}>
                  Métadonnées
                </Typography>
                
                <Box sx={{ 
                  backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                  borderRadius: 2,
                  p: 3,
                  border: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      {selectedRequest.payment_details && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          mb: 1 
                        }}>
                          Métadonnées supplémentaires
                        </Typography>
                        <Box sx={{ 
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          borderRadius: 1,
                          p: 2,
                          border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`
                        }}>
                          <Typography sx={{ 
                            color: isDarkMode ? "#ffffff" : "#111827",
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all'
                          }}>
                            {(() => {
                              try {
                                const details = typeof selectedRequest.payment_details === 'string' 
                                  ? JSON.parse(selectedRequest.payment_details) 
                                  : selectedRequest.payment_details;
                                
                                return Object.entries(details).map(([key, value]) => {
                                  return `${key}: ${value}`;
                                }).join('\n');
                              } catch (error) {
                                return selectedRequest.payment_details;
                              }
                            })()}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              {/* Note administrative */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: isDarkMode ? "#ffffff" : "#111827",
                  mb: 2 
                }}>
                  Note administrative
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ajouter une note administrative..."
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? "#ffffff" : "#111827",
                      '& fieldset': {
                        borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: "#3b82f6",
                      },
                    },
                  }}
                />
              </Box>
            </DialogContent>

            <DialogActions
              sx={{
                p: 3,
                borderTop: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
              }}
            >
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
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        variant="contained"
                        color="success"
                        disabled={isProcessing}
                        startIcon={<CheckIcon />}
                        sx={{
                          backgroundColor: "#10b981",
                          "&:hover": {
                            backgroundColor: "#059669",
                          },
                        }}
                      >
                        {isProcessing ? "Traitement..." : "Approuver"}
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(selectedRequest.id)}
                        variant="contained"
                        color="error"
                        disabled={isProcessing}
                        startIcon={<XMarkIcon />}
                        sx={{
                          backgroundColor: "#ef4444",
                          "&:hover": {
                            backgroundColor: "#dc2626",
                          },
                        }}
                      >
                        {isProcessing ? "Traitement..." : "Rejeter"}
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={handleSaveAdminNote}
                    variant="contained"
                    disabled={isSavingNote || !adminNote.trim()}
                    sx={{
                      backgroundColor: "#3b82f6",
                      "&:hover": {
                        backgroundColor: "#2563eb",
                      },
                    }}
                  >
                    {isSavingNote ? "Enregistrement..." : "Enregistrer la note"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedRequest(null)}
                    sx={{
                      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                        borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
                      },
                    }}
                  >
                    Fermer
                  </Button>
                </Box>
              </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Modal de confirmation d'annulation */}
      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={() => {
          setShowCancelConfirmation(false);
          setRequestToCancel(null);
        }}
        onConfirm={confirmCancelRequest}
        title="Annuler la demande de retrait"
        message={`Êtes-vous sûr de vouloir annuler votre demande de retrait de ${requestToCancel ? formatCurrency(requestToCancel.amount, requestToCancel.currency) : ''} ? Cette action est irréversible.`}
        confirmText="Oui, annuler"
        cancelText="Non, garder"
        type="warning"
        isLoading={isCancelling}
      />
      
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
