import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { chatPollingTests } from '../tests/chatPollingTest';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChatPollingTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fonction pour ajouter un résultat de test
  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  // Fonction pour exécuter tous les tests
  const runAllTests = async () => {
    if (!user) {
      addResult('Vous devez être connecté pour exécuter les tests', 'danger');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    addResult('Démarrage des tests de polling pour le chat...', 'primary');

    try {
      // Test d'envoi de message
      addResult('Test 1/3: Envoi d\'un message');
      const sentMessage = await chatPollingTests.testSendMessage();
      
      if (sentMessage) {
        addResult('✅ Message envoyé avec succès', 'success');
      } else {
        addResult('❌ Échec de l\'envoi du message', 'danger');
      }

      // Test de notification de frappe
      addResult('Test 2/3: Notification de frappe');
      await chatPollingTests.testTypingNotification();
      addResult('✅ Notification de frappe envoyée', 'success');

      // Test de récupération des messages
      addResult('Test 3/3: Récupération des messages');
      const timestamp = sentMessage ? new Date(sentMessage.created_at).getTime() : 0;
      const newTimestamp = await chatPollingTests.testFetchNewMessages(timestamp);
      
      if (newTimestamp > timestamp) {
        addResult('✅ Messages récupérés avec succès', 'success');
      } else {
        addResult('ℹ️ Aucun nouveau message récupéré', 'info');
      }

      addResult('Tests terminés!', 'primary');
    } catch (error) {
      console.error('Erreur lors des tests:', error);
      addResult(`❌ Erreur lors des tests: ${error.message}`, 'danger');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Test du système de chat avec polling</h4>
        </Card.Header>
        <Card.Body>
          <p className="mb-4">
            Cette page permet de tester le fonctionnement du système de chat avec polling
            qui a remplacé le système basé sur WebSockets.
          </p>

          <div className="d-flex gap-2 mb-4">
            <Button 
              variant="primary" 
              onClick={runAllTests} 
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Exécution des tests...</span>
                </>
              ) : 'Exécuter les tests'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
            >
              Retour au tableau de bord
            </Button>
          </div>

          <h5>Résultats des tests:</h5>
          <div 
            className="border rounded p-3 bg-light" 
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            {testResults.length === 0 ? (
              <p className="text-muted">Aucun test exécuté</p>
            ) : (
              testResults.map((result, index) => (
                <Alert key={index} variant={result.type} className="py-2 mb-2">
                  <small className="text-muted">
                    {result.timestamp.toLocaleTimeString()}
                  </small>
                  <div>{result.message}</div>
                </Alert>
              ))
            )}
          </div>
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>
            Note: Ces tests vérifient l'envoi et la réception de messages via le système de polling.
            Assurez-vous d'être connecté et d'avoir accès à au moins un salon de chat.
          </small>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default ChatPollingTest;
