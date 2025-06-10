import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";

// Fallback pour les témoignages en cas d'erreur de chargement
const fallbackTestimonials = [
  {
    id: 1,
    name: "Marie Dubois",
    role: "Membre depuis 2023",
    image: null,
    content:
      "SOLIFIN m'a permis de développer mon réseau professionnel et d'accéder à des opportunités que je n'aurais jamais trouvées ailleurs.",
    rating: 5,
  },
  {
    id: 2,
    name: "Jean Martin",
    role: "Membre Elite",
    image: null,
    content:
      "Grâce à SOLIFIN, j'ai pu financer mon projet d'entreprise et rencontrer des partenaires clés pour mon développement.",
    rating: 5,
  },
  {
    id: 3,
    name: "Sophie Laurent",
    role: "Membre Pro",
    image: null,
    content:
      "Les opportunités d'affaires sur SOLIFIN sont inégalées. J'ai trouvé des partenaires commerciaux de qualité et augmenté mon chiffre d'affaires.",
    rating: 5,
  },
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  // Récupérer les témoignages mis en avant depuis l'API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/testimonials/featured");

        if (response.data.success && response.data.testimonials.length > 0) {
          setTestimonials(response.data.testimonials);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des témoignages:", err);
        setError("Impossible de charger les témoignages");
        // Utiliser les témoignages de secours en cas d'erreur
        setTestimonials(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Rotation automatique des témoignages
  useEffect(() => {
    if (!autoplay || testimonials.length === 0) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoplay, testimonials.length]);

  return (
    <section
      id="testimonials"
      className={`section-padding ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
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
            Ce que disent nos{" "}
            <span
              className={isDarkMode ? "text-primary-400" : "text-primary-600"}
            >
              Membres
            </span>
          </h2>
          <p
            className={`text-lg max-w-3xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Découvrez les témoignages authentiques de nos membres qui ont
            transformé leur vie grâce à SOLIFIN.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto px-4">
          {loading ? (
            <div
              className={`rounded-2xl p-8 md:p-12 flex justify-center items-center min-h-[250px] ${
                isDarkMode ? "bg-gray-800" : "bg-white shadow-lg"
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  Chargement des témoignages...
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className={`rounded-2xl p-8 md:p-12 ${
                isDarkMode ? "bg-gray-800" : "bg-white shadow-lg"
              }`}
            >
              <p className="text-center text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-2xl p-8 md:p-12 ${
                      isDarkMode
                        ? "bg-gray-800 shadow-lg hover:shadow-gray-700/50"
                        : "bg-white shadow-lg hover:shadow-xl"
                    }`}
                    onMouseEnter={() => setAutoplay(false)}
                    onMouseLeave={() => setAutoplay(true)}
                  >
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                      <div className="flex-shrink-0">
                        {testimonials[current].image ? (
                          <img
                            src={testimonials[current].image}
                            alt={testimonials[current].name}
                            className="w-24 h-24 rounded-full object-cover ring-2 ring-primary-500"
                          />
                        ) : (
                          <div
                            className={`w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-primary-500 ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-200"
                            }`}
                          >
                            <UserCircleIcon
                              className={`w-20 h-20 ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex mb-4">
                          {[...Array(testimonials[current].rating)].map(
                            (_, i) => (
                              <StarIcon
                                key={i}
                                className="h-6 w-6 text-yellow-400"
                              />
                            )
                          )}
                        </div>
                        <blockquote
                          className={`text-xl italic mb-6 ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          "{testimonials[current].content}"
                        </blockquote>
                        <div>
                          <div
                            className={`font-semibold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {testimonials[current].name}
                          </div>
                          <div
                            className={
                              isDarkMode
                                ? "text-primary-400"
                                : "text-primary-600"
                            }
                          >
                            {testimonials[current].role}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrent(index);
                      setAutoplay(false);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === current
                        ? isDarkMode
                          ? "bg-primary-400"
                          : "bg-primary-600"
                        : isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Voir le témoignage ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
