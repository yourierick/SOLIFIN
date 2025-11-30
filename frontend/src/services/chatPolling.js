import axios from "axios";

// Configuration du service de polling
const POLLING_INTERVALS = {
  ACTIVE: parseInt(import.meta.env.VITE_POLLING_INTERVAL_ACTIVE || "5000"), // Intervalle quand la fenêtre est active (défaut: 5 secondes)
  INACTIVE: parseInt(import.meta.env.VITE_POLLING_INTERVAL_INACTIVE || "60000"), // Intervalle quand la fenêtre est inactive (défaut: 60 secondes)
  TYPING_ACTIVE: 2000, // 2 secondes pour les notifications de frappe quand la fenêtre est active
  STATUS_UPDATE: 30000, // 30 secondes pour la mise à jour du statut utilisateur
  STATUS_FETCH: 15000, // 15 secondes pour récupérer les statuts des utilisateurs
  get TYPING() {
    // Utiliser l'intervalle inactif si la fenêtre est inactive, sinon utiliser l'intervalle actif pour les notifications de frappe
    return window.document.hasFocus() ? this.TYPING_ACTIVE : this.INACTIVE;
  },
};

class ChatPollingService {
  constructor() {
    this.pollingIntervals = {};
    this.lastMessageTimestamps = {};
    this.typingPollingIntervals = {};
    this.statusUpdateInterval = null;
    this.statusFetchInterval = null;
    this.callbacks = {
      onNewMessages: {},
      onTypingUsers: {},
      onUserStatuses: null,
    };
    this.isWindowActive = true;
    this.isChatExpanded = false;
    this.userIds = []; // IDs des utilisateurs dont on veut suivre le statut

    // Détecter si la fenêtre est active ou inactive
    window.addEventListener("focus", () => this.handleWindowFocus(true));
    window.addEventListener("blur", () => this.handleWindowFocus(false));

    // Démarrer le polling du statut utilisateur
    this.startStatusUpdatePolling();
  }

  // Gérer le changement d'état de la fenêtre (active/inactive)
  handleWindowFocus(isActive) {
    this.isWindowActive = isActive;

    // Ajuster les intervalles de polling pour tous les salons actifs
    Object.keys(this.pollingIntervals).forEach((roomId) => {
      this.adjustPollingInterval(roomId);
    });

    // Ajuster également les intervalles de polling pour les notifications de frappe
    Object.keys(this.typingPollingIntervals).forEach((roomId) => {
      if (this.typingPollingIntervals[roomId]) {
        clearInterval(this.typingPollingIntervals[roomId]);

        this.typingPollingIntervals[roomId] = setInterval(() => {
          this.fetchTypingUsers(roomId);
        }, POLLING_INTERVALS.TYPING);
      }
    });
  }

  // Ajuster l'intervalle de polling en fonction de l'état de la fenêtre
  adjustPollingInterval(roomId) {
    if (this.pollingIntervals[roomId]) {
      clearInterval(this.pollingIntervals[roomId]);

      const interval = this.isWindowActive
        ? POLLING_INTERVALS.ACTIVE
        : POLLING_INTERVALS.INACTIVE;
      this.startMessagePolling(roomId, interval);
    }
  }

  // Démarrer le polling des messages pour un salon spécifique
  startMessagePolling(roomId, customInterval = null) {
    if (this.pollingIntervals[roomId]) {
      clearInterval(this.pollingIntervals[roomId]);
    }

    const interval =
      customInterval ||
      (this.isWindowActive
        ? POLLING_INTERVALS.ACTIVE
        : POLLING_INTERVALS.INACTIVE);

    this.pollingIntervals[roomId] = setInterval(() => {
      this.fetchNewMessages(roomId);
    }, interval);

    // Faire un premier appel immédiatement
    this.fetchNewMessages(roomId);

    return () => {
      if (this.pollingIntervals[roomId]) {
        clearInterval(this.pollingIntervals[roomId]);
        delete this.pollingIntervals[roomId];
      }
    };
  }

