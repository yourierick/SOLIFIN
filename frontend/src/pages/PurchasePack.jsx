import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Alert } from "@mui/material";
import Notification from "../components/Notification";
import axios from "../utils/axios";
import RegistrationPaymentForm from "../components/RegistrationPaymentForm";

const PurchasePack = () => {
  const { sponsor_code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [pack, setPack] = useState(null);
  const [sponsor, setSponsor] = useState(null);
  const [registrationData, setRegistrationData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(true);

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

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setPurchasing(true);

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

      // Créer le compte utilisateur avec les informations de paiement
      const registerResponse = await axios.post(
        `/api/register/${pack.id}`,
        registrationDataWithPayment
      );
      if (!registerResponse.data.success) {
        throw new Error("Erreur lors de la création du compte");
      }

      // Succès
      sessionStorage.removeItem("registrationData");
      Notification.success("Compte créé et pack acheté avec succès !");
      navigate("/login");
    } catch (error) {
      Notification.error(
        error.response?.data?.message || "Une erreur est survenue"
      );
      return false;
    } finally {
      setPurchasing(false);
    }
    return true;
  };

  const handlePaymentSuccess = async () => {
    try {
      // Envoyer les données d'inscription au serveur
      const response = await axios.post(
        "/api/register",
        registrationDataFromLocation
      );

      if (response.data.success) {
        // Nettoyer les données temporaires
        sessionStorage.removeItem("registrationData");

        // Rediriger vers la vérification email ou le dashboard
        navigate("/email/verify");
      }
    } catch (error) {
      Notification.error("Erreur lors de la finalisation de l'inscription");
    }
  };

  // Vérifier si on vient bien de l'inscription
  useEffect(() => {
    if (
      !location.state?.fromRegistration &&
      !sessionStorage.getItem("registrationData")
    ) {
      navigate("/register");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111827]">
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Pack non trouvé</Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827]">
      <Container maxWidth="sm" sx={{ mt: 10, mb: 10 }}>
        {showPaymentForm && pack && (
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
            loading={purchasing}
          />
        )}
      </Container>
    </div>
  );
};

export default PurchasePack;
