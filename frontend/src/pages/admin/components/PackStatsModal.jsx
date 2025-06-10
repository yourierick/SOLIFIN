import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../utils/axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
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
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Avatar,
  Button,
  InputAdornment
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
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

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
  const isDarkMode = theme.palette.mode === 'dark';
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterGeneration, setFilterGeneration] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Animation variants
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

  // Définir les styles réutilisables
  const cardStyle = {
    height: '100%',
    borderRadius: '12px',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(0, 0, 0, 0.25)' 
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDarkMode 
        ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
        : '0 8px 25px rgba(0, 0, 0, 0.15)'
    }
  };

  const tableStyle = {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: isDarkMode 
      ? '0 2px 10px rgba(0, 0, 0, 0.2)' 
      : '0 2px 10px rgba(0, 0, 0, 0.05)',
    '& .MuiTableCell-head': {
      bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
      fontWeight: 600
    },
    '& .MuiTableCell-root': {
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    }
  };

  useEffect(() => {
    if (open && packId && userId) {
      fetchStats();
    }
  }, [open, packId, userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/packs/${packId}/stats`, {
        params: { user_id: userId }
      });
      console.log(response);
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
          color: isDarkMode ? '#fff' : '#000',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          boxWidth: 15,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#fff' : '#000',
        bodyColor: isDarkMode ? '#fff' : '#000',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        },
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      }
    }
  };

  // Composant pour les statistiques générales
  const GeneralStats = () => {
    if (!stats) return null;
    
    const { general_stats } = stats;
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Carte des statistiques globales */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vue d'ensemble
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total des filleuls
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {general_stats.total_referrals}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Filleuls actifs
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {general_stats.active_referrals}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Commission totale
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                          {typeof general_stats.total_commission === 'number' ? general_stats.total_commission.toFixed(2) : '0'} $
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} className="flex">
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Points bonus disponibles
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {stats.general_stats.bonus_disponibles}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Points bonus utilisés
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {stats.general_stats.bonus_utilises}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Carte des filleuls par génération */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filleuls par génération
                  </Typography>
                  <TableContainer component={Paper} sx={tableStyle}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Génération</TableCell>
                          <TableCell align="right">Nombre</TableCell>
                          <TableCell align="right">Pourcentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {general_stats.referrals_by_generation.map((count, index) => {
                          const percentage = general_stats.total_referrals > 0
                            ? (count / general_stats.total_referrals * 100).toFixed(1)
                            : 0;
                          
                          return (
                            <TableRow key={`gen-${index + 1}`}>
                              <TableCell>
                                <Chip 
                                  label={`Génération ${index + 1}`} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: index === 0 ? 'primary.main' : 
                                            index === 1 ? 'success.main' : 
                                            index === 2 ? 'warning.main' : 'error.main',
                                    color: 'white',
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">{count}</TableCell>
                              <TableCell align="right">{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Carte des statuts */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statut des filleuls
                  </Typography>
                  <Box sx={{ height: 220, position: 'relative' }}>
                    <Doughnut 
                      data={{
                        labels: ['Actifs', 'Inactifs'],
                        datasets: [
                          {
                            data: [
                              general_stats.active_referrals,
                              general_stats.inactive_referrals
                            ],
                            backgroundColor: [
                              '#10B981', // vert pour actif
                              '#F87171'  // rouge pour inactif
                            ],
                            borderColor: isDarkMode ? '#1f2937' : '#ffffff',
                            borderWidth: 2
                          }
                        ]
                      }}
                      options={{
                        ...chartOptions,
                        cutout: '70%',
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            ...chartOptions.plugins.legend,
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {general_stats.total_referrals}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Carte des commissions */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Commissions
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Commission totale
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {typeof general_stats.total_commission === 'number' ? general_stats.total_commission.toFixed(2) : '0'} $
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Commission échouée
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {typeof general_stats.failed_commission === 'number' ? general_stats.failed_commission.toFixed(2) : '0'} $
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Meilleure génération
                      </Typography>
                      <Chip 
                        label={`Génération ${general_stats.best_generation}`} 
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      />
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
  const ProgressionStats = () => {
    if (!stats) return null;
    
    const { progression } = stats;
    
    // Préparer les données pour le graphique mensuel
    const monthlySignupsData = {
      labels: Object.keys(progression.monthly_signups),
      datasets: [
        {
          label: 'Nouveaux filleuls',
          data: Object.values(progression.monthly_signups),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: isDarkMode ? '#1f2937' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
    
    const monthlyCommissionsData = {
      labels: Object.keys(progression.monthly_commissions),
      datasets: [
        {
          label: 'Commissions ($)',
          data: Object.values(progression.monthly_commissions),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: '#10B981',
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: '#10B981',
          pointBorderColor: isDarkMode ? '#1f2937' : '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Graphique des inscriptions mensuelles */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Évolution des inscriptions
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Line 
                      data={monthlySignupsData} 
                      options={chartOptions}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Graphique des commissions mensuelles */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Évolution des commissions
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Line 
                      data={monthlyCommissionsData} 
                      options={chartOptions}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Meilleur filleul */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Meilleur filleul
                  </Typography>
                  {stats.progression.top_referral ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {stats.progression.top_referral.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6">
                          {progression.top_referral.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Génération {progression.top_referral.generation}
                        </Typography>
                        <Chip 
                          label={`${typeof progression.top_referral.commission === 'number' ? progression.top_referral.commission.toFixed(2) : '0'} $ de commission`} 
                          color="success"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                      Aucun filleul trouvé
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // Composant pour les activités des filleuls
  const ReferralActivities = () => {
    if (!stats) return null;
    
    const { latest_referrals } = stats;
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dernières activités des filleuls
              </Typography>
              <TableContainer component={Paper} sx={tableStyle}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Filleul</TableCell>
                      <TableCell>Pack</TableCell>
                      <TableCell>Génération</TableCell>
                      <TableCell>Date d'achat</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {latest_referrals.length > 0 ? (
                      latest_referrals.map((referral, index) => (
                        <TableRow key={`activity-${index}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  bgcolor: 'primary.main',
                                  fontSize: '0.875rem',
                                  mr: 1
                                }}
                              >
                                {referral.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">
                                {referral.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{referral.pack_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`Gen ${referral.generation}`} 
                              size="small"
                              sx={{ 
                                bgcolor: 
                                  referral.generation === 1 ? 'primary.main' : 
                                  referral.generation === 2 ? 'success.main' : 
                                  referral.generation === 3 ? 'warning.main' : 'error.main',
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>{referral.purchase_date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={referral.status === 'active' ? 'Actif' : 'Inactif'} 
                              size="small"
                              color={referral.status === 'active' ? 'success' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucune activité récente
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

  // Composant pour les visualisations
  const Visualizations = () => {
    if (!stats) return null;
    
    const { general_stats } = stats;
    
    // Données pour le graphique de répartition par génération
    const generationData = {
      labels: ['Génération 1', 'Génération 2', 'Génération 3', 'Génération 4'],
      datasets: [
        {
          label: 'Nombre de filleuls',
          data: general_stats.referrals_by_generation,
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // Bleu
            'rgba(16, 185, 129, 0.7)',  // Vert
            'rgba(245, 158, 11, 0.7)',  // Orange
            'rgba(236, 72, 153, 0.7)'   // Rose
          ],
          borderColor: isDarkMode ? '#1f2937' : '#ffffff',
          borderWidth: 1
        }
      ]
    };
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Graphique de répartition par génération */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Répartition par génération
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <Bar 
                      data={generationData} 
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Graphique de statut */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statut des filleuls
                  </Typography>
                  <Box sx={{ height: 300, mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Doughnut 
                      data={{
                        labels: ['Actifs', 'Inactifs'],
                        datasets: [
                          {
                            data: [
                              general_stats.active_referrals,
                              general_stats.inactive_referrals
                            ],
                            backgroundColor: [
                              '#10B981', // vert pour actif
                              '#F87171'  // rouge pour inactif
                            ],
                            borderColor: isDarkMode ? '#1f2937' : '#ffffff',
                            borderWidth: 2
                          }
                        ]
                      }}
                      options={{
                        ...chartOptions,
                        cutout: '60%',
                        plugins: {
                          ...chartOptions.plugins,
                          tooltip: {
                            ...chartOptions.plugins.tooltip,
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
  };

  // Composant pour les informations financières
  const FinancialInfo = () => {
    if (!stats) return null;
    
    const { financial_info } = stats;
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Carte des commissions */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Résumé financier
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      Commission totale générée
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 600, color: 'success.main', mb: 2 }}>
                      {typeof financial_info.total_commission === 'number' ? financial_info.total_commission.toFixed(2) : '0'} $
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Points bonus
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {stats.general_stats.bonus_disponibles}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Filleuls actifs
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {stats.general_stats.active_referrals}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Derniers paiements */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Derniers paiements
                  </Typography>
                  <TableContainer component={Paper} sx={tableStyle}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Filleul</TableCell>
                          <TableCell>Montant</TableCell>
                          <TableCell>Statut</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financial_info.latest_payments.length > 0 ? (
                          financial_info.latest_payments.map((payment, index) => (
                            <TableRow key={`payment-${index}`}>
                              <TableCell>{payment.date}</TableCell>
                              <TableCell>{payment.source}</TableCell>
                              <TableCell>
                                <Typography 
                                  variant="body2" 
                                  sx={{ fontWeight: 600, color: 'success.main' }}
                                >
                                  {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : payment.amount} $
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={payment.status === 'completed' ? 'Complété' : 'En attente'} 
                                  size="small"
                                  color={payment.status === 'completed' ? 'success' : 'warning'}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body2" color="text.secondary">
                                Aucun paiement récent
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
          </Grid>
        </Grid>
      </motion.div>
    );
  };

  // Composant pour la liste complète des filleuls
  const AllReferrals = () => {
    if (!stats) return null;
    
    const { all_referrals } = stats;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [generationFilter, setGenerationFilter] = useState('all');
    
    // Filtrer les filleuls
    const filteredReferrals = all_referrals.filter(referral => {
      const nameMatch = referral.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || referral.status === statusFilter;
      const generationMatch = generationFilter === 'all' || referral.generation.toString() === generationFilter;
      
      return nameMatch && statusMatch && generationMatch;
    });
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Liste complète des filleuls ({filteredReferrals.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <IconButton 
                    size="small" 
                    onClick={fetchStats}
                    sx={{ bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Rechercher un filleul..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flexGrow: 1, minWidth: '200px' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
                
                <TextField
                  select
                  label="Statut"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: '120px' }}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                </TextField>
                
                <TextField
                  select
                  label="Génération"
                  value={generationFilter}
                  onChange={(e) => setGenerationFilter(e.target.value)}
                  size="small"
                  sx={{ minWidth: '120px' }}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="1">Génération 1</MenuItem>
                  <MenuItem value="2">Génération 2</MenuItem>
                  <MenuItem value="3">Génération 3</MenuItem>
                  <MenuItem value="4">Génération 4</MenuItem>
                </TextField>
              </Box>
              
              <TableContainer component={Paper} sx={tableStyle}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nom</TableCell>
                      <TableCell>Pack</TableCell>
                      <TableCell>Génération</TableCell>
                      <TableCell>Date d'achat</TableCell>
                      <TableCell>Date d'expiration</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReferrals.length > 0 ? (
                      filteredReferrals.map((referral, index) => (
                        <TableRow key={`referral-${index}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  bgcolor: 'primary.main',
                                  fontSize: '0.875rem',
                                  mr: 1
                                }}
                              >
                                {referral.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">
                                {referral.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{referral.pack_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`Gen ${referral.generation}`} 
                              size="small"
                              sx={{ 
                                bgcolor: 
                                  referral.generation === 1 ? 'primary.main' : 
                                  referral.generation === 2 ? 'success.main' : 
                                  referral.generation === 3 ? 'warning.main' : 'error.main',
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>{referral.purchase_date}</TableCell>
                          <TableCell>{referral.expiry_date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={referral.status === 'active' ? 'Actif' : 'Inactif'} 
                              size="small"
                              color={referral.status === 'active' ? 'success' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucun filleul ne correspond à vos critères de recherche
                            </Typography>
                          </Box>
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isFullScreen}
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? '#1f2937' : '#f8f9fa',
          backgroundImage: 'none',
          borderRadius: isFullScreen ? 0 : 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: isDarkMode ? '#1f2937' : '#f8f9fa',
        borderBottom: 1,
        borderColor: 'divider',
        p: 2
      }}>
        <div>Statistiques et Performances</div>
        <IconButton
          onClick={() => setIsFullScreen(!isFullScreen)}
          sx={{ 
            ml: 1,
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: isDarkMode ? 'grey.300' : 'grey.700',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        bgcolor: isDarkMode ? '#1f2937' : '#f8f9fa',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        }
      }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', minHeight: '90vh' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: isDarkMode ? '#1f2937' : '#f8f9fa',
                '& .MuiTab-root': {
                  color: isDarkMode ? 'grey.400' : 'text.secondary',
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 3,
                  '&.Mui-selected': {
                    color: isDarkMode ? 'common.white' : 'primary.main',
                    fontWeight: 600
                  }
                }
              }}
            >
              <Tab label="Statistiques générales" />
              <Tab label="Progression et performances" />
              <Tab label="Activités des filleuls" />
              <Tab label="Graphiques et visualisations" />
              <Tab label="Informations financières" />
              <Tab label="Liste complète des filleuls" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {currentTab === 0 && <GeneralStats />}
              {currentTab === 1 && <ProgressionStats />}
              {currentTab === 2 && <ReferralActivities />}
              {currentTab === 3 && <Visualizations />}
              {currentTab === 4 && <FinancialInfo />}
              {currentTab === 5 && <AllReferrals />}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        bgcolor: isDarkMode ? '#1f2937' : '#f8f9fa',
        borderTop: 1,
        borderColor: 'divider',
        p: 2
      }}>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackStatsModal;
