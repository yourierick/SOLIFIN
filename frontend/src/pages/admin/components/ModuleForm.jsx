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
  Typography,
  CircularProgress,
  Alert,
  FormHelperText,
  IconButton,
  Card,
  CardContent,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Avatar,
  Fade,
  Zoom,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import QuizEditor from "../../user/components/QuizEditor";
import Notification from "../../../components/Notification";

const ModuleForm = ({
  formationId,
  module,
  onSubmit,
  onCancel,
  isAdmin = false,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "text",
    video_url: "",
    file: null,
    duration: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  // Charger les données du module si en mode édition
  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || "",
        description: module.description || "",
        content: module.content || "",
        type: module.type || "text",
        video_url: module.video_url || "",
        file: null, // On ne charge pas le fichier existant pour l'édition
        duration: module.duration || "",
      });

      if (module.file_url) {
        setFilePreview(module.file_url);
      }
    }
  }, [module]);

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer les changements du contenu du quiz
  // Utiliser une référence pour éviter les mises à jour inutiles
  const prevQuizContentRef = React.useRef("");

  const handleQuizContentChange = (quizContent) => {
    // Ne mettre à jour que si le contenu a réellement changé
    if (quizContent !== prevQuizContentRef.current) {
      prevQuizContentRef.current = quizContent;
      setFormData((prev) => ({
        ...prev,
        content: quizContent,
      }));
    }
  };

  // Gérer le changement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file: file,
      }));

      // Créer un aperçu du fichier
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation de base
      if (!formData.title.trim() || !formData.description.trim()) {
        setError("Veuillez remplir tous les champs requis");
        Notification.error("Veuillez remplir tous les champs requis");
        setLoading(false);
        return;
      }

      if (formData.type === "video" && !formData.video_url) {
        setError("Veuillez fournir une URL de vidéo");
        Notification.error("Veuillez fournir une URL de vidéo");
        setLoading(false);
        return;
      }

      if (formData.type === "pdf" && !formData.file && !filePreview) {
        setError("Veuillez télécharger un fichier PDF");
        Notification.error("Veuillez télécharger un fichier PDF");
        setLoading(false);
        return;
      }

      if (formData.type === "quiz" && !formData.content) {
        setError("Veuillez créer au moins une question pour le quiz");
        Notification.error("Veuillez créer au moins une question pour le quiz");
        setLoading(false);
        return;
      }

      // Préparation des données
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);

      if (formData.duration) {
        formDataToSend.append("duration", formData.duration);
      }

      // Gestion spécifique du contenu selon le type
      if (formData.type === "text" || formData.type === "quiz") {
        // Ajouter le contenu uniquement pour les types text et quiz
        formDataToSend.append("content", formData.content || "");
      }
      // Pour les autres types, ne pas envoyer le champ content du tout

      // Ajouter l'URL de vidéo si le type est vidéo
      if (formData.type === "video") {
        formDataToSend.append("video_url", formData.video_url);
      }

      // Ajouter le fichier si le type est pdf et qu'un fichier est sélectionné
      if (formData.type === "pdf" && formData.file) {
        formDataToSend.append("file", formData.file);
      }

      // Déterminer le bon endpoint selon le contexte (admin ou utilisateur)
      const baseUrl = isAdmin
        ? `/api/admin/formations/${formationId}/modules`
        : `/api/formations/my/${formationId}/modules`;

      // Envoi des données
      let response;
      if (module) {
        // Mise à jour d'un module existant
        const updateUrl = isAdmin
          ? `${baseUrl}/${module.id}?_method=PUT`
          : `${baseUrl}/${module.id}?_method=PUT`;

        response = await axios.post(updateUrl, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Création d'un nouveau module
        response = await axios.post(baseUrl, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.success) {
        // D'abord, mettre à jour l'état de succès
        setSuccess(true);
        setError(null);

        // Réinitialiser le formulaire
        setFormData({
          title: "",
          description: "",
          content: "",
          type: "text",
          video_url: "",
          file: null,
          duration: "",
        });
        setFilePreview(null);

        // Ensuite, notifier le composant parent pour fermer le modal
        // Cela doit être fait avant d'afficher le toast pour éviter les conflits
        if (onSubmit && typeof onSubmit === "function") {
          // Utiliser un setTimeout pour s'assurer que la notification est affichée après la fermeture du modal
          setTimeout(() => {
            onSubmit(response.data.data);
            // Afficher la notification de succès après que le modal soit fermé
            Notification.success(
              module
                ? "Module mis à jour avec succès"
                : "Module créé avec succès"
            );
          }, 100);
        } else {
          // Si pas de callback onSubmit, afficher quand même la notification
          Notification.success(
            module ? "Module mis à jour avec succès" : "Module créé avec succès"
          );
        }
      } else {
        // En cas d'échec de la requête mais avec une réponse du serveur
        setSuccess(false);
        setError(response.data.message || "Une erreur est survenue");
        Notification.error(response.data.message || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Erreur lors de la soumission du module:", err);
      // Assurer qu'il n'y a pas de conflit avec un message de succès précédent
      setSuccess(false);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Une erreur est survenue lors de la création du module";

      // Afficher l'erreur
      Notification.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 2,
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        border: "1px solid",
        borderColor: isDarkMode
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.08)",
        boxShadow: isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)",
        p: { xs: 2, sm: 3 },
      }}
    >
      {error && (
        <Fade in={!!error} timeout={500}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
              border: "1px solid",
              borderColor: "rgba(239, 68, 68, 0.2)",
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
        <Fade in={!!success} timeout={500}>
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
              background:
                "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)",
              border: "1px solid",
              borderColor: "rgba(34, 197, 94, 0.2)",
            }}
          >
            Module {module ? "modifié" : "créé"} avec succès!
          </Alert>
        </Fade>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Zoom in timeout={300}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)",
                border: "1px solid",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                  : "0 4px 12px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: isDarkMode
                    ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                    : "0 8px 20px rgba(0, 0, 0, 0.12)",
                },
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
                    T
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
                  Informations générales
                </Typography>
              </Box>
              <TextField
                required
                fullWidth
                label="Titre du module"
                name="title"
                value={formData.title}
                onChange={handleChange}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                    },
                  },
                }}
              />
              <TextField
                required
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                    },
                  },
                }}
              />
            </Paper>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Zoom in timeout={400}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)",
                border: "1px solid",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                  : "0 4px 12px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: isDarkMode
                    ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                    : "0 8px 20px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
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
                    C
                  </Typography>
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    background: isDarkMode
                      ? "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)"
                      : "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Type de contenu
                </Typography>
              </Box>
              <FormControl fullWidth required>
                <InputLabel id="type-select-label">Type de contenu</InputLabel>
                <Select
                  labelId="type-select-label"
                  id="type-select"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Type de contenu"
                >
                  <MenuItem value="text">Texte</MenuItem>
                  <MenuItem value="video">Vidéo</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                </Select>
                <FormHelperText>
                  Sélectionnez le type de contenu pour ce module
                </FormHelperText>
              </FormControl>
            </Paper>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Zoom in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                background: isDarkMode
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)",
                border: "1px solid",
                borderColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.08)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                  : "0 4px 12px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: isDarkMode
                    ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                    : "0 8px 20px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background:
                      "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
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
                    D
                  </Typography>
                </Avatar>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    background: isDarkMode
                      ? "linear-gradient(135deg, #34d399 0%, #22d3ee 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Durée et configuration
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Durée estimée (en minutes)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 1 } }}
                helperText="Durée estimée pour compléter ce module"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(255, 255, 255, 0.8)",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                    },
                  },
                }}
              />
            </Paper>
          </Zoom>
        </Grid>

        {formData.type === "video" && (
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="URL de la vidéo"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              helperText="Entrez l'URL de la vidéo (YouTube, Vimeo, etc.)"
            />
          </Grid>
        )}

        {formData.type === "pdf" && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Fichier PDF
            </Typography>

            <Box
              sx={{
                border: "1px dashed grey",
                p: 2,
                borderRadius: 1,
                textAlign: "center",
                mb: 2,
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
              }}
            >
              <input
                accept=".pdf"
                style={{ display: "none" }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button variant="contained" component="span">
                  Sélectionner un fichier PDF
                </Button>
              </label>

              {filePreview && formData.type === "image" && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={filePreview}
                    alt="Aperçu"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                </Box>
              )}

              {(formData.file || filePreview) && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {formData.file
                      ? formData.file.name
                      : "Fichier déjà téléchargé"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        )}

        {formData.type === "quiz" ? (
          <Grid item xs={12}>
            <QuizEditor
              initialContent={formData.content}
              onChange={handleQuizContentChange}
              readOnly={loading}
            />
          </Grid>
        ) : (
          formData.type === "text" && (
            <Grid item xs={12}>
              <Fade in={formData.type === "text"} timeout={500}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
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
                        T
                      </Typography>
                    </Avatar>
                    Contenu du module
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                      overflow: "hidden",
                      background: isDarkMode
                        ? "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%)"
                        : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                      backdropFilter: "blur(10px)",
                      "& .ql-toolbar": {
                        background: isDarkMode
                          ? "rgba(31, 41, 55, 0.9)"
                          : "rgba(248, 250, 252, 0.9)",
                        border: "none",
                        borderBottom: "1px solid",
                        borderBottomColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.1)",
                        "& .ql-stroke": {
                          stroke: isDarkMode ? "#94a3b8" : "#475569",
                        },
                        "& .ql-fill": {
                          fill: isDarkMode ? "#94a3b8" : "#475569",
                        },
                        "& .ql-picker": {
                          color: isDarkMode ? "#94a3b8" : "#475569",
                        },
                      },
                      "& .ql-container": {
                        background: "transparent",
                        border: "none",
                        fontSize: "1rem",
                        "& .ql-editor": {
                          color: isDarkMode ? "#e2e8f0" : "#1e293b",
                          minHeight: "200px",
                          fontFamily: "inherit",
                          "&.ql-blank::before": {
                            color: isDarkMode ? "#64748b" : "#94a3b8",
                            fontStyle: "normal",
                          },
                        },
                      },
                      "& .ql-focus": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <ReactQuill
                      theme="snow"
                      value={formData.content || ""}
                      onChange={(value) =>
                        handleChange({ target: { name: "content", value } })
                      }
                      placeholder="Rédigez le contenu de votre module ici..."
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          ["bold", "italic", "underline", "strike"],
                          [{ color: [] }, { background: [] }],
                          [{ list: "ordered" }, { list: "bullet" }],
                          [{ indent: "-1" }, { indent: "+1" }],
                          [{ align: [] }],
                          ["link", "image", "video"],
                          ["clean"],
                        ],
                      }}
                      formats={[
                        "header",
                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "color",
                        "background",
                        "list",
                        "bullet",
                        "indent",
                        "align",
                        "link",
                        "image",
                        "video",
                      ]}
                      style={{ height: "250px" }}
                    />
                  </Paper>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: "text.secondary",
                      display: "block",
                    }}
                  >
                    Contenu principal du module (texte enrichi, images, vidéos,
                    etc.)
                  </Typography>
                </Box>
              </Fade>
            </Grid>
          )
        )}
      </Grid>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 4,
          gap: 2,
          pt: 3,
          borderTop: "1px solid",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
        }}
      >
        {onCancel && (
          <Button
            onClick={onCancel}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(0, 0, 0, 0.2)",
              color: isDarkMode ? "#e2e8f0" : "#475569",
              background: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-2px)",
                background: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.9)",
                borderColor: "primary.main",
                boxShadow: isDarkMode
                  ? "0 8px 20px rgba(0, 0, 0, 0.3)"
                  : "0 8px 20px rgba(0, 0, 0, 0.12)",
              },
              "&:active": {
                transform: "translateY(-1px)",
              },
            }}
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: "none",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            boxShadow: isDarkMode
              ? "0 6px 20px rgba(59, 130, 246, 0.4)"
              : "0 6px 20px rgba(59, 130, 246, 0.3)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              transform: "translateY(-2px)",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              boxShadow: isDarkMode
                ? "0 8px 28px rgba(59, 130, 246, 0.5)"
                : "0 8px 28px rgba(59, 130, 246, 0.4)",
            },
            "&:active": {
              transform: "translateY(-1px)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              transition: "left 0.5s",
            },
            "&:hover::before": {
              left: "100%",
            },
          }}
        >
          {module ? "Mettre à jour" : "Créer"}
        </Button>
      </Box>

      {/* Pas besoin de conteneur pour les notifications, le composant Notification gère cela automatiquement */}
    </Box>
  );
};

export default ModuleForm;
