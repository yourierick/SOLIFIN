import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { motion } from "framer-motion";
import FaqList from "../../components/admin/FaqList";
import FaqForm from "../../components/admin/FaqForm";
import CategoryList from "../../components/admin/CategoryList";
import FaqStats from "../../components/admin/FaqStats";

// Composant principal pour la gestion des FAQ
export default function FaqManagement() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("faqs");
  const { isDarkMode } = useTheme();

  // État pour le formulaire d'édition
  const [editingFaq, setEditingFaq] = useState(null);

  // Chargement des données
  const fetchData = async () => {
    try {
      setLoading(true);
      const [faqsResponse, categoriesResponse] = await Promise.all([
        axios.get("/api/faqs"),
        axios.get("/api/faq/categories"),
      ]);

      setFaqs(faqsResponse.data);
      setCategories(categoriesResponse.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Impossible de charger les données");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gestion de la sauvegarde d'une FAQ
  const handleSaveFaq = () => {
    fetchData();
    setEditingFaq(null);
  };

  // Gestion des onglets
  const tabs = [
    { id: "faqs", label: "Questions" },
    { id: "categories", label: "Catégories" },
    { id: "stats", label: "Statistiques" },
  ];

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      } p-4 rounded-lg shadow-md`}
    >
      <h1 className="text-2xl font-bold mb-6">Gestion des FAQ</h1>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                activeTab === tab.id
                  ? isDarkMode
                    ? "bg-gray-800 text-blue-400 border-b-2 border-blue-400"
                    : "bg-white text-blue-600 border-b-2 border-blue-600"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : (
        <div>
          {activeTab === "faqs" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FaqList
                faqs={faqs}
                categories={categories}
                onUpdate={fetchData}
                isDarkMode={isDarkMode}
                onEdit={setEditingFaq}
              />

              {editingFaq && (
                <FaqForm
                  faq={editingFaq}
                  categories={categories}
                  onSave={handleSaveFaq}
                  onCancel={() => setEditingFaq(null)}
                  isDarkMode={isDarkMode}
                />
              )}
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CategoryList
                categories={categories}
                onUpdate={fetchData}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FaqStats
                faqs={faqs}
                categories={categories}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
