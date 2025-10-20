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
} from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/24/solid";
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
} from "@mui/material";

// Import pour les animations CSS
import "animate.css";

// Composant personnalisé pour l'icône dans l'onglet
const TabIcon = ({ icon: Icon, selected, isDarkMode }) => (
  <Icon
    className={`h-4 w-4 mr-2 ${
      selected
        ? isDarkMode
          ? "text-blue-400"
          : "text-blue-600"
        : "text-gray-500 dark:text-gray-400"
    }`}
  />
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
      boxShadow: isDarkMode
        ? "0 4px 12px rgba(37, 99, 235, 0.2)"
        : "0 4px 12px rgba(0, 0, 0, 0.05)",
      fontWeight: 600,
    },
    notSelected: {
      color: isDarkMode ? "#94a3b8" : "#64748b",
      transition: "all 0.2s ease-in-out",
    },
  });

  if (loadingPermissions) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Gestion des utilisateurs et administrateurs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gérez les comptes utilisateurs et les permissions d'accès au système.
          </p>
        </div>

        <div className="flex flex-col justify-center items-center h-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <CircularProgress size={32} sx={{ color: isDarkMode ? "#60a5fa" : "#2563eb" }} />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Chargement des permissions...
          </p>
        </div>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Gestion des utilisateurs et administrateurs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gérez les comptes utilisateurs et les permissions d'accès au système.
          </p>
        </div>

        <Paper
          elevation={0}
          className="p-8 text-center rounded-lg border"
          sx={{
            bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
            borderColor: isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
          }}
        >
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <Typography
            variant="h6"
            sx={{
              color: isDarkMode ? "#f3f4f6" : "#111827",
              fontWeight: 600,
              mb: 1,
            }}
          >
            Accès non autorisé
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? "#9ca3af" : "#6b7280",
              maxWidth: "400px",
              margin: "0 auto",
              mb: 3,
            }}
          >
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </Typography>

          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 flex items-center justify-center mx-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Retour
          </button>
        </Paper>
      </div>
    );
  }

  const tabStyles = getTabStyles(isDarkMode);

  return (
    <div className="container mx-auto p-4">
      {/* En-tête de la page */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
          <UserGroupIcon
            className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400"
          />
          Gestion des utilisateurs et administrateurs
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gérez les comptes utilisateurs et les permissions d'accès au système.
        </p>
      </div>

      <Box sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: tabStyles.root.backgroundColor,
            borderRadius: "0.5rem",
            padding: "0.25rem",
            marginBottom: "1rem",
            border: isDarkMode
              ? "1px solid rgba(55, 65, 81, 0.5)"
              : "1px solid rgba(229, 231, 235, 1)",
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
                minHeight: "40px",
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
                      }}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <TabIcon
                        icon={tab.icon}
                        selected={selectedTab === index}
                        isDarkMode={isDarkMode}
                      />
                      <span className="transition-all duration-300 ease-in-out">
                        {tab.name}
                      </span>
                    </Box>
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    minHeight: "36px",
                    borderRadius: "0.375rem",
                    transition: "all 0.2s ease-in-out",
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode
                        ? "rgba(59, 130, 246, 0.15)"
                        : "rgba(59, 130, 246, 0.1)",
                      color: isDarkMode ? "#60a5fa" : "#2563eb",
                      borderRadius: "0.375rem",
                    },
                    "&:not(.Mui-selected)": {
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(243, 244, 246, 0.8)",
                        color: isDarkMode ? "#d1d5db" : "#374151",
                      },
                    },
                  }}
                />
              ))}
            </Tabs>
          </Paper>

        <Box
          sx={{
            mt: 2,
            bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
            borderRadius: "0.5rem",
            p: 0,
          }}
        >
          {availableTabs.map((tab, index) => (
            <Fade
              key={index}
              in={selectedTab === index}
              timeout={300}
              style={{ display: selectedTab === index ? "block" : "none" }}
            >
              <div>
                <tab.component />
              </div>
            </Fade>
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default UsersManagement;
