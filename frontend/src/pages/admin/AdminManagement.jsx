import React, { useState, useEffect } from "react";
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Administrateurs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez les comptes administrateurs.
        </p>
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
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden overflow-x-auto relative">
            <div className="min-w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed md:table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Nom
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Rôle
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {admin.picture ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={admin.picture}
                                  alt={admin.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {admin.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {admin.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                            {admin.role_relation?.nom || "Non défini"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              admin.status === "active"
                                ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                                : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
                            }`}
                          >
                            {admin.status === "active" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(admin)}
                              className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 rounded-md transition-colors"
                              title="Voir les détails"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEditAdmin(admin.id)}
                              className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-md transition-colors"
                              title="Modifier"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-md transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(admin.id)}
                              className={`p-1.5 ${
                                admin.status === "active"
                                  ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/40"
                                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/40"
                              } rounded-md transition-colors`}
                              title={
                                admin.status === "active"
                                  ? "Désactiver"
                                  : "Activer"
                              }
                            >
                              {admin.status === "active" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="h-5 w-5"
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
                                  className="h-5 w-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                      >
                        Aucun administrateur trouvé
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
      {viewDetails && selectedAdmin && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <ShieldCheckIcon className="h-6 w-6 mr-2 text-green-600 dark:text-green-500" />
                Détails de l'administrateur
              </h3>
              <button
                onClick={closeDetails}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
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

            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                {selectedAdmin.picture ? (
                  <img
                    className="h-24 w-24 rounded-full"
                    src={selectedAdmin.picture}
                    alt={selectedAdmin.name}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  ACCOUNT ID
                </h4>
                <p className="text-base">{selectedAdmin.account_id}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nom complet
                </h4>
                <p className="text-base">{selectedAdmin.name}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </h4>
                <p className="text-base">{selectedAdmin.email}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rôle
                </h4>
                <p className="text-base">
                  {selectedAdmin.role_relation?.nom || "Non défini"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Statut
                </h4>
                <p
                  className={`text-base ${
                    selectedAdmin.status === "active"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {selectedAdmin.status === "active" ? "Actif" : "Inactif"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Téléphone
                </h4>
                <p className="text-base">
                  {selectedAdmin.phone || "Non renseigné"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Adresse
                </h4>
                <p className="text-base">
                  {selectedAdmin.address || "Non renseignée"}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeDetails}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteAdmin}
        title="Supprimer l'administrateur"
        message="Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible et supprimera définitivement l'accès de cet utilisateur au système d'administration."
        confirmButtonText="Supprimer"
        cancelButtonText="Annuler"
        isDarkMode={isDarkMode}
        type="danger"
      />

      {/* Modal de confirmation de changement de statut */}
      <ConfirmationModal
        isOpen={showStatusConfirmation}
        onClose={() => setShowStatusConfirmation(false)}
        onConfirm={confirmToggleStatus}
        title="Modifier le statut"
        message={`Êtes-vous sûr de vouloir ${
          admins.find((a) => a.id === adminToToggle)?.status === "active"
            ? "désactiver"
            : "activer"
        } cet administrateur ? ${
          admins.find((a) => a.id === adminToToggle)?.status === "active"
            ? "L'administrateur ne pourra plus se connecter ni effectuer d'actions dans le système."
            : "L'administrateur pourra à nouveau se connecter et effectuer des actions selon ses permissions."
        }`}
        confirmButtonText="Confirmer"
        cancelButtonText="Annuler"
        isDarkMode={isDarkMode}
        type="warning"
      />
    </div>
  );
};

export default AdminManagement;
