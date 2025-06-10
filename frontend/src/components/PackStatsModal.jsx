import React, { useState, useEffect, useMemo } from 'react';
import axios from '../utils/axios';
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
  Tooltip,
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
  Tooltip,
  Legend
);

const PackStatsModal = ({ open, onClose, packId }) => {
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
    if (open && packId) {
      fetchStats();
    }
  }, [open, packId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/packs/${packId}/detailed-stats`);
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
        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#fff' : '#000',
        bodyColor: isDarkMode ? '#e0e0e0' : '#333',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 3,
        usePointStyle: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          lineWidth: 0.5
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          padding: 8
        }
      },
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          lineWidth: 0.5
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          padding: 8
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.3,
        borderWidth: 2
      },
      bar: {
        borderWidth: 0,
        borderRadius: 4
      }
    }
  };

  // Composant pour les statistiques générales
  const GeneralStats = () => {
    // Trouver le mois avec le plus de gains
    const bestMonth = Object.entries(stats?.progression?.monthly_commissions || {})
      .reduce((best, [month, amount]) => {
        const currentAmount = parseFloat(amount);
        return currentAmount > (best.amount || 0) 
          ? { month, amount: currentAmount } 
          : best;
      }, { month: '', amount: 0 });

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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>F</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Nombre total de filleuls
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                    {stats?.general_stats.total_referrals || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Répartis sur {stats?.general_stats.referrals_by_generation?.length || 0} générations
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>G</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Filleuls par génération
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {stats?.general_stats.referrals_by_generation?.map((count, index) => (
                      <Grid item xs={6} sm={3} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '10px', 
                          bgcolor: isDarkMode ? `rgba(${index * 30}, ${100 + index * 20}, ${150 + index * 30}, 0.2)` : `rgba(${index * 30}, ${100 + index * 20}, ${150 + index * 30}, 0.1)`,
                          border: '1px solid',
                          borderColor: isDarkMode ? `rgba(${index * 30}, ${100 + index * 20}, ${150 + index * 30}, 0.3)` : `rgba(${index * 30}, ${100 + index * 20}, ${150 + index * 30}, 0.2)`,
                          textAlign: 'center'
                        }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {index + 1}ère génération
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>M</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Meilleure génération
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 1 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>$</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Meilleur mois
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 1 }}>
                    {bestMonth.amount.toFixed(2)}$
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>S</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Statut des filleuls
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '10px', 
                        bgcolor: isDarkMode ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.2)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#81c784' : '#2e7d32', mb: 1 }}>
                          {stats?.general_stats.active_referrals || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Actifs
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: '10px', 
                        bgcolor: isDarkMode ? 'rgba(211, 47, 47, 0.2)' : 'rgba(211, 47, 47, 0.1)',
                        border: '1px solid',
                        borderColor: isDarkMode ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.2)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#e57373' : '#d32f2f', mb: 1 }}>
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>I</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Évolution des inscriptions
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(stats?.progression.monthly_signups || {}),
                      datasets: [
                        {
                          label: 'Nouveaux filleuls',
                          data: Object.values(stats?.progression.monthly_signups || {}),
                          borderColor: theme.palette.primary.main,
                          backgroundColor: isDarkMode ? `${theme.palette.primary.main}33` : `${theme.palette.primary.main}22`,
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={chartOptions}
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>G</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Évolution des gains
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(stats?.progression.monthly_commissions || {}),
                      datasets: [
                        {
                          label: 'Commissions ($)',
                          data: Object.values(stats?.progression.monthly_commissions || {}),
                          borderColor: theme.palette.success.main,
                          backgroundColor: isDarkMode ? `${theme.palette.success.main}33` : `${theme.palette.success.main}22`,
                          fill: true,
                          tension: 0.4
                        }
                      ]
                    }}
                    options={chartOptions}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>T</Typography>
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Top Filleul
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: '10px', 
                    bgcolor: isDarkMode ? 'rgba(237, 108, 2, 0.2)' : 'rgba(237, 108, 2, 0.1)',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(237, 108, 2, 0.3)' : 'rgba(237, 108, 2, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {stats.progression.top_referral.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        A recruté {stats.progression.top_referral.recruit_count} personnes
                      </Typography>
                    </Box>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: theme.palette.warning.main,
                        fontSize: '1.5rem',
                        fontWeight: 700
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card sx={cardStyle}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>A</Typography>
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
                    <TableRow key={referral.id || index} sx={{
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                      }
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1.5, 
                              bgcolor: `hsl(${index * 40}, 70%, ${isDarkMode ? '65%' : '50%'})`,
                              fontSize: '0.875rem'
                            }}
                          >
                            {referral.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {referral.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{referral.pack_name}</TableCell>
                      <TableCell>{referral.purchase_date}</TableCell>
                      <TableCell>{referral.expiry_date}</TableCell>
                      <TableCell>{referral.validity_months?.toFixed(0) || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={referral.status === 'active' ? 'Actif' : 'Inactif'}
                          color={referral.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: '6px'
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>I</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Inscriptions par mois
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Bar
                    data={{
                      labels: Object.keys(stats?.progression.monthly_signups || {}),
                      datasets: [
                        {
                          label: 'Inscriptions',
                          data: Object.values(stats?.progression.monthly_signups || {}),
                          backgroundColor: Array(12).fill().map((_, i) => 
                            isDarkMode 
                              ? `rgba(${25 + i * 15}, ${100 + i * 10}, ${200 - i * 10}, 0.7)`
                              : `rgba(${25 + i * 15}, ${100 + i * 10}, ${200 - i * 10}, 0.7)`
                          ),
                          borderRadius: 6,
                          maxBarThickness: 40
                        }
                      ]
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          display: false
                        },
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.y} filleuls`;
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
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>G</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Tendance des gains (6 derniers mois)
                  </Typography>
                </Box>
                <Box sx={{ height: 300, p: 1 }}>
                  <Line
                    data={{
                      labels: Object.keys(stats?.progression.monthly_commissions || {}),
                      datasets: [
                        {
                          label: 'Gains ($)',
                          data: Object.values(stats?.progression.monthly_commissions || {}),
                          borderColor: theme.palette.success.main,
                          backgroundColor: isDarkMode 
                            ? `${theme.palette.success.main}33` 
                            : `${theme.palette.success.main}22`,
                          tension: 0.4,
                          fill: true,
                          pointBackgroundColor: theme.palette.success.main,
                          pointBorderColor: isDarkMode ? '#121212' : '#fff',
                          pointBorderWidth: 2,
                          pointRadius: 5,
                          pointHoverRadius: 7
                        }
                      ]
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.y.toFixed(2)} $`;
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
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>B</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Bonus sur délais - Progression hebdomadaire
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: '10px', 
                  bgcolor: isDarkMode ? 'rgba(3, 169, 244, 0.1)' : 'rgba(3, 169, 244, 0.05)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(3, 169, 244, 0.2)' : 'rgba(3, 169, 244, 0.1)',
                  mb: 2
                }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Filleuls cette semaine
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                          {stats?.bonus_stats?.weekly_referrals || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Bonus actuel
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                          {stats?.bonus_stats?.bonus_rates || 0}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {stats?.bonus_stats?.next_threshold > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progression vers le prochain palier ({stats.bonus_stats.next_threshold} filleuls)
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {stats.bonus_stats.current_progress}%
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        width: '100%', 
                        height: 10, 
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}>
                        <Box 
                          sx={{ 
                            width: `${stats.bonus_stats.current_progress}%`, 
                            height: '100%', 
                            bgcolor: theme.palette.info.main,
                            borderRadius: 5,
                            transition: 'width 1s ease-in-out'
                          }} 
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );

  // Composant pour les informations financières
  const FinancialInfo = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>$</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Total des commissions
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 1 }}>
                  {stats?.financial_info.total_commission?.toFixed(2) || 0} $
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Montant total des commissions générées par vos filleuls
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={6}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>P</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Points bonus
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 1 }}>
                  {stats?.points_bonus || 0} Points
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Points cumulés grâce au système de bonus sur délais
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Card sx={cardStyle}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>P</Typography>
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Derniers paiements reçus
                  </Typography>
                </Box>
                {stats?.financial_info.latest_payments?.length > 0 ? (
                  <TableContainer component={Paper} sx={tableStyle}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Montant</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Génération</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats?.financial_info.latest_payments.map((payment, index) => (
                          <TableRow key={payment.id || index} sx={{
                            '&:hover': {
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                            }
                          }}>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: theme.palette.success.main 
                                }}
                              >
                                {payment.amount} $
                              </Typography>
                            </TableCell>
                            <TableCell>{payment.source}</TableCell>
                            <TableCell>
                              <Chip
                                label={`Gen ${payment.level}`}
                                size="small"
                                sx={{ 
                                  bgcolor: isDarkMode 
                                    ? `rgba(${payment.level * 30}, ${100 + payment.level * 20}, ${150 + payment.level * 30}, 0.2)` 
                                    : `rgba(${payment.level * 30}, ${100 + payment.level * 20}, ${150 + payment.level * 30}, 0.1)`,
                                  color: isDarkMode 
                                    ? `rgb(${payment.level * 30 + 100}, ${100 + payment.level * 20 + 50}, ${150 + payment.level * 30 + 50})` 
                                    : `rgb(${payment.level * 30}, ${100 + payment.level * 20}, ${150 + payment.level * 30})`,
                                  border: '1px solid',
                                  borderColor: isDarkMode 
                                    ? `rgba(${payment.level * 30}, ${100 + payment.level * 20}, ${150 + payment.level * 30}, 0.3)` 
                                    : `rgba(${payment.level * 30}, ${100 + payment.level * 20}, ${150 + payment.level * 30}, 0.2)`,
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 3 }}>
                    <Typography color="text.secondary">
                      Aucun paiement récent à afficher
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );

  // Composant pour les filtres et la recherche
  const FiltersAndSearch = ({ onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
      start: '',
      end: ''
    });

    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
      onFilterChange({ searchTerm: e.target.value, dateRange });
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
          <Card sx={{
            ...cardStyle,
            mb: 3,
            borderLeft: '4px solid',
            borderLeftColor: theme.palette.primary.main
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>F</Typography>
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Filtres et recherche
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Date de début"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Date de fin"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setDateRange({ start: '', end: '' });
                    onFilterChange({ searchTerm: '', dateRange: { start: '', end: '' } });
                  }}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  // Composant pour la liste complète des filleuls
  const AllReferrals = () => {
    const [filters, setFilters] = useState({
      searchTerm: '',
      dateRange: { start: '', end: '' }
    });
    
    // Fonction pour convertir une date au format français (DD/MM/YYYY) en objet Date
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === 'N/A') return null;
      
      // Format français: DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript
      const year = parseInt(parts[2], 10);
      
      return new Date(year, month, day);
    };
    
    const filteredReferrals = useMemo(() => {
      if (!stats?.all_referrals) return [];
      
      return stats.all_referrals.filter(referral => {
        // Filtre par recherche
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = !filters.searchTerm || 
                            referral.name.toLowerCase().includes(searchLower) ||
                            referral.pack_name.toLowerCase().includes(searchLower);
        
        // Filtre par date de début
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const purchaseDate = parseDate(referral.purchase_date);
        const matchesStartDate = !startDate || !purchaseDate || purchaseDate >= startDate;
        
        // Filtre par date de fin
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
        const matchesEndDate = !endDate || !purchaseDate || purchaseDate <= endDate;
        
        return matchesSearch && matchesStartDate && matchesEndDate;
      });
    }, [stats?.all_referrals, filters]);
    
    const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
    };
    
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <FiltersAndSearch onFilterChange={handleFilterChange} />
        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>F</Typography>
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  Liste complète des filleuls
                </Typography>
              </Box>
              
              {filteredReferrals.length > 0 ? (
                <TableContainer component={Paper} sx={tableStyle}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Nom du pack</TableCell>
                        <TableCell>Date d'achat</TableCell>
                        <TableCell>Date d'expiration</TableCell>
                        <TableCell>Durée (mois)</TableCell>
                        <TableCell>Génération</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredReferrals.map((referral, index) => (
                        <TableRow key={referral.id || index} sx={{
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                          }
                        }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  mr: 1.5, 
                                  bgcolor: `hsl(${index * 40}, 70%, ${isDarkMode ? '65%' : '50%'})`,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {referral.name?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {referral.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{referral.pack_name}</TableCell>
                          <TableCell>{referral.purchase_date}</TableCell>
                          <TableCell>{referral.expiry_date}</TableCell>
                          <TableCell>{referral.validity_months?.toFixed(0) || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={`Gen ${referral.generation}`}
                              size="small"
                              sx={{ 
                                bgcolor: isDarkMode 
                                  ? `rgba(${referral.generation * 30}, ${100 + referral.generation * 20}, ${150 + referral.generation * 30}, 0.2)` 
                                  : `rgba(${referral.generation * 30}, ${100 + referral.generation * 20}, ${150 + referral.generation * 30}, 0.1)`,
                                color: isDarkMode 
                                  ? `rgb(${referral.generation * 30 + 100}, ${100 + referral.generation * 20 + 50}, ${150 + referral.generation * 30 + 50})` 
                                  : `rgb(${referral.generation * 30}, ${100 + referral.generation * 20}, ${150 + referral.generation * 30})`,
                                border: '1px solid',
                                borderColor: isDarkMode 
                                  ? `rgba(${referral.generation * 30}, ${100 + referral.generation * 20}, ${150 + referral.generation * 30}, 0.3)` 
                                  : `rgba(${referral.generation * 30}, ${100 + referral.generation * 20}, ${150 + referral.generation * 30}, 0.2)`,
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={referral.status === 'active' ? 'Actif' : 'Inactif'}
                              color={referral.status === 'active' ? 'success' : 'default'}
                              size="small"
                              sx={{ 
                                fontWeight: 500,
                                borderRadius: '6px'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: '10px',
                  bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                  border: '1px dashed',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun filleul ne correspond à vos critères de recherche
                  </Typography>
                </Box>
              )}
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
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }
      }}
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
          sx={{ ml: 1 }}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>Chargement...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
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
