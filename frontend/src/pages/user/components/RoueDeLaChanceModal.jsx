import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  XMarkIcon,
  GiftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  SparklesIcon,
  TrophyIcon,
  TicketIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notification from "../../../components/Notification";

/**
 * Modal pour la roue de la chance (utilisation des jetons Esengo)
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Object} props.jeton - Le jeton Esengo à utiliser
 * @param {Function} props.onResult - Fonction appelée avec le résultat (ticket gagné)
 */
const RoueDeLaChanceModal = ({ open, onClose, jeton, onResult }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState(null);
  const [cadeaux, setCadeaux] = useState([]);
  const [result, setResult] = useState(null);
  const wheelRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Couleurs pour les segments de la roue
  const colors = [
    "#FF6384", // Rose
    "#36A2EB", // Bleu
    "#FFCE56", // Jaune
    "#4BC0C0", // Turquoise
    "#9966FF", // Violet
    "#FF9F40", // Orange
    "#C9CBCF", // Gris
    "#7ED321", // Vert
  ];

  useEffect(() => {
    if (open) {
      fetchCadeaux();
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && cadeaux.length > 0 && canvasRef.current) {
      drawWheel();
    }
  }, [cadeaux, open, isDarkMode]);

  // Récupérer la liste des cadeaux disponibles liés au pack du jeton
  const fetchCadeaux = async () => {
    if (!jeton || !jeton.pack_id) {
      setError("Impossible de récupérer les cadeaux: pack du jeton non défini");
      Notification.error({
        message:
          "Impossible de récupérer les cadeaux: pack du jeton non défini",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Appel à l'API pour récupérer les cadeaux liés au pack du jeton
      const response = await axios.get(
        `/api/user/finances/jetons-esengo/packs/${jeton.pack_id}/cadeaux`
      );

      if (response.data.success) {
        setCadeaux(response.data.cadeaux || response.data.data || []);
      } else {
        Notification.error({
          message: "Erreur lors de la récupération des cadeaux",
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des cadeaux:", err);

      Notification.error({
        message: "Erreur lors de la récupération des cadeaux",
      });

      setError("Impossible de récupérer les cadeaux du serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Dessiner la roue
  const drawWheel = (rotationAngle = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sauvegarder le contexte avant rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);

    // Dessiner les segments de la roue
    const totalSlices = cadeaux.length;
    const arc = (2 * Math.PI) / totalSlices;

    cadeaux.forEach((cadeau, i) => {
      const angle = i * arc;
      const colorIndex = i % colors.length;

      ctx.beginPath();
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.closePath();

      ctx.fillStyle = colors[colorIndex];
      ctx.fill();
      ctx.stroke();

      // Ajouter le nom du cadeau
      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.font = "normal 12px poppins";

      // Positionner le texte encore plus loin du centre (95% du rayon)
      const textRadius = radius * 0.95;

      // Ajouter un contour noir au texte
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeText(cadeau.nom, textRadius, 5);

      // Remplir le texte en blanc
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(cadeau.nom, textRadius, 5);

      // Ajouter une ombre au texte pour améliorer la lisibilité
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.restore();
    });

    // Dessiner le centre de la roue
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.stroke();

    // Restaurer le contexte (annuler la rotation)
    ctx.restore();

    // Flèche de la roue désactivée
    // ctx.beginPath();
    // ctx.moveTo(centerX + radius + 10, centerY);
    // ctx.lineTo(centerX + radius - 10, centerY - 15);
    // ctx.lineTo(centerX + radius - 10, centerY + 15);
    // ctx.closePath();
    // ctx.fillStyle = "#FF0000";
    // ctx.fill();
  };

  // Faire tourner la roue
  const spinWheel = async () => {
    if (spinning || !jeton) return;

    setSpinning(true);
    setError(null);

    let backendTicket = null;

    // 1. D'abord, demander au backend de déterminer le cadeau gagné
    try {
      // Appel à l'API pour utiliser le jeton et obtenir un cadeau
      const response = await axios.post(
        `/api/user/finances/jetons-esengo/use`,
        { jeton_id: jeton.id }
      );

      if (response.data.success) {
        backendTicket = response.data.ticket;
      } else {
        setSpinning(false);
        setError(
          response.data.message || "Erreur lors de l'utilisation du jeton"
        );
        return;
      }
    } catch (err) {
      console.error("Erreur lors de l'utilisation du jeton:", err);
      setSpinning(false);
      setError("Erreur de connexion au serveur");
      return;
    }

    // 2. Ensuite, animer la roue pour un effet visuel
    if (cadeaux.length === 0) {
      setSpinning(false);
      setError("Aucun cadeau disponible pour ce pack");
      return;
    }

    // Choisir un segment aléatoire pour l'animation (différent du résultat réel)
    const randomIndex = Math.floor(Math.random() * cadeaux.length);
    const totalSlices = cadeaux.length;
    const arc = (2 * Math.PI) / totalSlices;
    const targetAngle = randomIndex * arc + 10 * Math.PI; // Plusieurs tours + segment aléatoire

    // Animation de la roue
    let startTime = null;
    const animationDuration = 5000; // 5 secondes

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Fonction d'easing pour ralentir progressivement
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const currentAngle = targetAngle * easeOut(progress);

      drawWheel(currentAngle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation terminée, afficher le vrai résultat
        setSpinning(false);
        setResult(backendTicket);

        // Appeler le callback avec le résultat
        if (onResult && typeof onResult === "function") {
          onResult(backendTicket);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Fonction appelée à la fin de l'animation
  const handleAnimationComplete = (ticket) => {
    setSpinning(false);
    setResult(ticket);

    // Appeler le callback avec le résultat
    if (onResult && typeof onResult === "function") {
      onResult(ticket);
    }
  };

  // Nettoyer l'animation lors de la fermeture du modal
  const handleClose = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";

    try {
      // Si la date est déjà au format français avec heure (JJ/MM/AAAA HH:MM:SS)
      if (typeof dateString === "string" && dateString.includes("/")) {
        // Extraire seulement la partie date (JJ/MM/AAAA)
        const dateParts = dateString.split(" ");
        if (dateParts.length > 0) {
          return dateParts[0]; // Retourne seulement la partie date
        }
        return dateString;
      }

      // Essayer de créer une date valide
      const date = new Date(dateString);

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.error("Date invalide:", dateString);
        return "Format de date invalide";
      }

      // Formater la date en français sans l'heure
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch (error) {
      console.error("Erreur de formatage de date:", error, dateString);
      return "Erreur de date";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec effet de flou */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={!spinning ? handleClose : undefined}
      />

      {/* Conteneur du modal */}
      <div
        className={`${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        } rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden transition-all duration-300 transform`}
      >
        <div
          className={`flex justify-between items-center px-6 py-5 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          } bg-gradient-to-r ${
            isDarkMode ? "from-gray-800 to-gray-700" : "from-gray-50 to-white"
          }`}
        >
          <h3 className="text-lg font-bold flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full mr-3">
              <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            Roue de la Chance
          </h3>
          <button
            onClick={!spinning ? handleClose : undefined}
            className={`p-2 rounded-full ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } transition-colors duration-150`}
            disabled={spinning}
            aria-label="Fermer"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Chargement des cadeaux...
              </p>
            </div>
          ) : error ? (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center shadow-sm">
              <div className="bg-red-200 dark:bg-red-800 p-2 rounded-full mr-3">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p>{error}</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {jeton && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                  } border ${
                    isDarkMode ? "border-gray-600" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <GiftIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    <h4 className="font-semibold">Informations du jeton</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Code unique
                      </p>
                      <p className="font-mono font-medium text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                        {jeton.code_unique}
                      </p>
                    </div>

                    {jeton.date_expiration && (
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Expire le
                        </p>
                        <p className="font-medium flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-amber-500" />
                          {formatDate(jeton.date_expiration)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30 flex items-center">
                    <SparklesIcon className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      Cliquez sur "Tourner la roue" pour tenter votre chance et
                      gagner un cadeau !
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center my-6" ref={wheelRef}>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width="300"
                    height="300"
                    className={`border-4 ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    } rounded-full shadow-lg ${
                      spinning ? "animate-pulse" : ""
                    }`}
                  ></canvas>

                  {/* Indicateur de position */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-red-500"></div>
                  </div>
                </div>
              </div>

              {result && (
                <div className="mt-6 p-5 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg shadow-sm border border-green-200 dark:border-green-900/30">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full">
                      <TrophyIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <h4 className="font-bold text-xl mb-3 text-center">
                    Félicitations !
                  </h4>

                  <div className="text-center mb-4">
                    <p className="text-lg mb-2">Vous avez gagné :</p>
                    <p className="font-bold text-xl text-primary-700 dark:text-primary-400">
                      {result.cadeau?.nom}
                    </p>
                  </div>

                  {result.cadeau?.image_url && (
                    <div className="flex justify-center my-4">
                      <div className="relative">
                        <img
                          src={result.cadeau.image_url}
                          alt={result.cadeau.nom}
                          className="h-24 w-24 object-cover rounded-lg shadow-md border-2 border-white dark:border-gray-700"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-green-100 dark:bg-green-800 p-1 rounded-full border-2 border-white dark:border-gray-700">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Code de vérification
                        </p>
                        <p className="font-mono font-bold text-lg bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 text-center">
                          {result.code_verification}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Date d'expiration
                        </p>
                        <p className="font-medium flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-red-500" />
                          {formatDate(result.date_expiration)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        Veuillez présenter ce code au personnel avant sa date
                        d'expiration
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`px-6 py-5 ${
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
          } flex justify-center border-t ${
            isDarkMode ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <button
            onClick={spinWheel}
            disabled={spinning || loading || !jeton || result}
            className={`px-5 py-2.5 rounded-lg flex items-center justify-center font-medium shadow-sm transition-all duration-200 ${
              spinning || loading || !jeton || result
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow transform hover:-translate-y-0.5"
            } ${
              isDarkMode
                ? result
                  ? "bg-green-600 text-white"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
                : result
                ? "bg-green-600 text-white"
                : "bg-primary-600 hover:bg-primary-700 text-white"
            }`}
          >
            {spinning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2"></div>
                <span>La roue tourne...</span>
              </>
            ) : result ? (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>Cadeau gagné !</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                <span>Tourner la roue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoueDeLaChanceModal;
