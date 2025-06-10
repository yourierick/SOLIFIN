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

    // Rafraîchir le compteur toutes les 5 minutes
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { pendingCount, loading, error, refresh: fetchPendingCount };
};

export default usePendingTestimonials;
