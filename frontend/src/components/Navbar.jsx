/**
 * Navbar.jsx - Barre de navigation principale
 * 
 * Barre de navigation responsive qui s'adapte au rôle de l'utilisateur
 * et à l'état de connexion. Gère la navigation principale de l'application.
 * 
 * Fonctionnalités :
 * - Menu hamburger pour mobile
 * - Dropdown utilisateur
 * - Notifications
 * - Changement de thème
 * - Logo et marque
 * 
 * États :
 * - Non connecté : Liens vers login/register
 * - Utilisateur : Dashboard, profil, notifications
 * - Admin : Accès au panel admin
 * 
 * Navigation :
 * - Accueil
 * - À propos
 * - Services
 * - Contact
 * - Dashboard (si connecté)
 * 
 * Composants intégrés :
 * - NotificationsDropdown
 * - ThemeToggle
 * - UserMenu
 * 
 * Responsive :
 * - Desktop : Menu complet
 * - Mobile : Menu hamburger
 * - Tablette : Adaptation dynamique
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UsersIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Accueil', href: 'hero' },
  { name: 'Caractéristiques', href: 'features' },
  { name: 'Packs', href: 'packages' },
  { name: 'Parrainage', href: 'referral' },
  { name: 'Témoignages', href: 'testimonials' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { pathname } = location;
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const isHomePage = location.pathname === '/';

  const adminNavigation = [
    {
      name: 'Utilisateurs',
      href: '/admin/users',
      icon: UsersIcon,
      current: pathname === '/admin/users',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? isDarkMode 
            ? 'bg-gray-900/95 shadow-[0_4px_30px_rgba(255,255,255,0.1)]' 
            : 'bg-white/95 shadow-[0_2px_15px_rgba(0,0,0,0.1)]'
          : 'bg-transparent'
      }`}
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <RouterLink to="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <img
                  className="w-auto h-10 sm:h-12"
                  src="/img/logo-png.png"
                  alt="Logo"
                />
              </motion.div>
            </RouterLink>
          </div>

          {/* Navigation principale */}
          <div className="hidden md:ml-6 md:flex md:space-x-8">
            {isHomePage ? (
              navigation.map((item) => (
                <ScrollLink
                  key={item.name}
                  to={item.href}
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  className={`inline-flex items-center px-1 pt-1 text-base font-medium hover:text-primary-600 transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  {item.name}
                </ScrollLink>
              ))
            ) : (
              adminNavigation.map((item) => (
                <RouterLink
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-base font-medium transition-colors duration-200 ${
                    item.current
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : isDarkMode
                      ? 'text-gray-200 hover:text-primary-500'
                      : 'text-gray-900 hover:text-primary-600'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </RouterLink>
              ))
            )}
          </div>

          <div className="hidden md:ml-6 md:flex md:items-center">
            {user ? user.is_admin ? (
              <div className="flex items-center space-x-4">
                <RouterLink
                  to="/admin"
                  className={`inline-flex items-center btn-primary px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-white-200 hover:text-white'
                      : 'text-white-900 hover:text-white'
                  }`}
                >
                  Tableau de bord
                </RouterLink>
                <button
                  onClick={logout}
                  className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <RouterLink
                  to="/dashboard"
                  className={`inline-flex bg-primary-600 hover:bg-primary-700 items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-white hover:text-white-700'
                  }`}
                >
                  Tableau de bord
                </RouterLink>
                <RouterLink
                  to="/dashboard/packs"
                  className={`inline-flex bg-gray-600 hover:bg-gray-700 items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-white hover:text-white-700'
                  }`}
                >
                  Mes Packs
                </RouterLink>
                <button
                  onClick={logout}
                  className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <RouterLink
                  to="/login"
                  className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                >
                  Connexion
                </RouterLink>
                <RouterLink
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors duration-200"
                >
                  Inscription
                </RouterLink>
              </div>
            )}
          </div>

          {/* Bouton mobile */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                isDarkMode
                  ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                  : 'text-gray-900 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className={`md:hidden overflow-hidden ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {isHomePage
            ? navigation.map((item) => (
                <ScrollLink
                  key={item.name}
                  to={item.href}
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    isDarkMode
                      ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                      : 'text-gray-900 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </ScrollLink>
              ))
            : adminNavigation.map((item) => (
                <RouterLink
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    item.current
                      ? 'bg-primary-100 text-primary-600'
                      : isDarkMode
                      ? 'text-gray-200 hover:text-white'
                      : 'text-gray-900 hover:text-gray-700'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </div>
                </RouterLink>
              ))}

          {user ? user.is_admin ? (
            <>
              <RouterLink
                to="/admin"
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </RouterLink>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  Déconnexion
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <RouterLink
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/user/packs"
                className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
              >
                Mes Packs
              </RouterLink>
              <button
                onClick={logout}
                className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                Déconnexion
              </button>
            </div>
          ) : (
            <>
              <RouterLink
                to="/login"
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  isDarkMode
                    ? 'text-gray-200 hover:text-white'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Connexion
              </RouterLink>
              <RouterLink
                to="/register"
                className="block px-3 py-2 text-base font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                onClick={() => setIsOpen(false)}
              >
                Inscription
              </RouterLink>
            </>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
