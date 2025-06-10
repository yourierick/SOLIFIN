import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useTheme } from "../contexts/ThemeContext";
import axios from "axios";
import {
  UsersIcon,
  GlobeAltIcon,
  StarIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

// Statistiques de secours en cas d'erreur
const fallbackStats = [
  {
    number: 50000,
    label: "Membres Actifs",
    suffix: "+",
    icon: "users",
  },
  {
    number: 150,
    label: "Pays Représentés",
    suffix: "+",
    icon: "globe",
  },
  {
    number: 98,
    label: "Taux de Satisfaction",
    suffix: "%",
    icon: "star",
  },
];

// Fonction pour obtenir l'icône correspondante
const getIcon = (iconName) => {
  switch (iconName) {
    case "users":
      return UsersIcon;
    case "globe":
      return GlobeAltIcon;
    case "star":
      return StarIcon;
    case "currency-dollar":
      return CurrencyDollarIcon;
    case "light-bulb":
      return LightBulbIcon;
    default:
      return UsersIcon;
  }
};

export default function Stats() {
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/stats/home");

        if (response.data.success && response.data.stats) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError("Impossible de charger les statistiques");
        // Utiliser les statistiques de secours en cas d'erreur
        setStats(fallbackStats);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section
      className={`py-16 ${
        isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-r from-primary-600 to-primary-700"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className={`text-3xl font-bold mb-4 ${
              isDarkMode ? "text-primary-100" : "text-white"
            }`}
          >
            SOLIFIN en Chiffres
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-white/80"
            }`}
          >
            Découvrez l'impact de notre communauté à travers le monde
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-300">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = getIcon(stat.icon);
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`rounded-xl p-6 ${
                    isDarkMode ? "bg-gray-800" : "bg-white/10 backdrop-blur-sm"
                  } shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-3 rounded-full mb-4 ${
                        isDarkMode ? "bg-primary-900/50" : "bg-white/20"
                      }`}
                    >
                      <Icon
                        className={`h-8 w-8 ${
                          isDarkMode ? "text-primary-300" : "text-white"
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold mb-2 flex items-center justify-center ${
                          isDarkMode ? "text-primary-200" : "text-white"
                        }`}
                      >
                        {stat.prefix}
                        <CountUp
                          end={stat.number}
                          duration={2.5}
                          separator=" "
                          enableScrollSpy
                          scrollSpyOnce
                          useEasing={true}
                          decimals={stat.suffix === "M$" ? 1 : 0}
                        />
                        <span className="ml-1">{stat.suffix}</span>
                      </div>
                      <div
                        className={`font-medium ${
                          isDarkMode ? "text-gray-300" : "text-white/90"
                        }`}
                      >
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-white/70"
            }`}
          >
            * Données mises à jour quotidiennement
          </p>
        </motion.div>
      </div>
    </section>
  );
}