  // Récupérer les nouveaux messages depuis le dernier timestamp
  async fetchNewMessages(roomId) {
    try {
      const lastTimestamp = this.lastMessageTimestamps[roomId] || 0;
      const response = await axios.get(`/api/chat/rooms/${roomId}/messages`, {
        params: { after: lastTimestamp },
      });

      const messages = response.data.messages.data;

      if (messages && messages.length > 0) {
        // Mettre à jour le dernier timestamp
        const latestMessage = messages[0]; // Les messages sont triés par date décroissante
        this.lastMessageTimestamps[roomId] = new Date(
          latestMessage.created_at
        ).getTime();

        // Appeler le callback avec les nouveaux messages
        if (this.callbacks.onNewMessages[roomId]) {
          this.callbacks.onNewMessages[roomId](messages);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des nouveaux messages:",
        error
      );
    }
  }

  // Définir l'état d'expansion du chat
  setChatExpanded(isExpanded) {
    this.isChatExpanded = isExpanded;

    // Si le chat est fermé, arrêter tous les pollings de frappe
    if (!isExpanded) {
      Object.keys(this.typingPollingIntervals).forEach((roomId) => {
        if (this.typingPollingIntervals[roomId]) {
          clearInterval(this.typingPollingIntervals[roomId]);
          delete this.typingPollingIntervals[roomId];
        }
      });
    }
  }

  // Démarrer le polling des utilisateurs en train de taper
  startTypingPolling(roomId) {
    // Si le chat n'est pas ouvert, ne pas démarrer le polling des notifications de frappe
    if (!this.isChatExpanded) {
      return () => {}; // Retourner une fonction vide pour la cohérence
    }

    if (this.typingPollingIntervals[roomId]) {
      clearInterval(this.typingPollingIntervals[roomId]);
    }

    const updateTypingPolling = () => {
      // Utiliser l'intervalle dynamique qui dépend de l'état de la fenêtre
      if (this.typingPollingIntervals[roomId]) {
        clearInterval(this.typingPollingIntervals[roomId]);
      }

      // Ne démarrer le polling que si le chat est ouvert
      if (this.isChatExpanded) {
        this.typingPollingIntervals[roomId] = setInterval(() => {
          this.fetchTypingUsers(roomId);
        }, POLLING_INTERVALS.TYPING_ACTIVE); // Toujours utiliser l'intervalle actif pour les notifications de frappe
      }
    };

    // Mettre à jour l'intervalle quand la fenêtre change d'état
    window.addEventListener("focus", updateTypingPolling);
    window.addEventListener("blur", updateTypingPolling);

    // Configuration initiale
    updateTypingPolling();

    // Faire un premier appel immédiatement si le chat est ouvert
    if (this.isChatExpanded) {
      this.fetchTypingUsers(roomId);
    }

    return () => {
      if (this.typingPollingIntervals[roomId]) {
        clearInterval(this.typingPollingIntervals[roomId]);
        delete this.typingPollingIntervals[roomId];
      }
      window.removeEventListener("focus", updateTypingPolling);
      window.removeEventListener("blur", updateTypingPolling);
    };
  }

  // Récupérer les utilisateurs en train de taper
  async fetchTypingUsers(roomId) {
    // Ne pas récupérer les utilisateurs en train de taper si le chat est fermé
    if (!this.isChatExpanded) {
      return;
    }

    try {
      const response = await axios.get(`/api/chat/rooms/${roomId}/typing`);
      const typingUsers = response.data.typing_users || {};

      // Appeler le callback avec les utilisateurs en train de taper
      if (this.callbacks.onTypingUsers[roomId]) {
        this.callbacks.onTypingUsers[roomId](typingUsers);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des utilisateurs en train de taper:",
        error
      );
    }
  }

  // Envoyer une notification de frappe
  async sendTypingNotification(roomId) {
    try {
      await axios.post(`/api/chat/rooms/${roomId}/typing`);
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification de frappe:",
        error
      );
    }
  }

  // S'abonner aux nouveaux messages
  onNewMessages(roomId, callback) {
    this.callbacks.onNewMessages[roomId] = callback;
  }

  // S'abonner aux notifications de frappe
  onTypingUsers(roomId, callback) {
    this.callbacks.onTypingUsers[roomId] = callback;
  }

