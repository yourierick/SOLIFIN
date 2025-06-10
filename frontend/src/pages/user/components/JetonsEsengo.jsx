import React, { useState, useEffect } from "react";
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
          className={`${themeColors.buttonSecondary} px-3 py-2 rounded-md flex items-center`}
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
        <div className="flex border-b mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("actifs")}
            className={`px-4 py-2 font-medium ${
              activeTab === "actifs"
                ? `border-b-2 border-primary-600 text-primary-600`
                : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`
            }`}
          >
            <div className="flex items-center">
              <GiftIcon className="h-4 w-4 mr-1" />
              Actifs ({jetons.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("utilises")}
            className={`px-4 py-2 font-medium ${
              activeTab === "utilises"
                ? `border-b-2 border-primary-600 text-primary-600`
                : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`
            }`}
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Utilisés ({jetonsUtilises.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("expires")}
            className={`px-4 py-2 font-medium ${
              activeTab === "expires"
                ? `border-b-2 border-primary-600 text-primary-600`
                : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300`
            }`}
          >
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Expirés ({jetonsExpires.length})
            </div>
          </button>
        </div>

        {/* Affichage des jetons selon l'onglet actif */}
        {activeTab === "actifs" && (
          // Affichage des jetons actifs
          <div>
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
                {jetons.map((jeton) => (
                  <div
                    key={jeton.id}
                    className={`${themeColors.card} p-4 rounded-lg border ${themeColors.border} hover:shadow-md transition-shadow flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <GiftIcon className="h-6 w-6 mr-2 text-primary-600" />
                        <span className="font-medium text-lg">
                          Jeton Esengo
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-2 mb-4">
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Code
                        </div>
                        <div className="font-mono font-medium text-sm break-all">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Expire le:
                        </span>
                        <span className="font-medium text-amber-600">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-auto">
                      <button
                        onClick={() => handleUseJeton(jeton)}
                        className={`${themeColors.button} flex-1 py-2 rounded-md flex items-center justify-center`}
                      >
                        <GiftIcon className="h-5 w-5 mr-1" />
                        Utiliser
                      </button>
                      <button
                        onClick={() => fetchJetonHistory(jeton.id)}
                        className={`${themeColors.buttonSecondary} px-3 py-2 rounded-md flex items-center justify-center`}
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
          // Affichage des jetons utilisés
          <div>
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
                {jetonsUtilises.map((jeton) => (
                  <div
                    key={jeton.id}
                    className={`${themeColors.card} p-4 rounded-lg border ${themeColors.border} hover:shadow-md transition-shadow flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-6 w-6 mr-2 text-green-600" />
                        <span className="font-medium text-lg">
                          Jeton Utilisé
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-2 mb-4">
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Code
                        </div>
                        <div className="font-mono font-medium text-sm break-all">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Utilisé le:
                        </span>
                        <span className="font-medium text-green-600">
                          {formatDate(jeton.date_utilisation)}
                        </span>
                      </div>

                      {jeton.ticket_id && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                          <div className="flex items-center text-green-700 dark:text-green-400">
                            <TicketIcon className="h-4 w-4 mr-1" />
                            <span className="text-xs">
                              Ticket gagné #{jeton.ticket_id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className={`${themeColors.buttonSecondary} w-full py-2 rounded-md flex items-center justify-center mt-auto`}
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-1" />
                      Voir l'historique
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "expires" && (
          // Affichage des jetons expirés
          <div>
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
                {jetonsExpires.map((jeton) => (
                  <div
                    key={jeton.id}
                    className={`${themeColors.card} p-4 rounded-lg border ${themeColors.border} hover:shadow-md transition-shadow opacity-75 flex flex-col h-full`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <ClockIcon className="h-6 w-6 mr-2 text-amber-600" />
                        <span className="font-medium text-lg">
                          Jeton Expiré
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(jeton.created_at).split(" ")[0]}
                      </span>
                    </div>

                    <div className="flex-grow space-y-2 mb-4">
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Code
                        </div>
                        <div className="font-mono font-medium text-sm break-all">
                          {jeton.code_unique}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Expiré le:
                        </span>
                        <span className="font-medium text-red-600">
                          {formatDate(jeton.date_expiration)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchJetonHistory(jeton.id)}
                      className={`${themeColors.buttonSecondary} w-full py-2 rounded-md flex items-center justify-center mt-auto`}
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5 mr-1" />
                      Voir l'historique
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold flex items-center mb-4">
          <TicketIcon className="h-6 w-6 mr-2 text-primary-600" />
          Mes tickets gagnants
        </h3>

        {ticketsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : tickets?.length === 0 ? (
          <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center">
            <TicketIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Vous n'avez pas encore de tickets gagnants.
              <br />
              Utilisez vos jetons Esengo pour tenter votre chance !
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full ${themeColors.border} border`}>
              <thead>
                <tr className={`${themeColors.card}`}>
                  <th
                    className={`px-4 py-3 ${themeColors.border} border text-left`}
                  >
                    Cadeau
                  </th>
                  <th
                    className={`px-4 py-3 ${themeColors.border} border text-left`}
                  >
                    Date d'obtention
                  </th>
                  <th
                    className={`px-4 py-3 ${themeColors.border} border text-left`}
                  >
                    Expiration
                  </th>
                  <th
                    className={`px-4 py-3 ${themeColors.border} border text-left`}
                  >
                    Statut
                  </th>
                  <th
                    className={`px-4 py-3 ${themeColors.border} border text-left`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tickets) &&
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className={`${themeColors.hover}`}>
                      <td className={`px-4 py-3 ${themeColors.border} border`}>
                        <div className="flex items-center">
                          {ticket.cadeau?.image_url ? (
                            <img
                              src={ticket.cadeau.image_url}
                              alt={ticket.cadeau.nom}
                              className="h-8 w-8 object-cover rounded-md mr-2"
                            />
                          ) : (
                            <GiftIcon className="h-6 w-6 mr-2 text-primary-600" />
                          )}
                          {ticket.cadeau?.nom || "Cadeau"}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${themeColors.border} border`}>
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className={`px-4 py-3 ${themeColors.border} border`}>
                        {formatDate(ticket.date_expiration)}
                      </td>
                      <td className={`px-4 py-3 ${themeColors.border} border`}>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            ticket.consomme
                              ? "bg-green-100 text-green-800"
                              : isExpired(ticket)
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ticket.consomme
                            ? "Utilisé"
                            : isExpired(ticket)
                            ? "Expiré"
                            : "Valide"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${themeColors.border} border`}>
                        <button
                          onClick={() => handleViewTicket(ticket.id)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div
            className={`${themeColors.bg} ${themeColors.text} rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col`}
          >
            <div
              className={`p-4 border-b ${themeColors.border} flex justify-between items-center`}
            >
              <h3 className="text-lg font-semibold flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                Historique du jeton
              </h3>
              <button
                onClick={handleCloseHistoryModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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

            <div className="p-4 overflow-y-auto flex-grow">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div>
                  {/* Informations sur le jeton */}
                  {jetonHistory.jeton && (
                    <div
                      className={`${themeColors.card} p-4 rounded-lg mb-4 border ${themeColors.border}`}
                    >
                      <h4 className="font-medium mb-2">
                        Informations du jeton
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Code:
                          </span>
                          <span className="ml-1 font-mono font-medium">
                            {jetonHistory.jeton.code_unique}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Créé le:
                          </span>
                          <span className="ml-1">
                            {formatDate(jetonHistory.jeton.created_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Expire le:
                          </span>
                          <span className="ml-1">
                            {formatDate(jetonHistory.jeton.date_expiration)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Statut:
                          </span>
                          <span className="ml-1">
                            {jetonHistory.jeton.is_used ? (
                              <span className="text-blue-600">Utilisé</span>
                            ) : new Date(jetonHistory.jeton.date_expiration) <
                              new Date() ? (
                              <span className="text-red-600">Expiré</span>
                            ) : (
                              <span className="text-green-600">Actif</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historique des actions */}
                  <h4 className="font-medium mb-2">Historique des actions</h4>
                  {Array.isArray(jetonHistory.history) &&
                  jetonHistory.history.length > 0 ? (
                    <div className="space-y-3">
                      {jetonHistory.history.map((entry) => (
                        <div
                          key={entry.id}
                          className={`${themeColors.card} p-3 rounded-lg border ${themeColors.border}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {entry.action === "attribution" && (
                                <GiftIcon className="h-5 w-5 mr-2 text-green-600" />
                              )}
                              {entry.action === "utilisation" && (
                                <TicketIcon className="h-5 w-5 mr-2 text-blue-600" />
                              )}
                              {entry.action === "expiration" && (
                                <ClockIcon className="h-5 w-5 mr-2 text-red-600" />
                              )}
                              <span className="font-medium">
                                {entry.action === "attribution" &&
                                  "Attribution"}
                                {entry.action === "utilisation" &&
                                  "Utilisation"}
                                {entry.action === "expiration" && "Expiration"}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                              {entry.description}
                            </p>
                          )}
                          {entry.metadata &&
                            typeof entry.metadata === "object" && (
                              <div
                                className={`mt-2 text-xs text-gray-500 dark:text-gray-400 border-t pt-2 ${themeColors.border}`}
                              >
                                {Object.entries(entry.metadata).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex">
                                      <span className="font-medium mr-1">
                                        {key}:
                                      </span>
                                      <span>
                                        {typeof value === "object"
                                          ? JSON.stringify(value)
                                          : value}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Aucun historique disponible pour ce jeton.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${themeColors.border}`}>
              <button
                onClick={handleCloseHistoryModal}
                className={`${themeColors.buttonSecondary} w-full py-2 rounded-md`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de détails du ticket gagnant */}
      {ticketModalOpen && selectedTicket && (
        <TicketGagnantModal
          open={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
};

export default JetonsEsengo;
