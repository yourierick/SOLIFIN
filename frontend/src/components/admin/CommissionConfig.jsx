import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';

export default function CommissionConfig({ packId }) {
  const [commissions, setCommissions] = useState([
    { generation: 1, rate: 0 },
    { generation: 2, rate: 0 },
    { generation: 3, rate: 0 },
    { generation: 4, rate: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCommissionRates();
  }, [packId]);

  const fetchCommissionRates = async () => {
    try {
      const response = await axios.get(`/api/admin/packs/${packId}/commission-rates`);
      if (response.data.success) {
        const rates = response.data.data.rates;
        setCommissions(rates.map(rate => ({
          generation: rate.level,
          rate: parseFloat(rate.rate)
        })));
      }
    } catch (error) {
      showToast('error', 'Erreur lors du chargement des taux de commission');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (generation, value) => {
    const rate = parseFloat(value);
    if (isNaN(rate) || rate < 0 || rate > 100) return;

    setCommissions(prev => prev.map(comm => 
      comm.generation === generation ? { ...comm, rate } : comm
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.put(`/api/admin/packs/${packId}/commission-rates`, {
        rates: commissions
      });

      if (response.data.success) {
        showToast('success', 'Taux de commission mis à jour avec succès');
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la mise à jour des taux');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Chargement des taux de commission...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Configuration des Commissions
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {commissions.map(({ generation, rate }) => (
            <div key={generation} className="flex items-center space-x-4">
              <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                Génération {generation}
              </label>
              <div className="relative rounded-md shadow-sm flex-1">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => handleRateChange(generation, e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les taux'}
          </button>
        </div>
      </form>
    </div>
  );
}
