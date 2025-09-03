import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useChat } from "../../contexts/ChatContext";
import { useToast } from "../../contexts/ToastContext";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notification from "../../components/Notification";

export default function Faq() {
  const { isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { createChatRoom, setActiveRoom, setIsChatExpanded, fetchChatRooms } = useChat();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [relatedFaqs, setRelatedFaqs] = useState({});
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Charger les FAQs et les catégories au chargement de la page
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [faqsResponse, categoriesResponse] = await Promise.all([
          axios.get("/api/faqs"),
          axios.get("/api/faq/categories"),
        ]);

        console.log('FAQs data:', faqsResponse.data);
        console.log('Categories data:', categoriesResponse.data);

        setFaqs(faqsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Erreur lors du chargement des FAQs");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction pour basculer l'expansion d'une FAQ
  const toggleFaq = async (id) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);

      // Charger les FAQs liées si elles n'ont pas déjà été chargées
      if (!relatedFaqs[id]) {
        try {
          const response = await axios.get(`/api/faqs/${id}/related`);
          setRelatedFaqs((prev) => ({
            ...prev,
            [id]: response.data,
          }));
        } catch (error) {
          console.error("Erreur lors du chargement des FAQs liées:", error);
        }
      }
    }
  };

  // Fonction pour voter pour une FAQ
  const voteFaq = async (id, isUpvote) => {
    try {
      await axios.post(`/api/faqs/${id}/vote`, { is_upvote: isUpvote });

      // Mettre à jour les FAQs localement
      setFaqs((prevFaqs) =>
        prevFaqs.map((faq) => {
          if (faq.id === id) {
            return {
              ...faq,
              upvotes: isUpvote ? (faq.upvotes || 0) + 1 : faq.upvotes,
              downvotes: !isUpvote ? (faq.downvotes || 0) + 1 : faq.downvotes,
            };
          }
          return faq;
        })
      );

      toast.success("Merci pour votre vote!");
    } catch (error) {
      console.error("Erreur lors du vote:", error);
      toast.error("Erreur lors de l'enregistrement de votre vote");
    }
  };

  // Fonction pour contacter le support (approche intégrée)
  const handleContactSupport = async () => {
    try {
      setLoadingSupport(true);
      const response = await axios.get('/api/support/contact');
      
      if (response.data && response.data.room_id) {
        // Récupérer toutes les salles de chat
        await fetchChatRooms();
        
        // Trouver la salle correspondante dans la liste des salles
        const rooms = await axios.get('/api/chat/rooms');
        const supportRoom = rooms.data.rooms.find(room => room.id === response.data.room_id);
        
        if (supportRoom) {
          // Définir cette salle comme salle active
          setActiveRoom(supportRoom);
          
          // Ouvrir automatiquement la fenêtre de chat
          setIsChatExpanded(true);
          
          showToast('Conversation avec le support ouverte', 'success');
        } else {
          showToast('Erreur lors de la récupération des détails de la conversation', 'error');
        }
      } else {
        showToast('Erreur lors de la connexion avec le support', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion avec le support:', error);
      showToast('Erreur lors de la connexion avec le support', 'error');
    } finally {
      setLoadingSupport(false);
    }
  };

  // Filtrer les FAQs en fonction de la catégorie sélectionnée et de la recherche
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" ||
      faq.category_id === parseInt(selectedCategory);
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1
            className={`text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Foire Aux Questions
          </h1>
          <button
            onClick={handleContactSupport}
            disabled={loadingSupport}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              isDarkMode
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } ${loadingSupport ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            {loadingSupport ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </>
            ) : (
              "Contacter le support"
            )}
          </button>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="w-full md:w-1/3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-2/3 relative">
            <input
              type="text"
              placeholder="Rechercher dans les FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-3 pl-10 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Liste des FAQs */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                isDarkMode ? "border-green-400" : "border-green-600"
              }`}
            ></div>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div
            className={`text-center p-8 rounded-lg ${
              isDarkMode
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <p>Aucune FAQ ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg overflow-hidden shadow-md ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                {/* En-tête de la FAQ */}
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className={`w-full p-4 text-left flex justify-between items-center ${
                    expandedFaq === faq.id
                      ? isDarkMode
                        ? "bg-green-800 text-white"
                        : "bg-green-600 text-white"
                      : isDarkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  {expandedFaq === faq.id ? (
                    <ChevronUpIcon className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
                  )}
                </button>

                {/* Contenu de la FAQ */}
                {expandedFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 border-t"
                  >
                    <div
                      className={`prose max-w-none ${
                        isDarkMode ? "prose-invert" : ""
                      }`}
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />

                    {/* Section de vote */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            voteFaq(faq.id, true);
                          }}
                          className={`flex items-center space-x-1 px-2 py-1 rounded ${
                            isDarkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <HandThumbUpIcon className="h-5 w-5 text-green-500" />
                          <span>{faq.upvotes || 0}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            voteFaq(faq.id, false);
                          }}
                          className={`flex items-center space-x-1 px-2 py-1 rounded ${
                            isDarkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <HandThumbDownIcon className="h-5 w-5 text-red-500" />
                          <span>{faq.downvotes || 0}</span>
                        </button>
                      </div>

                      {/* Catégorie */}
                      <div
                        className={`text-sm px-2 py-1 rounded ${
                          isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {categories.find((c) => c.id === faq.category_id)
                          ?.name || "Sans catégorie"}
                      </div>
                    </div>

                    {/* FAQs liées */}
                    {relatedFaqs[faq.id] && relatedFaqs[faq.id].length > 0 && (
                      <div className="mt-6">
                        <h4
                          className={`text-md font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Questions liées
                        </h4>
                        <ul
                          className={`space-y-2 pl-4 border-l-2 ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          {relatedFaqs[faq.id].map((relatedFaq) => (
                            <li key={relatedFaq.id}>
                              <button
                                onClick={() => {
                                  setExpandedFaq(relatedFaq.id);
                                  // Faire défiler jusqu'à la FAQ liée
                                  document
                                    .getElementById(`faq-${relatedFaq.id}`)
                                    ?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                }}
                                className={`text-left hover:underline ${
                                  isDarkMode
                                    ? "text-green-400"
                                    : "text-green-600"
                                }`}
                              >
                                {relatedFaq.question}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
