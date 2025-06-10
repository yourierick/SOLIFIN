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
import { useTheme } from "@mui/material/styles";
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
    return userWallet.balance >= calculateTotal();
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? "#1f2937" : "#fff",
          background: isDarkMode ? "#1f2937" : "#fff",
          borderRadius: 2,
        },
      }}
      sx={{
        backdropFilter: "blur(5px)",
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
        },
      }}
    >
      <DialogTitle sx={{ p: 2 }}>Acheter cette formation</DialogTitle>
      <DialogContent>
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
              <Typography variant="h6" gutterBottom>
                {formation.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formation.description}
              </Typography>
              {formation.instructor && (
                <Typography variant="body2" color="text.secondary">
                  Par: {formation.instructor.name}
                </Typography>
              )}
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
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Détails du paiement
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Prix de la formation:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${parseFloat(formation.price).toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">
                  Frais de transaction ({feePercentage}%):
                </Typography>
                <Typography variant="body2">
                  ${calculateFees().toFixed(2)}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle2">Total à payer:</Typography>
                <Typography variant="subtitle2" fontWeight="bold">
                  ${calculateTotal().toFixed(2)}
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Votre solde actuel:
              </Typography>
              <Typography
                variant="h6"
                color={hasSufficientFunds() ? "success.main" : "error.main"}
              >
                ${userWallet?.balance || "0.00"}
              </Typography>
            </Box>

            {!hasSufficientFunds() && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Vous n'avez pas assez de fonds dans votre portefeuille pour
                acheter cette formation. Veuillez recharger votre compte avant
                de continuer.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={purchaseLoading}>
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
        >
          {purchaseLoading ? "Traitement en cours..." : "Confirmer l'achat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseFormationModal;
