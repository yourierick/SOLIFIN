import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAuth } from "../../../contexts/AuthContext";
import * as XLSX from "xlsx";
import {
  QrCodeIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  GiftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Notification from "../../../components/Notification";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Material UI imports
import {
  Modal,
  Box,
  Typography,
  Button,
  Backdrop,
  Fade,
  Divider,
  IconButton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  TablePagination,
  Alert,
} from "@mui/material";

/**
 * Composant pour la vérification des tickets gagnants
 * Permet de vérifier la validité d'un ticket et de le marquer comme consommé
 */
const TicketVerification = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("verification"); // "verification" ou "historique"
  const [historiqueTickets, setHistoriqueTickets] = useState([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [historiqueError, setHistoriqueError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTickets, setTotalTickets] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [filterDateExpirationDebut, setFilterDateExpirationDebut] = useState("");
  const [filterDateExpirationFin, setFilterDateExpirationFin] = useState("");
  const [filterConsomme, setFilterConsomme] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // États pour gérer l'ouverture/fermeture du modal
  const [openModal, setOpenModal] = useState(false);

  // États pour la programmation de la remise du cadeau
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRemise, setDateRemise] = useState("");
  const [heureRemise, setHeureRemise] = useState("");

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

  // Rechercher un ticket par son code de vérification
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Veuillez saisir le code de vérification du ticket");
      return;
    }

    setLoading(true);
    setError(null);
    setTicket(null);
    setVerificationSuccess(false);
    setVerificationError(null);

    try {
      // Appel à l'API pour rechercher le ticket par son code de vérification
      const response = await axios.get(`/api/admin/tickets/${code}`);
      if (response.data.success) {
        setTicket(response.data.data);
        // Ouvrir le modal lorsqu'un ticket est trouvé
        setOpenModal(true);
      } else {
        setError(response.data.message || "Ticket non trouvé");
        toast.error(response.data.message || "Ticket non trouvé", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (err) {
      console.error("Erreur lors de la recherche du ticket:", err);
      const errorMessage =
        err.response?.data?.message || "Erreur lors de la recherche du ticket";
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Consommer directement le ticket sans demander à nouveau le code de vérification
  const handleConsumeTicket = async () => {
    if (!ticket || !ticket.id) {
      return;
    }

    setLoading(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      // Appel à l'API pour consommer directement le ticket
      const response = await axios.post(
        `/api/admin/tickets/${ticket.id}/consommer`
      );

      if (response.data.success) {
        setVerificationSuccess(true);
        setTicket({
          ...ticket,
          consomme: "consommé",
          date_consommation: new Date().toISOString(),
        });
        toast.success(
          "Ticket validé avec succès ! Le cadeau peut être remis.",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      } else {
        setVerificationError(
          response.data.message || "Erreur lors de la consommation du ticket"
        );
        toast.error(
          response.data.message || "Erreur lors de la consommation du ticket",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    } catch (err) {
      console.error("Erreur lors de la consommation du ticket:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Erreur lors de la consommation du ticket";
      setVerificationError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Afficher le formulaire de programmation de la remise
  const handleShowScheduleForm = () => {
    setShowDatePicker(true);
  };

  // Consommer le ticket avec une date de remise programmée
  const handleScheduledConsume = async () => {
    if (!ticket || !ticket.id || !dateRemise) {
      toast.error("Veuillez sélectionner une date de remise", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    setLoading(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      // Créer un objet Date combiné avec la date et l'heure
      let scheduledDate;
      if (heureRemise) {
        const [hours, minutes] = heureRemise.split(":");
        scheduledDate = new Date(dateRemise);
        scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      } else {
        scheduledDate = new Date(dateRemise);
      }

      // Appel à l'API pour programmer la remise du ticket avec une date programmée
      const response = await axios.post(
        `/api/admin/tickets/${ticket.id}/programmer`,
        { date_programmee: scheduledDate.toISOString() }
      );

      if (response.data.success) {
        setVerificationSuccess(true);
        setTicket({
          ...ticket,
          consomme: "programmé",
          date_consommation: scheduledDate.toISOString(),
          remise_programmee: true,
        });
        toast.success(
          `Remise programmée pour le ${formatDate(scheduledDate)}`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
        setShowDatePicker(false);
      } else {
        setVerificationError(
          response.data.message ||
            "Erreur lors de la programmation de la remise"
        );
        toast.error(
          response.data.message ||
            "Erreur lors de la programmation de la remise",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    } catch (err) {
      console.error("Erreur lors de la programmation de la remise:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Erreur lors de la programmation de la remise";
      setVerificationError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
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

  // Charger l'historique des tickets consommés
  const loadHistoriqueTickets = async (page = 1) => {
    setHistoriqueLoading(true);
    setHistoriqueError(null);

    try {
      // Construction des paramètres de requête avec les filtres
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("per_page", rowsPerPage);

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (filterDateDebut) {
        params.append("date_debut", filterDateDebut);
      }

      if (filterDateFin) {
        params.append("date_fin", filterDateFin);
      }

      const response = await axios.get(
        `/api/admin/tickets/my-history?${params.toString()}`
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
        `/api/admin/tickets/my-history?${params.toString()}`
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

  // Charger l'historique quand on change d'onglet
  useEffect(() => {
    if (activeTab === "historique") {
      loadHistoriqueTicketsWithRowsPerPage(1, rowsPerPage);
    }
  }, [activeTab]);

  // Effet pour recharger les données lorsque rowsPerPage change
  useEffect(() => {
    if (activeTab === "historique" && currentPage > 0) {
      loadHistoriqueTicketsWithRowsPerPage(currentPage, rowsPerPage);
    }
  }, [rowsPerPage]);

  // Fonction pour formater les données pour l'exportation
  const formatDataForExport = (tickets) => {
    return tickets.map((ticket) => ({
      "Code de vérification": ticket.code_verification || "N/A",
      "Nom du cadeau": ticket.cadeau?.nom || "N/A",
      "Description du cadeau": ticket.cadeau?.description || "N/A",
      "Valeur du cadeau": ticket.cadeau?.valeur ? `${ticket.cadeau.valeur} $` : "N/A",
      "Nom du bénéficiaire": ticket.user?.name || "N/A",
      "Email du bénéficiaire": ticket.user?.email || "N/A",
      "Statut de consommation": ticket.consomme || "N/A",
      "Date de consommation": ticket.date_consommation ? formatDate(ticket.date_consommation) : "Non défini",
      "Date d'expiration": ticket.date_expiration ? formatDate(ticket.date_expiration) : "Non défini",
      "Distributeur": ticket.admin?.name || "N/A",
      "Email du distributeur": ticket.admin?.email || "N/A",
    }));
  };

  // Fonction pour exporter les données vers Excel
  const exportToExcel = (data, filename) => {
    try {
      const formattedData = formatDataForExport(data);
      const ws = XLSX.utils.json_to_sheet(formattedData);
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 20 }, // Code de vérification
        { wch: 25 }, // Nom du cadeau
        { wch: 30 }, // Description du cadeau
        { wch: 15 }, // Valeur du cadeau
        { wch: 25 }, // Nom du bénéficiaire
        { wch: 30 }, // Email du bénéficiaire
        { wch: 20 }, // Statut de consommation
        { wch: 25 }, // Date de consommation
        { wch: 25 }, // Date d'expiration
        { wch: 20 }, // Distributeur
        { wch: 30 }, // Email du distributeur
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");
      
      // Générer le nom du fichier avec la date actuelle
      const today = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const finalFilename = `${filename}_${today}.xlsx`;
      
      XLSX.writeFile(wb, finalFilename);
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel:", error);
      toast.error("Erreur lors de l'exportation du fichier Excel", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // Fonction pour exporter la page actuelle
  const handleExportCurrentPage = async () => {
    setExportLoading(true);
    try {
      if (historiqueTickets.length === 0) {
        toast.warning("Aucune donnée à exporter", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }
      
      exportToExcel(historiqueTickets, "tickets_page_actuelle");
      toast.success("Exportation de la page actuelle réussie", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erreur lors de l'exportation de la page actuelle:", error);
      toast.error("Erreur lors de l'exportation", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonction pour exporter tous les tickets
  const handleExportAll = async () => {
    setExportLoading(true);
    try {
      // Construire les paramètres de requête avec les filtres actuels
      const params = new URLSearchParams();
      
      // Ajouter tous les filtres actuels
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (filterDateDebut) {
        params.append("date_debut", filterDateDebut);
      }
      if (filterDateFin) {
        params.append("date_fin", filterDateFin);
      }
      if (filterDateExpirationDebut) {
        params.append("date_expiration_debut", filterDateExpirationDebut);
      }
      if (filterDateExpirationFin) {
        params.append("date_expiration_fin", filterDateExpirationFin);
      }
      if (filterConsomme !== "") {
        params.append("consomme", filterConsomme);
      }
      
      // Demander tous les résultats (sans pagination)
      params.append("per_page", "999999");
      params.append("page", "1");
      
      const response = await axios.get(
        `/api/admin/tickets/my-history?${params.toString()}`
      );

      if (response.data.success && response.data.data.data.length > 0) {
        exportToExcel(response.data.data.data, "tous_les_tickets");
        toast.success(`Exportation de ${response.data.data.data.length} tickets réussie`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.warning("Aucune donnée à exporter avec les filtres actuels", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'exportation complète:", error);
      toast.error("Erreur lors de l'exportation des données", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Style pour le modal Material UI amélioré
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 800,
    maxHeight: "90vh",
    bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    borderRadius: "20px",
    p: 0,
    color: isDarkMode ? "#fff" : "#111827",
    outline: "none",
    backdropFilter: "blur(10px)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.05)",
    zIndex: 1000,
    overflow: "hidden",
  };

  // Style pour le backdrop du modal
  const backdropStyle = {
    backdropFilter: "blur(3px)",
    backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
  };

  return (
    <div className={`${themeColors.bg} ${themeColors.text} p-8 rounded-2xl shadow-xl border ${themeColors.border}`}>
      {/* Header amélioré avec design moderne */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
            <TicketIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Gestion des tickets gagnants
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Vérifiez et consultez l'historique des tickets
            </p>
          </div>
        </div>
      </div>

      {/* Modal Material UI pour afficher les détails du ticket */}
      <Modal
        aria-labelledby="ticket-details-modal-title"
        aria-describedby="ticket-details-modal-description"
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: backdropStyle,
        }}
      >
        <Fade in={openModal}>
          <Box sx={modalStyle}>
            {ticket && (
              <>
                {/* Header du modal amélioré */}
                <Box
                  sx={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, #1f2937 0%, #374151 100%)"
                      : "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
                    p: 4,
                    borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", spaceX: 3 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <TicketIcon sx={{ height: 24, width: 24, color: "white" }} />
                      </Box>
                      <Box>
                        <Typography
                          id="ticket-details-modal-title"
                          variant="h5"
                          component="h2"
                          sx={{ fontWeight: "bold", mb: 0.5 }}
                        >
                          Détails du ticket
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code : {ticket.code_verification}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", spaceX: 2 }}>
                      <Paper
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: "20px",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          background: 
                            ticket.consomme === "consommé"
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : isExpired(ticket)
                              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                              : ticket.consomme === "programmé"
                              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                              : ticket.consomme === "non consommé"
                              ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                              : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                          color: "white",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {ticket.consomme === "consommé" && <CheckCircleIcon sx={{ height: 16, width: 16, mr: 1 }} />}
                        {ticket.consomme === "programmé" && <ClockIcon sx={{ height: 16, width: 16, mr: 1 }} />}
                        {isExpired(ticket) && <XCircleIcon sx={{ height: 16, width: 16, mr: 1 }} />}
                        {ticket.consomme === "non consommé" && <TicketIcon sx={{ height: 16, width: 16, mr: 1 }} />}
                        {ticket.consomme === "consommé"
                          ? "Consommé"
                          : ticket.consomme === "programmé"
                          ? "Programmé"
                          : isExpired(ticket)
                          ? "Expiré"
                          : ticket.consomme === "non consommé"
                          ? "Non consommé"
                          : "Expiré"}
                      </Paper>
                      <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        sx={{
                          color: isDarkMode ? "grey.400" : "grey.600",
                          "&:hover": {
                            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        <XMarkIcon sx={{ height: 20, width: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
                {/* Contenu du modal amélioré */}
                <Box sx={{ p: 4, maxHeight: "60vh", overflowY: "auto" }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                    }}
                  >
                    {/* Carte Cadeau */}
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        background: isDarkMode 
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                        border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"}`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                            mr: 2,
                          }}
                        >
                          <GiftIcon sx={{ height: 20, width: 20, color: "white" }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                          CADEAU
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {ticket.cadeau?.nom || "Non défini"}
                      </Typography>
                      {ticket.cadeau?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {ticket.cadeau.description}
                        </Typography>
                      )}
                      {ticket.cadeau?.valeur && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 2,
                            py: 1,
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            fontSize: "0.875rem",
                            fontWeight: "bold",
                          }}
                        >
                          {ticket.cadeau.valeur} $
                        </Box>
                      )}
                    </Paper>

                    {/* Carte Bénéficiaire */}
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        background: isDarkMode 
                          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
                        border: `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)"}`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            mr: 2,
                          }}
                        >
                          <UserIcon sx={{ height: 20, width: 20, color: "white" }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                          BÉNÉFICIAIRE
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {ticket.user?.name || "Non défini"}
                      </Typography>
                      {ticket.user?.email && (
                        <Typography variant="body2" color="text.secondary">
                          {ticket.user.email}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  {/* Deuxième ligne d'informations */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                      mt: 3,
                    }}
                  >
                    {/* Carte Dates */}
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        background: isDarkMode 
                          ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)",
                        border: `1px solid ${isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)"}`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            mr: 2,
                          }}
                        >
                          <CalendarIcon sx={{ height: 20, width: 20, color: "white" }} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                          DATES IMPORTANTES
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Date d'expiration
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(ticket.date_expiration)}
                        </Typography>
                      </Box>
                      {ticket.consomme === "consommé" && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Date de consommation
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatDate(ticket.date_consommation)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>

                    {/* Carte Actions */}
                    {ticket.consomme === "non consommé" && (
                      <Paper
                        sx={{
                          p: 3,
                          borderRadius: "16px",
                          background: isDarkMode 
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)"
                            : "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)",
                          border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"}`,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              mr: 2,
                            }}
                          >
                            <CheckCircleIcon sx={{ height: 20, width: 20, color: "white" }} />
                          </Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: "bold" }}>
                            VALIDATION
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Valider le ticket
                        </Typography>

                        {!showDatePicker ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 2,
                          flexWrap: "nowrap",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleConsumeTicket}
                          disabled={loading}
                          startIcon={
                            loading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <ShoppingBagIcon className="h-5 w-5" />
                            )
                          }
                          sx={{ py: 1.5, px: 3 }}
                        >
                          Marquer comme consommé
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleShowScheduleForm}
                          disabled={loading}
                          startIcon={<CalendarIcon className="h-5 w-5" />}
                          sx={{ py: 1.5, px: 3 }}
                        >
                          Programmer la remise
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mt: 2,
                          p: 3,
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: "medium" }}
                        >
                          Programmer la remise du cadeau
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 2,
                            mb: 3,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Date de remise
                            </Typography>
                            <input
                              type="date"
                              value={dateRemise}
                              onChange={(e) => setDateRemise(e.target.value)}
                              className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                              min={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </Box>

                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Heure de remise (optionnel)
                            </Typography>
                            <input
                              type="time"
                              value={heureRemise}
                              onChange={(e) => setHeureRemise(e.target.value)}
                              className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                            mt: 2,
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => setShowDatePicker(false)}
                            sx={{ py: 1 }}
                          >
                            Annuler
                          </Button>

                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleScheduledConsume}
                            disabled={loading || !dateRemise}
                            startIcon={
                              loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                              ) : null
                            }
                            sx={{ py: 1 }}
                          >
                            Confirmer la programmation
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {verificationError && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: "error.light",
                          color: "error.contrastText",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {verificationError}
                      </Box>
                    )}
                    {verificationSuccess && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: "success.light",
                          color: "success.contrastText",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Le traitement du ticket a été effectué avec succès.
                      </Box>
                    )}
                  </Paper>
                    )}
                  </Box>
                </Box>

                {ticket.consomme === "programmé"  && ticket.distributeur.id === user.id && (
                  <Box
                    sx={{
                      mt: 3,
                      pt: 2,
                      borderTop: 1,
                      borderColor: isDarkMode ? "grey.800" : "grey.200",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Valider le ticket
                    </Typography>

                    {!showDatePicker ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 2,
                          flexWrap: "nowrap",
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleConsumeTicket}
                          disabled={loading}
                          startIcon={
                            loading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <ShoppingBagIcon className="h-5 w-5" />
                            )
                          }
                          sx={{ py: 1.5, px: 3 }}
                        >
                          Consommer et remettre le cadeau
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleShowScheduleForm}
                          disabled={loading}
                          startIcon={<CalendarIcon className="h-5 w-5" />}
                          sx={{ py: 1.5, px: 3 }}
                        >
                          Reprogrammer la remise
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          mt: 2,
                          p: 3,
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: "medium" }}
                        >
                          Programmer la remise du cadeau
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 2,
                            mb: 3,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Date de remise
                            </Typography>
                            <input
                              type="date"
                              value={dateRemise}
                              onChange={(e) => setDateRemise(e.target.value)}
                              className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                              min={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </Box>

                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Heure de remise (optionnel)
                            </Typography>
                            <input
                              type="time"
                              value={heureRemise}
                              onChange={(e) => setHeureRemise(e.target.value)}
                              className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                            mt: 2,
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => setShowDatePicker(false)}
                            sx={{ py: 1 }}
                          >
                            Annuler
                          </Button>

                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleScheduledConsume}
                            disabled={loading || !dateRemise}
                            startIcon={
                              loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                              ) : null
                            }
                            sx={{ py: 1 }}
                          >
                            Confirmer la programmation
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {ticket.consomme === "programmé" && ticket.distributeur.id !== user.id && (
                      <Box
                        sx={{
                          mt: 3,
                          p: 2,
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                          borderRadius: 2,
                        }}
                      >
                        <Alert
                          severity="warning"
                          sx={{ mb: 2 }}
                        >
                          Ce ticket a déjà été programmé pour consommation ultérieure par {ticket.distributeur.name}.
                        </Alert>
                      </Box>
                    )}

                    {verificationError && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: "error.light",
                          color: "error.contrastText",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {verificationError}
                      </Box>
                    )}
                    {verificationSuccess && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          bgcolor: "success.light",
                          color: "success.contrastText",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Le traitement du ticket a été effectué avec succès.
                      </Box>
                    )}
                  </Box>
                )}

                {ticket.consomme === "consommé" && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "success.light",
                      color: "success.contrastText",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Ce ticket a été consommé le{" "}
                    {formatDate(ticket.date_consommation)}.
                  </Box>
                )}

                {ticket.consomme === "expiré" && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "error.light",
                      color: "error.contrastText",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Ce ticket est expiré depuis le{" "}
                    {formatDate(ticket.date_expiration)}.
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Onglets améliorés avec design moderne - Scroll mobile uniquement */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8 shadow-inner overflow-x-auto sm:overflow-x-visible">
        <div className="flex min-w-max sm:min-w-0 sm:w-full">
          <button
            onClick={() => setActiveTab("verification")}
            className={`flex items-center justify-center py-3 px-6 font-medium text-sm rounded-lg transition-all duration-300 min-w-max sm:flex-1 ${
              activeTab === "verification"
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-md transform scale-105"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">Vérification</span>
          </button>
          <button
            onClick={() => setActiveTab("historique")}
            className={`flex items-center justify-center py-3 px-6 font-medium text-sm rounded-lg transition-all duration-300 min-w-max sm:flex-1 ${
              activeTab === "historique"
                ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-md transform scale-105"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            <span className="font-semibold">Historique</span>
          </button>
        </div>
      </div>

      {activeTab === "verification" && (
        <div>
          {/* Section de vérification avec design amélioré */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-8 border border-blue-200 dark:border-blue-800 shadow-lg">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-500 rounded-lg mr-3">
                <QrCodeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Vérification du ticket
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scannez ou entrez le code de vérification
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCodeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez le code de vérification du ticket"
                  className={`w-full pl-10 pr-4 py-3 border ${themeColors.border} rounded-xl ${themeColors.input} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm`}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                )}
                <span className="font-semibold">Vérifier</span>
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center shadow-md">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Section d'information améliorée */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 shadow-md">
            <div className="flex items-start">
              <div className="p-2 bg-amber-500 rounded-lg mr-3 flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h6 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Instructions de vérification
                </h6>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Entrez manuellement le code de vérification du ticket</li>
                  <li>• Le système affichera automatiquement les détails du ticket</li>
                  <li>• Vous pourrez marquer le ticket comme consommé ou programmer sa remise</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "historique" && (
        <div className="w-full overflow-x-hidden">
          {/* Header historique amélioré - Responsive */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Historique des cadeaux
                </h3>
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Exportation disponible : Page actuelle | Tous les résultats (avec filtres)</span>
                  <span className="sm:hidden">Exportation disponible</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full sm:w-auto bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border ${themeColors.border}`}
                title={
                  showFilters ? "Masquer les filtres" : "Afficher les filtres"
                }
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Filtres</span>
                {showFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>
              <button
                onClick={() => loadHistoriqueTicketsWithRowsPerPage(currentPage, rowsPerPage)}
                className={`w-full sm:w-auto bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 border ${themeColors.border}`}
                disabled={historiqueLoading}
                title="Rafraîchir"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Actualiser</span>
              </button>
              
              {/* Boutons d'exportation améliorés - Responsive */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:border-l sm:border-gray-300 sm:dark:border-gray-600 sm:pl-2 sm:ml-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCurrentPage}
                  className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white p-3 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 relative group"
                  disabled={exportLoading || historiqueLoading || historiqueTickets.length === 0}
                  title="Exporter la page actuelle (filtrée ou non)"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  )}
                  <span className="text-sm font-medium">Page</span>
                  {/* Tooltip - Hidden on mobile */}
                  <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Exporter la page actuelle
                  </div>
                </button>
                <button
                  onClick={handleExportAll}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 relative group sm:ml-2"
                  disabled={exportLoading || historiqueLoading}
                  title="Exporter tous les résultats (avec filtres actifs)"
                >
                  {exportLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  )}
                  <span className="text-sm font-medium">Tout</span>
                  {/* Tooltip - Hidden on mobile */}
                  <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Exporter tous les résultats
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Barre de recherche rapide améliorée */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de cadeau, utilisateur, code..."
                className={`w-full pl-10 pr-4 py-3 border ${themeColors.border} rounded-xl ${themeColors.input} focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm`}
              />
            </div>
          </div>

          {/* Filtres avancés améliorés - Responsive (cachés par défaut) */}
          {showFilters && (
            <div className="mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl border border-blue-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md mr-3">
                  <FunnelIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtres avancés</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">État de consommation</h4>
                </div>
                <div className="mt-3">
                  <select
                    name="consomme"
                    id="consomme"
                    value={filterConsomme}
                    onChange={(e) => setFilterConsomme(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <option value="">Tous les tickets</option>
                    <option value="consommé">Tickets consommés</option>
                    <option value="programmé">Tickets programmés</option>
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
                    Page <span className="font-medium">{currentPage}</span> sur{" "}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                )}
              </div>
              
              {/* Tableau responsive pour mobile - Scroll stylisé */}
              <Box
                sx={{
                  overflowX: "auto",
                  "&::-webkit-scrollbar": {
                    height: "6px",
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: isDarkMode
                      ? "rgba(55, 65, 81, 0.4)"
                      : "rgba(0, 0, 0, 0.06)",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: isDarkMode
                      ? "rgba(156, 163, 175, 0.6)"
                      : "rgba(156, 163, 175, 0.4)",
                    borderRadius: "3px",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(156, 163, 175, 0.8)"
                        : "rgba(156, 163, 175, 0.6)",
                    },
                  },
                }}
              >
                <TableContainer 
                  component={Paper}
                  sx={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                    borderRadius: 2,
                    boxShadow: isDarkMode 
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    minWidth: { xs: 680, sm: 750, md: 850 },
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Table 
                    sx={{ 
                      minWidth: { xs: 680, sm: 750, md: 850 },
                      "& .MuiTableCell-root": {
                        borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                        px: { xs: 0.75, sm: 1.5, md: 2 },
                        py: { xs: 0.75, sm: 1.5, md: 2 },
                        fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                      }
                    }}
                  >
                    <TableHead 
                      sx={{
                        backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
                        "& .MuiTableCell-head": {
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontWeight: 600,
                          fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.875rem" },
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          py: { xs: 1, sm: 1.5, md: 2 },
                          px: { xs: 0.75, sm: 1.5, md: 2 },
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ width: { xs: "180px", sm: "200px", md: "250px" } }}>Cadeau</TableCell>
                      <TableCell sx={{ width: { xs: "150px", sm: "170px", md: "200px" } }}>Utilisateur</TableCell>
                      <TableCell sx={{ width: { xs: "100px", sm: "120px", md: "160px" } }}>Statut</TableCell>
                      <TableCell sx={{ width: { xs: "120px", sm: "140px", md: "180px" } }}>Consommation</TableCell>
                      <TableCell sx={{ width: { xs: "120px", sm: "140px", md: "180px" } }}>Expiration</TableCell>
                      <TableCell sx={{ width: { xs: "70px", sm: "80px", md: "100px" } }}>Valeur</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historiqueTickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        sx={{
                          backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                          },
                          transition: "background-color 0.2s ease-in-out",
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {ticket.cadeau?.image_url && (
                              <Box
                                component="img"
                                src={ticket.cadeau.image_url}
                                alt={ticket.cadeau.nom}
                                sx={{
                                  height: { xs: 32, sm: 36, md: 40 },
                                  width: { xs: 32, sm: 36, md: 40 },
                                  borderRadius: "50%",
                                  mr: { xs: 1.5, sm: 2 },
                                  objectFit: "cover",
                                  border: `2px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: isDarkMode ? "#fff" : "#1f2937",
                                  fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                                  lineHeight: { xs: 1.2, sm: 1.3 },
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: { xs: "nowrap", sm: "normal" },
                                }}
                              >
                                {ticket.cadeau?.nom || "N/A"}
                              </Typography>
                              {ticket.code_verification && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                                    fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                                    display: { xs: "none", sm: "block" },
                                  }}
                                >
                                  Code: {ticket.code_verification}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: isDarkMode ? "#fff" : "#1f2937",
                                fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: { xs: "nowrap", sm: "normal" },
                              }}
                            >
                              {ticket.user?.name || "N/A"}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isDarkMode ? "#9ca3af" : "#6b7280",
                                fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                                display: { xs: "none", sm: "block" },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {ticket.user?.email || ""}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {ticket.consomme === "consommé" ? (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 0.5, sm: 0.75 },
                                borderRadius: 1,
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                fontWeight: 500,
                              }}
                            >
                              <CheckCircleIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                              Consommé
                            </Box>
                          ) : ticket.consomme === "programmé" ? (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 0.5, sm: 0.75 },
                                borderRadius: 1,
                                backgroundColor: "#f59e0b",
                                color: "#ffffff",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                fontWeight: 500,
                              }}
                            >
                              <ClockIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                              Programmé
                            </Box>
                          ) : ticket.consomme === "expiré" ? (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 0.5, sm: 0.75 },
                                borderRadius: 1,
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                fontWeight: 500,
                              }}
                            >
                              <XCircleIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                              Expiré
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: { xs: 1.5, sm: 2 },
                                py: { xs: 0.5, sm: 0.75 },
                                borderRadius: 1,
                                backgroundColor: "#6b7280",
                                color: "#ffffff",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                fontWeight: 500,
                              }}
                            >
                              <TicketIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                              Non consommé
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                              fontWeight: 500,
                              whiteSpace: { xs: "nowrap", sm: "normal" },
                            }}
                          >
                            {ticket.date_consommation ? formatDate(ticket.date_consommation) : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isDarkMode ? "#d1d5db" : "#6b7280",
                              fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                              fontWeight: 500,
                              whiteSpace: { xs: "nowrap", sm: "normal" },
                            }}
                          >
                            {formatDate(ticket.date_expiration)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isDarkMode ? "#10b981" : "#059669",
                              fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ticket.cadeau?.valeur ? `${ticket.cadeau.valeur} $` : "-"}
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
                  rowsPerPageOptions={[1, 5, 10, 25, 50]}
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
              </Box>
            </div>
          )}
        </div>
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
        zIndex={9999}
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default TicketVerification;
