import React, { useState, useEffect, useMemo } from "react";
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
} from "@heroicons/react/24/outline";
import axios from "axios";
import AdminPostDetailModal from "./components/AdminPostDetailModal";
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
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReportedStatus, setSelectedReportedStatus] = useState(null);
  const [filteredItems, setFilteredItems] = useState({
    advertisements: [],
    jobOffers: [],
    businessOpportunities: [],
    socialEvents: [],
  });

  // Compteurs pour les publications en attente
  const pendingCounts = useMemo(
    () => ({
      advertisements: allItems.advertisements.filter(
        (item) => item.statut === "en_attente"
      ).length,
      jobOffers: allItems.jobOffers.filter(
        (item) => item.statut === "en_attente"
      ).length,
      businessOpportunities: allItems.businessOpportunities.filter(
        (item) => item.statut === "en_attente"
      ).length,
      socialEvents: allItems.socialEvents.filter(
        (item) => item.statut === "en_attente"
      ).length,
    }),
    [allItems]
  );
  const [filters, setFilters] = useState({
    advertisements: { statut: "all", etat: "all" },
    jobOffers: { statut: "all", etat: "all" },
    businessOpportunities: { statut: "all", etat: "all" },
    socialEvents: { statut: "all" },
  });

  // État pour la pagination
  const [pagination, setPagination] = useState({
    advertisements: { currentPage: 1, itemsPerPage: 3 },
    jobOffers: { currentPage: 1, itemsPerPage: 3 },
    businessOpportunities: { currentPage: 1, itemsPerPage: 3 },
    socialEvents: { currentPage: 1, itemsPerPage: 3 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    fetchAllItems();
  }, []);

  // Appliquer les filtres lorsque les filtres ou les données changent
  useEffect(() => {
    applyFilters();
  }, [allItems, filters]);

  const fetchAllItems = async () => {
    try {
      setIsLoading(true);
      // Utiliser les nouvelles routes pour récupérer toutes les publications
      const [
        advertisementsRes,
        jobOffersRes,
        businessOpportunitiesRes,
        socialEventsRes,
      ] = await Promise.all([
        axios.get("/api/admin/advertisements"),
        axios.get("/api/admin/job-offers"),
        axios.get("/api/admin/business-opportunities"),
        axios.get("/api/admin/social-events"),
      ]);

      setAllItems({
        advertisements: advertisementsRes.data || [],
        jobOffers: jobOffersRes.data || [],
        businessOpportunities: businessOpportunitiesRes.data || [],
        socialEvents: socialEventsRes.data || [],
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour appliquer les filtres aux données
  const applyFilters = () => {
    const newFilteredItems = {
      advertisements: filterItems(
        allItems.advertisements,
        filters.advertisements
      ),
      jobOffers: filterItems(allItems.jobOffers, filters.jobOffers),
      businessOpportunities: filterItems(
        allItems.businessOpportunities,
        filters.businessOpportunities
      ),
      socialEvents: filterItems(allItems.socialEvents, filters.socialEvents),
    };

    setFilteredItems(newFilteredItems);
  };

  // Fonction pour filtrer les éléments selon les critères
  const filterItems = (items, filter) => {
    return items.filter((item) => {
      // Filtre par statut
      if (filter.statut !== "all" && item.statut !== filter.statut) {
        return false;
      }

      // Filtre par état
      if (filter.etat !== "all" && item.etat !== filter.etat) {
        return false;
      }

      return true;
    });
  };

  // Fonction pour mettre à jour les filtres
  const updateFilter = (type, filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [filterName]: value,
      },
    }));

    // Réinitialiser la pagination lors du changement de filtre
    setPagination((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        currentPage: 1,
      },
    }));
  };

  // Changer de page pour un type de publication
  const changePage = (type, newPage) => {
    // Convertir le type en clé de pagination
    const paginationKey =
      type === "advertisement"
        ? "advertisements"
        : type === "jobOffer"
        ? "jobOffers"
        : "businessOpportunities";

    setPagination((prev) => ({
      ...prev,
      [paginationKey]: {
        ...prev[paginationKey],
        currentPage: newPage,
      },
    }));
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

  // Fonction pour supprimer une publication
  const handleDelete = async (id, type) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible."
      )
    ) {
      return;
    }

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
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
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

  // Fonction pour paginer les éléments
  const getPaginatedItems = (items, type) => {
    // Convertir le type en clé de pagination
    const paginationKey =
      type === "advertisement"
        ? "advertisements"
        : type === "jobOffer"
        ? "jobOffers"
        : "businessOpportunities";

    const { currentPage, itemsPerPage } = pagination[paginationKey];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Composant de pagination
  const Pagination = ({ items, type }) => {
    // Convertir le type en clé de pagination
    const paginationKey =
      type === "advertisement"
        ? "advertisements"
        : type === "jobOffer"
        ? "jobOffers"
        : "businessOpportunities";

    const { currentPage, itemsPerPage } = pagination[paginationKey];
    const totalPages = Math.ceil(items.length / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6 space-x-2">
        <button
          onClick={() => changePage(type, currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-800/50"
          }`}
        >
          Précédent
        </button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => changePage(type, page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? "bg-primary-600 text-white dark:bg-primary-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => changePage(type, currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-800/50"
          }`}
        >
          Suivant
        </button>
      </div>
    );
  };

  const renderItemList = (items, type) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p>Aucun élément correspondant aux filtres</p>
        </div>
      );
    }

    // Obtenir les éléments paginés
    const paginatedItems = getPaginatedItems(items, type);

    return (
      <>
        <div className="space-y-4">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 shadow rounded-lg p-4 border ${
                type === "socialEvent" && item.needs_attention
                  ? "border-red-500 dark:border-red-500"
                  : getStatusBorderColor(item.statut)
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {item.titre || item.content}
                    </h3>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item.user?.nom || item.user?.name} {item.user?.prenom} •{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {item.description || item.content}
                  </p>
                </div>
                <div className="flex space-x-2">
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
                      className={`p-2 rounded-full ${
                        item.needs_attention
                          ? "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      }`}
                    >
                      <ShieldExclamationIcon className="h-5 w-5" />
                    </button>
                  )}

                  <button
                    title="Voir"
                    onClick={() => openPreviewModal(item, type)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <EyeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                  {item.statut !== "approuvé" && (
                    <button
                      title="Approuver"
                      onClick={() => handleApprove(item.id, type)}
                      className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-500" />
                    </button>
                  )}
                  {item.statut === "rejeté" ? (
                    <button
                      title="Annuler le rejet"
                      onClick={() => handleCancelReject(item.id, type)}
                      className="p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                    >
                      <ArrowPathIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    </button>
                  ) : (
                    <button
                      title="Rejeter"
                      onClick={() => openRejectModal(item, type)}
                      className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
                    </button>
                  )}
                  {/* Ne pas afficher le bouton "Changer l'état" pour les statuts sociaux */}
                  {type !== "socialEvent" && (
                    <button
                      title="Changer l'état"
                      onClick={() =>
                        handleChangeEtat(
                          item.id,
                          type,
                          item.etat === "disponible" ? "terminé" : "disponible"
                        )
                      }
                      className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <TagIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    </button>
                  )}
                  <button
                    title="Supprimer"
                    onClick={() => handleDelete(item.id, type)}
                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <TrashIcon className="h-5 w-5 text-red-600 dark:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination items={items} type={type} />
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

  // Composant pour les filtres
  const FilterControls = ({ type, typeLabel }) => {
    const currentFilters = filters[type];

    return (
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center">
          <label
            htmlFor={`statut-${type}`}
            className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Statut:
          </label>
          <select
            id={`statut-${type}`}
            value={currentFilters.statut}
            onChange={(e) => updateFilter(type, "statut", e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="all">Tous</option>
            <option value="en_attente">En attente</option>
            <option value="approuvé">Approuvé</option>
            <option value="rejeté">Rejeté</option>
          </select>
        </div>

        <div className="flex items-center">
          <label
            htmlFor={`etat-${type}`}
            className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            État:
          </label>
          <select
            id={`etat-${type}`}
            value={currentFilters.etat}
            onChange={(e) => updateFilter(type, "etat", e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
          >
            <option value="all">Tous</option>
            <option value="disponible">Disponible</option>
            <option value="terminé">Terminé</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {filteredItems[type].length} {typeLabel}
          {filteredItems[type].length > 1 ? "s" : ""} affiché
          {filteredItems[type].length > 1 ? "s" : ""}
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

      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-t-lg bg-primary-50 dark:bg-gray-700 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                )
              }
            >
              Publicités
              {pendingCounts.advertisements > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                  {pendingCounts.advertisements}
                </span>
              )}
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                )
              }
            >
              Offres d'emploi
              {pendingCounts.jobOffers > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                  {pendingCounts.jobOffers}
                </span>
              )}
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                )
              }
            >
              Opportunités d'affaires
              {pendingCounts.businessOpportunities > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                  {pendingCounts.businessOpportunities}
                </span>
              )}
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full py-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-800 shadow text-primary-700 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] dark:hover:bg-gray-700/[0.8] hover:text-primary-600 dark:hover:text-primary-400"
                )
              }
            >
              <div className="flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                Statuts Sociaux
              </div>
              {pendingCounts.socialEvents > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                  {pendingCounts.socialEvents}
                </span>
              )}
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className="p-4">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : (
                <>
                  <FilterControls type="advertisements" typeLabel="publicité" />
                  {renderItemList(
                    filteredItems.advertisements,
                    "advertisement"
                  )}
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
                  {renderItemList(filteredItems.jobOffers, "jobOffer")}
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
                  {renderItemList(
                    filteredItems.businessOpportunities,
                    "businessOpportunity"
                  )}
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
                  {renderItemList(filteredItems.socialEvents, "socialEvent")}
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
    </div>
  );
}
