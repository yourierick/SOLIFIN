/**
 * Script de test pour le système de chat avec polling
 * 
 * Ce script permet de tester le fonctionnement du service de polling pour le chat
 * en simulant l'envoi et la réception de messages.
 */

import chatPollingService from '../services/chatPolling';
import axios from 'axios';

// Configuration pour les tests
const TEST_CONFIG = {
  roomId: 1, // ID du salon de test
  message: 'Message de test depuis le système de polling',
  typingInterval: 2000, // 2 secondes
  messageCheckInterval: 5000, // 5 secondes
};

// Fonction pour tester l'envoi d'un message
const testSendMessage = async () => {
  console.log('🧪 Test: Envoi d\'un message');
  
  try {
    const formData = new FormData();
    formData.append('message', TEST_CONFIG.message);
    formData.append('type', 'text');
    
    const response = await axios.post(
      `/api/chat/rooms/${TEST_CONFIG.roomId}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('✅ Message envoyé avec succès:', response.data.chat_message);
    return response.data.chat_message;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    return null;
  }
};

// Fonction pour tester la notification de frappe
const testTypingNotification = async () => {
  console.log('🧪 Test: Envoi d\'une notification de frappe');
  
  try {
    await chatPollingService.sendTypingNotification(TEST_CONFIG.roomId);
    console.log('✅ Notification de frappe envoyée avec succès');
    
    // Vérifier si la notification est bien reçue
    setTimeout(async () => {
      try {
        const response = await axios.get(`/api/chat/rooms/${TEST_CONFIG.roomId}/typing`);
        console.log('✅ Utilisateurs en train de taper:', response.data.typing_users);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs en train de taper:', error);
      }
    }, TEST_CONFIG.typingInterval);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification de frappe:', error);
  }
};

// Fonction pour tester la récupération des nouveaux messages
const testFetchNewMessages = async (lastTimestamp = 0) => {
  console.log('🧪 Test: Récupération des nouveaux messages');
  
  try {
    const response = await axios.get(`/api/chat/rooms/${TEST_CONFIG.roomId}/messages`, {
      params: { after: lastTimestamp }
    });
    
    const messages = response.data.messages.data;
    console.log(`✅ ${messages.length} nouveaux messages récupérés:`, messages);
    
    if (messages && messages.length > 0) {
      const latestMessage = messages[0];
      return new Date(latestMessage.created_at).getTime();
    }
    
    return lastTimestamp;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des nouveaux messages:', error);
    return lastTimestamp;
  }
};

// Fonction pour tester le polling complet
const testPolling = async () => {
  console.log('🧪 Démarrage du test de polling');
  
  // 1. Envoyer un message
  const sentMessage = await testSendMessage();
  
  if (!sentMessage) {
    console.error('❌ Test de polling annulé: impossible d\'envoyer le message initial');
    return;
  }
  
  // 2. Envoyer une notification de frappe
  await testTypingNotification();
  
  // 3. Récupérer les nouveaux messages avec polling
  let lastTimestamp = new Date(sentMessage.created_at).getTime();
  
  console.log('⏱️ Démarrage du polling des messages (30 secondes)');
  
  // Simuler le polling pendant 30 secondes
  const pollingInterval = setInterval(async () => {
    lastTimestamp = await testFetchNewMessages(lastTimestamp);
  }, TEST_CONFIG.messageCheckInterval);
  
  // Arrêter le polling après 30 secondes
  setTimeout(() => {
    clearInterval(pollingInterval);
    console.log('✅ Test de polling terminé');
  }, 30000);
};

// Exporter les fonctions de test
export const chatPollingTests = {
  testSendMessage,
  testTypingNotification,
  testFetchNewMessages,
  testPolling
};

export default chatPollingTests;
