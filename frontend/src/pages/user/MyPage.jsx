import React, { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  NewspaperIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { usePublicationPack } from "../../contexts/PublicationPackContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Alert,
  TablePagination,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Pagination as MuiPagination,
} from "@mui/material";
import PublicationForm from "./components/PublicationForm";
import PublicationPackAlert from "../../components/PublicationPackAlert";
import PublicationDetailsModal from "./components/PublicationDetailsModal";
import SearchFilterBar from "./components/SearchFilterBar";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import BoostPublicationModal from "./components/BoostPublicationModal";
import LivreursList from "./components/LivreursList";
import Social from "./Social";
import Formations from "./components/Formations";
import NewsFeed from "./NewsFeed";
import PageSearch from "./components/PageSearch";
import SubTabsPanel from "./components/SubTabsPanel";
import DigitalProductCard from "../../components/DigitalProductCard";
import DigitalProductForm from "../../components/DigitalProductForm";
import PurchaseDigitalProductModal from "./components/PurchaseDigitalProductModal";

// Styles CSS personnalisés pour les animations
const customStyles = `
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .glassmorphism {
    backdrop-filter: blur(16px) saturate(180%);
    background-color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(209, 213, 219, 0.3);
  }
  
  .dark .glassmorphism {
    background-color: rgba(17, 24, 39, 0.75);
    border: 1px solid rgba(75, 85, 99, 0.3);
  }
  
  .hover\:shadow-3xl:hover {
    box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
  }
  
  .border-3 {
    border-width: 3px;
  }
`

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "";
  }
};

// Fonction pour obtenir le statut en français
const getStatutLabel = (statut) => {
  switch (statut) {
    case "en_attente":
      return "En attente";
    case "approuve":
      return "Approuvé";
    case "rejete":
      return "Rejeté";
    case "expire":
      return "Expiré";
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    default:
      return statut || "Inconnu";
  }
};

// Fonction pour obtenir la couleur du statut
const getStatutColor = (statut) => {
  switch (statut) {
    case "en_attente":
      return "warning";
    case "approuve":
    case "active":
      return "success";
    case "rejete":
    case "expire":
    case "inactive":
      return "error";
    default:
      return "default";
  }
};

