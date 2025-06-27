import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function OurServices() {
  const { isDarkMode } = useTheme();

  const services = [
    {
      images: [
        "/img/blog/publicite.jpg",
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2
          className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Nos{" "}
          <span className={isDarkMode ? "text-green-400" : "text-green-600"}>
            Services
          </span>
        </h2>
        <p
          className={`text-lg max-w-3xl mx-auto ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Découvrez les services que nous proposons pour vous accompagner vers
          l'indépendance financière
        </p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`flex flex-col h-full p-0 rounded-2xl transition-all duration-300 overflow-hidden shadow-lg ${
                isDarkMode
                  ? "bg-gray-800 hover:shadow-green-900/30 border border-gray-700"
                  : "bg-white hover:shadow-green-500/30 border border-gray-100"
              }`}
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
                    {service.images.map((img, imgIndex) => (
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
                    src={service.image}
                    alt={service.title}
                    className="object-cover w-full h-full rounded-t-2xl"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex flex-col flex-1 p-6">
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {service.title}
                </h3>
                <p
                  className={`mb-2 flex-grow ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
