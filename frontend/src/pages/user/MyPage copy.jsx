import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import {
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePublicationPack } from "../../contexts/PublicationPackContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublicationCard from "./components/PublicationCard";
import PublicationForm from "./components/PublicationForm";
import PublicationPackAlert from "../../components/PublicationPackAlert";
import PublicationDetailsModal from "./components/PublicationDetailsModal";
import SearchFilterBar from "./components/SearchFilterBar";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import BoostPublicationModal from "./components/BoostPublicationModal";
import LivreursList from "./components/LivreursList";
import LivreurForm from "./components/LivreurForm";
import Social from "./Social";
import Formations from "./components/Formations";
import NewsFeed from "./NewsFeed";
import PageSearch from "./components/PageSearch";
import SubTabsPanel from "./components/SubTabsPanel";
import { NewspaperIcon } from "@heroicons/react/24/outline";
import DigitalProductCard from "../../components/DigitalProductCard";
import DigitalProductForm from "../../components/DigitalProductForm";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function MyPage() {
  const [publications, setPublications] = useState({
    advertisements: [],
    jobOffers: [],
    businessOpportunities: [],
    digitalProducts: [],
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormType, setCurrentFormType] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPublication, setCurrentPublication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ id: null, type: null });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDigitalProductFormOpen, setIsDigitalProductFormOpen] =
    useState(false);
  const [selectedDigitalProduct, setSelectedDigitalProduct] = useState(null);
  const { user } = useAuth();
  const {
    isActive: isPackActive,
    packInfo,
    refreshPackStatus,
  } = usePublicationPack();
  const { isDarkMode } = useTheme();
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [pageData, setPageData] = useState({}); // Ajouter l'état pour les données de la page

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    statut: "tous", // 'tous', 'en_attente', 'approuvé', 'rejeté'
    etat: "tous", // 'tous', 'disponible', 'terminé'
    dateRange: "tous", // 'tous', 'aujourd'hui', 'semaine', 'mois'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      statut: "tous",
      etat: "tous",
      dateRange: "tous",
    });
    setSearchTerm("");
  };

  // État pour le modal de photo de couverture
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoError, setCoverPhotoError] = useState("");
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(false);

  // États pour la pagination
  const [pagination, setPagination] = useState({
    advertisements: { currentPage: 1, itemsPerPage: 3 },
    jobOffers: { currentPage: 1, itemsPerPage: 3 },
    businessOpportunities: { currentPage: 1, itemsPerPage: 3 },
    digitalProducts: { currentPage: 1, itemsPerPage: 3 },
  });

  // État pour le modal de boost
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [publicationToBoost, setPublicationToBoost] = useState(null);
  const [boostPublicationType, setBoostPublicationType] = useState(null);

  // États pour la gestion des livreurs
  const [livreurs, setLivreurs] = useState([]);
  const [isLivreurFormOpen, setIsLivreurFormOpen] = useState(false);
  const [isLoadingLivreurs, setIsLoadingLivreurs] = useState(false);
  const [candidatureStatus, setCandidatureStatus] = useState(null); // null, 'en_attente', 'approuve', 'rejete'

  // Fonction pour récupérer les données de la page
  const fetchPageData = async () => {
    try {
      setIsLoading(true);
      // Fetch page statistics
      const pageResponse = await axios.get(`/api/my-page`);
      setPageData(pageResponse.data.page); // Mettre à jour les données de la page
      setSubscribersCount(pageResponse.data.page.nombre_abonnes);
      setLikesCount(pageResponse.data.page.nombre_likes);

      // Fetch all publication types
      setPublications({
        advertisements: pageResponse.data.page.publicites,
        jobOffers: pageResponse.data.page.offres_emploi,
        businessOpportunities: pageResponse.data.page.opportunites_affaires,
        digitalProducts: pageResponse.data.page.produits_numeriques || [],
      });
      console.log(pageResponse.data.page.produits_numeriques);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour récupérer les livreurs d'une page
  const fetchLivreurs = async () => {
    if (!pageData?.id) return;

    try {
      setIsLoadingLivreurs(true);
      const response = await axios.get(`/api/livreurs/page/${pageData.id}`);
      setLivreurs(response.data.livreurs || []);
    } catch (error) {
      console.error("Erreur lors du chargement des livreurs:", error);
      toast.error("Impossible de charger les livreurs");
    } finally {
      setIsLoadingLivreurs(false);
    }
  };

  // Fonction pour vérifier le statut de candidature de l'utilisateur connecté
  const checkCandidatureStatus = async () => {
    if (!pageData?.id) return;

    try {
      const response = await axios.get(
        `/api/livreurs/check-candidature/${pageData.id}`
      );
      setCandidatureStatus(response.data.status || null);
    } catch (error) {
      console.error("Erreur lors de la vérification de la candidature:", error);
      setCandidatureStatus(null);
    }
  };

  // Fonction pour approuver un livreur
  const handleApproveLivreur = async (livreurId) => {
    try {
      await axios.post(`/api/livreurs/approuver/${livreurId}`);
      toast.success("Candidature approuvée avec succès");
      await fetchLivreurs();
    } catch (error) {
      console.error("Erreur lors de l'approbation du livreur:", error);
      toast.error("Impossible d'approuver cette candidature");
    }
  };

  // Fonction pour rejeter un livreur
  const handleRejectLivreur = async (livreurId) => {
    try {
      await axios.post(`/api/livreurs/rejeter/${livreurId}`);
      toast.success("Candidature rejetée");
      await fetchLivreurs();
    } catch (error) {
      console.error("Erreur lors du rejet du livreur:", error);
      toast.error("Impossible de rejeter cette candidature");
    }
  };

  // Fonction pour révoquer un livreur
  const handleRevokeLivreur = async (livreurId) => {
    try {
      await axios.post(`/api/livreurs/revoquer/${livreurId}`);
      toast.success("Livreur révoqué avec succès");
      await fetchLivreurs();
    } catch (error) {
      console.error("Erreur lors de la révocation du livreur:", error);
      toast.error("Impossible de révoquer ce livreur");
    }
  };

  // Fonction pour gérer la soumission d'un produit numérique
  const handleDigitalProductSubmit = async (formData) => {
    try {
      if (selectedDigitalProduct) {
        // Mise à jour d'un produit existant
        const response = await axios.post(
          `/api/digital-products/${selectedDigitalProduct.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Mettre à jour l'état local
        setPublications((prev) => ({
          ...prev,
          digitalProducts: prev.digitalProducts.map((product) =>
            product.id === selectedDigitalProduct.id
              ? response.data.product
              : product
          ),
        }));

        toast.success("Produit numérique mis à jour avec succès");
      } else {
        // Création d'un nouveau produit
        const response = await axios.post("/api/digital-products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Ajouter le nouveau produit à l'état local
        setPublications((prev) => ({
          ...prev,
          digitalProducts: [response.data.product, ...prev.digitalProducts],
        }));

        toast.success("Produit numérique créé avec succès");
      }

      // Fermer le formulaire et réinitialiser la sélection
      setIsDigitalProductFormOpen(false);
      setSelectedDigitalProduct(null);
    } catch (error) {
      console.error(
        "Erreur lors de la soumission du produit numérique:",
        error
      );
      toast.error("Erreur lors de la soumission du produit numérique");
    }
  };

  // Fonction pour supprimer une candidature de livreur
  const handleDeleteLivreur = async (livreurId) => {
    try {
      await axios.delete(`/api/livreurs/${livreurId}`);
      toast.success("Candidature supprimée avec succès");
      await fetchLivreurs();
      // Si c'est l'utilisateur connecté qui supprime sa propre candidature
      if (user && !pageData?.is_owner) {
        setCandidatureStatus(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du livreur:", error);
      toast.error("Impossible de supprimer cette candidature");
    }
  };

  useEffect(() => {
    // Vérifier le statut du pack de publication
    if (refreshPackStatus) {
      refreshPackStatus();
    }

    fetchPageData();
  }, [user.id]);

  useEffect(() => {
    if (pageData?.id) {
      fetchLivreurs();
      checkCandidatureStatus();
    }
  }, [pageData?.id]);

  const handleFormOpen = (type) => {
    // Vérifier si le pack est actif avant d'ouvrir le formulaire
    if (!isPackActive) {
      // On ne fait rien si le pack n'est pas actif
      return;
    }
    setCurrentFormType(type);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setCurrentFormType(null);
    setIsEditMode(false);
    setCurrentPublication(null);
  };

  // Gestionnaire pour la modification d'une publication
  const handleEdit = (publication, type) => {
    setCurrentPublication(publication);
    setCurrentFormType(type);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  // Gestionnaire pour ouvrir le modal de confirmation de suppression
  const handleDeleteConfirm = (id, type) => {
    setDeleteInfo({ id, type });
    setIsDeleteConfirmOpen(true);
  };

  // Fonction pour confirmer et exécuter la suppression
  const confirmDelete = async () => {
    try {
      const { id, type } = deleteInfo;
      let endpoint = "";
      switch (type) {
        case "advertisement":
          endpoint = `/api/advertisements/${id}`;
          break;
        case "jobOffer":
          endpoint = `/api/job-offers/${id}`;
          break;
        case "businessOpportunity":
          endpoint = `/api/business-opportunities/${id}`;
          break;
        case "digitalProduct":
          endpoint = `/api/digital-products/${id}`;
          break;
        default:
          return;
      }

      await axios.delete(endpoint);
      toast.success("Publication supprimée avec succès");

      // Mettre à jour l'état local
      switch (type) {
        case "advertisement":
          setPublications((prev) => ({
            ...prev,
            advertisements: prev.advertisements.filter((ad) => ad.id !== id),
          }));
          break;
        case "jobOffer":
          setPublications((prev) => ({
            ...prev,
            jobOffers: prev.jobOffers.filter((offer) => offer.id !== id),
          }));
          break;
        case "businessOpportunity":
          setPublications((prev) => ({
            ...prev,
            businessOpportunities: prev.businessOpportunities.filter(
              (opportunity) => opportunity.id !== id
            ),
          }));
          break;
        case "digitalProduct":
          setPublications((prev) => ({
            ...prev,
            digitalProducts: prev.digitalProducts.filter(
              (product) => product.id !== id
            ),
          }));
          break;
        default:
          break;
      }

      setIsDeleteConfirmOpen(false);
      setDeleteInfo({ id: null, type: null });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Fonction pour changer l'état d'une publication
  const handleChangeState = async (id, type, newState) => {
    try {
      let endpoint = "";
      switch (type) {
        case "advertisement":
          endpoint = `/api/advertisements/${id}/etat`;
          break;
        case "jobOffer":
          endpoint = `/api/job-offers/${id}/etat`;
          break;
        case "businessOpportunity":
          endpoint = `/api/business-opportunities/${id}/etat`;
          break;
        case "digitalProduct":
          endpoint = `/api/digital-products/${id}/etat`;
          break;
        default:
          return;
      }

      await axios.put(endpoint, { etat: newState });
      toast.success("État modifié avec succès");

      // Mettre à jour l'état local
      switch (type) {
        case "advertisement":
          setPublications((prev) => ({
            ...prev,
            advertisements: prev.advertisements.map((ad) =>
              ad.id === id ? { ...ad, etat: newState } : ad
            ),
          }));
          break;
        case "jobOffer":
          setPublications((prev) => ({
            ...prev,
            jobOffers: prev.jobOffers.map((offer) =>
              offer.id === id ? { ...offer, etat: newState } : offer
            ),
          }));
          break;
        case "businessOpportunity":
          setPublications((prev) => ({
            ...prev,
            businessOpportunities: prev.businessOpportunities.map(
              (opportunity) =>
                opportunity.id === id
                  ? { ...opportunity, etat: newState }
                  : opportunity
            ),
          }));
          break;
        case "digitalProduct":
          setPublications((prev) => ({
            ...prev,
            digitalProducts: prev.digitalProducts.map((product) =>
              product.id === id ? { ...product, etat: newState } : product
            ),
          }));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Erreur lors du changement d'état:", error);
      toast.error("Erreur lors du changement d'état");
    }
  };

  // Fonction pour obtenir l'URL de l'API en fonction du type de publication
  const getApiUrl = (type) => {
    switch (type) {
      case "advertisement":
        return "publicites";
      case "jobOffer":
        return "offres-emploi";
      case "businessOpportunity":
        return "opportunites-affaires";
      case "digitalProduct":
        return "produits-numeriques";
      default:
        return "";
    }
  };

  // Fonction pour filtrer les publications en fonction des critères de recherche et de filtrage
  const getFilteredPublications = (type, paginate = false) => {
    let items = [];
    let paginationType = "";

    // Fonction pour filtrer les publications par type
    const getFilteredItems = (type) => {
      let items = [];
      let paginationType = "";

      switch (type) {
        case "advertisement":
          items = publications.advertisements || [];
          paginationType = "advertisements";
          break;
        case "jobOffer":
          items = publications.jobOffers || [];
          paginationType = "jobOffers";
          break;
        case "businessOpportunity":
          items = publications.businessOpportunities || [];
          paginationType = "businessOpportunities";
          break;
        case "digitalProduct":
          items = publications.digitalProducts || [];
          paginationType = "digitalProducts";
          break;
        default:
          return [];
      }

      // S'assurer que tous les éléments sont définis et ont un ID
      items = items.filter((item) => item && item.id);

      // Appliquer la recherche textuelle
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        items = items.filter(
          (item) =>
            (item.titre && item.titre.toLowerCase().includes(term)) ||
            (item.description &&
              item.description.toLowerCase().includes(term)) ||
            (item.contacts && item.contacts.toLowerCase().includes(term)) ||
            (item.adresse && item.adresse.toLowerCase().includes(term))
        );
      }

      // Appliquer les filtres
      if (filters.statut !== "tous") {
        items = items.filter((item) => item.statut === filters.statut);
      }

      if (filters.etat !== "tous") {
        items = items.filter((item) => item.etat === filters.etat);
      }

      // Filtrer par plage de dates
      if (filters.dateRange !== "tous") {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        items = items.filter((item) => {
          if (!item.created_at) return false;

          const itemDate = new Date(item.created_at);

          switch (filters.dateRange) {
            case "aujourd'hui":
              return itemDate >= today;
            case "semaine":
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              return itemDate >= weekAgo;
            case "mois":
              const monthAgo = new Date(today);
              monthAgo.setMonth(today.getMonth() - 1);
              return itemDate >= monthAgo;
            default:
              return true;
          }
        });
      }

      // Si la pagination est activée, retourner seulement les éléments de la page actuelle
      if (paginate && paginationType) {
        const { currentPage, itemsPerPage } = pagination[paginationType];
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
      }

      return items;
    };

    return getFilteredItems(type);
  };

  // Fonction pour obtenir le nombre total de pages pour un type de publication
  const getTotalPages = (type) => {
    // Fonction pour obtenir la page courante pour un type de publication
    const getCurrentPage = (type) => {
      let paginationType = "";
      switch (type) {
        case "advertisement":
          paginationType = "advertisements";
          break;
        case "jobOffer":
          paginationType = "jobOffers";
          break;
        case "businessOpportunity":
          paginationType = "businessOpportunities";
          break;
        case "digitalProduct":
          paginationType = "digitalProducts";
          break;
        default:
          return 1;
      }

      const { itemsPerPage } = pagination[paginationType];
      return Math.ceil(items.length / itemsPerPage) || 1;
    };

    const items = getFilteredPublications(type, false);
    return getCurrentPage(type);
  };

  // Fonction pour réinitialiser les filtres et la recherche
  const resetFiltersAndSearch = () => {
    setSearchTerm("");
    setFilters({
      statut: "tous",
      etat: "tous",
      dateRange: "tous",
    });
    setPagination((prev) => ({
      advertisements: { ...prev.advertisements, currentPage: 1 },
      jobOffers: { ...prev.jobOffers, currentPage: 1 },
      businessOpportunities: { ...prev.businessOpportunities, currentPage: 1 },
      digitalProducts: { ...prev.digitalProducts, currentPage: 1 },
    }));
  };

  // Fonction pour mettre à jour un filtre spécifique
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));

    // Réinitialiser la pagination à la première page lorsqu'un filtre change
    setPagination((prev) => ({
      advertisements: { ...prev.advertisements, currentPage: 1 },
      jobOffers: { ...prev.jobOffers, currentPage: 1 },
      businessOpportunities: { ...prev.businessOpportunities, currentPage: 1 },
      digitalProducts: { ...prev.digitalProducts, currentPage: 1 },
    }));
  };

  // Fonction pour gérer le changement de page
  const handlePageChange = (type, newPage) => {
    setPagination((prev) => ({
      ...prev,
      [type]: { ...prev[type], currentPage: newPage },
    }));
  };

  // Fonction pour gérer le téléchargement de la photo de couverture
  const handleCoverPhotoUpload = async () => {
    // Vérifier si un fichier a été sélectionné
    if (!coverPhotoFile) {
      setCoverPhotoError("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille du fichier (max 2MB)
    if (coverPhotoFile.size > 2 * 1024 * 1024) {
      setCoverPhotoError("La taille de l'image ne doit pas dépasser 2MB");
      return;
    }

    try {
      setCoverPhotoLoading(true);
      setCoverPhotoError("");

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append("photo_de_couverture", coverPhotoFile);

      // Envoyer la requête
      const response = await axios.post(
        "/api/my-page/update-cover-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        // Fermer le modal et réinitialiser les états
        setShowCoverPhotoModal(false);
        setCoverPhotoFile(null);

        // Rafraîchir les données de la page pour afficher la nouvelle photo
        fetchPageData();
      } else {
        setCoverPhotoError(response.data.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement de la photo:", error);
      setCoverPhotoError(
        error.response?.data?.message ||
          "Une erreur est survenue lors du téléchargement"
      );
    } finally {
      setCoverPhotoLoading(false);
    }
  };

  // Fonction pour gérer la sélection du fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.match("image.*")) {
        setCoverPhotoError(
          "Veuillez sélectionner une image valide (JPEG, PNG, GIF)"
        );
        return;
      }
      setCoverPhotoFile(file);
      setCoverPhotoError("");
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-2">
      {/* Page Header - Similar to Facebook */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-lg relative">
          {/* Cover Photo Area */}
          {pageData?.photo_de_couverture ? (
            <img
              src={pageData.photo_de_couverture}
              alt="Photo de couverture"
              className="h-full w-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-lg"></div>
          )}
          <button
            onClick={() => setShowCoverPhotoModal(true)}
            className="absolute top-2 right-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Ajouter une photo de couverture"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-4 relative">
          <div className="flex items-end -mt-12 sm:items-center sm:flex-row flex-col">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 overflow-hidden">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={`Photo de profil de ${user.name}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // En cas d'erreur de chargement de l'image, afficher les initiales
                    e.target.style.display = "none";
                    e.target.parentNode.querySelector(
                      ".fallback-initials"
                    ).style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`fallback-initials h-full w-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-4xl font-bold ${
                  user?.picture ? "hidden" : ""
                }`}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {user?.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subscribersCount} abonnés · {likesCount} mentions j'aime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert si le pack n'est pas actif */}
      {!isPackActive && (
        <PublicationPackAlert isActive={isPackActive} packInfo={packInfo} />
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow tabs-container">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-t-lg bg-primary-50 dark:bg-gray-700 p-1 overflow-x-auto whitespace-nowrap scrollbar-modern">
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              Publicités
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              Offres d'emploi
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              Opportunités
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              Livreurs
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              <AcademicCapIcon className="h-5 w-5 inline-block mr-1" />
              Formations
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              <UsersIcon className="h-5 w-5 inline-block mr-1" />
              Pages
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              <DocumentTextIcon className="h-5 w-5 inline-block mr-1" />
              Produits numériques
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "flex-shrink-0 min-w-[120px] py-3 px-3 text-sm font-medium rounded-lg",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-primary-400 ring-white ring-opacity-60",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow text-primary-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-primary-600"
                )
              }
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 inline-block mr-1" />
              Social
            </Tab>
          </Tab.List>
          <Tab.Panels>
            {/* Advertisements Panel */}
            <Tab.Panel className="p-4">
              <SubTabsPanel
                tabs={[
                  { label: "Mes publicités", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Mes publicités
                          </h2>
                          <button
                            onClick={() => handleFormOpen("advertisement")}
                            className={`flex items-center gap-2 px-4 py-2 ${
                              isPackActive
                                ? "bg-primary-600 hover:bg-primary-700"
                                : "bg-gray-400 cursor-not-allowed"
                            } text-white rounded-lg transition-colors`}
                            disabled={!isPackActive}
                            title={
                              !isPackActive
                                ? "Veuillez activer votre pack de publication pour créer une publicité"
                                : ""
                            }
                          >
                            <PlusIcon className="h-5 w-5" />
                            Créer une publicité
                          </button>
                        </div>

                        {/* Barre de recherche et filtres */}
                        <SearchFilterBar
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          filters={filters}
                          handleFilterChange={handleFilterChange}
                          showFilters={showFilters}
                          setShowFilters={setShowFilters}
                          resetFilters={resetFilters}
                        />

                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {getFilteredPublications("advertisement", false)
                                .length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
                                  {searchTerm ||
                                  filters.statut !== "tous" ||
                                  filters.etat !== "tous" ||
                                  filters.dateRange !== "tous"
                                    ? "Aucune publicité ne correspond à vos critères de recherche."
                                    : "Vous n'avez pas encore de publicités."}
                                </div>
                              ) : (
                                getFilteredPublications(
                                  "advertisement",
                                  true
                                ).map((ad) => (
                                  <PublicationCard
                                    key={ad.id}
                                    publication={ad}
                                    type="advertisement"
                                    onEdit={() =>
                                      handleEdit(ad, "advertisement")
                                    }
                                    onDelete={() =>
                                      handleDeleteConfirm(
                                        ad.id,
                                        "advertisement"
                                      )
                                    }
                                    onViewDetails={() =>
                                      handleViewDetails(ad, "advertisement")
                                    }
                                    onStateChange={(newState) =>
                                      handleStateChange(
                                        ad.id,
                                        "advertisement",
                                        newState
                                      )
                                    }
                                    onBoost={() =>
                                      handleBoost(ad, "advertisement")
                                    }
                                  />
                                ))
                              )}
                            </div>

                            {/* Pagination pour les publicités */}
                            {getFilteredPublications("advertisement", false)
                              .length > 0 && (
                              <Pagination
                                currentPage={
                                  pagination.advertisements.currentPage
                                }
                                totalPages={getTotalPages("advertisement")}
                                onPageChange={(page) =>
                                  handlePageChange("advertisements", page)
                                }
                              />
                            )}
                          </>
                        )}
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Fil d'actualité - Publicités
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                          <NewsFeed initialActiveTab={0} showTabs={false} />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Job Offers Panel */}
            <Tab.Panel className="p-4">
              <SubTabsPanel
                tabs={[
                  { label: "Mes offres", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Mes offres d'emploi
                          </h2>
                          <button
                            onClick={() => handleFormOpen("jobOffer")}
                            className={`flex items-center gap-2 px-4 py-2 ${
                              isPackActive
                                ? "bg-primary-600 hover:bg-primary-700"
                                : "bg-gray-400 cursor-not-allowed"
                            } text-white rounded-lg transition-colors`}
                            disabled={!isPackActive}
                            title={
                              !isPackActive
                                ? "Veuillez activer votre pack de publication pour créer une offre d'emploi"
                                : ""
                            }
                          >
                            <PlusIcon className="h-5 w-5" />
                            Créer une offre d'emploi
                          </button>
                        </div>

                        {/* Barre de recherche et filtres */}
                        <SearchFilterBar
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          filters={filters}
                          handleFilterChange={handleFilterChange}
                          showFilters={showFilters}
                          setShowFilters={setShowFilters}
                          resetFilters={resetFilters}
                        />

                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {getFilteredPublications("jobOffer", false)
                                .length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
                                  {searchTerm ||
                                  filters.statut !== "tous" ||
                                  filters.etat !== "tous" ||
                                  filters.dateRange !== "tous"
                                    ? "Aucune offre d'emploi ne correspond à vos critères de recherche."
                                    : "Vous n'avez pas encore d'offres d'emploi."}
                                </div>
                              ) : (
                                getFilteredPublications("jobOffer", true).map(
                                  (offer) => (
                                    <PublicationCard
                                      key={offer.id}
                                      publication={offer}
                                      type="jobOffer"
                                      onEdit={() =>
                                        handleEdit(offer, "jobOffer")
                                      }
                                      onDelete={() =>
                                        handleDeleteConfirm(
                                          offer.id,
                                          "jobOffer"
                                        )
                                      }
                                      onViewDetails={() =>
                                        handleViewDetails(offer, "jobOffer")
                                      }
                                      onStateChange={(newState) =>
                                        handleStateChange(
                                          offer.id,
                                          "jobOffer",
                                          newState
                                        )
                                      }
                                      onBoost={() =>
                                        handleBoost(offer, "jobOffer")
                                      }
                                    />
                                  )
                                )
                              )}
                            </div>

                            {/* Pagination pour les offres d'emploi */}
                            {getFilteredPublications("jobOffer", false).length >
                              0 && (
                              <Pagination
                                currentPage={pagination.jobOffers.currentPage}
                                totalPages={getTotalPages("jobOffer")}
                                onPageChange={(page) =>
                                  handlePageChange("jobOffers", page)
                                }
                              />
                            )}
                          </>
                        )}
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Fil d'actualité - Offres d'emploi
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                          <NewsFeed initialActiveTab={1} showTabs={false} />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Business Opportunities Panel */}
            <Tab.Panel className="p-4">
              <SubTabsPanel
                tabs={[
                  { label: "Mes opportunités", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Mes opportunités d'affaires
                          </h2>
                          <button
                            onClick={() =>
                              handleFormOpen("businessOpportunity")
                            }
                            className={`flex items-center gap-2 px-4 py-2 ${
                              isPackActive
                                ? "bg-primary-600 hover:bg-primary-700"
                                : "bg-gray-400 cursor-not-allowed"
                            } text-white rounded-lg transition-colors`}
                            disabled={!isPackActive}
                            title={
                              !isPackActive
                                ? "Veuillez activer votre pack de publication pour créer une opportunité d'affaires"
                                : ""
                            }
                          >
                            <PlusIcon className="h-5 w-5" />
                            Créer une opportunité
                          </button>
                        </div>

                        {/* Barre de recherche et filtres */}
                        <SearchFilterBar
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          filters={filters}
                          handleFilterChange={handleFilterChange}
                          showFilters={showFilters}
                          setShowFilters={setShowFilters}
                          resetFilters={resetFilters}
                        />

                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {getFilteredPublications(
                                "businessOpportunity",
                                false
                              ).length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
                                  {searchTerm ||
                                  filters.statut !== "tous" ||
                                  filters.etat !== "tous" ||
                                  filters.dateRange !== "tous"
                                    ? "Aucune opportunité d'affaires ne correspond à vos critères de recherche."
                                    : "Vous n'avez pas encore d'opportunités d'affaires."}
                                </div>
                              ) : (
                                getFilteredPublications(
                                  "businessOpportunity",
                                  true
                                ).map((opportunity) => (
                                  <PublicationCard
                                    key={opportunity.id}
                                    publication={opportunity}
                                    type="businessOpportunity"
                                    onEdit={() =>
                                      handleEdit(
                                        opportunity,
                                        "businessOpportunity"
                                      )
                                    }
                                    onDelete={() =>
                                      handleDeleteConfirm(
                                        opportunity.id,
                                        "businessOpportunity"
                                      )
                                    }
                                    onViewDetails={() =>
                                      handleViewDetails(
                                        opportunity,
                                        "businessOpportunity"
                                      )
                                    }
                                    onStateChange={(newState) =>
                                      handleStateChange(
                                        opportunity.id,
                                        "businessOpportunity",
                                        newState
                                      )
                                    }
                                    onBoost={() =>
                                      handleBoost(
                                        opportunity,
                                        "businessOpportunity"
                                      )
                                    }
                                  />
                                ))
                              )}
                            </div>

                            {/* Pagination pour les opportunités d'affaires */}
                            {getFilteredPublications(
                              "businessOpportunity",
                              false
                            ).length > 0 && (
                              <Pagination
                                currentPage={
                                  pagination.businessOpportunities.currentPage
                                }
                                totalPages={getTotalPages(
                                  "businessOpportunity"
                                )}
                                onPageChange={(page) =>
                                  handlePageChange(
                                    "businessOpportunities",
                                    page
                                  )
                                }
                              />
                            )}
                          </>
                        )}
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                          Fil d'actualité - Opportunités d'affaires
                        </h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                          <NewsFeed initialActiveTab={2} showTabs={false} />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Livreurs Panel */}
            <Tab.Panel className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Livreurs
                </h2>
                {!pageData?.is_owner && candidatureStatus !== null && (
                  <div className="text-sm">
                    {candidatureStatus === "en_attente" && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Candidature en attente
                      </span>
                    )}
                    {candidatureStatus === "approuve" && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Candidature approuvée
                      </span>
                    )}
                    {candidatureStatus === "rejete" && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                        Candidature rejetée
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isLoadingLivreurs ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <LivreursList
                  livreurs={livreurs}
                  onApprove={handleApproveLivreur}
                  onReject={handleRejectLivreur}
                  onRevoke={handleRevokeLivreur}
                  onDelete={handleDeleteLivreur}
                  isPageOwner={true}
                />
              )}
            </Tab.Panel>

            {/* Formations Panel */}
            <Tab.Panel className="p-0">
              <Formations />
            </Tab.Panel>

            {/* Pages Panel */}
            <Tab.Panel className="p-4">
              <div className="news-feed-wrapper">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Pages
                </h2>
                <PageSearch />
              </div>
            </Tab.Panel>

            {/* Produits numériques Panel */}
            <Tab.Panel className="p-4">
              <SubTabsPanel
                tabs={[
                  { label: "Mes produits", icon: UserIcon },
                  { label: "Catalogue", icon: MagnifyingGlassIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        {/* Panel des produits numériques */}
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Mes produits numériques
                          </h2>
                          <button
                            onClick={() => setIsDigitalProductFormOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 ${
                              isPackActive
                                ? "bg-primary-600 hover:bg-primary-700"
                                : "bg-gray-400 cursor-not-allowed"
                            } text-white rounded-lg transition-colors`}
                            disabled={!isPackActive}
                            title={
                              !isPackActive
                                ? "Veuillez activer votre pack de publication pour créer un produit numérique"
                                : ""
                            }
                          >
                            <PlusIcon className="h-5 w-5" />
                            Créer un produit
                          </button>
                        </div>

                        {/* Filtres et recherche */}
                        <div className="mb-4">
                          <SearchFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={(value) => setSearchTerm(value)}
                            filters={filters}
                            onFilterChange={(newFilters) => setFilters(newFilters)}
                            showFilters={showFilters}
                            onToggleFilters={() => setShowFilters(!showFilters)}
                          />
                        </div>

                        {/* Liste des produits numériques */}
                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                          </div>
                        ) : publications.digitalProducts.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getFilteredPublications("digitalProduct", true).map(
                              (product) => (
                                <div key={product.id} className="mb-4">
                                  <DigitalProductCard
                                    product={product}
                                    onEdit={() => {
                                      setSelectedDigitalProduct(product);
                                      setIsDigitalProductFormOpen(true);
                                    }}
                                    onDelete={(id) =>
                                      handleDeleteConfirm(id, "digitalProduct")
                                    }
                                    onChangeStatus={(id, newStatus) =>
                                      handleChangeState(id, "digitalProduct", newStatus)
                                    }
                                  />
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                              Vous n'avez pas encore créé de produits numériques.
                            </p>
                          </div>
                        )}

                        {/* Pagination */}
                        {!isLoading && publications.digitalProducts.length > 0 && (
                          <div className="mt-4">
                            <Pagination
                              currentPage={pagination.digitalProducts.currentPage}
                              totalPages={getTotalPages("digitalProduct")}
                              onPageChange={(page) =>
                                setPagination((prev) => ({
                                  ...prev,
                                  digitalProducts: {
                                    ...prev.digitalProducts,
                                    currentPage: page,
                                  },
                                }))
                              }
                            />
                          </div>
                        )}
                      </>
                    ),
                  },
                  {
                    content: (
                      <>
                        <div className="mb-6">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Catalogue des produits numériques
                          </h2>
                          
                          {/* Barre de recherche pour le catalogue */}
                          <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Rechercher un produit numérique..."
                            />
                          </div>
                          
                          {/* Filtres pour le catalogue */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                              Tous
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200 cursor-pointer transition-colors">
                              E-books
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200 cursor-pointer transition-colors">
                              Templates
                            </div>
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200 cursor-pointer transition-colors">
                              Logiciels
                            </div>
                          </div>
                          
                          {/* Message temporaire */}
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                            <DocumentTextIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              Catalogue de produits numériques
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              Cette fonctionnalité sera bientôt disponible. Vous pourrez parcourir et acheter des produits numériques publiés par d'autres utilisateurs.
                            </p>
                            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                              Être notifié quand c'est prêt
                            </button>
                          </div>
                        </div>
                      </>
                    ),
                  },
                ]}
              />


              {/* Modal pour créer/modifier un produit numérique */}
              {isDigitalProductFormOpen && (
                <Modal
                  isOpen={isDigitalProductFormOpen}
                  onClose={() => {
                    setIsDigitalProductFormOpen(false);
                    setSelectedDigitalProduct(null);
                  }}
                  title={
                    selectedDigitalProduct
                      ? "Modifier le produit numérique"
                      : "Créer un produit numérique"
                  }
                >
                  <DigitalProductForm
                    product={selectedDigitalProduct}
                    onSubmit={handleDigitalProductSubmit}
                    onCancel={() => {
                      setIsDigitalProductFormOpen(false);
                      setSelectedDigitalProduct(null);
                    }}
                  />
                </Modal>
              )}
            </Tab.Panel>

            {/* Social Panel */}
            <Tab.Panel className="p-0">
              <Social />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Publication Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditMode ? "Modifier" : "Créer"}{" "}
                {currentFormType === "advertisement" && "une publicité"}
                {currentFormType === "jobOffer" && "une offre d'emploi"}
                {currentFormType === "businessOpportunity" &&
                  "une opportunité d'affaires"}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <PublicationForm
                type={currentFormType}
                initialData={currentPublication}
                isEditMode={isEditMode}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* Publication Details Modal */}
      {showDetailsModal && currentPublication && (
        <PublicationDetailsModal
          isOpen={showDetailsModal}
          publication={currentPublication}
          type={currentFormType}
          onClose={handleCloseDetailsModal}
          onEdit={() => {
            handleCloseDetailsModal();
            handleEdit(currentPublication, currentFormType);
          }}
          onDelete={() => {
            handleCloseDetailsModal();
            handleDelete(currentPublication.id, currentFormType);
          }}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmation de suppression"
        size="md"
      >
        <div className="mt-2 mb-6">
          <div className="flex items-center justify-center mb-4 text-orange-500">
            <ExclamationTriangleIcon className="h-12 w-12" />
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300">
            Êtes-vous sûr de vouloir supprimer cette publication ?
          </p>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">
            Cette action est irréversible et supprimera définitivement la
            publication.
          </p>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
            onClick={confirmDelete}
          >
            Supprimer
          </button>
        </div>
      </Modal>

      {/* Modal de téléchargement de la photo de couverture */}
      <Modal
        isOpen={showCoverPhotoModal}
        onClose={() => setShowCoverPhotoModal(false)}
        title="Télécharger une photo de couverture"
        size="md"
      >
        <div className="mt-2 mb-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Sélectionnez une image pour personnaliser votre page. Taille
              maximale: 2Mo.
            </p>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-blue-300"
              />
            </div>
          </div>
          {coverPhotoFile && (
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Fichier sélectionné:
              </p>
              <p className="text-sm font-medium truncate">
                {coverPhotoFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(coverPhotoFile.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          )}
          {coverPhotoError && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {coverPhotoError}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
            onClick={() => setShowCoverPhotoModal(false)}
          >
            Annuler
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-white transition-colors flex items-center justify-center min-w-[100px]"
            onClick={handleCoverPhotoUpload}
            disabled={coverPhotoLoading || !coverPhotoFile}
          >
            {coverPhotoLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              "Télécharger"
            )}
          </button>
        </div>
      </Modal>

      {/* Modal de boost */}
      <BoostPublicationModal
        isOpen={showBoostModal}
        onClose={(success) => handleBoostModalClose(success)}
        publication={publicationToBoost}
        publicationType={boostPublicationType}
      />
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
