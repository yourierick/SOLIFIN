import React, { useState, useEffect } from "react";

// Fonction utilitaire pour nettoyer le HTML
const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  useMediaQuery,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Badge,
  Avatar,
  Skeleton,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import FormationModal from "./FormationModal";
import CreateFormationModal from "./CreateFormationModal";
import PurchaseFormationModal from "./PurchaseFormationModal";

// Composant TabPanel amélioré pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`formation-tabpanel-${index}`}
      aria-labelledby={`formation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={300}>
          <Box sx={{ p: { xs: 1, sm: 2 } }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

const Formations = ({ compact = false }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [formations, setFormations] = useState([]);
  const [myFormations, setMyFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFormationsLoading, setMyFormationsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myFormationsError, setMyFormationsError] = useState(null);
  const [userPacks, setUserPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [myFormationsPage, setMyFormationsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myFormationsTotalPages, setMyFormationsTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [tabValue, setTabValue] = useState(0);
  const [openFormationModal, setOpenFormationModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openPurchaseModal, setOpenPurchaseModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [purchasedFormations, setPurchasedFormations] = useState([]);

  // Fonction pour récupérer les formations disponibles
  const fetchFormations = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/formations?page=${page}`;

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      const response = await axios.get(url);
      const formationsData = response.data.data.data;

      // Extraire les catégories uniques des formations
      const uniqueCategories = [
        ...new Set(formationsData.map((f) => f.category).filter(Boolean)),
      ].sort();
      setAvailableCategories(uniqueCategories);

      setFormations(formationsData);
      setTotalPages(
        Math.ceil(response.data.data.total / response.data.data.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération des formations:", err);
      setError(
        "Impossible de charger les formations. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les formations créées par l'utilisateur
  const fetchMyFormations = async () => {
    setMyFormationsLoading(true);
    setMyFormationsError(null);

    try {
      let url = `/api/formations/my/list?page=${myFormationsPage}`;

      const response = await axios.get(url);

      setMyFormations(response.data.data.data);
      setMyFormationsTotalPages(
        Math.ceil(response.data.data.total / response.data.data.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération de mes formations:", err);
      setMyFormationsError(
        "Impossible de charger vos formations. Veuillez réessayer plus tard."
      );
    } finally {
      setMyFormationsLoading(false);
    }
  };

  // Fonction pour récupérer les formations achetées par l'utilisateur
  const fetchPurchasedFormations = async () => {
    try {
      const response = await axios.get("/api/formations/purchased");
      if (response.data.success) {
        setPurchasedFormations(response.data.data);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des formations achetées:",
        err
      );
    }
  };

  // Fonction pour ouvrir le modal de détails d'une formation
  const handleOpenFormation = (formation) => {
    setSelectedFormation(formation);
    setOpenFormationModal(true);
  };

  // Fonction pour ouvrir le modal d'achat d'une formation
  const handleOpenPurchaseModal = (formation) => {
    setSelectedFormation(formation);
    setOpenPurchaseModal(true);
  };

  // Fonction pour vérifier si l'utilisateur a déjà acheté une formation
  const hasUserPurchasedFormation = (formationId) => {
    return purchasedFormations.some((f) => f.id === formationId);
  };

  // Fonction pour récupérer les packs de l'utilisateur
  const fetchUserPacks = async () => {
    setPacksLoading(true);
    try {
      const response = await axios.get("/api/user/packs");
      setUserPacks(response.data.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des packs:", err);
    } finally {
      setPacksLoading(false);
    }
  };

  // Charger les formations au chargement du composant et lorsque les filtres changent
  useEffect(() => {
    fetchFormations();
    fetchMyFormations();
    fetchPurchasedFormations();
    fetchUserPacks();
  }, [page, myFormationsPage, searchQuery, typeFilter, categoryFilter]);

  // Réinitialiser la page lorsque les filtres changent
  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, categoryFilter]);

  // Charger mes formations lorsque l'onglet change ou la page change
  useEffect(() => {
    if (tabValue === 1) {
      fetchMyFormations();
    }
  }, [tabValue, myFormationsPage]);

  // Fonction pour ouvrir le modal de création de formation
  const handleCreateFormation = () => {
    setOpenCreateModal(true);
  };

  // Fonction pour afficher le statut avec la couleur appropriée
  const renderStatus = (status) => {
    const statusConfig = {
      draft: { label: "Brouillon", color: "default" },
      pending: { label: "En attente", color: "warning" },
      published: { label: "Publié", color: "success" },
      rejected: { label: "Rejeté", color: "error" },
    };

    const config = statusConfig[status] || { label: status, color: "default" };

    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // Fonction pour calculer le pourcentage de progression
  const calculateProgress = (formation) => {
    return formation.progress?.progress_percentage || 0;
  };

  return (
    <Box
      sx={{
        p: compact ? { xs: 1, sm: 2 } : { xs: 2, sm: 3 },
        background: isDarkMode
          ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
          : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Header moderne */}
      <Box
        sx={{
          mb: 4,
          textAlign: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: isMobile ? 40 : 56,
              height: isMobile ? 40 : 56,
              mr: 2,
            }}
          >
            <SchoolIcon sx={{ fontSize: isMobile ? 24 : 32 }} />
          </Avatar>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            sx={{
              fontWeight: "bold",
              background: isDarkMode
                ? "linear-gradient(45deg, #60a5fa, #a78bfa)"
                : "linear-gradient(45deg, #3b82f6, #8b5cf6)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Centre de Formations
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Développez vos compétences avec nos formations professionnelles
        </Typography>
      </Box>

      {/* Onglets modernes */}
      <Paper
        elevation={isMobile ? 2 : 4}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          background: isDarkMode
            ? "rgba(31, 41, 55, 0.8)"
            : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
          sx={{
            "& .MuiTab-root": {
              minHeight: 64,
              fontSize: isMobile ? "0.875rem" : "1rem",
              fontWeight: 500,
              textTransform: "none",
              transition: "all 0.3s ease",
            },
            "& .Mui-selected": {
              color: "primary.main",
              fontWeight: 600,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            },
          }}
        >
          <Tab
            icon={<SchoolIcon />}
            label={isMobile ? "Disponibles" : "Formations disponibles"}
            iconPosition="start"
          />
          <Tab
            icon={<PersonIcon />}
            label={isMobile ? "Mes créations" : "Mes formations créées"}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {/* Bouton pour afficher/masquer les filtres */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            endIcon={<TuneIcon />}
            fullWidth
            size={isMobile ? "small" : "medium"}
            sx={{
              borderRadius: 3,
              py: isMobile ? 1.5 : 2,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)",
              border: `2px solid ${
                isDarkMode
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(59, 130, 246, 0.15)"
              }`,
              color: "primary.main",
              fontWeight: 600,
              textTransform: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
                transform: "translateY(-2px)",
                boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              </Typography>
              {(searchQuery || typeFilter || categoryFilter) && (
                <Chip
                  size="small"
                  label={
                    [
                      searchQuery && "Recherche",
                      typeFilter && "Type",
                      categoryFilter && "Catégorie",
                    ].filter(Boolean).length
                  }
                  color="primary"
                  sx={{ ml: 2, minWidth: 24, height: 24, fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Button>
        </Box>

        {/* Filtres simplifiés - cachés par défaut */}
        {showFilters && (
          <Fade in={showFilters} timeout={300}>
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)"
                }`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* Champ de recherche */}
                <TextField
                  size="small"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 200, flex: 1 }}
                />

                {/* Filtre catégorie */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Catégorie"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Filtre type */}
                <Button
                  variant={typeFilter === "admin" ? "contained" : "outlined"}
                  size="small"
                  onClick={() =>
                    setTypeFilter(typeFilter === "admin" ? "" : "admin")
                  }
                >
                  {typeFilter === "admin" ? "Officielles" : "Toutes"}
                </Button>

                {/* Bouton effacer */}
                {(searchQuery || typeFilter || categoryFilter) && (
                  <Button
                    size="small"
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("");
                      setCategoryFilter("");
                    }}
                    startIcon={<ClearIcon />}
                  >
                    Effacer
                  </Button>
                )}
              </Box>
            </Box>
          </Fade>
        )}

        {/* Liste des formations disponibles */}
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" height={32} width="80%" />
                    <Skeleton variant="text" height={20} width="60%" />
                    <Skeleton
                      variant="rectangular"
                      height={60}
                      sx={{ mt: 2, mb: 2 }}
                    />
                    <Skeleton variant="text" height={20} width="40%" />
                    <Skeleton variant="text" height={20} width="40%" />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" height={40} width="100%" />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              my: 2,
              borderRadius: 2,
              "& .MuiAlert-message": { fontWeight: 500 },
            }}
          >
            {error}
          </Alert>
        ) : formations.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              background: isDarkMode
                ? "rgba(31, 41, 55, 0.5)"
                : "rgba(255, 255, 255, 0.8)",
            }}
          >
            <SchoolIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune formation disponible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez de modifier vos filtres ou revenez plus tard.
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {formations.map((formation, index) => (
                <Grid item xs={12} sm={6} md={4} key={formation.id}>
                  <Zoom in={true} timeout={300 + index * 100}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDarkMode
                          ? "rgba(31, 41, 55, 0.9)"
                          : "rgba(255, 255, 255, 0.95)",
                        borderRadius: 3,
                        boxShadow: isMobile ? 2 : 4,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)"
                        }`,
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          transform: isMobile
                            ? "translateY(-2px)"
                            : "translateY(-8px)",
                          boxShadow: isMobile ? 4 : 8,
                          "& .card-overlay": {
                            opacity: 1,
                          },
                        },
                        // Filtre pour formations inaccessibles
                        ...(formation.type === "admin" &&
                          !formation.access?.has_access && {
                            position: "relative",
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              zIndex: 1,
                              borderRadius: 3,
                            },
                          }),
                      }}
                    >
                      {/* Badge de cadenas pour les formations inaccessibles */}
                      {formation.type === "admin" &&
                        !formation.access?.has_access && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 12,
                              right: 12,
                              zIndex: 2,
                              backgroundColor: isDarkMode
                                ? "rgba(0, 0, 0, 0.8)"
                                : "rgba(255, 255, 255, 0.9)",
                              borderRadius: "50%",
                              padding: 1,
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              boxShadow: 2,
                            }}
                          >
                            <LockIcon color="error" />
                          </Box>
                        )}

                      <CardMedia
                        component="img"
                        height={isMobile ? 120 : 160}
                        image={
                          formation.thumbnail ||
                          "https://via.placeholder.com/300x160?text=Formation"
                        }
                        alt={formation.title}
                        sx={{
                          ...(formation.type === "admin" &&
                            !formation.access?.has_access && {
                              filter: "grayscale(60%)",
                            }),
                        }}
                      />

                      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant={isMobile ? "h6" : "h5"}
                            component="div"
                            noWrap
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.2,
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {formation.title}
                          </Typography>
                          <Chip
                            label={
                              formation.type === "admin"
                                ? "Officielle"
                                : "Communauté"
                            }
                            color={
                              formation.type === "admin"
                                ? "primary"
                                : "secondary"
                            }
                            size="small"
                            sx={{
                              fontWeight: 500,
                              fontSize: "0.75rem",
                            }}
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.5,
                            fontSize: isMobile ? "0.875rem" : "1rem",
                          }}
                        >
                          {stripHtml(formation.description)}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1.5,
                                bgcolor: "primary.main",
                                fontSize: "0.875rem",
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {formation.creator?.name || "Administrateur"}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1.5,
                                bgcolor: "secondary.main",
                                fontSize: "0.875rem",
                              }}
                            >
                              <SchoolIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {formation.modules?.length || 0} module
                              {(formation.modules?.length || 0) > 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Message d'accès restreint */}
                        {formation.type === "admin" &&
                          !formation.access?.has_access && (
                            <Alert
                              severity="warning"
                              sx={{
                                mt: 2,
                                borderRadius: 2,
                                "& .MuiAlert-message": { fontSize: "0.875rem" },
                              }}
                            >
                              <Typography
                                variant="caption"
                                display="block"
                                gutterBottom
                              >
                                Packs requis :
                              </Typography>
                              <List dense sx={{ mt: 1, pl: 1 }}>
                                {formation.access?.required_packs.map(
                                  (pack) => (
                                    <ListItem
                                      key={pack.id}
                                      sx={{ py: 0.5, px: 0 }}
                                    >
                                      <ListItemIcon sx={{ minWidth: 24 }}>
                                        <LockIcon
                                          fontSize="small"
                                          color="warning"
                                        />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={pack.name}
                                        primaryTypographyProps={{
                                          fontSize: "0.875rem",
                                        }}
                                      />
                                    </ListItem>
                                  )
                                )}
                              </List>
                            </Alert>
                          )}

                        {/* Barre de progression */}
                        {(!formation.type === "admin" ||
                          formation.access?.has_access) && (
                          <Box sx={{ mt: 3 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <TrendingUpIcon
                                  sx={{
                                    fontSize: 16,
                                    mr: 1,
                                    color: "primary.main",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontWeight={500}
                                >
                                  Progression
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                color="primary.main"
                                fontWeight={600}
                              >
                                {calculateProgress(formation)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(formation)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isDarkMode
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 4,
                                  background:
                                    "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                                },
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>

                      <CardActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
                        {formation.type === "admin" &&
                        !formation.access?.has_access ? (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="warning"
                            startIcon={<LockIcon />}
                            disabled
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 500,
                              height: 48,
                            }}
                          >
                            Accès restreint
                          </Button>
                        ) : formation.is_paid &&
                          !hasUserPurchasedFormation(formation.id) ? (
                          <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            startIcon={<LockOpenIcon />}
                            onClick={() => handleOpenPurchaseModal(formation)}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                              height: 48,
                              background:
                                "linear-gradient(45deg, #f59e0b, #f97316)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #f97316, #ea580c)",
                              },
                            }}
                          >
                            {isMobile
                              ? "Acheter"
                              : `Acheter (${formation.price}$)`}
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={
                              calculateProgress(formation) > 0 ? (
                                <PlayArrowIcon />
                              ) : (
                                <ArrowForwardIcon />
                              )
                            }
                            onClick={() => handleOpenFormation(formation)}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                              height: 48,
                              background:
                                calculateProgress(formation) > 0
                                  ? "linear-gradient(45deg, #10b981, #059669)"
                                  : "linear-gradient(45deg, #3b82f6, #2563eb)",
                              "&:hover": {
                                background:
                                  calculateProgress(formation) > 0
                                    ? "linear-gradient(45deg, #059669, #047857)"
                                    : "linear-gradient(45deg, #2563eb, #1d4ed8)",
                              },
                            }}
                          >
                            {calculateProgress(formation) > 0
                              ? "Continuer"
                              : "Commencer"}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* Pagination moderne */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                  },
                  "& .Mui-selected": {
                    background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                    color: "white",
                  },
                }}
              />
            </Box>
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* En-tête moderne pour mes formations créées */}
        <Zoom in={true} timeout={400}>
          <Paper
            elevation={isMobile ? 2 : 3}
            sx={{
              mb: 3,
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              background: isDarkMode
                ? "rgba(31, 41, 55, 0.9)"
                : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${
                isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 2 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: "secondary.main",
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    mr: 2,
                  }}
                >
                  <PersonIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
                </Avatar>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="h2"
                  fontWeight={600}
                >
                  Mes formations créées
                </Typography>
              </Box>
              {!packsLoading &&
                userPacks.some(
                  (pack) =>
                    pack.status === "active" &&
                    pack.pack.peux_publier_formation === true
                ) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateFormation}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      height: isMobile ? 40 : 48,
                      background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #2563eb, #7c3aed)",
                      },
                    }}
                  >
                    {isMobile ? "Créer" : "Créer une formation"}
                  </Button>
                )}
            </Box>
          </Paper>
        </Zoom>

        {/* Liste de mes formations créées */}
        {myFormationsLoading ? (
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <Skeleton variant="rectangular" height={140} />
                  <CardContent>
                    <Skeleton variant="text" height={32} width="80%" />
                    <Skeleton
                      variant="rectangular"
                      height={60}
                      sx={{ mt: 2, mb: 2 }}
                    />
                    <Skeleton variant="text" height={20} width="40%" />
                    <Skeleton variant="text" height={20} width="40%" />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" height={40} width="100%" />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : myFormationsError ? (
          <Alert
            severity="error"
            sx={{
              my: 2,
              borderRadius: 2,
              "& .MuiAlert-message": { fontWeight: 500 },
            }}
          >
            {myFormationsError}
          </Alert>
        ) : myFormations.length === 0 ? (
          <Paper
            elevation={1}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              background: isDarkMode
                ? "rgba(31, 41, 55, 0.5)"
                : "rgba(255, 255, 255, 0.8)",
            }}
          >
            <SchoolIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune formation créée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commencez à créer votre première formation professionnelle.
            </Typography>
            {!packsLoading &&
              userPacks.some(
                (pack) =>
                  pack.status === "active" &&
                  pack.pack.peux_publier_formation === true
              ) && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateFormation}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Créer ma première formation
                </Button>
              )}
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {myFormations.map((formation, index) => (
                <Grid item xs={12} sm={6} md={4} key={formation.id}>
                  <Zoom in={true} timeout={300 + index * 100}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: isDarkMode
                          ? "rgba(31, 41, 55, 0.9)"
                          : "rgba(255, 255, 255, 0.95)",
                        borderRadius: 3,
                        boxShadow: isMobile ? 2 : 4,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: `1px solid ${
                          isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)"
                        }`,
                        "&:hover": {
                          transform: isMobile
                            ? "translateY(-2px)"
                            : "translateY(-8px)",
                          boxShadow: isMobile ? 4 : 8,
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height={isMobile ? 120 : 160}
                        image={
                          formation.thumbnail ||
                          "https://via.placeholder.com/300x160?text=Formation"
                        }
                        alt={formation.title}
                      />
                      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant={isMobile ? "h6" : "h5"}
                            component="div"
                            noWrap
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.2,
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {formation.title}
                          </Typography>
                          {renderStatus(formation.status)}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.5,
                            fontSize: isMobile ? "0.875rem" : "1rem",
                          }}
                        >
                          {stripHtml(formation.description)}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1.5,
                                bgcolor: "secondary.main",
                                fontSize: "0.875rem",
                              }}
                            >
                              <SchoolIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {formation.modules?.length || 0} module
                              {(formation.modules?.length || 0) > 1 ? "s" : ""}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                mr: 1.5,
                                bgcolor: "info.main",
                                fontSize: "0.875rem",
                              }}
                            >
                              <AccessTimeIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              Créée le{" "}
                              {new Date(
                                formation.created_at
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>

                        {formation.status === "rejected" && (
                          <Alert
                            severity="error"
                            sx={{
                              mt: 2,
                              borderRadius: 2,
                              "& .MuiAlert-message": { fontSize: "0.875rem" },
                            }}
                          >
                            <Typography
                              variant="caption"
                              display="block"
                              gutterBottom
                              fontWeight={600}
                            >
                              Raison du rejet:
                            </Typography>
                            <Typography variant="caption">
                              {formation.rejection_reason || "Non spécifiée"}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                      <CardActions sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            navigate(
                              `/dashboard/formations/edit/${formation.id}`
                            )
                          }
                          startIcon={<ArrowForwardIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            height: 48,
                            background:
                              "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #2563eb, #7c3aed)",
                            },
                          }}
                        >
                          Gérer
                        </Button>
                      </CardActions>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* Pagination moderne */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={myFormationsTotalPages}
                page={myFormationsPage}
                onChange={(e, value) => setMyFormationsPage(value)}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                  },
                  "& .Mui-selected": {
                    background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                    color: "white",
                  },
                }}
              />
            </Box>
          </>
        )}
      </TabPanel>

      {/* Modal de détails de formation */}
      {openFormationModal && selectedFormation && (
        <FormationModal
          open={openFormationModal}
          onClose={() => setOpenFormationModal(false)}
          formationId={selectedFormation.id}
        />
      )}

      {/* Modal de création de formation */}
      <CreateFormationModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onFormationCreated={fetchMyFormations}
      />

      {/* Modal d'achat de formation */}
      {openPurchaseModal && selectedFormation && (
        <PurchaseFormationModal
          open={openPurchaseModal}
          onClose={() => setOpenPurchaseModal(false)}
          formation={selectedFormation}
          onPurchaseComplete={() => {
            // Rafraîchir la liste des formations achetées
            fetchPurchasedFormations();
            // Rafraîchir la liste des formations
            fetchFormations();
          }}
        />
      )}
    </Box>
  );
};

export default Formations;
