import React, { useState, useEffect, useRef, useMemo } from "react";
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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { Fade } from "@mui/material";
import {
  UsersIcon,
  Fullscreen,
  FullscreenExit,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency } from "../contexts/CurrencyContext";
import axios from "axios";
import { Tree } from "react-d3-tree";
import { toast } from "react-toastify";

const ReferralDialog = ({
  open,
  onClose,
  packId,
  isDarkMode,
  selectedCurrency,
}) => {
  // États internes du composant
  const [viewMode, setViewMode] = useState("table");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPackReferrals, setCurrentPackReferrals] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // États pour la pagination
  const [referralsPaginationMeta, setReferralsPaginationMeta] = useState([]);
  const [referralsPage, setReferralsPage] = useState(0);
  const [referralsRowsPerPage, setReferralsRowsPerPage] = useState(25);
  
  // Références
  const exportMenuRef = useRef(null);
  const treeRef = useRef(null);

  // Effet pour charger les données des filleuls quand le modal s'ouvre
  useEffect(() => {
    if (open && packId) {
      handleReferralsClick(packId, 1);
    }
  }, [open, packId]);

  const handleReferralsClick = async (packId, newPage = 1, filters = {}) => {
    try {
      const paginationParams = {
        page: newPage,
        per_page: referralsRowsPerPage,
        ...filters,
      };

      const queryParams = new URLSearchParams();
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(
        `/api/packs/${packId}/referrals?${queryParams.toString()}`
      );

      if (response.data && response.data.success) {
        setCurrentPackReferrals(response.data.data);
        setReferralsPaginationMeta(response.data.pagination || []);
        if (!filters.generation_tab) {
          setCurrentTab(0);
        }
        setSearchTerm("");
      } else {
        toast.error("Erreur lors du chargement des filleuls");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des filleuls:", error);
      toast.error("Impossible de charger les filleuls");
    }
  };

  // Gestionnaires de pagination
  const handleReferralsPageChangeUI = (event, newPage) => {
    setReferralsPage(newPage);
    handleReferralsClick(packId, newPage + 1);
  };

  const handleReferralsRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setReferralsRowsPerPage(newRowsPerPage);
    setReferralsPage(0);
    handleReferralsClick(packId, 1, { per_page: newRowsPerPage });
  };

  // Filtrer les filleuls
  const getFilteredReferrals = () => {
    if (!currentPackReferrals || !currentPackReferrals[currentTab]) {
      return [];
    }

    return currentPackReferrals[currentTab].filter((referral) => {
      const searchMatch =
        searchTerm === "" ||
        referral.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === "all" || referral.status === statusFilter;

      return searchMatch && statusMatch;
    });
  };

  // Calculer les statistiques
  const referralStats = useMemo(() => {
    const referrals = currentPackReferrals[currentTab] || [];
    const totalCommission = referrals.reduce((sum, ref) => {
      if (selectedCurrency === "USD") {
        return sum + parseFloat(ref.total_commission_usd || 0);
      } else {
        return sum + parseFloat(ref.total_commission_cdf || 0);
      }
    }, 0);

    const formattedCommission = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: selectedCurrency === "USD" ? "USD" : "CDF",
    }).format(totalCommission);

    return {
      total: referrals.length,
      totalCommission: formattedCommission,
    };
  }, [currentPackReferrals, currentTab, selectedCurrency]);

  // Transformer les données pour l'arbre
  const transformDataToTree = (referrals) => {
    const rootNode = {
      name: "Vous",
      attributes: {
        commission: "0",
        level: "0",
      },
    };

    if (referrals[0]) {
      rootNode.children = referrals[0].map((ref) => ({
        name: ref.name,
        attributes: {
          commission:
            selectedCurrency === "USD"
              ? ref.total_commission_usd || "0"
              : ref.total_commission_cdf || "0",
          level: "1",
        },
      }));
    }

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
                    ? ref.total_commission_usd || "0"
                    : ref.total_commission_cdf || "0",
                level: gen.toString(),
              },
            });
          }
        });
      }
    }

    return rootNode;
  };

  const findParentNode = (node, userId) => {
    if (!node.children) return null;
    
    for (const child of node.children) {
      if (child.userId === userId) {
        return child;
      }
      const found = findParentNode(child, userId);
      if (found) return found;
    }
    return null;
  };

  // Export des données
  const handleExportReferrals = async (exportType = "filtered") => {
    setExportLoading(true);
    setShowExportMenu(false);
    
    try {
      const dataToExport =
        exportType === "all"
          ? currentPackReferrals[currentTab] || []
          : getFilteredReferrals();

      if (dataToExport.length === 0) {
        toast.info("Aucune donnée à exporter");
        return;
      }

      const csvContent = [
        ["Nom", "Email", "Téléphone", "Statut", "Commission USD", "Commission CDF", "Date d'inscription"],
        ...dataToExport.map(ref => [
          ref.name || "",
          ref.email || "",
          ref.phone || "",
          ref.status || "",
          ref.total_commission_usd || "0",
          ref.total_commission_cdf || "0",
          ref.created_at || ""
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `referrals_pack_${packId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export CSV téléchargé avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Impossible d'exporter les données");
    } finally {
      setExportLoading(false);
    }
  };

  // Composant pour le nœud personnalisé de l'arbre
  const CustomNode = ({ nodeDatum, toggleNode }) => (
    <g>
      <circle
        r={15}
        fill={isDarkMode ? "#4dabf5" : "#1976d2"}
        stroke={isDarkMode ? "#ffffff" : "#ffffff"}
        strokeWidth={2}
        style={{ cursor: "pointer" }}
        onClick={toggleNode}
      />
      <text
        fill={isDarkMode ? "#ffffff" : "#000000"}
        strokeWidth="0"
        x={20}
        dy={5}
        fontSize={12}
        fontWeight="bold"
      >
        {nodeDatum.name}
      </text>
      <text
        fill={isDarkMode ? "#94a3b8" : "#666666"}
        strokeWidth="0"
        x={20}
        dy={20}
        fontSize={10}
      >
        {selectedCurrency}: {nodeDatum.attributes.commission}
      </text>
    </g>
  );

  const filteredReferrals = getFilteredReferrals();

  const getColumnsForGeneration = (generation) => {
    const baseColumns = [
      { id: "name", label: "Nom", minWidth: 150 },
      { id: "email", label: "Email", minWidth: 200 },
      { id: "phone", label: "Téléphone", minWidth: 120 },
      { id: "status", label: "Statut", minWidth: 100 },
      { id: "total_commission_usd", label: "Commission USD", minWidth: 120 },
      { id: "total_commission_cdf", label: "Commission CDF", minWidth: 120 },
      { id: "created_at", label: "Date d'inscription", minWidth: 150 },
    ];

    if (generation > 1) {
      baseColumns.splice(1, 0, { id: "sponsor_name", label: "Parrain", minWidth: 150 });
    }

    return baseColumns;
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
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        },
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
              }}
            >
              {selectedCurrency === "USD" ? "USD" : "CDF"}
            </Typography>
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
              <Button
                variant="contained"
                onClick={() => setViewMode("table")}
                size="small"
                fullWidth
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 500,
                  boxShadow: viewMode === "table" ? "0 4px 8px rgba(0, 0, 0, 0.15)" : "none",
                }}
              >
                Tableau
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
              <Button
                variant="contained"
                onClick={() => setViewMode("tree")}
                size="small"
                fullWidth
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 500,
                  boxShadow: viewMode === "tree" ? "0 4px 8px rgba(0, 0, 0, 0.15)" : "none",
                }}
              >
                Arbre
              </Button>
            </motion.div>
          </Box>
          
          <Tooltip title={isFullScreen ? "Quitter le mode plein écran" : "Plein écran"} arrow>
            <IconButton
              onClick={() => setIsFullScreen(!isFullScreen)}
              sx={{
                ml: { xs: 0, sm: 1 },
                mt: { xs: 1, sm: 0 },
                alignSelf: { xs: "flex-end", sm: "auto" },
              }}
            >
              {isFullScreen ? <FullscreenExit sx={{ fontSize: 22 }} /> : <Fullscreen sx={{ fontSize: 22 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          background: isDarkMode
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {currentPackReferrals && (
          <Box sx={{ width: "100%", height: "100%" }}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Tabs
                value={currentTab}
                onChange={(event, newValue) => {
                  setCurrentTab(newValue);
                  handleReferralsClick(packId, 1, { generation_tab: newValue });
                }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 2,
                  "& .MuiTabs-indicator": {
                    background: isDarkMode ? "#4dabf5" : "#1976d2",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                  "& .MuiTab-root": {
                    color: isDarkMode ? "#94a3b8" : "#64748b",
                    fontWeight: 500,
                    textTransform: "none",
                    minHeight: 48,
                    "&.Mui-selected": {
                      color: isDarkMode ? "#ffffff" : "#000000",
                    },
                  },
                }}
              >
                {[1, 2, 3, 4].map((gen) => (
                  <Tab
                    key={gen}
                    label={`Génération ${gen}`}
                    sx={{
                      minWidth: 120,
                    }}
                  />
                ))}
              </Tabs>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {viewMode === "table" ? (
                <>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader aria-label="referrals table">
                      <TableHead>
                        <TableRow>
                          {getColumnsForGeneration(currentTab + 1).map((column) => (
                            <TableCell
                              key={column.id}
                              sx={{
                                minWidth: column.minWidth,
                                fontWeight: "bold",
                                backgroundColor: isDarkMode ? "#1e293b" : "#f8fafc",
                                color: isDarkMode ? "#ffffff" : "#000000",
                                borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                              }}
                            >
                              {column.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentPackReferrals[currentTab]?.map((referral) => (
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
                            {getColumnsForGeneration(currentTab + 1).map((column) => (
                              <TableCell
                                key={column.id}
                                sx={{
                                  color: isDarkMode ? "#e2e8f0" : "#1f2937",
                                  borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                }}
                              >
                                {referral[column.id] || "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
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
                </>
              ) : (
                <Box sx={{ height: 400, overflow: "auto" }}>
                  <Tree
                    ref={treeRef}
                    data={transformDataToTree(currentPackReferrals || [])}
                    orientation="vertical"
                    renderCustomNodeElement={(props) => (
                      <CustomNode {...props} isDarkMode={isDarkMode} />
                    )}
                    pathFunc="straight"
                    nodeSize={{ x: 200, y: 100 }}
                    separation={{ siblings: 1, nonSiblings: 2 }}
                  />
                </Box>
              )}
            </motion.div>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          backgroundColor: isDarkMode
            ? "linear-gradient(90deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)"
            : "linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
          borderTop: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            px: 3,
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReferralDialog;
