import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  QrCodeIcon,
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  GiftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Notification from "../../../components/Notification";

/**
 * Composant pour la vérification des tickets gagnants
 * Permet de vérifier la validité d'un ticket et de le marquer comme consommé
 */
const TicketVerification = () => {
  const { isDarkMode } = useTheme();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("verification"); // "verification" ou "historique"
  const [historiqueTickets, setHistoriqueTickets] = useState([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [historiqueError, setHistoriqueError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  // Rechercher un ticket par son code de vérification
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Veuillez saisir le code de vérification du ticket");
      return;
    }

    setLoading(true);
    setError(null);
    setTicket(null);
    setVerificationSuccess(false);
    setVerificationError(null);

    try {
      // Appel à l'API pour rechercher le ticket par son code de vérification
      const response = await axios.get(`/api/admin/tickets/${code}`);
      if (response.data.success) {
        setTicket(response.data.data);
      } else {
        setError(response.data.message || "Ticket non trouvé");
      }
    } catch (err) {
      console.error("Erreur lors de la recherche du ticket:", err);
      setError(
        err.response?.data?.message || "Erreur lors de la recherche du ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  // Consommer directement le ticket sans demander à nouveau le code de vérification
  const handleConsumeTicket = async () => {
    if (!ticket || !ticket.id) {
      return;
    }

    setLoading(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      // Appel à l'API pour consommer directement le ticket
      const response = await axios.post(
        `/api/admin/tickets/${ticket.id}/consommer`
      );

      if (response.data.success) {
        setVerificationSuccess(true);
        setTicket({
          ...ticket,
          consomme: true,
          date_consommation: new Date().toISOString(),
        });
        Notification.success(
          "Ticket validé avec succès ! Le cadeau peut être remis."
        );
      } else {
        setVerificationError(
          response.data.message || "Erreur lors de la consommation du ticket"
        );
      }
    } catch (err) {
      console.error("Erreur lors de la consommation du ticket:", err);
      setVerificationError(
        err.response?.data?.message ||
          "Erreur lors de la consommation du ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  // Formater une date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd MMMM yyyy à HH:mm", {
      locale: fr,
    });
  };

  // Vérifier si un ticket est expiré
  const isExpired = (ticket) => {
    if (!ticket || !ticket.date_expiration) return false;
    return new Date(ticket.date_expiration) < new Date();
  };

  // Charger l'historique des tickets consommés
  const loadHistoriqueTickets = async (page = 1) => {
    setHistoriqueLoading(true);
    setHistoriqueError(null);

    try {
      // Construction des paramètres de requête avec les filtres
      const params = new URLSearchParams();
      params.append("page", page);

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (filterDateDebut) {
        params.append("date_debut", filterDateDebut);
      }

      if (filterDateFin) {
        params.append("date_fin", filterDateFin);
      }

      const response = await axios.get(
        `/api/admin/tickets/historique?${params.toString()}`
      );

      if (response.data.success) {
        setHistoriqueTickets(response.data.data.data);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.last_page);
      } else {
        setHistoriqueError(
          response.data.message || "Erreur lors du chargement de l'historique"
        );
      }
    } catch (err) {
      console.error(
        "Erreur lors du chargement de l'historique des tickets:",
        err
      );
      setHistoriqueError(
        err.response?.data?.message ||
          "Erreur lors du chargement de l'historique"
      );
    } finally {
      setHistoriqueLoading(false);
    }
  };

  // Charger l'historique quand on change d'onglet
  useEffect(() => {
    if (activeTab === "historique") {
      loadHistoriqueTickets();
    }
  }, [activeTab]);

  return (
    <div
      className={`${themeColors.bg} ${themeColors.text} p-6 rounded-lg shadow-md`}
    >
      <h2 className="text-2xl font-semibold flex items-center mb-4">
        <TicketIcon className="h-6 w-6 mr-2 text-primary-600" />
        Gestion des tickets gagnants
      </h2>

      {/* Onglets */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("verification")}
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "verification"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <div className="flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Vérification
          </div>
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === "historique"
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            Historique des cadeaux
          </div>
        </button>
      </div>

      {activeTab === "verification" && (
        <div>
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-grow">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Entrez le code de vérification du ticket"
                  className={`w-full px-4 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                />
              </div>
              <button
                type="submit"
                className={`${themeColors.button} px-4 py-2 rounded-md flex items-center`}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                )}
                Vérifier
              </button>
            </form>
            {error && (
              <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </div>

          {ticket && (
            <div className={`${themeColors.card} p-6 rounded-lg mb-6`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Détails du ticket</h3>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    ticket.consomme
                      ? "bg-green-100 text-green-800"
                      : isExpired(ticket)
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {ticket.consomme
                    ? "Consommé"
                    : isExpired(ticket)
                    ? "Expiré"
                    : "Valide"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Cadeau
                  </h4>
                  <div className="flex items-center">
                    <GiftIcon className="h-5 w-5 mr-2 text-primary-600" />
                    <span className="font-medium">
                      {ticket.cadeau?.nom || "N/A"}
                    </span>
                  </div>
                  {ticket.cadeau?.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {ticket.cadeau.description}
                    </p>
                  )}
                  {ticket.cadeau?.image_url && (
                    <div className="mt-2">
                      <img
                        src={ticket.cadeau.image_url}
                        alt={ticket.cadeau.nom}
                        className="h-24 w-24 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Utilisateur
                    </h4>
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
                      <span className="font-medium">
                        {ticket.user?.name || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Date d'expiration
                    </h4>
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                      <span className="font-medium">
                        {formatDate(ticket.date_expiration)}
                      </span>
                    </div>
                  </div>

                  {ticket.consomme && (
                    <div>
                      <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Date de consommation
                      </h4>
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                        <span className="font-medium">
                          {formatDate(ticket.date_consommation)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!ticket.consomme && !isExpired(ticket) && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-medium mb-3">
                    Valider le ticket
                  </h4>
                  <div className="flex justify-center">
                    <button
                      onClick={handleConsumeTicket}
                      className={`${themeColors.button} px-6 py-3 rounded-md flex items-center`}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <ShoppingBagIcon className="h-5 w-5 mr-2" />
                      )}
                      Marquer comme consommé et remettre le cadeau
                    </button>
                  </div>
                  {verificationError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                      <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                      {verificationError}
                    </div>
                  )}
                  {verificationSuccess && (
                    <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Ticket validé avec succès ! Le cadeau peut être remis.
                    </div>
                  )}
                </div>
              )}

              {ticket.consomme && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Ce ticket a déjà été consommé le{" "}
                  {formatDate(ticket.date_consommation)}.
                </div>
              )}

              {!ticket.consomme && isExpired(ticket) && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center">
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Ce ticket est expiré depuis le{" "}
                  {formatDate(ticket.date_expiration)}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "verification" && (
        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium">Comment ça marche ?</h4>
              <ol className="mt-2 ml-5 list-decimal">
                <li className="mb-1">
                  Demandez à l'utilisateur son code de vérification personnel
                  (reçu par notification).
                </li>
                <li className="mb-1">
                  Entrez le code de vérification dans le champ ci-dessus et
                  cliquez sur "Vérifier".
                </li>
                <li className="mb-1">
                  Vérifiez les détails du ticket (cadeau, utilisateur, date
                  d'expiration).
                </li>
                <li>
                  Si le ticket est valide, cliquez sur "Marquer comme consommé"
                  pour valider la remise du cadeau.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === "historique" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              Historique des cadeaux remis
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`${themeColors.buttonSecondary} p-2 rounded-md flex items-center`}
                title={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
              >
                <FunnelIcon className="h-5 w-5 mr-1" />
                {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => loadHistoriqueTickets(1)}
                className={`${themeColors.buttonSecondary} p-2 rounded-md flex items-center`}
                disabled={historiqueLoading}
                title="Rafraîchir"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Barre de recherche rapide toujours visible */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de cadeau, utilisateur..."
                className={`w-full px-4 py-2 pr-10 border ${themeColors.border} rounded-md ${themeColors.input}`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtres avancés (cachés par défaut) */}
          {showFilters && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtre date début */}
                <div>
                  <label
                    htmlFor="date_debut"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="date_debut"
                    value={filterDateDebut}
                    onChange={(e) => setFilterDateDebut(e.target.value)}
                    className={`w-full px-4 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                  />
                </div>

                {/* Filtre date fin */}
                <div>
                  <label
                    htmlFor="date_fin"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="date_fin"
                    value={filterDateFin}
                    onChange={(e) => setFilterDateFin(e.target.value)}
                    className={`w-full px-4 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    loadHistoriqueTickets(1);
                  }}
                  className={`${themeColors.button} px-4 py-2 rounded-md flex items-center`}
                  disabled={historiqueLoading}
                >
                  {historiqueLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                  )}
                  Appliquer les filtres
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDateDebut("");
                    setFilterDateFin("");
                    setCurrentPage(1);
                    loadHistoriqueTickets(1);
                  }}
                  className={`${themeColors.buttonSecondary} px-4 py-2 rounded-md ml-2`}
                  disabled={historiqueLoading}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

          {historiqueLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          )}

          {historiqueError && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center mb-4">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              {historiqueError}
            </div>
          )}

          {!historiqueLoading && historiqueTickets.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Aucun ticket consommé n'a été trouvé.</p>
              {(searchTerm || filterDateDebut || filterDateFin) && (
                <p className="mt-2 text-sm">
                  Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
                </p>
              )}
            </div>
          )}

          {!historiqueLoading && historiqueTickets.length > 0 && (
            <div>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center">
                <div>
                  <span className="font-medium">{historiqueTickets.length}</span> résultat(s) affiché(s)
                  {(searchTerm || filterDateDebut || filterDateFin) && (
                    <span> pour les filtres appliqués</span>
                  )}
                </div>
                {totalPages > 1 && (
                  <div>
                    Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Cadeau
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Utilisateur
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Date de consommation
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Valeur
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {historiqueTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {ticket.cadeau?.image_url && (
                            <img
                              src={ticket.cadeau.image_url}
                              alt={ticket.cadeau.nom}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {ticket.cadeau?.nom || "N/A"}
                            </div>
                            {ticket.code_verification && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Code: {ticket.code_verification}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {ticket.user?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.user?.email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(ticket.date_consommation)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ticket.cadeau?.valeur
                          ? `${ticket.cadeau.valeur} $`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <nav className="flex items-center">
                    <button
                      onClick={() => loadHistoriqueTickets(currentPage - 1)}
                      disabled={currentPage === 1 || historiqueLoading}
                      className={`${
                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                      } p-2 mx-1 rounded-md ${themeColors.buttonSecondary}`}
                    >
                      Précédent
                    </button>

                    <div className="mx-2 text-sm">
                      Page {currentPage} sur {totalPages}
                    </div>

                    <button
                      onClick={() => loadHistoriqueTickets(currentPage + 1)}
                      disabled={currentPage === totalPages || historiqueLoading}
                      className={`${
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } p-2 mx-1 rounded-md ${themeColors.buttonSecondary}`}
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketVerification;
