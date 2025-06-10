import React, { useState, useEffect } from "react";
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
  {
    key: "withdrawal_commission",
    label: "Pourcentage de commission sur retrait",
    description:
      "Pourcentage de commission prélevé sur chaque retrait (valeur entre 0 et 100)",
    placeholder: "5%",
  },
  {
    key: "boost_price",
    label: "Prix du boost de publication par jour",
    description: "Prix en USD pour booster une publication pendant un jour",
    placeholder: "6$",
  },
  {
    key: "withdrawal_fee_percentage",
    label: "Pourcentage général des frais de retrait",
    description:
      "Pourcentage des frais appliqués sur chaque retrait (valeur entre 0 et 100)",
    placeholder: "2.5%",
  },
  {
    key: "sending_fee_percentage",
    label: "Pourcentage général des frais d'envoi",
    description:
      "Pourcentage des frais appliqués sur chaque envoi (valeur entre 0 et 100)",
    placeholder: "1.5%",
  },
  {
    key: "transfer_fee_percentage",
    label: "Pourcentage général des frais de transfert",
    description:
      "Pourcentage des frais appliqués sur chaque transfert (valeur entre 0 et 100)",
    placeholder: "2%",
  },
  {
    key: "purchase_fee_percentage",
    label: "Pourcentage des frais des achats dans le système",
    description:
      "Pourcentage de frais prélevé sur chaque achat dans le système autre que l'achat des packs (valeur entre 0 et 100)",
    placeholder: "5%",
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

    if (!formData.value.trim()) {
      newErrors.value = "La valeur est requise";
    } else if (
      formData.key === "withdrawal_commission" ||
      formData.key === "withdrawal_fee_percentage" ||
      formData.key === "sending_fee_percentage" ||
      formData.key === "transfer_fee_percentage" ||
      formData.key === "purchase_fee_percentage"
    ) {
      // Valider que la valeur est un nombre entre 0 et 100
      const value = parseFloat(formData.value);
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors.value = "La valeur doit être un nombre entre 0 et 100";
      }
    } else if (formData.key === "boost_price") {
      // Valider que la valeur est un nombre positif
      const value = parseFloat(formData.value);
      if (isNaN(value) || value <= 0) {
        newErrors.value = "La valeur doit être un nombre positif";
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
          <h4 className="text-md font-medium mb-4">Paramètres principaux</h4>

          <div className="overflow-x-auto">
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
                {FIXED_SETTINGS.map((fixedSetting) => {
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
                        {setting &&
                          (fixedSetting.key === "withdrawal_commission" ||
                          fixedSetting.key === "withdrawal_fee_percentage" ||
                          fixedSetting.key === "sending_fee_percentage" ||
                          fixedSetting.key === "transfer_fee_percentage" ||
                          fixedSetting.key === "purchase_fee_percentage"
                            ? "%"
                            : fixedSetting.key === "boost_price"
                            ? "$"
                            : "")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {setting
                          ? setting.description
                          : fixedSetting.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditModal(fixedSetting.key)}
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
          </div>
        </div>
      )}

      {/* Modal pour modifier un paramètre */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
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
            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="key"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Paramètre
                  </label>
                  <input
                    type="text"
                    id="key"
                    name="key"
                    value={
                      FIXED_SETTINGS.find((s) => s.key === formData.key)
                        ?.label || formData.key
                    }
                    disabled={true}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-gray-100 dark:bg-gray-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="value"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Valeur
                  </label>
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                      errors.value ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    placeholder={
                      FIXED_SETTINGS.find((s) => s.key === formData.key)
                        ?.placeholder || ""
                    }
                  />
                  {errors.value && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.value}
                    </p>
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
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  ></textarea>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>{currentSetting ? "Mettre à jour" : "Ajouter"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
};

export default GeneralSettings;
