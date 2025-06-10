import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const features = [
  {
    name: 'Gains Exponentiels',
    description: 'Profitez d’un système de rémunération innovant qui vous permet d’accumuler des commissions sur plusieurs niveaux de parrainage, maximisant ainsi vos revenus à chaque nouvelle adhésion dans votre réseau.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Communauté Solidaire',
    description: 'Rejoignez une communauté dynamique où l’entraide et le partage sont au cœur de nos valeurs. Ensemble, nous créons un réseau solide où chacun contribue à la réussite collective tout en atteignant ses propres objectifs.',
    icon: UserGroupIcon,
  },
  {
    name: 'Croissance Rapide',
    description: 'Bénéficiez d’un modèle de développement accéléré qui vous permet d’atteindre l’indépendance financière plus rapidement grâce à notre système de parrainage efficace et à nos outils de croissance performants.',
    icon: ChartBarIcon,
  },
  {
    name: 'Sécurité Garantie',
    description: 'Votre confiance est notre priorité. SOLIFIN assure la sécurité de vos transactions et la protection de vos données personnelles grâce à des protocoles de sécurité avancés et une gestion transparente des opérations.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Innovation Continue',
    description: 'Nous investissons constamment dans le développement de nouvelles fonctionnalités et l’amélioration de notre plateforme pour vous offrir les meilleurs outils de marketing de réseau, adaptés aux évolutions du marché.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Portée Internationale',
    description: 'Étendez votre réseau au-delà des frontières grâce à notre présence mondiale. SOLIFIN vous permet de construire une équipe internationale et de saisir des opportunités d’affaires à l’échelle globale.',
    icon: GlobeAltIcon,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
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

export default function Features() {
  const { isDarkMode } = useTheme();

  return (
    <section id="features" className={`section-padding ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className={`heading-secondary mb-4 ${isDarkMode ? 'text-white' : ''}`}>
            Pourquoi Choisir <span className={isDarkMode ? 'text-primary-400' : 'text-primary-600'}>SOLIFIN</span> ?
          </h2>
          <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Découvrez les avantages uniques qui font de notre système MLM la référence dans le domaine du marketing de réseau.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              variants={itemVariants}
              className={`p-6 rounded-xl transition-shadow ${
                isDarkMode 
                  ? 'bg-gray-800 shadow-lg hover:shadow-gray-700/50' 
                  : 'bg-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center mb-4">
                <feature.icon className={`h-8 w-8 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} />
                <h3 className={`ml-3 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.name}
                </h3>
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}