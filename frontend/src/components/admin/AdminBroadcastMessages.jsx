import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useTheme } from "../../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import instance from "../../utils/axios";
import ConfirmationModal from "../ConfirmationModal";

/**
 * Composant pour la gestion des messages de diffusion administratifs
 *
 * Permet de créer, modifier, supprimer et prévisualiser les messages
 * qui seront affichés aux utilisateurs lors de leur connexion.
 */
const AdminBroadcastMessages = () => {
  const { isDarkMode } = useTheme();

  // États pour la liste des messages
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    views: 0,
  });

  // États pour le modal d'ajout/édition
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' ou 'edit'
  const [currentMessage, setCurrentMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false); // État pour le chargement lors de la soumission

  // États pour le modal de prévisualisation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState(null);

  // État pour le modal de confirmation de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false); // État pour le chargement lors de la suppression

  // Formulaire pour l'ajout/édition de message
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "text", // 'text', 'image', 'video'
    media_url: "",
    media_file: null, // Pour stocker le fichier sélectionné
    status: true, // true = actif, false = inactif
  });

  // Récupérer la liste des messages au chargement du composant
  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, []);

  // Créer une fonction de référence pour fetchMessages qui ne change pas à chaque rendu
  const fetchMessagesRef = useCallback(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await instance.get("/api/admin/broadcast-messages", {
          params: {
            page: page + 1, // MUI utilise un index 0, l'API utilise un index 1
            per_page: rowsPerPage,
          },
        });
        setMessages(response.data.data);
        setTotalItems(response.data.total);
      } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, rowsPerPage]);

  // Utiliser la référence pour fetchMessages
  const fetchMessages = fetchMessagesRef;

  // Récupérer les statistiques des messages
  const fetchStats = async () => {
    try {
      const response = await instance.get(
        "/api/admin/broadcast-messages/stats"
      );
      setStats(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  };

  // Gestion du changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Gestion du changement du nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mettre à jour les messages quand la page ou le nombre de lignes par page change
  useEffect(() => {
    fetchMessages();
  }, [page, rowsPerPage, fetchMessages]);

  // Ouvrir le modal d'ajout
  const handleOpenAddModal = () => {
    const initializeForm = () => {
      setFormData({
        title: "",
        description: "",
        type: "text",
        media_url: "",
        media_file: null, // Réinitialiser le fichier
        status: true, // Initialiser avec le statut actif (true)
      });
      setFormErrors({});
      setModalMode("add");
      setOpenModal(true);
    };
    initializeForm();
  };

  // Ouvrir le modal d'édition
  const handleOpenEditModal = (message) => {
    setModalMode("edit");
    setCurrentMessage(message);
    setFormData({
      title: message.title,
      description: message.description,
      type: message.type,
      media_url: message.media_url || "",
      media_file: null, // Pas de fichier sélectionné initialement en mode édition
      status: Boolean(message.status), // Assurer que c'est un booléen
    });
    setFormErrors({});
    setOpenModal(true);
  };

  // Fermer le modal d'ajout/édition
  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentMessage(null);
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || name === "status" ? checked : value,
    });

    // Effacer l'erreur pour ce champ s'il y en a une
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Le titre est requis";
    }

    if (!formData.description.trim()) {
      errors.description = "La description est requise";
    }

    // Vérification pour les types non-texte (image ou vidéo)
    if (formData.type !== "text") {
      // Si on est en mode édition et qu'il n'y a pas de nouveau fichier sélectionné
      // mais qu'il y a déjà une URL média existante, c'est valide
      const isEditModeWithExistingMedia =
        modalMode === "edit" &&
        currentMessage?.media_url &&
        !formData.media_file;

      // Si aucun fichier n'est sélectionné et qu'on n'est pas dans le cas ci-dessus
      if (!formData.media_file && !isEditModeWithExistingMedia) {
        errors.media_url = `Veuillez sélectionner un fichier ${
          formData.type === "image" ? "image" : "vidéo"
        }`;
      }

      // Vérification du type de fichier si un fichier est sélectionné
      if (formData.media_file) {
        const fileName = formData.media_file.name.toLowerCase();

        if (formData.type === "image") {
          const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
          const fileExt = fileName.split(".").pop();

          if (!validExtensions.includes(fileExt)) {
            errors.media_url =
              "Le fichier doit être une image valide (jpg, jpeg, png, gif, webp)";
          }
        } else if (formData.type === "video") {
          const validExtensions = ["mp4", "webm", "ogg"];
          const fileExt = fileName.split(".").pop();

          if (!validExtensions.includes(fileExt)) {
            errors.media_url =
              "Le fichier doit être une vidéo valide (mp4, webm, ogg)";
          }
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Vérifier si l'URL pointe vers une image valide
  const isValidImageUrl = (url) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const extension = url.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  // Vérifier si l'URL pointe vers une vidéo valide
  const isValidVideoUrl = (url) => {
    const videoExtensions = ["mp4", "webm", "ogg"];
    const extension = url.split(".").pop().toLowerCase();
    return videoExtensions.includes(extension);
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true); // Activer l'indicateur de chargement

    try {
      // Utiliser FormData pour envoyer des fichiers
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", formData.status ? "1" : "0");

      // Ajouter le fichier si le type n'est pas texte et qu'un fichier est sélectionné
      if (formData.type !== "text" && formData.media_file) {
        formDataToSend.append("media_file", formData.media_file);
      } else if (
        formData.type !== "text" &&
        formData.media_url &&
        !formData.media_file
      ) {
        // Si c'est une URL externe (pas un fichier local)
        formDataToSend.append("media_url", formData.media_url);
      }

      // Configuration pour l'envoi de FormData
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (modalMode === "add") {
        await instance.post(
          "/api/admin/broadcast-messages",
          formDataToSend,
          config
        );
        toast.success("Message créé avec succès");
      } else {
        await instance.post(
          `/api/admin/broadcast-messages/${currentMessage.id}`,
          formDataToSend,
          { ...config, params: { _method: "PUT" } } // Laravel accepte _method pour simuler PUT avec FormData
        );
        toast.success("Message mis à jour avec succès");
      }

      handleCloseModal();
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du message:", error);

      if (error.response && error.response.data && error.response.data.errors) {
        // Traiter les erreurs de validation de l'API
        const apiErrors = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          apiErrors[key] = value[0];
        });
        setFormErrors(apiErrors);
      } else {
        toast.error("Erreur lors de la sauvegarde du message");
      }
    } finally {
      setSubmitting(false); // Désactiver l'indicateur de chargement quoi qu'il arrive
    }
  };

  // Ouvrir le modal de prévisualisation
  const handleOpenPreview = (message) => {
    setPreviewMessage(message);
    setPreviewOpen(true);
  };

  // Fermer le modal de prévisualisation
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewMessage(null);
  };

  // Ouvrir le modal de confirmation de suppression
  const handleOpenDeleteModal = (message) => {
    setMessageToDelete(message);
    setDeleteModalOpen(true);
  };

  // Fermer le modal de confirmation de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  // Supprimer un message
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    setDeleting(true); // Activer l'indicateur de chargement

    try {
      await instance.delete(
        `/api/admin/broadcast-messages/${messageToDelete.id}`
      );
      toast.success("Message supprimé avec succès");
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
      toast.error("Erreur lors de la suppression du message");
    } finally {
      setDeleting(false); // Désactiver l'indicateur de chargement
      handleCloseDeleteModal();
    }
  };

  // Changer le statut d'un message
  const handleToggleStatus = async (message) => {
    try {
      setLoading(true);
      const newStatus = !message.status; // Inverser le booléen
      await instance.put(`/api/admin/broadcast-messages/${message.id}/status`, {
        status: newStatus,
      });
      toast.success(
        `Le message a été ${newStatus ? "activé" : "désactivé"} avec succès`
      );
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      toast.error("Erreur lors du changement de statut du message");
    } finally {
      setLoading(false);
    }
  };

  // Républier un message
  const handleRepublish = async (message) => {
    try {
      setLoading(true);
      await instance.post(
        `/api/admin/broadcast-messages/${message.id}/republish`
      );
      toast.success("Le message a été republié avec succès");
      fetchMessages();
    } catch (error) {
      console.error("Erreur lors de la republication du message:", error);
      toast.error("Erreur lors de la republication du message");
    } finally {
      setLoading(false);
    }
  };

  // Rendu du contenu en fonction du type de message (pour la prévisualisation)
  const renderMessageContent = () => {
    if (!previewMessage) return null;

    switch (previewMessage.type) {
      case "image":
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                minHeight: "300px",
                mb: 3,
              }}
            >
              <img
                src={previewMessage.media_url}
                alt={previewMessage.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  borderRadius: "8px",
                  objectFit: "contain",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              />
            </Box>
            <Typography
              variant="body1"
              sx={{ maxWidth: "90%", textAlign: "center" }}
            >
              {previewMessage.description}
            </Typography>
          </Box>
        );
      case "video":
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                minHeight: "300px",
                mb: 3,
              }}
            >
              <video
                controls
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  borderRadius: "8px",
                  objectFit: "contain",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                <source src={previewMessage.media_url} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </Box>
            <Typography
              variant="body1"
              sx={{ maxWidth: "90%", textAlign: "center" }}
            >
              {previewMessage.description}
            </Typography>
          </Box>
        );
      case "text":
      default:
        return (
          <Typography
            variant="body1"
            sx={{ mb: 2, textAlign: "center", maxWidth: "90%", mx: "auto" }}
          >
            {previewMessage.description}
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Conteneur de notification toast */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
      />
      {/* Carte des statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: isDarkMode ? "#1F2937" : "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total des messages
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: isDarkMode ? "#1F2937" : "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" color="success.main">
              {stats.active}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Messages actifs
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: isDarkMode ? "#1F2937" : "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" color="error.main">
              {stats.inactive}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Messages inactifs
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: isDarkMode ? "#1F2937" : "white",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="h6" color="info.main">
              {stats.views}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Vues totales
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper
        sx={{
          width: "100%",
          mb: 2,
          backgroundColor: isDarkMode ? "#1F2937" : "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ color: isDarkMode ? "white" : "inherit" }}
          >
            Messages de diffusion
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
          >
            Ajouter
          </Button>
        </Box>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: isDarkMode ? "rgb(17, 24, 39)" : "#f9fafb",
                    color: isDarkMode ? "white" : "inherit",
                  }}
                >
                  Titre
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: isDarkMode ? "rgb(17, 24, 39)" : "#f9fafb",
                    color: isDarkMode ? "white" : "inherit",
                  }}
                >
                  Type
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: isDarkMode ? "rgb(17, 24, 39)" : "#f9fafb",
                    color: isDarkMode ? "white" : "inherit",
                  }}
                >
                  Statut
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: isDarkMode ? "rgb(17, 24, 39)" : "#f9fafb",
                    color: isDarkMode ? "white" : "inherit",
                  }}
                >
                  Date de création
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: isDarkMode ? "rgb(17, 24, 39)" : "#f9fafb",
                    color: isDarkMode ? "white" : "inherit",
                    width: "150px",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ color: isDarkMode ? "white" : "inherit" }}
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ color: isDarkMode ? "white" : "inherit" }}
                  >
                    Aucun message trouvé
                  </TableCell>
                </TableRow>
              ) : (
                messages
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((message) => (
                    <TableRow
                      hover
                      key={message.id}
                      sx={{
                        "&:hover": {
                          bgcolor: isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <TableCell
                        sx={{ color: isDarkMode ? "white" : "inherit" }}
                      >
                        {message.title}
                      </TableCell>
                      <TableCell
                        sx={{ color: isDarkMode ? "white" : "inherit" }}
                      >
                        <Chip
                          label={
                            message.type === "text"
                              ? "Texte"
                              : message.type === "image"
                              ? "Image"
                              : "Vidéo"
                          }
                          color={
                            message.type === "text"
                              ? "default"
                              : message.type === "image"
                              ? "info"
                              : "secondary"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={Boolean(message.status) ? "Actif" : "Inactif"}
                          color={Boolean(message.status) ? "success" : "error"}
                          size="small"
                          onClick={() => handleToggleStatus(message)}
                          sx={{ cursor: "pointer" }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{ color: isDarkMode ? "white" : "inherit" }}
                      >
                        {new Date(message.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            onClick={() => handleOpenPreview(message)}
                            color="primary"
                            size="small"
                            title="Prévisualiser"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleOpenEditModal(message)}
                            color="primary"
                            size="small"
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleRepublish(message)}
                            color="success"
                            size="small"
                            title="Republier"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleOpenDeleteModal(message)}
                            color="error"
                            size="small"
                            title="Supprimer"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} sur ${count}`
          }
          sx={{
            color: isDarkMode ? "white" : "inherit",
            "& .MuiSvgIcon-root": {
              color: isDarkMode ? "white" : "inherit",
            },
          }}
        />
      </Paper>

      {/* Modal d'ajout/édition */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? "rgb(31,41,55)" : "white",
            color: isDarkMode ? "white" : "black",
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle>
          {modalMode === "add" ? "Ajouter un message" : "Modifier le message"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Titre"
                fullWidth
                value={formData.title}
                onChange={handleFormChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                InputProps={{
                  sx: {
                    color: isDarkMode ? "white" : "inherit",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.23)"
                        : "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel
                  id="type-label"
                  sx={{
                    color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                  }}
                >
                  Type de message
                </InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  label="Type de message"
                  sx={{
                    color: isDarkMode ? "white" : "inherit",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.23)"
                        : "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                    "& .MuiSvgIcon-root": {
                      color: isDarkMode ? "white" : "inherit",
                    },
                  }}
                >
                  <MenuItem value="text">Texte</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Vidéo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.type !== "text" && (
              <Grid item xs={12}>
                <input
                  accept={formData.type === "image" ? "image/*" : "video/*"}
                  style={{ display: "none" }}
                  id="media-file-upload"
                  type="file"
                  name="media_file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Mettre à jour le formulaire avec le fichier sélectionné
                      setFormData({
                        ...formData,
                        media_file: file,
                        media_url: URL.createObjectURL(file), // Pour prévisualisation
                      });
                      // Effacer l'erreur si elle existe
                      if (formErrors.media_url) {
                        setFormErrors({ ...formErrors, media_url: null });
                      }
                    }
                  }}
                />
                <label htmlFor="media-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{
                      mb: 2,
                      color: isDarkMode ? "white" : "inherit",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.23)"
                        : "rgba(0, 0, 0, 0.23)",
                      "&:hover": {
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(0, 0, 0, 0.5)",
                      },
                    }}
                  >
                    {formData.type === "image"
                      ? "Sélectionner une image"
                      : "Sélectionner une vidéo"}
                  </Button>
                </label>
                {formErrors.media_url && (
                  <FormHelperText error>{formErrors.media_url}</FormHelperText>
                )}
                <FormHelperText>
                  {formData.type === "image"
                    ? "Formats supportés: jpg, jpeg, png, gif, webp"
                    : "Formats supportés: mp4, webm, ogg"}
                </FormHelperText>

                {/* Prévisualisation du média sélectionné */}
                {formData.media_url && formData.type === "image" && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <img
                      src={formData.media_url}
                      alt="Prévisualisation"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "4px",
                      }}
                    />
                  </Box>
                )}
                {formData.media_url && formData.type === "video" && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <video
                      controls
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "4px",
                      }}
                    >
                      <source src={formData.media_url} />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </Box>
                )}
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleFormChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                InputProps={{
                  sx: {
                    color: isDarkMode ? "white" : "inherit",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "inherit",
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.23)"
                        : "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.5)"
                        : "rgba(0, 0, 0, 0.5)",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="status"
                    checked={Boolean(formData.status)}
                    onChange={handleFormChange}
                    color="primary"
                  />
                }
                label={Boolean(formData.status) ? "Actif" : "Inactif"}
              />
              <FormHelperText>
                {Boolean(formData.status)
                  ? "Le message sera publié et visible par les utilisateurs"
                  : "Le message sera enregistré et désactivé"}
              </FormHelperText>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseModal}
            color="inherit"
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {submitting
              ? "Traitement en cours..."
              : modalMode === "add"
              ? "Ajouter"
              : "Mettre à jour"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de prévisualisation */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? "#1f2937" : "white",
            color: isDarkMode ? "white" : "black",
            borderRadius: "12px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(8px)",
          },
        }}
        sx={{
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h6" component="div">
            {previewMessage?.title}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClosePreview}
            aria-label="close"
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            px: { xs: 2, sm: 3, md: 4 },
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {renderMessageContent()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePreview} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteMessage}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        confirmButtonColor="error"
        isDarkMode={isDarkMode}
        isLoading={deleting}
        backdropProps={{
          sx: {
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(0, 0, 0, 0.5)",
          },
        }}
        paperProps={{
          sx: {
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          },
        }}
      />
    </Box>
  );
};

export default AdminBroadcastMessages;
