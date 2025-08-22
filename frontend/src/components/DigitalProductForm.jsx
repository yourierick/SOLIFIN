import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

const DigitalProductForm = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    type: "ebook",
    prix: "",
    devise: "USD", // Devise fixée à USD
    image: null,
    fichier: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        titre: product.titre || "",
        description: product.description || "",
        type: product.type || "ebook",
        prix: product.prix || "",
        devise: "USD", // Devise toujours fixée à USD
        image: null,
        fichier: null,
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }

      if (product.fichier_url) {
        const fileNameFromPath = product.fichier_url.split("/").pop();
        setFileName(fileNameFromPath);
      }
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));

      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: null }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, fichier: file }));
      setFileName(file.name);

      if (errors.fichier) {
        setErrors((prev) => ({ ...prev, fichier: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre.trim()) {
      newErrors.titre = "Le titre est requis";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (
      !formData.prix ||
      isNaN(formData.prix) ||
      parseFloat(formData.prix) <= 0
    ) {
      newErrors.prix = "Veuillez entrer un prix valide";
    }

    // Vérification de l'image (maintenant obligatoire)
    if (!formData.image && !imagePreview) {
      newErrors.image = "L'image de couverture est requise";
    }

    if (!product && !formData.fichier) {
      newErrors.fichier = "Le fichier est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Création d'un FormData pour l'envoi des fichiers
      const data = new FormData();
      data.append("titre", formData.titre);
      data.append("description", formData.description);
      data.append("type", formData.type);
      data.append("prix", formData.prix);
      data.append("devise", formData.devise);

      if (formData.image) {
        data.append("image", formData.image);
      }

      if (formData.fichier) {
        data.append("fichier", formData.fichier);
      }

      await onSubmit(data);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
        <div>
          <label
            htmlFor="titre"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Titre
          </label>
          <input
            type="text"
            name="titre"
            id="titre"
            value={formData.titre}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
              errors.titre ? "border-red-500" : ""
            }`}
          />
          {errors.titre && (
            <p className="mt-1 text-sm text-red-600">{errors.titre}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
              errors.description ? "border-red-500" : ""
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Type de produit
          </label>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <div
              className={`flex items-center justify-center rounded-md border ${
                formData.type === "ebook"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-200"
              } px-3 py-2 text-sm font-medium cursor-pointer`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, type: "ebook" }))
              }
            >
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
              E-book
            </div>
            <div
              className={`flex items-center justify-center rounded-md border ${
                formData.type === "fichier_admin"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-30"
                  : "border-gray-300 dark:border-gray-600 dark:text-gray-200"
              } px-3 py-2 text-sm font-medium cursor-pointer`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, type: "fichier_admin" }))
              }
            >
              <ArchiveBoxIcon className="h-5 w-5 mr-2 text-purple-500" />
              Fichier admin
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="prix"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Prix (USD)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="prix"
              id="prix"
              step="0.01"
              min="0"
              value={formData.prix}
              onChange={handleChange}
              className={`pl-7 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
                errors.prix ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.prix && (
            <p className="mt-1 text-sm text-red-600">{errors.prix}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Image de couverture <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex items-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="h-32 w-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({ ...prev, image: null }));
                  }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 rounded-full p-1 text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center w-full">
                <label className="flex flex-col justify-center items-center w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 border-dashed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col justify-center items-center pt-5 pb-6">
                    <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 dark:text-gray-300" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        Cliquez pour télécharger
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG jusqu'à 2MB
                    </p>
                  </div>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Fichier à vendre{" "}
            {product ? "(optionnel si déjà téléchargé)" : "(requis)"}
          </label>
          <div className="mt-1">
            {fileName ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                  {fileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName("");
                    setFormData((prev) => ({ ...prev, fichier: null }));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center w-full">
                <label className="flex flex-col justify-center items-center w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 border-dashed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex flex-col justify-center items-center pt-5 pb-6">
                    <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 dark:text-gray-300" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">
                        Cliquez pour télécharger
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, ZIP, RAR jusqu'à 20MB
                    </p>
                  </div>
                  <input
                    type="file"
                    name="fichier"
                    accept=".pdf,.zip,.rar,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {errors.fichier && (
              <p className="mt-1 text-sm text-red-600">{errors.fichier}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
};

export default DigitalProductForm;
