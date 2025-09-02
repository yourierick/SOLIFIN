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
} from "@mui/icons-material";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import FormationForm from "./FormationForm";
import FormationDetail from "./FormationDetail";
import Notification from "../../../components/Notification";

const FormationManagement = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      let url = `/api/admin/formations?page=${page}`;

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
  }, [page, searchQuery, statusFilter, typeFilter]);

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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>
        Gestion des Formations
      </Typography>

      {/* Filtres et recherche */}
      <Card
        elevation={2}
        sx={{
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
          border: "1px solid",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "none",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0, 0, 0, 0.4)"
              : "0 8px 24px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
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
                fetchFormations();
              }}
              sx={{
                textTransform: "none",
                fontSize: "0.8rem",
                color: "text.secondary",
              }}
            >
              Réinitialiser
            </Button>
          </Box>
          <Grid container spacing={2} alignItems="center">
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
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddFormation}
                fullWidth
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    boxShadow: "0 6px 15px rgba(0, 0, 0, 0.15)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                Ajouter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau des formations */}
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
        <>
          {/* Nouveau design du tableau avec ascenseur horizontal fonctionnel */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              mb: 3,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: "16px",
                // Styles de l'ascenseur horizontal
                "&::-webkit-scrollbar": {
                  height: "12px",
                  display: "block",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: isDarkMode ? "#2d3748" : "#f1f5f9",
                  borderRadius: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: isDarkMode ? "#4a5568" : "#94a3b8",
                  borderRadius: "8px",
                  border: isDarkMode
                    ? "2px solid #2d3748"
                    : "2px solid #f1f5f9",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#718096" : "#64748b",
                  },
                },
                // Firefox
                scrollbarWidth: "thin",
                scrollbarColor: isDarkMode
                  ? "#4a5568 #2d3748"
                  : "#94a3b8 #f1f5f9",
              }}
            >
              <Table
                stickyHeader
                sx={{
                  borderCollapse: "separate",
                  borderSpacing: "0 8px",
                }}
              >
                <TableHead>
                  <TableRow>
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
                          fontSize: "0.875rem",
                          letterSpacing: "0.025em",
                          textTransform: "uppercase",
                          backgroundColor: isDarkMode ? "#2d3748" : "#edf2f7",
                          color: isDarkMode ? "#e2e8f0" : "#1a202c",
                          borderBottom: isDarkMode
                            ? "2px solid #4a5568"
                            : "2px solid #cbd5e0",
                          py: 2.5,
                          position: "relative",
                          "&:after": {
                            content: '""',
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "0%",
                            height: "2px",
                            backgroundColor: isDarkMode ? "#3182ce" : "#4299e1",
                            transition: "width 0.3s ease",
                          },
                          "&:hover:after": {
                            width: "100%",
                          },
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#3d4a5f" : "#e2e8f0",
                          },
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
                        <Box
                          sx={{
                            py: 6,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isDarkMode
                                ? "rgba(49, 130, 206, 0.1)"
                                : "rgba(66, 153, 225, 0.1)",
                              mb: 1,
                            }}
                          >
                            <SearchIcon
                              sx={{
                                fontSize: 30,
                                color: isDarkMode ? "#3182ce" : "#4299e1",
                              }}
                            />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            Aucune formation trouvée
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ maxWidth: 300, textAlign: "center" }}
                          >
                            Essayez de modifier vos critères de recherche ou
                            d'ajouter une nouvelle formation
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    formations.map((formation) => (
                      <TableRow
                        key={formation.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          transition: "all 0.2s ease",
                          borderRadius: "8px",
                          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                          boxShadow: isDarkMode
                            ? "0 1px 3px rgba(0, 0, 0, 0.2)"
                            : "0 1px 3px rgba(0, 0, 0, 0.05)",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#2d3748" : "#f8fafc",
                            transform: "translateY(-2px)",
                            boxShadow: isDarkMode
                              ? "0 4px 6px rgba(0, 0, 0, 0.3)"
                              : "0 4px 6px rgba(0, 0, 0, 0.1)",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Tooltip
                            title={formation.title}
                            placement="top-start"
                            arrow
                          >
                            <Typography
                              variant="body1"
                              fontWeight="500"
                              noWrap
                              sx={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: isDarkMode ? "#e2e8f0" : "#2d3748",
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: isDarkMode ? "#3182ce" : "#4299e1",
                                },
                              }}
                            >
                              {formation.title}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {renderType(formation.type)}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          {renderStatus(formation.status, formation)}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDarkMode
                                ? "rgba(226, 232, 240, 0.8)"
                                : "rgba(45, 55, 72, 0.8)",
                              fontWeight: 500,
                            }}
                          >
                            {formation.creator?.name || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDarkMode
                                ? "rgba(226, 232, 240, 0.8)"
                                : "rgba(45, 55, 72, 0.8)",
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {new Date(
                              formation.created_at
                            ).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            py: 2.5,
                            px: 2,
                            whiteSpace: "nowrap",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 1,
                              "& .MuiIconButton-root": {
                                transition:
                                  "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                backgroundColor: isDarkMode
                                  ? "rgba(255, 255, 255, 0.05)"
                                  : "rgba(0, 0, 0, 0.03)",
                                borderRadius: "8px",
                                padding: "8px",
                                "&:hover": {
                                  transform: "translateY(-3px)",
                                  boxShadow: isDarkMode
                                    ? "0 8px 16px rgba(0, 0, 0, 0.4)"
                                    : "0 8px 16px rgba(0, 0, 0, 0.1)",
                                },
                              },
                            }}
                          >
                            <Tooltip
                              title="Voir les détails"
                              arrow
                              placement="top"
                            >
                              <IconButton
                                color="info"
                                onClick={() => handleViewDetails(formation)}
                                size="small"
                                sx={{
                                  bgcolor: isDarkMode
                                    ? "rgba(41, 182, 246, 0.1)"
                                    : "rgba(41, 182, 246, 0.05)",
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Modifier" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleEditFormation(formation)}
                                sx={{
                                  color: isDarkMode ? "#a0aec0" : "#4a5568",
                                  "&:hover": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(160, 174, 192, 0.1)"
                                      : "rgba(74, 85, 104, 0.1)",
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Supprimer" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(formation)}
                                sx={{
                                  color: isDarkMode ? "#fc8181" : "#e53e3e",
                                  "&:hover": {
                                    backgroundColor: isDarkMode
                                      ? "rgba(252, 129, 129, 0.1)"
                                      : "rgba(229, 62, 62, 0.1)",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {formation.status === "pending" && (
                              <Tooltip
                                title="Valider/Rejeter"
                                arrow
                                placement="top"
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleReviewClick(formation)}
                                  sx={{
                                    color: isDarkMode ? "#68d391" : "#38a169",
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(104, 211, 145, 0.1)"
                                        : "rgba(56, 161, 105, 0.1)",
                                    },
                                  }}
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
                                  sx={{
                                    color: isDarkMode ? "#fbd38d" : "#dd6b20",
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(251, 211, 141, 0.1)"
                                        : "rgba(221, 107, 32, 0.1)",
                                    },
                                  }}
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
                                  sx={{
                                    color: isDarkMode ? "#68d391" : "#38a169",
                                    "&:hover": {
                                      backgroundColor: isDarkMode
                                        ? "rgba(104, 211, 145, 0.1)"
                                        : "rgba(56, 161, 105, 0.1)",
                                    },
                                  }}
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
            </Box>
          </Box>

          {/* Pagination */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 2,
              mt: 4,
              mb: 2,
              px: 1,
              "& > *": {
                mb: { xs: 1, sm: 0 },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.03)"
                  : "rgba(0, 0, 0, 0.02)",
                borderRadius: "10px",
                py: 1,
                px: 2,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDarkMode
                    ? "rgba(49, 130, 206, 0.1)"
                    : "rgba(66, 153, 225, 0.1)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? "#3182ce" : "#4299e1",
                  }}
                >
                  {formations.length}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode
                    ? "rgba(226, 232, 240, 0.8)"
                    : "rgba(45, 55, 72, 0.8)",
                  fontWeight: 500,
                }}
              >
                {formations.length > 0
                  ? `Formation${formations.length > 1 ? "s" : ""} affichée${
                      formations.length > 1 ? "s" : ""
                    }`
                  : "Aucune formation"}
              </Typography>
            </Box>

            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              shape="rounded"
              size="medium"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "8px",
                  margin: "0 2px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    boxShadow: isDarkMode
                      ? "0 4px 12px rgba(49, 130, 206, 0.4)"
                      : "0 4px 12px rgba(66, 153, 225, 0.25)",
                    backgroundColor: isDarkMode ? "#3182ce" : "#4299e1",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#2b6cb0" : "#3182ce",
                    },
                  },
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                  },
                },
              }}
            />
          </Box>
        </>
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
