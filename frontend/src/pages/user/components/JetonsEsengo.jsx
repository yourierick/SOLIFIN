import React, { useState, useEffect } from "react";

// Définition des animations via CSS standard
import "./animations.css";

import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  TicketIcon,
  GiftIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  CalendarIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoueDeLaChanceModal from "./RoueDeLaChanceModal";
import TicketGagnantModal from "./TicketGagnantModal";

/**
 * Composant pour afficher les jetons Esengo et les tickets gagnants de l'utilisateur
 * Design moderne épuré avec tons pastel et animations subtiles
 */
const JetonsEsengo = () => {
  const { isDarkMode } = useTheme();
  const [jetons, setJetons] = useState([]);
  const [jetonsExpires, setJetonsExpires] = useState([]);
  const [jetonsUtilises, setJetonsUtilises] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExpired, setLoadingExpired] = useState(true);
  const [loadingUsed, setLoadingUsed] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roueModalOpen, setRoueModalOpen] = useState(false);
  const [selectedJeton, setSelectedJeton] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [jetonHistory, setJetonHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [activeTab, setActiveTab] = useState("actifs");

  // Palette de couleurs épurée et moderne
  const colors = {
    primary: isDarkMode ? "#8b5cf6" : "#7c3aed",
    primaryLight: isDarkMode ? "#a78bfa" : "#8b5cf6",
    secondary: isDarkMode ? "#06b6d4" : "#0891b2",
    accent: isDarkMode ? "#f59e0b" : "#f97316",
    success: isDarkMode ? "#10b981" : "#059669",
    warning: isDarkMode ? "#f59e0b" : "#d97706",
    danger: isDarkMode ? "#ef4444" : "#dc2626",
    surface: isDarkMode ? "#1e293b" : "#f8fafc",
    surfaceLight: isDarkMode ? "#334155" : "#f1f5f9",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    shadow: isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)",
  };

  useEffect(() => {
    fetchJetonsEsengo();
    fetchExpiredJetons();
    fetchUsedJetons();
    fetchTicketsGagnants();
  }, []);

  // Récupérer les jetons Esengo actifs de l'utilisateur
  const fetchJetonsEsengo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/user/finances/jetons-esengo");
      if (response.data.success) {
        setJetons(response.data.jetons_disponibles || []);
      } else {
        setError(
          response.data.message || "Erreur lors de la récupération des jetons"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les jetons Esengo expirés de l'utilisateur
  const fetchExpiredJetons = async () => {
    setLoadingExpired(true);
    setError(null);
    try {
      const response = await axios.get(
        "/api/user/finances/jetons-esengo/expired"
      );
      if (response.data.success) {
        setJetonsExpires(response.data.jetons_expires || []);
      } else {
        setError(
          response.data.message ||
            "Erreur lors de la récupération des jetons expirés"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error(err);
    } finally {
      setLoadingExpired(false);
    }
  };

  // Récupérer les jetons Esengo utilisés de l'utilisateur
  const fetchUsedJetons = async () => {
    setLoadingUsed(true);
    setError(null);
    try {
      const response = await axios.get("/api/user/finances/jetons-esengo/used");
      if (response.data.success) {
        setJetonsUtilises(response.data.jetons_utilises || []);
      } else {
        setError(
          response.data.message ||
            "Erreur lors de la récupération des jetons utilisés"
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error(err);
    } finally {
      setLoadingUsed(false);
    }
  };

  // Récupérer l'historique d'un jeton Esengo spécifique
  const fetchJetonHistory = async (jetonId) => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const response = await axios.get(
        `/api/user/finances/jetons-esengo/${jetonId}/history`
      );
      if (response.data.success) {
        setJetonHistory(response.data);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique:", err);
      setHistoryError("Impossible de récupérer l'historique du jeton");
      toast.error("Impossible de récupérer l'historique du jeton");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Récupérer les tickets gagnants de l'utilisateur
  const fetchTicketsGagnants = async () => {
    setTicketsLoading(true);
    try {
      const response = await axios.get(
        "/api/user/finances/jetons-esengo/tickets"
      );
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des tickets gagnants:",
        err
      );
    } finally {
      setTicketsLoading(false);
    }
  };

  // Ouvrir le modal de la roue de la chance
  const handleUseJeton = (jeton) => {
    setSelectedJeton(jeton);
    setRoueModalOpen(true);
  };

  // Fermer le modal de la roue de la chance
  const handleCloseRoueModal = () => {
    setRoueModalOpen(false);
    setSelectedJeton(null);
  };

  // Gérer le résultat de la roue de la chance
  const handleRoueResult = (ticket) => {
    // Actualiser les jetons et tickets
    fetchJetonsEsengo();
    fetchTicketsGagnants();
    fetchUsedJetons();

    // Afficher le ticket gagné
    setSelectedTicket(ticket);
    setTicketModalOpen(true);
  };

  // Ouvrir le modal de détails d'un ticket
  const handleViewTicket = async (ticketId) => {
    try {
      const response = await axios.get(
        `/api/user/finances/jetons-esengo/tickets/${ticketId}`
      );
      if (response.data.success) {
        setSelectedTicket(response.data.ticket);
        setTicketModalOpen(true);
      }
    } catch (err) {
      console.error(
        "Erreur lors de la récupération des détails du ticket:",
        err
      );
      toast.error("Erreur lors de la récupération des détails du ticket");
    }
  };

  // Fermer le modal de détails d'un ticket
  const handleCloseTicketModal = () => {
    setTicketModalOpen(false);
    setSelectedTicket(null);
  };

  // Fermer le modal d'historique d'un jeton
  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setJetonHistory([]);
  };

  // Changer d'onglet entre jetons actifs et expirés
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMMM yyyy", {
      locale: fr,
    });
  };

  // Vérifier si un ticket est expiré
  const isExpired = (ticket) => {
    if (!ticket || !ticket.date_expiration) return false;
    return new Date(ticket.date_expiration) < new Date();
  };

  // Afficher un spinner pendant le chargement
  if (loading && jetons.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent"
          style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
        ></div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ backgroundColor: colors.surface }}>
      {/* En-tête épuré et moderne */}
      <div 
        className="rounded-3xl p-8 mb-8 relative overflow-hidden backdrop-blur-xl"
        style={{
          background: isDarkMode 
            ? "#1f2937"
            : "#fff",
          boxShadow: `0 20px 40px ${colors.shadow}`,
        }}
      >
        {/* Décorations subtiles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)",
            transform: "translate(20px, -20px)",
          }}
        ></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
            transform: "translate(-16px, 16px)",
          }}
        ></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-2xl backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
              >
                <GiftIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3"
                style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Mes Jetons Esengo
                  <SparklesIcon className="h-6 w-6" style={{ color: "#fbbf24" }} />
                </h1>
                <p className="text-white/80 text-base mt-2"
                style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Découvrez des récompenses exclusives
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchJetonsEsengo();
                fetchExpiredJetons();
                fetchUsedJetons();
                fetchTicketsGagnants();
                toast.info("Actualisation en cours...");
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
            
            style={{ color: isDarkMode ? "#fff" : "#000" }}>
              <ArrowPathIcon className="h-5 w-5" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div 
          className="mb-6 p-4 rounded-2xl flex items-center"
          style={{
            backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(254, 226, 226, 0.8)",
            border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(254, 226, 226, 1)"}`,
          }}
        >
          <ExclamationCircleIcon className="h-5 w-5 mr-3" style={{ color: colors.danger }} />
          <span style={{ color: colors.danger }}>{error}</span>
        </div>
      )}

      {/* Cartes de statistiques modernes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          className="rounded-2xl p-6 shadow-lg backdrop-blur-sm border"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)",
            borderColor: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(5, 150, 105, 0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Jetons Actifs
              </p>
              <p className="text-3xl font-bold" style={{ color: colors.success }}>
                {jetons.length}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl"
              style={{ backgroundColor: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(5, 150, 105, 0.1)" }}
            >
              <GiftIcon className="h-6 w-6" style={{ color: colors.success }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-2xl p-6 shadow-lg backdrop-blur-sm border"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(8, 145, 178, 0.05) 0%, rgba(8, 145, 178, 0.02) 100%)",
            borderColor: isDarkMode ? "rgba(6, 182, 212, 0.2)" : "rgba(8, 145, 178, 0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Jetons Utilisés
              </p>
              <p className="text-3xl font-bold" style={{ color: colors.secondary }}>
                {jetonsUtilises.length}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl"
              style={{ backgroundColor: isDarkMode ? "rgba(6, 182, 212, 0.2)" : "rgba(8, 145, 178, 0.1)" }}
            >
              <CheckCircleIcon className="h-6 w-6" style={{ color: colors.secondary }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-2xl p-6 shadow-lg backdrop-blur-sm border"
          style={{
            background: isDarkMode 
              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)"
              : "linear-gradient(135deg, rgba(217, 119, 6, 0.05) 0%, rgba(217, 119, 6, 0.02) 100%)",
            borderColor: isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(217, 119, 6, 0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Tickets Gagnés
              </p>
              <p className="text-3xl font-bold" style={{ color: colors.accent }}>
                {tickets?.length || 0}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl"
              style={{ backgroundColor: isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(217, 119, 6, 0.1)" }}
            >
              <TrophyIcon className="h-6 w-6" style={{ color: colors.accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section d'information épurée */}
      <div 
        className="rounded-2xl p-6 mb-8 backdrop-blur-sm border"
        style={{
          backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.05)" : "rgba(124, 58, 237, 0.03)",
          borderColor: isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.08)",
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.08)" }}
          >
            <InformationCircleIcon className="h-6 w-6" style={{ color: colors.primary }} />
          </div>
          <div>
            <p className="font-medium mb-2" style={{ color: colors.text }}>
              Les jetons Esengo sont attribués chaque lundi selon vos performances
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Utilisez-les pour tenter votre chance et découvrir des récompenses exceptionnelles !
            </p>
          </div>
        </div>
      </div>

      {/* Onglets modernes */}
      <div className="mb-8">
        <div 
          className="rounded-2xl p-2 backdrop-blur-sm border"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "actifs", label: "Actifs", count: jetons.length, icon: GiftIcon, color: colors.primary },
              { key: "utilises", label: "Utilisés", count: jetonsUtilises.length, icon: CheckCircleIcon, color: colors.success },
              { key: "expires", label: "Expirés", count: jetonsExpires.length, icon: ClockIcon, color: colors.danger },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-3 px-4 rounded-xl font-medium transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? "shadow-lg transform scale-105"
                    : "hover:scale-102"
                }`}
                style={{
                  backgroundColor: activeTab === tab.key 
                    ? isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.1)"
                    : "transparent",
                  color: activeTab === tab.key ? tab.color : colors.textSecondary,
                }}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{tab.label}</span>
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: activeTab === tab.key 
                      ? isDarkMode ? `${tab.color}30` : `${tab.color}20`
                      : isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)",
                    color: activeTab === tab.key ? tab.color : colors.textSecondary,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="mb-12">
        {activeTab === "actifs" && (
          <div className="animate-fadeIn">
            {loading ? (
              <div className="flex justify-center py-16">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent"
                  style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
                ></div>
              </div>
            ) : jetons.length === 0 ? (
              <div className="text-center py-16">
                <div 
                  className="p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: colors.surfaceLight }}
                >
                  <ArchiveBoxIcon className="h-10 w-10" style={{ color: colors.textSecondary }} />
                </div>
                <p className="font-medium mb-2" style={{ color: colors.text }}>
                  Vous n'avez pas de jetons Esengo actifs
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Revenez lundi pour découvrir vos nouvelles récompenses
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetons.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: "slideUp 0.5s ease-out forwards",
                    }}
                  >
                    {/* Carte principale */}
                    <div 
                      className="relative h-full min-h-[280px] rounded-2xl p-6 transition-all duration-300"
                      style={{
                        background: isDarkMode 
                          ? "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))"
                          : "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.5)"}`,
                        boxShadow: isDarkMode 
                          ? "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                          : "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      {/* En-tête minimaliste */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
                            }}
                          >
                            <GiftIcon className="h-5 w-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-sm tracking-tight"
                              style={{ color: colors.text }}
                            >
                              Jeton Esengo
                            </h3>
                            <div 
                              className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                              style={{
                                background: `${colors.accent}15`,
                                color: colors.accent,
                              }}
                            >
                              Actif
                            </div>
                          </div>
                        </div>
                        <div 
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.08)",
                            color: colors.textSecondary,
                          }}
                        >
                          {formatDate(jeton.created_at).split(" ")[0]}
                        </div>
                      </div>

                      {/* Code unique avec design moderne */}
                      <div className="mb-6">
                        <div 
                          className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          Code
                        </div>
                        <div 
                          className="relative p-3 rounded-xl text-center font-mono text-sm font-medium transition-all duration-300 group-hover:shadow-md"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                              : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(226, 232, 240, 0.8)"}`,
                            color: colors.text,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {jeton.code_unique}
                          <div 
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}05, transparent)`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Informations d'expiration */}
                      <div className="mb-6">
                        <div 
                          className="flex items-center justify-between p-3 rounded-xl transition-all duration-300"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.04))"
                              : "linear-gradient(135deg, rgba(251, 191, 36, 0.06), rgba(251, 191, 36, 0.02))",
                            border: `1px solid ${isDarkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(251, 191, 36, 0.1)"}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" style={{ color: colors.accent }} />
                            <span 
                              className="text-xs font-medium"
                              style={{ color: colors.textSecondary }}
                            >
                              Valide jusqu'au
                            </span>
                          </div>
                          <span 
                            className="text-xs font-semibold"
                            style={{ color: colors.accent }}
                          >
                            {formatDate(jeton.date_expiration)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => handleUseJeton(jeton)}
                          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-white relative overflow-hidden group/btn"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <SparklesIcon className="h-4 w-4" />
                            Utiliser
                          </span>
                          <div 
                            className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"
                            style={{
                              background: "linear-gradient(135deg, rgba(255,255,255,0.3), transparent)",
                            }}
                          ></div>
                        </button>
                        <button
                          onClick={() => fetchJetonHistory(jeton.id)}
                          className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))"
                              : "linear-gradient(135deg, rgba(100, 116, 139, 0.08), rgba(100, 116, 139, 0.04))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(100, 116, 139, 0.1)"}`,
                          }}
                          title="Historique"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" style={{ color: colors.textSecondary }} />
                        </button>
                      </div>
                    </div>

                    {/* Effet de brillance subtil au hover */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}08, transparent, ${colors.primaryLight}08)`,
                        transform: "translateZ(0)",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "utilises" && (
          <div className="animate-fadeIn">
            {loadingUsed ? (
              <div className="flex justify-center py-16">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent"
                  style={{ borderColor: colors.success, borderTopColor: "transparent" }}
                ></div>
              </div>
            ) : jetonsUtilises.length === 0 ? (
              <div className="text-center py-16">
                <div 
                  className="p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: colors.surfaceLight }}
                >
                  <ArchiveBoxIcon className="h-10 w-10" style={{ color: colors.textSecondary }} />
                </div>
                <p className="font-medium mb-2" style={{ color: colors.text }}>
                  Vous n'avez pas encore utilisé de jetons Esengo
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Utilisez vos jetons actifs pour découvrir des récompenses
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetonsUtilises.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] opacity-90"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: "slideUp 0.5s ease-out forwards",
                    }}
                  >
                    {/* Carte principale */}
                    <div 
                      className="relative h-full min-h-[280px] rounded-2xl p-6 transition-all duration-300"
                      style={{
                        background: isDarkMode 
                          ? "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))"
                          : "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.5)"}`,
                        boxShadow: isDarkMode 
                          ? "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                          : "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      {/* En-tête minimaliste */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${colors.success}20, ${colors.success}10)`,
                            }}
                          >
                            <CheckCircleIcon className="h-5 w-5" style={{ color: colors.success }} />
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-sm tracking-tight"
                              style={{ color: colors.text }}
                            >
                              Jeton Utilisé
                            </h3>
                            <div 
                              className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                              style={{
                                background: `${colors.success}15`,
                                color: colors.success,
                              }}
                            >
                              Consommé
                            </div>
                          </div>
                        </div>
                        <div 
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.08)",
                            color: colors.textSecondary,
                          }}
                        >
                          {formatDate(jeton.created_at).split(" ")[0]}
                        </div>
                      </div>

                      {/* Code unique avec design moderne */}
                      <div className="mb-6">
                        <div 
                          className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          Code
                        </div>
                        <div 
                          className="relative p-3 rounded-xl text-center font-mono text-sm font-medium transition-all duration-300 group-hover:shadow-md"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                              : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(226, 232, 240, 0.8)"}`,
                            color: colors.text,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {jeton.code_unique}
                          <div 
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors.success}05, transparent)`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Informations d'utilisation */}
                      <div className="mb-6">
                        <div 
                          className="flex items-center justify-between p-3 rounded-xl transition-all duration-300"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04))"
                              : "linear-gradient(135deg, rgba(5, 150, 105, 0.06), rgba(5, 150, 105, 0.02))",
                            border: `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.15)" : "rgba(5, 150, 105, 0.1)"}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" style={{ color: colors.success }} />
                            <span 
                              className="text-xs font-medium"
                              style={{ color: colors.textSecondary }}
                            >
                              Utilisé le
                            </span>
                          </div>
                          <span 
                            className="text-xs font-semibold"
                            style={{ color: colors.success }}
                          >
                            {jeton.date_utilisation ? formatDate(jeton.date_utilisation) : formatDate(jeton.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Ticket gagné si applicable */}
                      {jeton.ticket_id && (
                        <div className="mb-6">
                          <div 
                            className="flex items-center gap-2 p-3 rounded-xl transition-all duration-300"
                            style={{
                              background: isDarkMode 
                                ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.04))"
                                : "linear-gradient(135deg, rgba(251, 191, 36, 0.06), rgba(251, 191, 36, 0.02))",
                              border: `1px solid ${isDarkMode ? "rgba(245, 158, 11, 0.15)" : "rgba(251, 191, 36, 0.1)"}`,
                            }}
                          >
                            <TrophyIcon className="h-4 w-4" style={{ color: colors.accent }} />
                            <span 
                              className="text-xs font-medium"
                              style={{ color: colors.accent }}
                            >
                              Ticket #{jeton.ticket_id}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      <div className="mt-auto">
                        <button
                          onClick={() => fetchJetonHistory(jeton.id)}
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden group/btn"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))"
                              : "linear-gradient(135deg, rgba(100, 116, 139, 0.08), rgba(100, 116, 139, 0.04))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(100, 116, 139, 0.1)"}`,
                            color: colors.textSecondary,
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Voir l'historique
                          </span>
                          <div 
                            className="absolute inset-0 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors.success}20, transparent)`,
                            }}
                          ></div>
                        </button>
                      </div>
                    </div>

                    {/* Effet de brillance subtil au hover */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${colors.success}08, transparent, ${colors.success}05)`,
                        transform: "translateZ(0)",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "expires" && (
          <div className="animate-fadeIn">
            {loadingExpired ? (
              <div className="flex justify-center py-16">
                <div 
                  className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent"
                  style={{ borderColor: colors.danger, borderTopColor: "transparent" }}
                ></div>
              </div>
            ) : jetonsExpires.length === 0 ? (
              <div className="text-center py-16">
                <div 
                  className="p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: colors.surfaceLight }}
                >
                  <ArchiveBoxIcon className="h-10 w-10" style={{ color: colors.textSecondary }} />
                </div>
                <p className="font-medium mb-2" style={{ color: colors.text }}>
                  Vous n'avez pas de jetons Esengo expirés
                </p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Utilisez vos jetons avant leur date d'expiration
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetonsExpires.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] opacity-75"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: "slideUp 0.5s ease-out forwards",
                    }}
                  >
                    {/* Carte principale */}
                    <div 
                      className="relative h-full min-h-[280px] rounded-2xl p-6 transition-all duration-300"
                      style={{
                        background: isDarkMode 
                          ? "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))"
                          : "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.5)"}`,
                        boxShadow: isDarkMode 
                          ? "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                          : "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                      }}
                    >
                      {/* En-tête minimaliste */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${colors.danger}20, ${colors.danger}10)`,
                            }}
                          >
                            <ClockIcon className="h-5 w-5" style={{ color: colors.danger }} />
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-sm tracking-tight"
                              style={{ color: colors.text }}
                            >
                              Jeton Expiré
                            </h3>
                            <div 
                              className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block"
                              style={{
                                background: `${colors.danger}15`,
                                color: colors.danger,
                              }}
                            >
                              Expiré
                            </div>
                          </div>
                        </div>
                        <div 
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{
                            background: isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.08)",
                            color: colors.textSecondary,
                          }}
                        >
                          {formatDate(jeton.created_at).split(" ")[0]}
                        </div>
                      </div>

                      {/* Code unique avec design moderne */}
                      <div className="mb-6">
                        <div 
                          className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70"
                          style={{ color: colors.textSecondary }}
                        >
                          Code
                        </div>
                        <div 
                          className="relative p-3 rounded-xl text-center font-mono text-sm font-medium transition-all duration-300 group-hover:shadow-md"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))"
                              : "linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(226, 232, 240, 0.8)"}`,
                            color: colors.text,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {jeton.code_unique}
                          <div 
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors.danger}05, transparent)`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Informations d'expiration */}
                      <div className="mb-6">
                        <div 
                          className="flex items-center justify-between p-3 rounded-xl transition-all duration-300"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.04))"
                              : "linear-gradient(135deg, rgba(220, 38, 38, 0.06), rgba(220, 38, 38, 0.02))",
                            border: `1px solid ${isDarkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.1)"}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" style={{ color: colors.danger }} />
                            <span 
                              className="text-xs font-medium"
                              style={{ color: colors.textSecondary }}
                            >
                              Expiré le
                            </span>
                          </div>
                          <span 
                            className="text-xs font-semibold"
                            style={{ color: colors.danger }}
                          >
                            {formatDate(jeton.date_expiration)}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="mt-auto">
                        <button
                          onClick={() => fetchJetonHistory(jeton.id)}
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] relative overflow-hidden group/btn"
                          style={{
                            background: isDarkMode 
                              ? "linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05))"
                              : "linear-gradient(135deg, rgba(100, 116, 139, 0.08), rgba(100, 116, 139, 0.04))",
                            border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.15)" : "rgba(100, 116, 139, 0.1)"}`,
                            color: colors.textSecondary,
                          }}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Voir l'historique
                          </span>
                          <div 
                            className="absolute inset-0 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${colors.danger}20, transparent)`,
                            }}
                          ></div>
                        </button>
                      </div>
                    </div>

                    {/* Effet de brillance subtil au hover */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${colors.danger}08, transparent, ${colors.danger}05)`,
                        transform: "translateZ(0)",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Tickets Gagnants */}
      <div 
        className="rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <div 
          className="p-8"
          style={{
            background: isDarkMode 
              ? "#1f2937"
              : "#fff",
          }}
        >
          <h3 className="text-2xl font-bold text-white flex items-center mb-2"
          style={{ color: isDarkMode ? "#fff" : "#000" }}>
            <div 
              className="p-3 rounded-2xl mr-4 backdrop-blur-sm"
              style={{ backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "#efeeeeff" }}
            >
              <TrophyIcon className="h-6 w-6 text-white" 
              style={{ color: isDarkMode ? "#fff" : "#000" }}/>
            </div>
            Mes Tickets Gagnants
          </h3>
          <p className="text-white/80"
          style={{ color: isDarkMode ? "#fff" : "#000" }}>
            Vos récompenses exceptionnelles
          </p>
        </div>

        <div className="p-8">
          {ticketsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center">
                <div 
                  className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mb-3"
                  style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
                ></div>
                <p style={{ color: colors.textSecondary }}>
                  Chargement des tickets...
                </p>
              </div>
            </div>
          ) : tickets?.length === 0 ? (
            <div className="text-center py-16">
              <div 
                className="p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: colors.surfaceLight }}
              >
                <TrophyIcon className="h-10 w-10" style={{ color: colors.textSecondary }} />
              </div>
              <p className="font-medium mb-2" style={{ color: colors.text }}>
                Vous n'avez pas encore de tickets gagnants.
              </p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Utilisez vos jetons Esengo pour tenter votre chance !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(tickets) &&
                tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border shadow-md backdrop-blur-sm transition-all duration-300 overflow-hidden hover:shadow-lg"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="p-3 rounded-2xl"
                            style={{
                              backgroundColor: isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.05)",
                            }}
                          >
                            {ticket.cadeau?.image_url ? (
                              <img
                                src={ticket.cadeau.image_url}
                                alt={ticket.cadeau.nom}
                                className="h-10 w-10 object-cover rounded-xl"
                              />
                            ) : (
                              <GiftIcon className="h-6 w-6" style={{ color: colors.primary }} />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold mb-1" style={{ color: colors.text }}>
                              {ticket.cadeau?.nom || "Cadeau"}
                            </div>
                            {ticket.cadeau?.description && (
                              <div className="text-sm truncate max-w-xs" style={{ color: colors.textSecondary }}>
                                {ticket.cadeau.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          <div className="text-sm" style={{ color: colors.textSecondary }}>
                            <div>Obtenu: {formatDate(ticket.created_at)}</div>
                            <div>Expire: {formatDate(ticket.date_expiration)}</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className="px-3 py-1.5 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor:
                                  ticket.consomme === "consommé"
                                    ? isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(5, 150, 105, 0.1)"
                                    : isExpired(ticket)
                                    ? isDarkMode ? "rgba(239, 68, 68, 0.2)" : "rgba(220, 38, 38, 0.1)"
                                    : ticket.consomme === "programmé"
                                    ? isDarkMode ? "rgba(245, 158, 11, 0.2)" : "rgba(217, 119, 6, 0.1)"
                                    : isDarkMode ? "rgba(6, 182, 212, 0.2)" : "rgba(8, 145, 178, 0.1)",
                                color:
                                  ticket.consomme === "consommé"
                                    ? colors.success
                                    : isExpired(ticket)
                                    ? colors.danger
                                    : ticket.consomme === "programmé"
                                    ? colors.accent
                                    : colors.secondary,
                              }}
                            >
                              {ticket.consomme === "consommé"
                                ? "Consommé"
                                : isExpired(ticket)
                                ? "Expiré"
                                : ticket.consomme === "programmé"
                                ? "Programmé"
                                : "Non consommé"}
                            </span>

                            <button
                              onClick={() => handleViewTicket(ticket.id)}
                              className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-md text-white"
                              style={{
                                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                              }}
                            >
                              <TicketIcon className="h-4 w-4" />
                              <span className="hidden md:inline">Détails</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal pour la roue de la chance */}
      <RoueDeLaChanceModal
        open={roueModalOpen}
        onClose={handleCloseRoueModal}
        jeton={selectedJeton}
        onResult={handleRoueResult}
      />

      {/* Modal pour les détails du ticket */}
      {ticketModalOpen && selectedTicket && (
        <TicketGagnantModal
          ticket={selectedTicket}
          onClose={handleCloseTicketModal}
          onConsommer={() => {
            handleCloseTicketModal();
            fetchTicketsGagnants();
          }}
        />
      )}

      {/* Modal Historique Moderne */}
      {historyModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div
            className="rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-fadeIn"
            style={{
              backgroundColor: colors.surface,
            }}
          >
            <div 
              className="p-6"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <div 
                    className="p-3 rounded-2xl mr-3 backdrop-blur-sm"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  >
                    <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                  </div>
                  Historique du jeton
                </h3>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors duration-300 p-2 rounded-xl hover:bg-white/10"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <div 
                    className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent"
                    style={{ borderColor: colors.primary, borderTopColor: "transparent" }}
                  ></div>
                </div>
              ) : historyError ? (
                <div className="text-center py-12">
                  <div 
                    className="p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(254, 226, 226, 0.8)" }}
                  >
                    <ExclamationCircleIcon className="h-10 w-10" style={{ color: colors.danger }} />
                  </div>
                  <p className="font-medium" style={{ color: colors.danger }}>
                    {historyError}
                  </p>
                </div>
              ) : jetonHistory.history?.length === 0 ||
                !jetonHistory.history ? (
                <div className="text-center py-12">
                  <div 
                    className="p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: colors.surfaceLight }}
                  >
                    <ClipboardDocumentListIcon className="h-10 w-10" style={{ color: colors.textSecondary }} />
                  </div>
                  <p className="font-medium" style={{ color: colors.text }}>
                    Aucun historique disponible pour ce jeton
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jetonHistory.history.map((entry, index) => {
                    // Vérification de sécurité
                    if (!entry) return null;
                    
                    return (
                    <div
                      key={index}
                      className="rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                      style={{
                        backgroundColor: colors.surfaceLight,
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-start gap-4 p-5">
                        <div
                          className="p-3 rounded-xl flex-shrink-0"
                          style={{
                            backgroundColor:
                              entry.action === "attribution"
                                ? isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.05)"
                                : entry.action === "utilisation"
                                ? isDarkMode ? "rgba(16, 185, 129, 0.1)" : "rgba(5, 150, 105, 0.05)"
                                : entry.action === "expiration"
                                ? isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(220, 38, 38, 0.05)"
                                : colors.surfaceLight,
                          }}
                        >
                          {entry.action === "attribution" ? (
                            <GiftIcon className="h-5 w-5" style={{ color: colors.primary }} />
                          ) : entry.action === "utilisation" ? (
                            <CheckCircleIcon className="h-5 w-5" style={{ color: colors.success }} />
                          ) : entry.action === "expiration" ? (
                            <ClockIcon className="h-5 w-5" style={{ color: colors.danger }} />
                          ) : (
                            <InformationCircleIcon className="h-5 w-5" style={{ color: colors.textSecondary }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span
                              className="font-bold text-lg"
                              style={{
                                color:
                                  entry.action === "attribution"
                                    ? colors.primary
                                    : entry.action === "utilisation"
                                    ? colors.success
                                    : entry.action === "expiration"
                                    ? colors.danger
                                    : colors.text,
                              }}
                            >
                              {entry.action ? entry.action.charAt(0).toUpperCase() + entry.action.slice(1) : 'Action inconnue'}
                            </span>
                          </div>
                          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                            {entry.description || 'Aucune description'}
                          </p>
                          <div className="flex items-center text-xs" style={{ color: colors.textSecondary }}>
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {entry.action === 'attribution' ? formatDate(entry.date_attribution) : entry.action === 'utilisation' ? formatDate(entry.date_utilisation) : formatDate(entry.date_expiration)}
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du ticket gagnant */}
      <TicketGagnantModal
        open={ticketModalOpen}
        onClose={handleCloseTicketModal}
        ticket={selectedTicket}
        onConsommer={() => {
          handleCloseTicketModal();
          fetchTicketsGagnants();
        }}
      />
    </div>
  );
};

export default JetonsEsengo;
