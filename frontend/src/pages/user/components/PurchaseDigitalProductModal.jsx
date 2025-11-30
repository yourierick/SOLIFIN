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
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Notifications from "../../../components/Notification";

/**
 * Modal pour l'achat d'un produit numérique
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Object} props.product - Le produit numérique à acheter
 * @param {Function} props.onPurchaseComplete - Fonction appelée après l'achat réussi
 */
const PurchaseDigitalProductModal = ({
  open,
  onClose,
  product,
  onPurchaseComplete,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feePercentage, setFeePercentage] = useState(0);
  const [userWallet, setUserWallet] = useState(null);

  // Récupérer le pourcentage de frais d'achat et les informations du portefeuille
  useEffect(() => {
    if (open && product) {
      fetchFeePercentage();
      fetchUserWallet();
    }
  }, [open, product]);

  // Récupérer le pourcentage de frais d'achat
  const fetchFeePercentage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "/api/digital-products/purchase-fee-percentage"
      );
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
    if (!product) return 0;
    return (parseFloat(product.prix) * feePercentage) / 100;
  };

  // Calculer le montant total à payer
  const calculateTotal = () => {
    if (!product) return 0;
    return parseFloat(product.prix) + calculateFees();
  };

  // Vérifier si l'utilisateur a suffisamment de fonds
  const hasSufficientFunds = () => {
    if (!userWallet) return false;
    return userWallet.balance_usd >= calculateTotal();
  };

  // Acheter le produit numérique
  const handlePurchase = async () => {
    setPurchaseLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `/api/digital-products/${product.id}/purchase`
      );

      // Vérifier si la réponse contient les données attendues
      if (response.data) {
        // Si l'utilisateur a déjà acheté le produit, la réponse contient un message spécifique
        if (response.data.message === "Vous avez déjà acheté ce produit") {
          Notifications.info(response.data.message);
          // Récupérer l'URL de téléchargement si disponible
          if (response.data.download_url && onPurchaseComplete) {
            onPurchaseComplete(response.data.download_url);
          }
        } else {
          // Achat réussi
          Notifications.success(
            response.data.message || "Produit numérique acheté avec succès"
          );
          if (onPurchaseComplete && response.data.download_url) {
            onPurchaseComplete(response.data.download_url);
          }
        }

        // Fermer le modal dans tous les cas
        setPurchaseLoading(false);
        onClose();
      } else {
        // Réponse inattendue
        throw new Error("Réponse invalide du serveur");
      }
    } catch (err) {
      console.error("Erreur lors de l'achat du produit numérique:", err);
      let errorMessage =
        "Impossible d'acheter ce produit. Veuillez réessayer plus tard.";

      // Gestion des erreurs spécifiques
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = "Vous avez déjà acheté ce produit numérique.";
      } else if (err.response?.status === 402) {
        errorMessage = "Solde insuffisant pour effectuer cet achat.";
      }

      setError(errorMessage);
      setPurchaseLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode
            ? "linear-gradient(145deg, #1f2937 0%, #111827 100%)"
            : "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
          borderRadius: 2,
          boxShadow: isDarkMode
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.6)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        },
      }}
      sx={{
        backdropFilter: "blur(8px)",
        "& .MuiBackdrop-root": {
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.5)"
            : "rgba(0, 0, 0, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          pb: 2,
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))"
            : "linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(16, 185, 129, 0.05))",
          borderBottom: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            display: "flex",
            p: 1,
            borderRadius: "50%",
            background: isDarkMode
              ? "rgba(59, 130, 246, 0.2)"
              : "rgba(59, 130, 246, 0.1)",
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 20, color: "primary.main" }} />
        </Box>
        Acheter ce produit numérique
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  bgcolor: isDarkMode
                    ? "rgba(59, 130, 246, 0.05)"
                    : "rgba(59, 130, 246, 0.02)",
                  borderRadius: 2,
                  border: isDarkMode
                    ? "1px solid rgba(59, 130, 246, 0.1)"
                    : "1px solid rgba(59, 130, 246, 0.08)",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: isDarkMode ? "#e5e7eb" : "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {product.titre}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{
                    mb: 1.5,
                    lineHeight: 1.5,
                    color: isDarkMode
                      ? "rgba(255, 255, 255, 0.7)"
                      : "rgba(0, 0, 0, 0.6)",
                  }}
                >
                  {product.description}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: isDarkMode
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(16, 185, 129, 0.05)",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      border: isDarkMode
                        ? "1px solid rgba(16, 185, 129, 0.2)"
                        : "1px solid rgba(16, 185, 129, 0.1)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDarkMode
                          ? "rgba(16, 185, 129, 0.9)"
                          : "rgba(16, 185, 129, 1)",
                        fontWeight: 500,
                      }}
                    >
                      Type:{" "}
                      {product.type === "ebook"
                        ? "E-book"
                        : "Fichier administratif"}
                    </Typography>
                  </Box>
                  {product.page?.user?.name && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        bgcolor: isDarkMode
                          ? "rgba(124, 58, 237, 0.1)"
                          : "rgba(124, 58, 237, 0.05)",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        border: isDarkMode
                          ? "1px solid rgba(124, 58, 237, 0.2)"
                          : "1px solid rgba(124, 58, 237, 0.1)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: isDarkMode
                            ? "rgba(124, 58, 237, 0.9)"
                            : "rgba(124, 58, 237, 1)",
                          fontWeight: 500,
                        }}
                      >
                        Par: {product.page.user.name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: isDarkMode
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
                borderRadius: 2,
                borderLeft: "4px solid",
                borderColor: "primary.main",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                  : "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: isDarkMode ? "#e5e7eb" : "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    display: "inline-block",
                  }}
                />
                Détails du paiement
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Prix du produit:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {parseFloat(product.prix).toFixed(2)} {product.devise}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">
                  Frais de commodité ({feePercentage}%):
                </Typography>
                <Typography variant="body2">
                  {calculateFees().toFixed(2)} {product.devise}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle2">Total à payer:</Typography>
                <Typography variant="subtitle2" fontWeight="bold">
                  {calculateTotal().toFixed(2)} {product.devise}
                </Typography>
              </Box>
            </Paper>

            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: isDarkMode
                  ? hasSufficientFunds()
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)"
                  : hasSufficientFunds()
                  ? "rgba(16, 185, 129, 0.05)"
                  : "rgba(239, 68, 68, 0.05)",
                border: "1px solid",
                borderColor: hasSufficientFunds()
                  ? "success.main"
                  : "error.main",
                borderWidth: "1px",
                borderStyle: "solid",
                borderOpacity: 0.2,
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 500,
                  color: isDarkMode
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(0, 0, 0, 0.6)",
                }}
              >
                Votre solde actuel:
              </Typography>
              <Typography
                variant="h6"
                color={hasSufficientFunds() ? "success.main" : "error.main"}
                sx={{ fontWeight: 600 }}
              >
                {userWallet?.balance_usd || "0.00"} {product.devise}
              </Typography>
            </Box>

            {!hasSufficientFunds() && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Vous n'avez pas assez de fonds dans votre portefeuille pour
                acheter ce produit numérique. Veuillez recharger votre compte
                avant de continuer.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          borderTop: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.05)"
            : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <Button
          onClick={onClose}
          disabled={purchaseLoading}
          sx={{
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(0, 0, 0, 0.6)",
            "&:hover": {
              bgcolor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handlePurchase}
          variant="contained"
          color="primary"
          disabled={loading || purchaseLoading || !hasSufficientFunds()}
          startIcon={
            purchaseLoading && <CircularProgress size={20} color="inherit" />
          }
          sx={{
            px: 3,
            py: 1,
            borderRadius: 1.5,
            boxShadow: !isDarkMode && "0 4px 12px rgba(59, 130, 246, 0.2)",
            background:
              !isDarkMode &&
              !loading &&
              !purchaseLoading &&
              hasSufficientFunds() &&
              "linear-gradient(90deg, #3b82f6, #4f46e5)",
            "&:hover": {
              boxShadow: !isDarkMode && "0 6px 16px rgba(59, 130, 246, 0.3)",
            },
          }}
        >
          {purchaseLoading ? "Traitement en cours..." : "Confirmer l'achat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseDigitalProductModal;
