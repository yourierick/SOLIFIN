import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

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
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "Publicité en ligne de vos produits et services",
      description: "Boostez les ventes de vos produits et services (Ventes/location de vos maisons/parcelles, véhicule/machines, vos marchandises,…) à tous les niveaux (local, provincial, national, régional, continental, international,…) à travers l'espace publicitaire en ligne quotidiennement fourni sans coût sur la plateforme SOLIFIN, les réseaux sociaux,…"
    },
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "Opportunités d'affaires, d'emploi et de financement",
      description: "Élargissez les champs de publication d'opportunités d'emplois, opportunités de partenariat, appel à projet, appel à manifestation d'intérêt, opportunités d'affaires, diverses annonces /Informations….pour permettre l'accès au public le plus large."
    },
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "Partagez vos événements avec vos proches",
      description: "Faites-vous informer et partagez vos événements : naissances, anniversaires, divertissement, mariages, décès,… avec vos proches"
    },
    {
      icon: <CheckCircleIcon className="h-8 w-8" />,
      title: "Croissance Rapide de revenus et accès aux capitaux",
      description: "Pour votre indépendance financière, encaissez infiniment vos commissions sur chacun de vos parrainages directs et/ou indirects, vos bonus sur les retraits et vos jetons de parrainage"
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
          Nos <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>Services</span>
        </h2>
        <p className={`text-lg max-w-3xl mx-auto ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Découvrez les services que nous proposons pour vous accompagner vers l'indépendance financière
        </p>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`flex flex-col h-full p-6 rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700' 
                  : 'bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100'
              }`}
            >
              <div className={`mb-4 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {service.icon}
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {service.title}
              </h3>
              <p className={`mt-2 flex-grow ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {service.description}
              </p>
              <div className="mt-4 pt-4 border-t border-dashed flex justify-end">
                <button 
                  className={`inline-flex items-center text-sm font-medium ${
                    isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  En savoir plus
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
