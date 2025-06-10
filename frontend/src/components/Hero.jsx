import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Hero() {
  const { isDarkMode } = useTheme();

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0">
        <img
          src="/img/hero-carousel/background_2.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* Superposition semi-transparente */}
        <div className={`absolute inset-0 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900/95 to-gray-800/95' 
            : 'bg-gradient-to-br from-primary-50/90 to-white/90'
        }`} />
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
        <div className={`absolute transform rotate-45 -top-1/4 -left-1/4 w-1/2 h-1/2 ${
          isDarkMode ? 'bg-primary-700/30' : 'bg-primary-200/50'
        } rounded-full filter blur-3xl`} />
        <div className={`absolute transform -rotate-45 -bottom-1/4 -right-1/4 w-1/2 h-1/2 ${
          isDarkMode ? 'bg-primary-800/30' : 'bg-primary-100/50'
        } rounded-full filter blur-3xl`} />
      </motion.div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={`heading-primary mb-6 ${isDarkMode ? 'text-white' : ''}`}>
              Transformez Votre Avenir Financier
              <br />
              <span className={isDarkMode ? 'text-primary-400' : 'text-primary-600'}>avec SOLIFIN</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Rejoignez notre communauté grandissante et découvrez comment notre système de parrainage innovant peut multiplier vos revenus de manière exponentielle.
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
                className={`btn-primary text-lg ${
                  isDarkMode 
                    ? 'bg-primary-500 hover:bg-primary-400 text-white' 
                    : ''
                }`}
              >
                Commencer Maintenant
              </motion.button>
            </RouterLink>
            <ScrollLink to="about" smooth={true} duration={800} offset={-70}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn-primary text-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 text-primary-400 border-2 border-primary-500 hover:bg-gray-700' 
                    : 'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50'
                }`}
              >
                En Savoir Plus
              </motion.button>
            </ScrollLink>
          </motion.div>
        </div>
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
        <ScrollLink to="features" spy={true} smooth={true} offset={-70} duration={500}>
          <ChevronDownIcon className={`h-8 w-8 cursor-pointer ${
            isDarkMode ? 'text-primary-400' : 'text-primary-600'
          }`} />
        </ScrollLink>
      </motion.div>
    </section>
  );
}