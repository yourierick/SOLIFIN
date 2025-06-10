import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Notification from "../../../components/Notification";
import axios from "axios";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const AdminCreation = ({
  onAdminCreated,
  adminToEdit = null,
  onAdminEdited = null,
}) => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    address: "",
    pays: "",
    province: "",
    ville: "",
    sexe: "M",
  });

  // Récupérer les détails d'un administrateur pour l'édition
  const fetchAdminDetails = async (adminId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const adminData = response.data.data;

      // Pré-remplir le formulaire avec les données existantes
      setFormData({
        name: adminData.name || "",
        email: adminData.email || "",
        password: "", // Mot de passe vide en édition
        password_confirmation: "", // Confirmation vide en édition
        phone: adminData.phone || "",
        address: adminData.address || "",
        pays: adminData.pays || "",
        province: adminData.province || "",
        ville: adminData.ville || "",
        sexe: adminData.sexe || "M",
      });

      setLoading(false);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de l'administrateur:",
        error
      );
      Notification.error(
        "Erreur lors de la récupération des détails de l'administrateur"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si un administrateur est fourni pour édition, charger ses détails
    if (adminToEdit) {
      fetchAdminDetails(adminToEdit);
      setShowModal(true); // Ouvrir automatiquement le modal en mode édition
    }
  }, [adminToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Ouvrir le modal
  const openModal = () => {
    // Réinitialiser le formulaire
    setFormData({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      phone: "",
      address: "",
      pays: "",
      province: "",
      ville: "",
      sexe: "M",
    });

    setShowModal(true);
  };

  // Soumettre le formulaire (création ou édition)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let response;
      let successMessage;

      if (adminToEdit) {
        // Pour l'édition, ne pas envoyer les mots de passe s'ils sont vides
        const editData = { ...formData };
        if (!editData.password) {
          delete editData.password;
          delete editData.password_confirmation;
        }

        // Éditer un administrateur existant
        response = await axios.patch(
          `/api/admin/admins/${adminToEdit}`,
          editData,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        successMessage = "Administrateur modifié avec succès";

        // Appeler la fonction de callback si elle existe
        if (typeof onAdminEdited === "function") {
          onAdminEdited();
        }
      } else {
        // Créer un nouvel administrateur
        response = await axios.post("/api/admin/admins/create", formData, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        successMessage = "Administrateur créé avec succès";

        // Appeler la fonction de callback si elle existe
        if (typeof onAdminCreated === "function") {
          onAdminCreated();
        }
      }

      Notification.success(response.data?.message || successMessage);
      setShowModal(false);
      setLoading(false);
    } catch (error) {
      console.error(
        `Erreur lors de ${
          adminToEdit ? "l'édition" : "la création"
        } de l\'administrateur:`,
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
            `Erreur lors de ${
              adminToEdit ? "l'édition" : "la création"
            } de l\'administrateur`
        );
      }

      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Bouton pour ouvrir le modal (uniquement en mode création) */}
      {!adminToEdit && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Création d'administrateurs</h3>
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Nouvel administrateur
          </button>
        </div>
      )}

      {/* Modal pour créer ou éditer un administrateur */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                {adminToEdit ? (
                  <>
                    <PencilSquareIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-500" />
                    Modifier un administrateur
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-6 w-6 mr-2 text-green-600 dark:text-green-500" />
                    Créer un administrateur
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mot de passe{" "}
                    {adminToEdit ? "(laisser vide pour ne pas modifier)" : "*"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!adminToEdit}
                    minLength={adminToEdit ? 0 : 8}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmer le mot de passe{" "}
                    {adminToEdit ? "(laisser vide pour ne pas modifier)" : "*"}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required={!adminToEdit}
                    minLength={adminToEdit ? 0 : 8}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Genre
                  </label>
                  <select
                    name="sexe"
                    value={formData.sexe}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pays
                    </label>
                    <input
                      type="text"
                      name="pays"
                      value={formData.pays}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 ${
                      adminToEdit
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white rounded flex items-center ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Traitement...
                      </>
                    ) : (
                      <>{adminToEdit ? "Mettre à jour" : "Créer"}</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreation;
