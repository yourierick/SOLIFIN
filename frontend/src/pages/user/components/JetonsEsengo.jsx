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
 * Design moderne et optimisé mobile
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
  const [activeTab, setActiveTab] = useState("actifs"); // 'actifs', 'expires', 'utilises'

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* En-tête moderne */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-xl relative overflow-hidden">
        {/* Décoration d'arrière-plan */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <GiftIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  Mes Jetons Esengo
                  <SparklesIcon className="h-5 w-5 text-yellow-300" />
                </h1>
                <p className="text-primary-100 text-sm sm:text-base mt-1">
                  Gagnez des cadeaux exceptionnels !
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
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl backdrop-blur-sm transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-3 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm font-medium">
                Jetons Actifs
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {jetons.length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <GiftIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm font-medium">
                Jetons Utilisés
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {jetonsUtilises.length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs sm:text-sm font-medium">
                Tickets Gagnés
              </p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {tickets?.length || 0}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Section d'information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 sm:mb-8">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mt-0.5">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-blue-800 dark:text-blue-200 text-sm sm:text-base font-medium">
              Les jetons Esengo sont attribués chaque lundi en fonction de vos
              performances de parrainage.
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm mt-1">
              Utilisez-les pour tenter votre chance à la roue et gagner des
              cadeaux exceptionnels !
            </p>
          </div>
        </div>
      </div>

      {/* Onglets optimisés mobile */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab("actifs")}
              className={`relative py-3 px-2 sm:px-4 rounded-lg font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                activeTab === "actifs"
                  ? isDarkMode
                    ? "bg-gray-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-900 shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${
                  activeTab === "actifs"
                    ? "bg-primary-100 dark:bg-primary-900/30"
                    : ""
                }`}
              >
                <GiftIcon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    activeTab === "actifs"
                      ? "text-primary-600 dark:text-primary-400"
                      : ""
                  }`}
                />
              </div>
              <span className="text-xs sm:text-sm">Actifs</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "actifs"
                    ? "bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {jetons.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("utilises")}
              className={`relative py-3 px-2 sm:px-4 rounded-lg font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                activeTab === "utilises"
                  ? isDarkMode
                    ? "bg-gray-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-900 shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${
                  activeTab === "utilises"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : ""
                }`}
              >
                <CheckCircleIcon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    activeTab === "utilises"
                      ? "text-green-600 dark:text-green-400"
                      : ""
                  }`}
                />
              </div>
              <span className="text-xs sm:text-sm">Utilisés</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "utilises"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {jetonsUtilises.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("expires")}
              className={`relative py-3 px-2 sm:px-4 rounded-lg font-medium transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                activeTab === "expires"
                  ? isDarkMode
                    ? "bg-gray-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-900 shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-full ${
                  activeTab === "expires" ? "bg-red-100 dark:bg-red-900/30" : ""
                }`}
              >
                <ClockIcon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    activeTab === "expires"
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}
                />
              </div>
              <span className="text-xs sm:text-sm">Expirés</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "expires"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {jetonsExpires.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="mb-8 sm:mb-12">
        {activeTab === "actifs" && (
          <div className="animate-fadeIn">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : jetons.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ArchiveBoxIcon className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Vous n'avez pas de jetons Esengo actifs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {jetons.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`bg-gradient-to-br ${
                      isDarkMode
                        ? "from-gray-800 to-gray-900 border-gray-700"
                        : "from-white to-gray-50 border-gray-200"
                    } p-5 sm:p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02]`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeIn 0.5s ease-out forwards",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl mr-3 shadow-lg">
                          <GiftIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            Jeton Esengo
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <StarIcon className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Premium
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-primary-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl text-center shadow-sm border border-primary-100 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-bold text-base break-all bg-white dark:bg-gray-900 py-3 px-4 rounded-lg inline-block min-w-[80%] shadow-inner">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-amber-500" />
                          Expire le:
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                      <button
                        onClick={() => handleUseJeton(jeton)}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl flex items-center justify-center font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm sm:text-base">Utiliser</span>
                      </button>
                      <button
                        onClick={() => fetchJetonHistory(jeton.id)}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl flex items-center justify-center transition-all duration-200"
                        title="Voir l'historique"
                      >
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "utilises" && (
          <div className="animate-fadeIn">
            {loadingUsed ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : jetonsUtilises.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ArchiveBoxIcon className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Vous n'avez pas encore utilisé de jetons Esengo
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {jetonsUtilises.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`bg-gradient-to-br ${
                      isDarkMode
                        ? "from-gray-800 to-gray-900 border-gray-700"
                        : "from-white to-gray-50 border-gray-200"
                    } p-5 sm:p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02] opacity-90`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeIn 0.5s ease-out forwards",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl mr-3 shadow-lg">
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            Jeton Utilisé
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Consommé
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl text-center shadow-sm border border-gray-200 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-bold text-sm break-all bg-white dark:bg-gray-900 py-3 px-4 rounded-lg inline-block min-w-[80%] shadow-inner">
                          {jeton.code_unique}
                        </div>
                      </div>

                      {jeton.date_utilisation ? (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                            Utilisé le:
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-400">
                            {formatDate(jeton.date_utilisation)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                            Utilisé le:
                          </span>
                          <span className="font-bold text-green-700 dark:text-green-400">
                            {formatDate(jeton.created_at)}
                          </span>
                        </div>
                      )}

                      {jeton.ticket_id && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-center text-green-700 dark:text-green-400">
                            <TrophyIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">
                              Ticket gagné #{jeton.ticket_id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl flex items-center justify-center mt-auto font-medium transition-all duration-200"
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                      Voir l'historique
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "expires" && (
          <div className="animate-fadeIn">
            {loadingExpired ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
              </div>
            ) : jetonsExpires.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ArchiveBoxIcon className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Vous n'avez pas de jetons Esengo expirés
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {jetonsExpires.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`bg-gradient-to-br ${
                      isDarkMode
                        ? "from-gray-800 to-gray-900 border-gray-700"
                        : "from-white to-gray-50 border-gray-200"
                    } p-5 sm:p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02] opacity-75`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeIn 0.5s ease-out forwards",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl mr-3 shadow-lg">
                          <ClockIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                            Jeton Expiré
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <ClockIcon className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Expiré
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl text-center shadow-sm border border-gray-200 dark:border-gray-600">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-bold text-sm break-all bg-white dark:bg-gray-900 py-3 px-4 rounded-lg inline-block min-w-[80%] shadow-inner">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-red-500" />
                          Expiré le:
                        </span>
                        <span className="font-bold text-red-700 dark:text-red-400">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl flex items-center justify-center mt-auto font-medium transition-all duration-200"
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                      Voir l'historique
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Tickets Gagnants */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center">
            <div className="bg-white/20 p-3 rounded-xl mr-4 backdrop-blur-sm">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
            Mes Tickets Gagnants
          </h3>
          <p className="text-purple-100 mt-2">
            Vos cadeaux exceptionnels remportés
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {ticketsLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600 mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Chargement des tickets...
                </p>
              </div>
            </div>
          ) : tickets?.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <TrophyIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                Vous n'avez pas encore de tickets gagnants.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Utilisez vos jetons Esengo pour tenter votre chance à la roue !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(tickets) &&
                tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`bg-gradient-to-r ${
                      isDarkMode
                        ? "from-gray-800 to-gray-900 border-gray-700"
                        : "from-white to-gray-50 border-gray-200"
                    } rounded-xl border shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-xl">
                            {ticket.cadeau?.image_url ? (
                              <img
                                src={ticket.cadeau.image_url}
                                alt={ticket.cadeau.nom}
                                className="h-10 w-10 object-cover rounded-lg"
                              />
                            ) : (
                              <GiftIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {ticket.cadeau?.nom || "Cadeau"}
                            </div>
                            {ticket.cadeau?.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {ticket.cadeau.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <div>Obtenu: {formatDate(ticket.created_at)}</div>
                            <div>
                              Expire: {formatDate(ticket.date_expiration)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                                ticket.consomme === "consommé"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : isExpired(ticket)
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : ticket.consomme === "programmé"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
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
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-md"
                            >
                              <TicketIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">Détails</span>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${
              isDarkMode ? "bg-gray-900" : "bg-white"
            } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-fadeIn`}
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <div className="bg-white/20 p-3 rounded-xl mr-3 backdrop-blur-sm">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                  </div>
                  Historique du jeton
                </h3>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-white/10"
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
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : historyError ? (
                <div className="text-center py-12">
                  <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ExclamationCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {historyError}
                  </p>
                </div>
              ) : jetonHistory.history?.length === 0 ||
                !jetonHistory.history ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Aucun historique disponible pour ce jeton
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jetonHistory.history.map((entry, index) => (
                    <div
                      key={index}
                      className={`${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-50 border-gray-200"
                      } p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl flex-shrink-0 ${
                            entry.action === "créé"
                              ? "bg-blue-100 dark:bg-blue-900/30"
                              : entry.action === "utilisé"
                              ? "bg-green-100 dark:bg-green-900/30"
                              : entry.action === "expiré"
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-gray-100 dark:bg-gray-600/30"
                          }`}
                        >
                          {entry.action === "créé" ? (
                            <GiftIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : entry.action === "utilisé" ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : entry.action === "expiré" ? (
                            <ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <InformationCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span
                              className={`font-bold text-lg ${
                                entry.action === "créé"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : entry.action === "utilisé"
                                  ? "text-green-600 dark:text-green-400"
                                  : entry.action === "expiré"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {entry.action.charAt(0).toUpperCase() +
                                entry.action.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {entry.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(entry.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
