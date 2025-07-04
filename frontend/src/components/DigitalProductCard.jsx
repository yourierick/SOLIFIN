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
} from "@heroicons/react/24/outline";
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
  // Fonction pour déterminer l'icône selon le type de produit
  const getProductIcon = () => {
    switch (product.type) {
      case "ebook":
        return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
      case "fichier_admin":
        return <ArchiveBoxIcon className="h-8 w-8 text-purple-500" />;
      default:
        return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
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
        return "bg-green-100 text-green-800";
      case "rejete":
        return "bg-red-100 text-red-800";
      case "en_attente":
      default:
        return "bg-yellow-100 text-yellow-800";
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
        return "bg-blue-100 text-blue-800";
      case "termine":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getProductIcon()}
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {product.titre}
              </h3>
              <p className="text-sm text-gray-500">
                {formatProductType(product.type)}
              </p>
            </div>
          </div>
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

        <div className="mt-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-3 flex justify-between items-center">
          <div className="text-lg font-bold text-gray-900">
            {product.prix} {product.devise}
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {formatDistanceToNow(new Date(product.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        </div>

        {product.raison_rejet && (
          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
            <strong>Raison du rejet:</strong> {product.raison_rejet}
          </div>
        )}

        <div className="mt-4 flex justify-between">
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
              
              <div className="group relative">
                <button
                  onClick={() => window.open(`/storage/${product.fichier}`, "_blank")}
                  className="p-2 rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  aria-label="Voir fichier"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Voir fichier
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <div className="group relative">
                <button
                  onClick={() => onEdit(product)}
                  disabled={product.statut === "approuve"}
                  className={`p-2 rounded-full shadow-sm text-white ${
                    product.statut === "approuve"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label="Modifier"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Modifier
                </div>
              </div>
              
              <div className="group relative">
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-2 rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                  aria-label="Supprimer"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Supprimer
                </div>
              </div>
              
              <div className="group relative">
                <button
                  onClick={() =>
                    onChangeStatus(
                      product.id,
                      product.etat === "disponible" ? "termine" : "disponible"
                    )
                  }
                  className={`p-2 rounded-full shadow-sm text-white ${
                    product.etat === "disponible"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label={product.etat === "disponible" ? "Terminer" : "Réactiver"}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {product.etat === "disponible" ? "Terminer" : "Réactiver"}
                </div>
              </div>
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
