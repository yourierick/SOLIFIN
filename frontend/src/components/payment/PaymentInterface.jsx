import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';

export default function PaymentInterface({ purchaseId }) {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPurchaseDetails();
  }, [purchaseId]);

  const fetchPurchaseDetails = async () => {
    try {
      const response = await axios.get(`/api/purchases/${purchaseId}`);
      if (response.data.success) {
        setPurchase(response.data.data.purchase);
      }
    } catch (error) {
      showToast('error', 'Erreur lors du chargement des détails de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method) => {
    setProcessing(true);
    try {
      const response = await axios.post(`/api/purchases/${purchaseId}/process`, {
        payment_method: method
      });

      if (response.data.success) {
        showToast('success', 'Paiement effectué avec succès');
        // Redirection vers le tableau de bord après 2 secondes
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      showToast('error', 'Erreur lors du traitement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Achat non trouvé
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* En-tête */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Paiement du Pack
            </h2>
          </div>

          {/* Détails de l'achat */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {purchase.pack.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {purchase.pack.description}
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Prix
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {purchase.pack.price}€
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Méthodes de paiement */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Choisissez votre méthode de paiement
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePayment('card')}
                disabled={processing}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {processing ? 'Traitement...' : 'Payer par Carte Bancaire'}
              </button>

              <button
                onClick={() => handlePayment('bank_transfer')}
                disabled={processing}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {processing ? 'Traitement...' : 'Virement Bancaire'}
              </button>
            </div>
          </div>

          {/* Note de sécurité */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paiement 100% sécurisé. Vos informations de paiement sont chiffrées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
