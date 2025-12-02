import React, { useState, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Paper,
  useTheme as useMuiTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SpeedIcon from "@mui/icons-material/Speed";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../contexts/ThemeContext";
import PurchasePackForm from "../../components/PurchasePackForm";
import axios from "../../utils/axios";

// Style pour les cartes de pack
const PackCard = styled(Card, {
  // Éviter que isDarkMode ne soit transmis à l'élément DOM
  shouldForwardProp: (prop) => prop !== "isDarkMode" && prop !== "featured",
})(({ theme, featured, isDarkMode }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", // Courbe plus dynamique
  overflow: "visible",
  borderRadius: "24px", // Coins plus arrondis
  border: featured ? `2px solid ${theme.palette.primary.main}` : "1px solid",
  borderColor: isDarkMode ? "rgba(76, 78, 209, 0.15)" : "rgba(0, 0, 0, 0.08)",
  backgroundColor: isDarkMode
    ? featured
      ? "rgba(46, 125, 50, 0.15)" // Plus visible en mode sombre
      : "#1a2234"
    : featured
    ? "rgba(46, 125, 50, 0.06)" // Plus visible en mode clair
    : theme.palette.background.paper,
  boxShadow: featured
    ? isDarkMode
      ? "0 10px 30px rgba(0, 0, 0, 0.25), 0 0 10px rgba(46, 125, 50, 0.2)" // Double ombre avec lueur verte
      : "0 10px 30px rgba(0, 0, 0, 0.18), 0 0 15px rgba(46, 125, 50, 0.15)"
    : "0 4px 12px rgba(0, 0, 0, 0.06)",
  "&:hover": {
    transform: "translateY(-12px) scale(1.03)", // Mouvement plus prononcé
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.2)",
  },
  "&::before": featured
    ? {
        content: '""',
        position: "absolute",
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: "26px",
        background:
          "linear-gradient(45deg, rgba(46, 125, 50, 0.4), transparent, rgba(46, 125, 50, 0.4))",
        zIndex: -1,
        opacity: 0.6,
      }
    : {},
}));

// Style pour les avantages
const AdvantageItem = styled("li")(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  display: "flex",
  alignItems: "flex-start",
  padding: "6px 8px", // Padding plus important pour meilleure lisibilité
  borderRadius: "8px",
  transition: "all 0.3s ease",
  position: "relative",
  zIndex: 1,
  "&:hover": {
    transform: "translateX(8px)",
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.05)"
        : "rgba(0,0,0,0.02)",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    left: "-5px",
    width: "3px",
    height: "0%",
    backgroundColor: theme.palette.primary.main,
    borderRadius: "3px",
    transition: "height 0.3s ease",
    opacity: 0,
    zIndex: -1,
  },
  "&:hover::before": {
    height: "80%",
    opacity: 0.7,
  },
}));

const PriceTag = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "-18px",
  right: "24px",
  padding: "12px 22px",
  borderRadius: "30px",
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.primary.contrastText,
  fontWeight: "bold",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
  zIndex: 1,
  fontSize: "1.15rem",
  letterSpacing: "0.6px",
  transform: "rotate(3deg)",
  border: "2px solid rgba(255,255,255,0.2)",
  backdropFilter: "blur(5px)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "rotate(0deg) scale(1.05)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
  },
}));

const FeaturedBadge = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: "-18px",
  left: "24px",
  fontWeight: "bold",
  background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
  color: theme.palette.secondary.contrastText,
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
  zIndex: 1,
  padding: "0 8px",
  height: "36px",
  transform: "rotate(-3deg)",
  border: "2px solid rgba(255,255,255,0.2)",
  transition: "all 0.3s ease",
  animation: "pulse 2s infinite",
  "@keyframes pulse": {
    "0%": { boxShadow: "0 0 0 0 rgba(156, 39, 176, 0.4)" },
    "70%": { boxShadow: "0 0 0 10px rgba(156, 39, 176, 0)" },
    "100%": { boxShadow: "0 0 0 0 rgba(156, 39, 176, 0)" },
  },
  "&:hover": {
    transform: "rotate(0deg) scale(1.05)",
  },
}));

