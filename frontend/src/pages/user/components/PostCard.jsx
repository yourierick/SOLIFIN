import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../../contexts/ChatContext";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  ShareIcon,
  PaperAirplaneIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  FaceSmileIcon,
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
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext";

// Fonctions d'aide pour les badges de type de post
const getPostTypeLabel = (type) => {
  switch (type) {
    case "offres-emploi":
      return "Offre d'emploi";
    case "opportunites-affaires":
      return "Opportunité d'affaires";
    default:
      return "Publication";
  }
};

const getPostTypeBadgeStyles = (type, isDark) => {
  switch (type) {
    case "offres-emploi":
      return isDark
        ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30"
        : "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
    case "opportunites-affaires":
      return isDark
        ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/30"
        : "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200";
    default:
      return isDark
        ? "bg-gray-600/40 text-gray-300 ring-1 ring-gray-500/30"
        : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
};

export default function PostCard({
  post,
  onLike,
  onComment,
  onDeleteComment,
  onShare,
  onViewDetails,
  isDarkMode,
  user,
}) {
  // Hook pour détecter si on est en mode mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    createChatRoom,
    setActiveRoom,
    setIsChatExpanded,
    fetchChatRooms,
    chatRooms,
  } = useChat();
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
  const commentInputRef = useRef(null);

  // États pour les filtres cachés par défaut
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Fonction pour ouvrir le chat avec l'auteur de la publication
  const handleOpenChat = async () => {
    if (post.user) {
      try {
        // Utiliser directement createChatRoom qui gère déjà la vérification d'existence
        const chatRoom = await createChatRoom(post.user.id);

        if (chatRoom) {
          // Définir cette salle comme salle active
          setActiveRoom(chatRoom);

          // Ouvrir automatiquement la fenêtre de chat
          setIsChatExpanded(true);

          // Rafraîchir la liste des salons pour s'assurer qu'elle est à jour
          await fetchChatRooms();
        }
      } catch (error) {
        console.error("Erreur lors de l'ouverture du chat:", error);
      }
    }
  };

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
          type: "image",
          url: image.url,
          alt: `Image ${index + 1}`,
        });
      });
    }

    // Ajouter l'image principale seulement si elle n'est pas déjà incluse dans les images
    if (post.image_url && !mainImageIncluded) {
      // Ajouter au début du tableau
      items.unshift({
        type: "image",
        url: post.image_url,
        alt: "Image principale",
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
          type: "video",
          url: video.url,
          isYoutube: video.url.includes("youtube"),
          alt: `Vidéo ${index + 1}`,
        });
      });
    }

    // Ajouter la vidéo principale seulement si elle n'est pas déjà incluse dans les vidéos
    if (post.video_url && !mainVideoIncluded) {
      items.push({
        type: "video",
        url: post.video_url,
        isYoutube: post.video_url.includes("youtube"),
        alt: "Vidéo principale",
      });
    }

    setMediaItems(items);
  }, [post]);

  // Formatage de la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
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
      setComment("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire:", err);
    }
  };

  // Gérer l'ajout d'un emoji au commentaire
  const handleEmojiClick = (emojiData) => {
    setComment((prev) => prev + emojiData.emoji);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
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
    return text.substring(0, maxLength) + "...";
  };

  // Afficher l'icône appropriée selon le type de post
  const renderTypeIcon = () => {
    switch (post.type) {
      case "offres-emploi":
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      case "opportunites-affaires":
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <NewspaperIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Afficher les informations spécifiques selon le type de post
  const renderTypeSpecificInfo = () => {
    if (post.type === "offres-emploi") {
      return (
        <div
          className={`mt-2 text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
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
    } else if (post.type === "opportunites-affaires") {
      return (
        <div
          className={`mt-2 text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
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
      className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl mb-2 sm:mb-3 ${
        isDarkMode
          ? "bg-gray-800 text-white border border-gray-700"
          : "bg-white text-gray-900 border border-gray-100"
      }`}
    >
      {/* En-tête du post */}
      <div
        className={`p-2 sm:p-4 flex justify-between items-start border-b ${
          isDarkMode ? "border-gray-700/50" : "border-gray-200/70"
        } relative`}
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Avatar de l'utilisateur avec animation au survol */}
          <div className="flex-shrink-0 group">
            {post.user?.picture_url ? (
              <img
                src={post.user.picture_url}
                alt={`${post.user.name || "Utilisateur"}`}
                className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-primary-500 ring-opacity-50 shadow-md transition-all duration-300 group-hover:ring-primary-400 group-hover:scale-105"
              />
            ) : (
              <div
                className={`h-10 w-10 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-700 group-hover:bg-gray-600"
                    : "bg-gray-100 group-hover:bg-gray-200"
                } ring-2 ${
                  isDarkMode ? "ring-primary-400" : "ring-primary-500"
                } ring-opacity-50`}
              >
                <span
                  className={`text-lg sm:text-xl font-bold ${
                    isDarkMode ? "text-primary-300" : "text-primary-600"
                  }`}
                >
                  {(post.user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs sm:text-base tracking-tight truncate">
              {post.user?.name || "Utilisateur"}
            </div>
            <div
              className={`text-xs flex items-center ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate">{formatDate(post.created_at)}</span>
            </div>
          </div>
          {post.status === "pending" && (
            <span
              className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isDarkMode
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-yellow-100 text-yellow-800"
              } shadow-sm`}
            >
              <ClockIcon className="h-3.5 w-3.5 mr-1.5" />
              En attente
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            className={`p-1 sm:p-1.5 rounded-full transition-all duration-200 ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
            aria-label="Options du post"
          >
            <EllipsisHorizontalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Menu d'options avec animation améliorée */}
          <AnimatePresence>
            {isOptionsMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                className={`absolute right-0 mt-2 w-48 sm:w-56 rounded-xl overflow-hidden shadow-lg z-10 backdrop-blur-sm ${
                  isDarkMode
                    ? "bg-gray-800/95 border border-gray-700"
                    : "bg-white/95 border border-gray-200"
                }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      onViewDetails(post.id, post.type);
                      setIsOptionsMenuOpen(false);
                    }}
                    className={`flex items-center w-full text-left px-4 py-3 text-sm transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-200 hover:bg-gray-700/70"
                        : "text-gray-700 hover:bg-gray-100/80"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Voir les détails
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Contenu du post */}
      <div className="px-1.5 sm:px-3 py-1.5 sm:py-2">
        {/* Badge de type de post */}
        <div className="flex items-center mb-1.5 sm:mb-2">
          <div
            className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getPostTypeBadgeStyles(
              post.type,
              isDarkMode
            )}`}
          >
            {renderTypeIcon()}
            <span className="ml-1 text-xs">{getPostTypeLabel(post.type)}</span>
          </div>
        </div>

        {/* Titre du post avec style moderne */}
        {post.title && (
          <h3
            className={`text-base sm:text-xl font-extrabold mb-1.5 sm:mb-2 ${
              isDarkMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-blue-400"
                : "text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600"
            }`}
          >
            {post.title}
          </h3>
        )}

        {/* Contenu textuel avec première lettre stylisée */}
        <div
          className={`mb-2 sm:mb-3 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          <div className="first-letter:text-lg sm:first-letter:text-2xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:leading-tight first-letter:mt-1 first-letter:text-primary-500">
            {post.content}
          </div>
        </div>

        {/* Informations spécifiques au type de post */}
        <div className="mb-2 sm:mb-3">{renderTypeSpecificInfo()}</div>

        {/* Carrousel de médias (images et vidéos) avec design moderne */}
        {mediaItems.length > 0 && (
          <div className="mt-2 sm:mt-3 relative">
            {/* Conteneur de média avec ombre et bordure */}
            <div
              className={`relative overflow-hidden rounded-xl shadow-lg ${
                isDarkMode
                  ? "shadow-gray-900/50 border border-gray-700/50"
                  : "shadow-gray-300/70 border border-gray-200/70"
              }`}
            >
              {/* Icône WhatsApp flottante avec animation améliorée */}
              {post.user?.phone && (
                <motion.a
                  href={`https://wa.me/${post.user.phone.replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 bg-green-600 hover:bg-green-700 text-white p-2 sm:p-2.5 rounded-full shadow-lg"
                  title="Contacter via WhatsApp"
                  whileHover={{ scale: 1.15, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </motion.a>
              )}

              {/* Affichage du média actuel avec effets */}
              <div className="relative overflow-hidden">
                {mediaItems[currentMediaIndex]?.type === "image" ? (
                  <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <img
                      src={mediaItems[currentMediaIndex].url}
                      alt={
                        mediaItems[currentMediaIndex].alt ||
                        `Média ${currentMediaIndex + 1}`
                      }
                      className="w-full h-auto object-cover cursor-pointer transition-all duration-500 group-hover:scale-105"
                      onClick={onViewDetails}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  mediaItems[currentMediaIndex]?.type === "video" && (
                    <div className="relative pt-[56.25%] bg-gray-900 shadow-inner">
                      {mediaItems[currentMediaIndex].isYoutube ? (
                        <iframe
                          src={
                            mediaItems[currentMediaIndex].url.includes(
                              "watch?v="
                            )
                              ? mediaItems[currentMediaIndex].url.replace(
                                  "watch?v=",
                                  "embed/"
                                )
                              : mediaItems[currentMediaIndex].url
                          }
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full absolute top-0 left-0"
                          title="Vidéo"
                          loading="lazy"
                        ></iframe>
                      ) : (
                        <video
                          controls
                          className="w-full h-full absolute top-0 left-0 focus:outline-none"
                          src={mediaItems[currentMediaIndex].url}
                          preload="metadata"
                        >
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      )}
                    </div>
                  )
                )}

                {/* Badge indiquant le type de média */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 backdrop-blur-md bg-black/50 text-white text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full z-10 flex items-center space-x-1 sm:space-x-1.5 shadow-lg">
                  {mediaItems[currentMediaIndex]?.type === "image" ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs">
                        {isMobile
                          ? `${currentMediaIndex + 1}/${mediaItems.length}`
                          : `Image ${currentMediaIndex + 1}/${
                              mediaItems.length
                            }`}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs">
                        {isMobile
                          ? `${currentMediaIndex + 1}/${mediaItems.length}`
                          : `Vidéo ${currentMediaIndex + 1}/${
                              mediaItems.length
                            }`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons de navigation du carrousel avec design moderne */}
            {mediaItems.length > 1 && (
              <>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia();
                  }}
                  className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 backdrop-blur-sm bg-black/40 text-white rounded-full p-1.5 sm:p-2.5 hover:bg-black/60 transition-all z-10 shadow-lg"
                  aria-label="Média précédent"
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia();
                  }}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 backdrop-blur-sm bg-black/40 text-white rounded-full p-1.5 sm:p-2.5 hover:bg-black/60 transition-all z-10 shadow-lg"
                  aria-label="Média suivant"
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              </>
            )}

            {/* Indicateurs de position dans le carrousel avec animation */}
            {mediaItems.length > 1 && (
              <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2 z-10">
                {mediaItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                    }}
                    className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                      index === currentMediaIndex
                        ? `w-4 sm:w-6 ${
                            isDarkMode ? "bg-primary-400" : "bg-primary-500"
                          }`
                        : `w-1 sm:w-1.5 ${
                            isDarkMode ? "bg-gray-600" : "bg-gray-300"
                          }`
                    }`}
                    aria-label={`Aller au média ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lien externe et bouton WhatsApp */}
        {post.external_link && (
          <div className="mt-1.5 sm:mt-2 flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-1.5 sm:space-y-0">
            {/* Bouton En savoir plus */}
            <a
              href={post.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium ${
                isDarkMode
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-primary-500 hover:bg-primary-600 text-white"
              }`}
            >
              <ArrowTopRightOnSquareIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{isMobile ? "Voir" : "En savoir plus"}</span>
            </a>

            {/* Bouton WhatsApp */}
            {post.user?.phone && !post.images?.length && !post.video_url && (
              <a
                href={`https://wa.me/${post.user.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 rounded-lg shadow-sm text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
                title="Contacter via WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>{isMobile ? "WA" : "WhatsApp"}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Compteurs */}
      <div
        className={`flex items-center justify-between px-1.5 sm:px-3 py-1.5 sm:py-2 ${
          isDarkMode
            ? "border-t border-b border-gray-700/50"
            : "border-t border-b border-gray-200/70"
        }`}
      >
        <div className="flex space-x-3 sm:space-x-4">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <HeartIconSolid
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  post.is_liked
                    ? "text-red-500"
                    : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              />
              {post.likes_count > 0 && (
                <span
                  className={`absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-medium ${
                    post.is_liked
                      ? "bg-red-100 text-red-600"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {post.likes_count > 99 ? "99+" : post.likes_count}
                </span>
              )}
            </div>
            <span
              className={`ml-1 sm:ml-1.5 text-xs sm:text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {post.likes_count || 0}
            </span>
          </motion.div>

          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <ChatBubbleLeftIcon
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  isDarkMode ? "text-blue-400" : "text-blue-500"
                }`}
              />
              {post.comments_count > 0 && (
                <span
                  className={`absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-medium ${
                    isDarkMode
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {post.comments_count > 99 ? "99+" : post.comments_count}
                </span>
              )}
            </div>
            <span
              className={`ml-1 sm:ml-1.5 text-xs sm:text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {post.comments_count || 0}
            </span>
          </motion.div>

          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <ShareIcon
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  isDarkMode ? "text-green-400" : "text-green-500"
                }`}
              />
              {post.shares_count > 0 && (
                <span
                  className={`absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-medium ${
                    isDarkMode
                      ? "bg-green-900/40 text-green-300"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {post.shares_count > 99 ? "99+" : post.shares_count}
                </span>
              )}
            </div>
            <span
              className={`ml-1 sm:ml-1.5 text-xs sm:text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {post.shares_count || 0}
            </span>
          </motion.div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {post.comments && post.comments.length > 0 && (
            <motion.button
              onClick={() => {
                if (showComments) {
                  // Reset visible comments count when hiding comments
                  setVisibleCommentsCount(5);
                }
                setShowComments(!showComments);
              }}
              className={`flex items-center text-xs font-medium ${
                isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              } transition-colors duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showComments ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span className="hidden sm:inline">Masquer</span>
                  <span className="sm:hidden">Moins</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    Voir les commentaires ({post.comments_count})
                  </span>
                  <span className="sm:hidden">{post.comments_count} com.</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={`px-1.5 sm:px-3 py-1 sm:py-1.5 flex border-t ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <button
          onClick={() => onLike(post.id, post.type)}
          className={`flex items-center justify-center flex-1 py-1 sm:py-1.5 rounded-lg ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          } ${
            post.is_liked
              ? "text-primary-500"
              : isDarkMode
              ? "text-gray-400"
              : "text-gray-500"
          }`}
        >
          {post.is_liked ? (
            <HeartIconSolid className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          ) : (
            <HeartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          )}
          <span className="text-xs">J'aime</span>
        </button>
        <button
          onClick={activateCommentMode}
          className={`flex items-center justify-center flex-1 py-1 sm:py-1.5 rounded-lg ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <ChatBubbleLeftIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="text-xs">Commenter</span>
        </button>
        {/* Afficher le bouton "Discuter" uniquement si l'utilisateur n'est pas l'auteur de la publication */}
        {user &&
          post.user &&
          user.id &&
          post.user.id &&
          user.id !== post.user.id && (
            <button
              onClick={handleOpenChat}
              className={`flex items-center justify-center flex-1 py-1.5 sm:py-2 rounded-lg ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-xs sm:text-sm">
                {isMobile ? "Chat" : "Discuter"}
              </span>
            </button>
          )}
        <div className="relative flex-1">
          <button
            onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
            className={`flex items-center justify-center w-full py-1 sm:py-1.5 rounded-lg ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <ShareIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs">Partager</span>
          </button>

          {/* Menu de partage */}
          <AnimatePresence>
            {isShareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ position: "absolute", right: "0", top: "-160px" }}
                className={`w-44 sm:w-48 rounded-md shadow-lg z-50 ${
                  isDarkMode ? "bg-gray-700" : "bg-white"
                } ring-1 ring-black ring-opacity-5`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      onShare(post.type, post.id, "facebook");
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.type, post.id, "twitter");
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    X/Twitter
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.type, post.id, "linkedin");
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      onShare(post.type, post.id, "whatsapp");
                      setIsShareMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600"
                        : "text-gray-700 hover:bg-gray-100"
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

      {/* Section commentaires avec design moderne et animations */}
      <AnimatePresence>
        {(isCommenting ||
          (showComments && post.comments && post.comments.length > 0)) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 border-t ${
              isDarkMode ? "border-gray-700/50" : "border-gray-200/70"
            }`}
          >
            {/* Formulaire de commentaire modernisé */}
            <form
              onSubmit={handleSubmitComment}
              className="flex items-center mb-2 sm:mb-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mr-2 sm:mr-3 flex-shrink-0"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt="Photo de profil"
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover shadow-md ${
                      isDarkMode
                        ? "ring-1 ring-gray-700"
                        : "ring-1 ring-gray-200"
                    }`}
                  />
                ) : (
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shadow-md ${
                      isDarkMode
                        ? "bg-gray-700 ring-1 ring-gray-600"
                        : "bg-gray-100 ring-1 ring-gray-200"
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </motion.div>

              <div className="flex-1 relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 pr-12 sm:pr-16 rounded-full text-xs shadow-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:bg-gray-650"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200 focus:bg-white"
                  } border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200`}
                />

                <div className="absolute right-1 sm:right-1.5 top-1/2 transform -translate-y-1/2 flex items-center space-x-0.5">
                  <motion.button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-0.5 sm:p-1 rounded-full ${
                      isDarkMode
                        ? "text-gray-300 hover:bg-gray-600 hover:text-yellow-300"
                        : "text-gray-500 hover:bg-gray-200 hover:text-yellow-500"
                    } transition-colors`}
                    aria-label="Ajouter un emoji"
                  >
                    <FaceSmileIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={!comment.trim()}
                    whileHover={comment.trim() ? { scale: 1.1 } : {}}
                    whileTap={comment.trim() ? { scale: 0.9 } : {}}
                    className={`p-0.5 sm:p-1 rounded-full ${
                      comment.trim()
                        ? isDarkMode
                          ? "text-primary-400 hover:bg-gray-600 hover:text-primary-300"
                          : "text-primary-600 hover:bg-gray-200 hover:text-primary-700"
                        : isDarkMode
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-400 cursor-not-allowed"
                    } transition-colors`}
                    aria-label="Envoyer le commentaire"
                  >
                    <PaperAirplaneIcon className="h-3 w-3 sm:h-4 sm:w-4 rotate-90" />
                  </motion.button>
                </div>

                {/* Emoji picker avec animation */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full right-0 mb-2 z-50"
                    >
                      <div
                        className={`p-2 rounded-lg shadow-xl border backdrop-blur-sm ${
                          isDarkMode
                            ? "bg-gray-800/95 border-gray-700"
                            : "bg-white/95 border-gray-200"
                        }`}
                      >
                        <motion.button
                          onClick={() => setShowEmojiPicker(false)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`absolute top-2 right-2 rounded-full p-1 z-10 ${
                            isDarkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                          }`}
                          aria-label="Fermer le sélecteur d'emoji"
                        >
                          <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </motion.button>
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          lazyLoadEmojis={true}
                          theme={isDarkMode ? "dark" : "light"}
                          width={isMobile ? 260 : 280}
                          height={isMobile ? 300 : 320}
                          searchPlaceHolder="Rechercher un emoji..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Liste des commentaires avec animations - chargement progressif */}
            {showComments && post.comments && post.comments.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                {post.comments
                  .slice(0, visibleCommentsCount)
                  .map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      className="flex group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex-shrink-0 mr-1.5 sm:mr-2"
                      >
                        {comment.user?.profile_picture ? (
                          <img
                            src={comment.user.profile_picture}
                            alt={comment.user.name}
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover shadow-md ${
                              isDarkMode
                                ? "ring-1 ring-gray-700"
                                : "ring-1 ring-gray-200"
                            }`}
                          />
                        ) : (
                          <div
                            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shadow-md ${
                              isDarkMode
                                ? "bg-gray-700 ring-1 ring-gray-600"
                                : "bg-gray-100 ring-1 ring-gray-200"
                            }`}
                          >
                            <span
                              className={`text-xs font-semibold ${
                                isDarkMode ? "text-white" : "text-gray-600"
                              }`}
                            >
                              {comment.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </motion.div>

                      <div className="flex-1">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm ${
                            isDarkMode
                              ? "bg-gray-700/80 hover:bg-gray-700"
                              : "bg-gray-100/90 hover:bg-gray-100"
                          } transition-colors duration-200`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`font-medium text-xs ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {comment.user?.name || "Utilisateur"}
                            </div>
                            <div
                              className={`text-xs flex items-center ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                              <span className="hidden sm:inline">
                                {formatDate(comment.created_at)}
                              </span>
                              <span className="sm:hidden">
                                {formatDate(comment.created_at).split(" ")[0]}
                              </span>
                            </div>
                          </div>
                          <p
                            className={`text-xs mt-1 break-words ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {comment.content}
                          </p>
                        </motion.div>

                        <div className="flex items-center mt-1 text-xs space-x-2 sm:space-x-3 px-1">
                          {user?.id === comment.user_id && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() =>
                                onDeleteComment(comment.id, post.id, post.type)
                              }
                              className={`flex items-center space-x-1 ${
                                isDarkMode
                                  ? "text-gray-400 hover:text-red-400"
                                  : "text-gray-500 hover:text-red-500"
                              } transition-colors duration-200`}
                            >
                              <XMarkIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="hidden sm:inline">
                                Supprimer
                              </span>
                              <span className="sm:hidden">×</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {/* Bouton pour charger plus de commentaires */}
                {post.comments &&
                  visibleCommentsCount < post.comments.length && (
                    <motion.button
                      onClick={() =>
                        setVisibleCommentsCount((prev) => prev + 5)
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`mt-2 sm:mt-3 text-xs font-medium flex items-center justify-center w-full py-1.5 sm:py-2 rounded-lg shadow-sm transition-all duration-200 ${
                        isDarkMode
                          ? "bg-gray-700/50 text-primary-400 hover:bg-gray-700 hover:text-primary-300"
                          : "bg-gray-100/70 text-primary-600 hover:bg-gray-100 hover:text-primary-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <span className="hidden sm:inline">
                        Afficher plus de commentaires
                      </span>
                      <span className="sm:hidden">Plus</span>
                    </motion.button>
                  )}

                {/* Bouton pour voir tous les commentaires si certains ne sont pas chargés */}
                {post.comments_count > post.comments.length && (
                  <motion.button
                    onClick={onViewDetails}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mt-2 sm:mt-3 text-xs font-medium flex items-center justify-center w-full py-1.5 sm:py-2 rounded-lg shadow-sm transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700/50 text-primary-400 hover:bg-gray-700 hover:text-primary-300"
                        : "bg-gray-100/70 text-primary-600 hover:bg-gray-100 hover:text-primary-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      Voir tous les {post.comments_count} commentaires
                    </span>
                    <span className="sm:hidden">
                      Voir {post.comments_count} com.
                    </span>
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
