import React from 'react';
import { Box, Typography } from '@mui/material';
import AdminBroadcastMessages from '../../components/admin/AdminBroadcastMessages';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Page d'administration pour la gestion des messages de diffusion
 * 
 * Cette page affiche le composant AdminBroadcastMessages dans le layout administratif.
 */
const BroadcastMessagesPage = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: isDarkMode ? 'rgb(17, 24, 39)' : '#f9fafb',
      minHeight: 'calc(100vh - 64px)',
      color: isDarkMode ? 'white' : 'inherit'
    }}>
      <AdminBroadcastMessages />
    </Box>
  );
};

export default BroadcastMessagesPage;
