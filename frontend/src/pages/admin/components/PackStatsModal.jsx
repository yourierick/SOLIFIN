import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "../../../utils/axios";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Collapse,
  Pagination,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TimelineIcon from "@mui/icons-material/Timeline";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StarIcon from "@mui/icons-material/Star";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ShowChartIcon from "@mui/icons-material/ShowChart";

// Enregistrer les composants Chart.js nécessaires
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

const PackStatsModal = ({ open, onClose, packId, userId }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { isCDFEnabled, selectedCurrency, setSelectedCurrency } = useCurrency();

  // États du composant
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  // Styles optimisés
  const cardStyle = useMemo(
    () => ({
      height: "100%",
      borderRadius: "16px",
      boxShadow: isDarkMode
        ? "0 4px 20px rgba(0, 0, 0, 0.3)"
        : "0 4px 20px rgba(0, 0, 0, 0.08)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
      border: isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.05)",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: isDarkMode
          ? "0 8px 30px rgba(0, 0, 0, 0.4)"
          : "0 8px 30px rgba(0, 0, 0, 0.12)",
      },
    }),
    [isDarkMode]
  );

  const tableStyle = useMemo(
    () => ({
      borderRadius: "12px",
      overflow: "hidden",
      "& .MuiTableCell-head": {
        bgcolor: isDarkMode
          ? "rgba(31, 41, 55, 0.8)"
          : "rgba(249, 250, 251, 0.8)",
        fontWeight: 600,
        color: isDarkMode ? "#e5e7eb" : "#374151",
        borderBottom: `2px solid ${
          isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
        }`,
      },
      "& .MuiTableCell-body": {
        borderBottom: `1px solid ${
          isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
        }`,
        color: isDarkMode ? "#d1d5db" : "#374151",
      },
      "& .MuiTableRow:hover": {
        bgcolor: isDarkMode
          ? "rgba(59, 130, 246, 0.05)"
          : "rgba(59, 130, 246, 0.02)",
      },
    }),
    [isDarkMode]
  );

  // Configuration des graphiques optimisée
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: isDarkMode ? "#e5e7eb" : "#374151",
            font: {
              family: "'Inter', sans-serif",
              size: 12,
              weight: "600",
            },
            boxWidth: 16,
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode
            ? "rgba(17, 24, 39, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          titleColor: isDarkMode ? "#f3f4f6" : "#111827",
          bodyColor: isDarkMode ? "#d1d5db" : "#374151",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: "'Inter', sans-serif", size: 14, weight: "700" },
          bodyFont: { family: "'Inter', sans-serif", size: 12, weight: "500" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDarkMode ? "#9ca3af" : "#6b7280",
            font: { family: "'Inter', sans-serif" },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
            drawBorder: false,
          },
          ticks: {
            color: isDarkMode ? "#9ca3af" : "#6b7280",
            font: { family: "'Inter', sans-serif" },
          },
        },
      },
    }),
    [isDarkMode]
  );

  // Effet pour synchroniser la devise avec le CurrencyContext
  useEffect(() => {
    if (!isCDFEnabled && selectedCurrency !== "USD") {
      setSelectedCurrency("USD");
    }
  }, [isCDFEnabled, selectedCurrency, setSelectedCurrency]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        user_id: userId,
      };

      const response = await axios.get(
        `/api/admin/users/packs/${packId}/stats`,
        { params }
      );

      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        throw new Error(
          response.data?.message || "Erreur lors du chargement des données"
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Une erreur est survenue lors du chargement des statistiques";
      setError(errorMessage);
      console.error("Erreur fetchStats:", err);
    } finally {
      setLoading(false);
    }
  }, [packId, userId]);

  useEffect(() => {
    if (open && packId && userId) {
      fetchStats();
    }
  }, [open, packId, userId, fetchStats]);

  // Contrôler l'animation uniquement à l'ouverture du modal
  useEffect(() => {
    if (open) {
      setHasAnimated(false);
      // Déclencher l'animation après un court délai
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setHasAnimated(false);
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Formater les montants selon la devise
  const formatAmount = (amount, currency) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (currency === "CDF") {
      return new Intl.NumberFormat("fr-CD", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount);
    }
    return `$${numAmount.toFixed(2)}`;
  };

  // Composant pour les statistiques générales
  const GeneralStats = () => {
    if (!stats?.general_stats) return null;

    const { general_stats } = stats;

    // Calculer les statistiques dérivées
    const activationRate =
      general_stats.total_referrals > 0
        ? (
            (general_stats.active_referrals / general_stats.total_referrals) *
            100
          ).toFixed(1)
        : 0;

    const bestGenerationIndex = general_stats.referrals_by_generation.findIndex(
      (count, index) =>
        count === Math.max(...general_stats.referrals_by_generation)
    );

    const statsCards = [
      {
        title: "Total Réseau",
        value: general_stats.total_referrals,
        icon: <PeopleIcon />,
        color: "#3b82f6",
        subtitle: `${general_stats.active_referrals} actifs, ${general_stats.inactive_referrals} inactifs`,
      },
      {
        title: "Taux d'activation",
        value: `${activationRate}%`,
        icon: <TrendingUpIcon />,
        color: "#10b981",
        subtitle: "Performance du réseau",
      },
      {
        title: "Commission Totale",
        value: formatAmount(
          selectedCurrency === "USD"
            ? general_stats.total_commission_usd
            : general_stats.total_commission_cdf,
          selectedCurrency
        ),
        icon: <AttachMoneyIcon />,
        color: "#f59e0b",
        subtitle:
          selectedCurrency === "USD"
            ? "Dollars américains"
            : "Francs congolais",
      },
      {
        title: "Meilleure Génération",
        value: `G${bestGenerationIndex + 1}`,
        icon: <StarIcon />,
        color: "#8b5cf6",
        subtitle: `${general_stats.referrals_by_generation[bestGenerationIndex]} filleuls`,
      },
    ];

    return (
      <motion.div
        key={`overview-${packId}-${userId}`}
        variants={containerVariants}
        initial={hasAnimated ? "visible" : "hidden"}
        animate={hasAnimated ? "visible" : "hidden"}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
          Vue d'ensemble du réseau
        </Typography>

        <Grid container spacing={3}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={`stat-${index}-${packId}-${userId}`}>
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "12px",
                          bgcolor: `${stat.color}15`,
                          color: stat.color,
                          mr: 2,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        {stat.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Section des commissions par génération */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <motion.div 
              key={`generation-section-${packId}-${userId}`}
              variants={itemVariants}
              initial={hasAnimated ? "visible" : "hidden"}
              animate={hasAnimated ? "visible" : "hidden"}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 3 }}
                  >
                    Répartition des commissions par génération
                  </Typography>
                  <Grid container spacing={2}>
                    {general_stats.referrals_by_generation.map(
                      (count, index) => {
                        const commissionUSD =
                          general_stats.commissions_by_generation_usd[index];
                        const commissionCDF =
                          general_stats.commissions_by_generation_cdf[index];
                        const isActive = count > 0;
                        const generationColors = [
                          "#3b82f6",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                        ];
                        const color = generationColors[index];

                        return (
                          <Grid item xs={12} sm={6} md={3} key={`generation-${index}-${packId}-${userId}`}>
                            <Box
                              sx={{
                                p: 2.5,
                                borderRadius: "12px",
                                border: `2px solid ${
                                  isActive ? color : "transparent"
                                }`,
                                bgcolor: isActive
                                  ? `${color}08`
                                  : isDarkMode
                                  ? "rgba(255, 255, 255, 0.02)"
                                  : "rgba(0, 0, 0, 0.02)",
                                textAlign: "center",
                                transition: "all 0.3s ease",
                                "&:hover": isActive
                                  ? {
                                      bgcolor: `${color}12`,
                                      transform: "translateY(-2px)",
                                    }
                                  : {},
                              }}
                            >
                              <Typography
                                variant="h3"
                                sx={{
                                  fontWeight: 800,
                                  color: isActive ? color : "text.secondary",
                                  mb: 1,
                                }}
                              >
                                {count}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: isActive ? color : "text.secondary",
                                  mb: 1,
                                }}
                              >
                                Génération {index + 1}
                              </Typography>
                              {isActive && (
                                <>
                                  {selectedCurrency === "USD" && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      color="text.secondary"
                                      sx={{ mb: 0.5 }}
                                    >
                                      {formatAmount(commissionUSD, "USD")}
                                    </Typography>
                                  )}
                                  {selectedCurrency === "CDF" && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      color="text.secondary"
                                      sx={{ mb: 0.5 }}
                                    >
                                      {formatAmount(commissionCDF, "CDF")}
                                    </Typography>
                                  )}
                                  {isCDFEnabled && selectedCurrency === "" && (
                                    <>
                                      <Typography
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                        sx={{ mb: 0.5 }}
                                      >
                                        {formatAmount(commissionUSD, "USD")}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                      >
                                        {formatAmount(commissionCDF, "CDF")}
                                      </Typography>
                                    </>
                                  )}
                                </>
                              )}
                            </Box>
                          </Grid>
                        );
                      }
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // Composant pour la progression et les performances
  const ProgressionStats = () => {
    if (!stats?.progression) return null;

    const { progression } = stats;

    // Préparer les données pour les graphiques mensuels
    const monthlySignupsData = useMemo(
      () => ({
        labels: Object.keys(progression.monthly_signups || {}),
        datasets: [
          {
            label: "Nouveaux filleuls",
            data: Object.values(progression.monthly_signups || {}),
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "#3b82f6",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: isDarkMode ? "#1f2937" : "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }),
      [progression.monthly_signups, isDarkMode]
    );

    const monthlyCommissionsData = useMemo(
      () => ({
        labels: Object.keys(
          selectedCurrency === "USD"
            ? progression.monthly_commissions_usd || {}
            : progression.monthly_commissions_cdf || {}
        ),
        datasets: [
          {
            label:
              selectedCurrency === "USD"
                ? "Commissions ($)"
                : "Commissions (FC)",
            data: Object.values(
              selectedCurrency === "USD"
                ? progression.monthly_commissions_usd || {}
                : progression.monthly_commissions_cdf || {}
            ).map((val) => parseFloat(val) || 0),
            backgroundColor:
              selectedCurrency === "USD"
                ? "rgba(16, 185, 129, 0.5)"
                : "rgba(245, 158, 11, 0.5)",
            borderColor: selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
            borderWidth: 2,
            tension: 0.3,
            pointBackgroundColor:
              selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
            pointBorderColor: isDarkMode ? "#1f2937" : "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }),
      [
        progression.monthly_commissions_usd,
        progression.monthly_commissions_cdf,
        selectedCurrency,
        isDarkMode,
      ]
    );

    return (
      <motion.div
        key={`progression-${packId}-${userId}`}
        variants={containerVariants}
        initial={hasAnimated ? "visible" : "hidden"}
        animate={hasAnimated ? "visible" : "hidden"}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
          Progression et performances
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "#3b82f615",
                        color: "#3b82f6",
                        mr: 2,
                      }}
                    >
                      <TimelineIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Évolution des inscriptions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nouveaux filleuls par mois
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Line data={monthlySignupsData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor:
                          selectedCurrency === "USD"
                            ? "#10b98115"
                            : "#f59e0b15",
                        color:
                          selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
                        mr: 2,
                      }}
                    >
                      <ShowChartIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Évolution des commissions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tendance des gains en {selectedCurrency}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={monthlyCommissionsData}
                      options={chartOptions}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Top filleul */}
          {progression.top_referral && (
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Card sx={cardStyle}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "12px",
                          bgcolor: "#f59e0b15",
                          color: "#f59e0b",
                          mr: 2,
                        }}
                      >
                        <StarIcon />
                      </Box>
                      <Typography variant="h6" fontWeight={600}>
                        Meilleur filleul
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: "12px",
                        bgcolor: isDarkMode
                          ? "rgba(245, 158, 11, 0.05)"
                          : "rgba(245, 158, 11, 0.02)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(245, 158, 11, 0.05)"
                        }`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          {progression.top_referral.name}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          Génération {progression.top_referral.generation || 1}{" "}
                          • {progression.top_referral.recruit_count} recrutement
                          {progression.top_referral.recruit_count > 1
                            ? "s"
                            : ""}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            USD:{" "}
                            {formatAmount(
                              progression.top_referral.commission_usd,
                              "USD"
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            CDF:{" "}
                            {formatAmount(
                              progression.top_referral.commission_cdf,
                              "CDF"
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: "#f59e0b",
                          fontSize: "1.5rem",
                          fontWeight: 700,
                        }}
                      >
                        {progression.top_referral.name?.charAt(0) || "U"}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </motion.div>
    );
  };

  // Composant pour les activités des filleuls
  const ReferralActivities = () => {
    if (!stats?.latest_referrals) return null;

    // Utiliser directement les données (limitées à 10 par le backend)
    const referralsData = stats.latest_referrals;
    const filteredReferrals = referralsData.filter((referral) =>
      referral.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <motion.div
        key={`referrals-${packId}-${userId}`}
        variants={containerVariants}
        initial={hasAnimated ? "visible" : "hidden"}
        animate={hasAnimated ? "visible" : "hidden"}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Activités récentes
          </Typography>
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ minWidth: 250 }}
          />
        </Box>

        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent>
              <TableContainer>
                <Table sx={tableStyle}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Filleul</TableCell>
                      <TableCell>Pack</TableCell>
                      <TableCell>Génération</TableCell>
                      <TableCell>Date d'achat</TableCell>
                      <TableCell>Expiration</TableCell>
                      <TableCell>Durée</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReferrals.length > 0 ? (
                      filteredReferrals.map((referral, index) => (
                        <TableRow key={referral.id} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  mr: 2,
                                  bgcolor: `hsl(${index * 45}, 70%, ${
                                    isDarkMode ? "60%" : "45%"
                                  })`,
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                }}
                              >
                                {referral.name?.charAt(0) || "U"}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {referral.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{referral.pack_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={`G${referral.generation}`}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>{referral.purchase_date}</TableCell>
                          <TableCell>{referral.expiry_date}</TableCell>
                          <TableCell>
                            {referral.validity_months
                              ? `${referral.validity_months.toFixed(1)} mois`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                referral.status === "active"
                                  ? "Actif"
                                  : "Expiré"
                              }
                              color={
                                referral.status === "active"
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchTerm
                              ? "Aucun résultat trouvé"
                              : "Aucune activité récente"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  // Composant pour les graphiques et visualisations
  const Visualizations = () => {
    if (!stats?.general_stats) return null;

    const { general_stats } = stats;

    // Données pour le graphique de répartition par génération
    const generationData = useMemo(
      () => ({
        labels: [
          "Génération 1",
          "Génération 2",
          "Génération 3",
          "Génération 4",
        ],
        datasets: [
          {
            label: "Nombre de filleuls",
            data: general_stats.referrals_by_generation,
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderColor: isDarkMode ? "#1f2937" : "#ffffff",
            borderWidth: 2,
          },
        ],
      }),
      [general_stats.referrals_by_generation, isDarkMode]
    );

    // Données pour les commissions par génération
    const commissionData = useMemo(
      () => ({
        labels: [
          "Génération 1",
          "Génération 2",
          "Génération 3",
          "Génération 4",
        ],
        datasets: [
          {
            label: `Commissions (${selectedCurrency})`,
            data:
              selectedCurrency === "USD"
                ? general_stats.commissions_by_generation_usd
                : general_stats.commissions_by_generation_cdf,
            backgroundColor:
              selectedCurrency === "USD"
                ? "rgba(16, 185, 129, 0.7)"
                : "rgba(245, 158, 11, 0.7)",
            borderColor: isDarkMode ? "#1f2937" : "#ffffff",
            borderWidth: 2,
          },
        ],
      }),
      [
        general_stats.commissions_by_generation_usd,
        general_stats.commissions_by_generation_cdf,
        selectedCurrency,
        isDarkMode,
      ]
    );

    return (
      <motion.div
        key={`visualizations-${packId}-${userId}`}
        variants={containerVariants}
        initial={hasAnimated ? "visible" : "hidden"}
        animate={hasAnimated ? "visible" : "hidden"}
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
          Visualisations des données
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "#3b82f615",
                        color: "#3b82f6",
                        mr: 2,
                      }}
                    >
                      <PeopleIcon />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Répartition par génération
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Bar data={generationData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor:
                          selectedCurrency === "USD"
                            ? "#10b98115"
                            : "#f59e0b15",
                        color:
                          selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
                        mr: 2,
                      }}
                    >
                      <AccountBalanceIcon />
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      Commissions par génération ({selectedCurrency})
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <Bar data={commissionData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // État de chargement
  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ py: 8 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={60} thickness={3} />
            <Typography variant="h6">Chargement des statistiques...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Erreur de chargement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchStats}
              startIcon={<RefreshIcon />}
            >
              Réessayer
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Rendu principal
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isFullScreen}
      BackdropProps={{
        sx: {
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
          borderRadius: isFullScreen ? 0 : 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: isDarkMode ? "#111827" : "#ffffff",
          borderBottom: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <AssessmentIcon sx={{ mr: 2, color: "primary.main" }} />
          <Typography variant="h6" fontWeight={600}>
            Statistiques du pack
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton onClick={fetchStats} size="small">
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={() => setIsFullScreen(!isFullScreen)}
            size="small"
          >
            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa" }}>
        {/* Contenu principal - utilise le commutateur global */}

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: isDarkMode ? "#111827" : "#ffffff",
            "& .MuiTab-root": {
              color: isDarkMode ? "#9ca3af" : "#6b7280",
              fontWeight: 500,
              textTransform: "none",
              "&.Mui-selected": {
                color: isDarkMode ? "#ffffff" : "#111827",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab icon={<AssessmentIcon />} label="Vue d'ensemble" />
          <Tab icon={<TimelineIcon />} label="Progression" />
          <Tab icon={<PeopleIcon />} label="Activités" />
          <Tab icon={<ShowChartIcon />} label="Visualisations" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {currentTab === 0 && <GeneralStats />}
          {currentTab === 1 && <ProgressionStats />}
          {currentTab === 2 && <ReferralActivities />}
          {currentTab === 3 && <Visualizations />}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: isDarkMode ? "#111827" : "#ffffff",
          borderTop: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackStatsModal;
