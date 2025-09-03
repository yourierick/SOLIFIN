import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import Users from "./Users";
import AdminManagement from "./AdminManagement";
import { UserIcon, ShieldCheckIcon, UsersIcon, Cog6ToothIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
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
    className={`h-5 w-5 mr-2 ${
      selected
        ? isDarkMode
          ? "text-primary-400"
          : "text-primary-600"
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
      border: isDarkMode ? "1px solid rgba(59, 130, 246, 0.1)" : "1px solid rgba(226, 232, 240, 1)",
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
        <div className="mb-8 animate__animated animate__fadeIn animate__faster">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            <UserGroupIcon
              className="mr-3 animate__animated animate__fadeIn animate__slower animate__infinite animate__pulse"
              style={{
                width: "36px",
                height: "36px",
                color: isDarkMode ? "#3b82f6" : "#1d4ed8",
                filter: isDarkMode
                  ? "drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))"
                  : "drop-shadow(0 0 2px rgba(29, 78, 216, 0.3))",
              }}
            />
            <span className="text-gray-900 dark:text-white">
              Gestion des utilisateurs et administrateurs
            </span>
          </h1>
        </div>
        
        <Zoom in={true} timeout={500}>
          <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            <div className="relative">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-400 opacity-75"></div>
              <div className="animate-spin relative rounded-full h-12 w-12 border-2 border-t-blue-600 border-r-blue-500 border-b-blue-400 border-l-transparent shadow-lg"></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium animate__animated animate__fadeIn animate__delay-1s">
              Chargement des permissions...
            </p>
          </div>
        </Zoom>
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-8 animate__animated animate__fadeIn animate__faster">
          <h1 className="text-3xl font-bold mb-4 flex items-center">
            <UserGroupIcon
              className="mr-3 animate__animated animate__fadeIn"
              style={{
                width: "36px",
                height: "36px",
                color: isDarkMode ? "#3b82f6" : "#1d4ed8",
                filter: isDarkMode
                  ? "drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))"
                  : "drop-shadow(0 0 2px rgba(29, 78, 216, 0.3))",
              }}
            />
            <span className="text-gray-900 dark:text-white">
              Gestion des utilisateurs et administrateurs
            </span>
          </h1>
        </div>
        
        <Zoom in={true} timeout={400}>
          <Paper
            elevation={3}
            className="p-8 text-center rounded-xl border border-red-100 dark:border-red-900/30 transition-all duration-300 hover:shadow-xl"
            sx={{ 
              bgcolor: isDarkMode ? "#1e293b" : "#ffffff",
              boxShadow: isDarkMode ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center transition-all duration-300 hover:scale-105">
              <UserIcon
                className="h-14 w-14 text-red-600 dark:text-red-500 animate__animated animate__pulse animate__infinite animate__slow"
                aria-hidden="true"
              />
            </div>
            
            <Typography
              variant="h5"
              sx={{ 
                mt: 2, 
                color: isDarkMode ? "#f3f4f6" : "#111827",
                fontWeight: 600,
              }}
              className="animate__animated animate__fadeIn"
            >
              Accès non autorisé
            </Typography>
            
            <Typography
              variant="body1"
              sx={{ 
                mt: 2, 
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                maxWidth: "500px",
                margin: "0 auto",
                transition: 'color 0.3s ease-in-out',
              }}
              className="animate__animated animate__fadeIn animate__delay-1s"
            >
              Vous n'avez pas les permissions nécessaires pour accéder à cette section. 
              Veuillez contacter votre administrateur système si vous pensez que cela est une erreur.
            </Typography>
            
            <button 
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 animate__animated animate__fadeIn animate__delay-2s flex items-center justify-center mx-auto group"
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:animate__animated group-hover:animate__fadeInLeft" />
              Retour à la page précédente
            </button>
          </Paper>
        </Zoom>
      </div>
    );
  }

  const tabStyles = getTabStyles(isDarkMode);

  return (
    <div className="container mx-auto p-4">
      {/* En-tête de la page avec animation améliorée */}
      <div className="mb-8 animate__animated animate__fadeIn animate__faster">
        <h1 className="text-3xl font-bold mb-4 flex items-center group">
          <UserGroupIcon
            className="mr-3 animate__animated animate__fadeIn group-hover:animate__pulse"
            style={{
              width: "36px",
              height: "36px",
              color: isDarkMode ? "#3b82f6" : "#1d4ed8",
              filter: isDarkMode
                ? "drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))"
                : "drop-shadow(0 0 2px rgba(29, 78, 216, 0.3))",
              transition: "transform 0.3s ease-in-out, filter 0.3s ease-in-out",
            }}
          />
          <span className="text-gray-900 dark:text-white transition-colors duration-300 ease-in-out">
            Gestion des utilisateurs et administrateurs
          </span>
        </h1>
        <div className="flex justify-between items-center mb-4 animate__animated animate__fadeIn animate__delay-1s">
          <p className="text-gray-600 dark:text-gray-300 text-lg pl-1 border-l-4 border-blue-500 dark:border-blue-600 ml-1 pl-3 transition-all duration-300 ease-in-out hover:border-blue-600 dark:hover:border-blue-500 hover:pl-4">
            Gérez les comptes utilisateurs et les permissions d'accès au système.
          </p>
        </div>
      </div>
      
      <Box sx={{ width: "100%" }}>
        <Grow in={true} timeout={300}>
          <Paper
            elevation={3}
            sx={{
              bgcolor: tabStyles.root.backgroundColor,
              borderRadius: tabStyles.root.borderRadius,
              padding: tabStyles.root.padding,
              marginBottom: tabStyles.root.marginBottom,
              boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: isDarkMode ? '0 6px 16px rgba(0, 0, 0, 0.4)' : '0 6px 16px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              "& .MuiTabs-indicator": {
                display: tabStyles.indicator.display,
              },
              minHeight: "48px",
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
                    <span className="transition-all duration-300 ease-in-out">{tab.name}</span>
                  </Box>
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  minHeight: "40px",
                  borderRadius: "0.375rem",
                  transition: "all 0.3s ease-in-out",
                  "&.Mui-selected": {
                    backgroundColor: tabStyles.selected.backgroundColor,
                    color: tabStyles.selected.color,
                    borderRadius: tabStyles.selected.borderRadius,
                    boxShadow: tabStyles.selected.boxShadow,
                    transform: "translateY(-1px)",
                  },
                  "&:not(.Mui-selected)": {
                    color: tabStyles.notSelected.color,
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(55, 65, 81, 0.5)"
                        : "rgba(255, 255, 255, 0.8)",
                      color: isDarkMode ? "#e5e7eb" : "#1f2937",
                      transform: "translateY(-1px)",
                    },
                  },
                }}
              />
            ))}
          </Tabs>
          </Paper>
        </Grow>

        <Box
          sx={{
            mt: 2,
            bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
            borderRadius: "0.5rem",
            p: 1,
            transition: 'all 0.3s ease-in-out',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
          className="animate__animated animate__fadeIn animate__faster"
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
