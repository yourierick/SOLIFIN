import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import publicAxios from "../utils/publicAxios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PromptLoginOrSubscribe from "./PromptLoginOrSubscribe";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReactPlayer from "react-player";
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
  const [isSeeking, setIsSeeking] = useState(false); // État pour suivre si l'utilisateur est en train de chercher dans la vidéo
  const intervalRef = useRef(null);
  const videoRef = useRef(null); // Référence à l'élément vidéo

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
    if (ads?.length > 1 && !isPaused && !showVideo) {
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
  }, [ads?.length, isPaused, showVideo]);

  const nextAd = () => {
    setCurrent((prev) => (ads?.length ? (prev + 1) % ads?.length : 0));
  };

  const prevAd = () => {
    setCurrent((prev) =>
      ads?.length ? (prev - 1 + ads?.length) % ads?.length : 0
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
      className={`w-full py-12 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-100 to-white"
      }`}
    >
      <div className="w-full px-4 mx-auto sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              className={`h-1.5 w-24 mx-auto mb-6 rounded-full ${
                isDarkMode ? "bg-green-500" : "bg-green-600"
              }`}
            />
          </div>

          <h2
            className={`text-3xl font-bold tracking-tight sm:text-5xl mb-6 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Publicités et{" "}
            <span
              className={`relative inline-block ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              Annonces
              <motion.span
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
                className={`absolute bottom-1 left-0 h-0.5 ${
                  isDarkMode ? "bg-green-400/40" : "bg-green-600/40"
                }`}
              />
            </span>
          </h2>
          <p
            className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Profitez des meilleures opportunités de marketing pour vos produits
            et services grâce à la communauté grandissante de{" "}
            <span className="text-primary-600 font-medium">SOLIFIN</span>
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Chargement des publicités...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : !ads?.length ? (
          <div className="text-center py-12 text-gray-400">
            Aucune publicité à afficher.
          </div>
        ) : (
          <div className="relative max-w-lg mx-auto">
            <motion.div
              key={ads[current]?.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className={`w-full mx-auto rounded-lg overflow-hidden ${
                isDarkMode
                  ? "bg-gray-800 shadow-md shadow-gray-900/30"
                  : "bg-white shadow-md"
              }`}
            >
              <div className="relative w-full flex flex-col items-center">
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isDarkMode ? "bg-primary-900/10" : "bg-primary-600/10"
                  }`}
                  style={{
                    borderTopLeftRadius: "0.5rem",
                    borderTopRightRadius: "0.5rem",
                  }}
                />
                {/* Image avec bouton play si vidéo présente */}
                {/* Conteneur proportionnel fixe pour image ET vidéo */}
                {/* Wrapper aspect-ratio pour image et vidéo, jamais d'overflow */}
                {/* Wrapper aspect-ratio 16:9 pour image ET vidéo, sans forcer la hauteur du player */}
                <div
                  className="w-full"
                  style={{
                    position: "relative",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                    background: isDarkMode ? "#1f2937" : "#f9fafb",
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
                                background: "rgba(34, 197, 94, 0.9)",
                                border: "none",
                                borderRadius: "50%",
                                width: 60,
                                height: 60,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                zIndex: 2,
                                boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform =
                                  "translate(-50%, -50%) scale(1.05)";
                                e.currentTarget.style.background =
                                  "rgba(34, 197, 94, 1)";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform =
                                  "translate(-50%, -50%)";
                                e.currentTarget.style.background =
                                  "rgba(34, 197, 94, 0.9)";
                              }}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon
                                  points="5,3 19,12 5,21 5,3"
                                  fill="white"
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
                        {/* Bouton de fermeture de la vidéo */}
                        <button
                          onClick={() => {
                            setShowVideo(false);
                            resumeAutoScroll();
                          }}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            zIndex: 10,
                            background: "rgba(0,0,0,0.5)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "30px",
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "18px",
                            fontWeight: "bold",
                          }}
                          aria-label="Fermer la vidéo"
                        >
                          ×
                        </button>

                        <ReactPlayer
                          ref={videoRef}
                          url={ads[current].video_url}
                          width="100%"
                          height="100%"
                          playing={true}
                          controls={true}
                          config={{
                            file: {
                              attributes: {
                                controlsList: "nodownload",
                                disablePictureInPicture: true,
                              },
                            },
                          }}
                          style={{
                            borderRadius: "0.5rem",
                            overflow: "hidden",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                          }}
                          // Ne pas masquer la vidéo lors des interactions avec la barre de progression
                          onPause={() => {
                            // Ne rien faire - la vidéo reste visible même en pause
                          }}
                          // Masquer la vidéo uniquement quand elle se termine
                          onEnded={() => {
                            setShowVideo(false);
                            resumeAutoScroll();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3
                  className={`text-lg font-semibold mb-1 ${
                    isDarkMode ? "text-white" : "text-gray-800"
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
                  className={`mb-3 text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {ads[current]?.description || ""}
                </p>
                {/* Bouton principal "Je suis intéressé !" avec logique auth */}
                <button
                  className="inline-block px-5 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  style={{ minWidth: 180 }}
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
            {ads?.length > 1 && (
              <>
                <button
                  onClick={() => {
                    prevAd();
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow-sm p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-800 transition z-10"
                  aria-label="Précédent"
                  style={{ left: "-1.75rem" }}
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
                    // Ne pas arrêter la vidéo si elle est en cours de lecture
                    if (!showVideo) {
                      pauseAutoScroll();
                    }
                  }}
                  onMouseEnter={showVideo ? null : pauseAutoScroll}
                  onMouseLeave={showVideo ? null : resumeAutoScroll}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 shadow-sm p-1.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-800 transition z-10"
                  aria-label="Suivant"
                  style={{ right: "-1.75rem" }}
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
                <div className="flex justify-center mt-3 space-x-1.5">
                  {ads?.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrent(idx);
                        // Ne pas arrêter la vidéo si elle est en cours de lecture
                        if (!showVideo) {
                          pauseAutoScroll();
                        }
                      }}
                      onMouseEnter={showVideo ? null : pauseAutoScroll}
                      onMouseLeave={showVideo ? null : resumeAutoScroll}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        current === idx
                          ? "bg-primary-500 scale-125"
                          : "bg-gray-300 dark:bg-gray-600 hover:bg-primary-300 dark:hover:bg-primary-700"
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
