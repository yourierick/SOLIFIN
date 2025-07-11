import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  GiftIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CadeauFormModal from "./CadeauFormModal";
import {
  Tabs,
  Tab,
  Box,
  Paper,
  CircularProgress,
  Typography,
} from "@mui/material";

// Import du composant TicketVerification avec lazy loading
const TicketVerification = lazy(() => import("./TicketVerification"));

/**
 * Composant pour la gestion des cadeaux (jetons Esengo)
 * Permet d'afficher, ajouter, modifier et supprimer des cadeaux
 * Inclut également la vérification des tickets gagnants
 */
const CadeauxManagement = () => {
  const { isDarkMode } = useTheme();

  // État pour gérer les onglets
  const [activeTab, setActiveTab] = useState(0);
  const [tabHover, setTabHover] = useState(null);

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // États pour la gestion des cadeaux
  const [cadeaux, setCadeaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCadeau, setCurrentCadeau] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cadeauToDelete, setCadeauToDelete] = useState(null);

  // Couleurs pour le thème
  const themeColors = {
    bg: isDarkMode ? "bg-[#1f2937]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    card: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    input: isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };

  useEffect(() => {
    fetchCadeaux();
  }, []);

  // Récupérer la liste des cadeaux
  const fetchCadeaux = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/admin/cadeaux");
      if (response.data.success) {
        setCadeaux(response.data.cadeaux);
      } else {
        setError("Erreur lors de la récupération des cadeaux");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de la récupération des cadeaux:", err);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal pour ajouter un cadeau
  const handleAddCadeau = () => {
    setCurrentCadeau(null);
    setModalOpen(true);
  };

  // Ouvrir le modal pour modifier un cadeau
  const handleEditCadeau = (cadeau) => {
    setCurrentCadeau(cadeau);
    setModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentCadeau(null);
  };

  // Ouvrir le modal de confirmation de suppression
  const handleDeleteCadeau = (cadeau) => {
    setCadeauToDelete(cadeau);
    setDeleteModalOpen(true);
  };

  // Fermer le modal de confirmation de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setCadeauToDelete(null);
  };

  // Confirmer et exécuter la suppression d'un cadeau
  const confirmDeleteCadeau = async () => {
    if (!cadeauToDelete) return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `/api/admin/cadeaux/${cadeauToDelete.id}`
      );

      if (response.data.success) {
        toast.success("Cadeau supprimé avec succès");
        fetchCadeaux();
      } else {
        toast.error(
          response.data.message || "Erreur lors de la suppression du cadeau"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du cadeau:", error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la suppression du cadeau"
      );
    } finally {
      setLoading(false);
      handleCloseDeleteModal();
    }
  };

  // Afficher un spinner pendant le chargement
  if (loading && cadeaux?.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {activeTab === 0 ? "Gestion des Cadeaux" : "Vérification des Tickets"}
        </h1>
        <div className="flex space-x-2">
          {activeTab === 0 && (
            <>
              <button
                onClick={fetchCadeaux}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                title="Rafraîchir la liste"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleAddCadeau()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Ajouter un cadeau
              </button>
            </>
          )}
        </div>
      </div>

      {/* Onglets avec design moderne */}
      <Paper
        elevation={isDarkMode ? 2 : 3}
        sx={{
          p: 0,
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
          overflow: "hidden",
          transition: "all 0.3s ease",
          boxShadow: isDarkMode
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            style: {
              backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
          sx={{
            borderBottom: 1,
            borderColor: isDarkMode
              ? "rgba(55, 65, 81, 0.5)"
              : "rgba(0, 0, 0, 0.08)",
            bgcolor: isDarkMode ? "#111827" : "#f8fafc",
            "& .MuiTabs-flexContainer": {
              gap: 1,
              px: 1,
              pt: 1,
            },
            "& .MuiTab-root": {
              minHeight: 48,
              transition: "all 0.2s ease",
              borderRadius: "8px 8px 0 0",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(37, 99, 235, 0.05)",
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
              },
              "&.Mui-selected": {
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab
            icon={<GiftIcon className="h-5 w-5" />}
            iconPosition="start"
            label="Gestion des cadeaux"
            onMouseEnter={() => setTabHover(0)}
            onMouseLeave={() => setTabHover(null)}
            sx={{
              transform: tabHover === 0 ? "translateY(-2px)" : "none",
            }}
          />
          <Tab
            icon={<TicketIcon className="h-5 w-5" />}
            iconPosition="start"
            label="Vérification des tickets"
            onMouseEnter={() => setTabHover(1)}
            onMouseLeave={() => setTabHover(null)}
            sx={{
              transform: tabHover === 1 ? "translateY(-2px)" : "none",
            }}
          />
        </Tabs>
      </Paper>

      {/* Contenu de l'onglet actif */}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {activeTab === 0 && (
        <>
          {cadeaux && cadeaux.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {cadeaux.map((cadeau) => (
                  <li key={cadeau.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {cadeau.image_url ? (
                            <div className="h-12 w-12 rounded-md overflow-hidden mr-3 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                              <img
                                src={cadeau.image_url}
                                alt={cadeau.nom}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://placehold.co/48x48/gray/white?text=N/A";
                                }}
                              />
                            </div>
                          ) : (
                            <GiftIcon
                              className="h-12 w-12 text-primary-500 mr-3 p-2 bg-primary-100 dark:bg-primary-900 rounded-md"
                              aria-hidden="true"
                            />
                          )}
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                            {cadeau.nom}
                          </p>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              cadeau.actif
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {cadeau.actif ? "Actif" : "Inactif"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            {cadeau.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditCadeau(cadeau)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteCadeau(cadeau)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
              <GiftIcon
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Aucun cadeau disponible
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Commencez par ajouter un nouveau cadeau.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleAddCadeau()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Ajouter un cadeau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Onglet Vérification des tickets */}
      {activeTab === 1 && (
        <Box sx={{ mt: 2 }}>
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="400px"
              >
                <CircularProgress color="primary" />
                <Typography variant="body1" ml={2} color="textSecondary">
                  Chargement de la vérification des tickets...
                </Typography>
              </Box>
            }
          >
            <TicketVerification />
          </Suspense>
        </Box>
      )}

      {/* Modal pour ajouter/modifier un cadeau */}
      <CadeauFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        cadeau={currentCadeau}
      />

      {/* Modal de confirmation de suppression */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity backdrop-blur-sm bg-white/30 dark:bg-black/30"
              onClick={handleCloseDeleteModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div
              className={`inline-block align-bottom ${themeColors.bg} rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
            >
              <div
                className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${themeColors.bg}`}
              >
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className={`text-lg leading-6 font-medium ${themeColors.text}`}
                    >
                      Confirmer la suppression
                    </h3>
                    <div className="mt-2">
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        Êtes-vous sûr de vouloir supprimer le cadeau{" "}
                        <strong>"{cadeauToDelete?.nom}"</strong> ? Cette action
                        est irréversible et supprimera définitivement ce cadeau
                        du système.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${themeColors.bg}`}
              >
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteCadeau}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${themeColors.border} shadow-sm px-4 py-2 ${themeColors.buttonSecondary} text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={handleCloseDeleteModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadeauxManagement;
