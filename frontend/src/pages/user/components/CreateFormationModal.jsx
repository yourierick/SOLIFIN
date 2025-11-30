import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormHelperText,
  CircularProgress,
  Alert,
  IconButton,
  useMediaQuery,
  Paper,
  Avatar,
  Fade,
  Zoom,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { getModalStyle } from "../../../styles/modalStyles";

const CreateFormationModal = ({ open, onClose, onFormationCreated }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Étapes du stepper
  const steps = [
    "Informations de base",
    "Détails de la formation",
    "Image et finalisation",
  ];
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    customCategory: "",
    description: "",
    is_paid: false,
    price: "",
    thumbnail: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Réinitialiser le stepper lorsque le modal s'ouvre/ferme
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setError(null);
      setThumbnailPreview(null);
    }
  }, [open]);

  // Navigation entre étapes
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  // Validation de l'étape actuelle
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.title || !formData.category) {
          setError("Veuillez remplir le titre et la catégorie.");
          return false;
        }
        if (formData.category === "Autre" && !formData.customCategory.trim()) {
          setError("Veuillez préciser votre catégorie personnalisée.");
          return false;
        }
        break;
      case 1:
        if (!formData.description) {
          setError("Veuillez ajouter une description à votre formation.");
          return false;
        }
        if (
          formData.is_paid &&
          (!formData.price || parseFloat(formData.price) <= 0)
        ) {
          setError(
            "Veuillez indiquer un prix valide pour votre formation payante."
          );
          return false;
        }
        break;
      case 2:
        // L'étape 3 est la finalisation, pas de validation spécifique
        break;
      default:
        return false;
    }
    setError(null);
    return true;
  };

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Si le type de formation change à gratuit, réinitialiser le prix
    if (name === "is_paid" && value === "false") {
      setFormData((prev) => ({
        ...prev,
        price: "",
      }));
    }
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  // Gérer le changement d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        thumbnail: file,
      }));

      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation complète du formulaire (maintenue pour compatibilité)
  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.category) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return false;
    }

    if (formData.category === "Autre" && !formData.customCategory.trim()) {
      setError("Veuillez préciser votre catégorie personnalisée.");
      return false;
    }

    if (
      formData.is_paid &&
      (!formData.price || parseFloat(formData.price) <= 0)
    ) {
      setError(
        "Veuillez indiquer un prix valide pour votre formation payante."
      );
      return false;
    }

    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);

      if (
        formData.category === "Autre" &&
        formData.customCategory.trim() !== ""
      ) {
        formDataToSend.append("category", formData.customCategory.trim());
      } else {
        formDataToSend.append("category", formData.category);
      }

      formDataToSend.append("description", formData.description);
      formDataToSend.append("is_paid", formData.is_paid);

      if (formData.is_paid === "true" && formData.price) {
        formDataToSend.append("price", formData.price);
      }

      if (formData.thumbnail) {
        formDataToSend.append("thumbnail", formData.thumbnail);
      }

      const response = await axios.post(
        "/api/formations/create",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (onFormationCreated) {
        onFormationCreated(response.data.data);
      }

      onClose();
    } catch (err) {
      console.error("Erreur lors de la création de la formation:", err);
      setError(
        err.response?.data?.errors ||
          "Une erreur est survenue lors de la création de la formation."
      );
    } finally {
      setLoading(false);
    }
  };

  // Rendu du contenu de l'étape actuelle
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Fade in={true} timeout={300}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Informations de base
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Commençons par les informations essentielles de votre
                    formation
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Titre de la formation"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Ex: Introduction au développement web"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="category-label">
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CategoryIcon sx={{ mr: 1, fontSize: 16 }} />
                        Catégorie
                      </Box>
                    </InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      label="Catégorie"
                      disabled={loading}
                      sx={{ borderRadius: 2 }}
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

                  {formData.category === "Autre" && (
                    <Zoom in={true} timeout={200}>
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Précisez la catégorie"
                        name="customCategory"
                        value={formData.customCategory}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        helperText="Veuillez saisir votre catégorie personnalisée"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Zoom>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in={true} timeout={300}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar sx={{ bgcolor: "secondary.main", mr: 2 }}>
                  <DescriptionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Détails de la formation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Décrivez votre formation et définissez son accès
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 1,
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      Description *
                    </Typography>
                    <Box
                      sx={{
                        "& .ql-toolbar": {
                          borderRadius: "8px 8px 0 0",
                          border: "1px solid",
                          borderColor: "divider",
                          background: "background.paper",
                          "& .ql-stroke": {
                            stroke: "text.primary",
                          },
                          "& .ql-fill": {
                            fill: "text.primary",
                          },
                          "& .ql-picker": {
                            color: "text.primary",
                          },
                        },
                        "& .ql-container": {
                          borderRadius: "0 0 8px 8px",
                          border: "1px solid",
                          borderColor: "divider",
                          borderTop: "none",
                          background: "background.paper",
                          fontSize: "1rem",
                          minHeight: "120px",
                          "& .ql-editor": {
                            color: "text.primary",
                            "&.ql-blank::before": {
                              color: "text.secondary",
                            },
                          },
                        },
                        "& .ql-editor:focus": {
                          outline: "none",
                          border: "1px solid",
                          borderColor: "primary.main",
                          boxShadow: `0 0 0 2px ${alpha(
                            theme.palette.primary.main,
                            0.2
                          )}`,
                        },
                      }}
                    >
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(value) => handleDescriptionChange(value)}
                        placeholder="Décrivez en détail le contenu, les objectifs d'apprentissage, le public visé par votre formation, les prérequis, ..."
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            [{ color: [] }, { background: [] }],
                            ["link", "clean"],
                          ],
                        }}
                        formats={[
                          "header",
                          "bold",
                          "italic",
                          "underline",
                          "strike",
                          "list",
                          "bullet",
                          "color",
                          "background",
                          "link",
                        ]}
                      />
                    </Box>
                    <FormHelperText sx={{ mt: 1 }}>
                      Décrivez en détail le contenu, les objectifs
                      d'apprentissage, le public visé par votre formation, les
                      prérequis, ...
                    </FormHelperText>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="is-paid-label">
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <AttachMoneyIcon sx={{ mr: 1, fontSize: 16 }} />
                        Type de formation
                      </Box>
                    </InputLabel>
                    <Select
                      labelId="is-paid-label"
                      name="is_paid"
                      value={formData.is_paid}
                      onChange={handleChange}
                      label="Type de formation"
                      disabled={loading}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="false">
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CheckCircleIcon
                            sx={{ mr: 1, color: "success.main", fontSize: 16 }}
                          />
                          Gratuite
                        </Box>
                      </MenuItem>
                      <MenuItem value="true">
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AttachMoneyIcon
                            sx={{ mr: 1, color: "warning.main", fontSize: 16 }}
                          />
                          Payante
                        </Box>
                      </MenuItem>
                    </Select>
                    <FormHelperText>
                      Choisissez si votre formation sera gratuite ou payante
                    </FormHelperText>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prix ($)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    disabled={loading || formData.is_paid !== "true"}
                    InputProps={{
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: (
                        <AttachMoneyIcon
                          sx={{ color: "text.secondary", mr: 1 }}
                        />
                      ),
                    }}
                    helperText="Définissez le prix de votre formation"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in={true} timeout={300}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar sx={{ bgcolor: "info.main", mr: 2 }}>
                  <ImageIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Image et finalisation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ajoutez une image de couverture et finalisez votre formation
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={500}>
                    Image de couverture
                  </Typography>

                  <Paper
                    elevation={2}
                    sx={{
                      border: "2px dashed",
                      borderColor: isDarkMode
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(0,0,0,0.2)",
                      p: 3,
                      borderRadius: 3,
                      textAlign: "center",
                      mb: 2,
                      bgcolor: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="thumbnail-upload"
                      type="file"
                      onChange={handleImageChange}
                      disabled={loading}
                    />
                    <label htmlFor="thumbnail-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        disabled={loading}
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        {isMobile ? "Choisir" : "Sélectionner une image"}
                      </Button>
                    </label>

                    {thumbnailPreview ? (
                      <Zoom in={true} timeout={300}>
                        <Box sx={{ mt: 3 }}>
                          <Card
                            elevation={3}
                            sx={{ maxWidth: 300, mx: "auto", borderRadius: 2 }}
                          >
                            <CardMedia
                              component="img"
                              image={thumbnailPreview}
                              alt="Aperçu de l'image"
                              sx={{ height: 180, objectFit: "cover" }}
                            />
                          </Card>
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{ mt: 1, display: "block" }}
                          >
                            ✓ Image ajoutée avec succès
                          </Typography>
                        </Box>
                      </Zoom>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <ImageIcon
                          sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Aucune image sélectionnée
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                  <FormHelperText sx={{ ml: 1 }}>
                    Recommandé: 1280x720px (format 16:9)
                  </FormHelperText>
                </Grid>

                <Grid item xs={12}>
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      "& .MuiAlert-message": { fontSize: "0.875rem" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <InfoIcon sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          gutterBottom
                        >
                          Processus de validation
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Votre formation sera soumise à validation par un
                          administrateur avant d'être publiée. Vous pourrez
                          ajouter des modules une fois la formation créée.
                        </Typography>
                      </Box>
                    </Box>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          bgcolor: isDarkMode
            ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          backgroundImage: "none",
          borderRadius: fullScreen ? 0 : 4,
          boxShadow: isDarkMode
            ? "0px 20px 40px rgba(0, 0, 0, 0.5)"
            : "0px 20px 40px rgba(0, 0, 0, 0.1)",
          border: isDarkMode
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.05)",
        },
      }}
      sx={{
        backdropFilter: "blur(8px)",
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))"
            : "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))",
          borderBottom: `1px solid ${
            isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
          }`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{ bgcolor: "primary.main", mr: 2, width: 40, height: 40 }}
            >
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
                Créer une nouvelle formation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Étape {activeStep + 1} sur {steps.length}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
              "&:hover": {
                bgcolor: isDarkMode
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 2, pb: 1 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabels={!isMobile}
          orientation={isMobile ? "vertical" : "horizontal"}
          sx={{
            "& .MuiStepLabel-root .Mui-active .MuiStepIcon-text": {
              fill: "white",
              fontWeight: 600,
            },
            "& .MuiStepLabel-root .Mui-completed .MuiStepIcon-text": {
              fill: "white",
            },
          }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    fontWeight: activeStep === index ? 600 : 400,
                  },
                }}
              >
                {isMobile ? label.split(" ")[0] : label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent
        dividers
        sx={{
          p: 3,
          background: isDarkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(248, 250, 252, 0.5)",
          borderColor: isDarkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        {error && (
          <Fade in={!!error}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-message": { fontSize: "0.875rem" },
              }}
            >
              {typeof error === "object" ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {Object.entries(error).map(([field, messages]) => (
                    <li key={field}>{messages[0]}</li>
                  ))}
                </ul>
              ) : (
                error
              )}
            </Alert>
          </Fade>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          gap: 2,
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))"
            : "linear-gradient(90deg, rgba(59, 130, 246, 0.02), rgba(139, 92, 246, 0.02))",
          borderTop: `1px solid ${
            isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
          }`,
        }}
      >
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<ArrowBackIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              height: 48,
            }}
          >
            {isMobile ? "Retour" : "Précédent"}
          </Button>
        )}

        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            height: 48,
          }}
        >
          Annuler
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.title ||
              !formData.description ||
              !formData.category ||
              (formData.is_paid === "true" && !formData.price)
            }
            startIcon={
              loading ? <CircularProgress size={20} /> : <CheckCircleIcon />
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              height: 48,
              background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
              "&:hover": {
                background: "linear-gradient(45deg, #2563eb, #7c3aed)",
              },
              minWidth: 160,
            }}
          >
            {loading ? "Création..." : "Créer la formation"}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading}
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              height: 48,
              background: "linear-gradient(45deg, #3b82f6, #8b5cf6)",
              "&:hover": {
                background: "linear-gradient(45deg, #2563eb, #7c3aed)",
              },
              minWidth: 120,
            }}
          >
            {isMobile ? "Suite" : "Suivant"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateFormationModal;
