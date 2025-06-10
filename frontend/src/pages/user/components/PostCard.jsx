import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  ShareIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  BriefcaseIcon,
  LightBulbIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  NewspaperIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

export default function PostCard({
  post,
  onLike,
  onComment,
  onDeleteComment,
  onShare,
  onViewDetails,
  isDarkMode,
}) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const commentInputRef = useRef(null);
  
  // Préparer les éléments média pour le carrousel
  useEffect(() => {
    const items = [];
    
    // Vérifier si l'image principale est déjà incluse dans les images
    let mainImageIncluded = false;
    
    // Ajouter les images s'il y en a
    if (post.images && post.images.length > 0) {
      post.images.forEach((image, index) => {
        // Vérifier si cette image est l'image principale
        if (post.image_url && image.url === post.image_url) {
          mainImageIncluded = true;
        }
        
        items.push({
          type: 'image',
          url: image.url,
          alt: `Image ${index + 1}`
        });
      });
    }
    
    // Ajouter l'image principale seulement si elle n'est pas déjà incluse dans les images
    if (post.image_url && !mainImageIncluded) {
      // Ajouter au début du tableau
      items.unshift({
        type: 'image',
        url: post.image_url,
        alt: 'Image principale'
      });
    }
    
    // Vérifier si la vidéo principale est déjà incluse dans les vidéos
    let mainVideoIncluded = false;
    
    // Ajouter les vidéos s'il y en a
    if (post.videos && post.videos.length > 0) {
      post.videos.forEach((video, index) => {
        // Vérifier si cette vidéo est la vidéo principale
        if (post.video_url && video.url === post.video_url) {
          mainVideoIncluded = true;
        }
        
        items.push({
          type: 'video',
          url: video.url,
          isYoutube: video.url.includes('youtube'),
          alt: `Vidéo ${index + 1}`
        });
      });
    }
    
    // Ajouter la vidéo principale seulement si elle n'est pas déjà incluse dans les vidéos
    if (post.video_url && !mainVideoIncluded) {
      items.push({
        type: 'video',
        url: post.video_url,
        isYoutube: post.video_url.includes('youtube'),
        alt: 'Vidéo principale'
      });
    }
    
    setMediaItems(items);
  }, [post]);

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy à HH:mm", { locale: fr });
  };
  
  // Navigation dans le carrousel de médias
  const nextMedia = () => {
    if (mediaItems.length > 1) {
      setCurrentMediaIndex((prevIndex) =>
        prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevMedia = () => {
    if (mediaItems.length > 1) {
      setCurrentMediaIndex((prevIndex) =>
        prevIndex === 0 ? mediaItems.length - 1 : prevIndex - 1
      );
    }
  };

  // Gérer la soumission d'un commentaire
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await onComment(post.id, comment, post.type);
      setComment('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du commentaire:', err);
    }
  };

  // Activer le mode commentaire
  const activateCommentMode = () => {
    setIsCommenting(true);
    setShowComments(true); // Afficher les commentaires quand l'utilisateur veut commenter
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  // Tronquer le texte s'il est trop long
  const truncateText = (text, maxLength = 300) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Afficher l'icône appropriée selon le type de post
  const renderTypeIcon = () => {
    switch (post.type) {
      case 'offres-emploi':
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      case 'opportunites-affaires':
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <NewspaperIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Afficher les informations spécifiques selon le type de post
  const renderTypeSpecificInfo = () => {
    if (post.type === 'offres-emploi') {
      return (
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {post.company_name && (
            <div className="flex items-center mb-1">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              <span>{post.company_name}</span>
            </div>
          )}
          {post.location && (
            <div className="flex items-center mb-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{post.location}</span>
            </div>
          )}
          {post.salary_range && (
            <div className="flex items-center mb-1">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span>{post.salary_range}</span>
            </div>
          )}
        </div>
      );
    } else if (post.type === 'opportunites-affaires') {
      return (
        <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {post.investment_amount && (
            <div className="flex items-center mb-1">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span>Investissement: {post.investment_amount}</span>
            </div>
          )}
          {post.sector && (
            <div className="flex items-center mb-1">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              <span>Secteur: {post.sector}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`mb-6 rounded-xl shadow-sm overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
    >

      {/* En-tête du post */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center space-x-3">
          {post.user?.picture_url ? (
            <img
              src={post.user.picture_url}
              alt={post.user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                {post.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {post.user?.name || 'Utilisateur'}
              </h3>
              {renderTypeIcon()}
            </div>
            <div className="flex items-center">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatDate(post.created_at)}
              </p>
              {post.status === 'pending' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  En attente
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            className={`p-1 rounded-full ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <EllipsisHorizontalIcon className="h-6 w-6" />
          </button>
          
          {/* Menu d'options */}
          <AnimatePresence>
            {isOptionsMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                } ring-1 ring-black ring-opacity-5`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      onViewDetails(post.id, post.type);
                      setIsOptionsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Voir les détails
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Contenu du post */}
      <div className="px-4 pb-2">
        {post.title && (
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {post.title}
          </h2>
        )}
        <p className={`whitespace-pre-line ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {truncateText(post.content)}
        </p>
        {post.content.length > 300 && (
          <button
            onClick={onViewDetails}
            className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
          >
            Voir plus
          </button>
        )}
        
        {renderTypeSpecificInfo()}
        
        {/* Carrousel de médias (images et vidéos) */}
        {mediaItems.length > 0 && (
          <div className="mt-3 relative">
            {/* Icône WhatsApp flottante */}
            {post.user?.phone && (
              <a
                href={`https://wa.me/${post.user.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 z-20 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110"
                title="Contacter via WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            )}
            
            {/* Affichage du média actuel */}
            <div className="relative overflow-hidden rounded-lg">
              {mediaItems[currentMediaIndex]?.type === 'image' ? (
                <img
                  src={mediaItems[currentMediaIndex].url}
                  alt={mediaItems[currentMediaIndex].alt || `Média ${currentMediaIndex + 1}`}
                  className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
                  onClick={onViewDetails}
                />
              ) : mediaItems[currentMediaIndex]?.type === 'video' && (
                <div className="relative pt-[56.25%]">
                  {mediaItems[currentMediaIndex].isYoutube ? (
                    <iframe
                      src={mediaItems[currentMediaIndex].url.includes('watch?v=') 
                        ? mediaItems[currentMediaIndex].url.replace('watch?v=', 'embed/') 
                        : mediaItems[currentMediaIndex].url}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg w-full h-full absolute top-0 left-0"
                      title="Vidéo"
                    ></iframe>
                  ) : (
                    <video 
                      controls 
                      className="rounded-lg w-full h-full absolute top-0 left-0"
                      src={mediaItems[currentMediaIndex].url}
                    >
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  )}
                </div>
              )}
              
              {/* Étiquette indiquant le type de média */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs font-medium px-2 py-1 rounded z-10">
                {mediaItems[currentMediaIndex]?.type === 'image' ? 'Image' : 'Vidéo'} {currentMediaIndex + 1}/{mediaItems.length}
              </div>
            </div>
            
            {/* Boutons de navigation du carrousel */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-all z-10"
                  aria-label="Média précédent"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-all z-10"
                  aria-label="Média suivant"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </>
            )}
            
            {/* Indicateurs de position dans le carrousel */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full ${index === currentMediaIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                    aria-label={`Aller au média ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Lien externe et bouton WhatsApp */}
        {post.external_link && (
          <div className="mt-3 flex justify-end space-x-2">
            {/* Bouton En savoir plus */}
            <a
              href={post.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium ${
                isDarkMode
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
              En savoir plus
            </a>
            
            {/* Bouton WhatsApp */}
            {post.user?.phone && !post.images?.length && !post.video_url && (
              <a
                href={`https://wa.me/${post.user.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                title="Contacter via WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 mr-2">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        )}
        

      </div>
      
      {/* Compteurs */}
      <div className={`px-4 py-2 flex justify-between text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          {post.likes_count > 0 && (
            <span>{post.likes_count} {post.likes_count === 1 ? 'j\'aime' : 'j\'aimes'}</span>
          )}
        </div>
        <div className="flex space-x-4">
          {post.comments_count > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`hover:underline focus:outline-none ${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-700'}`}
            >
              {showComments ? 'Masquer les commentaires' : `${post.comments_count} ${post.comments_count === 1 ? 'commentaire' : 'commentaires'}`}
            </button>
          )}
          {post.shares_count > 0 && (
            <span>{post.shares_count} {post.shares_count === 1 ? 'partage' : 'partages'}</span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className={`px-4 py-2 flex border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => onLike(post.id, post.type)}
          className={`flex items-center justify-center flex-1 py-2 rounded-lg ${
            isDarkMode
              ? 'hover:bg-gray-700'
              : 'hover:bg-gray-100'
          } ${
            post.is_liked
              ? 'text-primary-500'
              : isDarkMode
                ? 'text-gray-400'
                : 'text-gray-500'
          }`}
        >
          {post.is_liked ? (
            <HeartIconSolid className="h-5 w-5 mr-2" />
          ) : (
            <HeartIcon className="h-5 w-5 mr-2" />
          )}
          <span>J'aime</span>
        </button>
        <button
          onClick={activateCommentMode}
          className={`flex items-center justify-center flex-1 py-2 rounded-lg ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
          <span>Commenter</span>
        </button>
        <div className="relative flex-1">
          <button
            onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
            className={`flex items-center justify-center w-full py-2 rounded-lg ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ShareIcon className="h-5 w-5 mr-2" />
            <span>Partager</span>
          </button>
          
          {/* Menu de partage */}
          <AnimatePresence>
            {isShareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 rounded-md shadow-lg z-10 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                } ring-1 ring-black ring-opacity-5`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      onShare(post.type, post.id, 'facebook');
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.id, 'twitter');
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Twitter
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.id, 'linkedin');
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.id, 'whatsapp');
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-300 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Le bouton d'affichage/masquage des commentaires a été déplacé dans la section des compteurs */}
      
      {/* Section commentaires */}
      <AnimatePresence>
        {(isCommenting || (showComments && post.comments && post.comments.length > 0)) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            {/* Formulaire de commentaire */}
            <form onSubmit={handleSubmitComment} className="flex items-center mb-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Photo de profil"
                  className="h-8 w-8 rounded-full object-cover mr-2"
                />
              ) : (
                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className={`w-full py-2 px-3 pr-10 rounded-full ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200'
                  } border focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                    comment.trim()
                      ? isDarkMode
                        ? 'text-primary-400 hover:bg-gray-600'
                        : 'text-primary-600 hover:bg-gray-200'
                      : isDarkMode
                        ? 'text-gray-500'
                        : 'text-gray-400'
                  }`}
                >
                  <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
                </button>
              </div>
            </form>
            
            {/* Liste des commentaires */}
            {showComments && post.comments && post.comments.length > 0 && (
              <div className="space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex">
                    {comment.user?.profile_picture ? (
                      <img
                        src={comment.user.profile_picture}
                        alt={comment.user.name}
                        className="h-8 w-8 rounded-full object-cover mr-2 flex-shrink-0"
                      />
                    ) : (
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                          {comment.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={`rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {comment.user?.name || 'Utilisateur'}
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center mt-1 text-xs space-x-3">
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.likes_count > 0 && (
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {comment.likes_count} {comment.likes_count === 1 ? 'j\'aime' : 'j\'aimes'}
                          </span>
                        )}
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => onDeleteComment(comment.id, post.id, post.type)}
                            className={`font-medium ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-red-400'
                                : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {post.comments_count > post.comments.length && (
                  <button
                    onClick={onViewDetails}
                    className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`}
                  >
                    Voir tous les {post.comments_count} commentaires
                  </button>
                )}
                
                {/* Le bouton de masquage des commentaires a été déplacé dans la section des compteurs */}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}