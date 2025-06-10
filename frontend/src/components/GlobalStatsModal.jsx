import React, { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from '../utils/axios';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GlobalStatsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [currentTab, setCurrentTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open]);

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

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Nombre total de filleuls
              </Typography>
              <Typography variant="h4">
                {stats?.general_stats.total_referrals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filleuls par génération (tous packs confondus)
              </Typography>
              <Grid container spacing={2}>
                {stats?.general_stats.referrals_by_generation.map((count, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <Typography variant="subtitle1">
                      {index + 1}ère génération
                    </Typography>
                    <Typography variant="h5">{count}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Meilleure génération
              </Typography>
              <Typography variant="h5" color="primary">
                {stats?.general_stats.best_generation}ère génération
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Génération la plus rentable
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Meilleur mois
              </Typography>
              <Typography variant="h5" color="primary">
                {bestMonth.amount.toFixed(2)} $
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {bestMonth.month}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut des filleuls
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Actifs</Typography>
                  <Typography variant="h5">
                    {stats?.general_stats.active_referrals}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1">Inactifs</Typography>
                  <Typography variant="h5">
                    {stats?.general_stats.inactive_referrals}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Composant pour la progression et performances
  const ProgressionStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
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
        <Card>
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
        <Card>
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
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.packs_performance.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell>{pack.name}</TableCell>
                      <TableCell>{pack.total_referrals}</TableCell>
                      <TableCell>{pack.total_commissions} $</TableCell>
                      <TableCell>
                        <Chip
                          label={pack.performance_status}
                          color={pack.performance_status === 'Excellent' ? 'success' : 
                                pack.performance_status === 'Bon' ? 'primary' : 'default'}
                        />
                      </TableCell>
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

  // Composant pour les activités des filleuls
  const ReferralActivities = () => (
    <TableContainer component={Paper}>
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
              <TableCell>{referral.generation}ère</TableCell>
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
  );

  // Composant pour les graphiques et visualisations
  const Visualizations = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
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
        <Card>
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
  const FinancialInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total des commissions (tous packs)
            </Typography>
            <Typography variant="h4">
              {stats?.financial_info.total_commission} $
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Derniers paiements reçus
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Pack</TableCell>
                    <TableCell>Génération</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.financial_info.latest_payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.amount} $</TableCell>
                      <TableCell>{payment.pack_name}</TableCell>
                      <TableCell>{payment.level}</TableCell>
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isFullScreen ? false : "lg"}
      fullWidth
      fullScreen={isFullScreen}
      PaperProps={{
        sx: {
          minHeight: isFullScreen ? '100vh' : '80vh',
          maxHeight: isFullScreen ? '100vh' : '80vh',
          bgcolor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        color: isDarkMode ? 'grey.100' : 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>Statistiques Globales</div>
        <IconButton
          onClick={() => setIsFullScreen(!isFullScreen)}
          sx={{ ml: 1 }}
        >
          {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ 
        bgcolor: 'transparent',
        color: isDarkMode ? 'grey.100' : 'text.primary',
        p: 0,
        '& .MuiCard-root': {
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        '& .MuiTableContainer-root': {
          bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        '& .MuiTableCell-root': {
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          color: isDarkMode ? 'grey.300' : 'inherit'
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
                bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                '& .MuiTab-root': {
                  color: isDarkMode ? 'grey.400' : 'text.secondary',
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 3,
                  '&.Mui-selected': {
                    color: isDarkMode ? 'primary.light' : 'primary.main'
                  }
                }
              }}
            >
              <Tab label="Statistiques générales" />
              <Tab label="Progression et performances" />
              <Tab label="Activités des filleuls" />
              <Tab label="Graphiques et visualisations" />
              <Tab label="Informations financières" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {currentTab === 0 && <GeneralStats />}
              {currentTab === 1 && <ProgressionStats />}
              {currentTab === 2 && <ReferralActivities />}
              {currentTab === 3 && <Visualizations />}
              {currentTab === 4 && <FinancialInfo />}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        borderTop: 1,
        borderColor: 'divider',
        p: 2
      }}>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GlobalStatsModal; 