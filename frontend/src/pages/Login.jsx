/**
 * Login.jsx - Page de connexion
 *
 * Page permettant aux utilisateurs de se connecter à l'application.
 * Gère l'authentification et la redirection post-connexion.
 *
 * Fonctionnalités :
 * - Formulaire de connexion
 * - Validation des champs
 * - Gestion des erreurs
 * - Connexion avec email/mot de passe
 * - "Se souvenir de moi"
 * - Mot de passe oublié
 *
 * Champs :
 * - Email
 * - Mot de passe
 * - Remember me (checkbox)
 *
 * Validation :
 * - Format email valide
 * - Mot de passe requis
 * - Messages d'erreur contextuels
 *
 * Redirection :
 * - Vers la page demandée si existante
 * - Vers le dashboard par défaut
 * - Distinction admin/utilisateur
 *
 * Sécurité :
 * - Protection CSRF
 * - Limitation des tentatives
 * - Stockage sécurisé du token
 */

import React, { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import logo from "../assets/logo.png";

export default function Login() {
  const { isDarkMode } = useTheme();
  const { user, loading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[rgba(17,24,39,0.95)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-primary-50 to-white"
      }`}
    >
      <div
        className={`max-w-md w-full space-y-8 p-2 md:p-8 rounded-xl ${
          isDarkMode ? "bg-gray-800" : "bg-white shadow-lg"
        }`}
      >
        <div className="flex flex-col items-center">
          <div
            className={`mb-2 w-24 h-24 p-2 flex items-center justify-center`}
          >
            <img
              src={logo}
              alt="SOLIFIN Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/80?text=SOLIFIN";
              }}
            />
          </div>
          <h2
            className={`mt-6 text-center text-3xl font-extrabold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Connexion à votre compte
          </h2>
          <p
            className={`mt-2 text-center text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Ou{" "}
            <Link
              to="/register"
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              créez un nouveau compte
            </Link>{" "}
            ou{" "}
            <Link
              to="/"
              className="font-medium text-primary-500 hover:text-primary-400"
            >
              retournez à l'accueil
            </Link>
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
