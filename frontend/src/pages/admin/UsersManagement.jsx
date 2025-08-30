import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import Users from "./Users";
import AdminManagement from "./AdminManagement";
import { UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import {
  Tabs,
  Tab,
  Box,
  Paper,
  CircularProgress,
  Typography
} from "@mui/material";

// Composant personnalisé pour l'icône dans l'onglet
const TabIcon = ({ icon: Icon, selected, isDarkMode }) => (
  <Icon
    className={`h-5 w-5 mr-2 ${selected ? 
      (isDarkMode ? "text-primary-400" : "text-primary-600") : 
      "text-gray-500 dark:text-gray-400"}`}
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
        component: Users
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
        component: AdminManagement
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
      backgroundColor: isDarkMode ? "#1f2937" : "#f3f4f6",
      borderRadius: "0.5rem",
      padding: "0.25rem",
      marginBottom: "1.5rem"
    },
    indicator: {
      display: "none"
    },
    selected: {
      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
      color: isDarkMode ? "#93c5fd" : "#2563eb",
      borderRadius: "0.375rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
    },
    notSelected: {
      color: isDarkMode ? "#9ca3af" : "#4b5563"
    }
  });

  if (loadingPermissions) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress color="primary" />
      </div>
    );
  }

  if (availableTabs.length === 0) {
    return (
      <Paper className="p-6 text-center" sx={{ bgcolor: isDarkMode ? "#1f2937" : "#ffffff" }}>
        <UserIcon
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
        <Typography variant="subtitle1" sx={{ mt: 2, color: isDarkMode ? "#f3f4f6" : "#111827" }}>
          Accès non autorisé
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette section.
        </Typography>
      </Paper>
    );
  }

  const tabStyles = getTabStyles(isDarkMode);

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des utilisateurs
        </h1>
      </div>

      <Box sx={{ width: '100%' }}>
        <Paper 
          elevation={0} 
          sx={{
            bgcolor: tabStyles.root.backgroundColor,
            borderRadius: tabStyles.root.borderRadius,
            padding: tabStyles.root.padding,
            marginBottom: tabStyles.root.marginBottom
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                display: tabStyles.indicator.display
              },
              minHeight: '48px'
            }}
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TabIcon 
                      icon={tab.icon} 
                      selected={selectedTab === index} 
                      isDarkMode={isDarkMode} 
                    />
                    <span>{tab.name}</span>
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  minHeight: '40px',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    backgroundColor: tabStyles.selected.backgroundColor,
                    color: tabStyles.selected.color,
                    borderRadius: tabStyles.selected.borderRadius,
                    boxShadow: tabStyles.selected.boxShadow
                  },
                  '&:not(.Mui-selected)': {
                    color: tabStyles.notSelected.color,
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#e5e7eb' : '#1f2937'
                    }
                  }
                }}
              />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ mt: 2, bgcolor: isDarkMode ? '#1f2937' : '#ffffff', borderRadius: '0.5rem', p: 1 }}>
          {availableTabs.map((tab, index) => (
            <div key={index} style={{ display: selectedTab === index ? 'block' : 'none' }}>
              <tab.component />
            </div>
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default UsersManagement;
