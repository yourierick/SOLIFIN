import React, { useState, useEffect, useMemo } from "react";
import axios from "../utils/axios";
import { useCurrency } from "../contexts/CurrencyContext";
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
import { motion, AnimatePresence } from "framer-motion";
import { ChartBarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RefreshIcon from "@mui/icons-material/Refresh";

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

const PackStatsModal = ({ open, onClose, packId }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { selectedCurrency, isCDFEnabled } = useCurrency(); // Utiliser le contexte global
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [filterGeneration, setFilterGeneration] = useState("all");
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Définir les styles réutilisables
  const cardStyle = {
    height: "100%",
    borderRadius: "12px",
    boxShadow: isDarkMode
      ? "0 4px 20px rgba(0, 0, 0, 0.25)"
      : "0 4px 20px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    bgcolor: isDarkMode ? "#1f2937" : "background.paper",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: isDarkMode
        ? "0 8px 25px rgba(0, 0, 0, 0.3)"
        : "0 8px 25px rgba(0, 0, 0, 0.15)",
    },
  };

  const tableStyle = {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: isDarkMode
      ? "0 2px 10px rgba(0, 0, 0, 0.2)"
      : "0 2px 10px rgba(0, 0, 0, 0.05)",
    "& .MuiTableCell-head": {
      bgcolor: isDarkMode ? "#1f2937" : "#fff",
      fontWeight: 600,
    },
    "& .MuiTableCell-root": {
      borderColor: isDarkMode
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
    },
  };

  useEffect(() => {
    if (open && packId) {
      fetchStats(1, 10); // Charger la première page avec 10 éléments par défaut
    }
  }, [open, packId]);

  // Effet pour recharger les données lorsque la devise change
  useEffect(() => {
    if (open && packId) {
      fetchStats(1, 10);
    }
  }, [selectedCurrency, open, packId]);

  const fetchStats = async (
    page = 1,
    perPage = 1,
    searchTerm = "",
    startDate = "",
    endDate = ""
  ) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/packs/${packId}/detailed-stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      setError("Erreur lors de la récupération des statistiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Configuration des graphiques
  const chartOptions = {
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
          color: isDarkMode ? "#fff" : "#000",
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: "600",
          },
          boxWidth: 20,
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: isDarkMode
          ? "rgba(17, 24, 39, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        titleColor: isDarkMode ? "#fff" : "#000",
        bodyColor: isDarkMode ? "#e0e0e0" : "#333",
        borderColor: isDarkMode
          ? "rgba(255, 255, 255, 0.2)"
          : "rgba(0, 0, 0, 0.1)",
        borderWidth: 2,
        padding: 16,
        cornerRadius: 12,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 15,
          weight: "700",
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: "500",
        },
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        boxPadding: 4,
        usePointStyle: true,
        caretSize: 8,
        caretPadding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.03)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: "500",
          },
          padding: 12,
        },
        title: {
          display: true,
          text: "Valeur",
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: "600",
          },
          padding: { top: 0, bottom: 10 },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: "500",
          },
          padding: 12,
        },
        title: {
          display: true,
          text: "Période",
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          font: {
            family: "'Inter', sans-serif",
            size: 13,
            weight: "600",
          },
          padding: { top: 10, bottom: 0 },
        },
      },
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 8,
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
      line: {
        tension: 0.4,
        borderWidth: 3,
        borderJoinStyle: "round",
        borderCapStyle: "round",
      },
      bar: {
        borderWidth: 0,
        borderRadius: 8,
        borderSkipped: false,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  // Composant pour les statistiques générales
  const GeneralStats = () => {
    // Trouver le mois avec le plus de gains selon la devise sélectionnée
    const bestMonth = Object.entries(
      stats?.progression?.monthly_commissions || {}
    ).reduce(
      (best, [month, data]) => {
        const currentAmount = parseFloat(
          data[selectedCurrency.toLowerCase()] || data.total || 0
        );
        return currentAmount > (best.amount || 0)
          ? { month, amount: currentAmount }
          : best;
      },
      { month: "", amount: 0 }
    );

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        F
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Nombre total de filleuls
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.primary.main,
                      mb: 1,
                    }}
                  >
                    {stats?.general_stats.total_referrals || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Répartis sur{" "}
                    {stats?.general_stats.referrals_by_generation?.length || 0}{" "}
                    générations
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.main,
                        mr: 2,
                        width: 48,
                        height: 48,
                        boxShadow: `0 4px 12px ${theme.palette.success.main}33`,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        G
                      </Typography>
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Filleuls par génération
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Répartition de votre réseau sur 4 générations
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    {stats?.general_stats.referrals_by_generation?.map(
                      (count, index) => {
                        const generationColors = [
                          {
                            primary: "#4f46e5",
                            secondary: "#818cf8",
                            bg: "rgba(79, 70, 229, 0.1)",
                          },
                          {
                            primary: "#0891b2",
                            secondary: "#06b6d4",
                            bg: "rgba(8, 145, 178, 0.1)",
                          },
                          {
                            primary: "#059669",
                            secondary: "#10b981",
                            bg: "rgba(5, 150, 105, 0.1)",
                          },
                          {
                            primary: "#dc2626",
                            secondary: "#ef4444",
                            bg: "rgba(220, 38, 38, 0.1)",
                          },
                        ];
                        const colors =
                          generationColors[index] || generationColors[0];
                        const isActive = count > 0;

                        return (
                          <Grid item xs={6} sm={3} key={index}>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 17,
                              }}
                            >
                              <Box
                                sx={{
                                  p: 3,
                                  borderRadius: "16px",
                                  background: isActive
                                    ? `linear-gradient(135deg, ${colors.bg} 0%, ${colors.primary}15 100%)`
                                    : isDarkMode
                                    ? "rgba(255, 255, 255, 0.03)"
                                    : "rgba(0, 0, 0, 0.02)",
                                  border: isActive
                                    ? `2px solid ${colors.primary}40`
                                    : `2px solid ${
                                        isDarkMode
                                          ? "rgba(255, 255, 255, 0.1)"
                                          : "rgba(0, 0, 0, 0.05)"
                                      }`,
                                  textAlign: "center",
                                  position: "relative",
                                  overflow: "hidden",
                                  boxShadow: isActive
                                    ? `0 8px 25px ${colors.primary}20`
                                    : isDarkMode
                                    ? "0 2px 8px rgba(0, 0, 0, 0.2)"
                                    : "0 2px 8px rgba(0, 0, 0, 0.05)",
                                  transition: "all 0.3s ease",
                                  "&::before": isActive
                                    ? {
                                        content: '""',
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: "4px",
                                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                                      }
                                    : {},
                                }}
                              >
                                {isActive && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      bgcolor: colors.primary,
                                      boxShadow: `0 0 12px ${colors.primary}`,
                                    }}
                                  />
                                )}
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: 800,
                                    mb: 1,
                                    color: isActive
                                      ? colors.primary
                                      : "text.secondary",
                                    fontSize: { xs: "1.8rem", sm: "2rem" },
                                  }}
                                >
                                  {count}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: isActive
                                      ? colors.secondary
                                      : "text.secondary",
                                    fontSize: "0.85rem",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {index === 0
                                    ? "1ère"
                                    : index === 1
                                    ? "2ème"
                                    : index === 2
                                    ? "3ème"
                                    : "4ème"}{" "}
                                  génération
                                </Typography>
                                {isActive && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      mt: 1,
                                      color: colors.primary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    Active
                                  </Typography>
                                )}
                              </Box>
                            </motion.div>
                          </Grid>
                        );
                      }
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        M
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Meilleure génération
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.warning.main,
                      mb: 1,
                    }}
                  >
                    {stats?.general_stats.best_generation || 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Génération la plus rentable
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        $
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Meilleur mois
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.info.main,
                      mb: 1,
                    }}
                  >
                    {selectedCurrency === "USD"
                      ? `$${bestMonth.amount.toFixed(2)}`
                      : new Intl.NumberFormat("fr-CD", {
                          style: "currency",
                          currency: "CDF",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(bestMonth.amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bestMonth.month || "Aucune donnée"}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        S
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Statut des filleuls
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          bgcolor: isDarkMode
                            ? "rgba(46, 125, 50, 0.2)"
                            : "rgba(46, 125, 50, 0.1)",
                          border: "1px solid",
                          borderColor: isDarkMode
                            ? "rgba(46, 125, 50, 0.3)"
                            : "rgba(46, 125, 50, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: isDarkMode ? "#81c784" : "#2e7d32",
                            mb: 1,
                          }}
                        >
                          {stats?.general_stats.active_referrals || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Actifs
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          bgcolor: isDarkMode
                            ? "rgba(211, 47, 47, 0.2)"
                            : "rgba(211, 47, 47, 0.1)",
                          border: "1px solid",
                          borderColor: isDarkMode
                            ? "rgba(211, 47, 47, 0.3)"
                            : "rgba(211, 47, 47, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: isDarkMode ? "#e57373" : "#d32f2f",
                            mb: 1,
                          }}
                        >
                          {stats?.general_stats.inactive_referrals || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inactifs
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // Composant pour la progression et performances
  const ProgressionStats = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      I
                    </Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Évolution des inscriptions
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(
                        stats?.progression?.monthly_signups || {}
                      ),
                      datasets: [
                        {
                          label: "Nouveaux filleuls",
                          data: Object.values(
                            stats?.progression.monthly_signups || {}
                          ),
                          borderColor: "#6366f1",
                          backgroundColor: isDarkMode
                            ? "rgba(99, 102, 241, 0.15)"
                            : "rgba(99, 102, 241, 0.08)",
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor: "#6366f1",
                          pointBorderColor: isDarkMode ? "#1f2937" : "#ffffff",
                          pointHoverBackgroundColor: "#4f46e5",
                          pointHoverBorderColor: isDarkMode
                            ? "#1f2937"
                            : "#ffffff",
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: "Nombre de filleuls",
                          },
                        },
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function (context) {
                              return `${context.parsed.y} filleul${
                                context.parsed.y > 1 ? "s" : ""
                              }`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      G
                    </Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Évolution des gains
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(
                        stats?.progression.monthly_commissions || {}
                      ),
                      datasets: [
                        {
                          label: `Commissions (${selectedCurrency})`,
                          data: Object.values(
                            stats?.progression.monthly_commissions || {}
                          ).map(
                            (monthData) =>
                              monthData[selectedCurrency.toLowerCase()] ||
                              monthData.total ||
                              0
                          ),
                          borderColor:
                            selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
                          backgroundColor:
                            selectedCurrency === "USD"
                              ? isDarkMode
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(16, 185, 129, 0.08)"
                              : isDarkMode
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(245, 158, 11, 0.08)",
                          fill: true,
                          tension: 0.4,
                          pointBackgroundColor:
                            selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
                          pointBorderColor: isDarkMode ? "#1f2937" : "#ffffff",
                          pointHoverBackgroundColor:
                            selectedCurrency === "USD" ? "#059669" : "#d97706",
                          pointHoverBorderColor: isDarkMode
                            ? "#1f2937"
                            : "#ffffff",
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: `Montant (${selectedCurrency})`,
                          },
                        },
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y.toFixed(2);
                              if (selectedCurrency === "USD") {
                                return `$${value}`;
                              } else {
                                return `${new Intl.NumberFormat("fr-CD", {
                                  style: "currency",
                                  currency: "CDF",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(value)}`;
                              }
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        {stats?.progression.top_referral && (
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        T
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Top Filleul
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: "10px",
                      bgcolor: isDarkMode
                        ? "rgba(237, 108, 2, 0.2)"
                        : "rgba(237, 108, 2, 0.1)",
                      border: "1px solid",
                      borderColor: isDarkMode
                        ? "rgba(237, 108, 2, 0.3)"
                        : "rgba(237, 108, 2, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {stats.progression.top_referral.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        A recruté {stats.progression.top_referral.recruit_count}{" "}
                        personnes
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: theme.palette.warning.main,
                        fontSize: "1.5rem",
                        fontWeight: 700,
                      }}
                    >
                      {stats.progression.top_referral.name.charAt(0)}
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

  // Composant pour les activités des filleuls
  const ReferralActivities = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <Card sx={cardStyle}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  A
                </Typography>
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                Activités récentes des filleuls
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={tableStyle}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Nom du pack</TableCell>
                    <TableCell>Date d'achat</TableCell>
                    <TableCell>Date d'expiration</TableCell>
                    <TableCell>Durée (mois)</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.latest_referrals?.map((referral, index) => (
                    <TableRow
                      key={referral.id || index}
                      sx={{
                        bgcolor: isDarkMode ? "#1f2937" : "#fff",
                        "&:hover": {
                          bgcolor: isDarkMode ? "#1f2940" : "#f9fafb",
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              mr: 1.5,
                              bgcolor: `hsl(${index * 40}, 70%, ${
                                isDarkMode ? "65%" : "50%"
                              })`,
                              fontSize: "0.875rem",
                            }}
                          >
                            {referral.name?.charAt(0) || "U"}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {referral.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{referral.pack_name}</TableCell>
                      <TableCell>{referral.purchase_date}</TableCell>
                      <TableCell>{referral.expiry_date}</TableCell>
                      <TableCell>
                        {referral.validity_months?.toFixed(0) || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            referral.status === "active" ? "Actif" : "Inactif"
                          }
                          color={
                            referral.status === "active" ? "success" : "default"
                          }
                          size="small"
                          sx={{
                            fontWeight: 500,
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  // Composant pour les graphiques et visualisations
  const Visualizations = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      I
                    </Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Inscriptions par mois
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Bar
                    data={{
                      labels: Object.keys(
                        stats?.progression.monthly_signups || {}
                      ),
                      datasets: [
                        {
                          label: "Inscriptions",
                          data: Object.values(
                            stats?.progression.monthly_signups || {}
                          ),
                          backgroundColor: Object.values(
                            stats?.progression.monthly_signups || {}
                          ).map((_, i) => {
                            const colors = [
                              "#6366f1",
                              "#8b5cf6",
                              "#a855f7",
                              "#c084fc",
                              "#e879f9",
                              "#f472b6",
                              "#fb7185",
                              "#f87171",
                              "#fb923c",
                              "#fbbf24",
                              "#facc15",
                              "#a3e635",
                            ];
                            return isDarkMode
                              ? colors[i % colors.length] + "dd"
                              : colors[i % colors.length] + "99";
                          }),
                          borderColor: Object.values(
                            stats?.progression.monthly_signups || {}
                          ).map((_, i) => {
                            const colors = [
                              "#6366f1",
                              "#8b5cf6",
                              "#a855f7",
                              "#c084fc",
                              "#e879f9",
                              "#f472b6",
                              "#fb7185",
                              "#f87171",
                              "#fb923c",
                              "#fbbf24",
                              "#facc15",
                              "#a3e635",
                            ];
                            return colors[i % colors.length];
                          }),
                          borderWidth: 2,
                          borderRadius: 8,
                          maxBarThickness: 45,
                          hoverBackgroundColor: Object.values(
                            stats?.progression.monthly_signups || {}
                          ).map((_, i) => {
                            const colors = [
                              "#6366f1",
                              "#8b5cf6",
                              "#a855f7",
                              "#c084fc",
                              "#e879f9",
                              "#f472b6",
                              "#fb7185",
                              "#f87171",
                              "#fb923c",
                              "#fbbf24",
                              "#facc15",
                              "#a3e635",
                            ];
                            return colors[i % colors.length];
                          }),
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: "Nombre d'inscriptions",
                          },
                        },
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          display: false,
                        },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function (context) {
                              return `${context.parsed.y} inscription${
                                context.parsed.y > 1 ? "s" : ""
                              }`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      G
                    </Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Tendance des gains (6 derniers mois) - {selectedCurrency}
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(
                        stats?.progression.monthly_commissions || {}
                      ),
                      datasets: [
                        {
                          label: `Gains (${selectedCurrency})`,
                          data: Object.values(
                            stats?.progression.monthly_commissions || {}
                          ).map(
                            (monthData) =>
                              monthData[selectedCurrency.toLowerCase()] ||
                              monthData.total ||
                              0
                          ),
                          borderColor:
                            selectedCurrency === "USD" ? "#059669" : "#d97706",
                          backgroundColor:
                            selectedCurrency === "USD"
                              ? "rgba(5, 150, 105, 0.1)"
                              : "rgba(217, 119, 6, 0.1)",
                          tension: 0.4,
                          fill: true,
                          pointBackgroundColor:
                            selectedCurrency === "USD" ? "#10b981" : "#f59e0b",
                          pointBorderColor: isDarkMode ? "#1f2937" : "#ffffff",
                          pointHoverBackgroundColor:
                            selectedCurrency === "USD" ? "#059669" : "#d97706",
                          pointHoverBorderColor: isDarkMode
                            ? "#1f2937"
                            : "#ffffff",
                          pointBorderWidth: 3,
                          pointRadius: 6,
                          pointHoverRadius: 9,
                          borderWidth: 4,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        y: {
                          ...chartOptions.scales.y,
                          title: {
                            ...chartOptions.scales.y.title,
                            text: `Gains (${selectedCurrency})`,
                          },
                        },
                      },
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y.toFixed(2);
                              if (selectedCurrency === "USD") {
                                return `$${value}`;
                              } else {
                                return `${new Intl.NumberFormat("fr-CD", {
                                  style: "currency",
                                  currency: "CDF",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(value)}`;
                              }
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );

  // Composant pour les filtres et la recherche
  const FiltersAndSearch = ({
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    onFilterChange,
  }) => {
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      onFilterChange({ searchTerm: value, dateRange });
    };

    const handleDateChange = (field, value) => {
      const newDateRange = { ...dateRange, [field]: value };
      setDateRange(newDateRange);
      onFilterChange({ searchTerm, dateRange: newDateRange });
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              ...cardStyle,
              mb: 3,
              borderLeft: "4px solid",
              borderLeftColor: theme.palette.primary.main,
              transition: "all 0.3s ease",
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      mr: 2,
                      height: 32,
                      width: 32,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      F
                    </Typography>
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Filtres et recherche
                  </Typography>
                </Box>
                <IconButton size="small">
                  {showFilters ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={showFilters} timeout="auto">
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: `1px solid ${
                      isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                    }`,
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Rechercher un filleul"
                        value={searchTerm}
                        onChange={handleSearch}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={9}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 2,
                        }}
                      >
                        <TextField
                          fullWidth
                          variant="outlined"
                          label="Date de début"
                          type="date"
                          value={dateRange.start}
                          onChange={(e) =>
                            handleDateChange("start", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "10px",
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          variant="outlined"
                          label="Date de fin"
                          type="date"
                          value={dateRange.end}
                          onChange={(e) =>
                            handleDateChange("end", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "10px",
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={() => {
                            setSearchTerm("");
                            setDateRange({ start: "", end: "" });
                            onFilterChange({
                              searchTerm: "",
                              dateRange: { start: "", end: "" },
                            });
                          }}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Réinitialiser
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isFullScreen}
      BackdropProps={{
        style: {
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
          backgroundImage: "none",
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
          bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
          borderBottom: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <div>Statistiques et Performances</div>
        <IconButton
          onClick={() => setIsFullScreen(!isFullScreen)}
          sx={{ ml: 1 }}
        >
          {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <Typography>Chargement...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: "100%" }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
                "& .MuiTab-root": {
                  color: isDarkMode ? "grey.400" : "text.secondary",
                  fontWeight: 500,
                  textTransform: "none",
                  minWidth: "auto",
                  px: 3,
                  "&.Mui-selected": {
                    color: isDarkMode ? "common.white" : "primary.main",
                    fontWeight: 600,
                  },
                },
              }}
            >
              <Tab label="Statistiques générales" />
              <Tab label="Progression et performances" />
              <Tab label="Activités des filleuls" />
              <Tab label="Graphiques et visualisations" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {currentTab === 0 && <GeneralStats />}
              {currentTab === 1 && <ProgressionStats />}
              {currentTab === 2 && <ReferralActivities />}
              {currentTab === 3 && <Visualizations />}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: isDarkMode ? "#1f2937" : "#f8f9fa",
          borderTop: 1,
          borderColor: "divider",
          p: 2,
        }}
      >
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackStatsModal;
