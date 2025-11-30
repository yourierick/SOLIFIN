import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  useMediaQuery,
  Stack,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Quiz as QuizIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Publish as PublishIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  Paid as PaidIcon,
  FreeBreakfast as FreeBreakfastIcon,
  Info as InfoIcon,
  LibraryBooks as LibraryBooksIcon,
  CalendarToday as CalendarTodayIcon,
  BarChart as BarChartIcon,
  ErrorOutline as ErrorOutlineIcon,
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  MonetizationOn as MonetizationOnIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ModuleForm from "../../../pages/admin/components/ModuleForm";
import { getModalStyle } from "../../../styles/modalStyles";

// Composant TabPanel pour les onglets avec animations
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    // Déclencher l'animation après le montage initial
    if (value === index) {
      const timer = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [value, index]);

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`formation-editor-tabpanel-${index}`}
      aria-labelledby={`formation-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box 
          sx={{ 
            p: 2,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

const FormationEditor = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { id } = useParams();

  const [formation, setFormation] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [editFormation, setEditFormation] = useState(false);
  const [formationFormData, setFormationFormData] = useState({
    title: "",
    category: "",
    customCategory: "",
    description: "",
    is_paid: false,
    price: "",
    thumbnail: null,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [addModule, setAddModule] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [deleteModuleId, setDeleteModuleId] = useState(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [formationUpdateLoading, setFormationUpdateLoading] = useState(false);
  const [formationUpdateError, setFormationUpdateError] = useState(null);
  const [formationUpdateSuccess, setFormationUpdateSuccess] = useState(false);

  // Fonction pour récupérer les détails de la formation
  const fetchFormationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/formations/${id}`);
      setFormation(response.data.data);
      setModules(response.data.data.modules || []);

      // Initialiser le formulaire d'édition
      const categoryValue = response.data.data.category || "";

      // Vérifier si la catégorie est une catégorie standard ou personnalisée
      const standardCategories = [
        "Développement personnel",
        "Compétences professionnelles",
        "Technologie & Informatique",
        "Langues",
        "Santé & Bien-être",
        "Arts & Créativité",
        "Education financière",
        "Soft skills",
        "Administration publique & gestion administrative",
        "Suivi & Évaluation de projets",
        "Humanitaire",
        "Gestion financière & budgétaire",
        "Gestion documentaire & archivage",
        "Planification stratégique",
        "Éthique & gouvernance",
        "Analyse des politiques publiques",
        "Gestion des risques & conformité",
      ];

      const isStandardCategory = standardCategories.includes(categoryValue);

      setFormationFormData({
        title: response.data.data.title || "",
        category: isStandardCategory ? categoryValue : "Autre",
        customCategory: isStandardCategory ? "" : categoryValue,
        description: response.data.data.description || "",
        is_paid: response.data.data.is_paid ? "true" : "false",
        price: response.data.data.price || "",
        thumbnail: null,
      });

      // Initialiser la prévisualisation de la photo de couverture
      if (response.data.data.thumbnail) {
        setThumbnailPreview(response.data.data.thumbnail);
      } else {
        setThumbnailPreview(null);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des détails de la formation:",
        err
      );
      setError(
        "Impossible de charger les détails de la formation. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les détails au chargement du composant
  useEffect(() => {
    if (id) {
      fetchFormationDetails();
    }
  }, [id]);

  // Charger les statistiques lorsque l'onglet statistiques est sélectionné
  useEffect(() => {
    if (tabValue === 1 && formation && !stats && !loadingStats) {
      fetchFormationStats();
    }
  }, [tabValue, formation, stats, loadingStats]);

  // Fonction pour récupérer les statistiques de la formation
  const fetchFormationStats = async () => {
    if (!id) return;

    setLoadingStats(true);
    try {
      const response = await axios.get(`/api/formations/my/${id}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Gérer les changements de champs du formulaire de formation
  const handleFormationFormChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "thumbnail" && files && files.length > 0) {
      const file = files[0];
      setFormationFormData((prev) => ({
        ...prev,
        thumbnail: file,
      }));

      // Créer une URL pour la prévisualisation de l'image
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else {
      setFormationFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Si le type de formation change à gratuit, réinitialiser le prix
      if (name === "is_paid" && value === "false") {
        setFormationFormData((prev) => ({
          ...prev,
          price: "",
        }));
      }
    }
  };

  // Supprimer la photo de couverture
  const handleRemoveThumbnail = () => {
    setFormationFormData((prev) => ({
      ...prev,
      thumbnail: null,
    }));
    setThumbnailPreview(null);
  };

  // Mettre à jour les informations de la formation
  const handleUpdateFormation = async () => {
    setFormationUpdateLoading(true);
    setFormationUpdateError(null);
    setFormationUpdateSuccess(false);

    try {
      // Utiliser FormData pour pouvoir envoyer des fichiers
      const formData = new FormData();
      formData.append("title", formationFormData.title);

      // Gestion de la catégorie (standard ou personnalisée)
      if (
        formationFormData.category === "Autre" &&
        formationFormData.customCategory.trim() !== ""
      ) {
        formData.append("category", formationFormData.customCategory.trim());
      } else {
        formData.append("category", formationFormData.category);
      }

      formData.append("description", formationFormData.description);
      formData.append("is_paid", formationFormData.is_paid === "true");

      if (formationFormData.is_paid === "true") {
        formData.append("price", formationFormData.price);
      }

      // Ajouter la photo de couverture si elle existe
      if (formationFormData.thumbnail) {
        formData.append("thumbnail", formationFormData.thumbnail);
      }

      const response = await axios.post(
        `/api/formations/${id}/update?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFormation(response.data.data);
      setFormationUpdateSuccess(true);

      // Fermer le formulaire d'édition après un court délai
      setTimeout(() => {
        setEditFormation(false);
        setFormationUpdateSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la formation:", err);
      setFormationUpdateError(
        err.response?.data?.errors ||
          "Une erreur est survenue lors de la mise à jour de la formation."
      );
    } finally {
      setFormationUpdateLoading(false);
    }
  };

  // Publier la formation
  const handlePublishFormation = async () => {
    try {
      const response = await axios.post(`/api/formations/${id}/submit`);

      setFormation(response.data.data);
      setPublishConfirmOpen(false);

      // Afficher une notification de succès
      toast.success("Formation publiée avec succès");
    } catch (err) {
      console.error("Erreur lors de la publication de la formation:", err);
      toast.error(
        "Impossible de publier la formation. Veuillez réessayer plus tard."
      );
    }
  };

  // Supprimer un module
  const handleDeleteModule = async () => {
    if (!deleteModuleId) return;

    try {
      await axios.delete(`/api/formations/my/${id}/modules/${deleteModuleId}`);

      // Mettre à jour la liste des modules
      setModules((prev) =>
        prev.filter((module) => module.id !== deleteModuleId)
      );

      // Fermer la boîte de dialogue
      setDeleteModuleId(null);

      // Afficher une notification de succès
      toast.success("Module supprimé avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression du module:", err);
      toast.error(
        "Impossible de supprimer le module. Veuillez réessayer plus tard."
      );
    }
  };

  // Réordonner un module
  const handleReorderModule = async (moduleId, direction) => {
    try {
      // Trouver le module à déplacer et son index actuel
      const moduleIndex = modules.findIndex((m) => m.id === moduleId);
      if (moduleIndex === -1) return;

      // Calculer le nouvel index en fonction de la direction
      const newIndex = direction === "up" ? moduleIndex - 1 : moduleIndex + 1;

      // Vérifier que le nouvel index est valide
      if (newIndex < 0 || newIndex >= modules.length) return;

      // Créer une copie des modules pour les réorganiser
      const updatedModules = [...modules];

      // Échanger les positions
      const temp = updatedModules[moduleIndex];
      updatedModules[moduleIndex] = updatedModules[newIndex];
      updatedModules[newIndex] = temp;

      // Mettre à jour les ordres
      const modulesWithOrder = updatedModules.map((module, index) => ({
        id: module.id,
        order: index,
      }));

      // Envoyer la requête avec le format attendu par le contrôleur
      const response = await axios.post(
        `/api/formations/my/${id}/modules/reorder`,
        {
          modules: modulesWithOrder,
        }
      );

      // Mettre à jour la liste des modules avec la réponse du serveur ou notre version locale
      if (response.data.success) {
        // Si le serveur renvoie les modules mis à jour, utilisez-les
        if (response.data.data) {
          setModules(response.data.data);
        } else {
          // Sinon, utilisez notre version locale
          setModules(updatedModules);
        }

        // Afficher une notification de succès
        toast.success("Ordre des modules mis à jour avec succès");
      }
    } catch (err) {
      console.error("Erreur lors de la réorganisation des modules:", err);
      toast.error(
        "Impossible de réorganiser les modules. Veuillez réessayer plus tard."
      );
    }
  };

  // Fonction pour afficher l'icône appropriée selon le type de module
  const getModuleIcon = (type) => {
    switch (type) {
      case "video":
        return <VideoIcon />;
      case "pdf":
        return <PdfIcon />;
      case "quiz":
        return <QuizIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Gérer la réception du module après soumission du formulaire
  const handleModuleSubmit = (moduleData) => {
    // Le moduleData est déjà la réponse du serveur après création/modification

    if (editModule) {
      // Mode édition - Mettre à jour un module existant dans la liste locale
      setModules((prev) =>
        prev.map((module) =>
          module.id === moduleData.id ? moduleData : module
        )
      );

      // Réinitialiser le formulaire
      setEditModule(null);
    } else {
      // Mode ajout - Ajouter le nouveau module à la liste locale
      setModules((prev) => [...prev, moduleData]);

      // Réinitialiser le formulaire
      setAddModule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/my-page")}
        >
          Retour
        </Button>
      </Box>
    );
  }

  if (!formation) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/my-page")}
          sx={{
            borderRadius: "8px",
            boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            '&:hover': {
              transform: "translateY(-2px)",
              boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)",
            }
          }}
        >
          Retour à ma page
        </Button>

        {formation.status === "draft" && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={() => setPublishConfirmOpen(true)}
            disabled={modules.length === 0}
            sx={{
              borderRadius: "8px",
              boxShadow: isDarkMode ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "0 4px 12px rgba(59, 130, 246, 0.2)",
              transition: "all 0.2s ease",
              '&:hover': {
                transform: "translateY(-2px)",
                boxShadow: isDarkMode ? "0 6px 16px rgba(59, 130, 246, 0.4)" : "0 6px 16px rgba(59, 130, 246, 0.3)",
              },
              '&:disabled': {
                boxShadow: "none",
                transform: "none"
              }
            }}
          >
            Publier la formation
          </Button>
        )}
      </Box>

      <Card
        sx={{
          mb: 4,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          boxShadow: isDarkMode 
            ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
            : "0 4px 20px rgba(0, 0, 0, 0.08)",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        <Box 
          sx={{
            p: 2, 
            borderBottom: "1px solid", 
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <SchoolIcon color="primary" />
            {formation.title}
          </Typography>

          <Chip
            label={
              formation.status === "draft"
                ? "Brouillon"
                : formation.status === "pending"
                ? "En attente de validation"
                : formation.status === "published"
                ? "Publiée"
                : formation.status === "rejected"
                ? "Rejetée"
                : formation.status
            }
            color={
              formation.status === "draft"
                ? "default"
                : formation.status === "pending"
                ? "warning"
                : formation.status === "published"
                ? "success"
                : formation.status === "rejected"
                ? "error"
                : "default"
            }
            sx={{
              fontWeight: 500,
              borderRadius: "6px",
              boxShadow: isDarkMode ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)",
            }}
          />
        </Box>
        <CardContent sx={{ p: 3 }}>
          {formation.status === "rejected" && formation.rejection_reason && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(244, 63, 94, 0.2)",
              }}
              icon={<ErrorOutlineIcon />}
              variant="outlined"
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Raison du rejet:
              </Typography>
              <Typography variant="body2">
                {formation.rejection_reason}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  p: 2,
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  mb: 2
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 600, 
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <DescriptionIcon fontSize="small" />
                  Description
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.7,
                    whiteSpace: "pre-line"
                  }}
                >
                  {formation.description}
                </Typography>
              </Box>
              
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2
                }}
              >
                <Chip 
                  icon={<CategoryIcon />} 
                  label={formation.category} 
                  color="primary" 
                  variant="outlined" 
                  sx={{ borderRadius: "6px" }}
                />
                {formation.is_paid ? (
                  <Chip 
                    icon={<PaidIcon />} 
                    label={`${formation.price} $`} 
                    color="success" 
                    variant="outlined" 
                    sx={{ borderRadius: "6px" }}
                  />
                ) : (
                  <Chip 
                    icon={<FreeBreakfastIcon />} 
                    label="Gratuite" 
                    color="info" 
                    variant="outlined" 
                    sx={{ borderRadius: "6px" }}
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  border: "1px solid",
                  borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <InfoIcon fontSize="small" />
                  Informations
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    p: 1,
                    borderBottom: "1px solid",
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LibraryBooksIcon fontSize="small" />
                      Modules
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {modules.length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    p: 1,
                    borderBottom: "1px solid",
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarTodayIcon fontSize="small" />
                      Créée le
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(formation.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {formation.status === "published" && formation.published_at && (
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      p: 1,
                      borderBottom: "1px solid",
                      borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PublishIcon fontSize="small" />
                        Publiée le
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {new Date(formation.published_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {formation.status === "draft" && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => setEditFormation(true)}
                    fullWidth
                    sx={{ 
                      mt: 3,
                      borderRadius: "8px",
                      boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
                      transition: "all 0.2s ease",
                      '&:hover': {
                        transform: "translateY(-2px)",
                        boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.1)",
                      }
                    }}
                  >
                    Modifier les informations
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mb: 4, mt: 1 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="Onglets de l'éditeur de formation"
          role="tablist"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minWidth: 100,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected': {
                color: theme => theme.palette.primary.main,
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            },
          }}
          variant="fullWidth"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooksIcon fontSize="small" />
                <span>Modules</span>
              </Box>
            }
            id="formation-editor-tab-0"
            aria-controls="formation-editor-tabpanel-0"
            tabIndex={tabValue === 0 ? 0 : -1}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon fontSize="small" />
                <span>Statistiques</span>
              </Box>
            }
            id="formation-editor-tab-1"
            aria-controls="formation-editor-tabpanel-1"
            tabIndex={tabValue === 1 ? 0 : -1}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <LibraryBooksIcon color="primary" />
            Modules de la formation
          </Typography>

          {(formation.status === "draft" ||
            formation.status === "published") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddModule(true)}
              aria-label="Ajouter un nouveau module à la formation"
              sx={{
                borderRadius: "8px",
                boxShadow: isDarkMode ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "0 4px 12px rgba(59, 130, 246, 0.2)",
                transition: "all 0.2s ease",
                animation: modules.length === 0 ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: isDarkMode 
                      ? '0 0 0 0 rgba(59, 130, 246, 0.7)' 
                      : '0 0 0 0 rgba(59, 130, 246, 0.4)'
                  },
                  '70%': {
                    boxShadow: isDarkMode 
                      ? '0 0 0 10px rgba(59, 130, 246, 0)' 
                      : '0 0 0 10px rgba(59, 130, 246, 0)'
                  },
                  '100%': {
                    boxShadow: isDarkMode 
                      ? '0 0 0 0 rgba(59, 130, 246, 0)' 
                      : '0 0 0 0 rgba(59, 130, 246, 0)'
                  }
                },
                '&:hover': {
                  transform: "translateY(-2px)",
                  boxShadow: isDarkMode ? "0 6px 16px rgba(59, 130, 246, 0.4)" : "0 6px 16px rgba(59, 130, 246, 0.3)",
                  animation: 'none'
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.light',
                  outlineOffset: '2px',
                }
              }}
            >
              Ajouter un module
            </Button>
          )}
        </Box>

        {modules.length === 0 ? (
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<InfoIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: "8px",
              p: 2,
              bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.02)",
              border: "1px dashed",
              borderColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Aucun module disponible
              </Typography>
            </Box>
            <Typography variant="body2">
              Aucun module n'a encore été ajouté à cette formation. Utilisez le
              bouton "Ajouter un module" pour commencer.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {modules.map((module, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                md={4} 
                key={module.id}
                sx={{
                  opacity: 0,
                  animation: `fadeInUp 0.5s ease-out forwards ${0.1 + index * 0.1}s`,
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isDarkMode 
                      ? "0 4px 12px rgba(0, 0, 0, 0.3)" 
                      : "0 4px 12px rgba(0, 0, 0, 0.08)",
                    border: "1px solid",
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: isDarkMode 
                        ? "0 8px 24px rgba(0, 0, 0, 0.4)" 
                        : "0 8px 24px rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  <Box 
                    sx={{
                      p: 2, 
                      borderBottom: "1px solid", 
                      borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                      bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(59, 130, 246, 0.1)",
                        color: "primary.main",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        boxShadow: isDarkMode 
                          ? "0 2px 6px rgba(0, 0, 0, 0.2)" 
                          : "0 2px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {getModuleIcon(module.type)}
                    </Box>
                    <Box sx={{ overflow: "hidden" }}>
                      <Typography 
                        variant="subtitle1" 
                        component="h3" 
                        noWrap 
                        sx={{ 
                          fontWeight: 600,
                          lineHeight: 1.2
                        }}
                      >
                        {index + 1}. {module.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          module.type.charAt(0).toUpperCase() +
                          module.type.slice(1)
                        }
                        color="primary"
                        variant="outlined"
                        sx={{ 
                          mt: 0.5, 
                          height: 22, 
                          '& .MuiChip-label': { 
                            px: 1, 
                            fontSize: '0.7rem',
                            fontWeight: 500
                          },
                          borderRadius: "4px"
                        }}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.6
                      }}
                    >
                      {module.description}
                    </Typography>
                  </CardContent>

                  {formation.status === "draft" && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderTop: "1px solid",
                        borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.01)",
                      }}
                    >
                      <Stack direction="row" spacing={1}>
                        {/* Boutons de navigation */}
                        <ButtonGroup
                          size="small"
                          variant="contained"
                          disableElevation
                        >
                          <IconButton
                            size="small"
                            disabled={index === 0}
                            color="primary"
                            aria-label={`Déplacer le module ${module.title} vers le haut`}
                            aria-disabled={index === 0}
                            sx={{
                              borderRadius: "6px 0 0 6px",
                              opacity: index === 0 ? 0.5 : 1,
                              minWidth: "30px",
                              height: "30px",
                              padding: 0,
                              boxShadow: index === 0 ? "none" : (isDarkMode ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)"),
                              transition: "all 0.2s",
                              '&:hover': {
                                transform: index === 0 ? "none" : "translateY(-2px)",
                              },
                              '&:focus-visible': {
                                outline: "2px solid",
                                outlineColor: "primary.main",
                                outlineOffset: "2px",
                              }
                            }}
                            onClick={() =>
                              index > 0 && handleReorderModule(module.id, "up")
                            }
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            disabled={index === modules.length - 1}
                            color="primary"
                            aria-label={`Déplacer le module ${module.title} vers le bas`}
                            aria-disabled={index === modules.length - 1}
                            sx={{
                              borderRadius: "0 6px 6px 0",
                              opacity: index === modules.length - 1 ? 0.5 : 1,
                              minWidth: "30px",
                              height: "30px",
                              padding: 0,
                              boxShadow: index === modules.length - 1 ? "none" : (isDarkMode ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)"),
                              transition: "all 0.2s",
                              '&:hover': {
                                transform: index === modules.length - 1 ? "none" : "translateY(-2px)",
                              },
                              '&:focus-visible': {
                                outline: "2px solid",
                                outlineColor: "primary.main",
                                outlineOffset: "2px",
                              }
                            }}
                            onClick={() =>
                              index < modules.length - 1 &&
                              handleReorderModule(module.id, "down")
                            }
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </ButtonGroup>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        {/* Boutons d'action */}
                        <Tooltip title="Modifier" arrow placement="top">
                          <IconButton
                            size="small"
                            color="info"
                            aria-label={`Modifier le module ${module.title}`}
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(14, 165, 233, 0.15)"
                                : "rgba(14, 165, 233, 0.1)",
                              "&:hover": {
                                bgcolor: isDarkMode
                                  ? "rgba(14, 165, 233, 0.25)"
                                  : "rgba(14, 165, 233, 0.2)",
                                transform: "translateY(-2px)",
                              },
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              boxShadow: isDarkMode ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)",
                              transition: "all 0.2s",
                              '&:focus-visible': {
                                outline: "2px solid",
                                outlineColor: "info.main",
                                outlineOffset: "2px",
                              }
                            }}
                            onClick={() => setEditModule(module)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Supprimer" arrow placement="top">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Supprimer le module ${module.title}`}
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(244, 63, 94, 0.15)"
                                : "rgba(244, 63, 94, 0.1)",
                              "&:hover": {
                                bgcolor: isDarkMode
                                  ? "rgba(244, 63, 94, 0.25)"
                                  : "rgba(244, 63, 94, 0.2)",
                                transform: "translateY(-2px)",
                              },
                              width: "30px",
                              height: "30px",
                              borderRadius: "6px",
                              boxShadow: isDarkMode ? "0 2px 6px rgba(0,0,0,0.2)" : "0 2px 6px rgba(0,0,0,0.1)",
                              transition: "all 0.2s",
                              '&:focus-visible': {
                                outline: "2px solid",
                                outlineColor: "error.main",
                                outlineOffset: "2px",
                              }
                            }}
                            onClick={() => setDeleteModuleId(module.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <BarChartIcon color="primary" />
            Statistiques de la formation
          </Typography>
        </Box>

        {loadingStats ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : !stats ? (
          <Alert 
            severity="info" 
            variant="outlined"
            icon={<InfoIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: "8px",
              p: 2,
              bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.02)",
              border: "1px dashed",
              borderColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Aucune statistique disponible
              </Typography>
            </Box>
            <Typography variant="body2">
              Les statistiques seront disponibles une fois que des utilisateurs auront commencé à suivre votre formation.
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Statistiques d'achat - affichées uniquement si la formation est payante */}
            {formation.is_paid && (
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    mb: 3, 
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    borderRadius: "12px",
                    boxShadow: isDarkMode 
                      ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
                      : "0 4px 20px rgba(0, 0, 0, 0.08)",
                    border: "1px solid",
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                    overflow: "hidden"
                  }}
                >
                  <Box 
                    sx={{
                      p: 2, 
                      borderBottom: "1px solid", 
                      borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                      bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isDarkMode
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(34, 197, 94, 0.1)",
                        color: "success.main",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        boxShadow: isDarkMode 
                          ? "0 2px 6px rgba(0, 0, 0, 0.2)" 
                          : "0 2px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <PaidIcon />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Achats et revenus
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            textAlign: "center", 
                            p: 2, 
                            borderRadius: "10px",
                            bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                            border: "1px solid",
                            borderColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}
                        >
                          <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                            {stats.purchases?.total_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <ShoppingCartIcon fontSize="small" />
                            Total des achats
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            textAlign: "center", 
                            p: 2, 
                            borderRadius: "10px",
                            bgcolor: isDarkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                            border: "1px solid",
                            borderColor: isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}
                        >
                          <Typography variant="h4" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
                            {stats.purchases?.completed_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <CheckCircleIcon fontSize="small" />
                            Achats complétés
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            textAlign: "center", 
                            p: 2, 
                            borderRadius: "10px",
                            bgcolor: isDarkMode ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.05)",
                            border: "1px solid",
                            borderColor: isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.1)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}
                        >
                          <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600, mb: 1 }}>
                            {stats.purchases?.pending_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <HourglassEmptyIcon fontSize="small" />
                            Achats en attente
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            textAlign: "center", 
                            p: 2, 
                            borderRadius: "10px",
                            bgcolor: isDarkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                            border: "1px solid",
                            borderColor: isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center"
                          }}
                        >
                          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: "success.main" }}>
                            {`$${parseFloat(
                              stats.purchases?.total_revenue || 0
                            ).toFixed(2)}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <MonetizationOnIcon fontSize="small" />
                            Revenus totaux
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Statistiques de progression */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: isDarkMode ? "#1f2937" : "#fff",
                  borderRadius: "12px",
                  boxShadow: isDarkMode 
                    ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
                    : "0 4px 20px rgba(0, 0, 0, 0.08)",
                  border: "1px solid",
                  borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  overflow: "hidden"
                }}
              >
                <Box 
                  sx={{
                    p: 2, 
                    borderBottom: "1px solid", 
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isDarkMode
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(59, 130, 246, 0.1)",
                      color: "primary.main",
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      boxShadow: isDarkMode 
                        ? "0 2px 6px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Progression des utilisateurs
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          textAlign: "center", 
                          p: 2, 
                          borderRadius: "10px",
                          bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                          border: "1px solid",
                          borderColor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center"
                        }}
                      >
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                          {stats.progress?.total_users || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <PeopleIcon fontSize="small" />
                          Utilisateurs inscrits
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          textAlign: "center", 
                          p: 2, 
                          borderRadius: "10px",
                          bgcolor: isDarkMode ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)",
                          border: "1px solid",
                          borderColor: isDarkMode ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.1)",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center"
                        }}
                      >
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
                          {stats.progress?.completed_users || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                          <CheckCircleIcon fontSize="small" />
                          Formations terminées
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Progression moyenne
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700} color="primary">
                        {Math.round(stats.progress?.average_progress || 0)}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: "100%",
                        bgcolor: isDarkMode
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                        borderRadius: 2,
                        height: 12,
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.round(
                            stats.progress?.average_progress || 0
                          )}%`,
                          bgcolor: "primary.main",
                          height: "100%",
                          borderRadius: 2,
                          transition: "width 1s ease-in-out",
                          boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)"
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Statistiques par module */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: isDarkMode ? "#1f2937" : "#fff",
                  borderRadius: "12px",
                  boxShadow: isDarkMode 
                    ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
                    : "0 4px 20px rgba(0, 0, 0, 0.08)",
                  border: "1px solid",
                  borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                  overflow: "hidden"
                }}
              >
                <Box 
                  sx={{
                    p: 2, 
                    borderBottom: "1px solid", 
                    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                    bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isDarkMode
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(245, 158, 11, 0.1)",
                      color: "warning.main",
                      borderRadius: "50%",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      boxShadow: isDarkMode 
                        ? "0 2px 6px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <TimelineIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Progression par module
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  {stats.modules && stats.modules.length > 0 ? (
                    <List sx={{ width: "100%", p: 0 }}>
                      {stats.modules.map((module, index) => (
                        <ListItem 
                          key={module.id} 
                          sx={{ 
                            px: 0, 
                            py: 2,
                            borderBottom: index < stats.modules.length - 1 ? "1px solid" : "none",
                            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: isDarkMode
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : "rgba(59, 130, 246, 0.05)",
                                color: "primary.main",
                                borderRadius: "50%",
                                width: 36,
                                height: 36,
                                flexShrink: 0,
                              }}
                            >
                              {getModuleIcon(module.type)}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {index + 1}. {module.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
                                    {module.completed_users || 0} / {module.total_users || 0} utilisateurs ont terminé
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                                    {Math.round(module.average_progress || 0)}%
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    width: "100%",
                                    bgcolor: isDarkMode
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)",
                                    borderRadius: 1,
                                    mt: 0.5,
                                    height: 8,
                                    overflow: "hidden"
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${Math.round(
                                        module.average_progress || 0
                                      )}%`,
                                      bgcolor: "primary.main",
                                      height: "100%",
                                      borderRadius: 1,
                                      transition: "width 0.8s ease-in-out",
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                      <InfoIcon color="disabled" sx={{ fontSize: 40, opacity: 0.7 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ fontWeight: 500 }}
                      >
                        Aucune donnée disponible pour les modules
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Dialogue de confirmation de suppression de module */}
      <Dialog
        open={!!deleteModuleId}
        onClose={() => setDeleteModuleId(null)}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#0a0f1a" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Êtes-vous sûr de vouloir supprimer ce module ? Cette action est
            irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModuleId(null)}>Annuler</Button>
          <Button onClick={handleDeleteModule} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de publication */}
      <Dialog
        open={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#0a0f1a" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Confirmer la publication</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Êtes-vous sûr de vouloir publier cette formation ? Une fois publiée,
            elle sera soumise à validation par un administrateur.
          </Typography>
          <Typography variant="body1">
            Vous ne pourrez plus modifier les informations de base ni
            ajouter/supprimer des modules.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishConfirmOpen(false)}>Annuler</Button>
          <Button
            onClick={handlePublishFormation}
            color="primary"
            variant="contained"
          >
            Publier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formulaire d'édition de la formation */}
      <Dialog
        open={editFormation}
        onClose={() => setEditFormation(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#0a0f1a" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: "12px",
            boxShadow: isDarkMode
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.5)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          },
        }}
        sx={{
          backdropFilter: "blur(8px)",
          "& .MuiBackdrop-root": {
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              pb: 1,
              borderBottom: 1,
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              background: isDarkMode
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(0, 0, 0, 0.02)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <EditIcon sx={{ mr: 1.5, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Modifier les informations de la formation
              </Typography>
            </Box>
            <IconButton
              onClick={() => setEditFormation(false)}
              size="small"
              sx={{
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
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: 3,
            bgcolor: isDarkMode
              ? "rgba(0, 0, 0, 0.1)"
              : "rgba(255, 255, 255, 0.8)",
          }}
        >
          {formationUpdateError && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                mb: 3,
                borderRadius: 2,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            >
              {typeof formationUpdateError === "object" ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {Object.entries(formationUpdateError).map(
                    ([field, messages]) => (
                      <li key={field}>{messages[0]}</li>
                    )
                  )}
                </ul>
              ) : (
                formationUpdateError
              )}
            </Alert>
          )}

          {formationUpdateSuccess && (
            <Alert
              severity="success"
              variant="filled"
              sx={{
                mb: 3,
                borderRadius: 2,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            >
              Les informations de la formation ont été mises à jour avec succès.
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3,
              borderRadius: 2,
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(0, 0, 0, 0.02)",
              border: "1px solid",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: "primary.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              <DescriptionIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
              Informations générales
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Titre de la formation"
                  name="title"
                  value={formationFormData.title}
                  onChange={handleFormationFormChange}
                  disabled={formationUpdateLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="category-label">Catégorie</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category-select"
                    name="category"
                    value={formationFormData.category || ""}
                    onChange={handleFormationFormChange}
                    label="Catégorie"
                    disabled={formationUpdateLoading}
                  >
                    <MenuItem value="Développement personnel">
                      Développement personnel
                    </MenuItem>
                    <MenuItem value="Compétences professionnelles">
                      Compétences professionnelles
                    </MenuItem>
                    <MenuItem value="Technologie & Informatique">
                      Technologie & Informatique
                    </MenuItem>
                    <MenuItem value="Langues">Langues</MenuItem>
                    <MenuItem value="Santé & Bien-être">
                      Santé & Bien-être
                    </MenuItem>
                    <MenuItem value="Arts & Créativité">
                      Arts & Créativité
                    </MenuItem>
                    <MenuItem value="Education financière">
                      Education financière
                    </MenuItem>
                    <MenuItem value="Soft skills">Soft skills</MenuItem>
                    <MenuItem value="Administration publique & gestion administrative">
                      Administration publique & gestion administrative
                    </MenuItem>
                    <MenuItem value="Suivi & Évaluation de projets">
                      Suivi & Évaluation de projets
                    </MenuItem>
                    <MenuItem value="Humanitaire">Humanitaire</MenuItem>
                    <MenuItem value="Gestion financière & budgétaire">
                      Gestion financière & budgétaire
                    </MenuItem>
                    <MenuItem value="Gestion documentaire & archivage">
                      Gestion documentaire & archivage
                    </MenuItem>
                    <MenuItem value="Planification stratégique">
                      Planification stratégique
                    </MenuItem>
                    <MenuItem value="Éthique & gouvernance">
                      Éthique & gouvernance
                    </MenuItem>
                    <MenuItem value="Analyse des politiques publiques">
                      Analyse des politiques publiques
                    </MenuItem>
                    <MenuItem value="Gestion des risques & conformité">
                      Gestion des risques & conformité
                    </MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                  </Select>
                  <FormHelperText>
                    Choisissez la catégorie de votre formation
                  </FormHelperText>
                </FormControl>

                {formationFormData.category === "Autre" && (
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Précisez la catégorie"
                    name="customCategory"
                    value={formationFormData.customCategory || ""}
                    onChange={handleFormationFormChange}
                    disabled={formationUpdateLoading}
                    required
                    helperText="Veuillez saisir votre catégorie personnalisée"
                  />
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                  name="description"
                  value={formationFormData.description}
                  onChange={handleFormationFormChange}
                  multiline
                  rows={4}
                  disabled={formationUpdateLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Photo de couverture
                </Typography>

                {thumbnailPreview ? (
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <img
                      src={thumbnailPreview}
                      alt="Aperçu de la couverture"
                      style={{
                        width: "auto",
                        maxWidth: "100%",
                        maxHeight: "200px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        display: "block",
                        margin: "0 auto",
                      }}
                    />
                    <IconButton
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(0,0,0,0.5)",
                        color: "white",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.7)",
                        },
                      }}
                      onClick={handleRemoveThumbnail}
                      disabled={formationUpdateLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed",
                      borderColor: "divider",
                      borderRadius: "8px",
                      p: 3,
                      textAlign: "center",
                      mb: 2,
                      cursor: "pointer",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: isDarkMode
                          ? "rgba(59, 130, 246, 0.1)"
                          : "rgba(59, 130, 246, 0.05)",
                      },
                    }}
                    onClick={() =>
                      document.getElementById("thumbnail-upload").click()
                    }
                  >
                    <input
                      type="file"
                      id="thumbnail-upload"
                      name="thumbnail"
                      accept="image/*"
                      onChange={handleFormationFormChange}
                      style={{ display: "none" }}
                      disabled={formationUpdateLoading}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Cliquez pour ajouter une photo de couverture
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Type de formation"
                  name="is_paid"
                  value={formationFormData.is_paid}
                  onChange={handleFormationFormChange}
                  disabled={formationUpdateLoading}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="false">Gratuite</option>
                  <option value="true">Payante</option>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prix ($)"
                  name="price"
                  type="number"
                  value={formationFormData.price}
                  onChange={handleFormationFormChange}
                  disabled={
                    formationUpdateLoading ||
                    formationFormData.is_paid !== "true"
                  }
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditFormation(false)}
            disabled={formationUpdateLoading}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateFormation}
            disabled={
              formationUpdateLoading ||
              !formationFormData.title ||
              !formationFormData.description ||
              !formationFormData.category ||
              (formationFormData.category === "Autre" &&
                !formationFormData.customCategory) ||
              (formationFormData.is_paid === "true" && !formationFormData.price)
            }
            startIcon={
              formationUpdateLoading ? (
                <CircularProgress size={20} />
              ) : (
                <SaveIcon />
              )
            }
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formulaire d'ajout/édition de module */}
      <Dialog
        open={addModule || !!editModule}
        onClose={() => {
          setAddModule(false);
          setEditModule(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#0a0f1a" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: "12px",
            boxShadow: isDarkMode
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.5)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          },
        }}
        sx={{
          backdropFilter: "blur(8px)",
          "& .MuiBackdrop-root": {
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              pb: 1,
              borderBottom: 1,
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
              background: isDarkMode
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(0, 0, 0, 0.02)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {editModule ? (
                <EditIcon sx={{ mr: 1.5, color: "info.main" }} />
              ) : (
                <AddIcon sx={{ mr: 1.5, color: "primary.main" }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editModule ? "Modifier le module" : "Ajouter un nouveau module"}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setAddModule(false);
                setEditModule(null);
              }}
              size="small"
              sx={{
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
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent 
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: 3,
            bgcolor: isDarkMode
              ? "rgba(0, 0, 0, 0.1)"
              : "rgba(255, 255, 255, 0.8)",
          }}
        >
          <ModuleForm
            formationId={id}
            module={editModule}
            onSubmit={handleModuleSubmit}
            onCancel={() => {
              setAddModule(false);
              setEditModule(null);
            }}
            isAdmin={false}
          />
        </DialogContent>
      </Dialog>

      {/* Conteneur pour les notifications toast */}
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
    </Box>
  );
};

export default FormationEditor;
