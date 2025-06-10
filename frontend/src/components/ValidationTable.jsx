/**
 * ValidationTable.jsx - Table de validation de contenu
 * 
 * Composant de table générique pour la validation de différents types de contenu
 * (annonces, offres d'emploi, opportunités). Permet aux administrateurs de
 * visualiser, filtrer et modérer le contenu.
 * 
 * Fonctionnalités :
 * - Affichage tabulaire des contenus
 * - Filtrage multi-critères
 * - Actions de modération
 * - Pagination
 * - Tri des colonnes
 * 
 * Colonnes typiques :
 * - ID
 * - Titre
 * - Auteur
 * - Date de création
 * - Statut
 * - Actions
 * 
 * Actions disponibles :
 * - Approuver
 * - Rejeter
 * - Mettre en attente
 * - Voir les détails
 * - Supprimer
 * 
 * Filtres :
 * - Par statut
 * - Par date
 * - Par auteur
 * - Par type
 * 
 * Props :
 * - data : Données à afficher
 * - columns : Configuration des colonnes
 * - onAction : Gestionnaire d'actions
 * - filters : Configuration des filtres
 */

import { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import Notification from '../components/Notification';

export default function ValidationTable({ data, columns, loading, onValidate, itemType }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [validationType, setValidationType] = useState(null);

  const handleValidationClick = (item, type) => {
    setSelectedItem(item);
    setValidationType(type);
    setFeedback('');
    setShowModal(true);
  };

  const handleValidationSubmit = async () => {
    await onValidate(selectedItem.id, validationType, feedback);
    setShowModal(false);
    setSelectedItem(null);
    setFeedback('');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Aucun élément à valider
                  </td>
                </tr>
              ) : (
                data.map((item, itemIdx) => (
                  <tr key={item.id} className={itemIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    {columns.map((column, columnIdx) => {
                      const value = column.accessor.split('.').reduce((obj, key) => obj?.[key], item);
                      return (
                        <td
                          key={columnIdx}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                        >
                          {column.cell ? column.cell(value) : value}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {item.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleValidationClick(item, 'approved')}
                            className="inline-flex items-center p-1 border border-transparent rounded-full text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleValidationClick(item, 'rejected')}
                            className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de validation */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    {validationType === 'approved' ? 'Approuver' : 'Rejeter'} {itemType}
                  </h3>
                  <div className="mt-2">
                    <textarea
                      rows={4}
                      className="shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      placeholder="Ajouter un commentaire (optionnel)"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:col-start-2 sm:text-sm ${
                    validationType === 'approved'
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  }`}
                  onClick={handleValidationSubmit}
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
