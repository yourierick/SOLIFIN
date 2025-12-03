import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "../../utils/axios";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
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
  SwapHoriz as SwapHorizIcon,
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
  const { selectedCurrency, toggleCurrency, isCDFEnabled } = useCurrency();
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
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // États pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
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

  // Appliquer les filtres et la pagination lorsqu'ils changent
  useEffect(() => {
    if (!loading) {
      fetchTransactions();
      fetchStatsByType();
      fetchStatsByPeriod();
    }
  }, [filters, page, rowsPerPage, selectedCurrency, isCDFEnabled]);

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

  // Fonction pour récupérer les transactions avec pagination backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.date_from = filters.startDate;
      if (filters.endDate) params.date_to = filters.endDate;

      // Pagination backend
      params.per_page = rowsPerPage;
      params.page = page + 1; // Laravel pagination commence à 1

      // Filtrer par devise si CDF est activé
      if (isCDFEnabled) {
        params.currency = selectedCurrency;
      } else {
        params.currency = "USD";
      }

      const response = await axios.get("/api/admin/finances", { params });

      if (response.data.success) {
        setTransactions(response.data.data.data);
        setTotalTransactions(
          response.data.total_count || response.data.data.total
        );
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

      if (filters.startDate) params.date_from = filters.startDate;
      if (filters.endDate) params.date_to = filters.endDate;

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

      if (filters.startDate) params.date_from = filters.startDate;
      if (filters.endDate) params.date_to = filters.endDate;

      const response = await axios.get("/api/admin/finances/stats-by-type", {
        params,
      });

      if (response.data.success) {
        setStatsByType(
          isCDFEnabled && selectedCurrency === "CDF"
            ? response.data.data.stats_cdf
            : response.data.data.stats_usd
        );
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
      if (filters.startDate) params.date_from = filters.startDate;
      if (filters.endDate) params.date_to = filters.endDate;

      const response = await axios.get("/api/admin/finances/stats-by-period", {
        params,
      });

      if (response.data.success) {
        setStatsByPeriod(
          isCDFEnabled && selectedCurrency === "CDF"
            ? response.data.data.stats_cdf
            : response.data.data.stats_usd
        );
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques par période");
    }
  };

  // Effet pour recharger les données lorsque la devise change
  useEffect(() => {
    if (userPermissions.length > 0) {
      fetchStatsByType();
      fetchStatsByPeriod();
    }
  }, [selectedCurrency, isCDFEnabled, filters, userPermissions]);

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
      startDate: "",
      endDate: "",
      userId: "",
      packId: "",
      searchTerm: "",
    });
  };

  // Fonction pour formater les montants selon la devise sélectionnée
  const formatAmount = (amount, currency = selectedCurrency) => {
    if (amount === null || amount === undefined) return "0.00";

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "0.00";

    if (currency === "CDF") {
      return new Intl.NumberFormat("fr-CD", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    } else {
      return new Intl.NumberFormat("fr-Fr", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericAmount);
    }
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
      Montant: `${transaction.amount} ${transaction.currency}`,
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
        stat.type === "pack_sale"
          ? "Achat de pack"
          : stat.type === "virtual_sale"
          ? "Vente de virtuels"
          : stat.type === "transfer"
          ? "Transfert des fonds"
          : stat.type === "withdrawal"
          ? "Retrait des fonds"
          : stat.type === "digital_product_sale"
          ? "Vente de produit numérique"
          : stat.type === "boost_sale"
          ? "Boost de publication"
          : stat.type === "renew_pack_sale"
          ? "Rénouvellement de pack"
          : stat.type,
      Nombre: stat.count,
      "Montant total": `${stat.total_amount} ${selectedCurrency}`,
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
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 },
        minHeight: "100vh",
        background: isDarkMode 
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" 
          : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
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
        <Box>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              display: { xs: "none", sm: "block" },
            }}
          >
            Consultez et analysez les transactions financières, gérez les démandes de retrait, gérez les commissions de parrainage
          </Typography>
        </Box>
      </Box>
      {/* Cartes de résumé financier - Design moderne professionnel */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Carte 1: Solde actuel */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
              "@keyframes gradient": {
                "0%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
                "100%": { backgroundPosition: "0% 50%" },
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Solde Actuel
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    Balance disponible
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? selectedCurrency === "USD"
                    ? formatAmount(systemBalance?.balance_usd || 0, "USD")
                    : formatAmount(systemBalance?.balance_cdf || 0, "CDF")
                  : formatAmount(0, selectedCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 2: Total des entrées */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Entrées
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    Total recettes
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <AttachMoneyIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? selectedCurrency === "USD"
                    ? formatAmount(systemBalance?.total_in_usd || 0, "USD")
                    : formatAmount(systemBalance?.total_in_cdf || 0, "CDF")
                  : formatAmount(0, selectedCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 3: Total des sorties */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #ef4444 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Sorties
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    Total dépenses
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <MoneyOffIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {userPermissions.includes("view-transactions") ||
                userPermissions.includes("super-admin")
                  ? selectedCurrency === "USD"
                    ? formatAmount(systemBalance?.total_out_usd || 0, "USD")
                    : formatAmount(systemBalance?.total_out_cdf || 0, "CDF")
                  : formatAmount(0, selectedCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte 4: Transactions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: "100%",
              background: isDarkMode ? "#1e293b" : "#ffffff",
              border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 50%, #6366f1 100%)",
                backgroundSize: "200% 100%",
                animation: "gradient 3s ease infinite",
              },
              "&:hover": {
                transform: "translateY(-4px)",
                border: isDarkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                background: isDarkMode ? "#1f2937" : "#f8fafc",
              },
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 1,
                    }}
                  >
                    Transactions
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#64748b" : "#94a3b8",
                      fontSize: "0.75rem",
                    }}
                  >
                    Total opérations
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                    width: 30,
                    height: 30,
                    borderRadius: "12px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: "-2px",
                      borderRadius: "12px",
                      padding: "2px",
                      background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "xor",
                      opacity: 0.3,
                    },
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: "1rem" }} />
                </Box>
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.5rem" },
                  fontWeight: 500,
                  color: isDarkMode ? "#ffffff" : "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
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
      {/* Onglets avec design moderne professionnel */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          mb: { xs: 3, sm: 4 },
          background: isDarkMode ? "#1e293b" : "#ffffff",
          border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: isDarkMode 
              ? "linear-gradient(90deg, transparent 0%, #475569 50%, transparent 100%)" 
              : "linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%)",
          },
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
              height: "3px",
              borderRadius: "3px 3px 0 0",
            },
          }}
          sx={{
            "& .MuiTabs-flexContainer": {
              px: { xs: 2, sm: 3 },
              py: 1,
              justifyContent: "center",
            },
            "& .MuiTab-root": {
              minHeight: { xs: 56, sm: 64 },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              fontWeight: 600,
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "0.95rem" },
              px: { xs: 2.5, sm: 3.5 },
              py: 1.5,
              color: isDarkMode ? "#94a3b8" : "#64748b",
              borderRadius: "12px",
              mx: 0.5,
              position: "relative",
              "&:hover": {
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
                background: isDarkMode 
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)" 
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)",
                transform: "translateY(-1px)",
              },
              "&.Mui-selected": {
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                background: isDarkMode 
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)" 
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
                transform: "translateY(-1px)",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "2px",
                  background: isDarkMode ? "#3b82f6" : "#2563eb",
                  borderRadius: "2px",
                },
              },
              "&.Mui-disabled": {
                color: "text.disabled",
                cursor: "not-allowed",
                opacity: 0.5,
              },
            },
          }}
        >
          <Tab
            icon={<CreditCardIcon fontSize="small" />}
            iconPosition="start"
            label="Transactions"
            disabled={
              !userPermissions.includes("view-transactions") &&
              !userPermissions.includes("super-admin")
            }
          />
          <Tab
            icon={<WalletIcon fontSize="small" />}
            iconPosition="start"
            label="Portefeuilles"
            disabled={
              !userPermissions.includes("manage-wallets") &&
              !userPermissions.includes("super-admin")
            }
          />
          <Tab
            icon={<MonetizationOnIcon fontSize="small" />}
            iconPosition="start"
            label="Commissions"
            disabled={
              !userPermissions.includes("manage-commissions") &&
              !userPermissions.includes("super-admin")
            }
          />
          <Tab
            icon={<PaymentIcon fontSize="small" />}
            iconPosition="start"
            label="Demandes de retrait"
            disabled={
              !userPermissions.includes("manage-withdrawals") &&
              !userPermissions.includes("super-admin")
            }
          />
        </Tabs>
      </Paper>

        {/* Contenu de l'onglet actif */}
        {activeTab === 0 && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: { xs: 3, sm: 4 },
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
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
                    <Typography
                      variant="h6"
                      sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                    >
                      Filtres
                    </Typography>
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
                              {type === "withdrawal"
                                ? "retrait"
                                : type === "pack_sale"
                                ? "Achat de pack"
                                : type === "renew_pack_sale"
                                ? "Rénouvellement de pack"
                                : type === "boost_sale"
                                ? "Boost de publication"
                                : type === "virtual_sale"
                                ? "Vente de virtuel"
                                : type === "digital_product_sale"
                                ? "Vente de produits numériques"
                                : type === "transfer"
                                ? "Transfert des fonds"
                                : type === "reception"
                                ? "Réception des fonds"
                                : type === "commission de parrainage"
                                ? "Commission de parrainage"
                                : type === "commission de retrait"
                                ? "Commission de retrait"
                                : type === "commission de transfert"
                                ? "Commission de transfert"
                                : type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl
                        size="small"
                        sx={{
                          minWidth: 120,
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
                          <MenuItem value="completed">Complété</MenuItem>
                          <MenuItem value="pending">En attente</MenuItem>
                          <MenuItem value="failed">Échoué</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        size="small"
                        type="date"
                        label="Date de début"
                        value={filters.startDate}
                        onChange={(e) =>
                          handleFilterChange("startDate", e.target.value)
                        }
                        sx={{
                          bgcolor: isDarkMode ? "#111827" : "#fff",
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
                            "&.Mui-focused": {
                              color: "#3b82f6",
                            },
                          },
                          "& input": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />

                      <TextField
                        size="small"
                        type="date"
                        label="Date de fin"
                        value={filters.endDate}
                        onChange={(e) =>
                          handleFilterChange("endDate", e.target.value)
                        }
                        sx={{
                          bgcolor: isDarkMode ? "#111827" : "#fff",
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
                            "&.Mui-focused": {
                              color: "#3b82f6",
                            },
                          },
                          "& input": {
                            color: isDarkMode ? "#fff" : "inherit",
                          },
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Box>
                  )}
                </Paper>

                {/* Tableau des transactions */}
                {transactions.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Aucune transaction trouvée
                  </Alert>
                ) : (
                  <TableContainer
                    sx={{
                      boxShadow: isDarkMode
                        ? "none"
                        : "0 2px 10px rgba(0, 0, 0, 0.05)",
                      borderRadius: { xs: 1.5, sm: 2 },
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
                        minWidth: { xs: "800px", sm: "900px" },
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
                          <TableCell sx={{ width: { xs: "200px", sm: "220px" } }}>Type</TableCell>
                          <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Montant</TableCell>
                          {isCDFEnabled && <TableCell sx={{ width: { xs: "80px", sm: "100px" } }}>Devise</TableCell>}
                          <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
                          <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date</TableCell>
                          <TableCell sx={{ width: { xs: "60px", sm: "80px" } }} align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((transaction) => (
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
                                padding: { xs: "6px 10px", sm: "10px 16px" },
                                color: isDarkMode ? "#fff" : "#475569",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              },
                              bgcolor: isDarkMode ? "#1d2432" : "#fff",
                            }}
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  px: { xs: 0.75, sm: 1 },
                                  py: { xs: 0.4, sm: 0.5 },
                                  borderRadius: { xs: 0.75, sm: 1 },
                                  background: isDarkMode
                                    ? "rgba(59, 130, 246, 0.2)"
                                    : "rgba(59, 130, 246, 0.1)",
                                  border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                  fontWeight: 600,
                                  color: isDarkMode ? "#60a5fa" : "#2563eb",
                                }}
                              >
                                #{transaction.id}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  transaction.type === "withdrawal"
                                    ? "retrait"
                                    : transaction.type === "pack_sale"
                                    ? "Achat de pack"
                                    : transaction.type === "renew_pack_sale"
                                    ? "Rénouvellement de pack"
                                    : transaction.type === "boost_sale"
                                    ? "Boost de publication"
                                    : transaction.type === "virtual_sale"
                                    ? "Vente de virtuel"
                                    : transaction.type === "digital_product_sale"
                                    ? "Vente de produits numériques"
                                    : transaction.type === "transfer"
                                    ? "Transfert des fonds"
                                    : transaction.type === "reception"
                                    ? "Réception des fonds"
                                    : transaction.type ===
                                      "commission de parrainage"
                                    ? "Commission de parrainage"
                                    : transaction.type === "commission de retrait"
                                    ? "Commission de retrait"
                                    : transaction.type ===
                                      "commission de transfert"
                                    ? "Commission de transfert"
                                    : transaction.type
                                }
                                size="small"
                                sx={{
                                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  height: { xs: 20, sm: 24 },
                                  fontWeight: 600,
                                  borderRadius: { xs: 1, sm: 1.5 },
                                  bgcolor: (() => {
                                    switch (transaction.type) {
                                      case "withdrawal":
                                        return isDarkMode ? "#4b5563" : "#e5e7eb";
                                      case "commission de parrainage":
                                        return isDarkMode ? "#065f46" : "#d1fae5";
                                      case "commission de retrait":
                                        return isDarkMode ? "#1e40af" : "#dbeafe";
                                      case "commission de transfert":
                                        return isDarkMode ? "#9f1239" : "#fee2e2";
                                      case "pack_sale":
                                        return isDarkMode ? "#92400e" : "#fef3c7";
                                      case "boost_sale":
                                        return isDarkMode ? "#064e3b" : "#d1fae5";
                                      case "virtual_sale":
                                        return isDarkMode ? "#064e3b" : "#d1fae5";
                                      case "digital_product_sale":
                                        return isDarkMode ? "#064e3b" : "#d1fae5";
                                      case "renew_pack_sale":
                                        return isDarkMode ? "#064e3b" : "#d1fae5";
                                      case "transfer":
                                        return isDarkMode ? "#064e3b" : "#d1fae5";
                                      default:
                                        return isDarkMode ? "#1f2937" : "#f3f4f6";
                                    }
                                  })(),
                                  color: isDarkMode ? "#fff" : "#111",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                                    color: transaction.mouvment === "out"
                                      ? isDarkMode ? "#f87171" : "#dc2626"
                                      : isDarkMode ? "#34d399" : "#16a34a",
                                  }}
                                >
                                  {transaction.mouvment === "out" ? "-" : "+"}
                                  {formatAmount(
                                    transaction.amount,
                                    transaction.currency
                                  )}
                                </Typography>
                              </Box>
                            </TableCell>
                            {isCDFEnabled && (
                              <TableCell>
                                <Chip
                                  label={transaction.currency}
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                    height: { xs: 18, sm: 22 },
                                    fontWeight: 700,
                                    borderRadius: { xs: 1, sm: 1.5 },
                                    bgcolor:
                                      transaction.currency === "USD"
                                        ? isDarkMode
                                          ? "rgba(59, 130, 246, 0.2)"
                                          : "rgba(59, 130, 246, 0.1)"
                                        : isDarkMode
                                        ? "rgba(16, 185, 129, 0.2)"
                                        : "rgba(16, 185, 129, 0.1)",
                                    color:
                                      transaction.currency === "USD"
                                        ? isDarkMode
                                          ? "#60a5fa"
                                          : "#2563eb"
                                        : isDarkMode
                                        ? "#34d399"
                                        : "#059669",
                                  }}
                                />
                              </TableCell>
                            )}
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
                                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  height: { xs: 20, sm: 24 },
                                  fontWeight: 600,
                                  borderRadius: { xs: 1, sm: 1.5 },
                                  bgcolor: (() => {
                                    switch (transaction.status) {
                                      case "pending":
                                        return isDarkMode ? "#92400e" : "#fef3c7";
                                      case "completed":
                                        return isDarkMode ? "#065f46" : "#d1fae5";
                                      case "failed":
                                        return isDarkMode ? "#9f1239" : "#fee2e2";
                                      default:
                                        return isDarkMode ? "#1f2937" : "#f3f4f6";
                                    }
                                  })(),
                                  color: isDarkMode ? "#fff" : "#111",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                                  color: isDarkMode ? "#d1d5db" : "#6b7280",
                                }}
                              >
                                {formatDate(transaction.created_at)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenTransactionDetails(transaction)
                                }
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
                                title="Voir les détails"
                              >
                                <VisibilityIcon sx={{ fontSize: { xs: "0.8rem", sm: "small" } }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Pagination toujours visible */}
                <TablePagination
                  component="div"
                  count={totalTransactions}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
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
              </>
            )}
          </Box>
        )}

        {/* Statistiques par type */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {/* Message informatif si CDF désactivé */}
            {!isCDFEnabled && (
              <Box sx={{ mb: 2 }}>
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    "& .MuiAlert-message": {
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  Seules les statistiques en USD sont affichées. Contactez
                  l'administrateur pour activer les statistiques en CDF.
                </Alert>
              </Box>
            )}
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
                        {isCDFEnabled && <TableCell>Devise</TableCell>}
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
                                stat.type === "withdrawal"
                                  ? "retrait"
                                  : stat.type === "pack_sale"
                                  ? "Achat de pack"
                                  : stat.type === "renew_pack_sale"
                                  ? "Rénouvellement de pack"
                                  : stat.type === "boost_sale"
                                  ? "Boost de publication"
                                  : stat.type === "virtual_sale"
                                  ? "Vente de virtuel"
                                  : stat.type === "digital_product_sale"
                                  ? "Vente de produits numériques"
                                  : stat.type === "transfer"
                                  ? "Transfert des fonds"
                                  : stat.type === "reception"
                                  ? "Réception des fonds"
                                  : stat.type === "commission de parrainage"
                                  ? "Commission de parrainage"
                                  : stat.type === "commission de retrait"
                                  ? "Commission de retrait"
                                  : stat.type === "commission de transfert"
                                  ? "Commission de transfert"
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
                                    case "commission de transfert":
                                      return isDarkMode ? "#9f1239" : "#fee2e2";
                                    case "digital_product_sale":
                                      return isDarkMode ? "#92400e" : "#fef3c7";
                                    case "pack_sale":
                                      return isDarkMode ? "#064e3b" : "#d1fae5";
                                    case "boost_sale":
                                      return isDarkMode ? "#064e3b" : "#d1fae5";
                                    case "renew_pack_sale":
                                      return isDarkMode ? "#064e3b" : "#d1fae5";
                                    case "transfer":
                                      return isDarkMode ? "#4b5563" : "#e5e7eb";
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
                            {formatAmount(stat.total_amount, selectedCurrency)}
                          </TableCell>
                          {isCDFEnabled && (
                            <TableCell>
                              <Chip
                                label={selectedCurrency}
                                size="small"
                                sx={{
                                  bgcolor:
                                    selectedCurrency === "USD"
                                      ? isDarkMode
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "rgba(59, 130, 246, 0.1)"
                                      : isDarkMode
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : "rgba(16, 185, 129, 0.1)",
                                  color:
                                    selectedCurrency === "USD"
                                      ? isDarkMode
                                        ? "#60a5fa"
                                        : "#2563eb"
                                      : isDarkMode
                                      ? "#34d399"
                                      : "#059669",
                                  fontWeight: "bold",
                                  fontSize: "0.75rem",
                                }}
                              />
                            </TableCell>
                          )}
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
            background: "#1f2937",
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
                              selectedTransaction.type === "withdrawal"
                                ? "retrait"
                                : selectedTransaction.type === "pack_sale"
                                ? "Achat de pack"
                                : selectedTransaction.type === "renew_pack_sale"
                                ? "Rénouvellement de pack"
                                : selectedTransaction.type === "boost_sale"
                                ? "Boost de publication"
                                : selectedTransaction.type === "virtual_sale"
                                ? "Vente de virtuel"
                                : selectedTransaction.type ===
                                  "digital_product_sale"
                                ? "Vente de produits numériques"
                                : selectedTransaction.type === "transfer"
                                ? "Transfert des fonds"
                                : selectedTransaction.type === "reception"
                                ? "Réception des fonds"
                                : selectedTransaction.type ===
                                  "commission de parrainage"
                                ? "Commission de parrainage"
                                : selectedTransaction.type ===
                                  "commission de retrait"
                                ? "Commission de retrait"
                                : selectedTransaction.type ===
                                  "commission de transfert"
                                ? "Commission de transfert"
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
                                  case "commission de transfert":
                                    return isDarkMode ? "#9f1239" : "#fee2e2";
                                  case "pack_sale":
                                    return isDarkMode ? "#92400e" : "#fef3c7";
                                  case "boost_sale":
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
                        secondary={
                          <span
                            className={`font-medium ${
                              selectedTransaction.mouvment === "out"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {selectedTransaction.mouvment === "out" ? "-" : "+"}
                            {formatAmount(
                              selectedTransaction.amount,
                              selectedTransaction.currency
                            )}
                          </span>
                        }
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