export default function MyPage() {
  // Injection des styles CSS personnalisés
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Détection mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [publications, setPublications] = useState({
    advertisements: [],
    jobOffers: [],
    businessOpportunities: [],
    digitalProducts: [],
  });
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
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
  const [catalogSearchTerm, setCatalogSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    statut: "tous", // 'tous', 'en_attente', 'approuvé', 'rejeté'
    etat: "tous", // 'tous', 'disponible', 'terminé'
    date_debut: "", // Format YYYY-MM-DD
    date_fin: "", // Format YYYY-MM-DD
  });
  const [catalogFilters, setCatalogFilters] = useState({
    type: "tous", // 'tous', 'ebook', 'fichier_admin'
  });
  const [showFilters, setShowFilters] = useState(false);

  // État pour la pagination des produits numériques
  const [digitalProductsPagination, setDigitalProductsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 6,
  });

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      statut: "tous",
      etat: "tous",
      date_debut: "",
      date_fin: "",
    });
    setSearchTerm("");
  };

  // Fonction pour réinitialiser les filtres du catalogue
  const resetCatalogFilters = () => {
    setCatalogFilters({
      type: "tous",
    });
    setCatalogSearchTerm("");
  };

  // Fonction pour récupérer les produits numériques du catalogue
  const fetchCatalogProducts = async () => {
    try {
      setIsLoadingCatalog(true);
      const params = {
        page: catalogPagination.currentPage,
        per_page: catalogPagination.rowsPerPage,
        search: catalogSearchTerm,
      };

      // Ajouter le filtre de type si nécessaire
      if (catalogFilters.type !== "tous") {
        params.type = catalogFilters.type;
      }

      const response = await axios.get("/api/digital-products/approved", {
        params,
      });
      setCatalogProducts(response.data.data || []);

      // Mettre à jour la pagination
      setCatalogPagination({
        currentPage: response.data.current_page,
        totalPages: response.data.last_page,
        rowsPerPage: response.data.per_page,
        totalCount: response.data.total,
      });
    } catch (error) {
      console.error("Erreur lors du chargement du catalogue:", error);
      toast.error("Impossible de charger le catalogue de produits numériques");
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Gestionnaires de pagination pour le catalogue
  const handleCatalogPageChange = async (newPage) => {
    setCatalogPagination(prev => ({ ...prev, currentPage: newPage }));
    // Forcer le rechargement après la mise à jour de l'état
    setTimeout(() => fetchCatalogProducts(), 0);
  };

  const handleCatalogRowsPerPageChange = async (newRowsPerPage) => {
    setCatalogPagination(prev => ({ ...prev, rowsPerPage: newRowsPerPage, currentPage: 1 }));
    // Forcer le rechargement après la mise à jour de l'état
    setTimeout(() => fetchCatalogProducts(), 0);
  };

  // Gestionnaires de pagination pour les produits de l'utilisateur
  const handleUserProductsPageChange = async (newPage) => {
    setUserProductsPagination(prev => ({ ...prev, currentPage: newPage }));
    await fetchPageData('digitalProducts', newPage, userProductsPagination.rowsPerPage);
  };

  const handleUserProductsRowsPerPageChange = async (newRowsPerPage) => {
    setUserProductsPagination(prev => ({ ...prev, rowsPerPage: newRowsPerPage, currentPage: 1 }));
    await fetchPageData('digitalProducts', 1, newRowsPerPage);
  };

  // Fonction pour ouvrir le modal d'achat d'un produit numérique
  const handlePurchaseProduct = async (productId) => {
    try {
      const product = catalogProducts.find((p) => p.id === productId);
      if (product) {
        setProductToPurchase(product);
        setShowPurchaseModal(true);
      } else {
        // Si le produit n'est pas trouvé dans le cache, on le récupère depuis l'API
        const response = await axios.get(`/api/digital-products/${productId}`);
        if (response.data) {
          setProductToPurchase(response.data.data);
          setShowPurchaseModal(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du produit:", error);
      toast.error("Impossible de récupérer les détails du produit");
    }
  };

  // Fonction pour récupérer les produits numériques achetés par l'utilisateur
  const fetchMyPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const response = await axios.get("/api/digital-products/purchases/my");
      setMyPurchases(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des achats:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Fonction pour confirmer l'achat d'un produit numérique
  const handlePurchaseComplete = (downloadUrl) => {
    // Rafraîchir la liste des produits achetés
    fetchPageData();
    fetchMyPurchases();

    // Ouvrir le lien de téléchargement si disponible
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }

    toast.success(
      "Achat réussi! Le produit a été ajouté à votre bibliothèque."
    );
  };

  // État pour le modal de photo de couverture
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoError, setCoverPhotoError] = useState("");
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(false);

  // État pour le modal de confirmation d'achat
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [productToPurchase, setProductToPurchase] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // État pour stocker les produits numériques achetés par l'utilisateur
  const [myPurchases, setMyPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // États pour la pagination
  const [pagination, setPagination] = useState({
    advertisements: { currentPage: 1, itemsPerPage: 3 },
    jobOffers: { currentPage: 1, itemsPerPage: 3 },
    businessOpportunities: { currentPage: 1, itemsPerPage: 3 },
    digitalProducts: { currentPage: 1, itemsPerPage: 3 },
    catalogProducts: { currentPage: 1, itemsPerPage: 6 },
  });

  // État pour l'onglet actif et pagination backend
  const [activeTab, setActiveTab] = useState(null);
  const [backendPagination, setBackendPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25,
  });

  // État pour le modal de boost
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [publicationToBoost, setPublicationToBoost] = useState(null);
  const [boostPublicationType, setBoostPublicationType] = useState(null);

  // États pour la gestion des livreurs
  const [livreurs, setLivreurs] = useState([]);
  const [livreursPagination, setLivreursPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 25,
    totalCount: 0,
  });
  const [catalogPagination, setCatalogPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 6,
    totalCount: 0,
  });
  const [userProductsPagination, setUserProductsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 6,
    totalCount: 0,
  });
  const [isLivreurFormOpen, setIsLivreurFormOpen] = useState(false);
  const [isLoadingLivreurs, setIsLoadingLivreurs] = useState(false);
  const [candidatureStatus, setCandidatureStatus] = useState(null); // null, 'en_attente', 'approuve', 'rejete'

  // Fonction pour récupérer les données de la page avec pagination backend
  const fetchPageData = async (activeTab = null, page = 1, rowsPerPage = 25) => {
    try {
      setIsLoading(true);
      
      // Si c'est le premier chargement et qu'on a pas les infos de base, les charger
      if (!pageData?.id) {
        const basicResponse = await axios.get('/api/my-page');
        setPageData(basicResponse.data.page);
        setSubscribersCount(basicResponse.data.page.nombre_abonnes);
        setLikesCount(basicResponse.data.page.nombre_likes);
        
        // Mettre à jour les publications avec les données de base
        const updatedPublications = {
          advertisements: basicResponse.data.page.publicites || [],
          jobOffers: basicResponse.data.page.offres_emploi || [],
          businessOpportunities: basicResponse.data.page.opportunites_affaires || [],
          digitalProducts: basicResponse.data.page.produits_numeriques || [],
        };
        setPublications(JSON.parse(JSON.stringify(updatedPublications)));
      }
      
      // Si pas d'onglet spécifié, on s'arrête là (chargement initial complet)
      if (!activeTab) {
        // Charger les autres données
        await fetchCatalogProducts();
        await fetchLivreurs(1, livreursPagination.rowsPerPage);
        fetchMyPurchases();
        return;
      }
      
      // Construire les paramètres de la requête
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      // Ajouter les filtres s'ils existent
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filters.statut && filters.statut !== 'tous') {
        params.append('statut', filters.statut);
      }
      if (filters.etat && filters.etat !== 'tous') {
        params.append('etat', filters.etat);
      }
      if (filters.date_debut) {
        params.append('date_debut', filters.date_debut);
      }
      if (filters.date_fin) {
        params.append('date_fin', filters.date_fin);
      }

      // Ajouter le type de données à charger selon l'onglet actif
      let endpoint = `/api/my-page`;
      switch (activeTab) {
        case 'advertisements':
          endpoint = `/api/my-page/advertisements`;
          break;
        case 'jobOffers':
          endpoint = `/api/my-page/job-offers`;
          break;
        case 'businessOpportunities':
          endpoint = `/api/my-page/business-opportunities`;
          break;
        case 'livreurs':
          // Utiliser le LivreurController dédié avec l'ID de la page
          endpoint = `/api/livreurs/page/${pageData?.id || ''}`;
          break;
        case 'digitalProducts':
          endpoint = `/api/my-page/digital-products`;
          params.append('per_page', userProductsPagination.rowsPerPage.toString());
          break;
        default:
          endpoint = `/api/my-page`;
      }

      // Appel API avec pagination et filtres
      const response = await axios.get(`${endpoint}?${params.toString()}`);
      
      // Mise à jour spécifique selon l'onglet
      switch (activeTab) {
        case 'advertisements':
          setPublications(prev => ({
            ...prev,
            advertisements: response.data.advertisements || []
          }));
          break;
        case 'jobOffers':
          setPublications(prev => ({
            ...prev,
            jobOffers: response.data.jobOffers || []
          }));
          break;
        case 'businessOpportunities':
          setPublications(prev => ({
            ...prev,
            businessOpportunities: response.data.businessOpportunities || []
          }));
          break;
        case 'livreurs':
          setLivreurs(response.data.livreurs || []);
          break;
        case 'digitalProducts':
          setPublications(prev => ({
            ...prev,
            digitalProducts: response.data.digitalProducts || []
          }));
          // Mettre à jour la pagination spécifique
          if (response.data.pagination) {
            setUserProductsPagination({
              currentPage: response.data.pagination.currentPage,
              totalPages: response.data.pagination.totalPages,
              rowsPerPage: response.data.pagination.itemsPerPage,
              totalCount: response.data.pagination.totalItems,
            });
          }
          break;
      }
      
      // Mettre à jour les informations de pagination ( sauf pour livreurs qui utilise un format différent)
      if (response.data.pagination && activeTab !== 'livreurs') {
        setBackendPagination(response.data.pagination);
      } else if (activeTab === 'livreurs') {
        // Pour les livreurs, créer une pagination basique car le contrôleur dédié n'inclut pas de pagination
        setBackendPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.livreurs?.length || 0,
          itemsPerPage: 25
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour actualiser manuellement les données
  const handleRefresh = async () => {
    try {
      toast.info("Actualisation en cours...");
      await fetchPageData();
      // fetchPageData inclut déjà fetchCatalogProducts, fetchLivreurs et fetchMyPurchases
      toast.success("Données actualisées avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error);
      toast.error("Erreur lors de l'actualisation des données");
    }
  };

  // Gestionnaire pour l'ouverture du modal de boost
  const handleBoost = (publication, type) => {
    setPublicationToBoost(publication);
    setBoostPublicationType(type);
    setShowBoostModal(true);
  };

  // Gestionnaire pour la fermeture du modal de boost
  const handleBoostModalClose = (success) => {
    if (success) {
      // Si le boost a réussi, rafraîchir les données
      fetchPageData();
    }
    setShowBoostModal(false);
  };

  // Gestionnaire pour la soumission du formulaire (création ou modification)
  const handleFormSubmit = async (data, customConfig = null) => {
    const isCreating = !isEditMode;
    const apiPath = getPublicationTypeApiPath(currentFormType);
    const url = isCreating
      ? `/api/${apiPath}`
      : `/api/${apiPath}/${currentPublication.id}`;

    try {
      // Utiliser la configuration personnalisée si elle est fournie, sinon utiliser la configuration par défaut
      const config = customConfig || {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Vérifier si l'objet data est bien un FormData
      if (!(data instanceof FormData)) {
        throw new Error("Format de données incorrect");
      }

      // Pour les mises à jour, utiliser POST avec _method=PUT au lieu de PUT directement
      // car PHP ne traite pas correctement les données multipart/form-data avec PUT
      if (!isCreating) {
        data.append("_method", "PUT");
      }

      // Vérification pour le fichier PDF
      let hasPdfFile = false;

      // Créer une copie des entrées pour l'inspection
      const entries = Array.from(data.entries());

      // Parcourir toutes les entrées pour vérifier offer_file
      for (let pair of entries) {
        const [key, value] = pair;

        if (key === "offer_file") {
          hasPdfFile = true;
        }
      }

      for (let pair of data.entries()) {
        // Si c'est conditions_livraison, s'assurer que c'est un tableau
        if (pair[0] === "conditions_livraison") {
          // Convertir en tableau si ce n'est pas déjà fait
          let conditions = pair[1];
          if (typeof conditions === "string") {
            try {
              conditions = JSON.parse(conditions);
            } catch (e) {
              conditions = [];
            }
          }
          if (!Array.isArray(conditions)) {
            conditions = [];
          }
          // Remplacer la valeur dans le FormData
          data.delete("conditions_livraison");
          data.append("conditions_livraison", JSON.stringify(conditions));
        }
      }

      // Toujours utiliser POST, avec _method=PUT pour les mises à jour
      const response = await axios.post(url, data, config);

      // Recharger toutes les données après une création ou modification
      // pour s'assurer que nous avons les données les plus à jour
      const pageResponse = await axios.get(`/api/my-page`);

      // Mettre à jour toutes les publications avec les données fraîches de l'API
      setPublications({
        advertisements: pageResponse.data.page.publicites || [],
        jobOffers: pageResponse.data.page.offres_emploi || [],
        businessOpportunities:
          pageResponse.data.page.opportunites_affaires || [],
        digitalProducts: pageResponse.data.page.produits_numeriques || [],
      });

      // Mettre à jour les statistiques de la page
      setSubscribersCount(pageResponse.data.page.nombre_abonnes);
      setLikesCount(pageResponse.data.page.nombre_likes);

      // Afficher une notification de succès
      toast.success(
        isCreating
          ? "Publication créée avec succès"
          : "Publication mise à jour avec succès"
      );

      // Récupérer toutes les données fraîches avant de fermer le formulaire
      await fetchPageData();
      // fetchPageData inclut déjà fetchCatalogProducts, fetchLivreurs et fetchMyPurchases

      // Fermer le formulaire après avoir récupéré les données
      handleFormClose();

      // Retourner true pour indiquer le succès
      return true;
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);

      // Afficher une notification d'erreur
      let errorMessage = "Une erreur est survenue lors de la soumission";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);

      // Propager l'erreur au composant PublicationForm pour qu'il puisse réinitialiser isSubmitting
      throw error;
    }
  };

  // Gestionnaires de pagination pour les livreurs
  const handleLivreursPageChange = async (newPage) => {
    await fetchLivreurs(newPage, livreursPagination.rowsPerPage);
  };

  const handleLivreursRowsPerPageChange = async (newRowsPerPage) => {
    await fetchLivreurs(1, newRowsPerPage);
  };

  // Fonction pour récupérer les livreurs d'une page
  const fetchLivreurs = async (page = 1, rowsPerPage = 25) => {
    if (!pageData?.id) return;

    try {
      setIsLoadingLivreurs(true);
      const response = await axios.get(`/api/livreurs/page/${pageData.id}?page=${page}&limit=${rowsPerPage}`);
      setLivreurs(response.data.livreurs || []);
      
      // Mettre à jour la pagination avec les données du backend
      const paginationData = response.data.pagination || response.data;
      setLivreursPagination({
        currentPage: paginationData.current_page || page,
        totalPages: paginationData.total_pages || 1,
        rowsPerPage: paginationData.per_page || rowsPerPage,
        totalCount: paginationData.total || response.data.livreurs?.length || 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des livreurs:", error);
      setLivreurs([]);
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
      await fetchLivreurs(1, 25);
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
      await fetchLivreurs(1, 25);
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
      await fetchLivreurs(1, 25);
    } catch (error) {
      console.error("Erreur lors de la révocation du livreur:", error);
      toast.error("Impossible de révoquer ce livreur");
    }
  };

  // Gestionnaire pour le changement d'état d'une publication (disponible/terminé)
  const handleStateChange = (id, type, newState) => {
    const apiPath = getPublicationTypeApiPath(type);
    axios
      .put(`/api/${apiPath}/${id}/etat`, { etat: newState })
      .then((response) => {
        // Mettre à jour l'état local en fonction du type de publication
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
              businessOpportunities: prev.businessOpportunities.map((opp) =>
                opp.id === id ? { ...opp, etat: newState } : opp
              ),
            }));
            break;
          default:
            break;
        }

        // Afficher une notification de succès
        let statusText = "";
        switch (newState) {
          case "disponible":
            statusText = "Disponible";
            break;
          case "terminé":
            statusText = "Terminé";
            break;
          default:
            statusText = newStatus;
        }
        toast.success(
          `État de la publication modifié avec succès: ${statusText}`
        );
      })
      .catch((error) => {
        console.error("Erreur lors du changement d'état:", error);
        toast.error("Erreur lors du changement d'état de la publication");
      });
  };

  // Gestionnaire pour l'affichage des détails d'une publication
  const handleViewDetails = (publication, type) => {
    setCurrentPublication(publication);
    setCurrentFormType(type);
    setShowDetailsModal(true);
  };

  // Fermeture du modal de détails
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setCurrentPublication(null);
    setCurrentFormType(null);
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
      await fetchLivreurs(1, 25);
      // Si c'est l'utilisateur connecté qui supprime sa propre candidature
      if (user && !pageData?.is_owner) {
        setCandidatureStatus(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du livreur:", error);
      toast.error("Impossible de supprimer cette candidature");
    }
  };

  // Fonction pour rafraîchir les données après un achat
  const refreshAfterPurchase = () => {
    fetchPageData();
    fetchMyPurchases();
    fetchCatalog();
  };

  useEffect(() => {
    // Vérifier le statut du pack de publication
    if (refreshPackStatus) {
      refreshPackStatus();
    }

    // Charger les publicités par défaut au chargement (un seul appel)
    setActiveTab('advertisements');
    loadTabData('advertisements');
    
    fetchCatalogProducts();
  }, [user.id]);

  // Effet pour recharger le catalogue quand les filtres ou la pagination changent
  useEffect(() => {
    fetchCatalogProducts();
  }, [
    catalogPagination.currentPage,
    catalogPagination.rowsPerPage,
    catalogSearchTerm,
    catalogFilters.type,
  ]);

  useEffect(() => {
    if (pageData?.id) {
      fetchLivreurs(1, 25);
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

  // Fonction pour obtenir le chemin API en fonction du type de publication
  const getPublicationTypeApiPath = (type) => {
    switch (type) {
      case "advertisement":
        return "publicites";
      case "jobOffer":
        return "offres-emploi";
      case "businessOpportunity":
        return "opportunites-affaires";
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
    
    // Recharger les données avec pagination backend
    if (activeTab) {
      loadTabData(activeTab);
    }
  };

  // Fonctions pour la pagination backend
  const handleBackendPageChange = async (newPage) => {
    if (activeTab) {
      await fetchPageData(activeTab, newPage + 1, backendPagination.itemsPerPage);
    }
  };

  const handleBackendRowsPerPageChange = async (newRowsPerPage) => {
    if (activeTab) {
      await fetchPageData(activeTab, 1, newRowsPerPage);
    }
  };

  // Fonction pour charger les données selon l'onglet actif
  const loadTabData = async (tabType) => {
    setActiveTab(tabType);
    
    // Si c'est le premier chargement, charger les infos de base + données de l'onglet en un seul appel
    if (!pageData?.id) {
      await fetchPageData(tabType, 1, 25); // Premier appel : infos de base + données de l'onglet
    } else {
      await fetchPageData(tabType, 1, 25); // Changements d'onglet : seulement les données de l'onglet
    }
  };

  // Fonction pour mettre à jour un filtre spécifique
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Effet pour recharger les données quand les filtres changent
  useEffect(() => {
    if (activeTab) {
      loadTabData(activeTab);
    }
  }, [filters, activeTab]);

  // Effet pour recharger les données quand le terme de recherche change
  useEffect(() => {
    if (activeTab) {
      loadTabData(activeTab);
    }
  }, [searchTerm, activeTab]);

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
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-blue-50'
    }`}>
      <div className={`px-3 py-4 sm:px-4 sm:py-6 lg:px-2 ${
        isMobile ? "max-w-full" : ""
      }`}>
      {/* Page Header - Modern Design */}
      <div className={`relative overflow-hidden mb-4 sm:mb-6 transition-all duration-300 hover:shadow-xl ${
        isMobile ? "rounded-2xl" : "rounded-3xl"
      } bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-lg`}>
        <div className={`relative ${isMobile ? "h-32" : "h-48"} group`}>
          {/* Enhanced Cover Photo Area with animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-purple-600/20 to-pink-600/20 dark:from-primary-800/30 dark:via-purple-800/30 dark:to-pink-800/30 z-10 transition-all duration-500 group-hover:from-primary-600/30 group-hover:via-purple-600/30 group-hover:to-pink-600/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10"></div>
          {pageData?.photo_de_couverture ? (
            <img
              src={pageData.photo_de_couverture}
              alt="Photo de couverture"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary-500 via-purple-600 to-pink-600 animate-gradient"></div>
          )}
          <button
            onClick={() => setShowCoverPhotoModal(true)}
            className={`absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 text-primary-600 dark:text-primary-400 ${
              isMobile ? "p-2" : "p-3"
            } rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out z-20 backdrop-blur-sm hover:scale-110 hover:shadow-xl hover:rotate-12 transform`}
            title="Ajouter une photo de couverture"
          >
            <PlusIcon className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} transition-transform duration-300 group-hover:rotate-90`} />
          </button>
        </div>
        <div className={`px-6 pb-4 sm:px-8 sm:pb-6 relative`}>
          <div className={`flex items-end ${
            isMobile ? "-mt-14" : "-mt-20"
          } sm:items-center flex-row relative z-30`}>
            <div className={`relative group ${
              isMobile ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36"
            } rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-105`}>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={`Photo de profil de ${user.name}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.querySelector(
                      ".fallback-initials"
                    ).style.display = "flex";
                  }}
                />
              ) : null}
              <div className={`fallback-initials h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 text-white ${
                isMobile ? "text-xl" : "text-2xl sm:text-3xl"
              } font-bold ${user?.picture ? "hidden" : ""} transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-700`}>
                {user?.name?.charAt(0) || "U"}
              </div>
              {/* Badge de statut animé */}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 animate-pulse shadow-lg"></div>
            </div>
            <div className={`ml-4 sm:ml-6 flex-1`}>
              <div className={`flex flex-row ${
                isMobile ? "items-start" : "items-center"
              } justify-between`}>
                <div className="group">
                  <h1 className={`${
                    isMobile ? "text-xl" : "text-2xl sm:text-3xl"
                  } font-bold text-white transition-all duration-300 group-hover:text-primary-200 dark:group-hover:text-primary-300`} 
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.9)',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {user?.name}
                  </h1>
                  <p className={`${
                    isMobile ? "text-xs" : "text-sm"
                  } font-medium text-gray-600 dark:text-gray-300 ${
                    isMobile
                      ? "flex flex-col space-y-2 mt-2"
                      : "flex items-center space-x-4"
                  } mt-2`}>
                    <span className={`flex items-center px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 shadow-lg ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2)'
                    }}>
                      <UsersIcon className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-blue-800 dark:text-blue-200">{subscribersCount}</span>
                      <span className="text-blue-700 dark:text-blue-300 ml-1 font-medium">abonnés</span>
                    </span>
                    <span className={`flex items-center px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/50 dark:border-gray-700/50 transition-all duration-300 hover:scale-105 shadow-lg ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 4px rgba(0,0,0,0.2)'
                    }}>
                      <svg className="h-4 w-4 mr-2 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-red-800 dark:text-red-200">{likesCount}</span>
                      <span className="text-red-700 dark:text-red-300 ml-1 font-medium">j'aime</span>
                    </span>
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
      <div className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
        isMobile ? "rounded-2xl" : "rounded-3xl"
      } bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl tabs-container`}>
        <Tab.Group onChange={(index) => {
          const tabTypes = ['advertisements', 'jobOffers', 'businessOpportunities', 'livreurs', 'formations', 'pages', 'digitalProducts', 'social'];
          if (index < tabTypes.length) {
            loadTabData(tabTypes[index]);
          }
        }}>
          {/* Custom Tab Navigation avec flèches de défilement */}
          <div className="relative bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm">
            {/* Flèche de défilement gauche */}
            <button
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-full ${
                isMobile ? "p-2" : "p-2.5"
              } hover:scale-110 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-md border border-white/50 dark:border-gray-600/50 group`}
              onClick={() => {
                const tabList = document.querySelector(".tab-list-container");
                if (tabList) {
                  tabList.scrollBy({ left: -200, behavior: "smooth" });
                }
              }}
            >
              <ChevronLeftIcon className={`h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:-translate-x-0.5`} />
            </button>

            {/* Enhanced scroll container with animated gradient masks */}
            <div className={`overflow-hidden ${
              isMobile ? "mx-8" : "mx-12"
            } relative`}>
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-800 dark:via-gray-800/80 dark:to-transparent z-[1] animate-pulse"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-gray-800 dark:via-gray-800/80 dark:to-transparent z-[1] animate-pulse"></div>

              <div className="tab-list-container overflow-x-auto scrollbar-hide">
                <Tab.List className={`flex ${isMobile ? "space-x-1" : "space-x-2"} ${
                  isMobile ? "rounded-t-2xl" : "rounded-t-3xl"
                } bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-md ${
                  isMobile ? "p-2" : "p-3"
                } whitespace-nowrap min-w-max border-b border-gray-200/50 dark:border-gray-700/50 shadow-inner`}>
                  {/* Publicités Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="truncate">Publicités</span>
                  </Tab>
                  {/* Offres d'emploi Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                    <span className="truncate">Offres d'emploi</span>
                  </Tab>
                  {/* Opportunités Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415l.707-.708zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">Opportunités</span>
                  </Tab>
                  
                  {/* Livreurs Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    <span className="truncate">Livreurs</span>
                  </Tab>
                  
                  {/* Formations Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <AcademicCapIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span className="truncate">Formations</span>
                  </Tab>
                  {/* Pages Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <UsersIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span className="truncate">Pages</span>
                  </Tab>
                  
                  {/* Produits numériques Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <DocumentTextIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span className="truncate">Produits numériques</span>
                  </Tab>
                  
                  {/* Social Tab */}
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 relative ${
                          isMobile
                            ? "min-w-[110px] py-2.5 px-3"
                            : "min-w-[130px] py-3 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-semibold ${
                          isMobile ? "rounded-xl" : "rounded-2xl"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105`,
                        "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                        selected
                          ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-400/50 dark:border-primary-600/50 scale-105"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-md"
                      )
                    }
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    <span className="truncate">Social</span>
                  </Tab>
                </Tab.List>
              </div>
            </div>

            {/* Flèche de défilement droite */}
            <button
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-l from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-full ${
                isMobile ? "p-2" : "p-2.5"
              } hover:scale-110 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-md border border-white/50 dark:border-gray-600/50 group`}
              onClick={() => {
                const tabList = document.querySelector(".tab-list-container");
                if (tabList) {
                  tabList.scrollBy({ left: 200, behavior: "smooth" });
                }
              }}
            >
              <ChevronRightIcon className={`h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:translate-x-0.5`} />
            </button>
          </div>
          <Tab.Panels>
            {/* Advertisements Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-4"}`}>
              <SubTabsPanel
                tabs={[
                  { label: "Mes publicités", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div className={`flex ${
                          isMobile ? "flex-col gap-3" : "justify-between"
                        } items-center ${isMobile ? "mb-4" : "mb-6"}`}>
                          <h2 className={`${
                            isMobile ? "text-lg" : "text-xl"
                          } font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent`}>
                            Mes publicités
                          </h2>
                          <div className={`flex items-center ${
                            isMobile ? "gap-2 w-full" : "gap-3"
                          }`}>
                            <button
                              onClick={handleRefresh}
                              className={`group flex items-center ${
                                isMobile
                                  ? "gap-2 px-3 py-2 text-xs"
                                  : "gap-2 px-4 py-2.5"
                              } bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-300 ${
                                isMobile
                                  ? "rounded-xl flex-1 justify-center"
                                  : "rounded-xl"
                              } transition-all duration-300 hover:scale-105 hover:shadow-md border border-gray-200 dark:border-gray-600`}
                              title="Actualiser les données"
                            >
                              <ArrowPathIcon className={`${
                                isMobile ? "h-4 w-4" : "h-5 w-5"
                              } transition-transform duration-300 group-hover:rotate-180`} />
                              <span className="font-medium">{isMobile ? "Actualiser" : "Actualiser"}</span>
                            </button>
                            <button
                              onClick={() => handleFormOpen("advertisement")}
                              className={`group flex items-center ${
                                isMobile
                                  ? "gap-2 px-3 py-2 text-xs flex-1 justify-center"
                                  : "gap-2 px-5 py-2.5"
                              } ${
                                isPackActive
                                  ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-600/35"
                                  : "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-60"
                              } text-white ${
                                isMobile ? "rounded-xl" : "rounded-xl"
                              } transition-all duration-300 hover:scale-105 transform border border-primary-400/50 dark:border-primary-600/50 ${
                                isPackActive ? "hover:-translate-y-0.5" : ""
                              }`}
                              disabled={!isPackActive}
                              title={
                                !isPackActive
                                  ? "Veuillez activer votre pack de publication pour créer une publicité"
                                  : ""
                              }
                            >
                              <PlusIcon className={`${
                                isMobile ? "h-4 w-4" : "h-5 w-5"
                              } transition-transform duration-300 group-hover:rotate-90`} />
                              <span className="font-semibold">{isMobile ? "Créer" : "Créer une publicité"}</span>
                            </button>
                          </div>
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
                            <div
                              className={`animate-spin rounded-full ${
                                isMobile ? "h-6 w-6" : "h-8 w-8"
                              } border-b-2 border-primary-600`}
                            ></div>
                          </div>
                        ) : (
                          <>
                            {/* Tableau des publicités */}
                            {getFilteredPublications("advertisement", false).length === 0 ? (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                {searchTerm ||
                                filters.statut !== "tous" ||
                                filters.etat !== "tous" ||
                                filters.dateRange !== "tous"
                                  ? "Aucune publicité ne correspond à vos critères de recherche."
                                  : "Vous n'avez pas encore de publicités."}
                              </Alert>
                            ) : (
                              <TableContainer
                                sx={{
                                  boxShadow: isDarkMode
                                    ? "none"
                                    : "0 2px 10px rgba(0, 0, 0, 0.05)",
                                  borderRadius: { xs: 1.5, sm: 2 },
                                  overflow: "auto",
                                  maxWidth: "100%",
                                  "&::-webkit-scrollbar": {
                                    height: { xs: 4, sm: 6 },
                                    width: { xs: 4, sm: 6 },
                                  },
                                  "&::-webkit-scrollbar-track": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(55, 65, 81, 0.4)"
                                      : "rgba(0, 0, 0, 0.06)",
                                    borderRadius: { xs: 2, sm: 3 },
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(156, 163, 175, 0.6)"
                                      : "rgba(156, 163, 175, 0.4)",
                                    borderRadius: { xs: 2, sm: 3 },
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(156, 163, 175, 0.8)"
                                        : "rgba(156, 163, 175, 0.6)",
                                    },
                                  },
                                }}
                              >
                                <Table 
                                  size="small" 
                                  sx={{ 
                                    minWidth: { xs: "800px", sm: "900px" },
                                    tableLayout: "fixed"
                                  }}
                                >
                                  <TableHead>
                                    <TableRow
                                      sx={{
                                        bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                                        "& th": {
                                          fontWeight: "bold",
                                          color: isDarkMode ? "#fff" : "#334155",
                                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                          padding: { xs: "8px 10px", sm: "12px 16px" },
                                          borderBottom: isDarkMode
                                            ? "1px solid #374151"
                                            : "2px solid #e2e8f0",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                          whiteSpace: "nowrap",
                                        },
                                      }}
                                    >
                                      <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
                                      <TableCell sx={{ width: { xs: "200px", sm: "250px" } }}>Titre</TableCell>
                                      <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Statut</TableCell>
                                      <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date</TableCell>
                                      <TableCell sx={{ width: { xs: "80px", sm: "100px" } }} align="center">Actions</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {getFilteredPublications("advertisement", false).map((ad) => (
                                      <TableRow
                                        key={ad.id}
                                        sx={{
                                          "&:hover": {
                                            bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                          },
                                          borderBottom: `1px solid ${
                                            isDarkMode ? "#374151" : "#e2e8f0"
                                          }`,
                                          "& td": {
                                            padding: { xs: "6px 10px", sm: "10px 16px" },
                                            color: isDarkMode ? "#fff" : "#475569",
                                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          },
                                          bgcolor: isDarkMode ? "#1d2432" : "#fff",
                                        }}
                                      >
                                        <TableCell>
                                          <Box
                                            sx={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              px: { xs: 0.75, sm: 1 },
                                              py: { xs: 0.4, sm: 0.5 },
                                              borderRadius: { xs: 0.75, sm: 1 },
                                              background: isDarkMode
                                                ? "rgba(59, 130, 246, 0.2)"
                                                : "rgba(59, 130, 246, 0.1)",
                                              border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              fontWeight: 600,
                                              color: isDarkMode ? "#60a5fa" : "#2563eb",
                                            }}
                                          >
                                            #{ad.id}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              maxWidth: { xs: "180px", sm: "230px" },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                fontWeight: 600,
                                                color: isDarkMode ? "#fff" : "#1f2937",
                                                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {ad.titre || "Sans titre"}
                                            </Box>
                                            {ad.description && (
                                              <Box
                                                sx={{
                                                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                                                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  mt: 0.5,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {ad.description.length > 50
                                                  ? ad.description.substring(0, 50) + "..."
                                                  : ad.description}
                                              </Box>
                                            )}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={getStatutLabel(ad.statut)}
                                            size="small"
                                            color={getStatutColor(ad.statut)}
                                            sx={{
                                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                              height: { xs: 20, sm: 24 },
                                              fontWeight: 600,
                                              borderRadius: { xs: 1, sm: 1.5 },
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                                            }}
                                          >
                                            {formatDate(ad.created_at)}
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Box
                                            sx={{
                                              display: "flex",
                                              gap: 0.5,
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Tooltip title="Voir les détails" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(ad, "advertisement")}
                                                sx={{
                                                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                                                  bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)",
                                                  },
                                                }}
                                              >
                                                <EyeIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEdit(ad, "advertisement")}
                                                sx={{
                                                  color: isDarkMode ? "#34d399" : "#059669",
                                                  bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.1)" : "rgba(5, 150, 105, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.2)" : "rgba(5, 150, 105, 0.1)",
                                                  },
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteConfirm(ad.id, "advertisement")}
                                                sx={{
                                                  color: isDarkMode ? "#f87171" : "#dc2626",
                                                  bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "rgba(220, 38, 38, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.2)" : "rgba(220, 38, 38, 0.1)",
                                                  },
                                                }}
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* Pagination backend pour les publicités */}
                            <TablePagination
                              component="div"
                              count={backendPagination.totalItems}
                              page={backendPagination.currentPage - 1}
                              onPageChange={(event, newPage) => handleBackendPageChange(newPage)}
                              rowsPerPage={backendPagination.itemsPerPage}
                              onRowsPerPageChange={(event) => handleBackendRowsPerPageChange(parseInt(event.target.value, 10))}
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
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2
                          className={`${
                            isMobile ? "text-base" : "text-lg"
                          } font-semibold text-gray-800 dark:text-white ${
                            isMobile ? "mb-3" : "mb-4"
                          }`}
                        >
                          Fil d'actualité - Publicités
                        </h2>
                        <div
                          className={`bg-white dark:bg-gray-800 ${
                            isMobile ? "rounded-md" : "rounded-lg"
                          } shadow ${isMobile ? "p-2" : "p-4"}`}
                        >
                          <NewsFeed
                            initialActiveTab={0}
                            showTabs={false}
                            compact={isMobile}
                          />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Job Offers Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-4"}`}>
              <SubTabsPanel
                tabs={[
                  { label: "Mes offres", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div
                          className={`flex ${
                            isMobile ? "flex-col gap-3" : "justify-between"
                          } items-center ${isMobile ? "mb-3" : "mb-4"}`}
                        >
                          <h2
                            className={`${
                              isMobile ? "text-base" : "text-lg"
                            } font-semibold text-gray-800 dark:text-white`}
                          >
                            Mes offres d'emploi
                          </h2>
                          <div
                            className={`flex items-center ${
                              isMobile ? "gap-1 w-full" : "gap-2"
                            }`}
                          >
                            <button
                              onClick={handleRefresh}
                              className={`flex items-center ${
                                isMobile
                                  ? "gap-1 px-2 py-1.5 text-xs"
                                  : "gap-2 px-3 py-2"
                              } bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 ${
                                isMobile
                                  ? "rounded-md flex-1 justify-center"
                                  : "rounded-lg"
                              } transition-colors`}
                              title="Actualiser les données"
                            >
                              <ArrowPathIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Actualiser" : "Actualiser"}
                            </button>
                            <button
                              onClick={() => handleFormOpen("jobOffer")}
                              className={`flex items-center ${
                                isMobile
                                  ? "gap-1 px-2 py-1.5 text-xs flex-1 justify-center"
                                  : "gap-2 px-4 py-2"
                              } ${
                                isPackActive
                                  ? "bg-primary-600 hover:bg-primary-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              } text-white ${
                                isMobile ? "rounded-md" : "rounded-lg"
                              } transition-colors`}
                              disabled={!isPackActive}
                              title={
                                !isPackActive
                                  ? "Veuillez activer votre pack de publication pour créer une offre d'emploi"
                                  : ""
                              }
                            >
                              <PlusIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Créer" : "Créer une offre"}
                            </button>
                          </div>
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
                            <div
                              className={`animate-spin rounded-full ${
                                isMobile ? "h-6 w-6" : "h-8 w-8"
                              } border-b-2 border-primary-600`}
                            ></div>
                          </div>
                        ) : (
                          <>
                            {/* Tableau des offres d'emploi */}
                            {getFilteredPublications("jobOffer", false).length === 0 ? (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                {searchTerm ||
                                filters.statut !== "tous" ||
                                filters.etat !== "tous" ||
                                filters.dateRange !== "tous"
                                  ? "Aucune offre d'emploi ne correspond à vos critères de recherche."
                                  : "Vous n'avez pas encore d'offres d'emploi."}
                              </Alert>
                            ) : (
                              <TableContainer
                                sx={{
                                  boxShadow: isDarkMode
                                    ? "none"
                                    : "0 2px 10px rgba(0, 0, 0, 0.05)",
                                  borderRadius: { xs: 1.5, sm: 2 },
                                  overflow: "auto",
                                  maxWidth: "100%",
                                  "&::-webkit-scrollbar": {
                                    height: { xs: 4, sm: 6 },
                                    width: { xs: 4, sm: 6 },
                                  },
                                  "&::-webkit-scrollbar-track": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(55, 65, 81, 0.4)"
                                      : "rgba(0, 0, 0, 0.06)",
                                    borderRadius: { xs: 2, sm: 3 },
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(156, 163, 175, 0.6)"
                                      : "rgba(156, 163, 175, 0.4)",
                                    borderRadius: { xs: 2, sm: 3 },
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(156, 163, 175, 0.8)"
                                        : "rgba(156, 163, 175, 0.6)",
                                    },
                                  },
                                }}
                              >
                                <Table 
                                  size="small" 
                                  sx={{ 
                                    minWidth: { xs: "800px", sm: "900px" },
                                    tableLayout: "fixed"
                                  }}
                                >
                                  <TableHead>
                                    <TableRow
                                      sx={{
                                        bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                                        "& th": {
                                          fontWeight: "bold",
                                          color: isDarkMode ? "#fff" : "#334155",
                                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                          padding: { xs: "8px 10px", sm: "12px 16px" },
                                          borderBottom: isDarkMode
                                            ? "1px solid #374151"
                                            : "2px solid #e2e8f0",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                          whiteSpace: "nowrap",
                                        },
                                      }}
                                    >
                                      <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
                                      <TableCell sx={{ width: { xs: "200px", sm: "250px" } }}>Titre</TableCell>
                                      <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Statut</TableCell>
                                      <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date</TableCell>
                                      <TableCell sx={{ width: { xs: "80px", sm: "100px" } }} align="center">Actions</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {getFilteredPublications("jobOffer", false).map((offer) => (
                                      <TableRow
                                        key={offer.id}
                                        sx={{
                                          "&:hover": {
                                            bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                          },
                                          borderBottom: `1px solid ${
                                            isDarkMode ? "#374151" : "#e2e8f0"
                                          }`,
                                          "& td": {
                                            padding: { xs: "6px 10px", sm: "10px 16px" },
                                            color: isDarkMode ? "#fff" : "#475569",
                                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          },
                                          bgcolor: isDarkMode ? "#1d2432" : "#fff",
                                        }}
                                      >
                                        <TableCell>
                                          <Box
                                            sx={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              px: { xs: 0.75, sm: 1 },
                                              py: { xs: 0.4, sm: 0.5 },
                                              borderRadius: { xs: 0.75, sm: 1 },
                                              background: isDarkMode
                                                ? "rgba(34, 197, 94, 0.2)"
                                                : "rgba(34, 197, 94, 0.1)",
                                              border: `1px solid ${isDarkMode ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.2)"}`,
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              fontWeight: 600,
                                              color: isDarkMode ? "#4ade80" : "#16a34a",
                                            }}
                                          >
                                            #{offer.id}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              maxWidth: { xs: "180px", sm: "230px" },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                fontWeight: 600,
                                                color: isDarkMode ? "#fff" : "#1f2937",
                                                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {offer.titre || "Sans titre"}
                                            </Box>
                                            {offer.description && (
                                              <Box
                                                sx={{
                                                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                                                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  mt: 0.5,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {offer.description.length > 50
                                                  ? offer.description.substring(0, 50) + "..."
                                                  : offer.description}
                                              </Box>
                                            )}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={getStatutLabel(offer.statut)}
                                            size="small"
                                            color={getStatutColor(offer.statut)}
                                            sx={{
                                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                              height: { xs: 20, sm: 24 },
                                              fontWeight: 600,
                                              borderRadius: { xs: 1, sm: 1.5 },
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                                            }}
                                          >
                                            {formatDate(offer.created_at)}
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Box
                                            sx={{
                                              display: "flex",
                                              gap: 0.5,
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Tooltip title="Voir les détails" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(offer, "jobOffer")}
                                                sx={{
                                                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                                                  bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)",
                                                  },
                                                }}
                                              >
                                                <EyeIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEdit(offer, "jobOffer")}
                                                sx={{
                                                  color: isDarkMode ? "#34d399" : "#059669",
                                                  bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.1)" : "rgba(5, 150, 105, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.2)" : "rgba(5, 150, 105, 0.1)",
                                                  },
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteConfirm(offer.id, "jobOffer")}
                                                sx={{
                                                  color: isDarkMode ? "#f87171" : "#dc2626",
                                                  bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "rgba(220, 38, 38, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.2)" : "rgba(220, 38, 38, 0.1)",
                                                  },
                                                }}
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* Pagination backend pour les offres d'emploi */}
                            <TablePagination
                              component="div"
                              count={backendPagination.totalItems}
                              page={backendPagination.currentPage - 1}
                              onPageChange={(event, newPage) => handleBackendPageChange(newPage)}
                              rowsPerPage={backendPagination.itemsPerPage}
                              onRowsPerPageChange={(event) => handleBackendRowsPerPageChange(parseInt(event.target.value, 10))}
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
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2
                          className={`${
                            isMobile ? "text-base" : "text-lg"
                          } font-semibold text-gray-800 dark:text-white ${
                            isMobile ? "mb-3" : "mb-4"
                          }`}
                        >
                          Fil d'actualité - Offres d'emploi
                        </h2>
                        <div
                          className={`bg-white dark:bg-gray-800 ${
                            isMobile ? "rounded-md" : "rounded-lg"
                          } shadow ${isMobile ? "p-2" : "p-4"}`}
                        >
                          <NewsFeed
                            initialActiveTab={1}
                            showTabs={false}
                            compact={isMobile}
                          />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Business Opportunities Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-4"}`}>
              <SubTabsPanel
                tabs={[
                  { label: "Mes opportunités", icon: UserIcon },
                  { label: "Fil d'actualité", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div
                          className={`flex ${
                            isMobile ? "flex-col gap-3" : "justify-between"
                          } items-center ${isMobile ? "mb-3" : "mb-4"}`}
                        >
                          <h2
                            className={`${
                              isMobile ? "text-base" : "text-lg"
                            } font-semibold text-gray-800 dark:text-white`}
                          >
                            Mes opportunités d'affaires
                          </h2>
                          <div
                            className={`flex items-center ${
                              isMobile ? "gap-1 w-full" : "gap-2"
                            }`}
                          >
                            <button
                              onClick={handleRefresh}
                              className={`flex items-center ${
                                isMobile
                                  ? "gap-1 px-2 py-1.5 text-xs"
                                  : "gap-2 px-3 py-2"
                              } bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 ${
                                isMobile
                                  ? "rounded-md flex-1 justify-center"
                                  : "rounded-lg"
                              } transition-colors`}
                              title="Actualiser les données"
                            >
                              <ArrowPathIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Actualiser" : "Actualiser"}
                            </button>
                            <button
                              onClick={() =>
                                handleFormOpen("businessOpportunity")
                              }
                              className={`flex items-center ${
                                isMobile
                                  ? "gap-1 px-2 py-1.5 text-xs flex-1 justify-center"
                                  : "gap-2 px-4 py-2"
                              } ${
                                isPackActive
                                  ? "bg-primary-600 hover:bg-primary-700"
                                  : "bg-gray-400 cursor-not-allowed"
                              } text-white ${
                                isMobile ? "rounded-md" : "rounded-lg"
                              } transition-colors`}
                              disabled={!isPackActive}
                              title={
                                !isPackActive
                                  ? "Veuillez activer votre pack de publication pour créer une opportunité d'affaires"
                                  : ""
                              }
                            >
                              <PlusIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Créer" : "Créer une opportunité"}
                            </button>
                          </div>
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
                            <div
                              className={`animate-spin rounded-full ${
                                isMobile ? "h-6 w-6" : "h-8 w-8"
                              } border-b-2 border-primary-600`}
                            ></div>
                          </div>
                        ) : (
                          <>
                            {/* Tableau des opportunités d'affaires */}
                            {getFilteredPublications("businessOpportunity", false).length === 0 ? (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                {searchTerm ||
                                filters.statut !== "tous" ||
                                filters.etat !== "tous" ||
                                filters.dateRange !== "tous"
                                  ? "Aucune opportunité d'affaires ne correspond à vos critères de recherche."
                                  : "Vous n'avez pas encore d'opportunités d'affaires."}
                              </Alert>
                            ) : (
                              <TableContainer
                                sx={{
                                  boxShadow: isDarkMode
                                    ? "none"
                                    : "0 2px 10px rgba(0, 0, 0, 0.05)",
                                  borderRadius: { xs: 1.5, sm: 2 },
                                  overflow: "auto",
                                  maxWidth: "100%",
                                  "&::-webkit-scrollbar": {
                                    height: { xs: 4, sm: 6 },
                                    width: { xs: 4, sm: 6 },
                                  },
                                  "&::-webkit-scrollbar-track": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(55, 65, 81, 0.4)"
                                      : "rgba(0, 0, 0, 0.06)",
                                    borderRadius: { xs: 2, sm: 3 },
                                  },
                                  "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(156, 163, 175, 0.6)"
                                      : "rgba(156, 163, 175, 0.4)",
                                    borderRadius: { xs: 2, sm: 3 },
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(156, 163, 175, 0.8)"
                                        : "rgba(156, 163, 175, 0.6)",
                                    },
                                  },
                                }}
                              >
                                <Table 
                                  size="small" 
                                  sx={{ 
                                    minWidth: { xs: "800px", sm: "900px" },
                                    tableLayout: "fixed"
                                  }}
                                >
                                  <TableHead>
                                    <TableRow
                                      sx={{
                                        bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                                        "& th": {
                                          fontWeight: "bold",
                                          color: isDarkMode ? "#fff" : "#334155",
                                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                          padding: { xs: "8px 10px", sm: "12px 16px" },
                                          borderBottom: isDarkMode
                                            ? "1px solid #374151"
                                            : "2px solid #e2e8f0",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                          whiteSpace: "nowrap",
                                        },
                                      }}
                                    >
                                      <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
                                      <TableCell sx={{ width: { xs: "200px", sm: "250px" } }}>Titre</TableCell>
                                      <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Statut</TableCell>
                                      <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date</TableCell>
                                      <TableCell sx={{ width: { xs: "80px", sm: "100px" } }} align="center">Actions</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {getFilteredPublications("businessOpportunity", false).map((opportunity) => (
                                      <TableRow
                                        key={opportunity.id}
                                        sx={{
                                          "&:hover": {
                                            bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                          },
                                          borderBottom: `1px solid ${
                                            isDarkMode ? "#374151" : "#e2e8f0"
                                          }`,
                                          "& td": {
                                            padding: { xs: "6px 10px", sm: "10px 16px" },
                                            color: isDarkMode ? "#fff" : "#475569",
                                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          },
                                          bgcolor: isDarkMode ? "#1d2432" : "#fff",
                                        }}
                                      >
                                        <TableCell>
                                          <Box
                                            sx={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              px: { xs: 0.75, sm: 1 },
                                              py: { xs: 0.4, sm: 0.5 },
                                              borderRadius: { xs: 0.75, sm: 1 },
                                              background: isDarkMode
                                                ? "rgba(168, 85, 247, 0.2)"
                                                : "rgba(168, 85, 247, 0.1)",
                                              border: `1px solid ${isDarkMode ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.2)"}`,
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              fontWeight: 600,
                                              color: isDarkMode ? "#a78bfa" : "#7c3aed",
                                            }}
                                          >
                                            #{opportunity.id}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              maxWidth: { xs: "180px", sm: "230px" },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                fontWeight: 600,
                                                color: isDarkMode ? "#fff" : "#1f2937",
                                                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {opportunity.titre || "Sans titre"}
                                            </Box>
                                            {opportunity.description && (
                                              <Box
                                                sx={{
                                                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                                                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  mt: 0.5,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {opportunity.description.length > 50
                                                  ? opportunity.description.substring(0, 50) + "..."
                                                  : opportunity.description}
                                              </Box>
                                            )}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={getStatutLabel(opportunity.statut)}
                                            size="small"
                                            color={getStatutColor(opportunity.statut)}
                                            sx={{
                                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                              height: { xs: 20, sm: 24 },
                                              fontWeight: 600,
                                              borderRadius: { xs: 1, sm: 1.5 },
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{
                                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                                            }}
                                          >
                                            {formatDate(opportunity.created_at)}
                                          </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Box
                                            sx={{
                                              display: "flex",
                                              gap: 0.5,
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Tooltip title="Voir les détails" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleViewDetails(opportunity, "businessOpportunity")}
                                                sx={{
                                                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                                                  bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(37, 99, 235, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)",
                                                  },
                                                }}
                                              >
                                                <EyeIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Modifier" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleEdit(opportunity, "businessOpportunity")}
                                                sx={{
                                                  color: isDarkMode ? "#34d399" : "#059669",
                                                  bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.1)" : "rgba(5, 150, 105, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.2)" : "rgba(5, 150, 105, 0.1)",
                                                  },
                                                }}
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Supprimer" arrow>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleDeleteConfirm(opportunity.id, "businessOpportunity")}
                                                sx={{
                                                  color: isDarkMode ? "#f87171" : "#dc2626",
                                                  bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.1)" : "rgba(220, 38, 38, 0.05)",
                                                  "&:hover": {
                                                    bgcolor: isDarkMode ? "rgba(248, 113, 113, 0.2)" : "rgba(220, 38, 38, 0.1)",
                                                  },
                                                }}
                                              >
                                                <TrashIcon className="h-4 w-4" />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* Pagination backend pour les opportunités d'affaires */}
                            <TablePagination
                              component="div"
                              count={backendPagination.totalItems}
                              page={backendPagination.currentPage - 1}
                              onPageChange={(event, newPage) => handleBackendPageChange(newPage)}
                              rowsPerPage={backendPagination.itemsPerPage}
                              onRowsPerPageChange={(event) => handleBackendRowsPerPageChange(parseInt(event.target.value, 10))}
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
                      </>
                    ),
                  },
                  {
                    content: (
                      <div className="news-feed-wrapper">
                        <h2
                          className={`${
                            isMobile ? "text-base" : "text-lg"
                          } font-semibold text-gray-800 dark:text-white ${
                            isMobile ? "mb-3" : "mb-4"
                          }`}
                        >
                          Fil d'actualité - Opportunités d'affaires
                        </h2>
                        <div
                          className={`bg-white dark:bg-gray-800 ${
                            isMobile ? "rounded-md" : "rounded-lg"
                          } shadow ${isMobile ? "p-2" : "p-4"}`}
                        >
                          <NewsFeed
                            initialActiveTab={2}
                            showTabs={false}
                            compact={isMobile}
                          />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Tab.Panel>

            {/* Livreurs Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-4"}`}>
              {/* Gestion des livreurs */}
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`${
                    isMobile ? "text-lg" : "text-xl"
                  } font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent`}>
                    Gestion des livreurs
                  </h2>
                  {!pageData?.is_owner &&
                    candidatureStatus !== null && (
                      <div className={`${
                        isMobile ? "text-xs" : "text-sm"
                      }`}>
                        {candidatureStatus === "en_attente" && (
                          <span className={`${
                            isMobile
                              ? "px-2 py-1 text-[10px]"
                              : "px-3 py-1.5"
                          } bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 text-yellow-800 dark:text-yellow-200 rounded-full font-medium border border-yellow-200 dark:border-yellow-700`}>
                            Candidature en attente
                          </span>
                        )}
                        {candidatureStatus === "approuve" && (
                          <span className={`${
                            isMobile
                              ? "px-2 py-1 text-[10px]"
                              : "px-3 py-1.5"
                          } bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-200 rounded-full font-medium border border-green-200 dark:border-green-700`}>
                            Candidature approuvée
                          </span>
                        )}
                        {candidatureStatus === "rejete" && (
                          <span className={`${
                            isMobile
                              ? "px-2 py-1 text-[10px]"
                              : "px-3 py-1.5"
                          } bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 text-red-800 dark:text-red-200 rounded-full font-medium border border-red-200 dark:border-red-700`}>
                            Candidature rejetée
                          </span>
                        )}
                      </div>
                    )}
                </div>

                {isLoadingLivreurs ? (
                  <div className="flex justify-center items-center py-12">
                    <div className={`animate-spin rounded-full ${
                      isMobile ? "h-8 w-8" : "h-10 w-10"
                    } border-b-2 border-primary-600`}></div>
                  </div>
                ) : (
                  <LivreursList
                    livreurs={livreurs}
                    onApprove={handleApproveLivreur}
                    onReject={handleRejectLivreur}
                    onRevoke={handleRevokeLivreur}
                    onDelete={handleDeleteLivreur}
                    isPageOwner={true}
                    compact={isMobile}
                    pagination={true}
                    currentPage={livreursPagination.currentPage}
                    totalPages={livreursPagination.totalPages}
                    onPageChange={handleLivreursPageChange}
                    rowsPerPage={livreursPagination.rowsPerPage}
                    onRowsPerPageChange={handleLivreursRowsPerPageChange}
                    totalCount={livreursPagination.totalCount}
                  />
                )}
              </>
            </Tab.Panel>

            {/* Formations Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-0"}`}>
              <Formations compact={isMobile} />
            </Tab.Panel>

            {/* Pages Panel */}
            <Tab.Panel className={`${isMobile ? "p-2" : "p-4"}`}>
              <div className="news-feed-wrapper">
                <h2
                  className={`${
                    isMobile ? "text-base" : "text-lg"
                  } font-semibold text-gray-800 dark:text-white ${
                    isMobile ? "mb-3" : "mb-4"
                  }`}
                >
                  Pages
                </h2>
                <PageSearch compact={isMobile} />
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
                        <div
                          className={`${
                            isMobile
                              ? "space-y-3"
                              : "flex justify-between items-center"
                          } mb-4`}
                        >
                          <h2
                            className={`font-semibold text-gray-800 dark:text-white ${
                              isMobile ? "text-base" : "text-lg"
                            }`}
                          >
                            Mes produits numériques
                          </h2>
                          <div
                            className={`${
                              isMobile
                                ? "flex gap-2"
                                : "flex items-center gap-2"
                            }`}
                          >
                            <button
                              onClick={handleRefresh}
                              className={`flex items-center justify-center gap-2 ${
                                isMobile ? "px-2 py-2 text-xs" : "px-3 py-2"
                              } bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors`}
                              title="Actualiser les données"
                            >
                              <ArrowPathIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {!isMobile && "Actualiser"}
                            </button>
                            <button
                              onClick={() => setIsDigitalProductFormOpen(true)}
                              className={`flex items-center justify-center gap-2 ${
                                isMobile
                                  ? "px-2 py-2 text-xs flex-1"
                                  : "px-4 py-2"
                              } ${
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
                              <PlusIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Créer" : "Créer un produit"}
                            </button>
                          </div>
                        </div>

                        {/* Filtres et recherche */}
                        <div className="mb-4">
                          <SearchFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={(value) => setSearchTerm(value)}
                            filters={filters}
                            onFilterChange={(newFilters) =>
                              setFilters(newFilters)
                            }
                            showFilters={showFilters}
                            onToggleFilters={() => setShowFilters(!showFilters)}
                          />
                        </div>

                        {/* Liste des produits numériques */}
                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                          </div>
                        ) : publications?.digitalProducts?.length > 0 ? (
                          <>
                            <div
                              className={`grid ${
                                isMobile
                                  ? "grid-cols-1 gap-4"
                                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                              }`}
                            >
                              {publications?.digitalProducts?.map((product) => (
                                  <div key={product.id} className="mb-4">
                                    <DigitalProductCard
                                      product={product}
                                      onEdit={() => {
                                        setSelectedDigitalProduct(product);
                                        setIsDigitalProductFormOpen(true);
                                      }}
                                      onDelete={(id) =>
                                        handleDeleteConfirm(
                                          id,
                                          "digitalProduct"
                                        )
                                      }
                                      onChangeStatus={(id, newStatus) =>
                                        handleChangeState(
                                          id,
                                          "digitalProduct",
                                          newStatus
                                        )
                                      }
                                    />
                                  </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {Math.ceil(
                              getFilteredPublications("digitalProduct", true)
                                .length / digitalProductsPagination.itemsPerPage
                            ) > 1 && (
                              <div
                                className={`flex justify-center ${
                                  isMobile ? "mt-4" : "mt-6"
                                }`}
                              >
                                <nav
                                  className={`flex items-center ${
                                    isMobile ? "space-x-1" : "space-x-2"
                                  }`}
                                >
                                  <button
                                    onClick={() =>
                                      setDigitalProductsPagination((prev) => ({
                                        ...prev,
                                        currentPage: Math.max(
                                          1,
                                          prev.currentPage - 1
                                        ),
                                      }))
                                    }
                                    disabled={
                                      digitalProductsPagination.currentPage ===
                                      1
                                    }
                                    className={`${
                                      isMobile
                                        ? "px-2 py-1 text-xs"
                                        : "px-3 py-1"
                                    } rounded-md transition-all duration-300 ease-in-out ${
                                      digitalProductsPagination.currentPage ===
                                      1
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    {isMobile ? "←" : "Précédent"}
                                  </button>

                                  {Array.from(
                                    {
                                      length: Math.ceil(
                                        getFilteredPublications(
                                          "digitalProduct",
                                          true
                                        ).length /
                                          digitalProductsPagination.itemsPerPage
                                      ),
                                    },
                                    (_, i) => i + 1
                                  ).map((page) => (
                                    <button
                                      key={page}
                                      onClick={() =>
                                        setDigitalProductsPagination(
                                          (prev) => ({
                                            ...prev,
                                            currentPage: page,
                                          })
                                        )
                                      }
                                      className={`${
                                        isMobile
                                          ? "px-2 py-1 text-xs"
                                          : "px-3 py-1"
                                      } rounded-md transition-all duration-300 ease-in-out ${
                                        digitalProductsPagination.currentPage ===
                                        page
                                          ? "bg-blue-600 text-white shadow-md scale-105"
                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md dark:hover:bg-gray-600 hover:scale-105"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  ))}

                                  <button
                                    onClick={() =>
                                      setDigitalProductsPagination((prev) => ({
                                        ...prev,
                                        currentPage: Math.min(
                                          Math.ceil(
                                            getFilteredPublications(
                                              "digitalProduct",
                                              true
                                            ).length /
                                              digitalProductsPagination.itemsPerPage
                                          ),
                                          prev.currentPage + 1
                                        ),
                                      }))
                                    }
                                    disabled={
                                      digitalProductsPagination.currentPage ===
                                      Math.ceil(
                                        getFilteredPublications(
                                          "digitalProduct",
                                          true
                                        ).length /
                                          digitalProductsPagination.itemsPerPage
                                      )
                                    }
                                    className={`${
                                      isMobile
                                        ? "px-2 py-1 text-xs"
                                        : "px-3 py-1"
                                    } rounded-md transition-all duration-300 ease-in-out ${
                                      digitalProductsPagination.currentPage ===
                                      Math.ceil(
                                        getFilteredPublications(
                                          "digitalProduct",
                                          true
                                        ).length /
                                          digitalProductsPagination.itemsPerPage
                                      )
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md dark:hover:bg-gray-600"
                                    }`}
                                  >
                                    {isMobile ? "→" : "Suivant"}
                                  </button>
                                </nav>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                              Vous n'avez pas encore créé de produits
                              numériques.
                            </p>
                          </div>
                        )}

                        {/* Pagination backend pour les produits de l'utilisateur */}
                        {!isLoading &&
                          publications?.digitalProducts?.length > 0 && (
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 4, px: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                  {userProductsPagination.totalCount > 0
                                    ? `${(userProductsPagination.currentPage - 1) * userProductsPagination.rowsPerPage + 1}-${Math.min(userProductsPagination.currentPage * userProductsPagination.rowsPerPage, userProductsPagination.totalCount)} sur ${userProductsPagination.totalCount}`
                                    : "0 résultats"}
                                </Typography>
                                <MuiPagination
                                  count={userProductsPagination.totalPages}
                                  page={userProductsPagination.currentPage}
                                  onChange={(e, newPage) => handleUserProductsPageChange(newPage)}
                                  color="primary"
                                  size={isMobile ? "small" : "medium"}
                                  showFirstButton
                                  showLastButton
                                  sx={{
                                    "& .MuiPaginationItem-root": {
                                      borderRadius: 2,
                                    },
                                    "& .Mui-selected": {
                                      background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                                      color: "white",
                                    },
                                  }}
                                />
                              </Box>
                            </Box>
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
                              value={catalogSearchTerm}
                              onChange={(e) =>
                                setCatalogSearchTerm(e.target.value)
                              }
                              onKeyPress={(e) =>
                                e.key === "Enter" && fetchCatalogProducts()
                              }
                            />
                          </div>

                          {/* Filtres pour le catalogue */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 ${
                                catalogFilters.type === "tous"
                                  ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200"
                              }`}
                              onClick={() =>
                                setCatalogFilters({
                                  ...catalogFilters,
                                  type: "tous",
                                })
                              }
                            >
                              Tous
                            </div>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 ${
                                catalogFilters.type === "ebook"
                                  ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200"
                              }`}
                              onClick={() =>
                                setCatalogFilters({
                                  ...catalogFilters,
                                  type: "ebook",
                                })
                              }
                            >
                              E-books
                            </div>
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 ${
                                catalogFilters.type === "fichier_admin"
                                  ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-primary-800 dark:hover:bg-primary-900 dark:hover:text-primary-200"
                              }`}
                              onClick={() =>
                                setCatalogFilters({
                                  ...catalogFilters,
                                  type: "fichier_admin",
                                })
                              }
                            >
                              Fichiers
                            </div>
                          </div>

                          {/* Liste des produits du catalogue */}
                          {isLoadingCatalog ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                            </div>
                          ) : catalogProducts?.length > 0 ? (
                            <>
                              <div
                                className={`grid ${
                                  isMobile
                                    ? "grid-cols-1 sm:grid-cols-2"
                                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                } ${isMobile ? "gap-3" : "gap-4"}`}
                              >
                                {catalogProducts?.map((product) => (
                                  <div key={product.id} className="mb-4">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:translate-y-[-4px] glassmorphism">
                                      {product.image_url ? (
                                        <div className="h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                          <img
                                            src={product.image_url}
                                            alt={product.titre}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                          <DocumentTextIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                                        </div>
                                      )}
                                      <div className="p-4">
                                        <div className="flex justify-between items-start">
                                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                                            {product.titre}
                                          </h3>
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                                            {product.type === "ebook"
                                              ? "E-book"
                                              : "Fichier"}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                          {product.description}
                                        </p>
                                        <div className="flex justify-between items-center">
                                          <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Par{" "}
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                              {product.page?.user?.name ||
                                                "Utilisateur"}
                                            </span>
                                          </div>
                                          <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                                            {product.prix} {product.devise}
                                          </div>
                                        </div>
                                        {product.page?.user?.id === user.id ? (
                                          <>
                                            <div className="mt-2 flex items-center justify-center">
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <span className="mr-1">•</span>
                                                Propriétaire
                                              </span>
                                            </div>
                                            <button
                                              className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                              onClick={() => {
                                                // Pour les propriétaires, utiliser directement l'URL du fichier
                                                if (product.fichier_url) {
                                                  // Utiliser l'URL complète déjà fournie par l'API
                                                  window.open(
                                                    product.fichier_url,
                                                    "_blank"
                                                  );
                                                } else {
                                                  // Si fichier_url n'est pas disponible, récupérer les détails du produit
                                                  axios
                                                    .get(
                                                      `/api/digital-products/${product.id}`
                                                    )
                                                    .then((response) => {
                                                      if (
                                                        response.data &&
                                                        response.data
                                                          .fichier_url
                                                      ) {
                                                        window.open(
                                                          response.data
                                                            .fichier_url,
                                                          "_blank"
                                                        );
                                                      } else {
                                                        toast.error(
                                                          "Impossible de télécharger le fichier"
                                                        );
                                                      }
                                                    })
                                                    .catch((error) => {
                                                      console.error(
                                                        "Erreur lors du téléchargement:",
                                                        error
                                                      );
                                                      toast.error(
                                                        "Erreur lors du téléchargement du fichier"
                                                      );
                                                    });
                                                }
                                              }}
                                            >
                                              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                              Télécharger
                                            </button>
                                          </>
                                        ) : myPurchases.some(
                                            (purchase) =>
                                              purchase.digital_product_id ===
                                              product.id
                                          ) ? (
                                          <>
                                            <div className="mt-2 flex items-center justify-center">
                                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                <span className="mr-1">•</span>
                                                Déjà acheté
                                              </span>
                                            </div>
                                            <button
                                              className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                              onClick={() => {
                                                // Trouver l'achat correspondant
                                                const purchase =
                                                  myPurchases.find(
                                                    (p) =>
                                                      p.digital_product_id ===
                                                      product.id
                                                  );
                                                if (
                                                  purchase &&
                                                  purchase.download_url
                                                ) {
                                                  window.open(
                                                    purchase.download_url,
                                                    "_blank"
                                                  );
                                                } else if (
                                                  product.fichier_url
                                                ) {
                                                  window.open(
                                                    product.fichier_url,
                                                    "_blank"
                                                  );
                                                } else if (purchase?.id) {
                                                  // Utiliser directement la route de téléchargement avec l'ID d'achat
                                                  window.open(
                                                    `/api/digital-products/download/${purchase.id}`,
                                                    "_blank"
                                                  );
                                                } else {
                                                  toast.error(
                                                    "Impossible de télécharger le fichier"
                                                  );
                                                }
                                              }}
                                            >
                                              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                              Télécharger
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                            onClick={() =>
                                              handlePurchaseProduct(product.id)
                                            }
                                          >
                                            Acheter
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Pagination pour le catalogue */}
                              {pagination.catalogProducts.totalPages > 1 && (
                                <div className="mt-4">
                                  <Pagination
                                    currentPage={
                                      pagination.catalogProducts.currentPage
                                    }
                                    totalPages={
                                      pagination.catalogProducts.totalPages
                                    }
                                    onPageChange={(page) =>
                                      setPagination((prev) => ({
                                        ...prev,
                                        catalogProducts: {
                                          ...prev.catalogProducts,
                                          currentPage: page,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              )}

                              {/* Pagination pour le catalogue */}
                              {catalogPagination.totalPages > 1 && (
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 4, px: 2 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                      {catalogPagination.totalCount > 0
                                        ? `${(catalogPagination.currentPage - 1) * catalogPagination.rowsPerPage + 1}-${Math.min(catalogPagination.currentPage * catalogPagination.rowsPerPage, catalogPagination.totalCount)} sur ${catalogPagination.totalCount}`
                                        : "0 résultats"}
                                    </Typography>
                                    <MuiPagination
                                      count={catalogPagination.totalPages}
                                      page={catalogPagination.currentPage}
                                      onChange={(e, newPage) => handleCatalogPageChange(newPage)}
                                      color="primary"
                                      size={isMobile ? "small" : "medium"}
                                      showFirstButton
                                      showLastButton
                                      sx={{
                                        "& .MuiPaginationItem-root": {
                                          borderRadius: 2,
                                        },
                                        "& .Mui-selected": {
                                          background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                                          color: "white",
                                        },
                                      }}
                                    />
                                  </Box>
                                </Box>
                              )}
                            </>
                          ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                              <DocumentTextIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Aucun produit numérique disponible
                              </h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-4">
                                Aucun produit ne correspond à vos critères de
                                recherche ou aucun produit n'est disponible pour
                                le moment.
                              </p>
                              <button
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                onClick={resetCatalogFilters}
                              >
                                Réinitialiser les filtres
                              </button>
                            </div>
                          )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div
            className={`bg-white dark:bg-gray-800 ${
              isMobile ? "rounded-lg" : "rounded-lg"
            } shadow-xl ${
              isMobile ? "w-full max-w-full" : "max-w-4xl w-full"
            } ${
              isMobile ? "max-h-[95vh]" : "max-h-[90vh]"
            } overflow-y-auto glassmorphism`}
          >
            <div
              className={`${
                isMobile ? "p-3" : "p-4"
              } border-b dark:border-gray-700 flex justify-between items-center`}
            >
              <h3
                className={`${
                  isMobile ? "text-base" : "text-lg"
                } font-medium text-gray-900 dark:text-white`}
              >
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
                <XCircleIcon
                  className={`${isMobile ? "h-5 w-5" : "h-6 w-6"}`}
                />
              </button>
            </div>
            <div className={`${isMobile ? "p-3" : "p-4"}`}>
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

      {/* Modal d'achat de produit numérique */}
      {showPurchaseModal && productToPurchase && (
        <PurchaseDigitalProductModal
          open={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setProductToPurchase(null);
          }}
          product={productToPurchase}
          onPurchaseComplete={handlePurchaseComplete}
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
    </div>
  );
}
