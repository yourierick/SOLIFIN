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
      setError(null);

      // Récupérer les compteurs pour chaque type de publication avec gestion d'erreur individuelle
      const [
        advertisementsRes,
        jobOffersRes,
        businessOpportunitiesRes,
        socialEventsRes,
        digitalProductsRes,
      ] = await Promise.allSettled([
        axios
          .get("/api/admin/advertisements/pending/count")
          .catch(() => ({ data: { count: 0 } })),
        axios
          .get("/api/admin/job-offers/pending/count")
          .catch(() => ({ data: { count: 0 } })),
        axios
          .get("/api/admin/business-opportunities/pending/count")
          .catch(() => ({ data: { count: 0 } })),
        axios
          .get("/api/admin/social-events/pending/count")
          .catch(() => ({ data: { count: 0 } })),
        axios
          .get("/api/admin/digital-products/pending/count")
          .catch(() => ({ data: { count: 0 } })),
      ]);

      // Extraire et valider les compteurs de chaque réponse
      const advertisementsCount =
        advertisementsRes.status === "fulfilled"
          ? advertisementsRes.value?.data?.count || 0
          : 0;
      const jobOffersCount =
        jobOffersRes.status === "fulfilled"
          ? jobOffersRes.value?.data?.count || 0
          : 0;
      const businessOpportunitiesCount =
        businessOpportunitiesRes.status === "fulfilled"
          ? businessOpportunitiesRes.value?.data?.count || 0
          : 0;
      const socialEventsCount =
        socialEventsRes.status === "fulfilled"
          ? socialEventsRes.value?.data?.count || 0
          : 0;
      const digitalProductsCount =
        digitalProductsRes.status === "fulfilled"
          ? digitalProductsRes.value?.data?.count || 0
          : 0;

      // Calculer le total des publications en attente
      const totalPending =
        advertisementsCount +
        jobOffersCount +
        businessOpportunitiesCount +
        socialEventsCount +
        digitalProductsCount;

      setPendingCount(totalPending);
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des publications en attente:",
        err
      );
      setError("Impossible de charger les publications en attente");
      // En cas d'erreur générale, mettre à 0 pour éviter NaN
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPublications();

    // Mettre à jour le compteur toutes les 2 minutes
    const interval = setInterval(() => {
      // Vérifier si la page est visible avant de faire la requête
      if (document.visibilityState === "visible") {
        fetchPendingPublications();
      }
    }, 2 * 60 * 1000);

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Rafraîchir les données quand l'utilisateur revient sur la page
        fetchPendingPublications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { pendingCount, loading, error, refresh: fetchPendingPublications };
};

export default usePendingPublications;
