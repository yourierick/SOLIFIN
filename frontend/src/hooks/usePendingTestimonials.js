import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook personnalisé pour récupérer le nombre de témoignages en attente
 *
 * @returns {Object} Un objet contenant le nombre de témoignages en attente et l'état de chargement
 */
const usePendingTestimonials = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingCount = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/testimonials/count-pending");

      if (response.data.success) {
        setPendingCount(response.data.count);
      } else {
        console.error(
          "Erreur lors de la récupération des témoignages en attente:",
          response.data.message
        );
        setError(response.data.message);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des témoignages en attente:",
        err
      );
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Rafraîchir le compteur toutes les 2 minutes
    const interval = setInterval(() => {
      // Vérifier si la page est visible avant de faire la requête
      if (document.visibilityState === "visible") {
        fetchPendingCount();
      }
    }, 2 * 60 * 1000);

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Rafraîchir les données quand l'utilisateur revient sur la page
        fetchPendingCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { pendingCount, loading, error, refresh: fetchPendingCount };
};

export default usePendingTestimonials;
