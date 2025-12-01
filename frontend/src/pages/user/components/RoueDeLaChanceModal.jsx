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
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={!spinning ? handleClose : undefined}
      />

      {/* Conteneur du modal */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden transition-all duration-300 transform`}
        style={{
          background: isDarkMode 
            ? "linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))"
            : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.6)"}`,
          borderRadius: "20px",
          boxShadow: isDarkMode 
            ? "0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            : "0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        }}
      >
        {/* En-tête moderne */}
        <div
          className="relative px-6 py-5 border-b"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))"
              : "linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(139, 92, 246, 0.02))",
            borderColor: isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.5)",
          }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
              <div 
                className="p-2.5 rounded-xl mr-3 transition-all duration-300 hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1))`,
                }}
              >
                <SparklesIcon className="h-5 w-5" style={{ color: "#8b5cf6" }} />
              </div>
              Roue de la Chance
            </h3>
            <button
              onClick={!spinning ? handleClose : undefined}
              className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                background: isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.08)",
                border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(100, 116, 139, 0.1)"}`,
              }}
              disabled={spinning}
              aria-label="Fermer"
            >
              <XMarkIcon className="h-5 w-5" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent mb-4"
                style={{ borderColor: "#8b5cf6", borderTopColor: "transparent" }}
              ></div>
              <p style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                Chargement des cadeaux...
              </p>
            </div>
          ) : error ? (
            <div className="mb-4 p-4 rounded-xl flex items-center shadow-sm" style={{
              background: isDarkMode 
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))"
                : "linear-gradient(135deg, rgba(252, 165, 165, 0.2), rgba(248, 113, 113, 0.1))",
              border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(252, 165, 165, 0.3)"}`,
            }}>
              <div 
                className="p-2 rounded-xl mr-3"
                style={{
                  background: isDarkMode 
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))"
                    : "linear-gradient(135deg, rgba(252, 165, 165, 0.3), rgba(248, 113, 113, 0.15))",
                }}
              >
                <ExclamationCircleIcon className="h-5 w-5" style={{ color: "#ef4444" }} />
              </div>
              <p style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {jeton && (
                <div
                  className="mb-6 p-5 rounded-xl border"
                  style={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.4))"
                      : "linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6))",
                    borderColor: isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(203, 213, 225, 0.5)",
                  }}
                >
                  <div className="flex items-center mb-3">
                    <div 
                      className="p-2 rounded-xl mr-3"
                      style={{
                        background: `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1))`,
                      }}
                    >
                      <GiftIcon className="h-5 w-5" style={{ color: "#8b5cf6" }} />
                    </div>
                    <h4 className="font-semibold text-lg" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                      Informations du jeton
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                        Code unique
                      </p>
                      <div 
                        className="font-mono font-medium text-sm p-3 rounded-xl border"
                        style={{
                          background: isDarkMode 
                            ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                            : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))",
                          borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                          color: isDarkMode ? "#fff" : "#1a202c",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {jeton.code_unique}
                      </div>
                    </div>

                    {jeton.date_expiration && (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wider" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                          Expire le
                        </p>
                        <p className="font-medium flex items-center" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                          <ClockIcon className="h-4 w-4 mr-2" style={{ color: "#f59e0b" }} />
                          {formatDate(jeton.date_expiration)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div 
                    className="mt-4 p-3 rounded-xl border flex items-center"
                    style={{
                      background: isDarkMode 
                        ? "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(139, 92, 246, 0.02))",
                      borderColor: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.15)",
                    }}
                  >
                    <SparklesIcon className="h-5 w-5 mr-2 flex-shrink-0" style={{ color: "#8b5cf6" }} />
                    <p className="text-sm" style={{ color: isDarkMode ? "#c4b5fd" : "#6d28d9" }}>
                      Cliquez sur "Tourner la roue" pour tenter votre chance et gagner un cadeau !
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center my-6" ref={wheelRef}>
                <div className="relative">
                  <div 
                    className="relative rounded-full shadow-2xl overflow-hidden"
                    style={{
                      background: isDarkMode 
                        ? "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))"
                        : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
                      border: `4px solid ${isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(124, 58, 237, 0.2)"}`,
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width="300"
                      height="300"
                      className={`rounded-full ${spinning ? "animate-pulse" : ""}`}
                      style={{
                        filter: spinning ? "brightness(1.1)" : "brightness(1)",
                        transition: "filter 0.3s ease",
                      }}
                    ></canvas>
                  </div>

                  {/* Indicateur de position modernisé */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div 
                      className="relative"
                      style={{
                        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))",
                      }}
                    >
                      <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent" 
                           style={{ borderTopColor: "#ef4444" }}></div>
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent" 
                           style={{ borderTopColor: "#ffffff" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {result && (
                <div 
                  className="mt-6 p-6 rounded-2xl shadow-lg border relative overflow-hidden"
                  style={{
                    background: isDarkMode 
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))"
                      : "linear-gradient(135deg, rgba(134, 239, 172, 0.3), rgba(74, 222, 128, 0.15))",
                    borderColor: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(134, 239, 172, 0.4)",
                  }}
                >
                  {/* Effet de brillance */}
                  <div 
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
                    }}
                  ></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-4">
                      <div 
                        className="p-3 rounded-2xl"
                        style={{
                          background: isDarkMode 
                            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
                            : "linear-gradient(135deg, rgba(134, 239, 172, 0.4), rgba(74, 222, 128, 0.2))",
                        }}
                      >
                        <TrophyIcon className="h-8 w-8" style={{ color: "#10b981" }} />
                      </div>
                    </div>

                    <h4 className="font-bold text-2xl mb-3 text-center" style={{ color: isDarkMode ? "#fff" : "#064e3b" }}>
                      Félicitations !
                    </h4>

                    <div className="text-center mb-4">
                      <p className="text-lg mb-2" style={{ color: isDarkMode ? "#d1fae5" : "#047857" }}>
                        Vous avez gagné :
                      </p>
                      <p 
                        className="font-bold text-xl"
                        style={{ color: isDarkMode ? "#a7f3d0" : "#059669" }}
                      >
                        {result.cadeau?.nom}
                      </p>
                    </div>

                    {result.cadeau?.image_url && (
                      <div className="flex justify-center my-4">
                        <div className="relative">
                          <img
                            src={result.cadeau.image_url}
                            alt={result.cadeau.nom}
                            className="h-24 w-24 object-cover rounded-2xl shadow-md border-2"
                            style={{
                              borderColor: isDarkMode ? "rgba(16, 185, 129, 0.3)" : "rgba(134, 239, 172, 0.5)",
                            }}
                          />
                          <div 
                            className="absolute -bottom-2 -right-2 p-1 rounded-full border-2"
                            style={{
                              background: isDarkMode 
                                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))"
                                : "linear-gradient(135deg, rgba(134, 239, 172, 0.4), rgba(74, 222, 128, 0.2))",
                              borderColor: isDarkMode ? "rgba(16, 185, 129, 0.3)" : "rgba(134, 239, 172, 0.5)",
                            }}
                          >
                            <CheckCircleIcon className="h-5 w-5" style={{ color: "#10b981" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                      className="rounded-2xl p-4 mt-4 border"
                      style={{
                        background: isDarkMode 
                          ? "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8))"
                          : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))",
                        borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                      }}
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                            Code de vérification
                          </p>
                          <div 
                            className="font-mono font-bold text-lg p-3 rounded-xl border text-center"
                            style={{
                              background: isDarkMode 
                                ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                                : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))",
                              borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                              color: isDarkMode ? "#fff" : "#1a202c",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {result.code_verification}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                            Date d'expiration
                          </p>
                          <p className="font-medium flex items-center justify-center" style={{ color: isDarkMode ? "#fff" : "#1a202c" }}>
                            <CalendarIcon className="h-4 w-4 mr-2" style={{ color: "#ef4444" }} />
                            {formatDate(result.date_expiration)}
                          </p>
                        </div>
                      </div>

                      <div 
                        className="mt-4 pt-4 border-t text-center text-sm"
                        style={{
                          borderColor: isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)",
                          color: isDarkMode ? "#94a3b8" : "#64748b",
                        }}
                      >
                        <p>
                          Veuillez présenter ce code au personnel avant sa date d'expiration
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="px-6 py-5 flex justify-center border-t"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(51, 65, 85, 0.4))"
              : "linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6))",
            borderColor: isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(203, 213, 225, 0.5)",
          }}
        >
          <button
            onClick={spinWheel}
            disabled={spinning || loading || !jeton || result || cadeaux.length < 2}
            className={`px-6 py-3 rounded-2xl flex items-center justify-center font-medium shadow-lg transition-all duration-300 relative overflow-hidden group/btn ${
              spinning || loading || !jeton || result || cadeaux.length < 2
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-xl hover:scale-105"
            }`}
            style={{
              background: result
                ? "linear-gradient(135deg, #10b981, #059669)"
                : cadeaux.length < 2
                ? isDarkMode 
                  ? "linear-gradient(135deg, #6b7280, #4b5563)"
                  : "linear-gradient(135deg, #9ca3af, #6b7280)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "white",
              minWidth: "180px",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {spinning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" style={{ borderTopColor: "transparent" }}></div>
                  <span>La roue tourne...</span>
                </>
              ) : result ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Cadeau gagné !</span>
                </>
              ) : cadeaux.length < 2 ? (
                <>
                  <ExclamationCircleIcon className="h-5 w-5" />
                  <span>Pas assez de cadeaux</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  <span>Tourner la roue</span>
                </>
              )}
            </span>
            
            {/* Effet de brillance au hover */}
            <div 
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent)",
              }}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoueDeLaChanceModal;
