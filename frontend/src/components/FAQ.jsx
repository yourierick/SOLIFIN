import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { HandThumbUpIcon as ThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbDownIcon as ThumbDownIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";

// Fonction pour obtenir l'icône correspondante
const getIcon = (iconName) => {
  switch (iconName) {
    case "information-circle":
      return InformationCircleIcon;
    case "user-group":
      return UserGroupIcon;
    case "currency-dollar":
      return CurrencyDollarIcon;
    case "credit-card":
      return CreditCardIcon;
    default:
      return InformationCircleIcon;
  }
};

// Données de secours en cas d'erreur de chargement
const fallbackFaqs = [
  {
    id: 1,
    category_id: 1,
    question: "Comment fonctionne le système de parrainage ?",
    answer:
      "Notre système de parrainage fonctionne sur plusieurs niveaux. Vous recevez des commissions à chaque fois qu'une personne s'inscrit en utilisant votre code de parrainage, ainsi que sur les inscriptions réalisées par vos filleuls.",
    is_featured: true,
    order: 1,
    helpful_votes: 24,
    unhelpful_votes: 2,
    category: { name: "Parrainage", slug: "parrainage", icon: "user-group" },
  },
  {
    id: 2,
    category_id: 2,
    question: "Quels sont les différents niveaux de commission ?",
    answer:
      "SOLIFIN propose différents niveaux de commission selon la profondeur de votre réseau : Niveau 1 : 10% du montant de l'inscription, Niveau 2 : 5% du montant de l'inscription, Niveau 3 : 2% du montant de l'inscription. Plus votre réseau s'agrandit, plus vos commissions augmentent.",
    is_featured: true,
    order: 2,
    helpful_votes: 18,
    unhelpful_votes: 1,
    category: {
      name: "Commissions",
      slug: "commissions",
      icon: "currency-dollar",
    },
  },
  {
    id: 3,
    category_id: 3,
    question: "Comment puis-je retirer mes gains ?",
    answer:
      'Pour retirer vos gains, rendez-vous dans la section "Portefeuille" de votre tableau de bord et cliquez sur "Retrait". Vous pouvez choisir parmi plusieurs méthodes de paiement : virement bancaire, mobile money, ou crypto-monnaies. Le délai de traitement varie selon la méthode choisie, généralement entre 24h et 72h.',
    is_featured: true,
    order: 3,
    helpful_votes: 32,
    unhelpful_votes: 3,
    category: { name: "Paiements", slug: "paiements", icon: "credit-card" },
  },
];

// Données de secours pour les catégories
const fallbackCategories = [
  {
    id: 1,
    name: "Général",
    slug: "general",
    icon: "information-circle",
    order: 1,
  },
  {
    id: 2,
    name: "Parrainage",
    slug: "parrainage",
    icon: "user-group",
    order: 2,
  },
  {
    id: 3,
    name: "Commissions",
    slug: "commissions",
    icon: "currency-dollar",
    order: 3,
  },
  {
    id: 4,
    name: "Paiements",
    slug: "paiements",
    icon: "credit-card",
    order: 4,
  },
];

export default function FAQ() {
  const [faqs, setFaqs] = useState(fallbackFaqs);
  const [categories, setCategories] = useState(fallbackCategories);
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  // Récupérer les catégories et les FAQs depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesResponse, faqsResponse] = await Promise.all([
          axios.get("/api/faq/categories"),
          axios.get("/api/faqs"),
        ]);

        if (categoriesResponse.data && categoriesResponse.data.length > 0) {
          setCategories(categoriesResponse.data);
        }

        if (faqsResponse.data && faqsResponse.data.length > 0) {
          setFaqs(faqsResponse.data);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des FAQ:", err);
        setError("Impossible de charger les questions fréquentes");
        // Utiliser les données de secours en cas d'erreur
        setFaqs(fallbackFaqs);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les FAQs en fonction de la recherche et de la catégorie
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        faq.category_id === parseInt(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, selectedCategory]);

  // Gérer le vote d'utilité
  const handleVote = async (faqId, isHelpful) => {
    try {
      await axios.post(`/api/faqs/${faqId}/vote`, { helpful: isHelpful });

      // Mettre à jour l'état local
      setFaqs(
        faqs.map((faq) => {
          if (faq.id === faqId) {
            return {
              ...faq,
              helpful_votes: isHelpful
                ? faq.helpful_votes + 1
                : faq.helpful_votes,
              unhelpful_votes: !isHelpful
                ? faq.unhelpful_votes + 1
                : faq.unhelpful_votes,
              userVoted: true,
            };
          }
          return faq;
        })
      );
    } catch (err) {
      console.error("Erreur lors du vote:", err);
    }
  };

  return (
    <section
      id="faq"
      className={`section-padding ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2
            className={`heading-secondary mb-4 ${
              isDarkMode ? "text-white" : ""
            }`}
          >
            Questions{" "}
            <span
              className={isDarkMode ? "text-primary-400" : "text-primary-600"}
            >
              Fréquentes
            </span>
          </h2>
          <p
            className={`text-lg max-w-3xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Trouvez rapidement les réponses à vos questions sur SOLIFIN, notre
            système de parrainage et nos services.
          </p>
        </motion.div>

        {/* Barre de recherche */}
        <div className="mb-8">
          <div
            className={`relative rounded-full overflow-hidden shadow-md ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon
                className={`h-5 w-5 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
            </div>
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-4 py-3 border-none focus:ring-2 focus:ring-primary-500 ${
                isDarkMode
                  ? "bg-gray-800 text-white placeholder-gray-400"
                  : "bg-white text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
        </div>

        {/* Filtres par catégorie */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? isDarkMode
                    ? "bg-primary-500 text-white"
                    : "bg-primary-600 text-white"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Toutes les questions
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? isDarkMode
                      ? "bg-primary-500 text-white"
                      : "bg-primary-600 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.icon && (
                  <span className="mr-2">
                    {React.createElement(getIcon(category.icon), {
                      className: "h-4 w-4",
                    })}
                  </span>
                )}
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className={isDarkMode ? "text-red-400" : "text-red-500"}>
              {error}
            </p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-8">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Aucune question ne correspond à votre recherche.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-lg overflow-hidden ${
                  isDarkMode ? "bg-gray-800 shadow-lg" : "bg-white shadow-md"
                }`}
              >
                <button
                  onClick={() =>
                    setActiveIndex(activeIndex === index ? null : index)
                  }
                  className={`w-full px-6 py-4 text-left flex justify-between items-center transition-colors ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    {faq.category && faq.category.icon && (
                      <span
                        className={`mr-3 p-1.5 rounded-full ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        {React.createElement(getIcon(faq.category.icon), {
                          className: `h-4 w-4 ${
                            isDarkMode ? "text-primary-400" : "text-primary-600"
                          }`,
                        })}
                      </span>
                    )}
                    <span
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: activeIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDownIcon
                      className={`h-5 w-5 ${
                        isDarkMode ? "text-primary-400" : "text-primary-600"
                      }`}
                    />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className={`px-6 py-4 ${
                          isDarkMode
                            ? "text-gray-300 border-t border-gray-700"
                            : "text-gray-600 border-t border-gray-100"
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: faq.answer }} />

                        {/* Questions connexes */}
                        {faq.relatedFaqs && faq.relatedFaqs.length > 0 && (
                          <div
                            className={`mt-4 pt-4 border-t ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            }`}
                          >
                            <p
                              className={`font-medium mb-2 ${
                                isDarkMode ? "text-gray-200" : "text-gray-700"
                              }`}
                            >
                              Questions connexes:
                            </p>
                            <ul className="space-y-1">
                              {faq.relatedFaqs.map((relatedFaq) => (
                                <li key={relatedFaq.id}>
                                  <button
                                    onClick={() => {
                                      const relatedIndex =
                                        filteredFaqs.findIndex(
                                          (f) => f.id === relatedFaq.id
                                        );
                                      if (relatedIndex !== -1) {
                                        setActiveIndex(relatedIndex);
                                      }
                                    }}
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-primary-400 hover:text-primary-300"
                                        : "text-primary-600 hover:text-primary-700"
                                    }`}
                                  >
                                    {relatedFaq.question}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Système de vote */}
                        <div className="mt-4 flex items-center justify-end space-x-4">
                          <span
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Cette réponse vous a-t-elle été utile?
                          </span>
                          <button
                            onClick={() =>
                              !faq.userVoted && handleVote(faq.id, true)
                            }
                            disabled={faq.userVoted}
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${
                              faq.userVoted
                                ? isDarkMode
                                  ? "text-gray-500"
                                  : "text-gray-400"
                                : isDarkMode
                                ? "text-gray-300 hover:bg-gray-700"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <ThumbUpIcon className="h-4 w-4" />
                            <span>{faq.helpful_votes || 0}</span>
                          </button>
                          <button
                            onClick={() =>
                              !faq.userVoted && handleVote(faq.id, false)
                            }
                            disabled={faq.userVoted}
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${
                              faq.userVoted
                                ? isDarkMode
                                  ? "text-gray-500"
                                  : "text-gray-400"
                                : isDarkMode
                                ? "text-gray-300 hover:bg-gray-700"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <ThumbDownIcon className="h-4 w-4" />
                            <span>{faq.unhelpful_votes || 0}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            Vous ne trouvez pas la réponse que vous cherchez ?{" "}
            <a
              href="#contact"
              className={`font-medium ${
                isDarkMode
                  ? "text-primary-400 hover:text-primary-300"
                  : "text-primary-600 hover:text-primary-700"
              }`}
            >
              Contactez-nous
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
