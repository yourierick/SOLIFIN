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
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoueDeLaChanceModal from "./RoueDeLaChanceModal";
import TicketGagnantModal from "./TicketGagnantModal";

/**
 * Composant pour afficher les jetons Esengo et les tickets gagnants de l'utilisateur
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
    <div
      className={`${themeColors.bg} ${themeColors.text} p-6 rounded-lg shadow-md`}
    >
      {/* Les animations sont maintenant importées via le fichier CSS */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <GiftIcon className="h-6 w-6 mr-2 text-primary-600" />
          Mes Jetons Esengo
        </h2>
        <button
          onClick={() => {
            fetchJetonsEsengo();
            fetchExpiredJetons();
            fetchUsedJetons();
            fetchTicketsGagnants();
            toast.info("Actualisation en cours...");
          }}
          className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"} transition-all duration-300 hover:scale-105`}
        >
          <ArrowPathIcon className="h-5 w-5 mr-1" />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center mb-4">
          <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Les jetons Esengo sont attribués chaque mois en fonction de vos
            performances de parrainage. Utilisez-les pour tenter votre chance à
            la roue et gagner des cadeaux !
          </p>
        </div>

        {/* Onglets pour basculer entre jetons actifs, utilisés et expirés */}
        <div className="mb-6">
          <div
            className={`flex rounded-lg overflow-hidden shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            } p-1`}
          >
            <button
              onClick={() => setActiveTab("actifs")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === "actifs"
                  ? isDarkMode
                    ? "bg-gray-700 text-primary-400 shadow-md"
                    : "bg-white text-primary-600 shadow-md"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`p-1.5 rounded-full mr-2 ${
                    activeTab === "actifs"
                      ? "bg-primary-100 dark:bg-primary-900/30"
                      : ""
                  }`}
                >
                  <GiftIcon
                    className={`h-5 w-5 ${
                      activeTab === "actifs"
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                </div>
                <span>Actifs</span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "actifs"
                      ? "bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {jetons.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("utilises")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === "utilises"
                  ? isDarkMode
                    ? "bg-gray-700 text-green-400 shadow-md"
                    : "bg-white text-green-600 shadow-md"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`p-1.5 rounded-full mr-2 ${
                    activeTab === "utilises"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : ""
                  }`}
                >
                  <CheckCircleIcon
                    className={`h-5 w-5 ${
                      activeTab === "utilises"
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                </div>
                <span>Utilisés</span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "utilises"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {jetonsUtilises.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("expires")}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                activeTab === "expires"
                  ? isDarkMode
                    ? "bg-gray-700 text-red-400 shadow-md"
                    : "bg-white text-red-600 shadow-md"
                  : isDarkMode
                  ? "text-gray-300 hover:bg-gray-700/50"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`p-1.5 rounded-full mr-2 ${
                    activeTab === "expires"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : ""
                  }`}
                >
                  <ClockIcon
                    className={`h-5 w-5 ${
                      activeTab === "expires"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                </div>
                <span>Expirés</span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "expires"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {jetonsExpires.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Affichage des jetons selon l'onglet actif */}
        {activeTab === "actifs" && (
          <div className="animate-fadeIn">
            {/* Affichage des jetons actifs */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="loader"></div>
              </div>
            ) : jetons.length === 0 ? (
              <div className="text-center py-8">
                <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Vous n'avez pas de jetons Esengo actifs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetons.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-5 rounded-xl border hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02]`}
                    style={{ animationDelay: `${index * 100}ms`, animation: 'fadeIn 0.5s ease-out forwards' }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full mr-3">
                          <GiftIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span className="font-semibold text-lg">
                          Jeton Esengo
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-primary-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg text-center shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-medium text-sm break-all bg-white/80 dark:bg-gray-900/50 py-2 px-3 rounded-md inline-block min-w-[80%]">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-amber-500" />
                          Expire le:
                        </span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-auto">
                      <button
                        onClick={() => handleUseJeton(jeton)}
                        className={`${themeColors.button} flex-1 py-2.5 rounded-lg flex items-center justify-center font-medium shadow-sm hover:shadow transition-all duration-200`}
                      >
                        <GiftIcon className="h-5 w-5 mr-2" />
                        Utiliser ce jeton
                      </button>
                      <button
                        onClick={() => fetchJetonHistory(jeton.id)}
                        className={`${themeColors.buttonSecondary} px-3 py-2.5 rounded-lg flex items-center justify-center hover:shadow transition-all duration-200`}
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
            {/* Affichage des jetons utilisés */}
            {loadingUsed ? (
              <div className="flex justify-center py-8">
                <div className="loader"></div>
              </div>
            ) : jetonsUtilises.length === 0 ? (
              <div className="text-center py-8">
                <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Vous n'avez pas encore utilisé de jetons Esengo
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetonsUtilises.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-5 rounded-xl border hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02]`}
                    style={{ animationDelay: `${index * 100}ms`, animation: 'fadeIn 0.5s ease-out forwards' }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-semibold text-lg">
                          Jeton Utilisé
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg text-center shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-medium text-sm break-all bg-white/80 dark:bg-gray-900/50 py-2 px-3 rounded-md inline-block min-w-[80%]">
                          {jeton.code_unique}
                        </div>
                      </div>
                      {jeton.date_expiration ? (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                            Expiré le:
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatDate(jeton.date_expiration)}
                          </span>
                        </div>
                      ) : jeton.date_utilisation ? (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                            Utilisé le:
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatDate(jeton.date_utilisation)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                            Utilisé le:
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatDate(jeton.created_at)}
                          </span>
                        </div>
                      )}

                      {jeton.ticket_id && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center text-green-700 dark:text-green-400">
                            <TicketIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">
                              Ticket gagné #{jeton.ticket_id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className={`${themeColors.buttonSecondary} w-full py-2.5 rounded-lg flex items-center justify-center mt-auto font-medium shadow-sm hover:shadow transition-all duration-200`}
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
            {/* Affichage des jetons expirés */}
            {loadingExpired ? (
              <div className="flex justify-center py-8">
                <div className="loader"></div>
              </div>
            ) : jetonsExpires.length === 0 ? (
              <div className="text-center py-8">
                <ArchiveBoxIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Vous n'avez pas de jetons Esengo expirés
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jetonsExpires.map((jeton, index) => (
                  <div
                    key={jeton.id}
                    className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-5 rounded-xl border hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:scale-[1.02] opacity-85 animate-fadeIn delay-${Math.min(Math.floor(index * 100), 500)}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-3">
                          <ClockIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-semibold text-lg">
                          Jeton Expiré
                        </span>
                      </div>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-4 mb-5">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg text-center shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 font-medium">
                          Code Unique
                        </div>
                        <div className="font-mono font-medium text-sm break-all bg-white/80 dark:bg-gray-900/50 py-2 px-3 rounded-md inline-block min-w-[80%]">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-red-500" />
                          Expiré le:
                        </span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className={`${themeColors.buttonSecondary} w-full py-2.5 rounded-lg flex items-center justify-center mt-auto font-medium shadow-sm hover:shadow transition-all duration-200`}
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

      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold flex items-center mb-6 animate-slideIn">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full mr-3">
            <TicketIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          Mes tickets gagnants
        </h3>

        {ticketsLoading ? (
          <div className="flex justify-center items-center h-40 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Chargement des tickets...
              </p>
            </div>
          </div>
        ) : tickets?.length === 0 ? (
          <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-4">
              <TicketIcon className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
              Vous n'avez pas encore de tickets gagnants.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Utilisez vos jetons Esengo pour tenter votre chance à la roue !
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr
                    className={`${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
                  >
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Cadeau
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Date d'obtention
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Expiration
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(tickets) &&
                    tickets.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        className={`${
                          isDarkMode
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-gray-50"
                        } transition-colors duration-150 ${
                          index % 2 === 0
                            ? ""
                            : isDarkMode
                            ? "bg-gray-800/50"
                            : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              {ticket.cadeau?.image_url ? (
                                <img
                                  src={ticket.cadeau.image_url}
                                  alt={ticket.cadeau.nom}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <GiftIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {ticket.cadeau?.nom || "Cadeau"}
                              </div>
                              {ticket.cadeau?.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                  {ticket.cadeau.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(ticket.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(ticket.date_expiration)}
                          </div>
                          {isExpired(ticket) ? (
                            <div className="text-xs text-red-500">Expiré</div>
                          ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.ceil(
                                (new Date(ticket.date_expiration) -
                                  new Date()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              jours restants
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewTicket(ticket.id)}
                            className={`mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"} transition-all duration-300 hover:scale-105`}
                          >
                            <TicketIcon className="h-4 w-4 mr-1" />
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {/* Modal pour afficher l'historique d'un jeton */}
      {historyModalOpen && jetonHistory && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
          <div
            className={`${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}
          >
            <div
              className={`p-5 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } flex justify-between items-center bg-gradient-to-r ${
                isDarkMode
                  ? "from-gray-800 to-gray-700"
                  : "from-gray-50 to-white"
              }`}
            >
              <h3 className="text-lg font-bold flex items-center">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full mr-3">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                Historique du jeton
              </h3>
              <button
                onClick={handleCloseHistoryModal}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                aria-label="Fermer"
              >
                <svg
                  className="h-5 w-5"
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

            <div className="p-6 overflow-y-auto flex-grow">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-60">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Chargement de l'historique...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informations sur le jeton */}
                  {jetonHistory.jeton && (
                    <div
                      className={`${
                        isDarkMode ? "bg-gray-800/50" : "bg-gray-50"
                      } p-5 rounded-xl shadow-sm border ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <h4 className="font-semibold mb-4 text-lg flex items-center">
                        <GiftIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Informations du jeton
                      </h4>

                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Code unique
                            </p>
                            <p className="font-mono font-medium text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                              {jetonHistory.jeton.code_unique}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Créé le
                            </p>
                            <p className="font-medium flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1 text-primary-500" />
                              {formatDate(jetonHistory.jeton.created_at)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Expire le
                            </p>
                            <p className="font-medium flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1 text-amber-500" />
                              {formatDate(jetonHistory.jeton.date_expiration)}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Statut
                            </p>
                            <p>
                              {jetonHistory.jeton.is_used ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Utilisé
                                </span>
                              ) : new Date(jetonHistory.jeton.date_expiration) <
                                new Date() ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  Expiré
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                                  <GiftIcon className="h-4 w-4 mr-1" />
                                  Actif
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historique des actions */}
                  <div>
                    <h4 className="font-semibold mb-4 text-lg flex items-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Historique des actions
                    </h4>

                    {Array.isArray(jetonHistory.history) &&
                    jetonHistory.history.length > 0 ? (
                      <div className="space-y-4">
                        {jetonHistory.history.map((entry, index) => (
                          <div
                            key={entry.id}
                            className={`${
                              isDarkMode ? "bg-gray-800/70" : "bg-white"
                            } p-4 rounded-xl shadow-sm border ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            } transition-all duration-200 hover:shadow-md`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center">
                                <div
                                  className={`p-2 rounded-full mr-3 ${
                                    entry.action === "attribution"
                                      ? "bg-green-100 dark:bg-green-900/30"
                                      : entry.action === "utilisation"
                                      ? "bg-blue-100 dark:bg-blue-900/30"
                                      : "bg-red-100 dark:bg-red-900/30"
                                  }`}
                                >
                                  {entry.action === "attribution" && (
                                    <GiftIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  )}
                                  {entry.action === "utilisation" && (
                                    <TicketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  )}
                                  {entry.action === "expiration" && (
                                    <ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-base">
                                    {entry.action === "attribution" &&
                                      "Attribution"}
                                    {entry.action === "utilisation" &&
                                      "Utilisation"}
                                    {entry.action === "expiration" &&
                                      "Expiration"}
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(entry.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                                #{index + 1}
                              </div>
                            </div>

                            {entry.description && (
                              <p className="text-sm mt-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                {entry.description}
                              </p>
                            )}

                            {entry.metadata &&
                              typeof entry.metadata === "object" && (
                                <div
                                  className={`mt-3 text-xs bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border ${
                                    isDarkMode
                                      ? "border-gray-700"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <p className="font-medium mb-2 text-gray-500 dark:text-gray-400">
                                    Détails supplémentaires:
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(entry.metadata).map(
                                      ([key, value]) => (
                                        <div key={key} className="flex">
                                          <span className="font-medium mr-1 text-gray-600 dark:text-gray-300">
                                            {key}:
                                          </span>
                                          <span className="text-gray-500 dark:text-gray-400">
                                            {typeof value === "object"
                                              ? JSON.stringify(value)
                                              : value}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-4">
                          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
                          Aucun historique disponible pour ce jeton.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`p-5 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } bg-gradient-to-r ${
                isDarkMode
                  ? "from-gray-800 to-gray-700"
                  : "from-gray-50 to-white"
              }`}
            >
              <button
                onClick={handleCloseHistoryModal}
                className={`w-full py-2.5 rounded-lg flex items-center justify-center font-medium shadow-sm transition-colors duration-150 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <svg
                  className="h-5 w-5 mr-2"
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
                Fermer
              </button>
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
