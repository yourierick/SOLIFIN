import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-toastify";
import { useCurrency } from "../../contexts/CurrencyContext";
import WithdrawalRequests from "./components/WithdrawalRequests";
import JetonsEsengo from "./components/JetonsEsengo";
import Wallets from "./Wallet";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Collapse,
  alpha,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  DateRange as DateRangeIcon,
  Lightbulb as LightBulbIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
  Receipt as ReceiptIcon,
  Paid as PaidIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as WalletIcon,
  LocalAtm as TokenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// Composant principal
const Finances = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isCDFEnabled, canUseCDF } = useCurrency();

  // Références
  const tabsRef = useRef(null);

  // États pour les onglets
  const [activeTab, setActiveTab] = useState(0);

  const [summary, setSummary] = useState(null);
  const [transactionStats, setTransactionStats] = useState([]);
  const [walletBalance, setWalletBalance] = useState({
    balance_usd: 0,
    balance_cdf: 0,
    totalEarned_usd: 0,
    totalEarned_cdf: 0,
    totalWithdrawn_usd: 0,
    totalWithdrawn_cdf: 0,
  });

  // États pour la pagination
  const [transactionPagination, setTransactionPagination] = useState({
    page: 0,
    totalPages: 0,
    totalItems: 0,
    perPage: 10,
  });

  // États pour les filtres
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    date_from: "",
    date_to: "",
    pack_id: "",
  });
  const [showStatsFilters, setShowStatsFilters] = useState(false);

  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState({
    summary: false,
    wallet: false,
    transactionStats: false,
  });

  const [error, setError] = useState({
    summary: null,
    wallet: null,
    transactionStats: null,
  });

  // États pour les filtres de statistiques
  const [statsFilters, setStatsFilters] = useState({
    date_from: "",
    date_to: "",
    currency: "", // Ajout du filtre de devise
  });

  // États pour la fenêtre modale des détails de transaction
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Options pour les filtres
  const transactionTypes = [
    "reception",
    "withdrawal",
    "transfer",
    "commission de parrainage",
    "commission de retrait",
    "purchase",
  ];

  const currencyOptions = [
    { value: "USD", label: "USD" },
    ...(canUseCDF() ? [{ value: "CDF", label: "CDF" }] : []),
  ];

  // État pour stocker les packs distincts
  const [packOptions, setPackOptions] = useState([]);
  // Fonction pour formater les montants
  const formatAmount = (amount, currency = "USD") => {
    if (amount === undefined || amount === null) return "0,00";
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

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    resetFilters();
  };

  // Gestionnaires pour le défilement horizontal de la barre d'onglets
  const handleScrollLeft = () => {
    if (tabsRef.current) {
      const container = tabsRef.current.querySelector(".MuiTabs-scroller");
      if (container) {
        // Défilement d'une distance équivalente à la largeur d'un onglet (environ 150px)
        container.scrollBy({ left: -150, behavior: "smooth" });
      }
    }
  };

  const handleScrollRight = () => {
    if (tabsRef.current) {
      const container = tabsRef.current.querySelector(".MuiTabs-scroller");
      if (container) {
        // Défilement d'une distance équivalente à la largeur d'un onglet (environ 150px)
        container.scrollBy({ left: 150, behavior: "smooth" });
      }
    }
  };

  // Effet pour configurer l'affichage initial des onglets sur mobile
  useEffect(() => {
    if (isSmallScreen && tabsRef.current) {
      // Assure que l'onglet actif est visible lors du chargement initial
      setTimeout(() => {
        const activeTabElement = tabsRef.current.querySelector(".Mui-selected");
        if (activeTabElement) {
          activeTabElement.scrollIntoView({
            behavior: "smooth",
            inline: "center",
          });
        }
      }, 100);
    }
  }, [isSmallScreen, activeTab]);

  // Gestionnaire de changement de filtre
  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Fonction pour réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      type: "",
      status: "",
      date_from: "",
      date_to: "",
      pack_id: "",
      search: "",
    });
  }, []);

  // Fonction pour récupérer le résumé financier
  const fetchSummary = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, summary: true }));
      setError((prev) => ({ ...prev, summary: null }));

      const response = await axios.get("/api/user/finances/summary");

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération du résumé financier"
        );
      }

      const summaryData = response.data.data;
      setSummary(summaryData);
      setWalletBalance((prev) => ({
        ...prev,
        balance_usd: parseFloat(summaryData.balance_usd || 0),
        balance_cdf: parseFloat(summaryData.balance_cdf || 0),
        totalEarned_usd: parseFloat(summaryData.total_earned_usd || 0),
        totalEarned_cdf: parseFloat(summaryData.total_earned_cdf || 0),
        totalWithdrawn_usd: parseFloat(summaryData.total_withdrawn_usd || 0),
        totalWithdrawn_cdf: parseFloat(summaryData.total_withdrawn_cdf || 0),
      }));
    } catch (err) {
      console.error("Erreur lors de la récupération du résumé:", err);
      setError((prev) => ({
        ...prev,
        summary:
          err.message ||
          "Impossible de récupérer le résumé financier. Veuillez réessayer.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, summary: false }));
    }
  }, []);

  // Fonction pour récupérer les statistiques par type de transaction
  const fetchTransactionStatsByType = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, transactionStats: true }));
      setError((prev) => ({ ...prev, transactionStats: null }));

      const params = {
        ...statsFilters,
      };

      const response = await axios.get("/api/user/finances/stats-by-type", {
        params,
      });

      if (!response.data || !response.data.success) {
        throw new Error(
          response.data?.message ||
            "Erreur lors de la récupération des statistiques"
        );
      }

      const statsData = response.data.data;
      setTransactionStats(statsData.stats || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques:", err);
      setError((prev) => ({
        ...prev,
        transactionStats:
          err.message ||
          "Impossible de récupérer les statistiques. Veuillez réessayer.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, transactionStats: false }));
    }
  }, [statsFilters]);

  // Gestionnaire de changement de filtre pour les statistiques
  const handleStatsFilterChange = useCallback((name, value) => {
    setStatsFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Réinitialiser les filtres de statistiques
  const resetStatsFilters = useCallback(() => {
    setStatsFilters({
      date_from: "",
      date_to: "",
    });
  }, []);

  // Fonction pour ouvrir la fenêtre modale avec la transaction sélectionnée
  const handleOpenModal = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  }, []);

  // Fonction pour fermer la fenêtre modale
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    fetchSummary();
    fetchTransactionStatsByType();
  }, [fetchSummary, fetchTransactionStatsByType]);

  // Effet pour charger les statistiques lorsque les filtres changent
  useEffect(() => {
    if (activeTab === 2) {
      fetchTransactionStatsByType();
    }
  }, [activeTab, statsFilters, fetchTransactionStatsByType]);

  // Données pour le graphique des transactions
  const transactionChartData = useMemo(() => {
    if (!summary || !summary.stats_by_type) return [];

    // Regrouper les données par mois si disponible, sinon utiliser les stats par type
    if (summary.transaction_stats) {
      return summary.transaction_stats.map((stat) => ({
        name: stat.month,
        entrées: stat.total_in,
        sorties: stat.total_out,
      }));
    }

    // Fallback sur les statistiques par type
    return summary.stats_by_type.map((stat) => ({
      name: stat.type,
      montant: parseFloat(stat.total_amount || 0),
    }));
  }, [summary]);

  // Données pour le graphique des statistiques par type
  const transactionStatsByTypeChartData = useMemo(() => {
    if (!transactionStats || transactionStats.length === 0) return [];

    return transactionStats
      .filter((stat) => {
        // Si CDF n'est pas disponible et que la statistique est en CDF, l'ignorer
        return canUseCDF() || stat.currency !== "CDF";
      })
      .map((stat) => {
        const typeName =
          stat.type === "purchase"
            ? "Achat"
            : stat.type === "transfer"
            ? "Transfert"
            : stat.type === "withdrawal"
            ? "Retrait"
            : stat.type === "reception"
            ? "Réception"
            : stat.type === "commission de parrainage"
            ? "Com. Parrainage"
            : stat.type === "commission de retrait"
            ? "Com. Retrait"
            : stat.type === "commission de transfert"
            ? "Com. Transfert"
            : stat.type === "virtual_purchase"
            ? "Virtuels"
            : stat.type === "digital_product_sale"
            ? "Vente"
            : stat.type;

        return {
          name: `${typeName} (${stat.currency || ""})`,
          montant: parseFloat(stat.total_amount || 0),
          count: parseInt(stat.count || 0),
          currency: stat.currency || "",
        };
      });
  }, [transactionStats, canUseCDF]);

  // Composant pour afficher les détails d'une transaction dans une fenêtre modale
  const TransactionDetailsModal = () => {
    // Si aucune transaction n'est sélectionnée, ne rien afficher
    if (!selectedTransaction) return null;

    // Fonction pour formater les métadonnées complètes
    const formatFullMetadata = (metadata) => {
      if (!metadata) return "Aucune métadonnée disponible";
      try {
        // Si les métadonnées sont une chaîne JSON, les convertir en objet
        const metaObj =
          typeof metadata === "string" ? JSON.parse(metadata) : metadata;

        // Fonction pour rendre un objet imbriqué
        const renderNestedObject = (obj, indent = 0) => {
          return Object.entries(obj).map(([nestedKey, nestedValue]) => (
            <Box
              key={`${nestedKey}-${indent}`}
              sx={{ display: "flex", mb: 1, ml: indent * 2 }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, minWidth: 150 - indent * 10 }}
              >
                {nestedKey}:
              </Typography>
              <Typography variant="body2">
                {typeof nestedValue === "object" && nestedValue !== null
                  ? ""
                  : typeof nestedValue === "boolean"
                  ? nestedValue.toString()
                  : nestedValue || "-"}
              </Typography>
            </Box>
          ));
        };

        // Filtrer les métadonnées pour exclure la clé "status"
        const filteredEntries = Object.entries(metaObj).filter(
          ([key]) => key !== "status"
        );

        return (
          <Box sx={{ mt: 2 }}>
            {filteredEntries.map(([key, value]) => {
              // Traitement spécial pour payment_details
              if (
                key === "payment_details" ||
                ("Détails de paiement" &&
                  typeof value === "object" &&
                  value !== null)
              ) {
                return (
                  <Box key={key}>
                    <Box sx={{ display: "flex", mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, minWidth: 150 }}
                      >
                        {key}:
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        ml: 2,
                        mt: 1,
                        mb: 2,
                        p: 2,
                        bgcolor: isDarkMode
                          ? "rgba(0, 0, 0, 0.1)"
                          : "rgba(0, 0, 0, 0.03)",
                        borderRadius: 1,
                      }}
                    >
                      {renderNestedObject(value, 1)}
                    </Box>
                  </Box>
                );
              }

              // Traitement normal pour les autres clés
              return (
                <Box key={key} sx={{ display: "flex", mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, minWidth: 150 }}
                  >
                    {key}:
                  </Typography>
                  <Typography variant="body2">
                    {typeof value === "object" && value !== null
                      ? JSON.stringify(value)
                      : typeof value === "boolean"
                      ? value.toString()
                      : value || "-"}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      } catch (error) {
        console.error(
          "Erreur lors du traitement des métadonnées complètes:",
          error
        );
        return "Erreur lors du traitement des métadonnées";
      }
    };

    return (
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "background.paper",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
        sx={{
          backdropFilter: "blur(8px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" component="div">
              Détails de la transaction #{selectedTransaction.id}
            </Typography>
            <Chip
              size="small"
              label={selectedTransaction.type}
              color={
                selectedTransaction.type === "deposit"
                  ? "success"
                  : selectedTransaction.type === "withdrawal"
                  ? "error"
                  : "primary"
              }
              sx={{ ml: 2, fontWeight: 500 }}
            />
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseModal}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Informations générales
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, minWidth: 150 }}
                    >
                      Montant:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          selectedTransaction.type === "deposit"
                            ? "success.main"
                            : selectedTransaction.type === "withdrawal"
                            ? "error.main"
                            : "text.primary",
                        fontWeight: 500,
                      }}
                    >
                      {selectedTransaction.type === "deposit"
                        ? `+${formatAmount(selectedTransaction.amount)}`
                        : selectedTransaction.type === "withdrawal"
                        ? `-${formatAmount(selectedTransaction.amount)}`
                        : formatAmount(selectedTransaction.amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, minWidth: 150 }}
                    >
                      Statut:
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedTransaction.status}
                      color={
                        selectedTransaction.status === "approved"
                          ? "success"
                          : selectedTransaction.status === "pending"
                          ? "warning"
                          : "error"
                      }
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, minWidth: 150 }}
                    >
                      Date:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedTransaction.created_at)}
                    </Typography>
                  </Box>
                  {selectedTransaction.description && (
                    <Box sx={{ display: "flex", mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, minWidth: 150 }}
                      >
                        Description:
                      </Typography>
                      <Typography variant="body2">
                        {selectedTransaction.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Métadonnées
                </Typography>
                {formatFullMetadata(selectedTransaction.metadata)}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Composant pour afficher le graphique des transactions
  const TransactionsChart = () => {
    // Préparation des données pour le graphique des transactions
    const transactionChartData = useMemo(() => {
      if (
        !transactionStats ||
        !Array.isArray(transactionStats) ||
        transactionStats.length === 0
      ) {
        return [];
      }

      const groupedByType = transactionStats.reduce((acc, stat) => {
        // Si CDF n'est pas disponible et que la statistique est en CDF, l'ignorer
        if (!canUseCDF() && stat.currency === "CDF") {
          return acc;
        }

        // Simplifier les noms pour l'affichage
        let displayName;
        switch (stat.type) {
          case "commission de parrainage":
            displayName = "Parrainage";
            break;
          case "commission de retrait":
          case "commission de transfert":
            displayName = "Commission";
            break;
          case "withdrawal":
            displayName = "Retrait";
            break;
          case "transfer":
            displayName = "Transfert";
            break;
          case "purchase":
            displayName = "Achat";
            break;
          case "reception":
            displayName = "Réception";
            break;
          case "virtual_purchase":
            displayName = "Virtuels";
            break;
          default:
            displayName = stat.type;
        }

        // Ajouter la devise au nom pour la distinction
        const nameWithCurrency = `${displayName} (${stat.currency || ""})`;

        // Déterminer si c'est une dépense (rouge) ou un revenu (vert)
        const isExpense = ["withdrawal", "transfer", "purchase"].includes(
          stat.type
        );

        if (!acc[nameWithCurrency]) {
          acc[nameWithCurrency] = {
            name: nameWithCurrency,
            montant: 0,
            count: 0,
            isExpense: isExpense,
            currency: stat.currency || "",
          };
        }

        acc[nameWithCurrency].montant += parseFloat(stat.total_amount) || 0;
        acc[nameWithCurrency].count += parseInt(stat.count) || 0;
        return acc;
      }, {});

      return Object.values(groupedByType);
    }, [transactionStats, canUseCDF]);

    return (
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: isDarkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(249, 250, 251, 0.8)",
          boxShadow: "none",
          border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: isDarkMode
              ? "0 8px 20px rgba(0, 0, 0, 0.3)"
              : "0 8px 20px rgba(0, 0, 0, 0.1)",
          },
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
            sx={{ display: "flex", alignItems: "center" }}
          >
            <HistoryIcon sx={{ mr: 1, color: "primary.main" }} />
            Évolution des transactions
          </Typography>
          <Tooltip title="Ces données représentent la répartition des transactions par type">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 300, width: "100%" }}>
          {loading.transactionStats ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={40} />
            </Box>
          ) : transactionChartData.length === 0 ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Aucune donnée disponible
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => fetchTransactionStats()}
              >
                Actualiser
              </Button>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={transactionChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
                  axisLine={{ stroke: isDarkMode ? "#4b5563" : "#9ca3af" }}
                />
                <YAxis
                  tick={{ fill: isDarkMode ? "#e5e7eb" : "#374151" }}
                  axisLine={{ stroke: isDarkMode ? "#4b5563" : "#9ca3af" }}
                />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = data.isExpense
                        ? theme.palette.error.main
                        : theme.palette.success.main;

                      return (
                        <div
                          style={{
                            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                            border: `1px solid ${
                              isDarkMode ? "#374151" : "#e5e7eb"
                            }`,
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            padding: "8px 12px",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 5px 0",
                              color: isDarkMode ? "#e5e7eb" : "#374151",
                            }}
                          >
                            <strong>Type:</strong> {label}
                          </p>
                          <p
                            style={{
                              margin: "0 0 5px 0",
                              color: isDarkMode ? "#e5e7eb" : "#374151",
                            }}
                          >
                            <strong>Devise:</strong> {data.currency || "N/A"}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: color,
                              fontWeight: "bold",
                            }}
                          >
                            <strong>Montant:</strong>{" "}
                            {formatAmount(data.montant, data.currency || "USD")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  content={() => (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginRight: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: theme.palette.success.main,
                            marginRight: 5,
                          }}
                        ></div>
                        <span
                          style={{
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                            fontSize: 12,
                          }}
                        >
                          Revenus
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: theme.palette.error.main,
                            marginRight: 5,
                          }}
                        ></div>
                        <span
                          style={{
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                            fontSize: 12,
                          }}
                        >
                          Dépenses
                        </span>
                      </div>
                    </div>
                  )}
                />
                <Bar
                  dataKey="montant"
                  name="montant"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                >
                  {transactionChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isExpense
                          ? theme.palette.error.main
                          : theme.palette.success.main
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Typography variant="caption" color="text.secondary" align="center">
            Les montants sont affichés par devise (USD
            {canUseCDF() ? " et CDF" : ""}) selon le filtre sélectionné
          </Typography>
        </Box>
      </Paper>
    );
  };

  // Composant pour afficher les filtres des transactions
  const TransactionFilters = () => (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        bgcolor: isDarkMode
          ? "rgba(31, 41, 55, 0.5)"
          : "rgba(249, 250, 251, 0.8)",
        boxShadow: "none",
        border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: isDarkMode
            ? "0 8px 20px rgba(0, 0, 0, 0.3)"
            : "0 8px 20px rgba(0, 0, 0, 0.1)",
        },
      }}
      elevation={0}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <FilterListIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Filtres
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
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              label="Type"
              sx={{
                bgcolor: isDarkMode ? "#1f2937" : "inherit",
                color: isDarkMode ? "#fff" : "inherit",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode ? "#374151" : "rgba(0, 0, 0, 0.23)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode ? "#4b5563" : "rgba(0, 0, 0, 0.23)",
                },
                "& .MuiSvgIcon-root": {
                  color: isDarkMode ? "#9ca3af" : "inherit",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    color: isDarkMode ? "#fff" : "inherit",
                    "& .MuiMenuItem-root:hover": {
                      bgcolor: isDarkMode ? "#374151" : "rgba(0, 0, 0, 0.04)",
                    },
                    "& .MuiMenuItem-root.Mui-selected": {
                      bgcolor: isDarkMode
                        ? "#374151"
                        : "rgba(25, 118, 210, 0.08)",
                    },
                  },
                },
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              {transactionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === "withdrawal"
                    ? "Retrait des fonds"
                    : type === "reception"
                    ? "Réception"
                    : type === "transfer"
                    ? "Transfert des fonds"
                    : type === "purchase"
                    ? "Achat"
                    : type === "commission de parrainage"
                    ? "Commission de parrainage"
                    : type === "commission de retrait"
                    ? "Commission de retrait"
                    : type === "commission de transfert"
                    ? "Commission de transfert"
                    : type === "virtual_purchase"
                    ? "Virtuels"
                    : type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Statut</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              label="Statut"
              sx={{
                bgcolor: isDarkMode ? "#1f2937" : "inherit",
                color: isDarkMode ? "#fff" : "inherit",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode ? "#374151" : "rgba(0, 0, 0, 0.23)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode ? "#4b5563" : "rgba(0, 0, 0, 0.23)",
                },
                "& .MuiSvgIcon-root": {
                  color: isDarkMode ? "#9ca3af" : "inherit",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    color: isDarkMode ? "#fff" : "inherit",
                    "& .MuiMenuItem-root:hover": {
                      bgcolor: isDarkMode ? "#374151" : "rgba(0, 0, 0, 0.04)",
                    },
                    "& .MuiMenuItem-root.Mui-selected": {
                      bgcolor: isDarkMode
                        ? "#374151"
                        : "rgba(25, 118, 210, 0.08)",
                    },
                  },
                },
              }}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="completed">Complété</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="cancelled">Annulé</MenuItem>
              <MenuItem value="failed">Echoué</MenuItem>
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
      </Grid>
    </Paper>
  );

  // Composant pour afficher le résumé financier
  const FinanceSummary = () => {
    if (!summary) return null;

    return (
      <Box sx={{ mb: 4 }}>
        {/* En-tête avec bouton de rafraîchissement */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Résumé financier
          </Typography>
          <IconButton
            onClick={() => {
              fetchSummary();
              fetchTransactionStatsByType();
            }}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: "rotate(180deg)",
              },
              transition: "all 0.3s ease",
            }}
            disabled={loading.summary || loading.transactionStats}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
              <CardContent sx={{ position: "relative", p: 3 }}>
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
                    sx={{ fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    Solde du portefeuille
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "primary.main",
                      color: "white",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                    }}
                  >
                    <AccountBalanceIcon sx={{ fontSize: "1.2rem" }} />
                  </Box>
                </Box>

                {/* Solde USD */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? "#60a5fa" : "#2563eb",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  >
                    Dollars Américains (USD)
                  </Typography>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: isDarkMode ? "#60a5fa" : "#2563eb",
                      mb: 1,
                    }}
                  >
                    {formatAmount(walletBalance.balance_usd)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, fontSize: "0.85rem" }}>
                    <Typography
                      variant="body2"
                      color="success.main"
                      fontWeight={500}
                    >
                      +{formatAmount(walletBalance.totalEarned_usd)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="error.main"
                      fontWeight={500}
                    >
                      -{formatAmount(walletBalance.totalWithdrawn_usd)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Solde CDF */}
                {canUseCDF() && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDarkMode ? "#34d399" : "#059669",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    >
                      Francs Congolais (CDF)
                    </Typography>
                    <Typography
                      variant="h5"
                      component="div"
                      sx={{
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: isDarkMode ? "#34d399" : "#059669",
                        mb: 1,
                      }}
                    >
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "CDF",
                      }).format(walletBalance.balance_cdf)}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, fontSize: "0.85rem" }}>
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight={500}
                      >
                        +
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "CDF",
                        }).format(walletBalance.totalEarned_cdf)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="error.main"
                        fontWeight={500}
                      >
                        -
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "CDF",
                        }).format(walletBalance.totalWithdrawn_cdf)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                bgcolor: isDarkMode
                  ? "rgba(244, 67, 54, 0.1)"
                  : "rgba(244, 67, 54, 0.05)",
                boxShadow: "none",
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(244, 67, 54, 0.2)"
                    : "rgba(244, 67, 54, 0.1)"
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
              <CardContent sx={{ position: "relative", p: 3 }}>
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
                    Retraits en attente
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
                    <PaidIcon sx={{ fontSize: "1.2rem" }} />
                  </Box>
                </Box>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: isDarkMode ? "#fff" : "text.primary",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "60px",
                  }}
                >
                  {summary && summary.pending_withdrawals !== undefined
                    ? summary.pending_withdrawals
                    : 0}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 1 }}
                  >
                    Demandes de retrait en attente de validation
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Rendu du composant principal
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Fenêtre modale pour les détails de transaction */}
      <TransactionDetailsModal />

      {/* Affichage des erreurs */}
      {error.summary && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.summary}
        </Alert>
      )}

      {/* Résumé financier */}
      {loading.summary ? (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {[1, 2].map((item) => (
              <Grid item xs={12} md={6} key={item}>
                <Skeleton
                  variant="rectangular"
                  height={180}
                  sx={{ borderRadius: 3 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <FinanceSummary />
      )}

      {/* Onglets */}
      <Box
        sx={{ position: "relative", mb: 3, minHeight: 48, overflow: "visible" }}
      >
        {/* Bouton de navigation gauche */}
        <IconButton
          onClick={handleScrollLeft}
          size="small"
          sx={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: isDarkMode
              ? "rgba(31, 41, 55, 0.5)"
              : "rgba(255, 255, 255, 0.7)",
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(0, 0, 0, 0.5)",
            boxShadow: 1,
            width: 32,
            height: 32,
            transition: "all 0.2s ease",
            opacity: 0.7,
            "&:hover": {
              bgcolor: isDarkMode
                ? "rgba(31, 41, 55, 0.7)"
                : "rgba(255, 255, 255, 0.9)",
              opacity: 0.9,
              transform: "translateY(-50%)",
            },
            display: "flex",
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Bouton de navigation droite */}
        <IconButton
          onClick={handleScrollRight}
          size="small"
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: isDarkMode
              ? "rgba(31, 41, 55, 0.5)"
              : "rgba(255, 255, 255, 0.7)",
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(0, 0, 0, 0.5)",
            boxShadow: 1,
            width: 32,
            height: 32,
            transition: "all 0.2s ease",
            opacity: 0.7,
            "&:hover": {
              bgcolor: isDarkMode
                ? "rgba(31, 41, 55, 0.7)"
                : "rgba(255, 255, 255, 0.9)",
              opacity: 0.9,
              transform: "translateY(-50%)",
            },
            display: "flex",
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        <Paper
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: isDarkMode ? "#1f2937" : "rgba(249, 250, 251, 0.8)",
            position: "relative",
            zIndex: 1,
          }}
          elevation={0}
        >
          <Tabs
            ref={tabsRef}
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons={false} // Désactivation des boutons de défilement natifs car nous avons nos propres boutons
            sx={{
              "& .MuiTabs-indicator": {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              },
              "& .MuiTabs-flexContainer": {
                justifyContent: isSmallScreen ? "flex-start" : "center",
              },
              "& .MuiTabs-scroller": {
                scrollbarWidth: "none", // Masquer la barre de défilement sur Firefox
                "&::-webkit-scrollbar": {
                  display: "none", // Masquer la barre de défilement sur Chrome/Safari
                },
              },
            }}
          >
            <Tab
              label="Portefeuille"
              icon={<WalletIcon />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: "none" }}
            />
            <Tab
              label="Statistiques"
              icon={<InfoIcon />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: "none" }}
            />
            <Tab
              label="Jetons Esengo"
              icon={<TokenIcon />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: "none" }}
            />
            <Tab
              label="Demandes de retrait"
              icon={<MoneyOffIcon />}
              iconPosition="start"
              sx={{ fontWeight: 600, textTransform: "none" }}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Contenu des onglets */}
      <Box sx={{ mt: 3 }}>
        {/* Onglet Portefeuille */}
        {activeTab === 0 && <Wallets />}

        {/* Onglet Statistiques */}
        {activeTab === 1 && (
          <>
            {/* Bouton toggle filtres */}
            <Box
              sx={{
                mb: { xs: 2, sm: 3 },
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                startIcon={!isMobile && <FilterListIcon />}
                onClick={() => setShowStatsFilters(!showStatsFilters)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: showStatsFilters
                    ? "primary.main"
                    : "rgba(102, 126, 234, 0.3)",
                  background: showStatsFilters
                    ? "rgba(102, 126, 234, 0.1)"
                    : "transparent",
                  "&:hover": {
                    borderColor: "primary.main",
                    background: "rgba(102, 126, 234, 0.15)",
                  },
                }}
              >
                {isMobile ? (
                  <FilterListIcon fontSize="small" />
                ) : showStatsFilters ? (
                  "Masquer les filtres"
                ) : (
                  "Afficher les filtres"
                )}
              </Button>
            </Box>

            {/* Filtres pour les statistiques */}
            <Collapse in={showStatsFilters} timeout={400}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: { xs: 2, sm: 3 },
                  bgcolor: isDarkMode
                    ? "#1a2538"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                  borderRadius: 3,
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${
                    isDarkMode
                      ? "rgba(75, 85, 99, 0.3)"
                      : "rgba(229, 231, 235, 0.3)"
                  }`,
                  boxShadow: isDarkMode
                    ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                    : "0 8px 32px rgba(0, 0, 0, 0.1)",
                }}
                elevation={0}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: { xs: 2, sm: 3 },
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      mr: { xs: 1, sm: 2 },
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                    }}
                  >
                    <FilterListIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                      {isMobile ? "Filtres" : "Filtres des statistiques"}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={!isMobile && <RefreshIcon />}
                    onClick={resetStatsFilters}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "rgba(102, 126, 234, 0.3)",
                      "&:hover": {
                        borderColor: "primary.main",
                        background: "rgba(102, 126, 234, 0.05)",
                      },
                    }}
                  >
                    {isMobile ? (
                      <RefreshIcon fontSize="small" />
                    ) : (
                      "Réinitialiser"
                    )}
                  </Button>
                </Box>

                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Date de début"
                      type="date"
                      size="small"
                      value={statsFilters.date_from || ""}
                      onChange={(e) =>
                        handleStatsFilterChange("date_from", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Date de fin"
                      type="date"
                      size="small"
                      value={statsFilters.date_to || ""}
                      onChange={(e) =>
                        handleStatsFilterChange("date_to", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Devise</InputLabel>
                      <Select
                        value={statsFilters.currency || ""}
                        onChange={(e) =>
                          handleStatsFilterChange("currency", e.target.value)
                        }
                        label="Devise"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
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
                  <Grid item xs={12} sm={12} md={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={fetchTransactionStatsByType}
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
                        },
                      }}
                      startIcon={<RefreshIcon />}
                    >
                      Appliquer
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

            {/* Tableau et graphiques des statistiques par type de transaction */}
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                mb: { xs: 2, sm: 3 },
                borderRadius: 3,
                bgcolor: isDarkMode
                  ? "#1a2538"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(75, 85, 99, 0.3)"
                    : "rgba(229, 231, 235, 0.3)"
                }`,
                boxShadow: isDarkMode
                  ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                  : "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
              elevation={0}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: { xs: 2, sm: 3 },
                  gap: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "secondary.main",
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                  }}
                >
                  <BarChartIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                </Avatar>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  fontWeight={700}
                  sx={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {isMobile
                    ? "Statistiques"
                    : "Statistiques par type de transaction"}
                </Typography>
              </Box>

              {error.transactionStats && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error.transactionStats}
                </Alert>
              )}

              {/* Graphiques des statistiques */}
              {!loading.transactionStats &&
                Array.isArray(transactionStats) &&
                transactionStats.length > 0 && (
                  <Grid
                    container
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ mb: { xs: 2, sm: 3 } }}
                  >
                    {/* Graphique des montants par type */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: { xs: 2, sm: 3 },
                          height: { xs: 250, sm: 300 },
                          borderRadius: 3,
                          bgcolor: isDarkMode
                            ? "rgba(31, 41, 55, 0.5)"
                            : "rgba(249, 250, 251, 0.5)",
                          border: `1px solid ${
                            isDarkMode
                              ? "rgba(75, 85, 99, 0.3)"
                              : "rgba(229, 231, 235, 0.3)"
                          }`,
                        }}
                        elevation={0}
                      >
                        <Typography
                          variant={isMobile ? "subtitle2" : "subtitle1"}
                          sx={{ mb: 1, fontWeight: 600 }}
                        >
                          Montants par type
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart
                            data={transactionStatsByTypeChartData}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 20,
                              bottom: 40,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.2}
                            />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={70}
                              interval={0}
                              tick={{
                                fill: isDarkMode ? "#e5e7eb" : "#374151",
                              }}
                              axisLine={{
                                stroke: isDarkMode ? "#4b5563" : "#9ca3af",
                              }}
                            />
                            <YAxis
                              tick={{
                                fill: isDarkMode ? "#e5e7eb" : "#374151",
                              }}
                              axisLine={{
                                stroke: isDarkMode ? "#4b5563" : "#9ca3af",
                              }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: isDarkMode
                                  ? "#1f2937"
                                  : "#fff",
                                border: `1px solid ${
                                  isDarkMode ? "#374151" : "#e5e7eb"
                                }`,
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                              formatter={(value, name, props) => [
                                formatAmount(
                                  value,
                                  props.payload?.currency || "USD"
                                ),
                                "Montant",
                              ]}
                              labelFormatter={(label) => `Type: ${label}`}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: 10 }}
                              formatter={(value) => (
                                <span
                                  style={{
                                    color: isDarkMode ? "#e5e7eb" : "#374151",
                                  }}
                                >
                                  {value}
                                </span>
                              )}
                            />
                            <Bar
                              dataKey="montant"
                              name="Montant"
                              fill={theme.palette.primary.main}
                              radius={[4, 4, 0, 0]}
                              animationDuration={1500}
                              animationEasing="ease-in-out"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>

                    {/* Graphique du nombre par type */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        sx={{
                          p: { xs: 2, sm: 3 },
                          height: { xs: 250, sm: 300 },
                          borderRadius: 3,
                          bgcolor: isDarkMode
                            ? "rgba(31, 41, 55, 0.5)"
                            : "rgba(249, 250, 251, 0.5)",
                          border: `1px solid ${
                            isDarkMode
                              ? "rgba(75, 85, 99, 0.3)"
                              : "rgba(229, 231, 235, 0.3)"
                          }`,
                        }}
                        elevation={0}
                      >
                        <Typography
                          variant={isMobile ? "subtitle2" : "subtitle1"}
                          sx={{ mb: 1, fontWeight: 600 }}
                        >
                          Nombre par type
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                          <BarChart
                            data={transactionStatsByTypeChartData}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 20,
                              bottom: 40,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.2}
                            />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={70}
                              interval={0}
                              tick={{
                                fill: isDarkMode ? "#e5e7eb" : "#374151",
                              }}
                              axisLine={{
                                stroke: isDarkMode ? "#4b5563" : "#9ca3af",
                              }}
                            />
                            <YAxis
                              tick={{
                                fill: isDarkMode ? "#e5e7eb" : "#374151",
                              }}
                              axisLine={{
                                stroke: isDarkMode ? "#4b5563" : "#9ca3af",
                              }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: isDarkMode
                                  ? "#1f2937"
                                  : "#fff",
                                border: `1px solid ${
                                  isDarkMode ? "#374151" : "#e5e7eb"
                                }`,
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                              formatter={(value) => [
                                `${value} transaction(s)`,
                                "Nombre",
                              ]}
                              labelFormatter={(label) => `Type: ${label}`}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: 10 }}
                              formatter={(value) => (
                                <span
                                  style={{
                                    color: isDarkMode ? "#e5e7eb" : "#374151",
                                  }}
                                >
                                  {value}
                                </span>
                              )}
                            />
                            <Bar
                              dataKey="count"
                              name="Nombre"
                              fill={theme.palette.secondary.main}
                              radius={[4, 4, 0, 0]}
                              animationDuration={1500}
                              animationEasing="ease-in-out"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

              {/* Indicateur de scroll pour mobile */}
              {isMobile && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    py: 1,
                    px: 2,
                    mb: 1,
                    background: isDarkMode
                      ? "rgba(55, 65, 81, 0.5)"
                      : "rgba(249, 250, 251, 0.8)",
                    borderRadius: 2,
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

              {/* Tableau des statistiques */}
              <TableContainer
                component={Paper}
                sx={{
                  mb: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  bgcolor: isDarkMode
                    ? "rgba(31, 41, 55, 0.5)"
                    : "background.paper",
                  border: `1px solid ${
                    isDarkMode
                      ? "rgba(75, 85, 99, 0.3)"
                      : "rgba(229, 231, 235, 0.3)"
                  }`,
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
                      ? "rgba(107, 114, 128, 0.5)"
                      : "rgba(156, 163, 175, 0.5)",
                    borderRadius: 10,
                    border: "2px solid transparent",
                    "&:hover": {
                      background: isDarkMode
                        ? "rgba(107, 114, 128, 0.7)"
                        : "rgba(107, 114, 128, 0.7)",
                    },
                  },
                }}
              >
                <Table size="small" sx={{ minWidth: { xs: 700, md: "auto" } }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDarkMode
                          ? "rgba(31, 41, 55, 0.8)"
                          : "rgba(249, 250, 251, 0.8)",
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Type de transaction
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Devise
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Nombre
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Montant total
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Première transaction
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 3 },
                          py: { xs: 2, sm: 2.5 },
                        }}
                      >
                        Dernière transaction
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading.transactionStats ? (
                      Array.from(new Array(5)).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={6}>
                            <Skeleton animation="wave" height={30} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !Array.isArray(transactionStats) ||
                      transactionStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Aucune statistique disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactionStats
                        .filter((stat) => {
                          // Si CDF n'est pas disponible et que la statistique est en CDF, l'ignorer
                          return canUseCDF() || stat.currency !== "CDF";
                        })
                        .map((stat, index) => (
                          <TableRow key={index} hover>
                            <TableCell
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              <Chip
                                size="small"
                                label={
                                  stat.type === "reception"
                                    ? "Réception"
                                    : stat.type === "withdrawal"
                                    ? "Retrait des fonds"
                                    : stat.type === "transfer"
                                    ? "Transfert des fonds"
                                    : stat.type === "purchase"
                                    ? "Achat"
                                    : stat.type === "commission de parrainage"
                                    ? "Commission de parrainage"
                                    : stat.type === "commission de retrait"
                                    ? "Commission de retrait"
                                    : stat.type === "commission de transfert"
                                    ? "Commission de transfert"
                                    : stat.type === "virtual_purchase"
                                    ? "Virtuels"
                                    : stat.type === "digital_product_sale"
                                    ? "Vente"
                                    : stat.type
                                }
                                color={
                                  stat.type === "reception" ||
                                  stat.type === "commission de parrainage" ||
                                  stat.type === "commission de retrait" ||
                                  stat.type === "commission de transfert" ||
                                  stat.type === "virtual_purchase" ||
                                  stat.type === "digital_product_sale"
                                    ? "success"
                                    : stat.type === "withdrawal" ||
                                      stat.type === "transfer" ||
                                      stat.type === "purchase"
                                    ? "error"
                                    : "primary"
                                }
                                sx={{
                                  fontWeight: 500,
                                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  height: { xs: 24, sm: 28 },
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              <Chip
                                size="small"
                                label={stat.currency || ""}
                                color={
                                  stat.currency === "USD"
                                    ? "primary"
                                    : "secondary"
                                }
                                sx={{
                                  fontWeight: 600,
                                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                  height: { xs: 24, sm: 28 },
                                }}
                              />
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              {stat.count}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                color:
                                  stat.type === "reception" ||
                                  stat.type === "commission de parrainage" ||
                                  stat.type === "commission de retrait" ||
                                  stat.type === "commission de transfert" ||
                                  stat.type === "virtual_purchase"
                                    ? "success.main"
                                    : stat.type === "withdrawal" ||
                                      stat.type === "transfer" ||
                                      stat.type === "purchase"
                                    ? "error.main"
                                    : "text.primary",
                                fontWeight: 500,
                              }}
                            >
                              {formatAmount(
                                stat.total_amount,
                                stat.currency || "USD"
                              )}
                            </TableCell>
                            <TableCell
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              {formatDate(stat.first_transaction)}
                            </TableCell>
                            <TableCell
                              sx={{
                                px: { xs: 2, sm: 3 },
                                py: { xs: 2, sm: 3 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              {formatDate(stat.last_transaction)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} md={12}>
                <TransactionsChart />
              </Grid>
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    bgcolor: isDarkMode
                      ? "#1a2538"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.9) 100%)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${
                      isDarkMode
                        ? "rgba(75, 85, 99, 0.3)"
                        : "rgba(229, 231, 235, 0.3)"
                    }`,
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                      : "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                  elevation={0}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: { xs: 2, sm: 3 },
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "info.main",
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                      }}
                    >
                      <InfoIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Typography
                      variant={isMobile ? "subtitle1" : "h6"}
                      fontWeight={700}
                      sx={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Informations supplémentaires
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                  >
                    Cette section présente un aperçu visuel de vos finances. Les
                    graphiques montrent l'évolution de vos transactions
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                  >
                    Les données sont mises à jour en temps réel et reflètent
                    l'état actuel de votre compte.
                  </Typography>

                  {summary && summary.next_payout && (
                    <Box
                      sx={{
                        mt: { xs: 2, sm: 3 },
                        p: { xs: 2, sm: 3 },
                        bgcolor: isDarkMode
                          ? "rgba(31, 41, 55, 0.5)"
                          : "rgba(249, 250, 251, 0.5)",
                        borderRadius: 2,
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(75, 85, 99, 0.3)"
                            : "rgba(229, 231, 235, 0.3)"
                        }`,
                      }}
                    >
                      <Typography
                        variant={isMobile ? "subtitle2" : "subtitle1"}
                        color="primary"
                        gutterBottom
                        fontWeight={600}
                      >
                        Prochain paiement prévu
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                      >
                        Date: {formatDate(summary.next_payout.date)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                      >
                        Montant estimé:{" "}
                        {formatAmount(summary.next_payout.amount, "USD")}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}

        {/* Onglet Jetons Esengo */}
        {activeTab === 2 && <JetonsEsengo />}

        {/* Onglet Demandes de retrait */}
        {activeTab === 3 && <WithdrawalRequests />}
      </Box>
    </Container>
  );
};

export default Finances;
