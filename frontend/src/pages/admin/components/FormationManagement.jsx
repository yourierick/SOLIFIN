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
      draft: {
        label: "Brouillon",
        color: "default",
        variant: formation?.type === "admin" ? "outlined" : "filled",
        icon:
          formation?.type === "admin" ? <PublishIcon fontSize="small" /> : null,
      },
      pending: {
        label: "En attente",
        color: "warning",
        variant: "filled",
        icon: null,
      },
      published: {
        label: "Publié",
        color: "success",
        variant: "filled",
        icon: null,
      },
      rejected: {
        label: "Rejeté",
        color: "error",
        variant: "filled",
        icon: null,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "default",
      variant: "filled",
      icon: null,
    };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant={config.variant}
        icon={config.icon}
      />
    );
  };

  // Fonction pour afficher le type avec la couleur appropriée
  const renderType = (type) => {
    const typeConfig = {
      admin: { label: "Admin", color: "primary" },
      user: { label: "Utilisateur", color: "secondary" },
    };

    const config = typeConfig[type] || { label: type, color: "default" };

    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gestion des Formations
      </Typography>

      {/* Filtres et recherche */}
      <Card
        sx={{
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
          boxShadow: "none",
        }}
      >
        <CardContent>
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
              >
                Ajouter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau des formations */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: isDarkMode ? "#1f2937" : "#fff",
              background: isDarkMode ? "#1f2937" : "#fff",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: isDarkMode
                ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                : "0 4px 20px rgba(0, 0, 0, 0.1)",
              "& .MuiTableRow-root:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Titre
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Créé par
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Date de création
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: isDarkMode ? "#2d3748" : "#f5f7fa",
                      color: isDarkMode ? "#e2e8f0" : "#4a5568",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 3 }}>
                        Aucune formation trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  formations.map((formation) => (
                    <TableRow
                      key={formation.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell
                        sx={{
                          borderLeft: isDarkMode
                            ? "3px solid #2d3748"
                            : "3px solid #f5f7fa",
                          fontWeight: "medium",
                          py: 2,
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight="500"
                          noWrap
                          sx={{ maxWidth: 200 }}
                        >
                          {formation.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {renderType(formation.type)}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {renderStatus(formation.status, formation)}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          color={isDarkMode ? "text.secondary" : "text.primary"}
                        >
                          {formation.creator?.name || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          color={isDarkMode ? "text.secondary" : "text.primary"}
                        >
                          {new Date(formation.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 1,
                            "& .MuiIconButton-root": {
                              transition: "all 0.2s ease-in-out",
                              boxShadow: isDarkMode
                                ? "0 0 5px rgba(255, 255, 255, 0.1)"
                                : "0 0 5px rgba(0, 0, 0, 0.1)",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: isDarkMode
                                  ? "0 0 8px rgba(255, 255, 255, 0.2)"
                                  : "0 0 8px rgba(0, 0, 0, 0.2)",
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
                              color="primary"
                              onClick={() => handleEditFormation(formation)}
                              size="small"
                              sx={{
                                bgcolor: isDarkMode
                                  ? "rgba(25, 118, 210, 0.1)"
                                  : "rgba(25, 118, 210, 0.05)",
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer" arrow placement="top">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(formation)}
                              size="small"
                              sx={{
                                bgcolor: isDarkMode
                                  ? "rgba(211, 47, 47, 0.1)"
                                  : "rgba(211, 47, 47, 0.05)",
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {formation.status === "pending" &&
                            formation.type === "user" && (
                              <Tooltip
                                title="Valider/Rejeter"
                                arrow
                                placement="top"
                              >
                                <IconButton
                                  color="success"
                                  onClick={() => handleReviewClick(formation)}
                                  size="small"
                                  sx={{
                                    bgcolor: isDarkMode
                                      ? "rgba(46, 125, 50, 0.1)"
                                      : "rgba(46, 125, 50, 0.05)",
                                  }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          {formation.status === "draft" &&
                            formation.type === "admin" && (
                              <Tooltip title="Publier" arrow placement="top">
                                <IconButton
                                  color="success"
                                  onClick={() => handlePublishClick(formation)}
                                  size="small"
                                  sx={{
                                    bgcolor: isDarkMode
                                      ? "rgba(46, 125, 50, 0.1)"
                                      : "rgba(46, 125, 50, 0.05)",
                                    animation: "pulse 1.5s infinite",
                                    "@keyframes pulse": {
                                      "0%": {
                                        boxShadow:
                                          "0 0 0 0 rgba(46, 125, 50, 0.4)",
                                      },
                                      "70%": {
                                        boxShadow:
                                          "0 0 0 5px rgba(46, 125, 50, 0)",
                                      },
                                      "100%": {
                                        boxShadow:
                                          "0 0 0 0 rgba(46, 125, 50, 0)",
                                      },
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
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
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
