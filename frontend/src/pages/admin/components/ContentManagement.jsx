import React, { useState, lazy, Suspense } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Badge,
} from "@mui/material";
import {
  School as SchoolIcon,
  Comment as CommentIcon,
  VerifiedUser as VerifiedUserIcon,
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
  const { pendingCount: pendingFormations, loading: loadingFormations } =
    usePendingFormations();
  const { pendingCount: pendingTestimonials, loading: loadingTestimonials } =
    usePendingTestimonials();
  const { pendingCount: pendingPublications, loading: loadingPublications } =
    usePendingPublications();

  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu du composant
  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 700,
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
          color: isDarkMode ? "#fff" : "#111827",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            borderRadius: 2,
            background: isDarkMode
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(59, 130, 246, 0.3)"
              : "0 4px 12px rgba(59, 130, 246, 0.2)",
          }}
        >
          <VerifiedUserIcon sx={{ fontSize: { xs: 18, sm: 22 }, color: "#fff" }} />
        </Box>
        Gestion du Contenu
      </Typography>

      {/* Onglets avec design moderne */}
      <Paper
        elevation={0}
        sx={{
          p: 0,
          mb: { xs: 2, sm: 3 },
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: { xs: 2, sm: 3 },
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          border: isDarkMode ? "1px solid rgba(55, 65, 81, 0.5)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)"
            : "0 10px 30px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
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
              background: isDarkMode
                ? "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"
                : "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)",
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
              gap: { xs: 0.5, sm: 1 },
              px: { xs: 0.5, sm: 1 },
              pt: { xs: 0.5, sm: 1 },
            },
            "& .MuiTab-root": {
              minHeight: { xs: 44, sm: 48 },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1, sm: 1.5 },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "10px 10px 0 0",
              fontWeight: 500,
              textTransform: "none",
              fontSize: { xs: "0.8125rem", sm: "0.875rem", md: "0.9375rem" },
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(37, 99, 235, 0.08)",
                color: isDarkMode ? "#60a5fa" : "#3b82f6",
                transform: "translateY(-2px)",
              },
              "&.Mui-selected": {
                color: isDarkMode ? "#60a5fa" : "#2563eb",
                fontWeight: 600,
                backgroundColor: isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(37, 99, 235, 0.05)",
              },
            },
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": {
                opacity: 0.3,
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
                    fontSize: { xs: "0.625rem", sm: "0.65rem" },
                    padding: "0 4px",
                    minWidth: { xs: 16, sm: 18 },
                    height: { xs: 16, sm: 18 },
                    fontWeight: 600,
                  },
                }}
              >
                <SchoolIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                    fontSize: { xs: "0.625rem", sm: "0.65rem" },
                    padding: "0 4px",
                    minWidth: { xs: 16, sm: 18 },
                    height: { xs: 16, sm: 18 },
                    fontWeight: 600,
                  },
                }}
              >
                <CommentIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                    fontSize: { xs: "0.625rem", sm: "0.65rem" },
                    padding: "0 4px",
                    minWidth: { xs: 16, sm: 18 },
                    height: { xs: 16, sm: 18 },
                    fontWeight: 600,
                  },
                }}
              >
                <VerifiedUserIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                    <Typography 
                      variant="body2" 
                      ml={2} 
                      color="textSecondary"
                      sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                    >
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
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                    <Typography 
                      variant="body2" 
                      ml={2} 
                      color="textSecondary"
                      sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                    >
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
            <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
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
                    <Typography 
                      variant="body2" 
                      ml={2} 
                      color="textSecondary"
                      sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                    >
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
