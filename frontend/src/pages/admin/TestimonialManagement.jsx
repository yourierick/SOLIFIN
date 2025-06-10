import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Page de gestion des témoignages pour les administrateurs
 * Permet de visualiser, approuver, rejeter, mettre en avant et supprimer les témoignages
 */
const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    minRating: "",
    featured: "",
  });
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { isDarkMode } = useTheme();

  // Charger les témoignages avec pagination et filtres
  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);

      // Ajouter les filtres s'ils sont définis
      if (filters.status) params.append("status", filters.status);
      if (filters.minRating) params.append("min_rating", filters.minRating);
      if (filters.featured !== "") params.append("featured", filters.featured);

      const response = await axios.get(
        `/api/admin/testimonials?${params.toString()}`
      );

      if (response.data.success) {
        setTestimonials(response.data.testimonials.data);
        setTotalPages(
          Math.ceil(
            response.data.testimonials.total /
              response.data.testimonials.per_page
          )
        );
      } else {
        toast.error("Erreur lors du chargement des témoignages");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des témoignages:", error);
      toast.error("Erreur lors du chargement des témoignages");
    } finally {
      setLoading(false);
    }
  };

  // Charger les témoignages au chargement du composant et lorsque les filtres ou la page changent
  useEffect(() => {
    fetchTestimonials();
  }, [currentPage, filters]);

  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Réinitialiser à la première page lors du changement de filtre
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      status: "",
      minRating: "",
      featured: "",
    });
    setCurrentPage(1);
  };

  // Ouvrir le modal de détail pour un témoignage
  const openTestimonialDetail = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setModalOpen(true);
  };

  // Fermer le modal de détail
  const closeModal = () => {
    setModalOpen(false);
    setSelectedTestimonial(null);
  };

  // Approuver un témoignage
  const approveTestimonial = async (id) => {
    try {
      const response = await axios.post(
        `/api/admin/testimonials/${id}/approve`
      );

      if (response.data.success) {
        toast.success("Témoignage approuvé avec succès");
        fetchTestimonials(); // Recharger la liste des témoignages
        if (modalOpen) closeModal();
      } else {
        toast.error(
          response.data.message || "Erreur lors de l'approbation du témoignage"
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'approbation du témoignage:", error);
      toast.error("Erreur lors de l'approbation du témoignage");
    }
  };

  // Rejeter un témoignage
  const rejectTestimonial = async (id) => {
    try {
      const response = await axios.post(`/api/admin/testimonials/${id}/reject`);

      if (response.data.success) {
        toast.success("Témoignage rejeté avec succès");
        fetchTestimonials(); // Recharger la liste des témoignages
        if (modalOpen) closeModal();
      } else {
        toast.error(
          response.data.message || "Erreur lors du rejet du témoignage"
        );
      }
    } catch (error) {
      console.error("Erreur lors du rejet du témoignage:", error);
      toast.error("Erreur lors du rejet du témoignage");
    }
  };

  // Mettre en avant un témoignage
  const featureTestimonial = async (id) => {
    try {
      const response = await axios.post(
        `/api/admin/testimonials/${id}/feature`
      );

      if (response.data.success) {
        toast.success("Témoignage mis en avant avec succès");
        fetchTestimonials(); // Recharger la liste des témoignages
      } else {
        toast.error(
          response.data.message ||
            "Erreur lors de la mise en avant du témoignage"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise en avant du témoignage:", error);
      toast.error("Erreur lors de la mise en avant du témoignage");
    }
  };

  // Retirer la mise en avant d'un témoignage
  const unfeatureTestimonial = async (id) => {
    try {
      const response = await axios.post(
        `/api/admin/testimonials/${id}/unfeature`
      );

      if (response.data.success) {
        toast.success("Mise en avant du témoignage retirée avec succès");
        fetchTestimonials(); // Recharger la liste des témoignages
      } else {
        toast.error(
          response.data.message ||
            "Erreur lors du retrait de la mise en avant du témoignage"
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors du retrait de la mise en avant du témoignage:",
        error
      );
      toast.error("Erreur lors du retrait de la mise en avant du témoignage");
    }
  };

  // Supprimer un témoignage
  const deleteTestimonial = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce témoignage ?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/testimonials/${id}`);

      if (response.data.success) {
        toast.success("Témoignage supprimé avec succès");
        fetchTestimonials(); // Recharger la liste des témoignages
        if (modalOpen) closeModal();
      } else {
        toast.error(
          response.data.message || "Erreur lors de la suppression du témoignage"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du témoignage:", error);
      toast.error("Erreur lors de la suppression du témoignage");
    }
  };

  // Composant principal à compléter
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Gestion des témoignages
      </h1>

      {/* Section des filtres */}
      <div
        className={`p-3 mb-4 rounded-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-3 ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Filtres
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filtre par statut */}
          <div>
            <label
              htmlFor="status"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Statut
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={`w-full rounded-md ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>

          {/* Filtre par note minimale */}
          <div>
            <label
              htmlFor="minRating"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Note minimale
            </label>
            <select
              id="minRating"
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              className={`w-full rounded-md ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Toutes les notes</option>
              <option value="1">1 étoile et plus</option>
              <option value="2">2 étoiles et plus</option>
              <option value="3">3 étoiles et plus</option>
              <option value="4">4 étoiles et plus</option>
              <option value="5">5 étoiles</option>
            </select>
          </div>

          {/* Filtre par mise en avant */}
          <div>
            <label
              htmlFor="featured"
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Mise en avant
            </label>
            <select
              id="featured"
              name="featured"
              value={filters.featured}
              onChange={handleFilterChange}
              className={`w-full rounded-md ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Tous</option>
              <option value="1">Mis en avant</option>
              <option value="0">Non mis en avant</option>
            </select>
          </div>
        </div>

        {/* Bouton de réinitialisation des filtres */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            } transition-colors`}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Tableau des témoignages */}
      {loading ? (
        <div className="flex justify-center py-8">
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Chargement en cours...
          </p>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="flex justify-center py-8">
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Aucun témoignage ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div
          className={`overflow-x-auto rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Utilisateur
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Note
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Contenu
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {testimonials.map((testimonial) => (
                <tr
                  key={testimonial.id}
                  className={
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-white hover:bg-gray-50"
                  }
                >
                  {/* Utilisateur */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        {testimonial.user?.profile_picture ? (
                          <img
                            src={testimonial.user.profile_picture}
                            alt={testimonial.user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className={`text-lg ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {testimonial.user?.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {testimonial.user?.name || "Utilisateur inconnu"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.user?.email || ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Note */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({testimonial.rating}/5)
                      </span>
                    </div>
                  </td>

                  {/* Contenu */}
                  <td className="px-6 py-4">
                    <div
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      {testimonial.content.length > 20
                        ? `${testimonial.content.substring(0, 20)}...`
                        : testimonial.content}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        testimonial.status === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : testimonial.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                      }`}
                    >
                      {testimonial.status === "approved"
                        ? "Approuvé"
                        : testimonial.status === "rejected"
                        ? "Rejeté"
                        : "En attente"}
                    </span>
                    {testimonial.featured && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        Mis en avant
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(testimonial.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* Voir détails */}
                      <button
                        onClick={() => openTestimonialDetail(testimonial)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-full"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {/* Approuver */}
                      {testimonial.status !== "approved" && (
                        <button
                          onClick={() => approveTestimonial(testimonial.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Approuver"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Rejeter */}
                      {testimonial.status !== "rejected" && (
                        <button
                          onClick={() => rejectTestimonial(testimonial.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Rejeter"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Mettre en avant / Retirer mise en avant */}
                      {testimonial.status === "approved" && (
                        <button
                          onClick={() =>
                            testimonial.featured
                              ? unfeatureTestimonial(testimonial.id)
                              : featureTestimonial(testimonial.id)
                          }
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title={
                            testimonial.featured
                              ? "Retirer la mise en avant"
                              : "Mettre en avant"
                          }
                        >
                          <StarIcon className="h-5 w-5" />
                        </button>
                      )}

                      {/* Supprimer */}
                      <button
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && testimonials.length > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
              } ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Précédent
            </button>

            {/* Affichage des numéros de page */}
            {[...Array(totalPages)].map((_, i) => {
              const pageNumber = i + 1;
              // Afficher seulement les pages proches de la page courante
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNumber
                        ? isDarkMode
                          ? "bg-primary-600 text-white"
                          : "bg-primary-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                (pageNumber === currentPage - 2 && currentPage > 3) ||
                (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
              ) {
                // Afficher des points de suspension pour les pages non affichées
                return <span key={pageNumber}>...</span>;
              }
              return null;
            })}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Suivant
            </button>
          </nav>
        </div>
      )}

      {/* Modal de détail */}
      {modalOpen && selectedTestimonial && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            {/* Overlay avec effet de flou léger */}
            <div
              className="fixed inset-0 transition-all backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            ></div>

            {/* Modal */}
            <div
              className={`relative inline-block align-middle rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              {/* En-tête */}
              <div
                className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className={`text-lg leading-6 font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                      id="modal-headline"
                    >
                      Détail du témoignage
                    </h3>

                    <div className="mt-4">
                      {/* Informations utilisateur */}
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-4">
                            {selectedTestimonial.user?.profile_picture ? (
                              <img
                                src={selectedTestimonial.user.profile_picture}
                                alt={selectedTestimonial.user.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              <span
                                className={`text-xl ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {selectedTestimonial.user?.name?.charAt(0) ||
                                  "?"}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4
                              className={`text-md font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {selectedTestimonial.user?.name ||
                                "Utilisateur inconnu"}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedTestimonial.user?.email || ""}
                            </p>
                          </div>
                        </div>

                        {/* Date et statut */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Soumis le{" "}
                            {new Date(
                              selectedTestimonial.created_at
                            ).toLocaleDateString()}{" "}
                            à{" "}
                            {new Date(
                              selectedTestimonial.created_at
                            ).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                selectedTestimonial.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                  : selectedTestimonial.status === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                              }`}
                            >
                              {selectedTestimonial.status === "approved"
                                ? "Approuvé"
                                : selectedTestimonial.status === "rejected"
                                ? "Rejeté"
                                : "En attente"}
                            </span>
                            {selectedTestimonial.featured && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                Mis en avant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Note */}
                      <div className="mb-4">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Note
                        </label>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-6 w-6 ${
                                i < selectedTestimonial.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({selectedTestimonial.rating}/5)
                          </span>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="mb-4">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Témoignage
                        </label>
                        <div
                          className={`p-3 rounded-md ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-50"
                          }`}
                        >
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {selectedTestimonial.content}
                          </p>
                        </div>
                      </div>

                      {/* Informations complémentaires */}
                      {(selectedTestimonial.position ||
                        selectedTestimonial.company) && (
                        <div className="mb-4">
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Informations complémentaires
                          </label>
                          <div
                            className={`p-3 rounded-md ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-50"
                            }`}
                          >
                            {selectedTestimonial.position && (
                              <p
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-900"
                                }`}
                              >
                                <span className="font-medium">Position :</span>{" "}
                                {selectedTestimonial.position}
                              </p>
                            )}
                            {selectedTestimonial.company && (
                              <p
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-900"
                                }`}
                              >
                                <span className="font-medium">
                                  Entreprise :
                                </span>{" "}
                                {selectedTestimonial.company}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
                  isDarkMode
                    ? "bg-gray-800 border-t border-gray-700"
                    : "bg-gray-50 border-t border-gray-200"
                }`}
              >
                {/* Boutons d'action selon le statut */}
                {selectedTestimonial.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => approveTestimonial(selectedTestimonial.id)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Approuver
                  </button>
                )}

                {selectedTestimonial.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => rejectTestimonial(selectedTestimonial.id)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Rejeter
                  </button>
                )}

                {selectedTestimonial.status === "approved" && (
                  <button
                    type="button"
                    onClick={() =>
                      selectedTestimonial.featured
                        ? unfeatureTestimonial(selectedTestimonial.id)
                        : featureTestimonial(selectedTestimonial.id)
                    }
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {selectedTestimonial.featured
                      ? "Retirer la mise en avant"
                      : "Mettre en avant"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => deleteTestimonial(selectedTestimonial.id)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Supprimer
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;
