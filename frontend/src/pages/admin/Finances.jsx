import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
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
  ListItemText
} from '@mui/material';
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
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';

// Composant principal
const Finances = () => {
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // États pour les données
  const [transactions, setTransactions] = useState([]);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemBalance, setSystemBalance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statsByType, setStatsByType] = useState([]);
  const [statsByPeriod, setStatsByPeriod] = useState([]);
  
  // États pour les points bonus
  const [bonusPointsHistory, setBonusPointsHistory] = useState([]);
  const [bonusPointsHistoryAll, setBonusPointsHistoryAll] = useState([]); // Toutes les données non filtrées
  const [bonusPointsTypes, setBonusPointsTypes] = useState([]);
  const [bonusPointsStats, setBonusPointsStats] = useState(null);
  const [bonusPointsStatsOriginal, setBonusPointsStatsOriginal] = useState(null); // Données statistiques originales
  const [loadingBonusPoints, setLoadingBonusPoints] = useState(true);
  const [errorBonusPoints, setErrorBonusPoints] = useState(null);

  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // États pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    packId: '',
    searchTerm: ''
  });

  // États pour les onglets
  const [activeTab, setActiveTab] = useState(0);
  const [activeBonusTab, setActiveBonusTab] = useState(0);

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
    fetchBonusPointsTypes();
    fetchBonusPointsHistory();
    fetchBonusPointsStats();
  }, []);

  // Appliquer les filtres lorsqu'ils changent
  useEffect(() => {
    if (!loading) {
      fetchTransactions();
      fetchStatsByType();
      fetchStatsByPeriod();
      
      // Pour les points bonus, on applique les filtres localement
      if (bonusPointsHistoryAll.length > 0) {
        applyLocalBonusPointsFilters();
      } else {
        // Si les données n'ont pas encore été chargées, on les récupère
        fetchBonusPointsHistory();
      }
      
      if (bonusPointsStatsOriginal) {
        applyLocalBonusPointsStatsFilters();
      } else {
        fetchBonusPointsStats();
      }
    }
  }, [filters]);

  // Fonction pour récupérer les transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await axios.get('/api/admin/finances', { params });
      
      if (response.data.success) {
        setTransactions(response.data.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des transactions');
      }
    } catch (err) {
      setError('Erreur lors du chargement des transactions: ' + (err.response?.data?.message || err.message));
      console.error('Erreur lors du chargement des transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les types de transactions
  const fetchTransactionTypes = async () => {
    try {
      const response = await axios.get('/api/admin/finances/transaction-types');
      
      if (response.data.success) {
        setTransactionTypes(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des types de transactions:', err);
    }
  };

  // Fonction pour récupérer le solde du système
  const fetchSystemBalance = async () => {
    try {
      const response = await axios.get('/api/admin/finances/system-balance');
      
      if (response.data.success) {
        setSystemBalance(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du solde du système:', err);
    }
  };

  // Fonction pour récupérer le résumé des finances
  const fetchSummary = async () => {
    try {
      const params = {};
      
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await axios.get('/api/admin/finances/summary', { params });
      
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du résumé des finances:', err);
    }
  };

  // Fonction pour récupérer les statistiques par type
  const fetchStatsByType = async () => {
    try {
      const params = {};
      
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await axios.get('/api/admin/finances/stats-by-type', { params });
      
      if (response.data.success) {
        setStatsByType(response.data.data.stats);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques par type:', err);
    }
  };

  // Fonction pour récupérer les statistiques par période
  const fetchStatsByPeriod = async () => {
    try {
      const params = {
        period: 'month'
      };
      
      if (filters.type) params.type = filters.type;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;
      
      const response = await axios.get('/api/admin/finances/stats-by-period', { params });
      
      if (response.data.success) {
        setStatsByPeriod(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques par période:', err);
    }
  };

  // Fonction pour récupérer l'historique des points bonus
  const fetchBonusPointsHistory = async () => {
    try {
      setLoadingBonusPoints(true);
      
      // Récupérer toutes les données sans filtre
      const response = await axios.get('/api/admin/finances/bonus-points-history');
      
      if (response.data.success) {
        const allData = response.data.data.data;
        setBonusPointsHistoryAll(allData);
        
        // Appliquer les filtres localement sur les données récupérées
        applyLocalBonusPointsFilters(allData);
        setErrorBonusPoints(null);
      } else {
        setErrorBonusPoints(response.data.message || 'Erreur lors du chargement de l\'historique des points bonus');
      }
    } catch (err) {
      setErrorBonusPoints('Erreur lors du chargement de l\'historique des points bonus: ' + (err.response?.data?.message || err.message));
      console.error('Erreur lors du chargement de l\'historique des points bonus:', err);
    } finally {
      setLoadingBonusPoints(false);
    }
  };
  
  // Fonction pour appliquer les filtres localement sur l'historique des points bonus
  const applyLocalBonusPointsFilters = (data = null) => {
    const dataToFilter = data || bonusPointsHistoryAll;
    
    if (!dataToFilter.length) return;
    
    let filteredData = [...dataToFilter];
    
    // Filtrer par type si spécifié
    if (filters.type) {
      filteredData = filteredData.filter(item => item.type === filters.type);
    }
    
    // Filtrer par ID utilisateur si spécifié
    if (filters.userId) {
      filteredData = filteredData.filter(item => item.user_id === parseInt(filters.userId));
    }
    
    // Filtrer par ID pack si spécifié
    if (filters.packId) {
      filteredData = filteredData.filter(item => item.pack_id === parseInt(filters.packId));
    }
    
    // Filtrer par date de début si spécifiée
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filteredData = filteredData.filter(item => new Date(item.created_at) >= dateFrom);
    }
    
    // Filtrer par date de fin si spécifiée
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // Fin de journée
      filteredData = filteredData.filter(item => new Date(item.created_at) <= dateTo);
    }
    
    // Recherche par terme si spécifié
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        return (
          (item.description && item.description.toLowerCase().includes(searchTerm)) ||
          (item.id.toString().includes(searchTerm)) ||
          (item.user && item.user.name && item.user.name.toLowerCase().includes(searchTerm)) ||
          (item.user && item.user.email && item.user.email.toLowerCase().includes(searchTerm)) ||
          (item.pack && item.pack.name && item.pack.name.toLowerCase().includes(searchTerm))
        );
      });
    }
    
    setBonusPointsHistory(filteredData);
  };

  // Fonction pour récupérer les types de points bonus
  const fetchBonusPointsTypes = async () => {
    try {
      const response = await axios.get('/api/admin/finances/bonus-points-types');
      
      if (response.data.success) {
        setBonusPointsTypes(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des types de points bonus:', err);
    }
  };

  // Fonction pour récupérer les statistiques des points bonus
  const fetchBonusPointsStats = async () => {
    try {
      setLoadingBonusPoints(true);
      
      // Récupérer toutes les données sans filtre
      const response = await axios.get('/api/admin/finances/bonus-points-stats');
      
      if (response.data.success) {
        const statsData = response.data.data;
        setBonusPointsStatsOriginal(statsData);
        
        // Appliquer les filtres localement sur les données récupérées
        applyLocalBonusPointsStatsFilters(statsData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques des points bonus:', err);
    } finally {
      setLoadingBonusPoints(false);
    }
  };
  
  // Fonction pour appliquer les filtres localement sur les statistiques des points bonus
  const applyLocalBonusPointsStatsFilters = (data = null) => {
    const statsData = data || bonusPointsStatsOriginal;
    
    if (!statsData) return;
    
    // Créer une copie des données pour les filtrer
    let filteredStats = JSON.parse(JSON.stringify(statsData));
    
    // Si des filtres sont appliqués, on filtre les données correspondantes dans les statistiques
    if (filters.userId || filters.packId || filters.dateFrom || filters.dateTo) {
      // Filtrer les statistiques par pack si nécessaire
      if (filters.packId) {
        filteredStats.stats_by_pack = filteredStats.stats_by_pack.filter(
          pack => pack.pack_id === parseInt(filters.packId)
        );
      }
      
      // Filtrer les top utilisateurs si nécessaire
      if (filters.userId) {
        filteredStats.top_users = filteredStats.top_users.filter(
          user => user.user_id === parseInt(filters.userId)
        );
      }
      
      // Note: Les filtres de date et les totaux sont déjà gérés par le backend
      // car ils nécessitent des calculs complexes sur l'ensemble des données
    }
    
    setBonusPointsStats(filteredStats);
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      userId: '',
      packId: '',
      searchTerm: ''
    });
    
    // Réinitialiser les données filtrées avec les données originales
    if (bonusPointsHistoryAll.length > 0) {
      setBonusPointsHistory(bonusPointsHistoryAll);
    }
    
    if (bonusPointsStatsOriginal) {
      setBonusPointsStats(bonusPointsStatsOriginal);
    }
  };

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  // Fonction pour exporter les transactions au format Excel
  const exportTransactionsToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = transactions.map(transaction => ({
      ID: transaction.id,
      Type: transaction.type === "sales" ? "vente" : 
            transaction.type === "transfer" ? "transfert des fonds" : 
            transaction.type === "withdrawal" ? "retrait des fonds" : 
            transaction.type === "reception" ? "dépôt des fonds" : 
            transaction.type,
      Montant: transaction.amount,
      Statut: transaction.status === "completed" ? "complété" : 
              transaction.status === "pending" ? "en attente" : 
              transaction.status === "failed" ? "échoué" : 
              transaction.status,
      Date: formatDate(transaction.created_at),
      'Date de création': format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Date de mise à jour': format(new Date(transaction.updated_at), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    // Génération du nom de fichier avec date
    const fileName = `transactions_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    
    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };
  
  // Fonction pour exporter les statistiques par type au format Excel
  const exportStatsToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = statsByType.map(stat => ({
      Type: stat.type === "sales" ? "vente" : 
            stat.type === "transfer" ? "transfert des fonds" : 
            stat.type === "withdrawal" ? "retrait des fonds" : 
            stat.type === "reception" ? "dépôt des fonds" : 
            stat.type,
      Nombre: stat.count,
      'Montant total': stat.total_amount,
      'Première transaction': formatDate(stat.first_transaction),
      'Dernière transaction': formatDate(stat.last_transaction)
    }));
    
    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistiques");
    
    // Génération du nom de fichier avec date
    const fileName = `statistiques_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    
    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  // Fonction pour exporter l'historique des points bonus au format Excel
  const exportBonusPointsHistoryToExcel = () => {
    // Préparation des données pour l'export
    const dataToExport = bonusPointsHistory.map(entry => ({
      ID: entry.id,
      Utilisateur: entry.user?.name || 'N/A',
      Pack: entry.pack?.name || 'N/A',
      Points: entry.points,
      Type: entry.type === "gain" ? "Gain" : entry.type === "conversion" ? "Conversion" : entry.type,
      Description: entry.description || 'N/A',
      Date: formatDate(entry.created_at),
      'Date de création': format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Date de mise à jour': format(new Date(entry.updated_at), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    // Création d'une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Points Bonus");
    
    // Génération du nom de fichier avec date
    const fileName = `points_bonus_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    
    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  // Fonction pour exporter les statistiques des points bonus au format Excel
  const exportBonusPointsStatsToExcel = () => {
    if (!bonusPointsStats) return;

    // Préparation des données pour l'export par type
    const dataByType = bonusPointsStats.stats_by_type.map(stat => ({
      Type: stat.type === "gain" ? "Gain" : stat.type === "conversion" ? "Conversion" : stat.type,
      Nombre: stat.count,
      'Points totaux': stat.total_points
    }));
    
    // Préparation des données pour l'export par pack
    const dataByPack = bonusPointsStats.stats_by_pack.map(stat => ({
      Pack: stat.pack_name,
      Nombre: stat.count,
      'Points totaux': stat.total_points
    }));
    
    // Préparation des données pour l'export des top utilisateurs
    const dataTopUsers = bonusPointsStats.top_users.map(user => ({
      Utilisateur: user.user_name,
      Email: user.user_email,
      'Points disponibles': user.total_points
    }));
    
    // Création des feuilles de calcul
    const worksheetByType = XLSX.utils.json_to_sheet(dataByType);
    const worksheetByPack = XLSX.utils.json_to_sheet(dataByPack);
    const worksheetTopUsers = XLSX.utils.json_to_sheet(dataTopUsers);
    
    // Création d'un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetByType, "Par Type");
    XLSX.utils.book_append_sheet(workbook, worksheetByPack, "Par Pack");
    XLSX.utils.book_append_sheet(workbook, worksheetTopUsers, "Top Utilisateurs");
    
    // Génération du nom de fichier avec date
    const fileName = `stats_points_bonus_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    
    // Téléchargement du fichier
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Finances
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Consultez et analysez les transactions financières du système
      </Typography>
      
      {/* Cartes de résumé financier */}
      {systemBalance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              boxShadow: 'none',
              border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
              borderRadius: 3,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'primary.main', 
                opacity: 0.1 
              }} />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Solde actuel
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    borderRadius: '50%'
                  }}>
                    <AccountBalanceIcon sx={{ fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 700,
                  color: isDarkMode ? '#fff' : 'text.primary'
                }}>
                  {formatAmount(systemBalance.balance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              boxShadow: 'none',
              border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`,
              borderRadius: 3,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'success.main', 
                opacity: 0.1 
              }} />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Total des entrées
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'success.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    borderRadius: '50%'
                  }}>
                    <AttachMoneyIcon sx={{ fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 700,
                  color: isDarkMode ? '#fff' : 'text.primary'
                }}>
                  {formatAmount(systemBalance.total_in)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              boxShadow: 'none',
              border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`,
              borderRadius: 3,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'error.main', 
                opacity: 0.1 
              }} />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Total des sorties
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'error.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    borderRadius: '50%'
                  }}>
                    <MoneyOffIcon sx={{ fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 700,
                  color: isDarkMode ? '#fff' : 'text.primary'
                }}>
                  {formatAmount(systemBalance.total_out)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
              boxShadow: 'none',
              border: `1px solid ${isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)'}`,
              borderRadius: 3,
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                position: 'absolute', 
                top: -15, 
                right: -15, 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: 'info.main', 
                opacity: 0.1 
              }} />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" color="info.main" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Transactions
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'info.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    borderRadius: '50%'
                  }}>
                    <TrendingUpIcon sx={{ fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 700,
                  color: isDarkMode ? '#fff' : 'text.primary'
                }}>
                  {transactions.length > 0 ? transactions.length : '---'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Filtres */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: isDarkMode ? '#1f2937' : '#fff',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
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
          </Box>
        </Box>
        
        {showFilters && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2, 
            alignItems: 'center',
            mt: 2 
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                bgcolor: isDarkMode ? '#111827' : '#fff',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  },
                },
              }}
            >
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
                sx={{ 
                  color: isDarkMode ? '#fff' : 'inherit',
                  '& .MuiSelect-icon': {
                    color: isDarkMode ? '#fff' : 'inherit'
                  }
                }}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                {transactionTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type === "sales" ? "ventes" : type === "withdrawal" ? "retrait des fonds" : type === "purchase" ? "achat" : type === "transfer" ? "transfert des fonds" : type }</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                bgcolor: isDarkMode ? '#111827' : '#fff',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  },
                },
              }}
            >
              <InputLabel id="status-filter-label">Statut</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                label="Statut"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                sx={{ 
                  color: isDarkMode ? '#fff' : 'inherit',
                  '& .MuiSelect-icon': {
                    color: isDarkMode ? '#fff' : 'inherit'
                  }
                }}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
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
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                minWidth: 150,
                bgcolor: isDarkMode ? '#111827' : '#fff',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  },
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'inherit',
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#9ca3af' : 'inherit',
                },
              }}
            />
            
            <TextField
              label="Date de fin"
              type="date"
              size="small"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                minWidth: 150,
                bgcolor: isDarkMode ? '#111827' : '#fff',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  },
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : 'inherit',
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#9ca3af' : 'inherit',
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
              sx={{ ml: 'auto' }}
            >
              Appliquer
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Onglets */}
      <Paper sx={{ 
        p: 0, 
        mb: 3, 
        bgcolor: isDarkMode ? '#1f2937' : '#fff',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: isDarkMode ? '#374151' : 'divider',
            bgcolor: isDarkMode ? '#111827' : '#f8f9fa'
          }}
        >
          <Tab label="Transactions" />
          <Tab label="Statistiques par type" />
          <Tab label="Points Bonus" />
        </Tabs>
        
        {/* Tableau des transactions */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : transactions.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>Aucune transaction trouvée</Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportTransactionsToExcel}
                    sx={{ textTransform: 'none' }}
                  >
                    Exporter en Excel
                  </Button>
                </Box>
                <TableContainer sx={{
                  boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ 
                        bgcolor: isDarkMode ? '#111827' : '#f0f4f8',
                        '& th': { 
                          fontWeight: 'bold',
                          color: isDarkMode ? '#fff' : '#334155',
                          fontSize: '0.85rem',
                          padding: '12px 16px',
                          borderBottom: isDarkMode ? '1px solid #374151' : '2px solid #e2e8f0'
                        }
                      }}>
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
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((transaction) => (
                          <TableRow key={transaction.id} sx={{ 
                            '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                            borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                            '& td': { 
                              padding: '10px 16px',
                              color: isDarkMode ? '#fff' : '#475569'
                            }
                          }}>
                            <TableCell>{transaction.id}</TableCell>
                            <TableCell>
                              <Chip 
                                label={transaction.type === "sales" ? "vente" : transaction.type === "transfer" ? "transfert des fonds" : transaction.type === "withdrawal" ? "retrait des fonds" : transaction.type === "reception" ? "dépôt des fonds" : transaction.type} 
                                size="small"
                                sx={{ 
                                  bgcolor: (() => {
                                    switch(transaction.type) {
                                      case 'withdrawal': return isDarkMode ? '#4b5563' : '#e5e7eb';
                                      case 'commission de parrainage': return isDarkMode ? '#065f46' : '#d1fae5';
                                      case 'commission de retrait': return isDarkMode ? '#1e40af' : '#dbeafe';
                                      case 'frais de retrait': return isDarkMode ? '#9f1239' : '#fee2e2';
                                      case 'frais de transfert': return isDarkMode ? '#92400e' : '#fef3c7';
                                      case 'bonus': return isDarkMode ? '#4f46e5' : '#e0e7ff';
                                      case 'sales': return isDarkMode ? '#064e3b' : '#d1fae5';
                                      default: return isDarkMode ? '#1f2937' : '#f3f4f6';
                                    }
                                  })(),
                                  color: isDarkMode ? '#fff' : '#111'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ 
                              color: transaction.type === 'withdrawal' ? 'error.main' : 'success.main',
                              fontWeight: 'bold'
                            }}>
                              {formatAmount(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={transaction.status === "completed" ? "complété" : transaction.status === "pending" ? "en attente" : transaction.status === "failed" ? "échoué" : transaction.status} 
                                size="small"
                                sx={{ 
                                  bgcolor: (() => {
                                    switch(transaction.status) {
                                      case 'pending': return isDarkMode ? '#92400e' : '#fef3c7';
                                      case 'completed': return isDarkMode ? '#065f46' : '#d1fae5';
                                      case 'failed': return isDarkMode ? '#9f1239' : '#fee2e2';
                                      default: return isDarkMode ? '#1f2937' : '#f3f4f6';
                                    }
                                  })(),
                                  color: isDarkMode ? '#fff' : '#111'
                                }}
                              />
                            </TableCell>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenTransactionDetails(transaction)}
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
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#475569',
                    '& .MuiTablePagination-selectIcon': {
                      color: isDarkMode ? '#fff' : '#475569'
                    },
                    '& .MuiTablePagination-select': {
                      backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
                      borderRadius: 1,
                      padding: '4px 8px',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0'
                    },
                    '& .MuiTablePagination-actions button': {
                      color: isDarkMode ? '#fff' : '#475569',
                      '&:hover': {
                        backgroundColor: isDarkMode ? '#374151' : '#f1f5f9'
                      }
                    }
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
              <Alert severity="info" sx={{ mb: 2 }}>Aucune statistique disponible</Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportStatsToExcel}
                    sx={{ textTransform: 'none' }}
                  >
                    Exporter en Excel
                  </Button>
                </Box>
                <TableContainer sx={{
                  boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <Table size="small">
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: isDarkMode ? '#111827' : '#f0f4f8',
                      '& th': { 
                        fontWeight: 'bold',
                        color: isDarkMode ? '#fff' : '#334155',
                        fontSize: '0.85rem',
                        padding: '12px 16px',
                        borderBottom: isDarkMode ? '1px solid #374151' : '2px solid #e2e8f0'
                      }
                    }}>
                      <TableCell>Type</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Montant total</TableCell>
                      <TableCell>Première transaction</TableCell>
                      <TableCell>Dernière transaction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statsByType.map((stat) => (
                      <TableRow key={stat.type} sx={{ 
                        '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                        '& td': { 
                          padding: '10px 16px',
                          color: isDarkMode ? '#fff' : '#475569'
                        }
                      }}>
                        <TableCell>
                          <Chip 
                            label={stat.type === "sales" ? "vente" : stat.type === "transfer" ? "transfert des fonds" : stat.type === "withdrawal" ? "retrait des fonds" : stat.type === "reception" ? "dépôt des fonds" : stat.type} 
                            size="small"
                            sx={{ 
                              bgcolor: (() => {
                                switch(stat.type) {
                                  case 'withdrawal': return isDarkMode ? '#4b5563' : '#e5e7eb';
                                  case 'commission de parrainage': return isDarkMode ? '#065f46' : '#d1fae5';
                                  case 'commission de retrait': return isDarkMode ? '#1e40af' : '#dbeafe';
                                  case 'frais de retrait': return isDarkMode ? '#9f1239' : '#fee2e2';
                                  case 'frais de transfert': return isDarkMode ? '#92400e' : '#fef3c7';
                                  case 'bonus': return isDarkMode ? '#4f46e5' : '#e0e7ff';
                                  case 'sales': return isDarkMode ? '#064e3b' : '#d1fae5';
                                  default: return isDarkMode ? '#1f2937' : '#f3f4f6';
                                }
                              })(),
                              color: isDarkMode ? '#fff' : '#111'
                            }}
                          />
                        </TableCell>
                        <TableCell>{stat.count}</TableCell>
                        <TableCell sx={{ 
                          color: stat.type === 'withdrawal' ? 'error.main' : 'success.main',
                          fontWeight: 'bold'
                        }}>
                          {formatAmount(stat.total_amount)}
                        </TableCell>
                        <TableCell>{formatDate(stat.first_transaction)}</TableCell>
                        <TableCell>{formatDate(stat.last_transaction)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </>
            )}
          </Box>
        )}
        
        {/* Points Bonus */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            {/* Cartes de résumé des points bonus */}
            {bonusPointsStats && (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    bgcolor: isDarkMode ? 'rgba(79, 70, 229, 0.1)' : 'rgba(79, 70, 229, 0.05)',
                    boxShadow: 'none',
                    border: `1px solid ${isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.2)'}`,
                    borderRadius: 3,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -15, 
                      right: -15, 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main', 
                      opacity: 0.1 
                    }} />
                    <CardContent sx={{ position: 'relative', p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Points gagnés
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 36,
                          height: 36,
                          borderRadius: '50%'
                        }}>
                          <TrendingUpIcon sx={{ fontSize: '1.2rem' }} />
                        </Box>
                      </Box>
                      <Typography variant="h5" component="div" sx={{ 
                        fontSize: '1.4rem', 
                        fontWeight: 700,
                        color: isDarkMode ? '#fff' : 'text.primary'
                      }}>
                        {bonusPointsStats.total_points_gained || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                    boxShadow: 'none',
                    border: `1px solid ${isDarkMode ? 'rgba(31, 41, 223, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    borderRadius: 3,
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: isDarkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      top: -15, 
                      right: -15, 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main', 
                      opacity: 0.1 
                    }} />
                    <CardContent sx={{ position: 'relative', p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Points convertis
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'success.main',
                          color: 'white',
                          width: 36,
                          height: 36,
                          borderRadius: '50%'
                        }}>
                          <AttachMoneyIcon sx={{ fontSize: '1.2rem' }} />
                        </Box>
                      </Box>
                      <Typography variant="h5" component="div" sx={{ 
                        fontSize: '1.4rem', 
                        fontWeight: 700,
                        color: isDarkMode ? '#fff' : 'text.primary'
                      }}>
                        {bonusPointsStats.total_points_converted || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {/* Onglets pour l'historique et les statistiques des points bonus */}
            <Tabs 
              value={activeBonusTab}
              onChange={(e, newValue) => setActiveBonusTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: isDarkMode ? '#374151' : 'divider',
                bgcolor: isDarkMode ? '#111827' : '#f8f9fa',
                mb: 2
              }}
            >
              <Tab label="Historique des points" />
              <Tab label="Statistiques détaillées" />
            </Tabs>
            
            {/* Contenu des sous-onglets des points bonus */}
            {activeBonusTab === 0 && (
              /* Historique des points bonus */
              <Box>
                {/* Filtres spécifiques pour les points bonus */}
                <Paper sx={{ 
                  p: 2, 
                  mb: 3, 
                  bgcolor: isDarkMode ? '#1f2937' : '#fff',
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Filtres des points bonus
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
                    </Box>
                  </Box>
                  
                  {/* Zone de recherche toujours visible */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Rechercher par utilisateur, description ou ID"
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    variant="outlined"
                    sx={{ 
                      mb: 2,
                      bgcolor: isDarkMode ? '#111827' : '#fff',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#9ca3af' : 'inherit'
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : 'inherit'
                      }
                    }}
                  />
                  
                  {showFilters && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: 2, 
                      alignItems: 'center',
                      mt: 2 
                    }}>
                      <FormControl 
                        size="small" 
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                        }}
                      >
                        <InputLabel id="bonus-type-filter-label">Type de points</InputLabel>
                        <Select
                          labelId="bonus-type-filter-label"
                          value={filters.type}
                          label="Type de points"
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          sx={{ 
                            color: isDarkMode ? '#fff' : 'inherit',
                            '& .MuiSelect-icon': {
                              color: isDarkMode ? '#fff' : 'inherit'
                            }
                          }}
                        >
                          <MenuItem value=""><em>Tous</em></MenuItem>
                          {bonusPointsTypes.map((type) => (
                            <MenuItem key={type} value={type}>{type === "gain" ? "Gain" : type === "conversion" ? "Conversion" : type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl 
                        size="small" 
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                        }}
                      >
                        <InputLabel id="user-id-filter-label">ID Utilisateur</InputLabel>
                        <TextField
                          labelId="user-id-filter-label"
                          value={filters.userId}
                          onChange={(e) => handleFilterChange('userId', e.target.value)}
                          label="ID Utilisateur"
                          size="small"
                          type="number"
                          sx={{ 
                            minWidth: 150,
                            color: isDarkMode ? '#fff' : 'inherit',
                            '& .MuiInputBase-input': {
                              color: isDarkMode ? '#fff' : 'inherit'
                            }
                          }}
                        />
                      </FormControl>
                      
                      <FormControl 
                        size="small" 
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                        }}
                      >
                        <InputLabel id="pack-id-filter-label">ID Pack</InputLabel>
                        <TextField
                          labelId="pack-id-filter-label"
                          value={filters.packId}
                          onChange={(e) => handleFilterChange('packId', e.target.value)}
                          label="ID Pack"
                          size="small"
                          type="number"
                          sx={{ 
                            minWidth: 150,
                            color: isDarkMode ? '#fff' : 'inherit',
                            '& .MuiInputBase-input': {
                              color: isDarkMode ? '#fff' : 'inherit'
                            }
                          }}
                        />
                      </FormControl>
                      
                      <TextField
                        label="Date de début"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: isDarkMode ? '#fff' : 'inherit'
                          }
                        }}
                      />
                      
                      <TextField
                        label="Date de fin"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: isDarkMode ? '#fff' : 'inherit'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
                
                {loadingBonusPoints ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : errorBonusPoints ? (
                  <Alert severity="error" sx={{ mb: 2 }}>{errorBonusPoints}</Alert>
                ) : bonusPointsHistory.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>Aucun historique de points bonus trouvé</Alert>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileDownloadIcon />}
                        onClick={exportBonusPointsHistoryToExcel}
                        sx={{ textTransform: 'none' }}
                      >
                        Exporter en Excel
                      </Button>
                    </Box>
                    <TableContainer sx={{
                      boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ 
                            bgcolor: isDarkMode ? '#111827' : '#f0f4f8',
                            '& th': { 
                              fontWeight: 'bold',
                              color: isDarkMode ? '#fff' : '#334155',
                              fontSize: '0.85rem',
                              padding: '12px 16px',
                              borderBottom: isDarkMode ? '1px solid #374151' : '2px solid #e2e8f0'
                            }
                          }}>
                            <TableCell>ID</TableCell>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>Pack</TableCell>
                            <TableCell>Points</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bonusPointsHistory
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((entry) => (
                              <TableRow key={entry.id} sx={{ 
                                '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                                borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                                '& td': { 
                                  padding: '10px 16px',
                                  color: isDarkMode ? '#fff' : '#475569'
                                }
                              }}>
                                <TableCell>{entry.id}</TableCell>
                                <TableCell>{entry.user?.name || 'N/A'}</TableCell>
                                <TableCell>{entry.pack?.name || 'N/A'}</TableCell>
                                <TableCell sx={{ 
                                  fontWeight: 'bold',
                                  color: entry.type === 'gain' ? 'success.main' : 'error.main'
                                }}>
                                  {entry.points}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={entry.type === "gain" ? "Gain" : entry.type === "conversion" ? "Conversion" : entry.type} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: entry.type === 'gain' ? 
                                        (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : 
                                        (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                                      color: entry.type === 'gain' ? 'success.main' : 'error.main'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{entry.description || 'N/A'}</TableCell>
                                <TableCell>{formatDate(entry.created_at)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={bonusPointsHistory.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Lignes par page:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                      sx={{ 
                        color: isDarkMode ? '#fff' : 'inherit',
                        '& .MuiTablePagination-selectIcon': {
                          color: isDarkMode ? '#fff' : 'inherit'
                        }
                      }}
                    />
                  </>
                )}
              </Box>
            )}
            
            {activeBonusTab === 1 && bonusPointsStats && (
              /* Statistiques détaillées des points bonus */
              <Box>
                {/* Filtres spécifiques pour les statistiques des points bonus */}
                <Paper sx={{ 
                  p: 2, 
                  mb: 3, 
                  bgcolor: isDarkMode ? '#1f2937' : '#fff',
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Filtres des statistiques
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
                    </Box>
                  </Box>
                  
                  {showFilters && (
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: 2, 
                      alignItems: 'center',
                      mt: 2 
                    }}>
                      <FormControl 
                        size="small" 
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                        }}
                      >
                        <InputLabel id="user-id-stats-filter-label">ID Utilisateur</InputLabel>
                        <TextField
                          labelId="user-id-stats-filter-label"
                          value={filters.userId}
                          onChange={(e) => handleFilterChange('userId', e.target.value)}
                          label="ID Utilisateur"
                          size="small"
                          type="number"
                          sx={{ 
                            minWidth: 150,
                            color: isDarkMode ? '#fff' : 'inherit',
                            '& .MuiInputBase-input': {
                              color: isDarkMode ? '#fff' : 'inherit'
                            }
                          }}
                        />
                      </FormControl>
                      
                      <FormControl 
                        size="small" 
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                        }}
                      >
                        <InputLabel id="pack-id-stats-filter-label">ID Pack</InputLabel>
                        <TextField
                          labelId="pack-id-stats-filter-label"
                          value={filters.packId}
                          onChange={(e) => handleFilterChange('packId', e.target.value)}
                          label="ID Pack"
                          size="small"
                          type="number"
                          sx={{ 
                            minWidth: 150,
                            color: isDarkMode ? '#fff' : 'inherit',
                            '& .MuiInputBase-input': {
                              color: isDarkMode ? '#fff' : 'inherit'
                            }
                          }}
                        />
                      </FormControl>
                      
                      <TextField
                        label="Date de début"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: isDarkMode ? '#fff' : 'inherit'
                          }
                        }}
                      />
                      
                      <TextField
                        label="Date de fin"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ 
                          minWidth: 150,
                          bgcolor: isDarkMode ? '#111827' : '#fff',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: isDarkMode ? '#fff' : 'inherit'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportBonusPointsStatsToExcel}
                    sx={{ textTransform: 'none' }}
                  >
                    Exporter les statistiques
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  {/* Statistiques par type */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : '#fff',
                      borderRadius: 2,
                      boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Par type</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ 
                                bgcolor: isDarkMode ? '#111827' : '#c8dbcc',
                                '& th': { fontWeight: 'bold' }
                              }}>
                                <TableCell>Type</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Points totaux</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bonusPointsStats.stats_by_type.map((stat) => (
                                <TableRow key={stat.type} sx={{ 
                                  '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                                  borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                                  '& td': { 
                                    padding: '10px 16px',
                                    color: isDarkMode ? '#fff' : '#475569'
                                  }
                                }}>
                                  <TableCell>
                                    <Chip 
                                      label={stat.type === "gain" ? "Gain" : stat.type === "conversion" ? "Conversion" : stat.type} 
                                      size="small"
                                      sx={{ 
                                        bgcolor: stat.type === 'gain' ? 
                                          (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') : 
                                          (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                                        color: stat.type === 'gain' ? 'success.main' : 'error.main'
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{stat.count}</TableCell>
                                  <TableCell sx={{ 
                                    fontWeight: 'bold',
                                    color: stat.type === 'gain' ? 'success.main' : 'error.main'
                                  }}>
                                    {stat.total_points}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Statistiques par pack */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : '#fff',
                      borderRadius: 2,
                      boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Par pack</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ 
                                bgcolor: isDarkMode ? '#111827' : '#c8dbcc',
                                '& th': { fontWeight: 'bold' }
                              }}>
                                <TableCell>Pack</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Points totaux</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bonusPointsStats.stats_by_pack.map((stat) => (
                                <TableRow key={stat.pack_id} sx={{ 
                                  '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                                  borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                                  '& td': { 
                                    padding: '10px 16px',
                                    color: isDarkMode ? '#fff' : '#475569'
                                  }
                                }}>
                                  <TableCell>{stat.pack_name}</TableCell>
                                  <TableCell>{stat.count}</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold' }}>{stat.total_points}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Top utilisateurs */}
                  <Grid item xs={12}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : '#fff',
                      borderRadius: 2,
                      boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden',
                      mt: 2
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Top utilisateurs avec le plus de points</Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ 
                                bgcolor: isDarkMode ? '#111827' : '#c8dbcc',
                                '& th': { fontWeight: 'bold' }
                              }}>
                                <TableCell>Utilisateur</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Points disponibles</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bonusPointsStats.top_users.map((user) => (
                                <TableRow key={user.user_id} sx={{ 
                                  '&:hover': { bgcolor: isDarkMode ? '#374151' : '#f8fafc' },
                                  borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e2e8f0'}`,
                                  '& td': { 
                                    padding: '10px 16px',
                                    color: isDarkMode ? '#fff' : '#475569'
                                  }
                                }}>
                                  <TableCell>{user.user_name}</TableCell>
                                  <TableCell>{user.user_email}</TableCell>
                                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{user.total_points}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      {/* Modal de détails de transaction */}
      <Dialog
        open={openTransactionModal}
        onClose={handleCloseTransactionModal}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(5px)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? '#111827' : '#fff',
            color: isDarkMode ? '#fff' : 'inherit',
            borderRadius: 2,
            boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
        }}>
          <Typography variant="h6" component="div">
            Détails de la transaction #{selectedTransaction?.id}
          </Typography>
          <IconButton onClick={handleCloseTransactionModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedTransaction && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Informations générales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Type" 
                        secondary={
                          <Chip 
                            label={selectedTransaction.type === "sales" ? "vente" : selectedTransaction.type === "commission de parrainage" ? "commission de parrainage" : selectedTransaction.type === "commission de retrait" ? "commission de retrait" : selectedTransaction.type === "frais de retrait" ? "frais de retrait" : selectedTransaction.type === "frais de transfert" ? "frais de transfert" : selectedTransaction.type === "bonus" ? "bonus" : selectedTransaction.type} 
                            size="small"
                            sx={{ 
                              mt: 0.5,
                              bgcolor: (() => {
                                switch(selectedTransaction.type) {
                                  case 'withdrawal': return isDarkMode ? '#4b5563' : '#e5e7eb';
                                  case 'commission de parrainage': return isDarkMode ? '#065f46' : '#d1fae5';
                                  case 'commission de retrait': return isDarkMode ? '#1e40af' : '#dbeafe';
                                  case 'frais de retrait': return isDarkMode ? '#9f1239' : '#fee2e2';
                                  case 'frais de transfert': return isDarkMode ? '#92400e' : '#fef3c7';
                                  case 'bonus': return isDarkMode ? '#4f46e5' : '#e0e7ff';
                                  case 'sales': return isDarkMode ? '#064e3b' : '#d1fae5';
                                  default: return isDarkMode ? '#1f2937' : '#f3f4f6';
                                }
                              })(),
                              color: isDarkMode ? '#fff' : '#111'
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
                            fontWeight: 'bold', 
                            color: selectedTransaction.amount >= 0 ? 'success.main' : 'error.main' 
                          } 
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
                            color={selectedTransaction.status === 'completed' ? 'success' : selectedTransaction.status === 'pending' ? 'warning' : selectedTransaction.status === 'failed' ? 'error' : 'default'}
                            icon={selectedTransaction.status === 'completed' ? <CheckCircleIcon /> : selectedTransaction.status === 'pending' ? <HourglassEmptyIcon /> : selectedTransaction.status === 'failed' ? <ErrorIcon /> : null}
                          />
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText 
                        primary="Date de création" 
                        secondary={format(new Date(selectedTransaction.created_at), 'dd MMMM yyyy à HH:mm:ss', { locale: fr })} 
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText 
                        primary="Date de mise à jour" 
                        secondary={format(new Date(selectedTransaction.updated_at), 'dd MMMM yyyy à HH:mm:ss', { locale: fr })} 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)',
                  borderRadius: 2,
                  height: '100%',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Métadonnées
                  </Typography>
                  {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 ? (
                    <List dense>
                      {Object.entries(selectedTransaction.metadata).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <ListItem>
                            <ListItemText 
                              primary={key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')} 
                              secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)} 
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
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
        <DialogActions sx={{ borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseTransactionModal} 
            variant="outlined" 
            startIcon={<CloseIcon />}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Finances;