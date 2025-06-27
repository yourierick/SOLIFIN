import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckIcon,
  CalendarIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import publicAxios from "../utils/publicAxios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

// Animations
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

// Animations améliorées pour les titres de catégorie
const categoryTitleVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: "easeOut",
      delay: 0.1,
    },
  },
};

const categoryLineVariants = {
  hidden: { width: 0, opacity: 0 },
  visible: {
    width: "100%",
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeInOut",
      delay: 0.4,
    },
  },
};

// Animations pour les décorations du titre
const decorationLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.3,
    },
  },
};

const decorationRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.3,
    },
  },
};

// Définition des couleurs par catégorie - Utilisation de la palette verte
const categoryColors = {
  // Couleurs pour le mode clair
  light: {
    default: {
      bg: "bg-white",
      border: "border-gray-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Premium: {
      bg: "bg-white",
      border: "border-gray-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      discount: "75% OFF",
    },
    Business: {
      bg: "bg-white",
      border: "border-gray-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#4f46e5", // Couleur violette pour le bouton du pack populaire
      buttonHover: "#4338ca",
      discount: "71% OFF",
      popular: true,
    },
    "Cloud Startup": {
      bg: "bg-white",
      border: "border-gray-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      discount: "71% OFF",
    },
    // Conserver les autres catégories avec la palette verte
    Débutant: {
      bg: "bg-green-50",
      border: "border-green-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Intermédiaire: {
      bg: "bg-green-50",
      border: "border-green-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Expert: {
      bg: "bg-green-50",
      border: "border-green-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    VIP: {
      bg: "bg-green-50",
      border: "border-green-200",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-500",
      accent: "text-green-600",
      gradientFrom: "from-green-500",
      gradientTo: "to-green-600",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#e6f7e6",
      badgeText: "#22c55e",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
  },
  // Couleurs pour le mode sombre
  dark: {
    default: {
      bg: "#1f2937",
      border: "border-gray-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Premium: {
      bg: "#1f2937",
      border: "border-gray-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      discount: "75% OFF",
    },
    Business: {
      bg: "#1f2937",
      border: "border-gray-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#4f46e5", // Couleur violette pour le bouton du pack populaire
      buttonHover: "#4338ca",
      discount: "71% OFF",
      popular: true,
    },
    "Cloud Startup": {
      bg: "#1f2937",
      border: "border-gray-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      lightBg: "#ffffff",
      darkBg: "#1f2937",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      discount: "71% OFF",
    },
    // Conserver les autres catégories avec la palette verte
    Débutant: {
      bg: "bg-green-900/40",
      border: "border-green-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Intermédiaire: {
      bg: "bg-green-900/40",
      border: "border-green-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    Expert: {
      bg: "bg-green-900/40",
      border: "border-green-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
    VIP: {
      bg: "bg-green-900/40",
      border: "border-green-700",
      highlight: "bg-green-600",
      hover: "hover:bg-green-700",
      icon: "text-green-400",
      accent: "text-green-400",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      badgeBg: "#064e3b",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
    },
  },
};

export default function Packages() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour obtenir le schéma de couleur en fonction de la catégorie du pack
  const getColorScheme = (category) => {
    const mode = isDarkMode ? "dark" : "light";
    return categoryColors[mode][category] || categoryColors[mode].default;
  };

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await publicAxios.get("/api/packs");
        if (response.data && response.data.data) {
          setPacks(response.data.data.filter((pack) => pack.status));
        } else {
          console.error("Format de réponse invalide:", response.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des packs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPacks();
  }, []);

  // Grouper les packs par catégorie
  const packsByCategory = useMemo(() => {
    const grouped = {};
    packs.forEach((pack) => {
      const category = pack.categorie || "Autre";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(pack);
    });
    return grouped;
  }, [packs]);

  // Nous utilisons maintenant la fonction getColorScheme définie plus haut

  const handleSubscribeClick = (pack) => {
    if (!user) {
      navigate("/register");
    } else {
      if (user.is_admin) {
        navigate("/admin/mespacks");
      } else {
        navigate("/dashboard/buypacks");
      }
    }
  };

  if (loading) {
    return (
      <Container
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          minHeight: "50vh",
          alignItems: "center",
          bgcolor: isDarkMode ? "#1f2937" : "background.default",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  // Fonction pour obtenir le texte de réduction pour un pack
  const getDiscountText = (category) => {
    const mode = isDarkMode ? "dark" : "light";
    const colorScheme =
      categoryColors[mode][category] || categoryColors[mode].default;
    return colorScheme.discount || "";
  };

  // Fonction pour déterminer si un pack est populaire
  const isPopular = (category) => {
    const mode = isDarkMode ? "dark" : "light";
    const colorScheme =
      categoryColors[mode][category] || categoryColors[mode].default;
    return colorScheme.popular || false;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 8,
        bgcolor: isDarkMode ? "#1f2937" : "background.primare",
        borderRadius: 2,
        py: 4,
      }}
    >
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ color: isDarkMode ? "white" : "text.primary" }}
        >
          Nos Packs
        </Typography>
        <Typography
          variant="subtitle1"
          color={isDarkMode ? "text.secondary" : "text.secondary"}
          sx={{ maxWidth: "800px", mx: "auto" }}
        >
          Choisissez le pack qui correspond le mieux à vos besoins et commencez
          votre aventure dès aujourd'hui.
        </Typography>
      </Box>

      {Object.entries(packsByCategory).map(([category, categoryPacks]) => (
        <Box key={category} mb={8}>
          <Box
            textAlign="center"
            mb={6}
            component={motion.div}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            sx={{ position: "relative" }}
          >
            {/* Décoration gauche */}
            <Box
              component={motion.div}
              variants={decorationLeftVariants}
              sx={{
                position: "absolute",
                left: { xs: "10%", md: "25%" },
                top: "50%",
                transform: "translateY(-50%)",
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "2px",
                  background: `linear-gradient(to right, transparent, ${
                    isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0,0,0,0.3)"
                  })`,
                  display: "inline-block",
                  mr: 1,
                }}
              />
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  verticalAlign: "middle",
                }}
              />
            </Box>

            {/* Titre */}
            <Typography
              variant="h4"
              component={motion.div}
              variants={categoryTitleVariants}
              sx={{
                textTransform: "capitalize",
                color: isDarkMode ? "white" : "text.primary",
                position: "relative",
                display: "inline-block",
                mb: 1,
                px: 4,
                fontWeight: "bold",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40px",
                  height: "4px",
                  bgcolor: "primary.main",
                  borderRadius: "2px",
                },
              }}
            >
              {category}
            </Typography>

            {/* Décoration droite */}
            <Box
              component={motion.div}
              variants={decorationRightVariants}
              sx={{
                position: "absolute",
                right: { xs: "10%", md: "25%" },
                top: "50%",
                transform: "translateY(-50%)",
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  verticalAlign: "middle",
                }}
              />
              <Box
                sx={{
                  width: "40px",
                  height: "2px",
                  background: `linear-gradient(to left, transparent, ${
                    isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
                  })`,
                  display: "inline-block",
                  ml: 1,
                }}
              />
            </Box>

            {/* Ligne sous le titre */}
            <Box
              component={motion.div}
              variants={categoryLineVariants}
              sx={{
                height: "2px",
                width: { xs: "60%", sm: "40%", md: "30%" },
                maxWidth: "200px",
                background: `linear-gradient(to right, transparent, ${
                  isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                }, transparent)`,
                mx: "auto",
                mt: 4,
                borderRadius: "1px",
              }}
            />
          </Box>

          <Grid
            container
            spacing={3}
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categoryPacks.map((pack) => {
              // Récupérer la catégorie du pack
              const category = pack.categorie || "default";
              // Récupérer le mode (clair ou sombre)
              const mode = isDarkMode ? "dark" : "light";
              // Récupérer le schéma de couleurs pour cette catégorie
              const colorScheme =
                categoryColors[mode][category] || categoryColors[mode].default;
              // Vérifier si le pack est populaire
              const isPackPopular = isPopular(category);
              // Récupérer le texte de réduction pour ce pack
              const discountText = getDiscountText(category);

              return (
                <Grid item xs={12} sm={6} md={4} key={pack.id}>
                  <Card
                    component={motion.div}
                    variants={itemVariants}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: isPackPopular ? 12 : 6,
                      },
                      bgcolor: isDarkMode ? "#1f2937" : "white",
                      border: isPackPopular
                        ? isDarkMode
                          ? "2px solid #4f46e5"
                          : "2px solid #4f46e5"
                        : isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                      borderRadius: 2,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Badge de réduction */}
                    {discountText && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          bgcolor: colorScheme.badgeBg,
                          color: colorScheme.badgeText,
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          py: 0.5,
                          px: 1.5,
                          borderRadius: 1,
                          zIndex: 1,
                        }}
                      >
                        {discountText}
                      </Box>
                    )}

                    {/* Badge Populaire */}
                    {isPackPopular && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "#4f46e5",
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          py: 0.5,
                          px: 1.5,
                          borderRadius: 1,
                          zIndex: 1,
                        }}
                      >
                        Populaire
                      </Box>
                    )}

                    <Box
                      sx={{
                        p: 2.5,
                        pt: isPackPopular ? 4 : 2.5,
                        borderBottom: isDarkMode
                          ? "1px solid rgba(255, 255, 255, 0.08)"
                          : "1px solid rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          color: isDarkMode ? "white" : "black",
                          mb: 1,
                        }}
                      >
                        {pack.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode
                            ? "rgba(255, 255, 255, 0.7)"
                            : "text.secondary",
                          mb: 2,
                        }}
                      >
                        {pack.description}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: isDarkMode ? "white" : "black",
                              mr: 1,
                            }}
                          >
                            {pack.price}$
                          </Typography>
                          <Typography
                            variant="body2"
                            color={
                              isDarkMode
                                ? "rgba(255, 255, 255, 0.7)"
                                : "text.secondary"
                            }
                          >
                            /{" "}
                            {pack.abonnement === "mensuel"
                              ? "mois"
                              : pack.abonnement === "trimestriel"
                              ? "trimestre"
                              : pack.abonnement === "semestriel"
                              ? "semestre"
                              : pack.abonnement === "annuel"
                              ? "an"
                              : pack.abonnement}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Facturation{" "}
                          {pack.abonnement === "mensuel"
                            ? "mensuelle"
                            : pack.abonnement === "trimestriel"
                            ? "trimestrielle"
                            : pack.abonnement === "semestriel"
                            ? "semestrielle"
                            : pack.abonnement === "annuel"
                            ? "annuelle"
                            : pack.abonnement}
                        </Typography>
                      </Box>

                      {pack.avantages && pack.avantages.length > 0 && (
                        <List disablePadding>
                          {pack.avantages.map((avantage, index) => (
                            <ListItem
                              key={index}
                              disablePadding
                              sx={{ mb: 1.5 }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: "28px",
                                  color: colorScheme.buttonBg,
                                }}
                              >
                                <CheckIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={avantage}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  color: isDarkMode
                                    ? "rgba(255, 255, 255, 0.9)"
                                    : "text.primary",
                                  fontWeight: 500,
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2.5, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleSubscribeClick(pack)}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: "none",
                          fontSize: "1rem",
                          bgcolor: colorScheme.buttonBg,
                          "&:hover": {
                            bgcolor: colorScheme.buttonHover,
                          },
                          borderRadius: 1.5,
                        }}
                        className={`${loading ? "" : "pulse"}`}
                      >
                        Souscrire Maintenant
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Container>
  );
}
