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
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { getModalStyle } from "../../../styles/modalStyles";

const CreateFormationModal = ({ open, onClose, onFormationCreated }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

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

  // Validation du formulaire
  const validateForm = () => {
    // Vérifier que les champs requis sont remplis
    if (!formData.title || !formData.description || !formData.category) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return false;
    }

    // Vérifier que la catégorie personnalisée est remplie si "Autre" est sélectionné
    if (formData.category === "Autre" && !formData.customCategory.trim()) {
      setError("Veuillez préciser votre catégorie personnalisée.");
      return false;
    }

    // Vérifier que le prix est rempli si la formation est payante
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
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Notifier le parent que la formation a été créée
      if (onFormationCreated) {
        onFormationCreated(response.data.data);
      }

      // Fermer le modal
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
          backgroundImage: isDarkMode ? "none" : "none",
          boxShadow: isDarkMode
            ? "0px 0px 10px rgba(0, 0, 0, 0.5)"
            : "0px 0px 10px rgba(0, 0, 0, 0.1)",
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
          <Typography variant="h6">Créer une nouvelle formation</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="category-label">Catégorie</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Catégorie"
                disabled={loading}
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
                <MenuItem value="Santé & Bien-être">Santé & Bien-être</MenuItem>
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
              <FormHelperText>
                Choisissez la catégorie de votre formation
              </FormHelperText>
            </FormControl>

            {/* Champ de texte pour la catégorie personnalisée qui apparaît uniquement si "Autre" est sélectionné */}
            {formData.category === "Autre" && (
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
              />
            )}
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
              rows={4}
              disabled={loading}
              helperText="Décrivez le contenu et les objectifs de votre formation"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="is-paid-label">Type de formation</InputLabel>
              <Select
                labelId="is-paid-label"
                id="is-paid-select"
                name="is_paid"
                value={formData.is_paid}
                onChange={handleChange}
                label="Type de formation"
                disabled={loading}
              >
                <MenuItem value="false">Gratuite</MenuItem>
                <MenuItem value="true">Payante</MenuItem>
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
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              helperText="Définissez le prix de votre formation (uniquement si payante)"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Image de couverture
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
                >
                  Sélectionner une image
                </Button>
              </label>

              {thumbnailPreview && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={thumbnailPreview}
                    alt="Aperçu"
                    style={{ maxWidth: "100%", maxHeight: "200px" }}
                  />
                </Box>
              )}
            </Box>
            <FormHelperText>
              L'image de couverture sera affichée sur la carte de votre
              formation (recommandé: 1280x720px)
            </FormHelperText>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Note:</strong> Votre formation sera soumise à validation
                par un administrateur avant d'être publiée. Vous pourrez ajouter
                des modules une fois la formation créée.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={
            loading ||
            !formData.title ||
            !formData.description ||
            (formData.is_paid === "true" && !formData.price)
          }
        >
          {loading ? <CircularProgress size={24} /> : "Créer la formation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFormationModal;
