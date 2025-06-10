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
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ModuleForm from "../../../pages/admin/components/ModuleForm";
import { getModalStyle } from "../../../styles/modalStyles";

// Composant TabPanel pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`formation-editor-tabpanel-${index}`}
      aria-labelledby={`formation-editor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
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
      setFormationFormData({
        title: response.data.data.title || "",
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
          onClick={() => navigate("/dashboard/formations")}
        >
          Retour aux formations
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
          mb: 3,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard/formations")}
        >
          Retour aux formations
        </Button>

        {formation.status === "draft" && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={() => setPublishConfirmOpen(true)}
            disabled={modules.length === 0}
          >
            Publier la formation
          </Button>
        )}
      </Box>

      <Card
        sx={{
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">{formation.title}</Typography>

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
            />
          </Box>

          {formation.status === "rejected" && formation.rejection_reason && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Raison du rejet:</Typography>
              <Typography variant="body2">
                {formation.rejection_reason}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                {formation.description}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Type:
                  </Typography>
                  <Typography variant="body2">
                    {formation.is_paid ? "Payante" : "Gratuite"}
                  </Typography>
                </Box>

                {formation.is_paid && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Prix:
                    </Typography>
                    <Typography variant="body2">{formation.price} $</Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Modules:
                  </Typography>
                  <Typography variant="body2">{modules.length}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Créée le:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(formation.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                {formation.status === "draft" && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => setEditFormation(true)}
                      fullWidth
                    >
                      Modifier les informations
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Modules" />
        <Tab label="Statistiques" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Modules de la formation</Typography>

          {(formation.status === "draft" ||
            formation.status === "published") && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddModule(true)}
            >
              Ajouter un module
            </Button>
          )}
        </Box>

        {modules.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun module n'a encore été ajouté à cette formation. Utilisez le
            bouton "Ajouter un module" pour commencer.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {modules.map((module, index) => (
              <Grid item xs={12} md={4} key={module.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    position: "relative",
                    "&:hover": {
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 7 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Box
                        sx={{
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isDarkMode
                            ? "rgba(59, 130, 246, 0.1)"
                            : "primary.50",
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                        }}
                      >
                        {getModuleIcon(module.type)}
                      </Box>
                      <Typography variant="h6" component="h3" noWrap>
                        {index + 1}. {module.title}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Chip
                        size="small"
                        label={
                          module.type.charAt(0).toUpperCase() +
                          module.type.slice(1)
                        }
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {module.description}
                    </Typography>
                  </CardContent>

                  {formation.status === "draft" && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1,
                        borderTop: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        justifyContent: "space-between",
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
                            sx={{
                              borderRadius: "4px 0 0 4px",
                              opacity: index === 0 ? 0.5 : 1,
                              minWidth: "28px",
                              height: "28px",
                              padding: 0,
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
                            sx={{
                              borderRadius: "0 4px 4px 0",
                              opacity: index === modules.length - 1 ? 0.5 : 1,
                              minWidth: "28px",
                              height: "28px",
                              padding: 0,
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
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            color="info"
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(14, 165, 233, 0.15)"
                                : "info.50",
                              "&:hover": {
                                bgcolor: isDarkMode
                                  ? "rgba(14, 165, 233, 0.25)"
                                  : "info.100",
                              },
                              width: "28px",
                              height: "28px",
                            }}
                            onClick={() => setEditModule(module)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            color="error"
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(244, 63, 94, 0.15)"
                                : "error.50",
                              "&:hover": {
                                bgcolor: isDarkMode
                                  ? "rgba(244, 63, 94, 0.25)"
                                  : "error.100",
                              },
                              width: "28px",
                              height: "28px",
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
        <Typography variant="h6" gutterBottom>
          Statistiques de la formation
        </Typography>

        {loadingStats ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : !stats ? (
          <Alert severity="info">
            Aucune statistique disponible pour le moment.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Statistiques d'achat - affichées uniquement si la formation est payante */}
            {formation.is_paid && (
              <Grid item xs={12}>
                <Card sx={{ mb: 3, bgcolor: isDarkMode ? "#1f2937" : "#fff" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Achats
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="primary">
                            {stats.purchases?.total_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total des achats
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="success.main">
                            {stats.purchases?.completed_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Achats complétés
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="warning.main">
                            {stats.purchases?.pending_purchases || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Achats en attente
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="primary">
                            {`$${parseFloat(
                              stats.purchases?.total_revenue || 0
                            ).toFixed(2)}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Revenus totaux
                          </Typography>
                        </Box>
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
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progression des utilisateurs
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="primary">
                            {stats.progress?.total_users || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Utilisateurs inscrits
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          <Typography variant="h4" color="success.main">
                            {stats.progress?.completed_users || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Formations terminées
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, mb: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        Progression moyenne:{" "}
                        {Math.round(stats.progress?.average_progress || 0)}%
                      </Typography>
                      <Box
                        sx={{
                          width: "100%",
                          bgcolor: isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)",
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.round(
                              stats.progress?.average_progress || 0
                            )}%`,
                            bgcolor: "primary.main",
                            height: 10,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
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
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progression par module
                  </Typography>
                  {stats.modules && stats.modules.length > 0 ? (
                    <List sx={{ width: "100%" }}>
                      {stats.modules.map((module) => (
                        <ListItem key={module.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {getModuleIcon(module.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={module.title}
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                  {module.completed_users || 0} /{" "}
                                  {module.total_users || 0} utilisateurs ont
                                  terminé
                                </Typography>
                                <Box
                                  sx={{
                                    width: "100%",
                                    bgcolor: isDarkMode
                                      ? "rgba(255,255,255,0.1)"
                                      : "rgba(0,0,0,0.1)",
                                    borderRadius: 1,
                                    mt: 0.5,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${Math.round(
                                        module.average_progress || 0
                                      )}%`,
                                      bgcolor: "primary.main",
                                      height: 6,
                                      borderRadius: 1,
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
                    <Box sx={{ py: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
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
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Modifier les informations de la formation
            </Typography>
            <IconButton onClick={() => setEditFormation(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {formationUpdateError && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
            <Alert severity="success" sx={{ mb: 3 }}>
              Les informations de la formation ont été mises à jour avec succès.
            </Alert>
          )}

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
                  formationUpdateLoading || formationFormData.is_paid !== "true"
                }
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
          </Grid>
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
          },
        }}
        sx={{
          backdropFilter: "blur(5px)",
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {editModule ? "Modifier le module" : "Ajouter un nouveau module"}
            </Typography>
            <IconButton
              onClick={() => {
                setAddModule(false);
                setEditModule(null);
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
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
