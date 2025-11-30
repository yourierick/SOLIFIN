import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
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
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    address: "",
    role_id: "",
    pays: "",
    province: "",
    ville: "",
    sexe: "M",
  });

  const [roles, setRoles] = useState([]);
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get("/api/admin/get-roles", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setRoles(response.data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des rôles:", error);
      Notification.error("Erreur lors de la récupération des rôles");
    }
  };

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
        role_id: adminData.role_id || "",
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
      role_id: "",
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 font-bold">
                Gérez les comptes administrateurs
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm border-l-4 border-blue-500 dark:border-blue-400 pl-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-r">
              Créez, modifiez et gérez les accès administrateurs de la
              plateforme
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 animate__animated animate__fadeIn"
            aria-label="Ajouter un administrateur"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            <span>Ajouter un admin</span>
          </button>
        </div>
      )}
      {/* Modal pour créer ou éditer un administrateur */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col">
            {/* Overlay qui couvre toute la page */}
            <div
              className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            {/* Contenu du modal centré */}
            <div className="relative flex items-center justify-center min-h-screen p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster relative transform transition-all duration-300 ease-in-out">
                {/* En-tête de la modale */}
                <div
                  className={`${
                    adminToEdit
                      ? "bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900"
                      : "bg-gradient-to-r from-green-600 to-green-800 dark:from-green-700 dark:to-green-900"
                  } text-white px-6 py-4`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center">
                      {adminToEdit ? (
                        <>
                          <PencilSquareIcon className="h-6 w-6 mr-3 filter drop-shadow-md animate__animated animate__fadeIn" />
                          <span className="animate__animated animate__fadeIn">
                            Modifier un administrateur
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-6 w-6 mr-3 filter drop-shadow-md animate__animated animate__fadeIn" />
                          <span className="animate__animated animate__fadeIn">
                            Créer un administrateur
                          </span>
                        </>
                      )}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-white hover:text-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full p-1"
                      aria-label="Fermer"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
                >
                  <div className="grid grid-cols-1 gap-5">
                    {/* Informations principales - Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        INFORMATIONS PRINCIPALES
                      </h4>

                      <div className="space-y-4">
                        {/* Nom complet */}
                        <div
                          className="animate__animated animate__fadeIn"
                          style={{ animationDelay: "50ms" }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nom complet <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              placeholder="Entrez le nom complet"
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div
                          className="animate__animated animate__fadeIn"
                          style={{ animationDelay: "100ms" }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              placeholder="exemple@solifin.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Sécurité - Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        SÉCURITÉ
                      </h4>

                      <div className="space-y-4">
                        {/* Mot de passe */}
                        <div
                          className="animate__animated animate__fadeIn"
                          style={{ animationDelay: "150ms" }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mot de passe{" "}
                            {!adminToEdit && (
                              <span className="text-red-500">*</span>
                            )}
                            {adminToEdit && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                (laisser vide pour ne pas modifier)
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              required={!adminToEdit}
                              minLength={adminToEdit ? 0 : 8}
                              placeholder={
                                adminToEdit
                                  ? "••••••••"
                                  : "Minimum 8 caractères"
                              }
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Confirmer le mot de passe */}
                        <div
                          className="animate__animated animate__fadeIn"
                          style={{ animationDelay: "200ms" }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmer le mot de passe{" "}
                            {!adminToEdit && (
                              <span className="text-red-500">*</span>
                            )}
                            {adminToEdit && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                (laisser vide pour ne pas modifier)
                              </span>
                            )}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <input
                              type="password"
                              name="password_confirmation"
                              value={formData.password_confirmation}
                              onChange={handleChange}
                              required={!adminToEdit}
                              minLength={adminToEdit ? 0 : 8}
                              placeholder={
                                adminToEdit
                                  ? "••••••••"
                                  : "Confirmez le mot de passe"
                              }
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Informations de contact - Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-green-500 dark:text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        INFORMATIONS DE CONTACT
                      </h4>

                      <div className="space-y-4">
                        {/* Téléphone et Genre */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Téléphone */}
                          <div
                            className="animate__animated animate__fadeIn"
                            style={{ animationDelay: "250ms" }}
                          >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Téléphone
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                              </div>
                              <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+33 6 12 34 56 78"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>

                          {/* Genre */}
                          <div
                            className="animate__animated animate__fadeIn"
                            style={{ animationDelay: "300ms" }}
                          >
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Genre
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <select
                                name="sexe"
                                value={formData.sexe}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 appearance-none"
                              >
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Adresse */}
                        <div
                          className="animate__animated animate__fadeIn"
                          style={{ animationDelay: "350ms" }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Adresse
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Adresse complète"
                              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Localisation */}
                        <div
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 animate__animated animate__fadeIn"
                          style={{ animationDelay: "400ms" }}
                        >
                          {/* Pays */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Pays
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <input
                                type="text"
                                name="pays"
                                value={formData.pays}
                                onChange={handleChange}
                                placeholder="Pays"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>

                          {/* Province */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Province
                            </label>
                            <input
                              type="text"
                              name="province"
                              value={formData.province}
                              onChange={handleChange}
                              placeholder="Province/Région"
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>

                          {/* Ville */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ville
                            </label>
                            <input
                              type="text"
                              name="ville"
                              value={formData.ville}
                              onChange={handleChange}
                              placeholder="Ville"
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Rôle - Section */}
                    <div
                      className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700 mb-2 animate__animated animate__fadeIn"
                      style={{ animationDelay: "450ms" }}
                    >
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        PERMISSIONS
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rôle <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 appearance-none"
                          >
                            <option value="">Sélectionnez un rôle</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.nom}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                          Le rôle détermine les permissions et l'accès aux
                          fonctionnalités
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex justify-end mt-6 space-x-3 animate__animated animate__fadeIn"
                      style={{ animationDelay: "500ms" }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-medium flex items-center shadow-sm hover:shadow hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                        aria-label="Annuler"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2.5 text-white rounded-lg transition-all duration-300 font-medium flex items-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transform hover:scale-105 hover:-translate-y-1 ${
                          adminToEdit
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500"
                            : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500"
                        }`}
                        aria-label={adminToEdit ? "Mettre à jour" : "Créer"}
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                            <span className="animate__animated animate__fadeIn animate__infinite animate__slow">
                              Traitement en cours...
                            </span>
                          </>
                        ) : adminToEdit ? (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Mettre à jour
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-1.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5H2a1 1 0 010-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Créer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminCreation;
