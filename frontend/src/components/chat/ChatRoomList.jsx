import React, { useState, useCallback } from "react";
import { useChat } from "../../contexts/ChatContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "react-bootstrap";

const ChatRoomList = ({ onSelectRoom, isDarkMode }) => {
  const { chatRooms, loading, unreadMessages } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredRoomId, setHoveredRoomId] = useState(null);

  // Filtrer les conversations en fonction du terme de recherche
  const filteredRooms = chatRooms.filter((room) => {
    const otherUser = room.other_user || {};
    const name = otherUser.name || room.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Trier les salons par date du dernier message
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
    const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
    return dateB - dateA;
  });

  return (
    <div className="chat-room-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher une conversation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{
            backgroundColor: isDarkMode ? "#374151" : "#fff",
            color: isDarkMode ? "#f3f4f6" : "#212529",
            borderColor: isDarkMode ? "#4b5563" : "#ced4da",
            boxShadow: isDarkMode ? "0 1px 3px rgba(0, 0, 0, 0.2)" : "none",
          }}
        />
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : sortedRooms.length === 0 ? (
        <div className="no-rooms">
          <p>Aucune conversation trouvée.</p>
        </div>
      ) : (
        <ul className="room-list">
          {sortedRooms.map((room) => (
            <li
              key={room.id}
              className="room-item"
              onClick={() => onSelectRoom(room)}
              onMouseEnter={() => setHoveredRoomId(room.id)}
              onMouseLeave={() => setHoveredRoomId(null)}
              style={{
                backgroundColor:
                  hoveredRoomId === room.id
                    ? isDarkMode
                      ? "#374151"
                      : "#f8f9fa"
                    : isDarkMode
                    ? "#1f2937"
                    : "#fff",
                borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e9ecef"}`,
                transition: "background-color 0.2s ease",
              }}
            >
              <div className="room-icon">
                {room.other_user?.picture ? (
                  <img
                    src={room.other_user.picture}
                    alt={room.other_user.name}
                    className="user-profile-pic"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {room.other_user?.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <div className="room-info">
                <div className="room-header">
                  <h5
                    className="room-name"
                    style={{ color: isDarkMode ? "#f3f4f6" : "#212529" }}
                  >
                    {room.other_user
                      ? room.other_user.name
                      : "Conversation privée"}
                  </h5>
                  {room.last_message_at && (
                    <span
                      className="room-time"
                      style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}
                    >
                      {format(new Date(room.last_message_at), "dd MMM", {
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>
                <p
                  className="room-last-message"
                  style={{ color: isDarkMode ? "#9ca3af" : "#6c757d" }}
                >
                  {room.last_message || "Aucun nouveau message"}
                </p>
              </div>
              {unreadMessages[room.id] > 0 && (
                <div className="unread-count">{unreadMessages[room.id]}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatRoomList;
