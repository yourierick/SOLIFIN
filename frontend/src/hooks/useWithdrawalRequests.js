import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook personnalisé pour récupérer le nombre de demandes de retrait en attente
 * @returns {Object} { pendingCount, loading, error }
 */
export default function useWithdrawalRequests() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/withdrawal/requests');
        
        if (response.data.success) {
          // Filtrer les demandes en attente
          const pendingRequests = response.data.requests.filter(
            request => request.status === 'pending'
          );
          setPendingCount(pendingRequests.length);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des demandes de retrait:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();

    // Rafraîchir les données toutes les 5 minutes
    const intervalId = setInterval(fetchPendingRequests, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return { pendingCount, loading, error };
}
