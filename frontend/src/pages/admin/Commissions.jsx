import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Modal,
  Paper,
  Select,
  TablePagination,
  TextField,
  Typography,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
} from "@mui/material";

// Material Icons
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingIcon from "@mui/icons-material/Pending";
import CancelIcon from "@mui/icons-material/Cancel";
import TuneIcon from "@mui/icons-material/Tune";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SyncIcon from "@mui/icons-material/Sync";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

// Charts
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Utilitaires
import axios from "../../utils/axios";
import { useTheme } from "@mui/material/styles";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const Commissions = () => {
  // Hooks
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();
  const { selectedCurrency, toggleCurrency, isCDFEnabled } = useCurrency();

  // États
  const [activeTab, setActiveTab] = useState(0);
  const [commissions, setCommissions] = useState([]);
  const [packs, setPacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [commonErrors, setCommonErrors] = useState([]);
  const [filteredCommissions, setFilteredCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState(null);

  // États de pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCommissions, setTotalCommissions] = useState(0);

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    pack: "",
    packs: [],
    dateFrom: "",
    dateTo: "",
  });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  // Refs
  const searchInputRef = useRef(null);

  // Effets
  useEffect(() => {
    fetchCommissions();
    fetchStatistics();
    fetchCommonErrors();
  }, [selectedCurrency, isCDFEnabled, page, rowsPerPage, filters]);

  useEffect(() => {
    fetchPacks();
  }, [commissions]);

  useEffect(() => {
    if (commissions.length > 0 && searchQuery) {
      const filtered = commissions.filter((commission) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          commission.id.toString().includes(searchLower) ||
          (commission.sponsor_user &&
            commission.sponsor_user.name.toLowerCase().includes(searchLower)) ||
          (commission.source_user &&
            commission.source_user.name.toLowerCase().includes(searchLower)) ||
          (commission.pack &&
            commission.pack.name.toLowerCase().includes(searchLower)) ||
          commission.level.toString().includes(searchLower) ||
          commission.status.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCommissions(filtered);
    } else if (!searchQuery) {
      setFilteredCommissions(commissions);
    }
  }, [commissions, searchQuery]);

  // Gestionnaire de changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gestionnaire de changement de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonctions de chargement des données
  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Appliquer les filtres
      if (filters.status) params.status = filters.status;
      if (filters.pack) params.pack_id = filters.pack;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      // Filtrer par devise si CDF est activé
      if (isCDFEnabled) {
        params.currency = selectedCurrency;
      } else {
        params.currency = "USD";
      }

      // Pagination backend
      params.per_page = rowsPerPage;
      params.page = page + 1; // Laravel pagination commence à 1

      // Ajouter les filtres s'ils existent
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.pack) {
        params.pack_id = filters.pack;
      }
      if (filters.level) {
        params.level = filters.level;
      }
      if (filters.dateFrom) {
        params.date_from = filters.dateFrom;
      }
      if (filters.dateTo) {
        params.date_to = filters.dateTo;
      }

      const response = await axios.get("/api/admin/commissions", { params });
      
      if (response.data.success) {
        setCommissions(response.data.data.data);
        setTotalCommissions(response.data.data.total);
        setFilteredCommissions(response.data.data.data);
      } else {
        setError("Erreur lors du chargement des commissions");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des commissions:", err);
      setError("Erreur lors du chargement des commissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {};
      
      // Toujours filtrer par devise sélectionnée
      if (isCDFEnabled) {
        params.currency = selectedCurrency;
      } else {
        params.currency = "USD";
      }
      
      const response = await axios.get("/api/admin/commissions/statistics", { params });
      if (response.data.success) {
        // Les données sont dans response.data.data
        console.log("Statistics data received:", response.data.data); // Debug
        console.log("Commissions by status:", response.data.data.commissions_by_status); // Debug
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques", error);
    }
  };

  // Extraire les packs distincts directement du tableau des commissions
  const fetchPacks = () => {
    try {
      // Extraire uniquement les packs distincts qui existent dans les commissions
      const distinctPacks = [];
      const packIds = new Set();

      commissions.forEach((commission) => {
        if (commission.pack && !packIds.has(commission.pack.id)) {
          packIds.add(commission.pack.id);
          distinctPacks.push(commission.pack);
        }
      });
      setPacks(distinctPacks);
    } catch (error) {
      console.error("Erreur lors de l'extraction des packs:", error);
    }
  };

  const fetchCommonErrors = async () => {
    try {
      const response = await axios.get("/api/admin/commissions/common-errors");

      if (response.data.success) {
        setCommonErrors(response.data.data);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des erreurs communes:",
        error
      );
    }
  };

  // Fonctions de gestion des filtres
  const applyFilters = () => {
    let filtered = [...commissions];

    // Appliquer les filtres de statut, pack et niveau
    if (filters.status) {
      filtered = filtered.filter(
        (commission) => commission.status === filters.status
      );
    }

    if (filters.pack) {
      filtered = filtered.filter(
        (commission) =>
          commission.pack && commission.pack.id.toString() === filters.pack
      );
    }

    // Filtre multi-packs
    if (filters.packs && filters.packs.length > 0) {
      filtered = filtered.filter(
        (commission) =>
          commission.pack &&
          filters.packs.includes(commission.pack.id.toString())
      );
    }

    if (filters.level) {
      filtered = filtered.filter(
        (commission) => commission.level.toString() === filters.level
      );
    }

    // Filtrer par date
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((commission) => {
        const commissionDate = new Date(commission.created_at);
        return commissionDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((commission) => {
        const commissionDate = new Date(commission.created_at);
        return commissionDate <= toDate;
      });
    }

    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (commission) =>
          (commission.id && commission.id.toString().includes(query)) ||
          (commission.sponsor_user &&
            commission.sponsor_user.name.toLowerCase().includes(query)) ||
          (commission.sponsor_user &&
            commission.sponsor_user.email.toLowerCase().includes(query)) ||
          (commission.source_user &&
            commission.source_user.name.toLowerCase().includes(query)) ||
          (commission.source_user &&
            commission.source_user.email.toLowerCase().includes(query)) ||
          (commission.pack &&
            commission.pack.name.toLowerCase().includes(query)) ||
          (commission.amount && commission.amount.toString().includes(query))
      );
    }

    setFilteredCommissions(filtered);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      pack: "",
      packs: [],
      dateFrom: "",
      dateTo: "",
    });
    setFilterMenuAnchor(null);
  };

  // Fonctions de gestion des onglets et de la pagination
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Fonctions pour les actions
  const handleViewDetails = (commission) => {
    setSelectedCommission(commission);
  };

  const handleRetryCommission = async (id) => {
    try {
      setRetryLoading(true);
      const response = await axios.post(`/api/admin/commissions/${id}/retry`);

      if (response.data.success) {
        toast.success("Commission relancée avec succès");

        // Mettre à jour les données
        fetchCommissions();
        fetchStatistics();

        // Fermer le modal si ouvert
        if (selectedCommission && selectedCommission.id === id) {
          setSelectedCommission(null);
        }
      } else {
        toast.error(
          response.data.message || "Erreur lors de la relance de la commission"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la relance de la commission:", error);
      toast.error("Erreur lors de la relance de la commission");
    } finally {
      setRetryLoading(false);
    }
  };

  // Fonctions utilitaires
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error);
      return dateString;
    }
  };

  // Les statistiques sont déjà filtrées par devise, pas besoin de helper
  const formatAmount = (amount, currency = selectedCurrency) => {
    if (amount === undefined || amount === null) return "-";

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "-";

    if (currency === "CDF") {
      return new Intl.NumberFormat("fr-CD", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } else {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Complétée";
      case "pending":
        return "En attente";
      case "failed":
        return "Échouée";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon fontSize="small" />;
      case "pending":
        return <HourglassEmptyIcon fontSize="small" />;
      case "failed":
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  // Composant pour le menu de filtres
  const FilterMenu = () => {
    return (
      <>
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Filtres
          </Typography>
          {/* Filtres en block */}
          <Box sx={{ display: "block", gap: 2 }}>
            {/* Statut, Pack, Niveau en flex */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Select
                fullWidth
                size="small"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                displayEmpty
                sx={{
                  bgcolor: isDarkMode ? "#111827" : "#fff",
                  borderRadius: 1,
                }}
              >
                <MenuItem value="">
                  <em>Statut</em>
                </MenuItem>
                <MenuItem value="completed">Complétées</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="failed">Échouées</MenuItem>
              </Select>
              {packs && packs.length > 0 && (
                <Select
                  fullWidth
                  size="small"
                  value={filters.pack}
                  onChange={(e) => handleFilterChange("pack", e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: isDarkMode ? "#111827" : "#fff",
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="">
                    <em>Pack</em>
                  </MenuItem>
                  {(packs || []).map((pack) => (
                    <MenuItem key={pack.id} value={pack.id.toString()}>
                      {pack.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
              <Select
                fullWidth
                size="small"
                value={filters.level}
                onChange={(e) => handleFilterChange("level", e.target.value)}
                displayEmpty
                sx={{
                  bgcolor: isDarkMode ? "#111827" : "#fff",
                  borderRadius: 1,
                }}
              >
                <MenuItem value="">
                  <em>Niveau</em>
                </MenuItem>
                {[1, 2, 3, 4, 5].map((level) => (
                  <MenuItem
                    key={level}
                    value={level.toString()}
                  >{`Niveau ${level}`}</MenuItem>
                ))}
              </Select>
            </Box>
            {/* Filtres par date */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Du"
                type="date"
                size="small"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  bgcolor: isDarkMode ? "#111827" : "#fff",
                  borderRadius: 1,
                  flex: 1,
                }}
              />
              <TextField
                label="Au"
                type="date"
                size="small"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  bgcolor: isDarkMode ? "#111827" : "#fff",
                  borderRadius: 1,
                  flex: 1,
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="text"
            size="small"
            onClick={resetFilters}
            startIcon={<RefreshIcon />}
            sx={{
              color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
              textTransform: "none",
              fontSize: "0.8rem",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
            }}
          >
            Réinitialiser
          </Button>
        </Box>
      </>
    );
  };

  return (
    <>
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        bgcolor: isDarkMode ? "#1f2937" : "#fff",
        minHeight: "100vh",
        "& @keyframes shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "& @keyframes pulse": {
          "0%, 100%": { 
            transform: "scale(1)",
            opacity: 0.8,
          },
          "50%": { 
            transform: "scale(1.1)",
            opacity: 0.4,
          },
        },
        "& @keyframes fadeIn": {
          "from": { 
            opacity: 0,
            transform: "translateY(20px)",
          },
          "to": { 
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        animation: "fadeIn 0.6s ease-out",
        }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.875rem", sm: "1rem" },
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                fontWeight: 400,
              }}
            >
              Gérez et suivez toutes les commissions de parrainage
            </Typography>
          </Box>
        </Box>

        {/* Onglets avec design moderne */}
        <Paper
          elevation={isDarkMode ? 2 : 3}
          sx={{
            p: 0,
            mb: { xs: 2, sm: 3 },
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: 3,
            overflow: "hidden",
            transition: "all 0.3s ease",
            boxShadow: isDarkMode
              ? "0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(59, 130, 246, 0.1)"
              : "0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)",
            border: isDarkMode 
              ? "1px solid rgba(59, 130, 246, 0.1)" 
              : "1px solid rgba(59, 130, 246, 0.05)",
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
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
              },
            }}
            sx={{
              borderBottom: 1,
              borderColor: isDarkMode
                ? "rgba(55, 65, 81, 0.5)"
                : "rgba(0, 0, 0, 0.08)",
              bgcolor: isDarkMode ? "#111827" : "#f8fafc",
              "& .MuiTabs-flexContainer": {
                gap: { xs: 0.5, sm: 1 },
                px: { xs: 1, sm: 2 },
                pt: { xs: 1, sm: 1.5 },
              },
              "& .MuiTab-root": {
                minHeight: { xs: 44, sm: 48 },
                transition: "all 0.2s ease",
                fontSize: { xs: "0.875rem", sm: "0.9rem" },
                fontWeight: 500,
                color: isDarkMode ? "#9ca3af" : "#64748b",
                borderRadius: 2,
                mx: { xs: 0.5, sm: 1 },
                px: { xs: 2, sm: 3 },
                textTransform: "none",
                "&:hover": {
                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                  bgcolor: isDarkMode 
                    ? "rgba(59, 130, 246, 0.08)" 
                    : "rgba(37, 99, 235, 0.04)",
                  transform: "translateY(-1px)",
                },
                "&.Mui-selected": {
                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                  fontWeight: 600,
                  bgcolor: isDarkMode 
                    ? "rgba(59, 130, 246, 0.12)" 
                    : "rgba(37, 99, 235, 0.08)",
                },
              },
            }}
          >
            <Tab label="Commissions" />
            <Tab label="Statistiques" />
          </Tabs>
        </Paper>

        {/* Alerte d'erreur */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Contenu des onglets */}
        {activeTab === 0 ? (
          <Box>
            {/* Barre de recherche et filtres */}
            {/* Zone recherche + filtres */}
            <Box sx={{ mb: 3, display: "block", width: "100%" }}>
              <Box
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <TextField
                  placeholder="Rechercher par ID, nom, email..."
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  inputRef={searchInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="clear search"
                          onClick={() => setSearchQuery("")}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                      borderRadius: 1.5,
                      "&.Mui-focused": {
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.25)",
                      },
                    },
                  }}
                />
                <Tooltip
                  title={
                    showFilters ? "Masquer les filtres" : "Afficher les filtres"
                  }
                >
                  <IconButton
                    onClick={() => setShowFilters(!showFilters)}
                    color={
                      Object.values(filters).some(
                        (v) =>
                          v !== "" &&
                          v !== false &&
                          (Array.isArray(v) ? v.length > 0 : true)
                      )
                        ? "primary"
                        : "default"
                    }
                    sx={{
                      bgcolor: Object.values(filters).some(
                        (v) =>
                          v !== "" &&
                          v !== false &&
                          (Array.isArray(v) ? v.length > 0 : true)
                      )
                        ? isDarkMode
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                    }}
                  >
                    <TuneIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {/* Filtres améliorés avec design moderne */}
              {showFilters && (
                <Paper
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    mb: { xs: 2, sm: 3 },
                    bgcolor: isDarkMode ? "#111827" : "#fff",
                    borderRadius: { xs: 1.5, sm: 2 },
                    border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: "0.9rem", sm: "1.1rem" },
                        fontWeight: 600,
                        color: isDarkMode ? "#fff" : "#334155",
                      }}
                    >
                      Filtres
                    </Typography>
                    <Box>
                      <IconButton
                        onClick={resetFilters}
                        color="default"
                        size="small"
                        sx={{ 
                          ml: 1,
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          "&:hover": {
                            bgcolor: isDarkMode ? "rgba(156, 163, 175, 0.1)" : "rgba(107, 114, 128, 0.1)",
                          },
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    {/* Filtre par statut */}
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 120,
                        bgcolor: isDarkMode ? "#1f2937" : "#fff",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          "&:hover fieldset": {
                            borderColor: isDarkMode ? "#4b5563" : "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                          },
                        },
                      }}
                    >
                      <InputLabel 
                        id="status-filter-label"
                        sx={{
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        Statut
                      </InputLabel>
                      <Select
                        labelId="status-filter-label"
                        value={filters.status}
                        label="Statut"
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        sx={{
                          color: isDarkMode ? "#fff" : "inherit",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          "& .MuiSelect-icon": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Tous</em>
                        </MenuItem>
                        <MenuItem value="completed">Complétées</MenuItem>
                        <MenuItem value="pending">En attente</MenuItem>
                        <MenuItem value="failed">Échouées</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Filtre par pack */}
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 120,
                        bgcolor: isDarkMode ? "#1f2937" : "#fff",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          "&:hover fieldset": {
                            borderColor: isDarkMode ? "#4b5563" : "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                          },
                        },
                      }}
                    >
                      <InputLabel 
                        id="pack-filter-label"
                        sx={{
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        Pack
                      </InputLabel>
                      <Select
                        labelId="pack-filter-label"
                        value={filters.pack}
                        label="Pack"
                        onChange={(e) => handleFilterChange("pack", e.target.value)}
                        sx={{
                          color: isDarkMode ? "#fff" : "inherit",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          "& .MuiSelect-icon": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Tous</em>
                        </MenuItem>
                        {packs && packs.length > 0 ? (
                          packs.map((pack) => (
                            <MenuItem key={pack.id} value={pack.id.toString()}>
                              {pack.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>Aucun pack disponible</MenuItem>
                        )}
                      </Select>
                    </FormControl>

                    {/* Filtre par date de début */}
                    <TextField
                      size="small"
                      type="date"
                      label="Date de début"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "#fff",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          "&:hover fieldset": {
                            borderColor: isDarkMode ? "#4b5563" : "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          "&.Mui-focused": {
                            color: "#3b82f6",
                          },
                        },
                        "& input": {
                          color: isDarkMode ? "#fff" : "inherit",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />

                    {/* Filtre par date de fin */}
                    <TextField
                      size="small"
                      type="date"
                      label="Date de fin"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "#fff",
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": {
                            borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                          },
                          "&:hover fieldset": {
                            borderColor: isDarkMode ? "#4b5563" : "#9ca3af",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          "&.Mui-focused": {
                            color: "#3b82f6",
                          },
                        },
                        "& input": {
                          color: isDarkMode ? "#fff" : "inherit",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        },
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Box>
                </Paper>
              )}
            </Box>

            {/* Liste des commissions */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredCommissions.length > 0 ? (
              <>
                <TableContainer
                  sx={{
                    boxShadow: isDarkMode
                      ? "none"
                      : "0 2px 10px rgba(0, 0, 0, 0.05)",
                    borderRadius: { xs: 1.5, sm: 2.5 },
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
                      minWidth: { xs: "820px", sm: "920px" },
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
                        <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
                        <TableCell sx={{ width: { xs: "180px", sm: "200px" } }}>Parrain</TableCell>
                        <TableCell sx={{ width: { xs: "180px", sm: "200px" } }}>Filleul</TableCell>
                        <TableCell sx={{ width: { xs: "140px", sm: "160px" } }}>Montant</TableCell>
                        <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Date</TableCell>
                        <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
                        <TableCell sx={{ width: { xs: "80px", sm: "100px" } }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCommissions.map((commission, index) => (
                        <TableRow
                          key={commission.id}
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
                            bgcolor: index % 2 === 0
                              ? isDarkMode
                                ? "#1d2432"
                                : "#fff"
                              : isDarkMode
                                ? "#111827"
                                : "#f8fafc",
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: { xs: 0.75, sm: 1.5 },
                                py: { xs: 0.4, sm: 0.75 },
                                borderRadius: { xs: 0.75, sm: 1.5 },
                                background: isDarkMode
                                  ? "rgba(59, 130, 246, 0.2)"
                                  : "rgba(59, 130, 246, 0.1)",
                                border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                fontWeight: 600,
                                color: isDarkMode ? "#60a5fa" : "#2563eb",
                              }}
                            >
                              #{commission.id}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {commission.sponsor_user ? (
                              <Tooltip title={commission.sponsor_user.email}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.5 } }}>
                                  <Box
                                    sx={{
                                      width: { xs: 24, sm: 32 },
                                      height: { xs: 24, sm: 32 },
                                      borderRadius: "50%",
                                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "white",
                                      fontSize: { xs: "0.6rem", sm: "0.75rem" },
                                      fontWeight: 700,
                                      flexShrink: 0,
                                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                                    }}
                                  >
                                    {commission.sponsor_user.name.charAt(0).toUpperCase()}
                                  </Box>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500,
                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                        color: isDarkMode ? "#f3f4f6" : "#111827",
                                        lineHeight: 1.2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {commission.sponsor_user.name}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                fontStyle: "italic",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" }
                              }}>
                                Non défini
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {commission.source_user ? (
                              <Tooltip title={commission.source_user.email}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1.5 } }}>
                                  <Box
                                    sx={{
                                      width: { xs: 24, sm: 32 },
                                      height: { xs: 24, sm: 32 },
                                      borderRadius: "50%",
                                      background: "linear-gradient(135deg, #10b981, #059669)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "white",
                                      fontSize: { xs: "0.6rem", sm: "0.75rem" },
                                      fontWeight: 700,
                                      flexShrink: 0,
                                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                    }}
                                  >
                                    {commission.source_user.name.charAt(0).toUpperCase()}
                                  </Box>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500,
                                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                        color: isDarkMode ? "#f3f4f6" : "#111827",
                                        lineHeight: 1.2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {commission.source_user.name}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                fontStyle: "italic",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" }
                              }}>
                                Non défini
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 700,
                                  fontSize: { xs: "0.8rem", sm: "1rem" },
                                  color: isDarkMode ? "#f3f4f6" : "#111827",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatAmount(commission.amount, commission.currency)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                color: isDarkMode ? "#9ca3af" : "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              {commission.created_at ? new Date(commission.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              }) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(commission.status)}
                              label={getStatusLabel(commission.status)}
                              color={getStatusColor(commission.status)}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                height: { xs: 20, sm: 28 },
                                borderRadius: { xs: 1, sm: 2 },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 0.75 }, justifyContent: "center" }}>
                              <Tooltip title="Voir les détails" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(commission)}
                                  sx={{
                                    color: isDarkMode ? "#60a5fa" : "#2563eb",
                                    bgcolor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.1)"
                                      : "rgba(59, 130, 246, 0.05)",
                                    width: { xs: 24, sm: 32 },
                                    height: { xs: 24, sm: 32 },
                                    "&:hover": {
                                      bgcolor: isDarkMode
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "rgba(59, 130, 246, 0.1)",
                                    },
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }} />
                                </IconButton>
                              </Tooltip>

                              {commission.status === "failed" && (
                                <Tooltip title="Relancer la commission" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRetryCommission(commission.id)}
                                    disabled={retryLoading}
                                    sx={{
                                      color: isDarkMode ? "#34d399" : "#059669",
                                      bgcolor: isDarkMode
                                        ? "rgba(16, 185, 129, 0.1)"
                                        : "rgba(16, 185, 129, 0.05)",
                                      width: { xs: 24, sm: 32 },
                                      height: { xs: 24, sm: 32 },
                                      "&:hover": {
                                        bgcolor: isDarkMode
                                          ? "rgba(16, 185, 129, 0.2)"
                                          : "rgba(16, 185, 129, 0.1)",
                                      },
                                      "&:disabled": {
                                        opacity: 0.5,
                                        cursor: "not-allowed",
                                      },
                                    }}
                                  >
                                    <ReplayIcon sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucune commission trouvée
                </Typography>
              </Box>
            )}

            {/* Pagination backend */}
            <TablePagination
              component="div"
              count={totalCommissions}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} sur ${count}`
              }
              sx={{
                color: isDarkMode ? "#fff" : "#475569",
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
                },
                "& .MuiTablePagination-actions button": {
                  color: isDarkMode ? "#fff" : "#475569",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                  },
                },
                mt: 2,
              }}
            />

            {/* Modal de détails */}
            <Modal
              open={Boolean(selectedCommission)}
              onClose={() => setSelectedCommission(null)}
              aria-labelledby="commission-details-modal"
              slotProps={{
                backdrop: {
                  sx: {
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(8px)",
                  },
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: "95%", sm: 650 },
                  maxHeight: "90vh",
                  background: isDarkMode
                    ? "linear-gradient(145deg, rgba(31, 41, 55, 0.98), rgba(17, 24, 39, 0.98))"
                    : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
                  borderRadius: { xs: 2, sm: 3 },
                  boxShadow: isDarkMode
                    ? "0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)"
                    : "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)",
                  border: isDarkMode
                    ? "1px solid rgba(75, 85, 99, 0.6)"
                    : "1px solid rgba(226, 232, 240, 0.8)",
                  p: { xs: 3, sm: 4 },
                  overflow: "auto",
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                {selectedCommission && (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 4,
                        pb: 2,
                        borderBottom: `2px solid ${isDarkMode ? "rgba(75, 85, 99, 0.4)" : "rgba(226, 232, 240, 0.8)"}`,
                      }}
                    >
                      <Box>
                        <Typography 
                          variant="h5" 
                          component="h2"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "1.25rem", sm: "1.5rem" },
                            color: isDarkMode ? "#f9fafb" : "#111827",
                            mb: 0.5,
                            letterSpacing: "0.025em"
                          }}
                        >
                          Détails de la commission
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                          }}
                        >
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1.5,
                              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#3b82f6"
                            }}
                          >
                            #{selectedCommission.id}
                          </Box>
                          {formatDate(selectedCommission.created_at)}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => setSelectedCommission(null)}
                        size="small"
                        sx={{
                          background: isDarkMode
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
                            : "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))",
                          color: "#ef4444",
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          borderRadius: { xs: 1.5, sm: 2 },
                          border: isDarkMode
                            ? "1px solid rgba(239, 68, 68, 0.3)"
                            : "1px solid rgba(239, 68, 68, 0.2)",
                          boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.2))"
                              : "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))",
                            transform: "scale(1.1)",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }} />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))"
                              : "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.05))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            mb: 3,
                            border: isDarkMode
                              ? "1px solid rgba(59, 130, 246, 0.3)"
                              : "1px solid rgba(59, 130, 246, 0.2)",
                            boxShadow: isDarkMode
                              ? "0 4px 20px rgba(59, 130, 246, 0.15)"
                              : "0 4px 20px rgba(59, 130, 246, 0.08)",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Typography 
                              variant="subtitle2" 
                              gutterBottom
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                color: isDarkMode ? "#d1d5db" : "#374151",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                mb: 2
                              }}
                            >
                              Statut de la commission
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Chip
                                icon={getStatusIcon(selectedCommission.status)}
                                label={getStatusLabel(selectedCommission.status)}
                                color={getStatusColor(selectedCommission.status)}
                                size="medium"
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  height: { xs: 28, sm: 32 },
                                  borderRadius: { xs: 1.5, sm: 2 },
                                  px: { xs: 1.5, sm: 2 },
                                  boxShadow: theme => theme.palette.mode === 'dark' 
                                    ? "0 2px 12px rgba(0, 0, 0, 0.3)" 
                                    : "0 2px 12px rgba(0, 0, 0, 0.1)",
                                }}
                              />

                              {selectedCommission.status === "failed" && (
                                <Button
                                  startIcon={<ReplayIcon />}
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleRetryCommission(selectedCommission.id)}
                                  disabled={retryLoading}
                                  sx={{
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                    px: { xs: 2, sm: 2.5 },
                                    py: { xs: 0.75, sm: 1 },
                                    borderRadius: { xs: 1.5, sm: 2 },
                                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      background: "linear-gradient(135deg, #059669, #047857)",
                                      transform: "translateY(-2px)",
                                      boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
                                    },
                                    "&:disabled": {
                                      background: "rgba(156, 163, 175, 0.3)",
                                      color: "rgba(156, 163, 175, 0.8)",
                                    },
                                  }}
                                >
                                  Relancer
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.05))"
                              : "linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(37, 99, 235, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(59, 130, 246, 0.2)"
                              : "1px solid rgba(59, 130, 246, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                                }}
                              >
                                <AccountBalanceIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Parrain
                              </Typography>
                            </Box>
                            {selectedCommission.sponsor_user ? (
                              <Box>
                                <Typography 
                                  variant="body1" 
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: "0.9rem", sm: "1rem" },
                                    color: isDarkMode ? "#f3f4f6" : "#111827",
                                    mb: 0.5
                                  }}
                                >
                                  {selectedCommission.sponsor_user.name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5
                                  }}
                                >
                                  <EmailIcon sx={{ fontSize: "0.9rem" }} />
                                  {selectedCommission.sponsor_user.email}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  fontStyle: "italic",
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" }
                                }}
                              >
                                Non défini
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.05))"
                              : "linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(5, 150, 105, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(16, 185, 129, 0.2)"
                              : "1px solid rgba(16, 185, 129, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #10b981, #059669)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                }}
                              >
                                <PersonAddIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Filleul
                              </Typography>
                            </Box>
                            {selectedCommission.source_user ? (
                              <Box>
                                <Typography 
                                  variant="body1" 
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: { xs: "0.9rem", sm: "1rem" },
                                    color: isDarkMode ? "#f3f4f6" : "#111827",
                                    mb: 0.5
                                  }}
                                >
                                  {selectedCommission.source_user.name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5
                                  }}
                                >
                                  <EmailIcon sx={{ fontSize: "0.9rem" }} />
                                  {selectedCommission.source_user.email}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  fontStyle: "italic",
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" }
                                }}
                              >
                                Non défini
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(147, 51, 234, 0.05))"
                              : "linear-gradient(135deg, rgba(168, 85, 247, 0.04), rgba(147, 51, 234, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(168, 85, 247, 0.2)"
                              : "1px solid rgba(168, 85, 247, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #a855f7, #9333ea)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)",
                                }}
                              >
                                <TuneIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Pack
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body1" 
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                color: isDarkMode ? "#f3f4f6" : "#111827",
                              }}
                            >
                              {selectedCommission.pack?.name || "Non défini"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(251, 146, 60, 0.08), rgba(249, 115, 22, 0.05))"
                              : "linear-gradient(135deg, rgba(251, 146, 60, 0.04), rgba(249, 115, 22, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(251, 146, 60, 0.2)"
                              : "1px solid rgba(251, 146, 60, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #fb923c, #f97316)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(251, 146, 60, 0.3)",
                                }}
                              >
                                <MonetizationOnIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Montant
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography 
                                variant="body1" 
                                sx={{
                                  fontWeight: 700,
                                  fontSize: { xs: "1rem", sm: "1.1rem" },
                                  color: isDarkMode ? "#f9fafb" : "#111827",
                                }}
                              >
                                {formatAmount(selectedCommission.amount, selectedCommission.currency)}
                              </Typography>
                              <Chip
                                label={selectedCommission.currency}
                                size="small"
                                sx={{
                                  fontSize: "0.7rem",
                                  height: 22,
                                  fontWeight: 700,
                                  borderRadius: 1.5,
                                  background: selectedCommission.currency === "USD" 
                                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))"
                                    : "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))",
                                  color: selectedCommission.currency === "USD" 
                                    ? "#3b82f6" 
                                    : "#10b981",
                                  border: selectedCommission.currency === "USD"
                                    ? "1px solid rgba(59, 130, 246, 0.3)"
                                    : "1px solid rgba(16, 185, 129, 0.3)",
                                }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(219, 39, 119, 0.05))"
                              : "linear-gradient(135deg, rgba(236, 72, 153, 0.04), rgba(219, 39, 119, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(236, 72, 153, 0.2)"
                              : "1px solid rgba(236, 72, 153, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #ec4899, #db2777)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)",
                                }}
                              >
                                <NavigateNextIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Niveau
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body1" 
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                color: isDarkMode ? "#f3f4f6" : "#111827",
                              }}
                            >
                              Niveau {selectedCommission.level}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(22, 163, 74, 0.05))"
                              : "linear-gradient(135deg, rgba(34, 197, 94, 0.04), rgba(22, 163, 74, 0.02))",
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: isDarkMode
                              ? "1px solid rgba(34, 197, 94, 0.2)"
                              : "1px solid rgba(34, 197, 94, 0.15)",
                            boxShadow: isDarkMode
                              ? "0 2px 12px rgba(0, 0, 0, 0.2)"
                              : "0 2px 12px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                          }}
                        >
                          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                                }}
                              >
                                <RefreshIcon sx={{ fontSize: "1rem" }} />
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Date de création
                              </Typography>
                            </Box>
                            <Typography 
                              variant="body1" 
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                color: isDarkMode ? "#f3f4f6" : "#111827",
                              }}
                            >
                              {formatDate(selectedCommission.created_at)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {selectedCommission.status === "completed" &&
                        selectedCommission.completed_at && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Date de complétion
                            </Typography>
                            <Typography variant="body2">
                              {formatDate(selectedCommission.completed_at)}
                            </Typography>
                          </Grid>
                        )}

                      {selectedCommission.error_message && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Message d'erreur
                          </Typography>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: isDarkMode
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(239, 68, 68, 0.05)",
                              borderRadius: 1,
                              color: theme.palette.error.main,
                            }}
                          >
                            <Typography variant="body2">
                              {selectedCommission.error_message}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
              </Box>
            </Modal>
          </Box>
        ) : (
          <Box>
            {statistics ? (
              <>
                {/* Cartes de statistiques */}
                <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.08))"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(59, 130, 246, 0.1)"
                        }`,
                        borderRadius: 4,
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-6px) scale(1.02)",
                          boxShadow: isDarkMode
                            ? "0 20px 40px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.2)"
                            : "0 20px 40px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background: isDarkMode
                            ? "linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)"
                            : "linear-gradient(90deg, #2563eb, #3b82f6, #2563eb)",
                          animation: "shimmer 3s ease-in-out infinite",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          background: isDarkMode
                            ? "radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent)"
                            : "radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent)",
                          animation: "pulse 4s ease-in-out infinite",
                        }}
                      />
                      <CardContent sx={{ position: "relative", p: { xs: 2.5, sm: 3.5 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 3,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            color="primary"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.8rem", sm: "0.95rem" },
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Total des commissions ({selectedCurrency})
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isDarkMode
                                ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "white",
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              borderRadius: "50%",
                              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                              },
                            }}
                          >
                            <AccountBalanceIcon
                              sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}
                            />
                          </Box>
                        </Box>
                        <Typography
                          variant="h4"
                          component="div"
                          sx={{
                            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
                            fontWeight: 800,
                            color: isDarkMode ? "#f9fafb" : "#111827",
                            lineHeight: 1.2,
                            mb: 1,
                            background: isDarkMode
                              ? "linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%)"
                              : "linear-gradient(135deg, #111827 0%, #374151 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {statistics.total_commissions?.toLocaleString() || "0"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: 500,
                            }}
                          >
                            Montant total:
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: isDarkMode ? "#60a5fa" : "#2563eb",
                              fontSize: { xs: "1rem", sm: "1.1rem" },
                              fontWeight: 700,
                            }}
                          >
                            {formatAmount(statistics.total_amount || 0, selectedCurrency)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.08))"
                          : "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.04))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(251, 191, 36, 0.2)"
                            : "rgba(251, 191, 36, 0.1)"
                        }`,
                        borderRadius: 4,
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-6px) scale(1.02)",
                          boxShadow: isDarkMode
                            ? "0 20px 40px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.2)"
                            : "0 20px 40px rgba(251, 191, 36, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.1)",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background: isDarkMode
                            ? "linear-gradient(90deg, #fbbf24, #fcd34d, #fbbf24)"
                            : "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
                          animation: "shimmer 3s ease-in-out infinite",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          background: isDarkMode
                            ? "radial-gradient(circle, rgba(251, 191, 36, 0.2), transparent)"
                            : "radial-gradient(circle, rgba(251, 191, 36, 0.1), transparent)",
                          animation: "pulse 4s ease-in-out infinite",
                        }}
                      />
                      <CardContent sx={{ position: "relative", p: { xs: 2.5, sm: 3.5 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 3,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            color="warning.main"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.8rem", sm: "0.95rem" },
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            En attente ({selectedCurrency})
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isDarkMode
                                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                                : "linear-gradient(135deg, #f59e0b, #d97706)",
                              color: "white",
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              borderRadius: "50%",
                              boxShadow: "0 4px 12px rgba(251, 191, 36, 0.3)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 6px 16px rgba(251, 191, 36, 0.4)",
                              },
                            }}
                          >
                            <PendingIcon
                              sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}
                            />
                          </Box>
                        </Box>
                        <Typography
                          variant="h4"
                          component="div"
                          sx={{
                            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
                            fontWeight: 800,
                            color: isDarkMode ? "#f9fafb" : "#111827",
                            lineHeight: 1.2,
                            mb: 1,
                            background: isDarkMode
                              ? "linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)"
                              : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {statistics.pending_count?.toLocaleString() || "0"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: 500,
                            }}
                          >
                            Montant total:
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: isDarkMode ? "#fcd34d" : "#f59e0b",
                              fontSize: { xs: "1rem", sm: "1.1rem" },
                              fontWeight: 700,
                            }}
                          >
                            {formatAmount(statistics.pending_amount || 0, selectedCurrency)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))"
                          : "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.04))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(239, 68, 68, 0.1)"
                        }`,
                        borderRadius: 4,
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          transform: "translateY(-6px) scale(1.02)",
                          boxShadow: isDarkMode
                            ? "0 20px 40px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.2)"
                            : "0 20px 40px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.1)",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background: isDarkMode
                            ? "linear-gradient(90deg, #ef4444, #f87171, #ef4444)"
                            : "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)",
                          animation: "shimmer 3s ease-in-out infinite",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          background: isDarkMode
                            ? "radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent)"
                            : "radial-gradient(circle, rgba(239, 68, 68, 0.1), transparent)",
                          animation: "pulse 4s ease-in-out infinite",
                        }}
                      />
                      <CardContent sx={{ position: "relative", p: { xs: 2.5, sm: 3.5 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 3,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            color="error.main"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.8rem", sm: "0.95rem" },
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Échouées ({selectedCurrency})
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isDarkMode
                                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                : "linear-gradient(135deg, #dc2626, #b91c1c)",
                              color: "white",
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                              borderRadius: "50%",
                              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 6px 16px rgba(239, 68, 68, 0.4)",
                              },
                            }}
                          >
                            <CancelIcon
                              sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}
                            />
                          </Box>
                        </Box>
                        <Typography
                          variant="h4"
                          component="div"
                          sx={{
                            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
                            fontWeight: 800,
                            color: isDarkMode ? "#f9fafb" : "#111827",
                            lineHeight: 1.2,
                            mb: 1,
                            background: isDarkMode
                              ? "linear-gradient(135deg, #f87171 0%, #ef4444 100%)"
                              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {statistics.failed_count?.toLocaleString() || "0"}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: isDarkMode ? "#9ca3af" : "#6b7280",
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: 500,
                            }}
                          >
                            Montant total:
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: isDarkMode ? "#f87171" : "#dc2626",
                              fontSize: { xs: "1rem", sm: "1.1rem" },
                              fontWeight: 700,
                            }}
                          >
                            {formatAmount(statistics.failed_amount || 0, selectedCurrency)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Graphiques */}
                <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 3 } }}>
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                        borderRadius: 2,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                        p: 2,
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par statut ({selectedCurrency})
                        </Typography>
                        <Box sx={{ height: 300, position: "relative" }}>
                          {console.log("Chart data - commissions_by_status:", statistics.commissions_by_status)} {/* Debug */}
                          {console.log("Chart data - completed:", statistics.commissions_by_status?.completed)} {/* Debug */}
                          {console.log("Chart data - pending:", statistics.commissions_by_status?.pending)} {/* Debug */}
                          {console.log("Chart data - failed:", statistics.commissions_by_status?.failed)} {/* Debug */}
                          {(!parseInt(statistics.commissions_by_status?.completed) && 
                            !parseInt(statistics.commissions_by_status?.pending) && 
                            !parseInt(statistics.commissions_by_status?.failed)) || 
                           !statistics.commissions_by_status ? (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              height: '100%',
                              color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}>
                              <Typography variant="body2">
                                Aucune commission {selectedCurrency} trouvée
                              </Typography>
                            </Box>
                          ) : (
                            <Doughnut
                              data={{
                                labels: ["Complétées", "En attente", "Échouées"],
                                datasets: [
                                  {
                                    data: [
                                      parseInt(statistics.commissions_by_status?.completed) || 0,
                                      parseInt(statistics.commissions_by_status?.pending) || 0,
                                      parseInt(statistics.commissions_by_status?.failed) || 0,
                                    ],
                                    backgroundColor: [
                                      theme.palette.success.main,
                                      theme.palette.warning.main,
                                      theme.palette.error.main,
                                    ],
                                    borderWidth: 0,
                                    hoverOffset: 4,
                                  },
                                ],
                              }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              cutout: "70%",
                              plugins: {
                                legend: {
                                  position: "bottom",
                                  labels: {
                                    color: isDarkMode ? "#fff" : "#333",
                                    font: {
                                      size: 12,
                                    },
                                    padding: 20,
                                  },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      const label = context.label || "";
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce(
                                        (acc, data) => acc + data,
                                        0
                                      );
                                      const percentage =
                                        total > 0
                                          ? Math.round((value / total) * 100)
                                          : 0;
                                      return `${label}: ${value} (${percentage}%)`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                        borderRadius: 2,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                        p: 2,
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par pack
                        </Typography>
                        <Box sx={{ height: 300, position: "relative" }}>
                          <Bar
                            data={{
                              labels:
                                statistics.commissions_by_pack?.map(
                                  (item) => item.name
                                ) || [],
                              datasets: [
                                {
                                  label: "Nombre de commissions",
                                  data:
                                    statistics.commissions_by_pack?.map(
                                      (item) => item.count
                                    ) || [],
                                  backgroundColor: theme.palette.primary.main,
                                  borderRadius: 6,
                                },
                                {
                                  label: "Montant total",
                                  data:
                                    statistics.commissions_by_pack?.map(
                                      (item) => parseFloat(item.total_amount)
                                    ) || [],
                                  backgroundColor: theme.palette.secondary.main,
                                  borderRadius: 6,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)",
                                  },
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    precision: 0,
                                  },
                                },
                                x: {
                                  grid: {
                                    display: false,
                                  },
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  },
                                },
                              },
                              plugins: {
                                legend: {
                                  position: "top",
                                  labels: {
                                    color: isDarkMode ? "#fff" : "#333",
                                    font: {
                                      size: 12,
                                    },
                                    padding: 10,
                                  },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      if (
                                        context.dataset.label ===
                                        "Montant total"
                                      ) {
                                        return `${
                                          context.dataset.label
                                        }: ${formatAmount(context.raw, selectedCurrency)}`;
                                      }
                                      return `${context.dataset.label}: ${context.raw}`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Graphique des commissions par niveau */}
                <Grid container spacing={3} sx={{ mt: 3 }}>
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                        borderRadius: 2,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                        p: 2,
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par niveau
                        </Typography>
                        <Box sx={{ height: 300, position: "relative" }}>
                          <Bar
                            data={{
                              labels:
                                statistics.commissions_by_level?.map(
                                  (item) => `Niveau ${item.level}`
                                ) || [],
                              datasets: [
                                {
                                  label: "Nombre de commissions",
                                  data:
                                    statistics.commissions_by_level?.map(
                                      (item) => item.count
                                    ) || [],
                                  backgroundColor: theme.palette.info.main,
                                  borderRadius: 6,
                                },
                                {
                                  label: "Montant total",
                                  data:
                                    statistics.commissions_by_level?.map(
                                      (item) => parseFloat(item.total_amount)
                                    ) || [],
                                  backgroundColor: theme.palette.warning.main,
                                  borderRadius: 6,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)",
                                  },
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                    precision: 0,
                                  },
                                },
                                x: {
                                  grid: {
                                    display: false,
                                  },
                                  ticks: {
                                    color: isDarkMode ? "#D1D5DB" : "#4B5563",
                                  },
                                },
                              },
                              plugins: {
                                legend: {
                                  position: "top",
                                  labels: {
                                    color: isDarkMode ? "#fff" : "#333",
                                    font: {
                                      size: 12,
                                    },
                                    padding: 10,
                                  },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      if (
                                        context.dataset.label ===
                                        "Montant total"
                                      ) {
                                        return `${
                                          context.dataset.label
                                        }: ${formatAmount(context.raw, selectedCurrency)}`;
                                      }
                                      return `${context.dataset.label}: ${context.raw}`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Erreurs communes */}
                {commonErrors && commonErrors.length > 0 && (
                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Card
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                        borderRadius: 2,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Erreurs communes
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            mt: 2,
                          }}
                        >
                          {commonErrors.map((error, index) => (
                            <Card
                              key={index}
                              sx={{
                                bgcolor: isDarkMode
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(239, 68, 68, 0.05)",
                              }}
                            >
                              <CardContent>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                                  <Typography
                                    variant="subtitle2"
                                    color="error.main"
                                  >
                                    {error.count} occurrences
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {error.error_message}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucune statistique disponible
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};

export default Commissions;
