/**
 * Styles globaux pour les modals de l'application
 */

// Couleur de fond très foncée pour les modals en mode sombre
export const darkModeModalBgColor = "#1f2937"; // Couleur encore plus foncée (presque noire avec une légère teinte bleutée)

// Couleur de fond pour les modals en mode clair
export const lightModeModalBgColor = "#ffffff";

// Style pour l'overlay blur des modals
export const modalOverlayStyle = {
  backdropFilter: "blur(5px)",
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
};

// Style complet pour les modals (combine couleur de fond et overlay)
export const getModalStyle = (isDarkMode) => ({
  // Style pour le Paper du modal
  paperProps: {
    sx: {
      bgcolor: isDarkMode ? darkModeModalBgColor : lightModeModalBgColor,
    },
  },
  // Style pour l'overlay
  sx: modalOverlayStyle,
});
