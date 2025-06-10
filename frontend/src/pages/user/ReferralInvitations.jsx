import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import {
  UserPlusIcon,
  EnvelopeIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import Notification from '../../components/Notification';
import InvitationModal from '../../components/InvitationModal';

export default function ReferralInvitations() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    opened: 0,
    registered: 0,
    expired: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    packId: '',
    dateRange: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [userPacks, setUserPacks] = useState([]);

  useEffect(() => {
    fetchInvitations();
    fetchUserPacks();
    fetchStatistics();
  }, [currentPage, filters]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 10
      };
      
      // Appliquer les filtres
      if (filters.status) {
        params.status = filters.status;
      }
      
      if (filters.packId) {
        params.pack_id = filters.packId;
      }
      
      if (filters.search) {
        params.search = filters.search;
      }
      
      if (filters.dateRange) {
        // Convertir la plage de dates en dates de début et de fin
        // Par exemple: 'last7days', 'last30days', 'thisMonth', etc.
        if (filters.dateRange === 'last7days') {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          params.from_date = date.toISOString().split('T')[0];
        } else if (filters.dateRange === 'last30days') {
          const date = new Date();
          date.setDate(date.getDate() - 30);
          params.from_date = date.toISOString().split('T')[0];
        } else if (filters.dateRange === 'thisMonth') {
          const date = new Date();
          date.setDate(1);
          params.from_date = date.toISOString().split('T')[0];
        }
      }
      
      const response = await axios.get('/api/referral-invitations', { params });
      if (response.data.success) {
        setInvitations(response.data.data.data);
        setTotalPages(Math.ceil(response.data.data.total / response.data.data.per_page));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error);
      Notification.error('Erreur lors de la récupération des invitations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPacks = async () => {
    try {
      const response = await axios.get('/api/user/packs');
      if (response.data.success) {
        setUserPacks(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des packs:', error);
      Notification.error('Erreur lors de la récupération des packs');
    }
  };
  
  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/invitations/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // Ne pas afficher de notification pour ne pas surcharger l'utilisateur
    }
  };

  const handleModalClose = (invitationSent) => {
    setModalOpen(false);
    if (invitationSent) {
      // Rafraîchir les données si une invitation a été envoyée
      fetchInvitations();
      fetchStatistics();
    }
  };
  
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Réinitialiser la pagination lors du changement de filtre
  };
  
  const resetFilters = () => {
    setFilters({
      status: '',
      packId: '',
      dateRange: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleResend = async (id) => {
    try {
      const response = await axios.post(`/api/referral-invitations/${id}/resend`);
      if (response.data.success) {
        Notification.success('Invitation renvoyée avec succès');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      Notification.error('Erreur lors du renvoi de l\'invitation');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/referral-invitations/${id}`);
      if (response.data.success) {
        Notification.success('Invitation supprimée avec succès');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'invitation:', error);
      Notification.error('Erreur lors de la suppression de l\'invitation');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <ClockIcon className="mr-1 h-4 w-4" />
            En attente
          </span>
        );
      case 'sent':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            <EnvelopeIcon className="mr-1 h-4 w-4" />
            Envoyée
          </span>
        );
      case 'opened':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
          }`}>
            <EyeIcon className="mr-1 h-4 w-4" />
            Ouverte
          </span>
        );
      case 'registered':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
          }`}>
            <CheckCircleIcon className="mr-1 h-4 w-4" />
            Inscrit
          </span>
        );
      case 'expired':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            <XCircleIcon className="mr-1 h-4 w-4" />
            Expirée
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <div className="container mx-auto px-1 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invitations de parrainage
          </h1>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Nouvelle invitation
            </button>
          </div>
        </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Carte: Total des invitations */}
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
              <EnvelopeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.total || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Carte: En attente */}
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-600'}`}>
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                En attente
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.pending || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Carte: Envoyées */}
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
              <EnvelopeIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Envoyées
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.sent || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Carte: Inscriptions */}
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'}`}>
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Inscriptions
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.registered || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Carte: Expirées */}
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
              <XCircleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Expirées
              </p>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.expired || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`shadow-md rounded-lg overflow-hidden ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Mes invitations
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                title="Filtres avancés"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
                Filtres
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className={`rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                />
              </div>
            </div>
          </div>
          
          {/* Filtres avancés */}
          {showFilters && (
            <div className={`mt-4 p-4 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={`w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="sent">Envoyée</option>
                    <option value="opened">Ouverte</option>
                    <option value="registered">Inscrit</option>
                    <option value="expired">Expirée</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pack
                  </label>
                  <select
                    value={filters.packId}
                    onChange={(e) => handleFilterChange('packId', e.target.value)}
                    className={`w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option value="">Tous les packs</option>
                    {userPacks.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.pack.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Période
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className={`w-full rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  >
                    <option value="">Toutes les périodes</option>
                    <option value="last7days">7 derniers jours</option>
                    <option value="last30days">30 derniers jours</option>
                    <option value="thisMonth">Ce mois-ci</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className={`inline-flex items-center px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-500'}`}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Destinataire
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Pack
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date d'envoi
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Expiration
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-gray-700 bg-gray-800 text-gray-200' : 'divide-gray-200 bg-white text-gray-900'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <svg className={`animate-spin h-5 w-5 ${isDarkMode ? 'text-primary-400' : 'text-primary-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : invitations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucune invitation trouvée
                    </p>
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className={
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        {invitation.name || 'Sans nom'}
                      </div>
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                        {invitation.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {invitation.user_pack?.pack?.name || 'Pack inconnu'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                        {formatDate(invitation.sent_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                        {formatDate(invitation.expires_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {['pending', 'sent', 'opened'].includes(invitation.status) && (
                        <>
                          <button
                            onClick={() => handleResend(invitation.id)}
                            className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'} mr-3`}
                            title="Renvoyer l'invitation"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(invitation.id)}
                            className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
                            title="Supprimer l'invitation"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className={`px-6 py-3 flex items-center justify-between border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-white text-gray-700'
                } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-white text-gray-700'
                } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Page <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentPage}</span> sur <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 border-gray-600' 
                        : 'bg-white text-gray-500'
                    } ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    <span className="sr-only">Précédent</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 border-gray-600' 
                        : 'bg-white text-gray-500'
                    } ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    <span className="sr-only">Suivant</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Modal d'invitation */}
      <InvitationModal 
        isOpen={modalOpen} 
        onClose={handleModalClose} 
      />
    </>
  );
}