import React, { useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  useMediaQuery,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import ReactPlayer from "react-player";
import DOMPurify from "dompurify";
import QuizPlayer from "../../user/components/QuizPlayer";

/**
 * Composant pour afficher le contenu d'un module dans l'interface d'administration
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.module - Le module à afficher
 * @returns {JSX.Element} Le composant AdminModuleViewer
 */
const AdminModuleViewer = ({ module }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [videoError, setVideoError] = useState(false);
  
  // Fonction pour normaliser les URLs YouTube
  const normalizeYoutubeUrl = (url) => {
    if (!url) return "";
    
    // Essayer d'extraire l'ID de la vidéo à partir de différents formats d'URL YouTube
    let videoId = "";
    
    // Format: youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^\/?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
    
    // Format: youtube.com/watch?v=VIDEO_ID ou youtube.com/v/VIDEO_ID
    const standardMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|v\/)|youtube\.com\/embed\/)([^\/?&]+)/);
    if (standardMatch) videoId = standardMatch[1];
    
    // Si on a trouvé un ID, construire une URL canonique
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    // Si on n'a pas pu extraire l'ID, retourner l'URL d'origine
    return url;
  };

  if (!module) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Aucun module sélectionné.
      </Alert>
    );
  }

  // Rendu du contenu selon le type de module
  const renderContent = () => {
    switch (module.type) {
      case "text":
        return (
          <Box sx={{ mt: 2 }}>
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(module.content),
              }}
              style={{
                lineHeight: 1.6,
              }}
            />
          </Box>
        );

      case "video":
        return (
          <Box sx={{ mt: 2 }}>
            {videoError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erreur de chargement de la vidéo. L'URL fournie pourrait être invalide ou la vidéo n'est pas disponible.
                <br />
                URL: {module.video_url}
              </Alert>
            ) : (
              <Box
                sx={{
                  position: "relative",
                  paddingTop: "56.25%", // 16:9 aspect ratio
                  mb: 2,
                }}
              >
                <ReactPlayer
                  url={normalizeYoutubeUrl(module.video_url)}
                  width="100%"
                  height="100%"
                  controls
                  onError={(e) => {
                    console.error("Erreur de lecture vidéo:", e);
                    setVideoError(true);
                  }}
                  style={{ position: "absolute", top: 0, left: 0 }}
                  config={{
                    youtube: {
                      playerVars: {
                        origin: window.location.origin,
                        host: window.location.origin,
                      },
                    },
                  }}
                />
              </Box>
            )}

            {module.content && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(module.content),
                  }}
                />
              </Box>
            )}
          </Box>
        );

      case "pdf":
        return (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 3,
                textAlign: "center",
                mb: 3,
              }}
            >
              <PdfIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Document PDF
              </Typography>
              <Button
                variant="contained"
                color="primary"
                href={module.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Télécharger le PDF
              </Button>
            </Box>

            {module.content && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(module.content),
                  }}
                />
              </Box>
            )}
          </Box>
        );

      case "quiz":
        return (
          <Box sx={{ mt: 2 }}>
            <QuizPlayer 
              moduleId={module.id} 
              onComplete={(results) => console.log("Quiz terminé avec les résultats:", results)}
              readOnly={true} // Mode lecture seule pour l'administrateur
            />
          </Box>
        );

      default:
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            Type de contenu non pris en charge.
          </Alert>
        );
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {module.title}
      </Typography>
      {module.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {module.description}
        </Typography>
      )}
      {renderContent()}
    </Box>
  );
};

export default AdminModuleViewer;
