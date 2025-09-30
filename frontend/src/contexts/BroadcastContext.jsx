import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import instance from "../utils/axios";
import BroadcastMessageModal from "../components/broadcast/BroadcastMessageModal";
import { useAuth } from "./AuthContext";

/**
 * Contexte pour la gestion des messages de diffusion
 *
 * Ce contexte gère l'affichage des messages de diffusion aux utilisateurs
 * et le stockage des messages déjà vus pour éviter de les afficher plusieurs fois.
 */
const BroadcastContext = createContext(null);

export const useBroadcast = () => {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error("useBroadcast doit être utilisé dans un BroadcastProvider");
  }
  return context;
};

export const BroadcastProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [messagesToShow, setMessagesToShow] = useState([]);
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);

  // Récupérer les messages de diffusion non vus
  const fetchUnseenMessages = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await instance.get("/api/broadcast-messages");
      if (response.data && response.data.data) {
        setMessages(response.data.data);

        // Si des messages sont disponibles, les afficher
        if (response.data.data.length > 0) {
          setMessagesToShow(response.data.data);
          setModalOpen(true);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des messages de diffusion:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Vérifier s'il y a de nouveaux messages (polling)
  const checkNewMessages = async () => {
    if (!user) return;

    try {
      const response = await instance.get("/api/broadcast-messages/check");
      if (response.data && response.data.has_new_messages) {
        // Si de nouveaux messages sont disponibles, les récupérer
        fetchUnseenMessages();
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des nouveaux messages:",
        error
      );
    }
  };

  // Marquer un message comme vu
  const markMessageAsSeen = async (messageId) => {
    if (!user || !messageId) return;

    try {
      await instance.post(`/api/broadcast-messages/${messageId}/seen`);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du message vu:", error);
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Démarrer le polling
  const startPolling = () => {
    // Vérifier immédiatement s'il y a des messages
    checkNewMessages();

    // Démarrer le polling toutes les 5 minutes
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        // Vérifier si la page est visible avant de faire la requête
        if (document.visibilityState === "visible") {
          checkNewMessages();
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  };

  // Arrêter le polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  // Démarrer le polling avec un délai initial
  const startPollingWithDelay = () => {
    // Attendre 15 secondes après le chargement de la page avant de commencer le polling
    pollingTimeoutRef.current = setTimeout(() => {
      startPolling();
    }, 15000); // 15 secondes au lieu de 10 secondes
  };

  // Gérer les changements de visibilité de la page
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && user) {
      // Rafraîchir les messages quand l'utilisateur revient sur la page
      checkNewMessages();
    }
  };

  // Démarrer le polling au chargement du composant
  useEffect(() => {
    if (user) {
      startPollingWithDelay();

      // Ajouter l'écouteur d'événement pour la visibilité de la page
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Nettoyer les intervalles lors du démontage du composant
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const value = {
    messages,
    loading,
    markMessageAsSeen,
    checkNewMessages,
    startPolling,
    stopPolling,
  };

  return (
    <BroadcastContext.Provider value={value}>
      {children}
      <BroadcastMessageModal
        open={modalOpen}
        onClose={closeModal}
        messages={messagesToShow}
        onMessageSeen={markMessageAsSeen}
      />
    </BroadcastContext.Provider>
  );
};

export default BroadcastContext;
