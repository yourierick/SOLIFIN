import React, { useState, useEffect } from "react";
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
  const prevQuizContentRef = React.useRef('');
  
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
        bgcolor: isDarkMode ? "#1f2937" : "#fff",
        background: isDarkMode ? "#1f2937" : "#fff",
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Module {module ? "modifié" : "créé"} avec succès!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Titre du module"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
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
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Durée estimée (en minutes)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 1 } }}
            helperText="Durée estimée pour compléter ce module"
          />
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
          <Grid item xs={12}>
            <TextField
              required={formData.type === "text"}
              fullWidth
              label="Contenu du module"
              name="content"
              value={formData.content}
              onChange={handleChange}
              multiline
              rows={8}
              helperText="Contenu principal du module (texte, HTML, etc.)"
            />
          </Grid>
        )}
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        {onCancel && (
          <Button
            onClick={onCancel}
            sx={{ mr: 2 }}
            disabled={loading}
            variant="outlined"
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {module ? "Mettre à jour" : "Créer"}
        </Button>
      </Box>

      {/* Pas besoin de conteneur pour les notifications, le composant Notification gère cela automatiquement */}
    </Box>
  );
};

export default ModuleForm;
