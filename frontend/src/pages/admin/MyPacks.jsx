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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "../../utils/axios";
import { useTheme } from "../../contexts/ThemeContext";
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
import RenewPackForm from "../../components/RenewPackForm";
import PackStatsModal from "../../components/PackStatsModal";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "@mui/material";
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

export default function MyPacks() {
  const [userPacks, setUserPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewDialog, setRenewDialog] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [duration, setDuration] = useState(1);
  const [renewing, setRenewing] = useState(false);
  const { isDarkMode } = useTheme();
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

  const handleRenewClick = (pack) => {
    setSelectedPack(pack);
    setDuration(1);
    setRenewDialog(true);
  };

  const handleRenewClose = () => {
    setRenewDialog(false);
    setSelectedPack(null);
    setDuration(1);
  };

  const calculateTotalPrice = () => {
    if (!selectedPack?.pack) return 0;
    return selectedPack.pack.price * duration;
  };

  const handleRenew = async () => {
    try {
      setRenewing(true);
      const response = await axios.post(
        `/api/packs/${selectedPack.pack_id}/renew`,
        {
          duration_months: duration,
        }
      );

      if (response.data.success) {
        Notification.success("Pack renouvelé avec succès");
        fetchUserPacks();
        handleRenewClose();
      }
    } catch (error) {
      console.error("Erreur lors du renouvellement:", error);
      Notification.error(
        error.response?.data?.message || "Erreur lors du renouvellement du pack"
      );
    } finally {
      setRenewing(false);
    }
  };

  const handleDownload = async (packId) => {
    try {
      const response = await axios.get(`/api/packs/${packId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `pack-${packId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Notification.error("Erreur lors du téléchargement du pack");
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

  const handleReferralsClick = async (packId) => {
    try {
      const response = await axios.get(`/api/packs/${packId}/referrals`);
      //console.log('Données reçues du backend:', JSON.stringify(response.data.data, null, 2));

      // Vérification des données
      if (response.data.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((generation, index) => {
          //console.log(`Génération ${index + 1}:`, generation);
        });
      }

      setCurrentPackReferrals(response.data.data);
      setCurrentTab(0);
      setSearchTerm("");
      setReferralsDialog(true);
    } catch (error) {
      console.error("Erreur complète:", error);
      Notification.error("Erreur lors du chargement des filleuls");
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
        commission: "0$",
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
          commission: `${parseFloat(ref.total_commission || 0).toFixed(2)}$`,
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
                  commission: `${parseFloat(ref.total_commission || 0).toFixed(
                    2
                  )}$`,
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
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          Mes Packs
        </Typography>

        <Button
          variant="contained"
          startIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => navigate("../packs")}
          sx={{
            borderRadius: "8px",
            fontWeight: 600,
            py: 1.2,
            px: 2.5,
            textTransform: "none",
          }}
        >
          Ajouter un pack
        </Button>
      </Box>

      {userPacks.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
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
            Il n'y a aucun pack créé dans le système
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: "500px", mb: 2, color: "text.secondary" }}
          >
            Ajoutez des packs pour permettre aux utilisateurs de s'inscrire et
            de parrainer d'autres membres.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("../packs")}
            sx={{
              mt: 1,
              borderRadius: "8px",
              fontWeight: 600,
              py: 1.2,
              px: 3,
              textTransform: "none",
            }}
          >
            Ajouter des packs
          </Button>
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
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                  bgcolor: isDarkMode ? "#1f2937" : "background.paper",
                  transition:
                    "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                {/* En-tête avec statut */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "100px",
                      height: "100px",
                      borderRadius: "0 0 0 100%",
                      bgcolor:
                        userPack.status === "active"
                          ? "success.light"
                          : userPack.status === "expired"
                          ? "error.light"
                          : "grey.300",
                      opacity: 0.1,
                      zIndex: 0,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {userPack.pack.name}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "primary.main", fontWeight: 700 }}
                      >
                        {userPack.pack.price}$/mois
                      </Typography>
                    </Box>

                    <Chip
                      label={getStatusLabel(userPack.status)}
                      color={getStatusColor(userPack.status)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderRadius: "6px",
                      }}
                    />
                  </Box>
                </Box>

                {/* Description */}
                <Box sx={{ p: 3, pb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      mb: 2,
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

                {/* Informations */}
                <Box sx={{ px: 3, pb: 2, flexGrow: 1 }}>
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
                        }}
                        secondaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 600,
                          sx: { mt: 0.5 },
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

                    {/* Lien de parrainage */}
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
                        primary="Lien de parrainage"
                        secondary={userPack.link_referral}
                        primaryTypographyProps={{
                          variant: "caption",
                          color: "text.secondary",
                        }}
                        secondaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 600,
                          sx: {
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                      <Tooltip title="Copier le lien" placement="top">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleCopy(userPack.link_referral)}
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
                              userPack.status === "expired" ? "error" : "action"
                            }
                          />
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
                          }}
                        />
                      </ListItem>
                    )}

                    {/* Utilisateur */}
                    {userPack.user && (
                      <ListItem
                        disablePadding
                        sx={{
                          py: 1.5,
                        }}
                      >
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
                          }}
                          secondaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 600,
                            sx: { mt: 0.5 },
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    p: 2,
                    mt: "auto",
                    borderTop: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {userPack.pack.formations ? (
                      <Tooltip title="Télécharger" placement="top">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(userPack.pack.id)}
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      ""
                    )}

                    <Tooltip title="Statistiques" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleStatsClick(userPack.pack.id)}
                      >
                        <ChartBarIcon className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Filleuls" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleReferralsClick(userPack.pack.id)}
                      >
                        <UsersIcon className="h-5 w-5" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {userPack.status !== "active" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleRenewClick(userPack)}
                      startIcon={<Cached />}
                      sx={{
                        borderRadius: "6px",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Renouveler
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      <Dialog
        open={renewDialog}
        onClose={handleRenewClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            bgcolor: isDarkMode ? "#1f2937" : "background.paper",
            backdropFilter: "blur(10px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            py: 2.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Cached
            sx={{ color: isDarkMode ? "primary.light" : "primary.main" }}
          />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Renouveler {selectedPack?.pack?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: isDarkMode
                  ? "rgba(25, 118, 210, 0.1)"
                  : "rgba(25, 118, 210, 0.05)",
                border: isDarkMode
                  ? "1px solid rgba(25, 118, 210, 0.2)"
                  : "1px solid rgba(25, 118, 210, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDarkMode
                    ? "rgba(25, 118, 210, 0.2)"
                    : "rgba(25, 118, 210, 0.1)",
                }}
              >
                <Info
                  sx={{ color: isDarkMode ? "primary.light" : "primary.main" }}
                />
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Prix mensuel : {selectedPack?.pack?.price}$
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Le renouvellement prolonge la durée de votre pack
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              type="number"
              label="Durée (mois)"
              value={duration}
              onChange={(e) =>
                setDuration(Math.max(1, parseInt(e.target.value) || 1))
              }
              inputProps={{ min: 1 }}
              margin="normal"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(0, 0, 0, 0.3)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "primary.light" : "primary.main",
                    borderWidth: "2px",
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: isDarkMode ? "primary.light" : "primary.main",
                },
              }}
            />

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.03)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Prix total :
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: isDarkMode ? "primary.light" : "primary.main",
                }}
              >
                {calculateTotalPrice()}$
              </Typography>
            </Box>
          </motion.div>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: 1, borderColor: "divider" }}
        >
          <Button
            onClick={handleRenewClose}
            sx={{
              color: isDarkMode ? "#1f2937" : "grey.700",
              "&:hover": {
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleRenew}
            disabled={renewing}
            startIcon={renewing ? <CircularProgress size={20} /> : <Cached />}
            sx={{
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              bgcolor: isDarkMode ? "primary.dark" : "primary.main",
              "&:hover": {
                bgcolor: isDarkMode ? "primary.main" : "primary.dark",
              },
            }}
          >
            {renewing
              ? "Traitement en cours..."
              : "Confirmer le renouvellement"}
          </Button>
        </DialogActions>
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
            bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.05)",
            color: isDarkMode ? "grey.100" : "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            px: 3,
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
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={viewMode === "table" ? "contained" : "outlined"}
                onClick={() => setViewMode("table")}
                size="small"
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
                }}
              >
                Vue tableau
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={viewMode === "tree" ? "contained" : "outlined"}
                onClick={() => setViewMode("tree")}
                size="small"
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
                }}
              >
                Vue arbre
              </Button>
            </motion.div>
            <Tooltip
              title={
                isFullScreen ? "Quitter le mode plein écran" : "Plein écran"
              }
              arrow
            >
              <IconButton
                onClick={() => setIsFullScreen(!isFullScreen)}
                sx={{
                  ml: 1,
                  color: isDarkMode ? "grey.300" : "grey.700",
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", md: "center" },
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <TextField
                      placeholder="Rechercher un filleul..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        width: { xs: "100%", md: "300px" },
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
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
                          color: isDarkMode ? "primary.light" : "primary.main",
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MagnifyingGlassIcon
                              className="h-5 w-5"
                              style={{
                                color: isDarkMode ? "grey.400" : "inherit",
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        width: { xs: "100%", sm: "auto" },
                        alignItems: { xs: "stretch", sm: "flex-start" },
                      }}
                    >
                      <FormControl
                        size="small"
                        sx={{
                          minWidth: { xs: "100%", sm: 120 },
                          flex: { xs: 1, sm: "none" },
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
                          onChange={(e) => setStatusFilter(e.target.value)}
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
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
                                color: isDarkMode ? "grey.300" : undefined,
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

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "row", sm: "row" },
                          gap: 1,
                          width: { xs: "100%", sm: "auto" },
                          justifyContent: {
                            xs: "space-between",
                            sm: "flex-start",
                          },
                        }}
                      >
                        <TextField
                          label="Date début"
                          type="date"
                          size="small"
                          value={dateFilter.startDate}
                          onChange={(e) =>
                            setDateFilter((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            width: { xs: "calc(50% - 4px)", sm: "140px" },
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
                          value={dateFilter.endDate}
                          onChange={(e) =>
                            setDateFilter((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            width: { xs: "calc(50% - 4px)", sm: "140px" },
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
                          {(currentPackReferrals[currentTab] || [])
                            .reduce(
                              (sum, ref) =>
                                sum + parseFloat(ref.total_commission || 0),
                              0
                            )
                            .toFixed(2)}
                          $
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
                    <DataGrid
                      getRowId={(row) => row.id}
                      rows={filteredReferrals}
                      columns={getColumnsForGeneration(currentTab)}
                      autoHeight
                      disableColumnMenu
                      disableSelectionOnClick
                      pageSize={10}
                      rowsPerPageOptions={[10, 25, 50]}
                      initialState={{
                        pagination: {
                          pageSize: 10,
                        },
                      }}
                      sx={{
                        border: "none",
                        borderRadius: 2,
                        bgcolor: isDarkMode
                          ? "#1a2433"
                          : "rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                        "& .MuiDataGrid-cell": {
                          color: isDarkMode ? "grey.300" : "inherit",
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "grey.200",
                          fontSize: "0.875rem",
                          py: 1.5,
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
