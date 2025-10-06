import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  useMediaQuery,
  Container,
  Fade,
  Slide,
  Zoom,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "../../utils/axios";
import { Star, StarBorder } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

// Importation dynamique des bibliothèques de graphiques
const ChartComponentsContext = React.createContext();

// Composant de chargement pour les graphiques
const ChartLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
    <CircularProgress />
  </Box>
);

// Fournisseur de contexte pour les composants Chart.js
const ChartComponentsProvider = ({ children }) => {
  const [chartComponents, setChartComponents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartComponents = async () => {
      try {
        // Importation dynamique des bibliothèques Chart.js
        const chartJsModule = await import('chart.js');
        const reactChartJs2Module = await import('react-chartjs-2');

        // Enregistrement des composants nécessaires
        const {
          Chart: ChartJS,
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          BarElement,
          ArcElement,
          Title,
          Tooltip,
          Legend
        } = chartJsModule;

        // Enregistrement des composants Chart.js
        ChartJS.register(
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          BarElement,
          ArcElement,
          Title,
          Tooltip,
          Legend
        );

        // Extraction des composants de graphiques
        const { Line, Bar, Doughnut } = reactChartJs2Module;

        setChartComponents({
          Line,
          Bar,
          Doughnut
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des composants de graphiques:", error);
        setLoading(false);
      }
    };

    loadChartComponents();
  }, []);

  return (
    <ChartComponentsContext.Provider value={{ chartComponents, loading }}>
      {children}
    </ChartComponentsContext.Provider>
  );
};

// Hook personnalisé pour utiliser les composants Chart.js
const useChartComponents = () => {
  const context = React.useContext(ChartComponentsContext);
  if (!context) {
    throw new Error('useChartComponents doit être utilisé à l\'intérieur d\'un ChartComponentsProvider');
  }
  return context;
};

export default function Stats() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Style glassmorphism moderne et subtil
  const glassmorphismStyle = {
    background: isDarkMode ? "#1f2937" : "rgba(255, 255, 255, 0.9)",
    border: isDarkMode
      ? "1px solid rgba(55, 65, 81, 0.3)"
      : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    borderRadius: 3,
    boxShadow: isDarkMode
      ? "0 4px 16px rgba(0, 0, 0, 0.2)"
      : "0 4px 16px rgba(0, 0, 0, 0.08)",
  };

  // Style pour les cartes principales
  const cardStyle = {
    ...glassmorphismStyle,
    transition: "all 0.2s ease-in-out",
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stats/global");
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
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: isDarkMode ? "#fff" : "#000",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDarkMode ? "#fff" : "#000",
        },
      },
      x: {
        grid: {
          color: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: isDarkMode ? "#fff" : "#000",
        },
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <ChartComponentsProvider>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Statistiques
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <GeneralStats stats={stats} isDarkMode={isDarkMode} cardStyle={cardStyle} />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <ProgressionStats stats={stats} isDarkMode={isDarkMode} cardStyle={cardStyle} chartOptions={chartOptions} theme={theme} />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <ReferralActivities stats={stats} cardStyle={cardStyle} />
        </Box>
        
        <Box>
          <Visualizations stats={stats} isDarkMode={isDarkMode} cardStyle={cardStyle} chartOptions={chartOptions} theme={theme} />
        </Box>
      </Box>
    </ChartComponentsProvider>
  );
}

