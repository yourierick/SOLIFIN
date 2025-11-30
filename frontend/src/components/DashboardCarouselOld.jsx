import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCreative,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-creative";
import {
  LightBulbIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  StarIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardCarousel() {
  const { isDarkMode } = useTheme();
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [likedItems, setLikedItems] = useState(new Set());
  const [likesCount, setLikesCount] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Utiliser le nouvel endpoint unifié pour le carrousel
        const response = await axios.get("/api/dashboard/carousel");

        if (response.data.success) {
          // Transformer les publicités en format carousel
          const publicites = response.data.publicites.map((pub) => ({
            id: pub.id,
            type: "publicité",
            icon: MegaphoneIcon,
            title: pub.titre,
            description: pub.description
              ? pub.description.length > 120
                ? pub.description.substring(0, 120) + "..."
                : pub.description
              : "Aucune description",
            pageId: pub.page_id,
            userId: pub.user_id,
            color: "from-blue-400 to-blue-600",
            image: pub.image,
            created_at: pub.created_at,
            badge: "Promotion",
            badgeColor: "bg-blue-500",
            stats: { views: Math.floor(Math.random() * 1000) + 100 },
          }));

          // Transformer les offres d'emploi en format carousel
          const offresEmploi = response.data.offresEmploi.map((offre) => ({
            id: offre.id,
            type: "emploi",
            icon: BriefcaseIcon,
            title: offre.titre,
            description: offre.description
              ? offre.description.length > 120
                ? offre.description.substring(0, 120) + "..."
                : offre.description
              : "Aucune description",
            pageId: offre.page_id,
            userId: offre.user_id,
            color: "from-green-400 to-green-600",
            localisation: offre.localisation,
            type_contrat: offre.type_contrat,
            created_at: offre.created_at,
            badge: "Nouveau",
            badgeColor: "bg-green-500",
            stats: { applications: Math.floor(Math.random() * 50) + 5 },
          }));

          // Transformer les opportunités d'affaires en format carousel
          const opportunites = response.data.opportunitesAffaires.map(
            (oppo) => ({
              id: oppo.id,
              type: "opportunité",
              icon: LightBulbIcon,
              title: oppo.titre,
              description: oppo.description
                ? oppo.description.length > 120
                  ? oppo.description.substring(0, 120) + "..."
                  : oppo.description
                : "Aucune description",
              pageId: oppo.page_id,
              userId: oppo.user_id,
              color: "from-purple-400 to-purple-600",
              secteur: oppo.secteur,
              created_at: oppo.created_at,
              badge: "Tendance",
              badgeColor: "bg-purple-500",
              stats: { interest: Math.floor(Math.random() * 100) + 20 },
            })
          );

          // Combiner toutes les données et les mélanger
          const allItems = [...publicites, ...offresEmploi, ...opportunites];

          // Mélanger les éléments pour avoir une variété dans le carousel
          const shuffledItems = allItems.sort(() => 0.5 - Math.random());

          setCarouselItems(shuffledItems);
        } else {
          console.error(
            "Erreur lors du chargement des données du carousel:",
            response.data.message
          );
          setCarouselItems([]);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données du carousel:",
          error
        );
        // En cas d'erreur, utiliser des données par défaut
        setCarouselItems([
          {
            type: "publicité",
            icon: MegaphoneIcon,
            title: "Découvrez nos offres",
            description:
              "Explorez notre plateforme pour voir les dernières opportunités et promotions exclusives",
            color: "from-blue-400 to-blue-600",
            badge: "Promotion",
            badgeColor: "bg-blue-500",
            stats: { views: 856 },
          },
          {
            type: "opportunité",
            icon: LightBulbIcon,
            title: "Opportunités d'affaires",
            description:
              "Trouvez des partenaires et développez votre réseau professionnel avec des projets innovants",
            color: "from-purple-400 to-purple-600",
            badge: "Tendance",
            badgeColor: "bg-purple-500",
            stats: { interest: 67 },
          },
          {
            type: "emploi",
            icon: BriefcaseIcon,
            title: "Offres d'emploi",
            description:
              "Consultez les dernières offres d'emploi de notre réseau et donnez un coup d'accélérateur à votre carrière",
            color: "from-green-400 to-green-600",
            badge: "Nouveau",
            badgeColor: "bg-green-500",
            stats: { applications: 23 },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gérer l'interaction de like avec API
  const handleLike = async (item) => {
    try {
      const isLiked = likedItems.has(item.id);

      if (item.type === "publicité") {
        const endpoint = isLiked ? "unlike" : "like";
        await axios.post(`/api/publicites/${item.id}/${endpoint}`);
      } else if (item.type === "emploi") {
        await axios.post(`/api/offres-emploi/${item.id}/like`);
      } else if (item.type === "opportunité") {
        await axios.post(`/api/opportunites-affaires/${item.id}/like`);
      }

      // Mettre à jour l'état local
      const newLikedItems = new Set(likedItems);
      if (isLiked) {
        newLikedItems.delete(item.id);
        setLikesCount((prev) => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) - 1,
        }));
      } else {
        newLikedItems.add(item.id);
        setLikesCount((prev) => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) + 1,
        }));
      }
      setLikedItems(newLikedItems);
    } catch (error) {
      console.error("Erreur lors du like:", error);
    }
  };

  // Vérifier les likes existants
  const checkExistingLikes = async () => {
    for (const item of carouselItems) {
      try {
        let response;
        if (item.type === "publicité") {
          response = await axios.get(`/api/publicites/${item.id}/check-like`);
        } else if (item.type === "emploi") {
          response = await axios.get(
            `/api/offres-emploi/${item.id}/check-like`
          );
        } else if (item.type === "opportunité") {
          response = await axios.get(
            `/api/opportunites-affaires/${item.id}/check-like`
          );
        }

        if (response?.data?.liked) {
          setLikedItems((prev) => new Set(prev).add(item.id));
        }
        if (response?.data?.likesCount) {
          setLikesCount((prev) => ({
            ...prev,
            [item.id]: response.data.likesCount,
          }));
        }
      } catch (error) {
        console.error("Erreur vérification like:", error);
      }
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-500 border-t-transparent"></div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full h-16 w-16 border-4 border-violet-200 opacity-30"
          ></motion.div>
          <SparklesIcon className="absolute inset-0 m-auto h-6 w-6 text-violet-500 animate-pulse" />
        </motion.div>
      </div>
    );
  }

  // Si aucun élément n'est disponible, ne rien afficher
  if (!carouselItems.length) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header du carrousel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-center"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl"
          >
            <SparklesIcon className="h-7 w-7 text-white" />
          </motion.div>
          <div className="text-center">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Découvertes du jour
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              } mt-1`}
            >
              Les meilleures opportunités pour vous
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isDarkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {carouselItems.length} éléments
          </div>
        </div>
      </motion.div>

      <div className="flex justify-center">
        <div className="w-full">
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectCreative]}
            spaceBetween={16}
            slidesPerView={3}
            navigation
            pagination={{
              clickable: true,
              dynamicBullets: true,
              dynamicMainBullets: 3,
            }}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={carouselItems.length > 3}
            effect="coverflow"
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: false,
            }}
            speed={800}
            centeredSlides={true}
            centeredSlidesBounds={true}
            grabCursor={true}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 16,
                centeredSlides: true,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
                centeredSlides: true,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
                centeredSlides: true,
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 30,
                centeredSlides: true,
              },
            }}
            className="dashboard-carousel-modern"
          >
            {carouselItems.map((item, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  className="relative"
                >
                  <div
                    className={`relative h-96 rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 transform ${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    } ${
                      index === 1
                        ? "scale-110 shadow-2xl hover:shadow-3xl ring-4 ring-violet-500/20"
                        : "scale-95 shadow-lg hover:shadow-xl opacity-70 hover:opacity-90"
                    } border ${
                      isDarkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    {/* Fond avec dégradé animé */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 transition-all duration-1000`}
                    />

                    {/* Éléments décoratifs animés */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className={`absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-all duration-700 blur-xl`}
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, -5, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className={`absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-gradient-to-tl ${item.color} opacity-8 group-hover:opacity-15 transition-all duration-700 blur-xl`}
                    />

                    {/* Image de fond si disponible */}
                    {item.image && (
                      <div
                        className="absolute inset-0 opacity-8 group-hover:opacity-12 bg-cover bg-center transition-all duration-700"
                        style={{ backgroundImage: `url(${item.image})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className={`${item.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}
                      >
                        {item.badge}
                      </motion.div>
                    </div>

                    {/* Actions rapides */}
                    <AnimatePresence>
                      {hoveredIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="absolute top-4 right-4 z-20 flex flex-col space-y-2"
                        >
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleLike(index)}
                            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
                          >
                            {likedItems.has(index) ? (
                              <HeartIconSolid className="h-4 w-4 text-red-500" />
                            ) : (
                              <HeartIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSave(index)}
                            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
                          >
                            {savedItems.has(index) ? (
                              <BookmarkIconSolid className="h-4 w-4 text-blue-500" />
                            ) : (
                              <BookmarkIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
                          >
                            <ShareIcon className="h-4 w-4 text-gray-600" />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Contenu */}
                    <div className="relative h-full p-6 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} transform group-hover:scale-110 transition-all duration-700 shadow-lg group-hover:shadow-xl`}
                          >
                            <item.icon className="h-6 w-6 text-white" />
                          </motion.div>
                          <div>
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              {item.type.charAt(0).toUpperCase() +
                                item.type.slice(1)}
                            </span>
                            {item.created_at && (
                              <div
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-500" : "text-gray-400"
                                } flex items-center mt-1`}
                              >
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatDate(item.created_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.h3
                        animate={{ opacity: hoveredIndex === index ? 0.8 : 1 }}
                        className={`text-lg font-bold mb-3 line-clamp-2 group-hover:text-transparent bg-clip-text bg-gradient-to-r ${
                          item.color
                        } transition-all duration-700 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.title}
                      </motion.h3>

                      <p
                        className={`text-sm flex-grow line-clamp-3 leading-relaxed ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.description}
                      </p>

                      {/* Statistiques */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {item.stats?.views && (
                            <div
                              className={`flex items-center text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              <StarIcon className="h-3 w-3 mr-1" />
                              {item.stats.views}
                            </div>
                          )}
                          {item.stats?.applications && (
                            <div
                              className={`flex items-center text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              <BriefcaseIcon className="h-3 w-3 mr-1" />
                              {item.stats.applications}
                            </div>
                          )}
                          {item.stats?.interest && (
                            <div
                              className={`flex items-center text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              <HeartIcon className="h-3 w-3 mr-1" />
                              {item.stats.interest}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Informations supplémentaires */}
                      <div className="mt-3 space-y-1">
                        {item.type === "emploi" && item.type_contrat && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            } flex items-center`}
                          >
                            <BriefcaseIcon className="h-3 w-3 mr-1" />
                            {item.type_contrat}
                          </div>
                        )}
                        {item.type === "emploi" && item.localisation && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            } flex items-center`}
                          >
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {item.localisation}
                          </div>
                        )}
                        {item.type === "opportunité" && item.secteur && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            } flex items-center`}
                          >
                            <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                            {item.secteur}
                          </div>
                        )}
                      </div>

                      {/* Bouton d'action avec effet de survol */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent backdrop-blur-sm transition-all duration-700"
                      >
                        <motion.div
                          initial={{ scale: 0.8, y: 20 }}
                          animate={{
                            scale: hoveredIndex === index ? 1 : 0.8,
                            y: hoveredIndex === index ? 0 : 20,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${item.color} shadow-2xl hover:shadow-3xl`}
                        >
                          <Link
                            to={
                              item.pageId
                                ? `/dashboard/pages/${item.pageId}`
                                : item.userId
                                ? `/users/${item.userId}`
                                : "#"
                            }
                            className="inline-flex items-center text-sm font-bold text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Explorer cette opportunité
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                          </Link>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style>
        {`
          .dashboard-carousel-modern {
            padding: 20px 20px 80px 20px;
          }
          
          .dashboard-carousel-modern .swiper-slide {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .dashboard-carousel-modern .swiper-slide-active {
            z-index: 10;
          }
          
          .dashboard-carousel-modern .swiper-slide-prev,
          .dashboard-carousel-modern .swiper-slide-next {
            opacity: 0.8;
            transform: scale(0.9);
          }
          
          .dashboard-carousel-modern .swiper-pagination-bullet {
            background: ${isDarkMode ? "#60a5fa" : "#3b82f6"};
            opacity: 0.4;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            width: 12px;
            height: 12px;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          }
          
          .dashboard-carousel-modern .swiper-pagination-bullet-active {
            opacity: 1;
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            transform: scale(1.5);
            width: 14px;
            height: 14px;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
          }
          
          .dashboard-carousel-modern .swiper-button-next,
          .dashboard-carousel-modern .swiper-button-prev {
            color: ${
              isDarkMode ? "rgba(139, 92, 246, 0.9)" : "rgba(124, 58, 237, 0.9)"
            };
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: linear-gradient(135deg, 
              ${
                isDarkMode
                  ? "rgba(31, 41, 55, 0.95)"
                  : "rgba(255, 255, 255, 0.95)"
              }, 
              ${
                isDarkMode
                  ? "rgba(55, 65, 81, 0.95)"
                  : "rgba(249, 250, 251, 0.95)"
              }
            );
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(16px);
            border: 2px solid ${
              isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(124, 58, 237, 0.3)"
            };
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
            top: 50%;
            transform: translateY(-50%);
          }
          
          .dashboard-carousel-modern .swiper-button-next:after,
          .dashboard-carousel-modern .swiper-button-prev:after {
            font-size: 22px;
            font-weight: 700;
          }
          
          .dashboard-carousel-modern .swiper-button-next:hover,
          .dashboard-carousel-modern .swiper-button-prev:hover {
            transform: translateY(-50%) scale(1.1);
            background: linear-gradient(135deg, 
              ${
                isDarkMode
                  ? "rgba(55, 65, 81, 0.98)"
                  : "rgba(255, 255, 255, 0.98)"
              }, 
              ${
                isDarkMode
                  ? "rgba(75, 85, 99, 0.98)"
                  : "rgba(243, 244, 246, 0.98)"
              }
            );
            box-shadow: 0 12px 40px rgba(139, 92, 246, 0.3);
            border-color: ${
              isDarkMode ? "rgba(139, 92, 246, 0.5)" : "rgba(124, 58, 237, 0.5)"
            };
          }
          
          .dashboard-carousel-modern .swiper-button-disabled {
            opacity: 0.3;
            transform: translateY(-50%) scale(0.85);
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
            }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-pulse-glow {
            animation: pulse-glow 4s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
}
