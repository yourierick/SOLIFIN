import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import Notification from "../../components/Notification";
export default function EditPack() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avantages, setAvantages] = useState([""]);
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cdf_price: "",
    duree_publication_en_jour: "",
    categorie: "",
    status: true,
    abonnement: "",
    peux_publier_formation: false,
    boost_percentage: "",
  });
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchPack();
  }, [id]);

  const fetchPack = async () => {
    try {
      const response = await axios.get(`/api/admin/packs/${id}`);
      const pack = response.data.data;

      setFormData({
        categorie: pack.categorie || "",
        name: pack.name || "",
        description: pack.description || "",
        price: pack.price || "",
        cdf_price: pack.cdf_price || "",
        duree_publication_en_jour: pack.duree_publication_en_jour || "",
        status: pack.status === undefined ? true : Boolean(pack.status),
        abonnement: pack.abonnement || "",
        peux_publier_formation:
          pack.peux_publier_formation === undefined
            ? false
            : Boolean(pack.peux_publier_formation),
        boost_percentage: pack.boost_percentage || "",
      });

      // Gérer les avantages
      const packAvantages =
        typeof pack.avantages === "string"
          ? JSON.parse(pack.avantages)
          : Array.isArray(pack.avantages)
          ? pack.avantages
          : [];

      setAvantages(packAvantages);
    } catch (err) {
      Notification.error("Erreur lors du chargement du pack");
      navigate("/admin/packs");
    }
  };

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
      if (!formData.categorie.trim()) {
        toast.warning("La catégorie du pack est requise");
        return;
      }

      if (
        !formData.duree_publication_en_jour ||
        formData.duree_publication_en_jour <= 0
      ) {
        toast.warning("La durée de publication doit être supérieur à 0");
        return;
      }

      if (!formData.name.trim()) {
        toast.error("Le nom du pack est requis");
        return;
      }
      if (!formData.description.trim()) {
        toast.error("La description du pack est requise");
        return;
      }
      if (!formData.price || formData.price <= 0) {
        toast.error("Le prix doit être supérieur à 0");
        return;
      }

      if (formData.cdf_price && formData.cdf_price <= 0) {
        toast.error("Le prix en FC doit être supérieur à 0");
        return;
      }

      if (!formData.abonnement) {
        toast.warning("Le type d'abonnement est requis");
        return;
      }

      if (!formData.boost_percentage || formData.boost_percentage <= 0) {
        toast.warning("Le pourcentage de boost est requis");
        return;
      }

      // Filtrer les avantages vides
      const filteredAvantages = avantages.filter(
        (avantage) => avantage.trim() !== ""
      );
      if (filteredAvantages.length === 0) {
        toast.error("Au moins un avantage est requis");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("categorie", formData.categorie.trim());
      formDataToSend.append(
        "duree_publication_en_jour",
        formData.duree_publication_en_jour
      );
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("cdf_price", formData.cdf_price);
      formDataToSend.append("status", formData.status ? "1" : "0");
      formDataToSend.append("abonnement", formData.abonnement);
      formDataToSend.append(
        "peux_publier_formation",
        formData.peux_publier_formation ? "1" : "0"
      );
      formDataToSend.append("_method", "PUT"); // Pour la méthode PUT
      formDataToSend.append("boost_percentage", formData.boost_percentage);
      formDataToSend.append("avantages", JSON.stringify(filteredAvantages));

      const response = await axios.post(
        `/api/admin/packs/${id}`,
        formDataToSend,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.data.success) {
        Notification.success("Pack mis à jour avec succès");
        navigate("/admin/packs");
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du pack:", err);

      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        Notification.error(firstError);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          "Une erreur est survenue lors de la mise à jour du pack";
        Notification.error(errorMessage);
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
              Modifier le pack
            </h1>
            <p className="mt-2 text-primary-100">
              Modifiez les informations du pack ci-dessous
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
                    value={formData.categorie || ""}
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
                    <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
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
              </div>

              <div className="mt-6">
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
                  placeholder="Description détaillée du pack..."
                />
              </div>
            </div>

            {/* Section 2: Tarification */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Tarification
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
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
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="semestriel">Semestriel</option>
                    <option value="annuel">Annuel</option>
                    <option value="triennal">Triennal</option>
                    <option value="quinquennal">Quinquennal</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Prix ($)
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
                      className="block w-full rounded-lg border-gray-300 pl-7 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Prix (FC)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
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
                      className="block w-full rounded-lg border-gray-300 pl-10 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
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
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Avantage..."
                        />
                        <button
                          type="button"
                          onClick={() => removeAvantage(index)}
                          className="flex-shrink-0 text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addAvantage}
                      className="flex items-center text-primary-600 hover:text-primary-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-1" />
                      Ajouter un avantage
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <input
                    type="checkbox"
                    name="peux_publier_formation"
                    checked={formData.peux_publier_formation === true}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                  <label className="ml-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Peut publier une formation
                  </label>
                </div>

                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                  <label className="ml-3 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Pack actif
                  </label>
                </div>
              </div>
            </div>

            {/* Section 4: Configuration */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Configuration du pack
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Durée de publication (en jours)
                  </label>
                  <input
                    type="number"
                    name="duree_publication_en_jour"
                    value={formData.duree_publication_en_jour}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                    placeholder="Durée de publication en jours"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <SparklesIcon className="h-4 w-4 mr-2 text-gray-500" />
                    Pourcentage de boost (%)
                  </label>
                  <input
                    type="number"
                    name="boost_percentage"
                    value={formData.boost_percentage}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-200 sm:text-sm"
                    placeholder="Pourcentage de boost"
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate("/admin/packs")}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center"
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
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Enregistrer les modifications
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
