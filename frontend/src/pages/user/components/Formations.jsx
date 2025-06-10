import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  useMediaQuery,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import FormationModal from "./FormationModal";
import CreateFormationModal from "./CreateFormationModal";
import PurchaseFormationModal from "./PurchaseFormationModal";

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
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const Formations = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [formations, setFormations] = useState([]);
  const [myFormations, setMyFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFormationsLoading, setMyFormationsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myFormationsError, setMyFormationsError] = useState(null);
  const [userPacks, setUserPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [myFormationsPage, setMyFormationsPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myFormationsTotalPages, setMyFormationsTotalPages] = useState(1);

  const [tabValue, setTabValue] = useState(0);
  const [openFormationModal, setOpenFormationModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openPurchaseModal, setOpenPurchaseModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [purchasedFormations, setPurchasedFormations] = useState([]);

  // Fonction pour récupérer les formations disponibles
  const fetchFormations = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/formations?page=${page}`;

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      if (typeFilter) {
        url += `&type=${typeFilter}`;
      }

      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }

      const response = await axios.get(url);
      const formationsData = response.data.data.data;

      // Extraire les catégories uniques des formations
      const uniqueCategories = [
        ...new Set(formationsData.map((f) => f.category).filter(Boolean)),
      ].sort();
      setAvailableCategories(uniqueCategories);

      setFormations(formationsData);
      setTotalPages(
        Math.ceil(response.data.data.total / response.data.data.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération des formations:", err);
      setError(
        "Impossible de charger les formations. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les formations créées par l'utilisateur
  const fetchMyFormations = async () => {
    setMyFormationsLoading(true);
    setMyFormationsError(null);

    try {
      let url = `/api/formations/my/list?page=${myFormationsPage}`;

      const response = await axios.get(url);

      setMyFormations(response.data.data.data);
      setMyFormationsTotalPages(
        Math.ceil(response.data.data.total / response.data.data.per_page)
      );
    } catch (err) {
      console.error("Erreur lors de la récupération de mes formations:", err);
      setMyFormationsError(
        "Impossible de charger vos formations. Veuillez réessayer plus tard."
      );
    } finally {
      setMyFormationsLoading(false);
    }
  };

  // Fonction pour récupérer les formations achetées par l'utilisateur
  const fetchPurchasedFormations = async () => {
    try {
      const response = await axios.get("/api/formations/purchased");
      if (response.data.success) {
        setPurchasedFormations(response.data.data);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des formations achetées:",
        err
      );
    }
  };

  // Fonction pour ouvrir le modal de détails d'une formation
  const handleOpenFormation = (formation) => {
    setSelectedFormation(formation);
    setOpenFormationModal(true);
  };

  // Fonction pour ouvrir le modal d'achat d'une formation
  const handleOpenPurchaseModal = (formation) => {
    setSelectedFormation(formation);
    setOpenPurchaseModal(true);
  };

  // Fonction pour vérifier si l'utilisateur a déjà acheté une formation
  const hasUserPurchasedFormation = (formationId) => {
    return purchasedFormations.some((f) => f.id === formationId);
  };

  // Fonction pour récupérer les packs de l'utilisateur
  const fetchUserPacks = async () => {
    setPacksLoading(true);
    try {
      const response = await axios.get("/api/user/packs");
      setUserPacks(response.data.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des packs:", err);
    } finally {
      setPacksLoading(false);
    }
  };

  // Charger les formations au chargement du composant et lorsque les filtres changent
  useEffect(() => {
    fetchFormations();
    fetchMyFormations();
    fetchPurchasedFormations();
    fetchUserPacks();
  }, [page, myFormationsPage, searchQuery, typeFilter, categoryFilter]);

  // Réinitialiser la page lorsque les filtres changent
  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, categoryFilter]);

  // Charger mes formations lorsque l'onglet change ou la page change
  useEffect(() => {
    if (tabValue === 1) {
      fetchMyFormations();
    }
  }, [tabValue, myFormationsPage]);

  // Fonction pour ouvrir le modal de création de formation
  const handleCreateFormation = () => {
    setOpenCreateModal(true);
  };

  // Fonction pour afficher le statut avec la couleur appropriée
  const renderStatus = (status) => {
    const statusConfig = {
      draft: { label: "Brouillon", color: "default" },
      pending: { label: "En attente", color: "warning" },
      published: { label: "Publié", color: "success" },
      rejected: { label: "Rejeté", color: "error" },
    };

    const config = statusConfig[status] || { label: status, color: "default" };

    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // Fonction pour calculer le pourcentage de progression
  const calculateProgress = (formation) => {
    return formation.progress?.progress_percentage || 0;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>
        Formations
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Formations disponibles" />
        <Tab label="Mes formations créées" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {/* Filtres et recherche pour les formations disponibles */}
        <Card
          sx={{
            mb: 3,
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            background: isDarkMode ? "#1f2937" : "#fff",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rechercher une formation"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Catégorie</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Catégorie"
                  >
                    <MenuItem value="">Toutes les catégories</MenuItem>
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FilterListIcon />}
                  onClick={() =>
                    setTypeFilter(typeFilter === "admin" ? "" : "admin")
                  }
                  fullWidth
                >
                  {typeFilter === "admin" ? "Toutes" : "Officielles"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Liste des formations disponibles */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : formations.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Aucune formation disponible pour le moment.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {formations.map((formation) => (
                <Grid item xs={12} sm={6} md={4} key={formation.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: isDarkMode ? "#1f2937" : "#fff",
                      transition: "transform 0.3s ease",
                      boxShadow: "none",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: 6,
                      },
                      // Ajouter un filtre gris pour les formations inaccessibles
                      ...(formation.type === "admin" &&
                        !formation.access?.has_access && {
                          position: "relative",
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            zIndex: 1,
                          },
                        }),
                    }}
                  >
                    {/* Badge de cadenas pour les formations inaccessibles */}
                    {formation.type === "admin" &&
                      !formation.access?.has_access && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            zIndex: 2,
                            backgroundColor: isDarkMode
                              ? "rgba(0, 0, 0, 0.7)"
                              : "rgba(255, 255, 255, 0.7)",
                            borderRadius: "50%",
                            padding: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <LockIcon color="error" />
                        </Box>
                      )}
                    <CardMedia
                      component="img"
                      height="140"
                      image={
                        formation.thumbnail ||
                        "https://via.placeholder.com/300x140?text=Formation"
                      }
                      alt={formation.title}
                      sx={{
                        // Ajouter un filtre gris pour les formations inaccessibles
                        ...(formation.type === "admin" &&
                          !formation.access?.has_access && {
                            filter: "grayscale(50%)",
                          }),
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" component="div" noWrap>
                          {formation.title}
                        </Typography>
                        <Chip
                          label={
                            formation.type === "admin"
                              ? "Officielle"
                              : "Communauté"
                          }
                          color={
                            formation.type === "admin" ? "primary" : "secondary"
                          }
                          size="small"
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          height: "40px",
                        }}
                      >
                        {formation.description}
                      </Typography>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <PersonIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formation.creator?.name || "Administrateur"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <SchoolIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formation.modules?.length || 0} module(s)
                        </Typography>
                      </Box>

                      {/* Message d'accès restreint pour les formations inaccessibles */}
                      {formation.type === "admin" &&
                        !formation.access?.has_access && (
                          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                            <Typography variant="caption">
                              Pour accéder à cette formation, vous avez besoin
                              de posséder l'un de ces packs et qu'il soit actif
                              :
                            </Typography>
                            <List dense sx={{ mt: 1, pl: 1 }}>
                              {formation.access?.required_packs.map((pack) => (
                                <ListItem key={pack.id} sx={{ py: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <LockIcon
                                      fontSize="small"
                                      color="warning"
                                    />
                                  </ListItemIcon>
                                  <ListItemText primary={pack.name} />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                      {/* Barre de progression (seulement pour les formations accessibles) */}
                      {(!formation.type === "admin" ||
                        formation.access?.has_access) && (
                        <Box sx={{ mt: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Progression
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {calculateProgress(formation)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={calculateProgress(formation)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      {formation.type === "admin" &&
                      !formation.access?.has_access ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          color="warning"
                          startIcon={<LockIcon />}
                          disabled
                        >
                          Accès restreint
                        </Button>
                      ) : formation.is_paid &&
                        !hasUserPurchasedFormation(formation.id) ? (
                        <Button
                          fullWidth
                          variant="contained"
                          color="secondary"
                          startIcon={<LockOpenIcon />}
                          onClick={() => handleOpenPurchaseModal(formation)}
                        >
                          Acheter ({formation.price}$)
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleOpenFormation(formation)}
                        >
                          {calculateProgress(formation) > 0
                            ? "Continuer"
                            : "Commencer"}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* En-tête pour mes formations créées */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Mes formations créées</Typography>
          {!packsLoading &&
            userPacks.some(
              (pack) =>
                pack.status === "active" &&
                pack.pack.peux_publier_formation === true
            ) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateFormation}
              >
                Créer une formation
              </Button>
            )}
        </Box>

        {/* Liste de mes formations créées */}
        {myFormationsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : myFormationsError ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {myFormationsError}
          </Alert>
        ) : myFormations.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Vous n'avez pas encore créé de formation. Cliquez sur "Créer une
            formation" pour commencer.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {myFormations.map((formation) => (
                <Grid item xs={12} sm={6} md={4} key={formation.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: isDarkMode ? "#1f2937" : "#fff",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={
                        formation.thumbnail ||
                        "https://via.placeholder.com/300x140?text=Formation"
                      }
                      alt={formation.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" component="div" noWrap>
                          {formation.title}
                        </Typography>
                        {renderStatus(formation.status)}
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          height: "40px",
                        }}
                      >
                        {formation.description}
                      </Typography>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <SchoolIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {formation.modules?.length || 0} module(s)
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <AccessTimeIcon
                          fontSize="small"
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Créée le{" "}
                          {new Date(formation.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>

                      {formation.status === "rejected" && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          <Typography variant="caption">
                            Raison du rejet:{" "}
                            {formation.rejection_reason || "Non spécifiée"}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          navigate(`/dashboard/formations/edit/${formation.id}`)
                        }
                      >
                        Gérer
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={myFormationsTotalPages}
                page={myFormationsPage}
                onChange={(e, value) => setMyFormationsPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </TabPanel>

      {/* Modal de détails de formation */}
      {openFormationModal && selectedFormation && (
        <FormationModal
          open={openFormationModal}
          onClose={() => setOpenFormationModal(false)}
          formationId={selectedFormation.id}
        />
      )}

      {/* Modal de création de formation */}
      <CreateFormationModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onFormationCreated={fetchMyFormations}
      />

      {/* Modal d'achat de formation */}
      {openPurchaseModal && selectedFormation && (
        <PurchaseFormationModal
          open={openPurchaseModal}
          onClose={() => setOpenPurchaseModal(false)}
          formation={selectedFormation}
          onPurchaseComplete={() => {
            // Rafraîchir la liste des formations achetées
            fetchPurchasedFormations();
            // Rafraîchir la liste des formations
            fetchFormations();
          }}
        />
      )}
    </Box>
  );
};

export default Formations;
