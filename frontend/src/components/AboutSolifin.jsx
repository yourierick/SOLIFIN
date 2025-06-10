import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { InformationCircleIcon, UserGroupIcon, CurrencyDollarIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export default function AboutSolifin() {
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: "Réseau Solidaire",
      description: "Un programme basé sur le principe de marketing de réseau pour favoriser l'entraide et la croissance collective."
    },
    {
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
      title: "Indépendance Financière",
      description: "Libérer chaque personne de sa dépendance financière grâce à nos services et opportunités."
    },
    {
      icon: <BuildingLibraryIcon className="h-6 w-6" />,
      title: "Développement Socioéconomique",
      description: "Améliorer les conditions de vie socioéconomiques des communautés par l'accès aux services essentiels."
    }
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
        <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          À propos de <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>SOLIFIN</span>
        </h2>
        <p className={`text-lg max-w-3xl mx-auto ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Découvrez notre mission et notre vision pour l'indépendance financière
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          {/* Présentation principale */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`p-8 rounded-2xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700' 
                : 'bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100'
            }`}
          >
            <div className="flex items-center mb-6">
              <div className={`rounded-full p-3 mr-4 ${
                isDarkMode ? 'bg-green-900/40' : 'bg-green-50'
              }`}>
                <InformationCircleIcon className={`h-8 w-8 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              <h3 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Qui sommes-nous?</h3>
            </div>
            
            <div className={`text-left mb-6 leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p className="mb-4">
                <span className="font-bold text-green-600">SOLUTION EXPRESS POUR L'INDEPENDANCE FINANCIERE (SOLIFIN)</span> est un
                programme de développement socioéconomique basé sur le principe de marketing de
                réseau et lancé par les Ets ENTREPRENEURIAT SANS FRONTIERE (EESF).
              </p>
              
              <p>
                Destiné aux divers usages d'acteurs humanitaires et/ou de développement
                socioéconomique œuvrant pour l'amélioration de conditions vies socioéconomiques
                de communautés, ce programme se veut donc libérer toute personne de sa
                dépendance financière à travers ses divers services.
              </p>
            </div>

            <div className="mt-6 text-left">
              <button 
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
                  isDarkMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                En savoir plus
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Caractéristiques */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700' 
                    : 'bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100'
                }`}
              >
                <div className="flex items-start">
                  <div className={`rounded-full p-2 mr-4 flex-shrink-0 ${
                    isDarkMode ? 'bg-green-900/40' : 'bg-green-50'
                  }`}>
                    <div className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={itemVariants}
              className={`p-6 rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-green-900/30 border border-green-800' 
                  : 'bg-green-50 border border-green-100'
              }`}
            >
              <p className={`text-center font-medium ${
                isDarkMode ? 'text-green-300' : 'text-green-700'
              }`}>
                Nos bénéficiaires incluent les chômeurs, les salariés, les entrepreneurs, les institutions et les ONG.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
