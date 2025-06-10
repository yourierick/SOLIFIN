import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import Notification from "../../../components/Notification";
import {
  XMarkIcon,
  PhotoIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Modal pour ajouter ou modifier un cadeau
 * @param {Object} props - Les propriétés du composant
 * @param {boolean} props.open - Si le modal est ouvert
 * @param {Function} props.onClose - Fonction appelée à la fermeture du modal
 * @param {Function} props.onSave - Fonction appelée pour sauvegarder le cadeau
 * @param {Object} props.cadeau - Le cadeau à modifier (null pour un nouveau cadeau)
 */
const CadeauFormModal = ({ open, onClose, onSave, cadeau }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    pack_id: "",
    nom: "",
    description: "",
    valeur: 0,
    probabilite: 0,
    stock: 0,
    actif: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Couleurs pour le thème
  const themeColors = {
    bg: isDarkMode ? "bg-[#1f2937]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    card: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    input: isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
    overlay: "",
  };

  // Récupérer les packs actifs
  useEffect(() => {
    if (open) {
      fetchActivePacks();
    }
  }, [open]);

  // Fonction pour récupérer les packs actifs
  const fetchActivePacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/formations/packs");
      if (response.data.success) {
        setPacks(response.data.data || []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des packs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialiser le formulaire avec les données du cadeau si disponible
  useEffect(() => {
    if (cadeau) {
      setFormData({
        id: cadeau.id,
        pack_id: cadeau.pack_id || "",
        nom: cadeau.nom || "",
        description: cadeau.description || "",
        image_url: cadeau.image_url || "",
        valeur: cadeau.valeur || 0,
        probabilite: cadeau.probabilite || 0,
        stock: cadeau.stock || 0,
        actif: cadeau.actif !== undefined ? cadeau.actif : true,
      });
      setImagePreview(cadeau.image_url || "");
    } else {
      resetForm();
    }
  }, [cadeau, open]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      pack_id: "",
      nom: "",
      description: "",
      valeur: 0,
      probabilite: 0,
      stock: 0,
      actif: true,
    });
    setImageFile(null);
    setImagePreview("");
    setErrors({});
  };

  // Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      if (files && files.length > 0) {
        const file = files[0];
        setImageFile(file);

        // Créer un URL pour la prévisualisation
        const previewURL = URL.createObjectURL(file);
        setImagePreview(previewURL);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      // Créer un objet FormData pour envoyer les données multipart/form-data
      const formDataToSend = new FormData();

      // Ajouter tous les champs du formulaire
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      // Ajouter l'image si elle existe
      if (imageFile) {
        formDataToSend.append("image_url", imageFile);
      }

      // Ajouter l'ID si on est en mode édition
      if (formData.id) {
        formDataToSend.append("id", formData.id);
      }

      let response;
      if (formData.id) {
        // Mise à jour
        response = await axios.post(
          `/api/admin/cadeaux/${formData.id}?_method=PUT`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (response.data.success) {
          Notification.success(
            "Les modifications du cadeau ont été enregistré avec succès"
          );
          onClose();
        }
      } else {
        // Création
        response = await axios.post("/api/admin/cadeaux", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          Notification.success("Cadeau enregistré avec succès");
          onClose();
        }
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Erreur lors de la soumission du formulaire", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.pack_id) {
      newErrors.pack_id = "Le pack est requis";
    }

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }

    if (formData.valeur <= 0) {
      newErrors.valeur = "La valeur doit être supérieure à 0";
    }

    if (formData.probabilite <= 0 || formData.probabilite > 100) {
      newErrors.probabilite = "La probabilité doit être entre 1 et 100";
    }

    if (formData.stock < 0) {
      newErrors.stock = "Le stock ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Valider avant de soumettre
  const validateBeforeSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleSubmit(e);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity backdrop-blur-sm bg-white/30 dark:bg-black/30"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom ${themeColors.bg} rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
        >
          {/* En-tête fixe */}
          <div
            className={`flex justify-between items-center px-6 py-4 border-b border-gray-200 ${themeColors.bg}`}
          >
            <h3 className={`text-lg font-medium ${themeColors.text}`}>
              {cadeau ? "Modifier un cadeau" : "Ajouter un cadeau"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={validateBeforeSubmit}>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Pack */}
              <div className="mb-4">
                <label
                  htmlFor="pack_id"
                  className={`block text-sm font-medium ${themeColors.text} mb-1`}
                >
                  Pack*
                </label>
                <select
                  id="pack_id"
                  name="pack_id"
                  value={formData.pack_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                  disabled={loading}
                >
                  {loading ? (
                    <option value="">Chargement des packs...</option>
                  ) : packs.length > 0 ? (
                    <>
                      <option value="">Sélectionner un pack</option>
                      {packs.map((pack) => (
                        <option key={pack.id} value={pack.id}>
                          {pack.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">Aucun pack actif disponible</option>
                  )}
                </select>
                {errors.pack_id && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.pack_id}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div className="mb-4">
                <label
                  htmlFor="nom"
                  className={`block text-sm font-medium ${themeColors.text} mb-1`}
                >
                  Nom du cadeau*
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.nom ? "border-red-500" : themeColors.border
                  } rounded-md ${themeColors.input}`}
                  placeholder="Ex: Carte cadeau 50$"
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.nom}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium ${themeColors.text} mb-1`}
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border ${themeColors.border} rounded-md ${themeColors.input}`}
                  placeholder="Description du cadeau..."
                ></textarea>
              </div>

              {/* Image */}
              <div className="mb-4">
                <label
                  htmlFor="image_url"
                  className={`block text-sm font-medium ${themeColors.text} mb-1`}
                >
                  Image du cadeau
                </label>
                <div className={`flex items-center justify-center w-full`}>
                  <label
                    htmlFor="image_upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${themeColors.border} ${themeColors.hover}`}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="h-full max-h-28 object-contain"
                          onError={() => setImagePreview("")}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setImagePreview("");
                            setImageFile(null);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <PhotoIcon className="h-8 w-8 mb-2 text-gray-500" />
                        <p className={`mb-2 text-sm ${themeColors.text}`}>
                          <span className="font-semibold">
                            Cliquez pour télécharger
                          </span>{" "}
                          ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG ou JPEG (max. 1MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="image_upload"
                      name="image_url"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {errors.image_url && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {errors.image_url}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Valeur */}
                <div className="mb-4">
                  <label
                    htmlFor="valeur"
                    className={`block text-sm font-medium ${themeColors.text} mb-1`}
                  >
                    Valeur ($)*
                  </label>
                  <input
                    type="number"
                    id="valeur"
                    name="valeur"
                    value={formData.valeur}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border ${
                      errors.valeur ? "border-red-500" : themeColors.border
                    } rounded-md ${themeColors.input}`}
                  />
                  {errors.valeur && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.valeur}
                    </p>
                  )}
                </div>

                {/* Probabilité */}
                <div className="mb-4">
                  <label
                    htmlFor="probabilite"
                    className={`block text-sm font-medium ${themeColors.text} mb-1`}
                  >
                    Probabilité (%)*
                  </label>
                  <input
                    type="number"
                    id="probabilite"
                    name="probabilite"
                    value={formData.probabilite}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className={`w-full px-3 py-2 border ${
                      errors.probabilite ? "border-red-500" : themeColors.border
                    } rounded-md ${themeColors.input}`}
                  />
                  {errors.probabilite && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.probabilite}
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div className="mb-4">
                  <label
                    htmlFor="stock"
                    className={`block text-sm font-medium ${themeColors.text} mb-1`}
                  >
                    Stock*
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-3 py-2 border ${
                      errors.stock ? "border-red-500" : themeColors.border
                    } rounded-md ${themeColors.input}`}
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Actif */}
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="actif"
                  name="actif"
                  checked={formData.actif}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="actif"
                  className={`ml-2 block text-sm ${themeColors.text}`}
                >
                  Cadeau actif (disponible pour les utilisateurs)
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-end border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className={`${themeColors.buttonSecondary} px-4 py-2 rounded-md mr-2`}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`${themeColors.button} px-4 py-2 rounded-md`}
              >
                {cadeau ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadeauFormModal;
