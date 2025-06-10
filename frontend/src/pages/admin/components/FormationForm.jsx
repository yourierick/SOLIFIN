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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import Notification from "../../../components/Notification";

const FormationForm = ({ formation, onSubmit, onCancel }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

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

    // Validation des packs pour les formations admin
    if (formation.type === "admin") {
      if (formData.packs.length === 0) {
        setError(
          "Veuillez sélectionner au moins un pack pour cette formation."
        );
        return;
      }
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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
          Formation {formation ? "modifiée" : "créée"} avec succès!
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
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel id="category-select-label">Catégorie</InputLabel>
            <Select
              labelId="category-select-label"
              id="category-select"
              name="category"
              value={formData.category}
              onChange={handleChange}
              input={<OutlinedInput label="Catégorie" />}
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
              <MenuItem value="Arts & Créativité ">Arts & Créativité</MenuItem>
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
            <TextField
              fullWidth
              margin="normal"
              label="Précisez la catégorie"
              name="customCategory"
              value={formData.customCategory}
              onChange={handleChange}
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
              onChange={handleThumbnailChange}
            />
            <label htmlFor="thumbnail-upload">
              <Button variant="contained" component="span">
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
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="packs-select-label">Packs ayant accès</InputLabel>
            <Select
              labelId="packs-select-label"
              id="packs-select"
              multiple
              value={formData.packs}
              onChange={handlePacksChange}
              input={<OutlinedInput label="Packs ayant accès" />}
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
                      <Chip key={value} label={pack ? pack.name : value} />
                    );
                  })}
                </Box>
              )}
            >
              {availablePacks.map((pack) => (
                <MenuItem key={pack.id} value={pack.id}>
                  <Checkbox checked={formData.packs.indexOf(pack.id) > -1} />
                  <ListItemText primary={pack.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }} disabled={loading}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : formation ? (
            "Mettre à jour"
          ) : (
            "Créer"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default FormationForm;
