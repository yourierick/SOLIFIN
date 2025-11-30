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
import { useCurrency } from "../../../contexts/CurrencyContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../../styles/quill-custom.css";
import * as framerMotion from "framer-motion";
const { motion } = framerMotion;

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
  {
    key: "jeton_expiration_months",
    label: "Durée d'expiration des jetons Esengo",
    description:
      "Durée d'expiration des jetons Esengo en mois pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "ticket_expiration_months",
    label: "Durée d'expiration des tickets gagnants",
    description:
      "Durée d'expiration des tickets gagnants en mois pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "essai_duration_days",
    label: "Durée de l'essai",
    description: "Durée de l'essai en jours pour les nouveaux utilisateurs",
    placeholder: "10",
    category: "period",
    isNumber: true,
  },
  {
    key: "dual_currency",
    label: "Utiliser une deuxième dévise",
    description: "Activer ou desactiver la deuxième dévise",
    placeholder: "oui ou non",
    category: "period",
    isSelect: true,
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
    description: "Photo du fondateur (formats acceptés: JPG, PNG, max 2MB)",
    placeholder: "Sélectionnez une image",
    category: "about",
    isImage: true,
    isUploadable: true,
  },
];
const GeneralSettings = () => {
  const { isDarkMode } = useTheme();
  const { refetch: refetchCurrency } = useCurrency();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [formData, setFormData] = useState({
    value: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
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
    { id: "period", label: "Période et validité" },
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

    if (!fixedSetting) {
      toast.error("Paramètre non trouvé");
      return;
    }

    if (setting) {
      // Le paramètre existe déjà, on édite sa valeur
      setFormData({
        key: setting.key,
        value: setting.value,
        description: setting.description,
      });
      // Fusionner les propriétés du paramètre fixe avec celles du paramètre actuel
      setCurrentSetting({ ...fixedSetting, ...setting });
    } else {
      // Le paramètre n'existe pas encore, on prépare sa création
      setFormData({
        key: settingKey,
        value: "",
        description: fixedSetting.description,
      });
      setCurrentSetting(fixedSetting);
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
    // Réinitialiser les états liés au téléchargement d'images
    setSelectedFile(null);
    setPreviewUrl("");
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Si c'est un téléchargement de fichier
    if (name === "file" && files && files.length > 0) {
      const file = files[0];

      // Vérifier le type de fichier
      if (!file.type.match("image/(jpeg|jpg|png)")) {
        setErrors((prev) => ({
          ...prev,
          file: "Format de fichier non supporté. Utilisez JPG ou PNG.",
        }));
        return;
      }

      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: "L'image est trop volumineuse. Maximum 2MB.",
        }));
        return;
      }

      setSelectedFile(file);

      // Créer une URL pour la prévisualisation
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      fileReader.readAsDataURL(file);

      // Effacer l'erreur pour ce champ
      if (errors.file) {
        setErrors((prev) => ({
          ...prev,
          file: null,
        }));
      }
    } else {
      // Pour les autres champs
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

      // Vérifier si nous avons un fichier à télécharger pour la photo du fondateur
      if (selectedFile && currentSetting && currentSetting.isUploadable) {
        // Créer un FormData pour envoyer le fichier
        const formDataWithFile = new FormData();
        formDataWithFile.append("file", selectedFile);
        formDataWithFile.append("description", formData.description);

        // Envoyer le fichier au serveur
        const uploadResponse = await axios.post(
          `/api/admin/settings/upload/${formData.key}`,
          formDataWithFile,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.data.success) {
          toast.success(uploadResponse.data.message);
          setRefreshKey((prev) => prev + 1); // Déclencher une actualisation
          handleCloseModal();
        }
      } else {
        // Traitement normal pour les autres types de paramètres
        const response = await axios.put(
          `/api/admin/settings/key/${formData.key}`,
          formData
        );

        if (response.data.success) {
          toast.success(response.data.message);

          // Si c'est le paramètre dual_currency, recharger le CurrencyContext
          if (formData.key === "dual_currency") {
            try {
              await refetchCurrency();
            } catch (error) {
              console.error(
                "Erreur lors du rechargement du CurrencyContext:",
                error
              );
              toast.warning(
                "Le paramètre a été mis à jour, mais une erreur est survenue lors de la synchronisation des devises. Veuillez recharger la page."
              );
            }
          }

          setRefreshKey((prev) => prev + 1); // Déclencher une actualisation
          handleCloseModal();
        }
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
          <div className="relative mb-8">
            <div className="flex space-x-1 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`px-5 py-2.5 rounded-t-lg font-medium text-sm transition-all duration-200 relative ${
                    activeTab === category.id
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="relative z-10">{category.label}</span>
                  {activeTab === category.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transform -translate-y-0"
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Affichage des paramètres par catégorie */}
          <div className="overflow-x-auto">
            {activeTab === "legal" ? (
              // Affichage amélioré pour les documents légaux (texte long)
              <div className="space-y-8">
                {getSettingsByCategory("legal").map((fixedSetting) => {
                  const setting = settings[fixedSetting.key];
                  return (
                    <div
                      key={fixedSetting.key}
                      className="border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600 flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white text-lg">
                            {fixedSetting.label}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {fixedSetting.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenEditModal(fixedSetting.key)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="Modifier"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {setting && setting.value ? (
                        <div className="bg-white dark:bg-gray-800 p-5 rounded">
                          <div className="prose dark:prose-invert max-w-none prose-sm overflow-y-auto max-h-96 legal-document">
                            <ReactMarkdown
                              rehypePlugins={[rehypeSanitize]}
                              components={{
                                p: ({ node, ...props }) => (
                                  <p
                                    className="mb-4 text-base leading-relaxed"
                                    {...props}
                                  />
                                ),
                                h1: ({ node, ...props }) => (
                                  <h1
                                    className="text-2xl font-bold mb-4 mt-6 border-b pb-2 border-gray-200 dark:border-gray-700"
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className="text-xl font-bold mb-3 mt-5"
                                    {...props}
                                  />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    className="text-lg font-bold mb-2 mt-4"
                                    {...props}
                                  />
                                ),
                                h4: ({ node, ...props }) => (
                                  <h4
                                    className="text-base font-bold mb-2 mt-3"
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className="list-disc pl-5 mb-4 space-y-2"
                                    {...props}
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    className="list-decimal pl-5 mb-4 space-y-2"
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="mb-1" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                  <a
                                    className="text-blue-600 hover:underline"
                                    {...props}
                                  />
                                ),
                                blockquote: ({ node, ...props }) => (
                                  <blockquote
                                    className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4"
                                    {...props}
                                  />
                                ),
                                code: ({ node, inline, ...props }) =>
                                  inline ? (
                                    <code
                                      className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
                                      {...props}
                                    />
                                  ) : (
                                    <code
                                      className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto my-4"
                                      {...props}
                                    />
                                  ),
                                pre: ({ node, ...props }) => (
                                  <pre
                                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto my-4"
                                    {...props}
                                  />
                                ),
                                hr: ({ node, ...props }) => (
                                  <hr
                                    className="my-6 border-t border-gray-300 dark:border-gray-600"
                                    {...props}
                                  />
                                ),
                                table: ({ node, ...props }) => (
                                  <table
                                    className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 my-4"
                                    {...props}
                                  />
                                ),
                                th: ({ node, ...props }) => (
                                  <th
                                    className="px-3 py-2 text-left font-semibold bg-gray-100 dark:bg-gray-700"
                                    {...props}
                                  />
                                ),
                                td: ({ node, ...props }) => (
                                  <td
                                    className="px-3 py-2 border-t border-gray-200 dark:border-gray-700"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {setting.value}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 p-5 text-center">
                          <span className="text-gray-400 italic block py-8">
                            Aucun contenu défini
                          </span>
                        </div>
                      )}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
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
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
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
                    Valeur{" "}
                    {currentSetting &&
                      currentSetting.category === "legal" &&
                      "(Supporte le format Markdown)"}
                  </label>

                  {/* Guide Markdown pour les documents légaux */}
                  {currentSetting && currentSetting.category === "legal" && (
                    <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      <p className="font-medium mb-1">Formatage Markdown :</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <code># Titre</code> pour les grands titres
                        </li>
                        <li>
                          <code>## Sous-titre</code> pour les sous-titres
                        </li>
                        <li>
                          <code>**texte**</code> pour du{" "}
                          <strong>texte en gras</strong>
                        </li>
                        <li>
                          <code>*texte*</code> pour du{" "}
                          <em>texte en italique</em>
                        </li>
                        <li>
                          <code>- élément</code> pour des listes à puces
                        </li>
                        <li>
                          <code>[texte](url)</code> pour des liens
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Éditeur de texte riche avec React Quill */}
                  {currentSetting && currentSetting.isLongText && (
                    <div>
                      <div
                        className={`quill-container ${
                          isDarkMode ? "dark" : ""
                        }`}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        <ReactQuill
                          theme="snow"
                          value={formData.value}
                          onChange={(value) =>
                            handleChange({ target: { name: "value", value } })
                          }
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, 4, 5, 6, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              [{ script: "sub" }, { script: "super" }],
                              [{ indent: "-1" }, { indent: "+1" }],
                              [{ direction: "rtl" }],
                              [{ color: [] }, { background: [] }],
                              [{ font: [] }],
                              [{ align: [] }],
                              ["blockquote", "code-block"],
                              ["link", "image", "video"],
                              ["clean"],
                            ],
                          }}
                          formats={[
                            "header",
                            "font",
                            "size",
                            "bold",
                            "italic",
                            "underline",
                            "strike",
                            "blockquote",
                            "list",
                            "bullet",
                            "indent",
                            "link",
                            "image",
                            "video",
                            "color",
                            "background",
                            "align",
                            "script",
                            "direction",
                          ]}
                          placeholder="Écrivez votre contenu ici..."
                          style={{
                            height: "300px",
                            marginBottom: "50px",
                          }}
                        />
                      </div>
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}

                      {/* Prévisualisation pour les documents légaux */}
                      {currentSetting.category === "legal" &&
                        formData.value && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Prévisualisation
                            </h4>
                            <div
                              className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 prose dark:prose-invert prose-sm max-h-60 overflow-y-auto"
                              dangerouslySetInnerHTML={{
                                __html: formData.value,
                              }}
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Champ pour les images avec prévisualisation */}
                  {currentSetting && currentSetting.isImage && (
                    <div className="space-y-4">
                      {/* Option de téléchargement pour la photo du fondateur */}
                      {currentSetting.isUploadable && (
                        <div className="space-y-2">
                          <label
                            htmlFor="file"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Télécharger une image
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              id="file"
                              name="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleChange}
                              className={`block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-800 ${
                                errors.file ? "border-red-500" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl("");
                              }}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Effacer
                            </button>
                          </div>
                          {errors.file && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                              {errors.file}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Formats acceptés: JPG, PNG. Taille max: 2MB
                          </p>
                          {previewUrl && (
                            <div className="mt-2 border dark:border-gray-600 rounded-md p-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Aperçu du fichier téléchargé:
                              </p>
                              <img
                                src={previewUrl}
                                alt="Aperçu"
                                className="max-h-40 mx-auto object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Champ URL pour toutes les images */}
                      <div className="space-y-2">
                        <label
                          htmlFor="value"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {currentSetting.isUploadable
                            ? "Ou entrez une URL d'image"
                            : "URL de l'image"}
                        </label>
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
                        {errors.value && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.value}
                          </p>
                        )}
                        {formData.value &&
                          formData.value.startsWith("http") && (
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
                    </div>
                  )}

                  {/* Champ texte simple */}
                  {currentSetting && currentSetting.isText && (
                    <div>
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
                        placeholder={currentSetting.placeholder || ""}
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champ Select */}
                  {currentSetting && currentSetting.isSelect && (
                    <div>
                      <select
                        name="value"
                        id="value"
                        value={formData.value}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border ${
                          errors.value
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } rounded-md shadow-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                      >
                        <option value="oui">Oui</option>
                        <option value="non">Non</option>
                      </select>
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Champ nombre */}
                  {currentSetting && currentSetting.isNumber && (
                    <div>
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
                        placeholder={currentSetting.placeholder || ""}
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fallback pour tout autre type de champ */}
                  {!currentSetting && (
                    <div>
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
                      />
                      {errors.value && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.value}
                        </p>
                      )}
                    </div>
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
