import instance from '../utils/axios';

/**
 * Service pour la gestion des messages de diffusion
 * 
 * Ce service fournit des méthodes pour interagir avec l'API
 * de gestion des messages de diffusion.
 */

/**
 * Récupérer tous les messages de diffusion (admin)
 * @returns {Promise} Promesse contenant les messages
 */
export const getAllBroadcastMessages = async () => {
  return instance.get('/api/admin/broadcast-messages');
};

/**
 * Récupérer les messages de diffusion actifs pour l'utilisateur connecté
 * @returns {Promise} Promesse contenant les messages actifs
 */
export const getActiveBroadcastMessages = async () => {
  return instance.get('/api/broadcast-messages');
};

/**
 * Créer un nouveau message de diffusion
 * @param {Object} messageData Données du message à créer
 * @returns {Promise} Promesse contenant le message créé
 */
export const createBroadcastMessage = async (messageData) => {
  return instance.post('/api/admin/broadcast-messages', messageData);
};

/**
 * Mettre à jour un message de diffusion existant
 * @param {number} id ID du message à mettre à jour
 * @param {Object} messageData Nouvelles données du message
 * @returns {Promise} Promesse contenant le message mis à jour
 */
export const updateBroadcastMessage = async (id, messageData) => {
  return instance.put(`/api/admin/broadcast-messages/${id}`, messageData);
};

/**
 * Supprimer un message de diffusion
 * @param {number} id ID du message à supprimer
 * @returns {Promise} Promesse de suppression
 */
export const deleteBroadcastMessage = async (id) => {
  return instance.delete(`/api/admin/broadcast-messages/${id}`);
};

/**
 * Marquer un message comme vu par l'utilisateur
 * @param {number} id ID du message vu
 * @returns {Promise} Promesse de confirmation
 */
export const markMessageAsSeen = async (id) => {
  return instance.post(`/api/broadcast-messages/${id}/seen`);
};

/**
 * Changer le statut d'un message (actif/inactif)
 * @param {number} id ID du message
 * @param {string} status Nouveau statut ('active' ou 'inactive')
 * @returns {Promise} Promesse contenant le message mis à jour
 */
export const changeBroadcastMessageStatus = async (id, status) => {
  return instance.patch(`/api/admin/broadcast-messages/${id}/status`, { status });
};

/**
 * Récupérer les statistiques des messages de diffusion
 * @returns {Promise} Promesse contenant les statistiques
 */
export const getBroadcastMessageStats = async () => {
  return instance.get('/api/admin/broadcast-messages/stats');
};

export default {
  getAllBroadcastMessages,
  getActiveBroadcastMessages,
  createBroadcastMessage,
  updateBroadcastMessage,
  deleteBroadcastMessage,
  markMessageAsSeen,
  changeBroadcastMessageStatus,
  getBroadcastMessageStats
};
