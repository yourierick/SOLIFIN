import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "../../utils/axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Badge,
  Tooltip,
  Zoom,
} from "@mui/material";
import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  DateRange as DateRangeIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  FileDownload as FileDownloadIcon,
  Wallet as WalletIcon,
  CreditCard as CreditCardIcon,
  BarChart as BarChartIcon,
  CardGiftcard as CardGiftcardIcon,
  MonetizationOn as MonetizationOnIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

// Import des composants avec lazy loading
const Wallets = lazy(() => import("./Wallets"));
const Commissions = lazy(() => import("./Commissions"));
const WithdrawalRequests = lazy(() =>
  import("../../components/WithdrawalRequests")
);

// Composant principal
const Finances = () => {
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // États pour les données
  const [transactions, setTransactions] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemBalance, setSystemBalance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statsByType, setStatsByType] = useState([]);
  const [statsByPeriod, setStatsByPeriod] = useState([]);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // États pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    userId: "",
    packId: "",
    searchTerm: "",
  });

  // États pour les onglets
  const [activeTab, setActiveTab] = useState(0);

  // État pour les permissions
  const [userPermissions, setUserPermissions] = useState([]);
  const { user } = useAuth();

  // État pour l'animation des onglets
  const [tabHover, setTabHover] = useState(null);

  // États pour le modal de détails de transaction
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openTransactionModal, setOpenTransactionModal] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    fetchTransactionTypes();
    fetchSystemBalance();
    fetchSummary();
    fetchTransactions();
    fetchStatsByType();
  }, []);

  // Appliquer les filtres lorsqu'ils changent
  useEffect(() => {
    if (!loading) {
      fetchTransactions();
      fetchStatsByType();
      fetchStatsByPeriod();
    }
  }, [filters]);

  // Récupérer les permissions de l'utilisateur
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await axios.get(`/api/user/permissions`);
        if (response.data && response.data.permissions) {
          const permissionSlugs = response.data.permissions.map(
            (permission) => permission.slug
          );
          setUserPermissions(permissionSlugs);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des permissions");
      }
    };

    if (user) {
      fetchUserPermissions();
    }
  }, [user]);

  // Fonction pour récupérer les transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = await axios.get("/api/admin/finances", { params });

      if (response.data.success) {
        setTransactions(response.data.data.data);
        setError(null);
      } else {
        setError(
          response.data.message || "Erreur lors du chargement des transactions"
        );
      }
    } catch (err) {
      setError("Erreur lors du chargement des transactions");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les types de transactions
  const fetchTransactionTypes = async () => {
    try {
      const response = await axios.get("/api/admin/finances/transaction-types");

      if (response.data.success) {
        setTransactionTypes(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des types de transactions");
    }
  };

  // Fonction pour récupérer le solde du système
  const fetchSystemBalance = async () => {
    try {
      const response = await axios.get("/api/admin/finances/system-balance");

      if (response.data.success) {
        setSystemBalance(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du solde du système");
    }
  };

  // Fonction pour récupérer le résumé des finances
  const fetchSummary = async () => {
    try {
      const params = {};

      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = await axios.get("/api/admin/finances/summary", {
        params,
      });

      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du résumé des finances");
    }
  };

  // Fonction pour récupérer les statistiques par type
  const fetchStatsByType = async () => {
    try {
      const params = {};

      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = await axios.get("/api/admin/finances/stats-by-type", {
        params,
      });

      if (response.data.success) {
        setStatsByType(response.data.data.stats);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques par type");
    }
  };

  // Fonction pour récupérer les statistiques par période
  const fetchStatsByPeriod = async () => {
    try {
      const params = {
        period: "month",
      };

      if (filters.type) params.type = filters.type;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const response = await axios.get("/api/admin/finances/stats-by-period", {
        params,
      });

      if (response.data.success) {
        setStatsByPeriod(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques par période");
    }
  };

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Gestionnaire de changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gestionnaire de changement de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      type: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      userId: "",
      packId: "",
      searchTerm: "",
    });
  };

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Fonction pour ouvrir le modal avec les détails d'une transaction
  const handleOpenTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenTransactionModal(true);
  };

  // Fonction pour fermer le modal
  const handleCloseTransactionModal = () => {
    setOpenTransactionModal(false);
    setSelectedTransaction(null);
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Fonction pour exporter les transactions au format Excel
  const exportTransactionsToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = transactions.map((transaction) => ({
      ID: transaction.id,
      Type:
        transaction.type === "sales"
          ? "vente"
          : transaction.type === "virtual_sale"
          ? "vente de virtuels"
          : transaction.type === "transfer"
          ? "transfert des fonds"
          : transaction.type === "withdrawal"
          ? "retrait des fonds"
          : transaction.type === "reception"
          ? "dépôt des fonds"
          : transaction.type,
      Montant: transaction.amount,
      Statut:
        transaction.status === "completed"
          ? "complété"
          : transaction.status === "pending"
          ? "en attente"
          : transaction.status === "failed"
          ? "échoué"
          : transaction.status,
      Date: formatDate(transaction.created_at),
      "Date de création": format(
        new Date(transaction.created_at),
        "yyyy-MM-dd HH:mm:ss"
      ),
      "Date de mise à jour": format(
        new Date(transaction.updated_at),
        "yyyy-MM-dd HH:mm:ss"
      ),
    }));

    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Génération du nom de fichier avec date
    const fileName = `transactions_${format(
      new Date(),
      "yyyy-MM-dd_HH-mm"
    )}.xlsx`;

    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  // Fonction pour exporter les statistiques par type au format Excel
  const exportStatsToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = statsByType.map((stat) => ({
      Type:
        stat.type === "sales"
          ? "vente"
          : stat.type === "virtual_sale"
          ? "vente de virtuels"
          : stat.type === "transfer"
          ? "transfert des fonds"
          : stat.type === "withdrawal"
          ? "retrait des fonds"
          : stat.type === "reception"
          ? "dépôt des fonds"
          : stat.type,
      Nombre: stat.count,
      "Montant total": stat.total_amount,
      "Première transaction": formatDate(stat.first_transaction),
      "Dernière transaction": formatDate(stat.last_transaction),
    }));

    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistiques");

    // Génération du nom de fichier avec date
    const fileName = `statistiques_${format(
      new Date(),
      "yyyy-MM-dd_HH-mm"
    )}.xlsx`;

    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Gestion des </Box>Finances
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, display: { xs: 'none', sm: 'block' } }}>
        Consultez et analysez les transactions financières du système
      </Typography>
      {/* Cartes de résumé financier */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Carte 1: Solde actuel */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: isDarkMode
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.05)",
              boxShadow: "none",
              border: `1px solid ${
                isDarkMode
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.1)"
              }`,
              borderRadius: 3,
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: isDarkMode
                  ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                  : "0 8px 20px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "primary.main",
                opacity: 0.1,
              }}
            />
            <CardContent sx={{ position: "relative", p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="primary"
                  sx={{ fontWeight: 600, fontSize: { xs: "0.75rem", sm: "0.9rem" } }}
                >
                  Solde actuel
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "primary.main",
                    color: "white",
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    borderRadius: "50%",
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} />
                </Box>
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "text.primary",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? formatAmount(systemBalance?.balance || 0)
                  : formatAmount(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 2: Total des entrées */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: isDarkMode
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(16, 185, 129, 0.05)",
              boxShadow: "none",
              border: `1px solid ${
                isDarkMode
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(16, 185, 129, 0.1)"
              }`,
              borderRadius: 3,
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: isDarkMode
                  ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                  : "0 8px 20px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "success.main",
                opacity: 0.1,
              }}
            />
            <CardContent sx={{ position: "relative", p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="success.main"
                  sx={{ fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Total des entrées
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "success.main",
                    color: "white",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: "1.2rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "text.primary",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? formatAmount(systemBalance?.total_in || 0)
                  : formatAmount(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 3: Total des sorties */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: isDarkMode
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(239, 68, 68, 0.05)",
              boxShadow: "none",
              border: `1px solid ${
                isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"
              }`,
              borderRadius: 3,
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: isDarkMode
                  ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                  : "0 8px 20px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "error.main",
                opacity: 0.1,
              }}
            />
            <CardContent sx={{ position: "relative", p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="error.main"
                  sx={{ fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Total des sorties
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "error.main",
                    color: "white",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                  }}
                >
                  <MoneyOffIcon sx={{ fontSize: "1.2rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "text.primary",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? formatAmount(systemBalance?.total_out || 0)
                  : formatAmount(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 4: Transactions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              bgcolor: isDarkMode
                ? "rgba(79, 70, 229, 0.1)"
                : "rgba(79, 70, 229, 0.05)",
              boxShadow: "none",
              border: `1px solid ${
                isDarkMode ? "rgba(79, 70, 229, 0.2)" : "rgba(79, 70, 229, 0.1)"
              }`,
              borderRadius: 3,
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: isDarkMode
                  ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                  : "0 8px 20px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -15,
                right: -15,
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "info.main",
                opacity: 0.1,
              }}
            />
            <CardContent sx={{ position: "relative", p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="info.main"
                  sx={{ fontWeight: 600, fontSize: "0.9rem" }}
                >
                  Transactions
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "info.main",
                    color: "white",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: "1.2rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.4rem" },
                  fontWeight: 700,
                  color: isDarkMode ? "#fff" : "text.primary",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? transactions.length > 0
                    ? transactions.length
                    : "---"
                  : "0"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Onglets avec design moderne */}
      <Paper
        elevation={isDarkMode ? 2 : 3}
        sx={{
          p: 0,
          mb: { xs: 2, sm: 3 },
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
          overflow: "hidden",
          transition: "all 0.3s ease",
          boxShadow: isDarkMode
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.1)",
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
              px: { xs: 0.5, sm: 1 },
              pt: { xs: 0.5, sm: 1 },
            },
            "& .MuiTab-root": {
              minHeight: { xs: 44, sm: 48 },
              transition: "all 0.2s ease",
              borderRadius: "8px 8px 0 0",
              fontWeight: 500,
              textTransform: "none",
              fontSize: { xs: "0.75rem", sm: "0.95rem" },
              px: { xs: 1, sm: 2 },
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(37, 99, 235, 0.05)",
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
              },
              "&.Mui-selected": {
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab
            icon={<CreditCardIcon fontSize="small" />}
            iconPosition="start"
            label="Transactions"
            onMouseEnter={() => setTabHover(1)}
            onMouseLeave={() => setTabHover(null)}
            disabled={
              !userPermissions.includes("view-transactions") &&
              !userPermissions.includes("super-admin")
            }
            sx={{
              transform: tabHover === 1 ? "translateY(-2px)" : "none",
              opacity:
                !userPermissions.includes("view-transactions") &&
                !userPermissions.includes("super-admin")
                  ? 0.5
                  : 1,
              "&.Mui-disabled": {
                color: "text.disabled",
                cursor: "not-allowed",
              },
            }}
          />
          <Tab
            icon={<BarChartIcon fontSize="small" />}
            iconPosition="start"
            label="Statistiques"
            onMouseEnter={() => setTabHover(2)}
            onMouseLeave={() => setTabHover(null)}
            disabled={
              !userPermissions.includes("view-transactions") &&
              !userPermissions.includes("super-admin")
            }
            sx={{
              transform: tabHover === 2 ? "translateY(-2px)" : "none",
              opacity:
                !userPermissions.includes("view-transactions") &&
                !userPermissions.includes("super-admin")
                  ? 0.5
                  : 1,
              "&.Mui-disabled": {
                color: "text.disabled",
                cursor: "not-allowed",
              },
            }}
          />
          <Tab
            icon={<MonetizationOnIcon fontSize="small" />}
            iconPosition="start"
            label="Commissions"
            onMouseEnter={() => setTabHover(4)}
            onMouseLeave={() => setTabHover(null)}
            disabled={
              !userPermissions.includes("manage-commissions") &&
              !userPermissions.includes("super-admin")
            }
            sx={{
              transform: tabHover === 4 ? "translateY(-2px)" : "none",
              opacity:
                !userPermissions.includes("manage-commissions") &&
                !userPermissions.includes("super-admin")
                  ? 0.5
                  : 1,
              "&.Mui-disabled": {
                color: "text.disabled",
                cursor: "not-allowed",
              },
            }}
          />
          <Tab
            icon={<PaymentIcon fontSize="small" />}
            iconPosition="start"
            label="Retraits"
            onMouseEnter={() => setTabHover(5)}
            onMouseLeave={() => setTabHover(null)}
            disabled={
              !userPermissions.includes("manage-withdrawals") &&
              !userPermissions.includes("super-admin")
            }
            sx={{
              transform: tabHover === 5 ? "translateY(-2px)" : "none",
              opacity:
                !userPermissions.includes("manage-withdrawals") &&
                !userPermissions.includes("super-admin")
                  ? 0.5
                  : 1,
              "&.Mui-disabled": {
                color: "text.disabled",
                cursor: "not-allowed",
              },
            }}
          />
        </Tabs>

        {/* Contenu de l'onglet actif */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 3, sm: 4 } }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : transactions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Aucune transaction trouvée
              </Alert>
            ) : (
              <>
                {/* Filtres */}
                <Paper
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    mb: { xs: 2, sm: 3 },
                    bgcolor: isDarkMode ? "#111827" : "#fff",
                    borderRadius: 2,
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
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Filtres</Typography>
                    <Box>
                      <IconButton
                        onClick={() => setShowFilters(!showFilters)}
                        color="primary"
                        size="small"
                      >
                        <FilterListIcon />
                      </IconButton>
                      <IconButton
                        onClick={resetFilters}
                        color="default"
                        size="small"
                        sx={{ ml: 1 }}
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton
                        onClick={exportTransactionsToExcel}
                        color="default"
                        size="small"
                        title="Exporter vers Excel"
                        sx={{ ml: 1 }}
                      >
                        <FileDownloadIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {showFilters && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        alignItems: "center",
                        mt: 2,
                      }}
                    >
                      <FormControl
                        size="small"
                        sx={{
                          minWidth: 150,
                          bgcolor: isDarkMode ? "#111827" : "#fff",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                            },
                          },
                        }}
                      >
                        <InputLabel id="type-filter-label">Type</InputLabel>
                        <Select
                          labelId="type-filter-label"
                          value={filters.type}
                          label="Type"
                          onChange={(e) =>
                            handleFilterChange("type", e.target.value)
                          }
                          sx={{
                            color: isDarkMode ? "#fff" : "inherit",
                            "& .MuiSelect-icon": {
                              color: isDarkMode ? "#fff" : "inherit",
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Tous</em>
                          </MenuItem>
                          {transactionTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type === "sales"
                                ? "ventes"
                                : type === "virtual_sale"
                                ? "ventes de virtuels"
                                : type === "withdrawal"
                                ? "retrait des fonds"
                                : type === "purchase"
                                ? "achat"
                                : type === "transfer"
                                ? "transfert des fonds"
                                : type === "reception"
                                ? "dépôt des fonds"
                                : type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl
                        size="small"
                        sx={{
                          minWidth: 150,
                          bgcolor: isDarkMode ? "#111827" : "#fff",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                            },
                          },
                        }}
                      >
                        <InputLabel id="status-filter-label">Statut</InputLabel>
                        <Select
                          labelId="status-filter-label"
                          value={filters.status}
                          label="Statut"
                          onChange={(e) =>
                            handleFilterChange("status", e.target.value)
                          }
                          sx={{
                            color: isDarkMode ? "#fff" : "inherit",
                            "& .MuiSelect-icon": {
                              color: isDarkMode ? "#fff" : "inherit",
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Tous</em>
                          </MenuItem>
                          <MenuItem value="pending">En attente</MenuItem>
                          <MenuItem value="completed">Complété</MenuItem>
                          <MenuItem value="failed">Échoué</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Date de début"
                        type="date"
                        size="small"
                        value={filters.dateFrom}
                        onChange={(e) =>
                          handleFilterChange("dateFrom", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          minWidth: 150,
                          bgcolor: isDarkMode ? "#111827" : "#fff",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                          "& .MuiInputLabel-root": {
                            color: isDarkMode ? "#9ca3af" : "inherit",
                          },
                        }}
                      />

                      <TextField
                        label="Date de fin"
                        type="date"
                        size="small"
                        value={filters.dateTo}
                        onChange={(e) =>
                          handleFilterChange("dateTo", e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          minWidth: 150,
                          bgcolor: isDarkMode ? "#111827" : "#fff",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                          "& .MuiInputLabel-root": {
                            color: isDarkMode ? "#9ca3af" : "inherit",
                          },
                        }}
                      />

                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          fetchTransactions();
                          fetchStatsByType();
                          fetchStatsByPeriod();
                          fetchSummary();
                        }}
                        sx={{ ml: "auto" }}
                      >
                        Appliquer
                      </Button>
                    </Box>
                  )}
                </Paper>

                <TableContainer
                  sx={{
                    boxShadow: isDarkMode
                      ? "none"
                      : "0 2px 10px rgba(0, 0, 0, 0.05)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                          "& th": {
                            fontWeight: "bold",
                            color: isDarkMode ? "#fff" : "#334155",
                            fontSize: "0.85rem",
                            padding: "12px 16px",
                            borderBottom: isDarkMode
                              ? "1px solid #374151"
                              : "2px solid #e2e8f0",
                          },
                        }}
                      >
                        <TableCell>ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((transaction) => (
                          <TableRow
                            key={transaction.id}
                            sx={{
                              "&:hover": {
                                bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                              },
                              borderBottom: `1px solid ${
                                isDarkMode ? "#374151" : "#e2e8f0"
                              }`,
                              "& td": {
                                padding: "10px 16px",
                                color: isDarkMode ? "#fff" : "#475569",
                              },
                              bgcolor: isDarkMode ? "#1d2432" : "#fff",
                            }}
                          >
                            <TableCell>{transaction.id}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  transaction.type === "sales"
                                    ? "vente"
                                    : transaction.type === "virtual_sale"
                                    ? "vente de virtuels"
                                    : transaction.type === "transfer"
                                    ? "transfert des fonds"
                                    : transaction.type === "withdrawal"
                                    ? "retrait des fonds"
                                    : transaction.type === "reception"
                                    ? "dépôt des fonds"
                                    : transaction.type
                                }
                                size="small"
                                sx={{
                                  bgcolor: (() => {
                                    switch (transaction.type) {
                                      case "withdrawal":
                                        return isDarkMode
                                          ? "#4b5563"
                                          : "#e5e7eb";
                                      case "commission de parrainage":
                                        return isDarkMode
                                          ? "#065f46"
                                          : "#d1fae5";
                                      case "commission de retrait":
                                        return isDarkMode
                                          ? "#1e40af"
                                          : "#dbeafe";
                                      case "frais de retrait":
                                        return isDarkMode
                                          ? "#9f1239"
                                          : "#fee2e2";
                                      case "frais de transfert":
                                        return isDarkMode
                                          ? "#92400e"
                                          : "#fef3c7";
                                      case "sales":
                                        return isDarkMode
                                          ? "#064e3b"
                                          : "#d1fae5";
                                      case "virtual_sale":
                                        return isDarkMode
                                          ? "#064e3b"
                                          : "#d1fae5";
                                      default:
                                        return isDarkMode
                                          ? "#1f2937"
                                          : "#f3f4f6";
                                    }
                                  })(),
                                  color: isDarkMode ? "#fff" : "#111",
                                }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                color:
                                  transaction.type === "withdrawal"
                                    ? "error.main"
                                    : "success.main",
                                fontWeight: "bold",
                              }}
                            >
                              {formatAmount(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  transaction.status === "completed"
                                    ? "complété"
                                    : transaction.status === "pending"
                                    ? "en attente"
                                    : transaction.status === "failed"
                                    ? "échoué"
                                    : transaction.status
                                }
                                size="small"
                                sx={{
                                  bgcolor: (() => {
                                    switch (transaction.status) {
                                      case "pending":
                                        return isDarkMode
                                          ? "#92400e"
                                          : "#fef3c7";
                                      case "completed":
                                        return isDarkMode
                                          ? "#065f46"
                                          : "#d1fae5";
                                      case "failed":
                                        return isDarkMode
                                          ? "#9f1239"
                                          : "#fee2e2";
                                      default:
                                        return isDarkMode
                                          ? "#1f2937"
                                          : "#f3f4f6";
                                    }
                                  })(),
                                  color: isDarkMode ? "#fff" : "#111",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenTransactionDetails(transaction)
                                }
                                color="primary"
                                title="Voir les détails"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={transactions.length}
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
                  }}
                />
              </>
            )}
          </Box>
        )}

        {/* Statistiques par type */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {statsByType.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Aucune statistique disponible
              </Alert>
            ) : (
              <>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                >
                  <IconButton
                    onClick={exportStatsToExcel}
                    color="default"
                    size="small"
                    title="Exporter vers Excel"
                    sx={{ ml: 1 }}
                  >
                    <FileDownloadIcon />
                  </IconButton>
                </Box>
                <TableContainer
                  sx={{
                    boxShadow: isDarkMode
                      ? "none"
                      : "0 2px 10px rgba(0, 0, 0, 0.05)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                          "& th": {
                            fontWeight: "bold",
                            color: isDarkMode ? "#fff" : "#334155",
                            fontSize: "0.85rem",
                            padding: "12px 16px",
                            borderBottom: isDarkMode
                              ? "1px solid #374151"
                              : "2px solid #e2e8f0",
                          },
                        }}
                      >
                        <TableCell>Type</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Montant total</TableCell>
                        <TableCell>Première transaction</TableCell>
                        <TableCell>Dernière transaction</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statsByType.map((stat) => (
                        <TableRow
                          key={stat.type}
                          sx={{
                            "&:hover": {
                              bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                            },
                            borderBottom: `1px solid ${
                              isDarkMode ? "#374151" : "#e2e8f0"
                            }`,
                            "& td": {
                              padding: "10px 16px",
                              color: isDarkMode ? "#fff" : "#475569",
                            },
                            bgcolor: isDarkMode ? "#1d2432" : "#fff",
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={
                                stat.type === "sales"
                                  ? "vente"
                                  : stat.type === "virtual_sale"
                                  ? "vente de virtuels"
                                  : stat.type === "transfer"
                                  ? "transfert des fonds"
                                  : stat.type === "withdrawal"
                                  ? "retrait des fonds"
                                  : stat.type === "reception"
                                  ? "dépôt des fonds"
                                  : stat.type
                              }
                              size="small"
                              sx={{
                                bgcolor: (() => {
                                  switch (stat.type) {
                                    case "withdrawal":
                                      return isDarkMode ? "#4b5563" : "#e5e7eb";
                                    case "commission de parrainage":
                                      return isDarkMode ? "#065f46" : "#d1fae5";
                                    case "commission de retrait":
                                      return isDarkMode ? "#1e40af" : "#dbeafe";
                                    case "frais de retrait":
                                      return isDarkMode ? "#9f1239" : "#fee2e2";
                                    case "frais de transfert":
                                      return isDarkMode ? "#92400e" : "#fef3c7";
                                    case "sales":
                                      return isDarkMode ? "#064e3b" : "#d1fae5";
                                    case "virtual_sale":
                                      return isDarkMode ? "#064e3b" : "#d1fae5";
                                    default:
                                      return isDarkMode ? "#1f2937" : "#f3f4f6";
                                  }
                                })(),
                                color: isDarkMode ? "#fff" : "#111",
                              }}
                            />
                          </TableCell>
                          <TableCell>{stat.count}</TableCell>
                          <TableCell
                            sx={{
                              color:
                                stat.type === "withdrawal"
                                  ? "error.main"
                                  : "success.main",
                              fontWeight: "bold",
                            }}
                          >
                            {formatAmount(stat.total_amount)}
                          </TableCell>
                          <TableCell>
                            {formatDate(stat.first_transaction)}
                          </TableCell>
                          <TableCell>
                            {formatDate(stat.last_transaction)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box p={3}>
            {/* Composant Commissions */}
            <Suspense
              fallback={
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="400px"
                >
                  <CircularProgress color="primary" />
                  <Typography variant="body1" ml={2} color="textSecondary">
                    Chargement des commissions...
                  </Typography>
                </Box>
              }
            >
              <Commissions />
            </Suspense>
          </Box>
        )}

        {activeTab === 3 && (
          <Box p={3}>
            {/* Composant WithdrawalRequests */}
            <Suspense
              fallback={
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="400px"
                >
                  <CircularProgress color="primary" />
                  <Typography variant="body1" ml={2} color="textSecondary">
                    Chargement des demandes de retrait...
                  </Typography>
                </Box>
              }
            >
              <WithdrawalRequests />
            </Suspense>
          </Box>
        )}
      </Paper>
      {/* Modal de détails de transaction */}
      <Dialog
        open={openTransactionModal}
        onClose={handleCloseTransactionModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
            boxShadow: isDarkMode
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(20px)",
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)",
            border: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(255, 255, 255, 0.2)",
            overflow: "hidden",
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(8px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(10px)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)",
                borderRadius: "50%",
                p: 1.5,
                mr: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Détails de la transaction
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Transaction #{selectedTransaction?.id}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleCloseTransactionModal}
            sx={{
              position: "relative",
              zIndex: 1,
              color: "white",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                background: "rgba(255,255,255,0.2)",
                transform: "rotate(90deg)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, background: "transparent" }}>
          {selectedTransaction && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                      : "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)",
                    backdropFilter: "blur(20px)",
                    border: isDarkMode
                      ? "1px solid rgba(76, 175, 80, 0.3)"
                      : "1px solid rgba(76, 175, 80, 0.2)",
                    borderRadius: 3,
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                      : "0 8px 32px rgba(76, 175, 80, 0.1)",
                    p: 3,
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: isDarkMode
                        ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                        : "0 12px 40px rgba(76, 175, 80, 0.15)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 3,
                      fontWeight: 700,
                      background:
                        "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background:
                          "linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)",
                        borderRadius: 2,
                        mr: 2,
                        boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                      }}
                    />
                    Informations générales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Type"
                        secondary={
                          <Chip
                            label={
                              selectedTransaction.type === "sales"
                                ? "vente"
                                : selectedTransaction.type === "virtual_sale"
                                ? "vente de virtuels"
                                : selectedTransaction.type ===
                                  "commission de parrainage"
                                ? "commission de parrainage"
                                : selectedTransaction.type ===
                                  "commission de retrait"
                                ? "commission de retrait"
                                : selectedTransaction.type ===
                                  "frais de retrait"
                                ? "frais de retrait"
                                : selectedTransaction.type ===
                                  "frais de transfert"
                                ? "frais de transfert"
                                : selectedTransaction.type
                            }
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: (() => {
                                switch (selectedTransaction.type) {
                                  case "withdrawal":
                                    return isDarkMode ? "#4b5563" : "#e5e7eb";
                                  case "commission de parrainage":
                                    return isDarkMode ? "#065f46" : "#d1fae5";
                                  case "commission de retrait":
                                    return isDarkMode ? "#1e40af" : "#dbeafe";
                                  case "frais de retrait":
                                    return isDarkMode ? "#9f1239" : "#fee2e2";
                                  case "frais de transfert":
                                    return isDarkMode ? "#92400e" : "#fef3c7";
                                  case "sales":
                                    return isDarkMode ? "#064e3b" : "#d1fae5";
                                  case "virtual_sale":
                                    return isDarkMode ? "#064e3b" : "#d1fae5";
                                  default:
                                    return isDarkMode ? "#1f2937" : "#f3f4f6";
                                }
                              })(),
                              color: isDarkMode ? "#fff" : "#111",
                            }}
                          />
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Montant"
                        secondary={formatAmount(selectedTransaction.amount)}
                        secondaryTypographyProps={{
                          sx: {
                            fontWeight: "bold",
                            color:
                              selectedTransaction.amount >= 0
                                ? "success.main"
                                : "error.main",
                          },
                        }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Statut"
                        secondary={
                          <Chip
                            label={selectedTransaction.status}
                            size="small"
                            sx={{ mt: 0.5 }}
                            color={
                              selectedTransaction.status === "completed"
                                ? "success"
                                : selectedTransaction.status === "pending"
                                ? "warning"
                                : selectedTransaction.status === "failed"
                                ? "error"
                                : "default"
                            }
                            icon={
                              selectedTransaction.status === "completed" ? (
                                <CheckCircleIcon />
                              ) : selectedTransaction.status === "pending" ? (
                                <HourglassEmptyIcon />
                              ) : selectedTransaction.status === "failed" ? (
                                <ErrorIcon />
                              ) : null
                            }
                          />
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Date de création"
                        secondary={format(
                          new Date(selectedTransaction.created_at),
                          "dd MMMM yyyy à HH:mm:ss",
                          { locale: fr }
                        )}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Date de mise à jour"
                        secondary={format(
                          new Date(selectedTransaction.updated_at),
                          "dd MMMM yyyy à HH:mm:ss",
                          { locale: fr }
                        )}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
                      : "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(3, 169, 244, 0.05) 100%)",
                    backdropFilter: "blur(20px)",
                    border: isDarkMode
                      ? "1px solid rgba(33, 150, 243, 0.3)"
                      : "1px solid rgba(33, 150, 243, 0.2)",
                    borderRadius: 3,
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                      : "0 8px 32px rgba(33, 150, 243, 0.1)",
                    p: 3,
                    height: "100%",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: isDarkMode
                        ? "0 12px 40px rgba(0, 0, 0, 0.4)"
                        : "0 12px 40px rgba(33, 150, 243, 0.15)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 3,
                      fontWeight: 700,
                      background:
                        "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        background:
                          "linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)",
                        borderRadius: 2,
                        mr: 2,
                        boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                      }}
                    />
                    Métadonnées
                  </Typography>
                  {selectedTransaction.metadata &&
                  Object.keys(selectedTransaction.metadata).length > 0 ? (
                    <List dense>
                      {Object.entries(selectedTransaction.metadata).map(
                        ([key, value]) => (
                          <React.Fragment key={key}>
                            <ListItem>
                              <ListItemText
                                primary={
                                  key.charAt(0).toUpperCase() +
                                  key.slice(1).replace("_", " ")
                                }
                                secondary={
                                  typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        )
                      )}
                    </List>
                  ) : (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Aucune métadonnée disponible pour cette transaction
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <Box
          sx={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(20px)",
            borderTop: isDarkMode
              ? "1px solid rgba(255,255,255,0.05)"
              : "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseTransactionModal}
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{
                minWidth: 120,
                background: isDarkMode
                  ? "rgba(31, 41, 55, 0.8)"
                  : "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(20px)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 3,
                color: "text.primary",
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem",
                py: 1.5,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  background: isDarkMode
                    ? "rgba(31, 41, 55, 0.9)"
                    : "rgba(255, 255, 255, 0.2)",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.3)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                },
                "&:active": {
                  transform: "translateY(0px)",
                },
              }}
            >
              Fermer
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Finances;
