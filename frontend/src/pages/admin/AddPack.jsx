/**
 * AddPack.jsx - Formulaire d'ajout de pack d'investissement
 *
 * Ce composant fournit une interface pour créer un nouveau pack d'investissement.
 * Il gère la validation des données, l'upload d'images et la soumission au serveur.
 *
 * Fonctionnalités :
 * - Formulaire de création avec validation
 * - Upload et prévisualisation d'image
 * - Gestion des erreurs de formulaire
 * - Feedback utilisateur via toast
 * - Navigation post-création
 *
 * Champs du formulaire :
 * - Nom du pack
 * - Description
 * - Prix
 * - Image
 * - Autres attributs spécifiques
 *
 * Validation :
 * - Champs requis
 * - Format d'image
 * - Taille maximale
 * - Validation côté client et serveur
 *
 * Interactions API :
 * - POST /api/admin/packs : Création d'un nouveau pack
 * - POST /api/upload : Upload de l'image
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../contexts/ToastContext";
import Notification from "../../components/Notification";

export default function AddPack() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avantages, setAvantages] = useState([""]);
  const [formData, setFormData] = useState({
    categorie: "",
    name: "",
    description: "",
    abonnement: "",
    price: "",
    cdf_price: "",
    duree_publication_en_jour: "",
    peux_publier_formation: false,
    boost_percentage: "",
    status: true,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvantageChange = (index, value) => {
    const newAvantages = [...avantages];
    newAvantages[index] = value;
    setAvantages(newAvantages);
  };

  const addAvantage = () => {
    setAvantages([...avantages, ""]);
  };

  const removeAvantage = (index) => {
    const newAvantages = avantages.filter((_, i) => i !== index);
    setAvantages(newAvantages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Valider les données avant l'envoi
      if (!formData.name.trim()) {
        Notification.warning("Le nom du pack est requis");
        return;
      }
      if (!formData.categorie.trim()) {
        Notification.warning("La catégorie du pack est requise");
        return;
      }
      if (!formData.description.trim()) {
        Notification.warning("La description du pack est requise");
        return;
      }
      if (!formData.price || formData.price <= 0) {
        Notification.warning("Le prix de base en ($) doit être supérieur à 0");
        return;
      }

      if (
        !formData.duree_publication_en_jour ||
        formData.duree_publication_en_jour <= 0
      ) {
        Notification.warning("La durée de publication doit être supérieur à 0");
        return;
      }

      if (!formData.abonnement.trim()) {
        Notification.warning("L'abonnement est requis");
        return;
      }

      if (!formData.boost_percentage || formData.boost_percentage <= 0) {
        Notification.warning("Le pourcentage de boost est requis");
        return;
      }

      // Filtrer les avantages vides
      const filteredAvantages = avantages.filter(
        (avantage) => avantage.trim() !== ""
      );
      if (filteredAvantages.length === 0) {
        Notification.warning("Au moins un avantage est requis");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("categorie", formData.categorie.trim());
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("cdf_price", formData.cdf_price);
      formDataToSend.append("status", formData.status ? "1" : "0");

      formDataToSend.append(
        "duree_publication_en_jour",
        formData.duree_publication_en_jour
      );
      formDataToSend.append("abonnement", formData.abonnement);
      formDataToSend.append("avantages", JSON.stringify(filteredAvantages));
      formDataToSend.append(
        "peux_publier_formation",
        formData.peux_publier_formation ? "1" : "0"
      );
      formDataToSend.append("boost_percentage", formData.boost_percentage);
      const response = await axios.post("/api/admin/packs", formDataToSend, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (response.data.success) {
        Notification.success("Pack créé avec succès", "success");
        navigate("/admin/packs");
      }
    } catch (err) {
      console.error("Erreur:", err);

      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        Notification.error(firstError, "error");
      } else {
        Notification.error(
          err.response?.data?.message ||
            "Une erreur est survenue lors de la création du pack",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec bouton retour */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/admin/packs")}
            className="group flex items-center text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Retour aux packs</span>
          </button>
        </div>

        {/* Carte principale avec titre */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <SparklesIcon className="h-8 w-8 mr-3" />
              Ajouter un nouveau pack
            </h1>
            <p className="mt-2 text-primary-100">
              Créez un nouveau pack d'investissement en remplissant les
              informations ci-dessous
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Section 1: Informations de base */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Informations de base
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Catégorie du pack
                  </label>
                  <select
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                  >
                    <option value="" disabled>
                      Sélectionnez une catégorie
                    </option>
                    <option value="packs à 1 étoile">
                      ⭐ Packs à 1 étoile
                    </option>
                    <option value="packs à 2 étoiles">
                      ⭐⭐ Packs à 2 étoiles
                    </option>
                    <option value="packs à 3 étoiles/VIP">
                      ⭐⭐⭐ Packs à 3 étoiles/VIP
                    </option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <SparklesIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Nom du pack
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                    placeholder="Ex: Pack Premium"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                    placeholder="Décrivez les caractéristiques principales du pack..."
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tarification et durée */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Tarification et durée
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Type d'abonnement
                  </label>
                  <select
                    name="abonnement"
                    value={formData.abonnement}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                  >
                    <option value="" disabled>
                      Sélectionnez un type d'abonnement
                    </option>
                    <option value="mensuel">📅 Mensuel</option>
                    <option value="trimestriel">📅 Trimestriel</option>
                    <option value="semestriel">📅 Semestriel</option>
                    <option value="annuel">📅 Annuel</option>
                    <option value="triennal">📅 Triennal</option>
                    <option value="quinquennal">📅 Quinquennal</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Prix de rénouvellement ($)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-semibold">
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="block w-full rounded-lg border-gray-300 pl-8 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Prix de rénouvellement (FC) Optionnel
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-semibold">
                        FC
                      </span>
                    </div>
                    <input
                      type="number"
                      name="cdf_price"
                      value={formData.cdf_price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="block w-full rounded-lg border-gray-300 pl-8 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Durée des publications (jours)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      name="duree_publication_en_jour"
                      value={formData.duree_publication_en_jour}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      placeholder="Ex: 30 jours"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <SparklesIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Pourcentage de boost (%)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-semibold">
                        %
                      </span>
                    </div>
                    <input
                      type="number"
                      name="boost_percentage"
                      value={formData.boost_percentage}
                      onChange={handleInputChange}
                      required
                      step="any"
                      className="block w-full rounded-lg border-gray-300 pl-8 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Avantages */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Avantages du pack
                </h2>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <div className="space-y-3">
                  {avantages.map((avantage, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={avantage}
                        onChange={(e) =>
                          handleAvantageChange(index, e.target.value)
                        }
                        placeholder="Ex: Accès illimité aux formations"
                        className="block flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAvantage(index)}
                          className="flex-shrink-0 inline-flex items-center p-2 border border-transparent rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors duration-200"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAvantage}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-primary-500 transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter un avantage
                </button>
              </div>
            </div>

            {/* Section 4: Options et paramètres */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Options et paramètres
                </h2>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl space-y-4">
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="peux_publier_formation"
                    checked={formData.peux_publier_formation}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Peut publier une formation
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Autorise les utilisateurs de ce pack à publier des
                      formations
                    </span>
                  </div>
                </label>

                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      Activer ce pack immédiatement
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Le pack sera disponible dès sa création
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate("/admin/packs")}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Créer le pack
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
