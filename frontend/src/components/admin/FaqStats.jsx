import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon as ThumbUpIcon,
  HandThumbDownIcon as ThumbDownIcon
} from '@heroicons/react/24/outline';

export default function FaqStats({ faqs, categories, isDarkMode }) {
  const [stats, setStats] = useState({
    totalFaqs: 0,
    totalCategories: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    mostViewedFaqs: [],
    mostVotedFaqs: [],
    faqsByCategory: []
  });

  useEffect(() => {
    calculateStats();
  }, [faqs, categories]);

  const calculateStats = async () => {
    // Calcul des statistiques de base
    const totalFaqs = faqs.length;
    const totalCategories = categories.length;
    const totalUpvotes = faqs.reduce((sum, faq) => sum + (faq.upvotes || 0), 0);
    const totalDownvotes = faqs.reduce((sum, faq) => sum + (faq.downvotes || 0), 0);

    // FAQ les plus consultées (si disponible)
    let mostViewedFaqs = [];
    try {
      const response = await axios.get('/api/admin/faqs/stats/views');
      mostViewedFaqs = response.data.slice(0, 5);
    } catch (error) {
      console.log('Statistiques de vues non disponibles');
      // Utiliser un classement par défaut basé sur les votes
      mostViewedFaqs = [...faqs]
        .sort((a, b) => ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0)))
        .slice(0, 5)
        .map(faq => ({
          ...faq,
          views: 'N/A'
        }));
    }

    // FAQ les plus votées (positif et négatif)
    const mostVotedFaqs = [...faqs]
      .sort((a, b) => ((b.upvotes || 0) + (b.downvotes || 0)) - ((a.upvotes || 0) + (a.downvotes || 0)))
      .slice(0, 5);

    // FAQ par catégorie
    const faqsByCategory = categories.map(category => {
      const categoryFaqs = faqs.filter(faq => faq.category_id === category.id);
      return {
        category: category.name,
        count: categoryFaqs.length,
        percentage: totalFaqs > 0 ? (categoryFaqs.length / totalFaqs) * 100 : 0
      };
    });

    setStats({
      totalFaqs,
      totalCategories,
      totalUpvotes,
      totalDownvotes,
      mostViewedFaqs,
      mostVotedFaqs,
      faqsByCategory
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total des FAQ" 
          value={stats.totalFaqs} 
          icon={<QuestionMarkCircleIcon className="h-8 w-8" />}
          isDarkMode={isDarkMode}
        />
        <StatCard 
          title="Catégories" 
          value={stats.totalCategories} 
          icon={<ChatBubbleLeftRightIcon className="h-8 w-8" />}
          isDarkMode={isDarkMode}
        />
        <StatCard 
          title="Votes positifs" 
          value={stats.totalUpvotes} 
          icon={<ThumbUpIcon className="h-8 w-8" />}
          isDarkMode={isDarkMode}
          color="text-green-500"
        />
        <StatCard 
          title="Votes négatifs" 
          value={stats.totalDownvotes} 
          icon={<ThumbDownIcon className="h-8 w-8" />}
          isDarkMode={isDarkMode}
          color="text-red-500"
        />
      </div>

      {/* Distribution par catégorie */}
      <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-lg font-medium mb-4">Distribution par catégorie</h3>
        <div className="space-y-3">
          {stats.faqsByCategory.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span>{item.category}</span>
                <span>{item.count} ({item.percentage.toFixed(1)}%)</span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full bg-blue-500`}
                />
              </div>
            </div>
          ))}
          
          {stats.faqsByCategory.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Aucune donnée disponible
            </p>
          )}
        </div>
      </div>

      {/* FAQ les plus consultées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-lg font-medium mb-4">FAQ les plus consultées</h3>
          <ul className="space-y-2">
            {stats.mostViewedFaqs.map((faq, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="truncate max-w-xs">{faq.question}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {typeof faq.views === 'number' ? `${faq.views} vues` : faq.views}
                </span>
              </li>
            ))}
            
            {stats.mostViewedFaqs.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucune donnée disponible
              </p>
            )}
          </ul>
        </div>

        {/* FAQ les plus votées */}
        <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-lg font-medium mb-4">FAQ les plus votées</h3>
          <ul className="space-y-2">
            {stats.mostVotedFaqs.map((faq, index) => (
              <li key={index} className="flex items-center justify-between">
                <span className="truncate max-w-xs">{faq.question}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500 flex items-center">
                    <ThumbUpIcon className="h-4 w-4 mr-1" />
                    {faq.upvotes || 0}
                  </span>
                  <span className="text-red-500 flex items-center">
                    <ThumbDownIcon className="h-4 w-4 mr-1" />
                    {faq.downvotes || 0}
                  </span>
                </div>
              </li>
            ))}
            
            {stats.mostVotedFaqs.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucune donnée disponible
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher une carte de statistique
function StatCard({ title, value, icon, color = "text-blue-500", isDarkMode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className={`text-3xl font-bold ${color}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
