import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import publicAxios from "../utils/publicAxios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PromptLoginOrSubscribe from "./PromptLoginOrSubscribe";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
// import "video-react/dist/video-react.css";
// import { Player } from "video-react";
// Les imports video-react ne sont plus utilisés

// Fonction pour formater la date de publication de manière relative
const formatPublishedDate = (dateString) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error("Erreur lors du formatage de la date", error);
    return "";
  }
};

export default function Ads() {
  const { isDarkMode } = useTheme();
  const { user, loading: authLoading } = useAuth(); // Récupère l'utilisateur et l'état de chargement de l'auth
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false); // Pour afficher la modale si non authentifié
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    publicAxios
      .get("/api/ads/approved")
      .then((response) => {
        setAds(response.data.ads);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des publicités", error);
        setError("Erreur lors du chargement des publicités");
        setLoading(false);
      });
  }, []);

  // Effet pour le défilement automatique du carrousel
  useEffect(() => {
    // Démarrer le défilement automatique seulement si nous avons plus d'une publicité
    // et si aucune vidéo n'est en cours de lecture
    if (ads.length > 1 && !isPaused && !showVideo) {
      // Nettoyer tout intervalle existant
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Créer un nouvel intervalle pour changer automatiquement les publicités toutes les 8 secondes
      intervalRef.current = setInterval(() => {
        nextAd();
      }, 10000); // 10000ms = 10 secondes
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length, isPaused, showVideo]);

  const nextAd = () => {
    setCurrent((prev) => (ads.length ? (prev + 1) % ads.length : 0));
  };

  const prevAd = () => {
    setCurrent((prev) =>
      ads.length ? (prev - 1 + ads.length) % ads.length : 0
    );
  };

  // Fonctions pour mettre en pause et reprendre le défilement automatique
  const pauseAutoScroll = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeAutoScroll = () => {
    setIsPaused(false);
  };

  return (
    <section
      id="ads"
      className={`py-16 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-50 to-white"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2
            className={`heading-secondary mb-4 ${
              isDarkMode ? "text-white" : ""
            }`}
          >
            Annonces et <span className="text-primary-600">Publicités</span>
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Profitez des meilleures opportunités de marketing de vos produits et
            services grâce à la communauté grandissante de{" "}
            <span className="text-primary-600">SOLIFIN</span> et maximiser votre
            potentiel
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Chargement des publicités...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : !ads.length ? (
          <div className="text-center py-12 text-gray-400">
            Aucune publicité à afficher.
          </div>
        ) : (
          <div className="relative max-w-2xl mx-auto">
            <motion.div
              key={ads[current]?.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className={`rounded-xl overflow-hidden shadow-lg ${
                isDarkMode
                  ? "bg-gray-800 shadow-gray-900/50"
                  : "bg-white shadow-lg"
              }`}
            >
              <div className="relative w-full flex flex-col items-center">
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isDarkMode ? "bg-primary-900/30" : "bg-primary-600/20"
                  }`}
                  style={{
                    borderTopLeftRadius: "0.75rem",
                    borderTopRightRadius: "0.75rem",
                  }}
                />
                {/* Image avec bouton play si vidéo présente */}
                {/* Conteneur proportionnel fixe pour image ET vidéo */}
                {/* Wrapper aspect-ratio pour image et vidéo, jamais d'overflow */}
                {/* Wrapper aspect-ratio 16:9 pour image ET vidéo, sans forcer la hauteur du player */}
                <div
                  style={{
                    width: 480,
                    maxWidth: "100%",
                    margin: "0 auto",
                    position: "relative",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      paddingTop: "56.25%",
                      position: "relative",
                    }}
                  >
                    {/* Affiche l'image avec bouton play si vidéo présente ET non lancée */}
                    {(ads[current]?.image_url || ads[current]?.image) &&
                      (!ads[current]?.video_url || !showVideo) && (
                        <>
                          <img
                            src={ads[current]?.image_url || ads[current]?.image}
                            alt={ads[current]?.titre || ads[current]?.title}
                            className="w-full h-full object-cover absolute inset-0"
                            style={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                          {ads[current]?.video_url && (
                            <button
                              aria-label="Lire la vidéo"
                              onClick={() => {
                                setShowVideo(true);
                                pauseAutoScroll();
                              }}
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "#22c55e",
                                border: "none",
                                borderRadius: "50%",
                                width: 80,
                                height: 80,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                zIndex: 2,
                                boxShadow: "0 4px 24px rgba(34,197,94,0.3)",
                                transition:
                                  "transform 0.18s cubic-bezier(.4,2,.6,1)",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.transform =
                                  "translate(-50%, -50%) scale(1.08)")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.transform =
                                  "translate(-50%, -50%)")
                              }
                            >
                              <svg
                                width="48"
                                height="48"
                                viewBox="0 0 48 48"
                                fill="none"
                              >
                                <circle
                                  cx="24"
                                  cy="24"
                                  r="24"
                                  fill="rgba(0,0,0,0.24)"
                                />
                                <polygon
                                  points="19,16 36,24 19,32"
                                  fill="#fff"
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    {/* Affiche la vidéo exactement dans le même conteneur, mêmes proportions, sans forcer la hauteur */}
                    {ads[current]?.video_url && showVideo && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <video
                          src={ads[current].video_url}
                          controls
                          autoPlay
                          // Masquer la vidéo et reprendre le défilement quand la vidéo est mise en pause
                          onPause={() => {
                            setShowVideo(false);
                            resumeAutoScroll();
                          }}
                          // Masquer la vidéo et reprendre le défilement quand la vidéo se termine
                          onEnded={() => {
                            setShowVideo(false);
                            resumeAutoScroll();
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            borderRadius: "0.75rem",
                            background: "#000",
                            display: "block",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3
                  className={`text-xl font-bold mb-1 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {ads[current]?.titre || ads[current]?.title}
                </h3>
                {/* Affichage de la date de publication */}
                <div
                  className={`flex items-center mb-2 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                  <span>{formatPublishedDate(ads[current]?.created_at)}</span>
                </div>
                <p
                  className={`mb-4 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {ads[current]?.description || ""}
                </p>
                {/* Bouton principal "Je suis intéressé !" avec logique auth */}
                <button
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors duration-300 font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ minWidth: 220 }}
                  onClick={() => {
                    // Si utilisateur authentifié, rediriger vers la page utilisateur avec ancre sur la publication
                    if (user && user.id) {
                      navigate(
                        `/dashboard/pages/${ads[current]?.page_id}#pub-${ads[current]?.id}`
                      );
                    } else {
                      // Rediriger vers la page d'invitation à la connexion ou souscription
                      navigate("/interet");
                    }
                  }}
                >
                  {ads[current]?.cta || "Je suis intéressé !"}
                </button>
                {/* Affichage inline du composant pour les non-authentifiés */}
                {showPrompt && (
                  <div className="mt-6">
                    {/* Bouton de fermeture discret */}
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <button
                        onClick={() => setShowPrompt(false)}
                        className="text-gray-400 hover:text-primary-600 text-2xl font-bold"
                        aria-label="Fermer"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {/* Composant d'invitation à la connexion ou souscription */}
                    <PromptLoginOrSubscribe />
                  </div>
                )}
              </div>
            </motion.div>
            {ads.length > 1 && (
              <>
                <button
                  onClick={() => {
                    prevAd();
                    pauseAutoScroll();
                  }}
                  onMouseEnter={pauseAutoScroll}
                  onMouseLeave={resumeAutoScroll}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow p-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition z-10"
                  aria-label="Précédent"
                  style={{ left: "-2.5rem" }}
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    nextAd();
                    pauseAutoScroll();
                  }}
                  onMouseEnter={pauseAutoScroll}
                  onMouseLeave={resumeAutoScroll}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow p-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition z-10"
                  aria-label="Suivant"
                  style={{ right: "-2.5rem" }}
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex justify-center mt-4 space-x-2">
                  {ads.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrent(idx);
                        pauseAutoScroll();
                      }}
                      onMouseEnter={pauseAutoScroll}
                      onMouseLeave={resumeAutoScroll}
                      className={`w-3 h-3 rounded-full ${
                        current === idx
                          ? "bg-primary-600"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      aria-label={`Aller à la publicité ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
