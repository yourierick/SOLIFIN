import React, { useState, useEffect, useMemo, useRef } from "react";
import { Tab } from "@headlessui/react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChatBubbleBottomCenterTextIcon,
  TagIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import AdminPostDetailModal from "./components/AdminPostDetailModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import { toast } from "react-toastify";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AdvertisementValidation() {
  const [allItems, setAllItems] = useState({
    advertisements: [],
    jobOffers: [],
    businessOpportunities: [],
    socialEvents: [],
    digitalProducts: [],
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportedStatus, setSelectedReportedStatus] = useState(null);

  // Référence pour éviter le premier chargement dans le useEffect de pagination
  const hasLoadedPagination = useRef(false);

  // États pour la pagination backend
  const [pagination, setPagination] = useState({
    advertisements: { currentPage: 1, totalPages: 1, total: 0, itemsPerPage: 10 },
    jobOffers: { currentPage: 1, totalPages: 1, total: 0, itemsPerPage: 10 },
    businessOpportunities: { currentPage: 1, totalPages: 1, total: 0, itemsPerPage: 10 },
    socialEvents: { currentPage: 1, totalPages: 1, total: 0, itemsPerPage: 10 },
    digitalProducts: { currentPage: 1, totalPages: 1, total: 0, itemsPerPage: 10 },
  });

  // Compteurs pour les publications en attente
  const pendingCounts = useMemo(
    () => ({
      advertisements: Array.isArray(allItems.advertisements?.data)
        ? allItems.advertisements.data.filter((item) => item.statut === "en_attente")
            .length
        : 0,
      jobOffers: Array.isArray(allItems.jobOffers?.data)
        ? allItems.jobOffers.data.filter((item) => item.statut === "en_attente")
            .length
        : 0,
      businessOpportunities: Array.isArray(allItems.businessOpportunities?.data)
        ? allItems.businessOpportunities.data.filter(
            (item) => item.statut === "en_attente"
          ).length
        : 0,
      digitalProducts: Array.isArray(allItems.digitalProducts?.data)
        ? allItems.digitalProducts.data.filter(
            (item) => item.statut === "en_attente"
          ).length
        : 0,
      socialEvents: Array.isArray(allItems.socialEvents?.data)
        ? allItems.socialEvents.data.filter((item) => item.statut === "en_attente")
            .length
        : 0,
    }),
    [allItems]
  );
  const [filters, setFilters] = useState({
    advertisements: { statut: "all", etat: "all" },
    jobOffers: { statut: "all", etat: "all" },
    businessOpportunities: { statut: "all", etat: "all" },
    socialEvents: { statut: "all", etat: "all" },
    digitalProducts: { statut: "all", etat: "all" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: null });

  useEffect(() => {
    fetchAllItems();
  }, []);

  // Recharger les données lorsque les filtres changent
  useEffect(() => {
    // Ne pas appeler fetchData au premier chargement (déjà fait par fetchAllItems)
    if (pagination.advertisements.currentPage === 1 && 
        pagination.jobOffers.currentPage === 1 && 
        pagination.businessOpportunities.currentPage === 1 && 
        pagination.socialEvents.currentPage === 1 && 
        pagination.digitalProducts.currentPage === 1) {
      // Premier chargement - ne rien faire, fetchAllItems s'en occupe
      return;
    }
    // Pour les changements de filtres, appeler fetchData
    fetchData();
  }, [filters]);

  // Recharger les données lorsque la page change
  useEffect(() => {
    
    // Skip le premier chargement - fetchAllItems() s'en occupe déjà
    if (!hasLoadedPagination.current) {
      hasLoadedPagination.current = true;
      return;
    }
    // Pour les changements de page, appeler fetchData
    fetchData();
  }, [
    pagination.advertisements.currentPage,
    pagination.jobOffers.currentPage,
    pagination.businessOpportunities.currentPage,
    pagination.socialEvents.currentPage,
    pagination.digitalProducts.currentPage
  ]);

  // Fonction pour récupérer toutes les données et afficher un toast de confirmation
  const fetchAllItems = () => {
    fetchData();
    toast.info("Données actualisées");
  };

  // Fonction pour changer de page
  const changePage = (type, newPage) => {
    const paginationKey = type === "advertisement" ? "advertisements" :
                         type === "jobOffer" ? "jobOffers" :
                         type === "businessOpportunity" ? "businessOpportunities" :
                         type === "digitalProduct" ? "digitalProducts" : "socialEvents";
    
    setPagination(prev => {
      const updated = {
        ...prev,
        [paginationKey]: {
          ...prev[paginationKey],
          currentPage: newPage
        }
      };
      return updated;
    });
  };

  // Fonction pour mettre à jour les filtres et réinitialiser la page
  const updateFilter = (type, filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [filterName]: value,
      },
    }));
    
    // Réinitialiser la page à 1 lors du changement de filtre
    const paginationKey = type === "advertisement" ? "advertisements" :
                         type === "jobOffer" ? "jobOffers" :
                         type === "businessOpportunity" ? "businessOpportunities" :
                         type === "digitalProduct" ? "digitalProducts" : "socialEvents";
    
    setPagination(prev => ({
      ...prev,
      [paginationKey]: {
        ...prev[paginationKey],
        currentPage: 1
      }
    }));
  };

  // Fonction pour récupérer les données avec pagination backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [
        advertisementsRes,
        jobOffersRes,
        businessOpportunitiesRes,
        socialEventsRes,
        digitalProductsRes,
      ] = await Promise.all([
        axios.get(`/api/admin/advertisements?page=${pagination.advertisements.currentPage}&per_page=${pagination.advertisements.itemsPerPage}&statut=${filters.advertisements.statut}&etat=${filters.advertisements.etat}`),
        axios.get(`/api/admin/job-offers?page=${pagination.jobOffers.currentPage}&per_page=${pagination.jobOffers.itemsPerPage}&statut=${filters.jobOffers.statut}&etat=${filters.jobOffers.etat}`),
        axios.get(`/api/admin/business-opportunities?page=${pagination.businessOpportunities.currentPage}&per_page=${pagination.businessOpportunities.itemsPerPage}&statut=${filters.businessOpportunities.statut}&etat=${filters.businessOpportunities.etat}`),
        axios.get(`/api/admin/social-events?page=${pagination.socialEvents.currentPage}&per_page=${pagination.socialEvents.itemsPerPage}&statut=${filters.socialEvents.statut}&etat=${filters.socialEvents.etat}`),
        axios.get(`/api/admin/digital-products?page=${pagination.digitalProducts.currentPage}&per_page=${pagination.digitalProducts.itemsPerPage}&statut=${filters.digitalProducts.statut}&etat=${filters.digitalProducts.etat}`),
      ]);

      // Mettre à jour les données et la pagination
      setAllItems({
        advertisements: advertisementsRes.data.advertisements,
        jobOffers: jobOffersRes.data.jobOffers,
        businessOpportunities: businessOpportunitiesRes.data.businessOpportunities,
        socialEvents: socialEventsRes.data.socialEvents,
        digitalProducts: digitalProductsRes.data.digitalProducts,
      });

      // Mettre à jour les états de pagination
      setPagination(prev => ({
        ...prev,
        advertisements: {
          ...prev.advertisements,
          currentPage: advertisementsRes.data.advertisements.current_page,
          totalPages: advertisementsRes.data.advertisements.last_page,
          total: advertisementsRes.data.advertisements.total,
        },
        jobOffers: {
          ...prev.jobOffers,
          currentPage: jobOffersRes.data.jobOffers.current_page,
          totalPages: jobOffersRes.data.jobOffers.last_page,
          total: jobOffersRes.data.jobOffers.total,
        },
        businessOpportunities: {
          ...prev.businessOpportunities,
          currentPage: businessOpportunitiesRes.data.businessOpportunities.current_page,
          totalPages: businessOpportunitiesRes.data.businessOpportunities.last_page,
          total: businessOpportunitiesRes.data.businessOpportunities.total,
        },
        socialEvents: {
          ...prev.socialEvents,
          currentPage: socialEventsRes.data.socialEvents.current_page,
          totalPages: socialEventsRes.data.socialEvents.last_page,
          total: socialEventsRes.data.socialEvents.total,
        },
        digitalProducts: {
          ...prev.digitalProducts,
          currentPage: digitalProductsRes.data.digitalProducts.current_page,
          totalPages: digitalProductsRes.data.digitalProducts.last_page,
          total: digitalProductsRes.data.digitalProducts.total,
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir les éléments à afficher (données déjà paginées par le backend)
  const getItemsForType = (type) => {
    switch (type) {
      case "advertisement":
        return allItems.advertisements?.data || [];
      case "jobOffer":
        return allItems.jobOffers?.data || [];
      case "businessOpportunity":
        return allItems.businessOpportunities?.data || [];
      case "socialEvent":
        return allItems.socialEvents?.data || [];
      case "digitalProduct":
        return allItems.digitalProducts?.data || [];
      default:
        return [];
    }
  };

  // Fonction pour obtenir les informations de pagination pour un type
  const getPaginationInfo = (type) => {
    const paginationKey = type === "advertisement" ? "advertisements" :
                         type === "jobOffer" ? "jobOffers" :
                         type === "businessOpportunity" ? "businessOpportunities" :
                         type === "digitalProduct" ? "digitalProducts" : "socialEvents";
    
    return pagination[paginationKey];
  };

  const openPreviewModal = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setSelectedItem(null);
    setSelectedItemType(null);
    setIsPreviewModalOpen(false);
  };

  const openRejectModal = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setSelectedItem(null);
    setRejectionReason("");
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedReportedStatus(null);
  };

  // Fonction pour supprimer un statut social signalé
  const handleDeleteReportedStatus = async (id) => {
    try {
      await axios.delete(`/api/admin/social-events/${id}`);

      // Mettre à jour la liste des statuts sociaux
      setAllItems((prev) => ({
        ...prev,
        socialEvents: prev.socialEvents.filter((item) => item.id !== id),
      }));

      closeReportModal();
      toast.success("Le statut social a été supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression du statut social:", error);
      toast.error(
        "Une erreur est survenue lors de la suppression du statut social"
      );
    }
  };

  const handleApprove = async (id, type) => {
    try {
      let endpoint = "";
      let stateKey = "";

      switch (type) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}/approve`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}/approve`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}/approve`;
          stateKey = "businessOpportunities";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}/approve`;
          stateKey = "socialEvents";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}/approve`;
          stateKey = "digitalProducts";
          break;
        default:
          return;
      }

      await axios.post(endpoint);

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === id ? { ...item, statut: "approuvé" } : item
        ),
      }));
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
    }
  };

  const handleChangeEtat = async (id, type, newEtat) => {
    try {
      let endpoint = "";
      let stateKey = "";

      switch (type) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}/etat`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}/etat`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}/etat`;
          stateKey = "businessOpportunities";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}/etat`;
          stateKey = "socialEvents";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}/etat`;
          stateKey = "digitalProducts";
          break;
        default:
          return;
      }

      await axios.patch(endpoint, { etat: newEtat });

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === id ? { ...item, etat: newEtat } : item
        ),
      }));
    } catch (error) {
      console.error("Erreur lors du changement d'état:", error);
    }
  };

  // Fonction pour annuler le rejet d'une publication
  const handleCancelReject = async (id, type) => {
    try {
      let endpoint = "";
      let stateKey = "";

      switch (type) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}/status`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}/status`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}/status`;
          stateKey = "businessOpportunities";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}/status`;
          stateKey = "digitalProducts";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}/status`;
          stateKey = "socialEvents";
          break;
        default:
          return;
      }

      await axios.patch(endpoint, { statut: "en_attente" });

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === id
            ? { ...item, statut: "en_attente", raison_rejet: null }
            : item
        ),
      }));
    } catch (error) {
      console.error("Erreur lors de l'annulation du rejet:", error);
    }
  };

  // Fonction pour ouvrir le modal de confirmation de suppression
  const openDeleteModal = (id, type) => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  // Fonction pour supprimer une publication
  const handleDelete = async () => {
    const { id, type } = itemToDelete;
    if (!id || !type) return;

    try {
      let endpoint = "";
      let stateKey = "";

      switch (type) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}`;
          stateKey = "businessOpportunities";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}`;
          stateKey = "digitalProducts";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}`;
          stateKey = "socialEvents";
          break;
        default:
          return;
      }

      await axios.delete(endpoint);

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].filter((item) => item.id !== id),
      }));

      toast.success("Publication supprimée avec succès");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !selectedItemType || !rejectionReason.trim()) return;

    try {
      let endpoint = "";
      let stateKey = "";

      switch (selectedItemType) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${selectedItem.id}/reject`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${selectedItem.id}/reject`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${selectedItem.id}/reject`;
          stateKey = "businessOpportunities";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${selectedItem.id}/reject`;
          stateKey = "socialEvents";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${selectedItem.id}/reject`;
          stateKey = "digitalProducts";
          break;
        default:
          return;
      }

      await axios.post(endpoint, { raison_rejet: rejectionReason });

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === selectedItem.id
            ? { ...item, statut: "rejeté", raison_rejet: rejectionReason }
            : item
        ),
      }));

      closeRejectModal();
      toast.success("Publication rejetée avec succès");
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      toast.error("Erreur lors du rejet de la publication");
    }
  };

  // Composant pour afficher le badge de statut
  const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case "en_attente":
          return {
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-800 dark:text-yellow-300",
            label: "En attente",
          };
        case "approuvé":
          return {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-800 dark:text-green-300",
            label: "Approuvé",
          };
        case "rejeté":
          return {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-800 dark:text-red-300",
            label: "Rejeté",
          };
        default:
          return {
            bg: "bg-gray-100 dark:bg-gray-700",
            text: "text-gray-800 dark:text-gray-300",
            label: status,
          };
      }
    };

    const { bg, text, label } = getStatusConfig();

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  // Composant pour afficher le badge d'état
  const StateBadge = ({ state }) => {
    const getStateConfig = () => {
      switch (state) {
        case "disponible":
          return {
            bg: "bg-blue-100 dark:bg-blue-900/30",
            text: "text-blue-800 dark:text-blue-300",
            label: "Disponible",
          };
        case "terminé":
          return {
            bg: "bg-purple-100 dark:bg-purple-900/30",
            text: "text-purple-800 dark:text-purple-300",
            label: "Terminé",
          };
        default:
          return {
            bg: "bg-gray-100 dark:bg-gray-700",
            text: "text-gray-800 dark:text-gray-300",
            label: state,
          };
      }
    };

    const { bg, text, label } = getStateConfig();

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  // Fonction pour obtenir la couleur de bordure en fonction du statut
  const getStatusBorderColor = (status) => {
    switch (status) {
      case "en_attente":
        return "border-yellow-200 dark:border-yellow-900/50";
      case "approuvé":
        return "border-green-200 dark:border-green-900/50";
      case "rejeté":
        return "border-red-200 dark:border-red-900/50";
      default:
        return "border-gray-200 dark:border-gray-700";
    }
  };

  // Composant de pagination utilisant les informations du backend avec design moderne
  const Pagination = ({ type }) => {
    const paginationInfo = getPaginationInfo(type);
    const { currentPage, totalPages, total } = paginationInfo;

    // Afficher la pagination s'il y a des éléments
    if (total === 0) return null;

    // Générer les pages à afficher (logique intelligente pour éviter trop de boutons)
    const getPagesToShow = () => {
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, '...', totalPages];
      }
      
      if (currentPage >= totalPages - 3) {
        return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      }
      
      return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pagesToShow = getPagesToShow();

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Informations sur la pagination */}
        <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {total}
          </span>
          <span className="ml-1">élément{total > 1 ? 's' : ''}</span>
          <span className="mx-2">•</span>
          <span>Page</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">
            {currentPage}
          </span>
          <span className="mx-1">sur</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {totalPages}
          </span>
        </div>

        {/* Contrôles de pagination */}
        <div className="flex items-center space-x-1 order-1 sm:order-2">
          {/* Bouton Précédent */}
          <button
            onClick={() => changePage(type, currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Précédent</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {/* Séparateur */}
          <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Numéros de page */}
          <div className="flex items-center space-x-1">
            {pagesToShow.map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => changePage(type, page)}
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentPage === page
                      ? "bg-primary-600 text-white shadow-sm ring-2 ring-primary-500 ring-offset-2 dark:bg-primary-700 dark:ring-primary-600"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Séparateur */}
          <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Bouton Suivant */}
          <button
            onClick={() => changePage(type, currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              currentPage >= totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <span className="hidden sm:inline">Suivant</span>
            <span className="sm:hidden">Next</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Sélecteur de page rapide (mobile uniquement) */}
        <div className="flex items-center space-x-2 order-3 sm:hidden">
          <label className="text-xs text-gray-600 dark:text-gray-400">Aller à:</label>
          <select
            value={currentPage}
            onChange={(e) => changePage(type, parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <option key={page} value={page}>{page}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderItemList = (type) => {
    const items = getItemsForType(type);
    
    if (items.length === 0) {
      return (
        <div className="text-center py-16 px-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 shadow-sm">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun élément correspondant aux filtres
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`shadow-sm hover:shadow-md transition-all duration-200 rounded-xl p-5 border-l-4 ${
                type === "socialEvent" && item.needs_attention
                  ? "border-l-red-500 dark:border-l-red-500"
                  : getStatusBorderColor(item.statut).replace(
                      "border",
                      "border-l"
                    )
              } ${
                isDarkMode ? "bg-[#293545ff]" : "bg-white"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {item.titre || item.content}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <StatusBadge status={item.statut} />
                      {item.etat && <StateBadge state={item.etat} />}

                      {/* Badge de signalement pour les statuts sociaux */}
                      {type === "socialEvent" && item.reports_count > 0 && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.needs_attention
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                          title={`${item.reports_count} signalement${
                            item.reports_count > 1 ? "s" : ""
                          }`}
                        >
                          <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                          {item.reports_count}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="inline-flex items-center">
                      <span className="font-medium">
                        {item.user?.nom || item.user?.name} {item.user?.prenom}
                      </span>
                    </span>
                    <span className="inline-block h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {item.description || item.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap md:flex-nowrap gap-2 items-center justify-end md:justify-start mt-4 md:mt-0">
                  {/* Bouton pour voir les signalements (uniquement pour les statuts sociaux) */}
                  {type === "socialEvent" && item.reports_count > 0 && (
                    <button
                      title={`Voir les ${item.reports_count} signalement${
                        item.reports_count > 1 ? "s" : ""
                      }`}
                      onClick={() => {
                        setSelectedReportedStatus(item);
                        setReportModalOpen(true);
                      }}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        item.needs_attention
                          ? "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                          : "text-yellow-500 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
                      }`}
                      aria-label={`Voir les ${item.reports_count} signalement${
                        item.reports_count > 1 ? "s" : ""
                      }`}
                    >
                      <ShieldExclamationIcon className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    title="Voir les détails"
                    onClick={() => openPreviewModal(item, type)}
                    className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all duration-200 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-300"
                    aria-label="Voir les détails"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {item.statut !== "approuvé" && (
                    <button
                      title="Approuver"
                      onClick={() => handleApprove(item.id, type)}
                      className="p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all duration-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400"
                      aria-label="Approuver"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  {item.statut === "rejeté" ? (
                    <button
                      title="Annuler le rejet"
                      onClick={() => handleCancelReject(item.id, type)}
                      className="p-2 rounded-full bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition-all duration-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:text-yellow-400"
                      aria-label="Annuler le rejet"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      title="Rejeter"
                      onClick={() => openRejectModal(item, type)}
                      className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
                      aria-label="Rejeter"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  {/* Ne pas afficher le bouton "Changer l'état" pour les statuts sociaux */}
                  {type !== "socialEvent" && type !== "digitalProduct" && (
                    <button
                      title="Changer l'état"
                      onClick={() =>
                        handleChangeEtat(
                          item.id,
                          type,
                          item.etat === "disponible" ? "terminé" : "disponible"
                        )
                      }
                      className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400"
                      aria-label="Changer l'état"
                    >
                      <TagIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    title="Supprimer"
                    onClick={() => openDeleteModal(item.id, type)}
                    className="p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
                    aria-label="Supprimer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Obtenir le thème sombre/clair du système
  const isDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Gérer l'approbation d'une publication depuis le modal
  const handleModalApprove = async (id) => {
    await handleApprove(id, selectedItemType);
    closePreviewModal();
  };

  // Gérer le rejet d'une publication depuis le modal
  const handleModalReject = async (id, reason) => {
    try {
      let endpoint = "";
      let stateKey = "";

      switch (selectedItemType) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}/reject`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}/reject`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}/reject`;
          stateKey = "businessOpportunities";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}/reject`;
          stateKey = "digitalProducts";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}/reject`;
          stateKey = "socialEvents";
          break;
        default:
          return;
      }

      await axios.post(endpoint, { raison_rejet: reason });

      // Mettre à jour la liste des items
      setAllItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === id ? { ...item, statut: "rejeté" } : item
        ),
      }));

      closePreviewModal();
      toast.success("Publication rejetée avec succès");
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      toast.error("Erreur lors du rejet de la publication");
    }
  };

  // Gérer la mise en attente d'une publication depuis le modal
  const handleModalPending = async (id) => {
    try {
      let endpoint = "";
      let stateKey = "";

      switch (selectedItemType) {
        case "advertisement":
          endpoint = `/api/admin/advertisements/${id}/status`;
          stateKey = "advertisements";
          break;
        case "jobOffer":
          endpoint = `/api/admin/job-offers/${id}/status`;
          stateKey = "jobOffers";
          break;
        case "businessOpportunity":
          endpoint = `/api/admin/business-opportunities/${id}/status`;
          stateKey = "businessOpportunities";
          break;
        case "digitalProduct":
          endpoint = `/api/admin/digital-products/${id}/status`;
          stateKey = "digitalProducts";
          break;
        case "socialEvent":
          endpoint = `/api/admin/social-events/${id}/status`;
          stateKey = "socialEvents";
          break;
        default:
          return;
      }

      await axios.patch(endpoint, { statut: "en_attente" });

      // Mettre à jour la liste des items en attente
      setPendingItems((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].map((item) =>
          item.id === id ? { ...item, statut: "en_attente" } : item
        ),
      }));

      closePreviewModal();
    } catch (error) {
      console.error("Erreur lors de la mise en attente:", error);
    }
  };

  // Composant de filtres pour chaque type
  const FilterControls = ({ type, typeLabel }) => {
    const currentType = type === "advertisements" ? "advertisement" :
                         type === "jobOffers" ? "jobOffer" :
                         type === "businessOpportunities" ? "businessOpportunity" :
                         type === "digitalProducts" ? "digitalProduct" : "socialEvent";
    const itemsCount = getItemsForType(currentType).length;

    return (
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Filtre par statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Statut
          </label>
          <select
            value={filters[type].statut}
            onChange={(e) => updateFilter(type, "statut", e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="all">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="approuvé">Approuvé</option>
            <option value="rejeté">Rejeté</option>
          </select>
        </div>

        {/* Filtre par état (si applicable) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            État
          </label>
          <select
            value={filters[type].etat}
            onChange={(e) => updateFilter(type, "etat", e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="all">Tous</option>
            <option value="disponible">Disponible</option>
            <option value="terminé">Terminé</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {itemsCount} {typeLabel}{itemsCount > 1 ? "s" : ""} affiché{itemsCount > 1 ? "s" : ""}
        </div>
      </div>
    );
  };

  // Rendu du modal de détails avec le nouveau composant
  const renderPreviewModal = () => {
    if (!selectedItem) return null;

    // Déterminer le type de publication pour le modal
    let postType = "";
    switch (selectedItemType) {
      case "advertisement":
        postType = "publicites";
        break;
      case "jobOffer":
        postType = "offres_emploi";
        break;
      case "businessOpportunity":
        postType = "opportunites_affaires";
        break;
      case "digitalProduct":
        postType = "produits_numeriques";
        break;
      case "socialEvent":
        postType = "statuts_sociaux";
        break;
      default:
        postType = "";
    }

    return (
      <AdminPostDetailModal
        isOpen={isPreviewModalOpen}
        onClose={closePreviewModal}
        post={selectedItem}
        postType={postType}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        onPending={handleModalPending}
        isDarkMode={isDarkMode}
      />
    );
  };

  const renderRejectModal = () => {
    if (!selectedItem) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Raison du rejet
            </h3>
            <button
              onClick={closeRejectModal}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Veuillez fournir une raison pour le rejet de cette publication.
              Cela aidera l'utilisateur à comprendre pourquoi sa publication n'a
              pas été approuvée.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32 dark:bg-gray-700 dark:text-white"
              placeholder="Raison du rejet..."
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 ${
                  !rejectionReason.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Rejeter la publication
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu du modal de signalements
  const renderReportModal = () => {
    if (!selectedReportedStatus) return null;

    // Obtenir les raisons de signalement et les compter
    const reportReasons = selectedReportedStatus.report_reasons || {};
    const totalReports = selectedReportedStatus.reports_count || 0;

    // Traduire les raisons de signalement
    const reasonTranslations = {
      inappropriate_content: "Contenu inapproprié",
      harassment: "Harcèlement",
      spam: "Spam",
      false_information: "Fausse information",
      violence: "Violence",
      hate_speech: "Discours haineux",
      other: "Autre raison",
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              Signalements
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {totalReports}
              </span>
            </h3>
            <button
              onClick={closeReportModal}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 dark:text-white">
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Statut signalé
              </h4>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {selectedReportedStatus.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Créé par{" "}
                  {selectedReportedStatus.user?.nom ||
                    selectedReportedStatus.user?.name}{" "}
                  {selectedReportedStatus.user?.prenom} •
                  {new Date(
                    selectedReportedStatus.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Raisons des signalements
              </h4>
              <div className="mt-2 space-y-2">
                {Object.entries(reportReasons).map(([reason, count]) => (
                  <div
                    key={reason}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {reasonTranslations[reason] || reason}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                {selectedReportedStatus.needs_attention
                  ? "⚠️ Ce statut a reçu un nombre important de signalements et nécessite votre attention."
                  : "Ce statut a reçu quelques signalements."}
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeReportModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Fermer
              </button>
              <button
                onClick={() =>
                  handleDeleteReportedStatus(selectedReportedStatus.id)
                }
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Supprimer le statut
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Validation des publications
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Gérez les publications en attente de validation.
          </p>
        </div>
        <button
          onClick={fetchAllItems}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-600 dark:focus:ring-offset-gray-800"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Actualiser
        </button>
      </div>

      <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
        <Tab.Group>
          {/* Container avec scroll horizontal pour mobile */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <Tab.List className="flex space-x-1 sm:space-x-2 rounded-t-xl bg-primary-50 dark:bg-gray-700 p-1 sm:p-1.5 min-w-max sm:min-w-0">
              <Tab
                className={({ selected }) =>
                  classNames(
                    "flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                    selected
                      ? "bg-white dark:bg-gray-800 shadow-md text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                  )
                }
              >
                <div className="relative flex items-center justify-center">
                  {pendingCounts.advertisements > 0 && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                      {pendingCounts.advertisements}
                    </span>
                  )}
                  Publicités
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                    selected
                      ? "bg-white dark:bg-gray-800 shadow-md text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                  )
                }
              >
                <div className="relative flex items-center justify-center">
                  {pendingCounts.jobOffers > 0 && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                      {pendingCounts.jobOffers}
                    </span>
                  )}
                  Offres d'emploi
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                    selected
                      ? "bg-white dark:bg-gray-800 shadow-md text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                  )
                }
              >
                <div className="relative flex items-center justify-center">
                  {pendingCounts.businessOpportunities > 0 && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                      {pendingCounts.businessOpportunities}
                    </span>
                  )}
                  Opportunités
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                    selected
                      ? "bg-white dark:bg-gray-800 shadow-md text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                  )
                }
              >
                <div className="relative flex items-center justify-center">
                  {pendingCounts.digitalProducts > 0 && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                      {pendingCounts.digitalProducts}
                    </span>
                  )}
                  <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  Numériques
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "flex-shrink-0 sm:flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200",
                    "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                    selected
                      ? "bg-white dark:bg-gray-800 shadow-md text-primary-700 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                  )
                }
              >
                <div className="relative flex items-center justify-center">
                  {pendingCounts.socialEvents > 0 && (
                    <span className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                    {pendingCounts.socialEvents}
                  </span>
                )}
                <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Statuts Sociaux
              </div>
            </Tab>
          </Tab.List>
          </div>
          <Tab.Panels>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls type="advertisements" typeLabel="publicité" />
                  {renderItemList("advertisement")}
                  <Pagination type="advertisement" />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls type="jobOffers" typeLabel="offre d'emploi" />
                  {renderItemList("jobOffer")}
                  <Pagination type="jobOffer" />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls
                    type="businessOpportunities"
                    typeLabel="opportunité d'affaire"
                  />
                  {renderItemList("businessOpportunity")}
                  <Pagination type="businessOpportunity" />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls
                    type="digitalProducts"
                    typeLabel="produit numérique"
                  />
                  {renderItemList("digitalProduct")}
                  <Pagination type="digitalProduct" />
                </>
              )}
            </Tab.Panel>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls
                    type="socialEvents"
                    typeLabel="statut social"
                  />
                  {renderItemList("socialEvent")}
                  <Pagination type="socialEvent" />
                </>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Modals */}
      {isPreviewModalOpen && renderPreviewModal()}
      {isRejectModalOpen && renderRejectModal()}
      {reportModalOpen && renderReportModal()}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirmation de suppression"
        message="Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        type="danger"
      />
    </div>
  );
}
