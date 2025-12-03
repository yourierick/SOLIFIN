import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  CircularProgress,
  Alert,
  Rating,
  Chip,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  EditNote as EditNoteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Page de gestion des témoignages pour les administrateurs
 * Permet de visualiser, approuver, rejeter, mettre en avant et supprimer les témoignages
 */
const TestimonialManagement = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { user } = useAuth();

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [minRatingFilter, setMinRatingFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(null);

  // Fonction pour récupérer la liste des témoignages
  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/admin/testimonials?page=${page}&per_page=${rowsPerPage}`;

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      if (minRatingFilter) {
        url += `&min_rating=${minRatingFilter}`;
      }

      if (featuredFilter !== "") {
        url += `&featured=${featuredFilter}`;
      }

      const response = await axios.get(url);

      setTestimonials(response.data.testimonials.data);
      setTotal(response.data.testimonials.total);
      setTotalPages(
        Math.ceil(response.data.testimonials.total / response.data.testimonials.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération des témoignages:", err);
      setError(
        "Impossible de charger les témoignages. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les témoignages au chargement du composant et lorsque les filtres changent
  useEffect(() => {
    fetchTestimonials();
  }, [page, rowsPerPage, statusFilter, minRatingFilter, featuredFilter]);

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

  // Fonction pour ouvrir la boîte de dialogue de détails
  const handleViewDetails = (testimonial) => {
    setCurrentTestimonial(testimonial);
    setOpenDetailDialog(true);
  };

  // Fonction pour approuver un témoignage
  const handleApproveTestimonial = async (id) => {
    try {
      const response = await axios.post(`/api/admin/testimonials/${id}/approve`);
      
      if (response.data.success) {
        fetchTestimonials();
        setOpenDetailDialog(false);
      } else {
        setError("Erreur lors de l'approbation du témoignage");
      }
    } catch (err) {
      console.error("Erreur lors de l'approbation du témoignage:", err);
      setError("Impossible d'approuver ce témoignage");
    }
  };

  // Fonction pour rejeter un témoignage
  const handleRejectTestimonial = async (id) => {
    try {
      const response = await axios.post(`/api/admin/testimonials/${id}/reject`);
      
      if (response.data.success) {
        fetchTestimonials();
        setOpenDetailDialog(false);
      } else {
        setError("Erreur lors du rejet du témoignage");
      }
    } catch (err) {
      console.error("Erreur lors du rejet du témoignage:", err);
      setError("Impossible de rejeter ce témoignage");
    }
  };

  // Fonction pour mettre en avant un témoignage
  const handleFeatureTestimonial = async (id) => {
    try {
      const response = await axios.post(`/api/admin/testimonials/${id}/feature`);
      
      if (response.data.success) {
        fetchTestimonials();
      } else {
        setError("Erreur lors de la mise en avant du témoignage");
      }
    } catch (err) {
      console.error("Erreur lors de la mise en avant du témoignage:", err);
      setError("Impossible de mettre en avant ce témoignage");
    }
  };

  // Fonction pour retirer la mise en avant
  const handleUnfeatureTestimonial = async (id) => {
    try {
      const response = await axios.post(`/api/admin/testimonials/${id}/unfeature`);
      
      if (response.data.success) {
        fetchTestimonials();
      } else {
        setError("Erreur lors du retrait de la mise en avant");
      }
    } catch (err) {
      console.error("Erreur lors du retrait de la mise en avant:", err);
      setError("Impossible de retirer la mise en avant");
    }
  };

  // Fonction pour supprimer un témoignage
  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce témoignage ?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/testimonials/${id}`);
      
      if (response.data.success) {
        fetchTestimonials();
        setOpenDetailDialog(false);
      } else {
        setError("Erreur lors de la suppression du témoignage");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du témoignage:", err);
      setError("Impossible de supprimer ce témoignage");
    }
  };

  // Fonction pour afficher le statut avec la couleur appropriée
  const renderStatus = (status) => {
    const statusConfig = {
      pending: {
        label: "En attente",
        colors: {
          dark: { bg: "rgba(144, 205, 244, 0.15)", color: "#90CDF4", border: "1px solid rgba(144, 205, 244, 0.3)" },
          light: { bg: "rgba(43, 108, 176, 0.08)", color: "#2B6CB0", border: "1px solid rgba(43, 108, 176, 0.2)" },
        },
      },
      approved: {
        label: "Approuvé",
        colors: {
          dark: { bg: "rgba(154, 230, 180, 0.15)", color: "#9AE6B4", border: "1px solid rgba(154, 230, 180, 0.3)" },
          light: { bg: "rgba(39, 103, 73, 0.08)", color: "#276749", border: "1px solid rgba(39, 103, 73, 0.2)" },
        },
      },
      rejected: {
        label: "Rejeté",
        colors: {
          dark: { bg: "rgba(254, 178, 178, 0.15)", color: "#FEB2B2", border: "1px solid rgba(254, 178, 178, 0.3)" },
          light: { bg: "rgba(197, 48, 48, 0.08)", color: "#C53030", border: "1px solid rgba(197, 48, 48, 0.2)" },
        },
      },
      default: {
        label: "Inconnu",
        colors: {
          dark: { bg: "rgba(226, 232, 240, 0.15)", color: "#E2E8F0", border: "1px solid rgba(226, 232, 240, 0.3)" },
          light: { bg: "rgba(74, 85, 104, 0.08)", color: "#4A5568", border: "1px solid rgba(74, 85, 104, 0.2)" },
        },
      },
    };

    const config = statusConfig[status] || statusConfig.default;
    const themeColors = isDarkMode ? config.colors.dark : config.colors.light;

    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "16px",
          py: 0.5,
          px: 1.5,
          backgroundColor: themeColors.bg,
          color: themeColors.color,
          border: themeColors.border,
          fontWeight: 500,
          fontSize: "0.75rem",
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: `0 0 0 1px ${themeColors.color}`,
            transform: "translateY(-1px)",
          },
        }}
      >
        {config.label}
      </Box>
    );
  };

  // Composant principal
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
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDarkMode
              ? "0 6px 16px rgba(59, 130, 246, 0.4)"
              : "0 6px 16px rgba(59, 130, 246, 0.3)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "scale(1.05) rotate(5deg)",
              boxShadow: isDarkMode
                ? "0 8px 20px rgba(59, 130, 246, 0.5)"
                : "0 8px 20px rgba(59, 130, 246, 0.4)",
            },
          }}
        >
          <EditNoteIcon
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
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Gestion des Témoignages
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
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(59, 130, 246, 0.15)",
            borderRadius: { xs: "14px", sm: "18px" },
            overflow: "hidden",
            boxShadow: isDarkMode
              ? "0 10px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
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
                    ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: { xs: 0.5, sm: 1 },
                  boxShadow: isDarkMode
                    ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                    : "0 4px 12px rgba(59, 130, 246, 0.2)",
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
                  setStatusFilter("");
                  setMinRatingFilter("");
                  setFeaturedFilter("");
                  setPage(1);
                  setRowsPerPage(25);
                  fetchTestimonials();
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
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="approved">Approuvés</MenuItem>
                    <MenuItem value="rejected">Rejetés</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Note minimale</InputLabel>
                  <Select
                    value={minRatingFilter}
                    label="Note minimale"
                    onChange={(e) => setMinRatingFilter(e.target.value)}
                    sx={{
                      borderRadius: "8px",
                      "&:hover": {
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <MenuItem value="">Toutes les notes</MenuItem>
                    <MenuItem value="1">1 étoile et plus</MenuItem>
                    <MenuItem value="2">2 étoiles et plus</MenuItem>
                    <MenuItem value="3">3 étoiles et plus</MenuItem>
                    <MenuItem value="4">4 étoiles et plus</MenuItem>
                    <MenuItem value="5">5 étoiles</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mise en avant</InputLabel>
                  <Select
                    value={featuredFilter}
                    label="Mise en avant"
                    onChange={(e) => setFeaturedFilter(e.target.value)}
                    sx={{
                      borderRadius: "8px",
                      "&:hover": {
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
                      },
                      transition: "all 0.2s",
                    }}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="1">Mis en avant</MenuItem>
                    <MenuItem value="0">Non mis en avant</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tableau des témoignages avec design simplifié */}
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
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: isDarkMode ? "#252525" : "#f5f5f5" }}>
                  {[
                    { id: "user", label: "Utilisateur" },
                    { id: "rating", label: "Note" },
                    { id: "content", label: "Contenu" },
                    { id: "status", label: "Statut" },
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
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                          Aucun témoignage trouvé
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Essayez de modifier vos critères de recherche
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((testimonial) => (
                    <TableRow
                      key={testimonial.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                        },
                        borderBottom: "1px solid",
                        borderBottomColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#e0e0e0" : "#333333" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mr: 2,
                              overflow: "hidden",
                            }}
                          >
                            {testimonial.user?.profile_picture ? (
                              <Box
                                component="img"
                                src={testimonial.user.profile_picture}
                                alt={testimonial.user.name}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
                                {testimonial.user?.name?.charAt(0) || "?"}
                              </Typography>
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="500">
                              {testimonial.user?.name || "Utilisateur inconnu"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {testimonial.user?.email || ""}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Rating
                            value={testimonial.rating}
                            readOnly
                            size="small"
                            sx={{
                              color: "#ffc107",
                              "& .MuiRating-iconFilled": {
                                color: "#ffc107",
                              },
                              "& .MuiRating-iconEmpty": {
                                color: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            ({testimonial.rating}/5)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#e0e0e0" : "#333333" }}>
                        <Tooltip title={testimonial.content} placement="top-start" arrow>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {testimonial.content}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {renderStatus(testimonial.status)}
                          {testimonial.featured && (
                            <Chip
                              label="Mis en avant"
                              size="small"
                              sx={{
                                backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                                color: isDarkMode ? "#60a5fa" : "#3b82f6",
                                fontSize: "0.7rem",
                                height: "20px",
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, px: 2, color: isDarkMode ? "#b0b0b0" : "#666666" }}>
                        {new Date(testimonial.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2, px: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Tooltip title="Voir les détails" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(testimonial)}
                              sx={{ color: isDarkMode ? "#90caf9" : "#1976d2" }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {testimonial.status !== "approved" && (
                            <Tooltip title="Approuver" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveTestimonial(testimonial.id)}
                                sx={{ color: isDarkMode ? "#66bb6a" : "#388e3c" }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {testimonial.status !== "rejected" && (
                            <Tooltip title="Rejeter" arrow placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleRejectTestimonial(testimonial.id)}
                                sx={{ color: isDarkMode ? "#ef5350" : "#d32f2f" }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {testimonial.status === "approved" && (
                            <Tooltip
                              title={testimonial.featured ? "Retirer la mise en avant" : "Mettre en avant"}
                              arrow placement="top"
                            >
                              <IconButton
                                size="small"
                                onClick={() =>
                                  testimonial.featured
                                    ? handleUnfeatureTestimonial(testimonial.id)
                                    : handleFeatureTestimonial(testimonial.id)
                                }
                                sx={{ color: isDarkMode ? "#ffa726" : "#f57c00" }}
                              >
                                <StarIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Supprimer" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTestimonial(testimonial.id)}
                              sx={{ color: isDarkMode ? "#ef5350" : "#d32f2f" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Boîte de dialogue de détails */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
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
          Détail du témoignage
        </DialogTitle>
        <DialogContent>
          {currentTestimonial && (
            <Box>
              {/* Informations utilisateur */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    overflow: "hidden",
                  }}
                >
                  {currentTestimonial.user?.profile_picture ? (
                    <Box
                      component="img"
                      src={currentTestimonial.user.profile_picture}
                      alt={currentTestimonial.user.name}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
                      {currentTestimonial.user?.name?.charAt(0) || "?"}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="500">
                    {currentTestimonial.user?.name || "Utilisateur inconnu"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentTestimonial.user?.email || ""}
                  </Typography>
                </Box>
              </Box>

              {/* Note */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Note
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={currentTestimonial.rating}
                    readOnly
                    sx={{
                      color: "#ffc107",
                      "& .MuiRating-iconFilled": {
                        color: "#ffc107",
                      },
                      "& .MuiRating-iconEmpty": {
                        color: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
                      },
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    ({currentTestimonial.rating}/5)
                  </Typography>
                </Box>
              </Box>

              {/* Contenu */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Témoignage
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <Typography variant="body2">
                    {currentTestimonial.content}
                  </Typography>
                </Box>
              </Box>

              {/* Statut et mise en avant */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Informations
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {renderStatus(currentTestimonial.status)}
                  {currentTestimonial.featured && (
                    <Chip
                      label="Mis en avant"
                      size="small"
                      sx={{
                        backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                        color: isDarkMode ? "#60a5fa" : "#3b82f6",
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Date */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Date
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Soumis le {new Date(currentTestimonial.created_at).toLocaleDateString()} à{" "}
                  {new Date(currentTestimonial.created_at).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {currentTestimonial?.status !== "approved" && (
            <Button
              onClick={() => handleApproveTestimonial(currentTestimonial.id)}
              variant="contained"
              sx={{
                backgroundColor: "#4caf50",
                "&:hover": { backgroundColor: "#45a049" },
              }}
            >
              Approuver
            </Button>
          )}
          {currentTestimonial?.status !== "rejected" && (
            <Button
              onClick={() => handleRejectTestimonial(currentTestimonial.id)}
              variant="contained"
              color="error"
            >
              Rejeter
            </Button>
          )}
          {currentTestimonial?.status === "approved" && (
            <Button
              onClick={() =>
                currentTestimonial.featured
                  ? handleUnfeatureTestimonial(currentTestimonial.id)
                  : handleFeatureTestimonial(currentTestimonial.id)
              }
              variant="contained"
              sx={{
                backgroundColor: "#ff9800",
                "&:hover": { backgroundColor: "#f57c00" },
              }}
            >
              {currentTestimonial.featured ? "Retirer la mise en avant" : "Mettre en avant"}
            </Button>
          )}
          <Button
            onClick={() => handleDeleteTestimonial(currentTestimonial.id)}
            variant="contained"
            color="error"
          >
            Supprimer
          </Button>
          <Button onClick={() => setOpenDetailDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestimonialManagement;
