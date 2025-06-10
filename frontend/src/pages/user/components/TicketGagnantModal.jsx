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
      <div
        className="fixed inset-0 transition-opacity backdrop-blur-sm bg-black bg-opacity-30"
        onClick={onClose}
      ></div>

      <div
        className={`${themeColors.bg} rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 m-4 overflow-hidden`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3
            className={`text-lg font-medium ${themeColors.text} flex items-center`}
          >
            <TicketIcon className="h-5 w-5 mr-2 text-primary-600" />
            Détails du ticket gagnant
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <div className="flex justify-center mb-4">
              <div
                className={`${
                  ticket.consomme
                    ? "bg-green-100 text-green-800"
                    : isExpired(ticket)
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                } px-4 py-2 rounded-full text-sm font-medium`}
              >
                {ticket.consomme
                  ? "Ticket utilisé"
                  : isExpired(ticket)
                  ? "Ticket expiré"
                  : "Ticket valide"}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {ticket.cadeau?.image_url ? (
                  <img
                    src={ticket.cadeau.image_url}
                    alt={ticket.cadeau.nom}
                    className="h-32 w-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="h-32 w-32 bg-gray-200 rounded-md flex items-center justify-center">
                    <GiftIcon className="h-16 w-16 text-gray-500" />
                  </div>
                )}
              </div>

              <h4
                className={`text-xl font-semibold text-center ${themeColors.text} mb-2`}
              >
                {ticket.cadeau?.nom || "Cadeau"}
              </h4>

              {ticket.cadeau?.description && (
                <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                  {ticket.cadeau.description}
                </p>
              )}

              {ticket.cadeau?.valeur && (
                <p className="text-center text-primary-600 font-medium mb-4">
                  Valeur: {ticket.cadeau.valeur}$
                </p>
              )}
            </div>

            <div className={`${themeColors.card} p-4 rounded-lg mb-4`}>
              <div className="flex items-center mb-3">
                <CalendarIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="font-medium">Date d'obtention:</span>
                <span className="ml-2">{formatDate(ticket.created_at)}</span>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
                <span className="font-medium">Date d'expiration:</span>
                <span className="ml-2">
                  {formatDate(ticket.date_expiration)}
                </span>
              </div>
            </div>

            {!ticket.consomme && !isExpired(ticket) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Code de vérification:</span>
                  <button
                    onClick={toggleCodeVerification}
                    className={`text-sm ${themeColors.buttonSecondary} px-2 py-1 rounded`}
                  >
                    {codeVerificationVisible ? "Masquer" : "Afficher"}
                  </button>
                </div>

                {codeVerificationVisible ? (
                  <div className="flex items-center">
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                      {ticket.code_verification}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          ticket.code_verification,
                          "Code de vérification copié !"
                        )
                      }
                      className="ml-2 text-primary-600 hover:text-primary-700"
                      title="Copier le code de vérification"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                    ••••••••••
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <ExclamationCircleIcon className="h-4 w-4 inline mr-1 text-yellow-500" />
                  Ne partagez ce code qu'au moment de récupérer votre cadeau.
                </p>
              </div>
            )}

            {!ticket.consomme && !isExpired(ticket) && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG value={ticket.code_verification} size={150} />
                </div>
              </div>
            )}

            {ticket.consomme && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Ticket déjà utilisé</p>
                  <p className="text-sm">
                    Ce ticket a été utilisé le{" "}
                    {formatDate(ticket.date_consommation)}.
                  </p>
                </div>
              </div>
            )}

            {!ticket.consomme && isExpired(ticket) && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Ticket expiré</p>
                  <p className="text-sm">
                    Ce ticket a expiré le {formatDate(ticket.date_expiration)}.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
            {!ticket.consomme && !isExpired(ticket) && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="mb-2 font-medium">Comment utiliser ce ticket :</p>
                <ol className="list-decimal ml-5">
                  <li className="mb-1">
                    Présentez ce ticket (code ou QR code) à un administrateur.
                  </li>
                  <li className="mb-1">
                    Lorsqu'on vous le demande, fournissez votre code de
                    vérification personnel.
                  </li>
                  <li>Recevez votre cadeau !</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketGagnantModal;
