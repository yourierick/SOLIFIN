import { useState, useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import axios from "axios";
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";
import CountrySelector from "../../components/CountrySelector";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    sexe: "",
    pays: "",
    province: "",
    ville: "",
    picture: null,
    password: "",
    password_confirmation: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await axios.get("https://restcountries.com/v3.1/all");
      const sortedCountries = response.data
        .map((pays) => ({
          code: pays.cca2,
          name: pays.translations.fra?.common || pays.name.common,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sortedCountries);
    } catch (err) {
      showToast("Erreur lors du chargement des pays", "error");
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/api/profile");
      setUser(response.data.data);
      setFormData({
        name: response.data.data.name,
        email: response.data.data.email,
        phone: response.data.data.phone || "",
        whatsapp: response.data.data.whatsapp || "",
        address: response.data.data.address || "",
        sexe: response.data.data.sexe || "",
        pays: response.data.data.pays || "",
        province: response.data.data.province || "",
        ville: response.data.data.ville || "",
        picture: null,
        password: "",
        password_confirmation: "",
      });
      setLoading(false);
    } catch (err) {
      showToast("Erreur lors du chargement du profil", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer le changement de pays avec le sélecteur de pays
  const handleCountryChange = (countryName) => {
    setFormData((prev) => ({
      ...prev,
      pays: countryName,
    }));

    // Réinitialiser l'erreur de validation pour le pays
    if (validationErrors.pays) {
      setValidationErrors((prev) => ({
        ...prev,
        pays: null,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation de la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setValidationErrors({
          picture: ["La taille de l'image ne doit pas dépasser 2MB"],
        });
        return;
      }

      // Validation du type de fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        setValidationErrors({
          picture: ["Le fichier doit être une image (JPG, PNG ou GIF)"],
        });
        return;
      }

      setValidationErrors((prev) => ({ ...prev, picture: null }));
      setFormData((prev) => ({ ...prev, picture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setValidationErrors({});
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      const response = await axios.post("/api/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showToast("Profil mis à jour avec succès", "success");
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        // Afficher le premier message d'erreur comme toast
        const firstError = Object.values(err.response.data.errors)[0][0];
        showToast(firstError, "error");
      } else {
        showToast("Erreur lors de la mise à jour du profil", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-start pt-24 justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden"
      >
        {/* En-tête avec bannière dégradée */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative bg-gradient-to-r from-primary-600 to-primary-800 h-48"
        >
          {/* Bouton d'édition flottant */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute right-6 top-6"
          >
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-700 bg-white rounded-md shadow-md hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewUrl(null);
                    // Réinitialiser les données
                    fetchProfile();
                  }}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Annuler</span>
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Photo de profil */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="absolute -bottom-16 left-6 md:left-10"
          >
            <div className="relative">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-700 shadow-lg">
                {user.profile_picture_url || previewUrl ? (
                  <img
                    src={
                      isEditing && previewUrl
                        ? previewUrl
                        : user.profile_picture_url
                    }
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <UserCircleIcon className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="profile-picture" className="cursor-pointer">
                    <div className="h-10 w-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-md transition-all duration-200">
                      <PhotoIcon className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="file"
                      id="profile-picture"
                      name="picture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Contenu principal */}
        <div className="px-6 pt-20 pb-8">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Nom et titre */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-2 mb-8"
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  <div className="flex items-center mt-1">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">
                      Administrateur
                    </span>
                    {user.email_verified_at && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    {user.email}
                  </p>
                </motion.div>

                {/* Sections d'informations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Informations personnelles
                    </h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Nom
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Téléphone
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.phone || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Whatsapp
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.whatsapp || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Sexe
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.sexe === "homme"
                            ? "Masculin"
                            : user.sexe === "femme"
                            ? "Féminin"
                            : "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Localisation
                    </h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Pays
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.pays || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Province
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.province || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Ville
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.ville || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Adresse
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.address || "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-primary-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Informations administrateur
                    </h3>
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Rôle
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          Administrateur
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Dernière connexion
                        </dt>
                        <dd className="mt-1 text-base text-gray-900 dark:text-white">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleString()
                            : "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="profile-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <form
                  id="profile-form"
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.name[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.email
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.email[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.phone
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.phone && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.phone[0]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Whatsapp
                          </label>
                          <input
                            type="tel"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 rounded-lg border ${
                              validationErrors.whatsapp
                                ? "border-red-500"
                                : "border-gray-300"
                            } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                          />
                          {validationErrors.whatsapp && (
                            <p className="mt-1 text-sm text-red-500">
                              {validationErrors.whatsapp[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sexe
                        </label>
                        <select
                          name="sexe"
                          value={formData.sexe}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.sexe
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        >
                          <option value="">Sélectionner</option>
                          <option value="homme">Masculin</option>
                          <option value="femme">Féminin</option>
                        </select>
                        {validationErrors.sexe && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.sexe[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Pays
                        </label>
                        <div className="relative">
                          <CountrySelector
                            value={formData.pays}
                            onChange={handleCountryChange}
                            placeholder="Sélectionner un pays"
                          />
                          {loadingCountries && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        {validationErrors.pays && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.pays[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Province
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={formData.province}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.province
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.province && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.province[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ville
                        </label>
                        <input
                          type="text"
                          name="ville"
                          value={formData.ville}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.ville
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.ville && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.ville[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Adresse
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="3"
                          className={`w-full px-4 py-2.5 rounded-lg border ${
                            validationErrors.address
                              ? "border-red-500"
                              : "border-gray-300"
                          } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                        />
                        {validationErrors.address && (
                          <p className="mt-1 text-sm text-red-500">
                            {validationErrors.address[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          validationErrors.password
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                      />
                      {validationErrors.password && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.password[0]}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Laissez vide pour conserver le mot de passe actuel
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          validationErrors.password_confirmation
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200`}
                      />
                      {validationErrors.password_confirmation && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.password_confirmation[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {validationErrors.picture && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            {validationErrors.picture[0]}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
