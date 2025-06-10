import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Paper,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Modal,
  Select
} from '@mui/material';

// Material Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import TuneIcon from '@mui/icons-material/Tune';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SyncIcon from '@mui/icons-material/Sync';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Charts
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Utilitaires
import axios from '../../utils/axios';
import { useTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Enregistrer les composants Chart.js
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

const Commissions = () => {
  // Hooks
  const theme = useTheme();
  const { isDarkMode } = useAppTheme();
  
  // États
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [filteredCommissions, setFilteredCommissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [packs, setPacks] = useState([]);
  const [commonErrors, setCommonErrors] = useState([]);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    pack: '',
    packs: [],
    level: '',
    dateFrom: '',
    dateTo: ''
  });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour les détails et actions
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  
  // Effets
  useEffect(() => {
    fetchCommissions();
    fetchStatistics();
    fetchCommonErrors();
  }, []);
  
  // Extraire les packs après le chargement des commissions
  useEffect(() => {
    if (commissions.length > 0) {
      fetchPacks();
    }
  }, [commissions]);
  
  useEffect(() => {
    if (commissions.length > 0) {
      applyFilters();
    }
  }, [commissions, searchQuery, filters]);
  
  // Fonctions de chargement des données
  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/commissions');
      if (response.data.success) {
        setCommissions(response.data.data.data);
        setFilteredCommissions(response.data.data.data);
      } else {
        setError('Erreur lors de la récupération des commissions');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commissions:', error);
      setError('Erreur lors de la récupération des commissions');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/admin/commissions/statistics');
      console.log(response);
      if (response.data.success) {
        // Les données sont dans response.data.data
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };
  
  // Extraire les packs distincts directement du tableau des commissions
  const fetchPacks = () => {
    try {
      // Extraire uniquement les packs distincts qui existent dans les commissions
      const distinctPacks = [];
      const packIds = new Set();
      
      commissions.forEach(commission => {
        if (commission.pack && !packIds.has(commission.pack.id)) {
          packIds.add(commission.pack.id);
          distinctPacks.push(commission.pack);
        }
      });
      
      console.log('Packs distincts extraits des commissions:', distinctPacks);
      setPacks(distinctPacks);
    } catch (error) {
      console.error('Erreur lors de l\'extraction des packs:', error);
    }
  };
  
  const fetchCommonErrors = async () => {
    try {
      const response = await axios.get('/api/admin/commissions/common-errors');
      
      if (response.data.success) {
        setCommonErrors(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des erreurs communes:', error);
    }
  };
  
  // Fonctions de gestion des filtres
  const applyFilters = () => {
    let filtered = [...commissions];
    
    // Appliquer les filtres de statut, pack et niveau
    if (filters.status) {
      filtered = filtered.filter(commission => commission.status === filters.status);
    }
    
    if (filters.pack) {
      filtered = filtered.filter(commission => commission.pack && commission.pack.id.toString() === filters.pack);
    }
    
    // Filtre multi-packs
    if (filters.packs && filters.packs.length > 0) {
      filtered = filtered.filter(commission => 
        commission.pack && filters.packs.includes(commission.pack.id.toString())
      );
    }
    
    if (filters.level) {
      filtered = filtered.filter(commission => commission.level.toString() === filters.level);
    }
    
    // Filtrer par date
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(commission => {
        const commissionDate = new Date(commission.created_at);
        return commissionDate >= fromDate;
      });
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(commission => {
        const commissionDate = new Date(commission.created_at);
        return commissionDate <= toDate;
      });
    }
    
    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(commission => 
        (commission.id && commission.id.toString().includes(query)) ||
        (commission.sponsor_user && commission.sponsor_user.name.toLowerCase().includes(query)) ||
        (commission.sponsor_user && commission.sponsor_user.email.toLowerCase().includes(query)) ||
        (commission.source_user && commission.source_user.name.toLowerCase().includes(query)) ||
        (commission.source_user && commission.source_user.email.toLowerCase().includes(query)) ||
        (commission.pack && commission.pack.name.toLowerCase().includes(query)) ||
        (commission.amount && commission.amount.toString().includes(query))
      );
    }
    
    setFilteredCommissions(filtered);
    setPage(0);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      status: '',
      pack: '',
      packs: [],
      level: '',
      dateFrom: '',
      dateTo: ''
    });
    
    setFilterMenuAnchor(null);
  };
  
  // Fonctions de gestion des onglets et de la pagination
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fonctions pour les actions
  const handleViewDetails = (commission) => {
    setSelectedCommission(commission);
  };
  
  const handleRetryCommission = async (id) => {
    try {
      setRetryLoading(true);
      const response = await axios.post(`/api/admin/commissions/${id}/retry`);
      
      if (response.data.success) {
        toast.success('Commission relancée avec succès');
        
        // Mettre à jour les données
        fetchCommissions();
        fetchStatistics();
        
        // Fermer le modal si ouvert
        if (selectedCommission && selectedCommission.id === id) {
          setSelectedCommission(null);
        }
      } else {
        toast.error(response.data.message || 'Erreur lors de la relance de la commission');
      }
    } catch (error) {
      console.error('Erreur lors de la relance de la commission:', error);
      toast.error('Erreur lors de la relance de la commission');
    } finally {
      setRetryLoading(false);
    }
  };
  
  // Fonctions utilitaires
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return dateString;
    }
  };
  
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '-';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Complétée';
      case 'pending': return 'En attente';
      case 'failed': return 'Échouée';
      default: return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon fontSize="small" />;
      case 'pending': return <HourglassEmptyIcon fontSize="small" />;
      case 'failed': return <ErrorIcon fontSize="small" />;
      default: return null;
    }
  };

  // Composant pour le menu de filtres
  const FilterMenu = () => {
    return (
      <>
        <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}` }}>
          <Typography variant="subtitle2" gutterBottom>Filtres</Typography>
          {/* Filtres en block */}
          <Box sx={{ display: 'block', gap: 2 }}>
            {/* Statut, Pack, Niveau en flex */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Select
                fullWidth
                size="small"
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                displayEmpty
                sx={{ bgcolor: isDarkMode ? '#111827' : '#fff', borderRadius: 1 }}
              >
                <MenuItem value=""><em>Statut</em></MenuItem>
                <MenuItem value="completed">Complétées</MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="failed">Échouées</MenuItem>
              </Select>
              {(packs && packs.length > 0) && (
                <Select
                  fullWidth
                  size="small"
                  value={filters.pack}
                  onChange={e => handleFilterChange('pack', e.target.value)}
                  displayEmpty
                  sx={{ bgcolor: isDarkMode ? '#111827' : '#fff', borderRadius: 1 }}
                >
                  <MenuItem value=""><em>Pack</em></MenuItem>
                  {(packs || []).map((pack) => (
                    <MenuItem key={pack.id} value={pack.id.toString()}>{pack.name}</MenuItem>
                  ))}
                </Select>
              )}
              <Select
                fullWidth
                size="small"
                value={filters.level}
                onChange={e => handleFilterChange('level', e.target.value)}
                displayEmpty
                sx={{ bgcolor: isDarkMode ? '#111827' : '#fff', borderRadius: 1 }}
              >
                <MenuItem value=""><em>Niveau</em></MenuItem>
                {[1, 2, 3, 4, 5].map((level) => (
                  <MenuItem key={level} value={level.toString()}>{`Niveau ${level}`}</MenuItem>
                ))}
              </Select>
            </Box>
            {/* Filtres par date */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Du"
                type="date"
                size="small"
                value={filters.dateFrom || ''}
                onChange={e => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: isDarkMode ? '#111827' : '#fff', borderRadius: 1, flex: 1 }}
              />
              <TextField
                label="Au"
                type="date"
                size="small"
                value={filters.dateTo || ''}
                onChange={e => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: isDarkMode ? '#111827' : '#fff', borderRadius: 1, flex: 1 }}
              />
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="text" 
            size="small" 
            onClick={resetFilters}
            startIcon={<RefreshIcon />}
            sx={{ 
              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              textTransform: 'none',
              fontSize: '0.8rem',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Réinitialiser
          </Button>
        </Box>
      </>
    );
  };
  
  return (
    <>
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Gestion des commissions
        </Typography>
        
        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="onglets de gestion des commissions"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                minWidth: 'auto',
                px: 3
              }
            }}
          >
            <Tab label="Commissions" />
            <Tab label="Statistiques" />
          </Tabs>
        </Box>
        
        {/* Alerte d'erreur */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}
        
        {/* Contenu des onglets */}
        {activeTab === 0 ? (
          <Box>
            {/* Barre de recherche et filtres */}
            {/* Zone recherche + filtres */}
            <Box sx={{ mb: 3, display: 'block', width: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  placeholder="Rechercher par ID, nom, email..."
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  inputRef={searchInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="clear search"
                          onClick={() => setSearchQuery('')}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderRadius: 1.5,
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.25)'
                      }
                    }
                  }}
                />
                <Tooltip title={showFilters ? "Masquer les filtres" : "Afficher les filtres"}>
                  <IconButton 
                    onClick={() => setShowFilters(!showFilters)}
                    color={Object.values(filters).some(v => v !== '' && v !== false && (Array.isArray(v) ? v.length > 0 : true)) ? 'primary' : 'default'}
                    sx={{ 
                      bgcolor: Object.values(filters).some(v => v !== '' && v !== false && (Array.isArray(v) ? v.length > 0 : true)) ? 
                        (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)') : 
                        'transparent'
                    }}
                  >
                    <TuneIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {/* Filtres en flex - conditionnellement affichés */}
              {showFilters && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  gap: 1, 
                  width: '100%',
                  mt: 2,
                  p: 1.5,
                  bgcolor: isDarkMode ? '#111827' : '#f8f9fa',
                  borderRadius: 1,
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                  alignItems: 'center'
                }}>
                  {/* Statut */}
                  <Select
                    size="small"
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        sx: { bgcolor: isDarkMode ? '#1f2937' : '#fff', color: isDarkMode ? '#fff' : '#111' }
                      }
                    }}
                    sx={{ 
                      minWidth: 90, 
                      maxHeight: 32,
                      fontSize: '0.75rem',
                      bgcolor: isDarkMode ? '#1f2937' : '#fff', 
                      color: isDarkMode ? '#fff' : '#111', 
                      border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: 1,
                      '& .MuiSelect-select': {
                        padding: '4px 8px'
                      },
                      '& .MuiSelect-icon': {
                        color: isDarkMode ? '#fff' : '#111',
                        fontSize: '1rem'
                      }
                    }}
                  >
                    <MenuItem value=""><em>Statut</em></MenuItem>
                    <MenuItem value="completed">Complétées</MenuItem>
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="failed">Échouées</MenuItem>
                  </Select>
                  
                  {/* Pack (simple) */}
                  <Select
                    size="small"
                    value={filters.pack}
                    onChange={e => handleFilterChange('pack', e.target.value)}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        sx: { bgcolor: isDarkMode ? '#1f2937' : '#fff', color: isDarkMode ? '#fff' : '#111' }
                      }
                    }}
                    sx={{ 
                      minWidth: 90, 
                      maxHeight: 32,
                      fontSize: '0.75rem',
                      bgcolor: isDarkMode ? '#1f2937' : '#fff', 
                      color: isDarkMode ? '#fff' : '#111', 
                      border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: 1,
                      '& .MuiSelect-select': {
                        padding: '4px 8px'
                      },
                      '& .MuiSelect-icon': {
                        color: isDarkMode ? '#fff' : '#111',
                        fontSize: '1rem'
                      }
                    }}
                  >
                    <MenuItem value=""><em>Pack</em></MenuItem>
                    {(packs && packs.length > 0) ? (
                      packs.map((pack) => (
                        <MenuItem key={pack.id} value={pack.id.toString()}>{pack.name}</MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Aucun pack disponible</MenuItem>
                    )}
                  </Select>
                  
                  {/* Niveau (1 à 4) */}
                  <Select
                    size="small"
                    value={filters.level}
                    onChange={e => handleFilterChange('level', e.target.value)}
                    displayEmpty
                    MenuProps={{
                      PaperProps: {
                        sx: { bgcolor: isDarkMode ? '#1f2937' : '#fff', color: isDarkMode ? '#fff' : '#111' }
                      }
                    }}
                    sx={{ 
                      minWidth: 90, 
                      maxHeight: 32,
                      fontSize: '0.75rem',
                      bgcolor: isDarkMode ? '#1f2937' : '#fff', 
                      color: isDarkMode ? '#fff' : '#111', 
                      border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: 1,
                      '& .MuiSelect-select': {
                        padding: '4px 8px'
                      },
                      '& .MuiSelect-icon': {
                        color: isDarkMode ? '#fff' : '#111',
                        fontSize: '1rem'
                      }
                    }}
                  >
                    <MenuItem value=""><em>Niveau</em></MenuItem>
                    {[1, 2, 3, 4].map((level) => (
                      <MenuItem key={level} value={level.toString()}>{`Niveau ${level}`}</MenuItem>
                    ))}
                  </Select>
                  
                  {/* Date Du */}
                  <TextField
                    label="Du"
                    type="date"
                    size="small"
                    value={filters.dateFrom || ''}
                    onChange={e => handleFilterChange('dateFrom', e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '0.75rem' }
                    }}
                    inputProps={{ 
                      style: { fontSize: '0.75rem', padding: '4px 8px' }
                    }}
                    sx={{ 
                      minWidth: 110, 
                      maxHeight: 32,
                      bgcolor: isDarkMode ? '#1f2937' : '#fff', 
                      borderRadius: 1,
                      '& .MuiInputBase-root': {
                        color: isDarkMode ? '#fff' : '#111',
                        height: 32
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        top: -6
                      }
                    }}
                  />
                  
                  {/* Date Au */}
                  <TextField
                    label="Au"
                    type="date"
                    size="small"
                    value={filters.dateTo || ''}
                    onChange={e => handleFilterChange('dateTo', e.target.value)}
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { fontSize: '0.75rem' }
                    }}
                    inputProps={{ 
                      style: { fontSize: '0.75rem', padding: '4px 8px' }
                    }}
                    sx={{ 
                      minWidth: 110, 
                      maxHeight: 32,
                      bgcolor: isDarkMode ? '#1f2937' : '#fff', 
                      borderRadius: 1,
                      '& .MuiInputBase-root': {
                        color: isDarkMode ? '#fff' : '#111',
                        height: 32
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        top: -6
                      }
                    }}
                  />
                  
                  {/* Bouton reset */}
                  <Button 
                    variant="text" 
                    size="small" 
                    onClick={resetFilters}
                    startIcon={<RefreshIcon fontSize="small" />}
                    sx={{ 
                      ml: 'auto',
                      height: 32,
                      color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* Liste des commissions */}
            <Paper 
              elevation={0}
              sx={{ 
                bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : filteredCommissions.length > 0 ? (
                <>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      textAlign: 'left'
                    }}>
                      <thead>
                        <tr style={{ 
                          backgroundColor: isDarkMode ? '#111827' : '#F9FAFB',
                          borderBottom: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`
                        }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>#</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Parrain</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Filleul</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Pack</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Montant</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Niveau</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Statut</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCommissions
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((commission) => (
                            <tr 
                              key={commission.id} 
                              style={{ 
                                borderBottom: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? '#1E293B' : '#F9FAFB'
                                }
                              }}
                            >
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{commission.id}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                                {commission.sponsor_user ? (
                                  <Tooltip title={commission.sponsor_user.email}>
                                    <span>{commission.sponsor_user.name}</span>
                                  </Tooltip>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                                {commission.source_user ? (
                                  <Tooltip title={commission.source_user.email}>
                                    <span>{commission.source_user.name}</span>
                                  </Tooltip>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{commission.pack?.name || '-'}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{formatAmount(commission.amount)}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>Niveau {commission.level}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                                <Chip 
                                  icon={getStatusIcon(commission.status)}
                                  label={getStatusLabel(commission.status)}
                                  color={getStatusColor(commission.status)}
                                  size="small"
                                  sx={{ fontWeight: 500 }}
                                />
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{formatDate(commission.created_at)}</td>
                              <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="Voir les détails">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleViewDetails(commission)}
                                      sx={{ 
                                        color: theme.palette.primary.main,
                                        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  {commission.status === 'failed' && (
                                    <Tooltip title="Relancer la commission">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleRetryCommission(commission.id)}
                                        disabled={retryLoading}
                                        sx={{ 
                                          color: theme.palette.success.main,
                                          bgcolor: isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'
                                        }}
                                      >
                                        <ReplayIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </Box>
                  
                  {/* Pagination */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center',
                    p: 2,
                    borderTop: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        Lignes par page:
                      </Typography>
                      <Select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(e.target.value)}
                        size="small"
                        sx={{ 
                          minWidth: 80,
                          height: 32,
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': { py: 0.5, px: 1.5 }
                        }}
                      >
                        {[10, 25, 50].map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {page * rowsPerPage + 1}-
                        {Math.min((page + 1) * rowsPerPage, filteredCommissions.length)} sur {filteredCommissions.length}
                      </Typography>
                      
                      <IconButton 
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                      
                      <IconButton 
                        onClick={() => setPage(page + 1)}
                        disabled={page >= Math.ceil(filteredCommissions.length / rowsPerPage) - 1}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucune commission trouvée
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Modal de détails */}
            <Modal
              open={Boolean(selectedCommission)}
              onClose={() => setSelectedCommission(null)}
              aria-labelledby="commission-details-modal"
              slotProps={{
                backdrop: {
                  sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(5px)'
                  }
                }
              }}
            >
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '90%', sm: 600 },
                maxHeight: '90vh',
                bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                overflow: 'auto'
              }}>
                {selectedCommission && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" component="h2">
                        Détails de la commission #{selectedCommission.id}
                      </Typography>
                      <IconButton onClick={() => setSelectedCommission(null)} size="small">
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Card sx={{ 
                          bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 2,
                          mb: 2
                        }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>Statut</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip 
                                icon={getStatusIcon(selectedCommission.status)}
                                label={getStatusLabel(selectedCommission.status)}
                                color={getStatusColor(selectedCommission.status)}
                                size="small"
                                sx={{ fontWeight: 500 }}
                              />
                              
                              {selectedCommission.status === 'failed' && (
                                <Button
                                  startIcon={<ReplayIcon />}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  onClick={() => handleRetryCommission(selectedCommission.id)}
                                  disabled={retryLoading}
                                  sx={{ ml: 2 }}
                                >
                                  Relancer
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Parrain</Typography>
                        {selectedCommission.sponsor_user ? (
                          <Box>
                            <Typography variant="body2">{selectedCommission.sponsor_user.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedCommission.sponsor_user.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Non défini</Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Filleul</Typography>
                        {selectedCommission.source_user ? (
                          <Box>
                            <Typography variant="body2">{selectedCommission.source_user.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedCommission.source_user.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Non défini</Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Pack</Typography>
                        <Typography variant="body2">
                          {selectedCommission.pack?.name || 'Non défini'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Montant</Typography>
                        <Typography variant="body2">
                          {formatAmount(selectedCommission.amount)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Niveau</Typography>
                        <Typography variant="body2">Niveau {selectedCommission.level}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Date de création</Typography>
                        <Typography variant="body2">{formatDate(selectedCommission.created_at)}</Typography>
                      </Grid>
                      
                      {selectedCommission.status === 'completed' && selectedCommission.completed_at && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>Date de complétion</Typography>
                          <Typography variant="body2">{formatDate(selectedCommission.completed_at)}</Typography>
                        </Grid>
                      )}
                      
                      {selectedCommission.error_message && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Message d'erreur</Typography>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                              borderRadius: 1,
                              color: theme.palette.error.main
                            }}
                          >
                            <Typography variant="body2">{selectedCommission.error_message}</Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
              </Box>
            </Modal>
          </Box>
        ) : (
          <Box>
            {statistics ? (
              <>
                {/* Cartes de statistiques */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="text.secondary">
                          Total des commissions
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                          {statistics.total_commissions || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant: {formatAmount(statistics.total_amount || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="text.secondary">
                          Commissions complétées
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main }}>
                          {statistics.completed_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant: {formatAmount(statistics.completed_amount || 0)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="text.secondary">
                          Commissions en attente
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1, color: theme.palette.warning.main }}>
                          {statistics.pending_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant: {formatAmount(statistics.pending_amount)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="text.secondary">
                          Commissions échouées
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1, color: theme.palette.error.main }}>
                          {statistics.failed_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Montant: {formatAmount(statistics.failed_amount)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Graphiques */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      p: 2,
                      height: '100%'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par statut
                        </Typography>
                        <Box sx={{ height: 300, position: 'relative' }}>
                          <Doughnut 
                            data={{
                              labels: ['Complétées', 'En attente', 'Échouées'],
                              datasets: [
                                {
                                  data: [
                                    statistics.commissions_by_status?.completed || 0,
                                    statistics.commissions_by_status?.pending || 0,
                                    statistics.commissions_by_status?.failed || 0
                                  ],
                                  backgroundColor: [
                                    theme.palette.success.main,
                                    theme.palette.warning.main,
                                    theme.palette.error.main
                                  ],
                                  borderWidth: 0,
                                  hoverOffset: 4
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              cutout: '70%',
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: {
                                    color: isDarkMode ? '#fff' : '#333',
                                    font: {
                                      size: 12
                                    },
                                    padding: 20
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
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
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      p: 2,
                      height: '100%'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par pack
                        </Typography>
                        <Box sx={{ height: 300, position: 'relative' }}>
                          <Bar 
                            data={{
                              labels: statistics.commissions_by_pack?.map(item => item.name) || [],
                              datasets: [
                                {
                                  label: 'Nombre de commissions',
                                  data: statistics.commissions_by_pack?.map(item => item.count) || [],
                                  backgroundColor: theme.palette.primary.main,
                                  borderRadius: 6
                                },
                                {
                                  label: 'Montant total',
                                  data: statistics.commissions_by_pack?.map(item => parseFloat(item.total_amount)) || [],
                                  backgroundColor: theme.palette.secondary.main,
                                  borderRadius: 6
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                  },
                                  ticks: {
                                    color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                    precision: 0
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    color: isDarkMode ? '#D1D5DB' : '#4B5563'
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  position: 'top',
                                  labels: {
                                    color: isDarkMode ? '#fff' : '#333',
                                    font: {
                                      size: 12
                                    },
                                    padding: 10
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      if (context.dataset.label === 'Montant total') {
                                        return `${context.dataset.label}: ${formatAmount(context.raw)}`;
                                      }
                                      return `${context.dataset.label}: ${context.raw}`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Graphique des commissions par niveau */}
                <Grid container spacing={3} sx={{ mt: 3 }}>
                  <Grid item xs={12}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      p: 2
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Commissions par niveau
                        </Typography>
                        <Box sx={{ height: 300, position: 'relative' }}>
                          <Bar 
                            data={{
                              labels: statistics.commissions_by_level?.map(item => `Niveau ${item.level}`) || [],
                              datasets: [
                                {
                                  label: 'Nombre de commissions',
                                  data: statistics.commissions_by_level?.map(item => item.count) || [],
                                  backgroundColor: theme.palette.info.main,
                                  borderRadius: 6
                                },
                                {
                                  label: 'Montant total',
                                  data: statistics.commissions_by_level?.map(item => parseFloat(item.total_amount)) || [],
                                  backgroundColor: theme.palette.warning.main,
                                  borderRadius: 6
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                  },
                                  ticks: {
                                    color: isDarkMode ? '#D1D5DB' : '#4B5563',
                                    precision: 0
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    color: isDarkMode ? '#D1D5DB' : '#4B5563'
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  position: 'top',
                                  labels: {
                                    color: isDarkMode ? '#fff' : '#333',
                                    font: {
                                      size: 12
                                    },
                                    padding: 10
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      if (context.dataset.label === 'Montant total') {
                                        return `${context.dataset.label}: ${formatAmount(context.raw)}`;
                                      }
                                      return `${context.dataset.label}: ${context.raw}`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                {/* Erreurs communes */}
                {commonErrors && commonErrors.length > 0 && (
                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Card sx={{ 
                      bgcolor: isDarkMode ? '#1f2937' : 'background.paper',
                      borderRadius: 2,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Erreurs communes</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                          {commonErrors.map((error, index) => (
                            <Card key={index} sx={{ bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                                  <Typography variant="subtitle2" color="error.main">
                                    {error.count} occurrences
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {error.error_message}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucune statistique disponible
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};

export default Commissions;
