import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook personnalisé pour récupérer le nombre de formations en attente
 * @returns {Object} - Objet contenant le nombre de formations en attente et l'état de chargement
 */
const usePendingFormations = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingFormations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/formations/pending/count");
      setPendingCount(response.data.count);
      setError(null);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des formations en attente:",
        err
      );
      setError("Impossible de charger les formations en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFormations();

    // Mettre à jour le compteur toutes les 5 minutes
    const interval = setInterval(() => {
      fetchPendingFormations();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { pendingCount, loading, error, refresh: fetchPendingFormations };
};

export default usePendingFormations;
