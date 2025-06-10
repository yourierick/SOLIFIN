import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import {
  LightBulbIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

export default function DashboardCarousel() {
  const { isDarkMode } = useTheme();
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Utiliser le nouvel endpoint unifié pour le carrousel
        const response = await axios.get('/api/dashboard/carousel');
        
        if (response.data.success) {
          // Transformer les publicités en format carousel
          const publicites = response.data.publicites.map(pub => ({
            id: pub.id,
            type: 'publicité',
            icon: MegaphoneIcon,
            title: pub.titre,
            description: pub.description ? (pub.description.length > 100 ? pub.description.substring(0, 100) + '...' : pub.description) : 'Aucune description',
            pageId: pub.page_id,
            userId: pub.user_id,
            color: 'from-blue-500 to-blue-600',
            image: pub.image,
            created_at: pub.created_at
          }));

          // Transformer les offres d'emploi en format carousel
          const offresEmploi = response.data.offresEmploi.map(offre => ({
            id: offre.id,
            type: 'emploi',
            icon: BriefcaseIcon,
            title: offre.titre,
            description: offre.description ? (offre.description.length > 100 ? offre.description.substring(0, 100) + '...' : offre.description) : 'Aucune description',
            pageId: offre.page_id,
            userId: offre.user_id,
            color: 'from-purple-500 to-purple-600',
            localisation: offre.localisation,
            type_contrat: offre.type_contrat,
            created_at: offre.created_at
          }));

          // Transformer les opportunités d'affaires en format carousel
          const opportunites = response.data.opportunitesAffaires.map(oppo => ({
            id: oppo.id,
            type: 'opportunité',
            icon: LightBulbIcon,
            title: oppo.titre,
            description: oppo.description ? (oppo.description.length > 100 ? oppo.description.substring(0, 100) + '...' : oppo.description) : 'Aucune description',
            pageId: oppo.page_id,
            userId: oppo.user_id,
            color: 'from-primary-500 to-primary-600',
            secteur: oppo.secteur,
            created_at: oppo.created_at
          }));

          // Combiner toutes les données et les mélanger
          const allItems = [...publicites, ...offresEmploi, ...opportunites];
          
          // Mélanger les éléments pour avoir une variété dans le carousel
          const shuffledItems = allItems.sort(() => 0.5 - Math.random());
          
          setCarouselItems(shuffledItems);
        } else {
          console.error('Erreur lors du chargement des données du carousel:', response.data.message);
          setCarouselItems([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du carousel:', error);
        // En cas d'erreur, utiliser des données par défaut
        setCarouselItems([
          {
            type: 'publicité',
            icon: MegaphoneIcon,
            title: 'Découvrez nos offres',
            description: 'Explorez notre plateforme pour voir les dernières opportunités',
            color: 'from-blue-500 to-blue-600',
          },
          {
            type: 'opportunité',
            icon: LightBulbIcon,
            title: 'Opportunités d\'affaires',
            description: 'Trouvez des partenaires et développez votre réseau professionnel',
            color: 'from-primary-500 to-primary-600',
          },
          {
            type: 'emploi',
            icon: BriefcaseIcon,
            title: 'Offres d\'emploi',
            description: 'Consultez les dernières offres d\'emploi de notre réseau',
            color: 'from-purple-500 to-purple-600',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Si aucun élément n'est disponible, ne rien afficher
  if (!carouselItems.length) {
    return null;
  }

  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={carouselItems.length > 3}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
        className="dashboard-carousel"
      >
        {carouselItems.map((item, index) => (
          <SwiperSlide key={index}>
            <div 
              className={`relative h-52 rounded-xl overflow-hidden ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              {/* Fond avec dégradé */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-15 transition-opacity`} />
              
              {/* Image de fond si disponible */}
              {item.image && (
                <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }}></div>
              )}
              
              {/* Contenu */}
              <div className="relative h-full p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color} transform group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium truncate ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    {item.created_at && <span className="ml-1 text-xs opacity-70">• {formatDate(item.created_at)}</span>}
                  </span>
                </div>

                <h3 className={`text-base font-semibold mb-1.5 line-clamp-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.title}
                </h3>
                
                <p className={`text-xs flex-grow line-clamp-3 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>

                {/* Informations supplémentaires selon le type */}
                {item.type === 'emploi' && item.type_contrat && (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
                    Type: {item.type_contrat} {item.localisation && `• ${item.localisation}`}
                  </div>
                )}
                
                {item.type === 'opportunité' && item.secteur && (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
                    Secteur: {item.secteur}
                  </div>
                )}

                {/* Bouton "En savoir plus" avec effet de survol */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-90 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg`}>
                    <Link
                      to={item.pageId ? `/dashboard/pages/${item.pageId}` : item.userId ? `/users/${item.userId}` : '#'}
                      className="inline-flex items-center text-xs font-medium text-white"
                    >
                      En savoir plus
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>
        {`
          .dashboard-carousel {
            padding: 4px 4px 40px 4px;
          }
          .dashboard-carousel .swiper-pagination-bullet {
            background: ${isDarkMode ? '#ffffff' : '#000000'};
            opacity: 0.5;
            transition: all 0.3s ease;
          }
          .dashboard-carousel .swiper-pagination-bullet-active {
            opacity: 1;
            background: ${isDarkMode ? '#ffffff' : '#000000'};
            transform: scale(1.2);
          }
          .dashboard-carousel .swiper-button-next,
          .dashboard-carousel .swiper-button-prev {
            color: ${isDarkMode ? '#ffffff' : '#000000'};
            transition: all 0.3s ease;
          }
          .dashboard-carousel .swiper-button-next:hover,
          .dashboard-carousel .swiper-button-prev:hover {
            transform: scale(1.1);
          }
          .dashboard-carousel .swiper-button-disabled {
            opacity: 0.35;
          }
        `}
      </style>
    </div>
  );
}