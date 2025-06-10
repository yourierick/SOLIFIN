import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Notification from './Notification';

export default function InvitationModal({ isOpen, onClose }) {
  const { isDarkMode } = useTheme();
  const [userPacks, setUserPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUserPacks();
    }
  }, [isOpen]);

  const fetchUserPacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/packs');
      if (response.data.success) {
        setUserPacks(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedPack(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des packs:', error);
      Notification.error('Erreur lors de la récupération des packs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPack) {
      Notification.error('Veuillez sélectionner un pack');
      return;
    }
    
    if (!email) {
      Notification.error('Veuillez entrer une adresse email');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await axios.post('/api/referral-invitations', {
        user_pack_id: selectedPack,
        email,
        name,
        channel: 'email'
      });
      
      if (response.data.success) {
        Notification.success('Invitation envoyée avec succès');
        setEmail('');
        setName('');
        onClose(true); // Fermer le modal et indiquer qu'une invitation a été envoyée
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      if (error.response && error.response.data && error.response.data.message) {
        Notification.error(error.response.data.message);
      } else {
        Notification.error('Erreur lors de l\'envoi de l\'invitation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all ${
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6"
                  >
                    <div className="flex items-center">
                      <UserPlusIcon className="h-6 w-6 mr-2 text-primary-600" />
                      Envoyer une invitation
                    </div>
                  </Dialog.Title>
                  <button
                    type="button"
                    className={`rounded-md p-1 ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onClose(false)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Pack
                        </label>
                        <select
                          value={selectedPack}
                          onChange={(e) => setSelectedPack(e.target.value)}
                          className={`w-full rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          disabled={userPacks.length === 0}
                        >
                          {userPacks.length === 0 ? (
                            <option value="">Aucun pack disponible</option>
                          ) : (
                            userPacks.map((pack) => (
                              <option key={pack.id} value={pack.id}>
                                {pack.pack.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email*
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="Email du destinataire"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Nom (optionnel)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full rounded-md ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="Nom du destinataire"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                          isDarkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => onClose(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          submitting || userPacks.length === 0 ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                        disabled={submitting || userPacks.length === 0}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <EnvelopeIcon className="h-5 w-5 mr-2" />
                            Envoyer l'invitation
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
