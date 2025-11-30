import React, { useState } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  XMarkIcon,
  GiftIcon,
  TicketIcon,
  CalendarIcon,
  ClockIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeSVG } from "qrcode.react";

/**
 * Modal pour afficher les détails d'un ticket gagnant
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Object} props.ticket - Le ticket à afficher
 */
const TicketGagnantModal = ({ open, onClose, ticket }) => {
  const { isDarkMode } = useTheme();
  const [codeVerificationVisible, setCodeVerificationVisible] = useState(false);

  // Nous utilisons directement les classes Tailwind conditionnelles basées sur isDarkMode

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

  // Copier le code du ticket dans le presse-papier
  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(message || "Copié dans le presse-papier !");
      },
      (err) => {
        console.error("Erreur lors de la copie:", err);
        toast.error("Erreur lors de la copie");
      }
    );
  };

  // Afficher/masquer le code de vérification
  const toggleCodeVerification = () => {
    setCodeVerificationVisible(!codeVerificationVisible);
  };

  if (!open || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec effet de flou */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Conteneur du modal */}
      <div
        className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden transition-all duration-300 transform`}
      >
        <div className={`flex justify-between items-center px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${isDarkMode ? 'from-gray-800 to-gray-700' : 'from-gray-50 to-white'}`}>
          <h3 className="text-lg font-bold flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full mr-3">
              <TicketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            Détails du ticket gagnant
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-150`}
            aria-label="Fermer"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            <div className="flex justify-center mb-5">
              <div
                className={`${
                  ticket.consomme === "consommé"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                    : isExpired(ticket)
                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                    : ticket.consomme === "programmé"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                } px-5 py-2 rounded-full text-sm font-medium shadow-sm flex items-center`}
              >
                {ticket.consomme === "consommé" ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : isExpired(ticket) ? (
                  <ExclamationCircleIcon className="h-4 w-4 mr-2" />
                ) : ticket.consomme === "programmé" ? (
                  <ClockIcon className="h-4 w-4 mr-2" />
                ) : (
                  <TicketIcon className="h-4 w-4 mr-2" />
                )}
                {ticket.consomme === "consommé"
                  ? "Ticket utilisé"
                  : isExpired(ticket)
                  ? "Ticket expiré"
                  : ticket.consomme === "programmé"
                  ? "Ticket programmé"
                  : ticket.consomme || "Ticket disponible"}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-center mb-5">
                {ticket.cadeau?.image_url ? (
                  <div className="relative">
                    <img
                      src={ticket.cadeau.image_url}
                      alt={ticket.cadeau.nom}
                      className="h-40 w-40 object-cover rounded-lg shadow-md border-2 border-white dark:border-gray-700"
                    />
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-1 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
                      <GiftIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                ) : (
                  <div className="h-40 w-40 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                    <GiftIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                {ticket.cadeau?.nom || "Cadeau"}
              </h4>

              {ticket.cadeau?.description && (
                <p className="text-center text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
                  {ticket.cadeau.description}
                </p>
              )}

              {ticket.cadeau?.valeur && (
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                    Valeur: {ticket.cadeau.valeur}$
                  </span>
                </div>
              )}
            </div>

            <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} p-5 rounded-lg mb-5 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm`}>
              <h5 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                Informations du ticket
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Date d'obtention</p>
                  <p className="font-medium flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-green-500" />
                    {formatDate(ticket.created_at)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Date d'expiration</p>
                  <p className="font-medium flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-amber-500" />
                    {formatDate(ticket.date_expiration)}
                  </p>
                </div>
              </div>
            </div>

            {!ticket.consomme && !isExpired(ticket) && (
              <div className={`mb-6 p-5 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Code de vérification
                  </h5>
                  <button
                    onClick={toggleCodeVerification}
                    className={`text-sm px-3 py-1.5 rounded-full flex items-center transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    {codeVerificationVisible ? (
                      <>
                        <EyeSlashIcon className="h-4 w-4 mr-1" />
                        Masquer
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Afficher
                      </>
                    )}
                  </button>
                </div>

                {codeVerificationVisible ? (
                  <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="font-mono font-bold text-lg flex-1 text-center">
                      {ticket.code_verification}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          ticket.code_verification,
                          "Code de vérification copié !"
                        )
                      }
                      className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-primary-600 dark:text-primary-400"
                      title="Copier le code de vérification"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center font-mono text-lg">
                    ••••••••••
                  </div>
                )}

                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Ne partagez ce code qu'au moment de récupérer votre cadeau.
                  </p>
                </div>
              </div>
            )}

            {!ticket.consomme && !isExpired(ticket) && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <QRCodeSVG 
                    value={ticket.code_verification} 
                    size={180} 
                    level="H"
                    includeMargin={true}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                  />
                </div>
              </div>
            )}

            {ticket.consomme === "consommé" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg shadow-sm border border-green-200 dark:border-green-900/30 flex items-start mb-4">
                <div className="bg-green-100 dark:bg-green-800/50 p-2 rounded-full mr-3 mt-0.5">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Ticket déjà utilisé</p>
                  <p className="text-sm mt-1">
                    Ce ticket a été utilisé le{" "}
                    <span className="font-medium">{formatDate(ticket.date_consommation)}</span>.
                  </p>
                </div>
              </div>
            )}

            {ticket.consomme === "expiré" && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg shadow-sm border border-red-200 dark:border-red-900/30 flex items-start mb-4">
                <div className="bg-red-100 dark:bg-red-800/50 p-2 rounded-full mr-3 mt-0.5">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">Ticket expiré</p>
                  <p className="text-sm mt-1">
                    Ce ticket a expiré le <span className="font-medium">{formatDate(ticket.date_expiration)}</span>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {!ticket.consomme && !isExpired(ticket) && (
              <div className="text-gray-600 dark:text-gray-300">
                <p className="mb-3 font-medium flex items-center">
                  <TicketIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Comment utiliser ce ticket :
                </p>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>
                    Présentez ce ticket (code ou QR code) à un gestionnaire ou
                    un distributeur SOLIFIN agréé.
                  </li>
                  <li>
                    Suivez ensuite les instructions de celui-ci pour retirer
                    votre cadeau !
                  </li>
                </ol>
              </div>
            )}
            
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
              <button
                onClick={onClose}
                className={`px-5 py-2.5 rounded-lg flex items-center justify-center font-medium shadow-sm transition-all duration-200 hover:shadow transform hover:-translate-y-0.5 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketGagnantModal;
