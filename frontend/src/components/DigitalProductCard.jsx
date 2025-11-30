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
  SparklesIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const DigitalProductCard = ({ product, onEdit, onDelete, onChangeStatus }) => {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-gray-700"
          : "bg-gradient-to-br from-white to-gray-50 text-gray-900 border border-gray-200"
      }`}
    >
      {/* Badge décoratif */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`p-2 rounded-full shadow-lg ${
            isDarkMode
              ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border border-blue-500/30"
              : "bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm border border-blue-300"
          }`}
        >
          {getProductIcon()}
        </div>
      </div>

      {/* Image du produit avec overlay */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
        <img
          src={product.image_url || defaultImage}
          alt={product.titre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
        />

        {/* Badges de statut en overlay */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${getStatusBadgeClass()}`}
          >
            {formatStatus(product.statut)}
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${getStateBadgeClass()}`}
          >
            {formatState(product.etat)}
          </motion.div>
        </div>
      </div>

      <div className="p-6">
        {/* En-tête avec titre et type */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className={`text-xl font-bold mb-2 truncate ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {product.titre}
              </h3>
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4 text-purple-500" />
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                >
                  {formatProductType(product.type)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p
            className={`text-sm leading-relaxed mb-4 line-clamp-3 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
            title={product.description}
          >
            {product.description}
          </p>
        </div>

        {/* Prix et informations */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
            <div
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {product.prix} {product.devise}
            </div>
          </div>
          <div
            className={`text-xs flex items-center ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <ClockIcon className="h-4 w-4 mr-1" />
            {formatDistanceToNow(new Date(product.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        </div>

        {/* Message de rejet */}
        <AnimatePresence>
          {product.raison_rejet && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 p-3 rounded-lg text-sm ${
                isDarkMode
                  ? "bg-red-900/30 text-red-300 border border-red-800/50"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Raison du rejet:</strong>
                  <p className="mt-1">{product.raison_rejet}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions et ventes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(product.id)}
                className={`p-2.5 rounded-xl shadow-md transition-all duration-200 ${
                  isDarkMode
                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-600 border border-blue-300"
                }`}
                title="Modifier"
              >
                <PencilIcon className="h-5 w-5" />
              </motion.button>
            )}

            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(product.id)}
                className={`p-2.5 rounded-xl shadow-md transition-all duration-200 ${
                  isDarkMode
                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30"
                    : "bg-red-100 hover:bg-red-200 text-red-600 border border-red-300"
                }`}
                title="Supprimer"
              >
                <TrashIcon className="h-5 w-5" />
              </motion.button>
            )}

            {onChangeStatus && product.statut === "approuve" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChangeStatus(product.id)}
                className={`p-2.5 rounded-xl shadow-md transition-all duration-200 ${
                  isDarkMode
                    ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 border border-purple-500/30"
                    : "bg-purple-100 hover:bg-purple-200 text-purple-600 border border-purple-300"
                }`}
                title="Changer le statut"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </motion.button>
            )}
          </div>

          {/* Ventes */}
          {product.nombre_ventes > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-1 text-sm font-medium"
            >
              <ShoppingBagIcon
                className={`h-4 w-4 ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}
              />
              <span
                className={isDarkMode ? "text-green-400" : "text-green-600"}
              >
                {product.nombre_ventes} vente
                {product.nombre_ventes > 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DigitalProductCard;
