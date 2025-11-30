import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "../../../utils/axios";

export default function PageSearch() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subscribedPages, setSubscribedPages] = useState([]);
  const [recommendedPages, setRecommendedPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  
  // États pour la pagination
  const [searchPagination, setSearchPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });
  const [recommendedPagination, setRecommendedPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });
  const [subscribedPagination, setSubscribedPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10
  });

  // Charger les pages abonnées
  const fetchSubscribedPages = useCallback(async (page = 1) => {
    try {
      const response = await axios.get(`/api/pages/subscribed?page=${page}&per_page=10`);
      
      if (page === 1) {
        // Remplacer les pages si c'est la première page
        setSubscribedPages(response.data.pages || []);
      } else {
        // Ajouter les pages aux pages existantes si c'est une page suivante
        setSubscribedPages(prevPages => [...prevPages, ...(response.data.pages || [])]);
      }
      
      // Mettre à jour les informations de pagination
      setSubscribedPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
        perPage: response.data.per_page
      });
    } catch (err) {
      console.error("Erreur lors du chargement des pages abonnées:", err);
    }
  }, []);

  // Charger les pages recommandées
  const fetchRecommendedPages = useCallback(async (page = 1) => {
    try {
      const response = await axios.get(`/api/pages/recommended?page=${page}&per_page=10`);
      
      // Filtrer les pages recommandées pour exclure la page de l'utilisateur actuel
      const filteredPages = (response.data.pages || []).filter((page) => {
        // Vérifier si la page appartient à l'utilisateur actuel
        return page.user_id !== user?.id;
      });

      if (page === 1) {
        // Remplacer les pages si c'est la première page
        setRecommendedPages(filteredPages);
      } else {
        // Ajouter les pages aux pages existantes si c'est une page suivante
        setRecommendedPages(prevPages => [...prevPages, ...filteredPages]);
      }
      
      // Mettre à jour les informations de pagination
      setRecommendedPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
        perPage: response.data.per_page
      });
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
    } catch (err) {
      console.error("Erreur lors de l'abonnement à la page:", err);
    }
  }, [fetchSubscribedPages, fetchRecommendedPages]);

  // Se désabonner d'une page
  const handleUnsubscribe = useCallback(async (pageId) => {
    try {
      await axios.post(`/api/pages/${pageId}/unsubscribe`);
      // Rafraîchir les listes de pages
      fetchSubscribedPages();
      fetchRecommendedPages();
    } catch (err) {
      console.error("Erreur lors du désabonnement de la page:", err);
    }
  }, [fetchSubscribedPages, fetchRecommendedPages]);

  // Rechercher des pages par nom d'utilisateur
  const searchPages = useCallback(async (query, page = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/pages/search?query=${encodeURIComponent(query)}&page=${page}&per_page=10`);
      
      if (page === 1) {
        // Remplacer les résultats si c'est la première page
        setSearchResults(response.data.pages || []);
      } else {
        // Ajouter les résultats aux résultats existants si c'est une page suivante
        setSearchResults(prevResults => [...prevResults, ...(response.data.pages || [])]);
      }
      
      // Mettre à jour les informations de pagination
      setSearchPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
        perPage: response.data.per_page
      });
    } catch (err) {
      console.error("Erreur lors de la recherche de pages:", err);
      if (page === 1) {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Gérer le changement dans le champ de recherche
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Rechercher après un court délai pour éviter trop d'appels API
    const timeoutId = setTimeout(() => {
      searchPages(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Initialiser le chargement des pages
  useEffect(() => {
    let isMounted = true;

    const initFetch = async () => {
      if (isMounted) {
        setLoadingPages(true);

        // Ajouter un petit délai pour éviter les appels simultanés
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (isMounted) {
          // Charger les pages en parallèle
          await Promise.all([
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
  }, [fetchSubscribedPages, fetchRecommendedPages]);

  // Rendu d'une carte de page
  const renderPageCard = (page, isSubscribed) => (
    <div
      key={page.id}
      className={`rounded-lg overflow-hidden shadow-md ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } cursor-pointer group`}
    >
      {/* Image de couverture avec photo de profil superposée */}
      <div
        className="relative h-40 w-full"
        onClick={() => navigate(`/dashboard/pages/${page.id}`)}
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
              isDarkMode ? "border-gray-800" : "border-white"
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
                )}&background=${isDarkMode ? "374151" : "F3F4F6"}&color=${
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
        onClick={() => navigate(`/dashboard/pages/${page.id}`)}
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
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Personnalité publique
            </p>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-gray-500" : "text-gray-600"
              }`}
            >
              {page.nombre_abonnes > 0 ? (
                <>
                  {page.nombre_abonnes}{" "}
                  {page.nombre_abonnes > 1 ? "personnes aiment" : "personne aime"}{" "}
                  cette Page
                </>
              ) : (
                "Soyez le premier à aimer cette Page"
              )}
            </p>
          </div>
        </div>

        {/* Bouton d'abonnement ou de désabonnement */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isSubscribed ? handleUnsubscribe(page.id) : handleSubscribe(page.id);
          }}
          className={`w-full mt-4 py-2 px-4 rounded-md flex items-center justify-center font-medium transition-colors ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {isSubscribed ? "Se désabonner" : "S'abonner"}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`rounded-lg shadow p-4 ${isDarkMode ? "bg-[#1f2937]" : "bg-white"}`}>
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Rechercher des pages par nom d'utilisateur..."
            className={`block w-full pl-10 pr-3 py-2 border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
          />
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchQuery && (
        <div className="mb-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Résultats de recherche
          </h3>

          {isSearching ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.length > 0 ? (
                searchResults.map((page) => {
                  // Vérifier si l'utilisateur est abonné à cette page
                  const isSubscribed = subscribedPages.some((subPage) => subPage.id === page.id);
                  return renderPageCard(page, isSubscribed);
                })
              ) : (
                <p className={`col-span-full text-center py-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucune page trouvée pour cette recherche.
                </p>
              )}
              
              {/* Pagination pour les résultats de recherche */}
              {searchResults.length > 0 && searchPagination.lastPage > 1 && (
                <div className="col-span-full flex justify-center mt-4 space-x-2">
                  <button
                    onClick={() => searchPages(searchQuery, Math.max(1, searchPagination.currentPage - 1))}
                    disabled={searchPagination.currentPage === 1}
                    className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${searchPagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Précédent
                  </button>
                  <span className={`px-3 py-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                    {searchPagination.currentPage} / {searchPagination.lastPage}
                  </span>
                  <button
                    onClick={() => searchPages(searchQuery, Math.min(searchPagination.lastPage, searchPagination.currentPage + 1))}
                    disabled={searchPagination.currentPage === searchPagination.lastPage}
                    className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${searchPagination.currentPage === searchPagination.lastPage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Suivant
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pages recommandées */}
      <div className="mb-6">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Découvrir des Pages
        </h2>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Suggestions
        </h3>

        {loadingPages ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPages.length > 0 ? (
              recommendedPages.map((page) => renderPageCard(page, false))
            ) : (
              <p className={`col-span-full text-center py-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucune page recommandée pour le moment.
              </p>
            )}
            
            {/* Pagination pour les pages recommandées */}
            {recommendedPages.length > 0 && recommendedPagination.lastPage > 1 && (
              <div className="col-span-full flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => fetchRecommendedPages(Math.max(1, recommendedPagination.currentPage - 1))}
                  disabled={recommendedPagination.currentPage === 1}
                  className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${recommendedPagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Précédent
                </button>
                <span className={`px-3 py-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {recommendedPagination.currentPage} / {recommendedPagination.lastPage}
                </span>
                <button
                  onClick={() => fetchRecommendedPages(Math.min(recommendedPagination.lastPage, recommendedPagination.currentPage + 1))}
                  disabled={recommendedPagination.currentPage === recommendedPagination.lastPage}
                  className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${recommendedPagination.currentPage === recommendedPagination.lastPage ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pages suivies */}
      <div className="mt-8">
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Pages que vous suivez
        </h3>

        {loadingPages ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscribedPages.length > 0 ? (
              subscribedPages.map((page) => renderPageCard(page, true))
            ) : (
              <p className={`col-span-full text-center py-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Vous ne suivez aucune page pour le moment.
              </p>
            )}
            
            {/* Pagination pour les pages abonnées */}
            {subscribedPages.length > 0 && subscribedPagination.lastPage > 1 && (
              <div className="col-span-full flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => fetchSubscribedPages(Math.max(1, subscribedPagination.currentPage - 1))}
                  disabled={subscribedPagination.currentPage === 1}
                  className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${subscribedPagination.currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Précédent
                </button>
                <span className={`px-3 py-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {subscribedPagination.currentPage} / {subscribedPagination.lastPage}
                </span>
                <button
                  onClick={() => fetchSubscribedPages(Math.min(subscribedPagination.lastPage, subscribedPagination.currentPage + 1))}
                  disabled={subscribedPagination.currentPage === subscribedPagination.lastPage}
                  className={`flex items-center px-3 py-1 rounded-md ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"} ${subscribedPagination.currentPage === subscribedPagination.lastPage ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Suivant
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
