import React, { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  RocketLaunchIcon,
  CalendarIcon,
  MapPinIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
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
  // Détection mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            <div
              className={`flex items-center justify-center ${
                isMobile ? "w-8 h-8" : "w-12 h-12"
              } ${
                isMobile ? "rounded-lg" : "rounded-xl"
              } bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25`}
            >
              <SparklesIcon className={`${isMobile ? "w-4 h-4" : "w-7 h-7"}`} />
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
            <div
              className={`flex items-center justify-center ${
                isMobile ? "w-8 h-8" : "w-12 h-12"
              } ${
                isMobile ? "rounded-lg" : "rounded-xl"
              } bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25`}
            >
              <BriefcaseIcon
                className={`${isMobile ? "w-4 h-4" : "w-7 h-7"}`}
              />
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
            <div
              className={`flex items-center justify-center ${
                isMobile ? "w-8 h-8" : "w-12 h-12"
              } ${
                isMobile ? "rounded-lg" : "rounded-xl"
              } bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25`}
            >
              <BuildingOfficeIcon
                className={`${isMobile ? "w-4 h-4" : "w-7 h-7"}`}
              />
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
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700/50";
      case "approuvé":
        return "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700/50";
      case "rejeté":
        return "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700/50";
      case "expiré":
        return "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700/50 dark:to-gray-600/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700/50 dark:to-gray-600/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50";
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
        return "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50";
      case "terminé":
        return "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700/50 dark:to-gray-600/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600/50";
      default:
        return "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50";
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
    onStateChange(newEtat);
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{
        y: isMobile ? -4 : -8,
        boxShadow: isMobile
          ? "0 10px 20px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)"
          : "0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)",
        scale: isMobile ? 1.01 : 1.02,
      }}
      className={`group bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 ${
        isMobile ? "rounded-lg" : "rounded-2xl"
      } shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-500 flex flex-col h-full relative`}
    >
      {/* Fond décoratif subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 pointer-events-none" />

      <div className={`p-4 sm:p-6 flex-grow relative z-10`}>
        {/* En-tête avec icône et badges alignés */}
        <div
          className={`flex items-start justify-between ${
            isMobile ? "mb-3" : "mb-4"
          }`}
        >
          <motion.div
            whileHover={{
              scale: 1.1,
              rotate: [0, -5, 5, -5, 0],
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
            }}
            transition={{ duration: 0.6, type: "spring" }}
            className="transform"
          >
            {details.icon}
          </motion.div>

          {/* Badges alignés horizontalement */}
          <div
            className={`flex flex-col items-end ${
              isMobile ? "space-y-1" : "space-y-2"
            }`}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center ${
                isMobile ? "px-2 py-0.5" : "px-3 py-1"
              } rounded-full ${
                isMobile ? "text-[10px]" : "text-xs"
              } font-semibold ${details.statusStyles} shadow-sm`}
            >
              {details.statusText === "En attente" && (
                <ClockIcon className={`w-2 h-2 sm:w-3 sm:h-3 mr-1`} />
              )}
              {details.statusText === "Approuvé" && (
                <CheckCircleIcon className={`w-2 h-2 sm:w-3 sm:h-3 mr-1`} />
              )}
              {details.statusText === "Rejeté" && (
                <XCircleIcon className={`w-2 h-2 sm:w-3 sm:h-3 mr-1`} />
              )}
              {details.statusText === "Expiré" && (
                <ClockIcon className={`w-2 h-2 sm:w-3 sm:h-3 mr-1`} />
              )}
              {details.statusText}
            </motion.span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center ${
                isMobile ? "px-2 py-0.5" : "px-3 py-1"
              } rounded-full ${
                isMobile ? "text-[10px]" : "text-xs"
              } font-semibold ${getEtatStyles(
                publication.etat || "disponible"
              )} shadow-sm`}
            >
              <TagIcon className="w-3 h-3 mr-1" />
              {getEtatText(publication.etat || "disponible")}
            </motion.span>

            {/* Bouton options sous les badges */}
            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleActionMenu}
                className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${
                  isMobile ? "rounded-md p-1.5" : "rounded-lg p-2"
                } hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm hover:shadow-md`}
                title="Options"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
              </motion.button>

              <AnimatePresence>
                {showActionMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 ${
                      isMobile ? "w-44" : "w-52"
                    } bg-white dark:bg-gray-800 ${
                      isMobile ? "rounded-lg" : "rounded-xl"
                    } shadow-2xl z-50 border border-gray-200 dark:border-gray-600/50 overflow-hidden backdrop-blur-sm`}
                  >
                    <div className="py-2">
                      {publication.statut === "approuvé" &&
                        publication.etat === "disponible" && (
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => handleEtatChange("terminé")}
                            className={`flex items-center w-full ${
                              isMobile ? "px-3 py-2" : "px-4 py-3"
                            } ${
                              isMobile ? "text-xs" : "text-sm"
                            } text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-200`}
                          >
                            <TagIcon className="h-4 w-4 mr-3 text-blue-500" />
                            <span className="font-medium">Terminer</span>
                          </motion.button>
                        )}
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={handleViewDetails}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all duration-200"
                      >
                        <EyeIcon className="h-4 w-4 mr-3 text-blue-500" />
                        <span className="font-medium">Voir les détails</span>
                      </motion.button>
                      {(publication.statut === "approuvé" ||
                        publication.statut === "expiré") && (
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={handleBoost}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200"
                        >
                          <RocketLaunchIcon className="h-4 w-4 mr-3 text-indigo-500" />
                          <span className="font-medium">Boost</span>
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={handleEdit}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-3 text-indigo-500" />
                        <span className="font-medium">Modifier</span>
                      </motion.button>
                      <div className="border-t border-gray-200 dark:border-gray-600/50 my-2"></div>
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={handleDelete}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:text-red-400 dark:hover:from-red-900/30 dark:hover:to-red-800/30 transition-all duration-200"
                      >
                        <TrashIcon className="h-4 w-4 mr-3" />
                        <span className="font-medium">Supprimer</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Contenu principal restructuré */}
        <div className={`space-y-${isMobile ? "3" : "4"}`}>
          {/* Titre et localisation sur la même ligne */}
          <div className="flex items-start justify-between">
            <motion.h3
              whileHover={{ x: 2 }}
              onClick={handleViewDetails}
              className={`${
                isMobile ? "text-sm" : "text-lg"
              } font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 cursor-pointer leading-tight flex-1 ${
                isMobile ? "mr-2" : "mr-3"
              }`}
            >
              {details.title}
            </motion.h3>

            {/* Localisation et date en badge */}
            <div
              className={`flex flex-col items-end ${
                isMobile ? "text-[10px]" : "text-xs"
              } text-gray-500 dark:text-gray-400 ${
                isMobile ? "space-y-0.5" : "space-y-1"
              }`}
            >
              <div className="flex items-center">
                <MapPinIcon
                  className={`${
                    isMobile ? "h-2 w-2" : "h-3 w-3"
                  } mr-1 text-gray-400`}
                />
                <span className="font-medium">
                  {publication.ville || publication.pays || "Non spécifié"}
                </span>
              </div>
              <div className="flex items-center">
                <CalendarIcon
                  className={`${
                    isMobile ? "h-2 w-2" : "h-3 w-3"
                  } mr-1 text-gray-400`}
                />
                <span className="font-medium">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Description avec fond subtil */}
          <motion.div
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1 }}
            className={`bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-700/20 dark:to-blue-900/10 ${
              isMobile ? "p-2" : "p-3"
            } ${
              isMobile ? "rounded-md" : "rounded-lg"
            } border border-gray-100/50 dark:border-gray-600/20`}
          >
            <p
              className={`${
                isMobile ? "text-xs" : "text-sm"
              } text-gray-700 dark:text-gray-300 line-clamp-${
                isMobile ? "2" : "3"
              } leading-relaxed`}
            >
              {details.description || "Aucune description disponible"}
            </p>
          </motion.div>

          {/* Informations supplémentaires en grille responsive */}
          <div
            className={`grid ${
              isMobile ? "grid-cols-1 gap-2" : "grid-cols-2 gap-4"
            } text-sm`}
          >
            {details.categoryValue && (
              <div
                className={`flex items-center ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-600 dark:text-gray-400 ${
                  isMobile ? "p-2" : "p-3"
                } bg-gray-50/50 dark:bg-gray-700/20 ${
                  isMobile ? "rounded-md" : "rounded-lg"
                } border border-gray-100/30 dark:border-gray-600/20`}
              >
                <TagIcon
                  className={`${
                    isMobile ? "h-3 w-3" : "h-4 w-4"
                  } mr-2 text-primary-500 dark:text-primary-400`}
                />
                <div>
                  <p
                    className={`${
                      isMobile ? "text-[10px]" : "text-xs"
                    } text-gray-500 dark:text-gray-500 mb-0.5`}
                  >
                    {details.categoryLabel}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">
                    {details.categoryValue}
                  </p>
                </div>
              </div>
            )}

            {details.priceValue && (
              <div
                className={`flex items-center ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-600 dark:text-gray-400 ${
                  isMobile ? "p-2" : "p-3"
                } bg-gray-50/50 dark:bg-gray-700/20 ${
                  isMobile ? "rounded-md" : "rounded-lg"
                } border border-gray-100/30 dark:border-gray-600/20`}
              >
                <CurrencyDollarIcon
                  className={`${
                    isMobile ? "h-3 w-3" : "h-4 w-4"
                  } mr-2 text-green-500 dark:text-green-400`}
                />
                <div>
                  <p
                    className={`${
                      isMobile ? "text-[10px]" : "text-xs"
                    } text-gray-500 dark:text-gray-500 mb-0.5`}
                  >
                    {details.priceLabel}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-200">
                    {details.priceValue}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`border-t border-gray-100 dark:border-gray-700/50 ${
          isMobile ? "px-3 py-2" : "px-4 py-3"
        } bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-900/20`}
      >
        <InteractionBar
          publicationType={type}
          publicationId={publication.id}
          onCommentClick={handleViewDetails}
          compact={isMobile}
        />
      </div>
    </motion.div>
  );
}
