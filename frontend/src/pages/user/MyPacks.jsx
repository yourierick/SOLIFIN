import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  Card,
  CardContent,
  InputLabel,
  CardActions,
  Typography,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
  Alert, // Import Alert
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "../../utils/axios";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  InformationCircleIcon,
  GiftIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  Fullscreen,
  FullscreenExit,
  ContentCopy,
  CalendarMonth,
  Cached,
  Info,
} from "@mui/icons-material";
import Notification from "../../components/Notification";
import Tree from "react-d3-tree";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link, useNavigate } from "react-router-dom";
import PurchasePackForm from "../../components/PurchasePackForm";
import PackStatsModal from "../../components/PackStatsModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

const CustomNode = ({ nodeDatum, isDarkMode, toggleNode, selectedCurrency }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Fonction pour extraire uniquement la devise sélectionnée
  const getCommissionForSelectedCurrency = (commissionString) => {
    if (!commissionString) return "0";
    
    if (selectedCurrency === "USD") {
      // Extraire la valeur USD: "USD: $25.50 | CDF: 50,000 FC" -> "$25.50"
      const usdMatch = commissionString.match(/USD:\s*(\$[\d,.-]+)/);
      return usdMatch ? usdMatch[1] : "$0.00";
    } else {
      // Extraire la valeur CDF: "USD: $25.50 | CDF: 50,000 FC" -> "50,000 FC"
      const cdfMatch = commissionString.match(/CDF:\s*([\d\s.,]+FC)/);
      return cdfMatch ? cdfMatch[1] : "0 FC";
    }
  };

  const colors = {
    background: isDarkMode
      ? "rgba(17, 24, 39, 0.95)"
      : "rgba(255, 255, 255, 0.95)",
    text: isDarkMode ? "#FFFFFF" : "#000000",
    shadow: isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.1)",
    generation: isDarkMode
      ? [
          "#3B82F6", // Vous
          "#10B981", // Gen 1
          "#F59E0B", // Gen 2
          "#EC4899", // Gen 3
          "#8B5CF6", // Gen 4
        ]
      : [
          "#3B82F6", // Vous
          "#10B981", // Gen 1
          "#F59E0B", // Gen 2
          "#EC4899", // Gen 3
          "#8B5CF6", // Gen 4
        ],
    tooltip: {
      background: isDarkMode
        ? "rgba(17, 24, 39, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      border: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      text: isDarkMode ? "#FFFFFF" : "#000000",
      textSecondary: isDarkMode
        ? "rgba(255, 255, 255, 0.7)"
        : "rgba(0, 0, 0, 0.7)",
      status: {
        active: isDarkMode ? "#6EE7B7" : "#059669",
        inactive: isDarkMode ? "#FCA5A5" : "#DC2626",
      },
    },
  };

  const nodeSize = 15;

  return (
    <g
      onClick={toggleNode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Cercle principal */}
      <circle
        r={nodeSize}
        fill={colors.generation[nodeDatum.attributes.generation]}
        style={{
          transition: "all 0.3s ease",
          transform: isHovered ? "scale(1.1)" : "scale(1)",
        }}
      />

      {/* Tooltip avec animation */}
      <foreignObject
        x={-100}
        y={-(nodeSize + 80)}
        width={200}
        height={100}
        style={{
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: colors.tooltip.background,
            border: `1px solid ${colors.tooltip.border}`,
            borderRadius: "8px",
            padding: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            backdropFilter: "blur(8px)",
            fontSize: "12px",
            color: colors.tooltip.text,
            width: "max-content",
            opacity: isHovered ? 1 : 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            visibility: isHovered ? "visible" : "hidden",
            position: "absolute",
            left: "50%",
            transform: `translate(-50%, ${isHovered ? "0" : "10px"}) scale(${
              isHovered ? "1" : "0.95"
            })`,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "4px",
              fontSize: "14px",
              transform: isHovered ? "translateY(0)" : "translateY(5px)",
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.05s",
            }}
          >
            {nodeDatum.name}
          </div>
          <div
            style={{
              color: colors.tooltip.textSecondary,
              marginBottom: "4px",
              transform: isHovered ? "translateY(0)" : "translateY(5px)",
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
            }}
          >
            {selectedCurrency}: {getCommissionForSelectedCurrency(nodeDatum.attributes.commission)}
          </div>
          <div
            style={{
              color:
                nodeDatum.attributes.status === "active"
                  ? colors.tooltip.status.active
                  : colors.tooltip.status.inactive,
              fontWeight: "500",
              transform: isHovered ? "translateY(0)" : "translateY(5px)",
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.15s",
            }}
          >
            {nodeDatum.attributes.status === "active" ? "Actif" : "Inactif"}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

// Fonction pour calculer et formater le temps restant avant expiration
const formatRemainingTime = (expiryDateStr) => {
  const expiryDate = new Date(expiryDateStr);
  const currentDate = new Date();

  // Différence en millisecondes
  const diffMs = expiryDate - currentDate;

  // Si déjà expiré
  if (diffMs <= 0) {
    return "Expiré";
  }

  // Convertir en jours, mois, années
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays === 0) {
    if (diffHours === 0) {
      return "Dans moins d'une heure";
    }
    return `Dans ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  } else if (diffDays === 1) {
    return "Demain";
  } else if (diffDays < 30) {
    return `Dans ${diffDays} jours`;
  } else {
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (remainingDays === 0) {
      return months === 1 ? `Dans 1 mois` : `Dans ${months} mois`;
    } else {
      return months === 1
        ? `Dans 1 mois et ${remainingDays} jour${remainingDays > 1 ? "s" : ""}`
        : `Dans ${months} mois et ${remainingDays} jour${
            remainingDays > 1 ? "s" : ""
          }`;
    }
  }
};

// Fonction pour déterminer la couleur du texte en fonction du temps restant
const getRemainingTimeColor = (expiryDateStr) => {
  const expiryDate = new Date(expiryDateStr);
  const currentDate = new Date();

  // Différence en jours
  const diffDays = Math.floor(
    (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 7) {
    return "error.main"; // Rouge pour moins d'une semaine
  } else if (diffDays <= 30) {
    return "warning.main"; // Orange pour moins d'un mois
  } else {
    return "success.main"; // Vert pour plus d'un mois
  }
};

// Fonction pour déterminer si un pack est sur le point d'expirer
const isPackExpiringSoon = (expiryDateStr) => {
  const expiryDate = new Date(expiryDateStr);
  const currentDate = new Date();

  // Différence en jours
  const diffDays = Math.floor(
    (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
  );

  return diffDays <= 7 && diffDays > 0; // 7 jours ou moins
};

// Fonction pour déterminer si un pack est expiré
const isPackExpired = (expiryDateStr, status) => {
  if (status === "expired") return true;

  const expiryDate = new Date(expiryDateStr);
  const currentDate = new Date();

  return expiryDate <= currentDate;
};

// Fonction pour obtenir le style de la card en fonction du statut
const getCardStyle = (userPack, isDarkMode) => {
  const isExpired = isPackExpired(userPack.expiry_date, userPack.status);
  const isExpiringSoon = isPackExpiringSoon(userPack.expiry_date);

  if (isExpired) {
    return {
      border: "1px solid rgba(239, 68, 68, 0.3)",
      background: isDarkMode
        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(127, 29, 29, 0.05) 100%)"
        : "linear-gradient(135deg, rgba(254, 226, 226, 0.9) 0%, rgba(254, 202, 202, 0.8) 100%)",
      opacity: 0.85,
      position: "relative",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
        borderRadius: "16px 16px 0 0",
      },
    };
  } else if (isExpiringSoon) {
    return {
      border: "1px solid rgba(245, 158, 11, 0.3)",
      background: isDarkMode
        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.05) 100%)"
        : "linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(253, 230, 138, 0.8) 100%)",
      position: "relative",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
        borderRadius: "16px 16px 0 0",
      },
    };
  }

  return {
    border: isDarkMode
      ? "1px solid rgba(99, 102, 241, 0.2)"
      : "1px solid rgba(99, 102, 241, 0.15)",
    background: isDarkMode
      ? "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%)",
  };
};

export default function MyPacks() {
  const [renewDialog, setRenewDialog] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const { isDarkMode } = useTheme();
  const { selectedCurrency, setSelectedCurrency, canUseCDF, isCDFEnabled } = useCurrency();
  const [userPacks, setUserPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsDialog, setStatsDialog] = useState(false);
  const [referralsDialog, setReferralsDialog] = useState(false);
  const [currentPackStats, setCurrentPackStats] = useState(null);
  const [currentPackReferrals, setCurrentPackReferrals] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    type: "purchase", // 'purchase' ou 'expiry'
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const treeRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Hooks pour la responsivité
  const theme = useMuiTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const paginationSize = isSmallScreen ? "small" : "medium";
  const paginationSiblingCount = isSmallScreen ? 0 : 1;
  const paginationBoundaryCount = isSmallScreen ? 1 : 2;

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    });
  };

  useEffect(() => {
    fetchUserPacks();
  }, []);

  const fetchUserPacks = async () => {
    try {
      const response = await axios.get("/api/user/packs");
      if (response.data.success) {
        setUserPacks(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
      Notification.error(
        error?.response?.data?.message || "Impossible de charger vos packs"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRenewClick = (pack) => {
    setSelectedPack(pack);
    setRenewDialog(true);
  };

  const handleRenewClose = () => {
    setRenewDialog(false);
    setSelectedPack(null);
  };

  useEffect(() => {}, [selectedPack]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "expired":
        return "error";
      case "inactive":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Actif";
      case "expired":
        return "Expiré";
      case "inactive":
        return "Inactif";
      default:
        return status;
    }
  };

  const handleStatsClick = (packId) => {
    setSelectedPackId(packId);
    setStatsDialog(true);
  };

  // État pour la pagination et les filtres des filleuls
  const [referralsPagination, setReferralsPagination] = useState({
    page: 1,
    per_page: 10,
    search: "",
    status: "all",
    start_date: "",
    end_date: "",
  });

  // États pour la pagination UI
  const [referralsPage, setReferralsPage] = useState(0);
  const [referralsRowsPerPage, setReferralsRowsPerPage] = useState(25);

  // État pour stocker les métadonnées de pagination
  const [referralsPaginationMeta, setReferralsPaginationMeta] = useState([]);

  // Effet pour recharger les données lorsque la pagination ou les filtres changent (comme dans Wallet.jsx)
  useEffect(() => {
    if (referralsDialog && selectedPackId) {
      handleReferralsClick(selectedPackId, referralsPage + 1);
    }
  }, [referralsPage, referralsRowsPerPage, selectedCurrency]);

  // Fonction pour appliquer les filtres manuellement
  const applyFilters = () => {
    if (referralsDialog && selectedPackId) {
      const filters = {
        search: searchTerm,
        status: statusFilter,
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate,
        date_type: dateFilter.type,
      };
      handleReferralsClick(selectedPackId, 1, filters);
    }
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter({
      type: "purchase",
      startDate: "",
      endDate: "",
    });
    if (referralsDialog && selectedPackId) {
      handleReferralsClick(selectedPackId, 1);
    }
  };

  const handleReferralsClick = async (packId, newPage = 1, filters = {}) => {
    try {
      // Définir le pack sélectionné
      setSelectedPackId(packId);

      // Pagination backend (comme dans Wallet.jsx)
      const paginationParams = {
        per_page: referralsRowsPerPage,
        page: newPage, // Laravel pagination commence à 1
        ...filters,
      };

      // Ajouter les filtres de génération
      paginationParams.generation_tab = currentTab;

      // Construction des paramètres de requête
      const queryParams = new URLSearchParams();
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      // Appel API avec paramètres de pagination backend
      const response = await axios.get(
        `/api/packs/${packId}/referrals?${queryParams.toString()}`
      );
      console.log(response);
      if (response.data && response.data.success) {
        setCurrentPackReferrals(response.data.data);
        setReferralsPaginationMeta(response.data.pagination || []);
        
        // Mettre à jour la page UI (Material-UI utilise 0-based)
        setReferralsPage(newPage - 1);
        
        if (!filters.generation_tab) {
          setCurrentTab(0);
        }
        
        // Ne réinitialiser le searchTerm que si ce n'est pas un filtre de recherche
        if (!filters.search) {
          setSearchTerm("");
        }
        
        setReferralsDialog(true);
      } else {
        toast.error("Erreur lors du chargement des filleuls");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des filleuls:", error);
      toast.error("Impossible de charger les filleuls");
    }
  };

  // Fonction pour changer de page
  const handleReferralsPageChange = (packId, newPage) => {
    handleReferralsClick(packId, newPage);
  };

  // Fonction pour appliquer les filtres
  const handleReferralsFilterChange = (packId, filters) => {
    handleReferralsClick(packId, 1, filters);
  };

  // Fonction pour réinitialiser les filtres
  const handleReferralsResetFilters = (packId) => {
    const resetFilters = {
      search: "",
      status: "all",
      start_date: "",
      end_date: "",
    };
    handleReferralsClick(packId, 1, resetFilters);
  };

  // Gestionnaires de pagination pour la table (comme dans Wallet.jsx)
  const handleReferralsPageChangeUI = (event, newPage) => {
    // Material-UI utilise 0-based, mais le backend utilise 1-based
    handleReferralsClick(selectedPackId, newPage + 1);
  };

  const handleReferralsRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setReferralsRowsPerPage(newRowsPerPage);
    setReferralsPage(0); // Réinitialiser à la première page
    handleReferralsClick(selectedPackId, 1, { per_page: newRowsPerPage });
  };

  // Fonction pour normaliser une date (convertir en objet Date valide)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;

    // Si c'est déjà un objet Date
    if (dateStr instanceof Date) {
      return isNaN(dateStr.getTime()) ? null : dateStr;
    }

    // Convertir les dates au format français (DD/MM/YYYY)
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const parts = dateStr.split("/");
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
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  };

  // Filtrer les filleuls en fonction des critères de recherche et des filtres
  const getFilteredReferrals = () => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) {
      return [];
    }

    // Préparer les dates de filtre une seule fois
    const startDate = dateFilter.startDate
      ? normalizeDate(dateFilter.startDate)
      : null;
    const endDate = dateFilter.endDate
      ? normalizeDate(dateFilter.endDate)
      : null;

    // Ajuster la date de fin pour inclure toute la journée
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    return currentPackReferrals[currentTab].filter((referral) => {
      // Filtre de recherche
      const searchMatch =
        searchTerm === "" ||
        (referral.name &&
          referral.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (referral.referral_code &&
          referral.referral_code
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (referral.pack_name &&
          referral.pack_name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtre de statut
      let statusMatch = statusFilter === "all";

      if (statusFilter === "active") {
        statusMatch = referral.pack_status === "active";
      } else if (statusFilter === "inactive") {
        statusMatch = referral.pack_status === "inactive";
      } else if (statusFilter === "expired") {
        statusMatch =
          referral.pack_status === "expired" ||
          (referral.expiry_date &&
            normalizeDate(referral.expiry_date) < new Date());
      }

      // Filtre de date
      let dateMatch = true;
      if (startDate && endDate) {
        // Récupérer le champ de date selon le type de filtre
        const dateField =
          dateFilter.type === "purchase"
            ? referral.purchase_date
            : referral.expiry_date;

        if (dateField) {
          // Normaliser la date du filleul
          const date = normalizeDate(dateField);

          // Vérifier si la date est dans la plage
          if (date) {
            dateMatch = date >= startDate && date <= endDate;
          } else {
            dateMatch = false;
          }
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });
  };

  // Calculer les statistiques de la génération actuelle
  const referralStats = useMemo(() => {
    const referrals = currentPackReferrals[currentTab] || [];
    const totalCommission = referrals.reduce((sum, ref) => {
      if (selectedCurrency === "USD") {
        return sum + parseFloat(ref.total_commission_usd || 0);
      } else {
        return sum + parseFloat(ref.total_commission_cdf || 0);
      }
    }, 0);

    const formattedCommission =
      selectedCurrency === "USD"
        ? `$${totalCommission.toFixed(2)}`
        : new Intl.NumberFormat("fr-CD", {
            style: "currency",
            currency: "CDF",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalCommission);

    return {
      total: referrals.length,
      totalCommission: formattedCommission,
    };
  }, [currentPackReferrals, currentTab, selectedCurrency]);

  // Fonction pour trouver un nœud parent dans l'arbre par son userId
  const findParentNode = (node, userId) => {
    if (node.attributes && node.attributes.userId === userId) {
      return node;
    }

    if (node.children) {
      for (let child of node.children) {
        const found = findParentNode(child, userId);
        if (found) return found;
      }
    }

    return null;
  };

  const transformDataToTree = (referrals) => {
    const rootNode = {
      name: "Vous",
      attributes: {
        commission: "USD: $0.00 | CDF: 0 FC",
        status: "active",
        generation: 0,
      },
      children: [],
    };

    // Première génération
    if (referrals[0]) {
      rootNode.children = referrals[0].map((ref) => ({
        name: ref.name,
        attributes: {
          commission: `USD: $${parseFloat(ref.total_commission_usd || 0).toFixed(2)} | CDF: ${new Intl.NumberFormat("fr-CD", {
            style: "currency",
            currency: "CDF",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(parseFloat(ref.total_commission_cdf || 0))}`,
          status: ref.pack_status,
          generation: 1,
          userId: ref.id,
        },
        children: [],
      }));

      // Générations 2 à 4
      for (let gen = 2; gen <= 4; gen++) {
        if (referrals[gen - 1]) {
          referrals[gen - 1].forEach((ref) => {
            const parentNode = findParentNode(rootNode, ref.sponsor_id);
            if (parentNode) {
              if (!parentNode.children) parentNode.children = [];
              parentNode.children.push({
                name: ref.name,
                attributes: {
                  commission: `USD: $${parseFloat(ref.total_commission_usd || 0).toFixed(2)} | CDF: ${new Intl.NumberFormat("fr-CD", {
                    style: "currency",
                    currency: "CDF",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(parseFloat(ref.total_commission_cdf || 0))}`,
                  status: ref.pack_status,
                  generation: gen,
                  userId: ref.id,
                  sponsorId: ref.sponsor_id,
                  sponsorName: ref.sponsor_name,
                },
                children: [],
              });
            }
          });
        }
      }
    }

    return rootNode;
  };

  // Fonction d'exportation Excel améliorée
  const exportToExcel = (exportType) => {
    // Fermer le menu d'exportation
    setShowExportMenu(false);

    // Déterminer les données à exporter
    const dataToExport =
      exportType === "all"
        ? currentPackReferrals[currentTab] || []
        : getFilteredReferrals();

    // Afficher un message si l'export concerne beaucoup de données
    if (dataToExport.length > 100) {
      toast.info(
        `Préparation de l'export de ${dataToExport.length} filleuls...`
      );
    }

    // Formater les données pour l'export
    const formattedData = dataToExport.map((referral) => {
      const commission =
        selectedCurrency === "USD"
          ? `$${parseFloat(referral.total_commission_usd || 0).toFixed(2)}`
          : new Intl.NumberFormat("fr-CD", {
              style: "currency",
              currency: "CDF",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(parseFloat(referral.total_commission_cdf || 0));

      return {
        Nom: referral.name || "N/A",
        "Date d'achat": referral.purchase_date || "N/A",
        "Pack acheté": referral.pack_name || "N/A",
        "Prix du pack": `${parseFloat(referral.pack_price || 0).toFixed(2)}$`,
        "Date d'expiration": referral.expiry_date || "N/A",
        "Code parrain": referral.referral_code || "N/A",
        Statut: referral.pack_status === "active" ? "Actif" : "Inactif",
        Commission: commission,
      };
    });

    // Créer une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 20 }, // Nom
      { wch: 15 }, // Date d'achat
      { wch: 15 }, // Pack acheté
      { wch: 15 }, // Prix du pack
      { wch: 15 }, // Date d'expiration
      { wch: 15 }, // Code parrain
      { wch: 15 }, // Statut
      { wch: 15 }, // Commission
    ];
    worksheet["!cols"] = columnWidths;

    // Créer un classeur et y ajouter la feuille
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filleuls");

    // Ajouter une feuille d'informations
    const totalCommission = dataToExport.reduce((sum, ref) => {
      if (selectedCurrency === "USD") {
        return sum + parseFloat(ref.total_commission_usd || 0);
      } else {
        return sum + parseFloat(ref.total_commission_cdf || 0);
      }
    }, 0);

    const infoData = [
      ["Arbre des filleuls - Génération " + (currentTab + 1)],
      ["Devise", selectedCurrency],
      ["Date d'export", new Date().toLocaleDateString("fr-FR")],
      ["Nombre de filleuls", dataToExport.length.toString()],
      [
        "Commission totale",
        selectedCurrency === "USD"
          ? `$${totalCommission.toFixed(2)}`
          : new Intl.NumberFormat("fr-CD", {
              style: "currency",
              currency: "CDF",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalCommission),
      ],
    ];
    const infoWorksheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoWorksheet, "Informations");

    // Générer le fichier Excel et le télécharger
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    // Nom du fichier avec date
    const fileName = `filleuls-generation-${currentTab + 1}-${new Date()
      .toLocaleDateString("fr-FR")
      .replace(/\//g, "-")}`;
    saveAs(blob, fileName + ".xlsx");

    // Notification de succès
    toast.success(`Export Excel réussi : ${dataToExport.length} filleuls`);
  };

  // Fonction pour gérer les clics en dehors du menu d'exportation
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportMenuRef]);

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredReferrals = getFilteredReferrals();

  const getColumnsForGeneration = (generation) => {
    const baseColumns = [
      { field: "name", headerName: "Nom", flex: 1, minWidth: 150 },
      {
        field: "purchase_date",
        headerName: "Date d'achat",
        flex: 1,
        minWidth: 120,
      },
      { field: "pack_name", headerName: "Pack acheté", flex: 1, minWidth: 150 },
      {
        field: "pack_price",
        headerName: "Prix du pack",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "expiry_date",
        headerName: "Date d'expiration",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "referral_code",
        headerName: "Code parrain",
        flex: 1,
        minWidth: 120,
      },
      {
        field: "pack_status",
        headerName: "Statut",
        flex: 1,
        minWidth: 100,
        renderCell: ({ value }) => (
          <Chip
            label={value === "active" ? "Actif" : "Inactif"}
            color={value === "active" ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        field: "total_commission",
        headerName: "Commission totale",
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          const value = params.row;
          const commission =
            selectedCurrency === "USD"
              ? `$${parseFloat(value.total_commission_usd || 0).toFixed(2)}`
              : new Intl.NumberFormat("fr-CD", {
                  style: "currency",
                  currency: "CDF",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseFloat(value.total_commission_cdf || 0));

          return (
            <Box
              sx={{
                fontWeight: 600,
                color:
                  selectedCurrency === "USD" ? "success.main" : "info.main",
              }}
            >
              {commission}
            </Box>
          );
        },
      },
    ];

    if (generation >= 1) {
      baseColumns.splice(1, 0, {
        field: "sponsor_name",
        headerName: "Parrain",
        flex: 1,
        minWidth: 150,
      });
    }

    return baseColumns;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            p: 3,
            borderRadius: "16px",
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)"
              : "linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.02) 100%)",
            border: isDarkMode
              ? "1px solid rgba(99, 102, 241, 0.15)"
              : "1px solid rgba(99, 102, 241, 0.1)",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: isDarkMode ? "#fff" : "#1f2937",
                mb: 1,
              }}
            >
              Mes Packs
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              Gérez vos packs et suivez vos performances
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<PlusIcon className="h-5 w-5" />}
            onClick={() => navigate("../packs")}
            sx={{
              borderRadius: "10px",
              fontWeight: 600,
              py: 1.2,
              px: 2.5,
              textTransform: "none",
              fontSize: "0.95rem",
              "&:hover": {
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Acheter un nouveau pack
          </Button>
        </Box>
      </motion.div>

      {userPacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: "16px",
              border: isDarkMode
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              bgcolor: isDarkMode ? "#1f2937" : "#fff",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <GiftIcon style={{ width: 32, height: 32, color: "white" }} />
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Aucun pack disponible
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: "500px",
                  mb: 3,
                  color: "text.secondary",
                }}
              >
                Vous n'avez souscrit à aucun pack. Cliquez sur le bouton
                ci-dessous pour acheter un nouveau pack.
              </Typography>

              <Button
                variant="contained"
                startIcon={<PlusIcon className="h-5 w-5" />}
                onClick={() => navigate("../packs")}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Acheter un pack
              </Button>
            </motion.div>
          </Paper>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
        >
          <Grid container spacing={4}>
            {userPacks.map((userPack, index) => (
              <Grid item xs={12} md={6} lg={4} key={userPack.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -8 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "20px",
                      overflow: "hidden",
                      border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.08)"
                        : "1px solid rgba(0, 0, 0, 0.06)",
                      background: isDarkMode 
                        ? "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)"
                        : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                      transition:
                        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: isPackExpired(userPack.expiry_date, userPack.status)
                          ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                          : isPackExpiringSoon(userPack.expiry_date)
                          ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)"
                          : userPack.status === "active"
                          ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
                        zIndex: 2,
                      },
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.02)",
                        boxShadow: isPackExpired(userPack.expiry_date, userPack.status)
                          ? "0 20px 40px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.1)"
                          : isPackExpiringSoon(userPack.expiry_date)
                          ? "0 20px 40px rgba(245, 158, 11, 0.2), 0 0 20px rgba(245, 158, 11, 0.1)"
                          : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.08)",
                      },
                    }}
                  >
                    {/* En-tête amélioré avec gradient */}
                    <Box
                      sx={{
                        p: 4,
                        pb: 3,
                        position: "relative",
                        overflow: "hidden",
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)",
                        borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                      }}
                    >
                      {/* Badge de statut flottant */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          zIndex: 3,
                        }}
                      >
                        <Chip
                          label={
                            isPackExpired(userPack.expiry_date, userPack.status)
                              ? "Expiré"
                              : isPackExpiringSoon(userPack.expiry_date)
                              ? "Expire bientôt"
                              : getStatusLabel(userPack.status)
                          }
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            letterSpacing: "0.025em",
                            borderRadius: "20px",
                            px: 2,
                            py: 1,
                            background: isPackExpired(userPack.expiry_date, userPack.status)
                              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                              : isPackExpiringSoon(userPack.expiry_date)
                              ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                              : userPack.status === "active"
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                            color: "#ffffff",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                            "& .MuiChip-label": {
                              px: 1,
                            },
                          }}
                        />
                      </Box>

                      {/* Icône décorative */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: "120px",
                          height: "120px",
                          borderRadius: "50%",
                          background: isDarkMode
                            ? "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                          zIndex: 1,
                        }}
                      />

                      <Box sx={{ position: "relative", zIndex: 2 }}>
                        <Typography
                          variant="h4"
                          sx={{ 
                            fontWeight: 800, 
                            mb: 1,
                            background: isDarkMode
                              ? "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)"
                              : "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            lineHeight: 1.2,
                          }}
                        >
                          {userPack.pack.name}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography
                            variant="h5"
                            sx={{ 
                              color: isPackExpired(
                                userPack.expiry_date,
                                userPack.status
                              )
                                ? "#ef4444"
                                : isPackExpiringSoon(userPack.expiry_date)
                                ? "#f59e0b"
                                : isDarkMode ? "#60a5fa" : "#3b82f6",
                              fontWeight: 800,
                              fontSize: "1.5rem",
                            }}
                          >
                            ${userPack.pack.price}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? "#94a3b8" : "#64748b",
                              fontWeight: 500,
                            }}
                          >
                            /{userPack.pack.abonnement}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {/* Description améliorée */}
                    <Box sx={{ p: 4, pb: 3 }}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: "16px",
                          background: isDarkMode
                            ? "rgba(59, 130, 246, 0.08)"
                            : "rgba(59, 130, 246, 0.04)",
                          border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"}`,
                          position: "relative",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background: isDarkMode
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(59, 130, 246, 0.08)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: isDarkMode ? "#cbd5e1" : "#475569",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            fontSize: "0.9rem",
                            height: "63px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {userPack.pack.description}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Informations */}
                    <Box sx={{ px: 3, pb: 2, flexGrow: 1 }}>
                      {/* ALERTE SI INACTIF */}
                      {userPack.status === "inactive" && (
                        <Alert
                          severity="warning"
                          sx={{ borderRadius: 2, mb: 2, fontWeight: 500 }}
                        >
                          Ce pack a été désactivé, contactez notre équipe pour
                          sa réactivation.
                        </Alert>
                      )}

                      {/* ALERTE SI EXPIRÉ */}
                      {isPackExpired(userPack.expiry_date, userPack.status) && (
                        <Alert
                          severity="error"
                          sx={{
                            borderRadius: 2,
                            mb: 2,
                            fontWeight: 500,
                            backgroundColor: isDarkMode
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(254, 226, 226, 0.5)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                          }}
                          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        >
                          Ce pack est expiré. Vous pouvez le renouveler pour
                          continuer à bénéficier de ses avantages.
                        </Alert>
                      )}

                      {/* ALERTE SI SUR LE POINT D'EXPIRER */}
                      {isPackExpiringSoon(userPack.expiry_date) &&
                        !isPackExpired(
                          userPack.expiry_date,
                          userPack.status
                        ) && (
                          <Alert
                            severity="warning"
                            sx={{
                              borderRadius: 2,
                              mb: 2,
                              fontWeight: 500,
                              backgroundColor: isDarkMode
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(254, 243, 199, 0.5)",
                              border: "1px solid rgba(245, 158, 11, 0.2)",
                            }}
                            icon={<ClockIcon className="h-5 w-5" />}
                          >
                            Ce pack expire dans moins de 7 jours. Pensez à le
                            renouveler pour ne pas perdre vos avantages.
                          </Alert>
                        )}
                      <List disablePadding>
                        {/* Code de parrainage */}
                        <ListItem
                          disablePadding
                          sx={{
                            py: 1.5,
                            borderBottom: "1px solid",
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <ContentCopy fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Code de parrainage"
                            secondary={userPack.referral_code}
                            primaryTypographyProps={{
                              variant: "caption",
                              color: "text.secondary",
                              component: "span",
                            }}
                            secondaryTypographyProps={{
                              variant: "body2",
                              fontWeight: 600,
                              sx: { mt: 0.5 },
                              component: "span",
                            }}
                          />
                          <Tooltip title="Copier le code" placement="top">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleCopy(userPack.referral_code)}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ListItem>

                        {/* Date d'expiration */}
                        {userPack.expiry_date && (
                          <ListItem
                            disablePadding
                            sx={{
                              py: 1.5,
                              borderBottom: "1px solid",
                              borderColor: isDarkMode
                                ? "rgba(255, 255, 255, 0.05)"
                                : "rgba(0, 0, 0, 0.05)",
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CalendarMonth
                                fontSize="small"
                                color={
                                  userPack.status === "expired"
                                    ? "error"
                                    : "action"
                                }
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                userPack.status === "expired"
                                  ? "Expiré le"
                                  : "Expire le"
                              }
                              secondary={
                                <>
                                  {new Date(
                                    userPack.expiry_date
                                  ).toLocaleDateString()}
                                  {userPack.status !== "expired" && (
                                    <Typography
                                      variant="caption"
                                      component="span"
                                      sx={{
                                        mt: 0.5,
                                        display: "block",
                                        color: getRemainingTimeColor(
                                          userPack.expiry_date
                                        ),
                                      }}
                                    >
                                      {formatRemainingTime(
                                        userPack.expiry_date
                                      )}
                                    </Typography>
                                  )}
                                </>
                              }
                              primaryTypographyProps={{
                                variant: "caption",
                                color:
                                  userPack.status === "expired"
                                    ? "error.main"
                                    : "text.secondary",
                              }}
                              secondaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 600,
                                color:
                                  userPack.status === "expired"
                                    ? "error.main"
                                    : undefined,
                                sx: { mt: 0.5 },
                                component: "span",
                              }}
                            />
                          </ListItem>
                        )}
                        {/* Utilisateur */}
                        {userPack.user && (
                          <ListItem disablePadding sx={{ py: 1.5 }}>
                            <ListItemAvatar sx={{ minWidth: 50 }}>
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {userPack.user.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary="Utilisateur"
                              secondary={userPack.user.name}
                              primaryTypographyProps={{
                                variant: "caption",
                                color: "text.secondary",
                                component: "span",
                              }}
                              secondaryTypographyProps={{
                                variant: "body2",
                                fontWeight: 600,
                                component: "span",
                              }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                    {/* Actions */}
                    <CardActions
                      sx={{
                        px: 3,
                        pb: 3,
                        pt: 2,
                        mt: "auto",
                        justifyContent: "space-between",
                        borderTop: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.04)",
                        background: isDarkMode
                          ? "rgba(99, 102, 241, 0.02)"
                          : "rgba(99, 102, 241, 0.01)",
                      }}
                    >
                      {/* Groupe d'actions à gauche : stats, filleuls */}
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip
                          title="Statistiques détaillées"
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleStatsClick(userPack.pack.id)}
                            sx={{
                              color: "primary.main",
                              "&:hover": {
                                background: isDarkMode
                                  ? "rgba(99, 102, 241, 0.1)"
                                  : "rgba(99, 102, 241, 0.05)",
                              },
                            }}
                          >
                            <ChartBarIcon className="h-5 w-5" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Voir les filleuls" placement="top">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleReferralsClick(userPack.pack.id)
                            }
                            sx={{
                              color: "#10b981",
                              "&:hover": {
                                background: isDarkMode
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : "rgba(16, 185, 129, 0.05)",
                              },
                            }}
                          >
                            <UsersIcon className="h-5 w-5" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {/* Bouton renouveler visible seulement si le pack est expiré ou sur le point d'expirer */}
                      {(isPackExpired(userPack.expiry_date, userPack.status) ||
                        isPackExpiringSoon(userPack.expiry_date)) && (
                        <Button
                          variant={
                            isPackExpired(userPack.expiry_date, userPack.status)
                              ? "contained"
                              : "outlined"
                          }
                          color={
                            isPackExpired(userPack.expiry_date, userPack.status)
                              ? "error"
                              : "warning"
                          }
                          onClick={() => handleRenewClick(userPack)}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 600,
                            textTransform: "none",
                            px: 2,
                            ...(isPackExpired(
                              userPack.expiry_date,
                              userPack.status
                            ) && {
                              background:
                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                              },
                            }),
                            ...(isPackExpiringSoon(userPack.expiry_date) &&
                              !isPackExpired(
                                userPack.expiry_date,
                                userPack.status
                              ) && {
                                borderColor: "#f59e0b",
                                color: "#f59e0b",
                                "&:hover": {
                                  borderColor: "#d97706",
                                  background: "rgba(245, 158, 11, 0.1)",
                                },
                              }),
                          }}
                          startIcon={
                            isPackExpired(
                              userPack.expiry_date,
                              userPack.status
                            ) ? (
                              <ExclamationTriangleIcon className="h-4 w-4" />
                            ) : (
                              <ClockIcon className="h-4 w-4" />
                            )
                          }
                        >
                          {isPackExpired(userPack.expiry_date, userPack.status)
                            ? "Renouveler"
                            : "Renouveler"}
                        </Button>
                      )}
                    </CardActions>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}
      <Dialog
        open={renewDialog}
        onClose={handleRenewClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(1px)",
            backgroundColor: "transparent", // Forcer la transparence totale de l'overlay
          },
          "& .MuiBackdrop-root": {
            backgroundColor: "transparent !important", // Override MUI backdrop
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            bgcolor: isDarkMode ? "#1f2937" : "background.paper",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          },
        }}
      >
        <PurchasePackForm
          onPurchaseSuccess={fetchUserPacks}
          open={renewDialog}
          onClose={handleRenewClose}
          pack={selectedPack?.pack}
          isRenewal={true}
        />
      </Dialog>
      {/* Dialogs for Stats and Referrals */}
      <PackStatsModal
        open={statsDialog}
        onClose={() => {
          setStatsDialog(false);
          setSelectedPackId(null);
        }}
        packId={selectedPackId}
      />

      <Dialog
        open={referralsDialog}
        onClose={() => setReferralsDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isFullScreen}
        BackdropProps={{
          style: {
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: isFullScreen ? 0 : "20px",
            background: isDarkMode
              ? "linear-gradient(145deg, #1e293b 0%, #0f172a 50%, #1e1b2e 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
            boxShadow: isDarkMode
              ? "0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
              : "0 25px 80px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            overflow: "hidden",
            transition: { duration: 0.4, ease: "easeOut" },
            border: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.08)",
          },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
      >
        <DialogTitle
          component={motion.div}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          sx={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(51, 65, 85, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 50%, rgba(226, 232, 240, 0.98) 100%)",
            color: isDarkMode ? "#f1f5f9" : "#1e293b",
            borderBottom: "none",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: { xs: "flex-start", sm: "space-between" },
            px: { xs: 2, sm: 3.5 },
            py: { xs: 2.5, sm: 3 },
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: isDarkMode
                ? "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)"
                : "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: isDarkMode
                ? "linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8))"
                : "linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.6))",
            },
          }}
        >
          {/* Header Section - Titre et devise */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, sm: 1.5 },
              width: { xs: "100%", sm: "auto" },
              order: { xs: 1, sm: 1 },
              mb: { xs: 2, sm: 0 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: "44px", sm: "40px" },
                  height: { xs: "44px", sm: "40px" },
                  borderRadius: "14px",
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                  border: isDarkMode
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <UsersIcon
                  sx={{
                    fontSize: { xs: "24px", sm: "22px" },
                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                    lineHeight: 1.2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
                      : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Arbre des filleuls
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    mt: 0.5,
                    fontWeight: 500,
                  }}
                >
                  Génération 1 à 4 • {selectedCurrency === "USD" ? "Dollars" : "Francs Congolais"}
                </Typography>
              </Box>
            </Box>
            
            {/* Badge devise - desktop only */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1.2,
                borderRadius: "16px",
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))",
                border: isDarkMode
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : "1px solid rgba(16, 185, 129, 0.2)",
                backdropFilter: "blur(8px)",
                boxShadow: isDarkMode
                  ? "0 2px 8px rgba(16, 185, 129, 0.2)"
                  : "0 2px 8px rgba(16, 185, 129, 0.1)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color:
                    selectedCurrency === "USD"
                      ? isDarkMode ? "#34d399" : "#10b981"
                      : isDarkMode ? "#fbbf24" : "#f59e0b",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                {selectedCurrency}
              </Typography>
            </Box>
          </Box>

          {/* Controls Section - Boutons et actions */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: { xs: 2, sm: 2 },
              width: { xs: "100%", sm: "auto" },
              order: { xs: 2, sm: 2 },
            }}
          >
            {/* View Mode Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", sm: "row" },
                gap: { xs: 1, sm: 1.5 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ flex: { xs: 1, sm: "none" } }}
              >
                <Button
                  variant={viewMode === "table" ? "contained" : "outlined"}
                  onClick={() => setViewMode("table")}
                  size="small"
                  startIcon={
                    <Box
                      component="span"
                      sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        mr: { xs: 1, sm: 0 }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    </Box>
                  }
                  sx={{
                    borderRadius: "16px",
                    height: { xs: "52px", sm: "42px" },
                    minWidth: { xs: "100%", sm: "48px" },
                    width: { xs: "100%", sm: "auto" },
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", sm: "0.875rem" },
                    boxShadow:
                      viewMode === "table"
                        ? "0 6px 20px rgba(59, 130, 246, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    px: { xs: 2.5, sm: 2 },
                    py: 1,
                    justifyContent: { xs: "flex-start", sm: "center" },
                    gap: { xs: 1.5, sm: 0 },
                    background: viewMode === "table"
                      ? (isDarkMode 
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(147, 51, 234, 0.95))")
                      : (isDarkMode 
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))"),
                    border: isDarkMode
                      ? "1px solid rgba(59, 130, 246, 0.2)"
                      : "1px solid rgba(59, 130, 246, 0.3)",
                    color: viewMode === "table" 
                      ? "#ffffff"
                      : (isDarkMode ? "#e2e8f0" : "#1e293b"),
                    "&:hover": {
                      background: viewMode === "table"
                        ? (isDarkMode 
                            ? "linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(147, 51, 234, 1))"
                            : "linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(147, 51, 234, 1))")
                        : (isDarkMode 
                            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 1))"),
                      boxShadow: viewMode === "table"
                        ? "0 8px 25px rgba(59, 130, 246, 0.4)"
                        : "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <Box sx={{ display: { xs: "block", sm: "none" } }}>
                    Vue Tableau
                  </Box>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ flex: { xs: 1, sm: "none" } }}
              >
                <Button
                  variant={viewMode === "tree" ? "contained" : "outlined"}
                  onClick={() => setViewMode("tree")}
                  size="small"
                  startIcon={
                    <Box
                      component="span"
                      sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        mr: { xs: 1, sm: 0 }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </Box>
                  }
                  sx={{
                    borderRadius: "16px",
                    height: { xs: "52px", sm: "42px" },
                    minWidth: { xs: "100%", sm: "48px" },
                    width: { xs: "100%", sm: "auto" },
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: { xs: "0.9rem", sm: "0.875rem" },
                    boxShadow:
                      viewMode === "tree"
                        ? "0 6px 20px rgba(16, 185, 129, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    px: { xs: 2.5, sm: 2 },
                    py: 1,
                    justifyContent: { xs: "flex-start", sm: "center" },
                    gap: { xs: 1.5, sm: 0 },
                    background: viewMode === "tree"
                      ? (isDarkMode 
                          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(59, 130, 246, 0.9))"
                          : "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.95))")
                      : (isDarkMode 
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))"),
                    border: isDarkMode
                      ? "1px solid rgba(16, 185, 129, 0.2)"
                      : "1px solid rgba(16, 185, 129, 0.3)",
                    color: viewMode === "tree" 
                      ? "#ffffff"
                      : (isDarkMode ? "#e2e8f0" : "#1e293b"),
                    "&:hover": {
                      background: viewMode === "tree"
                        ? (isDarkMode 
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(59, 130, 246, 1))"
                            : "linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(59, 130, 246, 1))")
                        : (isDarkMode 
                            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.08))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 1))"),
                      boxShadow: viewMode === "tree"
                        ? "0 8px 25px rgba(16, 185, 129, 0.4)"
                        : "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <Box sx={{ display: { xs: "block", sm: "none" } }}>
                    Vue Arbre
                  </Box>
                </Button>
              </motion.div>
            </Box>

            {/* Action Controls */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "space-between", sm: "flex-end" },
                gap: 1.5,
              }}
            >
              {/* Mobile Currency Badge */}
              <Box
                sx={{
                  display: { xs: "flex", sm: "none" },
                  alignItems: "center",
                  gap: 1,
                  px: 2.5,
                  py: 1.2,
                  borderRadius: "20px",
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))"
                    : "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))",
                  border: isDarkMode
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(16, 185, 129, 0.2)",
                  backdropFilter: "blur(10px)",
                  boxShadow: isDarkMode
                    ? "0 4px 12px rgba(16, 185, 129, 0.2)"
                    : "0 4px 12px rgba(16, 185, 129, 0.1)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color:
                      selectedCurrency === "USD"
                        ? isDarkMode ? "#34d399" : "#10b981"
                        : isDarkMode ? "#fbbf24" : "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {selectedCurrency}
                </Typography>
              </Box>

              {/* Fullscreen Button */}
              <Tooltip
                title={
                  isFullScreen ? "Quitter le mode plein écran" : "Plein écran"
                }
                arrow
              >
                <IconButton
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  sx={{
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.8))",
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.15)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      background: isDarkMode
                        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1))"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 1))",
                      color: isDarkMode ? "#f1f5f9" : "#1e293b",
                    },
                    width: { xs: "48px", sm: "44px" },
                    height: { xs: "48px", sm: "44px" },
                    borderRadius: "16px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {isFullScreen ? (
                    <FullscreenExit sx={{ fontSize: 24 }} />
                  ) : (
                    <Fullscreen sx={{ fontSize: 24 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            bgcolor: isDarkMode ? "transparent" : "transparent",
            color: isDarkMode ? "grey.100" : "text.primary",
            p: 0,
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)"
              : "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {currentPackReferrals && (
            <Box sx={{ width: "100%", height: "100%" }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs
                  value={currentTab}
                  onChange={(e, newValue) => {
                    setCurrentTab(newValue);
                    // Recharger les données avec le nouvel onglet
                    if (selectedPackId) {
                      const updatedFilters = {
                        ...referralsPagination,
                        page: 1, // Retour à la première page lors du changement d'onglet
                        generation_tab: newValue,
                      };
                      handleReferralsClick(selectedPackId, 1, updatedFilters);
                    }
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.08)"
                      : "1px solid rgba(0, 0, 0, 0.08)",
                    bgcolor: isDarkMode
                      ? "rgba(30, 41, 59, 0.6)"
                      : "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    "& .MuiTab-root": {
                      color: isDarkMode ? "grey.400" : "text.secondary",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      minHeight: 48,
                      px: 2,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        color: isDarkMode ? "primary.light" : "primary.main",
                        bgcolor: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.04)",
                      },
                      "&.Mui-selected": {
                        color: isDarkMode ? "primary.light" : "primary.main",
                        fontWeight: 600,
                      },
                    },
                    "& .MuiTabs-indicator": {
                      background: isDarkMode
                        ? "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)"
                        : "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                      height: 3,
                      borderRadius: "3px 3px 0 0",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                    },
                    "& .MuiTabs-scrollButtons": {
                      color: isDarkMode ? "grey.400" : "text.secondary",
                    },
                  }}
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <Tab
                      key={index}
                      label={`${
                        ["Première", "Deuxième", "Troisième", "Quatrième"][
                          index
                        ]
                      } génération`}
                      sx={{
                        fontWeight: 500,
                        textTransform: "none",
                        minWidth: "auto",
                        px: 3,
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    {/* Bouton pour afficher/masquer les filtres */}
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      variant="outlined"
                      size="small"
                      startIcon={
                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                      }
                      sx={{
                        alignSelf: "flex-start",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        px: 2.5,
                        py: 1,
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(0, 0, 0, 0.2)",
                        color: isDarkMode ? "grey.200" : "text.primary",
                        background: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.3)"
                            : "rgba(0, 0, 0, 0.3)",
                          background: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                          transform: "translateY(-1px)",
                          boxShadow: isDarkMode
                            ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                            : "0 4px 12px rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      {showFilters
                        ? "Masquer les filtres"
                        : "Afficher les filtres"}
                    </Button>

                    {/* Section des filtres - conditionnellement affichée */}
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {/* Section des filtres avec design moderne */}
                        <Box
                          sx={{
                            background: isDarkMode
                              ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)"
                              : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)",
                            borderRadius: "20px",
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.08)",
                            boxShadow: isDarkMode
                              ? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                              : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            p: 3,
                            mt: 2,
                            position: "relative",
                            overflow: "hidden",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: "3px",
                              background: isDarkMode
                                ? "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)"
                                : "linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)",
                              borderRadius: "20px 20px 0 0",
                            },
                          }}
                        >
                          {/* Header de la section filtres */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 3,
                              pb: 2,
                              borderBottom: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.08)"
                                : "1px solid rgba(0, 0, 0, 0.06)",
                            }}
                          >
                            <Box
                              sx={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                background: isDarkMode
                                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
                                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
                                border: isDarkMode
                                  ? "1px solid rgba(59, 130, 246, 0.3)"
                                  : "1px solid rgba(59, 130, 246, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: isDarkMode ? "#60a5fa" : "#3b82f6" }}
                              >
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                              </svg>
                            </Box>
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "1.1rem",
                                  background: isDarkMode
                                    ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
                                    : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                }}
                              >
                                Filtres avancés
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "0.85rem",
                                  color: isDarkMode ? "#94a3b8" : "#64748b",
                                  mt: 0.25,
                                }}
                              >
                                Recherchez et filtrez les filleuls
                              </Typography>
                            </Box>
                          </Box>

                          {/* Champ de recherche */}
                          <TextField
                            placeholder="Rechercher par nom, code ou pack..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="medium"
                            fullWidth
                            sx={{
                              mb: 3,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "16px",
                                bgcolor: isDarkMode
                                  ? "rgba(15, 23, 42, 0.6)"
                                  : "rgba(255, 255, 255, 0.8)",
                                border: isDarkMode
                                  ? "1px solid rgba(255, 255, 255, 0.1)"
                                  : "1px solid rgba(0, 0, 0, 0.08)",
                                boxShadow: isDarkMode
                                  ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                                  : "0 4px 12px rgba(0, 0, 0, 0.05)",
                                "&:hover": {
                                  borderColor: isDarkMode
                                    ? "rgba(59, 130, 246, 0.5)"
                                    : "rgba(59, 130, 246, 0.3)",
                                  boxShadow: isDarkMode
                                    ? "0 6px 16px rgba(0, 0, 0, 0.3)"
                                    : "0 6px 16px rgba(0, 0, 0, 0.1)",
                                },
                                "&.Mui-focused": {
                                  borderColor: isDarkMode
                                    ? "#60a5fa"
                                    : "#3b82f6",
                                  boxShadow: isDarkMode
                                    ? "0 0 0 3px rgba(96, 165, 250, 0.2)"
                                    : "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                  bgcolor: isDarkMode
                                    ? "rgba(15, 23, 42, 0.8)"
                                    : "rgba(255, 255, 255, 0.95)",
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                                fontWeight: 500,
                              },
                              "& .MuiOutlinedInput-input": {
                                color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                fontWeight: 500,
                                py: 1.5,
                              },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: isDarkMode ? "#60a5fa" : "#3b82f6" }}
                                  >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </InputAdornment>
                              ),
                            }}
                          />

                          {/* Filtres secondaires */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                              gap: 2,
                              mb: 3,
                            }}
                          >
                            <FormControl
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "16px",
                                  bgcolor: isDarkMode
                                    ? "rgba(15, 23, 42, 0.6)"
                                    : "rgba(255, 255, 255, 0.8)",
                                  border: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.1)"
                                    : "1px solid rgba(0, 0, 0, 0.08)",
                                  boxShadow: isDarkMode
                                    ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.05)",
                                  "&:hover": {
                                    borderColor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.5)"
                                      : "rgba(59, 130, 246, 0.3)",
                                  },
                                  "&.Mui-focused": {
                                    borderColor: isDarkMode
                                      ? "#60a5fa"
                                      : "#3b82f6",
                                    boxShadow: isDarkMode
                                      ? "0 0 0 3px rgba(96, 165, 250, 0.2)"
                                      : "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                  },
                                },
                              }}
                            >
                              <InputLabel
                                sx={{
                                  color: isDarkMode ? "#94a3b8" : "#64748b",
                                  fontWeight: 500,
                                  "&.Mui-focused": {
                                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                                  },
                                }}
                              >
                                Statut
                              </InputLabel>
                              <Select
                                labelId="status-filter-label"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Statut"
                                sx={{
                                  color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                  fontWeight: 500,
                                }}
                              >
                                <MenuItem value="all">Tous les statuts</MenuItem>
                                <MenuItem value="active">Actif</MenuItem>
                                <MenuItem value="inactive">Inactif</MenuItem>
                                <MenuItem value="expired">Expiré</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              label="Date début"
                              type="date"
                              size="medium"
                              fullWidth
                              value={dateFilter.startDate}
                              onChange={(e) =>
                                setDateFilter((prev) => ({
                                  ...prev,
                                  startDate: e.target.value,
                                }))
                              }
                              InputLabelProps={{ shrink: true }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "16px",
                                  bgcolor: isDarkMode
                                    ? "rgba(15, 23, 42, 0.6)"
                                    : "rgba(255, 255, 255, 0.8)",
                                  border: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.1)"
                                    : "1px solid rgba(0, 0, 0, 0.08)",
                                  boxShadow: isDarkMode
                                    ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.05)",
                                  "&:hover": {
                                    borderColor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.5)"
                                      : "rgba(59, 130, 246, 0.3)",
                                  },
                                  "&.Mui-focused": {
                                    borderColor: isDarkMode
                                      ? "#60a5fa"
                                      : "#3b82f6",
                                    boxShadow: isDarkMode
                                      ? "0 0 0 3px rgba(96, 165, 250, 0.2)"
                                      : "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  color: isDarkMode ? "#94a3b8" : "#64748b",
                                  fontWeight: 500,
                                  "&.Mui-focused": {
                                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                                  },
                                },
                                "& .MuiOutlinedInput-input": {
                                  color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                  fontWeight: 500,
                                },
                              }}
                            />

                            <TextField
                              label="Date fin"
                              type="date"
                              size="medium"
                              fullWidth
                              value={dateFilter.endDate}
                              onChange={(e) =>
                                setDateFilter((prev) => ({
                                  ...prev,
                                  endDate: e.target.value,
                                }))
                              }
                              InputLabelProps={{ shrink: true }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "16px",
                                  bgcolor: isDarkMode
                                    ? "rgba(15, 23, 42, 0.6)"
                                    : "rgba(255, 255, 255, 0.8)",
                                  border: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.1)"
                                    : "1px solid rgba(0, 0, 0, 0.08)",
                                  boxShadow: isDarkMode
                                    ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.05)",
                                  "&:hover": {
                                    borderColor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.5)"
                                      : "rgba(59, 130, 246, 0.3)",
                                  },
                                  "&.Mui-focused": {
                                    borderColor: isDarkMode
                                      ? "#60a5fa"
                                      : "#3b82f6",
                                    boxShadow: isDarkMode
                                      ? "0 0 0 3px rgba(96, 165, 250, 0.2)"
                                      : "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                  },
                                },
                                "& .MuiInputLabel-root": {
                                  color: isDarkMode ? "#94a3b8" : "#64748b",
                                  fontWeight: 500,
                                  "&.Mui-focused": {
                                    color: isDarkMode ? "#60a5fa" : "#3b82f6",
                                  },
                                },
                                "& .MuiOutlinedInput-input": {
                                  color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                  fontWeight: 500,
                                },
                              }}
                            />
                          </Box>

                          {/* Boutons d'action */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              variant="outlined"
                              size="large"
                              onClick={resetFilters}
                              startIcon={
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                  <path d="M3 3v5h5"></path>
                                </svg>
                              }
                              sx={{
                                borderRadius: "16px",
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                py: 1.5,
                                height: "48px",
                                borderColor: isDarkMode
                                  ? "rgba(255, 255, 255, 0.2)"
                                  : "rgba(0, 0, 0, 0.15)",
                                color: isDarkMode ? "#cbd5e1" : "#475569",
                                background: isDarkMode
                                  ? "rgba(255, 255, 255, 0.05)"
                                  : "rgba(255, 255, 255, 0.8)",
                                "&:hover": {
                                  borderColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.3)"
                                    : "rgba(0, 0, 0, 0.25)",
                                  background: isDarkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(255, 255, 255, 1)",
                                  color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                },
                              }}
                            >
                              Réinitialiser
                            </Button>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={applyFilters}
                              startIcon={
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                              }
                              sx={{
                                borderRadius: "16px",
                                textTransform: "none",
                                fontWeight: 700,
                                px: 3,
                                py: 1.5,
                                height: "48px",
                                background: isDarkMode
                                  ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                                  : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                                boxShadow: isDarkMode
                                  ? "0 8px 24px rgba(59, 130, 246, 0.4)"
                                  : "0 8px 24px rgba(59, 130, 246, 0.3)",
                                "&:hover": {
                                  background: isDarkMode
                                    ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                                    : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                                  boxShadow: isDarkMode
                                    ? "0 12px 32px rgba(59, 130, 246, 0.5)"
                                    : "0 12px 32px rgba(59, 130, 246, 0.4)",
                                },
                              }}
                            >
                              Appliquer les filtres
                            </Button>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </Box>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2,
                      bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.02)",
                      border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: { xs: 2, sm: 4 },
                        flexWrap: "wrap",
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Filleuls dans cette génération
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 600,
                            color: isDarkMode
                              ? "primary.light"
                              : "primary.main",
                          }}
                        >
                          {currentPackReferrals[currentTab]?.length || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Commission totale générée
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 600,
                            color: isDarkMode
                              ? "primary.light"
                              : "primary.main",
                          }}
                        >
                          {(() => {
                            const total = (
                              currentPackReferrals[currentTab] || []
                            ).reduce((sum, ref) => {
                              if (selectedCurrency === "USD") {
                                return (
                                  sum +
                                  parseFloat(ref.total_commission_usd || 0)
                                );
                              } else {
                                return (
                                  sum +
                                  parseFloat(ref.total_commission_cdf || 0)
                                );
                              }
                            }, 0);

                            return selectedCurrency === "USD"
                              ? `$${total.toFixed(2)}`
                              : new Intl.NumberFormat("fr-CD", {
                                  style: "currency",
                                  currency: "CDF",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(total);
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                    {viewMode === "table" && (
                      <div
                        className="relative"
                        ref={exportMenuRef}
                        style={{ marginLeft: "auto" }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            startIcon={
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            }
                            endIcon={
                              showExportMenu ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )
                            }
                            sx={{
                              color: isDarkMode ? "grey.300" : "primary.main",
                              borderColor: isDarkMode
                                ? "grey.700"
                                : "primary.main",
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 500,
                              "&:hover": {
                                borderColor: isDarkMode
                                  ? "grey.500"
                                  : "primary.dark",
                                bgcolor: isDarkMode
                                  ? "rgba(255, 255, 255, 0.05)"
                                  : undefined,
                              },
                            }}
                          >
                            Exporter
                          </Button>
                        </motion.div>

                        {showExportMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg ${
                              isDarkMode
                                ? "bg-gray-800 border border-gray-700"
                                : "bg-white border border-gray-200"
                            } z-50`}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => exportToExcel("current")}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  isDarkMode
                                    ? "text-gray-300 hover:bg-gray-700"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                Exporter les filleuls filtrés
                              </button>
                              <button
                                onClick={() => exportToExcel("all")}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  isDarkMode
                                    ? "text-gray-300 hover:bg-gray-700"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                Exporter tous les filleuls
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </Paper>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {viewMode === "table" ? (
                    <>
                      {/* Tableau des filleuls */}
                      {!currentPackReferrals[currentTab] || currentPackReferrals[currentTab].length === 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Aucun filleul trouvé
                        </Alert>
                      ) : (
                        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                          <Table stickyHeader aria-label="referrals table">
                            <TableHead>
                              <TableRow
                                sx={{
                                  bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                                  "& th": {
                                    fontWeight: "bold",
                                    color: isDarkMode ? "#fff" : "#334155",
                                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                    padding: { xs: "8px 10px", sm: "12px 16px" },
                                    borderBottom: isDarkMode
                                      ? "1px solid #374151"
                                      : "2px solid #e2e8f0",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    whiteSpace: "nowrap",
                                  },
                                }}
                              >
                                <TableCell sx={{ width: { xs: "60px", sm: "80px" } }}>ID</TableCell>
                                {currentTab >= 1 && <TableCell sx={{ width: { xs: "150px", sm: "180px" } }}>Parrain</TableCell>}
                                <TableCell sx={{ width: { xs: "150px", sm: "180px" } }}>Nom</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Date d'achat</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Pack acheté</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Expiration</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Code parrain</TableCell>
                                <TableCell sx={{ width: { xs: "80px", sm: "100px" } }}>Statut</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Commission</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {currentPackReferrals[currentTab].map((referral) => (
                                <TableRow
                                  key={referral.id}
                                  sx={{
                                    "&:nth-of-type(odd)": {
                                      backgroundColor: isDarkMode ? "#0f172a" : "#f9fafb",
                                    },
                                    "&:hover": {
                                      backgroundColor: isDarkMode ? "#1e293b" : "#f3f4f6",
                                    },
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.id || "-"}
                                  </TableCell>
                                  {currentTab >= 1 && (
                                    <TableCell
                                      sx={{
                                        color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                        borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                      }}
                                    >
                                      {referral.sponsor_name || "-"}
                                    </TableCell>
                                  )}
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.name || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.purchase_date || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.pack_name || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.expiry_date || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {referral.referral_code || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    <span style={{ backgroundColor: referral?.pack_status === "active" ? "#10B981" : "#F59E0B", color: referral?.pack_status === "active" ? "#FFFFFF" : "#000000", borderRadius: "4px", padding: "4px 8px" }}>{referral?.pack_status === "active" ? "Actif" : "Inactif"}</span>
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                      borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    }}
                                  >
                                    {selectedCurrency === "USD"
                                      ? referral.total_commission_usd || "0"
                                      : referral.total_commission_cdf || "0"}{" "}{selectedCurrency === "USD" ? "$" : "FC"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {/* Pagination */}
                      {referralsPaginationMeta &&
                        referralsPaginationMeta[currentTab] && (
                        <TablePagination
                          rowsPerPageOptions={[1, 5, 10, 25, 50]}
                          component="div"
                          count={referralsPaginationMeta[currentTab]?.total || 0}
                          rowsPerPage={referralsRowsPerPage}
                          page={referralsPage}
                          onPageChange={handleReferralsPageChangeUI}
                          onRowsPerPageChange={handleReferralsRowsPerPageChange}
                          labelRowsPerPage="Lignes par page:"
                          labelDisplayedRows={({ from, to, count }) =>
                            `Affichage de ${from} à ${to} sur ${count} filleuls`
                          }
                          sx={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                            color: isDarkMode ? "#e2e8f0" : "#1f2937",
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Box
                      sx={{
                        height: 500,
                        position: "relative",
                        bgcolor: isDarkMode
                          ? "#1a2433"
                          : "rgba(255, 255, 255, 0.9)",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "1px solid rgba(0, 0, 0, 0.05)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <Tree
                        ref={treeRef}
                        data={transformDataToTree(currentPackReferrals || [])}
                        orientation="vertical"
                        renderCustomNodeElement={(props) => (
                          <CustomNode {...props} isDarkMode={isDarkMode} selectedCurrency={selectedCurrency} />
                        )}
                        pathFunc="step"
                        separation={{ siblings: 1, nonSiblings: 1.2 }}
                        translate={{ x: 400, y: 50 }}
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
        <DialogActions
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          sx={{
            bgcolor: isDarkMode
              ? "linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)"
              : "linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
            borderTop: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            p: 3,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <Button
            onClick={() => setReferralsDialog(false)}
            variant="outlined"
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.2,
              fontSize: "0.875rem",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
              color: isDarkMode ? "grey.200" : "text.primary",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.02)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.3)"
                  : "rgba(0, 0, 0, 0.3)",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
                transform: "translateY(-1px)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
