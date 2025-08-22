import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Skeleton,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Fade,
  Slide,
  Zoom,
  alpha,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Payment as PaymentIcon,
  MoneyOff as MoneyOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

// Composant principal pour les demandes de retrait
const WithdrawalRequests = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // États pour les données
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // États pour la pagination
  const [pagination, setPagination] = useState({
    page: 0,
    totalPages: 0,
    totalItems: 0,
    perPage: 10,
  });

  // États pour les filtres
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    date_from: "",
    date_to: "",
    search: "",
  });

  // États pour les dialogues de confirmation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Options pour les filtres
  const statusOptions = [
    { value: "pending", label: "En attente" },
    { value: "approved", label: "Approuvé" },
    { value: "rejected", label: "Rejeté" },
    { value: "cancelled", label: "Annulé" },
    { value: "failed", label: "Échoué" },
  ];

  const paymentMethodOptions = [
    { value: "mobile-money", label: "Mobile Money" },
    { value: "credit-card", label: "Carte de crédit" },
  ];

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "0,00 $";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
  };

  // Fonction pour récupérer les demandes de retrait
  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page + 1,
        per_page: pagination.perPage,
        ...filters,
      };

      const response = await axios.get("/api/withdrawal/requests", { params });

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération des demandes de retrait"
        );
      }

      const data = response.data.data;
      setWithdrawalRequests(data.data || []);

      setPagination({
        page: data.current_page ? data.current_page - 1 : 0,
        totalPages: data.last_page || 0,
        totalItems: data.total || 0,
        perPage: data.per_page || 10,
      });
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des demandes de retrait:",
        err
      );
      setError(
        err.message ||
          "Impossible de récupérer les demandes de retrait. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  // Fonction pour annuler une demande de retrait
  const cancelWithdrawalRequest = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `/api/withdrawal/request/${selectedRequestId}/cancel`
      );

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message || "Erreur lors de l'annulation de la demande"
        );
      }

      toast.success("Demande de retrait annulée avec succès");
      fetchWithdrawalRequests();
    } catch (err) {
      console.error("Erreur lors de l'annulation de la demande:", err);
      toast.error(
        err.message || "Impossible d'annuler la demande. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setCancelDialogOpen(false);
      setSelectedRequestId(null);
    }
  };

  // Fonction pour supprimer une demande de retrait
  const deleteWithdrawalRequest = async () => {
    try {
      setLoading(true);

      const response = await axios.delete(
        `/api/withdrawal/requests/${selectedRequestId}`
      );

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la suppression de la demande"
        );
      }

      toast.success("Demande de retrait supprimée avec succès");
      fetchWithdrawalRequests();
    } catch (err) {
      console.error("Erreur lors de la suppression de la demande:", err);
      toast.error(
        err.message || "Impossible de supprimer la demande. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSelectedRequestId(null);
    }
  };

  // Gestionnaire de changement de page
  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Gestionnaire de changement de filtre
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      status: "",
      payment_method: "",
      date_from: "",
      date_to: "",
      search: "",
    });
  };

  // Fonction pour ouvrir le dialogue de détails
  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  // Fonction pour ouvrir le dialogue d'annulation
  const handleOpenCancelDialog = (id) => {
    setSelectedRequestId(id);
    setCancelDialogOpen(true);
  };

  // Fonction pour ouvrir le dialogue de suppression
  const handleOpenDeleteDialog = (id) => {
    setSelectedRequestId(id);
    setDeleteDialogOpen(true);
  };

  // Fonction pour obtenir la couleur de la puce de statut
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "cancelled":
        return "default";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "approved":
        return "Approuvé";
      case "rejected":
        return "Rejeté";
      case "cancelled":
        return "Annulé";
      case "failed":
        return "Échoué";
      default:
        return status;
    }
  };

  // Effet pour charger les demandes de retrait au chargement du composant
  useEffect(() => {
    fetchWithdrawalRequests();
  }, [fetchWithdrawalRequests]);

  // Rendu des filtres
  const renderFilters = () => {
    return (
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.3)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: isDarkMode
              ? "0 12px 40px rgba(0, 0, 0, 0.4)"
              : "0 12px 40px rgba(0, 0, 0, 0.15)",
          },
        }}
        elevation={0}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <FilterListIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Filtres des demandes de retrait
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Personnalisez votre recherche
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetFilters}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                "&:hover": {
                  borderColor: "primary.main",
                  background: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Réinitialiser
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  label="Statut"
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-root": {
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: `0 4px 12px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                      },
                    },
                  }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Méthode de paiement</InputLabel>
                <Select
                  value={filters.payment_method}
                  onChange={(e) =>
                    handleFilterChange("payment_method", e.target.value)
                  }
                  label="Méthode de paiement"
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-root": {
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: `0 4px 12px ${alpha(
                          theme.palette.primary.main,
                          0.15
                        )}`,
                      },
                    },
                  }}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {paymentMethodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date de début"
                type="date"
                size="small"
                value={filters.date_from || ""}
                onChange={(e) =>
                  handleFilterChange("date_from", e.target.value)
                }
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date de fin"
                type="date"
                size="small"
                value={filters.date_to || ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={8} md={9}>
              <TextField
                fullWidth
                label="Rechercher"
                size="small"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
                variant="outlined"
                placeholder="Rechercher par ID, montant..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: `0 4px 12px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={fetchWithdrawalRequests}
                fullWidth
                sx={{
                  height: "40px",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                    transform: "translateY(-1px)",
                  },
                }}
                startIcon={<RefreshIcon />}
              >
                Appliquer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Rendu du tableau des demandes de retrait
  const renderTable = () => {
    if (loading && withdrawalRequests.length === 0) {
      return (
        <Box sx={{ width: "100%" }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              height={60}
              sx={{ mb: 1, borderRadius: 1 }}
            />
          ))}
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    if (withdrawalRequests.length === 0) {
      return (
        <Fade in={true} timeout={600}>
          <Card
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 3,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
            elevation={0}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
                background:
                  "linear-gradient(135deg,rgb(102, 234, 113) 0%,rgb(102, 234, 102) 100%)",
              }}
            >
              <MoneyOffIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              sx={{
                background:
                  "linear-gradient(135deg,rgb(102, 234, 113) 0%,rgb(102, 234, 102) 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Aucune demande de retrait
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 400, mx: "auto" }}
            >
              Vous n'avez pas encore effectué de demande de retrait ou aucune
              demande ne correspond à vos filtres actuels.
            </Typography>
            <Button
              variant="contained"
              onClick={resetFilters}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                background:
                  "linear-gradient(135deg,rgb(70, 154, 77) 0%,rgb(35, 206, 35) 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg,rgb(70, 154, 77) 0%,rgb(102, 234, 102) 100%)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Réinitialiser les filtres
            </Button>
          </Card>
        </Fade>
      );
    }

    // Version mobile avec cartes empilées
    if (isSmallScreen) {
      return (
        <Fade in={true} timeout={800}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {withdrawalRequests.map((request, index) => (
              <Slide
                in={true}
                direction="up"
                timeout={300 + index * 100}
                key={request.id}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                      : "0 8px 32px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: isDarkMode
                        ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                        : "0 12px 40px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                  role="article"
                  aria-label={`Demande de retrait ${request.id}`}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        #{request.id}
                      </Typography>
                      <Chip
                        label={getStatusLabel(request.status)}
                        color={getStatusColor(request.status)}
                        size="small"
                        variant="filled"
                        sx={{
                          fontWeight: 600,
                          borderRadius: 2,
                          boxShadow: `0 2px 8px ${alpha(
                            theme.palette[getStatusColor(request.status)]
                              ?.main || theme.palette.grey[500],
                            0.3
                          )}`,
                        }}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Montant
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {formatAmount(request.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Méthode
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {request.payment_method === "mobile-money" ? (
                            <PhoneIcon
                              sx={{
                                mr: 1,
                                color: "success.main",
                                fontSize: 18,
                              }}
                            />
                          ) : (
                            <CreditCardIcon
                              sx={{ mr: 1, color: "info.main", fontSize: 18 }}
                            />
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            {request.payment_method === "mobile-money"
                              ? "Mobile Money"
                              : "Carte de crédit"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Date de création
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ScheduleIcon
                            sx={{
                              mr: 1,
                              color: "text.secondary",
                              fontSize: 18,
                            }}
                          />
                          <Typography variant="body2">
                            {formatDate(request.created_at)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<InfoIcon />}
                        onClick={() => handleOpenDetails(request)}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          "&:hover": {
                            borderColor: "primary.main",
                            background: alpha(theme.palette.primary.main, 0.05),
                          },
                          "&:focus": {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: "2px",
                          },
                        }}
                        aria-label={`Voir les détails de la demande ${request.id}`}
                      >
                        Détails
                      </Button>

                      {(request.status === "pending" ||
                        request.status === "failed") && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<CancelIcon />}
                          onClick={() => handleOpenCancelDialog(request.id)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:focus": {
                              outline: `2px solid ${theme.palette.warning.main}`,
                              outlineOffset: "2px",
                            },
                          }}
                          aria-label={`Annuler la demande ${request.id}`}
                        >
                          Annuler
                        </Button>
                      )}

                      {request.status === "pending" && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDeleteDialog(request.id)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            "&:focus": {
                              outline: `2px solid ${theme.palette.error.main}`,
                              outlineOffset: "2px",
                            },
                          }}
                          aria-label={`Supprimer définitivement la demande ${request.id}`}
                        >
                          Supprimer
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            ))}

            {/* Pagination pour mobile */}
            <Card
              sx={{
                borderRadius: 3,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.5) 100%)"
                  : "linear-gradient(135deg, rgba(249, 250, 251, 0.5) 0%, rgba(243, 244, 246, 0.5) 100%)",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <TablePagination
                component="div"
                count={pagination.totalItems}
                page={pagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={pagination.perPage}
                rowsPerPageOptions={[10]}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} sur ${count}`
                }
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    color: "text.primary",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  },
                  "& .MuiTablePagination-selectIcon": {
                    color: "primary.main",
                  },
                  "& .MuiIconButton-root": {
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    "&:focus": {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: "2px",
                    },
                  },
                }}
                aria-label="Navigation des pages"
              />
            </Card>
          </Box>
        </Fade>
      );
    }

    // Version desktop avec tableau
    return (
      <Fade in={true} timeout={800}>
        <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer
            sx={{
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Table aria-label="Tableau des demandes de retrait">
              <TableHead>
                <TableRow
                  sx={{
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                  }}
                >
                  <TableCell
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    Montant
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    Méthode
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                    scope="col"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawalRequests.map((request, index) => (
                  <Slide
                    in={true}
                    direction="up"
                    timeout={300 + index * 100}
                    key={request.id}
                  >
                    <TableRow
                      hover
                      sx={{
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.05
                          ),
                          transform: "scale(1.01)",
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        {request.id}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <ScheduleIcon
                            sx={{
                              mr: 1,
                              color: "text.secondary",
                              fontSize: 18,
                            }}
                          />
                          {formatDate(request.created_at)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          {formatAmount(request.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {request.payment_method === "mobile-money" ? (
                            <PhoneIcon
                              sx={{
                                mr: 1,
                                color: "success.main",
                                fontSize: 18,
                              }}
                            />
                          ) : (
                            <CreditCardIcon
                              sx={{ mr: 1, color: "info.main", fontSize: 18 }}
                            />
                          )}
                          {request.payment_method === "mobile-money"
                            ? "Mobile Money"
                            : "Carte de crédit"}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(request.status)}
                          color={getStatusColor(request.status)}
                          size="small"
                          variant="filled"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            boxShadow: `0 2px 8px ${alpha(
                              theme.palette[getStatusColor(request.status)]
                                ?.main || theme.palette.grey[500],
                              0.3
                            )}`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{ display: "flex", gap: 0.5 }}
                          role="group"
                          aria-label={`Actions pour la demande ${request.id}`}
                        >
                          <Tooltip title="Voir les détails" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(request)}
                              sx={{
                                background: alpha(
                                  theme.palette.primary.main,
                                  0.1
                                ),
                                "&:hover": {
                                  background: alpha(
                                    theme.palette.primary.main,
                                    0.2
                                  ),
                                  transform: "scale(1.1)",
                                },
                                "&:focus": {
                                  outline: `2px solid ${theme.palette.primary.main}`,
                                  outlineOffset: "2px",
                                },
                              }}
                              aria-label={`Voir les détails de la demande ${request.id}`}
                            >
                              <InfoIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>

                          {(request.status === "pending" ||
                            request.status === "failed") && (
                            <Tooltip title="Annuler la demande" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenCancelDialog(request.id)
                                }
                                sx={{
                                  background: alpha(
                                    theme.palette.warning.main,
                                    0.1
                                  ),
                                  "&:hover": {
                                    background: alpha(
                                      theme.palette.warning.main,
                                      0.2
                                    ),
                                    transform: "scale(1.1)",
                                  },
                                  "&:focus": {
                                    outline: `2px solid ${theme.palette.warning.main}`,
                                    outlineOffset: "2px",
                                  },
                                }}
                                aria-label={`Annuler la demande ${request.id}`}
                              >
                                <CancelIcon fontSize="small" color="warning" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {request.status === "pending" && (
                            <Tooltip title="Supprimer définitivement" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenDeleteDialog(request.id)
                                }
                                sx={{
                                  background: alpha(
                                    theme.palette.error.main,
                                    0.1
                                  ),
                                  "&:hover": {
                                    background: alpha(
                                      theme.palette.error.main,
                                      0.2
                                    ),
                                    transform: "scale(1.1)",
                                  },
                                  "&:focus": {
                                    outline: `2px solid ${theme.palette.error.main}`,
                                    outlineOffset: "2px",
                                  },
                                }}
                                aria-label={`Supprimer définitivement la demande ${request.id}`}
                              >
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </Slide>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              p: 2,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.5) 100%)"
                : "linear-gradient(135deg, rgba(249, 250, 251, 0.5) 0%, rgba(243, 244, 246, 0.5) 100%)",
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <TablePagination
              component="div"
              count={pagination.totalItems}
              page={pagination.page}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.perPage}
              rowsPerPageOptions={[10]}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} sur ${count}`
              }
              sx={{
                "& .MuiTablePagination-toolbar": {
                  color: "text.primary",
                },
                "& .MuiTablePagination-selectIcon": {
                  color: "primary.main",
                },
                "& .MuiIconButton-root": {
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                },
              }}
            />
          </Box>
        </Card>
      </Fade>
    );
  };

  // Rendu du dialogue de détails
  const renderDetailsDialog = () => {
    if (!selectedRequest) return null;

    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(8px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(255, 255, 255, 0.5)",
          },
          "& .MuiDialog-paper": {
            borderRadius: 3,
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(31, 41, 55, 0.85) 0%, rgba(17, 24, 39, 0.85) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(249, 250, 251, 0.85) 100%)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: isDarkMode
              ? "0 20px 60px rgba(0, 0, 0, 0.5)"
              : "0 20px 60px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            position: "relative",
            py: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                mr: 2,
              }}
            >
              <WalletIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Détails de la demande de retrait
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ID #{selectedRequest.id}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setDetailsDialogOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Section principale avec informations de base */}
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  }}
                  elevation={0}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ScheduleIcon
                      sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                    />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Date de création
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(selectedRequest.created_at)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  }}
                  elevation={0}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <TrendingUpIcon
                      sx={{ mr: 1, color: "success.main", fontSize: 20 }}
                    />
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Montant demandé
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {formatAmount(selectedRequest.amount)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  }}
                  elevation={0}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {selectedRequest.payment_method === "mobile-money" ? (
                      <PhoneIcon
                        sx={{ mr: 1, color: "success.main", fontSize: 20 }}
                      />
                    ) : (
                      <CreditCardIcon
                        sx={{ mr: 1, color: "info.main", fontSize: 20 }}
                      />
                    )}
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Méthode de paiement
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedRequest.payment_method === "mobile-money"
                      ? "Mobile Money"
                      : "Carte de crédit"}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  }}
                  elevation={0}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      Statut actuel
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(selectedRequest.status)}
                    color={getStatusColor(selectedRequest.status)}
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      boxShadow: `0 4px 12px ${alpha(
                        theme.palette[getStatusColor(selectedRequest.status)]
                          ?.main || theme.palette.grey[500],
                        0.3
                      )}`,
                    }}
                  />
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Section détails de paiement */}
          {selectedRequest.payment_details && (
            <Box
              sx={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(31, 41, 55, 0.2) 100%)"
                  : "linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.5) 100%)",
                p: 3,
                borderTop: `1px solid ${alpha(
                  theme.palette.primary.main,
                  0.1
                )}`,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <PaymentIcon sx={{ mr: 1, color: "primary.main" }} />
                Détails du paiement
              </Typography>

              <Grid container spacing={2}>
                {selectedRequest.payment_details.phone_number && (
                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(31, 41, 55, 0.5)"
                          : "rgba(255, 255, 255, 0.8)",
                        border: `1px solid ${alpha(
                          theme.palette.success.main,
                          0.2
                        )}`,
                      }}
                      elevation={0}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <PhoneIcon
                          sx={{ mr: 1, color: "success.main", fontSize: 18 }}
                        />
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Numéro de téléphone
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedRequest.payment_details.phone_number}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {selectedRequest.payment_details.telecom && (
                  <Grid item xs={12} sm={6}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(31, 41, 55, 0.5)"
                          : "rgba(255, 255, 255, 0.8)",
                        border: `1px solid ${alpha(
                          theme.palette.info.main,
                          0.2
                        )}`,
                      }}
                      elevation={0}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Opérateur
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedRequest.payment_details.telecom}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {selectedRequest.session_id && (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(31, 41, 55, 0.5)"
                          : "rgba(255, 255, 255, 0.8)",
                        border: `1px solid ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                      }}
                      elevation={0}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        ID de session
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-all",
                          fontFamily: "monospace",
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1
                          ),
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {selectedRequest.session_id}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {selectedRequest.transaction_id && (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(31, 41, 55, 0.5)"
                          : "rgba(255, 255, 255, 0.8)",
                        border: `1px solid ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                      }}
                      elevation={0}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{ mb: 1 }}
                      >
                        ID de transaction
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-all",
                          fontFamily: "monospace",
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1
                          ),
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        {selectedRequest.transaction_id}
                      </Typography>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Section notes administratives */}
          {selectedRequest.notes && (
            <Box
              sx={{
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(31, 41, 55, 0.2) 100%)"
                  : "linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.5) 100%)",
                p: 3,
                borderTop: `1px solid ${alpha(
                  theme.palette.primary.main,
                  0.1
                )}`,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  color: "text.primary",
                }}
              >
                <InfoIcon sx={{ mr: 1, color: "info.main" }} />
                Notes administratives
              </Typography>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: isDarkMode
                    ? "rgba(31, 41, 55, 0.5)"
                    : "rgba(255, 255, 255, 0.8)",
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
                elevation={0}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {selectedRequest.notes}
                </Typography>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(31, 41, 55, 0.3) 100%)"
              : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Button
            onClick={() => setDetailsDialogOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Rendu du dialogue d'annulation
  const renderCancelDialog = () => {
    return (
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Annuler la demande de retrait</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir annuler cette demande de retrait ? Cette
            action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={cancelWithdrawalRequest}
            color="warning"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <CancelIcon />
            }
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Rendu du dialogue de suppression
  const renderDeleteDialog = () => {
    return (
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Supprimer la demande de retrait</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette demande de retrait ? Cette
            action ne peut pas être annulée.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={deleteWithdrawalRequest}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Rendu principal du composant
  return (
    <Box>
      {/* Filtres */}
      {renderFilters()}

      {/* Tableau des demandes */}
      {renderTable()}

      {/* Dialogues */}
      {renderDetailsDialog()}
      {renderCancelDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default WithdrawalRequests;
