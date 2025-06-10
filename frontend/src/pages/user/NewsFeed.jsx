import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Tab } from "@headlessui/react";
import {
  NewspaperIcon,
  BriefcaseIcon,
  LightBulbIcon,
  PlusIcon,
  ChevronDownIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  ArrowPathIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import PostCard from "./components/PostCard";
import PostDetailModal from "./components/PostDetailModal";
import LoadingSpinner from "../../components/LoadingSpinner";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function NewsFeed() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState(0);

  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all"); // 'all', 'active', 'recent', 'expired'

  // États pour les filtres des offres d'emploi
  const [countryFilter, setCountryFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState(""); // "offre_emploi" ou "appel_manifestation_interet"
  const [contractTypeFilter, setContractTypeFilter] = useState("");

  // États pour les filtres des opportunités d'affaires
  const [oppoCountryFilter, setOppoCountryFilter] = useState("");
  const [oppoSectorFilter, setOppoSectorFilter] = useState("");
  const [oppoCityFilter, setOppoCityFilter] = useState("");
  const [oppoTypeFilter, setOppoTypeFilter] = useState(""); // "appel_projet", "partenariat", "appel_offre"

  // États pour les filtres du fil d'actualités
  const [showNewsFilters, setShowNewsFilters] = useState(false);
  const [newsCountryFilter, setNewsCountryFilter] = useState("");
  const [newsCityFilter, setNewsCityFilter] = useState("");
  const [newsTypeFilter, setNewsTypeFilter] = useState(""); // "publicite" ou "annonce"
  const [newsCategoryFilter, setNewsCategoryFilter] = useState(""); // "produit" ou "service"
  const [newsSubCategoryFilter, setNewsSubCategoryFilter] = useState("");
  const [newsDeliveryFilter, setNewsDeliveryFilter] = useState(""); // "OUI" ou "NON"
  const [newsStatusFilter, setNewsStatusFilter] = useState("all"); // "all", "disponible", "termine"

  // États pour les listes de valeurs uniques pour les filtres d'offres d'emploi
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [uniqueSectors, setUniqueSectors] = useState([]);
  const [uniqueCities, setUniqueCities] = useState([]);
  const [uniquePostTypes, setUniquePostTypes] = useState([]);
  const [uniqueContractTypes, setUniqueContractTypes] = useState([]);

  // États pour les listes de valeurs uniques pour les filtres d'opportunités d'affaires
  const [uniqueOppoCountries, setUniqueOppoCountries] = useState([]);
  const [uniqueOppoSectors, setUniqueOppoSectors] = useState([]);
  const [uniqueOppoCities, setUniqueOppoCities] = useState([]);

  // États pour les listes de valeurs uniques pour les filtres du fil d'actualités
  const [uniqueNewsCountries, setUniqueNewsCountries] = useState([]);
  const [uniqueNewsCities, setUniqueNewsCities] = useState([]);
  const [uniqueNewsCategories, setUniqueNewsCategories] = useState([]);
  const [uniqueNewsSubCategories, setUniqueNewsSubCategories] = useState([]);
  const [uniqueOppoTypes, setUniqueOppoTypes] = useState([]);

  // État pour contrôler l'affichage du panneau de filtres
  const [showFilters, setShowFilters] = useState(false);
  const [showOppoFilters, setShowOppoFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const observer = useRef();
  const limit = 5; // Nombre de posts à charger à chaque fois

  const tabTypes = ["publicites", "offres-emploi", "opportunites-affaires"];

  // Fonction pour extraire les valeurs uniques pour les filtres
  const extractUniqueValues = useCallback((posts) => {
    if (!posts || posts.length === 0) return;

    const jobPosts = posts.filter((post) => post.type === "offres-emploi");
    const oppoPosts = posts.filter(
      (post) => post.type === "opportunites-affaires"
    );
    const newsPosts = posts.filter(
      (post) => post.type === "publicites" || post.type === "annonces"
    );

    // Extraire les valeurs uniques pour les offres d'emploi
    if (jobPosts.length > 0) {
      // Extraire les pays uniques
      const countries = [
        ...new Set(jobPosts.map((post) => post.pays).filter(Boolean)),
      ];
      setUniqueCountries(countries);

      // Extraire les secteurs uniques
      const sectors = [
        ...new Set(jobPosts.map((post) => post.sector).filter(Boolean)),
      ];
      setUniqueSectors(sectors);

      // Extraire les villes uniques
      const cities = [
        ...new Set(jobPosts.map((post) => post.ville).filter(Boolean)),
      ];
      setUniqueCities(cities);

      // Extraire les types de contrat uniques
      const contractTypes = [
        ...new Set(jobPosts.map((post) => post.type_contrat).filter(Boolean)),
      ];
      setUniqueContractTypes(contractTypes);
    }

    // Extraire les valeurs uniques pour les opportunités d'affaires
    if (oppoPosts.length > 0) {
      // Extraire les pays uniques
      const oppoCountries = [
        ...new Set(oppoPosts.map((post) => post.pays).filter(Boolean)),
      ];
      setUniqueOppoCountries(oppoCountries);

      // Extraire les secteurs uniques
      const oppoSectors = [
        ...new Set(oppoPosts.map((post) => post.secteur).filter(Boolean)),
      ];
      setUniqueOppoSectors(oppoSectors);

      // Extraire les villes uniques
      const oppoCities = [
        ...new Set(oppoPosts.map((post) => post.ville).filter(Boolean)),
      ];
      setUniqueOppoCities(oppoCities);

      // Extraire les types d'opportunités uniques
      const oppoTypes = [
        ...new Set(oppoPosts.map((post) => post.post_type).filter(Boolean)),
      ];
      setUniqueOppoTypes(oppoTypes);
    }

    // Extraire les valeurs uniques pour le fil d'actualités
    if (newsPosts.length > 0) {
      // Extraire les pays uniques
      const newsCountries = [
        ...new Set(newsPosts.map((post) => post.pays).filter(Boolean)),
      ];
      setUniqueNewsCountries(newsCountries);

      // Extraire les villes uniques
      const newsCities = [
        ...new Set(newsPosts.map((post) => post.ville).filter(Boolean)),
      ];
      setUniqueNewsCities(newsCities);

      // Extraire les catégories uniques
      const newsCategories = [
        ...new Set(newsPosts.map((post) => post.categorie).filter(Boolean)),
      ];
      setUniqueNewsCategories(newsCategories);

      // Extraire les sous-catégories uniques
      const newsSubCategories = [
        ...new Set(
          newsPosts
            .map((post) => post.sous_categorie || post.autre_sous_categorie)
            .filter(Boolean)
        ),
      ];
      setUniqueNewsSubCategories(newsSubCategories);
    }
  }, []);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setCountryFilter("");
    setSectorFilter("");
    setCityFilter("");
    setPostTypeFilter("");
    setContractTypeFilter("");
    setSearchQuery("");
    setJobFilter("all");
  };

  // Fonction pour réinitialiser les filtres des opportunités d'affaires
  const resetOppoFilters = () => {
    setOppoCountryFilter("");
    setOppoSectorFilter("");
    setOppoCityFilter("");
    setOppoTypeFilter("");
    setSearchQuery("");
    setJobFilter("all");
  };

  // Fonction pour réinitialiser les filtres du fil d'actualités
  const resetNewsFilters = () => {
    setNewsCountryFilter("");
    setNewsCityFilter("");
    setNewsTypeFilter("");
    setNewsCategoryFilter("");
    setNewsSubCategoryFilter("");
    setNewsDeliveryFilter("");
    setNewsStatusFilter("all");
    setSearchQuery("");
  };

  // Fonction pour charger les posts sans boucle infinie
  const fetchPosts = useCallback(
    async (reset = false, retryCount = 0) => {
      try {
        if (!hasMore && !reset) return;

        // Seulement afficher le loading au premier essai
        if (retryCount === 0) {
          setLoading(true);
          setError(null);
        }

        // Configuration pour la requête
        const config = {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          params: {
            type: tabTypes[activeTab],
            last_id: reset ? 0 : lastId,
            limit: limit,
            search: searchQuery || undefined,
          },
          // Réduire le timeout pour éviter de surcharger le serveur
          timeout: 5000,
        };

        // Ajouter les paramètres de filtre en fonction de l'onglet actif
        if (activeTab === 0) {
          // Publicités
          if (newsCountryFilter) config.params.pays = newsCountryFilter;
          if (newsCityFilter) config.params.ville = newsCityFilter;
          if (newsTypeFilter) config.params.type_publication = newsTypeFilter;
          if (newsCategoryFilter) config.params.categorie = newsCategoryFilter;
          if (newsSubCategoryFilter)
            config.params.sous_categorie = newsSubCategoryFilter;
          if (newsDeliveryFilter)
            config.params.besoin_livreurs = newsDeliveryFilter;
          if (newsStatusFilter !== "all")
            config.params.statut = newsStatusFilter;
        } else if (activeTab === 1) {
          // Offres d'emploi
          if (countryFilter) config.params.pays = countryFilter;
          if (sectorFilter) config.params.secteur = sectorFilter;
          if (cityFilter) config.params.ville = cityFilter;
          if (postTypeFilter) config.params.type_offre = postTypeFilter;
          if (contractTypeFilter)
            config.params.type_contrat = contractTypeFilter;
          if (jobFilter !== "all") config.params.statut = jobFilter;
        } else if (activeTab === 2) {
          // Opportunités d'affaires
          if (oppoCountryFilter) config.params.pays = oppoCountryFilter;
          if (oppoSectorFilter) config.params.secteur = oppoSectorFilter;
          if (oppoCityFilter) config.params.ville = oppoCityFilter;
          if (oppoTypeFilter) config.params.type_opportunite = oppoTypeFilter;
        }

        const response = await axios.get("/api/feed", config);

        const newPosts = response.data.posts || [];

        if (reset) {
          setPosts(newPosts);
          // Extraire les valeurs uniques pour les filtres
          extractUniqueValues(newPosts);
        } else {
          setPosts((prevPosts) => {
            const combinedPosts = [...prevPosts, ...newPosts];
            // Extraire les valeurs uniques pour les filtres
            extractUniqueValues(combinedPosts);
            return combinedPosts;
          });
        }

        if (newPosts.length > 0) {
          setLastId(newPosts[newPosts.length - 1].id);
        }

        setHasMore(response.data.has_more);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des publications:", err);

        // Vérifier si l'erreur est liée aux ressources insuffisantes
        const isResourceError =
          err.message &&
          (err.message.includes("ERR_INSUFFICIENT_RESOURCES") ||
            err.message.includes("ERR_NETWORK"));

        // Mécanisme de retry limité (maximum 2 tentatives et pas de retry pour les erreurs de ressources)
        if (retryCount < 2 && !isResourceError) {
          console.log(`Tentative de rechargement ${retryCount + 1}/2...`);
          // Utiliser un délai plus long entre les tentatives
          setTimeout(() => {
            fetchPosts(reset, retryCount + 1);
          }, 2000 * (retryCount + 1));
          return;
        }

        // Message d'erreur plus détaillé
        if (err.response) {
          // Erreur de réponse du serveur (ex: 500)
          setError(
            `Erreur serveur (${err.response.status}). Veuillez réessayer plus tard.`
          );
        } else if (isResourceError) {
          // Erreur spécifique aux ressources insuffisantes
          setError(
            "Le serveur est actuellement surchargé. Veuillez réessayer dans quelques instants."
          );
        } else if (err.request) {
          // Pas de réponse reçue du serveur
          setError(
            "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
          );
        } else {
          // Erreur lors de la configuration de la requête
          setError("Une erreur est survenue. Veuillez réessayer plus tard.");
        }
        setLoading(false);
      }
    },
    [
      activeTab,
      hasMore,
      lastId,
      limit,
      tabTypes,
      extractUniqueValues,
      searchQuery,
      // Filtres pour le fil d'actualités
      newsCountryFilter,
      newsCityFilter,
      newsTypeFilter,
      newsCategoryFilter,
      newsSubCategoryFilter,
      newsDeliveryFilter,
      newsStatusFilter,
      // Filtres pour les offres d'emploi
      countryFilter,
      sectorFilter,
      cityFilter,
      postTypeFilter,
      contractTypeFilter,
      jobFilter,
      // Filtres pour les opportunités d'affaires
      oppoCountryFilter,
      oppoSectorFilter,
      oppoCityFilter,
      oppoTypeFilter,
    ]
  );

  // Chargement des pages abonnées et recommandées
  const [subscribedPages, setSubscribedPages] = useState([]);
  const [recommendedPages, setRecommendedPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Charger les pages abonnées
  const fetchSubscribedPages = useCallback(async () => {
    try {
      const response = await axios.get("/api/pages/subscribed");
      setSubscribedPages(response.data.pages || []);
    } catch (err) {
      console.error("Erreur lors du chargement des pages abonnées:", err);
    }
  }, []);

  // Charger les pages recommandées
  const fetchRecommendedPages = useCallback(async () => {
    try {
      const response = await axios.get("/api/pages/recommended");
      // Filtrer les pages recommandées pour exclure la page de l'utilisateur actuel
      const filteredPages = (response.data.pages || []).filter((page) => {
        // Vérifier si la page appartient à l'utilisateur actuel
        return page.user_id !== user?.id;
      });

      setRecommendedPages(filteredPages);
    } catch (err) {
      console.error("Erreur lors du chargement des pages recommandées:", err);
    }
  }, [user?.id]);

  // S'abonner à une page
  const handleSubscribe = useCallback(async (pageId) => {
    try {
      await axios.post(`/api/pages/${pageId}/subscribe`);
      // Rafraîchir les listes de pages
      fetchSubscribedPages();
      fetchRecommendedPages();
      // Mettre à jour l'attribut is_subscribed dans les posts
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.page_id === pageId ? { ...post, is_subscribed: true } : post
        )
      );
    } catch (err) {
      console.error("Erreur lors de l'abonnement à la page:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se désabonner d'une page
  const handleUnsubscribe = useCallback(async (pageId) => {
    try {
      await axios.post(`/api/pages/${pageId}/unsubscribe`);
      // Rafraîchir les listes de pages
      fetchSubscribedPages();
      fetchRecommendedPages();
      // Mettre à jour l'attribut is_subscribed dans les posts
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.page_id === pageId ? { ...post, is_subscribed: false } : post
        )
      );
    } catch (err) {
      console.error("Erreur lors du désabonnement de la page:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialiser le chargement des posts et des pages
  useEffect(() => {
    // Utiliser une variable pour suivre si le composant est monté
    let isMounted = true;

    const initFetch = async () => {
      if (isMounted) {
        setLoadingPages(true);
        setPosts([]);
        setLastId(0);
        setHasMore(true);

        // Ajouter un petit délai pour éviter les appels simultanés
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted) {
          // Charger les posts et les pages en parallèle
          await Promise.all([
            fetchPosts(true),
            fetchSubscribedPages(),
            fetchRecommendedPages(),
          ]);

          setLoadingPages(false);
        }
      }
    };

    initFetch();

    // Nettoyage lors du démontage
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Ne dépendre que de activeTab pour éviter les boucles infinies

  // Configuration de l'intersection observer pour le défilement infini
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, fetchPosts]
  );

  // Gérer l'action "J'aime"
  const handleLike = async (postId, type) => {
    try {
      // Configuration pour la requête
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 8000, // Timeout raisonnable pour cette action simple
      };

      const response = await axios.post(
        `/api/${type}/${postId}/like`,
        {},
        config
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: response.data.liked,
                likes_count: response.data.likes_count,
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          is_liked: response.data.liked,
          likes_count: response.data.likes_count,
        });
      }
    } catch (err) {
      console.error("Erreur lors de l'action \"J'aime\":", err);

      // Gérer l'erreur silencieusement sans alerter l'utilisateur
      // pour une expérience utilisateur plus fluide
      if (err.response && err.response.status === 401) {
        // L'utilisateur n'est pas authentifié
        alert("Veuillez vous connecter pour aimer cette publication.");
      } else if (err.response && err.response.status === 429) {
        // Trop de requêtes
        console.warn(
          "Trop de requêtes. Veuillez patienter avant de réessayer."
        );
      }
      // Pour les autres erreurs, on ne montre pas d'alerte pour ne pas perturber l'expérience utilisateur
    }
  };

  // Gérer l'ajout d'un commentaire
  const handleAddComment = async (postId, content, type) => {
    try {
      const response = await axios.post(`/api/${type}/${postId}/comment`, {
        content,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: response.data.comments_count,
                comments: [response.data.comment, ...post.comments].slice(0, 3), // Garder les 3 commentaires les plus récents
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments_count: response.data.comments_count,
          comments: [response.data.comment, ...selectedPost.comments],
        });
      }

      return response.data.comment;
    } catch (err) {
      console.error("Erreur lors de l'ajout d'un commentaire:", err);
      throw err;
    }
  };

  // Gérer la suppression d'un commentaire
  const handleDeleteComment = async (commentId, postId, type) => {
    try {
      const response = await axios.delete(`/api/${type}/comments/${commentId}`);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments_count: response.data.comments_count,
                comments: post.comments.filter(
                  (comment) => comment.id !== commentId
                ),
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments_count: response.data.comments_count,
          comments: selectedPost.comments.filter(
            (comment) => comment.id !== commentId
          ),
        });
      }
    } catch (err) {
      console.error("Erreur lors de la suppression d'un commentaire:", err);
    }
  };

  // Gérer l'action "J'aime" sur un commentaire
  const handleCommentLike = async (commentId, postId) => {
    try {
      const response = await axios.post(`/api/comments/${commentId}/like`);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        is_liked: response.data.liked,
                        likes_count: response.data.likes_count,
                      }
                    : comment
                ),
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments: selectedPost.comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  is_liked: response.data.liked,
                  likes_count: response.data.likes_count,
                }
              : comment
          ),
        });
      }
    } catch (err) {
      console.error(
        "Erreur lors de l'action \"J'aime\" sur un commentaire:",
        err
      );
    }
  };

  // Gérer le partage d'un post
  const handleShare = async (type, postId, platform) => {
    try {
      const response = await axios.post(`/api/${type}/${postId}/share`, {
        platform,
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                shares_count: response.data.shares_count,
              }
            : post
        )
      );

      // Mettre à jour le post sélectionné si nécessaire
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          shares_count: response.data.shares_count,
        });
      }

      // Ouvrir le lien de partage approprié
      let shareUrl = "";
      const postUrl = `${window.location.origin}/dashboard/news-feed/post/${postId}`;
      const text = "Découvrez cette publication intéressante sur SOLIFIN!";

      switch (platform) {
        case "facebook":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            postUrl
          )}`;
          break;
        case "twitter":
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
          )}&url=${encodeURIComponent(postUrl)}`;
          break;
        case "linkedin":
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            postUrl
          )}`;
          break;
        case "whatsapp":
          shareUrl = `https://wa.me/?text=${encodeURIComponent(
            text + " " + postUrl
          )}`;
          break;
        default:
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank");
      }
    } catch (err) {
      console.error("Erreur lors du partage:", err);
    }
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

  return (
    <div className="w-full max-w-full lg:max-w-6xl mx-auto flex-grow transition-all duration-300">
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Fil d'actualités
        </h1>
        <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Découvrez les dernières actualités, offres d'emploi et opportunités
          d'affaires
        </p>
      </div>

      {/* Onglets de navigation */}
      <Tab.Group
        onChange={(index) => {
          // Mettre à jour l'onglet actif
          setActiveTab(index);

          // Réinitialiser la recherche et les filtres spécifiques à l'onglet précédent
          setSearchQuery("");

          // Réinitialiser les filtres en fonction de l'onglet sélectionné
          if (index === 0) {
            // Si on passe à l'onglet Publicités, réinitialiser les filtres des autres onglets
            resetFilters();
            resetOppoFilters();
          } else if (index === 1) {
            // Si on passe à l'onglet Offres d'emploi, réinitialiser les filtres des autres onglets
            resetNewsFilters();
            resetOppoFilters();
          } else if (index === 2) {
            // Si on passe à l'onglet Opportunités, réinitialiser les filtres des autres onglets
            resetNewsFilters();
            resetFilters();
          } else {
            // Pour les autres onglets, réinitialiser tous les filtres
            resetNewsFilters();
            resetFilters();
            resetOppoFilters();
          }

          // Recharger les publications avec les nouveaux paramètres
          fetchPosts(true);
        }}
      >
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-100 dark:bg-gray-800 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "flex items-center justify-center",
                selected
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600 dark:hover:text-white"
              )
            }
          >
            <NewspaperIcon className="h-5 w-5 mr-2" />
            Publicités
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "flex items-center justify-center",
                selected
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600 dark:hover:text-white"
              )
            }
          >
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Offres d'emploi
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "flex items-center justify-center",
                selected
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600 dark:hover:text-white"
              )
            }
          >
            <LightBulbIcon className="h-5 w-5 mr-2" />
            Opportunités
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "flex items-center justify-center",
                selected
                  ? "bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-primary-600 dark:hover:text-white"
              )
            }
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Pages
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          {/* Premier onglet: Fil d'actualité */}
          <Tab.Panel
            className={classNames(
              "rounded-xl p-3",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
          >
            {/* Filtres et recherche */}
            <div className="flex flex-wrap justify-between items-center gap-3 p-4 mb-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}">
              {/* Barre de recherche */}
              <div className="relative w-full md:w-1/3">
                <input
                  type="text"
                  placeholder="Rechercher une publication..."
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                {searchQuery && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery("")}
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
                  {showNewsFilters ? "Masquer les filtres" : "Filtres avancés"}
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
                    newsStatusFilter === "termine"
                      ? isDarkMode
                        ? "bg-red-600 text-white"
                        : "bg-red-500 text-white"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setNewsStatusFilter("termine")}
                >
                  <span className="text-sm">Terminées</span>
                </button>
              </div>
            </div>

            {/* Panneau de filtres avancés pour le fil d'actualités */}
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
                        onChange={(e) => setNewsCountryFilter(e.target.value)}
                      >
                        <option value="">Tous les pays</option>
                        {uniqueNewsCountries.map((country) => (
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
                        {uniqueNewsCities.map((city) => (
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
                        <option value="publicite">Publicité</option>
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
                        onChange={(e) => setNewsCategoryFilter(e.target.value)}
                      >
                        <option value="">Toutes les catégories</option>
                        <option value="produit">Produit</option>
                        <option value="service">Service</option>
                        {uniqueNewsCategories
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
                        {uniqueNewsSubCategories.map((subCategory) => (
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
                        onChange={(e) => setNewsDeliveryFilter(e.target.value)}
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

            {/* Liste des publications */}
            <div className="space-y-6">
              {error && (
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-red-900 text-red-200"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Filtrer les publications en fonction des critères de recherche et des filtres */}
              {(() => {
                // Filtrer les publications en fonction des critères de recherche et des filtres
                let filteredPosts = [...posts];

                // Filtrage pour le premier onglet (Publicités)
                if (activeTab === 0) {
                  // Filtrer par texte de recherche
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filteredPosts = filteredPosts.filter(
                      (post) =>
                        (post.titre &&
                          post.titre.toLowerCase().includes(query)) ||
                        (post.description &&
                          post.description.toLowerCase().includes(query)) ||
                        (post.contenu &&
                          post.contenu.toLowerCase().includes(query))
                    );
                  }

                  // Filtrer par pays
                  if (newsCountryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.pays === newsCountryFilter
                    );
                  }

                  // Filtrer par ville
                  if (newsCityFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.ville === newsCityFilter
                    );
                  }

                  // Filtrer par type (publicité ou annonce)
                  if (newsTypeFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.type === newsTypeFilter
                    );
                  }

                  // Filtrer par catégorie
                  if (newsCategoryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.categorie === newsCategoryFilter
                    );
                  }

                  // Filtrer par sous-catégorie
                  if (newsSubCategoryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) =>
                        post.sous_categorie === newsSubCategoryFilter ||
                        post.autre_sous_categorie === newsSubCategoryFilter
                    );
                  }

                  // Filtrer par besoin de livreurs
                  if (newsDeliveryFilter) {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.besoin_livreurs === newsDeliveryFilter
                    );
                  }

                  // Filtrer par statut
                  if (newsStatusFilter !== "all") {
                    filteredPosts = filteredPosts.filter(
                      (post) => post.etat === newsStatusFilter
                    );
                  }
                }

                // Afficher un message si aucune publication ne correspond aux critères
                if (filteredPosts.length === 0 && !loading) {
                  return (
                    <div
                      className={`p-6 rounded-lg text-center ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      <p className="text-lg font-medium">
                        Aucune publication ne correspond à vos critères
                      </p>
                      <p className="mt-2">
                        Essayez de modifier vos filtres ou votre recherche
                      </p>
                      <button
                        onClick={resetNewsFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ArrowPathIcon className="h-5 w-5 mr-2" />
                        Réinitialiser les filtres
                      </button>
                    </div>
                  );
                }

                // Si aucune publication n'est disponible (sans filtres)
                if (posts.length === 0 && !loading) {
                  return (
                    <div
                      className={`p-6 rounded-lg text-center ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      <p className="text-lg font-medium">
                        Aucune publication disponible
                      </p>
                      <p className="mt-2">
                        Soyez le premier à partager quelque chose !
                      </p>
                      <button
                        onClick={() => navigate("/dashboard/my-page")}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Créer une publication
                      </button>
                    </div>
                  );
                }

                // Afficher les publications filtrées
                return filteredPosts.map((post, index) => {
                  // Si c'est le dernier élément, ajouter la ref pour l'infinite scroll
                  if (index === posts.length - 1) {
                    return (
                      <div key={post.id} ref={lastPostElementRef}>
                        <PostCard
                          post={post}
                          onLike={handleLike}
                          onComment={handleAddComment}
                          onCommentLike={handleCommentLike}
                          onDeleteComment={handleDeleteComment}
                          onShare={handleShare}
                          onViewDetails={() =>
                            openPostDetail(post.id, post.type)
                          }
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleAddComment}
                        onCommentLike={handleCommentLike}
                        onDeleteComment={handleDeleteComment}
                        onShare={handleShare}
                        onViewDetails={() => openPostDetail(post.id, post.type)}
                        isDarkMode={isDarkMode}
                      />
                    );
                  }
                });
              })()}

              {loading && (
                <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Deuxième onglet: Offres d'emploi */}
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
                    sous quelque forme que ce soit (cash, virement, transfert
                    Western Union, mobile money,...). Merci de signaler
                    immédiatement toute demande suspecte.
                  </p>
                </div>
              </div>

              {/* Filtres et recherche */}
              <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                {/* Barre de recherche */}
                <div className="relative w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Rechercher une offre..."
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setSearchQuery("")}
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
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">
                    {showFilters ? "Masquer les filtres" : "Filtres avancés"}
                  </span>
                </button>

                {/* Filtres de statut */}
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "all"
                        ? isDarkMode
                          ? "bg-primary-600 text-white"
                          : "bg-primary-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("all")}
                  >
                    <span className="text-sm">Toutes</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "disponible"
                        ? isDarkMode
                          ? "bg-green-600 text-white"
                          : "bg-green-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("disponible")}
                  >
                    <span className="text-sm">En cours</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "recent"
                        ? isDarkMode
                          ? "bg-orange-600 text-white"
                          : "bg-orange-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("recent")}
                  >
                    <span className="text-sm">Récentes</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "expired"
                        ? isDarkMode
                          ? "bg-red-600 text-white"
                          : "bg-red-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("expired")}
                  >
                    <span className="text-sm">Expirées</span>
                  </button>
                </div>
              </div>

              {/* Panneau de filtres avancés */}
              {showFilters && (
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
                      onClick={resetFilters}
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
                          value={countryFilter}
                          onChange={(e) => setCountryFilter(e.target.value)}
                        >
                          <option value="">Tous les pays</option>
                          {uniqueCountries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {countryFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setCountryFilter("")}
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
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                        >
                          <option value="">Toutes les villes</option>
                          {uniqueCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {cityFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setCityFilter("")}
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
                          value={sectorFilter}
                          onChange={(e) => setSectorFilter(e.target.value)}
                        >
                          <option value="">Tous les secteurs</option>
                          {uniqueSectors.map((sector) => (
                            <option key={sector} value={sector}>
                              {sector}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {sectorFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setSectorFilter("")}
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
                          value={postTypeFilter}
                          onChange={(e) => setPostTypeFilter(e.target.value)}
                        >
                          <option value="">Tous les types</option>
                          <option value="offre_emploi">Offre d'emploi</option>
                          <option value="appel_manifestation_interet">
                            Appel à manifestation d'intérêt
                          </option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {postTypeFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setPostTypeFilter("")}
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
                          value={contractTypeFilter}
                          onChange={(e) =>
                            setContractTypeFilter(e.target.value)
                          }
                        >
                          <option value="">Tous les contrats</option>
                          {uniqueContractTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {contractTypeFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setContractTypeFilter("")}
                            title="Effacer la sélection"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicateurs de filtres actifs */}
                  {(countryFilter ||
                    sectorFilter ||
                    cityFilter ||
                    postTypeFilter ||
                    contractTypeFilter) && (
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
                        {countryFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Pays: {countryFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setCountryFilter("")}
                            />
                          </span>
                        )}
                        {cityFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Ville: {cityFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setCityFilter("")}
                            />
                          </span>
                        )}
                        {sectorFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Secteur: {sectorFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setSectorFilter("")}
                            />
                          </span>
                        )}
                        {postTypeFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Type:{" "}
                            {postTypeFilter === "offre_emploi"
                              ? "Offre d'emploi"
                              : "Appel à manifestation d'intérêt"}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setPostTypeFilter("")}
                            />
                          </span>
                        )}
                        {contractTypeFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Contrat: {contractTypeFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setContractTypeFilter("")}
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
                          ? "bg-gray-700 text-white border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      defaultValue="recent"
                    >
                      <option value="recent">Offres récentes</option>
                      <option value="oldest">Offres anciennes</option>
                      <option value="company">Organisme</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <ChevronDownIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des offres et appels à manifestation */}
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
              {loading ? (
                <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div>
                  {posts
                    .filter((post) => post.type === "offres-emploi")
                    // Filtre par texte de recherche
                    .filter((post) => {
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        return (
                          post.title?.toLowerCase().includes(query) ||
                          post.company_name?.toLowerCase().includes(query) ||
                          post.pays?.toLowerCase().includes(query) ||
                          post.ville?.toLowerCase().includes(query) ||
                          post.reference?.toLowerCase().includes(query) ||
                          post.sector?.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    })
                    // Filtre par statut
                    .filter((post) => {
                      if (jobFilter === "all") return true;
                      if (jobFilter === "disponible")
                        return post.etat === "disponible";
                      if (jobFilter === "recent") {
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                        return new Date(post.created_at) >= threeDaysAgo;
                      }
                      if (jobFilter === "expired")
                        return post.statut === "expiré";
                      return true;
                    })
                    // Filtre par pays
                    .filter((post) => {
                      if (!countryFilter) return true;
                      return post.pays === countryFilter;
                    })
                    // Filtre par secteur
                    .filter((post) => {
                      if (!sectorFilter) return true;
                      return post.sector === sectorFilter;
                    })
                    // Filtre par ville
                    .filter((post) => {
                      if (!cityFilter) return true;
                      return post.ville === cityFilter;
                    })
                    // Filtre par type de publication
                    .filter((post) => {
                      if (!postTypeFilter) return true;
                      return post.post_type === postTypeFilter;
                    })
                    // Filtre par type de contrat
                    .filter((post) => {
                      if (!contractTypeFilter) return true;
                      return post.type_contrat === contractTypeFilter;
                    })
                    .map((post) => (
                      <div
                        key={post.id}
                        className={`grid grid-cols-12 gap-4 p-4 cursor-pointer hover:${
                          isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        } border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                        onClick={() => openPostDetail(post.id, post.type)}
                      >
                        <div className="col-span-6 sm:col-span-5">
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                                post.status === "disponible"
                                  ? "bg-green-500"
                                  : post.status === "expired"
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
                                {post.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {post.reference || "Réf. non précisée"}
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
                            {post.company_name || "Non précisé"}
                          </div>
                        </div>
                        <div className="col-span-3 sm:col-span-2 hidden sm:block">
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {post.pays || "Non précisé"}
                          </div>
                        </div>
                        <div className="col-span-6 sm:col-span-2 text-right">
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {post.date_limite
                              ? new Date(post.date_limite).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
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
                                handleLike(post.id, post.type);
                              }}
                            >
                              {post.is_liked ? (
                                <HeartIconSolid className="h-4 w-4 text-red-500 mr-1" />
                              ) : (
                                <HeartIcon className="h-4 w-4 mr-1" />
                              )}
                              <span>{post.likes_count || 0}</span>
                            </button>

                            <button
                              className="flex items-center mr-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPostDetail(post.id, post.type);
                              }}
                            >
                              <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                              <span>{post.comments_count || 0}</span>
                            </button>

                            <button
                              className="flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(post.id, post.type);
                              }}
                            >
                              <ShareIcon className="h-4 w-4 mr-1" />
                              <span>{post.shares_count || 0}</span>
                            </button>
                          </div>

                          {/* Boutons d'action (Détails, Télécharger, WhatsApp, lien externe) */}
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
                                openPostDetail(post.id, post.type);
                              }}
                            >
                              <InformationCircleIcon className="w-4 h-4" />
                            </button>

                            {/* Bouton Télécharger */}
                            {post.offer_file_url && (
                              <a
                                href={post.offer_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-1 rounded-full ${
                                  isDarkMode
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : "bg-purple-500 hover:bg-purple-600"
                                } text-white`}
                                title="Télécharger l'offre"
                                onClick={(e) => e.stopPropagation()}
                                download
                              >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                              </a>
                            )}

                            {/* Bouton WhatsApp */}
                            {post.whatsapp && (
                              <a
                                href={`https://wa.me/${post.whatsapp.replace(
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
                            {post.external_link && (
                              <a
                                href={post.external_link}
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
                    ))}
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Troisième onglet: Opportunités d'affaires /partenariat et appel à projet */}
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
                    avant tout engagement. Assurez-vous de bien comprendre les
                    termes et conditions de chaque opportunité.
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setSearchQuery("")}
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
                  onClick={() => setShowOppoFilters(!showOppoFilters)}
                >
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm">
                    {showOppoFilters
                      ? "Masquer les filtres"
                      : "Filtres avancés"}
                  </span>
                </button>

                {/* Filtres de statut */}
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "all"
                        ? isDarkMode
                          ? "bg-primary-600 text-white"
                          : "bg-primary-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("all")}
                  >
                    <span className="text-sm">Toutes</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "disponible"
                        ? isDarkMode
                          ? "bg-green-600 text-white"
                          : "bg-green-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("disponible")}
                  >
                    <span className="text-sm">En cours</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "recent"
                        ? isDarkMode
                          ? "bg-orange-600 text-white"
                          : "bg-orange-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("recent")}
                  >
                    <span className="text-sm">Récentes</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md flex items-center justify-center transition-colors ${
                      jobFilter === "expired"
                        ? isDarkMode
                          ? "bg-red-600 text-white"
                          : "bg-red-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    onClick={() => setJobFilter("expired")}
                  >
                    <span className="text-sm">Expirées</span>
                  </button>
                </div>
              </div>

              {/* Panneau de filtres avancés pour les opportunités d'affaires */}
              {showOppoFilters && (
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
                      onClick={resetOppoFilters}
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
                          value={oppoCountryFilter}
                          onChange={(e) => setOppoCountryFilter(e.target.value)}
                        >
                          <option value="">Tous les pays</option>
                          {uniqueOppoCountries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {oppoCountryFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoCountryFilter("")}
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
                          value={oppoCityFilter}
                          onChange={(e) => setOppoCityFilter(e.target.value)}
                        >
                          <option value="">Toutes les villes</option>
                          {uniqueOppoCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {oppoCityFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoCityFilter("")}
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
                          value={oppoSectorFilter}
                          onChange={(e) => setOppoSectorFilter(e.target.value)}
                        >
                          <option value="">Tous les secteurs</option>
                          {uniqueOppoSectors.map((sector) => (
                            <option key={sector} value={sector}>
                              {sector}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {oppoSectorFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoSectorFilter("")}
                            title="Effacer la sélection"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filtre par type d'opportunité */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Type d'opportunité
                      </label>
                      <div className="relative">
                        <select
                          className={`block w-full px-3 py-2 pr-8 rounded border ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          value={oppoTypeFilter}
                          onChange={(e) => setOppoTypeFilter(e.target.value)}
                        >
                          <option value="">Tous les types</option>
                          <option value="opportunité">Opportunités</option>
                          <option value="appel_projet">Appel à projet</option>
                          <option value="partenariat">Partenariat</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                        {oppoTypeFilter && (
                          <button
                            className="absolute inset-y-0 right-0 pr-8 flex items-center"
                            onClick={() => setOppoTypeFilter("")}
                            title="Effacer la sélection"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Indicateurs de filtres actifs */}
                  {(oppoCountryFilter ||
                    oppoSectorFilter ||
                    oppoCityFilter ||
                    oppoTypeFilter) && (
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
                        {oppoCountryFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Pays: {oppoCountryFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoCountryFilter("")}
                            />
                          </span>
                        )}
                        {oppoCityFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Ville: {oppoCityFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoCityFilter("")}
                            />
                          </span>
                        )}
                        {oppoSectorFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Secteur: {oppoSectorFilter}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoSectorFilter("")}
                            />
                          </span>
                        )}
                        {oppoTypeFilter && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-gray-200 text-gray-800"
                            }`}
                          >
                            Type:{" "}
                            {oppoTypeFilter === "appel_offre"
                              ? "Appel d'offre"
                              : oppoTypeFilter === "appel_projet"
                              ? "Appel à projet"
                              : "Partenariat"}
                            <XMarkIcon
                              className="h-3 w-3 ml-1 cursor-pointer"
                              onClick={() => setOppoTypeFilter("")}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
                      {posts
                        .filter((post) => post.type === "opportunites-affaires")
                        // Filtre par texte de recherche
                        .filter((post) => {
                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            return (
                              post.title?.toLowerCase().includes(query) ||
                              post.entreprise?.toLowerCase().includes(query) ||
                              post.description?.toLowerCase().includes(query) ||
                              post.pays?.toLowerCase().includes(query) ||
                              post.ville?.toLowerCase().includes(query) ||
                              post.secteur?.toLowerCase().includes(query) ||
                              post.post_type?.toLowerCase().includes(query)
                            );
                          }
                          return true;
                        })
                        // Filtre de statut
                        .filter((post) => {
                          if (jobFilter === "all") return true;
                          if (jobFilter === "disponible")
                            return !post.is_expired;
                          if (jobFilter === "expired") return post.is_expired;
                          if (jobFilter === "recent")
                            return (
                              new Date(post.created_at) >
                              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            );
                          return true;
                        })
                        // Filtre par pays
                        .filter((post) => {
                          if (!oppoCountryFilter) return true;
                          return post.pays === oppoCountryFilter;
                        })
                        // Filtre par secteur
                        .filter((post) => {
                          if (!oppoSectorFilter) return true;
                          return post.secteur === oppoSectorFilter;
                        })
                        // Filtre par ville
                        .filter((post) => {
                          if (!oppoCityFilter) return true;
                          return post.ville === oppoCityFilter;
                        })
                        // Filtre par type d'opportunité
                        .filter((post) => {
                          if (!oppoTypeFilter) return true;
                          return post.post_type === oppoTypeFilter;
                        })
                        .map((post) => (
                          <tr
                            key={post.id}
                            className={`hover:${
                              isDarkMode ? "bg-gray-700" : "bg-gray-50"
                            } cursor-pointer`}
                            onClick={() => openPostDetail(post.id, post.type)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                                    post.status === "disponible"
                                      ? "bg-green-500"
                                      : post.status === "expired"
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
                                    {post.title || "Non précisé"}
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
                                  post.post_type === "appel_offre"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : post.post_type === "appel_projet"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}
                              >
                                {post.post_type === "appel_offre"
                                  ? "Appel d'offre"
                                  : post.post_type === "appel_projet"
                                  ? "Appel à projet"
                                  : "Partenariat"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {post.company_name || "Non précisé"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                              <div
                                className={`text-sm ${
                                  post.is_expired
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
                                    handleLike(post.id, post.type);
                                  }}
                                  className={`flex items-center ${
                                    post.is_liked
                                      ? "text-red-500"
                                      : isDarkMode
                                      ? "text-gray-400 hover:text-gray-300"
                                      : "text-gray-500 hover:text-gray-700"
                                  }`}
                                  title="J'aime"
                                >
                                  {post.is_liked ? (
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
                                      post.type,
                                      "comments"
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
                                    handleShare(post.type, post.id, "facebook");
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
                                    openPostDetail(post.id, post.type);
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
                                {post.whatsapp && (
                                  <a
                                    href={`https://wa.me/${post.whatsapp.replace(
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
                                {post.external_link && (
                                  <a
                                    href={post.external_link}
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
                        ))}
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
                  <span>Cliquez sur une opportunité pour voir les détails</span>
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

          {/* Quatrième onglet: Pages */}
          <Tab.Panel
            className={classNames(
              "rounded-xl p-3",
              "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
          >
            <div
              className={`rounded-lg shadow p-4 ${
                isDarkMode ? "bg-[#1f2937]" : "bg-white"
              }`}
            >
              <div className="mb-6">
                <h2
                  className={`text-xl font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Découvrir des Pages
                </h2>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Suggestions
                </h3>

                {loadingPages ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pages recommandées */}
                    {recommendedPages.length > 0 ? (
                      recommendedPages.map((page) => (
                        <div
                          key={page.id}
                          className={`rounded-lg overflow-hidden shadow-md ${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          } cursor-pointer group`}
                        >
                          {/* Image de couverture avec photo de profil superposée */}
                          <div
                            className="relative h-40 w-full"
                            onClick={() =>
                              navigate(`/dashboard/pages/${page.id}`)
                            }
                          >
                            <button
                              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-70"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/pages/${page.id}`);
                              }}
                            >
                              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-white" />
                            </button>
                            <div
                              className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                              style={{
                                backgroundImage: page.photo_de_couverture
                                  ? `url(${page.photo_de_couverture})`
                                  : "url(https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80)",
                              }}
                            ></div>

                            {/* Photo de profil superposée sur la photo de couverture */}
                            <div className="absolute -bottom-8 left-4">
                              <div
                                className={`h-16 w-16 rounded-full border-4 ${
                                  isDarkMode
                                    ? "border-gray-800"
                                    : "border-white"
                                } overflow-hidden bg-white dark:bg-gray-700`}
                              >
                                {page.user?.picture ? (
                                  <img
                                    src={page.user.picture}
                                    alt={page.user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      page.user?.name || "Page"
                                    )}&background=${
                                      isDarkMode ? "374151" : "F3F4F6"
                                    }&color=${
                                      isDarkMode ? "FFFFFF" : "1F2937"
                                    }&size=128`}
                                    alt={page.user?.name || "Page"}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contenu de la carte */}
                          <div
                            className="p-4 pt-10"
                            onClick={() =>
                              navigate(`/dashboard/pages/${page.id}`)
                            }
                          >
                            <div className="flex flex-col">
                              {/* Informations de la page */}
                              <div className="flex-1">
                                <h3
                                  className={`text-lg font-bold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {page.user?.name || "Page sans nom"}
                                </h3>
                                <p
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Personnalité publique
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isDarkMode
                                      ? "text-gray-500"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {page.nombre_abonnes > 0 ? (
                                    <>
                                      {page.nombre_abonnes}{" "}
                                      {page.nombre_abonnes > 1
                                        ? "personnes aiment"
                                        : "personne aime"}{" "}
                                      cette Page
                                    </>
                                  ) : (
                                    "Soyez le premier à aimer cette Page"
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Bouton d'abonnement */}
                            <button
                              onClick={() => handleSubscribe(page.id)}
                              className={`w-full mt-4 py-2 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
                                isDarkMode
                                  ? "bg-gray-700 text-white hover:bg-gray-600"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              }`}
                            >
                              S'abonner
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p
                        className={`col-span-full text-center py-6 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Aucune page recommandée pour le moment.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Pages que vous suivez
                </h3>

                {loadingPages ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pages auxquelles l'utilisateur est abonné */}
                    {subscribedPages.length > 0 ? (
                      subscribedPages.map((page) => (
                        <div
                          key={page.id}
                          className={`rounded-lg overflow-hidden shadow-md ${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          } cursor-pointer group`}
                        >
                          {/* Image de couverture avec photo de profil superposée */}
                          <div
                            className="relative h-40 w-full"
                            onClick={() =>
                              navigate(`/dashboard/pages/${page.id}`)
                            }
                          >
                            <button
                              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-70"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/pages/${page.id}`);
                              }}
                            >
                              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-white" />
                            </button>
                            <div
                              className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                              style={{
                                backgroundImage: page.photo_de_couverture
                                  ? `url(${page.photo_de_couverture})`
                                  : "url(https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80)",
                              }}
                            ></div>

                            {/* Photo de profil superposée sur la photo de couverture */}
                            <div className="absolute -bottom-8 left-4">
                              <div
                                className={`h-16 w-16 rounded-full border-4 ${
                                  isDarkMode
                                    ? "border-gray-800"
                                    : "border-white"
                                } overflow-hidden bg-white dark:bg-gray-700`}
                              >
                                {page.user?.picture ? (
                                  <img
                                    src={page.user.picture}
                                    alt={page.user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      page.user?.name || "Page"
                                    )}&background=${
                                      isDarkMode ? "374151" : "F3F4F6"
                                    }&color=${
                                      isDarkMode ? "FFFFFF" : "1F2937"
                                    }&size=128`}
                                    alt={page.user?.name || "Page"}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contenu de la carte */}
                          <div
                            className="p-4 pt-10"
                            onClick={() =>
                              navigate(`/dashboard/pages/${page.id}`)
                            }
                          >
                            <div className="flex flex-col">
                              {/* Informations de la page */}
                              <div className="flex-1">
                                <h3
                                  className={`text-lg font-bold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {page.user?.name || "Page sans nom"}
                                </h3>
                                <p
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Personnalité publique
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isDarkMode
                                      ? "text-gray-500"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {page.nombre_abonnes > 0 ? (
                                    <>
                                      {page.nombre_abonnes}{" "}
                                      {page.nombre_abonnes > 1
                                        ? "personnes aiment"
                                        : "personne aime"}{" "}
                                      cette Page
                                    </>
                                  ) : (
                                    "Soyez le premier à aimer cette Page"
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Bouton de désabonnement */}
                            <button
                              onClick={() => handleUnsubscribe(page.id)}
                              className={`w-full mt-4 py-2 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
                                isDarkMode
                                  ? "bg-gray-700 text-white hover:bg-gray-600"
                                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                              }`}
                            >
                              Se désabonner
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p
                        className={`col-span-full text-center py-6 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Vous ne suivez aucune page pour le moment.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal pour afficher les détails d'une publication */}
      {selectedPost && (
        <PostDetailModal
          isOpen={isPostDetailModalOpen}
          onClose={() => setIsPostDetailModalOpen(false)}
          post={selectedPost}
          onLike={handleLike}
          onComment={handleAddComment}
          onCommentLike={handleCommentLike}
          onDeleteComment={handleDeleteComment}
          onShare={handleShare}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
