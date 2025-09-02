import React, {
  useState,
  useEffect,
  useRef,
  Fragment,
  useCallback,
} from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import { Tab, Menu, Transition } from "@headlessui/react";
import {
  NewspaperIcon,
  BriefcaseIcon,
  LightBulbIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TagIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  ShareIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  PhoneIcon,
  ArrowPathIcon,
  XMarkIcon,
  EnvelopeIcon,
  CheckIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import PostCard from "./components/PostCard";
import PostDetailModal from "./components/PostDetailModal";
import Modal from "../../components/Modal";
import LivreurForm from "./components/LivreurForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Page() {
  const { id } = useParams(); // Récupérer l'ID de la page depuis l'URL
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { createChatRoom, setActiveRoom, setIsChatExpanded, fetchChatRooms } = useChat();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [isLivreurFormOpen, setIsLivreurFormOpen] = useState(false);
  const [candidatureStatus, setCandidatureStatus] = useState(null);
  // Champs de recherche séparés pour chaque onglet
  const [publiciteSearchQuery, setPubliciteSearchQuery] = useState("");
  const [offreEmploiSearchQuery, setOffreEmploiSearchQuery] = useState("");
  const [opportuniteSearchQuery, setOpportuniteSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'recent', 'expired'
  const [openShareMenuId, setOpenShareMenuId] = useState(null); // Pour gérer les menus de partage
  const [expandedComments, setExpandedComments] = useState({}); // Pour suivre les commentaires affichés par publication
  const [mediaItems, setMediaItems] = useState({});
  const [currentMediaIndex, setCurrentMediaIndex] = useState({});

  // États pour les filtres des publications
  const [showNewsFilters, setShowNewsFilters] = useState(false);
  const [newsStatusFilter, setNewsStatusFilter] = useState("all"); // "all", "disponible", "terminé"
  const [newsCountryFilter, setNewsCountryFilter] = useState("");
  const [newsCityFilter, setNewsCityFilter] = useState("");
  const [newsTypeFilter, setNewsTypeFilter] = useState("");
  const [newsPostTypeFilter, setNewsPostTypeFilter] = useState("");
  const [newsContractTypeFilter, setNewsContractTypeFilter] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState(""); // "produit" ou "service"
  const [newsSubCategoryFilter, setNewsSubCategoryFilter] = useState("");
  const [newsDeliveryFilter, setNewsDeliveryFilter] = useState(""); // "OUI" ou "NON"

  // États pour les listes de valeurs uniques pour les filtres des publicités
  const [uniquePubCountries, setUniquePubCountries] = useState([]);
  const [uniquePubCities, setUniquePubCities] = useState([]);
  const [uniquePubCategories, setUniquePubCategories] = useState([]);
  const [uniquePubSubCategories, setUniquePubSubCategories] = useState([]);

  // États pour les listes de valeurs uniques pour les filtres des offres d'emploi
  const [uniqueJobCountries, setUniqueJobCountries] = useState([]);
  const [uniqueJobCities, setUniqueJobCities] = useState([]);
  const [uniqueJobSectors, setUniqueJobSectors] = useState([]);
  const [uniqueJobContractTypes, setUniqueJobContractTypes] = useState([]);

  // États pour les listes de valeurs uniques pour les filtres des opportunités d'affaires
  const [uniqueOppoCountries, setUniqueOppoCountries] = useState([]);
  const [uniqueOppoCities, setUniqueOppoCities] = useState([]);
  const [uniqueOppoSectors, setUniqueOppoSectors] = useState([]);
  const [uniqueOppoTypes, setUniqueOppoTypes] = useState([]);

  // Références pour les sections de la page
  const headerRef = useRef(null);
  const contentRef = useRef(null);

  // Fonction pour extraire les valeurs uniques pour les filtres
  const extractUniqueValues = useCallback((data) => {
    if (!data) return;

    // Extraire les valeurs uniques des publicités
    if (data.publicites && data.publicites.length > 0) {
      // Extraire les pays uniques des publicités
      const pubCountries = [
        ...new Set(data.publicites.map((pub) => pub.pays).filter(Boolean)),
      ];
      setUniquePubCountries(pubCountries);

      // Extraire les villes uniques des publicités
      const pubCities = [
        ...new Set(data.publicites.map((pub) => pub.ville).filter(Boolean)),
      ];
      setUniquePubCities(pubCities);

      // Extraire les catégories uniques des publicités
      const pubCategories = [
        ...new Set(data.publicites.map((pub) => pub.categorie).filter(Boolean)),
      ];
      setUniquePubCategories(pubCategories);

      // Extraire les sous-catégories uniques des publicités
      const pubSubCategories = [
        ...new Set(
          data.publicites
            .map((pub) => pub.sous_categorie || pub.autre_sous_categorie)
            .filter(Boolean)
        ),
      ];
      setUniquePubSubCategories(pubSubCategories);
    }

    // Extraire les valeurs uniques des offres d'emploi
    if (data.offres_emploi && data.offres_emploi.length > 0) {
      // Extraire les pays uniques des offres d'emploi
      const jobCountries = [
        ...new Set(data.offres_emploi.map((job) => job.pays).filter(Boolean)),
      ];
      setUniqueJobCountries(jobCountries);

      // Extraire les villes uniques des offres d'emploi
      const jobCities = [
        ...new Set(data.offres_emploi.map((job) => job.ville).filter(Boolean)),
      ];
      setUniqueJobCities(jobCities);

      // Extraire les secteurs des offres d'emploi
      // Utiliser à la fois sector et secteur pour la compatibilité
      const jobSectors = [
        ...new Set([
          ...data.offres_emploi.map((job) => job.sector).filter(Boolean),
          ...data.offres_emploi.map((job) => job.secteur).filter(Boolean),
        ]),
      ];
      setUniqueJobSectors(jobSectors);

      // Extraire les types de contrat uniques des offres d'emploi
      const jobContractTypes = [
        ...new Set(
          data.offres_emploi.map((job) => job.type_contrat).filter(Boolean)
        ),
      ];
      setUniqueJobContractTypes(jobContractTypes);
    }

    // Extraire les valeurs uniques des opportunités d'affaires
    if (data.opportunites_affaires && data.opportunites_affaires.length > 0) {
      // Extraire les pays uniques des opportunités
      const oppoCountries = [
        ...new Set(
          data.opportunites_affaires.map((oppo) => oppo.pays).filter(Boolean)
        ),
      ];
      setUniqueOppoCountries(oppoCountries);

      // Extraire les villes uniques des opportunités
      const oppoCities = [
        ...new Set(
          data.opportunites_affaires.map((oppo) => oppo.ville).filter(Boolean)
        ),
      ];
      setUniqueOppoCities(oppoCities);

      // Extraire les secteurs des opportunités
      // Utiliser à la fois sector et secteur pour la compatibilité
      const oppoSectors = [
        ...new Set([
          ...data.opportunites_affaires
            .map((oppo) => oppo.sector)
            .filter(Boolean),
          ...data.opportunites_affaires
            .map((oppo) => oppo.secteur)
            .filter(Boolean),
        ]),
      ];
      setUniqueOppoSectors(oppoSectors);

      // Extraire les types d'opportunités uniques
      const oppoTypes = [
        ...new Set(
          data.opportunites_affaires
            .map((oppo) => oppo.post_type)
            .filter(Boolean)
        ),
      ];
      setUniqueOppoTypes(oppoTypes);
    }
  }, []);

  // Fonction pour réinitialiser les filtres des publications
  const resetNewsFilters = () => {
    setNewsCountryFilter("");
    setNewsCityFilter("");
    setNewsTypeFilter("");
    setNewsCategoryFilter("");
    setNewsSubCategoryFilter("");
    setNewsDeliveryFilter("");
    setNewsStatusFilter("all");
    setPubliciteSearchQuery("");
  };

  // Fonction pour réinitialiser les filtres des offres d'emploi
  const resetJobFilters = () => {
    setNewsCountryFilter("");
    setNewsCityFilter("");
    setNewsTypeFilter("");
    setNewsPostTypeFilter("");
    setNewsContractTypeFilter("");
    setNewsStatusFilter("all");
    setOffreEmploiSearchQuery("");
  };

  // Fonction pour réinitialiser les filtres des opportunités d'affaires
  const resetOpportunityFilters = () => {
    setNewsCountryFilter("");
    setNewsCityFilter("");
    setNewsTypeFilter("");
    setNewsPostTypeFilter("");
    setNewsStatusFilter("all");
    setOpportuniteSearchQuery("");
    setFilter("all");
  };

  // Charger les données de la page
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/pages/${id}`);
        if (response.data.success) {
          setPageData(response.data.page);
          setIsSubscribed(response.data.isSubscribed);
          // Extraire les valeurs uniques pour les filtres
          extractUniqueValues(response.data.page);
        } else {
          setError("Impossible de charger les données de la page");
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la page:", err);
        setError("Erreur lors du chargement de la page");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPageData();
    }
  }, [id, user, extractUniqueValues]);

  // Vérifier le statut de candidature lorsque la page est chargée
  useEffect(() => {
    if (pageData && user && !pageData.is_owner) {
      checkCandidatureStatus();
    }
  }, [pageData, user]);
  // Gérer l'abonnement à la page
  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour vous abonner à cette page");
      return;
    }

    try {
      const response = await axios.post(`/api/pages/${id}/subscribe`);
      if (response.data.success) {
        setIsSubscribed(true);
        // Mettre à jour le nombre d'abonnés
        setPageData((prev) => ({
          ...prev,
          nombre_abonnes: prev.nombre_abonnes + 1,
        }));
        toast.success(
          response.data.message || "Vous êtes maintenant abonné à cette page"
        );
      }
    } catch (err) {
      console.error("Erreur lors de l'abonnement:", err);
      toast.error(err.response?.data?.message || "Erreur lors de l'abonnement");
    }
  };

  // Gérer le désabonnement de la page
  const handleUnsubscribe = async () => {
    try {
      const response = await axios.post(`/api/pages/${id}/unsubscribe`);
      if (response.data.success) {
        setIsSubscribed(false);
        // Mettre à jour le nombre d'abonnés
        if (pageData) {
          setPageData({
            ...pageData,
            subscribers_count: pageData.subscribers_count - 1,
          });
        }
        toast.success("Vous vous êtes désabonné avec succès");
      }
    } catch (error) {
      console.error("Erreur lors du désabonnement:", error);
      toast.error("Erreur lors du désabonnement");
    }
  };

  // Gérer l'ouverture du chat avec le propriétaire de la page
  const handleOpenChat = async () => {
    if (!pageData?.user_id) return;
    
    try {
      const chatRoom = await createChatRoom(pageData.user_id);
      if (chatRoom) {
        setActiveRoom(chatRoom);
        setIsChatExpanded(true);
        await fetchChatRooms();
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du chat:", error);
      toast.error("Impossible d'ouvrir la conversation");
    }
  };

  // Vérifier le statut de candidature de l'utilisateur
  const checkCandidatureStatus = async () => {
    if (!user || !pageData?.id) return;
    
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

  // Fonction pour postuler comme livreur
  const handleLivreurSubmit = async (formData) => {
    if (!pageData?.id) {
      toast.error("Impossible de soumettre la candidature: page non trouvée");
      return;
    }

    try {
      await axios.post(`/api/livreurs/postuler/${pageData.id}`, formData);
      toast.success("Votre candidature a été soumise avec succès");
      setIsLivreurFormOpen(false);
      await checkCandidatureStatus();
    } catch (error) {
      console.error("Erreur lors de la soumission de la candidature:", error);
      throw error; // Propager l'erreur pour que le formulaire puisse la gérer
    }
  };

  // Gérer l'action "J'aime"
  const handleLike = async (postId, postType) => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer une publication");
      return;
    }

    try {
      let endpoint;
      switch (postType) {
        case "publicites":
          endpoint = `/api/publicites/${postId}/like`;
          break;
        case "offres-emploi":
          endpoint = `/api/offres-emploi/${postId}/like`;
          break;
        case "opportunites-affaires":
          endpoint = `/api/opportunites-affaires/${postId}/like`;
          break;
        default:
          return;
      }

      const response = await axios.post(endpoint);

      if (response.data.success) {
        // Mettre à jour l'état local pour refléter le changement de like
        const liked = response.data.liked;

        // Trouver la publication dans l'état local
        let updatedPageData = { ...pageData };
        let publication;

        if (postType === "publicites") {
          const index = updatedPageData.publicites.findIndex(
            (p) => p.id === postId
          );
          if (index !== -1) {
            updatedPageData.publicites[index].liked_by_current_user = liked;
            updatedPageData.publicites[index].likes_count = liked
              ? (updatedPageData.publicites[index].likes_count || 0) + 1
              : Math.max(
                  0,
                  (updatedPageData.publicites[index].likes_count || 1) - 1
                );
            publication = updatedPageData.publicites[index];
          }
        } else if (postType === "offres-emploi") {
          const index = updatedPageData.offresEmploi.findIndex(
            (p) => p.id === postId
          );
          if (index !== -1) {
            updatedPageData.offresEmploi[index].liked_by_current_user = liked;
            updatedPageData.offresEmploi[index].likes_count = liked
              ? (updatedPageData.offresEmploi[index].likes_count || 0) + 1
              : Math.max(
                  0,
                  (updatedPageData.offresEmploi[index].likes_count || 1) - 1
                );
            publication = updatedPageData.offresEmploi[index];
          }
        } else if (postType === "opportunites-affaires") {
          const index = updatedPageData.opportunitesAffaires.findIndex(
            (p) => p.id === postId
          );
          if (index !== -1) {
            updatedPageData.opportunitesAffaires[index].liked_by_current_user =
              liked;
            updatedPageData.opportunitesAffaires[index].likes_count = liked
              ? (updatedPageData.opportunitesAffaires[index].likes_count || 0) +
                1
              : Math.max(
                  0,
                  (updatedPageData.opportunitesAffaires[index].likes_count ||
                    1) - 1
                );
            publication = updatedPageData.opportunitesAffaires[index];
          }
        }

        // Mettre à jour le nombre total de likes de la page
        updatedPageData.nombre_likes = liked
          ? (updatedPageData.nombre_likes || 0) + 1
          : Math.max(0, (updatedPageData.nombre_likes || 1) - 1);

        // Mettre à jour l'état global de la page
        setPageData(updatedPageData);

        // Mettre à jour également le post sélectionné si c'est le même
        if (
          selectedPost &&
          selectedPost.id === postId &&
          selectedPost.type === postType
        ) {
          setSelectedPost({
            ...selectedPost,
            liked_by_current_user: liked,
            likes_count: liked
              ? (selectedPost.likes_count || 0) + 1
              : Math.max(0, (selectedPost.likes_count || 1) - 1),
          });
        }

        // Afficher un message toast approprié
        if (liked) {
          toast.success(
            `Vous avez aimé cette ${
              postType === "publicites"
                ? "publication"
                : postType === "offres-emploi"
                ? "offre d'emploi"
                : "opportunité d'affaires"
            }`
          );
        } else {
          toast.info(
            `Vous n'aimez plus cette ${
              postType === "publicites"
                ? "publication"
                : postType === "offres-emploi"
                ? "offre d'emploi"
                : "opportunité d'affaires"
            }`
          );
        }
      }
    } catch (err) {
      console.error("Erreur lors du like:", err);
      toast.error(
        err.response?.data?.message || "Erreur lors de l'action \"J'aime\""
      );
    }
  };

  // Mettre à jour les likes d'un post dans le state local
  const updatePostLikes = (postId, postType) => {
    if (!pageData) return;

    let key;
    switch (postType) {
      case "publicites":
        key = "publicites";
        break;
      case "offres-emploi":
        key = "offresEmploi";
        break;
      case "opportunites-affaires":
        key = "opportunitesAffaires";
        break;
      default:
        return;
    }

    if (!pageData[key]) return;

    const updatedPosts = pageData[key].map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          liked_by_current_user: true,
          likes_count: (post.likes_count || 0) + 1,
        };
      }
      return post;
    });

    setPageData((prev) => ({
      ...prev,
      [key]: updatedPosts,
    }));

    return updatedPosts;
  };

  // Ouvrir le modal de détail d'un post
  const openPostDetail = async (postId, type) => {
    try {
      // Afficher un indicateur de chargement
      setLoading(true);

      // Configuration pour la requête
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 10000, // Augmenter le timeout pour éviter les erreurs de réseau
      };

      const response = await axios.get(
        `/api/${type}/${postId}/details`,
        config
      );
      setSelectedPost(response.data.post);
      setIsPostDetailModalOpen(true);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des détails de la publication:",
        err
      );

      // Message d'erreur plus détaillé
      let errorMessage = "Impossible de charger les détails de la publication.";

      if (err.response) {
        errorMessage = `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`;
      } else if (err.request) {
        errorMessage =
          "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un commentaire à une publication
  const handleAddComment = async (postId, content, postType) => {
    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    try {
      let endpoint;
      switch (postType) {
        case "publicites":
          endpoint = `/api/publicites/${postId}/comment`;
          break;
        case "offres-emploi":
          endpoint = `/api/offres-emploi/${postId}/comment`;
          break;
        case "opportunites-affaires":
          endpoint = `/api/opportunites-affaires/${postId}/comment`;
          break;
        default:
          return;
      }

      const response = await axios.post(endpoint, { content });

      if (response.data.success) {
        // Si le post est actuellement ouvert dans le modal, mettre à jour également
        if (
          selectedPost &&
          selectedPost.id === postId &&
          selectedPost.type === postType
        ) {
          const updatedComments = [
            ...(selectedPost.comments || []),
            response.data.comment,
          ];
          setSelectedPost((prev) => ({
            ...prev,
            comments: updatedComments,
            comments_count: updatedComments.length,
          }));
        }

        toast.success("Commentaire ajouté avec succès");
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  // Filtrer les publications en fonction de la recherche et des filtres
  const getFilteredPublications = (postType) => {
    if (!pageData) return [];

    let publications;
    switch (postType) {
      case "publicites":
        publications = pageData.publicites || [];
        break;
      case "offres-emploi":
        publications = pageData.offres_emploi || [];
        break;
      case "opportunites-affaires":
        publications = pageData.opportunites_affaires || [];
        break;
      default:
        return [];
    }

    // Filtrer par recherche en fonction du type de publication
    let filtered = publications;

    // Sélectionner le bon champ de recherche en fonction du type de publication
    let currentSearchQuery = "";
    switch (postType) {
      case "publicites":
        currentSearchQuery = publiciteSearchQuery;
        break;
      case "offres-emploi":
        currentSearchQuery = offreEmploiSearchQuery;
        break;
      case "opportunites-affaires":
        currentSearchQuery = opportuniteSearchQuery;
        break;
      default:
        currentSearchQuery = "";
    }

    if (currentSearchQuery.trim() !== "") {
      const query = currentSearchQuery.toLowerCase();
      filtered = filtered.filter((pub) => {
        // Champs communs à toutes les publications
        const titre = pub.titre?.toLowerCase() || "";
        const description = pub.description?.toLowerCase() || "";

        // Filtrage spécifique selon le type de publication
        if (postType === "offres-emploi") {
          // Pour les offres d'emploi, rechercher dans titre, entreprise et référence
          const entreprise =
            pub.entreprise?.toLowerCase() ||
            pub.company_name?.toLowerCase() ||
            "";
          const reference = pub.reference?.toLowerCase() || "";
          return (
            titre.includes(query) ||
            entreprise.includes(query) ||
            reference.includes(query)
          );
        } else if (postType === "opportunites-affaires") {
          // Pour les opportunités d'affaires
          return titre.includes(query) || description.includes(query);
        } else {
          // Pour les publicités et autres types
          return titre.includes(query) || description.includes(query);
        }
      });
    }

    // Appliquer les filtres spécifiques pour les publications
    if (postType === "publicites") {
      // Filtrer par pays
      if (newsCountryFilter) {
        filtered = filtered.filter((pub) => pub.pays === newsCountryFilter);
      }

      // Filtrer par ville
      if (newsCityFilter) {
        filtered = filtered.filter((pub) => pub.ville === newsCityFilter);
      }

      // Filtrer par type (publicité ou annonce)
      if (newsTypeFilter) {
        filtered = filtered.filter((pub) => pub.post_type === newsTypeFilter);
      }

      // Filtrer par catégorie
      if (newsCategoryFilter) {
        filtered = filtered.filter(
          (pub) => pub.categorie === newsCategoryFilter
        );
      }

      // Filtrer par sous-catégorie
      if (newsSubCategoryFilter) {
        filtered = filtered.filter(
          (pub) =>
            pub.sous_categorie === newsSubCategoryFilter ||
            pub.autre_sous_categorie === newsSubCategoryFilter
        );
      }

      // Filtrer par besoin de livreurs
      if (newsDeliveryFilter) {
        filtered = filtered.filter(
          (pub) => pub.besoin_livreurs === newsDeliveryFilter
        );
      }

      // Filtrer par statut
      if (newsStatusFilter !== "all") {
        filtered = filtered.filter((pub) => pub.etat === newsStatusFilter);
      }
    }

    // Filtrer par statut (pour les offres d'emploi)
    if (postType === "offres-emploi") {
      const now = new Date();

      // Filtrer par statut
      if (newsStatusFilter !== "all") {
        filtered = filtered.filter((pub) => pub.etat === newsStatusFilter);
      }

      // Filtrer par pays
      if (newsCountryFilter) {
        filtered = filtered.filter((pub) => pub.pays === newsCountryFilter);
      }

      // Filtrer par ville
      if (newsCityFilter) {
        filtered = filtered.filter((pub) => pub.ville === newsCityFilter);
      }

      // Filtrer par secteur (utiliser à la fois sector et secteur pour la compatibilité)
      if (newsTypeFilter) {
        filtered = filtered.filter(
          (pub) =>
            pub.secteur === newsTypeFilter || pub.sector === newsTypeFilter
        );
      }

      // Filtrer par type de publication
      if (newsPostTypeFilter) {
        filtered = filtered.filter(
          (pub) => pub.post_type === newsPostTypeFilter
        );
      }

      // Filtrer par type de contrat
      if (newsContractTypeFilter) {
        filtered = filtered.filter(
          (pub) => pub.type_contrat === newsContractTypeFilter
        );
      }

      // Filtres spécifiques basés sur le filtre principal
      if (filter !== "all") {
        switch (filter) {
          case "active":
            filtered = filtered.filter((pub) => pub.etat === "disponible");
            break;
          case "recent":
            // Moins de 3 jours
            filtered = filtered.filter((pub) => {
              const pubDate = new Date(pub.created_at);
              const diffTime = Math.abs(now - pubDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 3;
            });
            break;
          case "expired":
            filtered = filtered.filter((pub) => {
              if (pub.date_limite) {
                const limitDate = new Date(pub.date_limite);
                return limitDate < now;
              }
              return false;
            });
            break;
        }
      }
    }

    // Filtrer par statut et autres critères pour les opportunités d'affaires
    if (postType === "opportunites-affaires") {
      const now = new Date();

      // Filtrer par pays
      if (newsCountryFilter) {
        filtered = filtered.filter((pub) => pub.pays === newsCountryFilter);
      }

      // Filtrer par ville
      if (newsCityFilter) {
        filtered = filtered.filter((pub) => pub.ville === newsCityFilter);
      }

      // Filtrer par secteur (utiliser à la fois sector et secteur pour la compatibilité)
      if (newsTypeFilter) {
        filtered = filtered.filter(
          (pub) =>
            pub.secteur === newsTypeFilter || pub.sector === newsTypeFilter
        );
      }

      // Filtrer par type d'opportunité
      if (newsPostTypeFilter) {
        filtered = filtered.filter(
          (pub) => pub.post_type === newsPostTypeFilter
        );
      }

      // Filtres spécifiques basés sur le filtre principal
      if (filter !== "all") {
        switch (filter) {
          case "active":
            filtered = filtered.filter((pub) => pub.etat === "disponible");
            break;
          case "recent":
            // Moins de 7 jours
            filtered = filtered.filter((pub) => {
              const pubDate = new Date(pub.created_at);
              const diffTime = Math.abs(now - pubDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7;
            });
            break;
          case "expired":
            filtered = filtered.filter((pub) => {
              if (pub.etat === "terminé") return true;
              if (pub.date_limite) {
                const limitDate = new Date(pub.date_limite);
                return limitDate < now;
              }
              return false;
            });
            break;
          default:
            break;
        }
      }
    }

    return filtered;
  };
  // Fonction pour formater le temps écoulé (à l'instant, il y a 5 min, etc.)
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHour < 24) return `Il y a ${diffHour} h`;
    if (diffDay < 7) return `Il y a ${diffDay} j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      if (typeof dateString === "string" && dateString.includes("/")) {
        const dateParts = dateString.split(" ");
        if (dateParts.length > 0) {
          return dateParts[0];
        }
        return dateString;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "";
      }

      // Formater la date selon la locale française
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      return date.toLocaleDateString("fr-FR", options);
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return "";
    }
  };

  // Préparer les médias pour le carrousel
  const prepareMediaItems = (publication) => {
    const pubKey = `${publication.type || "publication"}-${publication.id}`;

    // Si les médias sont déjà préparés, ne pas les recalculer
    if (mediaItems[pubKey]) return;

    const items = [];

    // Vérifier si l'image principale est déjà incluse dans les images
    let mainImageIncluded = false;

    // Ajouter les images s'il y en a
    if (publication.images && publication.images.length > 0) {
      publication.images.forEach((image, index) => {
        const imageUrl = typeof image === "string" ? image : image.url;

        // Vérifier si cette image est l'image principale
        if (publication.image_url && imageUrl === publication.image_url) {
          mainImageIncluded = true;
        }

        items.push({
          type: "image",
          url: imageUrl,
          alt: `Image ${index + 1}`,
        });
      });
    }

    // Ajouter l'image principale seulement si elle n'est pas déjà incluse dans les images
    if (publication.image_url && !mainImageIncluded) {
      // Ajouter au début du tableau
      items.unshift({
        type: "image",
        url: publication.image_url,
        alt: "Image principale",
      });
    }

    // Vérifier si la vidéo principale est déjà incluse dans les vidéos
    let mainVideoIncluded = false;

    // Ajouter les vidéos s'il y en a
    if (publication.videos && publication.videos.length > 0) {
      publication.videos.forEach((video, index) => {
        const videoUrl = typeof video === "string" ? video : video.url;

        // Vérifier si cette vidéo est la vidéo principale
        if (publication.video_url && videoUrl === publication.video_url) {
          mainVideoIncluded = true;
        }

        items.push({
          type: "video",
          url: videoUrl,
          isYoutube: videoUrl.includes("youtube"),
          alt: `Vidéo ${index + 1}`,
        });
      });
    }

    // Ajouter la vidéo principale seulement si elle n'est pas déjà incluse dans les vidéos
    if (publication.video_url && !mainVideoIncluded) {
      items.push({
        type: "video",
        url: publication.video_url,
        isYoutube: publication.video_url.includes("youtube"),
        alt: "Vidéo principale",
      });
    }

    // Mettre à jour l'état des médias
    setMediaItems((prev) => ({
      ...prev,
      [pubKey]: items,
    }));

    // Initialiser l'index du média actuel
    setCurrentMediaIndex((prev) => ({
      ...prev,
      [pubKey]: 0,
    }));
  };

  // Navigation dans le carrousel
  const nextMedia = (publication) => {
    const pubKey = `${publication.type || "publication"}-${publication.id}`;
    const items = mediaItems[pubKey] || [];

    if (items.length > 1) {
      setCurrentMediaIndex((prev) => ({
        ...prev,
        [pubKey]: prev[pubKey] === items.length - 1 ? 0 : prev[pubKey] + 1,
      }));
    }
  };

  const prevMedia = (publication) => {
    const pubKey = `${publication.type || "publication"}-${publication.id}`;
    const items = mediaItems[pubKey] || [];

    if (items.length > 1) {
      setCurrentMediaIndex((prev) => ({
        ...prev,
        [pubKey]: prev[pubKey] === 0 ? items.length - 1 : prev[pubKey] - 1,
      }));
    }
  };

  const goToMedia = (publication, index) => {
    const pubKey = `${publication.type || "publication"}-${publication.id}`;
    setCurrentMediaIndex((prev) => ({
      ...prev,
      [pubKey]: index,
    }));
  };

  // Gérer l'ajout d'un commentaire
  const handleComment = async (postId, commentContent, postType) => {
    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    try {
      let endpoint;
      let type =
        postType === "publicites"
          ? "publicite"
          : postType === "offres-emploi"
          ? "offre_emploi"
          : "opportunite_affaire";

      switch (type) {
        case "publicite":
          endpoint = `/api/publicites/${postId}/comment`;
          break;
        case "offre_emploi":
          endpoint = `/api/offres-emploi/${postId}/comment`;
          break;
        case "opportunite_affaire":
          endpoint = `/api/opportunites-affaires/${postId}/comment`;
          break;
        default:
          throw new Error("Type de publication non reconnu");
      }

      const response = await axios.post(endpoint, { content: commentContent });

      if (response.data.success) {
        // Mettre à jour les commentaires dans l'état local
        if (selectedPost && selectedPost.id === postId) {
          const updatedPost = { ...selectedPost };

          if (!updatedPost.comments) {
            updatedPost.comments = [];
          }

          updatedPost.comments.push(response.data.comment);
          updatedPost.comments_count = (updatedPost.comments_count || 0) + 1;

          setSelectedPost(updatedPost);
        }

        toast.success("Commentaire ajouté avec succès");
        return response.data.comment;
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      toast.error(
        err.response?.data?.message || "Erreur lors de l'ajout du commentaire"
      );
      throw err;
    }
  };

  // Gérer le like d'un commentaire
  const handleCommentLike = async (commentId, postId, postType) => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer un commentaire");
      return;
    }

    try {
      let endpoint;
      let type =
        postType === "publicites"
          ? "publicite"
          : postType === "offres-emploi"
          ? "offre_emploi"
          : "opportunite_affaire";

      switch (type) {
        case "publicite":
          endpoint = `/api/comments/${commentId}/like`;
          break;
        case "offre_emploi":
          endpoint = `/api/comments/${commentId}/like`;
          break;
        case "opportunite_affaire":
          endpoint = `/api/comments/${commentId}/like`;
          break;
        default:
          throw new Error("Type de publication non reconnu");
      }

      const response = await axios.post(endpoint);

      if (response.data.success) {
        // Mettre à jour les likes de commentaires dans l'état local
        if (
          selectedPost &&
          selectedPost.id === postId &&
          selectedPost.comments
        ) {
          const updatedPost = { ...selectedPost };
          const commentIndex = updatedPost.comments.findIndex(
            (c) => c.id === commentId
          );

          if (commentIndex !== -1) {
            const liked = response.data.liked;
            updatedPost.comments[commentIndex].liked_by_current_user = liked;
            updatedPost.comments[commentIndex].likes_count = liked
              ? (updatedPost.comments[commentIndex].likes_count || 0) + 1
              : Math.max(
                  0,
                  (updatedPost.comments[commentIndex].likes_count || 1) - 1
                );

            // Afficher un message toast approprié
            if (liked) {
              toast.success("Vous avez aimé ce commentaire");
            } else {
              toast.info("Vous n'aimez plus ce commentaire");
            }
          }

          setSelectedPost(updatedPost);
        }

        return response.data;
      }
    } catch (err) {
      console.error("Erreur lors du like du commentaire:", err);
      toast.error(
        err.response?.data?.message || "Erreur lors du like du commentaire"
      );
      throw err;
    }
  };

  // Gérer la suppression d'un commentaire
  const handleDeleteComment = async (commentId, postId, postType) => {
    try {
      const endpoint = `/api/comments/${commentId}`;
      const response = await axios.delete(endpoint);

      if (response.data.success) {
        // Mettre à jour les commentaires dans l'état local
        if (
          selectedPost &&
          selectedPost.id === postId &&
          selectedPost.comments
        ) {
          const updatedPost = { ...selectedPost };
          updatedPost.comments = updatedPost.comments.filter(
            (c) => c.id !== commentId
          );
          updatedPost.comments_count = Math.max(
            0,
            (updatedPost.comments_count || 1) - 1
          );

          setSelectedPost(updatedPost);
        }

        toast.success("Commentaire supprimé avec succès");
        return true;
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du commentaire:", err);
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de la suppression du commentaire"
      );
      throw err;
    }
  };

  // Rendu d'une publication
  const renderPublication = (publication, postType) => {
    const isPublicite = postType === "publicites";
    const isOffreEmploi = postType === "offres-emploi";
    const isOpportuniteAffaire = postType === "opportunites-affaires";

    // Vérifier si les commentaires sont développés pour cette publication
    const isCommentsExpanded =
      expandedComments[`${postType}-${publication.id}`] || false;
    const hasComments = publication.comments && publication.comments.length > 0;

    // Préparer les médias pour le carrousel
    prepareMediaItems(publication);

    return (
      <div
        key={`${postType}-${publication.id}`}
        className={`mb-6 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white"
        } rounded-lg shadow-md overflow-hidden`}
      >
        {/* En-tête de la publication avec photo de profil et nom */}
        <div className="p-4 flex items-center">
          <div className="h-10 w-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
            <img
              src={
                pageData.user?.picture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  pageData.user?.name || "Utilisateur"
                )}&background=374151&color=FFFFFF&size=128`
              }
              alt={pageData.user?.name || "Utilisateur"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-base">
                  {pageData.user?.name || "Utilisateur"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  {formatDate(publication.created_at)}
                  <span className="mx-1">•</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3 h-3 ml-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 1.357L14.25 7.5l.165.33a.809.809 0 01-1.086 1.085l-.604-.302a1.125 1.125 0 00-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 01-2.288 4.04l-.723.724a1.125 1.125 0 01-1.298.21l-.153-.076a1.125 1.125 0 01-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 01-.21-1.298L9.75 12l-1.64-1.64a6 6 0 01-1.676-3.257l-.172-1.03z"
                      clipRule="evenodd"
                    />
                  </svg>
                </p>
              </div>
              <Menu as="div" className="relative">
                <Menu.Button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items
                    className={`absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md ${
                      isDarkMode
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-700"
                    } shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() =>
                              openPostDetail(publication.id, postType)
                            }
                            className={`${
                              active
                                ? isDarkMode
                                  ? "bg-gray-700"
                                  : "bg-gray-100"
                                : ""
                            } flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <InformationCircleIcon
                              className="mr-3 h-5 w-5"
                              aria-hidden="true"
                            />
                            Voir les détails
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Corps de la publication */}
        <div className="px-4 pb-3">
          {/* Titre et description */}
          {publication.titre && (
            <h4 className="text-lg font-semibold mb-2">{publication.titre}</h4>
          )}
          {publication.description && (
            <p className="mb-4 text-sm">{publication.description}</p>
          )}

          {/* Informations spécifiques selon le type */}
          {isOffreEmploi && (
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                <span>{publication.entreprise || "Non spécifié"}</span>
              </div>
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                <span>{publication.sector || "Non spécifié"}</span>
              </div>
            </div>
          )}

          {isOpportuniteAffaire && (
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                <span>{publication.sector || "Non spécifié"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Carrousel de médias (images et vidéos) */}
        {mediaItems[`${postType}-${publication.id}`]?.length > 0 && (
          <div className="mb-3 relative">
            {/* Affichage du média actuel */}
            <div className="relative overflow-hidden rounded-lg">
              {mediaItems[`${postType}-${publication.id}`][
                currentMediaIndex[`${postType}-${publication.id}`] || 0
              ]?.type === "image" ? (
                <img
                  src={
                    mediaItems[`${postType}-${publication.id}`][
                      currentMediaIndex[`${postType}-${publication.id}`] || 0
                    ].url
                  }
                  alt={
                    mediaItems[`${postType}-${publication.id}`][
                      currentMediaIndex[`${postType}-${publication.id}`] || 0
                    ].alt ||
                    `Média ${
                      (currentMediaIndex[`${postType}-${publication.id}`] ||
                        0) + 1
                    }`
                  }
                  className="w-full h-auto object-cover"
                  onClick={() => openPostDetail(publication.id, postType)}
                />
              ) : (
                mediaItems[`${postType}-${publication.id}`][
                  currentMediaIndex[`${postType}-${publication.id}`] || 0
                ]?.type === "video" && (
                  <div className="relative pt-[56.25%]">
                    {mediaItems[`${postType}-${publication.id}`][
                      currentMediaIndex[`${postType}-${publication.id}`] || 0
                    ].isYoutube ? (
                      <iframe
                        src={
                          mediaItems[`${postType}-${publication.id}`][
                            currentMediaIndex[
                              `${postType}-${publication.id}`
                            ] || 0
                          ].url.includes("watch?v=")
                            ? mediaItems[`${postType}-${publication.id}`][
                                currentMediaIndex[
                                  `${postType}-${publication.id}`
                                ] || 0
                              ].url.replace("watch?v=", "embed/")
                            : mediaItems[`${postType}-${publication.id}`][
                                currentMediaIndex[
                                  `${postType}-${publication.id}`
                                ] || 0
                              ].url
                        }
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg w-full h-full absolute top-0 left-0"
                        title="Vidéo"
                      ></iframe>
                    ) : (
                      <video
                        controls
                        className="rounded-lg w-full h-full absolute top-0 left-0"
                        src={
                          mediaItems[`${postType}-${publication.id}`][
                            currentMediaIndex[
                              `${postType}-${publication.id}`
                            ] || 0
                          ].url
                        }
                      >
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    )}
                  </div>
                )
              )}

              {/* Étiquette indiquant le type de média */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-medium px-2 py-1 rounded z-10">
                {mediaItems[`${postType}-${publication.id}`][
                  currentMediaIndex[`${postType}-${publication.id}`] || 0
                ]?.type === "image"
                  ? "Image"
                  : "Vidéo"}{" "}
                {(currentMediaIndex[`${postType}-${publication.id}`] || 0) + 1}/
                {mediaItems[`${postType}-${publication.id}`].length}
              </div>
            </div>

            {/* Boutons de navigation du carrousel */}
            {mediaItems[`${postType}-${publication.id}`]?.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia(publication);
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-all z-10"
                  aria-label="Média précédent"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia(publication);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-all z-10"
                  aria-label="Média suivant"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Indicateurs de position dans le carrousel */}
            {mediaItems[`${postType}-${publication.id}`]?.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                {mediaItems[`${postType}-${publication.id}`].map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToMedia(publication, index);
                    }}
                    className={`w-2 h-2 rounded-full ${
                      index ===
                      (currentMediaIndex[`${postType}-${publication.id}`] || 0)
                        ? "bg-white"
                        : "bg-white bg-opacity-50"
                    }`}
                    aria-label={`Aller au média ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lien externe si disponible */}
        {publication.lien && (
          <div className="px-4 mb-3">
            <a
              href={publication.lien}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-colors duration-200`}
            >
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              En savoir plus
            </a>
          </div>
        )}

        {/* Compteurs de likes et commentaires */}
        <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-1 mr-1">
              <HeartIconSolid className="h-3 w-3 text-white" />
            </div>
            <span>{publication.likes_count || 0}</span>
          </div>
          <div className="flex space-x-3">
            <span>{publication.comments_count || 0} commentaires</span>
            <span>{publication.shares_count || 0} partages</span>
          </div>
        </div>

        {/* Boutons d'action (J'aime, Commenter, Partager) */}
        <div className="px-2 py-1 flex justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike(publication.id, postType);
            }}
            className={`flex items-center justify-center flex-1 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
              publication.liked_by_current_user
                ? "text-blue-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <HeartIcon
              className={`h-5 w-5 mr-2 ${
                publication.liked_by_current_user ? "fill-current" : ""
              }`}
            />
            <span className="text-sm font-medium">J'aime</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedComments((prev) => ({
                ...prev,
                [`${postType}-${publication.id}`]: !isCommentsExpanded,
              }));
            }}
            className="flex items-center justify-center flex-1 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">
              {isCommentsExpanded
                ? "Masquer les commentaires"
                : `Commentaires (${
                    publication.comments_count ||
                    publication.comments?.length ||
                    0
                  })`}
            </span>
            {hasComments &&
              (isCommentsExpanded ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              ))}
          </button>

          <div className="relative flex-1">
            <div className="flex space-x-2 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(publication.id, publication.type, "facebook");
                }}
                className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Partager sur Facebook"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(publication.id, postType, "twitter");
                }}
                className="p-1.5 rounded-full text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Partager sur Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(publication.id, postType, "linkedin");
                }}
                className="p-1.5 rounded-full text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                title="Partager sur LinkedIn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(publication.id, postType, "whatsapp");
                }}
                className="p-1.5 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
                title="Partager sur WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(publication.id, postType, "copy");
                }}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Copier le lien"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Aperçu des commentaires récents - Style Facebook */}
        {hasComments && isCommentsExpanded && (
          <div className="px-4 pt-2 pb-4">
            {publication.comments.map((comment) => (
              <div key={comment.id} className="mb-3 last:mb-0">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <img
                      src={
                        comment.user?.picture_profile ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.user?.name || "Utilisateur"
                        )}&background=374151&color=FFFFFF&size=128`
                      }
                      alt={comment.user?.name || "Utilisateur"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`inline-block px-3 py-2 rounded-2xl ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        {comment.user?.name || "Utilisateur"}
                      </p>
                      <p className="text-sm">
                        {comment.contenu || comment.content}
                      </p>
                    </div>
                    <div className="flex items-center mt-1 ml-2 text-xs text-gray-500">
                      <button className="font-medium hover:underline">
                        J'aime
                      </button>
                      <span className="mx-1">·</span>
                      <button className="font-medium hover:underline">
                        Répondre
                      </button>
                      <span className="mx-1">·</span>
                      <span>{formatTimeAgo(comment.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Zone de commentaire rapide */}
            <div className="flex items-center mt-3">
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <img
                  src={
                    user?.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "Vous"
                    )}&background=374151&color=FFFFFF&size=128`
                  }
                  alt={user?.name || "Vous"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                onClick={() => openPostDetail(publication.id, postType)}
                className={`flex-1 px-3 py-1.5 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                } text-gray-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600`}
              >
                <span className="text-sm">Écrire un commentaire...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Gérer le partage d'un post
  const handleShare = async (postId, type, platform = "copy") => {
    if (!postId) return;

    try {
      const response = await axios.post(`/api/${type}/${postId}/share`, {
        platform,
      });

      // Trouver la publication dans l'état local
      let updatedPageData = { ...pageData };
      let publication;

      if (type === "publicites") {
        const index = updatedPageData.publicites.findIndex(
          (p) => p.id === postId
        );
        if (index !== -1) {
          updatedPageData.publicites[index].shares_count =
            (updatedPageData.publicites[index].shares_count || 0) + 1;
          publication = updatedPageData.publicites[index];
        }
      } else if (type === "offres-emploi") {
        const index = updatedPageData.offresEmploi.findIndex(
          (p) => p.id === postId
        );
        if (index !== -1) {
          updatedPageData.offresEmploi[index].shares_count =
            (updatedPageData.offresEmploi[index].shares_count || 0) + 1;
          publication = updatedPageData.offresEmploi[index];
        }
      } else if (type === "opportunites-affaires") {
        if (index !== -1) {
          updatedPageData.opportunitesAffaires[index].shares_count =
            (updatedPageData.opportunitesAffaires[index].likes_count || 0) + 1;
          publication = updatedPageData.opportunitesAffaires[index];
        }
      }

      // Mettre à jour l'état global de la page
      setPageData(updatedPageData);

      // Mettre à jour également le post sélectionné si c'est le même
      if (
        selectedPost &&
        selectedPost.id === postId &&
        selectedPost.type === type
      ) {
        setSelectedPost({
          ...selectedPost,
          shares_count: (selectedPost.shares_count || 0) + 1,
        });
      }
      // Construire l'URL du post
      let url = "";
      if (type === "publicites") {
        url = `${window.location.origin}/pages/${id}/publication/${postId}`;
      } else if (type === "offre-emploi") {
        url = `${window.location.origin}/pages/${id}/offre-emploi/${postId}`;
      } else if (type === "opportunite-affaire") {
        url = `${window.location.origin}/pages/${id}/opportunite-affaire/${postId}`;
      }

      // Texte de partage
      const text = "Découvrez cette publication intéressante sur SOLIFIN!";

      // Gérer le partage selon la plateforme
      let shareUrl = "";

      switch (platform) {
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`;
          window.open(shareUrl, "_blank");
          toast.success("Partagé sur Facebook");
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(url)}`;
          window.open(shareUrl, "_blank");
          toast.success("Partagé sur Twitter");
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`;
          window.open(shareUrl, "_blank");
          toast.success("Partagé sur LinkedIn");
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(
            text + " " + url
          )}`;
          window.open(shareUrl, "_blank");
          toast.success("Partagé sur WhatsApp");
          break;
        case "copy":

        default:
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success("Lien copié dans le presse-papier"))
            .catch((err) => {
              console.error("Erreur lors de la copie:", err);
              toast.error("Impossible de copier le lien");
            });
      }

      // Mettre à jour le compteur de partages (si une API est disponible)
      try {
        const response = await axios.post(`/api/${type}/${postId}/share`, {
          platform,
        });
        // Mettre à jour le compteur si nécessaire
      } catch (err) {
        console.error(
          "Erreur lors de la mise à jour du compteur de partages:",
          err
        );
      }
    } catch (err) {
      console.error("Erreur lors du partage:", err);
      toast.error("Une erreur est survenue lors du partage");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Erreur de chargement
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {error || "Impossible de charger les données de la page"}
        </p>
        <Link
          to="/feed"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retour au fil d'actualité
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: isDarkMode ? "rgb(25, 34, 50)" : "#f3f4f6", // Couleur personnalisée entre gray-700 et gray-800
      }}
    >
      {/* En-tête de la page avec photo de couverture */}
      <div
        ref={headerRef}
        className="relative w-full h-64 bg-gradient-to-r from-blue-500 to-indigo-600 overflow-hidden"
        style={{
          backgroundImage: pageData.photo_de_couverture
            ? `url(${pageData.photo_de_couverture})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay sombre sur la photo de couverture */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        {/* Contenu du header */}
        <div className="container mx-auto px-4 h-full flex flex-col justify-end relative z-10">
          <div className="flex items-end mb-4">
            {/* Nom et statistiques alignés en bas */}
            <div className="text-white mb-2 ml-32 sm:ml-40">
              <h1 className="text-2xl md:text-3xl font-bold">
                {pageData.user?.name || "Utilisateur"}
              </h1>
              <div className="flex items-center mt-1 text-sm md:text-base">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>{pageData.nombre_abonnes || 0} abonnés</span>
                <HeartIcon className="h-4 w-4 mr-1" />
                <span>{pageData.nombre_likes || 0} likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions avec photo de profil */}
      <div
        className={`container mx-auto px-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-sm rounded-b-lg relative`}
      >
        {/* Photo de profil positionnée à cheval entre la couverture et la barre d'actions */}
        <div className="absolute -top-16 left-4 sm:left-6">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
              <img
                src={
                  pageData.user?.picture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    pageData.user?.name || "Utilisateur"
                  )}&background=374151&color=FFFFFF&size=128`
                }
                alt={`${pageData.user?.name || "Utilisateur"}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <CheckIcon className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Barre d'actions avec espace pour la photo de profil */}
        <div className="flex flex-wrap justify-end items-center py-3 pl-32 sm:pl-40">
          <div className="flex flex-wrap items-center gap-2">
            {user && user.id !== pageData.user_id && (
              <>
                {/* Bouton Postuler comme livreur - uniquement visible si abonné et sans candidature existante */}
                {!pageData?.is_owner && candidatureStatus === null && isSubscribed && (
                  <button
                    onClick={() => setIsLivreurFormOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Postuler comme livreur
                  </button>
                )}
                
                {/* Bouton S'abonner/Se désabonner */}
                {isSubscribed ? (
                  <button
                    onClick={handleUnsubscribe}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1.5" />
                    Se désabonner
                  </button>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <UsersIcon className="h-4 w-4 mr-1.5" />
                    S'abonner
                  </button>
                )}

                {/* Bouton WhatsApp */}
                {pageData.user?.phone && (
                  <a
                    href={`https://wa.me/${pageData.user.phone.replace(
                      /[^0-9]/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S17.385 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}

                {/* Bouton Email */}
                {pageData.user?.email && (
                  <a
                    href={`mailto:${pageData.user.email}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Email</span>
                  </a>
                )}
                
                {/* Bouton Discuter - visible uniquement si l'utilisateur n'est pas le propriétaire */}
                {!pageData?.is_owner && (
                  <button
                    onClick={handleOpenChat}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Discuter</span>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="ml-auto text-right">
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Membre depuis {formatDate(pageData.user?.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu principal avec onglets */}
      <div className="container mx-auto px-4 py-6">
        <div
          ref={contentRef}
          className={`rounded-lg shadow-sm overflow-hidden ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex p-1 space-x-1 bg-blue-900/10 rounded-t-lg">
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full py-2.5 text-sm font-medium leading-5 text-blue-700",
                    "focus:outline-none focus:ring-0",
                    selected
                      ? "bg-white dark:bg-gray-700 shadow"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-white"
                  )
                }
              >
                <div className="flex items-center justify-center">
                  <NewspaperIcon className="h-5 w-5 mr-2" />
                  Publications
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full py-2.5 text-sm font-medium leading-5 text-blue-700",
                    "focus:outline-none focus:ring-0",
                    selected
                      ? "bg-white dark:bg-gray-700 shadow"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-white"
                  )
                }
              >
                <div className="flex items-center justify-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Offres d'emploi
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full py-2.5 text-sm font-medium leading-5 text-blue-700",
                    "focus:outline-none focus:ring-0",
                    selected
                      ? "bg-white dark:bg-gray-700 shadow"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-white"
                  )
                }
              >
                <div className="flex items-center justify-center">
                  <LightBulbIcon className="h-5 w-5 mr-2" />
                  Opportunités d'affaires
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    "w-full py-2.5 text-sm font-medium leading-5 text-blue-700",
                    "focus:outline-none focus:ring-0",
                    selected
                      ? "bg-white dark:bg-gray-700 shadow"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-700 dark:hover:text-white"
                  )
                }
              >
                <div className="flex items-center justify-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />À propos
                </div>
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {/* Onglet Publications */}
              <Tab.Panel
                className={`p-4 ${
                  isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                }`}
              >
                {/* Filtres et recherche avancés pour les publications */}
                <div
                  className={`flex flex-wrap justify-between items-center gap-3 p-4 mb-4 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Champ de recherche pour les publications */}
                  <div className="relative flex-grow max-w-md">
                    <input
                      type="text"
                      placeholder="Rechercher dans les publications..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      value={publiciteSearchQuery}
                      onChange={(e) => setPubliciteSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    {publiciteSearchQuery && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setPubliciteSearchQuery("")}
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Bouton pour afficher/masquer les filtres avancés */}
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      isDarkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowNewsFilters(!showNewsFilters)}
                  >
                    <FunnelIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm">
                      {showNewsFilters
                        ? "Masquer les filtres"
                        : "Filtres avancés"}
                    </span>
                  </button>

                  {/* Filtres de statut */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        newsStatusFilter === "all"
                          ? isDarkMode
                            ? "bg-primary-600 text-white"
                            : "bg-primary-500 text-white"
                          : isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setNewsStatusFilter("all")}
                    >
                      <span className="text-sm">Toutes</span>
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        newsStatusFilter === "disponible"
                          ? isDarkMode
                            ? "bg-green-600 text-white"
                            : "bg-green-500 text-white"
                          : isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setNewsStatusFilter("disponible")}
                    >
                      <span className="text-sm">En cours</span>
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        newsStatusFilter === "terminé"
                          ? isDarkMode
                            ? "bg-red-600 text-white"
                            : "bg-red-500 text-white"
                          : isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                      onClick={() => setNewsStatusFilter("terminé")}
                    >
                      <span className="text-sm">Terminées</span>
                    </button>
                  </div>
                </div>

                {/* Panneau de filtres avancés pour les publications */}
                {showNewsFilters && (
                  <div
                    className={`p-4 mb-4 rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Filtres avancés
                      </h3>
                      <button
                        className={`text-sm px-2 py-1 rounded ${
                          isDarkMode
                            ? "text-primary-400 hover:text-primary-300 hover:bg-gray-700"
                            : "text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                        }`}
                        onClick={resetNewsFilters}
                      >
                        <span className="flex items-center">
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Réinitialiser les filtres
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Filtre par pays */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Pays
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsCountryFilter}
                            onChange={(e) =>
                              setNewsCountryFilter(e.target.value)
                            }
                          >
                            <option value="">Tous les pays</option>
                            {uniquePubCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsCountryFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsCountryFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filtre par ville */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Ville
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsCityFilter}
                            onChange={(e) => setNewsCityFilter(e.target.value)}
                          >
                            <option value="">Toutes les villes</option>
                            {uniquePubCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsCityFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsCityFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filtre par type */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Type
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsTypeFilter}
                            onChange={(e) => setNewsTypeFilter(e.target.value)}
                          >
                            <option value="">Tous les types</option>
                            <option value="publicité">Publicité</option>
                            <option value="annonce">Annonce</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsTypeFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsTypeFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filtre par catégorie */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Catégorie
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsCategoryFilter}
                            onChange={(e) =>
                              setNewsCategoryFilter(e.target.value)
                            }
                          >
                            <option value="">Toutes les catégories</option>
                            <option value="produit">Produit</option>
                            <option value="service">Service</option>
                            {uniquePubCategories
                              .filter(
                                (cat) => cat !== "produit" && cat !== "service"
                              )
                              .map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsCategoryFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsCategoryFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filtre par sous-catégorie */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Sous-catégorie
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsSubCategoryFilter}
                            onChange={(e) =>
                              setNewsSubCategoryFilter(e.target.value)
                            }
                          >
                            <option value="">Toutes les sous-catégories</option>
                            {uniquePubSubCategories.map((subCategory) => (
                              <option key={subCategory} value={subCategory}>
                                {subCategory}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsSubCategoryFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsSubCategoryFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Filtre par besoin de livreurs */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Besoin de livreurs
                        </label>
                        <div className="relative">
                          <select
                            className={`block w-full px-3 py-2 pr-8 rounded border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsDeliveryFilter}
                            onChange={(e) =>
                              setNewsDeliveryFilter(e.target.value)
                            }
                          >
                            <option value="">Tous</option>
                            <option value="OUI">Oui</option>
                            <option value="NON">Non</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <ChevronDownIcon className="h-4 w-4" />
                          </div>
                          {newsDeliveryFilter && (
                            <button
                              className="absolute inset-y-0 right-0 pr-8 flex items-center"
                              onClick={() => setNewsDeliveryFilter("")}
                              title="Effacer la sélection"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {getFilteredPublications("publicites").length > 0 ? (
                    getFilteredPublications("publicites").map((publication) =>
                      renderPublication(publication, "publicites")
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <NewspaperIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3
                        className={`text-lg font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Aucune publication
                      </h3>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Cet utilisateur n'a pas encore publié de contenu ou
                        aucun contenu ne correspond à votre recherche.
                      </p>
                    </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Onglet Offres d'emploi */}
              <Tab.Panel
                className={`p-4 ${
                  isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                }`}
              >
                {/* Barre de recherche et filtres */}
                <div
                  className={`mb-6 rounded-lg overflow-hidden ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } shadow`}
                >
                  <div
                    className={`p-4 border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Offres d'emploi et appels à manifestation d'intérêt
                    </h2>
                    <p
                      className={`mt-1 text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Découvrez les dernières opportunités professionnelles
                    </p>
                    <div
                      className={`mt-4 p-3 rounded-lg ${
                        isDarkMode
                          ? "bg-yellow-900/30 text-yellow-200"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      <p className="text-sm font-medium">AVIS AUX CANDIDATS</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">
                          NE PAS ENVOYER DE L'ARGENT
                        </span>{" "}
                        sous quelque forme que ce soit (cash, virement,
                        transfert Western Union, mobile money,...). Merci de
                        signaler immédiatement toute demande suspecte.
                      </p>
                    </div>
                  </div>

                  {/* Filtres et recherche */}
                  <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                    {/* Barre de recherche */}
                    <div className="relative w-full md:w-1/3">
                      <input
                        type="text"
                        placeholder="Rechercher par titre, entreprise, référence..."
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        value={offreEmploiSearchQuery}
                        onChange={(e) =>
                          setOffreEmploiSearchQuery(e.target.value)
                        }
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      {offreEmploiSearchQuery && (
                        <button
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setOffreEmploiSearchQuery("")}
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Bouton pour afficher/masquer les filtres avancés */}
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setShowNewsFilters(!showNewsFilters)}
                    >
                      <FunnelIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">
                        {showNewsFilters
                          ? "Masquer les filtres"
                          : "Filtres avancés"}
                      </span>
                    </button>

                    {/* Filtres de statut */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "all"
                            ? isDarkMode
                              ? "bg-primary-600 text-white"
                              : "bg-primary-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("all")}
                      >
                        <span className="text-sm">Toutes</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "active"
                            ? isDarkMode
                              ? "bg-green-600 text-white"
                              : "bg-green-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("active")}
                      >
                        <span className="text-sm">En cours</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "recent"
                            ? isDarkMode
                              ? "bg-orange-600 text-white"
                              : "bg-orange-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("recent")}
                      >
                        <span className="text-sm">Récentes</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "expired"
                            ? isDarkMode
                              ? "bg-red-600 text-white"
                              : "bg-red-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("expired")}
                      >
                        <span className="text-sm">Expirées</span>
                      </button>
                    </div>
                  </div>

                  {/* Panneau de filtres avancés */}
                  {showNewsFilters && (
                    <div
                      className={`p-4 mb-4 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Filtres avancés
                        </h3>
                        <button
                          className={`text-sm px-2 py-1 rounded ${
                            isDarkMode
                              ? "text-primary-400 hover:text-primary-300 hover:bg-gray-700"
                              : "text-primary-600 hover:text-primary-700 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setNewsStatusFilter("");
                            setNewsCountryFilter("");
                            setNewsCityFilter("");
                            setNewsTypeFilter("");
                            setNewsContractTypeFilter("");
                            setSearchQuery("");
                          }}
                        >
                          <span className="flex items-center">
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Réinitialiser les filtres
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Filtre par pays */}
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Pays
                          </label>
                          <div className="relative">
                            <select
                              className={`block w-full px-3 py-2 pr-8 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                              value={newsCountryFilter}
                              onChange={(e) =>
                                setNewsCountryFilter(e.target.value)
                              }
                            >
                              <option value="">Tous les pays</option>
                              {uniqueJobCountries.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <ChevronDownIcon className="h-4 w-4" />
                            </div>
                            {newsCountryFilter && (
                              <button
                                className="absolute inset-y-0 right-0 pr-8 flex items-center"
                                onClick={() => setNewsCountryFilter("")}
                                title="Effacer la sélection"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtre par ville */}
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Ville
                          </label>
                          <div className="relative">
                            <select
                              className={`block w-full px-3 py-2 pr-8 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                              value={newsCityFilter}
                              onChange={(e) =>
                                setNewsCityFilter(e.target.value)
                              }
                            >
                              <option value="">Toutes les villes</option>
                              {uniqueJobCities.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <ChevronDownIcon className="h-4 w-4" />
                            </div>
                            {newsCityFilter && (
                              <button
                                className="absolute inset-y-0 right-0 pr-8 flex items-center"
                                onClick={() => setNewsCityFilter("")}
                                title="Effacer la sélection"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtre par secteur */}
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Secteur
                          </label>
                          <div className="relative">
                            <select
                              className={`block w-full px-3 py-2 pr-8 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                              value={newsTypeFilter}
                              onChange={(e) =>
                                setNewsTypeFilter(e.target.value)
                              }
                            >
                              <option value="">Tous les secteurs</option>
                              {uniqueJobSectors.map((sector) => (
                                <option key={sector} value={sector}>
                                  {sector}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <ChevronDownIcon className="h-4 w-4" />
                            </div>
                            {newsTypeFilter && (
                              <button
                                className="absolute inset-y-0 right-0 pr-8 flex items-center"
                                onClick={() => setNewsTypeFilter("")}
                                title="Effacer la sélection"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtre par type de publication */}
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Type de publication
                          </label>
                          <div className="relative">
                            <select
                              className={`block w-full px-3 py-2 pr-8 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                              value={newsPostTypeFilter}
                              onChange={(e) =>
                                setNewsPostTypeFilter(e.target.value)
                              }
                            >
                              <option value="">Tous les types</option>
                              <option value="offre_emploi">
                                Offre d'emploi
                              </option>
                              <option value="appel_manifestation_interet">
                                Appel à manifestation d'intérêt
                              </option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <ChevronDownIcon className="h-4 w-4" />
                            </div>
                            {newsPostTypeFilter && (
                              <button
                                className="absolute inset-y-0 right-0 pr-8 flex items-center"
                                onClick={() => setNewsPostTypeFilter("")}
                                title="Effacer la sélection"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtre par type de contrat */}
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Type de contrat
                          </label>
                          <div className="relative">
                            <select
                              className={`block w-full px-3 py-2 pr-8 rounded border ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                              value={newsContractTypeFilter}
                              onChange={(e) =>
                                setNewsContractTypeFilter(e.target.value)
                              }
                            >
                              <option value="">Tous les contrats</option>
                              {uniqueJobContractTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                              <ChevronDownIcon className="h-4 w-4" />
                            </div>
                            {newsContractTypeFilter && (
                              <button
                                className="absolute inset-y-0 right-0 pr-8 flex items-center"
                                onClick={() => setNewsContractTypeFilter("")}
                                title="Effacer la sélection"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Indicateurs de filtres actifs */}
                      {(newsCountryFilter ||
                        newsTypeFilter ||
                        newsCityFilter ||
                        newsPostTypeFilter ||
                        newsContractTypeFilter) && (
                        <div
                          className={`mt-4 pt-3 border-t ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Filtres actifs:
                            </span>
                            {newsCountryFilter && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                Pays: {newsCountryFilter}
                                <XMarkIcon
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setNewsCountryFilter("")}
                                />
                              </span>
                            )}
                            {newsCityFilter && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                Ville: {newsCityFilter}
                                <XMarkIcon
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setNewsCityFilter("")}
                                />
                              </span>
                            )}
                            {newsTypeFilter && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                Secteur: {newsTypeFilter}
                                <XMarkIcon
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setNewsTypeFilter("")}
                                />
                              </span>
                            )}
                            {newsPostTypeFilter && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                Type:{" "}
                                {newsPostTypeFilter === "offre_emploi"
                                  ? "Offre d'emploi"
                                  : "Appel à manifestation d'intérêt"}
                                <XMarkIcon
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setNewsPostTypeFilter("")}
                                />
                              </span>
                            )}
                            {newsContractTypeFilter && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-gray-700 text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                              >
                                Contrat: {newsContractTypeFilter}
                                <XMarkIcon
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setNewsContractTypeFilter("")}
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options de tri et informations */}
                  <div
                    className={`flex flex-wrap justify-between items-center gap-3 p-4 border-t ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-1" />
                      <span>Cliquez sur une offre pour voir les détails</span>
                    </div>
                  </div>
                </div>

                {/* Tableau des offres d'emploi */}
                <div
                  className={`overflow-hidden rounded-lg shadow ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  {/* En-tête du tableau */}
                  <div
                    className={`grid grid-cols-12 gap-4 p-4 font-medium ${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    } border-b`}
                  >
                    <div className="col-span-6 sm:col-span-5">Titre</div>
                    <div className="col-span-3 sm:col-span-3 hidden sm:block">
                      Organisme
                    </div>
                    <div className="col-span-3 sm:col-span-2 hidden sm:block">
                      Pays
                    </div>
                    <div className="col-span-6 sm:col-span-2 text-right">
                      Date de clôture
                    </div>
                  </div>

                  {/* Corps du tableau */}
                  <div>
                    {getFilteredPublications("offres-emploi").length > 0 ? (
                      getFilteredPublications("offres-emploi").map((offre) => (
                        <div
                          key={offre.id}
                          className={`grid grid-cols-12 gap-4 p-4 cursor-pointer hover:${
                            isDarkMode ? "bg-gray-700" : "bg-gray-50"
                          } border-b ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                          onClick={() =>
                            openPostDetail(offre.id, "offres-emploi")
                          }
                        >
                          <div className="col-span-6 sm:col-span-5">
                            <div className="flex items-start">
                              <div
                                className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                                  offre.etat === "disponible"
                                    ? "bg-green-500"
                                    : offre.etat === "terminé"
                                    ? "bg-red-500"
                                    : "bg-orange-500"
                                }`}
                              ></div>
                              <div className="ml-2">
                                <div
                                  className={`font-medium ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {offre.titre || offre.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {offre.reference || "Réf. non précisée"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3 sm:col-span-3 hidden sm:block">
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {offre.entreprise ||
                                offre.company_name ||
                                "Non précisé"}
                            </div>
                          </div>
                          <div className="col-span-3 sm:col-span-2 hidden sm:block">
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {offre.pays || "Non précisé"}
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-2 text-right">
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {offre.date_limite
                                ? new Date(
                                    offre.date_limite
                                  ).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "Date non spécifiée"}
                            </div>

                            {/* Actions sociales (j'aime, commentaires, partages) */}
                            <div
                              className={`flex items-center justify-end mt-2 text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              <button
                                className="flex items-center mr-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(offre.id, "offres-emploi");
                                }}
                              >
                                {offre.liked_by_current_user ? (
                                  <HeartIconSolid className="h-4 w-4 text-red-500 mr-1" />
                                ) : (
                                  <HeartIcon className="h-4 w-4 mr-1" />
                                )}
                                <span>{offre.likes_count || 0}</span>
                              </button>

                              <button
                                className="flex items-center mr-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPostDetail(offre.id, "offres-emploi");
                                }}
                              >
                                <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                                <span>{offre.comments_count || 0}</span>
                              </button>

                              <button
                                className="flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(offre.id, "offres-emploi");
                                }}
                              >
                                <ShareIcon className="h-4 w-4 mr-1" />
                                <span>{offre.shares_count || 0}</span>
                              </button>
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex justify-end mt-2 space-x-2">
                              {/* Bouton Détails */}
                              <button
                                className={`p-1 rounded-full ${
                                  isDarkMode
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-blue-500 hover:bg-blue-600"
                                } text-white`}
                                title="Voir les détails"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPostDetail(offre.id, "offres-emploi");
                                }}
                              >
                                <InformationCircleIcon className="w-4 h-4" />
                              </button>

                              {/* Bouton Télécharger */}
                              {offre.offer_file_url && (
                                <a
                                  href={offre.offer_file_url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1 rounded-full ${
                                    isDarkMode
                                      ? "bg-purple-600 hover:bg-purple-700"
                                      : "bg-purple-500 hover:bg-purple-600"
                                  } text-white`}
                                  title="Télécharger le fichier"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DocumentArrowDownIcon className="w-4 h-4" />
                                </a>
                              )}

                              {/* Bouton WhatsApp */}
                              {offre.contacts && (
                                <a
                                  href={`https://wa.me/${offre.contacts.replace(
                                    /[^0-9]/g,
                                    ""
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                                  title="Contacter via WhatsApp"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                </a>
                              )}

                              {/* Bouton Lien externe */}
                              {offre.lien && (
                                <a
                                  href={offre.lien}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1 rounded-full ${
                                    isDarkMode
                                      ? "bg-primary-600 hover:bg-primary-700"
                                      : "bg-primary-500 hover:bg-primary-600"
                                  } text-white`}
                                  title="En savoir plus"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <BriefcaseIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <h3
                          className={`text-lg font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Aucune offre d'emploi
                        </h3>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Cet utilisateur n'a pas encore publié d'offres
                          d'emploi ou aucune offre ne correspond à votre
                          recherche.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Onglet Opportunités d'affaires */}
              <Tab.Panel
                className={classNames(
                  "rounded-xl p-3",
                  "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                )}
              >
                {/* Barre de recherche et filtres */}
                <div
                  className={`mb-6 rounded-lg overflow-hidden ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } shadow`}
                >
                  <div
                    className={`p-4 border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Opportunités d'affaires, partenariats et appels à projets
                    </h2>
                    <p
                      className={`mt-1 text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Découvrez les dernières opportunités d'affaires et de
                      partenariats
                    </p>
                    <div
                      className={`mt-4 p-3 rounded-lg ${
                        isDarkMode
                          ? "bg-yellow-900/30 text-yellow-200"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      <p className="text-sm font-medium">AVIS IMPORTANT</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">
                          VÉRIFIEZ LA LÉGITIMITÉ DES OFFRES
                        </span>{" "}
                        avant tout engagement. Assurez-vous de bien comprendre
                        les termes et conditions de chaque opportunité.
                      </p>
                    </div>
                  </div>

                  {/* Filtres et recherche */}
                  <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                    {/* Barre de recherche */}
                    <div className="relative w-full md:w-1/3">
                      <input
                        type="text"
                        placeholder="Rechercher une opportunité..."
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        value={opportuniteSearchQuery}
                        onChange={(e) =>
                          setOpportuniteSearchQuery(e.target.value)
                        }
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      {opportuniteSearchQuery && (
                        <button
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setOpportuniteSearchQuery("")}
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Bouton pour afficher/masquer les filtres avancés */}
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setShowNewsFilters(!showNewsFilters)}
                    >
                      <FunnelIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">
                        {showNewsFilters
                          ? "Masquer les filtres"
                          : "Filtres avancés"}
                      </span>
                    </button>

                    {/* Bouton pour réinitialiser tous les filtres */}
                    <button
                      className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => {
                        setOpportuniteSearchQuery("");
                        setFilter("all");
                        setNewsCountryFilter("");
                        setNewsCityFilter("");
                        setNewsTypeFilter("");
                        setNewsPostTypeFilter("");
                      }}
                    >
                      <ArrowPathIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">Réinitialiser</span>
                    </button>

                    {/* Filtres de statut */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "all"
                            ? isDarkMode
                              ? "bg-primary-600 text-white"
                              : "bg-primary-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("all")}
                      >
                        <span className="text-sm">Toutes</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "active"
                            ? isDarkMode
                              ? "bg-green-600 text-white"
                              : "bg-green-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("active")}
                      >
                        <span className="text-sm">En cours</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "recent"
                            ? isDarkMode
                              ? "bg-orange-600 text-white"
                              : "bg-orange-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("recent")}
                      >
                        <span className="text-sm">Récentes</span>
                      </button>
                      <button
                        className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                          filter === "expired"
                            ? isDarkMode
                              ? "bg-red-600 text-white"
                              : "bg-red-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setFilter("expired")}
                      >
                        <span className="text-sm">Expirées</span>
                      </button>
                    </div>
                  </div>

                  {/* Filtres avancés */}
                  {showNewsFilters && (
                    <div
                      className={`p-4 border-t ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtre par pays */}
                        <div>
                          <label
                            htmlFor="country-filter"
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Pays
                          </label>
                          <select
                            id="country-filter"
                            className={`block w-full py-2 px-3 border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsCountryFilter}
                            onChange={(e) =>
                              setNewsCountryFilter(e.target.value)
                            }
                          >
                            <option value="">Tous les pays</option>
                            {uniqueOppoCountries.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtre par ville */}
                        <div>
                          <label
                            htmlFor="city-filter"
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Ville
                          </label>
                          <select
                            id="city-filter"
                            className={`block w-full py-2 px-3 border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsCityFilter}
                            onChange={(e) => setNewsCityFilter(e.target.value)}
                          >
                            <option value="">Toutes les villes</option>
                            {uniqueOppoCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtre par secteur */}
                        <div>
                          <label
                            htmlFor="sector-filter"
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Secteur
                          </label>
                          <select
                            id="sector-filter"
                            className={`block w-full py-2 px-3 border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsTypeFilter}
                            onChange={(e) => setNewsTypeFilter(e.target.value)}
                          >
                            <option value="">Tous les secteurs</option>
                            {uniqueOppoSectors.map((sector) => (
                              <option key={sector} value={sector}>
                                {sector}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtre par type d'opportunité */}
                        <div>
                          <label
                            htmlFor="opportunity-type-filter"
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Type d'opportunité
                          </label>
                          <select
                            id="opportunity-type-filter"
                            className={`block w-full py-2 px-3 border ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                            value={newsPostTypeFilter}
                            onChange={(e) =>
                              setNewsPostTypeFilter(e.target.value)
                            }
                          >
                            <option value="">Tous les types</option>
                            {uniqueOppoTypes.length > 0 ? (
                              uniqueOppoTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type === "appel_projet"
                                    ? "Appel à projet"
                                    : type === "partenariat"
                                    ? "Partenariat"
                                    : type === "opportunité"
                                    ? "Opportunité d'affaire"
                                    : type}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="opportunité">
                                  Opportunité d'affaire
                                </option>
                                <option value="appel_projet">
                                  Appel à projet
                                </option>
                                <option value="partenariat">Partenariat</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tableau des opportunités d'affaires */}
                <div
                  className={`overflow-hidden rounded-lg shadow ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  {loading ? (
                    <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead
                          className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}
                        >
                          <tr>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              } uppercase tracking-wider`}
                            >
                              Titre
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              } uppercase tracking-wider hidden md:table-cell`}
                            >
                              Type
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              } uppercase tracking-wider hidden md:table-cell`}
                            >
                              Entreprise
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-left text-xs font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              } uppercase tracking-wider hidden sm:table-cell`}
                            >
                              Date de clôture
                            </th>
                            <th
                              scope="col"
                              className={`px-6 py-3 text-center text-xs font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              } uppercase tracking-wider`}
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
                          {getFilteredPublications("opportunites-affaires")
                            .length > 0 ? (
                            getFilteredPublications(
                              "opportunites-affaires"
                            ).map((post) => (
                              <tr
                                key={post.id}
                                className={`hover:${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                                } cursor-pointer`}
                                onClick={() =>
                                  openPostDetail(
                                    post.id,
                                    "opportunites-affaires"
                                  )
                                }
                              >
                                <td className="px-6 py-4 ">
                                  <div className="flex items-center">
                                    <div
                                      className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                                        post.etat === "disponible"
                                          ? "bg-green-500"
                                          : post.etat === "terminé"
                                          ? "bg-red-500"
                                          : "bg-orange-500"
                                      }`}
                                    ></div>
                                    <div className="ml-4">
                                      <div
                                        className={`font-medium ${
                                          isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        {post.titre || "Non précisé"}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {post.reference || "Réf. non précisée"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      post.post_type === "opportunité"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : post.post_type === "appel_projet"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    }`}
                                  >
                                    {post.post_type === "opportunité"
                                      ? "Opportunité d'affaire"
                                      : post.post_type === "appel_projet"
                                      ? "Appel à projet"
                                      : "Partenariat"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                  <div
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {post.entreprise ||
                                      post.company_name ||
                                      "Non précisé"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                                  <div
                                    className={`text-sm ${
                                      post.is_expired ||
                                      (post.date_limite &&
                                        new Date(post.date_limite) < new Date())
                                        ? "text-red-500"
                                        : isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {post.date_limite
                                      ? new Date(
                                          post.date_limite
                                        ).toLocaleDateString()
                                      : "Sans date limite"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                  {/* Actions sociales (j'aime, commentaires, partages) avec compteurs */}
                                  <div className="flex justify-center space-x-3 mb-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(
                                          post.id,
                                          "opportunites-affaires"
                                        );
                                      }}
                                      className={`flex items-center ${
                                        post.liked_by_current_user
                                          ? "text-red-500"
                                          : isDarkMode
                                          ? "text-gray-400 hover:text-gray-300"
                                          : "text-gray-500 hover:text-gray-700"
                                      }`}
                                      title="J'aime"
                                    >
                                      {post.liked_by_current_user ? (
                                        <HeartIconSolid className="h-4 w-4 mr-1" />
                                      ) : (
                                        <HeartIcon className="h-4 w-4 mr-1" />
                                      )}
                                      <span className="text-xs">
                                        {post.likes_count || 0}
                                      </span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPostDetail(
                                          post.id,
                                          "opportunites-affaires"
                                        );
                                      }}
                                      className={`flex items-center ${
                                        isDarkMode
                                          ? "text-gray-400 hover:text-gray-300"
                                          : "text-gray-500 hover:text-gray-700"
                                      }`}
                                      title="Commentaires"
                                    >
                                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                                      <span className="text-xs">
                                        {post.comments_count || 0}
                                      </span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(
                                          post.id,
                                          "opportunites-affaires",
                                          "facebook"
                                        );
                                      }}
                                      className={`flex items-center ${
                                        isDarkMode
                                          ? "text-gray-400 hover:text-gray-300"
                                          : "text-gray-500 hover:text-gray-700"
                                      }`}
                                      title="Partager"
                                    >
                                      <ShareIcon className="h-4 w-4 mr-1" />
                                      <span className="text-xs">
                                        {post.shares_count || 0}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Boutons d'action (Détails, Télécharger, WhatsApp, lien externe) */}
                                  <div className="flex justify-center space-x-2">
                                    {/* Bouton Détails */}
                                    <button
                                      className={`p-1 rounded-full ${
                                        isDarkMode
                                          ? "bg-blue-600 hover:bg-blue-700"
                                          : "bg-blue-500 hover:bg-blue-600"
                                      } text-white`}
                                      title="Voir les détails"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openPostDetail(
                                          post.id,
                                          "opportunites-affaires"
                                        );
                                      }}
                                    >
                                      <InformationCircleIcon className="w-4 h-4" />
                                    </button>

                                    {/* Bouton Télécharger */}
                                    {post.opportunity_file_url && (
                                      <a
                                        href={post.opportunity_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-1 rounded-full ${
                                          isDarkMode
                                            ? "bg-purple-600 hover:bg-purple-700"
                                            : "bg-purple-500 hover:bg-purple-600"
                                        } text-white`}
                                        title="Télécharger le fichier"
                                        onClick={(e) => e.stopPropagation()}
                                        download
                                      >
                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                      </a>
                                    )}

                                    {/* Bouton WhatsApp */}
                                    {post.contacts && (
                                      <a
                                        href={`https://wa.me/${post.contacts.replace(
                                          /[^0-9]/g,
                                          ""
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                                        title="Contacter via WhatsApp"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                          className="w-4 h-4"
                                        >
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                      </a>
                                    )}

                                    {/* Bouton Lien externe */}
                                    {post.lien && (
                                      <a
                                        href={post.lien}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-1 rounded-full ${
                                          isDarkMode
                                            ? "bg-primary-600 hover:bg-primary-700"
                                            : "bg-primary-500 hover:bg-primary-600"
                                        } text-white`}
                                        title="En savoir plus"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="px-6 py-12 text-center"
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <LightBulbIcon className="h-12 w-12 text-gray-400 mb-4" />
                                  <h3
                                    className={`text-lg font-medium ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    Aucune opportunité d'affaires
                                  </h3>
                                  <p
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Cet utilisateur n'a pas encore publié
                                    d'opportunités d'affaires ou aucune
                                    opportunité ne correspond à votre recherche.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Options de tri et informations */}
                  <div
                    className={`flex flex-wrap justify-between items-center gap-3 p-4 border-t ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 mr-1" />
                      <span>
                        Cliquez sur une opportunité pour voir les détails
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-sm mr-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Trier par:
                      </span>
                      <div className="relative">
                        <select
                          className={`block appearance-none w-full px-4 py-2 pr-8 rounded border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        >
                          <option>Plus récentes</option>
                          <option>Plus anciennes</option>
                          <option>Popularité</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Onglet À propos */}
              <Tab.Panel
                className={`p-6 ${
                  isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                }`}
              >
                <div className="max-w-3xl mx-auto">
                  <div className={`mb-8 ${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl overflow-hidden shadow-sm border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className={`px-6 py-4 border-b ${isDarkMode ? "border-gray-700 bg-gray-750" : "border-gray-200 bg-gray-50"} flex items-center`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        À propos de {pageData.user?.name || "l'utilisateur"}
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      {pageData.user?.apropos ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className={`whitespace-pre-line ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {pageData.user.apropos}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 mr-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className={`text-sm italic ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Aucune biographie disponible.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3
                        className={`text-lg font-medium mb-3 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Informations personnelles
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <UsersIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Nom
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.name || "Non disponible"}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Pays
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.pays || "Non disponible"}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Province
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.province || "Non disponible"}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Ville
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.ville || "Non disponible"}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Adresse
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.address || "Non disponible"}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3
                        className={`text-lg font-medium mb-3 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Contact
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <PhoneIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Téléphone
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {pageData.user?.phone || "Non disponible"}
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              WhatsApp
                            </p>
                            {pageData.user?.phone ? (
                              <a
                                href={`https://wa.me/${pageData.user.phone.replace(
                                  /[^0-9]/g,
                                  ""
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm ${
                                  isDarkMode
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-green-600 hover:text-green-700"
                                }`}
                              >
                                {pageData.user.phone}
                              </a>
                            ) : (
                              <p
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                Non disponible
                              </p>
                            )}
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <EnvelopeIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Email
                            </p>
                            {pageData.user?.email ? (
                              <a
                                href={`mailto:${pageData.user.email}`}
                                className={`text-sm ${
                                  isDarkMode
                                    ? "text-blue-400 hover:text-blue-300"
                                    : "text-blue-600 hover:text-blue-700"
                                }`}
                              >
                                {pageData.user.email}
                              </a>
                            ) : (
                              <p
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                Non disponible
                              </p>
                            )}
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div
                            className={`flex-shrink-0 h-5 w-5 text-indigo-500`}
                          >
                            <UsersIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Membre depuis
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {formatDate(pageData.user?.created_at)}
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Modal de détail de publication */}
      {isPostDetailModalOpen && selectedPost && (
        <PostDetailModal
          isOpen={isPostDetailModalOpen}
          onClose={() => setIsPostDetailModalOpen(false)}
          post={selectedPost}
          onLike={handleLike}
          onComment={handleComment}
          onCommentLike={handleCommentLike}
          onDeleteComment={handleDeleteComment}
          onShare={handleShare}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Modal pour postuler comme livreur */}
      {isLivreurFormOpen && (
        <Modal
          isOpen={isLivreurFormOpen}
          onClose={() => setIsLivreurFormOpen(false)}
        >
          <LivreurForm
            onSubmit={handleLivreurSubmit}
            onCancel={() => setIsLivreurFormOpen(false)}
          />
        </Modal>
      )}

      {/* Configuration des notifications toast */}
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
