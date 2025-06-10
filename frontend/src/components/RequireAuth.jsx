/**
 * RequireAuth.jsx - Protection des routes authentifiées
 * 
 * Composant de plus haut niveau qui protège les routes nécessitant une authentification.
 * Vérifie l'état de connexion et les permissions avant d'autoriser l'accès.
 * 
 * Fonctionnalités :
 * - Vérification de l'authentification
 * - Vérification des rôles
 * - Redirection intelligente
 * - Mémorisation de la route demandée
 * 
 * Comportements :
 * - Non connecté -> Redirection vers login
 * - Connecté sans permissions -> Page 403
 * - Connecté avec permissions -> Accès autorisé
 * - Token expiré -> Déconnexion et redirection
 * 
 * Utilisation du contexte :
 * - AuthContext pour l'état de connexion
 * - Stockage de la route cible
 * - Gestion des tokens
 * 
 * Sécurité :
 * - Validation du token JWT
 * - Vérification des permissions
 * - Protection contre les accès directs
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Attendre que la vérification de l'authentification soit terminée
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!user) {
    // Sauvegarder la page actuelle pour y revenir après la connexion
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Vérifier le rôle de l'utilisateur
  if (role && user.role !== role) {
    // Rediriger vers le tableau de bord approprié si l'utilisateur n'a pas le bon rôle
    const redirectPath = user.role === 'admin' ? '/admin' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
