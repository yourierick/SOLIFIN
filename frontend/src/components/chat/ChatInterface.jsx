import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../contexts/ChatContext";
import { useTheme } from "../../contexts/ThemeContext";
import ChatRoomList from "./ChatRoomList";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import "./ChatInterface.css";

const ChatInterface = () => {
  const {
    activeRoom,
    setActiveRoom,
    messages,
    loading,
    typingUsers,
    userStatuses,
    sendMessage,
    sendTypingNotification,
    totalUnreadCount,
    isChatExpanded,
    setIsChatExpanded,
    fetchChatRooms,
  } = useChat();

  const { isDarkMode } = useTheme();

  // Utiliser l'état partagé via le contexte au lieu de l'état local
  // Si un salon actif est déjà sélectionné, afficher directement le chat
  const [showRoomList, setShowRoomList] = useState(!activeRoom);
  const chatContainerRef = useRef(null);

  // Fonction pour basculer l'état d'expansion du chat
  const toggleChat = () => {
    const newExpandedState = !isChatExpanded;
    setIsChatExpanded(newExpandedState);

    // La synchronisation avec le service de polling est gérée dans le contexte
    // Si on ouvre le chat, récupérer les salons de chat
    if (newExpandedState) {
      fetchChatRooms();
    }
  };

  // Fonction pour basculer entre la liste des salons et les messages
  const toggleView = () => {
    if (activeRoom) {
      setShowRoomList(!showRoomList);
    } else {
      setShowRoomList(true);
    }
  };

  // Fonction pour sélectionner un salon
  const selectRoom = (room) => {
    setActiveRoom(room);
    setShowRoomList(false);
  };

  // Fonction pour revenir à la liste des salons
  const backToRoomList = () => {
    setShowRoomList(true);
  };

  // Fonction pour envoyer un message
  const handleSendMessage = async (message, file) => {
    if (activeRoom) {
      await sendMessage(activeRoom.id, message, file);
    }
  };

  // Fonction pour envoyer une notification de frappe
  const handleTyping = () => {
    if (activeRoom) {
      sendTypingNotification(activeRoom.id);
    }
  };

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (chatContainerRef?.current && messages?.length > 0 && !showRoomList) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [messages, showRoomList]);

  // Récupérer les salons de chat lorsque l'interface est ouverte
  useEffect(() => {
    if (isChatExpanded) {
      fetchChatRooms();
    }
  }, [isChatExpanded, fetchChatRooms]);

  // Mettre à jour showRoomList lorsque activeRoom change
  useEffect(() => {
    if (activeRoom) {
      setShowRoomList(false);
    }
  }, [activeRoom]);

  return (
    <div
      className={`chat-interface ${isChatExpanded ? "expanded" : "collapsed"}`}
    >
      {!isChatExpanded ? (
        <div className="chat-button" onClick={toggleChat}>
          <i className="fas fa-comments"></i>
          {totalUnreadCount > 0 && (
            <span className="unread-badge">{totalUnreadCount}</span>
          )}
        </div>
      ) : (
        <div
          className="chat-container"
          style={{
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
            color: isDarkMode ? "#f3f4f6" : "#000000",
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <ChatHeader
            activeRoom={activeRoom}
            onClose={toggleChat}
            onBack={backToRoomList}
            showRoomList={showRoomList}
            isDarkMode={isDarkMode}
          />

          <div className="chat-content" ref={chatContainerRef}>
            {showRoomList ? (
              <ChatRoomList onSelectRoom={selectRoom} isDarkMode={isDarkMode} />
            ) : (
              <ChatMessages
                messages={messages}
                loading={loading}
                typingUsers={typingUsers}
                isDarkMode={isDarkMode}
              />
            )}
          </div>

          {!showRoomList && activeRoom && (
            <ChatInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
