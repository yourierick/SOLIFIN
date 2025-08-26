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
    duree_publication_en_jour: "",
    peux_publier_formation: false,
    boost_percentage: "",
    status: true,
  });
  const [dragActive, setDragActive] = useState(false);
  const { showToast } = useToast();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
        Notification.warning("Le prix doit être supérieur à 0");
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

      if (!formData.peux_publier_formation) {
        Notification.warning("Le champ peut publier formation est requis");
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4">
      <div className="mx-auto">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate("/admin/packs")}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Retour aux packs
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Ajouter un nouveau pack
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Créez un nouveau pack en remplissant les informations ci-dessous
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catégorie du pack
                </label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="" disabled>
                    Sélectionnez une catégorie
                  </option>
                  <option value="packs à 1 étoile">packs à 1 étoile</option>
                  <option value="packs à 2 étoiles">packs à 2 étoiles</option>
                  <option value="packs à 3 étoiles/VIP">
                    packs à 3 étoiles/VIP
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du pack
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Ex: Pack Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Décrivez les caractéristiques principales du pack..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type d'abonnement
                </label>
                <select
                  name="abonnement"
                  value={formData.abonnement}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="" disabled>
                    Sélectionnez un type d'abonnement
                  </option>
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="semestriel">Semestriel</option>
                  <option value="annuel">Annuel</option>
                  <option value="triennal">Triennal</option>
                  <option value="quinquennal">Quinquennal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prix de rénouvellement ($)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
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
                    className="block w-full rounded-md border-gray-300 pl-7 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pourcentage de boost de publication
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
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
                    className="block w-full rounded-md border-gray-300 pl-7 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avantages
                </label>
                <div className="space-y-2">
                  {avantages.map((avantage, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={avantage}
                        onChange={(e) =>
                          handleAvantageChange(index, e.target.value)
                        }
                        placeholder="Ex: Accès illimité aux formations"
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeAvantage(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAvantage}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter un avantage
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durée des publications en jour
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="duree_publication_en_jour"
                    value={formData.duree_publication_en_jour}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="block w-full rounded-md border-gray-300 pl-7 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="1 jour par exemple"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="peux_publier_formation"
                  checked={formData.peux_publier_formation}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Peut publier une formation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Activer ce pack immédiatement
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/admin/packs")}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? "Création en cours..." : "Créer le pack"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