// Composant pour les statistiques générales
const GeneralStats = ({ stats, isDarkMode, cardStyle }) => {
  const bestMonth = Object.entries(
    stats?.progression?.monthly_commissions || {}
  ).reduce(
    (best, [month, amount]) => {
      const currentAmount = parseFloat(amount);
      return currentAmount > (best.amount || 0)
        ? { month, amount: currentAmount }
        : best;
    },
    { month: "", amount: 0 }
  );

  // Animation variants pour les cartes
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

  // Calculer le pourcentage de filleuls actifs
  const totalReferrals = stats?.general_stats.total_referrals || 0;
  const activeReferrals = stats?.general_stats.active_referrals || 0;
  const activePercentage =
    totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

  // Couleur principale pour maintenir la cohérence
  const primaryColor = isDarkMode ? "#4dabf5" : "#1976d2";

  // Utilisation du contexte pour les composants Chart.js
  const { chartComponents, loading } = useChartComponents();
  const Doughnut = chartComponents?.Doughnut;

  // Données pour le graphique en anneau
  const doughnutData = {
    labels: ["Actifs", "Inactifs"],
    datasets: [
      {
        data: [
          stats?.general_stats.active_referrals || 0,
          stats?.general_stats.inactive_referrals || 0,
        ],
        backgroundColor: [
          isDarkMode ? "#4caf50" : "#2e7d32",
          isDarkMode ? "#ff9800" : "#ed6c02",
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Options pour le graphique en anneau
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: isDarkMode ? "#e0e0e0" : "#333333",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Première rangée - KPIs principaux */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <motion.div variants={itemVariants}>
              <Card
                sx={{
                  ...cardStyle,
                  borderLeft: `4px solid ${primaryColor}`,
                }}
                component={motion.div}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                }}
                transition={{ duration: 0.2 }}
              >
                <CardContent sx={{ position: "relative", py: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          mb: 0.5,
                          color: isDarkMode ? "grey.400" : "grey.700",
                        }}
                      >
                        FILLEULS TOTAUX
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        {stats?.general_stats.total_referrals || 0}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        bgcolor: isDarkMode
                          ? "rgba(25, 118, 210, 0.2)"
                          : "rgba(25, 118, 210, 0.1)",
                        p: 1.5,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h5" sx={{ color: primaryColor }}>
                        👥
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Autres cartes KPI... */}
          {/* ... */}
        </Grid>
      </Box>

      {/* Deuxième rangée - Graphiques et détails */}
      <Grid container spacing={3}>
        {/* Graphique en anneau pour le statut des filleuls */}
        <Grid item xs={12} md={6}>
          <motion.div variants={itemVariants}>
            <Card
              sx={cardStyle}
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Statut des filleuls
                </Typography>
                <Box
                  sx={{
                    height: 240,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loading ? (
                    <ChartLoading />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      {Doughnut && (
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      )}
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: "absolute",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold",
                        color: isDarkMode ? "primary.light" : "primary.main",
                      }}
                    >
                      {totalReferrals}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Total
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    mt: 2,
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDarkMode ? "#4caf50" : "#2e7d32",
                        fontWeight: "bold",
                      }}
                    >
                      ACTIFS
                    </Typography>
                    <Typography variant="h6">
                      {stats?.general_stats.active_referrals || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDarkMode ? "#ff9800" : "#ed6c02",
                        fontWeight: "bold",
                      }}
                    >
                      INACTIFS
                    </Typography>
                    <Typography variant="h6">
                      {stats?.general_stats.inactive_referrals || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Carte pour les filleuls par génération */}
        <Grid item xs={12} md={6}>
          {/* Contenu de la carte des filleuls par génération... */}
          {/* ... */}
        </Grid>
      </Grid>
    </motion.div>
  );
};

// Composant pour la progression et performances
const ProgressionStats = ({ stats, isDarkMode, cardStyle, chartOptions, theme }) => {
  // Utilisation du contexte pour les composants Chart.js
  const { chartComponents, loading } = useChartComponents();
  const Line = chartComponents?.Line;

  if (!stats?.packs_performance?.length) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="body1">
                Aucune donnée de performance disponible
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Évolution des inscriptions (tous packs)
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <ChartLoading />
              ) : (
                Line && (
                  <Line
                    data={{
                      labels: Object.keys(
                        stats?.progression.monthly_signups || {}
                      ),
                      datasets: [
                        {
                          label: "Nouveaux filleuls",
                          data: Object.values(
                            stats?.progression.monthly_signups || {}
                          ),
                          borderColor: theme.palette.primary.main,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                )
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Autres graphiques... */}
      {/* ... */}
    </Grid>
  );
};

// Composant pour les activités des filleuls
const ReferralActivities = ({ stats, cardStyle }) => (
  <Card sx={cardStyle}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Dernières activités des filleuls
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Pack</TableCell>
              <TableCell>Date d'achat</TableCell>
              <TableCell>Date d'expiration</TableCell>
              <TableCell>Génération</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.latest_referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.name}</TableCell>
                <TableCell>{referral.pack_name}</TableCell>
                <TableCell>{referral.purchase_date}</TableCell>
                <TableCell>{referral.expiry_date}</TableCell>
                <TableCell>{referral.generation}e</TableCell>
                <TableCell>
                  <Chip
                    label={referral.status === "active" ? "Actif" : "Inactif"}
                    color={
                      referral.status === "active" ? "success" : "default"
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </CardContent>
  </Card>
);

// Composant pour les graphiques et visualisations
const Visualizations = ({ stats, isDarkMode, cardStyle, chartOptions, theme }) => {
  // Utilisation du contexte pour les composants Chart.js
  const { chartComponents, loading } = useChartComponents();
  const Bar = chartComponents?.Bar;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribution des filleuls par pack
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <ChartLoading />
              ) : (
                Bar && (
                  <Bar
                    data={{
                      labels: stats?.visualizations.referrals_by_pack.map(
                        (p) => p.pack_name
                      ),
                      datasets: [
                        {
                          label: "Nombre de filleuls",
                          data: stats?.visualizations.referrals_by_pack.map(
                            (p) => p.count
                          ),
                          backgroundColor: theme.palette.primary.main,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                )
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Autres visualisations... */}
      {/* ... */}
    </Grid>
  );
};
