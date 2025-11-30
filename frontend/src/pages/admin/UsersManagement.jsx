import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import Users from "./Users";
import AdminManagement from "./AdminManagement";
import {
  UserIcon,
  ShieldCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  Tabs,
  Tab,
  Box,
  Paper,
  CircularProgress,
  Typography,
  Fade,
  Zoom,
  Grow,
  Avatar,
  Chip,
} from "@mui/material";

// Import pour les animations CSS
import "animate.css";

// Composant personnalisé pour l'icône dans l'onglet avec design moderne
const TabIcon = ({ icon: Icon, selected, isDarkMode }) => (
  <Avatar
    sx={{
      width: 32,
      height: 32,
      bgcolor: selected
        ? isDarkMode
          ? "linear-gradient(145deg, #3b82f6, #2563eb)"
          : "linear-gradient(145deg, #dbeafe, #bfdbfe)"
        : isDarkMode
        ? "rgba(75, 85, 99, 0.3)"
        : "rgba(243, 244, 246, 0.8)",
      border: selected
        ? `2px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`
        : `1px solid ${
            isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 1)"
          }`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      mr: 2,
    }}
  >
    <Icon
      className={`h-4 w-4 ${
        selected
          ? isDarkMode
            ? "text-blue-200"
            : "text-blue-600"
          : isDarkMode
          ? "text-gray-400"
          : "text-gray-500"
      }`}
    />
  </Avatar>
);

