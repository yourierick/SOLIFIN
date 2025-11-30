import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import InteractionBar from "../../../components/InteractionBar";
import CommentSection from "../../../components/CommentSection";
import ShareModal from "../../../components/ShareModal";

// Composant de téléchargement de fichier
const FileDownloadLink = ({ url, filename, children }) => {
  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Créer un élément a temporaire
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || "fichier");
    link.setAttribute("target", "_blank");

    // Ajouter au DOM, cliquer, puis supprimer
    document.body.appendChild(link);
    link.click();

    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  return (
    <a
      href={url}
      className="text-blue-500 hover:underline cursor-pointer"
      onClick={handleDownload}
    >
      {children}
    </a>
  );
};

/**
 * Modal pour afficher les détails d'une publication
 */
export default function PublicationDetailsModal({
  isOpen = true,
  onClose,
  publication,
  type,
  onEdit,
}) {
  // Style pour la scrollbar personnalisée et l'effet de flou
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      
      @media (prefers-color-scheme: dark) {
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2d3748;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a5568;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!publication) return null;

  // Obtenir les détails formatés selon le type de publication
  const getFormattedDetails = () => {
    const formattedDate = publication.created_at
      ? format(new Date(publication.created_at), "dd MMMM yyyy", { locale: fr })
      : "Date inconnue";

    switch (type) {
      case "advertisement":
        return {
          title: "Publicité",
          subtitle: publication.titre,
          description: publication.description,
          date: formattedDate,
          details: {
            title: "Informations sur la publicité",
            fields: [
              {
                label: "Pays",
                value:
                  publication.pays === "publicité" ? "Publicité" : "Annonce",
              },
              {
                label: "Ville",
                value: publication.ville,
              },
              {
                label: "Type",
                value:
                  publication.type === "publicité" ? "Publicité" : "Annonce",
              },
              {
                label: "Catégorie",
                value:
                  publication.categorie === "produit" ? "Produit" : "Service",
              },
              {
                label: "Sous-catégorie",
                value:
                  publication.sous_categorie === "autre à préciser"
                    ? publication.autre_sous_categorie
                    : publication.sous_categorie,
              },
              {
                label: "Titre",
                value: publication.titre || "Non spécifié",
              },
              {
                label: "Quantité disponible",
                value: publication.quantite_disponible,
              },
              {
                label: "Contacts",
                value: publication.contacts || "Non spécifié",
              },
              { label: "Email", value: publication.email || "Non spécifié" },
              {
                label: "Adresse",
                value: publication.adresse || "Non spécifié",
              },
              {
                label: "Besoin de livreurs",
                value: publication.besoin_livreurs === "OUI" ? "Oui" : "Non",
              },
              {
                label: "Point de vente",
                value: publication.point_vente || "Non spécifié",
              },
              publication.prix_unitaire_vente
                ? {
                    label: "Prix unitaire de vente",
                    value: `${publication.prix_unitaire_vente} ${publication.devise}`,
                  }
                : { label: "Prix unitaire de vente", value: "Non défini" },
              publication.commission_livraison
                ? {
                    label: "Commission de livraison",
                    value: `${publication.commission_livraison} `,
                  }
                : { label: "Commission de livraison", value: "Non défini" },
              publication.prix_unitaire_livraison
                ? {
                    label: "Prix unitaire de livraison",
                    value: `${publication.prix_unitaire_livraison} ${publication.devise}`,
                  }
                : { label: "Prix unitaire de livraison", value: "Non défini" },
              publication.lien
                ? {
                    label: "Lien externe",
                    value: (
                      <a
                        href={publication.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Voir le lien
                      </a>
                    ),
                  }
                : { label: "Lien externe", value: "Aucun lien" },
              {
                label: "Durée d'affichage",
                value:
                  publication.duree_affichage + " jours" || "Non spécifiée",
              },
              {
                label: "Date d'expiration d'affichage",
                value: publication.expiry_date || "Non spécifiée",
              },
              { label: "Statut", value: getStatusText(publication.statut) },
              {
                label: "État",
                value: getEtatText(publication.etat || "disponible"),
              },
            ],
          },
        };
      case "jobOffer":
        return {
          title: "Offre d'emploi",
          subtitle: publication.titre,
          description: publication.description,
          date: formattedDate,
          details: {
            title: "Informations sur l'offre d'emploi",
            fields: [
              {
                label: "Pays",
                value: publication.pays || "Non spécifiée",
              },
              {
                label: "Ville",
                value: publication.ville || "Non spécifiée",
              },
              {
                label: "Secteur",
                value: publication.secteur || "Non spécifiée",
              },
              {
                label: "Entreprise",
                value: publication.entreprise || "Non spécifiée",
              },
              { label: "Titre", value: publication.titre || "Non spécifié" },
              {
                label: "Référence",
                value: publication.reference || "Non spécifiée",
              },
              {
                label: "Date limite",
                value: publication.date_limite
                  ? format(new Date(publication.date_limite), "dd MMMM yyyy", {
                      locale: fr,
                    })
                  : "Non spécifiée",
              },
              {
                label: "Email de contact",
                value: publication.email_contact || "Non spécifié",
              },
              {
                label: "Contacts",
                value: publication.contacts || "Non spécifiés",
              },
              {
                label: "Fichier associé",
                value: publication.offer_file_url ? (
                  <FileDownloadLink
                    url={publication.offer_file_url}
                    filename={`offre_emploi_${publication.id}.pdf`}
                  >
                    Télécharger le fichier
                  </FileDownloadLink>
                ) : (
                  "Aucun fichier"
                ),
              },
              {
                label: "Lien externe",
                value: publication.lien ? (
                  <a
                    href={publication.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Voir le lien
                  </a>
                ) : (
                  "Aucun lien"
                ),
              },
              { label: "Type de contrat", value: publication.type_contrat },
              {
                label: "Durée d'affichage",
                value: `${publication.duree_affichage}` + " jours",
              },
              { label: "Statut", value: getStatusText(publication.statut) },
              {
                label: "État",
                value: getEtatText(publication.etat || "disponible"),
              },
            ],
          },
        };
      case "businessOpportunity":
        return {
          title: "Opportunité d'affaires",
          subtitle: publication.titre,
          description: publication.description,
          date: formattedDate,
          details: {
            title: "Informations sur l'opportunité",
            fields: [
              { label: "Pays", value: publication.pays },
              { label: "Ville", value: publication.ville },
              { label: "Entreprise", value: publication.entreprise },
              { label: "Type", value: publication.type },
              { label: "Secteur", value: publication.secteur },
              { label: "Titre", value: publication.titre },
              {
                label: "Référence",
                value: publication.reference,
              },
              {
                label: "Durée d'affichage",
                value: `${publication.duree_affichage}` + " jours",
              },
              {
                label: "Contacts",
                value: publication.contacts || "Non spécifiés",
              },
              { label: "Email", value: publication.email || "Non spécifié" },
              {
                label: "Date limite",
                value: publication.date_limite
                  ? format(new Date(publication.date_limite), "dd MMMM yyyy", {
                      locale: fr,
                    })
                  : "Non spécifiée",
              },
              {
                label: "Fichier associé",
                value: publication.opportunity_file_url ? (
                  <FileDownloadLink
                    url={publication.opportunity_file_url}
                    filename={`offre_emploi_${publication.id}.pdf`}
                  >
                    Télécharger le fichier
                  </FileDownloadLink>
                ) : (
                  "Aucun fichier"
                ),
              },
              {
                label: "Lien externe",
                value: publication.lien ? (
                  <a
                    href={publication.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Voir le lien
                  </a>
                ) : (
                  "Aucun lien"
                ),
              },
              { label: "Statut", value: getStatusText(publication.statut) },
              {
                label: "État",
                value: getEtatText(publication.etat || "disponible"),
              },
            ],
          },
        };
      default:
        return {
          title: "Publication",
          subtitle: "",
          description: "",
          date: formattedDate,
          details: {
            title: "Détails",
            fields: [],
          },
        };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "en_attente":
        return "En attente";
      case "approuvé":
        return "Approuvé";
      case "rejeté":
        return "Rejeté";
      case "expiré":
        return "Expiré";
      default:
        return "Inconnu";
    }
  };

  const getEtatText = (etat) => {
    switch (etat) {
      case "disponible":
        return "Disponible";
      case "terminé":
        return "Terminé";
      default:
        return "Disponible";
    }
  };

  const details = getFormattedDetails();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay avec effet de flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-60"
            style={{
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              MozBackdropFilter: "blur(5px)",
              msBackdropFilter: "blur(5px)",
            }}
          />

          {/* Contenu du modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl w-full"
              >
                {/* En-tête amélioré avec gradient */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">
                    {details.title}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1 bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <div
                        className="custom-scrollbar max-h-[calc(100vh-250px)]"
                        style={{ overflowY: "auto", overflowX: "hidden" }}
                      >
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-5 rounded-xl mb-5 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {details.subtitle}
                          </h2>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>Publié le {details.date}</span>
                          </div>
                        </div>

                        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <svg
                              className="h-5 w-5 mr-2 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Description
                          </h4>
                          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                            {details.description ||
                              "Aucune description disponible"}
                          </div>
                        </div>

                        {publication.image_url && (
                          <div className="mt-6">
                            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2">
                              <svg
                                className="h-5 w-5 mr-2 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Image
                            </h4>
                            <div className="mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-xl overflow-hidden shadow-inner">
                              <img
                                src={publication.image_url}
                                alt={details.subtitle}
                                className="max-w-full h-auto rounded-lg max-h-72 object-contain mx-auto hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          </div>
                        )}

                        {publication.video_url && (
                          <div className="mt-6">
                            <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2">
                              <svg
                                className="h-5 w-5 mr-2 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Vidéo
                            </h4>
                            <div className="mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-xl overflow-hidden shadow-inner">
                              <video
                                src={publication.video_url}
                                controls
                                className="max-w-full h-auto rounded-lg max-h-72 mx-auto"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                          <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                            <svg
                              className="h-5 w-5 mr-2 text-blue-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            {details.details.title} - Détails
                          </h4>
                          <dl className="mt-3 divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            {details.details.fields.map((field, index) => (
                              <div
                                key={index}
                                className={`py-3 px-4 flex justify-between text-sm gap-4 ${
                                  index % 2 === 0
                                    ? "bg-gray-50 dark:bg-gray-700"
                                    : "bg-white dark:bg-gray-800"
                                }`}
                              >
                                <dt className="text-gray-600 dark:text-gray-400 font-medium">
                                  {field.label}
                                </dt>
                                <dd className="text-gray-900 dark:text-white font-semibold">
                                  {field.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre d'interactions */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-4 rounded-b-lg">
                  <InteractionBar
                    publicationType={type}
                    publicationId={publication.id}
                    className="justify-center gap-8"
                  />
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-gray-200 dark:border-gray-700">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="ml-3 inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-base font-medium text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm transition-all duration-200 transform hover:scale-105"
                    >
                      <svg
                        className="h-4 w-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Modifier
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-5 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  >
                    <svg
                      className="h-4 w-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
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
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
