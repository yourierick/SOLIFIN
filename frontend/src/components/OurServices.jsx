import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
      duration: 0.6,
    },
  },
  hover: {
    y: -8,
    scale: 1.03,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.7,
    },
  },
};

export default function OurServices() {
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fonction pour gérer le clic sur une carte de service
  const handleServiceClick = () => {
    if (isAuthenticated) {
      // Si l'utilisateur est connecté, rediriger vers le tableau de bord
      navigate("/dashboard");
    } else {
      // Sinon, rediriger vers la page de connexion
      navigate("/login");
    }
  };

  const services = [
    {
      images: [
        "/img/blog/services.jpg",
        "/img/blog/location-auto.jpg",
        "/img/blog/maison-for-sale.jpg",
        "/img/blog/terrain.png",
      ],
      title: "Publicité en ligne de vos produits et services",
      description:
        "Boostez rapidement vos produits et services, y compris vos services de locations ou de vente de maisons/appartement, parcelles, véhicule/machines… à travers l'espace publicitaire numérique fourni sans coût sur la plateforme SOLIFIN, les réseaux sociaux, etc.",
    },
    {
      image: "/img/blog/partenaire.jpg",
      title:
        "Publication et accès aux opportunités d'affaires, d'emploi, de financement, de partenariat",
      description:
        "Élargissez les champs de vos publications d'opportunités d'emplois, opportunités de partenariat, appel à projet, appel à manifestation d'intérêt, opportunités d'affaires, diverses annonces/informations… pour permettre l'accès au public le plus large.",
    },
    {
      image: "/img/blog/formation.jpg",
      title:
        "Publicité et vente/offre de vos cours et formations en ligne, applications, e-books et articles",
      description:
        "Contribuez au développement du capital humain et des entreprises à travers vos ventes en ligne de cours/formations, outils de gestion/applications/logiciels, e-books… publiés sur la plateforme SOLIFIN.",
    },
    {
      image: "/img/blog/social.jpg",
      title: "Partagez vos évènements avec vos proches",
      description:
        "Faites-vous informer et partagez avec vos proches vos évènements : naissances, anniversaires, divertissement, mariages, décès…",
    },
    {
      image: "/img/blog/argent.jpg",
      title: "Croissance rapide de revenus et accès aux capitaux",
      description:
        "Pour votre indépendance financière, abonnez-vous directement sur le Pack de votre choix pour encaisser infiniment les recettes sur vos ventes en ligne, vos commissions sur chacun de vos parrainages directs et/ou indirects, vos bonus sur les retraits et les bonus mensuels.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        variants={titleVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
      >
        <div className="inline-block">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            className={`h-1.5 w-24 mx-auto mb-6 rounded-full ${
              isDarkMode ? "bg-green-500" : "bg-green-600"
            }`}
          />
        </div>

        <h2
          className={`text-3xl font-extrabold tracking-tight sm:text-5xl mb-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Nos{" "}
          <span
            className={`relative inline-block ${
              isDarkMode ? "text-green-400" : "text-green-600"
            }`}
          >
            Services
            <motion.span
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
              className={`absolute bottom-1 left-0 h-0.5 ${
                isDarkMode ? "bg-green-400/40" : "bg-green-600/40"
              }`}
            />
          </span>
        </h2>

        <p
          className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Découvrez les services que nous proposons pour vous accompagner vers
          l'indépendance financière et le développement de votre activité
        </p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {services?.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              onClick={handleServiceClick}
              className={`flex flex-col h-full p-0 rounded-2xl transition-all duration-300 overflow-hidden shadow-xl ${
                isDarkMode
                  ? "bg-gray-800 hover:shadow-green-500/40 border border-gray-700"
                  : "bg-white hover:shadow-green-500/40 border border-gray-100"
              } transform-gpu cursor-pointer`}
            >
              <div className="w-full h-40 md:h-44 lg:h-48 xl:h-44 overflow-hidden bg-gray-100 dark:bg-gray-900">
                {index === 0 ? (
                  <Swiper
                    spaceBetween={30}
                    centeredSlides={true}
                    autoplay={{
                      delay: 3000,
                      disableOnInteraction: false,
                    }}
                    pagination={{
                      clickable: true,
                    }}
                    navigation={true}
                    modules={[Autoplay, Pagination, Navigation]}
                    className="h-full w-full rounded-t-2xl"
                  >
                    {service?.images?.map((img, imgIndex) => (
                      <SwiperSlide key={imgIndex} className="w-full h-full">
                        <img
                          src={img}
                          alt={`${service.title} ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <img
                    src={service?.image}
                    alt={service?.title}
                    className="object-cover w-full h-full rounded-t-2xl"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex flex-col flex-1 p-6">
                <h3
                  className={`text-lg font-bold mb-3 leading-tight ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {service?.title}
                </h3>
                <p
                  className={`mb-4 flex-grow text-sm leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {service?.description}
                </p>
                
                {/* Bouton d'action avec animation */}
                <div className="mt-auto">
                  {isAuthenticated ? (
                    <button
                      className={`flex items-center justify-center w-full py-2 px-4 rounded-lg transition-all duration-300 ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Évite le déclenchement du onClick du parent
                        handleServiceClick();
                      }}
                    >
                      <span>Accéder au service</span>
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </button>
                  ) : (
                    <motion.button
                      className={`flex items-center justify-center w-full py-2 px-4 rounded-lg ${
                        isDarkMode
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Évite le déclenchement du onClick du parent
                        handleServiceClick();
                      }}
                      animate={{
                        y: [0, -5, 0],
                        boxShadow: [
                          "0 0 0 rgba(34, 197, 94, 0)",
                          "0 4px 12px rgba(34, 197, 94, 0.5)",
                          "0 0 0 rgba(34, 197, 94, 0)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Se connecter pour accéder</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }}
                      >
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
