import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PublicationPackContext = createContext();

export const usePublicationPack = () => useContext(PublicationPackContext);

export const PublicationPackProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [packStatus, setPackStatus] = useState({
    isActive: false,
    packInfo: null,
    loading: true,
    error: null
  });

  const checkPackStatus = async () => {
    // On vérifie uniquement si user existe, car isAuthenticated peut être undefined
    if (!user) {
      console.log('Aucun utilisateur connecté, arrêt de la vérification du pack');
      setPackStatus({
        isActive: false,
        packInfo: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      setPackStatus(prev => ({ ...prev, loading: true }));
      const response = await axios.get('/api/user-pack/status');
      
      setPackStatus({
        isActive: response.data.is_active,
        packInfo: response.data.pack,
        loading: false,
        error: null
      });
    } catch (error) {
      setPackStatus({
        isActive: false,
        packInfo: null,
        loading: false,
        error: 'Erreur lors de la vérification du pack'
      });
    }
  };

  useEffect(() => {
    // On vérifie uniquement si user existe, car isAuthenticated peut être undefined
    if (user) {
      checkPackStatus();
    }
  }, [isAuthenticated, user]);

  const value = {
    ...packStatus,
    refreshPackStatus: checkPackStatus
  };

  return (
    <PublicationPackContext.Provider value={value}>
      {children}
    </PublicationPackContext.Provider>
  );
};

export default PublicationPackContext;
