import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  ListItemText,
  OutlinedInput,
  Chip,
  Avatar,
  Fade,
  Zoom,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import Notification from "../../../components/Notification";

const FormationForm = ({ formation, onSubmit, onCancel }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    customCategory: "",
    description: "",
    thumbnail: null,
    packs: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [availablePacks, setAvailablePacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Charger les données de la formation si en mode édition
  useEffect(() => {
    if (formation) {
      // Vérifier si la catégorie correspond à une des options prédéfinies
      const predefinedCategories = [
        "Développement personnel",
        "Compétences professionnelles",
        "Technologie & Informatique",
        "Langues",
        "Santé & Bien-être",
        "Arts & Créativité ",
        "Education financière",
        "Soft skills",
        "Administration publique & gestion administrative",
        "Suivi & Évaluation de projets",
        "Humanitaire",
        "Gestion financière & budgétaire",
        "Gestion documentaire & archivage",
        "Planification stratégiqu",
        "Éthique & gouvernance ",
        "Analyse des politiques publiques",
        "Gestion des risques & conformité",
      ];

      const isCustomCategory =
        formation.category &&
        !predefinedCategories.includes(formation.category);

      setFormData({
        title: formation.title || "",
        category: isCustomCategory ? "Autre" : formation.category || "",
        customCategory: isCustomCategory ? formation.category : "",
        description: formation.description || "",
        thumbnail: null, // On ne charge pas l'image existante pour l'édition
        packs: formation.packs?.map((pack) => pack.id) || [],
      });

      if (formation.thumbnail) {
        setThumbnailPreview(formation.thumbnail);
      }
    }
  }, [formation]);

  // Charger la liste des packs disponibles
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await axios.get("/api/admin/formations/packs");
        setAvailablePacks(response.data.data);
      } catch (err) {
        Notification.error("Erreur lors de la récupération des packs");
        setError(
          "Impossible de charger la liste des packs. Veuillez réessayer plus tard."
        );
      }
    };

    fetchPacks();
  }, []);

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  // Gérer le changement de sélection des packs
  const handlePacksChange = (event) => {
    const {
      target: { value },
    } = event;

    setFormData((prev) => ({
      ...prev,
      packs: typeof value === "string" ? value.split(",") : value,
    }));
  };

  // Gérer le changement d'image
  const handleThumbnailChange = (e) => {
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

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation de la catégorie personnalisée
    if (formData.category === "Autre" && !formData.customCategory.trim()) {
      setError("Veuillez préciser votre catégorie personnalisée.");
      return;
    }

    // Validation du titre et de la description
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.category
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    formData.type = "admin";

    if (formData.packs.length === 0) {
      setError("Veuillez sélectionner au moins un pack pour cette formation.");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);

      // Si la catégorie est "Autre", utiliser la catégorie personnalisée
      if (
        formData.category === "Autre" &&
        formData.customCategory.trim() !== ""
      ) {
        formDataToSend.append("category", formData.customCategory.trim());
      } else {
        formDataToSend.append("category", formData.category);
      }

      formDataToSend.append("description", formData.description);

      if (formData.thumbnail) {
        formDataToSend.append("thumbnail", formData.thumbnail);
      }

      // Ajouter les packs sélectionnés
      formData.packs.forEach((packId) => {
        formDataToSend.append("packs[]", packId);
      });

      let response;

      if (formation) {
        // Mode édition
        response = await axios.post(
          `/api/admin/formations/${formation.id}?_method=PUT`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          Notification.success("Formation mise à jour avec succès");
        } else {
          Notification.error("Erreur lors de la mise à jour de la formation");
        }
      } else {
        // Mode création
        response = await axios.post("/api/admin/formations", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          Notification.success("Formation créée avec succès");
        } else {
          Notification.error("Erreur lors de la création de la formation");
        }
      }

      setSuccess(true);

      // Notifier le parent que la soumission est réussie
      if (onSubmit) {
        onSubmit(response.data.data);
      }
    } catch (err) {
      Notification.error("Erreur lors de la soumission du formulaire");
      setError(
        err.response?.data?.errors ||
          "Une erreur est survenue lors de la soumission du formulaire."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        p: { xs: 2, sm: 4 },
        border: "1px solid",
        borderColor: isDarkMode
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.08)",
        boxShadow: isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
    >
      {error && (
        <Fade in timeout={400}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(254, 226, 226, 0.8) 0%, rgba(254, 202, 202, 0.5) 100%)",
              border: "1px solid",
              borderColor: isDarkMode
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(239, 68, 68, 0.2)",
              "& .MuiAlert-icon": {
                color: isDarkMode ? "#f87171" : "#dc2626",
              },
              "& .MuiAlert-message": {
                color: isDarkMode ? "#fca5a5" : "#991b1b",
              },
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

      {success && (
        <Fade in timeout={600}>
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              background: isDarkMode
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.5) 100%)",
              border: "1px solid",
              borderColor: isDarkMode
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(34, 197, 94, 0.2)",
              "& .MuiAlert-icon": {
                color: isDarkMode ? "#34d399" : "#059669",
              },
              "& .MuiAlert-message": {
                color: isDarkMode ? "#6ee7b7" : "#047857",
              },
            }}
          >
            Formation {formation ? "modifiée" : "créée"} avec succès!
          </Alert>
        </Fade>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12}>
          <Fade in timeout={800}>
            <Box>
              <TextField
                required
                fullWidth
                label="Titre de la formation"
                name="title"
                value={formData.title}
                onChange={handleChange}
                size={isMobile ? "medium" : "large"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.2)",
                    },
                    "&.Mui-focused": {
                      borderColor: "primary.main",
                      boxShadow: `0 0 0 2px ${
                        isDarkMode
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(59, 130, 246, 0.1)"
                      }`,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontWeight: 500,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: isDarkMode ? "#e5e7eb" : "#1f2937",
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                }}
              />
            </Box>
          </Fade>
        </Grid>

        <Grid item xs={12}>
          <Fade in timeout={1000}>
            <Box>
              <FormControl fullWidth required>
                <InputLabel
                  id="category-select-label"
                  sx={{
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontWeight: 500,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                >
                  Catégorie
                </InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  size={isMobile ? "medium" : "large"}
                  input={
                    <OutlinedInput
                      label="Catégorie"
                      sx={{
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                        "&:hover": {
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(0, 0, 0, 0.2)",
                        },
                        "&.Mui-focused": {
                          borderColor: "primary.main",
                          boxShadow: `0 0 0 2px ${
                            isDarkMode
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(59, 130, 246, 0.1)"
                          }`,
                        },
                      }}
                    />
                  }
                  sx={{
                    "& .MuiSelect-select": {
                      color: isDarkMode ? "#e5e7eb" : "#1f2937",
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
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
                  <MenuItem value="Arts & Créativité ">
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
                  <MenuItem value="Planification stratégiqu">
                    Planification stratégique
                  </MenuItem>
                  <MenuItem value="Éthique & gouvernance ">
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
              </FormControl>

              {/* Champ de texte pour la catégorie personnalisée qui apparaît uniquement si "Autre" est sélectionné */}
              {formData.category === "Autre" && (
                <Fade in timeout={1200}>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Précisez la catégorie"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleChange}
                      required
                      helperText="Veuillez saisir votre catégorie personnalisée"
                      size={isMobile ? "medium" : "large"}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          background: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(255, 255, 255, 0.8)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid",
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.1)",
                          "&:hover": {
                            borderColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.2)"
                              : "rgba(0, 0, 0, 0.2)",
                          },
                          "&.Mui-focused": {
                            borderColor: "primary.main",
                            boxShadow: `0 0 0 2px ${
                              isDarkMode
                                ? "rgba(59, 130, 246, 0.2)"
                                : "rgba(59, 130, 246, 0.1)"
                            }`,
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                          fontWeight: 500,
                          "&.Mui-focused": {
                            color: "primary.main",
                          },
                        },
                        "& .MuiInputBase-input": {
                          color: isDarkMode ? "#e5e7eb" : "#1f2937",
                          fontSize: isMobile ? "0.875rem" : "1rem",
                        },
                        "& .MuiFormHelperText-root": {
                          color: isDarkMode ? "#9ca3af" : "#6b7280",
                        },
                      }}
                    />
                  </Box>
                </Fade>
              )}
            </Box>
          </Fade>
        </Grid>

        <Grid item xs={12}>
          <Fade in timeout={1400}>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                }}
              >
                Description *
              </Typography>
              <Box
                sx={{
                  "& .ql-toolbar": {
                    borderRadius: "8px 8px 0 0",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                    "& .ql-stroke": {
                      stroke: isDarkMode ? "#e5e7eb" : "#1f2937",
                    },
                    "& .ql-fill": {
                      fill: isDarkMode ? "#e5e7eb" : "#1f2937",
                    },
                    "& .ql-picker": {
                      color: isDarkMode ? "#e5e7eb" : "#1f2937",
                    },
                    "&:hover": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.2)",
                    },
                  },
                  "& .ql-container": {
                    borderRadius: "0 0 8px 8px",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                    borderTop: "none",
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(10px)",
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    minHeight: isMobile ? "80px" : "120px",
                    "& .ql-editor": {
                      color: isDarkMode ? "#e5e7eb" : "#1f2937",
                      lineHeight: 1.6,
                      "&.ql-blank::before": {
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                      },
                    },
                    "&:hover": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.2)",
                    },
                  },
                  "& .ql-container.ql-focus": {
                    borderColor: "primary.main",
                    boxShadow: `0 0 0 2px ${
                      isDarkMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.1)"
                    }`,
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
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
            </Box>
          </Fade>
        </Grid>

        <Grid item xs={12}>
          <Fade in timeout={1600}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  pb: 1.5,
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
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
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
                    🖼️
                  </Typography>
                </Avatar>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? "#fbbf24" : "#d97706",
                  }}
                >
                  Image de couverture
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  border: "2px dashed",
                  borderColor: isDarkMode
                    ? "rgba(245, 158, 11, 0.3)"
                    : "rgba(245, 158, 11, 0.2)",
                  p: { xs: 3, sm: 4 },
                  borderRadius: 2,
                  textAlign: "center",
                  mb: 2,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: isDarkMode
                      ? "rgba(245, 158, 11, 0.5)"
                      : "rgba(245, 158, 11, 0.4)",
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)"
                      : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)",
                  },
                }}
              >
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="thumbnail-upload"
                  type="file"
                  onChange={handleThumbnailChange}
                />
                <label htmlFor="thumbnail-upload">
                  <Button
                    variant="contained"
                    component="span"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      textTransform: "none",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      boxShadow: isDarkMode
                        ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                        : "0 4px 12px rgba(245, 158, 11, 0.2)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        background:
                          "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                        boxShadow: isDarkMode
                          ? "0 6px 20px rgba(245, 158, 11, 0.4)"
                          : "0 6px 20px rgba(245, 158, 11, 0.3)",
                      },
                    }}
                  >
                    Sélectionner une image
                  </Button>
                </label>

                {thumbnailPreview && (
                  <Zoom in timeout={800}>
                    <Box
                      sx={{
                        mt: 3,
                        display: "inline-block",
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: isDarkMode
                          ? "0 8px 24px rgba(0, 0, 0, 0.3)"
                          : "0 8px 24px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Aperçu"
                        style={{
                          maxWidth: "100%",
                          maxHeight: isMobile ? "150px" : "200px",
                          display: "block",
                        }}
                      />
                    </Box>
                  </Zoom>
                )}
              </Paper>
            </Box>
          </Fade>
        </Grid>

        <Grid item xs={12}>
          <Fade in timeout={2000}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  pb: 1.5,
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
                    📦
                  </Typography>
                </Avatar>
                <Typography
                  variant={isMobile ? "subtitle1" : "h6"}
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? "#a78bfa" : "#7c3aed",
                  }}
                >
                  Packs ayant accès
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel
                  id="packs-select-label"
                  sx={{
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontWeight: 500,
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                >
                  Packs ayant accès
                </InputLabel>
                <Select
                  labelId="packs-select-label"
                  id="packs-select"
                  multiple
                  value={formData.packs}
                  onChange={handlePacksChange}
                  size={isMobile ? "medium" : "large"}
                  input={
                    <OutlinedInput
                      label="Packs ayant accès"
                      sx={{
                        borderRadius: 2,
                        background: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                        "&:hover": {
                          borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(0, 0, 0, 0.2)",
                        },
                        "&.Mui-focused": {
                          borderColor: "primary.main",
                          boxShadow: `0 0 0 2px ${
                            isDarkMode
                              ? "rgba(139, 92, 246, 0.2)"
                              : "rgba(139, 92, 246, 0.1)"
                          }`,
                        },
                      }}
                    />
                  }
                  sx={{
                    "& .MuiSelect-select": {
                      color: isDarkMode ? "#e5e7eb" : "#1f2937",
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                  renderValue={(selected) => (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {selected.map((value) => {
                        const pack = availablePacks.find((p) => p.id === value);
                        return (
                          <Chip
                            key={value}
                            label={pack ? pack.name : value}
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
                              "& .MuiChip-deleteIcon": {
                                color: isDarkMode ? "#a78bfa" : "#8b5cf6",
                                "&:hover": {
                                  color: isDarkMode ? "#e9d5ff" : "#7c3aed",
                                },
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availablePacks.map((pack) => (
                    <MenuItem
                      key={pack.id}
                      value={pack.id}
                      sx={{
                        "&:hover": {
                          background: isDarkMode
                            ? "rgba(139, 92, 246, 0.1)"
                            : "rgba(139, 92, 246, 0.05)",
                        },
                        "&.Mui-selected": {
                          background: isDarkMode
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(139, 92, 246, 0.08)",
                        },
                      }}
                    >
                      <Checkbox
                        checked={formData.packs.indexOf(pack.id) > -1}
                        sx={{
                          color: isDarkMode ? "#a78bfa" : "#7c3aed",
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                      <ListItemText
                        primary={pack.name}
                        sx={{
                          "& .MuiListItemText-primary": {
                            color: isDarkMode ? "#e5e7eb" : "#1f2937",
                            fontWeight: 500,
                          },
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Fade>
        </Grid>
      </Grid>

      <Fade in timeout={1800}>
        <Box
          sx={{
            display: "flex",
            justifyContent: isMobile ? "stretch" : "flex-end",
            gap: 2,
            mt: { xs: 3, sm: 4 },
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={onCancel}
            disabled={loading}
            fullWidth={isMobile}
            size="large"
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
              color: isDarkMode ? "#e5e7eb" : "#475569",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.8)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-2px)",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.9)",
                borderColor: "error.main",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                  : "0 4px 12px rgba(239, 68, 68, 0.2)",
              },
              "&:disabled": {
                opacity: 0.6,
                cursor: "not-allowed",
              },
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth={isMobile}
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              background: loading
                ? isDarkMode
                  ? "rgba(156, 163, 175, 0.3)"
                  : "rgba(156, 163, 175, 0.5)"
                : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              boxShadow: loading
                ? "none"
                : isDarkMode
                ? "0 6px 20px rgba(59, 130, 246, 0.4)"
                : "0 6px 20px rgba(59, 130, 246, 0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: loading ? "none" : "translateY(-2px)",
                background: loading
                  ? isDarkMode
                    ? "rgba(156, 163, 175, 0.3)"
                    : "rgba(156, 163, 175, 0.5)"
                  : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                boxShadow: loading
                  ? "none"
                  : isDarkMode
                  ? "0 8px 28px rgba(59, 130, 246, 0.5)"
                  : "0 8px 28px rgba(59, 130, 246, 0.4)",
              },
              "&:disabled": {
                opacity: 0.6,
                cursor: "not-allowed",
                transform: "none",
                boxShadow: "none",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : formation ? (
              "Mettre à jour"
            ) : (
              "Créer"
            )}
          </Button>
        </Box>
      </Fade>
    </Box>
  );
};

export default FormationForm;