  // Arrêter tous les pollings pour un salon
  stopPolling(roomId) {
    if (this.pollingIntervals[roomId]) {
      clearInterval(this.pollingIntervals[roomId]);
      delete this.pollingIntervals[roomId];
    }

    if (this.typingPollingIntervals[roomId]) {
      clearInterval(this.typingPollingIntervals[roomId]);
      delete this.typingPollingIntervals[roomId];
    }

    delete this.callbacks.onNewMessages[roomId];
    delete this.callbacks.onTypingUsers[roomId];
  }

  // Démarrer le polling pour la mise à jour du statut utilisateur
  startStatusUpdatePolling() {
    // Arrêter l'intervalle existant s'il y en a un
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    // Mettre à jour le statut immédiatement
    this.updateUserStatus();

    // Configurer l'intervalle pour les mises à jour régulières
    this.statusUpdateInterval = setInterval(() => {
      // Ne mettre à jour le statut que si la fenêtre est active
      if (this.isWindowActive) {
        this.updateUserStatus();
      }
    }, POLLING_INTERVALS.STATUS_UPDATE);

    return () => {
      if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
        this.statusUpdateInterval = null;
      }
    };
  }

  // Mettre à jour le statut de l'utilisateur actuel
  async updateUserStatus() {
    try {
      await axios.post("/api/user/update-status");
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut utilisateur:",
        error
      );
    }
  }

  // Démarrer le polling pour récupérer les statuts des utilisateurs
  startStatusFetchPolling(userIds = []) {
    // Mettre à jour la liste des IDs utilisateur
    if (userIds.length > 0) {
      this.userIds = [...new Set([...this.userIds, ...userIds])];
    }

    // Arrêter l'intervalle existant s'il y en a un
    if (this.statusFetchInterval) {
      clearInterval(this.statusFetchInterval);
    }

    // Récupérer les statuts immédiatement
    this.fetchUserStatuses();

    // Configurer l'intervalle pour les récupérations régulières
    this.statusFetchInterval = setInterval(() => {
      this.fetchUserStatuses();
    }, POLLING_INTERVALS.STATUS_FETCH);

    return () => {
      if (this.statusFetchInterval) {
        clearInterval(this.statusFetchInterval);
        this.statusFetchInterval = null;
      }
    };
  }

  // Récupérer les statuts des utilisateurs
  async fetchUserStatuses() {
    try {
      // Si nous avons des IDs utilisateur spécifiques, les envoyer dans la requête
      const params = {};
      if (this.userIds.length > 0) {
        params.user_ids = this.userIds;
      }

      const response = await axios.get("/api/user/statuses", { params });
      const statuses = response.data.statuses || {};

      // Appeler le callback avec les statuts des utilisateurs
      if (this.callbacks.onUserStatuses) {
        this.callbacks.onUserStatuses(statuses);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statuts utilisateur:",
        error
      );
    }
  }

  // S'abonner aux mises à jour des statuts utilisateur
  onUserStatuses(callback) {
    this.callbacks.onUserStatuses = callback;
  }

  // Ajouter des utilisateurs à surveiller
  addUsersToTrack(userIds) {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    // Ajouter les nouveaux IDs à la liste existante (sans doublons)
    this.userIds = [...new Set([...this.userIds, ...userIds])];

    // Si nous avons déjà un intervalle de récupération des statuts, récupérer immédiatement
    if (this.statusFetchInterval) {
      this.fetchUserStatuses();
    } else {
      // Sinon, démarrer le polling
      this.startStatusFetchPolling();
    }
  }

  // Arrêter tous les pollings
  stopAllPolling() {
    Object.keys(this.pollingIntervals).forEach((roomId) => {
      clearInterval(this.pollingIntervals[roomId]);
    });

    Object.keys(this.typingPollingIntervals).forEach((roomId) => {
      clearInterval(this.typingPollingIntervals[roomId]);
    });

    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    if (this.statusFetchInterval) {
      clearInterval(this.statusFetchInterval);
    }

    this.pollingIntervals = {};
    this.typingPollingIntervals = {};
    this.statusUpdateInterval = null;
    this.statusFetchInterval = null;
    this.callbacks = {
      onNewMessages: {},
      onTypingUsers: {},
      onUserStatuses: null,
    };
  }
}

// Créer une instance unique du service
const chatPollingService = new ChatPollingService();

export default chatPollingService;
