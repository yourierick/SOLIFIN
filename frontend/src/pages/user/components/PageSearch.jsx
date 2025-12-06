import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, ArrowTopRightOnSquareIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "../../../utils/axios";
import { Box, Typography, FormControl, Select, MenuItem, Pagination as MuiPagination } from "@mui/material";

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
    perPage: 6
  });
  const [recommendedPagination, setRecommendedPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 6
  });
  const [subscribedPagination, setSubscribedPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 6
  });

  // Charger les pages abonnées
  const fetchSubscribedPages = useCallback(async (page = 1, perPage = subscribedPagination.perPage) => {
    try {
      const response = await axios.get(`/api/pages/subscribed?page=${page}&per_page=${perPage}`);
      
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
  }, [subscribedPagination.perPage]);

  // Charger les pages recommandées
  const fetchRecommendedPages = useCallback(async (page = 1, perPage = recommendedPagination.perPage) => {
    try {
      const response = await axios.get(`/api/pages/recommended?page=${page}&per_page=${perPage}`);
      
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
  }, [user?.id, recommendedPagination.perPage]);

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
  const searchPages = useCallback(async (query, page = 1, perPage = searchPagination.perPage) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: searchPagination.perPage
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/pages/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`);
      
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
  }, [searchPagination.perPage]);

  // Gestionnaires de pagination
  const handleSearchPageChange = async (newPage) => {
    setSearchPagination(prev => ({ ...prev, currentPage: newPage }));
    await searchPages(searchQuery, newPage, searchPagination.perPage);
  };

  const handleSearchRowsPerPageChange = async (newPerPage) => {
    setSearchPagination(prev => ({ ...prev, perPage: newPerPage, currentPage: 1 }));
    await searchPages(searchQuery, 1, newPerPage);
  };

  const handleRecommendedPageChange = async (newPage) => {
    setRecommendedPagination(prev => ({ ...prev, currentPage: newPage }));
    await fetchRecommendedPages(newPage, recommendedPagination.perPage);
  };

  const handleRecommendedRowsPerPageChange = async (newPerPage) => {
    setRecommendedPagination(prev => ({ ...prev, perPage: newPerPage, currentPage: 1 }));
    await fetchRecommendedPages(1, newPerPage);
  };

  const handleSubscribedPageChange = async (newPage) => {
    setSubscribedPagination(prev => ({ ...prev, currentPage: newPage }));
    await fetchSubscribedPages(newPage, subscribedPagination.perPage);
  };

  const handleSubscribedRowsPerPageChange = async (newPerPage) => {
    setSubscribedPagination(prev => ({ ...prev, perPage: newPerPage, currentPage: 1 }));
    await fetchSubscribedPages(1, newPerPage);
  };

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
      className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
      } cursor-pointer group`}
    >
      {/* Image de couverture avec photo de profil superposée */}
      <div
        className="relative h-48 w-full"
        onClick={() => navigate(`/dashboard/pages/${page.id}`)}
      >
        <button
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/pages/${page.id}`);
          }}
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-white" />
        </button>
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: page.photo_de_couverture
              ? `url(${page.photo_de_couverture})`
              : "url(https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Photo de profil superposée sur la photo de couverture */}
        <div className="absolute -bottom-10 left-4">
          <div
            className={`h-20 w-20 rounded-full border-4 ${
              isDarkMode ? "border-gray-800" : "border-white"
            } overflow-hidden bg-white dark:bg-gray-700 shadow-lg ring-2 ring-offset-2 ${
              isDarkMode ? "ring-gray-700 ring-offset-gray-800" : "ring-blue-500 ring-offset-white"
            }`}
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
                )}&background=${isDarkMode ? "374151" : "3B82F6"}&color=${
                  isDarkMode ? "FFFFFF" : "FFFFFF"
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
        className="p-5 pt-12"
        onClick={() => navigate(`/dashboard/pages/${page.id}`)}
      >
        <div className="flex flex-col">
          {/* Informations de la page */}
          <div className="flex-1">
            <h3
              className={`text-xl font-bold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {page.user?.name || "Page sans nom"}
            </h3>
            <p
              className={`text-sm font-medium mb-3 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Personnalité publique
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`h-2 w-2 rounded-full ${
                isDarkMode ? "bg-green-400" : "bg-green-500"
              }`}></div>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {page.nombre_abonnes > 0 ? (
                  <>
                    <span className="font-semibold">{page.nombre_abonnes}</span>{" "}
                    {page.nombre_abonnes > 1 ? "abonnés" : "abonné"}
                  </>
                ) : (
                  "Soyez le premier à vous abonner"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton d'abonnement ou de désabonnement */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isSubscribed ? handleUnsubscribe(page.id) : handleSubscribe(page.id);
          }}
          className={`w-full mt-4 py-3 px-4 rounded-lg flex items-center justify-center font-semibold transition-all duration-200 transform hover:scale-105 ${
            isSubscribed
              ? isDarkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {isSubscribed ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Se désabonner
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              S'abonner
            </>
          )}
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
                <p className={`col-span-full text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Aucune page trouvée pour cette recherche.
                </p>
              )}
              
              {/* Pagination Material-UI pour les résultats de recherche */}
              {searchResults.length > 0 && searchPagination.lastPage > 1 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 6, px: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                      Afficher
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={searchPagination.perPage}
                        onChange={(e) => handleSearchRowsPerPageChange(parseInt(e.target.value, 10))}
                        sx={{
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: isDarkMode ? "#4B5563" : "#3B82F6",
                          },
                          "& .MuiSvgIcon-root": {
                            color: isDarkMode ? "#9CA3AF" : "#6B7280",
                          },
                        }}
                      >
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={6}>6</MenuItem>
                        <MenuItem value={9}>9</MenuItem>
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                      résultats par page
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                      {searchPagination.total > 0
                        ? `${(searchPagination.currentPage - 1) * searchPagination.perPage + 1}-${Math.min(searchPagination.currentPage * searchPagination.perPage, searchPagination.total)} sur ${searchPagination.total}`
                        : "0 résultats"}
                    </Typography>
                    <MuiPagination
                      count={searchPagination.lastPage}
                      page={searchPagination.currentPage}
                      onChange={(e, newPage) => handleSearchPageChange(newPage)}
                      color="primary"
                      size="medium"
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
              <p className={`col-span-full text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Aucune page recommandée pour le moment.
              </p>
            )}
            
            {/* Pagination Material-UI pour les pages recommandées */}
            {recommendedPages.length > 0 && recommendedPagination.lastPage > 1 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 6, px: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    Afficher
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={recommendedPagination.perPage}
                      onChange={(e) => handleRecommendedRowsPerPageChange(parseInt(e.target.value, 10))}
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: isDarkMode ? "#4B5563" : "#3B82F6",
                        },
                        "& .MuiSvgIcon-root": {
                          color: isDarkMode ? "#9CA3AF" : "#6B7280",
                        },
                      }}
                    >
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={9}>9</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    résultats par page
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    {recommendedPagination.total > 0
                      ? `${(recommendedPagination.currentPage - 1) * recommendedPagination.perPage + 1}-${Math.min(recommendedPagination.currentPage * recommendedPagination.perPage, recommendedPagination.total)} sur ${recommendedPagination.total}`
                      : "0 résultats"}
                  </Typography>
                  <MuiPagination
                    count={recommendedPagination.lastPage}
                    page={recommendedPagination.currentPage}
                    onChange={(e, newPage) => handleRecommendedPageChange(newPage)}
                    color="primary"
                    size="medium"
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
              <p className={`col-span-full text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Vous ne suivez aucune page pour le moment.
              </p>
            )}
            
            {/* Pagination Material-UI pour les pages abonnées */}
            {subscribedPages.length > 0 && subscribedPagination.lastPage > 1 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 6, px: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    Afficher
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <Select
                      value={subscribedPagination.perPage}
                      onChange={(e) => handleSubscribedRowsPerPageChange(parseInt(e.target.value, 10))}
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: isDarkMode ? "#4B5563" : "#3B82F6",
                        },
                        "& .MuiSvgIcon-root": {
                          color: isDarkMode ? "#9CA3AF" : "#6B7280",
                        },
                      }}
                    >
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={9}>9</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={24}>24</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    résultats par page
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "text.secondary" : "text.secondary" }}>
                    {subscribedPagination.total > 0
                      ? `${(subscribedPagination.currentPage - 1) * subscribedPagination.perPage + 1}-${Math.min(subscribedPagination.currentPage * subscribedPagination.perPage, subscribedPagination.total)} sur ${subscribedPagination.total}`
                      : "0 résultats"}
                  </Typography>
                  <MuiPagination
                    count={subscribedPagination.lastPage}
                    page={subscribedPagination.currentPage}
                    onChange={(e, newPage) => handleSubscribedPageChange(newPage)}
                    color="primary"
                    size="medium"
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
          </div>
        )}
      </div>
    </div>
  );
}
