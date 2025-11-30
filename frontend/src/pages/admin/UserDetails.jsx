import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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
  XMarkIcon,
  ShoppingCartIcon,
  ClockIcon,
  ListBulletIcon,
  CogIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
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
  Tooltip,
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Fullscreen, FullscreenExit } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { Fade } from "@mui/material";
import Tree from "react-d3-tree";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createPortal } from "react-dom";
import PackStatsModal from "./components/PackStatsModal";
import { ToastContainer } from "react-toastify";

export default function UserDetails({ userId }) {
  const { isDarkMode } = useTheme();
  const {
    isCDFEnabled,
    availableCurrencies,
    selectedCurrency,
    setSelectedCurrency,
    loading: currencyLoading,
  } = useCurrency();

  const { id } = useParams();
  const effectiveId = userId || id;

  // États principaux
  const [user, setUser] = useState(null);
  const [packs, setPacks] = useState([]);
  const [packPage, setPackPage] = useState(0);
  const [packRowsPerPage, setPackRowsPerPage] = useState(25);
  const [totalPacks, setTotalPacks] = useState(0);
  const [referralPage, setReferralPage] = useState(0);
  const [referralRowsPerPage, setReferralRowsPerPage] = useState(25);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userWallet, setUserWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [showBackButton, setShowBackButton] = useState(!userId); // Afficher le bouton retour seulement si userId n'est pas fourni (mode standalone)

  // États pour le modal des filleuls
  const [referralsDialog, setReferralsDialog] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);
  // const [referralsCurrencyFilter, setReferralsCurrencyFilter] = useState(""); // Utilise selectedCurrency du contexte
  const [currentPackReferrals, setCurrentPackReferrals] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [viewMode, setViewMode] = useState("table");
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
      window.addEventListener("resize", updateModalWidth);

      return () => {
        window.removeEventListener("resize", updateModalWidth);
      };
    }
  }, [referralsDialog]);

  // États pour la pagination et le filtrage des transactions
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [transactionFilters, setTransactionFilters] = useState({
    type: "",
    status: "",
    date_from: "",
    date_to: "",
    amount_min: "",
    amount_max: "",
    search: "",
    // currency: "USD", // Supprimé - utilise le contexte global
  });

  // État pour contrôler l'affichage des filtres avancés
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${effectiveId}`);

      if (response.data.success) {
        setUser(response.data.data.user);
        setUserWallet(response.data.data.wallet);

        // Charger les packs et transactions séparément avec la pagination
        fetchPacks();
        fetchTransactions();
      } else {
        setError("Erreur lors du chargement des données utilisateur");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails utilisateur:",
        error
      );
      setError("Erreur lors du chargement des données utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const fetchPacks = async () => {
    try {
      console.log('États packs - page:', packPage, 'rowsPerPage:', packRowsPerPage, 'totalPacks:', totalPacks, 'packs.length:', packs.length);

      const params = {
        per_page: packRowsPerPage,
        page: packPage + 1, // Laravel pagination commence à 1
      };
      
      console.log('Paramètres packs envoyés:', params);

      // Utiliser la route existante avec paramètres de pagination
      const response = await axios.get(
        `/api/admin/users/${effectiveId}`,
        { params }
      );
      
      if (response.data.success) {
        const packsData = response.data.data.packs?.data || response.data.data.packs || [];
        console.log('Packs reçus:', packsData.length, 'Total:', response.data.data.packs?.total || response.data.data.packs?.total_count || response.data.data.packs?.length || 0);
        setPacks(packsData);
        setTotalPacks(response.data.data.packs?.total || response.data.data.packs?.total_count || response.data.data.packs?.length || 0);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
    }
  };

  // Gestionnaires de pagination pour les packs
  const handlePackPageChange = (event, newPage) => {
    setPackPage(newPage);
  };

  const handlePackRowsPerPageChange = (event) => {
    setPackRowsPerPage(parseInt(event.target.value, 10));
    setPackPage(0);
  };

  // Gestionnaires de pagination pour les filleuls
  const handleReferralPageChange = (event, newPage) => {
    setReferralPage(newPage);
  };

  const handleReferralRowsPerPageChange = (event) => {
    setReferralRowsPerPage(parseInt(event.target.value, 10));
    setReferralPage(0);
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(transactionFilters).forEach(([key, value]) => {
        if (value !== "") {
          params.append(key, value);
        }
      });
      
      // Pagination backend
      params.append('per_page', rowsPerPage);
      params.append('page', page + 1); // Laravel pagination commence à 1
      
      // Ajouter la devise du contexte
      if (selectedCurrency) {
        params.append('currency', selectedCurrency);
      }

      const response = await axios.get(
        `/api/admin/users/${effectiveId}?${params.toString()}`
      );
      if (response.data.success) {
        setTransactions(response.data.data.transactions.data);
        setTotalTransactions(response.data.data.transactions.total || response.data.data.transactions.total_count);
      } else {
        toast.error("Erreur lors du chargement des transactions");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des transactions:", error);
      toast.error("Erreur lors du chargement des transactions");
    }
  };

  // Effet pour recharger les transactions lorsque les filtres changent
  useEffect(() => {
    fetchTransactions();
  }, [transactionFilters, page, rowsPerPage, selectedCurrency]);

  // Effet pour recharger les packs lorsque la pagination change
  useEffect(() => {
    if (effectiveId) {
      fetchPacks();
    }
  }, [packPage, packRowsPerPage, effectiveId]);

  // Gestionnaire de changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gestionnaire de changement de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Effet pour recharger les transactions lorsque la devise change
  useEffect(() => {
    if (selectedCurrency) {
      fetchTransactions();
    }
  }, [selectedCurrency]);

  // Effet pour synchroniser le filtre de devise des filleuls avec le CurrencyContext
  useEffect(() => {
    if (!isCDFEnabled && selectedCurrency !== "USD") {
      setSelectedCurrency("USD");
    }
  }, [isCDFEnabled, selectedCurrency, setSelectedCurrency]);

  // Effet pour gérer la devise CDF
  useEffect(() => {
    if (!isCDFEnabled && selectedCurrency !== "USD") {
      setSelectedCurrency("USD");
    }
  }, [isCDFEnabled, selectedCurrency, setSelectedCurrency]);

  // Fonction pour formater correctement les dates
  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";

    try {
      // Si la date est déjà au format français avec heure (JJ/MM/AAAA HH:MM:SS)
      if (typeof dateString === "string" && dateString.includes("/")) {
        // Extraire seulement la partie date (JJ/MM/AAAA)
        const dateParts = dateString.split(" ");
        return dateParts[0];
      }

      // Si la date est au format ISO, la convertir
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Non disponible";

      // Formater en français
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch (error) {
      console.error("Erreur de formatage de date:", error, dateString);
      return "Erreur de date";
    }
  };

  // Fonction pour formater les montants selon la devise
  const formatAmount = (amount, currency = selectedCurrency) => {
    if (!amount) return currency === "USD" ? "0 $" : "0 FC";

    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${formattedAmount}` + (currency === 'USD' ? '$': ' FC');
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "actif":
        return "#4ade80"; // vert
      case "inactive":
      case "inactif":
        return "#f87171"; // rouge
      case "pending":
        return "#facc15"; // jaune
      default:
        return "#94a3b8"; // gris
    }
  };

  // Fonction pour afficher les filleuls d'un pack
  const handleViewPackReferrals = async (packId) => {
    try {
      setSelectedPackId(packId);
      const response = await axios.get(
        `/api/admin/users/packs/${packId}/referrals`,
        {
          params: { user_id: effectiveId },
        }
      );
      if (response.data.success) {
        // Traiter les données pour s'assurer que tous les champs nécessaires sont présents
        const processedData = response.data.data.map((generation) =>
          generation.map((referral) => ({
            ...referral,
            // S'assurer que les champs importants existent
            name: referral.name || referral.user?.name || "N/A",
            status: referral.status || "N/A",
            purchase_date: referral.purchase_date || null,
            expiry_date: referral.expiry_date || null,
            commission: referral.commission || referral.total_commission || "0",
            referral_code: referral.referral_code || "N/A",
          }))
        );

        setCurrentPackReferrals(processedData);
        
        // Calculer et mettre à jour le nombre total de filleuls
        const totalReferralsCount = processedData.reduce((total, generation) => {
          return total + (Array.isArray(generation) ? generation.length : 0);
        }, 0);
        setTotalReferrals(totalReferralsCount);
        
        setReferralsDialog(true);
        setCurrentTab(0); // Réinitialiser à la première génération
        setSearchTerm("");
        setStatusFilter("all");
        setDateFilter({ startDate: "", endDate: "" });
        setViewMode("table");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des filleuls du pack:",
        error
      );
      toast.error("Erreur lors du chargement des filleuls");
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

    const filteredData = currentPackReferrals[currentTab].filter((referral) => {
      // Filtre de recherche
      const searchMatch =
        searchTerm === "" ||
        (referral.name &&
          referral.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (referral.referral_code &&
          referral.referral_code
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Filtre de statut
      let statusMatch = statusFilter === "all";

      if (statusFilter === "active") {
        statusMatch = referral.pack_status === "active";
      } else if (statusFilter === "inactive") {
        statusMatch = referral.pack_status === "inactive";
      } else if (statusFilter === "expired") {
        statusMatch = referral.pack_status === "expired";
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

      // Le filtre de devise est supprimé - on affiche tous les filleuls quel que soit leur montant de commission
      // Le filtre de devise s'applique uniquement à l'affichage des montants dans la colonne commission

      return searchMatch && statusMatch && dateMatch;
    });

    // Appliquer la pagination
    const startIndex = referralPage * referralRowsPerPage;
    const endIndex = startIndex + referralRowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Obtenir le nombre total de filleuls filtrés (pour la pagination)
  const getFilteredReferralsCount = () => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) {
      return 0;
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
            .includes(searchTerm.toLowerCase()));

      // Filtre de statut
      let statusMatch = statusFilter === "all";

      if (statusFilter === "active") {
        statusMatch = referral.pack_status === "active";
      } else if (statusFilter === "inactive") {
        statusMatch = referral.pack_status === "inactive";
      } else if (statusFilter === "expired") {
        statusMatch = referral.pack_status === "expired";
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

      // Le filtre de devise est supprimé - on affiche tous les filleuls quel que soit leur montant de commission
      // Le filtre de devise s'applique uniquement à l'affichage des montants dans la colonne commission

      return searchMatch && statusMatch && dateMatch;
    }).length;
  };

  // Calculer les statistiques de la génération actuelle
  const currentGenerationStats = useMemo(() => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) return null;

    const referrals = currentPackReferrals[currentTab];

    // Calculer les commissions par devise
    const totalUSD = referrals.reduce(
      (sum, ref) => sum + parseFloat(ref.total_commission_usd || 0),
      0
    );
    const totalCDF = referrals.reduce(
      (sum, ref) => sum + parseFloat(ref.total_commission_cdf || 0),
      0
    );

    return {
      total: referrals.length,
      totalCommissionUSD: totalUSD,
      totalCommissionCDF: totalCDF,
    };
  }, [currentPackReferrals, currentTab]);

  // Composant CustomNode pour l'arbre des filleuls
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
              {selectedCurrency === "USD" && (
                <>Commission USD: {nodeDatum.attributes.commission_usd}$</>
              )}
              {selectedCurrency === "CDF" && (
                <>Commission CDF: {nodeDatum.attributes.commission_cdf} FC</>
              )}
              {selectedCurrency === "" && (
                <>
                  {isCDFEnabled ? (
                    <>
                      <div>
                        Commission USD: {nodeDatum.attributes.commission_usd}$
                      </div>
                      <div>
                        Commission CDF: {nodeDatum.attributes.commission_cdf} FC
                      </div>
                    </>
                  ) : (
                    <>Commission: {nodeDatum.attributes.commission_usd}$</>
                  )}
                </>
              )}
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

  // Fonction pour transformer les données des filleuls en structure d'arbre
  const transformDataToTree = (referralsData) => {
    const rootNode = {
      name: "Vous",
      attributes: {
        commission_usd: "0",
        commission_cdf: "0",
        commission: "0",
        status: "active",
        generation: 0,
      },
      children: [],
    };

    // Si pas de données, retourner juste le nœud racine
    if (
      !referralsData ||
      !Array.isArray(referralsData) ||
      referralsData.length === 0
    ) {
      return rootNode;
    }

    // Fonction pour formater la commission selon le filtre de devise
    const formatCommissionForTree = (usdAmount, cdfAmount) => {
      const usd = parseFloat(usdAmount || 0);
      const cdf = parseFloat(cdfAmount || 0);

      if (selectedCurrency === "USD") {
        return usd > 0 ? `${usd.toFixed(2)}$` : "0";
      } else if (selectedCurrency === "CDF") {
        return cdf > 0 ? `${cdf.toFixed(2)} FC` : "0";
      } else {
        // Afficher selon la disponibilité du CDF
        if (isCDFEnabled) {
          // Afficher les deux devises si CDF est activé
          if (usd > 0 && cdf > 0) {
            return `${usd.toFixed(2)}$ + ${cdf.toFixed(2)} FC`;
          } else if (usd > 0) {
            return `${usd.toFixed(2)}$`;
          } else if (cdf > 0) {
            return `${cdf.toFixed(2)} FC`;
          } else {
            return "0";
          }
        } else {
          // Afficher uniquement USD si CDF est désactivé
          return usd > 0 ? `${usd.toFixed(2)}$` : "0";
        }
      }
    };

    // Vérifier si referralsData est un tableau de générations ou un tableau simple de filleuls
    const isArrayOfGenerations = Array.isArray(referralsData[0]);

    // Si c'est un tableau simple (une seule génération), le traiter directement
    if (!isArrayOfGenerations) {
      // Première génération
      rootNode.children = referralsData.map((ref) => ({
        name: ref.name || "Inconnu",
        attributes: {
          commission_usd: parseFloat(ref.total_commission_usd || 0).toFixed(2),
          commission_cdf: parseFloat(ref.total_commission_cdf || 0).toFixed(2),
          commission: formatCommissionForTree(
            ref.total_commission_usd,
            ref.total_commission_cdf
          ),
          status: ref.pack_status || ref.status || "N/A",
          generation: 1,
          userId: ref.id,
          sponsorId: ref.sponsor_id,
        },
        children: [],
      }));
      return rootNode;
    }

    // Si c'est un tableau de générations, traiter la première génération
    if (referralsData[0] && referralsData[0].length > 0) {
      rootNode.children = referralsData[0].map((ref) => ({
        name: ref.name || "Inconnu",
        attributes: {
          commission_usd: parseFloat(ref.total_commission_usd || 0).toFixed(2),
          commission_cdf: parseFloat(ref.total_commission_cdf || 0).toFixed(2),
          commission: formatCommissionForTree(
            ref.total_commission_usd,
            ref.total_commission_cdf
          ),
          status: ref.pack_status || ref.status || "N/A",
          generation: 1,
          userId: ref.id,
          sponsorId: ref.sponsor_id,
        },
        children: [],
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

      refs.forEach((ref) => {
        // Ignorer les filleuls de la première génération, ils sont déjà attachés à la racine
        if (generation <= 1) return;

        // Trouver le parent de ce filleul
        const parentNode = findParentNode(rootNode.children, ref.sponsor_id);

        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];

          // Ajouter ce filleul comme enfant de son parent
          parentNode.children.push({
            name: ref.name || "Inconnu",
            attributes: {
              commission_usd: parseFloat(ref.total_commission_usd || 0).toFixed(
                2
              ),
              commission_cdf: parseFloat(ref.total_commission_cdf || 0).toFixed(
                2
              ),
              commission: formatCommissionForTree(
                ref.total_commission_usd,
                ref.total_commission_cdf
              ),
              status: ref.pack_status || ref.status || "N/A",
              generation: generation,
              userId: ref.id,
              sponsorId: ref.sponsor_id,
            },
            children: [],
          });
        }
      });
    };

    // Traiter toutes les générations
    if (isArrayOfGenerations) {
      for (let i = 1; i < referralsData.length; i++) {
        processReferrals(referralsData[i], i + 1);
      }
    }

    return rootNode;
  };

  // Fonction pour exporter les données en Excel
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
      const usdCommission = parseFloat(referral.total_commission_usd || 0);
      const cdfCommission = parseFloat(referral.total_commission_cdf || 0);

      let commissionText = "";
      if (selectedCurrency === "USD") {
        commissionText = formatAmount(usdCommission, "USD");
      } else if (selectedCurrency === "CDF") {
        commissionText = formatAmount(cdfCommission, "CDF");
      } else {
        // Afficher selon la disponibilité du CDF
        if (isCDFEnabled) {
          if (usdCommission > 0 && cdfCommission > 0) {
            commissionText = `${formatAmount(
              usdCommission,
              "USD"
            )} + ${formatAmount(cdfCommission, "CDF")}`;
          } else if (usdCommission > 0) {
            commissionText = formatAmount(usdCommission, "USD");
          } else if (cdfCommission > 0) {
            commissionText = formatAmount(cdfCommission, "CDF");
          } else {
            commissionText = "0";
          }
        } else {
          // Afficher uniquement USD si CDF est désactivé
          commissionText = formatAmount(usdCommission, "USD");
        }
      }

      return {
        Nom: referral.name || "N/A",
        "Date d'achat": referral.purchase_date || "N/A",
        Statut:
          referral.pack_status === "active"
            ? "Actif"
            : referral.pack_status === "inactive"
            ? "Inactif"
            : "Expiré",
        "Commission USD": formatAmount(usdCommission, "USD"),
        "Commission CDF": formatAmount(cdfCommission, "CDF"),
        "Commission totale": commissionText,
        "Code parrain": referral.referral_code || "N/A",
      };
    });

    // Créer une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 20 }, // Nom
      { wch: 15 }, // Date d'achat
      { wch: 15 }, // Statut
      { wch: 15 }, // Commission USD
      { wch: 15 }, // Commission CDF
      { wch: 20 }, // Commission totale
      { wch: 15 }, // Code parrain
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

  // Colonnes pour le tableau des packs
  const packColumns = [
    {
      field: "pack",
      headerName: "Pack",
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <div className="flex items-center space-x-3 py-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">
              {params.row.pack?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-white truncate">
              {params.row.pack?.name || "N/A"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {params.row.pack?.categorie || ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      field: "purchase_date",
      headerName: "Date d'achat",
      width: 140,
      renderCell: (params) => {
        if (!params.value) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex items-center">
            <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm">{formatDate(params.value)}</span>
          </div>
        );
      },
    },
    {
      field: "expiry_date",
      headerName: "Date d'expiration",
      width: 140,
      renderCell: (params) => {
        if (!params.value)
          return <span className="text-gray-400">Illimité</span>;
        return (
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm">{formatDate(params.value)}</span>
          </div>
        );
      },
    },
    {
      field: "sponsor",
      headerName: "Sponsor",
      width: 160,
      renderCell: (params) => {
        if (!params || !params.row || !params.row.sponsor) {
          return (
            <div className="flex items-center text-gray-400">
              <UserIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Aucun</span>
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {params.row.sponsor.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {params.row.sponsor.account_id}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      field: "status",
      headerName: "Statut",
      width: 120,
      renderCell: (params) => {
        let color, bgColor, darkBgColor, darkColor, icon;

        if (params.value === "active") {
          color = "text-green-800";
          bgColor = "bg-green-100";
          darkBgColor = "dark:bg-green-900";
          darkColor = "dark:text-green-200";
          icon = (
            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-700 dark:text-green-400" />
          );
        } else {
          color = "text-red-800";
          bgColor = "bg-red-100";
          darkBgColor = "dark:bg-red-900";
          darkColor = "dark:text-red-200";
          icon = (
            <XCircleIcon className="h-4 w-4 mr-1 text-red-700 dark:text-red-400" />
          );
        }

        return (
          <span
            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor} ${darkBgColor} ${darkColor}`}
          >
            {icon}
            {params.value === "active" ? "Actif" : "Inactif"}
          </span>
        );
      },
    },
    {
      field: "referrals_by_generation",
      headerName: "Filleuls",
      width: 180,
      renderCell: (params) => {
        // Vérifier si referrals_by_generation existe et est un tableau
        if (!params.value || !Array.isArray(params.value)) {
          return (
            <div className="flex items-center text-gray-400">
              <UsersIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">0 filleuls</span>
            </div>
          );
        }

        // Calculer le total des filleuls
        const total = params.value.reduce((sum, count) => sum + count, 0);

        return (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-sm">{total} filleuls</div>
              <div className="flex space-x-1">
                {params.value.slice(0, 3).map((count, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
                  >
                    G{index + 1}: {count}
                  </span>
                ))}
                {params.value.length > 3 && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                    +{params.value.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => {
        const isExpired =
          params.row.expiry_date &&
          new Date(params.row.expiry_date) < new Date();

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
                onClick={() =>
                  handleTogglePackStatus(params.row.id, params.row.status)
                }
                className={`p-1 ${
                  params.row.status === "active"
                    ? "bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800"
                    : "bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
                } rounded transition-colors`}
                title={
                  params.row.status === "active" ? "Désactiver" : "Activer"
                }
              >
                {params.row.status === "active" ? (
                  <XCircleIcon className="h-5 w-5" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Fonction pour afficher les statistiques d'un pack
  const handleViewPackStats = (packId) => {
    // Fonction pour afficher les statistiques du pack
    setSelectedPack(packs.find((pack) => pack.id === packId));
    setPackStatsModal(true);
  };

  // Fonction pour activer/désactiver un pack
  const handleTogglePackStatus = (packId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    // Appel API pour changer le statut
    axios
      .patch(`/api/admin/users/packs/${packId}/toggle-status`)
      .then((response) => {
        if (response.data.success) {
          // Mettre à jour les packs dans l'état local
          const updatedPacks = packs.map((pack) =>
            pack.id === packId ? { ...pack, status: newStatus } : pack
          );
          setPacks(updatedPacks);

          // Afficher un message de succès
          toast.success(
            `Le statut du pack a été changé à ${
              newStatus === "active" ? "actif" : "inactif"
            }`
          );
        } else {
          toast.error(
            response.data.message || "Erreur lors du changement de statut"
          );
        }
      })
      .catch((error) => {
        console.error("Erreur lors du changement de statut:", error);
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du changement de statut du pack"
        );
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
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Colonnes pour le tableau des transactions
  const transactionColumns = [
    {
      field: "id",
      headerName: "ID",
      width: 60,
      flex: 0.5,
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      flex: 1,
      renderCell: (params) => {
        let color, bgColor, label;

        switch (params.value) {
          case "reception":
            color = "text-green-800";
            bgColor = "bg-green-100";
            label = "Réception des fonds";
            break;
          case "withdrawal":
            color = "text-red-800";
            bgColor = "bg-red-100";
            label = "Retrait";
            break;
          case "commission de retrait":
            color = "text-blue-800";
            bgColor = "bg-blue-100";
            label = "Commission de retrait";
            break;
          case "commission de parrainage":
            color = "text-blue-800";
            bgColor = "bg-blue-100";
            label = "Commission de parrainage";
            break;
          case "commission de transfert":
            color = "text-blue-800";
            bgColor = "bg-blue-100";
            label = "Commission de transfert";
            break;
          case "transfer":
            color = "text-purple-800";
            bgColor = "bg-purple-100";
            label = "Transfert des fonds";
            break;
          case "refund":
            color = "text-yellow-800";
            bgColor = "bg-yellow-100";
            label = "Remboursement";
            break;
          case "digital_product_sale":
            color = "text-indigo-800";
            bgColor = "bg-indigo-100";
            label = "Vente de produit numérique";
            break;
          case "purchase":
            color = "text-pink-800";
            bgColor = "bg-pink-100";
            label = "Achat";
            break;
          default:
            color = "text-gray-800";
            bgColor = "bg-gray-100";
            label = params.value;
            break;
        }

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${color} ${bgColor}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      field: "amount",
      headerName: "Montant",
      width: 100,
      flex: 1,
      renderCell: (params) => {
        const amount = params.value;
        const currency = params.row.currency || "USD";
        const mouvment = params.row.mouvment === "in" ? "+" : "-";
        const formattedAmount = new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: currency,
          minimumFractionDigits: 2,
        }).format(amount);

        return (
          <span
            className={`font-semibold ${
              mouvment === "+"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {mouvment} {formattedAmount}
          </span>
        );
      },
    },
    {
      field: "status",
      headerName: "Statut",
      width: 100,
      flex: 1,
      renderCell: (params) => {
        const statusColors = {
          pending:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
          approved:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          completed:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          cancelled:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
        };

        const statusLabels = {
          pending: "En attente",
          approved: "Approuvé",
          completed: "Complété",
          failed: "Échoué",
          cancelled: "Annulé",
        };

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusColors[params.value] || "bg-gray-100 text-gray-800"
            }`}
          >
            {statusLabels[params.value] || params.value}
          </span>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Date",
      width: 120,
      flex: 1.2,
      renderCell: (params) => {
        // Utiliser created_at_raw si disponible, sinon parser created_at
        const dateValue = params.row.created_at_raw || params.value;

        // Vérifier si la valeur est valide
        if (!dateValue) {
          return (
            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
          );
        }

        try {
          let date;

          // Si c'est la date brute (format ISO), l'utiliser directement
          if (params.row.created_at_raw) {
            date = new Date(dateValue);
          } else {
            // Parser le format français "dd/mm/YYYY HH:MM:SS"
            const [datePart, timePart] = dateValue.split(" ");
            if (!datePart) {
              return (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Format invalide
                </span>
              );
            }

            const [day, month, year] = datePart.split("/");
            if (!day || !month || !year) {
              return (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Format date invalide
                </span>
              );
            }

            // Créer la date au format ISO
            const isoString = `${year}-${month}-${day}${
              timePart ? "T" + timePart : ""
            }`;
            date = new Date(isoString);
          }

          // Vérifier si la date est valide
          if (isNaN(date.getTime())) {
            return (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Date invalide
              </span>
            );
          }

          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        } catch (error) {
          console.error(
            "Erreur de parsing de date:",
            error,
            "Valeur:",
            dateValue
          );
          return (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Erreur date
            </span>
          );
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      flex: 0.4,
      renderCell: (params) => {
        return (
          <div className="flex space-x-2 p-2">
            <button
              onClick={() => handleViewTransactionDetails(params.row)}
              className="p-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-200 hover:scale-105"
              title="Voir les détails"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];
  const getColumnsForGeneration = (generation) => [
    {
      field: "name",
      headerName: "Nom",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">
              {params.value?.charAt(0) || "?"}
            </span>
          </div>
          <div className="font-medium">{params.value || "N/A"}</div>
        </div>
      ),
    },
    {
      field: "pack_status",
      headerName: "Statut",
      width: 120,
      renderCell: (params) => {
        const status = params.value || params.row.status || "N/A";
        let color, bgColor, icon;

        if (status.toLowerCase() === "active") {
          color = "text-green-800";
          bgColor = "bg-green-100";
          icon = <CheckCircleIcon className="h-4 w-4 mr-1 text-green-700" />;
        } else if (status.toLowerCase() === "inactive") {
          color = "text-red-800";
          bgColor = "bg-red-100";
          icon = <XCircleIcon className="h-4 w-4 mr-1 text-red-700" />;
        } else {
          color = "text-gray-800";
          bgColor = "bg-gray-100";
          icon = <XCircleIcon className="h-4 w-4 mr-1 text-gray-700" />;
        }

        return (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color} ${bgColor}`}
          >
            {icon}
            {status === "active"
              ? "Actif"
              : status === "inactive"
              ? "Inactif"
              : status}
          </span>
        );
      },
    },
    {
      field: "purchase_date",
      headerName: "Date d'achat",
      width: 150,
      renderCell: (params) => <span>{params.value || "N/A"}</span>,
    },
    {
      field: "expiry_date",
      headerName: "Date d'expiration",
      width: 150,
      renderCell: (params) => <span>{params.value || "Illimité"}</span>,
    },
    {
      field: "commission",
      headerName: "Commission",
      width: 150,
      renderCell: (params) => {
        const usdCommission = parseFloat(params.row.total_commission_usd || 0);
        const cdfCommission = parseFloat(params.row.total_commission_cdf || 0);

        if (selectedCurrency === "USD") {
          return (
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatAmount(usdCommission, "USD")}
            </span>
          );
        } else if (selectedCurrency === "CDF") {
          return (
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {formatAmount(cdfCommission, "CDF")}
            </span>
          );
        } else {
          // Afficher selon la disponibilité du CDF
          if (isCDFEnabled) {
            return (
              <div className="flex flex-col">
                {usdCommission > 0 && (
                  <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                    {formatAmount(usdCommission, "USD")}
                  </span>
                )}
                {cdfCommission > 0 && (
                  <span className="font-medium text-orange-600 dark:text-orange-400 text-sm">
                    {formatAmount(cdfCommission, "CDF")}
                  </span>
                )}
                {usdCommission === 0 && cdfCommission === 0 && (
                  <span className="font-medium text-gray-400 text-sm">0</span>
                )}
              </div>
            );
          } else {
            // Afficher uniquement USD si CDF est désactivé
            return (
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatAmount(usdCommission, "USD")}
              </span>
            );
          }
        }
      },
    },
    {
      field: "referral_code",
      headerName: "Code parrainage",
      width: 150,
      renderCell: (params) => (
        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {params.value || "N/A"}
        </span>
      ),
    },
  ];

  useEffect(() => {
    if (
      currentPackReferrals &&
      currentPackReferrals.length > 0 &&
      currentTab >= 0
    ) {
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Erreur
        </h1>
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Utilisateur non trouvé
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          L'utilisateur demandé n'existe pas ou a été supprimé.
        </p>
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

  // Fonction pour exporter les packs vers Excel
  const exportPacksToExcel = () => {
    try {
      // Préparer les données pour l'export
      const exportData = packs.map((pack) => ({
        ID: pack.id || "",
        "Nom du pack": pack.pack?.name || pack.name || "",
        Statut: pack.status || "",
        "Date d'achat": pack.purchase_date
          ? new Date(pack.purchase_date).toLocaleDateString()
          : "",
        "Date d'expiration": pack.expiry_date
          ? new Date(pack.expiry_date).toLocaleDateString()
          : "",
        Utilisateur: user?.name || "",
        "Email utilisateur": user?.email || "",
      }));

      // Créer le workbook et la worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Packs Utilisateur");

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 8 }, // ID
        { wch: 30 }, // Nom du pack (élargi)
        { wch: 12 }, // Statut
        { wch: 15 }, // Date d'achat
        { wch: 18 }, // Date d'expiration
        { wch: 20 }, // Utilisateur
        { wch: 30 }, // Email utilisateur
      ];
      ws["!cols"] = colWidths;

      // Générer le fichier Excel
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Nom du fichier avec date et nom d'utilisateur
      const fileName = `packs_${user?.name || "utilisateur"}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Télécharger le fichier
      saveAs(blob, fileName);

      // Message de succès
      toast.success("Export Excel réussi !", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: isDarkMode ? "dark" : "light",
      });
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      toast.error("Erreur lors de l'export Excel", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: isDarkMode ? "dark" : "light",
      });
    }
  };

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
          <div className="px-4 py-4 lg:px-6 lg:py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col space-y-4">
            <div className="flex items-center">
              <div className="h-12 w-12 lg:h-16 lg:w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.profile_picture ? (
                  <img
                    className="h-full w-full rounded-full object-cover"
                    src={user.profile_picture}
                    alt={user.name || "Photo de profil"}
                  />
                ) : (
                  <span className="text-xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                  </span>
                )}
              </div>
              <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {user.name}
                </h1>
                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <EnvelopeIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Statut de l'utilisateur */}
              <div
                className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap ${
                  user.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {user.status === "active" ? "Actif" : "Inactif"}
              </div>
              
              {/* ID du compte */}
              <div className="px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs lg:text-sm font-medium whitespace-nowrap">
                ID: {user.account_id}
              </div>
              
              {/* Date d'inscription */}
              <div className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs lg:text-sm font-medium whitespace-nowrap">
                Inscrit le:{" "}
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>

          {/* Onglets - avec défilement horizontal sur petits écrans */}
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="overflow-x-auto"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <style>
                {`
                  .tabs-container::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>
              <nav className="flex whitespace-nowrap min-w-full pb-px tabs-container">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-4 py-3 lg:px-6 lg:py-3 border-b-2 text-sm font-medium flex-shrink-0 ${
                    activeTab === "info"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setActiveTab("packs")}
                  className={`px-4 py-3 lg:px-6 lg:py-3 border-b-2 text-sm font-medium flex-shrink-0 ${
                    activeTab === "packs"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  Packs
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`px-4 py-3 lg:px-6 lg:py-3 border-b-2 text-sm font-medium flex-shrink-0 ${
                    activeTab === "transactions"
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  Transactions
                </button>
              </nav>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-4 lg:p-6">
            {activeTab === "packs" && (
              <div className="space-y-6">
                {/* En-tête moderne avec statistiques */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg p-4 lg:p-6 border border-purple-100 dark:border-gray-600">
                  <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <ShoppingCartIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                          Packs de l'utilisateur
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Gérez les packs et abonnements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total packs
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {packs.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques des packs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Actifs
                        </span>
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <CheckCircleIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {
                          packs.filter((pack) => pack.status === "active")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Expirés
                        </span>
                        <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <XCircleIcon className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {
                          packs.filter((pack) => pack.status === "expired")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Inactif
                        </span>
                        <div className="h-6 w-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                          <ClockIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {
                          packs.filter((pack) => pack.status === "inactive")
                            .length
                        }
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total packs
                        </span>
                        <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <CurrencyDollarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {packs.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tableau des packs avec design moderne */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <ListBulletIcon className="h-5 w-5 mr-2" />
                      Liste des packs
                    </h3>
                  </div>

                  {/* Indicateur de scroll horizontal pour mobile */}
                  <div className="md:hidden px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 animate-pulse"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                      Faites glisser pour voir plus →
                    </p>
                  </div>

                  <Box
                    sx={{
                      maxHeight: 600,
                      "& .MuiDataGrid-root": {
                        border: "none",
                        backgroundColor: isDarkMode
                          ? "rgba(26, 36, 51, 0.7)"
                          : "rgba(255, 255, 255, 0.7)",
                        borderRadius: "8px",
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: isDarkMode
                            ? "rgba(0, 0, 0, 0.2)"
                            : "rgba(0, 0, 0, 0.03)",
                          borderBottom: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.1)"
                            : "1px solid rgba(0, 0, 0, 0.1)",
                        },
                        "& .MuiDataGrid-cell": {
                          borderBottom: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.05)"
                            : "1px solid rgba(0, 0, 0, 0.05)",
                        },
                        "& .MuiDataGrid-row:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)",
                        },
                        "& .MuiDataGrid-footerContainer": {
                          borderTop: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.1)"
                            : "1px solid rgba(0, 0, 0, 0.1)",
                          backgroundColor: isDarkMode
                            ? "rgba(0, 0, 0, 0.2)"
                            : "rgba(0, 0, 0, 0.03)",
                        },
                        "& .MuiTablePagination-root": {
                          color: isDarkMode ? "grey.300" : undefined,
                        },
                        "& .MuiSvgIcon-root": {
                          color: isDarkMode ? "grey.400" : undefined,
                        },
                      },
                    }}
                  >
                    {packs.length === 0 ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Aucun pack trouvé pour cet utilisateur
                      </Alert>
                    ) : (
                      <TableContainer
                        sx={{
                          boxShadow: isDarkMode
                            ? "none"
                            : "0 2px 10px rgba(0, 0, 0, 0.05)",
                          borderRadius: { xs: 1.5, sm: 2 },
                          overflow: "auto",
                          maxWidth: "100%",
                          "&::-webkit-scrollbar": {
                            height: { xs: 4, sm: 6 },
                            width: { xs: 4, sm: 6 },
                          },
                          "&::-webkit-scrollbar-track": {
                            backgroundColor: isDarkMode
                              ? "rgba(55, 65, 81, 0.4)"
                              : "rgba(0, 0, 0, 0.06)",
                            borderRadius: { xs: 2, sm: 3 },
                          },
                          "&::-webkit-scrollbar-thumb": {
                            backgroundColor: isDarkMode
                              ? "rgba(156, 163, 175, 0.6)"
                              : "rgba(156, 163, 175, 0.4)",
                            borderRadius: { xs: 2, sm: 3 },
                            "&:hover": {
                              backgroundColor: isDarkMode
                                ? "rgba(156, 163, 175, 0.8)"
                                : "rgba(156, 163, 175, 0.6)",
                            },
                          },
                        }}
                      >
                        <Table 
                          size="small" 
                          sx={{ 
                            minWidth: { xs: "800px", sm: "900px" },
                            tableLayout: "fixed"
                          }}
                        >
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
                              <TableCell sx={{ width: { xs: "200px", sm: "220px" } }}>Nom du pack</TableCell>
                              <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Prix</TableCell>
                              <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
                              <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date d'achat</TableCell>
                              <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date d'expiration</TableCell>
                              <TableCell sx={{ width: { xs: "120px", sm: "140px" } }} align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {packs.map((pack) => (
                              <TableRow
                                key={pack.id}
                                sx={{
                                  "&:hover": {
                                    bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                  },
                                  borderBottom: `1px solid ${
                                    isDarkMode ? "#374151" : "#e2e8f0"
                                  }`,
                                  "& td": {
                                    padding: { xs: "6px 10px", sm: "10px 16px" },
                                    color: isDarkMode ? "#fff" : "#475569",
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  },
                                  bgcolor: isDarkMode ? "#1d2432" : "#fff",
                                }}
                              >
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      px: { xs: 0.75, sm: 1 },
                                      py: { xs: 0.4, sm: 0.5 },
                                      borderRadius: { xs: 0.75, sm: 1 },
                                      background: isDarkMode
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "rgba(59, 130, 246, 0.1)",
                                      border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                      fontWeight: 600,
                                      color: isDarkMode ? "#60a5fa" : "#2563eb",
                                    }}
                                  >
                                    #{pack.id}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: isDarkMode ? "#fff" : "#1e293b",
                                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    }}
                                  >
                                    {pack.pack?.name || `Pack ${pack.id}`}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      color: isDarkMode ? "#10b981" : "#059669",
                                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    }}
                                  >
                                    {pack.pack?.price ? `${pack.pack.price} ${pack.pack?.currency || 'USD'}` : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={pack.status === 'active' ? 'Actif' : pack.status === 'expired' ? 'Expiré' : 'Inactif'}
                                    size="small"
                                    sx={{
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      height: { xs: 20, sm: 24 },
                                      fontWeight: 600,
                                      borderRadius: { xs: 1, sm: 1.5 },
                                      bgcolor: pack.status === 'active' 
                                        ? (isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)")
                                        : pack.status === 'expired'
                                        ? (isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)")
                                        : (isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)"),
                                      color: pack.status === 'active'
                                        ? (isDarkMode ? "#4ade80" : "#16a34a")
                                        : pack.status === 'expired'
                                        ? (isDarkMode ? "#f87171" : "#dc2626")
                                        : (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      border: `1px solid ${
                                        pack.status === 'active'
                                          ? (isDarkMode ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.2)")
                                          : pack.status === 'expired'
                                          ? (isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)")
                                          : (isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(156, 163, 175, 0.2)")
                                      }`,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                    {pack.created_at ? new Date(pack.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                    {pack.expiry_date ? new Date(pack.expiry_date).toLocaleDateString('fr-FR') : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewPackReferrals(pack.pack_id)}
                                      sx={{
                                        color: isDarkMode ? "#60a5fa" : "#2563eb",
                                        bgcolor: isDarkMode ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)",
                                        "&:hover": {
                                          bgcolor: isDarkMode ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.2)",
                                        },
                                      }}
                                      title="Voir les filleuls"
                                    >
                                      <UsersIcon className="h-4 w-4" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewPackStats(pack.id)}
                                      sx={{
                                        color: isDarkMode ? "#10b981" : "#059669",
                                        bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(5, 150, 105, 0.1)",
                                        "&:hover": {
                                          bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(5, 150, 105, 0.2)",
                                        },
                                      }}
                                      title="Voir les statistiques"
                                    >
                                      <ChartBarIcon className="h-4 w-4" />
                                    </IconButton>
                                    {(() => {
                                      const isExpired = pack.expiry_date && new Date(pack.expiry_date) < new Date();
                                      return !isExpired ? (
                                        <IconButton
                                          size="small"
                                          onClick={() => handleTogglePackStatus(pack.id, pack.status)}
                                          sx={{
                                            color: pack.status === "active" 
                                              ? (isDarkMode ? "#ef4444" : "#dc2626")
                                              : (isDarkMode ? "#10b981" : "#059669"),
                                            bgcolor: pack.status === "active"
                                              ? (isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(220, 38, 38, 0.1)")
                                              : (isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(5, 150, 105, 0.1)"),
                                            "&:hover": {
                                              bgcolor: pack.status === "active"
                                                ? (isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(220, 38, 38, 0.2)")
                                                : (isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(5, 150, 105, 0.2)"),
                                            },
                                          }}
                                          title={pack.status === "active" ? "Désactiver" : "Activer"}
                                        >
                                          {pack.status === "active" ? (
                                            <XCircleIcon className="h-4 w-4" />
                                          ) : (
                                            <CheckCircleIcon className="h-4 w-4" />
                                          )}
                                        </IconButton>
                                      ) : null;
                                    })()}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    
                    {/* Pagination pour les packs */}
                    <TablePagination
                      component="div"
                      count={totalPacks || 0}
                      page={packPage}
                      onPageChange={handlePackPageChange}
                      rowsPerPage={packRowsPerPage}
                      onRowsPerPageChange={handlePackRowsPerPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Lignes par page:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                      }
                      sx={{
                        color: isDarkMode ? "#fff" : "#475569",
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        "& .MuiTablePagination-toolbar": {
                          minHeight: { xs: "40px", sm: "52px" },
                          padding: { xs: "8px", sm: "16px" },
                        },
                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        },
                        "& .MuiTablePagination-selectIcon": {
                          color: isDarkMode ? "#fff" : "#475569",
                        },
                        "& .MuiTablePagination-select": {
                          backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                          borderRadius: 1,
                          padding: "4px 8px",
                        },
                        "& .MuiTablePagination-actions button": {
                          color: isDarkMode ? "#fff" : "#475569",
                          border: isDarkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.2)",
                          borderRadius: 1,
                          padding: "4px",
                          margin: "0 2px",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                          },
                          "&:disabled": {
                            color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                            borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                          },
                        },
                      }}
                    />
                  </Box>
                </div>

                {/* Actions rapides */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-purple-500" />
                    Exportation
                  </h3>
                  <div className="flex justify-center">
                    <button
                      onClick={() => exportPacksToExcel()}
                      className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Exporter la liste vers Excel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Historique des transactions
                    {isCDFEnabled && (
                      <span className="ml-2 px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        {selectedCurrency || "Toutes"}
                      </span>
                    )}
                  </h2>
                </div>

                {/* Barre de recherche et bouton pour afficher/masquer les filtres */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="relative w-full sm:w-64 md:w-80">
                    <TextField
                      label="Recherche rapide"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={transactionFilters.search}
                      onChange={(e) => {
                        setTransactionFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }));
                        setPage(0);
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>

                  {/* Bouton pour afficher/masquer les filtres avancés */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() =>
                      setShowTransactionFilters(!showTransactionFilters)
                    }
                    startIcon={
                      showTransactionFilters ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )
                    }
                    className="whitespace-nowrap"
                  >
                    {showTransactionFilters
                      ? "Masquer les filtres"
                      : "Filtres avancés"}
                  </Button>
                </div>

                {/* Filtres avancés pour les transactions - cachés par défaut */}
                {showTransactionFilters && (
                  <Paper
                    elevation={2}
                    className="mb-4 p-4 border-l-4 border-blue-500 dark:border-blue-600"
                    sx={{
                      backgroundColor: isDarkMode ? "#1d2e36" : "#fff",
                      color: isDarkMode ? "#fff" : "inherit",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormControl size="small" fullWidth>
                        <InputLabel>Type de transaction</InputLabel>
                        <Select
                          value={transactionFilters.type}
                          label="Type de transaction"
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }));
                            setPage(0);
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                                color: isDarkMode ? "white" : "#333",
                                "& .MuiMenuItem-root": {
                                  color: isDarkMode ? "white" : "#333",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.08)"
                                      : "rgba(0, 0, 0, 0.04)",
                                  },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          <MenuItem value="purchase">Achat</MenuItem>
                          <MenuItem value="withdrawal">Retrait</MenuItem>
                          <MenuItem value="transfer">
                            Transfert des fonds
                          </MenuItem>
                          <MenuItem value="virtual_purchase">
                            Achat de virtuel
                          </MenuItem>
                          <MenuItem value="remboursement">
                            Remboursement
                          </MenuItem>
                          <MenuItem value="reception">
                            Réception des fonds
                          </MenuItem>
                          <MenuItem value="commission de retrait">
                            Commission de retrait
                          </MenuItem>
                          <MenuItem value="commission de parrainage">
                            Commission de parrainage
                          </MenuItem>
                          <MenuItem value="commission de transfert">
                            Commission de transfert
                          </MenuItem>
                          <MenuItem value="digital_product_sale">
                            Vente de produit numérique
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small" fullWidth>
                        <InputLabel>Statut</InputLabel>
                        <Select
                          value={transactionFilters.status}
                          label="Statut"
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }));
                            setPage(0);
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                                color: isDarkMode ? "white" : "#333",
                                "& .MuiMenuItem-root": {
                                  color: isDarkMode ? "white" : "#333",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.08)"
                                      : "rgba(0, 0, 0, 0.04)",
                                  },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="">Tous</MenuItem>
                          <MenuItem value="pending">En attente</MenuItem>
                          <MenuItem value="completed">Complété</MenuItem>
                          <MenuItem value="failed">Échoué</MenuItem>
                          <MenuItem value="cancelled">Annulé</MenuItem>
                        </Select>
                      </FormControl>

                      <div className="flex items-center gap-2">
                        <TextField
                          label="Montant min"
                          type="number"
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={transactionFilters.amount_min}
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              amount_min: e.target.value,
                            }));
                            setPage(0);
                          }}
                        />
                        <span className="text-gray-500 dark:text-gray-400">
                          -
                        </span>
                        <TextField
                          label="Montant max"
                          type="number"
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={transactionFilters.amount_max}
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              amount_max: e.target.value,
                            }));
                            setPage(0);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <TextField
                          label="Date début"
                          type="date"
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={transactionFilters.date_from}
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              date_from: e.target.value,
                            }));
                            setPage(0);
                          }}
                        />
                        <span className="text-gray-500 dark:text-gray-400">
                          -
                        </span>
                        <TextField
                          label="Date fin"
                          type="date"
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={transactionFilters.date_to}
                          onChange={(e) => {
                            setTransactionFilters((prev) => ({
                              ...prev,
                              date_to: e.target.value,
                            }));
                            setPage(0);
                          }}
                        />
                      </div>

                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<ArrowPathIcon className="h-5 w-5" />}
                          onClick={() => {
                            setTransactionFilters({
                              type: "",
                              status: "",
                              date_from: "",
                              date_to: "",
                              amount_min: "",
                              amount_max: "",
                              search: "",
                            });
                            setPage(0);
                          }}
                        >
                          Réinitialiser
                        </Button>

                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => fetchTransactions()}
                          startIcon={
                            <MagnifyingGlassIcon className="h-5 w-5" />
                          }
                        >
                          Appliquer
                        </Button>
                      </div>
                    </div>
                  </Paper>
                )}

                <Box
                  sx={{
                    maxHeight: 600,
                    width: "100%",
                    "& .MuiDataGrid-root": {
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: isDarkMode
                        ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                        : "0 4px 20px rgba(0, 0, 0, 0.08)",
                      bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      bgcolor: isDarkMode
                        ? "rgba(31, 41, 55, 0.8)"
                        : "rgba(249, 250, 251, 0.8)",
                      borderBottom: `2px solid ${
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)"
                      }`,
                      borderRadius: "12px 12px 0 0",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      "&:hover": {
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.05)"
                          : "rgba(59, 130, 246, 0.02)",
                      },
                      "& .MuiDataGrid-columnSeparator": {
                        display: "none",
                      },
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: `1px solid ${
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)"
                      }`,
                      color: isDarkMode ? "#d1d5db" : "#374151",
                      "&:focus": {
                        outline: "none",
                      },
                    },
                    "& .MuiDataGrid-row": {
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.05)"
                          : "rgba(59, 130, 246, 0.02)",
                        transform: "translateX(2px)",
                      },
                      "&.Mui-selected": {
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(59, 130, 246, 0.05)",
                      },
                    },
                    "& .MuiDataGrid-footerContainer": {
                      bgcolor: isDarkMode
                        ? "rgba(31, 41, 55, 0.8)"
                        : "rgba(249, 250, 251, 0.8)",
                      borderTop: `1px solid ${
                        isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)"
                      }`,
                      borderRadius: "0 0 12px 12px",
                    },
                    "& .MuiTablePagination-root": {
                      color: isDarkMode ? "#e5e7eb" : "#374151",
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                      {
                        color: isDarkMode ? "#d1d5db" : "#374151",
                        fontSize: "0.875rem",
                      },
                    "& .MuiIconButton-root": {
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      "&:hover": {
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(59, 130, 246, 0.05)",
                        color: isDarkMode ? "#3b82f6" : "#2563eb",
                      },
                    },
                    "& .MuiDataGrid-virtualScroller": {
                      overflowY: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                        backgroundColor: "transparent",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(0, 0, 0, 0.2)",
                        borderRadius: "4px",
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.3)"
                            : "rgba(0, 0, 0, 0.3)",
                        },
                      },
                    },
                  }}
                >
                  {transactions.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Aucune transaction trouvée
                    </Alert>
                  ) : (
                    <TableContainer
                      sx={{
                        boxShadow: isDarkMode
                          ? "none"
                          : "0 2px 10px rgba(0, 0, 0, 0.05)",
                        borderRadius: { xs: 1.5, sm: 2 },
                        overflow: "auto",
                        maxWidth: "100%",
                        "&::-webkit-scrollbar": {
                          height: { xs: 4, sm: 6 },
                          width: { xs: 4, sm: 6 },
                        },
                        "&::-webkit-scrollbar-track": {
                          backgroundColor: isDarkMode
                            ? "rgba(55, 65, 81, 0.4)"
                            : "rgba(0, 0, 0, 0.06)",
                          borderRadius: { xs: 2, sm: 3 },
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: isDarkMode
                            ? "rgba(156, 163, 175, 0.6)"
                            : "rgba(156, 163, 175, 0.4)",
                          borderRadius: { xs: 2, sm: 3 },
                          "&:hover": {
                            backgroundColor: isDarkMode
                              ? "rgba(156, 163, 175, 0.8)"
                              : "rgba(156, 163, 175, 0.6)",
                          },
                        },
                      }}
                    >
                      <Table 
                        size="small" 
                        sx={{ 
                          minWidth: { xs: "800px", sm: "900px" },
                          tableLayout: "fixed"
                        }}
                      >
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
                            <TableCell sx={{ width: { xs: "200px", sm: "220px" } }}>Type</TableCell>
                            <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Montant</TableCell>
                            {isCDFEnabled && <TableCell sx={{ width: { xs: "80px", sm: "100px" } }}>Devise</TableCell>}
                            <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
                            <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Date</TableCell>
                            <TableCell sx={{ width: { xs: "60px", sm: "80px" } }} align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow
                              key={transaction.id}
                              sx={{
                                "&:hover": {
                                  bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                },
                                borderBottom: `1px solid ${
                                  isDarkMode ? "#374151" : "#e2e8f0"
                                }`,
                                "& td": {
                                  padding: { xs: "6px 10px", sm: "10px 16px" },
                                  color: isDarkMode ? "#fff" : "#475569",
                                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                                bgcolor: isDarkMode ? "#1d2432" : "#fff",
                              }}
                            >
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    px: { xs: 0.75, sm: 1 },
                                    py: { xs: 0.4, sm: 0.5 },
                                    borderRadius: { xs: 0.75, sm: 1 },
                                    background: isDarkMode
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : "rgba(59, 130, 246, 0.1)",
                                    border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"}`,
                                    fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                    fontWeight: 600,
                                    color: isDarkMode ? "#60a5fa" : "#2563eb",
                                  }}
                                >
                                  #{transaction.id}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    transaction.type === "withdrawal"
                                      ? "retrait"
                                      : transaction.type === "pack_sale"
                                      ? "Achat de pack"
                                      : transaction.type === "purchase"
                                      ? "Achat"
                                      : transaction.type === "renew_pack_sale"
                                      ? "Rénouvellement de pack"
                                      : transaction.type === "boost_sale"
                                      ? "Boost de publication"
                                      : transaction.type === "virtual_sale"
                                      ? "Vente de virtuel"
                                      : transaction.type === "digital_product_sale"
                                      ? "Vente de produits numériques"
                                      : transaction.type === "transfer"
                                      ? "Transfert des fonds"
                                      : transaction.type === "reception"
                                      ? "Réception des fonds"
                                      : transaction.type ===
                                        "commission de parrainage"
                                      ? "Commission de parrainage"
                                      : transaction.type === "commission de retrait"
                                      ? "Commission de retrait"
                                      : transaction.type ===
                                        "commission de transfert"
                                      ? "Commission de transfert"
                                      : transaction.type
                                  }
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                    height: { xs: 20, sm: 24 },
                                    fontWeight: 600,
                                    borderRadius: { xs: 1, sm: 1.5 },
                                    bgcolor: (() => {
                                      switch (transaction.type) {
                                        case "withdrawal":
                                          return isDarkMode ? "#4b5563" : "#e5e7eb"
                                        case "pack_sale":
                                        case "renew_pack_sale":
                                        case "purchase":
                                          return isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)"
                                        case "boost_sale":
                                        case "virtual_sale":
                                        case "digital_product_sale":
                                          return isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"
                                        case "transfer":
                                          return isDarkMode ? "rgba(251, 146, 60, 0.2)" : "rgba(251, 146, 60, 0.1)"
                                        case "reception":
                                          return isDarkMode ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.1)"
                                        case "commission de parrainage":
                                        case "commission de retrait":
                                        case "commission de transfert":
                                          return isDarkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)"
                                        default:
                                          return isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)"
                                      }
                                    })(),
                                    color: (() => {
                                      switch (transaction.mouvment) {
                                        case "withdrawal":
                                          return isDarkMode ? "#9ca3af" : "#6b7280"
                                        case "pack_sale":
                                        case "renew_pack_sale":
                                        case "purchase":
                                          return isDarkMode ? "#4ade80" : "#16a34a"
                                        case "boost_sale":
                                        case "virtual_sale":
                                        case "digital_product_sale":
                                          return isDarkMode ? "#60a5fa" : "#2563eb"
                                        case "transfer":
                                          return isDarkMode ? "#fb923c" : "#ea580c"
                                        case "reception":
                                          return isDarkMode ? "#a78bfa" : "#7c3aed"
                                        case "commission de parrainage":
                                        case "commission de retrait":
                                        case "commission de transfert":
                                          return isDarkMode ? "#fbbf24" : "#f59e0b"
                                        default:
                                          return isDarkMode ? "#9ca3af" : "#6b7280"
                                      }
                                    })(),
                                    border: `1px solid ${(() => {
                                      switch (transaction.type) {
                                        case "withdrawal":
                                          return isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(107, 114, 128, 0.2)"
                                        case "pack_sale":
                                        case "renew_pack_sale":
                                        case "purchase":
                                          return isDarkMode ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.2)"
                                        case "boost_sale":
                                        case "virtual_sale":
                                        case "digital_product_sale":
                                          return isDarkMode ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)"
                                        case "transfer":
                                          return isDarkMode ? "rgba(251, 146, 60, 0.3)" : "rgba(251, 146, 60, 0.2)"
                                        case "reception":
                                          return isDarkMode ? "rgba(168, 85, 247, 0.3)" : "rgba(168, 85, 247, 0.2)"
                                        case "commission de parrainage":
                                        case "commission de retrait":
                                        case "commission de transfert":
                                          return isDarkMode ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.2)"
                                        default:
                                          return isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(156, 163, 175, 0.2)"
                                      }
                                    })()}`,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color: transaction.mouvment === 'in'
                                      ? (isDarkMode ? "#10b981" : "#059669")
                                      : (isDarkMode ? "#ef4444" : "#dc2626"),
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                  }}
                                >
                                  {transaction.mouvment === 'in' ? '+': '-'} {transaction.amount ? `${transaction.amount}` : '0.00'} {transaction.currency === 'USD' ? '$' : 'FC'}
                                </Typography>
                              </TableCell>
                              {isCDFEnabled && (
                                <TableCell>
                                  <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                    {transaction.currency || 'USD'}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell>
                                <Chip
                                  label={
                                    transaction.status === "completed"
                                      ? "Complétée"
                                      : transaction.status === "pending"
                                      ? "En attente"
                                      : transaction.status === "failed"
                                      ? "Échouée"
                                      : transaction.status === "cancelled"
                                      ? "Annulée"
                                      : transaction.status
                                  }
                                  size="small"
                                  sx={{
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                    height: { xs: 20, sm: 24 },
                                    fontWeight: 600,
                                    borderRadius: { xs: 1, sm: 1.5 },
                                    bgcolor: (() => {
                                      switch (transaction.status) {
                                        case "completed":
                                          return isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)"
                                        case "pending":
                                          return isDarkMode ? "rgba(251, 191, 36, 0.2)" : "rgba(251, 191, 36, 0.1)"
                                        case "failed":
                                          return isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"
                                        case "cancelled":
                                          return isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)"
                                        default:
                                          return isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)"
                                      }
                                    })(),
                                    color: (() => {
                                      switch (transaction.status) {
                                        case "completed":
                                          return isDarkMode ? "#4ade80" : "#16a34a"
                                        case "pending":
                                          return isDarkMode ? "#fbbf24" : "#f59e0b"
                                        case "failed":
                                          return isDarkMode ? "#f87171" : "#dc2626"
                                        case "cancelled":
                                          return isDarkMode ? "#9ca3af" : "#6b7280"
                                        default:
                                          return isDarkMode ? "#9ca3af" : "#6b7280"
                                      }
                                    })(),
                                    border: `1px solid ${(() => {
                                      switch (transaction.status) {
                                        case "completed":
                                          return isDarkMode ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.2)"
                                        case "pending":
                                          return isDarkMode ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.2)"
                                        case "failed":
                                          return isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"
                                        case "cancelled":
                                          return isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(156, 163, 175, 0.2)"
                                        default:
                                          return isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(156, 163, 175, 0.2)"
                                      }
                                    })()}`,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                  {transaction.created_at ? 
                                    (() => {
                                      try {
                                        // Parser le format français "dd/mm/yyyy HH:MM:SS"
                                        const parts = transaction.created_at.split(' ');
                                        if (parts.length >= 2) {
                                          const dateParts = parts[0].split('/');
                                          const timeParts = parts[1].split(':');
                                          
                                          if (dateParts.length === 3 && timeParts.length >= 2) {
                                            const day = parseInt(dateParts[0], 10);
                                            const month = parseInt(dateParts[1], 10) - 1; // Mois 0-11
                                            const year = parseInt(dateParts[2], 10);
                                            const hour = parseInt(timeParts[0], 10);
                                            const minute = parseInt(timeParts[1], 10);
                                            
                                            const date = new Date(year, month, day, hour, minute);
                                            if (!isNaN(date.getTime())) {
                                              return date.toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit', 
                                                year: 'numeric'
                                              });
                                            }
                                          }
                                        }
                                        return 'N/A';
                                      } catch (e) {
                                        return 'N/A';
                                      }
                                    })()
                                    : 'N/A'
                                  }
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewTransactionDetails(transaction)}
                                  sx={{
                                    color: isDarkMode ? "#60a5fa" : "#2563eb",
                                    "&:hover": {
                                      bgcolor: isDarkMode ? "rgba(96, 165, 250, 0.1)" : "rgba(37, 99, 235, 0.1)",
                                    },
                                  }}
                                >
                                  <ChartBarIcon className="h-4 w-4" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  {/* Pagination pour les transactions */}
                  <TablePagination
                    component="div"
                    count={totalTransactions || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Lignes par page:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                    }
                    sx={{
                      color: isDarkMode ? "#fff" : "#475569",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      "& .MuiTablePagination-toolbar": {
                        minHeight: { xs: "40px", sm: "52px" },
                        padding: { xs: "8px", sm: "16px" },
                      },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      },
                      "& .MuiTablePagination-selectIcon": {
                        color: isDarkMode ? "#fff" : "#475569",
                      },
                      "& .MuiTablePagination-select": {
                        backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                        borderRadius: 1,
                        padding: "4px 8px",
                      },
                      "& .MuiTablePagination-actions button": {
                        color: isDarkMode ? "#fff" : "#475569",
                        border: isDarkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.2)",
                        borderRadius: 1,
                        padding: "4px",
                        margin: "0 2px",
                        "&:hover": {
                          backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                        },
                        "&:disabled": {
                          color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        },
                      },
                    }}
                  />
                </Box>
              </div>
            )}

            {activeTab === "info" && (
              <div className="space-y-6">
                {/* Carte principale avec informations de l'utilisateur */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg overflow-hidden border border-blue-100 dark:border-gray-600">
                  <div className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="relative">
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg">
                            {user?.profile_picture ? (
                              <img
                                className="h-full w-full rounded-full object-cover"
                                src={user.profile_picture}
                                alt={user.name || "Photo de profil"}
                              />
                            ) : (
                              <span className="text-2xl font-bold text-white">
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            )}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 ${
                              user.status === "active"
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user.name || "Nom non renseigné"}
                          </h2>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {user.email || "Email non renseigné"}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {user.phone || "Téléphone non renseigné"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {user.status === "active" ? "Actif" : "Inactif"}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          ID: {user.account_id}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations détaillées en grille responsive */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                  {/* Informations personnelles */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 lg:px-6 lg:py-4">
                      <h3 className="text-base lg:text-lg font-semibold text-white flex items-center">
                        <IdentificationIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                        Informations personnelles
                      </h3>
                    </div>
                    <div className="p-4 lg:p-6">
                      <div className="space-y-3 lg:space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <UserIcon className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">
                              Nom complet
                            </p>
                            <p className="text-sm lg:text-base text-gray-900 dark:text-white break-words">
                              {user.name || "Non renseigné"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Sexe
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.sexe || "Non renseigné"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <EnvelopeIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Email
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white break-words">
                              {user.email || "Non renseigné"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                              <PhoneIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Téléphone
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.phone || "Non renseigné"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Localisation */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        Localisation
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <GlobeAltIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Pays - Province - Ville
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.pays && user.province && user.ville
                                ? `${user.pays} - ${user.province} - ${user.ville}`
                                : "Non renseigné"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <HomeIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Adresse
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white break-words">
                              {user.address || "Non renseignée"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                              <svg
                                className="h-4 w-4 text-teal-600 dark:text-teal-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Whatsapp
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.whatsapp || "Non renseigné"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet */}
                {userWallet && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <WalletIcon className="h-5 w-5 mr-2" />
                        Wallet
                        {isCDFEnabled && (
                          <span className="ml-2 px-2 py-1 text-sm font-medium bg-white/20 text-white rounded">
                            {selectedCurrency}
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Solde selon la devise sélectionnée */}
                        <div className={`rounded-lg p-4 border transition-all duration-300 hover:shadow-lg ${
                          selectedCurrency === "USD" 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                            : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium flex items-center ${
                              selectedCurrency === "USD"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-purple-600 dark:text-purple-400"
                            }`}>
                              <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                              Solde {selectedCurrency}
                            </span>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                              selectedCurrency === "USD"
                                ? "bg-blue-100 dark:bg-blue-800"
                                : "bg-purple-100 dark:bg-purple-800"
                            }`}>
                              <span className={`text-xs font-bold ${
                                selectedCurrency === "USD"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-purple-600 dark:text-purple-400"
                              }`}>
                                {selectedCurrency}
                              </span>
                            </div>
                          </div>
                          <p className={`text-2xl font-bold mb-1 ${
                            selectedCurrency === "USD"
                              ? "text-blue-900 dark:text-blue-100"
                              : "text-purple-900 dark:text-purple-100"
                          }`}>
                            {formatAmount(
                              selectedCurrency === "USD" 
                                ? (userWallet?.balance_usd || 0)
                                : (userWallet?.balance_cdf || 0),
                              selectedCurrency
                            )}
                          </p>
                          <p className={`text-xs ${
                            selectedCurrency === "USD"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-purple-600 dark:text-purple-400"
                          }`}>
                            disponible
                          </p>
                        </div>

                        {/* Total gagné selon la devise sélectionnée */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                              <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                              Total gagné {selectedCurrency}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                            {formatAmount(
                              selectedCurrency === "USD" 
                                ? (userWallet?.total_earned_usd || 0)
                                : (userWallet?.total_earned_cdf || 0),
                              selectedCurrency
                            )}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            cumulé
                          </p>
                        </div>

                        {/* Total retiré selon la devise sélectionnée */}
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 transition-all duration-300 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center">
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                              Total retiré {selectedCurrency}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mb-1">
                            {formatAmount(
                              selectedCurrency === "USD" 
                                ? (userWallet?.total_withdrawn_usd || 0)
                                : (userWallet?.total_withdrawn_cdf || 0),
                              selectedCurrency
                            )}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            retiré
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
            minHeight: isFullScreen ? "100vh" : "90vh",
            maxHeight: isFullScreen ? "100vh" : "90vh",
            bgcolor: isDarkMode ? "#1f2937" : "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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
          transition={{ duration: 0.3 }}
          sx={{
            bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.05)",
            color: isDarkMode ? "grey.100" : "text.primary",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.5, sm: 0 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
              <UsersIcon
                className="h-6 w-6"
                style={{ color: isDarkMode ? "#4dabf5" : "#1976d2" }}
              />
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" }
                }}
              >
                Arbre des filleuls
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: "flex", 
            gap: { xs: "3px", sm: 1 },
            flexDirection: "row",
            width: { xs: "100%", sm: "auto" },
            justifyContent: "flex-start"
          }}>
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
                  justifyContent: "flex-start",
                  textTransform: "none",
                  py: 1,
                  px: { xs: 0.75, sm: 2 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  minWidth: { xs: "40px", sm: "120px" },
                  maxWidth: { xs: "40px", sm: "auto" },
                  color: isDarkMode ? "grey.300" : "text.primary",
                  "& .MuiButton-startIcon": {
                    margin: { xs: 0, sm: "0 8px 0 0" }
                  },
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
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
                  justifyContent: "flex-start",
                  textTransform: "none",
                  py: 1,
                  px: { xs: 0.75, sm: 2 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  minWidth: { xs: "40px", sm: "120px" },
                  maxWidth: { xs: "40px", sm: "auto" },
                  color: isDarkMode ? "grey.300" : "text.primary",
                  "& .MuiButton-startIcon": {
                    margin: { xs: 0, sm: "0 8px 0 0" }
                  },
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
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
                  ml: { xs: "auto", sm: 1 },
                  width: { xs: 36, sm: 32 },
                  height: { xs: 36, sm: 32 },
                  minWidth: { xs: 36, sm: 32 },
                  minHeight: { xs: 36, sm: 32 },
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
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
                  <ArrowsPointingInIcon className="h-2 w-4" />
                ) : (
                  <ArrowsPointingOutIcon className="h-2 w-4" />
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

              {/* Section des statistiques améliorées */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Box sx={{ p: 3, pb: 2 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(2, 1fr)",
                        lg: "repeat(2, 1fr)",
                      },
                      gap: 2,
                      mb: 3,
                      justifyContent: {
                        xs: "stretch",
                        sm: "stretch",
                        md: "stretch",
                      },
                      maxWidth: "100%",
                      mx: 0,
                    }}
                  >
                    {/* Carte Total filleuls */}
                    <Box
                      sx={{
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(59, 130, 246, 0.05)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(59, 130, 246, 0.2)"
                            : "rgba(59, 130, 246, 0.1)"
                        }`,
                        borderRadius: 2,
                        p: { xs: 2, sm: 3 },
                        textAlign: "center",
                        minWidth: "100%",
                        maxWidth: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode
                            ? "0 8px 25px rgba(59, 130, 246, 0.15)"
                            : "0 8px 25px rgba(59, 130, 246, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        <UsersIcon
                          className="h-8 w-8"
                          style={{ color: isDarkMode ? "#60a5fa" : "#3b82f6" }}
                        />
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: isDarkMode ? "#60a5fa" : "#3b82f6",
                          mb: 0.5,
                        }}
                      >
                        {currentGenerationStats?.total || 0}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode ? "grey.400" : "text.secondary",
                        }}
                      >
                        Filleuls{" "}
                        {
                          ["Première", "Deuxième", "Troisième", "Quatrième"][
                            currentTab
                          ]
                        }{" "}
                        génération
                      </Typography>
                    </Box>
                    {/* Carte Commissions USD */}
                    <Box
                      sx={{
                        bgcolor: isDarkMode
                          ? "rgba(34, 197, 94, 0.1)"
                          : "rgba(34, 197, 94, 0.05)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(34, 197, 94, 0.1)"
                        }`,
                        borderRadius: 2,
                        p: { xs: 2, sm: 3 },
                        textAlign: "center",
                        display:
                          selectedCurrency === "CDF" ? "none" : "block",
                        minWidth: "100%",
                        maxWidth: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode
                            ? "0 8px 25px rgba(34, 197, 94, 0.15)"
                            : "0 8px 25px rgba(34, 197, 94, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        <CurrencyDollarIcon
                          className="h-8 w-8"
                          style={{ color: isDarkMode ? "#4ade80" : "#22c55e" }}
                        />
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: isDarkMode ? "#4ade80" : "#22c55e",
                          mb: 0.5,
                        }}
                      >
                        {formatAmount(
                          currentGenerationStats?.totalCommissionUSD || 0,
                          "USD"
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode ? "grey.400" : "text.secondary",
                        }}
                      >
                        Commissions USD
                      </Typography>
                    </Box>
                    {/* Carte Commissions CDF */}
                    <Box
                      sx={{
                        bgcolor: isDarkMode
                          ? "rgba(251, 146, 60, 0.1)"
                          : "rgba(251, 146, 60, 0.05)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(251, 146, 60, 0.2)"
                            : "rgba(251, 146, 60, 0.1)"
                        }`,
                        borderRadius: 2,
                        p: { xs: 2, sm: 3 },
                        textAlign: "center",
                        display:
                          selectedCurrency === "USD" ? "none" : "block",
                        minWidth: "100%",
                        maxWidth: "100%",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode
                            ? "0 8px 25px rgba(251, 146, 60, 0.15)"
                            : "0 8px 25px rgba(251, 146, 60, 0.1)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        FC
                      </Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: isDarkMode ? "#fb923c" : "#f97316",
                          mb: 0.5,
                        }}
                      >
                        {formatAmount(
                          currentGenerationStats?.totalCommissionCDF || 0,
                          "CDF"
                        )}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode ? "grey.400" : "text.secondary",
                        }}
                      >
                        Commissions CDF
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>

              <Box sx={{ p: 3, pt: 0 }}>
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
                              ? "rgba(255, 255, 255, 0.1)"
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
                        position: "relative",
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        startIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                        size="small"
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 500,
                          minWidth: "120px",
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "white",
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(0, 0, 0, 0.2)",
                          color: isDarkMode ? "grey.300" : "text.primary",
                          "&:hover": {
                            bgcolor: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)",
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.3)"
                              : "rgba(0, 0, 0, 0.3)",
                          },
                        }}
                      >
                        Exporter
                        {showExportMenu ? (
                          <ChevronUpIcon className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 ml-1" />
                        )}
                      </Button>

                      {showExportMenu && (
                        <Paper
                          ref={exportMenuRef}
                          elevation={3}
                          sx={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            mt: 1,
                            width: 200,
                            zIndex: 1000,
                            bgcolor: isDarkMode ? "#1a2433" : "white",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "none",
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
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <Button
                                onClick={() => exportToExcel("filtered")}
                                startIcon={
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                }
                                sx={{
                                  justifyContent: "flex-start",
                                  textTransform: "none",
                                  py: 1,
                                  color: isDarkMode
                                    ? "grey.300"
                                    : "text.primary",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.05)",
                                  },
                                }}
                              >
                                Exporter filtrés
                              </Button>
                              <Button
                                onClick={() => exportToExcel("all")}
                                startIcon={
                                  <ArrowDownTrayIcon className="h-4 w-4" />
                                }
                                sx={{
                                  justifyContent: "flex-start",
                                  textTransform: "none",
                                  py: 1,
                                  color: isDarkMode
                                    ? "grey.300"
                                    : "text.primary",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.05)",
                                  },
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

                {/* Vue tableau ou arbre */}
                <motion.div
                  key={`${viewMode}-${currentTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ height: "calc(100% - 180px)", minHeight: "300px" }}
                >
                  {viewMode === "table" ? (
                    <Box
                      sx={{
                        height: "100%",
                        minHeight: "300px",
                        "& .MuiDataGrid-root": {
                          border: "none",
                          backgroundColor: isDarkMode
                            ? "rgba(26, 36, 51, 0.7)"
                            : "rgba(255, 255, 255, 0.7)",
                          borderRadius: "8px",
                          "& .MuiDataGrid-columnHeaders": {
                            backgroundColor: isDarkMode
                              ? "rgba(0, 0, 0, 0.2)"
                              : "rgba(0, 0, 0, 0.03)",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                          },
                          "& .MuiDataGrid-cell": {
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.05)"
                              : "1px solid rgba(0, 0, 0, 0.05)",
                          },
                          "& .MuiDataGrid-row:hover": {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.02)",
                          },
                          "& .MuiDataGrid-footerContainer": {
                            borderTop: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            backgroundColor: isDarkMode
                              ? "rgba(0, 0, 0, 0.2)"
                              : "rgba(0, 0, 0, 0.03)",
                          },
                          "& .MuiTablePagination-root": {
                            color: isDarkMode ? "grey.300" : undefined,
                          },
                          "& .MuiSvgIcon-root": {
                            color: isDarkMode ? "grey.400" : undefined,
                          },
                        },
                      }}
                    >
                      {getFilteredReferrals().length === 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Aucun filleul trouvé
                        </Alert>
                      ) : (
                        <TableContainer
                          sx={{
                            boxShadow: isDarkMode
                              ? "none"
                              : "0 2px 10px rgba(0, 0, 0, 0.05)",
                            borderRadius: { xs: 1.5, sm: 2 },
                            overflow: "auto",
                            maxWidth: "100%",
                            "&::-webkit-scrollbar": {
                              height: { xs: 4, sm: 6 },
                              width: { xs: 4, sm: 6 },
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: isDarkMode
                                ? "rgba(55, 65, 81, 0.4)"
                                : "rgba(0, 0, 0, 0.06)",
                              borderRadius: { xs: 2, sm: 3 },
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: isDarkMode
                                ? "rgba(156, 163, 175, 0.6)"
                                : "rgba(156, 163, 175, 0.4)",
                              borderRadius: { xs: 2, sm: 3 },
                              "&:hover": {
                                backgroundColor: isDarkMode
                                  ? "rgba(156, 163, 175, 0.8)"
                                  : "rgba(156, 163, 175, 0.6)",
                              },
                            },
                          }}
                        >
                          <Table 
                            size="small" 
                            sx={{ 
                              minWidth: { xs: "900px", sm: "1000px" },
                              tableLayout: "fixed"
                            }}
                          >
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
                                <TableCell sx={{ width: { xs: "180px", sm: "200px" } }}>Nom</TableCell>
                                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Statut</TableCell>
                                <TableCell sx={{ width: { xs: "150px", sm: "160px" } }}>Date d'achat</TableCell>
                                <TableCell sx={{ width: { xs: "150px", sm: "160px" } }}>Date d'expiration</TableCell>
                                <TableCell sx={{ width: { xs: "150px", sm: "160px" } }}>Commission</TableCell>
                                <TableCell sx={{ width: { xs: "150px", sm: "160px" } }}>Code parrainage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getFilteredReferrals().map((referral) => (
                                <TableRow
                                  key={referral.id}
                                  sx={{
                                    "&:hover": {
                                      bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                                    },
                                    borderBottom: `1px solid ${
                                      isDarkMode ? "#374151" : "#e2e8f0"
                                    }`,
                                    "& td": {
                                      padding: { xs: "6px 10px", sm: "10px 16px" },
                                      color: isDarkMode ? "#fff" : "#475569",
                                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    },
                                    bgcolor: isDarkMode ? "#1d2432" : "#fff",
                                  }}
                                >
                                  <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Box
                                        sx={{
                                          height: { xs: 28, sm: 32 },
                                          width: { xs: 28, sm: 32 },
                                          borderRadius: "50%",
                                          bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                            fontWeight: 600,
                                            color: isDarkMode ? "#60a5fa" : "#2563eb",
                                          }}
                                        >
                                          {referral.name?.charAt(0) || "?"}
                                        </Typography>
                                      </Box>
                                      <Typography
                                        sx={{
                                          fontWeight: 500,
                                          color: isDarkMode ? "#fff" : "#1e293b",
                                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                        }}
                                      >
                                        {referral.name || "N/A"}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const status = referral.pack_status || referral.status || "N/A";
                                      let color, bgColor, icon;

                                      if (status.toLowerCase() === "active") {
                                        color = isDarkMode ? "#4ade80" : "#16a34a";
                                        bgColor = isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)";
                                        icon = <CheckCircleIcon className="h-3 w-3" />;
                                      } else if (status.toLowerCase() === "inactive") {
                                        color = isDarkMode ? "#f87171" : "#dc2626";
                                        bgColor = isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)";
                                        icon = <XCircleIcon className="h-3 w-3" />;
                                      } else {
                                        color = isDarkMode ? "#9ca3af" : "#6b7280";
                                        bgColor = isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)";
                                        icon = <XCircleIcon className="h-3 w-3" />;
                                      }

                                      return (
                                        <Chip
                                          label={
                                            status === "active"
                                              ? "Actif"
                                              : status === "inactive"
                                              ? "Inactif"
                                              : status
                                          }
                                          size="small"
                                          icon={icon}
                                          sx={{
                                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                            height: { xs: 20, sm: 24 },
                                            fontWeight: 600,
                                            borderRadius: { xs: 1, sm: 1.5 },
                                            bgcolor: bgColor,
                                            color: color,
                                            border: `1px solid ${isDarkMode ? "rgba(156, 163, 175, 0.3)" : "rgba(107, 114, 128, 0.2)"}`,
                                          }}
                                        />
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                      {referral.purchase_date || "N/A"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                                      {referral.expiry_date || "Illimité"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const usdCommission = parseFloat(referral.total_commission_usd || 0);
                                      const cdfCommission = parseFloat(referral.total_commission_cdf || 0);

                                      if (selectedCurrency === "USD") {
                                        return (
                                          <Typography
                                            sx={{
                                              fontWeight: 600,
                                              color: isDarkMode ? "#4ade80" : "#16a34a",
                                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                            }}
                                          >
                                            {formatAmount(usdCommission, "USD")}
                                          </Typography>
                                        );
                                      } else if (selectedCurrency === "CDF") {
                                        return (
                                          <Typography
                                            sx={{
                                              fontWeight: 600,
                                              color: isDarkMode ? "#fb923c" : "#ea580c",
                                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                            }}
                                          >
                                            {formatAmount(cdfCommission, "CDF")}
                                          </Typography>
                                        );
                                      } else {
                                        // Afficher selon la disponibilité du CDF
                                        if (isCDFEnabled) {
                                          return (
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                              {usdCommission > 0 && (
                                                <Typography
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: isDarkMode ? "#4ade80" : "#16a34a",
                                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  }}
                                                >
                                                  {formatAmount(usdCommission, "USD")}
                                                </Typography>
                                              )}
                                              {cdfCommission > 0 && (
                                                <Typography
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: isDarkMode ? "#fb923c" : "#ea580c",
                                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  }}
                                                >
                                                  {formatAmount(cdfCommission, "CDF")}
                                                </Typography>
                                              )}
                                              {usdCommission === 0 && cdfCommission === 0 && (
                                                <Typography
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                                  }}
                                                >
                                                  0
                                                </Typography>
                                              )}
                                            </Box>
                                          );
                                        } else {
                                          // Afficher uniquement USD si CDF est désactivé
                                          return (
                                            <Typography
                                              sx={{
                                                fontWeight: 600,
                                                color: isDarkMode ? "#4ade80" : "#16a34a",
                                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                              }}
                                            >
                                              {formatAmount(usdCommission, "USD")}
                                            </Typography>
                                          );
                                        }
                                      }
                                    })()}
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      sx={{
                                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                        fontFamily: "monospace",
                                        bgcolor: isDarkMode ? "rgba(156, 163, 175, 0.2)" : "rgba(156, 163, 175, 0.1)",
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        display: "inline-block",
                                      }}
                                    >
                                      {referral.referral_code || "N/A"}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                      
                      {/* Pagination pour les filleuls */}
                      <TablePagination
                        component="div"
                        count={getFilteredReferralsCount()}
                        page={referralPage}
                        onPageChange={handleReferralPageChange}
                        rowsPerPage={referralRowsPerPage}
                        onRowsPerPageChange={handleReferralRowsPerPageChange}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Lignes par page:"
                        labelDisplayedRows={({ from, to, count }) =>
                          `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                        }
                        sx={{
                          color: isDarkMode ? "#fff" : "#475569",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          "& .MuiTablePagination-toolbar": {
                            minHeight: { xs: "40px", sm: "52px" },
                            padding: { xs: "8px", sm: "16px" },
                          },
                          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          },
                          "& .MuiTablePagination-selectIcon": {
                            color: isDarkMode ? "#fff" : "#475569",
                          },
                          "& .MuiTablePagination-select": {
                            backgroundColor: isDarkMode ? "#1f2937" : "#f8fafc",
                            borderRadius: 1,
                            padding: "4px 8px",
                          },
                          "& .MuiTablePagination-actions button": {
                            color: isDarkMode ? "#fff" : "#475569",
                            border: isDarkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.2)",
                            borderRadius: 1,
                            padding: "4px",
                            margin: "0 2px",
                            "&:hover": {
                              backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                            },
                            "&:disabled": {
                              color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                              borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            },
                          },
                        }}
                      />
                    </Box>
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
                        data={transformDataToTree(currentPackReferrals)}
                        orientation="vertical"
                        renderCustomNodeElement={(props) => (
                          <CustomNode {...props} isDarkMode={isDarkMode} />
                        )}
                        pathFunc="step"
                        separation={{ siblings: 1, nonSiblings: 1.2 }}
                        translate={{
                          x: modalWidth ? modalWidth / 2 : 400,
                          y: 50,
                        }}
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
          sx={{
            bgcolor: isDarkMode ? "#1a2433" : "rgba(0, 0, 0, 0.05)",
            borderTop: 1,
            borderColor: "divider",
            px: 3,
            py: 2,
          }}
        >
          <Button
            onClick={() => setReferralsDialog(false)}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 500,
              px: 3,
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
      {showTransactionDetails &&
        selectedTransaction &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-[9999]"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className={`relative p-4 lg:p-8 rounded-2xl shadow-2xl max-w-2xl lg:max-w-3xl w-full mx-2 lg:mx-4 max-h-[95vh] overflow-hidden ${
                isDarkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Header avec dégradé */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>

              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <MagnifyingGlassIcon className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3
                      className={`text-lg lg:text-2xl font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Détails de la transaction
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                      ID: #{selectedTransaction.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`p-2 lg:p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <XMarkIcon className="w-4 h-4 lg:w-6 lg:h-6" />
                </button>
              </div>

              <div
                className={`overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar pb-32 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {/* Carte principale avec informations */}
                <div
                  className={`p-6 rounded-xl mb-6 ${
                    isDarkMode
                      ? "bg-gray-700 bg-opacity-50"
                      : "bg-gradient-to-br from-blue-50 to-indigo-50"
                  }`}
                >
                  <h4
                    className={`text-lg font-semibold mb-4 flex items-center ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Informations principales
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type de transaction
                      </p>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedTransaction.type_raw === "commission"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : selectedTransaction.type_raw === "transfer"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : selectedTransaction.type_raw === "purchase"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {selectedTransaction.type === "withdrawal"
                            ? "Retrait"
                            : selectedTransaction.type === "sales"
                            ? "Achat"
                            : selectedTransaction.type === "transfer"
                            ? "Transfert des fonds"
                            : selectedTransaction.type === "reception"
                            ? "Réception des fonds"
                            : selectedTransaction.type === "purchase"
                            ? "Achat"
                            : selectedTransaction.type === "virtual"
                            ? "Achat des virtuels"
                            : selectedTransaction.type_raw ===
                              "digital_product_sale"
                            ? "Vente de produit"
                            : selectedTransaction.type_raw ===
                              "commission de parrainage"
                            ? "Commission de parrainage"
                            : "Commission"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getTransactionStatusColor(
                          selectedTransaction.status
                        )}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            selectedTransaction.status === "completed"
                              ? "bg-green-500"
                              : selectedTransaction.status === "pending"
                              ? "bg-yellow-500"
                              : selectedTransaction.status === "failed"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        ></div>
                        {selectedTransaction.status === "pending"
                          ? "En attente"
                          : selectedTransaction.status === "approved"
                          ? "Approuvé"
                          : selectedTransaction.status === "rejected"
                          ? "Refusé"
                          : selectedTransaction.status === "completed"
                          ? "Complété"
                          : selectedTransaction.status === "failed"
                          ? "Échouée"
                          : selectedTransaction.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Montant
                      </p>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-2xl font-bold ${
                            selectedTransaction.type_raw === "withdrawal" ||
                            selectedTransaction.type_raw === "purchase"
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {selectedTransaction.type_raw === "withdrawal" ||
                          selectedTransaction.type_raw === "purchase"
                            ? "-"
                            : "+"}
                          {parseFloat(
                            selectedTransaction.amount
                          ).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: selectedTransaction.currency || "USD",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </p>
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(selectedTransaction.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métadonnées */}
                {selectedTransaction.metadata &&
                  Object.keys(selectedTransaction.metadata).length > 0 && (
                    <div>
                      <h4
                        className={`text-lg font-medium mb-2 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Informations supplémentaires
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        {Object.entries(selectedTransaction.metadata).map(
                          ([key, value]) => {
                            // Traduire les clés en français
                            const frenchLabels = {
                              withdrawal_request_id:
                                "Identifiant de la demande de retrait",
                              payment_method: "Méthode de paiement",
                              montant_a_retirer: "Montant à retirer",
                              fee_percentage: "Pourcentage de frais",
                              frais_de_retrait: "Frais de retrait",
                              frais_de_commission: "Frais de commission",
                              montant_total_a_payer: "Montant total à payer",
                              devise: "Dévise choisie pour le retrait",
                              payment_details: "Détails du paiement",
                              status: "Statut",
                              source: "Source",
                              type: "Type",
                              amount: "Montant",
                              currency: "Devise",
                              description: "Description",
                              reference: "Référence",
                            };

                            const label =
                              frenchLabels[key] ||
                              key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());

                            // Formater la valeur selon son type
                            let formattedValue = value;

                            // Traduction des statuts
                            if (key === "status" || key.endsWith("_status")) {
                              if (value === "pending")
                                formattedValue = "En attente";
                              else if (value === "approved")
                                formattedValue = "Approuvé";
                              else if (value === "rejected")
                                formattedValue = "Rejeté";
                              else if (
                                value === "cancelled" ||
                                value === "canceled"
                              )
                                formattedValue = "Annulé";
                              else if (value === "completed")
                                formattedValue = "Complété";
                              else if (value === "failed")
                                formattedValue = "Échoué";
                            }

                            // Ajout de symboles pour les valeurs monétaires
                            if (
                              key === "amount" ||
                              key === "montant_a_retirer" ||
                              key === "frais_de_retrait" ||
                              key === "frais_de_commission" ||
                              key === "montant_total_a_payer" ||
                              key.includes("montant") ||
                              key.includes("amount")
                            ) {
                              formattedValue = `${value} $`;
                            }

                            // Ajout de symboles pour les pourcentages
                            if (
                              key === "fee_percentage" ||
                              key.includes("percentage") ||
                              key.includes("pourcentage")
                            ) {
                              formattedValue = `${value} %`;
                            }

                            return (
                              <div key={key} className="mb-2">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                                  {label}
                                </p>
                                <p className="font-medium break-words">
                                  {typeof formattedValue === "object"
                                    ? JSON.stringify(formattedValue, null, 2)
                                    : String(formattedValue)}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20"
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
