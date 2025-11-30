import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import chatPollingService from "../services/chatPolling";
import axios from "axios";
import { toast } from "react-toastify";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [userStatuses, setUserStatuses] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Synchroniser l'état d'expansion initial avec le service de polling
  useEffect(() => {
    chatPollingService.setChatExpanded(isChatExpanded);
  }, [isChatExpanded]);

  // Charger les salons de chat
  const fetchChatRooms = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.get("/api/chat/rooms");
      setChatRooms(response.data.rooms);

      // Initialiser les compteurs de messages non lus
      const unreadCounts = {};
      response.data.rooms.forEach((room) => {
        unreadCounts[room.id] = room.unread_count || 0;
      });
      setUnreadMessages(unreadCounts);
    } catch (error) {
      console.error("Erreur lors du chargement des salons de chat:", error);
      toast.error("Impossible de charger les salons de chat");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger les messages d'un salon
  const fetchMessages = useCallback(
    async (roomId) => {
      if (!roomId) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/chat/rooms/${roomId}/messages`);
        setMessages(response.data.messages.data);

        // Mettre à jour le dernier timestamp pour le polling
        if (response.data.messages.data.length > 0) {
          const latestMessage = response.data.messages.data[0]; // Les messages sont triés par date décroissante
          chatPollingService.lastMessageTimestamps[roomId] = new Date(
            latestMessage.created_at
          ).getTime();
        }

        // Marquer les messages comme lus
        if (unreadMessages[roomId]) {
          setUnreadMessages((prev) => ({
            ...prev,
            [roomId]: 0,
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
        toast.error("Impossible de charger les messages");
      } finally {
        setLoading(false);
      }
    },
    [unreadMessages]
  );

  // Envoyer un message
  const sendMessage = useCallback(async (roomId, message, file = null) => {
    if (!roomId || (!message && !file)) return;

    try {
      const formData = new FormData();
      if (message) formData.append("message", message);
      if (file) formData.append("file", file);
      formData.append(
        "type",
        file ? (file.type.startsWith("image/") ? "image" : "file") : "text"
      );

      const response = await axios.post(
        `/api/chat/rooms/${roomId}/messages`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Ajouter le message à la liste
      setMessages((prev) => [response.data.chat_message, ...prev]);

      return response.data.chat_message;
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Impossible d'envoyer le message");
      return null;
    }
  }, []);

  // Notifier que l'utilisateur est en train de taper
  const sendTypingNotification = useCallback(async (roomId) => {
    if (!roomId) return;

    try {
      await chatPollingService.sendTypingNotification(roomId);
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de la notification de frappe:",
        error
      );
    }
  }, []);

  // Créer une nouvelle conversation privée ou récupérer une existante
  const createChatRoom = useCallback(
    async (userId) => {
      try {
        // Récupérer la liste à jour des salons avant de vérifier
        await fetchChatRooms();

        // Vérifier d'abord si un salon existe déjà avec cet utilisateur
        const existingRoom = chatRooms.find(
          (room) => room.other_user && room.other_user.id === userId
        );

        if (existingRoom) {
          // Si un salon existe déjà, le retourner
          return existingRoom;
        }

        // Sinon, créer un nouveau salon (le backend vérifie déjà l'existence)
        const response = await axios.post("/api/chat/rooms", {
          user_id: userId,
        });

        // Si le backend a trouvé un salon existant ou en a créé un nouveau
        if (response.data.room) {
          // Vérifier si ce salon existe déjà dans notre liste locale
          const roomExists = chatRooms.some(
            (room) => room.id === response.data.room.id
          );

          // Ajouter le salon à la liste seulement s'il n'existe pas déjà
          if (!roomExists) {
            setChatRooms((prev) => [...prev, response.data.room]);
          }

          return response.data.room;
        }

        return null;
      } catch (error) {
        console.error("Erreur lors de la création de la conversation:", error);
        toast.error("Impossible de créer la conversation");
        return null;
      }
    },
    [chatRooms, fetchChatRooms]
  );

  // Supprimer une conversation
  const deleteRoom = useCallback(
    async (roomId) => {
      try {
        await axios.delete(`/api/chat/rooms/${roomId}`);
        toast.success("Conversation supprimée avec succès");

        // Mettre à jour la liste des conversations
        setChatRooms((prev) => prev.filter((room) => room.id !== roomId));

        if (activeRoom && activeRoom.id === roomId) {
          setActiveRoom(null);
          setMessages([]);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la suppression de la conversation:",
          error
        );
        toast.error("Impossible de supprimer la conversation");
      }
    },
    [activeRoom]
  );

  // Configurer le polling lorsqu'un salon est actif
  useEffect(() => {
    if (!activeRoom) return;

    // Démarrer le polling des messages
    const stopMessagePolling = chatPollingService.startMessagePolling(
      activeRoom.id
    );

    // Démarrer le polling des utilisateurs en train de taper
    const stopTypingPolling = chatPollingService.startTypingPolling(
      activeRoom.id
    );

    // S'abonner aux nouveaux messages
    chatPollingService.onNewMessages(activeRoom.id, (newMessages) => {
      setMessages((prev) => {
        // Filtrer les messages déjà présents pour éviter les doublons
        const existingIds = new Set(prev.map((msg) => msg.id));
        const uniqueNewMessages = newMessages.filter(
          (msg) => !existingIds.has(msg.id)
        );

        if (uniqueNewMessages.length === 0) return prev;
        return [...uniqueNewMessages, ...prev];
      });
    });

    // S'abonner aux notifications de frappe
    chatPollingService.onTypingUsers(activeRoom.id, (typingUsersData) => {
      setTypingUsers(typingUsersData);
    });

    // Nettoyer les abonnements
    return () => {
      stopMessagePolling();
      stopTypingPolling();
    };
  }, [activeRoom]);

  // Vérifier périodiquement les nouveaux messages dans tous les salons pour mettre à jour les compteurs
  useEffect(() => {
    if (!user || !chatRooms.length) return;

    // Créer un intervalle pour vérifier les nouveaux messages dans tous les salons
    const checkInterval = setInterval(async () => {
      // Ne vérifier que si la page est visible et qu'il y a des salons non actifs
      if (document.visibilityState !== "visible") return;

      // Ne vérifier que les salons qui ne sont pas actuellement actifs
      const roomsToCheck = chatRooms.filter(
        (room) => !activeRoom || activeRoom.id !== room.id
      );

      if (roomsToCheck.length === 0) return;

      for (const room of roomsToCheck) {
        try {
          // Récupérer uniquement le nombre de nouveaux messages non lus
          const response = await axios.get(
            `/api/chat/rooms/${room.id}/messages`,
            {
              params: { unread_only: true },
            }
          );

          const unreadCount = response.data.unread_count || 0;

          if (unreadCount > 0) {
            setUnreadMessages((prev) => ({
              ...prev,
              [room.id]: unreadCount,
            }));
          }
        } catch (error) {
          console.error(
            `Erreur lors de la vérification des messages non lus pour le salon ${room.id}:`,
            error
          );
        }
      }
    }, 5000); // Vérifier toutes les 5 secondes

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Vérifier immédiatement les messages non lus lorsque l'utilisateur revient sur la page
        const roomsToCheck = chatRooms.filter(
          (room) => !activeRoom || activeRoom.id !== room.id
        );

        roomsToCheck.forEach(async (room) => {
          try {
            const response = await axios.get(
              `/api/chat/rooms/${room.id}/messages`,
              {
                params: { unread_only: true },
              }
            );

            const unreadCount = response.data.unread_count || 0;

            if (unreadCount > 0) {
              setUnreadMessages((prev) => ({
                ...prev,
                [room.id]: unreadCount,
              }));
            }
          } catch (error) {
            console.error(
              `Erreur lors de la vérification des messages non lus pour le salon ${room.id}:`,
              error
            );
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [chatRooms, activeRoom, user]);

  // Charger les salons au chargement initial
  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user, fetchChatRooms]);

  // Charger les messages lorsqu'un salon est sélectionné
  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
    }
  }, [activeRoom, fetchMessages]);

  // Fonction pour définir l'état d'expansion du chat avec synchronisation
  const setIsChatExpandedWithSync = useCallback((isExpanded) => {
    setIsChatExpanded(isExpanded);
    chatPollingService.setChatExpanded(isExpanded);
  }, []);

  // Fonction pour basculer l'état d'expansion du chat
  const toggleChat = () => {
    const newExpandedState = !isChatExpanded;
    setIsChatExpandedWithSync(newExpandedState);

    // Si on ouvre le chat, récupérer les salons de chat
    if (newExpandedState) {
      fetchChatRooms();
    }
  };

  const value = {
    chatRooms,
    activeRoom,
    setActiveRoom,
    messages,
    loading,
    typingUsers,
    onlineUsers,
    userStatuses,
    unreadMessages,
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    sendTypingNotification,
    createChatRoom,
    deleteRoom,
    isChatExpanded,
    setIsChatExpanded: setIsChatExpandedWithSync,
    totalUnreadCount: Object.values(unreadMessages).reduce((a, b) => a + b, 0),
  };

  // Configurer le polling des statuts utilisateur
  useEffect(() => {
    if (!user) return;

    // S'abonner aux mises à jour des statuts utilisateur
    chatPollingService.onUserStatuses((statuses) => {
      setUserStatuses(statuses);

      // Mettre à jour l'objet onlineUsers pour la rétrocompatibilité
      const onlineUsersMap = {};
      Object.keys(statuses).forEach((userId) => {
        onlineUsersMap[userId] = statuses[userId].is_online;
      });
      setOnlineUsers(onlineUsersMap);
    });

    // Démarrer le polling des statuts utilisateur
    const stopStatusUpdatePolling =
      chatPollingService.startStatusUpdatePolling();

    return () => {
      stopStatusUpdatePolling();
    };
  }, [user]);

  // Ajouter les utilisateurs des salons de chat à la liste des utilisateurs à suivre
  useEffect(() => {
    if (!chatRooms.length) return;

    // Extraire les IDs des utilisateurs des salons de chat
    const userIds = chatRooms
      .filter((room) => room.other_user)
      .map((room) => room.other_user.id);

    if (userIds.length > 0) {
      // Ajouter ces utilisateurs à la liste des utilisateurs à suivre
      chatPollingService.addUsersToTrack(userIds);
    }
  }, [chatRooms]);

  // Nettoyer tous les pollings lorsque le composant est démonté
  useEffect(() => {
    return () => {
      chatPollingService.stopAllPolling();
    };
  }, []);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatContext;
