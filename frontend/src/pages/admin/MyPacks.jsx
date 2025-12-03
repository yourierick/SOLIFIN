import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  InputAdornment,
  Avatar,
  Divider,
  Badge,
  Paper,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "../../utils/axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  GiftIcon,
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
import PackStatsModal from "../../components/PackStatsModal";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "@mui/material";
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

export default function MyPacks() {
  const [userPacks, setUserPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewDialog, setRenewDialog] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [duration, setDuration] = useState(1);
  const [renewing, setRenewing] = useState(false);
  const { isDarkMode } = useTheme();
  const { selectedCurrency, setSelectedCurrency, canUseCDF } = useCurrency();
  
  // États pour la pagination backend
  const [referralsPage, setReferralsPage] = useState(0);
  const [referralsRowsPerPage, setReferralsRowsPerPage] = useState(25);
  const [referralsPaginationMeta, setReferralsPaginationMeta] = useState([]);
  const [statsDialog, setStatsDialog] = useState(false);
  const [referralsDialog, setReferralsDialog] = useState(false);
  const [currentPackStats, setCurrentPackStats] = useState(null);
  const [currentPackReferrals, setCurrentPackReferrals] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
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
  const [selectedPackId, setSelectedPackId] = useState(null);

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
        } else {
          dateMatch = false;
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });
  };

  // Calculer les statistiques de la génération actuelle
  const currentGenerationStats = React.useMemo(() => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) return null;

    const referrals = currentPackReferrals[currentTab];
    return {
      total: referrals.length,
      totalCommission: referrals
        .reduce((sum, ref) => sum + parseFloat(ref.total_commission || 0), 0)
        .toFixed(2),
    };
  }, [currentPackReferrals, currentTab]);

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
          const currentGenRefs = referrals[gen - 1];

          // Fonction récursive pour trouver le nœud parent
          const findParentNode = (nodes, sponsorId) => {
            for (let node of nodes) {
              if (node.attributes.userId === sponsorId) {
                return node;
              }
              if (node.children) {
                const found = findParentNode(node.children, sponsorId);
                if (found) return found;
              }
            }
            return null;
          };

          // Ajouter chaque filleul à son parent
          currentGenRefs.forEach((ref) => {
            const parentNode = findParentNode(
              rootNode.children,
              ref.sponsor_id
            );
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
      // Créer un objet pour chaque ligne d'export
      return {
        Nom: referral.name || "N/A",
        "Date d'achat": referral.purchase_date || "N/A",
        "Pack acheté": referral.pack_name || "N/A",
        "Prix du pack": `${parseFloat(referral.pack_price || 0).toFixed(2)}$`,
        "Date d'expiration": referral.expiry_date || "N/A",
        "Code parrain": referral.referral_code || "N/A",
        Statut: referral.pack_status === "active" ? "Actif" : "Inactif",
        Commission: `${parseFloat(referral.total_commission || 0).toFixed(2)}$`,
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
    const infoData = [
      ["Arbre des filleuls - Génération " + (currentTab + 1)],
      ["Date d'export", new Date().toLocaleDateString("fr-FR")],
      ["Nombre de filleuls", dataToExport.length.toString()],
      [
        "Commission totale",
        `${dataToExport
          .reduce((sum, ref) => sum + parseFloat(ref.total_commission || 0), 0)
          .toFixed(2)}$`,
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
    <Container sx={{ py: 4, bgcolor: isDarkMode ? "#1f2937" : "#fff" }}>
      {userPacks.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            bgcolor: isDarkMode ? "#111827" : "#f3f4f6",
            textAlign: "center",
            borderRadius: "12px",
            border: isDarkMode
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              bgcolor: "primary.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <PlusIcon className="h-8 w-8" style={{ color: "white" }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Ce compte ne possède aucun pack
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: "500px", mb: 2, color: "text.secondary" }}
          >
            Ajoutez des packs pour permettre aux utilisateurs de s'inscrire et
            de parrainer d'autres membres.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {userPacks.map((userPack) => (
            <Grid item xs={12} md={6} lg={4} key={userPack.id}>
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
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.02)",
                    boxShadow: isDarkMode
                      ? "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1)"
                      : "0 20px 40px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.08)",
                  },
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: userPack.status === "active"
                      ? "linear-gradient(90deg, #10b981 0%, #059669 100%)"
                      : userPack.status === "expired"
                      ? "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)"
                      : "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
                    zIndex: 2,
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
                      label={getStatusLabel(userPack.status)}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        letterSpacing: "0.025em",
                        borderRadius: "20px",
                        px: 2,
                        py: 1,
                        background: userPack.status === "active"
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : userPack.status === "expired"
                          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
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
                          color: isDarkMode ? "#60a5fa" : "#3b82f6",
                          fontWeight: 800,
                          fontSize: "1.5rem",
                        }}
                      >
                        {userPack.pack.price}$
                      </Typography>
                      {canUseCDF && userPack.pack.cdf_price && (
                        <>
                          <Typography
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? "#94a3b8" : "#64748b",
                              fontWeight: 500,
                            }}
                          >
                            |
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ 
                              color: isDarkMode ? "#10b981" : "#059669",
                              fontWeight: 800,
                              fontSize: "1.5rem",
                            }}
                          >
                            {userPack.pack.cdf_price} FC
                          </Typography>
                        </>
                      )}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: isDarkMode ? "#94a3b8" : "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        /mois
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Description améliorée */}
                <Box sx={{ p: 4, pb: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#cbd5e1" : "#475569",
                      mb: 3,
                      lineHeight: 1.6,
                      fontSize: "0.9rem",
                      height: "60px",
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

                {/* Informations améliorées */}
                <Box sx={{ px: 4, pb: 3, flexGrow: 1 }}>
                  <List disablePadding>
                    {/* Code de parrainage */}
                    <ListItem
                      disablePadding
                      sx={{
                        py: 2,
                        mb: 2,
                        borderRadius: "12px",
                        background: isDarkMode
                          ? "rgba(59, 130, 246, 0.08)"
                          : "rgba(59, 130, 246, 0.04)",
                        border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"}`,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: isDarkMode
                            ? "rgba(59, 130, 246, 0.12)"
                            : "rgba(59, 130, 246, 0.08)",
                          transform: "translateX(4px)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            background: isDarkMode
                              ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                              : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ContentCopy sx={{ fontSize: 18, color: "#ffffff" }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary="Code de parrainage"
                        secondary={userPack.referral_code}
                        primaryTypographyProps={{
                          variant: "caption",
                          color: isDarkMode ? "#94a3b8" : "#64748b",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                        secondaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 700,
                          color: isDarkMode ? "#f1f5f9" : "#1e293b",
                          sx: { mt: 0.5 },
                        }}
                      />
                      <Tooltip title="Copier le code" placement="top">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleCopy(userPack.referral_code)}
                          sx={{
                            background: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)",
                            "&:hover": {
                              background: isDarkMode
                                ? "rgba(255, 255, 255, 0.15)"
                                : "rgba(0, 0, 0, 0.1)",
                            },
                          }}
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
                          py: 2,
                          borderRadius: "12px",
                          background: userPack.status === "expired"
                            ? isDarkMode
                              ? "rgba(239, 68, 68, 0.08)"
                              : "rgba(239, 68, 68, 0.04)"
                            : isDarkMode
                            ? "rgba(16, 185, 129, 0.08)"
                            : "rgba(16, 185, 129, 0.04)",
                          border: userPack.status === "expired"
                            ? `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"}`
                            : `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)"}`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background: userPack.status === "expired"
                              ? isDarkMode
                                ? "rgba(239, 68, 68, 0.12)"
                                : "rgba(239, 68, 68, 0.08)"
                              : isDarkMode
                              ? "rgba(16, 185, 129, 0.12)"
                              : "rgba(16, 185, 129, 0.08)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "8px",
                              background: userPack.status === "expired"
                                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CalendarMonth sx={{ fontSize: 18, color: "#ffffff" }} />
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            userPack.status === "expired"
                              ? "Expiré le"
                              : "Expire le"
                          }
                          secondary={new Date(
                            userPack.expiry_date
                          ).toLocaleDateString()}
                          primaryTypographyProps={{
                            variant: "caption",
                            color: userPack.status === "expired"
                              ? "error.main"
                              : isDarkMode
                              ? "#94a3b8"
                              : "#64748b",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                          secondaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 700,
                            color: userPack.status === "expired"
                              ? "error.main"
                              : isDarkMode
                              ? "#f1f5f9"
                              : "#1e293b",
                            sx: { mt: 0.5 },
                          }}
                        />
                      </ListItem>
                    )}

                    {/* Utilisateur */}
                    {userPack.user && (
                      <ListItem
                        disablePadding
                        sx={{
                          py: 2,
                          mt: 2,
                          borderRadius: "12px",
                          background: isDarkMode
                            ? "rgba(147, 51, 234, 0.08)"
                            : "rgba(147, 51, 234, 0.04)",
                          border: `1px solid ${isDarkMode ? "rgba(147, 51, 234, 0.2)" : "rgba(147, 51, 234, 0.1)"}`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            background: isDarkMode
                              ? "rgba(147, 51, 234, 0.12)"
                              : "rgba(147, 51, 234, 0.08)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 50 }}>
                          <Avatar
                            sx={{
                              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                              width: 40,
                              height: 40,
                              fontWeight: 700,
                              fontSize: "1rem",
                              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
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
                            color: isDarkMode ? "#94a3b8" : "#64748b",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                          secondaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 700,
                            color: isDarkMode ? "#f1f5f9" : "#1e293b",
                            sx: { mt: 0.5 },
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>

                {/* Actions améliorées */}
                <Box
                  sx={{
                    p: 3,
                    mt: "auto",
                    borderTop: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)"
                      : "linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Statistiques" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleStatsClick(userPack.pack.id)}
                        sx={{
                          background: isDarkMode
                            ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                            : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                          color: "#ffffff",
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px) scale(1.05)",
                            boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                          },
                        }}
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Filleuls" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleReferralsClick(userPack.pack.id)}
                        sx={{
                          background: isDarkMode
                            ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                            : "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                          color: "#ffffff",
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px) scale(1.05)",
                            boxShadow: "0 6px 16px rgba(139, 92, 246, 0.4)",
                          },
                        }}
                      >
                        <UsersIcon className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

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
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        }}
        PaperProps={{
          sx: {
            minHeight: isFullScreen ? "100vh" : "80vh",
            maxHeight: isFullScreen ? "100vh" : "80vh",
            bgcolor: isDarkMode ? "#1f2937" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            boxShadow: isDarkMode
              ? "0 4px 20px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px rgba(0, 0, 0, 0.15)",
            borderRadius: isFullScreen ? 0 : "12px",
            overflow: "hidden",
          },
          component: motion.div,
          initial: { opacity: 0, y: 20, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
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
            bgcolor: isDarkMode ? "#1f2937" : "transparent",
            color: isDarkMode ? "grey.100" : "text.primary",
            p: 0,
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
                  onChange={(e, newValue) => setCurrentTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.05)",
                    "& .MuiTab-root": {
                      color: isDarkMode ? "grey.400" : "text.secondary",
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: isDarkMode
                        ? "primary.light"
                        : "primary.main",
                      height: 3,
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
                  {/* Bouton pour afficher/masquer les filtres */}
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outlined"
                    size="small"
                    startIcon={
                      <svg
                        width="16"
                        height="16"
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
                      borderRadius: "12px",
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

                  {/* Section des filtres avec design moderne - conditionnellement affichée */}
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
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
                          Total commission générée
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
                                ? `${total.toFixed(2)} $`
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
                                    fontSize: "0.875rem",
                                    padding: "12px 16px",
                                    borderBottom: isDarkMode
                                      ? "1px solid #374151"
                                      : "2px solid #e2e8f0",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    whiteSpace: "nowrap",
                                  },
                                }}
                              >
                                <TableCell sx={{ width: "80px" }}>ID</TableCell>
                                {currentTab >= 1 && <TableCell sx={{ width: "180px" }}>Parrain</TableCell>}
                                <TableCell sx={{ width: "180px" }}>Nom</TableCell>
                                <TableCell sx={{ width: "140px" }}>Date d'achat</TableCell>
                                <TableCell sx={{ width: "140px" }}>Pack acheté</TableCell>
                                <TableCell sx={{ width: "140px" }}>Expiration</TableCell>
                                <TableCell sx={{ width: "140px" }}>Code parrain</TableCell>
                                <TableCell sx={{ width: "100px" }}>Statut</TableCell>
                                <TableCell sx={{ width: "140px" }}>Commission</TableCell>
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
                                    <span style={{ 
                                      backgroundColor: referral?.pack_status === "active" ? "#10B981" : "#F59E0B", 
                                      color: referral?.pack_status === "active" ? "#FFFFFF" : "#000000", 
                                      borderRadius: "4px", 
                                      padding: "4px 8px" 
                                    }}>
                                      {referral?.pack_status === "active" ? "Actif" : "Inactif"}
                                    </span>
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
            bgcolor: isDarkMode ? "#1f2937" : "rgba(0, 0, 0, 0.05)",
            borderTop: 1,
            borderColor: "divider",
            p: 2,
          }}
        >
          <Button
            onClick={() => setReferralsDialog(false)}
            variant="outlined"
            component={motion.button}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
