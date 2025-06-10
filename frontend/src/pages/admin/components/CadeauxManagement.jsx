import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CadeauFormModal from "./CadeauFormModal";

/**
 * Composant pour la gestion des cadeaux (jetons Esengo)
 * Permet d'afficher, ajouter, modifier et supprimer des cadeaux
 */
const CadeauxManagement = () => {
  const { isDarkMode } = useTheme();
  const [cadeaux, setCadeaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCadeau, setCurrentCadeau] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cadeauToDelete, setCadeauToDelete] = useState(null);

  // Couleurs pour le thème
  const themeColors = {
    bg: isDarkMode ? "bg-[#1f2937]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100",
    card: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    input: isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900",
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    buttonSecondary: isDarkMode
      ? "bg-gray-700 hover:bg-gray-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };

  useEffect(() => {
    fetchCadeaux();
  }, []);

  // Récupérer la liste des cadeaux
  const fetchCadeaux = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/admin/cadeaux");
      if (response.data.success) {
        setCadeaux(response.data.cadeaux);
      } else {
        setError("Erreur lors de la récupération des cadeaux");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error("Erreur lors de la récupération des cadeaux:", err);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal pour ajouter un cadeau
  const handleAddCadeau = () => {
    setCurrentCadeau(null);
    setModalOpen(true);
  };

  // Ouvrir le modal pour modifier un cadeau
  const handleEditCadeau = (cadeau) => {
    setCurrentCadeau(cadeau);
    setModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentCadeau(null);
  };

  // Ouvrir le modal de confirmation de suppression
  const handleDeleteCadeau = (cadeau) => {
    setCadeauToDelete(cadeau);
    setDeleteModalOpen(true);
  };

  // Fermer le modal de confirmation de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setCadeauToDelete(null);
  };

  // Confirmer et exécuter la suppression d'un cadeau
  const confirmDeleteCadeau = async () => {
    if (!cadeauToDelete) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`/api/admin/cadeaux/${cadeauToDelete.id}`);
      
      if (response.data.success) {
        toast.success("Cadeau supprimé avec succès");
        fetchCadeaux();
      } else {
        toast.error(response.data.message || "Erreur lors de la suppression du cadeau");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du cadeau:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la suppression du cadeau");
    } finally {
      setLoading(false);
      handleCloseDeleteModal();
    }
  };

  // Afficher un spinner pendant le chargement
  if (loading && cadeaux?.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`${themeColors.bg} ${themeColors.text} p-6 rounded-lg shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <GiftIcon className="h-6 w-6 mr-2 text-primary-600" />
          Gestion des cadeaux (Jetons Esengo)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchCadeaux}
            className={`${themeColors.buttonSecondary} px-3 py-2 rounded-md flex items-center`}
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Actualiser
          </button>
          <button
            onClick={handleAddCadeau}
            className={`${themeColors.button} px-3 py-2 rounded-md flex items-center`}
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Ajouter un cadeau
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className={`min-w-full ${themeColors.border} border`}>
          <thead>
            <tr className={`${themeColors.card}`}>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Pack
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Image
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Nom
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Valeur
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Probabilité
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Stock
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Statut
              </th>
              <th
                className={`px-4 py-3 ${themeColors.border} border text-left`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cadeaux?.map((cadeau) => (
              <tr key={cadeau.id} className={`${themeColors.hover}`}>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.pack.name}
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.image_url ? (
                    <img
                      src={cadeau.image_url}
                      alt={cadeau.nom}
                      className="h-12 w-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                      <GiftIcon className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.nom}
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.valeur}$
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.probabilite}%
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  {cadeau.stock}
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      cadeau.actif
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {cadeau.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className={`px-4 py-3 ${themeColors.border} border`}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCadeau(cadeau)}
                      className="p-1 rounded-md text-blue-600 hover:bg-blue-100"
                      title="Modifier"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCadeau(cadeau)}
                      className="p-1 rounded-md text-red-600 hover:bg-red-100"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {cadeaux?.length === 0 && !loading && (
              <tr>
                <td
                  colSpan="7"
                  className={`px-4 py-3 ${themeColors.border} border text-center`}
                >
                  Aucun cadeau trouvé. Ajoutez-en un nouveau !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter/modifier un cadeau */}
      <CadeauFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        cadeau={currentCadeau}
      />

      {/* Modal de confirmation de suppression */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity backdrop-blur-sm bg-white/30 dark:bg-black/30"
              onClick={handleCloseDeleteModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div
              className={`inline-block align-bottom ${themeColors.bg} rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
            >
              <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${themeColors.bg}`}>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className={`text-lg leading-6 font-medium ${themeColors.text}`}>
                      Confirmer la suppression
                    </h3>
                    <div className="mt-2">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Êtes-vous sûr de vouloir supprimer le cadeau <strong>"{cadeauToDelete?.nom}"</strong> ?
                        Cette action est irréversible et supprimera définitivement ce cadeau du système.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${themeColors.bg}`}>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteCadeau}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${themeColors.border} shadow-sm px-4 py-2 ${themeColors.buttonSecondary} text-base font-medium sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={handleCloseDeleteModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadeauxManagement;
