import React, { useState, useEffect } from 'react';
import Indicateur from './Indicateur';
import { indicateursTelephoniques, getIndicateursByIds, updateIndicateursValues } from '../data/IndicateursTelephoniques';
import axios from 'axios';

/**
 * Panneau d'affichage des indicateurs téléphoniques
 * @param {Array} indicateursIds - Liste des IDs des indicateurs à afficher (optionnel, tous par défaut)
 * @param {string} title - Titre du panneau (optionnel)
 * @param {boolean} fetchData - Si true, récupère les données depuis l'API (optionnel)
 * @param {string} apiEndpoint - Point d'API pour récupérer les données (optionnel)
 */
export default function IndicateursTelephoniquesPanel({ 
  indicateursIds, 
  title = "Indicateurs Téléphoniques", 
  fetchData = false,
  apiEndpoint = '/api/indicateurs-telephoniques'
}) {
  const [indicateurs, setIndicateurs] = useState(
    indicateursIds 
      ? getIndicateursByIds(indicateursIds) 
      : indicateursTelephoniques
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si fetchData est true, récupérer les données depuis l'API
    if (fetchData) {
      const fetchIndicateurs = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await axios.get(apiEndpoint);
          const updatedIndicateurs = updateIndicateursValues(response.data);
          setIndicateurs(
            indicateursIds 
              ? getIndicateursByIds(indicateursIds).map(ind => {
                  const updated = updatedIndicateurs.find(u => u.id === ind.id);
                  return updated || ind;
                })
              : updatedIndicateurs
          );
        } catch (error) {
          console.error("Erreur lors de la récupération des indicateurs:", error);
          setError("Impossible de charger les indicateurs");
        } finally {
          setIsLoading(false);
        }
      };

      fetchIndicateurs();
    }
  }, [fetchData, apiEndpoint, indicateursIds]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {indicateurs.map((indicateur) => (
            <Indicateur
              key={indicateur.id}
              title={indicateur.title}
              value={indicateur.value}
              unit={indicateur.unit}
              className={indicateur.className}
              icon={indicateur.icon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
