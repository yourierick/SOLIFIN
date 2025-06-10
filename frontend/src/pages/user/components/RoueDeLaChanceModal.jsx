import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  XMarkIcon,
  GiftIcon,
  ExclamationCircleIcon,
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

  // Couleurs pour le thème
  const themeColors = {
    bg: isDarkMode ? "bg-[#1f2937]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    card: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    input: isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
    overlay: isDarkMode ? "bg-gray-900/80" : "bg-gray-500/75",
  };

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
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "normal 12px Arial";

      // Positionner le texte encore plus loin du centre (95% du rayon)
      const textRadius = radius * 0.95;

      // Ajouter une ombre au texte pour améliorer la lisibilité
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(cadeau.nom, textRadius, 5);
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

    // Dessiner la flèche (en dehors de la rotation)
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius - 10, centerY - 15);
    ctx.lineTo(centerX + radius - 10, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = "#FF0000";
    ctx.fill();
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
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Conteneur du modal */}
      <div
        className={`${themeColors.bg} rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3
            className={`text-lg font-medium ${themeColors.text} flex items-center`}
          >
            <GiftIcon className="h-5 w-5 mr-2 text-primary-600" />
            Roue de la Chance - Jetons Esengo
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={spinning}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : (
            <div className="overflow-y-auto">
              {jeton && (
                <div className="mb-4">
                  <p className="font-medium">
                    Jeton:{" "}
                    <span className="font-mono">{jeton.code_unique}</span>
                  </p>
                  <p className="text-sm mt-1">
                    Cliquez sur "Tourner la roue" pour tenter votre chance et
                    gagner un cadeau !
                  </p>
                </div>
              )}

              <div className="flex justify-center my-4" ref={wheelRef}>
                <canvas
                  ref={canvasRef}
                  width="300"
                  height="300"
                  className="border rounded-full"
                ></canvas>
              </div>

              {result && (
                <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md text-center">
                  <h4 className="font-bold text-lg mb-2">Félicitations !</h4>
                  <p>
                    Vous avez gagné:{" "}
                    <span className="font-bold">{result.cadeau?.nom}</span>
                  </p>
                  {result.cadeau?.image_url && (
                    <div className="flex justify-center mt-2">
                      <img
                        src={result.cadeau.image_url}
                        alt={result.cadeau.nom}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <p>
                    Votre code de vérification de ticket est:{" "}
                    <span className="font-bold">
                      {result.code_verification}
                    </span>
                  </p>
                  <p>
                    Veuillez le montrer au personnel pour recevoir votre cadeau
                    avant la date de son expiration le{" "}
                    {formatDate(result.date_expiration)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-center">
          <button
            onClick={spinWheel}
            disabled={spinning || loading || !jeton || result}
            className={`${
              themeColors.button
            } px-4 py-2 rounded-md flex items-center ${
              spinning || loading || !jeton || result
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {spinning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                La roue tourne...
              </>
            ) : result ? (
              "Cadeau gagné !"
            ) : (
              "Tourner la roue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoueDeLaChanceModal;
