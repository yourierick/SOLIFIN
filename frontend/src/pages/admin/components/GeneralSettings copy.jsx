import React, { useState, useEffect } from "react";
import ModalPortal from "./ModalPortal";
import {
  PencilIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "../../../utils/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../../../contexts/ThemeContext";

// Définition des paramètres figés
const FIXED_SETTINGS = [
  // Paramètres financiers
  {
    key: "withdrawal_fee_percentage",
    label: "Pourcentage des frais de retrait",
    description:
      "Pourcentage des frais appliqués sur chaque retrait (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "withdrawal_commission",
    label: "Pourcentage de commission sur retrait",
    description:
      "Pourcentage de commission prélevé sur chaque retrait au bénefice du premier parrain (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "transfer_fee_percentage",
    label: "Pourcentage des frais de transfert",
    description:
      "Pourcentage des frais appliqués sur chaque transfert (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "transfer_commission",
    label: "Pourcentage Commission transfert entre wallet",
    description:
      "Pourcentage de la commission du premier parrain pour le transfert entre wallet (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "purchase_fee_percentage",
    label: "Pourcentage des frais d'achat des packs",
    description:
      "Pourcentage des frais d'achat des packs (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  {
    key: "purchase_commission_system",
    label: "Pourcentage Commission système",
    description:
      "Pourcentage des frais de commission système pour la vente des formations (valeur entre 0 et 100)",
    placeholder: "1.5%",
    category: "finance",
    isNumber: true,
  },
  // Réseaux sociaux
  {
    key: "facebook_url",
    label: "Lien Facebook",
    description: "URL de la page Facebook de l'entreprise",
    placeholder: "https://facebook.com/votrepage",
    category: "social",
    isText: true,
  },
  {
    key: "whatsapp_url",
    label: "Lien WhatsApp",
    description:
      "Remplacez NUMERO par votre numéro de téléphone au format international (sans espaces, parenthèses ou tirets). Par exemple, si votre numéro est +243 812345678, votre lien sera: https://wa.me/243812345678",
    placeholder: "https://wa.me/NUMERO",
    category: "social",
    isText: true,
  },
  {
    key: "twitter_url",
    label: "Lien X (Twitter)",
    description: "URL du compte X (Twitter) de l'entreprise",
    placeholder: "https://x.com/votrecompte",
    category: "social",
    isText: true,
  },
  {
    key: "instagram_url",
    label: "Lien Instagram",
    description: "URL du compte Instagram de l'entreprise",
    placeholder: "https://instagram.com/votrecompte",
    category: "social",
    isText: true,
  },

  // Documents légaux
  {
    key: "terms_of_use",
    label: "Conditions d'utilisation",
    description: "Texte des conditions d'utilisation de la plateforme",
    placeholder: "Entrez les conditions d'utilisation...",
    category: "legal",
    isLongText: true,
  },
  {
    key: "privacy_policy",
    label: "Politique de confidentialité",
    description: "Texte de la politique de confidentialité de la plateforme",
    placeholder: "Entrez la politique de confidentialité...",
    category: "legal",
    isLongText: true,
  },

  // Photo du fondateur
  {
    key: "founder_photo",
    label: "Photo du fondateur",
    description: "URL de la photo du fondateur",
    placeholder: "https://exemple.com/photo.jpg",
    category: "about",
    isImage: true,
  },
];
const GeneralSettings = () => {
  const { isDarkMode } = useTheme();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("finance");

  // Catégories disponibles
  const categories = [
    { id: "finance", label: "Paramètres financiers" },
    { id: "social", label: "Réseaux sociaux" },
    { id: "legal", label: "Documents légaux" },
    { id: "about", label: "À propos" },
  ];

  // Fonction pour filtrer les paramètres par catégorie
  const getSettingsByCategory = (category) => {
    return FIXED_SETTINGS.filter((setting) => setting.category === category);
  };

  // Récupérer les paramètres au chargement du composant
  useEffect(() => {
    fetchSettings();
  }, [refreshKey]);

  // Fonction pour récupérer les paramètres depuis l'API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/settings");
      if (response.data.success) {
        // Convertir le tableau en objet avec la clé comme propriété
        const settingsObj = {};
        response.data.settings.forEach((setting) => {
          settingsObj[setting.key] = setting;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error);
      toast.error("Erreur lors de la récupération des paramètres");
    } finally {
      setLoading(false);
    }
  };
  // Fonction pour ouvrir le modal d'édition
  const handleOpenEditModal = (settingKey) => {
    const setting = settings[settingKey];
    const fixedSetting = FIXED_SETTINGS.find((s) => s.key === settingKey);

    if (setting) {
      // Le paramètre existe déjà, on édite sa valeur
      setFormData({
        key: setting.key,
        value: setting.value,
        description: setting.description,
      });
      setCurrentSetting(setting);
    } else {
      // Le paramètre n'existe pas encore, on prépare sa création
      setFormData({
        key: settingKey,
        value: "",
        description: fixedSetting.description,
      });
      setCurrentSetting(null);
    }

    setErrors({});
    setShowModal(true);
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      key: "",
      value: "",
      description: "",
    });
    setErrors({});
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Fonction pour valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    const currentSetting = FIXED_SETTINGS.find((s) => s.key === formData.key);

    // Validation générale - la valeur est requise pour tous les paramètres
    if (!formData.value.trim() && !currentSetting?.isImage) {
      newErrors.value = "La valeur est requise";

      // Validation spécifique pour les paramètres financiers (pourcentages)
    } else if (
      formData.key === "withdrawal_commission" ||
      formData.key === "withdrawal_fee_percentage" ||
      formData.key === "transfer_commission" ||
      formData.key === "transfer_fee_percentage" ||
      formData.key === "purchase_fee_percentage" ||
      formData.key === "purchase_commission_system"
    ) {
      // Valider que la valeur est un nombre entre 0 et 100
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors.value = "La valeur doit être un nombre entre 0 et 100";
      }

      // Validation pour le prix du boost
    } else if (formData.key === "boost_price") {
      // Valider que la valeur est un nombre positif
      const value = parseFloat(formData.value);
      if (isNaN(value) || value <= 0) {
        newErrors.value = "La valeur doit être un nombre positif";
      }

      // Validation pour les URLs des réseaux sociaux et la photo du fondateur
    } else if (
      formData.key === "facebook_url" ||
      formData.key === "twitter_url" ||
      formData.key === "instagram_url" ||
      formData.key === "founder_photo"
    ) {
      if (formData.value.trim() && !formData.value.startsWith("http")) {
        newErrors.value = "L'URL doit commencer par http:// ou https://";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      // Toujours utiliser updateByKey qui gère à la fois la création et la mise à jour
      const response = await axios.put(
        `/api/admin/settings/key/${formData.key}`,
        formData
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setRefreshKey((prev) => prev + 1); // Déclencher une actualisation
        handleCloseModal();
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);

      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(
          "Une erreur est survenue lors de la soumission du formulaire"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paramètres du système</h3>
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          {/* Onglets de catégories */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === category.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          {/* Affichage des paramètres par catégorie */}
          <div className="overflow-x-auto">
            {activeTab === "legal" ? (
              // Affichage spécial pour les documents légaux (texte long)
              <div className="space-y-6">
                {getSettingsByCategory("legal").map((fixedSetting) => {
                  const setting = settings[fixedSetting.key];
                  return (
                    <div
                      key={fixedSetting.key}
                      className="border dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {fixedSetting.label}
                        </h5>
                        <button
                          onClick={() => handleOpenEditModal(fixedSetting.key)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {fixedSetting.description}
                      </p>
                      <div className="bg-white dark:bg-gray-700 p-3 rounded border dark:border-gray-600 max-h-40 overflow-y-auto">
                        {setting ? (
                          setting.value
                        ) : (
                          <span className="text-gray-400 italic">
                            Non défini
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "about" ? (
              // Affichage spécial pour la photo du fondateur
              <div className="space-y-6">
                {getSettingsByCategory("about").map((fixedSetting) => {
                  const setting = settings[fixedSetting.key];
                  return (
                    <div
                      key={fixedSetting.key}
                      className="border dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {fixedSetting.label}
                        </h5>
                        <button
                          onClick={() => handleOpenEditModal(fixedSetting.key)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {fixedSetting.description}
                      </p>
                      {setting && setting.value ? (
                        <div className="flex justify-center">
                          <img
                            src={setting.value}
                            alt="Photo du fondateur"
                            className="max-h-64 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-100 dark:bg-gray-700 h-40 flex items-center justify-center rounded-lg">
                          <span className="text-gray-400 italic">
                            Aucune image définie
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Affichage standard en tableau pour les autres catégories
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Paramètre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Valeur
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Description
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
                  {getSettingsByCategory(activeTab).map((fixedSetting) => {
                    const setting = settings[fixedSetting.key];
                    return (
                      <tr
                        key={fixedSetting.key}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {fixedSetting.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {setting ? setting.value : "Non défini"}{" "}
                          {fixedSetting.isNumber ? "%" : ""}{" "}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {setting
                            ? setting.description
                            : fixedSetting.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleOpenEditModal(fixedSetting.key)
                            }
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {/* Modal pour modifier un paramètre */}
      <ModalPortal isOpen={showModal} onClose={handleCloseModal}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentSetting
                ? "Modifier un paramètre"
                : "Ajouter un paramètre"}
            </h3>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="key"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Clé
                </label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={formData.key}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Champ de valeur dynamique selon le type de paramètre */}
              <div>
                <label
                  htmlFor="value"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Valeur
                </label>
                {FIXED_SETTINGS.find((s) => s.key === formData.key)
                  ?.isLongText ? (
                  <textarea
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    rows={6}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                      errors.value
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder={
                      FIXED_SETTINGS.find((s) => s.key === formData.key)
                        ?.placeholder || ""
                    }
                  />
                ) : FIXED_SETTINGS.find((s) => s.key === formData.key)
                    ?.isImage ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                        errors.value
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="URL de l'image"
                    />
                    {formData.value && formData.value.startsWith("http") && (
                      <div className="mt-2 border dark:border-gray-600 rounded-md p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Aperçu:
                        </p>
                        <img
                          src={formData.value}
                          alt="Aperçu"
                          className="max-h-40 mx-auto object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/150?text=Image+non+disponible";
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : FIXED_SETTINGS.find((s) => s.key === formData.key)
                    ?.isText ? (
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                      errors.value
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder={
                      FIXED_SETTINGS.find((s) => s.key === formData.key)
                        ?.placeholder || ""
                    }
                  />
                ) : (
                  <input
                    type="number"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                      errors.value
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                    placeholder={
                      FIXED_SETTINGS.find((s) => s.key === formData.key)
                        ?.placeholder || ""
                    }
                  />
                )}
                {errors.value && (
                  <p className="mt-1 text-sm text-red-500">{errors.value}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                    Traitement...
                  </span>
                ) : currentSetting ? (
                  "Mettre à jour"
                ) : (
                  "Ajouter"
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </ModalPortal>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default GeneralSettings;
