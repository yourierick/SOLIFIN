import React, { useState, useRef } from 'react';
import { Button } from 'react-bootstrap';

const ChatInput = ({ onSendMessage, onTyping, isDarkMode }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
