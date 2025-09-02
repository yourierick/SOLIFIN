import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Styles pour le point de statut en ligne
const styles = {
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981', // Vert pour en ligne
    marginRight: '5px',
    verticalAlign: 'middle'
  }
};

const ChatHeader = ({ activeRoom, onClose, onBack, showRoomList, isDarkMode }) => {
  const { deleteRoom, userStatuses } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Déterminer si l'utilisateur est en ligne et récupérer son dernier statut
  const otherUserId = activeRoom?.other_user?.id;
  const userStatus = otherUserId ? userStatuses[otherUserId] : null;
  const isOnline = userStatus?.is_online || false;
  const lastSeen = userStatus?.last_seen ? new Date(userStatus.last_seen) : null;
  
  // Gérer la suppression d'une conversation
  const handleDeleteRoom = () => {
    if (activeRoom) {
      deleteRoom(activeRoom.id);
      setShowMenu(false);
      onBack();
    }
  };
  
  // Gérer le clic en dehors du menu pour le fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    // Ajouter l'écouteur d'événement lorsque le menu est ouvert
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  return (
    <div 
      className="chat-header"
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#f8f9fa',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`
      }}
    >
      {!showRoomList && activeRoom ? (
        <>
          <button 
            className="back-button" 
            onClick={onBack}
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          
          <div className="room-info">
            <h4 
              className="room-name"
              style={{ color: isDarkMode ? '#f3f4f6' : '#212529' }}
            >
              {activeRoom.other_user ? activeRoom.other_user.name : 'Conversation privée'}
            </h4>
            <div 
              className="room-status"
              style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            >
              {isOnline ? (
                <span className="online-status online">
                  <span style={styles.statusDot}></span> En ligne
                </span>
              ) : lastSeen ? (
                <span className="online-status offline">
                  Vu {formatDistanceToNow(lastSeen, { addSuffix: true, locale: fr })}
                </span>
              ) : (
                <span className="online-status offline">
                  Hors ligne
                </span>
              )}
            </div>
          </div>
          
          <div className="d-flex">
            <button 
              className="close-button me-2" 
              onClick={onClose}
              style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            >
              <i className="fas fa-times"></i>
            </button>
            
            <div className="custom-dropdown" ref={menuRef}>
              <button 
                className="menu-button" 
                onClick={() => setShowMenu(!showMenu)}
                style={{ 
                  color: isDarkMode ? '#9ca3af' : '#6c757d',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              
              {showMenu && (
                <div 
                  className="custom-menu"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '40px',
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`,
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    minWidth: '200px'
                  }}
                >
                  <button 
                    onClick={handleDeleteRoom}
                    className="menu-item"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 15px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: isDarkMode ? '#fc8181' : '#dc3545',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-trash me-2"></i> Supprimer la conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <h4 
            className="chat-title"
            style={{ color: isDarkMode ? '#f3f4f6' : '#212529' }}
          >
            Messages
          </h4>
          <button 
            className="close-button" 
            onClick={onClose}
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </>
      )}
    </div>
  );
};

export default ChatHeader;
