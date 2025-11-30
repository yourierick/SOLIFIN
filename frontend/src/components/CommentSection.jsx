import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  PaperAirplaneIcon, 
  TrashIcon, 
  ArrowUturnLeftIcon 
} from '@heroicons/react/24/outline';

/**
 * Composant pour afficher et gérer les commentaires d'une publication
 */
export default function CommentSection({ 
  publicationType, 
  publicationId,
  className = ''
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Déterminer les endpoints API en fonction du type de publication
  const getEndpoints = () => {
    switch (publicationType) {
      case 'advertisement':
        return {
          getComments: `/api/publicites/${publicationId}/comments`,
          addComment: `/api/publicites/${publicationId}/comment`,
          deleteComment: (commentId) => `/api/publicites/comments/${commentId}`
        };
      case 'jobOffer':
        return {
          getComments: `/api/offres-emploi/${publicationId}/comments`,
          addComment: `/api/offres-emploi/${publicationId}/comment`,
          deleteComment: (commentId) => `/api/offres-emploi/comments/${commentId}`
        };
      case 'businessOpportunity':
        return {
          getComments: `/api/opportunites-affaires/${publicationId}/comments`,
          addComment: `/api/opportunites-affaires/${publicationId}/comment`,
          deleteComment: (commentId) => `/api/opportunites-affaires/comments/${commentId}`
        };
      default:
        return {
          getComments: '',
          addComment: '',
          deleteComment: () => ''
        };
    }
  };

  const endpoints = getEndpoints();

  // Récupérer les commentaires
  const fetchComments = async () => {
    if (!publicationId || !endpoints.getComments) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(endpoints.getComments);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [publicationId, endpoints.getComments]);

  // Ajouter un commentaire
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !endpoints.addComment) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(endpoints.addComment, {
        content: newComment.trim(),
        parent_id: replyTo ? replyTo.id : null
      });

      if (response.data.success) {
        setNewComment('');
        setReplyTo(null);
        await fetchComments(); // Rafraîchir les commentaires
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Supprimer un commentaire
  const handleDeleteComment = async (commentId) => {
    if (!user || !endpoints.deleteComment) return;

    try {
      const response = await axios.delete(endpoints.deleteComment(commentId));
      if (response.data.success) {
        await fetchComments(); // Rafraîchir les commentaires
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  // Annuler la réponse
  const cancelReply = () => {
    setReplyTo(null);
  };

  // Démarrer une réponse à un commentaire
  const startReply = (comment) => {
    setReplyTo(comment);
    // Focus sur le champ de texte
    document.getElementById('comment-input').focus();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Commentaires</h3>
        
        {/* Formulaire de commentaire */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          {replyTo && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Réponse à {replyTo.user.name}
              </span>
              <button 
                type="button" 
                onClick={cancelReply}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="flex space-x-2">
            <input
              id="comment-input"
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              Envoyer
            </button>
          </div>
        </form>

        {/* Liste des commentaires */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 mr-2">
                      {comment.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {comment.user.name}
                        </h4>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                        {comment.content}
                      </p>
                      <div className="mt-1 flex space-x-2">
                        <button 
                          onClick={() => startReply(comment)}
                          className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center"
                        >
                          <ArrowUturnLeftIcon className="h-3 w-3 mr-1" />
                          Répondre
                        </button>
                        {(user && (user.id === comment.user_id || user.is_admin)) && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center"
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Réponses aux commentaires */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-10 mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 py-1">
                        <div className="flex justify-between">
                          <div className="flex items-start">
                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 mr-2 text-xs">
                              {reply.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-baseline">
                                <h4 className="font-medium text-gray-900 dark:text-white text-xs">
                                  {reply.user.name}
                                </h4>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">
                                {reply.content}
                              </p>
                              <div className="mt-1 flex space-x-2">
                                {(user && (user.id === reply.user_id || user.is_admin)) && (
                                  <button 
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 flex items-center"
                                  >
                                    <TrashIcon className="h-3 w-3 mr-1" />
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
