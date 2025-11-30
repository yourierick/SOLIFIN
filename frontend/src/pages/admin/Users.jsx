import React, { useState, useEffect, Fragment } from "react";
import "animate.css";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import frLocale from "date-fns/locale/fr";
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  LockReset as LockResetIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Close as CloseIcon,
  MoreVert as EllipsisVerticalIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  FilterListOff as FilterListOffIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import axios from "../../utils/axios";
import ReferralStats from "../../components/ReferralStats";
import ReferralList from "../../components/ReferralList";
import { useToast } from "../../contexts/ToastContext";
import Notification from "../../components/Notification";
import { useTheme } from "../../contexts/ThemeContext";
import UserDetails from "./UserDetails";
import { Menu, Transition } from "@headlessui/react";

// Style personnalisé pour l'overlay des modals avec effet de flou
const backdropStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(6px)",
};

// Styles pour les animations de transition
const transitionStyles = {
  fadeIn: "animate__animated animate__fadeIn animate__faster",
  slideIn: "animate__animated animate__slideInUp animate__faster",
  bounce: "animate__animated animate__bounceIn animate__faster",
  pulse: "animate__animated animate__pulse animate__infinite",
};

const Users = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Changed to true initially
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statistiques, setStatistiques] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    has_pack: "",
    start_date: null,
    end_date: null,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
    userName: "",
    newPassword: "",
    adminPassword: "",
  });
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Fonctions utilitaires
  const formatNumber = (number) => {
    return new Intl.NumberFormat("fr-FR").format(number);
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case "up":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586 20.293 5.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 8.414l-3.293 3.293A1 1 0 018 12H5.414L12 13z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // États pour la réinitialisation de mot de passe

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Préparer les paramètres avec les dates formatées
      const params = {
        ...filters,
        page: pagination.currentPage,
      };

      // Formater les dates si elles existent
      if (filters.start_date) {
        params.start_date = filters.start_date.toISOString().split("T")[0]; // Format YYYY-MM-DD
      }

      if (filters.end_date) {
        params.end_date = filters.end_date.toISOString().split("T")[0]; // Format YYYY-MM-DD
      }

      const response = await axios.get("/api/admin/users", { params });

      if (response.data.success) {
        setUsers(response.data.data.data);
        setPagination({
          currentPage: response.data.data.current_page,
          totalPages: response.data.data.last_page,
          totalItems: response.data.data.total,
        });
      } else {
        throw new Error(
          response.data.message ||
            "Erreur lors de la récupération des utilisateurs"
        );
      }
    } catch (err) {
      //console.error('Error in fetchUsers:', err); // Debug log
      setError(
        err.message || "Erreur lors de la récupération des utilisateurs"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get("/api/admin/users/dashboard-stats");

      if (response.data.success) {
        setDashboardStats(response.data.data);
      } else {
        throw new Error(
          response.data.message ||
            "Erreur lors de la récupération des statistiques"
        );
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      // Afficher un message d'erreur plus clair
      if (err.response?.status === 403) {
        console.error("Permission refusée pour accéder aux statistiques");
      } else if (err.response?.status === 404) {
        console.error("Route des statistiques non trouvée");
      } else {
        console.error(
          "Erreur serveur:",
          err.response?.data?.message || err.message
        );
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.currentPage]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetails = async (user) => {
    try {
      setSelectedUser(user);
      setOpenDialog(true);

      // Récupérer les statistiques de parrainage
      const statsResponse = await axios.get(
        `/api/admin/users/${user.id}/referrals`
      );
      if (statsResponse.data.success) {
        setStatistiques(statsResponse.data.referrals || []);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      Notification.error(
        "Erreur lors de la récupération des détails de l'utilisateur"
      );
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleOpenResetPassword = (user) => {
    setResetPasswordData({
      userId: user.id,
      userName: user.name,
      newPassword: "",
      adminPassword: "",
    });
    setResetPasswordDialog(true);
  };

  const handleCloseResetPassword = () => {
    setResetPasswordDialog(false);
    setResetPasswordData({
      userId: null,
      userName: "",
      newPassword: "",
      adminPassword: "",
    });
    setResetPasswordError(""); // Réinitialiser les erreurs
    setShowNewPassword(false);
    setShowAdminPassword(false);
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPasswordSubmit = async () => {
    try {
      // Réinitialiser les erreurs précédentes
      setResetPasswordError("");
      setResetPasswordLoading(true);

      // Validation basique
      if (
        !resetPasswordData.newPassword ||
        resetPasswordData.newPassword.length < 8
      ) {
        setResetPasswordError(
          "Le nouveau mot de passe doit contenir au moins 8 caractères"
        );
        setResetPasswordLoading(false);
        return;
      }

      if (!resetPasswordData.adminPassword) {
        setResetPasswordError(
          "Veuillez entrer votre mot de passe administrateur"
        );
        setResetPasswordLoading(false);
        return;
      }

      const response = await axios.post(
        `/api/admin/users/${resetPasswordData.userId}/reset-password`,
        {
          new_password: resetPasswordData.newPassword,
          admin_password: resetPasswordData.adminPassword,
        }
      );

      console.log(response.data.success);

      if (response.data.success) {
        Notification.success(
          response.data.message || "Mot de passe réinitialisé avec succès"
        );
        handleCloseResetPassword();
      } else {
        throw new Error(
          response.data.message ||
            "Erreur lors de la réinitialisation du mot de passe"
        );
      }
    } catch (err) {
      console.error("Error in handleResetPasswordSubmit:", err);

      // Gérer les erreurs spécifiques
      if (err.response?.status === 401) {
        setResetPasswordError("Mot de passe administrateur incorrect");
      } else if (err.response?.data?.message) {
        setResetPasswordError(err.response.data.message);
      } else {
        setResetPasswordError(
          "Erreur lors de la réinitialisation du mot de passe"
        );
        Notification.error("Une erreur est survenue");
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const response = await axios.patch(
        `/api/admin/users/toggle-status/${userId}`
      );

      if (response.data.success) {
        // Rafraîchir la liste des utilisateurs
        fetchUsers();
        // Afficher un message de succès
        Notification.success("Statut modifié avec succès");
      } else {
        // Gérer le cas où success est false
        Notification.error(
          response.data.message || "Erreur lors de la modification du statut"
        );
      }
    } catch (err) {
      console.error("Error in toggleUserStatus:", err);
      // Afficher le message d'erreur de l'API si disponible
      Notification.error(
        err.response?.data?.message ||
          "Erreur lors de la modification du statut"
      );
    }
  };

  // Fonction pour formater correctement les dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("fr-FR");
    } catch (error) {
      return "N/A";
    }
  };

  // Gestionnaire de changement de page
  const handlePageChange = (page) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
    }));
    fetchUsers();
  };

  if (loading && !users.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-4 sm:mb-6 max-w-4xl">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 dark:text-white">
            <PersonIcon
              sx={{
                fontSize: { xs: 20, sm: 24 },
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                marginRight: { xs: 0.5, sm: 1 },
              }}
            />
            <span className="hidden sm:inline">Gestion des utilisateurs</span>
            <span className="sm:hidden">Utilisateurs</span>
          </h1>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              borderRadius: "8px",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.875rem",
            }}
          >
            {showFilters ? "Masquer" : "Filtres"}
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
          Gérez les utilisateurs, consultez leurs informations et modifiez leurs
          statuts.
        </p>
      </div>
      {error && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 sm:mb-6 max-w-5xl mx-auto">
        <div className="mt-3 flex justify-between items-center">
          {!showFilters &&
            (filters.search ||
              filters.status ||
              filters.has_pack ||
              filters.start_date ||
              filters.end_date) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Filtres actifs
                </span>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setFilters({
                      search: "",
                      status: "",
                      has_pack: "",
                      start_date: null,
                      end_date: null,
                    });
                    fetchUsers();
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            )}
        </div>

        {showFilters && (
          <div className="mt-3 p-3 sm:p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300 ease-in-out animate__animated animate__fadeIn animate__faster">
            <div className="flex flex-wrap gap-3 items-start">
              <div className="w-full">
                <TextField
                  size="small"
                  label="Rechercher"
                  variant="outlined"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full mb-3"
                  placeholder="Rechercher par nom, email ou ID..."
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: filters.search && (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleFilterChange("search", "")}
                          aria-label="Effacer la recherche"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-between w-full">
                <div className="flex flex-wrap gap-3">
                  <FormControl size="small" className="w-full sm:w-40">
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filters.status}
                      label="Statut"
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "#1f2937",
                            "& .MuiMenuItem-root": {
                              color: "white",
                              "&:hover": {
                                bgcolor: "rgba(255, 255, 255, 0.08)",
                              },
                              "&.Mui-selected": {
                                bgcolor: "rgba(255, 255, 255, 0.16)",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.24)",
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="active">Actif</MenuItem>
                      <MenuItem value="inactive">Inactif</MenuItem>
                      <MenuItem value="trial">En essai</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" className="w-full sm:w-44">
                    <InputLabel>Possède un pack</InputLabel>
                    <Select
                      value={filters.has_pack}
                      label="Possède un pack"
                      onChange={(e) =>
                        handleFilterChange("has_pack", e.target.value)
                      }
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "#1f2937",
                            "& .MuiMenuItem-root": {
                              color: "white",
                              "&:hover": {
                                bgcolor: "rgba(255, 255, 255, 0.08)",
                              },
                              "&.Mui-selected": {
                                bgcolor: "rgba(255, 255, 255, 0.16)",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.24)",
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="1">Oui</MenuItem>
                      <MenuItem value="0">Non</MenuItem>
                    </Select>
                  </FormControl>

                  <LocalizationProvider
                    dateAdapter={AdapterDateFns}
                    adapterLocale={frLocale}
                  >
                    <DatePicker
                      label="Inscrit depuis"
                      value={filters.start_date}
                      onChange={(date) =>
                        handleFilterChange("start_date", date)
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          className: "w-full sm:w-40",
                          variant: "outlined",
                          InputProps: {
                            endAdornment: filters.start_date && (
                              <InputAdornment position="end">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() =>
                                    handleFilterChange("start_date", null)
                                  }
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: "#1f2937",
                              color: "white",
                              "& .MuiPickersDay-root": {
                                color: "white",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.08)",
                                },
                                "&.Mui-selected": {
                                  bgcolor: "rgba(255, 255, 255, 0.16)",
                                  "&:hover": {
                                    bgcolor: "rgba(255, 255, 255, 0.24)",
                                  },
                                },
                              },
                              "& .MuiDayCalendar-header": {
                                color: "rgba(255, 255, 255, 0.7)",
                              },
                              "& .MuiPickersCalendarHeader-label": {
                                color: "white",
                              },
                              "& .MuiIconButton-root": {
                                color: "white",
                              },
                            },
                          },
                        },
                      }}
                    />

                    <DatePicker
                      label="Inscrit jusqu'à"
                      value={filters.end_date}
                      onChange={(date) => handleFilterChange("end_date", date)}
                      slotProps={{
                        textField: {
                          size: "small",
                          className: "w-full sm:w-40",
                          variant: "outlined",
                          InputProps: {
                            endAdornment: filters.end_date && (
                              <InputAdornment position="end">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() =>
                                    handleFilterChange("end_date", null)
                                  }
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        },
                        popper: {
                          sx: {
                            "& .MuiPaper-root": {
                              bgcolor: "#1f2937",
                              color: "white",
                              "& .MuiPickersDay-root": {
                                color: "white",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.08)",
                                },
                                "&.Mui-selected": {
                                  bgcolor: "rgba(255, 255, 255, 0.16)",
                                  "&:hover": {
                                    bgcolor: "rgba(255, 255, 255, 0.24)",
                                  },
                                },
                              },
                              "& .MuiDayCalendar-header": {
                                color: "rgba(255, 255, 255, 0.7)",
                              },
                              "& .MuiPickersCalendarHeader-label": {
                                color: "white",
                              },
                              "& .MuiIconButton-root": {
                                color: "white",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>

                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setFilters({
                      search: "",
                      status: "",
                      has_pack: "",
                      start_date: null,
                      end_date: null,
                    });
                    fetchUsers();
                  }}
                  startIcon={<ClearIcon />}
                  className="mt-1 transition-all duration-300 ease-in-out"
                  sx={{
                    borderRadius: "12px",
                    fontWeight: 500,
                    textTransform: "none",
                    background: isDarkMode
                      ? "linear-gradient(45deg, #3b82f6 30%, #2563eb 90%)"
                      : "linear-gradient(45deg, #1d4ed8 30%, #3b82f6 90%)",
                    boxShadow: isDarkMode
                      ? "0 3px 5px 2px rgba(59, 130, 246, 0.3)"
                      : "0 3px 5px 2px rgba(29, 78, 216, 0.2)",
                    "&:hover": {
                      background: isDarkMode
                        ? "linear-gradient(45deg, #2563eb 30%, #1d4ed8 90%)"
                        : "linear-gradient(45deg, #1e40af 30%, #1d4ed8 90%)",
                      transform: "translateY(-1px)",
                      boxShadow: isDarkMode
                        ? "0 4px 8px 2px rgba(59, 130, 246, 0.4)"
                        : "0 4px 8px 2px rgba(29, 78, 216, 0.3)",
                    },
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tableau de bord statistiques */}
        <div className="mb-6 max-w-5xl mx-auto">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : dashboardStats ? (
            <div className="space-y-6">
              {/* Cartes principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total utilisateurs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total utilisateurs
                    </h3>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <PersonIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardStats.total_users)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tous les comptes
                  </p>
                </div>

                {/* Comptes actifs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Comptes actifs
                    </h3>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardStats.active_users)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardStats.total_users > 0
                      ? Math.round(
                          (dashboardStats.active_users /
                            dashboardStats.total_users) *
                            100
                        )
                      : 0}
                    % du total
                  </p>
                </div>

                {/* Comptes inactifs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Comptes inactifs
                    </h3>
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardStats.inactive_users)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dashboardStats.total_users > 0
                      ? Math.round(
                          (dashboardStats.inactive_users /
                            dashboardStats.total_users) *
                            100
                        )
                      : 0}
                    % du total
                  </p>
                </div>

                {/* Taux d'activité */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Taux d'activité
                    </h3>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600 dark:text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardStats.activity_rate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatNumber(dashboardStats.users_with_active_packs)} avec
                    pack actif
                  </p>
                </div>
              </div>

              {/* Statistiques d'inscription */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Inscrits aujourd'hui */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inscrits aujourd'hui
                    </h3>
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(dashboardStats.registrations.today)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Aujourd'hui
                  </p>
                </div>

                {/* Inscrits cette semaine */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inscrits cette semaine
                    </h3>
                    <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-teal-600 dark:text-teal-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(dashboardStats.registrations.week)}
                    </p>
                    <div className="ml-2 flex items-center">
                      {getTrendIcon(dashboardStats.trends.week.direction)}
                      <span
                        className={`ml-1 text-sm font-medium ${
                          dashboardStats.trends.week.direction === "up"
                            ? "text-green-600"
                            : dashboardStats.trends.week.direction === "down"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {dashboardStats.trends.week.value > 0 && "+"}
                        {dashboardStats.trends.week.value}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cette semaine
                  </p>
                </div>

                {/* Inscrits ce mois */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inscrits ce mois
                    </h3>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-orange-600 dark:text-orange-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(dashboardStats.registrations.month)}
                    </p>
                    <div className="ml-2 flex items-center">
                      {getTrendIcon(dashboardStats.trends.month.direction)}
                      <span
                        className={`ml-1 text-sm font-medium ${
                          dashboardStats.trends.month.direction === "up"
                            ? "text-green-600"
                            : dashboardStats.trends.month.direction === "down"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {dashboardStats.trends.month.value > 0 && "+"}
                        {dashboardStats.trends.month.value}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ce mois
                  </p>
                </div>

                {/* Inscrits cette année */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inscrits cette année
                    </h3>
                    <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                      <svg
                        className="w-5 h-5 text-pink-600 dark:text-pink-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(dashboardStats.registrations.year)}
                    </p>
                    <div className="ml-2 flex items-center">
                      {getTrendIcon(dashboardStats.trends.year.direction)}
                      <span
                        className={`ml-1 text-sm font-medium ${
                          dashboardStats.trends.year.direction === "up"
                            ? "text-green-600"
                            : dashboardStats.trends.year.direction === "down"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {dashboardStats.trends.year.value > 0 && "+"}
                        {dashboardStats.trends.year.value}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cette année
                  </p>
                </div>
              </div>

              {/* Comptes en essai */}
              {dashboardStats.trial_users > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {formatNumber(dashboardStats.trial_users)} comptes en
                      période d'essai
                    </h3>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Impossible de charger les statistiques. Veuillez vérifier
                  votre connexion ou les permissions.
                </h3>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-12 flex justify-center items-center">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <PersonIcon sx={{ fontSize: 60, color: "#9ca3af" }} />
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé avec les filtres actuels.
              </p>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setFilters({
                    search: "",
                    status: "",
                    has_pack: "",
                    start_date: null,
                    end_date: null,
                  });
                  fetchUsers();
                }}
                className="mt-4"
              >
                {showFilters ? "Masquer" : "Filtres"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto transition-all duration-300 ease-in-out hover:shadow-2xl animate__animated animate__fadeIn animate__faster">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 text-white">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                      >
                        Utilisateur
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider"
                      >
                        Statut
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="animate__animated animate__fadeIn">
                    {users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                          user.status === "inactive"
                            ? "bg-red-50 dark:bg-red-900/10"
                            : ""
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.picture ? (
                              <img
                                src={user.picture}
                                alt={user.name}
                                className="flex-shrink-0 h-10 w-10 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:border-blue-400 dark:hover:border-blue-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.name
                                  )}&background=3b82f6&color=fff`;
                                }}
                              />
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center text-white text-sm font-medium border-2 border-blue-200 dark:border-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.packs.length
                                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {user.packs.length || 0} pack(s)
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          <div className="transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                          <div className="transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400">
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
                              user.status === "active"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md hover:bg-green-200 dark:hover:bg-green-800"
                                : user.status === "inactive"
                                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 shadow-sm hover:shadow-md hover:bg-red-200 dark:hover:bg-red-800"
                                : user.status === "trial"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800 shadow-sm hover:shadow-md hover:bg-yellow-200 dark:hover:bg-yellow-800"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:bg-gray-200 dark:hover:bg-gray-800"
                            }`}
                          >
                            {user.status === "active"
                              ? "Actif"
                              : user.status === "inactive"
                              ? "Inactif"
                              : user.status === "trial"
                              ? "En essai"
                              : ""}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 md:px-5 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex justify-end items-center gap-2 sm:gap-3">
                            {/* Bouton Voir les détails */}
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="inline-flex items-center p-1.5 sm:p-2 border border-transparent rounded-full shadow-md text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 dark:from-indigo-600 dark:to-indigo-800 dark:hover:from-indigo-700 dark:hover:to-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__fadeIn"
                              title="Voir les détails"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <InfoIcon
                                fontSize="small"
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                            </button>

                            {/* Bouton Réinitialiser mot de passe */}
                            <button
                              onClick={() => handleOpenResetPassword(user)}
                              className="inline-flex items-center p-1.5 sm:p-2 border border-transparent rounded-full shadow-md text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 dark:from-blue-600 dark:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__fadeIn"
                              title="Réinitialiser mot de passe"
                              style={{
                                animationDelay: `${index * 30 + 100}ms`,
                              }}
                            >
                              <LockResetIcon
                                fontSize="small"
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                            </button>

                            {/* Bouton Activer/Désactiver utilisateur */}
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`inline-flex items-center p-1.5 sm:p-2 border border-transparent rounded-full shadow-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__fadeIn ${
                                user.status === "active"
                                  ? "bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 dark:from-red-600 dark:to-red-800 dark:hover:from-red-700 dark:hover:to-red-900 focus:ring-red-500"
                                  : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 dark:from-green-600 dark:to-green-800 dark:hover:from-green-700 dark:hover:to-green-900 focus:ring-green-500"
                              }`}
                              title={
                                user.status === "active"
                                  ? "Désactiver l'utilisateur"
                                  : "Activer l'utilisateur"
                              }
                              style={{
                                animationDelay: `${index * 30 + 200}ms`,
                              }}
                            >
                              {user.status === "active" ? (
                                <ToggleOnIcon
                                  fontSize="small"
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                />
                              ) : (
                                <ToggleOffIcon
                                  fontSize="small"
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 sm:mt-6 animate__animated animate__fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="whitespace-nowrap">
                    <span className="hidden sm:inline">Affichage de </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {users.length}
                    </span>
                    <span className="hidden sm:inline"> utilisateurs</span>
                    <span className="sm:hidden">/</span>
                    <span className="hidden sm:inline"> sur </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {pagination.totalItems}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Bouton Première page */}
                  <Button
                    variant="outlined"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => handlePageChange(1)}
                    className="min-w-[32px] sm:min-w-[40px] h-[32px] sm:h-[36px] p-0 hidden xs:flex"
                    sx={{
                      borderRadius: "8px",
                      minWidth: { xs: "36px", sm: "40px" },
                      border: isDarkMode
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : undefined,
                      color: isDarkMode ? "#3b82f6" : undefined,
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(59, 130, 246, 0.08)"
                          : undefined,
                        border: isDarkMode ? "1px solid #3b82f6" : undefined,
                      },
                      "&.Mui-disabled": {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.3)"
                          : undefined,
                        border: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.12)"
                          : undefined,
                      },
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>

                  {/* Bouton Précédent */}
                  <Button
                    variant="outlined"
                    disabled={pagination.currentPage <= 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="transition-all duration-300"
                    sx={{
                      borderRadius: "8px",
                      minWidth: { xs: "32px", sm: "auto" },
                      height: { xs: "32px", sm: "36px" },
                      padding: { xs: "4px", sm: "6px 16px" },
                      border: isDarkMode
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : undefined,
                      color: isDarkMode ? "#3b82f6" : undefined,
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(59, 130, 246, 0.08)"
                          : undefined,
                        border: isDarkMode ? "1px solid #3b82f6" : undefined,
                        transform: "translateX(-2px)",
                      },
                      "&.Mui-disabled": {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.3)"
                          : undefined,
                        border: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.12)"
                          : undefined,
                      },
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="hidden md:inline"></span>
                  </Button>

                  {/* Affichage des pages */}
                  <div className="flex items-center gap-1">
                    {pagination.totalPages > 0 && (
                      <>
                        {pagination.currentPage > 2 &&
                          pagination.totalPages > 3 && (
                            <Button
                              variant="outlined"
                              onClick={() => handlePageChange(1)}
                              className="hidden md:flex"
                              sx={{
                                borderRadius: "8px",
                                minWidth: { xs: "32px", sm: "36px" },
                                height: { xs: "32px", sm: "36px" },
                                padding: "6px",
                                border: isDarkMode
                                  ? "1px solid rgba(59, 130, 246, 0.5)"
                                  : undefined,
                                color: isDarkMode ? "#3b82f6" : undefined,
                              }}
                            >
                              1
                            </Button>
                          )}

                        {pagination.currentPage > 3 &&
                          pagination.totalPages > 4 && (
                            <span className="text-gray-500 dark:text-gray-400 px-0.5 sm:px-1 text-xs sm:text-sm hidden md:inline">
                              ...
                            </span>
                          )}

                        {pagination.currentPage > 1 && (
                          <Button
                            variant="outlined"
                            onClick={() =>
                              handlePageChange(pagination.currentPage - 1)
                            }
                            className="hidden sm:flex"
                            sx={{
                              borderRadius: "8px",
                              minWidth: { xs: "32px", sm: "36px" },
                              height: { xs: "32px", sm: "36px" },
                              padding: "6px",
                              border: isDarkMode
                                ? "1px solid rgba(59, 130, 246, 0.5)"
                                : undefined,
                              color: isDarkMode ? "#3b82f6" : undefined,
                            }}
                          >
                            {pagination.currentPage - 1}
                          </Button>
                        )}

                        <Button
                          variant="contained"
                          disableElevation
                          sx={{
                            borderRadius: "8px",
                            minWidth: { xs: "32px", sm: "36px" },
                            height: { xs: "32px", sm: "36px" },
                            padding: { xs: "4px", sm: "6px" },
                            fontWeight: "bold",
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            background: isDarkMode
                              ? "linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)"
                              : "linear-gradient(45deg, #3b82f6 30%, #60a5fa 90%)",
                            boxShadow: "0 3px 5px 2px rgba(59, 130, 246, .3)",
                          }}
                        >
                          {pagination.currentPage}
                        </Button>

                        {pagination.currentPage < pagination.totalPages && (
                          <Button
                            variant="outlined"
                            onClick={() =>
                              handlePageChange(pagination.currentPage + 1)
                            }
                            className="hidden sm:flex"
                            sx={{
                              borderRadius: "8px",
                              minWidth: { xs: "32px", sm: "36px" },
                              height: { xs: "32px", sm: "36px" },
                              padding: "6px",
                              border: isDarkMode
                                ? "1px solid rgba(59, 130, 246, 0.5)"
                                : undefined,
                              color: isDarkMode ? "#3b82f6" : undefined,
                            }}
                          >
                            {pagination.currentPage + 1}
                          </Button>
                        )}

                        {pagination.currentPage < pagination.totalPages - 2 &&
                          pagination.totalPages > 4 && (
                            <span className="text-gray-500 dark:text-gray-400 px-0.5 sm:px-1 text-xs sm:text-sm hidden md:inline">
                              ...
                            </span>
                          )}

                        {pagination.currentPage < pagination.totalPages - 1 &&
                          pagination.totalPages > 3 && (
                            <Button
                              variant="outlined"
                              onClick={() =>
                                handlePageChange(pagination.totalPages)
                              }
                              className="hidden md:flex"
                              sx={{
                                borderRadius: "8px",
                                minWidth: { xs: "32px", sm: "36px" },
                                height: { xs: "32px", sm: "36px" },
                                padding: "6px",
                                border: isDarkMode
                                  ? "1px solid rgba(59, 130, 246, 0.5)"
                                  : undefined,
                                color: isDarkMode ? "#3b82f6" : undefined,
                              }}
                            >
                              {pagination.totalPages}
                            </Button>
                          )}
                      </>
                    )}
                  </div>

                  {/* Bouton Suivant */}
                  <Button
                    variant="outlined"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="transition-all duration-300"
                    sx={{
                      borderRadius: "8px",
                      minWidth: { xs: "32px", sm: "auto" },
                      height: { xs: "32px", sm: "36px" },
                      padding: { xs: "4px", sm: "6px 16px" },
                      border: isDarkMode
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : undefined,
                      color: isDarkMode ? "#3b82f6" : undefined,
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(59, 130, 246, 0.08)"
                          : undefined,
                        border: isDarkMode ? "1px solid #3b82f6" : undefined,
                        transform: "translateX(2px)",
                      },
                      "&.Mui-disabled": {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.3)"
                          : undefined,
                        border: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.12)"
                          : undefined,
                      },
                    }}
                  >
                    <span className="hidden md:inline"></span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>

                  {/* Bouton Dernière page */}
                  <Button
                    variant="outlined"
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className="min-w-[32px] sm:min-w-[40px] h-[32px] sm:h-[36px] p-0 hidden xs:flex"
                    sx={{
                      borderRadius: "8px",
                      minWidth: { xs: "32px", sm: "40px" },
                      height: { xs: "32px", sm: "36px" },
                      border: isDarkMode
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : undefined,
                      color: isDarkMode ? "#3b82f6" : undefined,
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(59, 130, 246, 0.08)"
                          : undefined,
                        border: isDarkMode ? "1px solid #3b82f6" : undefined,
                      },
                      "&.Mui-disabled": {
                        color: isDarkMode
                          ? "rgba(255, 255, 255, 0.3)"
                          : undefined,
                        border: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.12)"
                          : undefined,
                      },
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={resetPasswordDialog}
        onClose={handleCloseResetPassword}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          className: transitionStyles.slideIn,
        }}
        BackdropProps={{
          style: backdropStyle,
        }}
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            background: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: isDarkMode
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.5)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: isDarkMode
              ? "linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)"
              : "linear-gradient(45deg, #3b82f6 30%, #60a5fa 90%)",
            color: "#fff",
            padding: "16px 24px",
            borderBottom: isDarkMode
              ? "1px solid #374151"
              : "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center">
            <LockIcon
              className="mr-3 animate__animated animate__fadeIn"
              sx={{
                fontSize: 24,
                filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))",
              }}
            />
            <span className="text-xl font-semibold">
              Réinitialiser le mot de passe
            </span>
          </div>
        </DialogTitle>
        <DialogContent className="animate__animated animate__fadeIn animate__faster">
          <div className="mt-4 mb-5">
            <p
              className={`${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              } text-base`}
            >
              Vous êtes sur le point de réinitialiser le mot de passe de
              l'utilisateur :
              <span className="font-bold ml-1 text-blue-500 dark:text-blue-400">
                {resetPasswordData.userName}
              </span>
            </p>
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm">
                Cette action est irréversible et le nouveau mot de passe prendra
                effet immédiatement.
              </p>
            </div>
          </div>

          {resetPasswordError && (
            <div className="mt-2 mb-5 p-4 bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg animate__animated animate__headShake">
              <p className="font-medium flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {resetPasswordError}
              </p>
            </div>
          )}
          <div className="space-y-5 mt-4">
            <div className="relative">
              <TextField
                label="Nouveau mot de passe"
                variant="outlined"
                type={showNewPassword ? "text" : "password"}
                value={resetPasswordData.newPassword}
                onChange={handleResetPasswordChange}
                name="newPassword"
                fullWidth
                helperText="Minimum 8 caractères"
                InputLabelProps={{
                  style: { color: isDarkMode ? "#9ca3af" : undefined },
                }}
                InputProps={{
                  style: { color: isDarkMode ? "#fff" : undefined },
                }}
                FormHelperTextProps={{
                  style: { color: isDarkMode ? "#9ca3af" : undefined },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: isDarkMode ? "#4b5563" : undefined,
                      borderWidth: "1.5px",
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode ? "#6b7280" : undefined,
                      borderWidth: "1.5px",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: isDarkMode ? "#3b82f6" : undefined,
                      borderWidth: "2px",
                    },
                  },
                }}
              />
              <IconButton
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  color: isDarkMode ? "#9ca3af" : undefined,
                }}
              >
                {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>

            <div className="relative mt-4">
              <TextField
                label="Votre mot de passe administrateur"
                variant="outlined"
                type={showAdminPassword ? "text" : "password"}
                value={resetPasswordData.adminPassword}
                onChange={handleResetPasswordChange}
                name="adminPassword"
                fullWidth
                helperText="Requis pour confirmer l'action"
                InputLabelProps={{
                  style: { color: isDarkMode ? "#9ca3af" : undefined },
                }}
                InputProps={{
                  style: { color: isDarkMode ? "#fff" : undefined },
                }}
                FormHelperTextProps={{
                  style: { color: isDarkMode ? "#9ca3af" : undefined },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: isDarkMode ? "#4b5563" : undefined,
                      borderWidth: "1.5px",
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode ? "#6b7280" : undefined,
                      borderWidth: "1.5px",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: isDarkMode ? "#3b82f6" : undefined,
                      borderWidth: "2px",
                    },
                  },
                }}
              />
              <IconButton
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="transition-all duration-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  color: isDarkMode ? "#9ca3af" : undefined,
                }}
              >
                {showAdminPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "#fff",
            borderTop: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={handleCloseResetPassword}
            className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            sx={{
              color: isDarkMode ? "#9ca3af" : undefined,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              padding: "8px 16px",
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleResetPasswordSubmit}
            variant="contained"
            disabled={resetPasswordLoading}
            className="transition-all duration-300 ease-in-out"
            sx={{
              background: !resetPasswordLoading
                ? isDarkMode
                  ? "linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)"
                  : "linear-gradient(45deg, #3b82f6 30%, #60a5fa 90%)"
                : undefined,
              color: "#fff",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              padding: "8px 16px",
              boxShadow: !resetPasswordLoading
                ? isDarkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                  : "0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)"
                : "none",
              "&:hover": {
                background: !resetPasswordLoading
                  ? isDarkMode
                    ? "linear-gradient(45deg, #1e3a8a 30%, #2563eb 90%)"
                    : "linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)"
                  : undefined,
                boxShadow: isDarkMode
                  ? "0 6px 8px -1px rgba(0, 0, 0, 0.4), 0 3px 5px -1px rgba(0, 0, 0, 0.3)"
                  : "0 6px 8px -1px rgba(59, 130, 246, 0.4), 0 3px 5px -1px rgba(59, 130, 246, 0.3)",
                transform: "translateY(-1px)",
              },
            }}
          >
            {resetPasswordLoading ? (
              <span className="flex items-center">
                <CircularProgress size={16} color="inherit" className="mr-2" />
                En cours...
              </span>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        TransitionProps={{
          className: transitionStyles.slideIn,
        }}
        BackdropProps={{
          style: backdropStyle,
        }}
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            background: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: isDarkMode
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.5)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: isDarkMode
              ? "linear-gradient(45deg, #1e3a8a 30%, #2563eb 90%)"
              : "linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)",
            color: "#fff",
            padding: "16px 24px",
            borderBottom: isDarkMode
              ? "1px solid #374151"
              : "1px solid #e5e7eb",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <PersonIcon
                className="mr-3 animate__animated animate__fadeIn"
                sx={{
                  fontSize: 24,
                  filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))",
                }}
              />
              <span className="text-xl font-semibold">
                Détails de l'utilisateur
              </span>
            </div>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                color: "#fff",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent
          sx={{
            padding: 0,
            borderTop: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            borderBottom: isDarkMode
              ? "1px solid #374151"
              : "1px solid #e5e7eb",
            "&.MuiDialogContent-dividers": {
              borderColor: isDarkMode ? "#374151" : "#e5e7eb",
            },
          }}
        >
          <div className="animate__animated animate__fadeIn animate__faster">
            {selectedUser && <UserDetails userId={selectedUser.id} />}
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "#fff",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={handleCloseDialog}
            className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            sx={{
              color: isDarkMode ? "#9ca3af" : undefined,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              padding: "8px 16px",
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;
