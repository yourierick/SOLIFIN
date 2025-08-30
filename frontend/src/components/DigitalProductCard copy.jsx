import React, { useState } from "react";
import {
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const DigitalProductCard = ({
  product,
  onEdit,
  onDelete,
  onChangeStatus,
  isAdmin = false,
  onApprove,
  onReject,
}) => {
  const { isDarkMode } = useTheme();

  // Image par défaut si aucune image n'est fournie
  const defaultImage =
    "https://placehold.co/300x200/e2e8f0/475569?text=Produit+Numérique";

  // Couleur de l'icône en fonction du thème
  const iconColor = isDarkMode ? "text-indigo-400" : "text-indigo-600";
  // Fonction pour déterminer l'icône selon le type de produit
  const getProductIcon = () => {
    switch (product.type) {
      case "ebook":
        return <DocumentTextIcon className={`h-8 w-8 ${iconColor}`} />;
      case "fichier_admin":
        return <ArchiveBoxIcon className={`h-8 w-8 ${iconColor}`} />;
      case "office_tools":
        return <ArchiveBoxIcon className={`h-8 w-8 ${iconColor}`} />;
      default:
        return (
          <DocumentTextIcon
            className={`h-8 w-8 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          />
        );
    }
  };

  // Fonction pour formater le type de produit
  const formatProductType = (type) => {
    switch (type) {
      case "ebook":
        return "E-book";
      case "fichier_admin":
        return "Fichier administratif";
      default:
        return type;
    }
  };

  // Fonction pour déterminer la couleur du badge de statut
  const getStatusBadgeClass = () => {
    switch (product.statut) {
      case "approuve":
        return isDarkMode
          ? "bg-green-900/30 text-green-300"
          : "bg-green-100 text-green-800";
      case "rejete":
        return isDarkMode
          ? "bg-red-900/30 text-red-300"
          : "bg-red-100 text-red-800";
      case "en_attente":
      default:
        return isDarkMode
          ? "bg-yellow-900/30 text-yellow-300"
          : "bg-yellow-100 text-yellow-800";
    }
  };

  // Fonction pour formater le statut
  const formatStatus = (status) => {
    switch (status) {
      case "approuve":
        return "Approuvé";
      case "rejete":
        return "Rejeté";
      case "en_attente":
        return "En attente";
      default:
        return status;
    }
  };

  // Fonction pour déterminer la couleur du badge d'état
  const getStateBadgeClass = () => {
    switch (product.etat) {
      case "disponible":
        return isDarkMode
          ? "bg-blue-900/30 text-blue-300"
          : "bg-blue-100 text-blue-800";
      case "termine":
        return isDarkMode
          ? "bg-gray-700/50 text-gray-300"
          : "bg-gray-100 text-gray-800";
      default:
        return isDarkMode
          ? "bg-blue-900/30 text-blue-300"
          : "bg-blue-100 text-blue-800";
    }
  };

  // Fonction pour formater l'état
  const formatState = (state) => {
    switch (state) {
      case "disponible":
        return "Disponible";
      case "termine":
        return "Terminé";
      default:
        return state;
    }
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } rounded-lg shadow-md overflow-hidden transition-colors duration-200`}
    >
      {/* Image du produit */}
      {(product.image_url || defaultImage) && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={product.image_url || defaultImage}
            alt={product.titre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImage;
            }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Titre et type */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start">
            <div className="mt-1">{getProductIcon()}</div>
            <div className="ml-3">
              <h3
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {product.titre}
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {formatProductType(product.type)}
              </p>
            </div>
          </div>

          {/* Badges de statut */}
          <div className="flex space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}
            >
              {formatStatus(product.statut)}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateBadgeClass()}`}
            >
              {formatState(product.etat)}
            </span>
          </div>
        </div>

        <div className="mt-2">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            } line-clamp-2 overflow-hidden`}
            title={product.description} // Ajoute un tooltip avec la description complète au survol
          >
            {product.description}
          </p>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {product.prix} {product.devise}
          </div>
          <div
            className={`text-xs ${
              isDarkMode ? "text-gray-300" : "text-gray-500"
            } flex items-center`}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            {formatDistanceToNow(new Date(product.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        </div>

        {product.raison_rejet && (
          <div
            className={`mt-2 p-2 ${
              isDarkMode
                ? "bg-red-900/30 text-red-300"
                : "bg-red-50 text-red-700"
            } rounded text-sm`}
          >
            <strong>Raison du rejet:</strong> {product.raison_rejet}
          </div>
        )}

        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
          {isAdmin ? (
            <div className="flex space-x-2">
              <div className="group relative">
                <button
                  onClick={() => onApprove(product.id)}
                  disabled={product.statut === "approuve"}
                  className={`p-2 rounded-full shadow-sm text-white ${
                    product.statut === "approuve"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  aria-label="Approuver"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Approuver
                </div>
              </div>

              <div className="group relative">
                <button
                  onClick={() => onReject(product.id)}
                  disabled={product.statut === "rejete"}
                  className={`p-2 rounded-full shadow-sm text-white ${
                    product.statut === "rejete"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  aria-label="Rejeter"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Rejeter
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-3">
              {product.fichier && (
                <div className="group relative">
                  <button
                    onClick={() =>
                      window.open(`/storage/${product.fichier}`, "_blank")
                    }
                    className={`p-2 rounded-full shadow-sm ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                    } transition-colors duration-200`}
                    aria-label="Voir fichier"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Voir fichier
                  </div>
                </div>
              )}

              {onEdit && (
                <div className="group relative">
                  <button
                    onClick={() => onEdit(product.id)}
                    className={`p-2 rounded-full shadow-sm ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    } transition-colors duration-200`}
                    aria-label="Modifier"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Modifier
                  </div>
                </div>
              )}

              {onDelete && (
                <div className="group relative">
                  <button
                    onClick={() => onDelete(product.id)}
                    className={`p-2 rounded-full shadow-sm ${
                      isDarkMode
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-100 hover:bg-red-200 text-red-600"
                    } transition-colors duration-200`}
                    aria-label="Supprimer"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Supprimer
                  </div>
                </div>
              )}

              {onChangeStatus && product.statut === "approuve" && (
                <div className="group relative">
                  <button
                    onClick={() => onChangeStatus(product.id)}
                    className={`p-2 rounded-full shadow-sm ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                    } transition-colors duration-200`}
                    aria-label="Changer le statut"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Changer le statut
                  </div>
                </div>
              )}
            </div>
          )}
          {product.nombre_ventes > 0 && (
            <div className="text-sm text-gray-600">
              {product.nombre_ventes} vente
              {product.nombre_ventes > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalProductCard;
