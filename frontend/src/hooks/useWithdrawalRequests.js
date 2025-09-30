import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook personnalisé pour récupérer le nombre de demandes de retrait en attente
 * @returns {Object} { pendingCount, loading, error }
 */
export default function useWithdrawalRequests() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/admin/withdrawal/requests");

        if (response.data.success) {
          // Accéder aux données selon la structure de réponse observée
          if (
            response.data.data &&
            response.data.data.data &&
            Array.isArray(response.data.data.data)
          ) {
            // Structure pagination Laravel: response.data.data.data
            const pendingRequests = response.data.data.data.filter(
              (request) => request.status === "pending"
            );
            setPendingCount(pendingRequests.length);
          } else if (Array.isArray(response.data.data)) {
            // Alternative: données directement dans response.data.data
            const pendingRequests = response.data.data.filter(
              (request) => request.status === "pending"
            );
            setPendingCount(pendingRequests.length);
          } else if (Array.isArray(response.data.requests)) {
            // Ancienne structure possible: response.data.requests
            const pendingRequests = response.data.requests.filter(
              (request) => request.status === "pending"
            );
            setPendingCount(pendingRequests.length);
          } else {
            // Si aucune donnée valide n'est trouvée
            console.warn("Format de réponse inattendu");
            setPendingCount(0);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes de retrait");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();

    // Rafraîchir les données toutes les 1 minute
    const intervalId = setInterval(() => {
      // Vérifier si la page est visible avant de faire la requête
      if (document.visibilityState === "visible") {
        fetchPendingRequests();
      }
    }, 1 * 60 * 1000);

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Rafraîchir les données quand l'utilisateur revient sur la page
        fetchPendingRequests();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { pendingCount, loading };
}
