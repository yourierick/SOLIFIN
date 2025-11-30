import { motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useState } from "react";

export default function Hero() {
  const { isDarkMode } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  // Slides data
  const slides = [
    {
      title: (
        <>
          Transformez Votre Avenir Financier
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            avec SOLIFIN
          </span>
        </>
      ),
      text: "Rejoignez notre communauté grandissante et découvrez comment notre système de parrainage innovant peut multiplier vos revenus de manière exponentielle.",
      button1: "Commencer Maintenant",
      button2: "En Savoir Plus",
      background: "/img/hero-carousel/background_7.jpg",
    },
    {
      title: (
        <>
          Découvrez Nos Offres Exclusives
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            pour booster vos finances
          </span>
        </>
      ),
      text: "Profitez de nos solutions personnalisées et d'un accompagnement sur-mesure pour atteindre vos objectifs financiers.",
      button1: "Rejoindre Maintenant",
      button2: "Découvrir Plus",
      background: "/img/hero-carousel/background_2.jpg",
    },
    {
      title: (
        <>
          Un Réseau Solidaire
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            pour une croissance partagée
          </span>
        </>
      ),
      text: "Bénéficiez de la force d'une communauté engagée et solidaire. Ensemble, nous bâtissons un avenir financier plus sûr et plus prospère pour tous nos membres.",
      button1: "Rejoindre la Communauté",
      button2: "Notre Vision",
      background: "/img/hero-carousel/background_3.jpg",
    },
    {
      title: (
        <>
          Passez à l'Action
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            et réalisez vos ambitions
          </span>
        </>
      ),
      text: "Ne laissez pas passer votre chance : commencez dès aujourd'hui à transformer vos rêves en réalité grâce à nos outils et notre accompagnement personnalisé.",
      button1: "Démarrer l'Aventure",
      button2: "Contactez-Nous",
      background: "/img/hero-carousel/background_4.jpg",
    },
    {
      title: (
        <>
          Osez l'Innovation
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            pour un futur différent
          </span>
        </>
      ),
      text: "Explorez de nouvelles opportunités financières grâce à nos solutions innovantes et à notre vision tournée vers l'avenir.",
      button1: "Découvrir l'Innovation",
      button2: "Nos Solutions",
      background: "/img/hero-carousel/background_5.jpg",
    },
    {
      title: (
        <>
          Sécurité & Confiance
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            au cœur de votre expérience
          </span>
        </>
      ),
      text: "Votre tranquillité d'esprit est notre priorité : bénéficiez d'un environnement sécurisé et d'un accompagnement transparent à chaque étape.",
      button1: "En Savoir Plus",
      button2: "Notre Engagement",
      background: "/img/hero-carousel/background_6.jpg",
    },
    {
      title: (
        <>
          Grandissez Ensemble
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            avec la force du collectif
          </span>
        </>
      ),
      text: "Rejoignez un réseau où chaque membre contribue à la réussite de tous. Ensemble, nous allons plus loin !",
      button1: "Rejoindre le Mouvement",
      button2: "Témoignages",
      background: "/img/hero-carousel/background_7.jpg",
    },
    {
      title: (
        <>
          Votre Potentiel, Notre Mission
          <br />
          <span
            className={isDarkMode ? "text-primary-400" : "text-primary-600"}
          >
            libérez-vous
          </span>
        </>
      ),
      text: "Nous croyons en votre potentiel. Laissez-nous vous accompagner pour révéler le meilleur de vous-même et atteindre vos objectifs les plus ambitieux.",
      button1: "Commencer l'Aventure",
      button2: "Nous Contacter",
      background: "/img/hero-carousel/background_8.jpg",
    },
  ];

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-14 md:pt-18 lg:pt-20"
    >
      {/* Image de fond dynamique */}
      <div className="absolute inset-0">
        <img
          src={slides[activeIndex].background}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Superposition semi-transparente */}
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-br from-gray-800/85 to-gray-800/85"
              : "bg-gradient-to-br from-primary-50/70 to-white/70"
          }`}
        />
      </div>

      {/* Effet d'animation */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <div
          className={`absolute transform rotate-45 -top-1/4 -left-1/4 w-1/2 h-1/2 ${
            isDarkMode ? "bg-primary-700/30" : "bg-primary-200/50"
          } rounded-full filter blur-3xl`}
        />
        <div
          className={`absolute transform -rotate-45 -bottom-1/4 -right-1/4 w-1/2 h-1/2 ${
            isDarkMode ? "bg-primary-800/30" : "bg-primary-100/50"
          } rounded-full filter blur-3xl`}
        />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ el: ".custom-swiper-pagination", clickable: true }}
          autoplay={{ delay: 7000, disableOnInteraction: false }}
          loop={true}
          className="max-w-4xl mx-auto"
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        >
          {slides?.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1
                    className={`text-7xl md:text-8xl lg:text-9xl xl:text-10xl font-bold mb-6 ${
                      isDarkMode ? "text-white" : ""
                    }`}
                  >
                    {slide.title}
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className={`text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {slide.text}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <RouterLink to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn-primary text-lg md:text-xl lg:text-2xl px-6 md:px-8 py-3 md:py-4 ${
                        isDarkMode
                          ? "bg-primary-500 hover:bg-primary-400 text-white"
                          : ""
                      }`}
                    >
                      {slide.button1}
                    </motion.button>
                  </RouterLink>
                  <ScrollLink
                    to="about"
                    smooth={true}
                    duration={800}
                    offset={-70}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`btn-primary text-lg md:text-xl lg:text-2xl px-6 md:px-8 py-3 md:py-4 ${
                        isDarkMode
                          ? "bg-gray-800 text-primary-400 border-2 border-primary-500 hover:bg-gray-700"
                          : "bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50"
                      }`}
                    >
                      {slide.button2}
                    </motion.button>
                  </ScrollLink>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Pagination customisée Swiper */}
        <div className="custom-swiper-pagination flex justify-center mt-8" />
      </div>

      {/* Flèche de défilement */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <ScrollLink
          to="features"
          spy={true}
          smooth={true}
          offset={-70}
          duration={500}
        >
          <ChevronDownIcon
            className={`h-10 w-10 md:h-12 md:w-12 cursor-pointer ${
              isDarkMode ? "text-primary-400" : "text-primary-600"
            }`}
          />
        </ScrollLink>
      </motion.div>
      {/* Style pour les bullets Swiper */}
      <style>{`
        .custom-swiper-pagination {
          position: static !important;
          margin-top: 2rem;
          z-index: 20;
          margin-bottom: 12px
        }
        .custom-swiper-pagination .swiper-pagination-bullet {
          background: ${
            isDarkMode ? "#e5e7eb" : "gray"
          } !important; /* gris très clair */
          opacity: 0.6;
          width: 10px;
          height: 6px;
          border-radius: 3px;
          margin: 0 4px !important;
          transition: width 0.3s, background 0.3s, opacity 0.3s;
          box-shadow: none !important;
        }
        .custom-swiper-pagination .swiper-pagination-bullet-active {
          background:rgb(31, 168, 61) !important; /* gris moyen */
          opacity: 1;
          width: 32px;
        }
      `}</style>
    </section>
  );
}
