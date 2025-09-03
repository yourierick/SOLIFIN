import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ChatMessages = ({ messages, loading, typingUsers, isDarkMode }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Fonction pour formater la date du message
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: fr });
  };

  // Fonction pour formater la date complète du message
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd MMMM yyyy à HH:mm", { locale: fr });
  };

  // Fonction pour grouper les messages par date
  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((message) => {
      const date = new Date(message.created_at);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: format(date, "dd MMMM yyyy", { locale: fr }),
          messages: [],
        };
      }

      groups[dateKey].messages.push(message);
    });

    return Object.values(groups);
  };

  // Afficher le contenu du message en fonction de son type
  const renderMessageContent = (message) => {
    switch (message.type) {
      case "image":
        return (
          <div className="message-image">
            <img
              src={message.file_path}
              alt="Image"
              onClick={() => window.open(message.file_path, "_blank")}
            />
          </div>
        );
      case "file":
        return (
          <div className="message-file">
            <a
              href={message.file_path}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-file"></i> Télécharger le fichier
            </a>
          </div>
        );
      case "text":
      default:
        return <p className="message-text">{message.message}</p>;
    }
  };

  // Gérer le défilement des messages
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      
      setIsScrolledUp(!isAtBottom);
      setScrollPosition(scrollTop);
    };
    
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  // Gérer le défilement automatique uniquement si l'utilisateur est déjà en bas
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    // Si de nouveaux messages sont arrivés
    if (messages.length > prevMessagesLength) {
      // Si l'utilisateur était déjà en bas ou si c'est le chargement initial
      if (!isScrolledUp || prevMessagesLength === 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Maintenir la position de défilement si l'utilisateur était en train de lire d'anciens messages
        const { scrollHeight: newScrollHeight } = messagesContainerRef.current;
        const newPosition = scrollPosition + (newScrollHeight - messagesContainerRef.current.clientHeight - scrollPosition);
        messagesContainerRef.current.scrollTop = newPosition;
      }
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, typingUsers, isScrolledUp, prevMessagesLength, scrollPosition]);
  
  // Bouton pour revenir en bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
  };

  const messageGroups = groupMessagesByDate([...messages].reverse());

  return (
    <div className="chat-messages" ref={messagesContainerRef}>
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div
          className="no-messages"
          style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}
        >
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            Aucun message dans ce salon.
          </p>
          <p style={{ fontSize: "14px" }}>Envoyez le premier message !</p>
        </div>
      ) : (
        <>
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="message-date-group">
              <div className="date-separator">
                <span
                  style={{
                    backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                    color: isDarkMode ? "#9ca3af" : "#6c757d",
                  }}
                >
                  {group.date}
                </span>
              </div>

              {group.messages.map((message) => {
                const isOwnMessage = message.sender_id === user.id;

                return (
                  <div
                    key={message.id}
                    className={`message-item ${
                      isOwnMessage ? "own-message" : "other-message"
                    }`}
                  >
                    <div className="message-avatar">
                      {message.sender?.picture_url ? (
                        <img
                          src={message.sender.picture_url}
                          alt={message.sender.name}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {message.sender?.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>

                    <div className="message-content">
                      {!isOwnMessage && (
                        <div className="message-sender">
                          {message.sender?.name}
                        </div>
                      )}

                      <div
                        className="message-bubble"
                        style={{
                          backgroundColor: isOwnMessage
                            ? "#0d6efd"
                            : isDarkMode
                            ? "#374151"
                            : "#f1f3f5",
                          color: isOwnMessage
                            ? "#fff"
                            : isDarkMode
                            ? "#f3f4f6"
                            : "#212529",
                        }}
                      >
                        {renderMessageContent(message)}

                        <div
                          className="message-time"
                          title={formatMessageDate(message.created_at)}
                        >
                          {formatMessageTime(message.created_at)}
                          {isOwnMessage && message.is_read && (
                            <span className="read-status">
                              <i className="fas fa-check-double"></i>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Afficher les utilisateurs en train de taper */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="typing-indicator">
              <div className="typing-avatar">
                {Object.values(typingUsers)[0]?.picture ? (
                  <img
                    src={Object.values(typingUsers)[0].picture}
                    alt={Object.values(typingUsers)[0].name}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {Object.values(typingUsers)[0]?.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
      
      {/* Bouton pour revenir en bas quand on est remonté dans les messages */}
      {isScrolledUp && messages.length > 0 && (
        <button 
          className="scroll-to-bottom-btn"
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            backgroundColor: isDarkMode ? '#374151' : '#f8f9fa',
            color: isDarkMode ? '#f3f4f6' : '#212529',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#dee2e6'}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 10
          }}
        >
          <i className="fas fa-arrow-down"></i>
        </button>
      )}
    </div>
  );
};

export default ChatMessages;

// Styles CSS pour le défilement
const styles = `
  .chat-messages {
    position: relative;
    overflow-y: auto;
    height: 100%;
    scroll-behavior: smooth;
  }
  
  .scroll-to-bottom-btn:hover {
    transform: scale(1.05);
    transition: transform 0.2s;
  }
`;

// Injecter les styles dans le document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
