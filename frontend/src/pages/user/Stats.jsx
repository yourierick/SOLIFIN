import React, { useState, useEffect } from 'react';
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
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from '../../utils/axios';
import { Star, StarBorder } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Enregistrer les composants Chart.js nécessaires
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

export default function Stats() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stats/global');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      setError('Erreur lors de la récupération des statistiques');
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
        position: 'top',
        labels: {
          color: isDarkMode ? '#fff' : '#000'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000'
        }
      },
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000'
        }
      }
    }
  };

  // Composant pour les statistiques générales
  const GeneralStats = () => {
    const bestMonth = Object.entries(stats?.progression?.monthly_commissions || {})
      .reduce((best, [month, amount]) => {
        const currentAmount = parseFloat(amount);
        return currentAmount > (best.amount || 0) 
          ? { month, amount: currentAmount } 
          : best;
      }, { month: '', amount: 0 });

    // Animation variants pour les cartes
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: { 
          type: "spring", 
          stiffness: 100,
          damping: 12
        }
      }
    };

    // Calculer le pourcentage de filleuls actifs
    const totalReferrals = stats?.general_stats.total_referrals || 0;
    const activeReferrals = stats?.general_stats.active_referrals || 0;
    const activePercentage = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
    
    // Couleur principale pour maintenir la cohérence
    const primaryColor = isDarkMode ? '#4dabf5' : '#1976d2';
    
    // Données pour le graphique en anneau
    const doughnutData = {
      labels: ['Actifs', 'Inactifs'],
      datasets: [
        {
          data: [
            stats?.general_stats.active_referrals || 0,
            stats?.general_stats.inactive_referrals || 0
          ],
          backgroundColor: [
            isDarkMode ? '#4caf50' : '#2e7d32',
            isDarkMode ? '#ff9800' : '#ed6c02'
          ],
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    };

    // Options pour le graphique en anneau
    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDarkMode ? '#e0e0e0' : '#333333',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
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
                    borderLeft: `4px solid ${primaryColor}`
                  }} 
                  component={motion.div} 
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent sx={{ position: 'relative', py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: isDarkMode ? 'grey.400' : 'grey.700' }}>
                          FILLEULS TOTAUX
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {stats?.general_stats.total_referrals || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Tous niveaux confondus
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                          p: 1.5, 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" sx={{ color: primaryColor }}>👥</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Card 
                  sx={{
                    ...cardStyle,
                    borderLeft: `4px solid ${primaryColor}`
                  }} 
                  component={motion.div} 
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent sx={{ position: 'relative', py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: isDarkMode ? 'grey.400' : 'grey.700' }}>
                          MEILLEURE GÉNÉRATION
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: primaryColor }}>
                          {stats?.general_stats.best_generation || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Génération la plus rentable
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                          p: 1.5, 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" sx={{ color: primaryColor }}>🏆</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Card 
                  sx={{
                    ...cardStyle,
                    borderLeft: `4px solid ${primaryColor}`
                  }} 
                  component={motion.div} 
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent sx={{ position: 'relative', py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: isDarkMode ? 'grey.400' : 'grey.700' }}>
                          MEILLEUR MOIS
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: primaryColor }}>
                          {bestMonth.amount.toFixed(2)} $
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {bestMonth.month}
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                          p: 1.5, 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" sx={{ color: primaryColor }}>📅</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Card 
                  sx={{
                    ...cardStyle,
                    borderLeft: `4px solid ${primaryColor}`
                  }} 
                  component={motion.div} 
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent sx={{ position: 'relative', py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: isDarkMode ? 'grey.400' : 'grey.700' }}>
                          TAUX D'ACTIVITÉ
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: primaryColor }}>
                          {activePercentage.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Filleuls actifs
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                          p: 1.5, 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="h5" sx={{ color: primaryColor }}>📊</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
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
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Statut des filleuls
                  </Typography>
                  <Box sx={{ height: 240, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </Box>
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: isDarkMode ? 'primary.light' : 'primary.main' }}>
                        {totalReferrals}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Total
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#4caf50' : '#2e7d32', fontWeight: 'bold' }}>
                        ACTIFS
                      </Typography>
                      <Typography variant="h6">
                        {stats?.general_stats.active_referrals || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#ff9800' : '#ed6c02', fontWeight: 'bold' }}>
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
            <motion.div variants={itemVariants}>
              <Card 
                sx={cardStyle} 
                component={motion.div} 
                whileHover={{ scale: 1.02 }} 
                transition={{ duration: 0.2 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Filleuls par génération
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {stats?.general_stats.referrals_by_generation.map((count, index) => {
                      // Calculer le pourcentage par rapport au total
                      const percentage = totalReferrals > 0 ? (count / totalReferrals) * 100 : 0;
                      
                      // Utiliser la couleur principale avec différentes opacités
                      const opacity = 1 - (index * 0.1);
                      const color = primaryColor;
                      
                      return (
                        <motion.div 
                          key={index}
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {index + 1}e génération
                              </Typography>
                              <Typography variant="body2">
                                {count} ({percentage.toFixed(1)}%)
                              </Typography>
                            </Box>
                            <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: `${percentage}%`,
                                  bgcolor: color,
                                  opacity: opacity,
                                  height: '100%',
                                  borderRadius: 1,
                                  transition: 'width 1s ease-in-out'
                                }}
                              />
                            </Box>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // Composant pour la progression et performances
  const ProgressionStats = () => {
    const renderStars = (performance) => {
      if (!performance) return null;
      
      const stars = [];
      for (let i = 0; i < 5; i++) {
        stars.push(
          <Box
            component="span"
            key={i}
            sx={{ 
              display: 'inline-flex',
              color: performance.color === 'error' ? '#f44336' :
                     performance.color === 'warning' ? '#ff9800' :
                     performance.color === 'primary' ? '#2196f3' :
                     '#4caf50' // success
            }}
          >
            {i < (performance.stars || 0) ? <Star /> : <StarBorder />}
          </Box>
        );
      }
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {stars}
          <Typography variant="caption" sx={{ ml: 1 }}>
            ({performance.monthly_count || 0} membres en {performance.month || '-'})
          </Typography>
        </Box>
      );
    };

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
                <Line
                  data={{
                    labels: Object.keys(stats?.progression.monthly_signups || {}),
                    datasets: [
                      {
                        label: 'Nouveaux filleuls',
                        data: Object.values(stats?.progression.monthly_signups || {}),
                        borderColor: theme.palette.primary.main,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des gains totaux
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line
                  data={{
                    labels: Object.keys(stats?.progression.monthly_commissions || {}),
                    datasets: [
                      {
                        label: 'Commissions ($)',
                        data: Object.values(stats?.progression.monthly_commissions || {}),
                        borderColor: theme.palette.success.main,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={chartOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance par pack
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pack</TableCell>
                      <TableCell>Nombre de filleuls</TableCell>
                      <TableCell>Commissions générées</TableCell>
                      <TableCell>Performance mensuelle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.packs_performance?.map((pack) => (
                      <TableRow key={pack?.id || 'unknown'}>
                        <TableCell>{pack?.name || '-'}</TableCell>
                        <TableCell>{pack?.total_referrals || 0}</TableCell>
                        <TableCell>{Number(pack?.total_commissions || 0).toFixed(2)} $</TableCell>
                        <TableCell>{renderStars(pack?.performance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Composant pour les activités des filleuls
  const ReferralActivities = () => (
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
                      label={referral.status === 'active' ? 'Actif' : 'Inactif'}
                      color={referral.status === 'active' ? 'success' : 'default'}
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
  const Visualizations = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribution des filleuls par pack
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={{
                  labels: stats?.visualizations.referrals_by_pack.map(p => p.pack_name),
                  datasets: [
                    {
                      label: 'Nombre de filleuls',
                      data: stats?.visualizations.referrals_by_pack.map(p => p.count),
                      backgroundColor: theme.palette.primary.main
                    }
                  ]
                }}
                options={chartOptions}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card sx={cardStyle}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Répartition des gains par pack
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={{
                  labels: stats?.visualizations.commissions_by_pack.map(p => p.pack_name),
                  datasets: [
                    {
                      label: 'Commissions ($)',
                      data: stats?.visualizations.commissions_by_pack.map(p => p.amount),
                      backgroundColor: theme.palette.success.main
                    }
                  ]
                }}
                options={chartOptions}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Composant pour les informations financières
  const FinancialInfo = () => {
    // Animation variants pour les cartes financières
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.15
        }
      }
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: { 
          type: "spring", 
          stiffness: 100,
          damping: 12
        }
      }
    };

    // Animation pour les nombres (compteur)
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      // Déclencher l'animation après un court délai
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }, []);

    // Couleur principale pour maintenir la cohérence
    const primaryColor = isDarkMode ? '#4dabf5' : '#1976d2';

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <motion.div variants={itemVariants}>
              <Card 
                sx={{
                  ...cardStyle,
                  borderLeft: `4px solid ${primaryColor}`
                }} 
                component={motion.div} 
                whileHover={{ scale: 1.02 }} 
                transition={{ duration: 0.2 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Résumé financier
                    </Typography>
                    <Box 
                      sx={{ 
                        bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                        p: 1, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: primaryColor }}>💰</Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isVisible ? { scale: 1, opacity: 1 } : {}}
                        transition={{ 
                          type: "spring", 
                          stiffness: 100,
                          damping: 8,
                          delay: 0.2
                        }}
                      >
                        <Box sx={{ textAlign: 'center', p: 2, borderRadius: 1, bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(227, 242, 253, 0.7)' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                            TOTAL DES COMMISSIONS
                          </Typography>
                          <Typography variant="h3" sx={{ color: primaryColor, fontWeight: 'bold' }}>
                            {Number(stats?.financial_info.total_commission).toFixed(2)} $
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Vos commissions sont calculées en fonction de vos filleuls actifs et des bonus sur délais que vous avez atteints.
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Les paiements sont effectués selon les conditions définies dans votre pack.
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Card 
                sx={cardStyle} 
                component={motion.div} 
                whileHover={{ scale: 1.01 }} 
                transition={{ duration: 0.2 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Bonus sur délais
                    </Typography>
                    <Box 
                      sx={{ 
                        bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                        p: 1, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: primaryColor }}>🎁</Typography>
                    </Box>
                  </Box>
                  <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Fréquence</TableCell>
                          <TableCell>Filleuls requis</TableCell>
                          <TableCell align="right">Taux bonus</TableCell>
                          <TableCell align="right">Statut</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats?.financial_info.bonus_rates?.map((bonus, index) => (
                          <motion.tr
                            component={TableRow}
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <TableCell>
                              {bonus.frequence === 'daily' ? 'Journalier' : 
                               bonus.frequence === 'weekly' ? 'Hebdomadaire' : 
                               bonus.frequence === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </TableCell>
                            <TableCell>{bonus.nombre_filleuls}</TableCell>
                            <TableCell align="right">{bonus.taux_bonus}%</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={bonus.achieved ? "Atteint" : "Non atteint"} 
                                color={bonus.achieved ? "success" : "default"}
                                size="small"
                              />
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Card 
                sx={cardStyle} 
                component={motion.div} 
                whileHover={{ scale: 1.01 }} 
                transition={{ duration: 0.2 }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Derniers paiements reçus
                    </Typography>
                    <Box 
                      sx={{ 
                        bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                        p: 1, 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: primaryColor }}>📝</Typography>
                    </Box>
                  </Box>
                  <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Génération</TableCell>
                          <TableCell align="right">Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats?.financial_info.latest_payments.map((payment, index) => (
                          <motion.tr
                            component={TableRow}
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <TableCell>{payment.date}</TableCell>
                            <TableCell>{payment.source}</TableCell>
                            <TableCell>{payment.level}e génération</TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 'bold', color: primaryColor }}>
                                {Number(payment.amount).toFixed(2)} $
                              </Typography>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  const cardStyle = {
    bgcolor: isDarkMode ? 'rgba(32, 63, 99, 0.2)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ mb: 4 }}>
          Statistiques Globales
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { id: 0, label: "Statistiques générales", icon: "📊", color: "#1976d2" },
            { id: 1, label: "Progression et performances", icon: "📈", color: "#2e7d32" },
            { id: 2, label: "Activités des filleuls", icon: "👥", color: "#ed6c02" },
            { id: 3, label: "Graphiques et visualisations", icon: "📉", color: "#9c27b0" },
            { id: 4, label: "Informations financières", icon: "💰", color: "#d32f2f" }
          ].map((tab) => (
            <Grid item xs={6} sm={4} md={2.4} key={tab.id}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  sx={{
                    cursor: 'pointer',
                    height: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: currentTab === tab.id 
                      ? (isDarkMode ? `${tab.color}33` : `${tab.color}22`) 
                      : (isDarkMode ? 'rgba(32, 63, 99, 0.2)' : 'rgba(255, 255, 255, 0.8)'),
                    border: currentTab === tab.id ? `2px solid ${tab.color}` : 'none',
                    boxShadow: currentTab === tab.id 
                      ? `0 4px 12px ${tab.color}33` 
                      : (isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 6px 14px ${tab.color}40`,
                    }
                  }}
                  onClick={() => handleTabChange(null, tab.id)}
                >
                  <Typography variant="h5" sx={{ mb: 1, opacity: 0.9 }}>
                    {tab.icon}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: currentTab === tab.id ? 600 : 400,
                      color: currentTab === tab.id 
                        ? (isDarkMode ? tab.color : tab.color) 
                        : 'text.secondary',
                      textAlign: 'center',
                      px: 1
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      <hr />

      <Box sx={{ mt: 3 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentTab === 0 && <GeneralStats />}
            {currentTab === 1 && <ProgressionStats />}
            {currentTab === 2 && <ReferralActivities />}
            {currentTab === 3 && <Visualizations />}
            {currentTab === 4 && <FinancialInfo />}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}