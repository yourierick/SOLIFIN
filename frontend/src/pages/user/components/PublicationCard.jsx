import React, { useState } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import InteractionBar from "../../../components/InteractionBar";

/**
 * Composant pour afficher une publication (publicité, offre d'emploi ou opportunité d'affaires)
 */
export default function PublicationCard({
  publication,
  type,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetails,
  onStateChange,
  onBoost,
}) {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const menuRef = React.useRef(null);

  // Ferme le menu si on clique en dehors
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Déterminer les détails spécifiques au type de publication
  const getPublicationDetails = () => {
    switch (type) {
      case "advertisement":
        return {
          title: publication.titre,
          description: publication.description,
          categoryLabel: "Catégorie",
          categoryValue:
            publication.categorie === "produit" ? "Produit" : "Service",
          priceLabel: "Prix",
          priceValue: `${publication.prix_unitaire_vente} ${publication.devise}`,
          statusStyles: getStatusStyles(publication.statut),
          statusText: getStatusText(publication.statut),
          icon: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
                />
              </svg>
            </div>
          ),
        };
      case "jobOffer":
        return {
          title: publication.titre,
          description: publication.description,
          categoryLabel: "Type de contrat",
          categoryValue: publication.type_contrat,
          statusStyles: getStatusStyles(publication.statut),
          statusText: getStatusText(publication.statut),
          icon: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
          ),
        };
      case "businessOpportunity":
        return {
          title: publication.titre,
          description: publication.description,
          categoryLabel: "Secteur",
          categoryValue: publication.secteur,
          statusStyles: getStatusStyles(publication.statut),
          statusText: getStatusText(publication.statut),
          icon: (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                />
              </svg>
            </div>
          ),
        };
      default:
        return {
          title: "Publication",
          description: "",
          categoryLabel: "Type",
          categoryValue: "Non spécifié",
          priceLabel: "",
          priceValue: "",
          statusStyles: "bg-gray-100 text-gray-800",
          statusText: "Inconnu",
          icon: null,
        };
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "en_attente":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "approuvé":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "rejeté":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "expiré":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
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

  const getEtatStyles = (etat) => {
    switch (etat) {
      case "disponible":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "terminé":
        return "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
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

  const details = getPublicationDetails();

  // Formater la date de création
  const formattedDate = publication.created_at
    ? format(new Date(publication.created_at), "dd MMMM yyyy", { locale: fr })
    : "Date inconnue";

  const toggleActionMenu = () => {
    setShowActionMenu(!showActionMenu);
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(publication.id, type, newStatus);
    setShowActionMenu(false);
  };

  const handleEtatChange = (newEtat) => {
    onStateChange(publication.id, type, newEtat);
    setShowActionMenu(false);
  };

  const handleEdit = () => {
    onEdit(publication, type);
    setShowActionMenu(false);
  };

  const handleDelete = () => {
    // La confirmation est maintenant gérée dans MyPage.jsx avec un modal
    onDelete(publication.id, type);
    setShowActionMenu(false);
  };

  const handleViewDetails = () => {
    setShowActionMenu(false);
    onViewDetails(publication);
  };

  const handleBoost = () => {
    setShowActionMenu(false);
    onBoost(publication);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          {details.icon}
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleActionMenu}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
            </button>
            {showActionMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                <div className="py-1">
                  {publication.statut === "approuvé" &&
                    publication.etat === "disponible" && (
                      <button
                        onClick={() => handleEtatChange("terminé")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <TagIcon className="h-4 w-4 mr-2 text-blue-500" />
                        Terminer
                      </button>
                    )}
                  <button
                    onClick={handleViewDetails}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <EyeIcon className="h-4 w-4 mr-2 text-blue-500" />
                    Voir les détails
                  </button>
                  <button
                    onClick={handleBoost}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <RocketLaunchIcon className="h-4 w-4 mr-2 text-indigo-500" />
                    Boost
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 text-indigo-500" />
                    Modifier
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-600"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3">
          <h3 className="text-sm font-medium truncate text-gray-900 dark:text-white">
            {details.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-2 truncate">
            {details.description}
          </p>
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {details.categoryLabel}:
              </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {details.categoryValue}
              </span>
            </div>
            {details.priceLabel && (
              <div className="flex justify-between text-sm">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {details.priceLabel}:
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {details.priceValue}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <InteractionBar
          publicationType={type}
          publicationId={publication.id}
          onCommentClick={handleViewDetails}
          onShareClick={handleViewDetails}
          showCounts={false}
        />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between items-center">
        <div className="flex space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${details.statusStyles}`}
          >
            {details.statusText}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEtatStyles(
              publication.etat || "disponible"
            )}`}
          >
            <TagIcon className="mr-1 h-3 w-3" />
            {getEtatText(publication.etat || "disponible")}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Publié le {formattedDate}
        </span>
      </div>
    </div>
  );
}
