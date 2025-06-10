import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { ChartBarIcon, ChatBubbleLeftRightIcon, LightBulbIcon } from '@heroicons/react/24/outline';

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

export default function TheoryOfChange() {
  const { isDarkMode } = useTheme();

  const quotes = [
    {
      text: "C'est plutôt ton attitude (pas ton aptitude) actuelle face aux opportunités qui détermine exactement ton altitude financière de demain",
      author: "MUKENGERE B. Patrick"
    },
    {
      text: "Le plus grand risque est de n'en prendre aucun. Dans un monde qui change si rapidement, la seule stratégie qui vous mènera à l'échec est celle consistant à ne jamais prendre de risque.",
      author: "Mark Zuckerberg"
    },
    {
      text: "Commencez maintenant, pas demain. Demain, c'est une excuse de perdant.",
      author: "Andrew Fashion"
    }
  ];

  const steps = [
    {
      icon: <LightBulbIcon className="h-6 w-6" />,
      title: "Vision",
      description: "Créer une communauté où chacun peut atteindre l'indépendance financière grâce à un système de parrainage et d'entraide."
    },
    {
      icon: <ChartBarIcon className="h-6 w-6" />,
      title: "Croissance",
      description: "Développer un réseau solide où chaque membre contribue à la réussite collective tout en atteignant ses propres objectifs financiers."
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      title: "Partage",
      description: "Encourager le partage d'opportunités et de ressources pour maximiser le potentiel de chaque membre de la communauté."
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
          Théorie de <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>Changement</span>
        </h2>
        <p className={`text-lg max-w-3xl mx-auto ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Notre approche pour créer une indépendance financière durable et accessible à tous
        </p>
        
        {/* Étapes de la théorie de changement */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-16"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`p-6 rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 shadow-lg hover:shadow-green-900/30 border border-gray-700' 
                  : 'bg-white shadow-lg hover:shadow-green-500/30 border border-gray-100'
              }`}
            >
              <div className={`flex justify-center mb-4 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                <div className={`rounded-full p-3 ${
                  isDarkMode ? 'bg-green-900/40' : 'bg-green-50'
                }`}>
                  {step.icon}
                </div>
              </div>
              <h3 className={`text-xl font-semibold text-center mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {step.title}
              </h3>
              <p className={`text-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Théorie de changement principale */}
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
            <h3 className={`text-2xl font-bold text-center mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Notre Formule de Succès
            </h3>
            
            <div className={`p-5 mb-6 rounded-lg ${
              isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <p className={`text-center text-lg font-semibold ${
                isDarkMode ? 'text-green-300' : 'text-green-700'
              }`}>
                Indépendance financière = (Packs achetés + Parrainages journaliers) – Négligence
              </p>
            </div>
          
            <p className={`text-base leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              « Si tout le monde s'achète un pack au programme SOLIFIN, et qu'il contribue au bien-être de ses
              proches en les parrainant massivement au sein de ce programme, alors tout le monde prospérera socio
              économiquement et atteindra ainsi son indépendance financière rapide. »
            </p>

            <div className="mt-6 text-center">
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
        
          {/* Citations */}
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
            <h3 className={`text-2xl font-bold text-center mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Citations Inspirantes
            </h3>
            
            <div className="space-y-6">
              {quotes.map((quote, index) => (
                <div 
                  key={index} 
                  className={`${index !== quotes.length - 1 ? 'pb-5 mb-5 border-b' : ''} ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className={`relative pl-6 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <span className="absolute left-0 top-0 text-3xl leading-none">“</span>
                    <p className="text-base italic leading-relaxed">
                      {quote.text}
                    </p>
                    <span className="absolute text-3xl leading-none">”</span>
                  </div>
                  <p className={`text-right font-medium mt-3 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    — {quote.author}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
