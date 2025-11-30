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
import DigitalProductCard from "../../components/DigitalProductCard";
import DigitalProductForm from "../../components/DigitalProductForm";
import PurchaseDigitalProductModal from "./components/PurchaseDigitalProductModal";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function MyPage() {
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
    dateRange: "tous", // 'tous', 'aujourd'hui', 'semaine', 'mois'
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
      dateRange: "tous",
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
        page: pagination.catalogProducts.currentPage,
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
      setPagination((prev) => ({
        ...prev,
        catalogProducts: {
          ...prev.catalogProducts,
          totalPages: Math.ceil(response.data.total / response.data.per_page),
          totalItems: response.data.total,
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement du catalogue:", error);
      toast.error("Impossible de charger le catalogue de produits numériques");
    } finally {
      setIsLoadingCatalog(false);
    }
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

      // Fetch all publication types avec valeurs par défaut
      const updatedPublications = {
        advertisements: pageResponse.data.page.publicites || [],
        jobOffers: pageResponse.data.page.offres_emploi || [],
        businessOpportunities:
          pageResponse.data.page.opportunites_affaires || [],
        digitalProducts: pageResponse.data.page.produits_numeriques || [],
      };

      // Forcer la mise à jour en utilisant JSON.parse/stringify pour une copie profonde
      setPublications(JSON.parse(JSON.stringify(updatedPublications)));

      // Récupérer également les autres données
      await fetchCatalogProducts();
      await fetchLivreurs();
      fetchMyPurchases();
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
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

  // Fonction pour rafraîchir les données après un achat
  const refreshAfterPurchase = () => {
    fetchPageData();
    fetchMyPurchases();
    fetchCatalog();
  };

  // Fonction pour confirmer l'achat d'un produit numérique
  const confirmPurchase = async () => {
    if (!productToPurchase) return;

    try {
      setIsPurchasing(true);
      const response = await axios.post(
        `/api/digital-products/${productToPurchase.id}/purchase`
      );

      toast.success(
        "Achat effectué avec succès ! Vous pouvez télécharger votre produit dans la section 'Mes achats'."
      );

      // Fermer le modal et réinitialiser les états
      setShowPurchaseModal(false);
      setProductToPurchase(null);

      // Rediriger vers la page de téléchargement si nécessaire
      if (response.data.download_url) {
        window.open(response.data.download_url, "_blank");
      }
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
      let errorMessage = "Une erreur est survenue lors de l'achat du produit";

      if (error.response) {
        if (error.response.status === 402) {
          errorMessage = "Solde insuffisant pour effectuer cet achat";
        } else if (error.response.status === 409) {
          errorMessage = "Vous avez déjà acheté ce produit";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  useEffect(() => {
    // Vérifier le statut du pack de publication
    if (refreshPackStatus) {
      refreshPackStatus();
    }

    fetchPageData();
    fetchCatalogProducts();
  }, [user.id]);

  // Effet pour recharger le catalogue quand les filtres ou la pagination changent
  useEffect(() => {
    fetchCatalogProducts();
  }, [
    pagination.catalogProducts.currentPage,
    catalogSearchTerm,
    catalogFilters.type,
  ]);

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
    <div
      className={`px-3 py-4 sm:px-4 sm:py-6 lg:px-2 ${
        isMobile ? "max-w-full" : ""
      }`}
    >
      {/* Page Header - Modern Design */}
      <div
        className={`bg-white/90 dark:bg-gray-800/90 ${
          isMobile ? "rounded-md" : "rounded-lg"
        } shadow-md mb-4 sm:mb-6 overflow-hidden backdrop-blur-sm border border-gray-100 dark:border-gray-700 glassmorphism`}
      >
        <div className={`relative ${isMobile ? "h-32" : "h-40"}`}>
          {/* Cover Photo Area with subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 z-10"></div>
          {pageData?.photo_de_couverture ? (
            <img
              src={pageData.photo_de_couverture}
              alt="Photo de couverture"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary-500 to-primary-700"></div>
          )}
          <button
            onClick={() => setShowCoverPhotoModal(true)}
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 dark:bg-gray-800/90 text-primary-600 dark:text-primary-400 ${
              isMobile ? "p-1.5" : "p-2"
            } rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out z-20 backdrop-blur-sm hover:scale-105`}
            title="Ajouter une photo de couverture"
          >
            <PlusIcon className={`h-4 w-4 sm:h-5 sm:w-5`} />
          </button>
        </div>
        <div className={`px-4 pb-3 sm:px-6 sm:pb-4 relative`}>
          <div
            className={`flex items-end ${
              isMobile ? "-mt-12" : "-mt-16"
            } sm:items-center flex-row relative z-30`}
          >
            <div
              className={`h-16 w-16 sm:h-20 sm:w-24 md:h-24 md:w-24 lg:h-32 lg:w-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-lg`}
            >
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
                className={`fallback-initials h-full w-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 ${
                  isMobile ? "text-2xl" : "text-3xl sm:text-4xl"
                } font-bold ${user?.picture ? "hidden" : ""}`}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
            <div className={`ml-3 sm:ml-6 flex-1`}>
              <div
                className={`flex flex-row ${
                  isMobile ? "items-start" : "items-center"
                } justify-between`}
              >
                <div>
                  <h1
                    className={`${
                      isMobile ? "text-lg" : "text-xl sm:text-2xl"
                    } font-bold text-gray-900 dark:text-white`}
                    style={{
                      textShadow: isDarkMode
                        ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                        : "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
                    }}
                  >
                    {user?.name}
                  </h1>
                  <p
                    className={`${
                      isMobile ? "text-xs" : "text-sm"
                    } font-medium text-gray-600 dark:text-gray-300 ${
                      isMobile
                        ? "flex flex-col space-y-1"
                        : "flex items-center space-x-3"
                    } mt-1`}
                  >
                    <span
                      className={`flex items-center ${
                        isMobile ? "text-xs" : ""
                      }`}
                    >
                      <UsersIcon
                        className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 text-primary-500 dark:text-primary-400`}
                      />
                      {subscribersCount} abonnés
                    </span>
                    <span
                      className={`flex items-center ${
                        isMobile ? "text-xs" : ""
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-500 dark:text-red-400`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {likesCount} mentions j'aime
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
      <div
        className={`bg-white/95 dark:bg-gray-800/95 ${
          isMobile ? "rounded-md" : "rounded-lg"
        } shadow-md tabs-container overflow-hidden backdrop-blur-sm border border-gray-100 dark:border-gray-700 glassmorphism`}
      >
        <Tab.Group>
          {/* Custom Tab Navigation avec flèches de défilement */}
          <div className="relative">
            {/* Flèche de défilement gauche */}
            <button
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full ${
                isMobile ? "p-1" : "p-1.5"
              } shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm`}
              onClick={() => {
                const tabList = document.querySelector(".tab-list-container");
                tabList.scrollBy({ left: -200, behavior: "smooth" });
              }}
            >
              <ChevronLeftIcon
                className={`h-4 w-4 sm:h-5 sm:w-5 text-primary-600 dark:text-primary-400`}
              />
            </button>

            {/* Conteneur de défilement avec masque de dégradé */}
            <div
              className={`overflow-hidden ${
                isMobile ? "mx-6" : "mx-8"
              } relative`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-gray-800 dark:to-transparent z-[1]"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-gray-800 dark:to-transparent z-[1]"></div>

              <div className="tab-list-container overflow-x-auto scrollbar-hide">
                <Tab.List
                  className={`flex ${isMobile ? "space-x-0.5" : "space-x-1"} ${
                    isMobile ? "rounded-t-md" : "rounded-t-lg"
                  } bg-gray-50 dark:bg-gray-800 ${
                    isMobile ? "p-1" : "p-2"
                  } whitespace-nowrap min-w-max border-b border-gray-100 dark:border-gray-700`}
                >
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        `flex-shrink-0 ${
                          isMobile
                            ? "min-w-[100px] py-2 px-3"
                            : "min-w-[120px] py-2.5 px-4"
                        } ${isMobile ? "text-xs" : "text-sm"} font-medium ${
                          isMobile ? "rounded-sm" : "rounded-md"
                        } transition-all duration-300 ease-in-out flex items-center justify-center gap-1`,
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Publicités
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                    Offres d'emploi
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415l.707-.708zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Opportunités
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                    Livreurs
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <AcademicCapIcon className="h-4 w-4" />
                    Formations
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <UsersIcon className="h-4 w-4" />
                    Pages
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Produits numériques
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      classNames(
                        "flex-shrink-0 min-w-[120px] py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5",
                        "focus:outline-none",
                        selected
                          ? "bg-white dark:bg-gray-700 shadow-sm text-primary-700 dark:text-white border border-gray-100 dark:border-gray-600"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary-600"
                      )
                    }
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Social
                  </Tab>
                </Tab.List>
              </div>
            </div>

            {/* Flèche de défilement droite */}
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full p-1.5 shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
              onClick={() => {
                const tabList = document.querySelector(".tab-list-container");
                tabList.scrollBy({ left: 200, behavior: "smooth" });
              }}
            >
              <ChevronRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
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
                            Mes publicités
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
                              onClick={() => handleFormOpen("advertisement")}
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
                                  ? "Veuillez activer votre pack de publication pour créer une publicité"
                                  : ""
                              }
                            >
                              <PlusIcon
                                className={`${
                                  isMobile ? "h-4 w-4" : "h-5 w-5"
                                }`}
                              />
                              {isMobile ? "Créer" : "Créer une publicité"}
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
                            <div
                              className={`grid ${
                                isMobile
                                  ? "grid-cols-1 sm:grid-cols-2"
                                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              } ${isMobile ? "gap-3" : "gap-4"}`}
                            >
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
                              <div className={`mt-${isMobile ? "4" : "6"}`}>
                                <Pagination
                                  currentPage={
                                    pagination.advertisements.currentPage
                                  }
                                  totalPages={getTotalPages("advertisement")}
                                  onPageChange={(page) =>
                                    handlePageChange("advertisements", page)
                                  }
                                  compact={isMobile}
                                />
                              </div>
                            )}
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
                            <div
                              className={`grid ${
                                isMobile
                                  ? "grid-cols-1 sm:grid-cols-2"
                                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              } ${isMobile ? "gap-3" : "gap-4"}`}
                            >
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
                              <div className={`mt-${isMobile ? "4" : "6"}`}>
                                <Pagination
                                  currentPage={pagination.jobOffers.currentPage}
                                  totalPages={getTotalPages("jobOffer")}
                                  onPageChange={(page) =>
                                    handlePageChange("jobOffers", page)
                                  }
                                  compact={isMobile}
                                />
                              </div>
                            )}
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
                            <div
                              className={`grid ${
                                isMobile
                                  ? "grid-cols-1 sm:grid-cols-2"
                                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              } ${isMobile ? "gap-3" : "gap-4"}`}
                            >
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
                              <div className={`mt-${isMobile ? "4" : "6"}`}>
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
                                  compact={isMobile}
                                />
                              </div>
                            )}
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
              <SubTabsPanel
                tabs={[
                  { label: "Gestion", icon: UserIcon },
                  { label: "Candidatures", icon: NewspaperIcon },
                ]}
                panels={[
                  {
                    content: (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2
                            className={`${
                              isMobile ? "text-base" : "text-lg"
                            } font-semibold text-gray-800 dark:text-white`}
                          >
                            Livreurs
                          </h2>
                          {!pageData?.is_owner &&
                            candidatureStatus !== null && (
                              <div
                                className={`${
                                  isMobile ? "text-xs" : "text-sm"
                                }`}
                              >
                                {candidatureStatus === "en_attente" && (
                                  <span
                                    className={`${
                                      isMobile
                                        ? "px-1.5 py-0.5 text-[10px]"
                                        : "px-2 py-1"
                                    } bg-yellow-100 text-yellow-800 rounded-full`}
                                  >
                                    Candidature en attente
                                  </span>
                                )}
                                {candidatureStatus === "approuve" && (
                                  <span
                                    className={`${
                                      isMobile
                                        ? "px-1.5 py-0.5 text-[10px]"
                                        : "px-2 py-1"
                                    } bg-green-100 text-green-800 rounded-full`}
                                  >
                                    Candidature approuvée
                                  </span>
                                )}
                                {candidatureStatus === "rejete" && (
                                  <span
                                    className={`${
                                      isMobile
                                        ? "px-1.5 py-0.5 text-[10px]"
                                        : "px-2 py-1"
                                    } bg-red-100 text-red-800 rounded-full`}
                                  >
                                    Candidature rejetée
                                  </span>
                                )}
                              </div>
                            )}
                        </div>

                        {isLoadingLivreurs ? (
                          <div className="flex justify-center items-center py-10">
                            <div
                              className={`animate-spin rounded-full ${
                                isMobile ? "h-8 w-8" : "h-10 w-10"
                              } border-b-2 border-primary-600`}
                            ></div>
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
                          />
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
                          Candidatures des livreurs
                        </h2>
                        <div
                          className={`bg-white dark:bg-gray-800 ${
                            isMobile ? "rounded-md" : "rounded-lg"
                          } shadow ${isMobile ? "p-2" : "p-4"}`}
                        >
                          <p
                            className={`${
                              isMobile ? "text-sm" : "text-base"
                            } text-gray-600 dark:text-gray-400`}
                          >
                            Gérez les candidatures des livreurs ici.
                          </p>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
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
                              {getFilteredPublications("digitalProduct", true)
                                // Pagination: slice pour n'afficher que les éléments de la page courante
                                .slice(
                                  (digitalProductsPagination.currentPage - 1) *
                                    digitalProductsPagination.itemsPerPage,
                                  digitalProductsPagination.currentPage *
                                    digitalProductsPagination.itemsPerPage
                                )
                                .map((product) => (
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

                        {/* Pagination */}
                        {!isLoading &&
                          publications?.digitalProducts?.length > 0 && (
                            <div className="mt-4">
                              <Pagination
                                currentPage={
                                  pagination?.digitalProducts?.currentPage
                                }
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
  );
}
