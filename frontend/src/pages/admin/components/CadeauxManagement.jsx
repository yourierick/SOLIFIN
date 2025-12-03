import React, { useState, useEffect, lazy, useRef, Suspense } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import * as XLSX from "xlsx";
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
import {
  Tabs,
  Tab,
  Box,
  Paper,
  CircularProgress,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TablePagination,
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
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTickets, setTotalTickets] = useState(0);
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [filterDateExpirationDebut, setFilterDateExpirationDebut] = useState("");
  const [filterDateExpirationFin, setFilterDateExpirationFin] = useState("");
  const [filterConsomme, setFilterConsomme] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
      loadHistoriqueTicketsWithRowsPerPage(1, rowsPerPage);
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
      loadHistoriqueTicketsWithRowsPerPage(1, rowsPerPage);
    }
  }, [activeTab, activeSubTab]);

  // Effet pour recharger les données lorsque rowsPerPage change
  useEffect(() => {
    if (activeTab === 1 && activeSubTab === "historique" && currentPage > 0) {
      loadHistoriqueTicketsWithRowsPerPage(currentPage, rowsPerPage);
    }
  }, [rowsPerPage]);

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
    if (!dateString) return "Non défini";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", {
      locale: fr,
    });
  };

  // Vérifier si un ticket est expiré
  const isExpired = (ticket) => {
    if (!ticket || !ticket.date_expiration) return false;
    return new Date(ticket.date_expiration) < new Date();
  };

  // // Charger l'historique des tickets consommés
  // const loadHistoriqueTickets = async (page = 1) => {
  //   setHistoriqueLoading(true);
  //   setHistoriqueError(null);

  //   try {
  //     // Construction des paramètres de requête avec les filtres
  //     const params = new URLSearchParams();
  //     params.append("page", page);
  //     params.append("per_page", rowsPerPage);

  //     if (searchTerm.trim()) {
  //       params.append("search", searchTerm.trim());
  //     }

  //     if (filterDateDebut) {
  //       params.append("date_debut", filterDateDebut);
  //     }

  //     if (filterDateFin) {
  //       params.append("date_fin", filterDateFin);
  //     }

  //     // Ajout du filtre de consommation
  //     if (filterConsomme !== "") {
  //       params.append("consomme", filterConsomme);
  //     }

  //     const response = await axios.get(
  //       `/api/admin/tickets/historique?${params.toString()}`
  //     );

  //     if (response.data.success) {
  //       setHistoriqueTickets(response.data.data.data);
  //       setCurrentPage(response.data.data.current_page);
  //       setTotalPages(response.data.data.last_page);
  //       setTotalTickets(response.data.data.total || 0);
  //     } else {
  //       setHistoriqueError(
  //         response.data.message || "Erreur lors du chargement de l'historique"
  //       );
  //     }
  //   } catch (err) {
  //     console.error(
  //       "Erreur lors du chargement de l'historique des tickets:",
  //       err
  //     );
  //     setHistoriqueError(
  //       err.response?.data?.message ||
  //         "Erreur lors du chargement de l'historique"
  //     );
  //   } finally {
  //     setHistoriqueLoading(false);
  //   }
  // };

  // Charger l'historique avec un nombre de lignes spécifique
  const loadHistoriqueTicketsWithRowsPerPage = async (page = 1, perPage = rowsPerPage) => {
    setHistoriqueLoading(true);
    setHistoriqueError(null);

    try {
      // Construction des paramètres de requête avec les filtres
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("per_page", perPage);

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (filterDateDebut) {
        params.append("date_debut", filterDateDebut);
      }

      if (filterDateFin) {
        params.append("date_fin", filterDateFin);
      }

      // Filtres pour les dates d'expiration
      if (filterDateExpirationDebut) {
        params.append("date_expiration_debut", filterDateExpirationDebut);
      }

      if (filterDateExpirationFin) {
        params.append("date_expiration_fin", filterDateExpirationFin);
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
        setTotalTickets(response.data.data.total || 0);
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

  // Fonctions pour la pagination Material-UI
  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage + 1); // Material-UI utilise 0-based index
    loadHistoriqueTicketsWithRowsPerPage(newPage + 1, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Revenir à la première page
    // Passer directement la nouvelle valeur pour éviter le problème d'état asynchrone
    loadHistoriqueTicketsWithRowsPerPage(1, newRowsPerPage);
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
        params.append("per_page", 999999); // Utiliser une grande limite pour tout récupérer

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

        // Ajouter les filtres d'expiration
        if (filterDateExpirationDebut) {
          params.append("date_expiration_debut", filterDateExpirationDebut);
        }

        if (filterDateExpirationFin) {
          params.append("date_expiration_fin", filterDateExpirationFin);
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
        params.append("per_page", 999999); // Utiliser une grande limite pour tout récupérer

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

  // Fonctions d'exportation pour les cadeaux
  const formatCadeauxDataForExport = (cadeauxList) => {
    return cadeauxList.map((cadeau) => ({
      "ID": cadeau.id || "N/A",
      "Nom du cadeau": cadeau.nom || "N/A",
      "Description": cadeau.description || "N/A",
      "Valeur": cadeau.valeur ? `${cadeau.valeur} $` : "N/A",
      "Statut": cadeau.actif ? "Actif" : "Inactif",
      "Pack": cadeau.pack?.name || "N/A",
      "Date de création": cadeau.created_at ? new Date(cadeau.created_at).toLocaleDateString('fr-FR') : "N/A",
      "Date de mise à jour": cadeau.updated_at ? new Date(cadeau.updated_at).toLocaleDateString('fr-FR') : "N/A",
    }));
  };

  const exportCadeauxToExcel = (data, filename) => {
    try {
      const formattedData = formatCadeauxDataForExport(data);
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 10 }, // ID
        { wch: 25 }, // Nom du cadeau
        { wch: 40 }, // Description
        { wch: 15 }, // Valeur
        { wch: 12 }, // Statut
        { wch: 20 }, // Pack
        { wch: 20 }, // Date de création
        { wch: 20 }, // Date de mise à jour
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cadeaux");
      
      // Générer le nom du fichier avec la date actuelle
      const today = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const finalFilename = `${filename}_${today}.xlsx`;
      
      XLSX.writeFile(wb, finalFilename);
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel des cadeaux:", error);
      Notification.error("Erreur lors de l'exportation du fichier Excel");
    }
  };

  const handleExportCadeauxCurrentPage = async () => {
    setExportLoading(true);
    try {
      // Filtrer les cadeaux comme dans l'affichage
      const filteredCadeaux = cadeaux
        .filter((cadeau) => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return (
            (cadeau.nom && cadeau.nom.toLowerCase().includes(searchLower)) ||
            (cadeau.description && cadeau.description.toLowerCase().includes(searchLower))
          );
        })
        .filter((cadeau) => {
          if (filterActif === "tous") return true;
          return filterActif === "actif" ? cadeau.actif : !cadeau.actif;
        })
        .filter((cadeau) => {
          if (!filterPack) return true;
          return cadeau.pack_id === parseInt(filterPack);
        })
        // Pagination
        .slice((currentPage - 1) * 5, currentPage * 5);

      if (filteredCadeaux.length === 0) {
        Notification.warning("Aucune donnée à exporter");
        return;
      }
      
      exportCadeauxToExcel(filteredCadeaux, "cadeaux_page_actuelle");
      Notification.success("Exportation de la page actuelle réussie");
    } catch (error) {
      console.error("Erreur lors de l'exportation de la page actuelle:", error);
      Notification.error("Erreur lors de l'exportation");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCadeauxAll = async () => {
    setExportLoading(true);
    try {
      if (cadeaux.length === 0) {
        Notification.warning("Aucune donnée à exporter");
        return;
      }
      
      // Filtrer tous les cadeaux selon les critères actuels
      const filteredCadeaux = cadeaux
        .filter((cadeau) => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return (
            (cadeau.nom && cadeau.nom.toLowerCase().includes(searchLower)) ||
            (cadeau.description && cadeau.description.toLowerCase().includes(searchLower))
          );
        })
        .filter((cadeau) => {
          if (filterActif === "tous") return true;
          return filterActif === "actif" ? cadeau.actif : !cadeau.actif;
        })
        .filter((cadeau) => {
          if (!filterPack) return true;
          return cadeau.pack_id === parseInt(filterPack);
        });

      exportCadeauxToExcel(filteredCadeaux, "tous_les_cadeaux");
      Notification.success(`Exportation de ${filteredCadeaux.length} cadeaux réussie`);
    } catch (error) {
      console.error("Erreur lors de l'exportation complète:", error);
      Notification.error("Erreur lors de l'exportation des données");
    } finally {
      setExportLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 lg:p-8">
      {/* Affichage du spinner de chargement pour les permissions ou les cadeaux */}
      {loadingPermissions || (loading && cadeaux?.length === 0) ? (
        <div className="flex flex-col justify-center items-center h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 border-opacity-20"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Chargement en cours...</p>
        </div>
      ) : (
        !loadingPermissions && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                    {getAvailableTabs()[activeTab] === "tickets" ? (
                      <TicketIcon className="h-6 w-6 text-white" />
                    ) : (
                      <GiftIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {getAvailableTabs()[activeTab] === "tickets"
                        ? "Vérification des Tickets"
                        : "Gestion des Cadeaux"}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {getAvailableTabs()[activeTab] === "tickets"
                        ? "Validez et vérifiez les tickets gagnants"
                        : "Gérez votre catalogue de cadeaux"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                {getAvailableTabs()[activeTab] === "cadeaux" &&
                  activeSubTab === "liste" && (
                    <>
                      <button
                        onClick={fetchCadeaux}
                        className="group relative inline-flex items-center px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={loading}
                        title="Actualiser"
                      >
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 text-gray-600 dark:text-gray-300`} />
                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">Actualiser</span>
                      </button>
                      <button
                        onClick={() => handleAddCadeau()}
                        className="group relative inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                      >
                        <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                        <span className="ml-2 font-medium hidden sm:inline">Ajouter un cadeau</span>
                      </button>
                    </>
                  )}
                {activeTab === 1 && activeSubTab === "historique" && (
                  <>
                    <div className="relative" ref={exportMenuRef}>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="group relative inline-flex items-center px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={
                          historiqueLoading || historiqueTickets.length === 0
                        }
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform duration-200" />
                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">Exporter</span>
                        <ChevronDownIcon className={`h-4 w-4 ml-2 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                exportToExcel("page");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 flex items-center transition-all duration-200 group"
                              disabled={historiqueLoading}
                            >
                              <DocumentArrowDownIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-200" />
                              <div>
                                <div className="font-medium">Page actuelle</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Exporter uniquement cette page</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                exportToExcel("filtered");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 flex items-center transition-all duration-200 group"
                              disabled={historiqueLoading}
                            >
                              <FunnelIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-200" />
                              <div>
                                <div className="font-medium">Avec filtres actuels</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Exporter les résultats filtrés</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                exportToExcel("all");
                                setShowExportMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 flex items-center transition-all duration-200 group"
                              disabled={historiqueLoading}
                            >
                              <DocumentDuplicateIcon className="h-5 w-5 mr-3 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-200" />
                              <div>
                                <div className="font-medium">Tous les tickets</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Exporter l'intégralité des données</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`group relative inline-flex items-center px-4 py-2.5 border rounded-xl shadow-sm text-sm font-medium transition-all duration-300 transform hover:-translate-y-0.5 ${
                        showFilters
                          ? "border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 text-primary-700 dark:text-primary-400 shadow-md ring-2 ring-primary-200 dark:ring-primary-700"
                          : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md"
                      }`}
                    >
                      <FunnelIcon className={`h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200 ${showFilters ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`} />
                      <span className="font-medium">{showFilters ? "Masquer" : "Filtres"}</span>
                    </button>
                    <button
                      onClick={() => loadHistoriqueTicketsWithRowsPerPage(currentPage, rowsPerPage)}
                      className="group relative inline-flex items-center px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                      disabled={historiqueLoading}
                      title="Actualiser"
                    >
                      <ArrowPathIcon className={`h-5 w-5 ${historiqueLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 text-gray-600 dark:text-gray-300`} />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">Actualiser</span>
                    </button>
                  </>
                )}
              </div>
              </div>
            </div>
          </>
        )
      )}

      {activeTab === 1 && activeSubTab === "liste" && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md mr-3">
                <FunnelIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres de recherche</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Champ de recherche */}
              <div className="space-y-2">
                <label
                  htmlFor="search"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Rechercher
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full pr-10 py-3 text-sm rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="Nom ou description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
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
              <div className="space-y-2">
                <label
                  htmlFor="filterActif"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Statut
                </label>
                <select
                  id="filterActif"
                  name="filterActif"
                  className="block w-full py-3 text-sm rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  value={filterActif}
                  onChange={(e) => {
                    setFilterActif(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              {/* Filtre par pack */}
              <div className="sm:col-span-2 md:col-span-1 space-y-2">
                <label
                  htmlFor="filterPack"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Pack
                </label>
                <select
                  id="filterPack"
                  name="filterPack"
                  className="block w-full py-3 text-sm rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  value={filterPack || ""}
                  onChange={(e) => {
                    setFilterPack(e.target.value || null);
                    setCurrentPage(1);
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
        </div>
      )}

      {/* Onglets avec design moderne */}
      {!loadingPermissions && (
        <Paper
          elevation={isDarkMode ? 3 : 4}
          sx={{
            p: 0,
            mb: 4,
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: 3,
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: isDarkMode
              ? "0 10px 40px rgba(0,0,0,0.4)"
              : "0 10px 40px rgba(0,0,0,0.15)",
            border: isDarkMode ? "1px solid rgba(55, 65, 81, 0.3)" : "1px solid rgba(0, 0, 0, 0.08)",
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
                height: 4,
                borderRadius: "4px 4px 0 0",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              },
            }}
            sx={{
              borderBottom: 2,
              borderColor: isDarkMode
                ? "rgba(55, 65, 81, 0.6)"
                : "rgba(0, 0, 0, 0.12)",
              bgcolor: isDarkMode ? "#111827" : "#f8fafc",
              background: isDarkMode 
                ? "linear-gradient(to bottom, #111827, #1f2937)"
                : "linear-gradient(to bottom, #f8fafc, #ffffff)",
              "& .MuiTabs-flexContainer": {
                gap: 2,
                px: 2,
                pt: 2,
              },
              "& .MuiTab-root": {
                minHeight: 56,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: "12px 12px 0 0",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                padding: "12px 24px",
                position: "relative",
                "&:hover": {
                  backgroundColor: isDarkMode
                    ? "rgba(59, 130, 246, 0.15)"
                    : "rgba(37, 99, 235, 0.08)",
                  color: isDarkMode ? "#60a5fa" : "#3b82f6",
                  transform: "translateY(-2px) scale(1.02)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
                "&.Mui-selected": {
                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                  fontWeight: 700,
                  background: isDarkMode 
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))"
                    : "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(59, 130, 246, 0.02))",
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveSubTab("liste")}
              className={`flex-1 flex items-center justify-center px-4 py-3 font-medium text-sm rounded-xl transition-all duration-300 ${
                activeSubTab === "liste"
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <GiftIcon className="h-5 w-5 mr-2" />
              <span className="font-semibold">Liste des cadeaux</span>
            </button>
            <button
              onClick={() => setActiveSubTab("historique")}
              className={`flex-1 flex items-center justify-center px-4 py-3 font-medium text-sm rounded-xl transition-all duration-300 ${
                activeSubTab === "historique"
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              <span className="font-semibold">Historique des cadeaux</span>
            </button>
          </div>
        </div>
      )}

      {!loadingPermissions && (
        <>
          {/* Contenu de l'onglet actif */}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center shadow-lg">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 1 &&
            activeSubTab === "historique" &&
            (userPermissions.includes("manage-gifts-history") ||
              userPermissions.includes("super-admin")) && (
              <div>
                {/* Barre de recherche rapide toujours visible */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom de cadeau, utilisateur..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
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
                  <div className="mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-blue-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md mr-3">
                        <FunnelIcon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres avancés</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sous-conteneur : Filtres de dates de consommation */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                          <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dates de consommation</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Filtre date début consommation */}
                          <div className="space-y-2">
                            <label
                              htmlFor="date_debut_consommation"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Date de début
                            </label>
                            <input
                              type="date"
                              id="date_debut_consommation"
                              value={filterDateDebut}
                              onChange={(e) => setFilterDateDebut(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                          </div>

                          {/* Filtre date fin consommation */}
                          <div className="space-y-2">
                            <label
                              htmlFor="date_fin_consommation"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Date de fin
                            </label>
                            <input
                              type="date"
                              id="date_fin_consommation"
                              value={filterDateFin}
                              onChange={(e) => setFilterDateFin(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sous-conteneur : Filtres de dates d'expiration */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                          <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dates d'expiration</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Filtre date début expiration */}
                          <div className="space-y-2">
                            <label
                              htmlFor="date_debut_expiration"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Date de début
                            </label>
                            <input
                              type="date"
                              id="date_debut_expiration"
                              value={filterDateExpirationDebut}
                              onChange={(e) => setFilterDateExpirationDebut(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                          </div>

                          {/* Filtre date fin expiration */}
                          <div className="space-y-2">
                            <label
                              htmlFor="date_fin_expiration"
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              Date de fin
                            </label>
                            <input
                              type="date"
                              id="date_fin_expiration"
                              value={filterDateExpirationFin}
                              onChange={(e) => setFilterDateExpirationFin(e.target.value)}
                              className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtre de statut de consommation */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2 pb-2">
                        <ClipboardDocumentListIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Statut de consommation</h4>
                      </div>
                      <div className="mt-3">
                        <select
                          id="consomme"
                          value={filterConsomme}
                          onChange={(e) => setFilterConsomme(e.target.value)}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <option value="">Tous les tickets</option>
                          <option value="consommé">Tickets consommés</option>
                          <option value="non consommé">Tickets non consommés</option>
                          <option value="expiré">Tickets expirés</option>
                          <option value="programmé">Consommation programmée</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                      <button
                        onClick={() => {
                          setCurrentPage(1);
                          loadHistoriqueTicketsWithRowsPerPage(1, rowsPerPage);
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                        disabled={historiqueLoading}
                      >
                        {historiqueLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        ) : (
                          <FunnelIcon className="h-4 w-4 mr-2" />
                        )}
                        Appliquer les filtres
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterDateDebut("");
                          setFilterDateFin("");
                          setFilterDateExpirationDebut("");
                          setFilterDateExpirationFin("");
                          setFilterConsomme("");
                          setCurrentPage(1);
                          loadHistoriqueTicketsWithRowsPerPage(1, rowsPerPage);
                        }}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                        disabled={historiqueLoading}
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}

                {historiqueLoading && (
                  <div className="flex flex-col justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 border-opacity-20"></div>
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Chargement de l'historique...</p>
                  </div>
                )}

                {historiqueError && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center shadow-lg mb-6">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">{historiqueError}</p>
                    </div>
                  </div>
                )}

                {!historiqueLoading && historiqueTickets.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4">
                      <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun ticket consommé trouvé</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun ticket consommé n'a été trouvé pour le moment.</p>
                    {(searchTerm || filterDateDebut || filterDateFin) && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.</p>
                      </div>
                    )}
                  </div>
                )}

                {!historiqueLoading && historiqueTickets.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des tickets</h3>
                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                              <span>
                                <span className="font-medium">{historiqueTickets.length}</span> résultat(s) affiché(s)
                                {(searchTerm || filterDateDebut || filterDateFin || filterDateExpirationDebut || filterDateExpirationFin || filterConsomme !== "") && (
                                  <span> pour les filtres appliqués</span>
                                )}
                                {" • Exportation disponible : Page actuelle | Tous les résultats"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {totalPages && (
                          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Page <span className="font-semibold text-primary-600 dark:text-primary-400">{currentPage}</span> sur{' '}
                              <span className="font-semibold text-primary-600 dark:text-primary-400">{totalPages}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
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
                          minWidth: { xs: "1000px", sm: "1200px" },
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
                            <TableCell sx={{ width: { xs: "200px", sm: "200px" } }}>Cadeau</TableCell>
                            <TableCell sx={{ width: { xs: "180px", sm: "200px" } }}>Utilisateur</TableCell>
                            <TableCell sx={{ width: { xs: "180px", sm: "150px" } }}>Distributeur</TableCell>
                            <TableCell sx={{ width: { xs: "140px", sm: "150px" } }}>Date de consom.</TableCell>
                            <TableCell sx={{ width: { xs: "140px", sm: "150px" } }}>Date d'expiration</TableCell>
                            <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Consommé</TableCell>
                            <TableCell sx={{ width: { xs: "80px", sm: "100px" } }}>Valeur</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {historiqueTickets.map((ticket) => (
                            <TableRow
                              key={ticket.id}
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
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  {ticket.cadeau?.image_url ? (
                                    <Box
                                      sx={{
                                        height: 48,
                                        width: 48,
                                        borderRadius: 2,
                                        overflow: "hidden",
                                        mr: 2,
                                        flexShrink: 0,
                                        border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                      }}
                                    >
                                      <img
                                        src={ticket.cadeau.image_url}
                                        alt={ticket.cadeau.nom}
                                        style={{
                                          height: "100%",
                                          width: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        height: 48,
                                        width: 48,
                                        borderRadius: 2,
                                        background: isDarkMode 
                                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))"
                                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))",
                                        mr: 2,
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                      }}
                                    >
                                      <GiftIcon sx={{ height: 24, width: 24, color: isDarkMode ? "#60a5fa" : "#2563eb" }} />
                                    </Box>
                                  )}
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        color: isDarkMode ? "#fff" : "#1f2937",
                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                      }}
                                    >
                                      {ticket.cadeau?.nom || "Non défini"}
                                    </Typography>
                                    {ticket.code_verification && (
                                      <Box
                                        sx={{
                                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                                          fontFamily: "monospace",
                                          bgcolor: isDarkMode ? "#374151" : "#f3f4f6",
                                          px: 1,
                                          py: 0.5,
                                          borderRadius: 1,
                                          display: "inline-block",
                                          mt: 0.5,
                                        }}
                                      >
                                        Code: {ticket.code_verification}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: isDarkMode ? "#fff" : "#1f2937",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {ticket.user?.name || "Non défini"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  }}
                                >
                                  {ticket.user?.email || "Non défini"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: isDarkMode ? "#fff" : "#1f2937",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {ticket.admin?.name || "Aucun"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  }}
                                >
                                  {ticket.admin?.email || "Aucun"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: isDarkMode ? "#fff" : "#1f2937",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {formatDate(ticket.date_consommation)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isDarkMode ? "#fff" : "#1f2937",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {ticket.date_expiration
                                    ? formatDate(ticket.date_expiration)
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {ticket.consomme === "consommé" ? (
                                  <Chip
                                    icon={<CheckCircleIcon style={{ height: 14, width: 14 }} />}
                                    label="Consommé"
                                    size="small"
                                    sx={{
                                      background: isDarkMode 
                                        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.1))"
                                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))",
                                      color: isDarkMode ? "#4ade80" : "#16a34a",
                                      border: `1px solid ${isDarkMode ? "rgba(74, 222, 128, 0.3)" : "rgba(34, 197, 94, 0.2)"}`,
                                      fontWeight: 600,
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      "& .MuiChip-icon": {
                                        color: isDarkMode ? "#4ade80" : "#16a34a",
                                      },
                                    }}
                                  />
                                ) : ticket.consomme === "programmé" ? (
                                  <Chip
                                    icon={<ClockIcon style={{ height: 14, width: 14 }} />}
                                    label="Programmé"
                                    size="small"
                                    sx={{
                                      background: isDarkMode 
                                        ? "linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.1))"
                                        : "linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(234, 179, 8, 0.05))",
                                      color: isDarkMode ? "#facc15" : "#eab308",
                                      border: `1px solid ${isDarkMode ? "rgba(250, 204, 21, 0.3)" : "rgba(250, 204, 21, 0.2)"}`,
                                      fontWeight: 600,
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      "& .MuiChip-icon": {
                                        color: isDarkMode ? "#facc15" : "#eab308",
                                      },
                                    }}
                                  />
                                ) : ticket.consomme === "expiré" ? (
                                  <Chip
                                    icon={<ClockIcon style={{ height: 14, width: 14 }} />}
                                    label="Expiré"
                                    size="small"
                                    sx={{
                                      background: isDarkMode 
                                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))"
                                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
                                      color: isDarkMode ? "#f87171" : "#ef4444",
                                      border: `1px solid ${isDarkMode ? "rgba(248, 113, 113, 0.3)" : "rgba(239, 68, 68, 0.2)"}`,
                                      fontWeight: 600,
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      "& .MuiChip-icon": {
                                        color: isDarkMode ? "#f87171" : "#ef4444",
                                      },
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    icon={<ClockIcon style={{ height: 14, width: 14 }} />}
                                    label="Non consommé"
                                    size="small"
                                    sx={{
                                      background: isDarkMode 
                                        ? "linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.1))"
                                        : "linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.05))",
                                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                                      border: `1px solid ${isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(107, 114, 128, 0.2)"}`,
                                      fontWeight: 600,
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      "& .MuiChip-icon": {
                                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                                      },
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: isDarkMode ? "#fff" : "#1f2937",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {ticket.cadeau?.valeur
                                    ? `${ticket.cadeau.valeur} $`
                                    : "N/A"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                  {/* Pagination Material-UI */}
                  <TablePagination
                    component="div"
                    count={totalTickets}
                    page={currentPage - 1} // Material-UI utilise 0-based index
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
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
                    </TableContainer>
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
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-md">
                            <GiftIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Catalogue des cadeaux</h3>
                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                              <span>Exportation disponible : Page actuelle | Tous les résultats (avec filtres)</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Boutons d'exportation */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleExportCadeauxCurrentPage}
                            className={`${themeColors.buttonSecondary} p-2 rounded-md flex items-center relative group`}
                            disabled={exportLoading || loading || cadeaux.length === 0}
                            title="Exporter la page actuelle (filtrée ou non)"
                          >
                            {exportLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                            ) : (
                              <DocumentArrowDownIcon className="h-5 w-5" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                              Exporter la page actuelle
                            </div>
                          </button>
                          <button
                            onClick={handleExportCadeauxAll}
                            className={`${themeColors.buttonSecondary} p-2 rounded-md flex items-center relative group`}
                            disabled={exportLoading || loading}
                            title="Exporter tous les résultats (avec filtres actifs)"
                          >
                            {exportLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                            ) : (
                              <DocumentArrowDownIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                            {/* Tooltip */}
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                              Exporter tous les résultats
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
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
                          <li key={cadeau.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200">
                            <div className="px-6 py-5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  {cadeau.image_url ? (
                                    <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-md">
                                      <img
                                        src={cadeau.image_url}
                                        alt={cadeau.nom}
                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src =
                                            "https://placehold.co/64x64/gray/white?text=N/A";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex-shrink-0 flex items-center justify-center shadow-md">
                                      <GiftIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                        {cadeau.nom}
                                      </h4>
                                      <div
                                        className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${
                                          cadeau.actif
                                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-200 border-green-200 dark:border-green-700"
                                            : "bg-gradient-to-r from-red-50 to-red-100 text-red-800 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-200 border-red-200 dark:border-red-700"
                                        }`}
                                      >
                                        {cadeau.actif ? (
                                          <span className="flex items-center">
                                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                                            Actif
                                          </span>
                                        ) : (
                                          <span className="flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            Inactif
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                      {cadeau.description || "Aucune description disponible"}
                                    </p>
                                    {cadeau.valeur && (
                                      <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                          {cadeau.valeur} $
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-shrink-0 items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => handleEditCadeau(cadeau)}
                                    className="group relative inline-flex items-center p-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    title="Modifier"
                                  >
                                    <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCadeau(cadeau)}
                                    className="group relative inline-flex items-center p-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    title="Supprimer"
                                  >
                                    <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                  </button>
                                </div>
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
                    <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
                        <GiftIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        Aucun cadeau disponible
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Commencez par ajouter un nouveau cadeau à votre catalogue pour offrir des options à vos utilisateurs.
                      </p>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleAddCadeau()}
                          className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                        >
                          <PlusIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
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
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 border-opacity-20"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-600 absolute top-0 left-0"></div>
                      </div>
                      <Typography variant="body1" ml={0} color="textSecondary" className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                        Chargement de la vérification des tickets...
                      </Typography>
                    </div>
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
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full mx-auto mb-4">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer le cadeau
                  <span className="font-semibold text-gray-900 dark:text-white mx-1">
                    {cadeauToDelete?.nom || ""}
                  </span>
                  ?
                  <br />
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Cette action est irréversible.
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                  <button
                    onClick={handleCloseDeleteModal}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDeleteCadeau}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
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
