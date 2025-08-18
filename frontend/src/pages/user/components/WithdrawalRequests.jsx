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
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "rgba(249, 250, 251, 0.8)",
          borderRadius: 2,
        }}
        elevation={0}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Filtres des demandes de retrait
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={resetFilters}
            size="small"
            color="inherit"
          >
            Réinitialiser
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                label="Statut"
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
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
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
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={fetchWithdrawalRequests}
              fullWidth
              sx={{ height: "40px" }}
              startIcon={<RefreshIcon />}
            >
              Appliquer
            </Button>
          </Grid>
        </Grid>
      </Paper>
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
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            bgcolor: isDarkMode ? "#1f2937" : "rgba(249, 250, 251, 0.8)",
          }}
          elevation={0}
        >
          <MoneyOffIcon
            sx={{ fontSize: 60, color: "text.secondary", opacity: 0.5, mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune demande de retrait trouvée
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vous n'avez pas encore effectué de demande de retrait ou aucune
            demande ne correspond à vos filtres.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={resetFilters}
            startIcon={<RefreshIcon />}
          >
            Réinitialiser les filtres
          </Button>
        </Paper>
      );
    }

    return (
      <>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: isDarkMode ? "#1f2937" : "rgba(249, 250, 251, 0.8)",
          }}
          elevation={0}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Méthode</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withdrawalRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell>{formatAmount(request.amount)}</TableCell>
                  <TableCell>{request.payment_method}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Détails">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetails(request)}
                        color="primary"
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {(request.status === "pending" ||
                      request.status === "failed") && (
                      <Tooltip title="Annuler">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCancelDialog(request.id)}
                          color="warning"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {request.status === "pending" && (
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeleteDialog(request.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

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
          sx={{ mt: 2 }}
        />
      </>
    );
  };

  // Rendu du dialogue de détails
  const renderDetailsDialog = () => {
    if (!selectedRequest) return null;

    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Détails de la demande de retrait
          <IconButton
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                ID
              </Typography>
              <Typography variant="body1">{selectedRequest.id}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1">
                {formatDate(selectedRequest.created_at)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Montant
              </Typography>
              <Typography variant="body1">
                {formatAmount(selectedRequest.amount)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Statut
              </Typography>
              <Chip
                label={getStatusLabel(selectedRequest.status)}
                color={getStatusColor(selectedRequest.status)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Méthode de paiement
              </Typography>
              <Typography variant="body1">
                {selectedRequest.payment_method === "mobile-money"
                  ? "Mobile Money"
                  : "Carte de crédit"}
              </Typography>
            </Grid>

            {selectedRequest.payment_details && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Détails du paiement
                  </Typography>
                </Grid>

                {selectedRequest.payment_details.phone_number && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numéro de téléphone
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.payment_details.phone_number}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.payment_details.telecom && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Opérateur
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.payment_details.telecom}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.session_id && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID de session
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                      {selectedRequest.session_id}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.transaction_id && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID de transaction
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                      {selectedRequest.transaction_id}
                    </Typography>
                  </Grid>
                )}
              </>
            )}

            {selectedRequest.notes && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">{selectedRequest.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} color="primary">
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
