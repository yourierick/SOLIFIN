import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Alert,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import Notification from "../components/Notification";
import axios from "../utils/axios";
import RegistrationPaymentForm from "../components/RegistrationPaymentForm";
import { useTheme } from "../contexts/ThemeContext";

const PurchasePack = () => {
  const { sponsor_code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [pack, setPack] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentError, setPaymentError] = useState(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [registrationFailed, setRegistrationFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(null);
  const [registrationError, setRegistrationError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const pollingIntervalRef = useRef(null);

  // Récupérer les données d'inscription
  const registrationDataFromLocation =
    location.state?.registrationData ||
    JSON.parse(sessionStorage.getItem("registrationData"));

  useEffect(() => {
    // Vérifier si on vient du formulaire d'inscription
    const fromRegistration = location.state?.fromRegistration;
    if (!fromRegistration) {
      Notification.warning("Accès non autorisé");
      navigate("/register");
      return;
    }

    // Charger les détails du pack
    const fetchPack = async () => {
      try {
        const response = await axios.get(`/api/purchases/${sponsor_code}`);
        if (response.data.success) {
          setPack(response.data.data.pack);
          setSponsor(response.data.data.sponsor);
        } else {
          throw new Error("Pack non trouvé");
        }
      } catch (error) {
        Notification.error("Erreur lors du chargement du pack");
        navigate("/register");
      } finally {
        setLoading(false);
      }
    };

    fetchPack();
  }, [sponsor_code, navigate, location.state]);

  // Fonction pour vérifier le statut du paiement
  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(
        `/api/serdipay/guest/status/${sessionId}`
      );
      const data = response.data;

      // Mettre à jour le statut du paiement
      setPaymentStatus(data.status);

      // Si le paiement est terminé (succès ou échec)
      if (data.status === "success" || data.status === "completed") {
        // Vérifier si l'inscription a été finalisée
        setRegistrationCompleted(data.registration_completed);

        // Si l'inscription est terminée, arrêter le polling et rediriger
        if (data.registration_completed) {
          clearInterval(pollingIntervalRef.current);
          sessionStorage.removeItem("registrationData");
          Notification.success("Compte créé et pack acheté avec succès !");

          // Attendre un peu avant de rediriger
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
        // Si le paiement a réussi mais l'inscription a échoué
        else if (data.registration_failed) {
          clearInterval(pollingIntervalRef.current);
          setRegistrationFailed(true);
          setRetryToken(data.retry_token);
          setRegistrationError(
            data.registration_error ||
              "Une erreur est survenue lors de l'inscription"
          );
          setUserEmail(data.email || registrationDataFromLocation.email);
          setPaymentProcessing(false);

          Notification.warning(
            "Le paiement a réussi mais l'inscription a rencontré un problème. Vous pouvez réessayer sans payer à nouveau."
          );
        }
      } else if (data.status === "failed" || data.status === "error") {
        // En cas d'échec du paiement, arrêter le polling et afficher l'erreur
        clearInterval(pollingIntervalRef.current);
        setPaymentError(data.message || "Le paiement a échoué");
        setPaymentProcessing(false);
        setShowPaymentForm(true);
        Notification.error(data.message || "Le paiement a échoué");
      }
      // Si le statut est 'pending', continuer le polling
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
      // Ne pas arrêter le polling en cas d'erreur temporaire
    }
  };

  // Fonction pour réessayer l'inscription sans payer à nouveau
  const handleRetryRegistration = async () => {
    try {
      setIsRetrying(true);

      // Préparer les données pour la reprise d'inscription
      const retryData = {
        retry_token: retryToken,
        email: userEmail,
        registration_data: JSON.stringify(registrationDataFromLocation),
      };

      // Appeler l'API de reprise d'inscription
      const response = await axios.post(
        "/api/serdipay/retry-registration",
        retryData
      );

      if (response.data.status === "success") {
        // L'inscription a réussi cette fois
        sessionStorage.removeItem("registrationData");
        Notification.success("Compte créé et pack acheté avec succès !");

        // Attendre un peu avant de rediriger
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // L'inscription a encore échoué
        setRetryToken(response.data.retry_token);
        setRegistrationError(
          response.data.error ||
            "Une erreur est survenue lors de la reprise d'inscription"
        );
        Notification.error(
          response.data.message || "La reprise d'inscription a échoué"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la reprise d'inscription:", error);
      Notification.error(
        error.response?.data?.message ||
          error.message ||
          "Une erreur est survenue lors de la reprise d'inscription"
      );
    } finally {
      setIsRetrying(false);
    }
  };

  // Fonction pour démarrer le polling
  const startPolling = (sessionId) => {
    // Arrêter tout polling existant
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Vérifier immédiatement une première fois
    checkPaymentStatus(sessionId);

    // Puis vérifier toutes les 3 secondes
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(sessionId);
    }, 3000);
  };

  // Nettoyer l'intervalle lors du démontage du composant
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setPurchasing(true);

      // Stocker le type de paiement pour afficher le message approprié
      setPaymentMethod(paymentData.payment_type);

      // Créer une copie des données et ajouter les informations de paiement
      const registrationDataWithPayment = {
        ...registrationDataFromLocation,
        duration_months: paymentData.duration_months,
        currency: paymentData.currency,
        fees: paymentData.fees,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_type: paymentData.payment_type,
        payment_details: paymentData.payment_details,
        mobile_option: paymentData.mobile_option,
      };

      // Masquer le formulaire et afficher l'écran d'attente
      setShowPaymentForm(false);
      setPaymentProcessing(true);

      // Préparer les données pour l'API SerdiPay
      const serdiPayData = {
        phone_number: registrationDataWithPayment.phone,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.payment_method,
        payment_type: paymentData.payment_type,
        payment_details: paymentData.payment_details,
        email: registrationDataWithPayment.email,
        name: registrationDataWithPayment.name,
        registration_data: JSON.stringify(registrationDataWithPayment),
        pack_id: pack.id,
      };

      // Initier le paiement via SerdiPay
      const paymentResponse = await axios.post(
        `/api/serdipay/guest/payment`,
        serdiPayData
      );

      if (paymentResponse.data.status === "success") {
        // Stocker l'ID de session pour le polling
        const sessionId = paymentResponse.data.data.session_id;
        setSessionId(sessionId);

        // Démarrer le polling pour vérifier le statut du paiement
        startPolling(sessionId);

        return true;
      } else {
        throw new Error(
          paymentResponse.data.message ||
            "Erreur lors de l'initiation du paiement"
        );
      }
    } catch (error) {
      // En cas d'erreur, réafficher le formulaire
      setPaymentProcessing(false);
      setShowPaymentForm(true);

      Notification.error(
        error.response?.data?.message ||
          error.message ||
          "Une erreur est survenue"
      );
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Container maxWidth="md">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Paper
          sx={{
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#000000",
            boxShadow: isDarkMode
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
        >
          {paymentProcessing ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
              }}
            >
              <div className="flex justify-center items-center h-64">
                <div
                  className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                    isDarkMode ? "border-primary-400" : "border-primary-600"
                  }`}
                ></div>
              </div>
              <Typography
                variant="h6"
                sx={{ color: isDarkMode ? "#ffffff" : "#000000" }}
              >
                {paymentMethod === "mobile-money"
                  ? "Veuillez confirmer le paiement sur votre téléphone mobile"
                  : "Traitement du paiement en cours..."}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: isDarkMode
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(0, 0, 0, 0.7)",
                }}
              >
                Veuillez ne pas fermer cette page
              </Typography>
            </Box>
          ) : registrationFailed ? (
            <Box
              sx={{
                textAlign: "center",
                py: 2,
                backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                bgcolor: isDarkMode ? "#1f2937" : "#ffffff",
              }}
            >
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  backgroundColor: isDarkMode
                    ? "rgba(255, 193, 7, 0.1)"
                    : "rgba(255, 193, 7, 0.1)",
                  color: isDarkMode ? "#fff" : "inherit",
                  "& .MuiAlert-icon": {
                    color: isDarkMode ? "rgba(255, 193, 7, 0.9)" : "inherit",
                  },
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Votre paiement a été accepté mais l'inscription a échoué
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Erreur: {registrationError}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Vous pouvez réessayer l'inscription sans payer à nouveau.
                </Typography>
              </Alert>

              <Button
                variant="contained"
                color="primary"
                onClick={handleRetryRegistration}
                disabled={isRetrying}
                sx={{
                  mt: 2,
                  backgroundColor: isRetrying
                    ? "rgba(46, 125, 50, 0.7)"
                    : "#2E7D32",
                  "&:hover": {
                    backgroundColor: "#1B5E20",
                  },
                }}
              >
                {isRetrying ? (
                  <>
                    <CircularProgress
                      size={24}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Réessai en cours...
                  </>
                ) : (
                  "Réessayer l'inscription"
                )}
              </Button>
            </Box>
          ) : showPaymentForm ? (
            <RegistrationPaymentForm
              open={true}
              onClose={() => navigate("/register")}
              pack={{
                ...pack,
                name: `${pack.name} (Inscription)`,
                description: pack.description,
                sponsorName: sponsor?.name,
              }}
              onSubmit={handlePaymentSubmit}
              disabled={purchasing}
              isDarkMode={isDarkMode}
            />
          ) : null}

          {paymentError && !registrationFailed && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                backgroundColor: isDarkMode
                  ? "rgba(244, 67, 54, 0.1)"
                  : "rgba(244, 67, 54, 0.1)",
                color: isDarkMode ? "#fff" : "inherit",
                "& .MuiAlert-icon": {
                  color: isDarkMode ? "rgba(244, 67, 54, 0.9)" : "inherit",
                },
              }}
            >
              {paymentError}
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default PurchasePack;
