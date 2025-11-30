import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import publicAxios from "../utils/publicAxios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

// ===== ANIMATIONS =====
// Groupe d'animations pour les conteneurs de cartes - effet de cascade
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15, // Délai entre l'animation de chaque enfant
      delayChildren: 0.1, // Délai avant de commencer les animations des enfants
    },
  },
};

// Animation pour les titres de catégorie - apparition avec effet ressort
const categoryTitleVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260, // Rigidité du ressort (plus élevé = plus rigide)
      damping: 20, // Amortissement (plus élevé = moins d'oscillations)
      duration: 0.7, // Durée totale de l'animation
    },
  },
};

// Animation pour les sections de catégorie - apparition du bas vers le haut
const categoryVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 0.6,
    },
  },
};

// Animation pour les cartes individuelles - apparition avec léger zoom
const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100, // Ressort plus souple pour les cartes
      damping: 12, // Moins d'amortissement pour un effet plus dynamique
      duration: 0.5,
    },
  },
};

// Animation pour les éléments internes des cartes - apparition en fondu
const cardContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.2, // Délai après l'apparition de la carte
      duration: 0.4, // Durée du fondu
    },
  },
};

// Animation pour la ligne décorative sous les titres de catégorie
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
// Animations pour les éléments décoratifs à gauche et à droite des titres
const decorationLeftVariants = {
  hidden: { opacity: 0, x: -20 },
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
  hidden: { opacity: 0, x: 20 },
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

// Animation pour les badges (réduction, populaire)
const badgeVariants = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
      delay: 0.4,
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

// Définition des couleurs par catégorie - Système de couleurs amélioré avec plus de variété
const categoryColors = {
  // Couleurs pour le mode clair
  light: {
    default: {
      bg: "#ffffff",
      border: "1px solid rgba(0, 0, 0, 0.08)",
      shadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      highlight: "#22c55e",
      hover: "#16a34a",
      icon: "#22c55e",
      accent: "#22c55e",
      gradientFrom: "#22c55e",
      gradientTo: "#16a34a",
      badgeBg: "rgba(34, 197, 94, 0.1)",
      badgeText: "#16a34a",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      cardBorder: "rgba(34, 197, 94, 0.3)",
      cardGlow: "rgba(34, 197, 94, 0.15)",
    },
    Premium: {
      bg: "#ffffff",
      border: "1px solid rgba(79, 70, 229, 0.12)",
      shadow: "0 4px 16px rgba(79, 70, 229, 0.08)",
      highlight: "#4f46e5",
      hover: "#4338ca",
      icon: "#4f46e5",
      accent: "#4f46e5",
      gradientFrom: "#4f46e5",
      gradientTo: "#4338ca",
      badgeBg: "rgba(79, 70, 229, 0.1)",
      badgeText: "#4338ca",
      buttonBg: "#4f46e5",
      buttonHover: "#4338ca",
      discount: "75% OFF",
      cardBorder: "rgba(79, 70, 229, 0.3)",
      cardGlow: "rgba(79, 70, 229, 0.15)",
    },
    Business: {
      bg: "#ffffff",
      border: "1px solid rgba(234, 88, 12, 0.12)",
      shadow: "0 4px 16px rgba(234, 88, 12, 0.08)",
      highlight: "#ea580c",
      hover: "#c2410c",
      icon: "#ea580c",
      accent: "#ea580c",
      gradientFrom: "#ea580c",
      gradientTo: "#c2410c",
      badgeBg: "rgba(234, 88, 12, 0.1)",
      badgeText: "#c2410c",
      buttonBg: "#ea580c",
      buttonHover: "#c2410c",
      discount: "71% OFF",
      popular: true,
      cardBorder: "rgba(234, 88, 12, 0.3)",
      cardGlow: "rgba(234, 88, 12, 0.15)",
    },
    "Cloud Startup": {
      bg: "#ffffff",
      border: "1px solid rgba(6, 182, 212, 0.12)",
      shadow: "0 4px 16px rgba(6, 182, 212, 0.08)",
      highlight: "#06b6d4",
      hover: "#0891b2",
      icon: "#06b6d4",
      accent: "#06b6d4",
      gradientFrom: "#06b6d4",
      gradientTo: "#0891b2",
      badgeBg: "rgba(6, 182, 212, 0.1)",
      badgeText: "#0891b2",
      buttonBg: "#06b6d4",
      buttonHover: "#0891b2",
      discount: "71% OFF",
      cardBorder: "rgba(6, 182, 212, 0.3)",
      cardGlow: "rgba(6, 182, 212, 0.15)",
    },
    Débutant: {
      bg: "#ffffff",
      border: "1px solid rgba(34, 197, 94, 0.12)",
      shadow: "0 4px 16px rgba(34, 197, 94, 0.08)",
      highlight: "#22c55e",
      hover: "#16a34a",
      icon: "#22c55e",
      accent: "#22c55e",
      gradientFrom: "#22c55e",
      gradientTo: "#16a34a",
      badgeBg: "rgba(34, 197, 94, 0.1)",
      badgeText: "#16a34a",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      cardBorder: "rgba(34, 197, 94, 0.3)",
      cardGlow: "rgba(34, 197, 94, 0.15)",
    },
    Intermédiaire: {
      bg: "#ffffff",
      border: "1px solid rgba(217, 119, 6, 0.12)",
      shadow: "0 4px 16px rgba(217, 119, 6, 0.08)",
      highlight: "#d97706",
      hover: "#b45309",
      icon: "#d97706",
      accent: "#d97706",
      gradientFrom: "#d97706",
      gradientTo: "#b45309",
      badgeBg: "rgba(217, 119, 6, 0.1)",
      badgeText: "#b45309",
      buttonBg: "#d97706",
      buttonHover: "#b45309",
      cardBorder: "rgba(217, 119, 6, 0.3)",
      cardGlow: "rgba(217, 119, 6, 0.15)",
    },
    Expert: {
      bg: "#ffffff",
      border: "1px solid rgba(168, 85, 247, 0.12)",
      shadow: "0 4px 16px rgba(168, 85, 247, 0.08)",
      highlight: "#a855f7",
      hover: "#9333ea",
      icon: "#a855f7",
      accent: "#a855f7",
      gradientFrom: "#a855f7",
      gradientTo: "#9333ea",
      badgeBg: "rgba(168, 85, 247, 0.1)",
      badgeText: "#9333ea",
      buttonBg: "#a855f7",
      buttonHover: "#9333ea",
      cardBorder: "rgba(168, 85, 247, 0.3)",
      cardGlow: "rgba(168, 85, 247, 0.15)",
    },
    VIP: {
      bg: "#ffffff",
      border: "1px solid rgba(236, 72, 153, 0.12)",
      shadow: "0 4px 16px rgba(236, 72, 153, 0.08)",
      highlight: "#ec4899",
      hover: "#db2777",
      icon: "#ec4899",
      accent: "#ec4899",
      gradientFrom: "#ec4899",
      gradientTo: "#db2777",
      badgeBg: "rgba(236, 72, 153, 0.1)",
      badgeText: "#db2777",
      buttonBg: "#ec4899",
      buttonHover: "#db2777",
      cardBorder: "rgba(236, 72, 153, 0.3)",
      cardGlow: "rgba(236, 72, 153, 0.15)",
    },
  },
  // Couleurs pour le mode sombre
  dark: {
    default: {
      bg: "#1f2937",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#4ade80",
      hover: "#22c55e",
      icon: "#4ade80",
      accent: "#4ade80",
      gradientFrom: "#4ade80",
      gradientTo: "#22c55e",
      badgeBg: "rgba(74, 222, 128, 0.15)",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      cardBorder: "rgba(74, 222, 128, 0.3)",
      cardGlow: "rgba(74, 222, 128, 0.1)",
    },
    Premium: {
      bg: "#1f2937",
      border: "1px solid rgba(139, 92, 246, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#8b5cf6",
      hover: "#7c3aed",
      icon: "#8b5cf6",
      accent: "#8b5cf6",
      gradientFrom: "#8b5cf6",
      gradientTo: "#7c3aed",
      badgeBg: "rgba(139, 92, 246, 0.15)",
      badgeText: "#8b5cf6",
      buttonBg: "#7c3aed",
      buttonHover: "#6d28d9",
      discount: "75% OFF",
      cardBorder: "rgba(139, 92, 246, 0.3)",
      cardGlow: "rgba(139, 92, 246, 0.1)",
    },
    Business: {
      bg: "#1f2937",
      border: "1px solid rgba(251, 146, 60, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#fb923c",
      hover: "#f97316",
      icon: "#fb923c",
      accent: "#fb923c",
      gradientFrom: "#fb923c",
      gradientTo: "#f97316",
      badgeBg: "rgba(251, 146, 60, 0.15)",
      badgeText: "#fb923c",
      buttonBg: "#f97316",
      buttonHover: "#ea580c",
      discount: "71% OFF",
      popular: true,
      cardBorder: "rgba(251, 146, 60, 0.3)",
      cardGlow: "rgba(251, 146, 60, 0.1)",
    },
    "Cloud Startup": {
      bg: "#1f2937",
      border: "1px solid rgba(34, 211, 238, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#22d3ee",
      hover: "#06b6d4",
      icon: "#22d3ee",
      accent: "#22d3ee",
      gradientFrom: "#22d3ee",
      gradientTo: "#06b6d4",
      badgeBg: "rgba(34, 211, 238, 0.15)",
      badgeText: "#22d3ee",
      buttonBg: "#06b6d4",
      buttonHover: "#0891b2",
      discount: "71% OFF",
      cardBorder: "rgba(34, 211, 238, 0.3)",
      cardGlow: "rgba(34, 211, 238, 0.1)",
    },
    Débutant: {
      bg: "#1f2937",
      border: "1px solid rgba(74, 222, 128, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#4ade80",
      hover: "#22c55e",
      icon: "#4ade80",
      accent: "#4ade80",
      gradientFrom: "#4ade80",
      gradientTo: "#22c55e",
      badgeBg: "rgba(74, 222, 128, 0.15)",
      badgeText: "#4ade80",
      buttonBg: "#22c55e",
      buttonHover: "#16a34a",
      cardBorder: "rgba(74, 222, 128, 0.3)",
      cardGlow: "rgba(74, 222, 128, 0.1)",
    },
    Intermédiaire: {
      bg: "#1f2937",
      border: "1px solid rgba(252, 211, 77, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#fcd34d",
      hover: "#fbbf24",
      icon: "#fcd34d",
      accent: "#fcd34d",
      gradientFrom: "#fcd34d",
      gradientTo: "#fbbf24",
      badgeBg: "rgba(252, 211, 77, 0.15)",
      badgeText: "#fcd34d",
      buttonBg: "#fbbf24",
      buttonHover: "#f59e0b",
      cardBorder: "rgba(252, 211, 77, 0.3)",
      cardGlow: "rgba(252, 211, 77, 0.1)",
    },
    Expert: {
      bg: "#1f2937",
      border: "1px solid rgba(192, 132, 252, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#c084fc",
      hover: "#a855f7",
      icon: "#c084fc",
      accent: "#c084fc",
      gradientFrom: "#c084fc",
      gradientTo: "#a855f7",
      badgeBg: "rgba(192, 132, 252, 0.15)",
      badgeText: "#c084fc",
      buttonBg: "#a855f7",
      buttonHover: "#9333ea",
      cardBorder: "rgba(192, 132, 252, 0.3)",
      cardGlow: "rgba(192, 132, 252, 0.1)",
    },
    VIP: {
      bg: "#1f2937",
      border: "1px solid rgba(244, 114, 182, 0.15)",
      shadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
      highlight: "#f472b6",
      hover: "#ec4899",
      icon: "#f472b6",
      accent: "#f472b6",
      gradientFrom: "#f472b6",
      gradientTo: "#ec4899",
      badgeBg: "rgba(244, 114, 182, 0.15)",
      badgeText: "#f472b6",
      buttonBg: "#ec4899",
      buttonHover: "#db2777",
      cardBorder: "rgba(244, 114, 182, 0.3)",
      cardGlow: "rgba(244, 114, 182, 0.1)",
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
        navigate("/dashboard/packs");
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
        {/* <Typography
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
        </Typography> */}

        <div className="inline-block">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            className={`h-1.5 w-24 mx-auto mb-6 rounded-full ${
              isDarkMode ? "bg-green-500" : "bg-green-600"
            }`}
          />
        </div>

        <h2
          className={`text-3xl font-extrabold tracking-tight sm:text-5xl mb-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Nos{" "}
          <span
            className={`relative inline-block ${
              isDarkMode ? "text-green-400" : "text-green-600"
            }`}
          >
            Packs
            <motion.span
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
              className={`absolute bottom-1 left-0 h-0.5 ${
                isDarkMode ? "bg-green-400/40" : "bg-green-600/40"
              }`}
            />
          </span>
        </h2>

        <p
          className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Choisissez le pack qui correspond le mieux à vos besoins et commencez
          votre aventure dès aujourd'hui.
        </p>
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
            <Typography
              variant="h4"
              component={motion.h2}
              variants={categoryTitleVariants || categoryVariants}
              sx={{
                fontWeight: 800,
                color: isDarkMode ? "white" : "#111827",
                position: "relative",
                display: "inline-block",
                paddingBottom: "12px",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80px",
                  height: "3px",
                  background: `linear-gradient(90deg, ${
                    categoryColors[isDarkMode ? "dark" : "light"][category]
                      ?.gradientFrom || "#4f46e5"
                  }, ${
                    categoryColors[isDarkMode ? "dark" : "light"][category]
                      ?.gradientTo || "#10b981"
                  })`,
                  borderRadius: "2px",
                },
              }}
            >
              {category}
            </Typography>

            {/* Élément décoratif sous le titre */}
            <Box
              component={motion.div}
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              sx={{
                height: "2px",
                width: "100px",
                background: `linear-gradient(to right, transparent, ${
                  isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
                }, transparent)`,
                mx: "auto",
                mt: 2,
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
                    whileHover={{
                      y: -8,
                      boxShadow: `0 15px 30px ${
                        isPackPopular
                          ? `rgba(${colorScheme.highlight
                              .replace(/^#/, "")
                              .match(/.{2}/g)
                              .map((hex) => parseInt(hex, 16))
                              .join(", ")}, 0.2)`
                          : isDarkMode
                          ? "rgba(0, 0, 0, 0.3)"
                          : "rgba(0, 0, 0, 0.1)"
                      }`,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      },
                    }}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      bgcolor: colorScheme.bg,
                      border: isPackPopular
                        ? `2px solid ${colorScheme.highlight}`
                        : colorScheme.border,
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: isPackPopular
                        ? `0 8px 20px ${colorScheme.cardGlow}`
                        : colorScheme.shadow,
                    }}
                  >
                    {/* Badge de réduction */}
                    {discountText && (
                      <Box
                        component={motion.div}
                        variants={badgeVariants}
                        initial="initial"
                        animate="animate"
                        whileHover={{
                          scale: 1.05,
                          rotate: [0, -2, 2, 0],
                          transition: { duration: 0.4 },
                        }}
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          bgcolor: colorScheme.badgeBg,
                          color: colorScheme.badgeText,
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          py: 0.6,
                          px: 1.8,
                          borderRadius: "20px",
                          zIndex: 1,
                          boxShadow: `0 2px 8px ${
                            isDarkMode ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: colorScheme.badgeText,
                            display: "inline-block",
                            mr: 0.5,
                          }}
                        />
                        {discountText}
                      </Box>
                    )}

                    {/* Badge Populaire */}
                    {isPackPopular && (
                      <Box
                        component={motion.div}
                        variants={badgeVariants}
                        initial="initial"
                        animate="animate"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: `0 4px 12px ${
                            isDarkMode
                              ? "rgba(79, 70, 229, 0.4)"
                              : "rgba(79, 70, 229, 0.25)"
                          }`,
                          transition: { duration: 0.3 },
                        }}
                        sx={{
                          position: "absolute",
                          top: 16,
                          left: 16,
                          bgcolor: isDarkMode
                            ? "rgba(79, 70, 229, 0.9)"
                            : "#4f46e5",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          py: 0.6,
                          px: 1.8,
                          borderRadius: "20px",
                          zIndex: 1,
                          boxShadow: `0 2px 8px ${
                            isDarkMode ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <AutoAwesomeIcon style={{ width: 16, height: 16 }} />
                        Populaire
                      </Box>
                    )}

                    <Box
                      sx={{
                        p: 3,
                        pt: isPackPopular ? 4.5 : 3,
                        pb: 2.5,
                        borderBottom: `1px solid ${
                          isDarkMode
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(0, 0, 0, 0.05)"
                        }`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Accent color bar on top */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: `linear-gradient(90deg, ${colorScheme.gradientFrom}, ${colorScheme.gradientTo})`,
                        }}
                      />

                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          color: isDarkMode ? "white" : "#111827",
                          mb: 1.2,
                          lineHeight: 1.2,
                          letterSpacing: "-0.01em",
                          fontSize: "1.35rem",
                        }}
                      >
                        {pack.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode
                            ? "rgba(255, 255, 255, 0.7)"
                            : "rgba(55, 65, 81, 0.8)",
                          mb: 2,
                          lineHeight: 1.5,
                          fontSize: "0.925rem",
                        }}
                      >
                        {pack.description}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3, pt: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          mb: 3,
                          position: "relative",
                          background: isDarkMode
                            ? "rgba(0, 0, 0, 0.15)"
                            : "rgba(249, 250, 251, 0.8)",
                          borderRadius: "10px",
                          p: 2,
                          pb: 2.5,
                          overflow: "hidden",
                        }}
                      >
                        {/* Subtle gradient background */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.05,
                            background: `linear-gradient(135deg, ${colorScheme.gradientFrom}22, ${colorScheme.gradientTo}22)`,
                            zIndex: 0,
                          }}
                        />

                        {/* Price tag icon */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            color: colorScheme.accent,
                            opacity: 0.5,
                            zIndex: 1,
                          }}
                        >
                          <WalletIcon style={{ width: 20, height: 20 }} />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            mb: 1,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 800,
                              color: colorScheme.accent,
                              mr: 1,
                              fontSize: "2.2rem",
                              lineHeight: 1,
                            }}
                          >
                            {pack.price}$
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: isDarkMode
                                ? "rgba(255, 255, 255, 0.7)"
                                : "rgba(55, 65, 81, 0.8)",
                              fontWeight: 500,
                              fontSize: "1rem",
                            }}
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
                          sx={{
                            color: isDarkMode
                              ? "rgba(255, 255, 255, 0.6)"
                              : "rgba(55, 65, 81, 0.7)",
                            mb: 0,
                            fontStyle: "italic",
                            fontSize: "0.875rem",
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarIcon style={{ width: 14, height: 14 }} />
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

                      {pack?.features && pack.features?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1.5,
                              fontWeight: 700,
                              color: isDarkMode
                                ? "rgba(255, 255, 255, 0.9)"
                                : "rgba(17, 24, 39, 0.9)",
                              fontSize: "0.95rem",
                              letterSpacing: "0.01em",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 10,
                                height: 2,
                                bgcolor: colorScheme.accent,
                                display: "inline-block",
                                borderRadius: 1,
                              }}
                            />
                            Fonctionnalités incluses
                          </Typography>
                          <List
                            dense
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(0, 0, 0, 0.1)"
                                : "rgba(249, 250, 251, 0.5)",
                              borderRadius: "8px",
                              py: 1,
                            }}
                          >
                            {pack.features.map((feature, index) => (
                              <ListItem
                                component={motion.li}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.3 + index * 0.1,
                                  duration: 0.4,
                                  ease: "easeOut",
                                }}
                                whileHover={{
                                  x: 4,
                                  backgroundColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "rgba(0, 0, 0, 0.03)",
                                  transition: { duration: 0.2 },
                                }}
                                key={index}
                                sx={{
                                  px: 1.5,
                                  py: 0.75,
                                  transition: "all 0.2s",
                                  borderRadius: "4px",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.03)"
                                      : "rgba(0, 0, 0, 0.02)",
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircleIcon
                                    sx={{
                                      color: colorScheme.accent,
                                      fontSize: "1.1rem",
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={feature}
                                  primaryTypographyProps={{
                                    variant: "body2",
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.85)"
                                      : "rgba(55, 65, 81, 0.95)",
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {pack?.avantages && pack.avantages?.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 1.5,
                              fontWeight: 700,
                              color: isDarkMode
                                ? "rgba(255, 255, 255, 0.9)"
                                : "rgba(17, 24, 39, 0.9)",
                              fontSize: "0.95rem",
                              letterSpacing: "0.01em",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 10,
                                height: 2,
                                bgcolor: colorScheme.highlight,
                                display: "inline-block",
                                borderRadius: 1,
                              }}
                            />
                            Avantages exclusifs
                          </Typography>
                          <Box
                            sx={{
                              bgcolor: isDarkMode
                                ? "rgba(0, 0, 0, 0.1)"
                                : "rgba(249, 250, 251, 0.5)",
                              borderRadius: "8px",
                              py: 1,
                              px: 1,
                            }}
                          >
                            {pack.avantages.map((avantage, index) => (
                              <Box
                                key={index}
                                component={motion.div}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.3 + index * 0.1,
                                  duration: 0.4,
                                  ease: "easeOut",
                                }}
                                whileHover={{
                                  x: 4,
                                  backgroundColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "rgba(0, 0, 0, 0.03)",
                                  transition: { duration: 0.2 },
                                }}
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  mb:
                                    index < pack.avantages?.length - 1
                                      ? 1.5
                                      : 0,
                                  py: 0.5,
                                  px: 0.5,
                                  transition: "all 0.2s",
                                  borderRadius: "4px",
                                  "&:hover": {
                                    bgcolor: isDarkMode
                                      ? "rgba(255, 255, 255, 0.03)"
                                      : "rgba(0, 0, 0, 0.02)",
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    minWidth: 32,
                                    color: colorScheme.highlight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <CheckCircleIcon
                                    fontSize="small"
                                    sx={{ fontSize: "1.1rem" }}
                                  />
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isDarkMode
                                      ? "rgba(255, 255, 255, 0.85)"
                                      : "rgba(55, 65, 81, 0.95)",
                                    fontWeight: 500,
                                    fontSize: "0.9rem",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {avantage}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2.5, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        component={motion.button}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: 0.6,
                        }}
                        whileHover={{
                          scale: 1.03,
                          boxShadow: `0 6px 16px ${
                            isDarkMode
                              ? "rgba(0, 0, 0, 0.5)"
                              : "rgba(0, 0, 0, 0.2)"
                          }`,
                        }}
                        whileTap={{ scale: 0.97 }}
                        sx={{
                          bgcolor: colorScheme.buttonBg,
                          color: colorScheme.buttonText,
                          "&:hover": {
                            bgcolor: colorScheme.buttonHoverBg,
                          },
                          py: 1.4,
                          fontWeight: 700,
                          textTransform: "none",
                          fontSize: "1rem",
                          borderRadius: "10px",
                          boxShadow: `0 4px 10px ${
                            isDarkMode
                              ? "rgba(0, 0, 0, 0.3)"
                              : "rgba(0, 0, 0, 0.1)"
                          }`,
                          position: "relative",
                          overflow: "hidden",
                        }}
                        onClick={() => handleSubscribeClick(pack)}
                      >
                        {/* Subtle gradient overlay */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0.1,
                            background: `linear-gradient(135deg, ${colorScheme.gradientFrom}, ${colorScheme.gradientTo})`,
                            zIndex: 0,
                          }}
                        />
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <ShoppingCartIcon style={{ width: 18, height: 18 }} />
                          {user ? "Acheter ce pack" : "S'inscrire"}
                        </Box>
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
