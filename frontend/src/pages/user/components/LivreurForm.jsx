import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function LivreurForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: '',
    coordonnees: '',
    zone_livraison: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.coordonnees.trim()) {
      setError('Veuillez fournir vos coordonnées');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit(formData);
      // Le formulaire sera fermé par le parent après soumission réussie
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la soumission');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Postuler comme livreur</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="coordonnees" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Coordonnées <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="coordonnees"
              name="coordonnees"
              value={formData.coordonnees}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Téléphone, email, etc."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ces coordonnées seront utilisées pour vous contacter concernant les livraisons.
            </p>
          </div>

          <div>
            <label htmlFor="zone_livraison" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Zone de livraison
            </label>
            <input
              type="text"
              id="zone_livraison"
              name="zone_livraison"
              value={formData.zone_livraison}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Quartier Nord, Centre-ville, etc."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Décrivez votre expérience, disponibilité, moyens de transport, etc."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
