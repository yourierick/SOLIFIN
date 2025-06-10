import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Notification from '../../components/Notification';

export default function CategoryList({ categories, onUpdate, isDarkMode }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Fonction pour ajouter une catégorie
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    
    setLoading(true);
    try {
      await axios.post('/api/admin/faq/categories', { name: newCategory });
      toast.success('Catégorie ajoutée avec succès');
      Notification.success('Catégorie ajoutée avec succès');
      setNewCategory('');
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
      Notification.error('Erreur lors de l\'ajout de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour modifier une catégorie
  const updateCategory = async (id) => {
    if (!editValue.trim()) return;
    
    setLoading(true);
    try {
      await axios.put(`/api/admin/faq/categories/${id}`, { name: editValue });
      toast.success('Catégorie modifiée avec succès');
      Notification.success('Catégorie modifiée avec succès');
      setEditingCategory(null);
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
      toast.error('Erreur lors de la modification de la catégorie');
      Notification.error('Erreur lors de la modification de la catégorie');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une catégorie
  const deleteCategory = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Toutes les FAQ associées seront décatégorisées.')) {
      setLoading(true);
      try {
        await axios.delete(`/api/admin/faq/categories/${id}`);
        toast.success('Catégorie supprimée avec succès');
        Notification.success('Catégorie supprimée avec succès');
        onUpdate();
      } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie:', error);
        toast.error('Erreur lors de la suppression de la catégorie');
        Notification.error('Erreur lors de la suppression de la catégorie');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Catégories de FAQ</h2>
      </div>

      {/* Formulaire d'ajout */}
      <div className={`p-4 rounded-lg shadow mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-medium mb-3">Ajouter une catégorie</h3>
        <div className="flex">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nom de la catégorie"
            className={`flex-grow p-2 border rounded-l-md ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <button 
            onClick={addCategory}
            disabled={loading || !newCategory.trim()}
            className={`px-4 py-2 rounded-r-md ${
              isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            } ${(loading || !newCategory.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Liste des catégories */}
      <div className={`overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Nombre de FAQ
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <motion.tr 
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {category.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingCategory === category.id ? (
                    <div className="flex">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className={`flex-grow p-1 border rounded-md ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <button 
                        onClick={() => updateCategory(category.id)}
                        disabled={loading || !editValue.trim()}
                        className="ml-2 text-green-500 hover:text-green-700"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => setEditingCategory(null)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    category.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {category.faqs_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingCategory !== category.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingCategory(category.id);
                          setEditValue(category.name);
                        }}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </motion.tr>
            ))}
            
            {categories.length === 0 && (
              <tr className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                <td colSpan="4" className="px-6 py-4 text-center text-sm font-medium">
                  Aucune catégorie trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
