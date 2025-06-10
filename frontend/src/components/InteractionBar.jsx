import React, { useState, useEffect } from 'react';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  ShareIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour afficher et gérer les interactions (likes, commentaires, partages)
 */
export default function InteractionBar({ 
  publicationType, 
  publicationId, 
  onCommentClick,
  onShareClick,
  showCounts = true,
  className = ''
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Déterminer les endpoints API en fonction du type de publication
  const getEndpoints = () => {
    switch (publicationType) {
      case 'advertisement':
        return {
          like: `/api/publicites/${publicationId}/like`,
          checkLike: `/api/publicites/${publicationId}/check-like`,
          comments: `/api/publicites/${publicationId}/comments`,
          shares: `/api/publicites/${publicationId}/shares`
        };
      case 'jobOffer':
        return {
          like: `/api/offres-emploi/${publicationId}/like`,
          checkLike: `/api/offres-emploi/${publicationId}/check-like`,
          comments: `/api/offres-emploi/${publicationId}/comments`,
          shares: `/api/offres-emploi/${publicationId}/shares`
        };
      case 'businessOpportunity':
        return {
          like: `/api/opportunites-affaires/${publicationId}/like`,
          checkLike: `/api/opportunites-affaires/${publicationId}/check-like`,
          comments: `/api/opportunites-affaires/${publicationId}/comments`,
          shares: `/api/opportunites-affaires/${publicationId}/shares`
        };
      default:
        return {
          like: '',
          checkLike: '',
          comments: '',
          shares: ''
        };
    }
  };

  const endpoints = getEndpoints();

  // Vérifier si l'utilisateur a liké la publication et récupérer les compteurs
  useEffect(() => {
    const fetchInteractionData = async () => {
      if (!publicationId || !endpoints.checkLike) return;
      
      setIsLoading(true);
      try {
        // Vérifier si l'utilisateur a liké
        const likeResponse = await axios.get(endpoints.checkLike);
        if (likeResponse.data.success) {
          setLiked(likeResponse.data.liked);
          setLikesCount(likeResponse.data.likes_count);
        }

        // Récupérer le nombre de commentaires
        const commentsResponse = await axios.get(endpoints.comments);
        if (commentsResponse.data.success) {
          setCommentsCount(commentsResponse.data.comments_count);
        }

        // Récupérer le nombre de partages
        const sharesResponse = await axios.get(endpoints.shares);
        if (sharesResponse.data.success) {
          setSharesCount(sharesResponse.data.shares_count);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données d\'interaction:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInteractionData();
  }, [publicationId, endpoints.checkLike, endpoints.comments, endpoints.shares]);

  // Gérer le clic sur le bouton "J'aime"
  const handleLikeClick = async () => {
    if (!user || !endpoints.like) return;

    try {
      const response = await axios.post(endpoints.like);
      if (response.data.success) {
        setLiked(response.data.liked);
        setLikesCount(response.data.likes_count);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout/retrait du like:', error);
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <button 
        onClick={handleLikeClick}
        disabled={isLoading}
        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
      >
        {liked ? (
          <HeartIconSolid className="h-5 w-5 text-red-500" />
        ) : (
          <HeartIcon className="h-5 w-5" />
        )}
        {showCounts && (
          <span className="text-xs font-medium">{likesCount}</span>
        )}
      </button>

      <button 
        onClick={onCommentClick}
        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
      >
        <ChatBubbleLeftIcon className="h-5 w-5" />
        {showCounts && (
          <span className="text-xs font-medium">{commentsCount}</span>
        )}
      </button>

      <button 
        onClick={onShareClick}
        className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
      >
        <ShareIcon className="h-5 w-5" />
        {showCounts && (
          <span className="text-xs font-medium">{sharesCount}</span>
        )}
      </button>
    </div>
  );
}
