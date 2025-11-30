import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Fade,
  Zoom,
  useMediaQuery,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Notifications from "../../../components/Notification";

/**
 * Modal pour l'achat d'une formation
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Object} props.formation - La formation à acheter
 * @param {Function} props.onPurchaseComplete - Fonction appelée après l'achat réussi
 */
const PurchaseFormationModal = ({
  open,
  onClose,
  formation,
  onPurchaseComplete,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feePercentage, setFeePercentage] = useState(0);
  const [userWallet, setUserWallet] = useState(null);

  // Récupérer le pourcentage de frais d'achat et les informations du portefeuille
  useEffect(() => {
    if (open && formation) {
      fetchFeePercentage();
      fetchUserWallet();
    }
  }, [open, formation]);

  // Récupérer le pourcentage de frais d'achat
  const fetchFeePercentage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/purchase-fee-percentage");
      if (response.data.success) {
        setFeePercentage(response.data.fee_percentage);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des frais d'achat:", err);
      setError(
        "Impossible de récupérer les frais d'achat. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les informations du portefeuille de l'utilisateur
  const fetchUserWallet = async () => {
    try {
      const response = await axios.get("/api/user/finances/wallet-balance");
      if (response.data.success) {
        setUserWallet(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du portefeuille:", err);
    }
  };

  // Calculer les frais d'achat
  const calculateFees = () => {
    if (!formation) return 0;
    return (parseFloat(formation.price) * feePercentage) / 100;
  };

  // Calculer le montant total à payer
  const calculateTotal = () => {
    if (!formation) return 0;
    return parseFloat(formation.price) + calculateFees();
  };

  // Vérifier si l'utilisateur a suffisamment de fonds
  const hasSufficientFunds = () => {
    if (!userWallet) return false;
    return userWallet.balance_usd >= calculateTotal();
  };

  // Acheter la formation
  const handlePurchase = async () => {
    setPurchaseLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `/api/formations/purchase/${formation.id}`
      );
      if (response.data.success) {
        Notifications.success("Formation achetée avec succès");
        setPurchaseLoading(false);
        if (onPurchaseComplete) onPurchaseComplete();
        onClose();
      }
    } catch (err) {
      console.error("Erreur lors de l'achat de la formation:", err);
      setError(
        err.response?.data?.message ||
          "Impossible d'acheter cette formation. Veuillez réessayer plus tard."
      );
      setPurchaseLoading(false);
    }
  };

  if (!formation) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? "xs" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          background: isDarkMode
            ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderRadius: 3,
          boxShadow: isDarkMode
            ? "0 20px 60px rgba(0, 0, 0, 0.5)"
            : "0 20px 60px rgba(0, 0, 0, 0.15)",
          border: "1px solid",
          borderColor: isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        },
      }}
      sx={{
        backdropFilter: "blur(10px)",
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
    >
      {/* Header avec gradient */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          p: isMobile ? 2 : 3,
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: isMobile ? 8 : 12,
            right: isMobile ? 8 : 12,
            color: "white",
            background: alpha("#ffffff", 0.1),
            "&:hover": {
              background: alpha("#ffffff", 0.2),
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
          <Avatar
            sx={{
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <ShoppingCartIcon
              sx={{
                fontSize: isMobile ? 28 : 32,
                color: "white",
              }}
            />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                color: "white",
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Acheter cette formation
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              Procédez au paiement pour accéder au contenu
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: isMobile ? 6 : 8,
            }}
          >
            <CircularProgress
              size={isMobile ? 40 : 48}
              sx={{
                color: "primary.main",
                mb: 2,
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              Chargement des informations de paiement...
            </Typography>
          </Box>
        ) : (
          <Fade in timeout={600}>
            <Box>
              {error && (
                <Zoom in timeout={400}>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      "& .MuiAlert-icon": {
                        fontSize: 24,
                      },
                    }}
                  >
                    {error}
                  </Alert>
                </Zoom>
              )}

              {/* Carte d'information de la formation */}
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  mb: 3,
                  borderRadius: 3,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Avatar
                    sx={{
                      width: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                      flexShrink: 0,
                    }}
                  >
                    <SchoolIcon sx={{ color: "white" }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: "text.primary",
                        lineHeight: 1.3,
                      }}
                    >
                      {formation.title}
                    </Typography>
                    {formation.creator && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonIcon
                          sx={{
                            fontSize: 16,
                            color: "text.secondary",
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {formation.creator.name}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}
                    >
                      <Chip
                        label="Formation Premium"
                        size="small"
                        sx={{
                          background: alpha(theme.palette.primary.main, 0.1),
                          color: "primary.main",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      />
                      <Chip
                        label="Accès Illimité"
                        size="small"
                        sx={{
                          background: alpha(theme.palette.success.main, 0.1),
                          color: "success.main",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Carte de détails du paiement */}
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  mb: 3,
                  borderRadius: 3,
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)",
                  border: "1px solid",
                  borderColor: isDarkMode
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(59, 130, 246, 0.15)",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <MoneyIcon
                    sx={{
                      fontSize: 20,
                      color: "primary.main",
                    }}
                  />
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    Détails du paiement
                  </Typography>
                </Box>

                <Divider
                  sx={{
                    mb: 2,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Prix de la formation
                    </Typography>
                    <Typography
                      variant={isMobile ? "body1" : "h6"}
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      ${parseFloat(formation.price).toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    }}
                  >
                    <SchoolIcon />
                  </Avatar>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Frais de service
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      {feePercentage}% • ${calculateFees().toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      background: alpha(theme.palette.secondary.main, 0.1),
                      color: "secondary.main",
                    }}
                  >
                    <TrendingUpIcon />
                  </Avatar>
                </Box>

                <Divider
                  sx={{
                    my: 2,
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Total à payer
                    </Typography>
                    <Typography
                      variant={isMobile ? "h5" : "h4"}
                      sx={{
                        fontWeight: 700,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ${calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    }}
                  >
                    <ShoppingCartIcon sx={{ color: "white" }} />
                  </Avatar>
                </Box>
              </Paper>

              {/* Carte du portefeuille */}
              <Paper
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  mb: 3,
                  borderRadius: 3,
                  background: hasSufficientFunds()
                    ? isDarkMode
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                    : isDarkMode
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                  border: "1px solid",
                  borderColor: hasSufficientFunds()
                    ? isDarkMode
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(16, 185, 129, 0.15)"
                    : isDarkMode
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(239, 68, 68, 0.15)",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <WalletIcon
                    sx={{
                      fontSize: 20,
                      color: hasSufficientFunds()
                        ? "success.main"
                        : "error.main",
                    }}
                  />
                  <Typography
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    Votre portefeuille
                  </Typography>
                  {hasSufficientFunds() ? (
                    <CheckCircleIcon
                      sx={{
                        fontSize: 20,
                        color: "success.main",
                        ml: "auto",
                      }}
                    />
                  ) : (
                    <ErrorIcon
                      sx={{
                        fontSize: 20,
                        color: "error.main",
                        ml: "auto",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Solde disponible
                  </Typography>
                  <Typography
                    variant={isMobile ? "h5" : "h4"}
                    sx={{
                      fontWeight: 700,
                      color: hasSufficientFunds()
                        ? "success.main"
                        : "error.main",
                    }}
                  >
                    ${userWallet?.balance_usd || "0.00"}
                  </Typography>
                </Box>

                {!hasSufficientFunds() && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (userWallet?.balance_usd / calculateTotal()) * 100 || 0
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "error.main",
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Il manque $
                      {Math.max(
                        0,
                        calculateTotal() - (userWallet?.balance_usd || 0)
                      ).toFixed(2)}{" "}
                      pour cet achat
                    </Typography>
                  </Box>
                )}
              </Paper>

              {!hasSufficientFunds() && (
                <Zoom in timeout={400}>
                  <Alert
                    severity="warning"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      "& .MuiAlert-icon": {
                        fontSize: 24,
                      },
                    }}
                    icon={<WarningIcon />}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Fonds insuffisants
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Veuillez recharger votre portefeuille pour continuer cet
                      achat.
                    </Typography>
                  </Alert>
                </Zoom>
              )}
            </Box>
          </Fade>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 3,
          gap: 2,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Button
          onClick={onClose}
          disabled={purchaseLoading}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          sx={{
            borderRadius: 2,
            py: isMobile ? 1 : 1.5,
            fontWeight: 600,
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handlePurchase}
          variant="contained"
          size={isMobile ? "medium" : "large"}
          disabled={loading || purchaseLoading || !hasSufficientFunds()}
          startIcon={
            purchaseLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <ShoppingCartIcon />
            )
          }
          fullWidth={isMobile}
          sx={{
            background: hasSufficientFunds()
              ? "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
            borderRadius: 2,
            py: isMobile ? 1 : 1.5,
            fontWeight: 600,
            boxShadow: hasSufficientFunds()
              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
              : "none",
            "&:hover": {
              background: hasSufficientFunds()
                ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
              transform: hasSufficientFunds() ? "translateY(-2px)" : "none",
              boxShadow: hasSufficientFunds()
                ? `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                : "none",
            },
            "&:disabled": {
              background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
              color: "#9ca3af",
            },
            transition: "all 0.3s ease",
          }}
        >
          {purchaseLoading
            ? "Traitement en cours..."
            : hasSufficientFunds()
            ? "Confirmer l'achat"
            : "Fonds insuffisants"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseFormationModal;
