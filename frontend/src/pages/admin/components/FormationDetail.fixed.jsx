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
import ModuleForm from "./ModuleForm";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
          type === "quiz" ? "secondary" : type === "video" ? "primary" : "default"
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

    return <AdminModuleViewer module={module} />;
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
        bgcolor: isDarkMode ? "#1f2937" : "#fff",
        background: isDarkMode ? "#1f2937" : "#fff",
      }}
    >
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Informations générales" />
        <Tab label="Modules" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {formation.thumbnail && (
              <img
                src={formation.thumbnail}
                alt={formation.title}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              />
            )}

            <Card
              sx={{
                mt: 2,
                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations
                </Typography>
                <Divider sx={{ mb: 2 }} />

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
                    {formation.price > 0
                      ? `${formation.price} €`
                      : "Gratuit"}
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
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {formation.title}
            </Typography>

            {formation.subtitle && (
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 2 }}
              >
                {formation.subtitle}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {formation.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Objectifs d'apprentissage
              </Typography>
              <div
                dangerouslySetInnerHTML={{
                  __html: formation.objectives || "<p>Non spécifié</p>",
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Prérequis
              </Typography>
              <div
                dangerouslySetInnerHTML={{
                  __html: formation.prerequisites || "<p>Aucun prérequis</p>",
                }}
              />
            </Box>

            {formation.tags && formation.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formation.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddModule}
          >
            Ajouter un module
          </Button>
        </Box>

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
                                    <Tooltip title="Modifier">
                                      <IconButton
                                        edge="end"
                                        onClick={() => handleEditModule(module)}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                      <IconButton
                                        edge="end"
                                        onClick={() => handleDeleteClick(module)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                  >
                                    {module.description}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mt: 1,
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
                                  </Box>
                                </Box>
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
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
            minHeight: "60vh",
          },
        }}
        sx={getModalStyle(isDarkMode).sx}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {viewingModule?.title}
            </Typography>
            <Chip
              icon={getModuleIcon(viewingModule?.type)}
              label={viewingModule?.type}
              size="small"
              color={
                viewingModule?.type === "quiz" ? "secondary" :
                viewingModule?.type === "video" ? "primary" :
                viewingModule?.type === "pdf" ? "error" : "default"
              }
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderModuleContent(viewingModule)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormationDetail;
