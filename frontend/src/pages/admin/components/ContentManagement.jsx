import React, { useState, lazy, Suspense } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Badge
} from "@mui/material";
import {
  School as SchoolIcon,
  Comment as CommentIcon,
  VerifiedUser as VerifiedUserIcon
} from "@mui/icons-material";
import { useTheme } from "../../../contexts/ThemeContext";
import usePendingFormations from "../../../hooks/usePendingFormations";
import usePendingTestimonials from "../../../hooks/usePendingTestimonials";
import usePendingPublications from "../../../hooks/usePendingPublications";

// Importation des composants pour chaque onglet
const FormationManagement = lazy(() => import("./FormationManagement"));
const TestimonialManagement = lazy(() => import("../TestimonialManagement"));
const AdvertisementValidation = lazy(() =>
  import("../AdvertisementValidation")
);

/**
 * Composant de gestion du contenu avec trois onglets principaux:
 * - Formations: Gestion des formations
 * - Témoignages: Gestion des témoignages
 * - Validations: Validation des différents types de contenu
 */
const ContentManagement = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [tabHover, setTabHover] = useState(null);
  
  // Utilisation des hooks pour récupérer les compteurs d'éléments en attente
  const { pendingCount: pendingFormations, loading: loadingFormations } = usePendingFormations();
  const { pendingCount: pendingTestimonials, loading: loadingTestimonials } = usePendingTestimonials();
  const { pendingCount: pendingPublications, loading: loadingPublications } = usePendingPublications();

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu du composant
  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: isDarkMode ? "#fff" : "#111827",
        }}
      >
        Gestion du Contenu
      </Typography>

      {/* Onglets avec design moderne */}
      <Paper
        elevation={isDarkMode ? 2 : 3}
        sx={{
          p: 0,
          mb: 3,
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
          overflow: "hidden",
          transition: "all 0.3s ease",
          boxShadow: isDarkMode
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            style: {
              backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
          sx={{
            borderBottom: 1,
            borderColor: isDarkMode
              ? "rgba(55, 65, 81, 0.5)"
              : "rgba(0, 0, 0, 0.08)",
            bgcolor: isDarkMode ? "#111827" : "#f8fafc",
            "& .MuiTabs-flexContainer": {
              gap: 1,
              px: 1,
              pt: 1,
            },
            "& .MuiTab-root": {
              minHeight: 48,
              transition: "all 0.2s ease",
              borderRadius: "8px 8px 0 0",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(37, 99, 235, 0.05)",
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
              },
              "&.Mui-selected": {
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab
            icon={
              <Badge 
                badgeContent={pendingFormations} 
                color="error"
                max={99}
                invisible={loadingFormations || pendingFormations === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    right: -3,
                    top: -3,
                    fontSize: "0.65rem",
                    padding: "0 4px",
                  }
                }}
              >
                <SchoolIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Formations"
            onMouseEnter={() => setTabHover(0)}
            onMouseLeave={() => setTabHover(null)}
            sx={{
              transform: tabHover === 0 ? "translateY(-2px)" : "none",
            }}
          />
          <Tab
            icon={
              <Badge 
                badgeContent={pendingTestimonials} 
                color="error"
                max={99}
                invisible={loadingTestimonials || pendingTestimonials === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    right: -3,
                    top: -3,
                    fontSize: "0.65rem",
                    padding: "0 4px",
                  }
                }}
              >
                <CommentIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Témoignages"
            onMouseEnter={() => setTabHover(1)}
            onMouseLeave={() => setTabHover(null)}
            sx={{
              transform: tabHover === 1 ? "translateY(-2px)" : "none",
            }}
          />
          <Tab
            icon={
              <Badge 
                badgeContent={pendingPublications} 
                color="error"
                max={99}
                invisible={loadingPublications || pendingPublications === 0}
                sx={{
                  "& .MuiBadge-badge": {
                    right: -3,
                    top: -3,
                    fontSize: "0.65rem",
                    padding: "0 4px",
                  }
                }}
              >
                <VerifiedUserIcon fontSize="small" />
              </Badge>
            }
            iconPosition="start"
            label="Validations"
            onMouseEnter={() => setTabHover(2)}
            onMouseLeave={() => setTabHover(null)}
            sx={{
              transform: tabHover === 2 ? "translateY(-2px)" : "none",
            }}
          />
        </Tabs>

        {/* Contenu des onglets */}
        <Box sx={{ p: 0 }}>
          {/* Onglet Formations */}
          {activeTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "400px",
                    }}
                  >
                    <CircularProgress color="primary" />
                    <Typography variant="body1" ml={2} color="textSecondary">
                      Chargement des formations...
                    </Typography>
                  </Box>
                }
              >
                <FormationManagement />
              </Suspense>
            </Box>
          )}

          {/* Onglet Témoignages */}
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "400px",
                    }}
                  >
                    <CircularProgress color="primary" />
                    <Typography variant="body1" ml={2} color="textSecondary">
                      Chargement des témoignages...
                    </Typography>
                  </Box>
                }
              >
                <TestimonialManagement />
              </Suspense>
            </Box>
          )}

          {/* Onglet Validations */}
          {activeTab === 2 && (
            <Box sx={{ p: 2 }}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "400px",
                    }}
                  >
                    <CircularProgress color="primary" />
                    <Typography variant="body1" ml={2} color="textSecondary">
                      Chargement des validations...
                    </Typography>
                  </Box>
                }
              >
                <AdvertisementValidation />
              </Suspense>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ContentManagement;
