import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  GiftIcon,
  TicketIcon,
  QrCodeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CadeauFormModal from "./CadeauFormModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Notification from "../../../components/Notification";
import * as XLSX from "xlsx";
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
  const { user } = useAuth();

  // État pour gérer les permissions utilisateur
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // État pour gérer les onglets
  const [activeTab, setActiveTab] = useState(0);
  const [tabHover, setTabHover] = useState(null);

  // État pour gérer les sous-onglets dans l'onglet "Gestion des cadeaux"
  const [activeSubTab, setActiveSubTab] = useState("liste"); // "liste" ou "historique"

  // Fonction pour déterminer les onglets disponibles en fonction des permissions
  const getAvailableTabs = () => {
    const tabs = [];

    if (
      userPermissions.includes("manage-tickets") ||
      userPermissions.includes("super-admin")
    ) {
      tabs.push("tickets");
    }

    if (
      userPermissions.includes("manage-gifts-history") ||
      userPermissions.includes("super-admin")
    ) {
      tabs.push("cadeaux");
    }

    return tabs;
  };

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    const availableTabs = getAvailableTabs();

    if (newValue >= 0 && newValue < availableTabs.length) {
      setActiveTab(newValue);
    }
  };

  // États pour la gestion des cadeaux
  const [cadeaux, setCadeaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCadeau, setCurrentCadeau] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cadeauToDelete, setCadeauToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActif, setFilterActif] = useState("tous");
  const [filterPack, setFilterPack] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [packs, setPacks] = useState([]);

  // États pour l'historique des cadeaux
  const [historiqueTickets, setHistoriqueTickets] = useState([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [historiqueError, setHistoriqueError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [filterConsomme, setFilterConsomme] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [allTickets, setAllTickets] = useState([]);

  // Référence pour le menu d'export
  const exportMenuRef = useRef(null);

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

  // Fonction pour récupérer les permissions de l'utilisateur
  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      // Récupérer les permissions depuis l'API pour tous les utilisateurs
      const response = await axios.get(`/api/user/permissions`);
      if (response.data && response.data.permissions) {
        // Stocker les slugs des permissions
        const permissionSlugs = response.data.permissions.map(
          (permission) => permission.slug
        );
        setUserPermissions(permissionSlugs);
      } else {
        setUserPermissions([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
      setUserPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchCadeaux();
    fetchPacks();
    fetchUserPermissions();
  }, []);

  // Initialiser l'onglet actif en fonction des permissions disponibles
  useEffect(() => {
    if (!loadingPermissions) {
      const availableTabs = getAvailableTabs();

      // Si aucun onglet n'est disponible, ne rien faire
      if (availableTabs.length === 0) {
        return;
      }

      // Si l'onglet actif n'est pas dans les onglets disponibles, sélectionner le premier onglet disponible
      if (!availableTabs[activeTab]) {
        setActiveTab(0);
      }
    }
  }, [userPermissions, loadingPermissions]);

  // Charger l'historique quand on change de sous-onglet
  useEffect(() => {
    if (activeTab === 1 && activeSubTab === "historique") {
      loadHistoriqueTickets(1);
    }
    // Fermer le menu d'exportation lors du changement d'onglet
    setShowExportMenu(false);
  }, [activeTab, activeSubTab]);

  // Effet pour fermer le menu d'export lorsqu'on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effet pour charger l'historique des tickets lorsque l'utilisateur navigue vers le sous-onglet "historique"
  useEffect(() => {
    if (activeTab === 1 && activeSubTab === "historique") {
      loadHistoriqueTickets(1);
    }
  }, [activeTab, activeSubTab]);

  // Effet pour rafraîchir les cadeaux uniquement lors du changement de page
  useEffect(() => {
    fetchCadeaux();
  }, []);

  // Récupérer la liste des cadeaux
  const fetchCadeaux = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer tous les cadeaux sans filtres
      const response = await axios.get("/api/admin/cadeaux");
      if (response.data.success) {
        setCadeaux(response.data.cadeaux);
      } else {
        console.error("Erreur lors de la récupération des cadeaux");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des cadeaux:", err);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la liste des packs
  const fetchPacks = async () => {
    try {
      const response = await axios.get("/api/admin/formations/packs");
      if (response.data.success) {
        setPacks(response.data.data || []);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des packs:", err);
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

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", {
      locale: fr,
    });
  };

  // Vérifier si un ticket est expiré
  const isExpired = (ticket) => {
    if (!ticket || !ticket.date_expiration) return false;
    return new Date(ticket.date_expiration) < new Date();
  };

  // Fonction pour récupérer tous les tickets (pour l'export)
  const fetchAllTickets = async () => {
    try {
      const response = await axios.get(
        "/api/admin/tickets/historique?per_page=1000"
      );
      if (response.data.success) {
        setAllTickets(response.data.data.data);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de tous les tickets:",
        error
      );
    }
  };

  // Charger l'historique des tickets consommés
  const loadHistoriqueTickets = async (page = 1) => {
    setHistoriqueLoading(true);
    setHistoriqueError(null);

    try {
      // Construction des paramètres de requête avec les filtres
      const params = new URLSearchParams();
      params.append("page", page);

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (filterDateDebut) {
        params.append("date_debut", filterDateDebut);
      }

      if (filterDateFin) {
        params.append("date_fin", filterDateFin);
      }

      // Ajout du filtre de consommation
      if (filterConsomme !== "") {
        params.append("consomme", filterConsomme);
      }

      const response = await axios.get(
        `/api/admin/tickets/historique?${params.toString()}`
      );

      if (response.data.success) {
        setHistoriqueTickets(response.data.data.data);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.last_page);
      } else {
        setHistoriqueError(
          response.data.message || "Erreur lors du chargement de l'historique"
        );
      }
    } catch (err) {
      console.error(
        "Erreur lors du chargement de l'historique des tickets:",
        err
      );
      setHistoriqueError(
        err.response?.data?.message ||
          "Erreur lors du chargement de l'historique"
      );
    } finally {
      setHistoriqueLoading(false);
    }
  };

  // Fonction pour exporter les données vers Excel
  const exportToExcel = async (type) => {
    try {
      let dataToExport = [];

      if (type === "page") {
        // Exporter uniquement la page actuelle (déjà chargée)
        dataToExport = historiqueTickets;
      } else if (type === "filtered") {
        // Exporter toutes les données avec les filtres actuels
        setHistoriqueLoading(true);

        // Construction des paramètres de requête avec les filtres actuels
        const params = new URLSearchParams();
        params.append("per_page", 1000); // Augmenter la limite pour récupérer plus de données

        if (searchTerm.trim()) {
          params.append("search", searchTerm.trim());
        }

        if (filterDateDebut) {
          params.append("date_debut", filterDateDebut);
        }

        if (filterDateFin) {
          params.append("date_fin", filterDateFin);
        }

        if (filterConsomme !== "") {
          params.append("consomme", filterConsomme);
        }

        const response = await axios.get(
          `/api/admin/tickets/historique?${params.toString()}`
        );

        if (response.data.success) {
          dataToExport = response.data.data.data;
        } else {
          throw new Error(
            response.data.message ||
              "Erreur lors de la récupération des données"
          );
        }
      } else if (type === "all") {
        // Exporter toutes les données sans filtre
        setHistoriqueLoading(true);

        const params = new URLSearchParams();
        params.append("per_page", 1000); // Augmenter la limite pour récupérer plus de données

        const response = await axios.get(
          `/api/admin/tickets/historique?${params.toString()}`
        );

        if (response.data.success) {
          dataToExport = response.data.data.data;
        } else {
          throw new Error(
            response.data.message ||
              "Erreur lors de la récupération des données"
          );
        }
      }

      // Formater les données pour l'export
      const formattedData = dataToExport.map((ticket) => ({
        Code: ticket.code_verification || "Non défini",
        Cadeau: ticket.cadeau?.nom || "Non défini",
        Valeur: ticket.cadeau?.valeur || 0,
        Utilisateur: ticket.user?.name || "Non défini",
        Administrateur: ticket.admin?.name || "Non défini",
        Email: ticket.user?.email || "Non défini",
        "Date de consommation": ticket.date_consommation
          ? format(new Date(ticket.date_consommation), "dd/MM/yyyy HH:mm")
          : "Non défini",
        "Date d'expiration": ticket.date_expiration
          ? format(new Date(ticket.date_expiration), "dd/MM/yyyy HH:mm")
          : "N/A",
        Consommé: ticket.consomme,
      }));

      // Créer un workbook Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, "Historique Tickets");

      // Générer le fichier Excel et le télécharger
      const dateStr = format(new Date(), "yyyy-MM-dd");
      let fileName = `historique_tickets_${dateStr}`;

      if (
        type === "filtered" &&
        (searchTerm ||
          filterDateDebut ||
          filterDateFin ||
          filterConsomme !== "")
      ) {
        fileName += "_filtres";
      } else if (type === "page") {
        fileName += `_page${currentPage}`;
      }

      XLSX.writeFile(wb, `${fileName}.xlsx`);

      Notification.success("Export Excel réussi");
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      Notification.error("Erreur lors de l'export Excel");
    } finally {
      setHistoriqueLoading(false);
    }
  };

  // Déterminer quel onglet est disponible en premier en fonction des permissions
  useEffect(() => {
    if (!loadingPermissions) {
      const availableTabs = getAvailableTabs();
      if (availableTabs.length > 0) {
        setActiveTab(0); // Sélectionner le premier onglet disponible
      }
    }
  }, [loadingPermissions, userPermissions]);

  return (
    <div className="container mx-auto">
      {/* Affichage du spinner de chargement pour les permissions ou les cadeaux */}
      {loadingPermissions || (loading && cadeaux?.length === 0) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        !loadingPermissions && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getAvailableTabs()[activeTab] === "tickets"
                  ? "Vérification des Tickets"
                  : "Gestion des Cadeaux"}
              </h1>
              <div className="flex space-x-2">
                {getAvailableTabs()[activeTab] === "cadeaux" &&
                  activeSubTab === "liste" && (
                    <>
                      <button
                        onClick={fetchCadeaux}
                        className="inline-flex items-center p-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                        disabled={loading}
                        title="Actualiser"
                      >
                        <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => handleAddCadeau()}
                        className="inline-flex items-center px-3 py-2 sm:px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 dark:from-primary-500 dark:to-primary-600 transition-all duration-200"
                      >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Ajouter un cadeau</span>
                      </button>
                    </>
                  )}
                {activeTab === 1 && activeSubTab === "historique" && (
                  <>
                    <div className="relative" ref={exportMenuRef}>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="inline-flex items-center px-2 py-2 sm:px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                        disabled={
                          historiqueLoading || historiqueTickets.length === 0
                        }
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
                        <span className="hidden sm:inline">Exporter</span>
                        <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                      {showExportMenu && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                exportToExcel("page");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              disabled={historiqueLoading}
                            >
                              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                              Page actuelle
                            </button>
                            <button
                              onClick={() => {
                                exportToExcel("filtered");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              disabled={historiqueLoading}
                            >
                              <FunnelIcon className="h-5 w-5 mr-2" />
                              Avec filtres actuels
                            </button>
                            <button
                              onClick={() => {
                                exportToExcel("all");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              disabled={historiqueLoading}
                            >
                              <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                              Tous les tickets
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center px-2 py-2 sm:px-3 border rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ${
                        showFilters
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 ring-1 ring-primary-500"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
                      <span className="hidden sm:inline">{showFilters ? "Masquer" : "Filtres"}</span>
                    </button>
                    <button
                      onClick={() => loadHistoriqueTickets(currentPage)}
                      className="inline-flex items-center p-2 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                      disabled={historiqueLoading}
                      title="Actualiser"
                    >
                      <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )
      )}

      {activeTab === 1 && activeSubTab === "liste" && (
        <div className={`mt-3 sm:mt-4 mb-3 sm:mb-4 p-3 sm:p-4 ${themeColors.card} rounded-xl shadow-lg border ${themeColors.border}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Champ de recherche */}
            <div>
              <label
                htmlFor="search"
                className={`block text-xs sm:text-sm font-medium ${themeColors.text} mb-1.5`}
              >
                Rechercher
              </label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className={`block w-full pr-10 py-2 text-sm rounded-lg ${themeColors.input} border ${themeColors.border} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                  placeholder="Nom ou description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Réinitialiser à la première page lors d'une recherche
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtre par statut */}
            <div>
              <label
                htmlFor="filterActif"
                className={`block text-xs sm:text-sm font-medium ${themeColors.text} mb-1.5`}
              >
                Statut
              </label>
              <select
                id="filterActif"
                name="filterActif"
                className={`block w-full py-2 text-sm rounded-lg ${themeColors.input} border ${themeColors.border} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                value={filterActif}
                onChange={(e) => {
                  setFilterActif(e.target.value);
                  setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de filtre
                }}
              >
                <option value="tous">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            {/* Filtre par pack */}
            <div className="sm:col-span-2 md:col-span-1">
              <label
                htmlFor="filterPack"
                className={`block text-xs sm:text-sm font-medium ${themeColors.text} mb-1.5`}
              >
                Pack
              </label>
              <select
                id="filterPack"
                name="filterPack"
                className={`block w-full py-2 text-sm rounded-lg ${themeColors.input} border ${themeColors.border} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                value={filterPack || ""}
                onChange={(e) => {
                  setFilterPack(e.target.value || null);
                  setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de filtre
                }}
              >
                <option value="">Tous les packs</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Onglets avec design moderne */}
      {!loadingPermissions && (
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
            {/* Afficher les onglets en fonction des permissions disponibles */}
            {getAvailableTabs().map((tab, index) =>
              tab === "tickets" ? (
                <Tab
                  key="tickets"
                  icon={<TicketIcon className="h-5 w-5" />}
                  iconPosition="start"
                  label="Vérification des tickets"
                  onMouseEnter={() => setTabHover(index)}
                  onMouseLeave={() => setTabHover(null)}
                  sx={{
                    transform: tabHover === index ? "translateY(-2px)" : "none",
                  }}
                />
              ) : (
                <Tab
                  key="cadeaux"
                  icon={<GiftIcon className="h-5 w-5" />}
                  iconPosition="start"
                  label="Gestion des cadeaux"
                  onMouseEnter={() => setTabHover(index)}
                  onMouseLeave={() => setTabHover(null)}
                  sx={{
                    transform: tabHover === index ? "translateY(-2px)" : "none",
                  }}
                />
              )
            )}
          </Tabs>
        </Paper>
      )}

      {/* Sous-onglets pour l'onglet Gestion des cadeaux */}
      {getAvailableTabs()[activeTab] === "cadeaux" && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveSubTab("liste")}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeSubTab === "liste"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center">
              <GiftIcon className="h-5 w-5 mr-2" />
              Liste des cadeaux
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab("historique")}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeSubTab === "historique"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Historique des cadeaux
            </div>
          </button>
        </div>
      )}

      {!loadingPermissions && (
        <>
          {/* Contenu de l'onglet actif */}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {activeTab === 1 &&
            activeSubTab === "historique" &&
            (userPermissions.includes("manage-gifts-history") ||
              userPermissions.includes("super-admin")) && (
              <div>
                {/* Barre de recherche rapide toujours visible */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom de cadeau, utilisateur..."
                      className={`w-full px-4 py-2 pr-10 border ${themeColors.border} rounded-md ${themeColors.input}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filtres avancés (cachés par défaut) */}
                {showFilters && (
                  <div className="mb-4 sm:mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 sm:p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* Filtre date début */}
                      <div>
                        <label
                          htmlFor="date_debut"
                          className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Date de début
                        </label>
                        <input
                          type="date"
                          id="date_debut"
                          value={filterDateDebut}
                          onChange={(e) => setFilterDateDebut(e.target.value)}
                          className={`w-full px-3 py-2 text-sm border ${themeColors.border} rounded-lg ${themeColors.input} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                        />
                      </div>

                      {/* Filtre date fin */}
                      <div>
                        <label
                          htmlFor="date_fin"
                          className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Date de fin
                        </label>
                        <input
                          type="date"
                          id="date_fin"
                          value={filterDateFin}
                          onChange={(e) => setFilterDateFin(e.target.value)}
                          className={`w-full px-3 py-2 text-sm border ${themeColors.border} rounded-lg ${themeColors.input} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                        />
                      </div>

                      {/* Filtre statut de consommation */}
                      <div className="sm:col-span-2 md:col-span-1">
                        <label
                          htmlFor="consomme"
                          className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Statut de consommation
                        </label>
                        <select
                          id="consomme"
                          value={filterConsomme}
                          onChange={(e) => setFilterConsomme(e.target.value)}
                          className={`w-full px-3 py-2 text-sm border ${themeColors.border} rounded-lg ${themeColors.input} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200`}
                        >
                          <option value="">Tous les tickets</option>
                          <option value="true">Tickets consommés</option>
                          <option value="false">Tickets non consommés</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                      <button
                        onClick={() => {
                          setCurrentPage(1);
                          loadHistoriqueTickets(1);
                        }}
                        className={`${themeColors.button} px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200`}
                        disabled={historiqueLoading}
                      >
                        {historiqueLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        ) : (
                          <FunnelIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        )}
                        Appliquer les filtres
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterDateDebut("");
                          setFilterDateFin("");
                          setFilterConsomme("");
                          setCurrentPage(1);
                          loadHistoriqueTickets(1);
                        }}
                        className={`${themeColors.buttonSecondary} px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center`}
                        disabled={historiqueLoading}
                      >
                        <ArrowPathIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Réinitialiser</span>
                      </button>
                    </div>
                  </div>
                )}

                {historiqueLoading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                )}

                {historiqueError && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center mb-4">
                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                    {historiqueError}
                  </div>
                )}

                {!historiqueLoading && historiqueTickets.length === 0 && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun ticket consommé n'a été trouvé.</p>
                    {(searchTerm || filterDateDebut || filterDateFin) && (
                      <p className="mt-2 text-sm">
                        Essayez de modifier vos critères de recherche ou de
                        réinitialiser les filtres.
                      </p>
                    )}
                  </div>
                )}

                {!historiqueLoading && historiqueTickets.length > 0 && (
                  <div>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {historiqueTickets.length}
                        </span>{" "}
                        résultat(s) affiché(s)
                        {(searchTerm || filterDateDebut || filterDateFin) && (
                          <span> pour les filtres appliqués</span>
                        )}
                      </div>
                      {totalPages > 1 && (
                        <div>
                          Page{" "}
                          <span className="font-medium">{currentPage}</span> sur{" "}
                          <span className="font-medium">{totalPages}</span>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Cadeau
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Utilisateur
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Distributeur
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Date de consommation
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Date d'expiration
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Consommé
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Valeur
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {historiqueTickets.map((ticket) => (
                            <tr
                              key={ticket.id}
                              className={
                                "hover:bg-gray-50 dark:hover:bg-gray-800"
                              }
                              sx={{
                                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {ticket.cadeau?.image_url && (
                                    <img
                                      src={ticket.cadeau.image_url}
                                      alt={ticket.cadeau.nom}
                                      className="h-10 w-10 rounded-full mr-3 object-cover"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">
                                      {ticket.cadeau?.nom || "Non défini"}
                                    </div>
                                    {ticket.code_verification && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Code: {ticket.code_verification}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {ticket.user?.name || "Non défini"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {ticket.user?.email || "Non défini"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">
                                  {ticket.admin?.name || "Aucun"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {ticket.admin?.email || "Aucun"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatDate(ticket.date_consommation)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {ticket.date_expiration
                                  ? formatDate(ticket.date_expiration)
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {ticket.consomme === "consommé" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Consommé
                                  </span>
                                ) : ticket.consomme === "programmé" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Programmé
                                  </span>
                                ) : ticket.consomme === "expiré" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Expiré
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Non consommé
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {ticket.cadeau?.valeur
                                  ? `${ticket.cadeau.valeur} $`
                                  : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-4 flex justify-center">
                          <nav className="flex items-center">
                            <button
                              onClick={() =>
                                loadHistoriqueTickets(currentPage - 1)
                              }
                              disabled={currentPage === 1 || historiqueLoading}
                              className={`${
                                currentPage === 1
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              } p-2 mx-1 rounded-md ${
                                themeColors.buttonSecondary
                              }`}
                            >
                              Précédent
                            </button>

                            <div className="mx-2 text-sm">
                              Page {currentPage} sur {totalPages}
                            </div>

                            <button
                              onClick={() =>
                                loadHistoriqueTickets(currentPage + 1)
                              }
                              disabled={
                                currentPage === totalPages || historiqueLoading
                              }
                              className={`${
                                currentPage === totalPages
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              } p-2 mx-1 rounded-md ${
                                themeColors.buttonSecondary
                              }`}
                            >
                              Suivant
                            </button>
                          </nav>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {activeTab === 1 &&
            activeSubTab === "liste" &&
            (userPermissions.includes("manage-gifts-history") ||
              userPermissions.includes("super-admin")) && (
              <>
                {cadeaux && cadeaux.length > 0 ? (
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {cadeaux
                        // Filtrage par recherche
                        .filter((cadeau) => {
                          if (!searchTerm) return true;
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            (cadeau.nom &&
                              cadeau.nom.toLowerCase().includes(searchLower)) ||
                            (cadeau.description &&
                              cadeau.description
                                .toLowerCase()
                                .includes(searchLower))
                          );
                        })
                        // Filtrage par statut
                        .filter((cadeau) => {
                          if (filterActif === "tous") return true;
                          return filterActif === "actif"
                            ? cadeau.actif
                            : !cadeau.actif;
                        })
                        // Filtrage par pack
                        .filter((cadeau) => {
                          if (!filterPack) return true;
                          return cadeau.pack_id === parseInt(filterPack);
                        })
                        // Pagination
                        .slice((currentPage - 1) * 5, currentPage * 5)
                        .map((cadeau) => (
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
                                  <PencilIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  onClick={() => handleDeleteCadeau(cadeau)}
                                  className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                  title="Supprimer"
                                >
                                  <TrashIcon
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>

                    {/* Pagination */}
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          {(() => {
                            // Calculer le nombre de cadeaux filtrés
                            const filteredCadeaux = cadeaux
                              .filter((cadeau) => {
                                if (!searchTerm) return true;
                                const searchLower = searchTerm.toLowerCase();
                                return (
                                  (cadeau.nom &&
                                    cadeau.nom
                                      .toLowerCase()
                                      .includes(searchLower)) ||
                                  (cadeau.description &&
                                    cadeau.description
                                      .toLowerCase()
                                      .includes(searchLower))
                                );
                              })
                              .filter((cadeau) => {
                                if (filterActif === "tous") return true;
                                return filterActif === "actif"
                                  ? cadeau.actif
                                  : !cadeau.actif;
                              })
                              .filter((cadeau) => {
                                if (!filterPack) return true;
                                return cadeau.pack_id === parseInt(filterPack);
                              });

                            const totalFiltered = filteredCadeaux.length;
                            const startItem =
                              totalFiltered > 0
                                ? Math.min(
                                    (currentPage - 1) * 5 + 1,
                                    totalFiltered
                                  )
                                : 0;
                            const endItem = Math.min(
                              currentPage * 5,
                              totalFiltered
                            );

                            return (
                              <p className={`text-sm ${themeColors.text}`}>
                                Affichage de{" "}
                                <span className="font-medium">{startItem}</span>{" "}
                                à <span className="font-medium">{endItem}</span>{" "}
                                sur{" "}
                                <span className="font-medium">
                                  {totalFiltered}
                                </span>{" "}
                                cadeaux
                              </p>
                            );
                          })()}
                        </div>
                        <div>
                          {(() => {
                            // Calculer le nombre de pages après filtrage
                            const filteredCadeaux = cadeaux
                              .filter((cadeau) => {
                                if (!searchTerm) return true;
                                const searchLower = searchTerm.toLowerCase();
                                return (
                                  (cadeau.nom &&
                                    cadeau.nom
                                      .toLowerCase()
                                      .includes(searchLower)) ||
                                  (cadeau.description &&
                                    cadeau.description
                                      .toLowerCase()
                                      .includes(searchLower))
                                );
                              })
                              .filter((cadeau) => {
                                if (filterActif === "tous") return true;
                                return filterActif === "actif"
                                  ? cadeau.actif
                                  : !cadeau.actif;
                              })
                              .filter((cadeau) => {
                                if (!filterPack) return true;
                                return cadeau.pack_id === parseInt(filterPack);
                              });

                            const pageCount = Math.ceil(
                              filteredCadeaux.length / 5
                            );

                            // Si le nombre de pages a changé et la page actuelle est supérieure au nombre de pages
                            // Réinitialiser à la première page
                            if (pageCount > 0 && currentPage > pageCount) {
                              setTimeout(() => setCurrentPage(1), 0);
                            }

                            return (
                              <nav
                                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                aria-label="Pagination"
                              >
                                <button
                                  onClick={() =>
                                    setCurrentPage(currentPage - 1)
                                  }
                                  disabled={
                                    currentPage === 1 || pageCount === 0
                                  }
                                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                                    themeColors.border
                                  } ${themeColors.bg} text-sm font-medium ${
                                    currentPage === 1 || pageCount === 0
                                      ? "text-gray-300 dark:text-gray-600"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  <span className="sr-only">Précédent</span>
                                  <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>

                                {/* Pages */}
                                {Array.from(
                                  { length: pageCount },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border ${
                                      themeColors.border
                                    } text-sm font-medium ${
                                      page === currentPage
                                        ? `${
                                            isDarkMode
                                              ? "bg-primary-600"
                                              : "bg-primary-50"
                                          } ${
                                            isDarkMode
                                              ? "text-white"
                                              : "text-primary-600"
                                          } ${
                                            isDarkMode
                                              ? "border-primary-500"
                                              : "border-primary-500"
                                          }`
                                        : `${themeColors.bg} ${themeColors.text} hover:bg-gray-50 dark:hover:bg-gray-700`
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}

                                <button
                                  onClick={() =>
                                    setCurrentPage(currentPage + 1)
                                  }
                                  disabled={
                                    currentPage >= pageCount || pageCount === 0
                                  }
                                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                                    themeColors.border
                                  } ${themeColors.bg} text-sm font-medium ${
                                    currentPage >= pageCount || pageCount === 0
                                      ? "text-gray-300 dark:text-gray-600"
                                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  }`}
                                >
                                  <span className="sr-only">Suivant</span>
                                  <svg
                                    className="h-5 w-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </nav>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
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
                        <PlusIcon
                          className="-ml-1 mr-2 h-5 w-5"
                          aria-hidden="true"
                        />
                        Ajouter un cadeau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          {/* Onglet Vérification des tickets */}
          {getAvailableTabs()[activeTab] === "tickets" && (
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Êtes-vous sûr de vouloir supprimer le cadeau{" "}
                  <span className="font-medium">
                    {cadeauToDelete?.nom || ""}
                  </span>
                  ? Cette action est irréversible.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseDeleteModal}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteCadeau}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CadeauxManagement;
