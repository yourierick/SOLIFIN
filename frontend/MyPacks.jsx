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

const CustomNode = ({ nodeDatum, isDarkMode, toggleNode }) => {
  const [isHovered, setIsHovered] = useState(false);

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
            Commission: {nodeDatum.attributes.commission}
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
  const { isCDFEnabled, canUseCDF } = useCurrency();
  const [userPacks, setUserPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsDialog, setStatsDialog] = useState(false);
  const [referralsDialog, setReferralsDialog] = useState(false);
  const [currentPackStats, setCurrentPackStats] = useState(null);
  const [currentPackReferrals, setCurrentPackReferrals] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
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

  // État pour stocker les métadonnées de pagination
  const [referralsPaginationMeta, setReferralsPaginationMeta] = useState([]);

  const handleReferralsClick = async (packId, newPage = 1, filters = {}) => {
    try {
      // Définir le pack sélectionné
      setSelectedPackId(packId);

      // Mise à jour des paramètres de pagination
      const paginationParams = {
        ...referralsPagination,
        page: newPage,
        ...filters,
      };

      // Construction des paramètres de requête
      const queryParams = new URLSearchParams();
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== "") queryParams.append(key, value);
      });
      queryParams.append("generation_tab", currentTab);

      // Appel API avec paramètres de pagination
      const response = await axios.get(
        `/api/packs/${packId}/referrals?${queryParams.toString()}`
      );

      if (response.data && response.data.success) {
        setCurrentPackReferrals(response.data.data);
        setReferralsPaginationMeta(response.data.pagination || []);
        setReferralsPagination((prev) => ({
          ...prev,
          page: newPage,
          ...filters,
        }));
        if (!filters.generation_tab) {
          setCurrentTab(0); // Ne réinitialiser l'onglet que si ce n'est pas un changement d'onglet
        }
        setSearchTerm("");
        setReferralsDialog(true);
      } else {
        Notification.error("Erreur lors du chargement des filleuls");
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      Notification.error("Erreur lors du chargement des filleuls");
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
        commission: selectedCurrency === "USD" ? "$0.00" : "0 FC",
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
          commission:
            selectedCurrency === "USD"
              ? `$${parseFloat(ref.total_commission_usd || 0).toFixed(2)}`
              : new Intl.NumberFormat("fr-CD", {
                  style: "currency",
                  currency: "CDF",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseFloat(ref.total_commission_cdf || 0)),
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
                  commission:
                    selectedCurrency === "USD"
                      ? `$${parseFloat(ref.total_commission_usd || 0).toFixed(
                          2
                        )}`
                      : new Intl.NumberFormat("fr-CD", {
                          style: "currency",
                          currency: "CDF",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(parseFloat(ref.total_commission_cdf || 0)),
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
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      ...getCardStyle(userPack, isDarkMode),
                      "&:hover": {
                        transform: "translateY(-6px)",
                        ...(isPackExpired(userPack.expiry_date, userPack.status)
                          ? {
                              border: "1px solid rgba(239, 68, 68, 0.5)",
                              boxShadow: "0 8px 25px rgba(239, 68, 68, 0.15)",
                            }
                          : isPackExpiringSoon(userPack.expiry_date)
                          ? {
                              border: "1px solid rgba(245, 158, 11, 0.5)",
                              boxShadow: "0 8px 25px rgba(245, 158, 11, 0.15)",
                            }
                          : {
                              border: isDarkMode
                                ? "1px solid rgba(99, 102, 241, 0.3)"
                                : "1px solid rgba(99, 102, 241, 0.25)",
                            }),
                      },
                    }}
                  >
                    {/* En-tête avec statut */}
                    <Box
                      sx={{
                        p: 3,
                        borderBottom: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.04)",
                        background: isDarkMode
                          ? "rgba(99, 102, 241, 0.03)"
                          : "rgba(99, 102, 241, 0.02)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: isDarkMode ? "#fff" : "#1f2937",
                                flex: 1,
                              }}
                            >
                              {userPack.pack.name}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: isPackExpired(
                                  userPack.expiry_date,
                                  userPack.status
                                )
                                  ? "#ef4444"
                                  : isPackExpiringSoon(userPack.expiry_date)
                                  ? "#f59e0b"
                                  : "primary.main",
                                fontWeight: 700,
                              }}
                            >
                              ${userPack.pack.price}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isPackExpired(
                                  userPack.expiry_date,
                                  userPack.status
                                )
                                  ? "#ef4444"
                                  : isPackExpiringSoon(userPack.expiry_date)
                                  ? "#f59e0b"
                                  : "text.secondary",
                                fontWeight: 500,
                              }}
                            >
                              /{userPack.pack.abonnement}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={
                            isPackExpired(userPack.expiry_date, userPack.status)
                              ? "Expiré"
                              : isPackExpiringSoon(userPack.expiry_date)
                              ? "Expire bientôt"
                              : getStatusLabel(userPack.status)
                          }
                          color={
                            isPackExpired(userPack.expiry_date, userPack.status)
                              ? "error"
                              : isPackExpiringSoon(userPack.expiry_date)
                              ? "warning"
                              : getStatusColor(userPack.status)
                          }
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: "8px",
                            px: 1,
                          }}
                        />
                      </Box>
                    </Box>
                    {/* Description */}
                    <Box sx={{ p: 3, pb: 2 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          background: isDarkMode
                            ? "rgba(99, 102, 241, 0.05)"
                            : "rgba(99, 102, 241, 0.03)",
                          border: isDarkMode
                            ? "1px solid rgba(99, 102, 241, 0.1)"
                            : "1px solid rgba(99, 102, 241, 0.08)",
                          position: "relative",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "3px",
                            height: "100%",
                            background: isDarkMode
                              ? "linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)"
                              : "linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)",
                            borderRadius: "3px 0 0 3px",
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: isDarkMode ? "#e5e7eb" : "#374151",
                            fontWeight: 500,
                            lineHeight: 1.6,
                            height: "63px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            pl: 1,
                            fontStyle: "italic",
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
            bgcolor: isDarkMode
              ? "linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)"
              : "linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
            color: isDarkMode ? "grey.100" : "text.primary",
            borderBottom: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3.5,
            py: 3,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <UsersIcon
              className="h-6 w-6"
              style={{ color: isDarkMode ? "#4dabf5" : "#1976d2" }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Arbre des filleuls
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: "12px",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
                border: isDarkMode
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(0, 0, 0, 0.08)",
                backdropFilter: "blur(5px)",
                WebkitBackdropFilter: "blur(5px)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color:
                    selectedCurrency === "USD"
                      ? "success.main"
                      : "text.secondary",
                  transition: "all 0.3s ease",
                }}
              >
                USD
              </Typography>
              {canUseCDF() && (
                <>
                  <Switch
                    checked={selectedCurrency === "USD"}
                    onChange={(e) => {
                      const newCurrency = e.target.checked ? "USD" : "CDF";
                      setSelectedCurrency(newCurrency);
                    }}
                    color="primary"
                    size="small"
                    sx={{
                      "& .MuiSwitch-switchBase": {
                        color:
                          selectedCurrency === "USD"
                            ? "success.main"
                            : "info.main",
                        "&.Mui-checked": {
                          color: "success.main",
                        },
                      },
                      "& .MuiSwitch-track": {
                        background: isDarkMode
                          ? "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)"
                          : "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)",
                        opacity: 0.3,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color:
                        selectedCurrency === "CDF"
                          ? "info.main"
                          : "text.secondary",
                      transition: "all 0.3s ease",
                    }}
                  >
                    CDF
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-start" },
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ flex: 1 }}
              >
                <Button
                  variant="contained"
                  onClick={() => setViewMode("table")}
                  size="small"
                  fullWidth
                  startIcon={
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    </Box>
                  }
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                    boxShadow:
                      viewMode === "table"
                        ? "0 4px 8px rgba(0, 0, 0, 0.15)"
                        : "none",
                    minWidth: { xs: 0, sm: "auto" },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  <Box sx={{ display: { xs: "none", sm: "block" } }}></Box>
                  <Box sx={{ display: { xs: "block", sm: "none" } }}></Box>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ flex: 1 }}
              >
                <Button
                  variant="contained"
                  onClick={() => setViewMode("tree")}
                  size="small"
                  fullWidth
                  startIcon={
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
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
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 500,
                    boxShadow:
                      viewMode === "tree"
                        ? "0 4px 8px rgba(0, 0, 0, 0.15)"
                        : "none",
                    minWidth: { xs: 0, sm: "auto" },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  <Box sx={{ display: { xs: "none", sm: "block" } }}></Box>
                  <Box sx={{ display: { xs: "block", sm: "none" } }}></Box>
                </Button>
              </motion.div>
            </Box>
            <Tooltip
              title={
                isFullScreen ? "Quitter le mode plein écran" : "Plein écran"
              }
              arrow
            >
              <IconButton
                onClick={() => setIsFullScreen(!isFullScreen)}
                sx={{
                  ml: { xs: 0, sm: 1 },
                  mt: { xs: 1, sm: 0 },
                  color: isDarkMode ? "grey.300" : "grey.700",
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                  alignSelf: { xs: "flex-end", sm: "auto" },
                }}
              >
                {isFullScreen ? (
                  <FullscreenExit sx={{ fontSize: 22 }} />
                ) : (
                  <Fullscreen sx={{ fontSize: 22 }} />
                )}
              </IconButton>
            </Tooltip>
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
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <TextField
                            placeholder="Rechercher un filleul..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            fullWidth
                            sx={{
                              width: "100%",
                              bgcolor: isDarkMode
                                ? "#1a2433"
                                : "rgba(255, 255, 255, 0.9)",
                              borderRadius: "8px",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                bgcolor: isDarkMode
                                  ? "#1a2433"
                                  : "rgba(255, 255, 255, 0.9)",
                                "&:hover": {
                                  bgcolor: isDarkMode
                                    ? "#1a2433"
                                    : "rgba(255, 255, 255, 1)",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.3)"
                                    : "rgba(0, 0, 0, 0.3)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: isDarkMode
                                      ? "primary.light"
                                      : "primary.main",
                                    borderWidth: "2px",
                                  },
                              },
                              "& .MuiInputLabel-root": {
                                color: isDarkMode ? "grey.400" : undefined,
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: isDarkMode
                                  ? "primary.light"
                                  : "primary.main",
                              },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <MagnifyingGlassIcon
                                    className="h-5 w-5"
                                    style={{
                                      color: isDarkMode
                                        ? "grey.400"
                                        : "inherit",
                                    }}
                                  />
                                </InputAdornment>
                              ),
                            }}
                          />

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "auto auto auto",
                              },
                              gap: 2,
                              width: "100%",
                            }}
                          >
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: { xs: "100%", sm: 120 },
                              }}
                            >
                              <InputLabel
                                id="status-filter-label"
                                sx={{
                                  color: isDarkMode ? "grey.300" : undefined,
                                  "&.Mui-focused": {
                                    color: isDarkMode
                                      ? "primary.light"
                                      : "primary.main",
                                  },
                                }}
                              >
                                Statut
                              </InputLabel>
                              <Select
                                labelId="status-filter-label"
                                value={statusFilter}
                                onChange={(e) =>
                                  setStatusFilter(e.target.value)
                                }
                                label="Statut"
                                sx={{
                                  bgcolor: isDarkMode
                                    ? "#1f2937"
                                    : "rgba(255, 255, 255, 0.9)",
                                  color: isDarkMode ? "grey.300" : undefined,
                                  borderRadius: "8px",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.2)"
                                      : "rgba(0, 0, 0, 0.2)",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.3)"
                                      : "rgba(0, 0, 0, 0.3)",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: isDarkMode
                                        ? "primary.light"
                                        : "primary.main",
                                    },
                                  "& .MuiSelect-icon": {
                                    color: isDarkMode ? "grey.400" : undefined,
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      bgcolor: isDarkMode ? "#1f2937" : "white",
                                      color: isDarkMode
                                        ? "grey.300"
                                        : undefined,
                                      "& .MuiMenuItem-root": {
                                        "&:hover": {
                                          bgcolor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.08)"
                                            : undefined,
                                        },
                                        "&.Mui-selected": {
                                          bgcolor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.15)"
                                            : undefined,
                                          "&:hover": {
                                            bgcolor: isDarkMode
                                              ? "rgba(255, 255, 255, 0.2)"
                                              : undefined,
                                          },
                                        },
                                      },
                                    },
                                  },
                                }}
                              >
                                <MenuItem value="all">Tous</MenuItem>
                                <MenuItem value="active">Actif</MenuItem>
                                <MenuItem value="inactive">Inactif</MenuItem>
                                <MenuItem value="expired">Expiré</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              label="Date début"
                              type="date"
                              size="small"
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
                                bgcolor: isDarkMode
                                  ? "#1f2937"
                                  : "rgba(255, 255, 255, 0.9)",
                                borderRadius: "8px",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  color: isDarkMode ? "grey.300" : undefined,
                                },
                                "& .MuiInputLabel-root": {
                                  color: isDarkMode ? "grey.400" : undefined,
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: isDarkMode
                                    ? "primary.light"
                                    : "primary.main",
                                },
                              }}
                            />
                            <TextField
                              label="Date fin"
                              type="date"
                              size="small"
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
                                bgcolor: isDarkMode
                                  ? "#1f2937"
                                  : "rgba(255, 255, 255, 0.9)",
                                borderRadius: "8px",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  color: isDarkMode ? "grey.300" : undefined,
                                },
                                "& .MuiInputLabel-root": {
                                  color: isDarkMode ? "grey.400" : undefined,
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: isDarkMode
                                    ? "primary.light"
                                    : "primary.main",
                                },
                              }}
                            />
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
                      <DataGrid
                        getRowId={(row) => row.id}
                        rows={currentPackReferrals[currentTab] || []}
                        columns={getColumnsForGeneration(currentTab)}
                        autoHeight
                        disableColumnMenu
                        disableSelectionOnClick
                        hideFooterPagination
                        hideFooter
                        sx={{
                          border: "none",
                          borderRadius: 2,
                          bgcolor: isDarkMode
                            ? "#1a2433"
                            : "rgba(255, 255, 255, 0.9)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                          height: "auto",
                          minHeight: 300,
                          "& .MuiDataGrid-main": {
                            // Configuration uniforme pour tous les cas
                            overflow: "hidden",
                          },
                          "& .MuiDataGrid-virtualScroller": {
                            // Configuration uniforme pour l'ascenseur vertical
                            overflowY: "auto",
                            overflowX: "hidden",
                          },
                          "& .MuiDataGrid-overlay": {
                            // Centrer le message "No rows"
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                          },
                          "& .MuiDataGrid-cell": {
                            color: isDarkMode ? "grey.300" : "inherit",
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "grey.200",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            py: 1.5,
                            px: { xs: 1, sm: 2 },
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                          "& .MuiDataGrid-columnHeaders": {
                            bgcolor: isDarkMode
                              ? "#1a2433"
                              : "rgba(0, 0, 0, 0.05)",
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "grey.200",
                            "& .MuiDataGrid-columnHeaderTitle": {
                              fontWeight: 600,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          },
                          "& .MuiDataGrid-row": {
                            "&:hover": {
                              bgcolor: isDarkMode
                                ? "rgba(255, 255, 255, 0.05)"
                                : "rgba(0, 0, 0, 0.02)",
                            },
                          },
                          "& .MuiDataGrid-footerContainer": {
                            borderTop: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            bgcolor: isDarkMode
                              ? "#1a2433"
                              : "rgba(0, 0, 0, 0.02)",
                          },
                          "& .MuiTablePagination-root": {
                            color: isDarkMode ? "grey.400" : "text.secondary",
                          },
                        }}
                      />

                      {/* Contrôles de pagination personnalisés */}
                      {referralsPaginationMeta &&
                        referralsPaginationMeta[currentTab] && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              justifyContent: "space-between",
                              alignItems: { xs: "center", sm: "center" },
                              gap: { xs: 2, sm: 0 },
                              mt: 2,
                              px: { xs: 1, sm: 2 },
                              py: { xs: 2, sm: 1 },
                              bgcolor: isDarkMode
                                ? "#1a2433"
                                : "rgba(0, 0, 0, 0.02)",
                              borderRadius: "0 0 8px 8px",
                              borderTop: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.1)"
                                : "1px solid rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                order: { xs: 2, sm: 1 },
                                textAlign: { xs: "center", sm: "left" },
                                width: { xs: "100%", sm: "auto" },
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isDarkMode
                                    ? "grey.400"
                                    : "text.secondary",
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  width: { xs: "100%", sm: "auto" },
                                  textAlign: { xs: "center", sm: "left" },
                                }}
                              >
                                Affichage de{" "}
                                {referralsPaginationMeta[currentTab].from} à{" "}
                                {referralsPaginationMeta[currentTab].to} sur{" "}
                                {referralsPaginationMeta[currentTab].total}{" "}
                                filleuls
                              </Typography>
                            </Box>

                            <Pagination
                              count={parseInt(
                                referralsPaginationMeta[currentTab].last_page,
                                10
                              )}
                              page={parseInt(
                                referralsPaginationMeta[currentTab]
                                  .current_page,
                                10
                              )}
                              onChange={(e, page) =>
                                handleReferralsPageChange(selectedPackId, page)
                              }
                              color="primary"
                              size={paginationSize}
                              siblingCount={paginationSiblingCount}
                              boundaryCount={paginationBoundaryCount}
                              sx={{
                                order: { xs: 1, sm: 2 },
                                width: { xs: "100%", sm: "auto" },
                                display: "flex",
                                justifyContent: {
                                  xs: "center",
                                  sm: "flex-end",
                                },
                                "& .MuiPaginationItem-root": {
                                  color: isDarkMode ? "grey.300" : "inherit",
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  minWidth: { xs: "28px", sm: "32px" },
                                  height: { xs: "28px", sm: "32px" },
                                  "&.Mui-selected": {
                                    bgcolor: isDarkMode
                                      ? "primary.dark"
                                      : "primary.light",
                                    color: isDarkMode
                                      ? "common.white"
                                      : "primary.main",
                                    fontWeight: "bold",
                                    "&:hover": {
                                      bgcolor: isDarkMode
                                        ? "primary.main"
                                        : "primary.main",
                                    },
                                  },
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.05)",
                                  },
                                },
                              }}
                            />
                          </Box>
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
                          <CustomNode {...props} isDarkMode={isDarkMode} />
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
