import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  ArrowPathIcon, 
  UserIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  WalletIcon,
  IdentificationIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Fade } from '@mui/material';
import Tree from 'react-d3-tree';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createPortal } from 'react-dom';
import PackStatsModal from './components/PackStatsModal';
import { ToastContainer } from 'react-toastify';

export default function UserDetails({ userId }) {
  const { isDarkMode } = useTheme();
  const { id } = useParams();
  const effectiveId = userId || id;
  
  // États principaux
  const [user, setUser] = useState(null);
  const [packs, setPacks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userWallet, setUserWallet] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [showBackButton, setShowBackButton] = useState(!userId); // Afficher le bouton retour seulement si userId n'est pas fourni (mode standalone)

  // États pour le modal des filleuls
  const [referralsDialog, setReferralsDialog] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [currentPackReferrals, setCurrentPackReferrals] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [viewMode, setViewMode] = useState('table');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const treeRef = useRef(null);
  const modalRef = useRef(null);
  const [modalWidth, setModalWidth] = useState(800);
  const [packStatsModal, setPackStatsModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  // États pour le modal de détails de transaction
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  useEffect(() => {
    fetchUserDetails();
  }, [effectiveId]);

  useEffect(() => {
    if (referralsDialog && modalRef.current) {
      const updateModalWidth = () => {
        setModalWidth(modalRef.current.offsetWidth);
      };
      
      // Mettre à jour la largeur initiale
      updateModalWidth();
      
      // Mettre à jour la largeur lors du redimensionnement
      window.addEventListener('resize', updateModalWidth);
      
      return () => {
        window.removeEventListener('resize', updateModalWidth);
      };
    }
  }, [referralsDialog]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${effectiveId}`);
      if (response.data.success) {
        setUser(response.data.data.user);
        setPacks(response.data.data.packs);
        setUserWallet(response.data.data.wallet);
        setTransactions(response.data.data.transactions);
        setUserPoints(response.data.data.points);
      } else {
        setError('Erreur lors du chargement des données utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails utilisateur:', error);
      setError('Erreur lors du chargement des données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater correctement les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    
    try {
      // Si la date est déjà au format français avec heure (JJ/MM/AAAA HH:MM:SS)
      if (typeof dateString === 'string' && dateString.includes('/')) {
        // Extraire seulement la partie date (JJ/MM/AAAA)
        const dateParts = dateString.split(' ');
        if (dateParts.length > 0) {
          return dateParts[0]; // Retourne seulement la partie date
        }
        return dateString;
      }
      
      // Essayer de créer une date valide
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return 'Format de date invalide';
      }
      
      // Formater la date en français sans l'heure
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error, dateString);
      return 'Erreur de date';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'actif':
        return '#4ade80'; // vert
      case 'inactive':
      case 'inactif':
        return '#f87171'; // rouge
      case 'pending':
        return '#facc15'; // jaune
      default:
        return '#94a3b8'; // gris
    }
  };

  // Fonction pour afficher les filleuls d'un pack
  const handleViewPackReferrals = async (packId) => {
    try {
      setSelectedPackId(packId);
      const response = await axios.get(`/api/admin/users/packs/${packId}/referrals`, {
        params: { user_id: effectiveId }
      });
      if (response.data.success) {
        // Traiter les données pour s'assurer que tous les champs nécessaires sont présents
        const processedData = response.data.data.map(generation => 
          generation.map(referral => ({
            ...referral,
            // S'assurer que les champs importants existent
            name: referral.name || referral.user?.name || 'N/A',
            status: referral.status || 'N/A',
            purchase_date: referral.purchase_date || null,
            expiry_date: referral.expiry_date || null,
            commission: referral.commission || referral.total_commission || '0',
            referral_code: referral.referral_code || 'N/A'
          }))
        );
        
        setCurrentPackReferrals(processedData);
        setReferralsDialog(true);
        setCurrentTab(0); // Réinitialiser à la première génération
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter({ startDate: '', endDate: '' });
        setViewMode('table');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des filleuls du pack:', error);
      toast.error('Erreur lors du chargement des filleuls');
    }
  };

  // Fonction pour normaliser une date (convertir en objet Date valide)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Si c'est déjà un objet Date
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }
    
    // Convertir les dates au format français (DD/MM/YYYY)
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JS
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    
    // Essayer de parser directement
    try {
      const date = new Date(dateStr);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    } catch (e) {
      return null;
    }
  };

  // Filtrer les filleuls en fonction des critères de recherche
  const getFilteredReferrals = () => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) {
      return [];
    }

    // Préparer les dates de filtre une seule fois
    const startDate = dateFilter.startDate ? normalizeDate(dateFilter.startDate) : null;
    const endDate = dateFilter.endDate ? normalizeDate(dateFilter.endDate) : null;
    
    // Ajuster la date de fin pour inclure toute la journée
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return currentPackReferrals[currentTab].filter(referral => {
      // Filtre de recherche
      const searchMatch = searchTerm === '' || 
        (referral.name && referral.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (referral.referral_code && referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtre de statut
      let statusMatch = statusFilter === 'all';
      
      if (statusFilter === 'active') {
        statusMatch = referral.pack_status === 'active';
      } else if (statusFilter === 'inactive') {
        statusMatch = referral.pack_status === 'inactive';
      } else if (statusFilter === 'expired') {
        statusMatch = referral.pack_status === 'expired';
      }
      
      // Filtre de date
      let dateMatch = true;
      if (startDate && endDate) {
        // Récupérer le champ de date
        const dateField = referral.purchase_date;
        
        if (dateField) {
          // Normaliser la date du filleul
          const date = normalizeDate(dateField);
          
          // Vérifier si la date est dans la plage
          if (date) {
            dateMatch = date >= startDate && date <= endDate;
          } else {
            dateMatch = false;
          }
        } else {
          dateMatch = false;
        }
      }
      
      return searchMatch && statusMatch && dateMatch;
    });
  };

  // Calculer les statistiques de la génération actuelle
  const currentGenerationStats = useMemo(() => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) return null;

    const referrals = currentPackReferrals[currentTab];
    return {
      total: referrals.length,
      totalCommission: referrals.reduce((sum, ref) => sum + parseFloat(ref.total_commission || 0), 0).toFixed(2)
    };
  }, [currentPackReferrals, currentTab]);

  // Composant CustomNode pour l'arbre des filleuls
  const CustomNode = ({ nodeDatum, isDarkMode, toggleNode }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const colors = {
      background: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      text: isDarkMode ? '#FFFFFF' : '#000000',
      shadow: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
      generation: isDarkMode ? [
        '#3B82F6',  // Vous
        '#10B981',  // Gen 1
        '#F59E0B',  // Gen 2
        '#EC4899',  // Gen 3
        '#8B5CF6'   // Gen 4
      ] : [
        '#3B82F6',  // Vous
        '#10B981',  // Gen 1
        '#F59E0B',  // Gen 2
        '#EC4899',  // Gen 3
        '#8B5CF6'   // Gen 4
      ],
      tooltip: {
        background: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        textSecondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        status: {
          active: isDarkMode ? '#6EE7B7' : '#059669',
          inactive: isDarkMode ? '#FCA5A5' : '#DC2626'
        }
      }
    };

    const nodeSize = 15;

    return (
      <g 
        onClick={toggleNode}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        {/* Cercle principal */}
        <circle 
          r={nodeSize} 
          fill={colors.generation[nodeDatum.attributes.generation]}
          style={{
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        />

        {/* Tooltip avec animation */}
        <foreignObject
          x={-100}
          y={-(nodeSize + 80)}
          width={200}
          height={100}
          style={{
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: colors.tooltip.background,
              border: `1px solid ${colors.tooltip.border}`,
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(8px)',
              fontSize: '12px',
              color: colors.tooltip.text,
              width: 'max-content',
              opacity: isHovered ? 1 : 0,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              visibility: isHovered ? 'visible' : 'hidden',
              position: 'absolute',
              left: '50%',
              transform: `translate(-50%, ${isHovered ? '0' : '10px'}) scale(${isHovered ? '1' : '0.95'})`,
              zIndex: 9999
            }}
          >
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '4px',
              fontSize: '14px',
              transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.05s'
            }}>
              {nodeDatum.name}
            </div>
            <div style={{ 
              color: colors.tooltip.textSecondary,
              marginBottom: '4px',
              transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
            }}>
              Commission: {nodeDatum.attributes.commission}
            </div>
            <div style={{ 
              color: nodeDatum.attributes.status === 'active' 
                ? colors.tooltip.status.active 
                : colors.tooltip.status.inactive,
              fontWeight: '500',
              transform: isHovered ? 'translateY(0)' : 'translateY(5px)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
            }}>
              {nodeDatum.attributes.status === 'active' ? 'Actif' : 'Inactif'}
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  // Fonction pour transformer les données des filleuls en structure d'arbre
  const transformDataToTree = (referralsData) => {
    const rootNode = {
      name: 'Vous',
      attributes: {
        commission: '0$',
        status: 'active',
        generation: 0
      },
      children: []
    };

    // Si pas de données, retourner juste le nœud racine
    if (!referralsData || !Array.isArray(referralsData) || referralsData.length === 0) {
      return rootNode;
    }

    // Vérifier si referralsData est un tableau de générations ou un tableau simple de filleuls
    const isArrayOfGenerations = Array.isArray(referralsData[0]);
    
    // Si c'est un tableau simple (une seule génération), le traiter directement
    if (!isArrayOfGenerations) {
      // Première génération
      rootNode.children = referralsData.map(ref => ({
        name: ref.name || 'Inconnu',
        attributes: {
          commission: `${parseFloat(ref.commission || ref.total_commission || 0).toFixed(2)}$`,
          status: ref.pack_status || ref.status || 'N/A',
          generation: 1,
          userId: ref.id,
          sponsorId: ref.sponsor_id
        },
        children: []
      }));
      return rootNode;
    }

    // Si c'est un tableau de générations, traiter la première génération
    if (referralsData[0] && referralsData[0].length > 0) {
      rootNode.children = referralsData[0].map(ref => ({
        name: ref.name || 'Inconnu',
        attributes: {
          commission: `${parseFloat(ref.commission || ref.total_commission || 0).toFixed(2)}$`,
          status: ref.pack_status || ref.status || 'N/A',
          generation: 1,
          userId: ref.id,
          sponsorId: ref.sponsor_id
        },
        children: []
      }));
    }

    // Fonction récursive pour trouver le nœud parent
    const findParentNode = (nodes, sponsorId) => {
      for (let node of nodes) {
        if (node.attributes.userId === sponsorId) {
          return node;
        }
        if (node.children && node.children.length > 0) {
          const found = findParentNode(node.children, sponsorId);
          if (found) return found;
        }
      }
      return null;
    };

    // Pour les filleuls qui ont un sponsor_id, les attacher à leur parent
    // Cette approche fonctionne pour toutes les générations
    const processReferrals = (refs, generation) => {
      if (!refs || refs.length === 0) return;
      
      refs.forEach(ref => {
        // Ignorer les filleuls de la première génération, ils sont déjà attachés à la racine
        if (generation <= 1) return;
        
        // Trouver le parent de ce filleul
        const parentNode = findParentNode(rootNode.children, ref.sponsor_id);
        
        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];
          
          // Ajouter ce filleul comme enfant de son parent
          parentNode.children.push({
            name: ref.name || 'Inconnu',
            attributes: {
              commission: `${parseFloat(ref.commission || ref.total_commission || 0).toFixed(2)}$`,
              status: ref.pack_status || ref.status || 'N/A',
              generation: generation,
              userId: ref.id,
              sponsorId: ref.sponsor_id
            },
            children: []
          });
        }
      });
    };

    // Traiter les générations 2 à 4
    for (let gen = 2; gen <= 4; gen++) {
      if (referralsData.length >= gen && referralsData[gen-1] && referralsData[gen-1].length > 0) {
        processReferrals(referralsData[gen-1], gen);
      }
    }

    return rootNode;
  };

  // Fonction pour exporter les données en Excel
  const exportToExcel = (exportType) => {
    // Fermer le menu d'exportation
    setShowExportMenu(false);
    
    // Déterminer les données à exporter
    const dataToExport = exportType === 'all' 
      ? currentPackReferrals[currentTab] || [] 
      : getFilteredReferrals();
    
    // Afficher un message si l'export concerne beaucoup de données
    if (dataToExport.length > 100) {
      toast.info(`Préparation de l'export de ${dataToExport.length} filleuls...`);
    }
    
    // Formater les données pour l'export
    const formattedData = dataToExport.map(referral => {
      // Créer un objet pour chaque ligne d'export
      return {
        'Nom': referral.name || 'N/A',
        'Date d\'achat': referral.purchase_date || 'N/A',
        'Statut': referral.pack_status === 'active' ? 'Actif' : referral.pack_status === 'inactive' ? 'Inactif' : 'Expiré',
        'Commission': `${parseFloat(referral.total_commission || 0).toFixed(2)}$`,
        'Code parrain': referral.referral_code || 'N/A'
      };
    });
    
    // Créer une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 20 }, // Nom
      { wch: 15 }, // Date d'achat
      { wch: 15 }, // Statut
      { wch: 15 }, // Commission
      { wch: 15 }  // Code parrain
    ];
    worksheet['!cols'] = columnWidths;
    
    // Créer un classeur et y ajouter la feuille
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filleuls");
    
    // Ajouter une feuille d'informations
    const infoData = [
      ["Arbre des filleuls - Génération " + (currentTab + 1)],
      ["Date d'export", new Date().toLocaleDateString('fr-FR')],
      ["Nombre de filleuls", dataToExport.length.toString()],
      ["Commission totale", `${dataToExport.reduce((sum, ref) => sum + parseFloat(ref.total_commission || 0), 0).toFixed(2)}$`]
    ];
    const infoWorksheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoWorksheet, "Informations");
    
    // Générer le fichier Excel et le télécharger
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    // Nom du fichier avec date
    const fileName = `filleuls-generation-${currentTab + 1}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`;
    saveAs(blob, fileName + '.xlsx');
    
    // Notification de succès
    toast.success(`Export Excel réussi : ${dataToExport.length} filleuls`);
  };

  // Fonction pour gérer les clics en dehors du menu d'exportation
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportMenuRef]);

  // Colonnes pour le tableau des packs
  const packColumns = [
    {
      field: 'pack',
      headerName: 'Pack',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">{params.row.pack?.name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <div className="font-medium">{params.row.pack?.name || 'N/A'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{params.row.pack?.categorie || ''}</div>
          </div>
        </div>
      )
    },
    {
      field: 'purchase_date',
      headerName: 'Date d\'achat',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return <span>-</span>;
        return <span>{formatDate(params.value)}</span>;
      }
    },
    {
      field: 'expiry_date',
      headerName: 'Date d\'expiration',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return <span>Illimité</span>;
        return <span>{formatDate(params.value)}</span>;
      }
    },
    {
      field: 'sponsor',
      headerName: 'Sponsor',
      width: 150,
      renderCell: (params) => {
        if (!params || !params.row) return <span>Aucun</span>;
        return (
          <div className="text-sm">
            {params.row.sponsor ? params.row.sponsor.name : 'Aucun'}
          </div>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => {
        let color, bgColor, icon;
        
        if (params.value === 'active') {
          color = 'text-green-800';
          bgColor = 'bg-green-100';
          icon = <CheckCircleIcon className="h-4 w-4 mr-1 text-green-700" />;
        } else {
          color = 'text-red-800';
          bgColor = 'bg-red-100';
          icon = <XCircleIcon className="h-4 w-4 mr-1 text-red-700" />;
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor}`}>
            {icon}
            {params.value === 'active' ? 'Actif' : 'Inactif'}
          </span>
        );
      }
    },
    {
      field: 'referrals_by_generation',
      headerName: 'Filleuls',
      width: 200,
      renderCell: (params) => {
        // Vérifier si referrals_by_generation existe et est un tableau
        if (!params.value || !Array.isArray(params.value)) {
          return <span>0 filleuls</span>;
        }
        
        // Calculer le total des filleuls
        const total = params.value.reduce((sum, count) => sum + count, 0);
        
        return (
          <div className="flex flex-col">
            <div className="font-medium">{total} filleuls</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex space-x-1">
              {params.value.map((count, index) => (
                <span key={index} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                  G{index + 1}: {count}
                </span>
              ))}
            </div>
          </div>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => {
        const isExpired = params.row.expiry_date && new Date(params.row.expiry_date) < new Date();
        
        return (
          <div className="flex space-x-2 p-2">
            <button
              onClick={() => handleViewPackReferrals(params.row.pack_id)}
              className="p-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              title="Voir les filleuls"
            >
              <UsersIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleViewPackStats(params.row.id)}
              className="p-1 bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
              title="Voir les statistiques"
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>

            {!isExpired && (
              <button
                onClick={() => handleTogglePackStatus(params.row.id, params.row.status)}
                className={`p-1 ${
                  params.row.status === 'active' 
                    ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800' 
                    : 'bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800'
                } rounded transition-colors`}
                title={params.row.status === 'active' ? 'Désactiver' : 'Activer'}
              >
                {params.row.status === 'active' 
                  ? <XCircleIcon className="h-5 w-5" /> 
                  : <CheckCircleIcon className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        );
      }
    }
  ];

  // Fonction pour afficher les statistiques d'un pack
  const handleViewPackStats = (packId) => {
    // Fonction pour afficher les statistiques du pack
    setSelectedPack(packs.find(pack => pack.id === packId));
    setPackStatsModal(true);
  };

  // Fonction pour activer/désactiver un pack
  const handleTogglePackStatus = (packId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    console.log(`Changer le statut du pack ${packId} de ${currentStatus} à ${newStatus}`);
    
    // Appel API pour changer le statut
    axios.patch(`/api/admin/users/packs/${packId}/toggle-status`)
      .then(response => {
        if (response.data.success) {
          // Mettre à jour les packs dans l'état local
          const updatedPacks = packs.map(pack => 
            pack.id === packId ? { ...pack, status: newStatus } : pack
          );
          setPacks(updatedPacks);
          
          // Afficher un message de succès
          toast.success(`Le statut du pack a été changé à ${newStatus === 'active' ? 'actif' : 'inactif'}`);
        } else {
          toast.error(response.data.message || 'Erreur lors du changement de statut');
        }
      })
      .catch(error => {
        console.error("Erreur lors du changement de statut:", error);
        toast.error(error.response?.data?.message || 'Erreur lors du changement de statut du pack');
      });
  };

  // Fonction pour afficher les détails d'une transaction
  const handleViewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  // Fonction pour fermer le modal de détails de transaction
  const handleCloseTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };

  // Fonction pour obtenir la couleur du statut de transaction
  const getTransactionStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Colonnes pour le tableau des transactions
  const transactionColumns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => {
        let color, bgColor, label;
        
        switch (params.value) {
          case 'reception':
            color = 'text-green-800';
            bgColor = 'bg-green-100';
            label = 'Dépôt';
            break;
          case 'withdrawal':
            color = 'text-red-800';
            bgColor = 'bg-red-100';
            label = 'Retrait';
            break;
          case 'commission':
            color = 'text-blue-800';
            bgColor = 'bg-blue-100';
            label = 'Commission';
            break;
          case 'sales':
            color = 'text-purple-800';
            bgColor = 'bg-purple-100';
            label = 'Bonus';
            break;
          default:
            color = 'text-gray-800';
            bgColor = 'bg-gray-100';
            label = params.value;
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor}`}>
            {label}
          </span>
        );
      }
    },
    {
      field: 'amount',
      headerName: 'Montant',
      width: 120,
      valueFormatter: (params) => params.value
    },
    {
      field: 'created_at',
      headerName: 'Date',
      width: 180
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => {
        let color, bgColor, label;
        
        switch (params.value) {
          case 'completed':
            color = 'text-green-800';
            bgColor = 'bg-green-100';
            label = 'Complété';
            break;
          case 'pending':
            color = 'text-yellow-800';
            bgColor = 'bg-yellow-100';
            label = 'En attente';
            break;
          case 'failed':
            color = 'text-red-800';
            bgColor = 'bg-red-100';
            label = 'Échoué';
            break;
          default:
            color = 'text-gray-800';
            bgColor = 'bg-gray-100';
            label = params.value;
        }
        
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor}`}>
            {label}
          </span>
        );
      }
    },
    {
      field: 'metadata',
      headerName: 'Détails',
      width: 300,
      renderCell: (params) => {
        if (!params.value) return '-';
        try {
          const metadata = typeof params.value === 'string' ? JSON.parse(params.value) : params.value;
          return (
            <div className="text-xs">
              {Object.entries(metadata).map(([key, value]) => {
                // Convertir les objets imbriqués en chaîne JSON pour éviter l'erreur "Objects are not valid as a React child"
                const displayValue = typeof value === 'object' && value !== null 
                  ? JSON.stringify(value)
                  : String(value);
                
                return (
                  <div key={key}><span className="font-medium">{key}:</span> {displayValue}</div>
                );
              })}
            </div>
          );
        } catch (error) {
          return '-';
        }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => {
        return (
          <div className="flex space-x-2 p-2">
            <button
              onClick={() => handleViewTransactionDetails(params.row)}
              className="p-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              title="Voir les détails"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        );
      }
    }
  ];

  // Colonnes pour le tableau des filleuls
  const getColumnsForGeneration = (generation) => [
    {
      field: 'name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">{params.value?.charAt(0) || '?'}</span>
          </div>
          <div className="font-medium">{params.value || 'N/A'}</div>
        </div>
      )
    },
    {
      field: 'pack_status',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => {
        const status = params.value || params.row.status || 'N/A';
        let color, bgColor, icon;
        
        if (status.toLowerCase() === 'active') {
          color = 'text-green-800';
          bgColor = 'bg-green-100';
          icon = <CheckCircleIcon className="h-4 w-4 mr-1 text-green-700" />;
        } else if (status.toLowerCase() === 'inactive') {
          color = 'text-red-800';
          bgColor = 'bg-red-100';
          icon = <XCircleIcon className="h-4 w-4 mr-1 text-red-700" />;
        } else {
          color = 'text-gray-800';
          bgColor = 'bg-gray-100';
          icon = <XCircleIcon className="h-4 w-4 mr-1 text-gray-700" />;
        }
        
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor}`}>
            {icon}
            {status === 'active' ? 'Actif' : status === 'inactive' ? 'Inactif' : status}
          </span>
        );
      }
    },
    {
      field: 'purchase_date',
      headerName: 'Date d\'achat',
      width: 150,
      renderCell: (params) => (
        <span>{params.value || 'N/A'}</span>
      )
    },
    {
      field: 'expiry_date',
      headerName: 'Date d\'expiration',
      width: 150,
      renderCell: (params) => (
        <span>{params.value || 'Illimité'}</span>
      )
    },
    {
      field: 'commission',
      headerName: 'Commission',
      width: 120,
      renderCell: (params) => {
        const commission = params.value || params.row.total_commission || '0';
        return (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {`${parseFloat(commission).toFixed(2)}$`}
          </span>
        );
      }
    },
    {
      field: 'referral_code',
      headerName: 'Code parrainage',
      width: 150,
      renderCell: (params) => (
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {params.value || 'N/A'}
        </span>
      )
    }
  ];

  useEffect(() => {
    if (currentPackReferrals && currentPackReferrals.length > 0 && currentTab >= 0) {
      console.log('Données des filleuls pour la génération', currentTab + 1, ':', currentPackReferrals[currentTab]);
    }
  }, [currentPackReferrals, currentTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-red-500 mb-4">
          <XCircleIcon className="h-12 w-12" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erreur</h1>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchUserDetails}
          className="mt-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Réessayer
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-yellow-500 mb-4">
          <UserIcon className="h-12 w-12" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Utilisateur non trouvé</h1>
        <p className="text-gray-600 dark:text-gray-400">L'utilisateur demandé n'existe pas ou a été supprimé.</p>
        <Link
          to="/admin/users"
          className="mt-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Retour à la liste des utilisateurs
        </Link>
      </div>
    );
  }
  
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {showBackButton && (
            <div className="mb-6">
              <Link
                to="/admin/users"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour à la liste des utilisateurs
              </Link>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            {/* En-tête avec les informations de base de l'utilisateur */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  {user?.profile_picture? (<img className="rounded-full object-cover" src={user.profile_picture} alt="img" /> ) : ( <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span> )}
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                  <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                  {user.status === 'active' ? 'Actif' : 'Inactif'}
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium">
                  ID: {user.account_id}
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-medium">
                  Inscrit le: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Onglets */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
              <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-3 border-b-2 text-sm font-medium ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setActiveTab('packs')}
                  className={`px-6 py-3 border-b-2 text-sm font-medium ${
                    activeTab === 'packs'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Packs
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-3 border-b-2 text-sm font-medium ${
                    activeTab === 'transactions'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Transactions
                </button>
              </nav>
            </div>
            
            {/* Contenu des onglets */}
            <div className="p-6">
              {activeTab === 'packs' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Packs de l'utilisateur</h2>
                  <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                      aria-label="Tableau des packs"
                      rows={packs}
                      columns={packColumns}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10, 25]}
                      disableSelectionOnClick
                      autoHeight
                      disableRowSelectionOnClick
                      disableColumnFilter
                      disableColumnMenu
                      hideFooterSelectedRowCount
                      componentsProps={{
                        basePopper: {
                          sx: { zIndex: 1300 }
                        },
                        panel: {
                          sx: { zIndex: 1300 }
                        }
                      }}
                      slotProps={{
                        basePopper: {
                          sx: { zIndex: 1300 }
                        },
                        panel: {
                          sx: { zIndex: 1300 }
                        }
                      }}
                      components={{
                        NoRowsOverlay: () => (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucun pack trouvé
                            </Typography>
                          </Box>
                        )
                      }}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === 'transactions' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historique des transactions</h2>
                  <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                      aria-label="Tableau des transactions"
                      rows={transactions}
                      columns={transactionColumns}
                      pageSize={5}
                      rowsPerPageOptions={[5, 10, 25]}
                      disableSelectionOnClick
                      autoHeight
                      disableRowSelectionOnClick
                      disableColumnFilter
                      disableColumnMenu
                      hideFooterSelectedRowCount
                      componentsProps={{
                        basePopper: {
                          sx: { zIndex: 1300 }
                        },
                        panel: {
                          sx: { zIndex: 1300 }
                        }
                      }}
                      slotProps={{
                        basePopper: {
                          sx: { zIndex: 1300 }
                        },
                        panel: {
                          sx: { zIndex: 1300 }
                        }
                      }}
                      components={{
                        NoRowsOverlay: () => (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucune transaction trouvée
                            </Typography>
                          </Box>
                        )
                      }}
                      onRowClick={(params) => handleViewTransactionDetails(params.row)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                      <IdentificationIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Informations personnelles
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Nom complet
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.name || 'Non renseigné'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Sexe
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.sexe || 'Non renseigné'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.email || 'Non renseigné'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          Téléphone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.phone || 'Non renseigné'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Informations professionnelles */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Autres Informations
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Whatsapp</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.whatsapp || 'Non renseignée'}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <GlobeAltIcon className="h-4 w-4 mr-1" />
                          Pays - Province - Ville
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.pays + ' - ' + user.province + ' - ' + user.ville || 'Non renseigné'}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          Adresse
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {user.address ? (
                            <div>
                              <p>{user.address}</p>
                            </div>
                          ) : (
                            'Non renseignée'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                {/* Wallet */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                      <WalletIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Wallet
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Solde actuel</dt>
                        <dd className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {userWallet?.balance || '0.00 $'}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total gagné</dt>
                        <dd className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                          {userWallet?.total_earned || '0.00 $'}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total retiré</dt>
                        <dd className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
                          {userWallet?.total_withdrawn || '0.00 $'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Points Bonus */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Points Bonus
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Points disponibles</dt>
                        <dd className="mt-1 text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {userPoints?.disponibles || '0'} points
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Points utilisés</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-600 dark:text-gray-400">
                          {userPoints?.utilises || '0'} points
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Valeur moyenne d'un point</dt>
                        <dd className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {userPoints?.valeur_point || '0.00'} $
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Valeur moyenne totale</dt>
                        <dd className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                          {userPoints?.valeur_totale || '0.00'} $
                        </dd>
                      </div>
                    </dl>
                    
                    {/* Affichage des points par pack */}
                    {userPoints?.points_par_pack && userPoints.points_par_pack.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Points par pack</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                          <div className="grid grid-cols-6 gap-4 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">
                            <div>N°</div>
                            <div>Pack</div>
                            <div>Disponibles</div>
                            <div>Utilisés</div>
                            <div>Valeur point</div>
                            <div>Valeur totale</div>
                          </div>
                          <div className="max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                            {userPoints.points_par_pack.map((packPoints, index) => (
                              <div key={index} className="grid grid-cols-6 gap-4 py-3 px-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{index + 1}</div>
                                <div className="font-medium text-gray-900 dark:text-white">{packPoints.pack_name}</div>
                                <div>{packPoints.disponibles} points</div>
                                <div>{packPoints.utilises} points</div>
                                <div>{packPoints.valeur_point} $</div>
                                <div className="font-medium text-blue-600 dark:text-blue-400">{packPoints.valeur_totale} $</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal des filleuls */}
      <Dialog 
        open={referralsDialog} 
        onClose={() => setReferralsDialog(false)}
        maxWidth="lg" 
        fullWidth
        fullScreen={isFullScreen}
        PaperProps={{
          ref: modalRef,
          sx: {
            minHeight: isFullScreen ? '100vh' : '90vh',
            maxHeight: isFullScreen ? '100vh' : '90vh',
            bgcolor: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: isFullScreen ? 0 : '12px',
            overflow: 'hidden'
          },
          component: motion.div,
          initial: { opacity: 0, y: 20, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { duration: 0.3, ease: "easeOut" }
        }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
      >
        <DialogTitle 
          component={motion.div}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          sx={{ 
            bgcolor: isDarkMode ? '#1a2433' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkMode ? 'grey.100' : 'text.primary',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UsersIcon className="h-6 w-6" style={{ color: isDarkMode ? '#4dabf5' : '#1976d2' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Arbre des filleuls
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                size="small"
                startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                  </svg>
                </Box>}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  py: 1,
                  color: isDarkMode ? 'white.300' : 'text.primary',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                Vue tableau
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('tree')}
                size="small"
                startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </Box>}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  py: 1,
                  color: isDarkMode ? 'grey.300' : 'text.primary',
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                Vue arbre
              </Button>
            </motion.div>
            <Tooltip title={isFullScreen ? "Quitter le mode plein écran" : "Plein écran"} arrow>
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
                {isFullScreen ? (
                  <ArrowsPointingInIcon className="h-2 w-4" />
                ) : (
                  <ArrowsPointingOutIcon className="h-2 w-4" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          bgcolor: isDarkMode ? '#1f2937' : 'transparent',
          color: isDarkMode ? 'grey.100' : 'text.primary',
          p: 0
        }}>
          {currentPackReferrals && (
            <Box sx={{ width: '100%', height: '100%' }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs
                  value={currentTab}
                  onChange={(e, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: isDarkMode ? '#1a2433' : 'rgba(0, 0, 0, 0.05)',
                    '& .MuiTab-root': {
                      color: isDarkMode ? 'grey.400' : 'text.secondary'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: isDarkMode ? 'primary.light' : 'primary.main',
                      height: 3
                    }
                  }}
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <Tab 
                      key={index} 
                      label={`${['Première', 'Deuxième', 'Troisième', 'Quatrième'][index]} génération`}
                      sx={{
                        fontWeight: 500,
                        textTransform: 'none',
                        minWidth: 'auto',
                        px: 3
                      }}
                    />
                  ))}
                </Tabs>
              </motion.div>

              <Box sx={{ p: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2,
                    mb: 3
                  }}>
                    <TextField
                      placeholder="Rechercher un filleul..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        width: { xs: '100%', md: '300px' },
                        bgcolor: isDarkMode ? '#1a2433' : 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          bgcolor: isDarkMode ? '#1a2433' : 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)'
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'primary.light' : 'primary.main',
                            borderWidth: '2px'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: isDarkMode ? 'grey.400' : undefined
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: isDarkMode ? 'primary.light' : 'primary.main'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MagnifyingGlassIcon className="h-5 w-5" style={{ color: isDarkMode ? 'grey.400' : 'inherit' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      position: 'relative'
                    }}>
                      <Button
                        variant="outlined"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        startIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                          minWidth: '120px',
                          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          color: isDarkMode ? 'grey.300' : 'text.primary',
                          '&:hover': {
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                          }
                        }}
                      >
                        Exporter
                        {showExportMenu ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
                      </Button>
                      
                      {showExportMenu && (
                        <Paper
                          ref={exportMenuRef}
                          elevation={3}
                          sx={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            mt: 1,
                            width: 200,
                            zIndex: 1000,
                            bgcolor: isDarkMode ? '#1a2433' : 'white',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                          }}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Box
                              sx={{
                                p: 1,
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                            >
                              <Button
                                onClick={() => exportToExcel('filtered')}
                                startIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                                sx={{
                                  justifyContent: 'flex-start',
                                  textTransform: 'none',
                                  py: 1,
                                  color: isDarkMode ? 'grey.300' : 'text.primary',
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                  }
                                }}
                              >
                                Exporter filtrés
                              </Button>
                              <Button
                                onClick={() => exportToExcel('all')}
                                startIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                                sx={{
                                  justifyContent: 'flex-start',
                                  textTransform: 'none',
                                  py: 1,
                                  color: isDarkMode ? 'grey.300' : 'text.primary',
                                  '&:hover': {
                                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                  }
                                }}
                              >
                                Exporter tous
                              </Button>
                            </Box>
                          </motion.div>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </motion.div>

                {/* Statistiques de la génération */}
                {currentGenerationStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2,
                      mb: 3,
                      p: 2,
                      borderRadius: '8px',
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <UsersIcon className="h-5 w-5" style={{ color: isDarkMode ? '#4dabf5' : '#1976d2' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Total filleuls: <span style={{ fontWeight: 600 }}>{currentGenerationStats.total}</span>
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <CurrencyDollarIcon className="h-5 w-5" style={{ color: isDarkMode ? '#4dabf5' : '#1976d2' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Commission totale: <span style={{ fontWeight: 600 }}>{currentGenerationStats.totalCommission}$</span>
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                )}
                                {/* Vue tableau ou arbre */}
                                <motion.div
                  key={`${viewMode}-${currentTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ height: 'calc(100% - 180px)', minHeight: '300px' }}
                >
                  {viewMode === 'table' ? (
                    <Box sx={{ 
                      height: '100%', 
                      minHeight: '300px',
                      '& .MuiDataGrid-root': {
                        border: 'none',
                        backgroundColor: isDarkMode ? 'rgba(26, 36, 51, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        '& .MuiDataGrid-columnHeaders': {
                          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                        },
                        '& .MuiDataGrid-cell': {
                          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)'
                        },
                        '& .MuiDataGrid-row:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        },
                        '& .MuiDataGrid-footerContainer': {
                          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)'
                        },
                        '& .MuiTablePagination-root': {
                          color: isDarkMode ? 'grey.300' : undefined
                        },
                        '& .MuiSvgIcon-root': {
                          color: isDarkMode ? 'grey.400' : undefined
                        }
                      }
                    }}>
                      <DataGrid
                        aria-label="Tableau des filleuls"
                        rows={getFilteredReferrals()}
                        columns={getColumnsForGeneration(currentTab)}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        disableSelectionOnClick
                        autoHeight
                        getRowId={(row) => row.id || Math.random().toString(36).substr(2, 9)}
                        componentsProps={{
                          basePopper: {
                            sx: { zIndex: 1300 }
                          },
                          panel: {
                            sx: { zIndex: 1300 }
                          }
                        }}
                        slotProps={{
                          basePopper: {
                            sx: { zIndex: 1300 }
                          },
                          panel: {
                            sx: { zIndex: 1300 }
                          }
                        }}
                        components={{
                          NoRowsOverlay: () => (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Aucun filleul trouvé
                              </Typography>
                            </Box>
                          )
                        }}
                      />
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        height: 500, 
                        position: 'relative',
                        bgcolor: isDarkMode ? '#1a2433' : 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Tree
                        ref={treeRef}
                        data={transformDataToTree(currentPackReferrals)}
                        orientation="vertical"
                        renderCustomNodeElement={(props) => (
                          <CustomNode {...props} isDarkMode={isDarkMode} />
                        )}
                        pathFunc="step"
                        separation={{ siblings: 1, nonSiblings: 1.2 }}
                        translate={{ x: modalWidth ? modalWidth / 2 : 400, y: 50 }}
                        nodeSize={{ x: 120, y: 60 }}
                        initialZoom={0.8}
                        scaleExtent={{ min: 0.1, max: 3 }}
                        zoomable
                        draggable
                      />
                    </Box>
                  )}
                </motion.div>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: isDarkMode ? '#1a2433' : 'rgba(0, 0, 0, 0.05)',
          borderTop: 1,
          borderColor: 'divider',
          px: 3,
          py: 2
        }}>
          <Button 
            onClick={() => setReferralsDialog(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              px: 3
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal pour les statistiques du pack */}
      <PackStatsModal 
        open={packStatsModal} 
        onClose={() => setPackStatsModal(false)} 
        packId={selectedPack?.id}
        userId={effectiveId}
      />
      {/* Modal pour les détails de transaction */}
      {showTransactionDetails && selectedTransaction && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]" 
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
          <div className={`relative p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Détails de la transaction
              </h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} overflow-y-auto max-h-[60vh]`}>
              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID de transaction</p>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de transaction</p>
                  <p className="font-medium capitalize">{selectedTransaction.type === "withdrawal" ? "retrait": selectedTransaction.type === "sales" ? "achat" : selectedTransaction.type === "transfer" ? "Transfert des fonds" : selectedTransaction.type === "reception" ? "Réception des fonds" : "commission"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Montant de la transaction</p>
                  <p className={`font-medium ${
                    selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'sales' 
                      ? 'text-red-500' 
                      : 'text-green-500'
                  }`}>
                    {selectedTransaction.type === 'withdrawal' || selectedTransaction.type === 'sales' ? '-' : '+'}
                    {selectedTransaction.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut de la transaction</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getTransactionStatusColor(selectedTransaction.status)
                  }`}>
                    {selectedTransaction.status === "pending" ? "En attente" : selectedTransaction.status === "approved" ? "Approuvé" : selectedTransaction.status === "rejected" ? "Refusé" : selectedTransaction.status === "completed" ? "Completé" : selectedTransaction.status === "failed" ? "échouée": selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de la transaction</p>
                  <p className="font-medium">
                    {formatDate(selectedTransaction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</p>
                  <p className="font-medium">
                    {formatDate(selectedTransaction.updated_at)}
                  </p>
                </div>
              </div>

              {/* Métadonnées */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <h4 className={`text-lg font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Informations supplémentaires
                  </h4>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {Object.entries(selectedTransaction.metadata).map(([key, value]) => {
                      // Traduire les clés en français
                      const frenchLabels = {
                        'withdrawal_request_id': 'Identifiant de la demande de retrait',
                        'payment_method': 'Méthode de paiement',
                        'montant_a_retirer': 'Montant à retirer',
                        'fee_percentage': 'Pourcentage de frais',
                        'frais_de_retrait': 'Frais de retrait',
                        'frais_de_commission': 'Frais de commission',
                        'montant_total_a_payer': 'Montant total à payer',
                        'devise': 'Dévise choisie pour le retrait',
                        'payment_details': 'Détails du paiement',
                        'status': 'Statut',
                        'source': 'Source',
                        'type': 'Type',
                        'amount': 'Montant',
                        'currency': 'Devise',
                        'description': 'Description',
                        'reference': 'Référence'
                      };
                      
                      const label = frenchLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      // Formater la valeur selon son type
                      let formattedValue = value;
                      
                      // Traduction des statuts
                      if (key === 'status' || key.endsWith('_status')) {
                        if (value === 'pending') formattedValue = 'En attente';
                        else if (value === 'approved') formattedValue = 'Approuvé';
                        else if (value === 'rejected') formattedValue = 'Rejeté';
                        else if (value === 'cancelled' || value === 'canceled') formattedValue = 'Annulé';
                        else if (value === 'completed') formattedValue = 'Complété';
                        else if (value === 'failed') formattedValue = 'Échoué';
                      }
                      
                      // Ajout de symboles pour les valeurs monétaires
                      if (
                        key === 'amount' || 
                        key === 'montant_a_retirer' || 
                        key === 'frais_de_retrait' || 
                        key === 'frais_de_commission' || 
                        key === 'montant_total_a_payer' ||
                        key.includes('montant') ||
                        key.includes('amount')
                      ) {
                        formattedValue = `${value} $`;
                      }
                      
                      // Ajout de symboles pour les pourcentages
                      if (
                        key === 'fee_percentage' || 
                        key.includes('percentage') || 
                        key.includes('pourcentage')
                      ) {
                        formattedValue = `${value} %`;
                      }
                      
                      return (
                        <div key={key} className="mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                            {label}
                          </p>
                          <p className="font-medium break-words">
                            {typeof formattedValue === 'object' 
                              ? JSON.stringify(formattedValue, null, 2) 
                              : String(formattedValue)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowTransactionDetails(false)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}