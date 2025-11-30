import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notification from "../../components/Notification";

export default function FaqForm({
  faq,
  categories,
  onSave,
  onCancel,
  isDarkMode,
}) {
  const [formData, setFormData] = useState({
    id: null,
    question: "",
    answer: "",
    category_id: "",
    is_published: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [relatedFaqs, setRelatedFaqs] = useState([]);
  const [availableFaqs, setAvailableFaqs] = useState([]);

  // Initialiser le formulaire avec les données de la FAQ
  useEffect(() => {
    if (faq) {
      setFormData({
        id: faq.id || null,
        question: faq.question || "",
        answer: faq.answer || "",
        category_id: faq.category_id || categories[0]?.id || "",
        is_published: faq.is_published !== undefined ? faq.is_published : true,
      });

      // Charger les FAQ liées si on édite une FAQ existante
      if (faq.id) {
        loadRelatedFaqs(faq.id);
      }
    }
  }, [faq, categories]);

  // Charger les FAQ liées et disponibles
  const loadRelatedFaqs = async (faqId) => {
    try {
      const [relatedResponse, allFaqsResponse] = await Promise.all([
        axios.get(`/api/admin/faqs/${faqId}/related`),
        axios.get("/api/admin/faqs"),
      ]);

      setRelatedFaqs(relatedResponse.data || []);

      // Filtrer les FAQ disponibles (exclure la FAQ actuelle et celles déjà liées)
      const relatedIds = relatedResponse.data.map((f) => f.id);
      setAvailableFaqs(
        allFaqsResponse.data.filter(
          (f) => f.id !== faqId && !relatedIds.includes(f.id)
        )
      );
    } catch (error) {
      console.error("Erreur lors du chargement des FAQ liées:", error);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.question.trim()) {
      newErrors.question = "La question est requise";
    }

    if (!formData.answer.trim()) {
      newErrors.answer = "La réponse est requise";
    }

    if (!formData.category_id) {
      newErrors.category_id = "La catégorie est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      let response;

      if (formData.id) {
        // Mise à jour d'une FAQ existante
        response = await axios.put(`/api/admin/faqs/${formData.id}`, formData);
      } else {
        // Création d'une nouvelle FAQ
        response = await axios.post("/api/admin/faqs", formData);
      }

      setSaving(false);
      
      // Afficher une notification de succès
      const message = formData.id ? 'FAQ mise à jour avec succès' : 'FAQ ajoutée avec succès';
      toast.success(message);
      Notification.success(message);
      
      onSave(response.data);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setSaving(false);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error("Une erreur est survenue lors de l'enregistrement");
        Notification.error("Une erreur est survenue lors de l'enregistrement");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border ${
          isDarkMode
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">
            {formData.id ? "Modifier la FAQ" : "Ajouter une nouvelle FAQ"}
          </h2>
          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="space-y-5">
            {/* Champ Question */}
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium mb-1"
              >
                Question
              </label>
              <input
                type="text"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.question ? "border-red-500" : ""}`}
              />
              {errors.question && (
                <p className="mt-1 text-sm text-red-500">{errors.question}</p>
              )}
            </div>

            {/* Champ Réponse */}
            <div>
              <label
                htmlFor="answer"
                className="block text-sm font-medium mb-1"
              >
                Réponse
              </label>
              <textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                rows="6"
                className={`w-full p-2 border rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.answer ? "border-red-500" : ""}`}
              ></textarea>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Vous pouvez utiliser du HTML simple pour la mise en forme (gras,
                italique, liens, etc.)
              </p>
              {errors.answer && (
                <p className="mt-1 text-sm text-red-500">{errors.answer}</p>
              )}
            </div>

            {/* Champ Catégorie */}
            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium mb-1"
              >
                Catégorie
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } ${errors.category_id ? "border-red-500" : ""}`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.category_id}
                </p>
              )}
            </div>

            {/* Champ Publication */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm">
                Publier cette FAQ
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              } ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {saving
                ? "Enregistrement..."
                : formData.id
                ? "Mettre à jour"
                : "Ajouter"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