const UsersManagement = () => {
  const { isDarkMode } = useTheme();
  const { user, authToken } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Fonction pour récupérer les permissions de l'utilisateur
  const fetchUserPermissions = async () => {
    setLoadingPermissions(true);
    try {
      // Récupérer les permissions depuis l'API pour tous les utilisateurs
      const response = await axios.get(`/api/user/permissions`);
      if (response.data && response.data.permissions) {
        // Stocker les slugs des permissions
        const permissionSlugs = response.data.permissions.map(
          (permission) => permission.slug
        );
        setUserPermissions(permissionSlugs);
      } else {
        setUserPermissions([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
      setUserPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Fonction pour déterminer les onglets disponibles en fonction des permissions
  const getAvailableTabs = () => {
    const tabs = [];

    // Onglet Utilisateurs visible si super-admin ou permission "manage-users"
    if (
      userPermissions.includes("manage-users") ||
      userPermissions.includes("super-admin") ||
      user?.is_super_admin
    ) {
      tabs.push({
        name: "Utilisateurs",
        icon: UserIcon,
        component: Users,
      });
    }

    // Onglet Administrateurs visible si super-admin ou permission "manage-admins"
    if (
      userPermissions.includes("manage-admins") ||
      userPermissions.includes("super-admin") ||
      user?.is_super_admin
    ) {
      tabs.push({
        name: "Administrateurs",
        icon: ShieldCheckIcon,
        component: AdminManagement,
      });
    }

    return tabs;
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  // Initialiser l'onglet actif en fonction des permissions disponibles
  useEffect(() => {
    if (!loadingPermissions) {
      const availableTabs = getAvailableTabs();

      // Si aucun onglet n'est disponible, ne rien faire
      if (availableTabs.length === 0) {
        return;
      }

      // Si l'onglet actif n'est pas dans les onglets disponibles, sélectionner le premier onglet disponible
      if (selectedTab >= availableTabs.length) {
        setSelectedTab(0);
      }
    }
  }, [userPermissions, loadingPermissions, selectedTab]);

  const availableTabs = getAvailableTabs();

  // Styles pour les onglets en fonction du thème
  const getTabStyles = (isDarkMode) => ({
    root: {
      backgroundColor: isDarkMode ? "#1e293b" : "#f8fafc",
      borderRadius: "0.75rem",
      padding: "0.5rem",
      marginBottom: "1.5rem",
      border: isDarkMode
        ? "1px solid rgba(59, 130, 246, 0.1)"
        : "1px solid rgba(226, 232, 240, 1)",
    },
    indicator: {
      display: "flex",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    selected: {
      backgroundColor: isDarkMode
        ? "linear-gradient(145deg, #2563eb, #3b82f6)"
        : "linear-gradient(145deg, #ffffff, #f9fafb)",
      color: isDarkMode ? "#bfdbfe" : "#1d4ed8",
      borderRadius: "0.5rem",
      fontWeight: 600,
    },
    notSelected: {
      color: isDarkMode ? "#94a3b8" : "#64748b",
      transition: "all 0.2s ease-in-out",
    },
  });

  if (loadingPermissions) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        {/* En-tête moderne pendant le chargement */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: isDarkMode
                  ? "linear-gradient(145deg, #3b82f6, #2563eb)"
                  : "linear-gradient(145deg, #dbeafe, #bfdbfe)",
                border: `2px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`,
              }}
            >
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Gestion des utilisateurs et administrateurs
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-3xl">
                Gérez les comptes utilisateurs et les permissions d'accès au
                système avec une interface moderne et intuitive.
              </p>
            </div>
            <Chip
              icon={<SparklesIcon className="h-4 w-4" />}
              label="Admin Panel"
              size="medium"
              sx={{
                bgcolor: isDarkMode
                  ? "#1f2937"
                  : "linear-gradient(145deg, #f3f4f6, #e5e7eb)",
                color: isDarkMode ? "#d1d5db" : "#374151",
                fontWeight: 600,
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(75, 85, 99, 0.5)"
                    : "rgba(229, 231, 235, 1)"
                }`,
              }}
            />
          </div>
        </div>

        {/* Écran de chargement moderne */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 6, sm: 8 },
            textAlign: "center",
            borderRadius: "1rem",
            bgcolor: isDarkMode
              ? "#1f2937"
              : "linear-gradient(145deg, #ffffff, #f9fafb)",
            border: isDarkMode
              ? "1px solid rgba(59, 130, 246, 0.1)"
              : "1px solid rgba(226, 232, 240, 1)",
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: isDarkMode
                ? "linear-gradient(145deg, #3b82f6, #2563eb)"
                : "linear-gradient(145deg, #dbeafe, #bfdbfe)",
              border: `3px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`,
              mx: "auto",
              mb: 3,
            }}
          >
            <Cog6ToothIcon className="h-8 w-8 text-blue-600 dark:text-blue-300 animate-spin" />
          </Avatar>

          <Typography
            variant="h5"
            sx={{
              color: isDarkMode ? "#f3f4f6" : "#111827",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Chargement des permissions
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? "#9ca3af" : "#6b7280",
              maxWidth: "400px",
              mx: "auto",
              mb: 4,
            }}
          >
            Veuillez patienter pendant que nous vérifions vos permissions
            d'accès au système...
          </Typography>

          <CircularProgress
            size={40}
            sx={{
              color: isDarkMode ? "#60a5fa" : "#2563eb",
              mb: 2,
            }}
          />

          <Typography
            variant="caption"
            sx={{
              color: isDarkMode ? "#6b7280" : "#9ca3af",
              display: "block",
              mt: 2,
            }}
          >
            Cette opération ne prend que quelques instants
          </Typography>
        </Paper>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        {/* En-tête moderne pour l'écran d'erreur */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                border: `2px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`,
              }}
            >
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Gestion des utilisateurs et administrateurs
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-3xl">
                Gérez les comptes utilisateurs et les permissions d'accès au
                système avec une interface moderne et intuitive.
              </p>
            </div>
            <Chip
              icon={<SparklesIcon className="h-4 w-4" />}
              label="Admin Panel"
              size="medium"
              sx={{
                bgcolor: isDarkMode ? "#1f2937" : "#fff",
                color: isDarkMode ? "#d1d5db" : "#374151",
                fontWeight: 600,
                border: `1px solid ${
                  isDarkMode
                    ? "rgba(75, 85, 99, 0.5)"
                    : "rgba(229, 231, 235, 1)"
                }`,
              }}
            />
          </div>
        </div>

        {/* Écran d'erreur moderne */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 6, sm: 8 },
            textAlign: "center",
            borderRadius: "1rem",
            bgcolor: isDarkMode
              ? "#1f2937"
              : "linear-gradient(145deg, #ffffff, #f9fafb)",
            border: isDarkMode
              ? "1px solid rgba(239, 68, 68, 0.2)"
              : "1px solid rgba(239, 68, 68, 0.1)",
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: isDarkMode
                ? "linear-gradient(145deg, #dc2626, #b91c1c)"
                : "linear-gradient(145deg, #fee2e2, #fecaca)",
              border: `3px solid ${isDarkMode ? "#ef4444" : "#dc2626"}`,

              mx: "auto",
              mb: 3,
            }}
          >
            <UserIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </Avatar>

          <Typography
            variant="h5"
            sx={{
              color: isDarkMode ? "#f3f4f6" : "#111827",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Accès non autorisé
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? "#9ca3af" : "#6b7280",
              maxWidth: "400px",
              mx: "auto",
              mb: 4,
            }}
          >
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            section. Veuillez contacter votre administrateur système.
          </Typography>

          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </button>
        </Paper>
      </div>
    );
  }

  const tabStyles = getTabStyles(isDarkMode);

  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* En-tête moderne de la page */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: isDarkMode ? "#1f2937" : "#fff",
              border: `2px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`,
            }}
          >
            <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Gestion des utilisateurs et administrateurs
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-3xl">
              Gérez les comptes utilisateurs et les permissions d'accès au
              système avec une interface moderne et intuitive.
            </p>
          </div>
          <Chip
            icon={<SparklesIcon className="h-4 w-4" />}
            label="Admin Panel"
            size="medium"
            sx={{
              bgcolor: isDarkMode ? "#1f2937" : "#fff",
              color: isDarkMode ? "#d1d5db" : "#374151",
              fontWeight: 600,
              border: `1px solid ${
                isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 1)"
              }`,
            }}
          />
        </div>
      </div>

      <Box sx={{ width: "100%" }}>
        {/* Container des onglets avec design moderne */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: isDarkMode ? "#1f2937" : "#fff",
            borderRadius: "1rem",
            marginBottom: "1.5rem",
            border: isDarkMode
              ? "1px solid rgba(59, 130, 246, 0.15)"
              : "1px solid rgba(226, 232, 240, 1)",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              "& .MuiTabs-indicator": {
                display: "none",
              },
              minHeight: "56px",
              "& .MuiTabs-flexContainer": {
                gap: "0.5rem",
              },
            }}
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 1,
                    }}
                    className="transition-all duration-300 ease-in-out"
                  >
                    <TabIcon
                      icon={tab.icon}
                      selected={selectedTab === index}
                      isDarkMode={isDarkMode}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        className={`font-semibold transition-all duration-300 ease-in-out ${
                          selectedTab === index
                            ? isDarkMode
                              ? "text-blue-300"
                              : "text-blue-700"
                            : isDarkMode
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                        style={{ fontSize: "0.875rem", lineHeight: "1.2" }}
                      >
                        {tab.name}
                      </span>
                      <span
                        className={`text-xs transition-all duration-300 ease-in-out ${
                          selectedTab === index
                            ? isDarkMode
                              ? "text-blue-400"
                              : "text-blue-600"
                            : isDarkMode
                            ? "text-gray-500"
                            : "text-gray-500"
                        }`}
                      >
                        {tab.description}
                      </span>
                    </Box>
                  </Box>
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  minHeight: "48px",
                  borderRadius: "0.75rem",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  "&.Mui-selected": {
                    background: isDarkMode
                      ? "linear-gradient(145deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))"
                      : "linear-gradient(145deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.05))",
                    color: isDarkMode ? "#60a5fa" : "#2563eb",
                    borderRadius: "0.75rem",
                    border: isDarkMode
                      ? "1px solid rgba(59, 130, 246, 0.3)"
                      : "1px solid rgba(59, 130, 246, 0.2)",
                    transform: "scale(1.02)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: isDarkMode
                        ? "linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)"
                        : "linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.05), transparent)",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                    },
                    "&:hover::before": {
                      opacity: 1,
                    },
                  },
                  "&:not(.Mui-selected)": {
                    color: isDarkMode ? "#9ca3af" : "#64748b",
                    background: isDarkMode
                      ? "rgba(55, 65, 81, 0.2)"
                      : "rgba(248, 250, 252, 0.8)",
                    border: isDarkMode
                      ? "1px solid rgba(75, 85, 99, 0.3)"
                      : "1px solid rgba(226, 232, 240, 0.8)",
                    "&:hover": {
                      background: isDarkMode
                        ? "linear-gradient(145deg, rgba(75, 85, 99, 0.3), rgba(55, 65, 81, 0.2))"
                        : "linear-gradient(145deg, rgba(241, 245, 249, 0.9), rgba(248, 250, 252, 0.8))",
                      color: isDarkMode ? "#d1d5db" : "#475569",
                      border: isDarkMode
                        ? "1px solid rgba(107, 114, 128, 0.4)"
                        : "1px solid rgba(203, 213, 225, 0.9)",
                      transform: "scale(1.01)",
                    },
                  },
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Container du contenu avec design moderne */}
        <Box
          sx={{
            mt: 2,
            bgcolor: isDarkMode
              ? "linear-gradient(145deg, #1f2937, #111827)"
              : "linear-gradient(145deg, #ffffff, #f9fafb)",
            borderRadius: "1rem",
            p: 0,
            border: isDarkMode
              ? "1px solid rgba(59, 130, 246, 0.1)"
              : "1px solid rgba(226, 232, 240, 1)",
            overflow: "hidden",
          }}
        >
          {availableTabs.map((tab, index) => (
            <Fade
              key={index}
              in={selectedTab === index}
              timeout={400}
              style={{ display: selectedTab === index ? "block" : "none" }}
            >
              <Box
                sx={{
                  p: { xs: 3, sm: 4 },
                  minHeight: "500px",
                }}
              >
                <tab.component />
              </Box>
            </Fade>
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default UsersManagement;
