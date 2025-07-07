import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook personnalisé pour récupérer le nombre de publications en attente
 * @returns {Object} - Objet contenant le nombre de publications en attente et l'état de chargement
 */
const usePendingPublications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingPublications = async () => {
    try {
      setLoading(true);
      // Récupérer les compteurs pour chaque type de publication
      const [
        advertisementsRes,
        jobOffersRes,
        businessOpportunitiesRes,
        socialEventsRes,
        digitalProductsRes,
      ] = await Promise.all([
        axios.get("/api/admin/advertisements/pending/count"),
        axios.get("/api/admin/job-offers/pending/count"),
        axios.get("/api/admin/business-opportunities/pending/count"),
        axios.get("/api/admin/social-events/pending/count"),
        axios.get("/api/admin/digital-products/pending/count"),
      ]);

      // Calculer le total des publications en attente
      const totalPending = 
        (advertisementsRes.data.count || 0) +
        (jobOffersRes.data.count || 0) +
        (businessOpportunitiesRes.data.count || 0) +
        (socialEventsRes.data.count || 0) +
        (digitalProductsRes.data.count || 0);

      setPendingCount(totalPending);
      setError(null);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des publications en attente:",
        err
      );
      setError("Impossible de charger les publications en attente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPublications();

    // Mettre à jour le compteur toutes les 5 minutes
    const interval = setInterval(() => {
      fetchPendingPublications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { pendingCount, loading, error, refresh: fetchPendingPublications };
};

export default usePendingPublications;
