import React, { useState, useEffect, Fragment } from "react";
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
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
};

const Users = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Changed to true initially
  const [error, setError] = useState(null);
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchUsers();
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
      toast({
        type: "error",
        message: "Erreur lors de la récupération des détails de l'utilisateur",
      });
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
      setResetPasswordLoading(true);

      // Validation basique
      if (
        !resetPasswordData.newPassword ||
        resetPasswordData.newPassword.length < 8
      ) {
        toast.error(
          "Le nouveau mot de passe doit contenir au moins 8 caractères"
        );
        setResetPasswordLoading(false);
        return;
      }

      if (!resetPasswordData.adminPassword) {
        toast.error("Veuillez entrer votre mot de passe administrateur");
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

      if (response.data.success) {
        toast.success(
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
      toast.error(
        err.response?.data?.message ||
          "Erreur lors de la réinitialisation du mot de passe"
      );
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
        toast.success("Statut modifié avec succès");
      } else {
        // Gérer le cas où success est false
        toast.error(
          response.data.message || "Erreur lors de la modification du statut"
        );
      }
    } catch (err) {
      console.error("Error in toggleUserStatus:", err);
      // Afficher le message d'erreur de l'API si disponible
      toast.error(
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
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
          <PersonIcon className="mr-3" sx={{ fontSize: 32 }} />
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Gérez les utilisateurs, consultez leurs informations et modifiez leurs
          statuts.
        </p>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 max-w-5xl mx-auto">
        <div className="mt-3 flex justify-between items-center">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            className="mb-2"
          >
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>

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
          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out">
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
                  className="mt-1"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        )}

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
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Utilisateur
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Statut
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-10 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.picture ? (
                              <img
                                src={user.picture}
                                alt={user.name}
                                className="flex-shrink-0 h-8 w-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.name
                                  )}&background=6366f1&color=fff`;
                                }}
                              />
                            ) : (
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.packs.length || 0} pack(s)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {user.status === "active" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center">
                            <Menu
                              as="div"
                              className="relative inline-block text-left"
                            >
                              <div>
                                <Menu.Button className="p-1.5 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                                  <EllipsisVerticalIcon className="h-5 w-5" />
                                </Menu.Button>
                              </div>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                  <div className="px-1 py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleViewDetails(user)
                                          }
                                          className={`${
                                            active
                                              ? "bg-gray-100 dark:bg-gray-700"
                                              : ""
                                          } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                        >
                                          <InfoIcon
                                            fontSize="small"
                                            className="mr-2 text-indigo-600 dark:text-indigo-400"
                                          />
                                          <span>Voir les détails</span>
                                        </button>
                                      )}
                                    </Menu.Item>

                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleOpenResetPassword(user)
                                          }
                                          className={`${
                                            active
                                              ? "bg-gray-100 dark:bg-gray-700"
                                              : ""
                                          } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                        >
                                          <LockResetIcon
                                            fontSize="small"
                                            className="mr-2 text-blue-600 dark:text-blue-400"
                                          />
                                          <span>
                                            Réinitialiser mot de passe
                                          </span>
                                        </button>
                                      )}
                                    </Menu.Item>

                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            toggleUserStatus(user.id)
                                          }
                                          className={`${
                                            active
                                              ? "bg-gray-100 dark:bg-gray-700"
                                              : ""
                                          } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                                        >
                                          {user.status === "active" ? (
                                            <>
                                              <ToggleOnIcon
                                                fontSize="small"
                                                className="mr-2 text-green-600 dark:text-green-400"
                                              />
                                              <span>
                                                Désactiver l'utilisateur
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <ToggleOffIcon
                                                fontSize="small"
                                                className="mr-2 text-red-600 dark:text-red-400"
                                              />
                                              <span>Activer l'utilisateur</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Affichage de {users.length} utilisateurs sur{" "}
                {pagination.totalItems}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  size="small"
                  className="min-w-[40px]"
                >
                  Précédent
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled
                  size="small"
                  className="min-w-[40px]"
                >
                  {pagination.currentPage}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  size="small"
                  className="min-w-[40px]"
                >
                  Suivant
                </Button>
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
        BackdropProps={{
          style: backdropStyle,
        }}
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            background: isDarkMode ? "#1f2937" : "#fff",
          },
        }}
      >
        <DialogTitle>
          <div className="flex items-center">
            <LockIcon
              className="mr-2"
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            />
            <span style={{ color: isDarkMode ? "#fff" : "#000" }}>
              Réinitialiser le mot de passe
            </span>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="mt-2 mb-4">
            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Vous êtes sur le point de réinitialiser le mot de passe de
              l'utilisateur :
              <span className="font-bold ml-1">
                {resetPasswordData.userName}
              </span>
            </p>
            <p className="text-sm text-red-400 mt-1">
              Cette action est irréversible et le nouveau mot de passe prendra
              effet immédiatement.
            </p>
          </div>

          <div className="space-y-4 mt-4">
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
                    "& fieldset": {
                      borderColor: isDarkMode ? "#4b5563" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode ? "#6b7280" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: isDarkMode ? "#3b82f6" : undefined,
                    },
                  },
                }}
              />
              <IconButton
                onClick={() => setShowNewPassword(!showNewPassword)}
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
                    "& fieldset": {
                      borderColor: isDarkMode ? "#4b5563" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: isDarkMode ? "#6b7280" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: isDarkMode ? "#3b82f6" : undefined,
                    },
                  },
                }}
              />
              <IconButton
                onClick={() => setShowAdminPassword(!showAdminPassword)}
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
          style={{ backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "#fff" }}
        >
          <Button
            onClick={handleCloseResetPassword}
            style={{ color: isDarkMode ? "#9ca3af" : undefined }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleResetPasswordSubmit}
            variant="contained"
            disabled={resetPasswordLoading}
            style={{
              backgroundColor: !resetPasswordLoading
                ? isDarkMode
                  ? "#3b82f6"
                  : undefined
                : undefined,
              color: isDarkMode ? "#fff" : undefined,
            }}
          >
            {resetPasswordLoading
              ? "En cours..."
              : "Réinitialiser le mot de passe"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        BackdropProps={{
          style: backdropStyle,
        }}
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "#fff",
            maxHeight: "90vh",
            overflowY: "auto",
          },
        }}
      >
        <DialogTitle
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: "#14532d",
          }}
        >
          <div className="flex items-center">
            <PersonIcon style={{ color: "#fff" }} className="mr-2" />
            <span style={{ color: "#fff" }}>
              Informations sur l'utilisateur
            </span>
          </div>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseDialog}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers style={{ padding: 0 }}>
          {selectedUser && <UserDetails userId={selectedUser.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
