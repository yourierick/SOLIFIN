import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import AdminCreation from "./components/AdminCreation";
import Notification from "../../components/Notification";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  UserIcon,
  ShieldCheckIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const AdminManagement = () => {
  const { authToken } = useAuth();
  const { isDarkMode } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [adminToToggle, setAdminToToggle] = useState(null);
  const [viewDetails, setViewDetails] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Récupérer la liste des administrateurs
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/admins`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setAdmins(response.data.admins || []);
      } else {
        Notification.error(
          response.data.message ||
            "Erreur lors de la récupération des administrateurs"
        );
      }
      setLoading(false);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des administrateurs:",
        error
      );

      // Gestion des erreurs de validation (422 ou 400)
      if (error.response?.status === 400 || error.response?.status === 422) {
        if (error.response.data.errors) {
          // Afficher chaque erreur de validation
          Object.values(error.response.data.errors).forEach((errorMessages) => {
            errorMessages.forEach((message) => Notification.error(message));
          });
        } else {
          Notification.error(
            error.response.data.message || "Erreur de validation"
          );
        }
      } else {
        Notification.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Erreur lors de la récupération des administrateurs"
        );
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Voir les détails d'un administrateur
  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
    setViewDetails(true);
  };

  // Fermer la modal de détails
  const closeDetails = () => {
    setViewDetails(false);
    setSelectedAdmin(null);
  };

  // Ouvrir le modal d'édition
  const handleEditAdmin = (adminId) => {
    setAdminToEdit(adminId);
    setShowEditModal(true);
  };

  // Fermer le modal d'édition
  const closeEditModal = () => {
    setShowEditModal(false);
    setAdminToEdit(null);
  };

  // Callback après édition réussie
  const handleAdminEdited = () => {
    fetchAdmins();
    closeEditModal();
  };

  // Supprimer un administrateur
  const handleDeleteAdmin = (id) => {
    setAdminToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAdmin = async () => {
    try {
      const response = await axios.delete(
        `/api/admin/admins/${adminToDelete}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        Notification.success(
          response.data.message || "Administrateur supprimé avec succès"
        );
        fetchAdmins();
      } else {
        Notification.error(
          response.data.message ||
            "Erreur lors de la suppression de l'administrateur"
        );
      }
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'administrateur", error);
      setShowDeleteConfirmation(false);

      // Gestion des erreurs de validation (422 ou 400)
      if (error.response?.status === 400 || error.response?.status === 422) {
        if (error.response.data.errors) {
          // Afficher chaque erreur de validation
          Object.values(error.response.data.errors).forEach((errorMessages) => {
            errorMessages.forEach((message) => Notification.error(message));
          });
        } else {
          Notification.error(
            error.response.data.message || "Erreur de validation"
          );
        }
      } else {
        Notification.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Une erreur est survenue lors de la suppression de l'administrateur"
        );
      }
    }
  };

  const handleToggleStatus = (id) => {
    setAdminToToggle(id);
    setShowStatusConfirmation(true);
  };

  const confirmToggleStatus = async () => {
    try {
      const response = await axios.post(
        `/api/admin/admins/${adminToToggle}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data.success) {
        Notification.success(
          response.data.message ||
            "Statut de l'administrateur modifié avec succès"
        );
        fetchAdmins();
      } else {
        // Gestion des erreurs avec message dans la réponse
        Notification.error(
          response.data.message || "Erreur lors de la modification du statut"
        );
      }
      setShowStatusConfirmation(false);
    } catch (error) {
      console.error("Erreur lors de la modification du statut", error);
      setShowStatusConfirmation(false);

      // Gestion spécifique pour le cas où on essaie de désactiver le dernier admin (422)
      if (error.response?.status === 422) {
        Notification.error(
          error.response.data.message ||
            "Impossible de désactiver le dernier administrateur"
        );
      }
      // Gestion des erreurs de validation
      else if (
        error.response?.status === 400 ||
        error.response?.status === 422
      ) {
        if (error.response.data.errors) {
          // Afficher chaque erreur de validation
          Object.values(error.response.data.errors).forEach((errorMessages) => {
            errorMessages.forEach((message) => Notification.error(message));
          });
        } else {
          Notification.error(
            error.response.data.message || "Erreur de validation"
          );
        }
      }
      // Autres erreurs
      else {
        Notification.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Une erreur est survenue lors de la modification du statut"
        );
      }
    }
  };

  return (
    <div className="p-4">
      {/* En-tête de la page */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
          <ShieldCheckIcon
            className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400"
          />
          Gestion des administrateurs
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gérez les comptes administrateurs, leurs permissions et leurs statuts.
        </p>
      </div>

      {/* Section des statistiques */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Statistique 1: Nombre total d'administrateurs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Administrateurs
                </p>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  {admins.length}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                <span>
                  {admins.filter((admin) => admin.status === "active").length} actifs
                </span>
              </div>
            </div>
          </div>

          {/* Statistique 2: Taux d'activité */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Taux d'activité
                </p>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  {admins.length > 0
                    ? Math.round(
                        (admins.filter((admin) => admin.status === "active").length / admins.length) * 100
                      )
                    : 0}%
                </h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-600 dark:bg-green-400 h-1.5 rounded-full"
                  style={{
                    width: `${
                      admins.length > 0
                        ? (admins.filter((admin) => admin.status === "active").length / admins.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Statistique 3: Administrateurs inactifs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Inactifs
                </p>
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                  {admins.filter((admin) => admin.status === "inactive").length}
                </h3>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-red-600 dark:text-red-400 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>Accès restreint</span>
              </div>
            </div>
          </div>

          {/* Statistique 4: Dernière mise à jour */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Dernière mise à jour
                </p>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </h3>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Données actualisées
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composant de création d'administrateurs */}
      <AdminCreation onAdminCreated={fetchAdmins} />

      {/* Modal d'édition d'administrateur */}
      {showEditModal && (
        <AdminCreation
          adminToEdit={adminToEdit}
          onAdminEdited={handleAdminEdited}
        />
      )}

      {/* Liste des administrateurs */}
      <div className="mt-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 animate__animated animate__fadeIn">
            <div className="relative">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-primary-400 opacity-75"></div>
              <div className="animate-spin relative rounded-full h-12 w-12 border-2 border-t-primary-600 border-r-primary-500 border-b-primary-400 border-l-transparent shadow-lg"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium animate__animated animate__fadeIn animate__delay-1s">
              Chargement des données...
            </p>
          </div>
        ) : (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                    >
                      Administrateur
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                    >
                      Rôle
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length > 0 ? (
                    admins.map((admin, index) => (
                      <tr
                        key={admin.id}
                        className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-all duration-300 ${
                          admin.status === "inactive" ? "opacity-70" : ""
                        } ${isDarkMode ? "dark:hover:animate-glow" : ""}`}
                        style={{
                          animationDelay: `${index * 80}ms`,
                          background:
                            admin.status === "inactive" && isDarkMode
                              ? "rgba(127, 29, 29, 0.1)"
                              : "",
                          backdropFilter: isDarkMode ? "blur(8px)" : "none",
                        }}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {admin.picture ? (
                              <img
                                src={admin.picture}
                                alt={admin.name}
                                className="flex-shrink-0 h-10 w-10 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:border-blue-400 dark:hover:border-blue-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    admin.name
                                  )}&background=3b82f6&color=fff`;
                                }}
                              />
                            ) : (
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center text-white text-sm font-medium border-2 border-blue-200 dark:border-blue-700 shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md">
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300 hover:text-blue-600 dark:hover:text-blue-400">
                                {admin.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                ID: {admin.account_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          <div
                            className="transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                            style={{
                              textShadow: isDarkMode
                                ? "0 0 1px rgba(219, 234, 254, 0.1)"
                                : "none",
                            }}
                          >
                            {admin.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap hidden lg:table-cell">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm"
                            style={{
                              boxShadow: isDarkMode
                                ? "0 0 8px rgba(37, 99, 235, 0.2)"
                                : "",
                            }}
                          >
                            {admin.role_relation?.nom || "Non défini"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ease-in-out ${
                              admin.status === "active"
                                ? "bg-green-100 dark:bg-green-900/70 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700 shadow-sm hover:shadow-md hover:bg-green-200 dark:hover:bg-green-800"
                                : "bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700 shadow-sm hover:shadow-md hover:bg-red-200 dark:hover:bg-red-800"
                            }`}
                            style={{
                              boxShadow: isDarkMode
                                ? admin.status === "active"
                                  ? "0 0 8px rgba(34, 197, 94, 0.2)"
                                  : "0 0 8px rgba(239, 68, 68, 0.2)"
                                : "",
                            }}
                          >
                            {admin.status === "active" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                          <div
                            className="flex justify-end items-center space-x-3 animate__animated animate__fadeIn"
                            style={{ animationDelay: `${index * 100 + 200}ms` }}
                          >
                            {/* Bouton Voir les détails */}
                            <button
                              onClick={() => handleViewDetails(admin)}
                              className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-md text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 dark:from-indigo-600 dark:to-indigo-800 dark:hover:from-indigo-700 dark:hover:to-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__zoomIn ${
                                isDarkMode ? "dark:animate-dark-float" : ""
                              }`}
                              title="Voir les détails"
                              style={{
                                animationDelay: `${index * 30}ms`,
                                boxShadow: isDarkMode
                                  ? "0 0 10px rgba(99, 102, 241, 0.4)"
                                  : "",
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>

                            {/* Bouton Modifier */}
                            <button
                              onClick={() => handleEditAdmin(admin.id)}
                              className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-md text-white bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 dark:from-blue-600 dark:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__zoomIn ${
                                isDarkMode ? "dark:animate-dark-float" : ""
                              }`}
                              title="Modifier"
                              style={{
                                animationDelay: `${index * 30 + 100}ms`,
                                boxShadow: isDarkMode
                                  ? "0 0 10px rgba(59, 130, 246, 0.4)"
                                  : "",
                              }}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>

                            {/* Bouton Activer/Désactiver */}
                            <button
                              onClick={() => handleToggleStatus(admin.id)}
                              className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__zoomIn ${
                                admin.status === "active"
                                  ? `bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 dark:from-red-600 dark:to-red-800 dark:hover:from-red-700 dark:hover:to-red-900 focus:ring-red-500 ${
                                      isDarkMode
                                        ? "dark:animate-dark-float"
                                        : ""
                                    }`
                                  : `bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 dark:from-green-600 dark:to-green-800 dark:hover:from-green-700 dark:hover:to-green-900 focus:ring-green-500 ${
                                      isDarkMode
                                        ? "dark:animate-dark-float"
                                        : ""
                                    }`
                              }`}
                              title={
                                admin.status === "active"
                                  ? "Désactiver"
                                  : "Activer"
                              }
                              style={{
                                animationDelay: `${index * 30 + 200}ms`,
                                boxShadow: isDarkMode
                                  ? `0 0 10px ${
                                      admin.status === "active"
                                        ? "rgba(239, 68, 68, 0.4)"
                                        : "rgba(34, 197, 94, 0.4)"
                                    }`
                                  : "",
                              }}
                            >
                              {admin.status === "active" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                  />
                                </svg>
                              )}
                            </button>

                            {/* Bouton Supprimer */}
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-md text-white bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 dark:from-red-600 dark:to-red-800 dark:hover:from-red-700 dark:hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg animate__animated animate__zoomIn"
                              title="Supprimer"
                              style={{
                                animationDelay: `${index * 30 + 300}ms`,
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-12 text-center animate__animated animate__fadeIn"
                      >
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 shadow-inner">
                            <UserIcon className="h-8 w-8 text-gray-400 dark:text-gray-300 animate__animated animate__pulse animate__infinite animate__slow" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Aucun administrateur trouvé.
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Utilisez le bouton "Ajouter un admin" pour créer un
                            nouvel administrateur.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {viewDetails && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col">
          {/* Overlay qui couvre toute la page */}
          <div
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeDetails}
          />
          
          {/* Contenu du modal centré */}
          <div className="relative flex items-center justify-center min-h-screen p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster relative transform transition-all duration-300 ease-in-out">
            {/* En-tête de la modale */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 mr-3 filter drop-shadow-md animate__animated animate__fadeIn" />
                  <span className="animate__animated animate__fadeIn">
                    Détails de l'administrateur
                  </span>
                </h3>
                <button
                  onClick={closeDetails}
                  className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full p-1"
                  aria-label="Fermer"
                >
                  <svg
                    className="h-6 w-6"
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
            </div>

            {/* Corps de la modale */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="flex justify-center mb-6">
                  {selectedAdmin.picture ? (
                    <img
                      className="h-28 w-28 rounded-full object-cover border-4 border-blue-200 dark:border-blue-700 shadow-lg transition-all duration-300 hover:scale-105 hover:border-blue-400 dark:hover:border-blue-500 animate__animated animate__fadeIn"
                      src={selectedAdmin.picture}
                      alt={selectedAdmin.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedAdmin.name
                        )}&background=3b82f6&color=fff&size=200`;
                      }}
                    />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-200 dark:border-blue-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl animate__animated animate__fadeIn dark:animate-dark-pulse">
                      {selectedAdmin.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md animate__animated animate__fadeIn dark:animate-glow"
                  style={{ animationDelay: "150ms" }}
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Email
                  </h4>
                  <p className="text-base font-medium text-blue-600 dark:text-blue-400 break-all">
                    {selectedAdmin.email}
                  </p>
                </div>

                {/* Rôle */}
                <div
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md animate__animated animate__fadeIn dark:animate-glow"
                  style={{ animationDelay: "200ms" }}
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Rôle
                  </h4>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-sm">
                    {selectedAdmin.role_relation?.nom || "Non défini"}
                  </div>
                </div>

                {/* Statut */}
                <div
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md animate__animated animate__fadeIn dark:animate-glow"
                  style={{ animationDelay: "250ms" }}
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Statut
                  </h4>
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border shadow-sm ${
                      selectedAdmin.status === "active"
                        ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 ${isDarkMode ? 'dark:animate-dark-pulse' : ''}"
                        : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800 ${isDarkMode ? 'dark:animate-dark-pulse' : ''}"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full mr-2 ${
                        selectedAdmin.status === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    {selectedAdmin.status === "active" ? "Actif" : "Inactif"}
                  </div>
                </div>

                {/* Téléphone */}
                <div
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md animate__animated animate__fadeIn dark:animate-glow"
                  style={{ animationDelay: "300ms" }}
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Téléphone
                  </h4>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {selectedAdmin.phone || (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                        Non renseigné
                      </span>
                    )}
                  </p>
                </div>

                {/* Adresse */}
                <div
                  className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md animate__animated animate__fadeIn dark:animate-glow"
                  style={{ animationDelay: "350ms" }}
                >
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Adresse
                  </h4>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {selectedAdmin.address || (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                        Non renseignée
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Pied de la modale */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={closeDetails}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Fermer
              </button>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmation && (
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={confirmDeleteAdmin}
          title="Confirmation de suppression"
          message={
            <div className="text-center animate__animated animate__fadeIn">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrashIcon className="h-14 w-14 text-red-600 dark:text-red-500 animate__animated animate__pulse animate__infinite" />
              </div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                Êtes-vous sûr de vouloir supprimer cet administrateur ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 inline-block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block mr-1 text-amber-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Cette action est irréversible et supprimera définitivement cet
                administrateur.
              </p>
            </div>
          }
          confirmText="Supprimer"
          cancelText="Annuler"
          isDarkMode={isDarkMode}
          type="danger"
          animationClass="animate__animated animate__fadeIn animate__faster"
          contentAnimationClass="animate__animated animate__zoomIn animate__faster"
          confirmButtonClass="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          cancelButtonClass="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        />
      )}

      {/* Modal de confirmation de changement de statut */}
      {showStatusConfirmation && (
        <ConfirmationModal
          isOpen={showStatusConfirmation}
          onClose={() => setShowStatusConfirmation(false)}
          onConfirm={confirmToggleStatus}
          title={
            admins.find((a) => a.id === adminToToggle)?.status === "active"
              ? "Désactiver l'administrateur"
              : "Activer l'administrateur"
          }
          animationClass="animate__animated animate__fadeIn animate__faster"
          contentAnimationClass="animate__animated animate__zoomIn animate__faster"
          message={
            <div className="text-center animate__animated animate__fadeIn">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                {admins.find((a) => a.id === adminToToggle)?.status ===
                "active" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 text-amber-600 dark:text-amber-500 animate__animated animate__pulse animate__infinite"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 text-green-600 dark:text-green-500 animate__animated animate__pulse animate__infinite"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Êtes-vous sûr de vouloir{" "}
                {admins.find((a) => a.id === adminToToggle)?.status ===
                "active" ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    désactiver
                  </span>
                ) : (
                  <span className="font-bold text-green-600 dark:text-green-400">
                    activer
                  </span>
                )}{" "}
                cet administrateur ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 inline-block">
                {admins.find((a) => a.id === adminToToggle)?.status ===
                "active" ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 inline-block mr-1 text-amber-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    L'administrateur{" "}
                    <strong>
                      {admins.find((a) => a.id === adminToToggle)?.name}
                    </strong>{" "}
                    ne pourra plus se connecter ni effectuer d'actions dans le
                    système.
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 inline-block mr-1 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    L'administrateur{" "}
                    <strong>
                      {admins.find((a) => a.id === adminToToggle)?.name}
                    </strong>{" "}
                    pourra à nouveau se connecter et effectuer des actions selon
                    ses permissions.
                  </>
                )}
              </p>
            </div>
          }
          confirmText="Confirmer"
          cancelText="Annuler"
          isDarkMode={isDarkMode}
          type={
            admins.find((a) => a.id === adminToToggle)?.status === "active"
              ? "warning"
              : "success"
          }
          confirmButtonClass={
            admins.find((a) => a.id === adminToToggle)?.status === "active"
              ? "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
          }
          cancelButtonClass="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
        />
      )}
    </div>
  );
};

export default AdminManagement;
