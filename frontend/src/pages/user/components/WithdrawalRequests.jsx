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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // États pour les données
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

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
    payment_status: "",
    payment_method: "",
    currency: "", // Ajout du filtre de monnaie
    start_date: "", // Changé de date_from
    end_date: "", // Changé de date_to
    search: "",
  });

  // États pour les dialogues de confirmation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Options pour les filtres
  const statusOptions = [
    { value: "pending", label: "En attente" },
    { value: "approved", label: "Approuvé" },
    { value: "rejected", label: "Rejeté" },
    { value: "cancelled", label: "Annulé" },
    { value: "failed", label: "Échoué" },
  ];

  const paymentStatusOptions = [
    { value: "initiated", label: "Initié" },
    { value: "pending", label: "En attente" },
    { value: "failed", label: "Échoué" },
    { value: "paid", label: "Payé" },
  ];

  const paymentMethodOptions = [
    { value: "orange-money", label: "Orange Money" },
    { value: "airtel-money", label: "Airtel Money" },
    { value: "m-pesa", label: "M-Pesa" },
    { value: "afrimoney", label: "Afrimoney" },
    { value: "visa", label: "Visa" },
    { value: "mastercard", label: "Mastercard" },
    { value: "americanexpress", label: "American Express" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "CDF", label: "CDF" },
  ];

  const getPaymentMethodIcon = (paymentMethod) => {
    const mobileMoneyMethods = [
      "orange-money",
      "airtel-money",
      "m-pesa",
      "afrimoney",
    ];
    const creditCardMethods = ["visa", "mastercard", "americanexpress"];

    if (mobileMoneyMethods.includes(paymentMethod)) {
      return (
        <PhoneIcon
          sx={{ mr: 1, color: "success.main", fontSize: { xs: 16, sm: 18 } }}
        />
      );
    } else if (creditCardMethods.includes(paymentMethod)) {
      return (
        <CreditCardIcon
          sx={{ mr: 1, color: "info.main", fontSize: { xs: 16, sm: 18 } }}
        />
      );
    } else {
      return (
        <PhoneIcon
          sx={{ mr: 1, color: "default.main", fontSize: { xs: 16, sm: 18 } }}
        />
      );
    }
  };

  const getPaymentMethodLabel = (paymentMethod) => {
    const method = paymentMethodOptions.find(
      (option) => option.value === paymentMethod
    );
    return method ? method.label : paymentMethod;
  };

  // Fonction pour formater les montants
  const formatAmount = (amount, currency) => {
    if (amount === undefined || amount === null) return "0,00";
    if (!currency) return amount;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
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

      console.log("Filters envoyés à l'API:", filters);

      const response = await axios.get("/api/withdrawal/requests", { params });

      if (!response.data || !response.data.success) {
        throw new Error(
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

      // Calculer les statistiques
      const requests = data.data || [];
      setStatistics({
        total: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
      });
    } catch (err) {
      console.error("Erreur lors de la récupération des demandes de retrait");
      setError(
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
      console.error("Erreur lors de l'annulation de la demande");
      toast.error("Impossible d'annuler la demande. Veuillez réessayer.");
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
        throw new Error("Erreur lors de la suppression de la demande");
      }

      toast.success("Demande de retrait supprimée avec succès");
      fetchWithdrawalRequests();
    } catch (err) {
      console.error("Erreur lors de la suppression de la demande");
      toast.error("Impossible de supprimer la demande. Veuillez réessayer.");
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
      payment_status: "",
      payment_method: "",
      currency: "", // Ajout du filtre de monnaie
      start_date: "", // Changé de date_from
      end_date: "", // Changé de date_to
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
      case "initiated":
        return "success";
      case "paid":
        return "info";
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
      case "paid":
        return "Payé";
      case "initiated":
        return "Initialisé";
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
    if (!showFilters) return null;

    return (
      <Slide in={showFilters} direction="down" timeout={300}>
        <Card
          sx={{
            mb: { xs: 3, sm: 4 },
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
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: { xs: 2, sm: 3 },
                flexWrap: "wrap",
                gap: { xs: 1, sm: 0 },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  mr: 2,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <FilterListIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  fontWeight={700}
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {isMobile ? "Filtres" : "Filtres des demandes de retrait"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Personnalisez votre recherche
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={!isMobile && <RefreshIcon />}
                onClick={resetFilters}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  minWidth: { xs: "auto", sm: "auto" },
                  px: { xs: 2, sm: 3 },
                  "&:hover": {
                    borderColor: "primary.main",
                    background: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                {isMobile ? <RefreshIcon fontSize="small" /> : "Réinitialiser"}
              </Button>
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut de paiement</InputLabel>
                  <Select
                    value={filters.payment_status}
                    onChange={(e) =>
                      handleFilterChange("payment_status", e.target.value)
                    }
                    label="Statut de paiement"
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
                    {paymentStatusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Monnaie</InputLabel>
                  <Select
                    value={filters.currency}
                    onChange={(e) =>
                      handleFilterChange("currency", e.target.value)
                    }
                    label="Monnaie"
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
                    {currencyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Date de début"
                  type="date"
                  size="small"
                  value={filters.start_date || ""}
                  onChange={(e) =>
                    handleFilterChange("start_date", e.target.value)
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
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="date"
                  size="small"
                  value={filters.end_date || ""}
                  onChange={(e) =>
                    handleFilterChange("end_date", e.target.value)
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
              <Grid item xs={12} sm={8} md={4}>
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
              <Grid item xs={12} sm={4} md={2}>
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
      </Slide>
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
                          {formatAmount(request.amount, request.currency)}
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

    // Version desktop avec tableau optimisé pour mobile
    return (
      <Fade in={true} timeout={800}>
        <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
          {/* Indicateur de scroll horizontal sur mobile */}
          {isSmallScreen && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 1,
                px: 2,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.5) 100%)"
                  : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                borderBottom: `1px solid ${alpha(
                  theme.palette.primary.main,
                  0.1
                )}`,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.7rem" }}
              >
                Faites glisser pour voir plus →
              </Typography>
            </Box>
          )}
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
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
                borderRadius: 10,
              },
              "&::-webkit-scrollbar-thumb": {
                background: isDarkMode
                  ? alpha(theme.palette.grey[600], 0.5)
                  : alpha(theme.palette.grey[400], 0.5),
                borderRadius: 10,
                border: "2px solid transparent",
                "&:hover": {
                  background: isDarkMode
                    ? alpha(theme.palette.grey[500], 0.7)
                    : alpha(theme.palette.grey[500], 0.7),
                },
              },
            }}
          >
            <Table
              aria-label="Tableau des demandes de retrait"
              sx={{ minWidth: { xs: 800, md: "auto" } }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%)"
                      : "linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    Montant
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    Méthode
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    scope="col"
                  >
                    Statut du paiement
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 2.5 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
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
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        {request.id}
                      </TableCell>
                      <TableCell
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
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
                      <TableCell
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {formatAmount(request.amount, request.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {getPaymentMethodIcon(request.payment_method)}
                          {getPaymentMethodLabel(request.payment_method)}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                        }}
                      >
                        <Chip
                          label={getStatusLabel(request.status)}
                          color={getStatusColor(request.status)}
                          size="small"
                          variant="filled"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            height: { xs: 24, sm: 28 },
                            boxShadow: `0 2px 8px ${alpha(
                              theme.palette[getStatusColor(request.status)]
                                ?.main || theme.palette.grey[500],
                              0.3
                            )}`,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 3 },
                        }}
                      >
                        <Chip
                          label={getStatusLabel(request.payment_status)}
                          color={getStatusColor(request.payment_status)}
                          size="small"
                          variant="filled"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            height: { xs: 24, sm: 28 },
                            boxShadow: `0 2px 8px ${alpha(
                              theme.palette[
                                getStatusColor(request.payment_status)
                              ]?.main || theme.palette.grey[500],
                              0.3
                            )}`,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          px: { xs: 1, sm: 2, md: 3 },
                          py: { xs: 2, sm: 3 },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", gap: { xs: 0.5, sm: 1 } }}
                          role="group"
                          aria-label={`Actions pour la demande ${request.id}`}
                        >
                          <Tooltip title="Voir les détails" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(request)}
                              sx={{
                                p: { xs: 0.5, sm: 1 },
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
                              <InfoIcon
                                sx={{ fontSize: { xs: 18, sm: 20 } }}
                                color="primary"
                              />
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
                                  p: { xs: 0.5, sm: 1 },
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
                                <CancelIcon
                                  sx={{ fontSize: { xs: 18, sm: 20 } }}
                                  color="warning"
                                />
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
                                  p: { xs: 0.5, sm: 1 },
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
                                <DeleteIcon
                                  sx={{ fontSize: { xs: 18, sm: 20 } }}
                                  color="error"
                                />
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
                    {formatAmount(
                      selectedRequest.amount,
                      selectedRequest.currency
                    )}
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
                    {getPaymentMethodIcon(selectedRequest.payment_method)}
                    <Typography variant="body2" color="text.secondary">
                      Méthode de paiement
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={600}>
                    {getPaymentMethodLabel(selectedRequest.payment_method)}
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
                Détails de paiement
              </Typography>

              <Grid container spacing={2}>
                {selectedRequest.payment_details.phoneNumber && (
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
                        {selectedRequest.payment_details.phoneNumber}
                      </Typography>
                    </Card>
                  </Grid>
                )}

                {selectedRequest.payment_details.payment_method && (
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
                        {selectedRequest.payment_details.payment_method}
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
          {selectedRequest.admin_note && (
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
                  {selectedRequest.admin_note}
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

  // Rendu de l'en-tête avec statistiques
  const renderHeader = () => {
    return (
      <Fade in={true} timeout={600}>
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          {/* Titre principal */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                }}
              >
                <WalletIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </Avatar>
              <Box>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  fontWeight={700}
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {isMobile ? "Mes retraits" : "Mes demandes de retrait"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  Gérez vos demandes de retrait en toute simplicité
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={!isMobile && <FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: showFilters
                    ? "primary.main"
                    : alpha(theme.palette.primary.main, 0.3),
                  background: showFilters
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  "&:hover": {
                    borderColor: "primary.main",
                    background: alpha(theme.palette.primary.main, 0.15),
                  },
                }}
              >
                {isMobile ? (
                  <FilterListIcon fontSize="small" />
                ) : showFilters ? (
                  "Masquer les filtres"
                ) : (
                  "Afficher les filtres"
                )}
              </Button>
              <Button
                variant="outlined"
                startIcon={!isMobile && <RefreshIcon />}
                onClick={fetchWithdrawalRequests}
                disabled={loading}
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
                {isMobile ? <RefreshIcon fontSize="small" /> : "Actualiser"}
              </Button>
            </Box>
          </Box>

          {/* Cartes de statistiques */}
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} timeout={400}>
                <Card
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(219, 234, 254, 0.8) 0%, rgba(191, 219, 254, 0.8) 100%)",
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(
                        theme.palette.info.main,
                        0.2
                      )}`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar
                      sx={{
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        bgcolor: "info.main",
                        mr: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      Total
                    </Typography>
                  </Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={700}
                    color="info.main"
                  >
                    {statistics.total}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} timeout={500}>
                <Card
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(254, 243, 199, 0.8) 0%, rgba(253, 230, 138, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.warning.main,
                      0.2
                    )}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(
                        theme.palette.warning.main,
                        0.2
                      )}`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar
                      sx={{
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        bgcolor: "warning.main",
                        mr: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      En attente
                    </Typography>
                  </Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={700}
                    color="warning.main"
                  >
                    {statistics.pending}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} timeout={600}>
                <Card
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.8) 100%)",
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(
                        theme.palette.success.main,
                        0.2
                      )}`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar
                      sx={{
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        bgcolor: "success.main",
                        mr: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      Approuvés
                    </Typography>
                  </Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={700}
                    color="success.main"
                  >
                    {statistics.approved}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Zoom in={true} timeout={700}>
                <Card
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(254, 226, 226, 0.8) 0%, rgba(254, 202, 202, 0.8) 100%)",
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 24px ${alpha(
                        theme.palette.error.main,
                        0.2
                      )}`,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar
                      sx={{
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        bgcolor: "error.main",
                        mr: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <ErrorIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      Rejetés
                    </Typography>
                  </Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={700}
                    color="error.main"
                  >
                    {statistics.rejected}
                  </Typography>
                </Card>
              </Zoom>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    );
  };

  // Rendu principal du composant
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* En-tête avec statistiques */}
      {renderHeader()}

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
