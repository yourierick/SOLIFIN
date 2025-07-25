import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  Button,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  useMediaQuery,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import ReactPlayer from "react-player";
import DOMPurify from "dompurify";
import axios from "axios";
import QuizPlayer from "./QuizPlayer";

const ModuleContent = ({ module }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [error, setError] = useState(null);
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
  
  // Fonction appelée lorsque le quiz est terminé
  const handleQuizComplete = (results) => {
    // Cette fonction peut être utilisée si vous avez besoin de faire quelque chose
    // après que l'utilisateur a terminé le quiz
    console.log("Quiz terminé avec les résultats:", results);
  };

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
                "& img": {
                  maxWidth: "100%",
                  height: "auto",
                },
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
              onComplete={handleQuizComplete} 
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

  return <Box>{renderContent()}</Box>;
};

export default ModuleContent;
