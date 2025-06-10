import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCoins, FaHistory } from "react-icons/fa";

/**
 * Composant pour gérer la valeur des points bonus
 * Permet à l'administrateur de configurer la valeur d'un point en devise
 */
const BonusPointValue = () => {
  const [currentValue, setCurrentValue] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchCurrentValue();
  }, []);

  const fetchCurrentValue = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/bonus-points/value");
      if (response.data.success) {
        setCurrentValue(response.data.value);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la valeur du point:",
        error
      );
      toast.error("Erreur lors de la récupération de la valeur du point");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newValue || isNaN(parseFloat(newValue)) || parseFloat(newValue) <= 0) {
      toast.error("Veuillez entrer une valeur valide supérieure à 0");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/bonus-points/value", {
        valeur_point: parseFloat(newValue),
      });

      if (response.data.success) {
        toast.success("Valeur du point mise à jour avec succès");
        setCurrentValue(response.data.value);
        setNewValue("");
        fetchCurrentValue();
      }
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la valeur du point:",
        error
      );
      toast.error("Erreur lors de la mise à jour de la valeur du point");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <FaCoins className="text-yellow-500 text-2xl mr-2" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Configuration des Points Bonus
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Valeur actuelle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Valeur Actuelle du Point
          </h2>
          <div className="flex items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? "..." : currentValue} €
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                par point bonus
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire de mise à jour */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Modifier la Valeur
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="newValue"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nouvelle valeur ($)
              </label>
              <input
                type="number"
                id="newValue"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0.01"
                step="0.01"
                placeholder="Entrez la nouvelle valeur..."
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cette valeur sera utilisée pour convertir les points en devise
                dans le wallet des utilisateurs.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Mettre à jour la valeur"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FaHistory className="text-gray-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Informations sur le Système de Points
          </h2>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            Le système de <strong>Bonus sur Délais</strong> permet d'attribuer
            des points aux utilisateurs en fonction du nombre de filleuls qu'ils
            parrainent dans une période donnée.
          </p>
          <h3>Fonctionnement :</h3>
          <ul>
            <li>
              Pour chaque pack, vous pouvez configurer différents paliers de
              bonus.
            </li>
            <li>
              Exemple : "7 à 13 filleuls en une semaine = 1 point", "14 à 20 = 2
              points", etc.
            </li>
            <li>
              Les points sont attribués automatiquement à la fin de chaque
              période.
            </li>
            <li>
              Les utilisateurs peuvent convertir leurs points en devise dans
              leur wallet.
            </li>
          </ul>
          <p>
            La valeur du point définie ici est utilisée lors de la conversion
            des points en devise. Par exemple, si un point vaut 10€ et qu'un
            utilisateur convertit 5 points, il recevra 50€ dans son wallet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BonusPointValue;
