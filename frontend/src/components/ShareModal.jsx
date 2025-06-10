import React, { useState } from 'react';
import { XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

/**
 * Modal pour partager une publication
 */
export default function ShareModal({ 
  isOpen, 
  onClose, 
  publicationType, 
  publicationId, 
  publicationTitle 
}) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Déterminer l'endpoint API en fonction du type de publication
  const getShareEndpoint = () => {
    switch (publicationType) {
      case 'advertisement':
        return `/api/publicites/${publicationId}/share`;
      case 'jobOffer':
        return `/api/offres-emploi/${publicationId}/share`;
      case 'businessOpportunity':
        return `/api/opportunites-affaires/${publicationId}/share`;
      default:
        return '';
    }
  };

  const shareEndpoint = getShareEndpoint();

  // Partager la publication
  const handleShare = async (e) => {
    e.preventDefault();
    if (!user || !shareEndpoint) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(shareEndpoint, {
        comment: comment.trim()
      });

      if (response.data.success) {
        setShareSuccess(true);
        setTimeout(() => {
          onClose();
          setShareSuccess(false);
          setComment('');
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur lors du partage de la publication:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Partager cette publication
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {shareSuccess ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Publication partagée avec succès !
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleShare}>
                    <div className="mt-2">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {publicationTitle}
                        </h4>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ajouter un commentaire (optionnel)
                        </label>
                        <textarea
                          id="comment"
                          rows="3"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Partagez votre avis sur cette publication..."
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Ce partage sera visible sur votre profil
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Partage en cours...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <ShareIcon className="h-4 w-4 mr-2" />
                              Partager
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
