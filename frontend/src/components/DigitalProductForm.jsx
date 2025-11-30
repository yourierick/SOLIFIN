import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  DocumentIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label
            htmlFor="titre"
            className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            <SparklesIcon className="h-4 w-4 mr-2 text-blue-500" />
            Titre du produit
          </label>
          <input
            type="text"
            name="titre"
            id="titre"
            value={formData.titre}
            onChange={handleChange}
            placeholder="Entrez un titre attrayant..."
            className={`mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200 ${
              errors.titre
                ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                : "hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          />
          <AnimatePresence>
            {errors.titre && (
              <motion.p
                className="mt-1 text-sm text-red-500 flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {errors.titre}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label
            htmlFor="description"
            className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            <DocumentIcon className="h-4 w-4 mr-2 text-green-500" />
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez votre produit en détail..."
            className={`mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 sm:text-sm dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200 resize-none ${
              errors.description
                ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                : "hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          />
          <AnimatePresence>
            {errors.description && (
              <motion.p
                className="mt-1 text-sm text-red-500 flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {errors.description}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <ArchiveBoxIcon className="h-4 w-4 mr-2 text-purple-500" />
            Type de produit
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center justify-center rounded-xl border-2 p-4 text-sm font-medium cursor-pointer transition-all duration-200 ${
                formData.type === "ebook"
                  ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg shadow-blue-500/25"
                  : "border-gray-200 dark:border-gray-600 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
              }`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, type: "ebook" }))
              }
            >
              {formData.type === "ebook" && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                </div>
              )}
              <DocumentTextIcon
                className={`h-6 w-6 mr-2 ${
                  formData.type === "ebook" ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <div className="text-left">
                <div
                  className={`font-semibold ${
                    formData.type === "ebook"
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  E-book
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Livre numérique
                </div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center justify-center rounded-xl border-2 p-4 text-sm font-medium cursor-pointer transition-all duration-200 ${
                formData.type === "fichier_admin"
                  ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg shadow-purple-500/25"
                  : "border-gray-200 dark:border-gray-600 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
              }`}
              onClick={() =>
                setFormData((prev) => ({ ...prev, type: "fichier_admin" }))
              }
            >
              {formData.type === "fichier_admin" && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon className="h-5 w-5 text-purple-500" />
                </div>
              )}
              <ArchiveBoxIcon
                className={`h-6 w-6 mr-2 ${
                  formData.type === "fichier_admin"
                    ? "text-purple-500"
                    : "text-gray-400"
                }`}
              />
              <div className="text-left">
                <div
                  className={`font-semibold ${
                    formData.type === "fichier_admin"
                      ? "text-purple-700 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Fichier admin
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Document administratif
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label
            htmlFor="prix"
            className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-2 text-yellow-500" />
            Prix (USD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 font-semibold text-lg">
                $
              </span>
            </div>
            <input
              type="number"
              name="prix"
              id="prix"
              step="0.01"
              min="0"
              value={formData.prix}
              onChange={handleChange}
              placeholder="0.00"
              className={`pl-10 block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 sm:text-sm dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200 text-lg font-semibold ${
                errors.prix
                  ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            />
          </div>
          <AnimatePresence>
            {errors.prix && (
              <motion.p
                className="mt-1 text-sm text-red-500 flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {errors.prix}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <PhotoIcon className="h-4 w-4 mr-2 text-indigo-500" />
            Image de couverture <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <AnimatePresence mode="wait">
              {imagePreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="h-40 w-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({ ...prev, image: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-2 text-white shadow-lg transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Image téléchargée
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full"
                >
                  <label className="flex flex-col justify-center items-center w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-300 group">
                    <div className="flex flex-col justify-center items-center text-center">
                      <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">
                        Cliquez pour télécharger
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {errors.image && (
              <motion.p
                className="text-sm text-red-500 flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {errors.image}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
            <DocumentIcon className="h-4 w-4 mr-2 text-orange-500" />
            Fichier à vendre{" "}
            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
              {product ? "(optionnel si déjà téléchargé)" : "(requis)"}
            </span>
          </label>
          <div className="relative">
            <AnimatePresence mode="wait">
              {fileName ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fichier sélectionné
                        </p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setFileName("");
                        setFormData((prev) => ({ ...prev, fichier: null }));
                      }}
                      className="ml-3 flex-shrink-0 bg-red-500 hover:bg-red-600 rounded-full p-2 text-white shadow-md transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-file"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full"
                >
                  <label className="flex flex-col justify-center items-center w-full h-40 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800 cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/20 dark:hover:to-amber-900/20 transition-all duration-300 group">
                    <div className="flex flex-col justify-center items-center text-center">
                      <ArrowUpTrayIcon className="h-12 w-12 text-orange-400 dark:text-orange-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors duration-300">
                        Cliquez pour télécharger
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {errors.fichier && (
              <motion.p
                className="text-sm text-red-500 flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {errors.fichier}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div
        className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default DigitalProductForm;
