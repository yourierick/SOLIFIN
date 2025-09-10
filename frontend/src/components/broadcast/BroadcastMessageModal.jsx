import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Button,
  Fade,
  Grow,
  Zoom,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
  Avatar,
  Chip,
  Paper,
} from "@mui/material";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  BellIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Modal pour afficher les messages de diffusion aux utilisateurs
 *
 * Ce composant affiche les messages de diffusion un par un
 * avec la possibilité de naviguer entre eux ou de les fermer.
 *
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - État d'ouverture du modal
 * @param {function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Array} props.messages - Liste des messages à afficher
 * @param {function} props.onMessageSeen - Fonction appelée quand un message est vu
 */
const BroadcastMessageModal = ({
  open,
  onClose,
  messages = [],
  onMessageSeen,
}) => {
  const { isDarkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [animateIcon, setAnimateIcon] = useState(false);
  const iconRef = useRef(null);

  // Animation pour l'icône
  useEffect(() => {
    if (fadeIn) {
      setTimeout(() => {
        setAnimateIcon(true);
      }, 200);
    } else {
      setAnimateIcon(false);
    }
  }, [fadeIn]);

  // Mettre à jour le message courant lorsque l'index change ou que les messages changent
  useEffect(() => {
    if (messages && messages.length > 0 && currentIndex < messages.length) {
      setCurrentMessage(messages[currentIndex]);

      // Marquer le message comme vu
      if (onMessageSeen && messages[currentIndex]) {
        onMessageSeen(messages[currentIndex].id);
      }
    } else {
      setCurrentMessage(null);
    }
  }, [currentIndex, messages, onMessageSeen]);

  // Si pas de message à afficher, ne pas rendre le modal
  if (!currentMessage || messages.length === 0) {
    return null;
  }

  // Gérer la navigation vers le message précédent
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setFadeIn(true);
      }, 300);
    }
  };

  // Gérer la navigation vers le message suivant
  const handleNext = () => {
    if (currentIndex < messages.length - 1) {
      setFadeIn(false);
      setAnimateIcon(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setFadeIn(true);
      }, 300);
    } else {
      // Si c'est le dernier message, fermer le modal
      onClose();
    }
  };

  // Obtenir l'icône appropriée pour le type de message
  const getMessageIcon = () => {
    switch (currentMessage.type) {
      case "image":
        return (
          <PhotoIcon
            className="h-8 w-8"
            style={{ color: isDarkMode ? "#60a5fa" : "#3b82f6" }}
          />
        );
      case "video":
        return (
          <FilmIcon
            className="h-8 w-8"
            style={{ color: isDarkMode ? "#f472b6" : "#ec4899" }}
          />
        );
      case "text":
      default:
        return (
          <DocumentTextIcon
            className="h-8 w-8"
            style={{ color: isDarkMode ? "#a78bfa" : "#8b5cf6" }}
          />
        );
    }
  };

  // Rendu du contenu en fonction du type de message
  const renderMessageContent = () => {
    switch (currentMessage.type) {
      case "image":
        return (
          <Fade in={fadeIn} timeout={400}>
            <Box
              sx={{
                textAlign: "center",
                mb: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Zoom
                in={animateIcon}
                timeout={500}
                style={{ transitionDelay: animateIcon ? "200ms" : "0ms" }}
              >
                <Avatar
                  sx={{
                    bgcolor: isDarkMode
                      ? "rgba(96, 165, 250, 0.2)"
                      : "rgba(59, 130, 246, 0.1)",
                    width: 60,
                    height: 60,
                    mb: 2,
                    animation: animateIcon ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                      "0%": {
                        boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)",
                      },
                      "70%": {
                        boxShadow: "0 0 0 10px rgba(59, 130, 246, 0)",
                      },
                      "100%": {
                        boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
                      },
                    },
                  }}
                >
                  <PhotoIcon
                    className="h-8 w-8"
                    style={{
                      color: isDarkMode ? "#60a5fa" : "#3b82f6",
                    }}
                  />
                </Avatar>
              </Zoom>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "10px",
                  boxShadow: isDarkMode
                    ? "0 8px 16px rgba(0, 0, 0, 0.5)"
                    : "0 8px 16px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                  maxHeight: "40vh", // Limite la hauteur des images
                }}
              >
                <img
                  src={currentMessage.media_url}
                  alt={currentMessage.title}
                  style={{
                    width: "100%",
                    maxHeight: "450px",
                    objectFit: "contain",
                  }}
                />
              </Box>
              <Fade
                in={fadeIn}
                timeout={800}
                style={{ transitionDelay: "300ms" }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: "8px",
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    maxWidth: "90%",
                    lineHeight: 1.6,
                    boxShadow: isDarkMode
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {currentMessage.description}
                </Typography>
              </Fade>
            </Box>
          </Fade>
        );
      case "video":
        return (
          <Fade in={fadeIn} timeout={400}>
            <Box
              sx={{
                textAlign: "center",
                mb: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Zoom
                in={animateIcon}
                timeout={500}
                style={{ transitionDelay: animateIcon ? "200ms" : "0ms" }}
              >
                <Avatar
                  sx={{
                    bgcolor: isDarkMode
                      ? "rgba(244, 114, 182, 0.2)"
                      : "rgba(236, 72, 153, 0.1)",
                    width: 60,
                    height: 60,
                    mb: 2,
                    animation: animateIcon ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                      "0%": {
                        boxShadow: "0 0 0 0 rgba(236, 72, 153, 0.4)",
                      },
                      "70%": {
                        boxShadow: "0 0 0 10px rgba(236, 72, 153, 0)",
                      },
                      "100%": {
                        boxShadow: "0 0 0 0 rgba(236, 72, 153, 0)",
                      },
                    },
                  }}
                >
                  <FilmIcon
                    className="h-8 w-8"
                    style={{
                      color: isDarkMode ? "#f472b6" : "#ec4899",
                    }}
                  />
                </Avatar>
              </Zoom>
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "10px",
                  boxShadow: isDarkMode
                    ? "0 8px 16px rgba(0, 0, 0, 0.5)"
                    : "0 8px 16px rgba(0, 0, 0, 0.1)",
                  maxHeight: "40vh", // Limite la hauteur des vidéos
                }}
              >
                <video
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "450px",
                  }}
                >
                  <source src={currentMessage.media_url} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              </Box>
              <Fade
                in={fadeIn}
                timeout={800}
                style={{ transitionDelay: "300ms" }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    px: 3,
                    py: 2,
                    borderRadius: "8px",
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    maxWidth: "90%",
                    lineHeight: 1.6,
                    boxShadow: isDarkMode
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {currentMessage.description}
                </Typography>
              </Fade>
            </Box>
          </Fade>
        );
      case "text":
      default:
        return (
          <Fade in={fadeIn} timeout={400}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: isMobile ? "200px" : "300px",
                px: 2,
                width: "100%", // Assure que la boîte prend toute la largeur disponible
              }}
            >
              <Fade
                in={fadeIn}
                timeout={800}
                style={{ transitionDelay: "300ms" }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    mb: 1,
                    textAlign: "center",
                    width: "95%",
                    lineHeight: 1.6,
                    fontSize: "1.05rem",
                    color: isDarkMode ? "#f3f4f6" : "#fff",
                    px: 2,
                    py: 1.5,
                    borderRadius: "10px",
                    boxShadow: isDarkMode
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.2)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    border: isDarkMode
                      ? "1px solid rgba(74, 222, 128, 0.2)"
                      : "1px solid rgba(74, 222, 128, 0.3)",
                  }}
                >
                  {currentMessage.description}
                </Typography>
              </Fade>
            </Box>
          </Fade>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Grow}
      transitionDuration={400}
      PaperProps={{
        sx: {
          background: isDarkMode
            ? "linear-gradient(135deg, rgb(31, 41, 55) 0%, rgb(17, 24, 39) 100%)"
            : "linear-gradient(135deg,rgb(62, 107, 66) 0%,rgb(23, 142, 33) 100%)",
          color: isDarkMode ? "white" : "#1e4620",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          maxHeight: "85vh", // Limite la hauteur maximale du modal
          display: "flex",
          flexDirection: "column",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100px",
            background: isDarkMode
              ? "radial-gradient(circle at top center, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0) 70%)"
              : "radial-gradient(circle at top center, rgba(74, 222, 128, 0.4) 0%, rgba(74, 222, 128, 0) 70%)",
            zIndex: 0,
            pointerEvents: "none",
          },
        },
      }}
      sx={{
        "& .MuiBackdrop-root": {
          backdropFilter: "blur(8px)",
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.85)"
            : "rgba(0, 0, 0, 0.65)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 0,
          py: 2,
          px: 2,
          backgroundColor: "transparent",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            position: "relative",
          }}
        >
          <Zoom in={true} timeout={500}>
            <Avatar
              sx={{
                bgcolor: isDarkMode
                  ? "rgba(74, 222, 128, 0.2)"
                  : "rgba(245, 245, 245, 0.8)",
                width: 50,
                height: 50,
                boxShadow: "0 0 20px rgba(74, 222, 128, 0.4)",
                mb: 1,
                animation: "bellRing 2s infinite",
                "@keyframes bellRing": {
                  "0%": { transform: "rotate(0deg)" },
                  "5%": { transform: "rotate(15deg)" },
                  "10%": { transform: "rotate(-15deg)" },
                  "15%": { transform: "rotate(10deg)" },
                  "20%": { transform: "rotate(-10deg)" },
                  "25%": { transform: "rotate(5deg)" },
                  "30%": { transform: "rotate(-5deg)" },
                  "35%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(0deg)" },
                },
              }}
            >
              <BellIcon
                className="h-7 w-7"
                style={{
                  color: isDarkMode ? "#4ade80" : "#166534",
                }}
              />
            </Avatar>
          </Zoom>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: "1.15rem",
              color: isDarkMode ? "#f3f4f6" : "#fff",
              mb: 1,
              textAlign: "center",
            }}
          >
            {currentMessage.title}
          </Typography>
          <Fade in={true} timeout={800}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
            >
              <Chip
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                label={new Date(currentMessage.created_at).toLocaleDateString()}
                size="small"
                sx={{
                  bgcolor: isDarkMode ? "rgba(74, 222, 128, 0.2)" : "#fff",
                  color: isDarkMode ? "#4ade80" : "#166534",
                  fontSize: "0.75rem",
                  height: 24,
                  border: isDarkMode
                    ? "1px solid rgba(74, 222, 128, 0.3)"
                    : "1px solid rgba(74, 222, 128, 0.5)",
                }}
              />
              <Chip
                icon={<CheckCircleIcon className="h-4 w-4" />}
                label={currentIndex + 1 + "/" + messages.length}
                size="small"
                sx={{
                  bgcolor: isDarkMode ? "rgba(74, 222, 128, 0.3)" : "#fff",
                  color: isDarkMode ? "#4ade80" : "#166534",
                  fontSize: "0.75rem",
                  height: 24,
                  border: isDarkMode
                    ? "1px solid rgba(74, 222, 128, 0.3)"
                    : "1px solid rgba(74, 222, 128, 0.5)",
                }}
              />
            </Box>
          </Fade>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: isDarkMode ? "#4ade80" : "#fff",
            bgcolor: isDarkMode
              ? "rgba(74, 222, 128, 0.1)"
              : "rgba(74, 222, 128, 0.1)",
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(74, 222, 128, 0.2)"
                : "rgba(74, 222, 128, 0.2)",
            },
          }}
        >
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          pt: 0,
          pb: 0,
          px: isMobile ? 2 : 3,
          maxHeight: "65vh", // Limite la hauteur maximale à 65% de la hauteur de la fenêtre
          overflow: "auto", // Ajoute un ascenseur automatique si nécessaire
          scrollbarWidth: "thin", // Pour Firefox
          "&::-webkit-scrollbar": {
            // Pour Chrome, Safari, etc.
            width: "8px",
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDarkMode
              ? "rgba(74, 222, 128, 0.3)"
              : "rgba(74, 222, 128, 0.3)",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(74, 222, 128, 0.5)"
                : "rgba(74, 222, 128, 0.5)",
            },
          },
          // Assure que le contenu du modal ne déborde pas
          overflowX: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {renderMessageContent()}

        <Divider
          sx={{
            my: 2,
            borderColor: isDarkMode
              ? "rgba(74, 222, 128, 0.3)"
              : "rgba(74, 222, 128, 0.3)",
            opacity: 0.8,
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "50px",
              height: "3px",
              borderRadius: "3px",
              backgroundColor: isDarkMode
                ? "rgba(74, 222, 128, 0.3)"
                : "rgba(74, 222, 128, 0.3)",
            },
          }}
        >
          <Button
            startIcon={<ChevronLeftIcon className="h-4 w-4" />}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            sx={{
              color: isDarkMode ? "rgba(74, 222, 128, 0.7)" : "#fff",
              "&.Mui-disabled": {
                color: isDarkMode ? "rgba(74, 222, 128, 0.3)" : "#9f9f9f",
              },
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(74, 222, 128, 0.1)"
                  : "rgba(74, 222, 128, 0.1)",
              },
            }}
          >
            {isMobile ? "" : "Précédent"}
          </Button>
          <Typography
            variant="body2"
            sx={{
              alignSelf: "center",
              px: 2,
              py: 0.5,
              borderRadius: "16px",
              backgroundColor: isDarkMode ? "rgba(74, 222, 128, 0.2)" : "#fff",
              color: isDarkMode ? "#4ade80" : "#166534",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            {currentIndex + 1} / {messages.length}
          </Typography>
          <Button
            endIcon={
              currentIndex < messages.length - 1 ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : null
            }
            onClick={handleNext}
            variant={currentIndex < messages.length - 1 ? "text" : "contained"}
            sx={{
              color:
                currentIndex < messages.length - 1
                  ? isDarkMode
                    ? "rgba(74, 222, 128, 0.7)"
                    : "#166534"
                  : isDarkMode
                  ? "#0f172a"
                  : "white",
              backgroundColor:
                currentIndex < messages.length - 1
                  ? "transparent"
                  : isDarkMode
                  ? "#4ade80"
                  : "#166534",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor:
                  currentIndex < messages.length - 1
                    ? isDarkMode
                      ? "rgba(74, 222, 128, 0.1)"
                      : "rgba(74, 222, 128, 0.1)"
                    : isDarkMode
                    ? "#22c55e"
                    : "#15803d",
              },
            }}
          >
            {currentIndex < messages.length - 1
              ? isMobile
                ? ""
                : "Suivant"
              : "Fermer"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastMessageModal;
