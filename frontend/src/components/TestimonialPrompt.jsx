import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, StarIcon } from "@heroicons/react/24/solid";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import { toast } from "react-toastify";

/**
 * Composant qui affiche les invitations à témoigner aux utilisateurs
 * dans les moments opportuns (après un succès, un gain, etc.)
 */
const TestimonialPrompt = () => {
  const [activePrompt, setActivePrompt] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    rating: 5,
  });
  const { isDarkMode } = useTheme();

  // Récupérer les invitations actives au chargement du composant
  useEffect(() => {
    const fetchActivePrompts = async () => {
      try {
        const response = await axios.get("/api/testimonials/prompts/active");
        if (response.data.success && response.data.prompts.length > 0) {
          // Prendre la première invitation active
          setActivePrompt(response.data.prompts[0]);

          // Marquer l'invitation comme affichée
          await axios.post(
            `/api/testimonials/prompts/${response.data.prompts[0].id}/display`
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des invitations à témoigner:",
          error
        );
      }
    };

    fetchActivePrompts();
  }, []);

  // Si aucune invitation active, ne rien afficher
  if (!activePrompt) {
    return null;
  }

  // Gérer la soumission du formulaire de témoignage
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Marquer l'invitation comme cliquée si ce n'est pas déjà fait
      if (!isFormOpen) {
        await axios.post(`/api/testimonials/prompts/${activePrompt.id}/click`);
        setIsFormOpen(true);
        setIsLoading(false);
        return;
      }

      // Soumettre le témoignage
      const response = await axios.post(
        `/api/testimonials/prompts/${activePrompt.id}/submit`,
        formData
      );

      if (response.data.success) {
        toast.success(
          "Merci pour votre témoignage ! Il sera examiné par notre équipe."
        );
        setActivePrompt(null);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du témoignage:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  // Décliner l'invitation à témoigner
  const handleDecline = async () => {
    try {
      await axios.post(`/api/testimonials/prompts/${activePrompt.id}/decline`);
      setActivePrompt(null);
    } catch (error) {
      console.error("Erreur lors du refus de l'invitation:", error);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gérer le changement de note (étoiles)
  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  return (
    <AnimatePresence>
      {activePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <div
            className={`rounded-lg shadow-xl overflow-hidden ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* En-tête */}
            <div
              className={`px-4 py-3 flex justify-between items-center ${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {isFormOpen
                  ? "Partagez votre expérience"
                  : "Votre avis compte !"}
              </h3>
              <button
                onClick={handleDecline}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Corps */}
            <div className="p-4">
              {!isFormOpen ? (
                // Affichage initial de l'invitation
                <div>
                  <p
                    className={`mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {activePrompt.message}
                  </p>
                  <div className="flex justify-between">
                    <button
                      onClick={handleDecline}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      } transition-colors`}
                      disabled={isLoading}
                    >
                      Plus tard
                    </button>
                    <button
                      onClick={handleSubmit}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-primary-600 hover:bg-primary-700 text-white"
                          : "bg-primary-500 hover:bg-primary-600 text-white"
                      } transition-colors`}
                      disabled={isLoading}
                    >
                      {isLoading ? "Chargement..." : "Donner mon avis"}
                    </button>
                  </div>
                </div>
              ) : (
                // Formulaire de témoignage
                <form onSubmit={handleSubmit}>
                  {/* Évaluation par étoiles */}
                  <div className="mb-4">
                    <label
                      className={`block mb-2 font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Votre évaluation
                    </label>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(star)}
                          className="focus:outline-none"
                        >
                          <StarIcon
                            className={`h-8 w-8 ${
                              star <= formData.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Témoignage */}
                  <div className="mb-4">
                    <label
                      htmlFor="content"
                      className={`block mb-2 font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Votre témoignage
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      className={`w-full px-3 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      } border focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      placeholder="Partagez votre expérience avec SOLIFIN..."
                    />
                    <p
                      className={`mt-1 text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {formData.content.length}/1000 caractères
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleDecline}
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      } transition-colors`}
                      disabled={isLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-md ${
                        isDarkMode
                          ? "bg-primary-600 hover:bg-primary-700 text-white"
                          : "bg-primary-500 hover:bg-primary-600 text-white"
                      } transition-colors`}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Envoi en cours..."
                        : "Envoyer mon témoignage"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TestimonialPrompt;
