import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  VideoLibrary as VideoIcon,
  PictureAsPdf as PdfIcon,
  Quiz as QuizIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import ModuleContent from "./ModuleContent";
import { getModalStyle } from "../../../styles/modalStyles";

// Composant TabPanel pour les onglets
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`module-tabpanel-${index}`}
      aria-labelledby={`module-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const FormationModal = ({ open, onClose, formationId }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [formation, setFormation] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleError, setModuleError] = useState(null);

  // Fonction pour récupérer les détails de la formation
  const fetchFormationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/formations/${formationId}`);
      setFormation(response.data.data);
      setModules(response.data.data.modules || []);

      // Sélectionner automatiquement le premier module non complété
      const firstIncompleteModule = response.data.data.modules?.find(
        (module) => !module.progress?.is_completed && module.is_accessible
      );

      if (firstIncompleteModule) {
        setSelectedModule(firstIncompleteModule);
      } else if (response.data.data.modules?.length > 0) {
        setSelectedModule(response.data.data.modules[0]);
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
    if (open && formationId) {
      fetchFormationDetails();
    }
  }, [open, formationId]);

  // Fonction pour récupérer les détails d'un module
  const fetchModuleDetails = async (moduleId) => {
    setModuleLoading(true);
    setModuleError(null);

    try {
      const response = await axios.get(
        `/api/formations/${formationId}/modules/${moduleId}`
      );
      setSelectedModule(response.data.data);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des détails du module:",
        err
      );
      setModuleError(
        "Impossible de charger les détails du module. Veuillez réessayer plus tard."
      );
    } finally {
      setModuleLoading(false);
    }
  };

  // Fonction pour marquer un module comme complété
  const handleCompleteModule = async () => {
    try {
      await axios.post(
        `/api/formations/${formationId}/modules/${selectedModule.id}/complete`
      );

      // Mettre à jour l'état local
      setSelectedModule((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          is_completed: true,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        },
      }));

      // Mettre à jour la liste des modules
      setModules((prev) =>
        prev.map((module) =>
          module.id === selectedModule.id
            ? {
                ...module,
                progress: {
                  ...module.progress,
                  is_completed: true,
                  progress_percentage: 100,
                  completed_at: new Date().toISOString(),
                },
              }
            : module
        )
      );

      // Mettre à jour la progression de la formation
      if (formation) {
        const completedModules = modules.filter(
          (m) => m.id === selectedModule.id || m.progress?.is_completed
        ).length;

        const progressPercentage = Math.round(
          (completedModules / modules.length) * 100
        );

        setFormation((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            progress_percentage: progressPercentage,
            is_completed: progressPercentage === 100,
            completed_at:
              progressPercentage === 100 ? new Date().toISOString() : null,
          },
        }));
      }
    } catch (err) {
      console.error("Erreur lors du marquage du module comme complété:", err);
      alert(
        "Impossible de marquer le module comme complété. Veuillez réessayer plus tard."
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

  // Fonction pour sélectionner un module
  const handleSelectModule = (module) => {
    setSelectedModule(module);
    fetchModuleDetails(module.id);
  };

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
            height: fullScreen ? "100%" : "auto",
            maxHeight: fullScreen ? "100%" : "90vh",
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
            <Typography variant="h6">Chargement de la formation...</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
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
            <Typography variant="h6">Erreur</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!formation) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          height: fullScreen ? "100%" : "90vh",
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
          <Typography variant="h6">{formation.title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container>
          {/* Sidebar avec la liste des modules */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{ borderRight: "1px solid", borderColor: "divider" }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Progression: {formation.progress?.progress_percentage || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={formation.progress?.progress_percentage || 0}
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                Modules
              </Typography>

              <List
                sx={{
                  maxHeight: { xs: "200px", md: "400px" },
                  overflow: "auto",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                    borderRadius: "10px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.2)",
                    borderRadius: "10px",
                  },
                }}
              >
                {modules.map((module, index) => (
                  <ListItem key={module.id} component="div" disablePadding>
                    <ListItemButton
                      onClick={() => handleSelectModule(module)}
                      selected={selectedModule?.id === module.id}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor:
                          selectedModule?.id === module.id
                            ? isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)"
                            : "transparent",
                        "&:hover": {
                          bgcolor:
                            selectedModule?.id === module.id
                              ? isDarkMode
                                ? "rgba(255, 255, 255, 0.15)"
                                : "rgba(0, 0, 0, 0.08)"
                              : isDarkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.03)",
                        },
                      }}
                    >
                      <ListItemIcon>
                        {module.progress?.is_completed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          getModuleIcon(module.type)
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${index + 1}. ${module.title}`}
                        primaryTypographyProps={{
                          noWrap: true,
                          style: {
                            fontWeight:
                              selectedModule?.id === module.id
                                ? "bold"
                                : "normal",
                          },
                        }}
                      />
                      {module.progress?.progress_percentage > 0 &&
                        module.progress?.progress_percentage < 100 && (
                          <ListItemSecondaryAction>
                            <Chip
                              label={`${module.progress.progress_percentage}%`}
                              size="small"
                              color="primary"
                            />
                          </ListItemSecondaryAction>
                        )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>

          {/* Contenu principal */}
          <Grid item xs={12} md={9}>
            {selectedModule ? (
              moduleLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : moduleError ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {moduleError}
                </Alert>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedModule.title}
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    <Chip
                      icon={getModuleIcon(selectedModule.type)}
                      label={`Type: ${selectedModule.type}`}
                      size="small"
                    />
                    {selectedModule.duration && (
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`Durée: ${selectedModule.duration} min`}
                        size="small"
                      />
                    )}
                    {selectedModule.progress?.is_completed && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Complété"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>

                  <Typography variant="body1" paragraph>
                    {selectedModule.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Contenu du module */}
                  <ModuleContent module={selectedModule} />

                  {/* Bouton pour marquer comme complété */}
                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCompleteModule}
                      disabled={selectedModule.progress?.is_completed}
                      startIcon={<CheckCircleIcon />}
                    >
                      {selectedModule.progress?.is_completed
                        ? "Module complété"
                        : "Marquer comme complété"}
                    </Button>
                  </Box>
                </Box>
              )
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  Sélectionnez un module pour commencer
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choisissez un module dans la liste à gauche pour commencer
                  votre apprentissage.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
export default FormationModal;
