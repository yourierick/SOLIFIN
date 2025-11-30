import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({ onSendMessage, onTyping, isDarkMode }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Gérer l'envoi du message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if ((message.trim() || file) && !isUploading) {
      onSendMessage(message.trim(), file);
      setMessage('');
      setFile(null);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Gérer la sélection de fichier
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Vérifier la taille du fichier (max 1MB)
      if (selectedFile.size > 1 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. La taille maximale est de 1MB.');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Gérer la notification de frappe
  const handleTyping = () => {
    // Effacer le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Envoyer la notification de frappe
    onTyping();
    
    // Définir un nouveau timeout
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Gérer les touches spéciales (Entrée pour envoyer)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Gérer la sélection d'emoji
  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    const cursorPosition = document.querySelector('.message-input').selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const textAfterCursor = message.substring(cursorPosition);
    
    setMessage(textBeforeCursor + emoji + textAfterCursor);
    setShowEmojiPicker(false);
  };
  
  // Fermer le sélecteur d'emoji quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && 
          emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form 
      className="chat-input-container" 
      onSubmit={handleSendMessage}
      style={{
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e9ecef'}`
      }}
    >
      {file && (
        <div 
          className="file-preview"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#f8f9fa',
            color: isDarkMode ? '#f3f4f6' : '#212529'
          }}
        >
          <div className="file-info">
            <i className={file.type.startsWith('image/') ? 'fas fa-image' : 'fas fa-file'}></i>
            <span className="file-name">{file.name}</span>
          </div>
          <button 
            type="button" 
            className="remove-file-btn"
            style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
            onClick={() => setFile(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      <div className="input-actions">
        <button 
          type="button" 
          className="attach-btn"
          style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          onClick={() => fileInputRef.current.click()}
        >
          <i className="fas fa-paperclip"></i>
        </button>
        
        <button 
          ref={emojiButtonRef}
          type="button" 
          className="emoji-btn"
          style={{ color: isDarkMode ? '#9ca3af' : '#6c757d' }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <i className="far fa-smile"></i>
        </button>
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="emoji-picker-container"
            style={{
              position: 'absolute',
              bottom: '70px',
              left: '40px',
              zIndex: 1000
            }}
          >
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={isDarkMode ? 'dark' : 'light'}
              searchDisabled={false}
              skinTonesDisabled
              width={300}
              height={400}
            />
          </div>
        )}
        
        <textarea
          className="message-input"
          placeholder="Tapez votre message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#f3f4f6' : '#212529',
            borderColor: isDarkMode ? '#4b5563' : '#ced4da'
          }}
        />
        
        <Button 
          type="submit" 
          className="send-btn"
          disabled={(!message.trim() && !file) || isUploading}
        >
          {isUploading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Envoi en cours...</span>
            </div>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </form>
  );
};

export default ChatInput;

// Ajout de styles CSS pour le sélecteur d'emojis
const styles = `
  .emoji-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 10px;
    transition: color 0.2s;
  }
  
  .emoji-btn:hover {
    color: #4f46e5 !important;
  }
  
  .emoji-picker-container {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }
`;

// Injecter les styles dans le document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
