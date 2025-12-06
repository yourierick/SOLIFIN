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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { UsersIcon } from "@heroicons/react/24/outline";

// Composant Tooltip personnalisé
const Tooltip = ({ children, text, isDarkMode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-md z-50 whitespace-nowrap ${
            isDarkMode
              ? "bg-gray-800 text-white"
              : "bg-white text-gray-900 shadow-md"
          }`}
        >
          {text}
          <div
            className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

const navigation = [
  { name: "Accueil", href: "hero" },
  { name: "Caractéristiques", href: "features" },
  { name: "Packs", href: "packages" },
  { name: "Parrainage", href: "referral" },
  { name: "Témoignages", href: "testimonials" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { pathname } = location;
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const isHomePage = location.pathname === "/";

  const adminNavigation = [
    {
      name: "Utilisateurs",
      href: "/admin/users",
      icon: UsersIcon,
      current: pathname === "/admin/users",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? isDarkMode
            ? "bg-gray-900/95 shadow-[0_4px_30px_rgba(255,255,255,0.1)]"
            : "bg-white/95 shadow-[0_2px_15px_rgba(0,0,0,0.1)]"
          : "bg-transparent"
      }`}
    >
      <div className="px-4 py-1 mx-auto max-w-7xl sm:px-6 sm:py-2 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 py-2">
          <div className="flex items-center">
            <RouterLink to="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <img
                  className="w-auto h-14 sm:h-16 md:h-[4.5rem] lg:h-20"
                  src={logo}
                  alt="Logo"
                />
              </motion.div>
            </RouterLink>
          </div>

          {/* Navigation principale */}
          <div className="hidden lg:ml-6 lg:flex lg:space-x-6 xl:space-x-10">
            {isHomePage
              ? navigation.map((item) => (
                  <ScrollLink
                    key={item.name}
                    to={item.href}
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    className={`inline-flex items-center px-2 pt-1 text-base lg:text-lg xl:text-xl font-medium hover:text-primary-600 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-200" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </ScrollLink>
                ))
              : adminNavigation.map((item) => (
                  <RouterLink
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-2 pt-1 text-lg xl:text-xl font-medium transition-colors duration-200 ${
                      item.current
                        ? "border-b-2 border-primary-500 text-primary-600"
                        : isDarkMode
                        ? "text-gray-200 hover:text-primary-500"
                        : "text-gray-900 hover:text-primary-600"
                    }`}
                  >
                    <item.icon className="h-6 w-6 mr-2" />
                    {item.name}
                  </RouterLink>
                ))}
          </div>

          <div className="hidden lg:ml-6 lg:flex lg:items-center">
            {user ? (
              user.is_admin ? (
                <div className="flex items-center space-x-4">
                  <Tooltip text="Tableau de bord" isDarkMode={isDarkMode}>
                    <RouterLink
                      to="/admin"
                      className={`inline-flex bg-primary-600 hover:bg-primary-700 items-center justify-center p-2.5 rounded-full transition-colors duration-200 ${
                        isDarkMode
                          ? "text-gray-200 hover:text-white"
                          : "text-white hover:text-white-700"
                      }`}
                      aria-label="Tableau de bord"
                    >
                      <HomeIcon className="h-6 w-6" />
                    </RouterLink>
                  </Tooltip>
                  
                  <Tooltip text="Déconnexion" isDarkMode={isDarkMode}>
                    <button
                      onClick={logout}
                      className={`inline-flex items-center justify-center p-2.5 rounded-full transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                      }`}
                      aria-label="Déconnexion"
                    >
                      <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <div className="flex items-center space-x-3 xl:space-x-5">
                  <Tooltip text="Tableau de bord" isDarkMode={isDarkMode}>
                    <RouterLink
                      to="/dashboard"
                      className={`inline-flex bg-primary-600 hover:bg-primary-700 items-center justify-center p-2.5 rounded-full transition-colors duration-200 ${
                        isDarkMode
                          ? "text-gray-200 hover:text-white"
                          : "text-white hover:text-white-700"
                      }`}
                      aria-label="Tableau de bord"
                    >
                      <HomeIcon className="h-6 w-6" />
                    </RouterLink>
                  </Tooltip>
                  <Tooltip text="Mes Packs" isDarkMode={isDarkMode}>
                    <RouterLink
                      to="/dashboard/packs/:id"
                      className={`inline-flex bg-gray-600 hover:bg-gray-700 items-center justify-center p-2.5 rounded-full transition-colors duration-200 ${
                        isDarkMode
                          ? "text-gray-200 hover:text-white"
                          : "text-white hover:text-white-700"
                      }`}
                      aria-label="Mes Packs"
                    >
                      <ShoppingBagIcon className="h-6 w-6" />
                    </RouterLink>
                  </Tooltip>
                  <Tooltip text="Déconnexion" isDarkMode={isDarkMode}>
                    <button
                      onClick={logout}
                      className={`inline-flex items-center justify-center p-2.5 rounded-full transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900"
                      }`}
                      aria-label="Déconnexion"
                    >
                      <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    </button>
                  </Tooltip>
                </div>
              )
            ) : (
              <div className="flex items-center space-x-3 xl:space-x-5">
                <RouterLink
                  to="/login"
                  className={`inline-flex items-center px-4 lg:px-5 py-2.5 text-base lg:text-lg font-medium rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white"
                      : "text-gray-900 hover:text-gray-700"
                  }`}
                >
                  Connexion
                </RouterLink>
                <RouterLink
                  to="/register"
                  className="inline-flex items-center px-4 lg:px-5 py-2.5 text-base lg:text-lg font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors duration-200"
                >
                  Inscription
                </RouterLink>
              </div>
            )}
          </div>

          {/* Bouton mobile */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-3 my-auto rounded-md ${
                isDarkMode
                  ? "text-gray-200 hover:text-white hover:bg-gray-800"
                  : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-8 w-8" />
              ) : (
                <Bars3Icon className="block h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        className={`lg:hidden overflow-hidden ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="px-3 pt-4 pb-6 space-y-2">
          {isHomePage
            ? navigation.map((item) => (
                <ScrollLink
                  key={item.name}
                  to={item.href}
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
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
                  className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                    item.current
                      ? "bg-primary-100 text-primary-600"
                      : isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-6 w-6 mr-3" />
                    {item.name}
                  </div>
                </RouterLink>
              ))}

          {user ? (
            user.is_admin ? (
              <>
                <RouterLink
                  to="/admin"
                  className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
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
                  className={`block w-full text-left px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
                    Déconnexion
                  </div>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <RouterLink
                  to="/dashboard"
                  className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </RouterLink>
                <RouterLink
                  to="/user/packs"
                  className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Mes Packs
                </RouterLink>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-lg font-medium rounded-lg ${
                    isDarkMode
                      ? "text-gray-200 hover:text-white hover:bg-gray-800"
                      : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
                    Déconnexion
                  </div>
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              <RouterLink
                to="/login"
                className={`block px-4 py-3 text-lg font-medium rounded-lg ${
                  isDarkMode
                    ? "text-gray-200 hover:text-white hover:bg-gray-800"
                    : "text-gray-900 hover:text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Connexion
              </RouterLink>
              <RouterLink
                to="/register"
                className="block px-4 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                onClick={() => setIsOpen(false)}
              >
                Inscription
              </RouterLink>
            </div>
          )}
        </div>
      </motion.div>
    </motion.nav>
  );
}
