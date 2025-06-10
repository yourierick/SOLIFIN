import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Notification from '../../components/Notification';

export default function FaqList({ faqs, categories, onUpdate, isDarkMode, onEdit }) {
  // Nous utilisons maintenant la prop onEdit au lieu d'un état local
  
  // Fonction pour supprimer une FAQ
  const deleteFaq = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette FAQ ?')) {
      try {
        await axios.delete(`/api/admin/faqs/${id}`);
        toast.success('FAQ supprimée avec succès');
        Notification.success('FAQ supprimée avec succès');
        onUpdate(); // Rafraîchir la liste
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la FAQ');
        Notification.error('Erreur lors de la suppression de la FAQ');
      }
    }
  };

  // Fonction pour modifier l'ordre d'affichage
  const changeOrder = async (id, direction) => {
    try {
      await axios.put(`/api/admin/faqs/${id}/order`, { direction });
      toast.success('Ordre modifié avec succès');
      Notification.success('Ordre modifié avec succès');
      onUpdate(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur lors du changement d\'ordre:', error);
      toast.error('Erreur lors du changement d\'ordre');
      Notification.error('Erreur lors du changement d\'ordre');
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Liste des questions</h2>
        <button 
          onClick={() => onEdit({ question: '', answer: '', category_id: categories[0]?.id || null, is_published: true })}
          className={`flex items-center px-3 py-2 rounded-md ${
            isDarkMode 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter une question
        </button>
      </div>

      {/* Tableau des FAQ */}
      <div className={`overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Ordre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Question
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Catégorie
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Votes
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq) => (
              <motion.tr 
                key={faq.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <span>{faq.order}</span>
                    <div className="flex flex-col">
                      <button 
                        onClick={() => changeOrder(faq.id, 'up')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => changeOrder(faq.id, 'down')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="max-w-xs truncate">{faq.question}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {categories.find(cat => cat.id === faq.category_id)?.name || 'Non catégorisé'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="text-green-500">+{faq.upvotes || 0}</span> / 
                  <span className="text-red-500">-{faq.downvotes || 0}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(faq)}
                    className="text-blue-500 hover:text-blue-700 mr-3"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteFaq(faq.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
            
            {faqs.length === 0 && (
              <tr className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                <td colSpan="5" className="px-6 py-4 text-center text-sm font-medium">
                  Aucune FAQ trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal d'édition - à implémenter dans la prochaine étape */}
    </div>
  );
}
