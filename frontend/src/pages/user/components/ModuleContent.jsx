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
  Chip,
  Avatar,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Quiz as QuizIcon,
  TextFields as TextIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import ReactPlayer from "react-player";
import DOMPurify from "dompurify";
import axios from "axios";
import QuizPlayer from "./QuizPlayer";

const ModuleContent = ({ module }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fonction pour normaliser les URLs YouTube
  const normalizeYoutubeUrl = (url) => {
    if (!url) return "";

    // Essayer d'extraire l'ID de la vidéo à partir de différents formats d'URL YouTube
    let videoId = "";

    // Format: youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^\/?&]+)/);
    if (shortMatch) videoId = shortMatch[1];

    // Format: youtube.com/watch?v=VIDEO_ID ou youtube.com/v/VIDEO_ID
    const standardMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|v\/)|youtube\.com\/embed\/)([^\/?&]+)/
    );
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

  // Fonction pour obtenir les informations de type de contenu
  const getContentTypeInfo = (type) => {
    const types = {
      text: {
        icon: <TextIcon />,
        label: "Contenu Texte",
        color: "primary",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        bgColor: isDarkMode
          ? "rgba(59, 130, 246, 0.1)"
          : "rgba(59, 130, 246, 0.05)",
      },
      video: {
        icon: <VideoIcon />,
        label: "Vidéo",
        color: "secondary",
        gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
        bgColor: isDarkMode
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(239, 68, 68, 0.05)",
      },
      pdf: {
        icon: <PdfIcon />,
        label: "Document PDF",
        color: "error",
        gradient: "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
        bgColor: isDarkMode
          ? "rgba(220, 38, 38, 0.1)"
          : "rgba(220, 38, 38, 0.05)",
      },
      quiz: {
        icon: <QuizIcon />,
        label: "Quiz",
        color: "success",
        gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
        bgColor: isDarkMode
          ? "rgba(16, 185, 129, 0.1)"
          : "rgba(16, 185, 129, 0.05)",
      },
    };
    return types[type] || types.text;
  };

  // Rendu du contenu selon le type de module
  const renderContent = () => {
    const contentTypeInfo = getContentTypeInfo(module.type);

    // Header du module avec type et titre
    const moduleHeader = (
      <Fade in timeout={600}>
        <Box
          sx={{
            mb: isMobile ? 2 : 3,
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 1.5 : 2,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            sx={{
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
              background: contentTypeInfo.gradient,
              boxShadow: `0 4px 12px ${alpha(
                theme.palette[contentTypeInfo.color].main,
                0.3
              )}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {contentTypeInfo.icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                fontWeight: 600,
                color: "text.primary",
                mb: 0.5,
              }}
            >
              {module.title || `Module ${module.type}`}
            </Typography>
            <Chip
              label={contentTypeInfo.label}
              size="small"
              sx={{
                background: contentTypeInfo.bgColor,
                color: theme.palette[contentTypeInfo.color].main,
                fontWeight: 500,
                fontSize: "0.75rem",
                height: isMobile ? 24 : 28,
              }}
            />
          </Box>
        </Box>
      </Fade>
    );

    switch (module.type) {
      case "text":
        return (
          <>
            {moduleHeader}
            <Fade in timeout={800}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 3,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                  boxShadow: isDarkMode
                    ? "0 4px 20px rgba(0, 0, 0, 0.3)"
                    : "0 4px 20px rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box
                  sx={{
                    lineHeight: 1.7,
                    fontSize: isMobile ? "0.95rem" : "1rem",
                    color: "text.primary",
                    "& h1": {
                      fontSize: isMobile ? "1.5rem" : "2rem",
                      fontWeight: 600,
                      margin: "1.5em 0 1em 0",
                      color: "text.primary",
                    },
                    "& h2": {
                      fontSize: isMobile ? "1.25rem" : "1.5rem",
                      fontWeight: 600,
                      margin: "1.25em 0 0.75em 0",
                      color: "text.primary",
                    },
                    "& h3": {
                      fontSize: isMobile ? "1.125rem" : "1.25rem",
                      fontWeight: 600,
                      margin: "1em 0 0.5em 0",
                      color: "text.primary",
                    },
                    "& p": {
                      margin: "0 0 1em 0",
                      "&:last-child": {
                        margin: 0,
                      },
                    },
                    "& ul, & ol": {
                      margin: "1em 0",
                      paddingLeft: "2em",
                    },
                    "& li": {
                      margin: "0.25em 0",
                    },
                    "& strong": {
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                    },
                    "& em": {
                      fontStyle: "italic",
                    },
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    },
                    "& blockquote": {
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      margin: "1em 0",
                      paddingLeft: "1em",
                      fontStyle: "italic",
                      background: alpha(theme.palette.primary.main, 0.05),
                      padding: "1em",
                      borderRadius: 1,
                    },
                    "& img": {
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: 2,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      margin: "1em 0",
                    },
                    "& pre": {
                      background: isDarkMode
                        ? "rgba(0, 0, 0, 0.3)"
                        : "rgba(0, 0, 0, 0.05)",
                      padding: "1em",
                      borderRadius: 1,
                      overflowX: "auto",
                      fontSize: "0.875rem",
                    },
                    "& code": {
                      background: alpha(theme.palette.primary.main, 0.1),
                      padding: "0.2em 0.4em",
                      borderRadius: "0.25em",
                      fontSize: "0.875em",
                      color: theme.palette.primary.main,
                    },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(module.content),
                  }}
                />
              </Paper>
            </Fade>
          </>
        );

      case "video":
        return (
          <>
            {moduleHeader}
            <Fade in timeout={800}>
              <Box>
                {videoError ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: isMobile ? 2 : 3,
                      borderRadius: 3,
                      background: isDarkMode
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                      border: "1px solid",
                      borderColor: isDarkMode
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(239, 68, 68, 0.15)",
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background:
                            "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                        }}
                      >
                        <ErrorOutlineIcon sx={{ color: "white" }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          Erreur de chargement vidéo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          La vidéo n'est pas disponible ou l'URL est invalide.
                        </Typography>
                      </Box>
                    </Box>
                    {!isMobile && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "monospace",
                          background: isDarkMode
                            ? "rgba(0, 0, 0, 0.3)"
                            : "rgba(0, 0, 0, 0.05)",
                          p: 1,
                          borderRadius: 1,
                          display: "block",
                          wordBreak: "break-all",
                        }}
                      >
                        URL: {module.video_url}
                      </Typography>
                    )}
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: isDarkMode
                        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
                        : "0 8px 32px rgba(0, 0, 0, 0.12)",
                      mb: 3,
                      background: "black",
                    }}
                  >
                    {loading && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 10,
                          background: "rgba(0, 0, 0, 0.7)",
                        }}
                      >
                        <CircularProgress color="primary" />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: "relative",
                        paddingTop: isMobile ? "56.25%" : "56.25%", // 16:9 aspect ratio
                      }}
                    >
                      <ReactPlayer
                        url={normalizeYoutubeUrl(module.video_url)}
                        width="100%"
                        height="100%"
                        controls
                        onReady={() => setLoading(false)}
                        onStart={() => setLoading(false)}
                        onError={(e) => {
                          console.error("Erreur de lecture vidéo:", e);
                          setVideoError(true);
                          setLoading(false);
                        }}
                        style={{ position: "absolute", top: 0, left: 0 }}
                        config={{
                          youtube: {
                            playerVars: {
                              origin: window.location.origin,
                              host: window.location.origin,
                              rel: 0,
                              modestbranding: 1,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {module.content && (
                  <Zoom in timeout={1000}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: 3,
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DescriptionIcon
                          sx={{
                            fontSize: isMobile ? 20 : 24,
                            color: "primary.main",
                          }}
                        />
                        Description
                      </Typography>
                      <Box
                        sx={{
                          lineHeight: 1.6,
                          fontSize: isMobile ? "0.95rem" : "1rem",
                          color: "text.secondary",
                          "& p": {
                            margin: "0 0 1em 0",
                            "&:last-child": {
                              margin: 0,
                            },
                          },
                          "& strong": {
                            fontWeight: 600,
                            color: "text.primary",
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(module.content),
                        }}
                      />
                    </Paper>
                  </Zoom>
                )}
              </Box>
            </Fade>
          </>
        );

      case "pdf":
        return (
          <>
            {moduleHeader}
            <Fade in timeout={800}>
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: isMobile ? 3 : 4,
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(220, 38, 38, 0.02) 100%)",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(220, 38, 38, 0.2)"
                      : "rgba(220, 38, 38, 0.15)",
                    textAlign: "center",
                    mb: 3,
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(220, 38, 38, 0.2)"
                      : "0 8px 32px rgba(220, 38, 38, 0.08)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: isMobile ? 2 : 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: isMobile ? 64 : 80,
                        height: isMobile ? 64 : 80,
                        background:
                          "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                        boxShadow: `0 8px 24px ${alpha(
                          theme.palette.error.main,
                          0.3
                        )}`,
                      }}
                    >
                      <PdfIcon
                        sx={{
                          fontSize: isMobile ? 36 : 48,
                          color: "white",
                        }}
                      />
                    </Avatar>
                    <Box>
                      <Typography
                        variant={isMobile ? "h6" : "h5"}
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: "text.primary",
                        }}
                      >
                        Document PDF
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                      >
                        Cliquez pour télécharger ou consulter le document
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="contained"
                        size={isMobile ? "medium" : "large"}
                        startIcon={<DownloadIcon />}
                        href={module.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          background:
                            "linear-gradient(135deg, #dc2626 0%, #ea580c 100%)",
                          borderRadius: 2,
                          px: isMobile ? 2 : 3,
                          py: isMobile ? 1 : 1.5,
                          fontWeight: 600,
                          boxShadow: `0 4px 12px ${alpha(
                            theme.palette.error.main,
                            0.3
                          )}`,
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #b91c1c 0%, #c2410c 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: `0 6px 16px ${alpha(
                              theme.palette.error.main,
                              0.4
                            )}`,
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        {isMobile ? "Télécharger" : "Télécharger le PDF"}
                      </Button>
                      <Tooltip title="Ouvrir dans un nouvel onglet">
                        <IconButton
                          href={module.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            background: alpha(theme.palette.error.main, 0.1),
                            color: "error.main",
                            "&:hover": {
                              background: alpha(theme.palette.error.main, 0.2),
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.3s ease",
                          }}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>

                {module.content && (
                  <Zoom in timeout={1000}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: 3,
                        background: isDarkMode
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DescriptionIcon
                          sx={{
                            fontSize: isMobile ? 20 : 24,
                            color: "error.main",
                          }}
                        />
                        Description
                      </Typography>
                      <Box
                        sx={{
                          lineHeight: 1.6,
                          fontSize: isMobile ? "0.95rem" : "1rem",
                          color: "text.secondary",
                          "& p": {
                            margin: "0 0 1em 0",
                            "&:last-child": {
                              margin: 0,
                            },
                          },
                          "& strong": {
                            fontWeight: 600,
                            color: "text.primary",
                          },
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(module.content),
                        }}
                      />
                    </Paper>
                  </Zoom>
                )}
              </Box>
            </Fade>
          </>
        );

      case "quiz":
        return (
          <>
            {moduleHeader}
            <Fade in timeout={800}>
              <Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: isMobile ? 2 : 3,
                    borderRadius: 3,
                    background: isDarkMode
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                    border: "1px solid",
                    borderColor: isDarkMode
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(16, 185, 129, 0.15)",
                    boxShadow: isDarkMode
                      ? "0 8px 32px rgba(16, 185, 129, 0.2)"
                      : "0 8px 32px rgba(16, 185, 129, 0.08)",
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant={isMobile ? "subtitle1" : "h6"}
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <QuizIcon
                        sx={{
                          fontSize: isMobile ? 20 : 24,
                          color: "success.main",
                        }}
                      />
                      Testez vos connaissances
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Répondez aux questions pour valider votre compréhension du
                      module.
                    </Typography>
                  </Box>
                  <QuizPlayer
                    moduleId={module.id}
                    onComplete={handleQuizComplete}
                  />
                </Paper>
              </Box>
            </Fade>
          </>
        );

      default:
        return (
          <>
            {moduleHeader}
            <Fade in timeout={800}>
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: 3,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(156, 163, 175, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(156, 163, 175, 0.05) 0%, rgba(156, 163, 175, 0.02) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(156, 163, 175, 0.2)"
                    : "rgba(156, 163, 175, 0.15)",
                  textAlign: "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    background:
                      "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
                    margin: "0 auto 16px auto",
                  }}
                >
                  <ErrorOutlineIcon sx={{ color: "white" }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Type de contenu non pris en charge
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ce type de module ({module.type}) n'est pas encore disponible.
                </Typography>
              </Paper>
            </Fade>
          </>
        );
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {renderContent()}
    </Box>
  );
};

export default ModuleContent;
