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
  BuildingOfficeIcon,
  StarIcon,
  CurrencyDollarIcon,
  TagIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardCarousel() {
  const { isDarkMode } = useTheme();
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Utiliser le nouvel endpoint unifié pour le carrousel
        const response = await axios.get("/api/dashboard/carousel");

        console.log(response)
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
            expiry_date: pub.expiry_date,
            badge: "Promotion",
            badgeColor: "bg-blue-500",
            // Nouveaux champs
            prix: pub.prix_unitaire_vente,
            devise: pub.devise,
            categorie: pub.categorie,
            sous_categorie: pub.sous_categorie,
            pays: pub.pays,
            ville: pub.ville,
            contacts: pub.contacts,
            email: pub.email,
            lien: pub.lien,
            user: pub.user,
            page: pub.page,
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
            localisation: offre.ville,
            type_contrat: offre.type_contrat,
            created_at: offre.created_at,
            expiry_date: offre.expiry_date,
            badge: "Nouveau",
            badgeColor: "bg-green-500",
            // Nouveaux champs
            entreprise: offre.entreprise,
            reference: offre.reference,
            secteur: offre.secteur,
            pays: offre.pays,
            date_limite: offre.date_limite,
            contacts: offre.contacts,
            email_contact: offre.email_contact,
            lien: offre.lien,
            user: offre.user,
            page: offre.page,
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
              expiry_date: oppo.expiry_date,
              badge: "Tendance",
              badgeColor: "bg-purple-500",
              // Nouveaux champs
              entreprise: oppo.entreprise,
              reference: oppo.reference,
              pays: oppo.pays,
              ville: oppo.ville,
              date_limite: oppo.date_limite,
              contacts: oppo.contacts,
              email: oppo.email,
              lien: oppo.lien,
              user: oppo.user,
              page: oppo.page,
            })
          );

          // Combiner toutes les données et les mélanger
          const allItems = [...publicites, ...offresEmploi, ...opportunites];

          // Mélanger les éléments pour avoir une variété dans le carousel
          const shuffledItems = allItems.sort(() => 0.5 - Math.random());

          setCarouselItems(shuffledItems);
        } else {
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

  // Formater la date limite pour l'affichage
  const formatDeadline = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return "Expiré";
      } else if (diffDays === 0) {
        return "Dernier jour";
      } else if (diffDays === 1) {
        return "Demain";
      } else if (diffDays <= 7) {
        return `${diffDays} jours`;
      } else {
        return date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
      }
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 border-t-transparent"></div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full h-16 w-16 border-4 border-blue-200 opacity-30"
          ></motion.div>
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
          <div className="p-3 rounded-2xl bg-blue-500 shadow-xl">
            <BriefcaseIcon className="h-7 w-7 text-white" />
          </div>
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
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    } ${
                      index === 1
                        ? "scale-110 shadow-2xl border-2 border-blue-400"
                        : "scale-95 shadow-lg border hover:shadow-xl"
                    } border`}
                  >
                    {/* Header simple */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-xl ${
                              item.type === "publicité"
                                ? "bg-blue-100 text-blue-600"
                                : item.type === "emploi"
                                ? "bg-green-100 text-green-600"
                                : "bg-purple-100 text-purple-600"
                            }`}
                          >
                            <item.icon className="h-6 w-6" />
                          </div>
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
                        <div
                          className={`${item.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}
                        >
                          {item.badge}
                        </div>
                      </div>

                      <h3
                        className={`text-lg font-bold mb-3 line-clamp-2 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    {/* Contenu */}
                    <div className="p-6 flex-grow">
                      <p
                        className={`text-sm leading-relaxed mb-4 line-clamp-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.description}
                      </p>

                      {/* Informations essentielles */}
                      <div className="space-y-2 mb-4">
                        {/* Prix pour les publicités */}
                        {item.type === "publicité" && item.prix && (
                          <div
                            className={`text-xs font-semibold ${
                              isDarkMode ? "text-green-400" : "text-green-600"
                            } flex items-center`}
                          >
                            <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                            {item.prix} {item.devise || "USD"}
                          </div>
                        )}
                        
                        {/* Entreprise pour emploi et opportunité */}
                        {(item.type === "emploi" || item.type === "opportunité") && item.entreprise && (
                          <div
                            className={`text-xs font-medium ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            } flex items-center`}
                          >
                            <BuildingOffice2Icon className="h-3 w-3 mr-1" />
                            {item.entreprise}
                          </div>
                        )}
                        
                        {/* Type de contrat pour les emplois */}
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
                        
                        {/* Localisation */}
                        {item.ville && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            } flex items-center`}
                          >
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {item.ville}
                          </div>
                        )}
                        
                        {/* Date limite/expiration */}
                        {(item.date_limite || item.expiry_date) && (
                          <div
                            className={`text-xs font-medium ${
                              formatDeadline(item.date_limite || item.expiry_date) === "Expiré"
                                ? "text-red-500"
                                : formatDeadline(item.date_limite || item.expiry_date) === "Dernier jour" || formatDeadline(item.date_limite || item.expiry_date) === "Demain"
                                ? "text-orange-500"
                                : isDarkMode ? "text-yellow-400" : "text-yellow-600"
                            } flex items-center`}
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {item.type === "publicité" ? `Expire ${formatDeadline(item.expiry_date)}` : formatDeadline(item.date_limite)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bouton d'action au survol */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-500"
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
                        className={`px-6 py-3 rounded-xl ${
                          item.type === "publicité"
                            ? "bg-blue-500"
                            : item.type === "emploi"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        } text-white shadow-xl`}
                      >
                        <Link
                          to={
                            item.pageId
                              ? `/dashboard/pages/${item.pageId}`
                              : item.userId
                              ? `/users/${item.userId}`
                              : "#"
                          }
                          className="inline-flex items-center text-sm font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir les détails
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                        </Link>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Lien "voir plus d'évenements" */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center mt-8"
      >
        <Link
          to="/dashboard/my-page"
          className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:gap-3 ${
            isDarkMode
              ? "text-blue-400 hover:text-blue-300"
              : "text-blue-600 hover:text-blue-700"
          }`}
        >
          Voir plus d'évenements
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </motion.div>
        </Link>
      </motion.div>

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
              isDarkMode ? "rgba(96, 165, 250, 0.9)" : "rgba(59, 130, 246, 0.9)"
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
              isDarkMode ? "rgba(96, 165, 250, 0.3)" : "rgba(59, 130, 246, 0.3)"
            };
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
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
            box-shadow: 0 12px 40px rgba(59, 130, 246, 0.3);
            border-color: ${
              isDarkMode ? "rgba(96, 165, 250, 0.5)" : "rgba(59, 130, 246, 0.5)"
            };
          }

          .dashboard-carousel-modern .swiper-button-disabled {
            opacity: 0.3;
            transform: translateY(-50%) scale(0.85);
          }
        `}
      </style>
    </div>
  );
}
