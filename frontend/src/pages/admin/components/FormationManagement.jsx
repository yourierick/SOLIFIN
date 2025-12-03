import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  TablePagination,
  InputAdornment,
  Menu,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Publish as PublishIcon,
  HourglassEmpty as HourglassEmptyIcon,
  EditNote as EditNoteIcon,
  HelpOutline as HelpOutlineIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import FormationForm from "./FormationForm";
import FormationDetail from "./FormationDetail";
import { useAuth } from "../../../contexts/AuthContext";
import Notification from "../../../components/Notification";

const FormationManagement = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);

  const [currentFormation, setCurrentFormation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fonction pour récupérer la liste des formations
  const fetchFormations = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/admin/formations?page=${page}&per_page=${rowsPerPage}`;

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }

      const response = await axios.get(url);

      setFormations(response.data.data.data);
      setTotal(response.data.data.total);
      setTotalPages(
        Math.ceil(response.data.data.total / response.data.data.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération des formations:", err);
      setError(
        "Impossible de charger les formations. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les formations au chargement du composant et lorsque les filtres changent
  useEffect(() => {
    fetchFormations();
  }, [page, rowsPerPage, searchQuery, statusFilter, typeFilter]);

  // Gérer le changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1); // +1 parce que Material-UI utilise 0-based index
  };

  // Gérer le changement de nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Revenir à la première page
  };

  // Fonction pour ouvrir le formulaire d'ajout
  const handleAddFormation = () => {
    setCurrentFormation(null);
    setOpenFormDialog(true);
  };

  // Fonction pour ouvrir le formulaire d'édition
  const handleEditFormation = (formation) => {
    setCurrentFormation(formation);
    setOpenFormDialog(true);
  };

  // Fonction pour ouvrir la boîte de dialogue de suppression
  const handleDeleteClick = (formation) => {
    setCurrentFormation(formation);
    setOpenDeleteDialog(true);
  };

  // Fonction pour supprimer une formation
  const handleDeleteFormation = async () => {
    try {
      await axios.delete(`/api/admin/formations/${currentFormation.id}`);
      fetchFormations();
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error("Erreur lors de la suppression de la formation:", err);
      setError(
        "Impossible de supprimer la formation. Veuillez réessayer plus tard."
      );
    }
  };

  // Fonction pour ouvrir la boîte de dialogue de détails
  const handleViewDetails = (formation) => {
    setCurrentFormation(formation);
    setOpenDetailDialog(true);
  };

  // Fonction pour ouvrir la boîte de dialogue de validation/rejet
  const handleReviewClick = (formation) => {
    setCurrentFormation(formation);
    setRejectionReason("");
    setOpenReviewDialog(true);
  };

  // Fonction pour ouvrir la boîte de dialogue de publication
  const handlePublishClick = (formation) => {
    setCurrentFormation(formation);
    setOpenPublishDialog(true);
  };

  // Fonction pour valider ou rejeter une formation
  const handleReviewFormation = async (status) => {
    try {
      const data = {
        status: status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
      };

      await axios.post(
        `/api/admin/formations/${currentFormation.id}/review`,
        data
      );
      fetchFormations();
      setOpenReviewDialog(false);
      Notification.success(
        status === "published"
          ? "Formation validée avec succès"
          : "Formation rejetée avec succès"
      );
    } catch (err) {
      Notification.error("Erreur lors de la validation/rejet de la formation");
      setError(
        "Impossible de traiter cette formation. Veuillez réessayer plus tard."
      );
    }
  };

  // Fonction pour publier une formation
  const handlePublishFormation = async () => {
    try {
      const response = await axios.post(
        `/api/admin/formations/${currentFormation.id}/publish`
      );

      if (response.data.success) {
        fetchFormations();
        setOpenPublishDialog(false);
        Notification.success("Formation publiée avec succès");
      } else {
        Notification.error(
          response.data.message ||
            "Erreur lors de la publication de la formation"
        );
      }
    } catch (err) {
      Notification.error(
        err.response?.data?.message ||
          "Erreur lors de la publication de la formation"
      );
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const handleFormSubmit = () => {
    fetchFormations();
    setOpenFormDialog(false);
  };

  // Fonction pour afficher le statut avec la couleur appropriée
  const renderStatus = (status, formation) => {
    const statusConfig = {
      pending: {
        label: "En attente",
        icon: <HourglassEmptyIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(144, 205, 244, 0.15)",
            color: "#90CDF4",
            border: "1px solid rgba(144, 205, 244, 0.3)",
          },
          light: {
            bg: "rgba(43, 108, 176, 0.08)",
            color: "#2B6CB0",
            border: "1px solid rgba(43, 108, 176, 0.2)",
          },
        },
      },
      published: {
        label: "Publiée",
        icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(154, 230, 180, 0.15)",
            color: "#9AE6B4",
            border: "1px solid rgba(154, 230, 180, 0.3)",
          },
          light: {
            bg: "rgba(39, 103, 73, 0.08)",
            color: "#276749",
            border: "1px solid rgba(39, 103, 73, 0.2)",
          },
        },
      },
      rejected: {
        label: "Rejetée",
        icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(254, 178, 178, 0.15)",
            color: "#FEB2B2",
            border: "1px solid rgba(254, 178, 178, 0.3)",
          },
          light: {
            bg: "rgba(197, 48, 48, 0.08)",
            color: "#C53030",
            border: "1px solid rgba(197, 48, 48, 0.2)",
          },
        },
      },
      draft: {
        label: "Brouillon",
        icon: <EditNoteIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(246, 224, 94, 0.15)",
            color: "#F6E05E",
            border: "1px solid rgba(246, 224, 94, 0.3)",
          },
          light: {
            bg: "rgba(151, 90, 22, 0.08)",
            color: "#975A16",
            border: "1px solid rgba(151, 90, 22, 0.2)",
          },
        },
      },
      default: {
        label: "Inconnu",
        icon: <HelpOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(226, 232, 240, 0.15)",
            color: "#E2E8F0",
            border: "1px solid rgba(226, 232, 240, 0.3)",
          },
          light: {
            bg: "rgba(74, 85, 104, 0.08)",
            color: "#4A5568",
            border: "1px solid rgba(74, 85, 104, 0.2)",
          },
        },
      },
    };

    const config = statusConfig[status] || statusConfig.default;
    const theme = isDarkMode ? config.colors.dark : config.colors.light;

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "16px",
          py: 0.5,
          px: 1.5,
          backgroundColor: theme.bg,
          color: theme.color,
          border: theme.border,
          fontWeight: 500,
          fontSize: "0.75rem",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 0 0 1px ${theme.color}`,
            transform: "translateY(-1px)",
          },
        }}
      >
        {config.icon}
        {config.label}
      </Box>
    );
  };

  // Fonction pour afficher le type avec la couleur appropriée
  const renderType = (type) => {
    const typeConfig = {
      admin: {
        label: "Admin",
        icon: <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(99, 179, 237, 0.15)",
            color: "#63B3ED",
            border: "1px solid rgba(99, 179, 237, 0.3)",
          },
          light: {
            bg: "rgba(44, 82, 130, 0.08)",
            color: "#2C5282",
            border: "1px solid rgba(44, 82, 130, 0.2)",
          },
        },
      },
      user: {
        label: "Utilisateur",
        icon: <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(183, 148, 244, 0.15)",
            color: "#B794F4",
            border: "1px solid rgba(183, 148, 244, 0.3)",
          },
          light: {
            bg: "rgba(85, 60, 154, 0.08)",
            color: "#553C9A",
            border: "1px solid rgba(85, 60, 154, 0.2)",
          },
        },
      },
      default: {
        label: "Inconnu",
        icon: <HelpOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />,
        colors: {
          dark: {
            bg: "rgba(226, 232, 240, 0.15)",
            color: "#E2E8F0",
            border: "1px solid rgba(226, 232, 240, 0.3)",
          },
          light: {
            bg: "rgba(74, 85, 104, 0.08)",
            color: "#4A5568",
            border: "1px solid rgba(74, 85, 104, 0.2)",
          },
        },
      },
    };

    const config = typeConfig[type] || typeConfig.default;
    const theme = isDarkMode ? config.colors.dark : config.colors.light;

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "16px",
          py: 0.5,
          px: 1.5,
          backgroundColor: theme.bg,
          color: theme.color,
          border: theme.border,
          fontWeight: 500,
          fontSize: "0.75rem",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 0 0 1px ${theme.color}`,
            transform: "translateY(-1px)",
          },
        }}
      >
        {config.icon}
        {config.label}
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            width: { xs: 36, sm: 42, md: 48 },
            height: { xs: 36, sm: 42, md: 48 },
            borderRadius: { xs: 2, sm: 2.5 },
            background: isDarkMode
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDarkMode
              ? "0 6px 16px rgba(102, 126, 234, 0.4)"
              : "0 6px 16px rgba(102, 126, 234, 0.3)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "scale(1.05) rotate(5deg)",
              boxShadow: isDarkMode
                ? "0 8px 20px rgba(102, 126, 234, 0.5)"
                : "0 8px 20px rgba(102, 126, 234, 0.4)",
            },
          }}
        >
          <SchoolIcon
            sx={{
              fontSize: { xs: 20, sm: 24, md: 28 },
              color: "#fff",
            }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.5rem" },
            fontWeight: 700,
            background: isDarkMode
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Gestion des Formations
        </Typography>
      </Box>

      {/* Bouton pour afficher/masquer les filtres */}
      <Button
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={() => setShowFilters(!showFilters)}
        sx={{
          mb: 2,
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 500,
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)",
          color: isDarkMode ? "#e0e0e0" : "#333333",
          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
          "&:hover": {
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
      </Button>

      {/* Filtres et recherche - conditionnel */}
      {showFilters && (
        <Card
        elevation={0}
        sx={{
          mb: { xs: 2, sm: 3 },
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode
            ? "linear-gradient(145deg, #1f2937 0%, #1a202c 100%)"
            : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid",
          borderColor: isDarkMode
            ? "rgba(102, 126, 234, 0.2)"
            : "rgba(102, 126, 234, 0.15)",
          borderRadius: { xs: "14px", sm: "18px" },
          overflow: "hidden",
          boxShadow: isDarkMode
            ? "0 10px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDarkMode
              ? "0 15px 50px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)"
              : "0 15px 50px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)",
            borderColor: isDarkMode
              ? "rgba(102, 126, 234, 0.4)"
              : "rgba(102, 126, 234, 0.3)",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: { xs: 1.5, sm: 2 },
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                borderRadius: "8px",
                background: isDarkMode
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: { xs: 0.5, sm: 1 },
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                  : "0 4px 12px rgba(102, 126, 234, 0.2)",
              }}
            >
              <FilterListIcon
                sx={{ color: "#fff", fontSize: { xs: 16, sm: 18 } }}
              />
            </Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                fontSize: { xs: "0.95rem", sm: "1.1rem" },
              }}
            >
              Filtres
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setTypeFilter("");
                setPage(1);
                setRowsPerPage(25); // Réinitialiser à 25 par défaut
                fetchFormations();
              }}
              sx={{
                textTransform: "none",
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                color: "text.secondary",
                minWidth: "auto",
                px: { xs: 1, sm: 2 },
              }}
            >
              Réinitialiser
            </Button>
          </Box>
          <Grid
            container
            spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
            alignItems="center"
          >
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Rechercher"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon color="action" />,
                  sx: {
                    borderRadius: "8px",
                    "&:hover": {
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                    },
                    transition: "all 0.2s",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  label="Statut"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: "8px",
                    "&:hover": {
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="draft">Brouillon</MenuItem>
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="published">Publié</MenuItem>
                  <MenuItem value="rejected">Rejeté</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                  sx={{
                    borderRadius: "8px",
                    "&:hover": {
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">Utilisateur</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                onClick={handleAddFormation}
                fullWidth
                sx={{
                  borderRadius: { xs: "10px", sm: "12px" },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  py: { xs: 1, sm: 1.25 },
                  background: isDarkMode
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: isDarkMode
                    ? "0 6px 20px rgba(102, 126, 234, 0.4)"
                    : "0 6px 20px rgba(102, 126, 234, 0.3)",
                  "&:hover": {
                    background: isDarkMode
                      ? "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)"
                      : "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                    boxShadow: isDarkMode
                      ? "0 8px 25px rgba(102, 126, 234, 0.5)"
                      : "0 8px 25px rgba(102, 126, 234, 0.4)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  Ajouter
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: "inline", sm: "none" } }}
                >
                  Nouvelle formation
                </Box>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      )}

      {/* Tableau des formations avec design simplifié */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <CircularProgress size={40} thickness={4} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            my: 2,
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
          }}
        >
          {error}
        </Alert>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            mb: 2,
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
          }}
        >
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: isDarkMode ? "#252525" : "#f5f5f5" }}>
                  {[
                    { id: "title", label: "Titre" },
                    { id: "type", label: "Type" },
                    { id: "status", label: "Statut" },
                    { id: "creator", label: "Créé par" },
                    { id: "date", label: "Date" },
                    { id: "actions", label: "Actions", align: "center" },
                  ].map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || "left"}
                      sx={{
                        fontWeight: 600,
                        color: isDarkMode ? "#e0e0e0" : "#333333",
                        borderBottom: "1px solid",
                        borderBottomColor: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
                        py: 2,
                        px: 2,
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {formations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                          Aucune formation trouvée
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Essayez de modifier vos critères de recherche ou d'ajouter une nouvelle formation
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  formations.map((formation) => (
                    <TableRow
                      key={formation.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                        },
                        borderBottom: "1px solid",
                        borderBottomColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#e0e0e0" : "#333333" }}>
                        <Tooltip title={formation.title} placement="top-start" arrow>
                          <Typography
                            variant="body2"
                            fontWeight="500"
                            noWrap
                            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {formation.title}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2 }}>
                        {renderType(formation.type)}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2 }}>
                        {renderStatus(formation.status, formation)}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#b0b0b0" : "#666666" }}>
                        {formation.creator?.name || "N/A"}
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#b0b0b0" : "#666666" }}>
                        {new Date(formation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2, px: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Tooltip title="Voir les détails" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(formation)}
                              sx={{ color: isDarkMode ? "#90caf9" : "#1976d2" }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {formation.creator.id === user.id && (
                            <Tooltip title="Modifier" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleEditFormation(formation)}
                                sx={{ color: isDarkMode ? "#b0b0b0" : "#666666" }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Supprimer" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(formation)}
                              sx={{ color: isDarkMode ? "#ef5350" : "#d32f2f" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {formation.status === "pending" && (
                            <Tooltip title="Valider/Rejeter" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleReviewClick(formation)}
                                sx={{ color: isDarkMode ? "#66bb6a" : "#388e3c" }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {formation.status === "published" && (
                            <Tooltip title="Dépublier" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handlePublishClick(formation)}
                                sx={{ color: isDarkMode ? "#ffa726" : "#f57c00" }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {formation.status === "draft" && (
                            <Tooltip title="Publier" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handlePublishClick(formation)}
                                sx={{ color: isDarkMode ? "#66bb6a" : "#388e3c" }}
                              >
                                <PublishIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* TablePagination Material-UI simplifié */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page - 1}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `plus de ${to}`}`
            }
            sx={{
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderTop: "1px solid",
              borderTopColor: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
              "& .MuiTablePagination-toolbar": {
                minHeight: "52px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                color: isDarkMode ? "#e0e0e0" : "#333333",
              },
              "& .MuiTablePagination-select": {
                color: isDarkMode ? "#e0e0e0" : "#333333",
              },
              "& .MuiTablePagination-actions .MuiIconButton-root": {
                color: isDarkMode ? "#b0b0b0" : "#666666",
              },
            }}
          />
        </Paper>
      )}

      {/* Boîte de dialogue de formulaire */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(16, 15, 15, 0.4)",
          },
        }}
      >
        <DialogTitle>
          {currentFormation ? "Modifier la formation" : "Ajouter une formation"}
        </DialogTitle>
        <DialogContent>
          <FormationForm
            formation={currentFormation}
            onSubmit={handleFormSubmit}
            onCancel={() => setOpenFormDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de détails */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Détails de la formation</DialogTitle>
        <DialogContent>
          {currentFormation && (
            <FormationDetail
              formationId={currentFormation.id}
              onClose={() => setOpenDetailDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de suppression */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer la formation "
            {currentFormation?.title}" ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteFormation} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de validation/rejet */}
      <Dialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Valider ou rejeter la formation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Voulez-vous valider ou rejeter la formation "
            {currentFormation?.title}" ?
          </DialogContentText>
          <TextField
            label="Raison du rejet (obligatoire en cas de rejet)"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Annuler</Button>
          <Button
            onClick={() => handleReviewFormation("rejected")}
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Rejeter
          </Button>
          <Button
            onClick={() => handleReviewFormation("published")}
            color="success"
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de publication */}
      <Dialog
        open={openPublishDialog}
        onClose={() => setOpenPublishDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Confirmer la publication</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir publier la formation "
            {currentFormation?.title}" ? Une fois publiée, elle sera visible par
            tous les utilisateurs.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPublishDialog(false)}>Annuler</Button>
          <Button onClick={handlePublishFormation} color="success">
            Publier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormationManagement;
