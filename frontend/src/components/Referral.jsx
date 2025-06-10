import { motion } from 'framer-motion';
import { UsersIcon, ArrowPathIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const steps = [
  {
    title: 'Invitez vos Amis',
    description: 'Partagez votre code de parrainage unique avec vos amis, votre famille et vos collègues. Chaque personne qui s\'inscrit avec votre code devient un membre de votre réseau direct.',
    icon: UsersIcon,
  },
  {
    title: 'Développez votre Réseau',
    description: 'Vos filleuls peuvent à leur tour parrainer d\'autres personnes, élargissant ainsi votre réseau sur plusieurs niveaux. Plus votre réseau grandit, plus vos opportunités de gains augmentent.',
    icon: ArrowPathIcon,
  },
  {
    title: 'Gagnez des Commissions',
    description: 'Recevez des commissions sur les abonnements et les transactions effectuées par les membres de votre réseau. Notre système multi-niveaux vous permet de gagner sur plusieurs générations de filleuls.',
    icon: BanknotesIcon,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Referral() {
  const { isDarkMode } = useTheme();

  return (
    <section id="referral" className={`section-padding ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className={`heading-secondary mb-4 ${isDarkMode ? 'text-white' : ''}`}>
            Comment Fonctionne Notre <span className="text-primary-600">Système de Parrainage</span>
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Un système simple et efficace qui vous permet de générer des revenus passifs en développant votre réseau.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={itemVariants}
              className="relative"
            >
              <div className={`rounded-lg p-8 h-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-primary-50'
              }`}>
                <div className="flex justify-center mb-6">
                  <div className={`rounded-full p-4 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-primary-100'
                  }`}>
                    <step.icon className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <h3 className={`text-xl font-semibold mb-4 text-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <motion.div
                    animate={{
                      x: [0, 10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        isDarkMode ? 'text-primary-500' : 'text-primary-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <RouterLink to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg"
            >
              Commencer à Parrainer
            </motion.button>
          </RouterLink>
          <p className={`mt-4 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Plus vous parrainez, plus vos gains augmentent !
          </p>
        </motion.div>
      </div>
    </section>
  );
}