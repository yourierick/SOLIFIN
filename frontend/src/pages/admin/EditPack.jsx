import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import {
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function EditPack() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [avantages, setAvantages] = useState([""]);
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duree_publication_en_jour: "",
    categorie: "",
    status: true,
    abonnement: "",
    peux_publier_formation: false,
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
        duree_publication_en_jour: pack.duree_publication_en_jour || "",
        status: pack.status === undefined ? true : Boolean(pack.status),
        abonnement: pack.abonnement || "",
        peux_publier_formation:
          pack.peux_publier_formation === undefined
            ? false
            : Boolean(pack.peux_publier_formation),
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
      toast.error("Erreur lors du chargement du pack");
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

      if (!formData.abonnement) {
        toast.warning("Le type d'abonnement est requis");
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
      formDataToSend.append("status", formData.status ? "1" : "0");
      formDataToSend.append("abonnement", formData.abonnement);
      formDataToSend.append(
        "peux_publier_formation",
        formData.peux_publier_formation ? "1" : "0"
      );
      formDataToSend.append("_method", "PUT"); // Pour la méthode PUT

      formDataToSend.append("avantages", JSON.stringify(filteredAvantages));

      const response = await axios.post(
        `/api/admin/packs/${id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Pack mis à jour avec succès");
        navigate("/admin/packs");
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du pack:", err);

      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          "Une erreur est survenue lors de la mise à jour du pack";
        toast.error(errorMessage);
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
              Modifier le pack
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Modifiez les informations du pack ci-dessous
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
                  value={formData.categorie || ""}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Sélectionnez une catégorie</option>
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
                  placeholder="Description détaillée du pack..."
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durée de publication (en jours)
                </label>
                <input
                  type="number"
                  name="duree_publication_en_jour"
                  value={formData.duree_publication_en_jour}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Durée de publication en jours"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="peux_publier_formation"
                  checked={formData.peux_publier_formation === true}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Peut publier une formation
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    Pack actif
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate("/admin/packs")}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
}
