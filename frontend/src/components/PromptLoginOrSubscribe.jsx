import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";
import { Login as LoginIcon, InfoOutlined } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Component: PromptLoginOrSubscribe
 * This component is displayed to unauthenticated users when they click "Je suis intéressé !" on an ad.
 * It prompts the user to either log in or subscribe to an investment pack.
 *
 * - Shows a login button that navigates to the login page.
 * - Lists available investment packs with a "Souscrire maintenant" button for each.
 * - Reuses UI patterns and logic from Packages.jsx for consistency.
 * - Includes detailed comments for maintainability.
 */
export default function PromptLoginOrSubscribe() {
  const navigate = useNavigate();

  // Handler for login button
  const handleLogin = () => {
    navigate("/login");
  };

  // Handler for "Découvrir nos packs" button
  const handleDiscoverPacks = () => {
    const section = document.getElementById("packages");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { isDarkMode } = useTheme();

  // Styles dynamiques selon le thème
  const bgColor = isDarkMode
    ? "#2a3441" // fond carte dark
    : "#f9fafb";
  const textColor = isDarkMode ? "#fff" : "#222";
  const infoIconColor = isDarkMode ? "#4CAF50" : "#2E7D32";
  const boxShadow = isDarkMode
    ? "0 4px 32px 0 rgba(46,125,50,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.22)"
    : "0 2px 12px rgba(0,0,0,0.09)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background: isDarkMode ? "#1f2937" : "#f9fafb",
        minHeight: "100vh",
        minWidth: "100vw",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 4 },
          maxWidth: 700,
          margin: "0 auto",
          borderRadius: 4,
          boxShadow,
          bgcolor: bgColor,
          border: "none",
          position: "relative",
          color: textColor,
          backdropFilter: isDarkMode ? "blur(2.5px)" : undefined,
        }}
      >
        {/* Icône info animée */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 10,
            delay: 0.15,
          }}
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <InfoOutlined
            sx={{
              fontSize: 48,
              color: infoIconColor,
              filter: isDarkMode ? "drop-shadow(0 0 8px #4CAF50)" : undefined,
            }}
          />
        </motion.div>

        {/* Titre et instructions */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, textAlign: "center", letterSpacing: 1 }}
        >
          Connectez-vous ou découvrez nos packs d'investissement !
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 3, textAlign: "center", fontSize: { xs: 16, sm: 18 } }}
        >
          Etes-vous déjà membre de SOLIFIN, si c'est le cas, veuillez vous
          connecter
          <motion.span
            whileHover={{
              scale: 1.12,
              color: isDarkMode ? "#4CAF50" : "#2E7D32",
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              color: isDarkMode ? "#4CAF50" : "#2E7D32",
              fontWeight: "bold",
              cursor: "pointer",
              marginLeft: 4,
              marginRight: 4,
              display: "inline",
              background: "none",
              border: "none",
              padding: 0,
            }}
            onClick={handleLogin}
          >
            ICI
          </motion.span>
          pour profiter pleinement de cette publication, des offres d'emploi,
          des opportunités d'affaires, des appels à projet, ... et bien d'autres
          services à votre disposition, sinon
          <motion.span
            whileHover={{
              scale: 1.1,
              color: isDarkMode ? "#81c784" : "#1B5E20",
            }}
            style={{
              color: isDarkMode ? "#4CAF50" : "#2E7D32",
              fontWeight: "bold",
              cursor: "pointer",
              display: "block",
              marginTop: 18,
            }}
            onClick={() => {
              navigate("/", { state: { scrollToPackages: true } });
            }}
          >
            Découvrez nos packs d'investissement
          </motion.span>
          et commencez votre aventure avec SOLIFIN.
          <motion.span
            whileHover={{
              scale: 1.1,
              color: isDarkMode ? "#81c784" : "#1B5E20",
            }}
            style={{
              color: isDarkMode ? "#4CAF50" : "#2E7D32",
              fontWeight: "bold",
              cursor: "pointer",
              display: "block",
              marginTop: 18,
            }}
            onClick={() => navigate("/")}
          >
            Retourner à l'accueil
          </motion.span>
        </Typography>

        {/* Boutons d'action */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                fontSize: 18,
                borderRadius: 3,
                boxShadow: 2,
                transition: "all 0.2s",
              }}
            >
              Se connecter
            </Button>
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
}