const Packs = () => {
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { createChatRoom, setActiveRoom, setIsChatExpanded, fetchChatRooms } = useChat();
  const { selectedCurrency } = useCurrency();

  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingSupport, setLoadingSupport] = useState(false);

  useEffect(() => {
    const fetchPacks = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/user/purchase/new/packs");
        if (response.data.success) {
          // Ajouter une propriété featured au pack le plus populaire
          const packsWithFeatured = response.data.data
            .filter((pack) => pack.status)
            .map((pack, index) => ({
              ...pack,
              featured: index === 1, // Marquer le deuxième pack comme vedette (généralement l'offre standard)
            }));
          setPacks(packsWithFeatured);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des packs:", error);
        showToast("Impossible de charger les packs disponibles", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  const handlePurchaseClick = (pack) => {
    // Vérifier si la devise est CDF et que le pack n'a pas de prix CDF
    if (selectedCurrency === "CDF" && (!pack.cdf_price || pack.cdf_price === null || pack.cdf_price === 0)) {
      toast.error("Ce pack n'est pas disponible en devise CDF");
      return;
    }
    
    setSelectedPack(pack);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseClose = () => {
    setPurchaseDialogOpen(false);
    setSelectedPack(null);
  };

  // Fonction pour contacter le support (approche intégrée)
  const handleContactSupport = async () => {
    try {
      setLoadingSupport(true);
      const response = await axios.get('/api/support/contact');
      
      if (response.data && response.data.room_id) {
        // Récupérer toutes les salles de chat
        await fetchChatRooms();
        
        // Trouver la salle correspondante dans la liste des salles
        const rooms = await axios.get('/api/chat/rooms');
        const supportRoom = rooms.data.rooms.find(room => room.id === response.data.room_id);
        
        if (supportRoom) {
          // Définir cette salle comme salle active
          setActiveRoom(supportRoom);
          
          // Ouvrir automatiquement la fenêtre de chat
          setIsChatExpanded(true);
          
          showToast('Conversation avec le support ouverte', 'success');
        } else {
          showToast('Erreur lors de la récupération des détails de la conversation', 'error');
        }
      } else {
        showToast('Erreur lors de la connexion avec le support', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion avec le support:', error);
      showToast('Erreur lors de la connexion avec le support', 'error');
    } finally {
      setLoadingSupport(false);
    }
  };

  // Fonction pour obtenir l'icône appropriée pour chaque avantage
  const getAdvantageIcon = (text) => {
    if (
      text.toLowerCase().includes("premium") ||
      text.toLowerCase().includes("prioritaire")
    ) {
      return (
        <StarOutlineIcon
          fontSize="small"
          color="secondary"
          sx={{ mr: 1, mt: 0.5 }}
        />
      );
    } else if (
      text.toLowerCase().includes("boost") ||
      text.toLowerCase().includes("rapide")
    ) {
      return (
        <BoltIcon fontSize="small" color="warning" sx={{ mr: 1, mt: 0.5 }} />
      );
    } else if (
      text.toLowerCase().includes("réduction") ||
      text.toLowerCase().includes("économie")
    ) {
      return (
        <LocalOfferIcon
          fontSize="small"
          color="error"
          sx={{ mr: 1, mt: 0.5 }}
        />
      );
    } else {
      return (
        <CheckCircleOutlineIcon
          fontSize="small"
          color="primary"
          sx={{ mr: 1, mt: 0.5 }}
        />
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={50} thickness={4} />
        <Typography variant="body1" color="textSecondary">
          Chargement des packs disponibles...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={4} alignItems="stretch">
        {packs.map((pack, index) => (
          <Zoom
            in={true}
            style={{
              transitionDelay: `${Math.min(index * 100, 500)}ms`, // Limite le délai maximum à 500ms
              transformOrigin: "center top",
            }}
            timeout={700} // Durée optimisée
            key={pack.id}
          >
            <Grid item xs={12} sm={6} md={4} sx={{ display: "flex" }}>
              <PackCard
                featured={pack.featured}
                elevation={pack.featured ? 8 : 2}
                isDarkMode={isDarkMode}
              >
                {pack.featured && (
                  <FeaturedBadge
                    label="POPULAIRE"
                    icon={<StarOutlineIcon fontSize="small" />}
                    sx={{
                      backgroundColor: isDarkMode
                        ? "rgba(59, 25, 180, 0.8)"
                        : "rgba(59, 25, 180, 0.7)",
                    }}
                  />
                )}
                <PriceTag>
                  {pack.price}$/{pack.abonnement}
                </PriceTag>

                <CardContent sx={{ flexGrow: 1, pt: 4, pb: 2 }}>
                  <Box sx={{ position: "relative", mb: 3 }}>
                    <Typography
                      variant="h5"
                      component="div"
                      gutterBottom
                      fontWeight="bold"
                      color={pack.featured ? "primary" : "textPrimary"}
                      sx={{
                        mb: 2,
                        display: "inline-block",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {pack.name}
                      {pack.featured && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "100%",
                            height: "30%",
                            backgroundColor: "rgba(46, 125, 50, 0.2)",
                            zIndex: -1,
                            borderRadius: "4px",
                          }}
                        />
                      )}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{
                      mb: 3,
                      minHeight: isMobile ? "auto" : "60px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.6,
                      fontSize: "0.95rem",
                    }}
                  >
                    {pack.description}
                  </Typography>

                  <Divider
                    sx={{
                      my: 2.5,
                      borderColor: pack.featured
                        ? "rgba(46, 125, 50, 0.3)"
                        : undefined,
                      opacity: isDarkMode ? 0.3 : 0.7,
                    }}
                  />

                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      color: pack.featured ? "primary.main" : "text.primary",
                    }}
                  >
                    <StarOutlineIcon sx={{ mr: 1, fontSize: "1.1rem" }} />
                    Avantages inclus:
                  </Typography>

                  {pack.avantages && (
                    <Box
                      component="ul"
                      sx={{
                        pl: 0,
                        listStyleType: "none",
                        backgroundColor: isDarkMode
                          ? "rgba(0,0,0,0.1)"
                          : "rgba(0,0,0,0.02)",
                        borderRadius: "12px",
                        p: 2,
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      {pack.avantages.map((avantage, index) => (
                        <AdvantageItem key={index}>
                          {getAdvantageIcon(avantage)}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: index === 0 ? "medium" : "normal",
                              fontSize: "0.9rem",
                            }}
                          >
                            {avantage}
                          </Typography>
                        </AdvantageItem>
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 1 }}>
                  {pack.owner ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        py: 1.5,
                        px: 2,
                        borderRadius: "12px",
                        backgroundColor: isDarkMode
                          ? "rgba(76, 175, 80, 0.15)"
                          : "rgba(76, 175, 80, 0.08)",
                        border: "1px solid",
                        borderColor: isDarkMode
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(76, 175, 80, 0.2)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(76, 175, 80, 0.2)"
                            : "rgba(76, 175, 80, 0.12)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <CheckCircleOutlineIcon
                        color="success"
                        sx={{ fontSize: 28, mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight="medium"
                        sx={{ textAlign: "center" }}
                      >
                        Pack déjà acheté
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      fullWidth
                      variant={pack.featured ? "contained" : "outlined"}
                      color="primary"
                      size="large"
                      onClick={() => handlePurchaseClick(pack)}
                      endIcon={
                        pack.featured ? (
                          <ShoppingCartIcon />
                        ) : (
                          <ArrowForwardIcon />
                        )
                      }
                      sx={{
                        py: 1.8,
                        borderRadius: "16px", // Coins plus arrondis
                        fontWeight: "bold",
                        boxShadow: pack.featured ? 4 : 0,
                        position: "relative",
                        overflow: "hidden",
                        textTransform: "none", // Texte plus naturel
                        fontSize: "1rem", // Taille de police plus grande
                        letterSpacing: "0.5px",
                        transition:
                          "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        "&:hover": {
                          transform: pack.featured
                            ? "scale(1.03)"
                            : "scale(1.02)",
                          boxShadow: pack.featured ? 8 : 2,
                        },
                        "&:active": {
                          transform: "scale(0.98)",
                        },
                        "&::before": pack.featured
                          ? {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: "-100%",
                              width: "100%",
                              height: "100%",
                              background:
                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                              animation: "shine 2s infinite ease-in-out",
                              zIndex: 1,
                            }
                          : {},
                        "@keyframes shine": {
                          "0%": { left: "-100%" },
                          "100%": { left: "100%" },
                        },
                      }}
                    >
                      {pack.featured ? "Choisir ce pack" : "Acheter maintenant"}
                    </Button>
                  )}
                </CardActions>
              </PackCard>
            </Grid>
          </Zoom>
        ))}
      </Grid>

      <Fade
        in={true}
        timeout={800}
        style={{ transitionDelay: "200ms" }}
        mountOnEnter
        unmountOnExit
      >
        <Box
          mt={10}
          p={5}
          component={Paper}
          elevation={3}
          sx={{
            borderRadius: "24px",
            backgroundColor: isDarkMode
              ? "rgba(46, 125, 50, 0.08)"
              : "rgba(46, 125, 50, 0.04)",
            border: "1px solid",
            borderColor: isDarkMode
              ? "rgba(46, 125, 50, 0.2)"
              : "rgba(46, 125, 50, 0.15)",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              gutterBottom
              fontWeight="bold"
              color="primary"
            >
              Vous avez des questions sur nos packs ?
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              Contactez notre équipe commerciale pour obtenir plus
              d'informations ou pour créer un pack personnalisé adapté à vos
              besoins spécifiques.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              endIcon={loadingSupport ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
              size="large"
              onClick={handleContactSupport}
              disabled={loadingSupport}
              sx={{
                borderRadius: "12px",
                py: 1.5,
                px: 3,
                fontWeight: "bold",
                boxShadow: 4,
              }}
            >
              {loadingSupport ? "Connexion..." : "Nous contacter"}
            </Button>
          </Box>
          <Box
            sx={{
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(255,255,255,0.7)",
              borderRadius: "50%",
              p: 3,
              display: { xs: "none", md: "flex" },
              boxShadow: 2,
            }}
          >
            <SpeedIcon
              sx={{ fontSize: 80, color: "primary.main", opacity: 0.8 }}
            />
          </Box>
        </Box>
      </Fade>

      <PurchasePackForm
        open={purchaseDialogOpen}
        onClose={handlePurchaseClose}
        pack={selectedPack}
      />
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        zIndex={9999}
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </Container>
  );
};

export default Packs;
