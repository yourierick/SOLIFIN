import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  Fade,
  Zoom,
  useMediaQuery,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Quiz as QuizIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import ModuleForm from "./ModuleForm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getModalStyle } from "../../../styles/modalStyles";
import AdminModuleViewer from "./AdminModuleViewer";

// Composant TabPanel pour les onglets
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FormationDetail = ({ formationId, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();

  const [formation, setFormation] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [openModuleForm, setOpenModuleForm] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewingModule, setViewingModule] = useState(null);

  // Fonction pour récupérer les détails de la formation
  const fetchFormationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/admin/formations/${formationId}`);
      setFormation(response.data.data);
      setModules(response.data.data.modules || []);
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
    fetchFormationDetails();
  }, [formationId]);

  // Fonction pour ouvrir le formulaire d'ajout de module
  const handleAddModule = () => {
    setCurrentModule(null);
    setOpenModuleForm(true);
  };

  // Fonction pour ouvrir le formulaire d'édition de module
  const handleEditModule = (module) => {
    setCurrentModule(module);
    setOpenModuleForm(true);
  };

  // Fonction pour ouvrir la boîte de dialogue de suppression de module
  const handleDeleteClick = (module) => {
    setCurrentModule(module);
    setOpenDeleteDialog(true);
  };

  // Fonction pour ouvrir la boîte de dialogue de visualisation de module
  const handleViewModule = (module) => {
    setViewingModule(module);
    setOpenViewDialog(true);
  };

  // Fonction pour supprimer un module
  const handleDeleteModule = async () => {
    try {
      await axios.delete(
        `/api/admin/formations/${formationId}/modules/${currentModule.id}`
      );
      fetchFormationDetails();
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error("Erreur lors de la suppression du module:", err);
      setError(
        "Impossible de supprimer le module. Veuillez réessayer plus tard."
      );
    }
  };

  // Fonction pour gérer la soumission du formulaire de module
  const handleModuleFormSubmit = () => {
    fetchFormationDetails();
    setOpenModuleForm(false);
  };

  // Fonction pour réorganiser les modules
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Mettre à jour l'ordre localement
    setModules(items);

    // Envoyer les nouvelles positions au serveur
    try {
      await axios.post(`/api/admin/formations/${formationId}/modules/reorder`, {
        modules: items.map((module, index) => ({
          id: module.id,
          order: index + 1,
        })),
      });
    } catch (err) {
      console.error("Erreur lors de la réorganisation des modules:", err);
      // En cas d'erreur, recharger les modules pour rétablir l'ordre correct
      fetchFormationDetails();
    }
  };

  // Fonction pour afficher l'icône appropriée selon le type de module
  const getModuleIcon = (type) => {
    switch (type) {
      case "text":
        return <DescriptionIcon />;
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

  // Fonction pour afficher le statut avec la couleur appropriée
  const renderStatus = (status, asText = false) => {
    if (asText) {
      return status === "approved"
        ? "Approuvé"
        : status === "rejected"
        ? "Rejeté"
        : status === "pending"
        ? "En attente"
        : "Brouillon";
    }

    return (
      <Chip
        icon={status === "approved" ? <CheckCircleIcon /> : <CancelIcon />}
        label={renderStatus(status, true)}
        color={
          status === "approved"
            ? "success"
            : status === "rejected"
            ? "error"
            : status === "pending"
            ? "warning"
            : "default"
        }
        size="small"
      />
    );
  };

  // Fonction pour afficher le type avec la couleur appropriée
  const renderType = (type, asText = false) => {
    if (asText) {
      return type === "text"
        ? "Texte"
        : type === "video"
        ? "Vidéo"
        : type === "pdf"
        ? "PDF"
        : "Quiz";
    }

    return (
      <Chip
        icon={getModuleIcon(type)}
        label={renderType(type, true)}
        color={
          type === "quiz"
            ? "secondary"
            : type === "video"
            ? "primary"
            : "default"
        }
        size="small"
      />
    );
  };

  // Fonction pour afficher le contenu du module en fonction de son type
  const renderModuleContent = (module) => {
    if (!module) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucun module sélectionné.
        </Alert>
      );
    }

    try {
      return <AdminModuleViewer module={module} />;
    } catch (error) {
      console.error("Erreur lors du rendu du module:", error);
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Erreur lors de l'affichage du module.
        </Alert>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!formation) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Aucune information disponible pour cette formation.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant={isMobile ? "fullWidth" : "standard"}
        sx={{
          borderBottom: 1,
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))"
            : "linear-gradient(90deg, rgba(59, 130, 246, 0.03), rgba(139, 92, 246, 0.03))",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: isMobile ? "0.875rem" : "1rem",
            minHeight: isMobile ? 48 : 64,
            transition: "all 0.3s ease",
            "&:hover": {
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
            },
            "&.Mui-selected": {
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)"
                : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
            },
          },
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
            background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)",
          },
        }}
      >
        <Tab label="Informations générales" />
        <Tab label="Modules" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {formation.thumbnail && (
              <Zoom in timeout={500}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    mb: 2,
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                    boxShadow: isDarkMode
                      ? "0 8px 24px rgba(0, 0, 0, 0.3)"
                      : "0 8px 24px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: isDarkMode
                        ? "0 12px 32px rgba(0, 0, 0, 0.4)"
                        : "0 12px 32px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  <img
                    src={formation.thumbnail}
                    alt={formation.title}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </Paper>
              </Zoom>
            )}

            <Fade in timeout={700}>
              <Card
                elevation={0}
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.08)",
                  boxShadow: isDarkMode
                    ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                    : "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      pb: 2,
                      borderBottom: "1px solid",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                        mr: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        ℹ
                      </Typography>
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        background: isDarkMode
                          ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
                          : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Informations
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <PersonIcon
                        sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Formateur:
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formation.instructor?.name || "Non spécifié"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarIcon
                        sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Date de création:
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {new Date(formation.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CategoryIcon
                        sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Catégorie:
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formation.category?.name || "Non catégorisé"}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <AttachMoneyIcon
                        sx={{ mr: 1, color: "primary.main", fontSize: 20 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Prix:
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {formation.price > 0 ? `${formation.price} $` : "Gratuit"}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Statut:
                      </Typography>
                    </Box>
                    {renderStatus(formation.status)}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={8}>
            <Fade in timeout={800}>
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(34, 197, 94, 0.15)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    pb: 1.5,
                    borderBottom: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      mr: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "white",
                      }}
                    >
                      🎯
                    </Typography>
                  </Avatar>
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{
                      fontWeight: 600,
                      color: isDarkMode ? "#34d399" : "#059669",
                    }}
                  >
                    Déscription
                  </Typography>
                </Box>
                <div
                  dangerouslySetInnerHTML={{ __html: formation.description }}
                />
              </Paper>
            </Fade>

            {formation.tags && formation.tags.length > 0 && (
              <Fade in timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)"
                      : "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(139, 92, 246, 0.2)"
                      : "rgba(139, 92, 246, 0.15)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                      pb: 1.5,
                      borderBottom: "1px solid",
                      borderColor: isDarkMode
                        ? "rgba(139, 92, 246, 0.2)"
                        : "rgba(139, 92, 246, 0.15)",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                        mr: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "white",
                        }}
                      >
                        🏷️
                      </Typography>
                    </Avatar>
                    <Typography
                      variant={isMobile ? "subtitle1" : "h6"}
                      sx={{
                        fontWeight: 600,
                        color: isDarkMode ? "#a78bfa" : "#7c3aed",
                      }}
                    >
                      Tags
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {formation.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          background: isDarkMode
                            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)"
                            : "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)",
                          color: isDarkMode ? "#c4b5fd" : "#7c3aed",
                          borderColor: isDarkMode
                            ? "rgba(139, 92, 246, 0.3)"
                            : "rgba(139, 92, 246, 0.2)",
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Fade>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {formation &&
          user &&
          formation.creator &&
          formation.creator.id === user.id && (
            <Box
              sx={{
                mb: 3,
                display: "flex",
                justifyContent: isMobile ? "stretch" : "flex-end",
              }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddModule}
                fullWidth={isMobile}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: "none",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  boxShadow: isDarkMode
                    ? "0 6px 20px rgba(59, 130, 246, 0.4)"
                    : "0 6px 20px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    boxShadow: isDarkMode
                      ? "0 8px 28px rgba(59, 130, 246, 0.5)"
                      : "0 8px 28px rgba(59, 130, 246, 0.4)",
                  },
                }}
              >
                Ajouter un module
              </Button>
            </Box>
          )}

        {modules.length === 0 ? (
          <Alert severity="info">
            Aucun module n'a été ajouté à cette formation.
          </Alert>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="modules">
              {(provided) => (
                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <List {...provided.droppableProps} ref={provided.innerRef}>
                    {modules.map((module, index) => (
                      <Draggable
                        key={module.id.toString()}
                        draggableId={module.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            divider
                            sx={{
                              bgcolor: isDarkMode ? "#1f2937" : "#fff",
                              "&:hover": {
                                bgcolor: isDarkMode ? "#374151" : "#f9fafb",
                              },
                            }}
                          >
                            <ListItemIcon>
                              {getModuleIcon(module.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <Typography variant="subtitle1">
                                    {module.title}
                                  </Typography>
                                  <Box>
                                    <Tooltip title="Voir le contenu">
                                      <IconButton
                                        edge="end"
                                        onClick={() => handleViewModule(module)}
                                        color="primary"
                                      >
                                        <VisibilityIcon />
                                      </IconButton>
                                    </Tooltip>
                                    {formation &&
                                      user &&
                                      formation.creator &&
                                      formation.creator.id === user.id && (
                                        <>
                                          <Tooltip title="Modifier">
                                            <IconButton
                                              edge="end"
                                              onClick={() =>
                                                handleEditModule(module)
                                              }
                                              sx={{
                                                color: isDarkMode
                                                  ? "#60a5fa"
                                                  : "#3b82f6",
                                                "&:hover": {
                                                  background: isDarkMode
                                                    ? "rgba(96, 165, 250, 0.1)"
                                                    : "rgba(59, 130, 246, 0.1)",
                                                },
                                              }}
                                            >
                                              <EditIcon />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Supprimer">
                                            <IconButton
                                              edge="end"
                                              onClick={() =>
                                                handleDeleteClick(module)
                                              }
                                              color="error"
                                              sx={{
                                                "&:hover": {
                                                  background: isDarkMode
                                                    ? "rgba(239, 68, 68, 0.1)"
                                                    : "rgba(239, 68, 68, 0.1)",
                                                },
                                              }}
                                            >
                                              <DeleteIcon />
                                            </IconButton>
                                          </Tooltip>
                                        </>
                                      )}
                                  </Box>
                                </Box>
                              }
                              secondaryTypographyProps={{
                                component: "div",
                                variant: "body2",
                                color: "text.secondary",
                              }}
                              secondary={
                                <>
                                  <div style={{ marginTop: "4px" }}>
                                    {module.description}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      marginTop: "8px",
                                    }}
                                  >
                                    <Chip
                                      label={`Type: ${module.type}`}
                                      size="small"
                                      sx={{ mr: 1 }}
                                    />
                                    {module.duration && (
                                      <Chip
                                        label={`Durée: ${module.duration} min`}
                                        size="small"
                                      />
                                    )}
                                  </div>
                                </>
                              }
                            />
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                </Paper>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </TabPanel>

      {/* Boîte de dialogue de formulaire de module */}
      <Dialog
        open={openModuleForm}
        onClose={() => setOpenModuleForm(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
        sx={getModalStyle(isDarkMode).sx}
      >
        <DialogTitle>
          {currentModule ? "Modifier le module" : "Ajouter un module"}
        </DialogTitle>
        <DialogContent>
          <ModuleForm
            formationId={formationId}
            module={currentModule}
            onSubmit={handleModuleFormSubmit}
            onCancel={() => setOpenModuleForm(false)}
            isAdmin={true}
          />
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de suppression de module */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={getModalStyle(isDarkMode).paperProps}
        sx={getModalStyle(isDarkMode).sx}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le module "{currentModule?.title}
            " ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteModule} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de visualisation du contenu du module */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            borderRadius: 3,
            border: "1px solid",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            boxShadow: isDarkMode
              ? "0 20px 60px rgba(0, 0, 0, 0.5)"
              : "0 20px 60px rgba(0, 0, 0, 0.15)",
            minHeight: "70vh",
            overflow: "hidden",
          },
        }}
        sx={getModalStyle(isDarkMode).sx}
      >
        <DialogTitle
          sx={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
            borderBottom: "1px solid",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            p: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                fontWeight: 700,
                background: isDarkMode
                  ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)"
                  : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                flex: 1,
                minWidth: 200,
              }}
            >
              {viewingModule?.title}
            </Typography>
            <Chip
              icon={getModuleIcon(viewingModule?.type)}
              label={
                viewingModule?.type === "text"
                  ? "Texte"
                  : viewingModule?.type === "video"
                  ? "Vidéo"
                  : viewingModule?.type === "pdf"
                  ? "PDF"
                  : "Quiz"
              }
              size="medium"
              sx={{
                fontWeight: 600,
                background:
                  viewingModule?.type === "text"
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)"
                    : viewingModule?.type === "video"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)"
                    : viewingModule?.type === "pdf"
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)",
                color:
                  viewingModule?.type === "text"
                    ? isDarkMode
                      ? "#60a5fa"
                      : "#3b82f6"
                    : viewingModule?.type === "video"
                    ? isDarkMode
                      ? "#f87171"
                      : "#dc2626"
                    : viewingModule?.type === "pdf"
                    ? isDarkMode
                      ? "#fbbf24"
                      : "#d97706"
                    : isDarkMode
                    ? "#a78bfa"
                    : "#7c3aed",
                border: "1px solid",
                borderColor:
                  viewingModule?.type === "text"
                    ? isDarkMode
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(59, 130, 246, 0.2)"
                    : viewingModule?.type === "video"
                    ? isDarkMode
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(239, 68, 68, 0.2)"
                    : viewingModule?.type === "pdf"
                    ? isDarkMode
                      ? "rgba(245, 158, 11, 0.3)"
                      : "rgba(245, 158, 11, 0.2)"
                    : isDarkMode
                    ? "rgba(139, 92, 246, 0.3)"
                    : "rgba(139, 92, 246, 0.2)",
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: { xs: 2, sm: 3 },
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(17, 24, 39, 0.5) 0%, rgba(31, 41, 55, 0.3) 100%)"
              : "linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)",
            borderBottom: "1px solid",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            "& .ql-editor": {
              background: "transparent !important",
              color: isDarkMode ? "#e2e8f0" : "#1f2937",
              fontSize: "1rem",
              lineHeight: 1.7,
              padding: "0 !important",
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                color: isDarkMode ? "#f1f5f9" : "#111827",
                fontWeight: 600,
                mt: 2,
                mb: 1,
              },
              "& h1": { fontSize: "2rem" },
              "& h2": { fontSize: "1.75rem" },
              "& h3": { fontSize: "1.5rem" },
              "& h4": { fontSize: "1.25rem" },
              "& h5": { fontSize: "1.125rem" },
              "& h6": { fontSize: "1rem" },
              "& p": {
                mb: 1.5,
                textAlign: "justify",
              },
              "& ul, & ol": {
                pl: 3,
                mb: 1.5,
              },
              "& li": {
                mb: 0.5,
              },
              "& blockquote": {
                borderLeft: `4px solid ${isDarkMode ? "#3b82f6" : "#2563eb"}`,
                pl: 2,
                py: 1,
                my: 2,
                background: isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(37, 99, 235, 0.05)",
                borderRadius: 1,
                fontStyle: "italic",
              },
              "& a": {
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
                textDecoration: "underline",
                "&:hover": {
                  color: isDarkMode ? "#93c5fd" : "#2563eb",
                },
              },
              "& strong, & b": {
                color: isDarkMode ? "#f1f5f9" : "#111827",
                fontWeight: 700,
              },
              "& em, & i": {
                fontStyle: "italic",
              },
              "& code": {
                background: isDarkMode
                  ? "rgba(139, 92, 246, 0.2)"
                  : "rgba(139, 92, 246, 0.1)",
                color: isDarkMode ? "#a78bfa" : "#7c3aed",
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                fontFamily: "monospace",
                fontSize: "0.875rem",
              },
              "& pre": {
                background: isDarkMode
                  ? "rgba(17, 24, 39, 0.8)"
                  : "rgba(248, 250, 252, 0.8)",
                border: "1px solid",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
                borderRadius: 1,
                p: 2,
                overflow: "auto",
                mb: 2,
                "& code": {
                  background: "transparent",
                  p: 0,
                },
              },
            },
          }}
        >
          {viewingModule ? (
            renderModuleContent(viewingModule)
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Aucun module sélectionné.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(31, 41, 55, 0.5) 0%, rgba(17, 24, 39, 0.3) 100%)"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 250, 252, 0.3) 100%)",
            p: { xs: 2, sm: 3 },
            borderTop: "1px solid",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <Button
            onClick={() => setOpenViewDialog(false)}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
              color: isDarkMode ? "#e2e8f0" : "#475569",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.8)",
              "&:hover": {
                transform: "translateY(-1px)",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.9)",
                borderColor: "primary.main",
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
    </Box>
  );
};

export default FormationDetail;
