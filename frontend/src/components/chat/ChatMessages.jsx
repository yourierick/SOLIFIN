import React, { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ChatMessages = ({ messages, loading, typingUsers, isDarkMode }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

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

  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const messageGroups = groupMessagesByDate([...messages].reverse());

  return (
    <div className="chat-messages">
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
    </div>
  );
};

export default ChatMessages;
