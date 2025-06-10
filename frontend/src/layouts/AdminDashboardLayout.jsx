/**
 * AdminDashboardLayout.jsx - Layout principal du tableau de bord administrateur
 *
 * Ce composant définit la structure de base de l'interface administrateur.
 * Il fournit une mise en page cohérente pour toutes les pages d'administration.
 *
 * Structure :
 * - Barre de navigation latérale (sidebar)
 * - En-tête avec informations utilisateur
 * - Zone de contenu principal
 * - Pied de page
 *
 * Fonctionnalités :
 * - Navigation responsive
 * - Menu rétractable
 * - Gestion des droits d'accès
 * - Déconnexion
 * - Thème clair/sombre
 *
 * Éléments de navigation :
 * - Dashboard
 * - Gestion des utilisateurs
 * - Gestion des packs
 * - Validation des contenus
 * - Gestion des retraits
 * - Configuration
 *
 * Contextes utilisés :
 * - AuthContext : Gestion de l'authentification
 * - ThemeContext : Gestion du thème
 * - ToastContext : Notifications
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import useWithdrawalRequests from "../hooks/useWithdrawalRequests";
import usePendingTestimonials from "../hooks/usePendingTestimonials";
import usePendingFormations from "../hooks/usePendingFormations";
import instance from "../utils/axios";
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyEuroIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  CubeIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  WalletIcon,
  HomeIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  ListBulletIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  GiftIcon,
  TicketIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import NotificationsDropdown from "../components/NotificationsDropdown";

// Définition des éléments de navigation avec les permissions requises
const navigationItems = [
  { name: "Tableau de bord", href: "/admin", icon: HomeIcon, permission: null }, // Accessible à tous les administrateurs
  {
    name: "Utilisateurs",
    href: "/admin/users",
    icon: UsersIcon,
    permission: "manage-users",
  },
  {
    name: "Administrateurs",
    href: "/admin/administrators",
    icon: ShieldCheckIcon,
    permission: "manage-admins",
  },
  {
    name: "Demandes de retrait",
    href: "/admin/withdrawal-requests",
    icon: BanknotesIcon,
    permission: "manage-withdrawals",
  },
  {
    name: "Portefeuilles",
    href: "/admin/wallets",
    icon: WalletIcon,
    permission: "manage-wallets",
  },
  {
    name: "Packs",
    href: "/admin/packs",
    icon: ListBulletIcon,
    permission: "manage-packs",
  },
  {
    name: "Mes packs",
    href: "/admin/mespacks",
    icon: CubeIcon,
    permission: "manage-own-packs",
  },
  {
    name: "Commissions",
    href: "/admin/commissions",
    icon: CreditCardIcon,
    permission: "manage-commissions",
  },
  {
    name: "Finances",
    href: "/admin/finances",
    icon: ChartBarIcon,
    permission: "view-finances",
  },
  {
    name: "Cadeaux Esengo",
    href: "/admin/cadeaux",
    icon: GiftIcon,
    permission: "manage-gifts",
  },
  {
    name: "Vérification tickets",
    href: "/admin/tickets-verification",
    icon: TicketIcon,
    permission: "verify-tickets",
  },
  {
    name: "Témoignages",
    href: "/admin/testimonials",
    icon: ChatBubbleLeftRightIcon,
    permission: "manage-testimonials",
  },
  {
    name: "FAQ",
    href: "/admin/faqs",
    icon: QuestionMarkCircleIcon,
    permission: "manage-faqs",
  },
  {
    name: "Formations",
    href: "/admin/formations",
    icon: AcademicCapIcon,
    permission: "manage-courses",
    badge: (pendingFormationsCount) =>
      pendingFormationsCount > 0 ? pendingFormationsCount : null,
    badgeColor: "red",
  },
  {
    name: "Validations",
    href: "/admin/validations",
    icon: CheckBadgeIcon,
    permission: "manage-validations",
  },
  {
    name: "Paramètres",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    permission: "manage-system",
  },
];

// Fonction pour filtrer les éléments de navigation en fonction des permissions de l'utilisateur
const getNavigation = (pendingFormationsCount = 0, userPermissions = []) => {
  // Si l'utilisateur est super admin ou si aucune permission n'est fournie, afficher tous les éléments
  if (userPermissions.includes("super-admin") || userPermissions.length === 0) {
    return navigationItems.map((item) => ({
      ...item,
      badge:
        typeof item.badge === "function"
          ? item.badge(pendingFormationsCount)
          : item.badge,
      // Pour les éléments avec sous-menu, filtrer également les enfants
      children: item.children
        ? item.children.map((subItem) => ({
            ...subItem,
            badge:
              typeof subItem.badge === "function"
                ? subItem.badge(pendingFormationsCount)
                : subItem.badge,
          }))
        : undefined,
    }));
  }

  // Filtrer les éléments en fonction des permissions
  return navigationItems
    .filter(
      (item) =>
        item.permission === null || userPermissions.includes(item.permission)
    )
    .map((item) => ({
      ...item,
      badge:
        typeof item.badge === "function"
          ? item.badge(pendingFormationsCount)
          : item.badge,
      // Pour les éléments avec sous-menu, filtrer également les enfants en fonction des permissions
      children: item.children
        ? item.children
            .filter(
              (subItem) =>
                subItem.permission === null ||
                userPermissions.includes(subItem.permission)
            )
            .map((subItem) => ({
              ...subItem,
              badge:
                typeof subItem.badge === "function"
                  ? subItem.badge(pendingFormationsCount)
                  : subItem.badge,
            }))
        : undefined,
    }));
};

export default function AdminDashboardLayout() {
  const sidebarRef = useRef(null);
  const [sidebarStyle, setSidebarStyle] = useState({
    overflowY: "auto",
    scrollbarWidth: "none" /* Pour Firefox */,
    msOverflowStyle: "none" /* Pour Internet Explorer et Edge */,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const location = useLocation();
  const { isDarkMode, isSidebarCollapsed, toggleSidebar, toggleTheme } =
    useTheme();
  const { logout, user } = useAuth();
  const [userData, setUserData] = useState(null);
  const { pendingCount } = useWithdrawalRequests();
  const { pendingCount: pendingTestimonialsCount } = usePendingTestimonials();
  const { pendingCount: pendingFormationsCount } = usePendingFormations();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipTargetRef = useRef(null);
  const dropdownRef = useRef(null);

  // État pour stocker les permissions de l'utilisateur
  const [userPermissions, setUserPermissions] = useState([]);
  // État pour suivre le chargement des permissions
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    if (user) {
      try {
        const parsedUser = typeof user === "string" ? JSON.parse(user) : user;
        setUserData(parsedUser);

        // Fermer le menu mobile et les sous-menus lorsque l'utilisateur navigue
        setSidebarOpen(false);
        setOpenSubmenu(null); // Fermer tous les sous-menus lors de la navigation

        // Récupérer les permissions de l'utilisateur
        fetchUserPermissions(parsedUser.id);
      } catch (error) {
        console.error("Erreur lors du parsing des données utilisateur:", error);
        setUserData(null);
      }
    }
  }, [user]);

  // Fonction pour récupérer les permissions de l'utilisateur
  const fetchUserPermissions = async (userId) => {
    setLoadingPermissions(true); // Début du chargement
    try {
      const response = await instance.get(`/api/user/permissions`);
      if (response.data && response.data.permissions) {
        // Stocker les slugs des permissions
        const permissionSlugs = response.data.permissions.map(
          (permission) => permission.slug
        );
        setUserPermissions(permissionSlugs);
      } else {
        // Si l'utilisateur est admin, lui donner accès à tout
        if (
          userData &&
          userData.is_admin &&
          (!response.data || !response.data.permissions)
        ) {
          setUserPermissions(["super-admin"]);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des permissions:", error);
    } finally {
      setLoadingPermissions(false); // Fin du chargement, qu'il y ait une erreur ou non
    }
  };

  // Gestion des sous-menus - n'ouvre que ceux auxquels l'utilisateur a accès
  const handleSubmenuClick = (menuName) => {
    // Vérifier si l'élément de menu existe dans la navigation filtrée
    const menuItem = navigation.find((item) => item.name === menuName);
    
    // Ne permet d'ouvrir que les menus auxquels l'utilisateur a accès
    // et qui ont des sous-menus non vides
    if (menuItem && menuItem.children && menuItem.children.length > 0) {
      setOpenSubmenu(openSubmenu === menuName ? null : menuName);
    } else {
      // Si le menu n'a pas de sous-menus ou n'est pas accessible, s'assurer qu'il est fermé
      if (openSubmenu === menuName) {
        setOpenSubmenu(null);
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Fermer le menu déroulant lorsqu'on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Créer la navigation avec le nombre de formations en attente et les permissions de l'utilisateur
  const navigation = getNavigation(pendingFormationsCount, userPermissions);
  
  // S'assurer que tous les menus sont fermés par défaut
  useEffect(() => {
    setOpenSubmenu(null);
  }, [userPermissions]);

  const renderNavLink = (item, isMobile = false) => {
    // Correction de la logique pour déterminer si un élément de menu est actif
    const isActive =
      item.href === "/admin"
        ? location.pathname === "/admin" // Pour le tableau de bord, uniquement exact match
        : location.pathname === item.href ||
          location.pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    const hasSubmenu = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenu === item.name;

    // Ajouter un badge pour les demandes de retrait en attente
    const showWithdrawalBadge =
      item.href === "/admin/withdrawal-requests" && pendingCount > 0;
    // Ajouter un badge pour les témoignages en attente
    const showTestimonialsBadge =
      item.href === "/admin/testimonials" && pendingTestimonialsCount > 0;
    // Utiliser le badge défini dans l'objet item (pour les formations en attente)
    const showCustomBadge = item.badge !== null && item.badge !== undefined;

    if (hasSubmenu) {
      return (
        <div key={item.name}>
          <button
            onClick={() => handleSubmenuClick(item.name)}
            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isDarkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-x-3">
              <item.icon className="h-5 w-5" />
              {(!isSidebarCollapsed || isMobile) && <span>{item.name}</span>}
            </div>
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform ${
                isSubmenuOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {isSubmenuOpen && (!isSidebarCollapsed || isMobile) && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  to={child.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    location.pathname === child.href
                      ? isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-primary-50 text-primary-600"
                      : isDarkMode
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        ref={showTooltip === item.name ? tooltipTargetRef : null}
        onMouseEnter={(e) => {
          if (isSidebarCollapsed && !isMobile) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({
              top: rect.top - 10,
              left: rect.right + 15,
            });
            setShowTooltip(item.name);
          }
        }}
        onMouseLeave={() => setShowTooltip(null)}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? isDarkMode
              ? "bg-gray-700 text-white"
              : "bg-primary-50 text-primary-600"
            : isDarkMode
            ? "text-gray-300 hover:bg-gray-700"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <div className="relative">
          <Icon
            className={`h-5 w-5 ${
              isActive && !isDarkMode ? "text-primary-600" : ""
            }`}
          />
          {showWithdrawalBadge && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {pendingCount}
            </span>
          )}
          {showTestimonialsBadge && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {pendingTestimonialsCount}
            </span>
          )}
          {showCustomBadge && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
        {(!isSidebarCollapsed || isMobile) && (
          <div className="ml-3 flex items-center">
            <span>{item.name}</span>
            {showWithdrawalBadge && isSidebarCollapsed && !isMobile && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {pendingCount}
              </span>
            )}
            {showTestimonialsBadge && isSidebarCollapsed && !isMobile && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {pendingTestimonialsCount}
              </span>
            )}
            {showCustomBadge && isSidebarCollapsed && !isMobile && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        )}
        {isSidebarCollapsed &&
          !isMobile &&
          showTooltip === item.name &&
          createPortal(
            <div
              className="fixed z-[9999] px-3 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap ${
            isDarkMode ? 'bg-gray-800 text-white border border-primary-600' : 'bg-white text-black border border-primary-600'
          } animate-slideUpFade tooltip-content"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "white",
                color: isDarkMode ? "white" : "black",
                opacity: 1,
              }}
            >
              {item.name}
              <div
                style={{
                  position: "absolute",
                  left: "-4px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(45deg)",
                  width: "8px",
                  height: "8px",
                  backgroundColor: isDarkMode ? "rgb(31, 41, 55)" : "white",
                  borderLeft: "1px solid #16a34a",
                  borderBottom: "1px solid #16a34a",
                  opacity: 1,
                }}
              ></div>
            </div>,
            document.body
          )}
      </Link>
    );
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}
    >
      {/* Sidebar mobile */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-y-0 z-50 flex w-72 flex-col ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } lg:hidden`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between px-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span
              className={`font-semibold text-lg ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              SOLIFIN
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-600"
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {loadingPermissions ? (
            // Afficher des barres de chargement pendant que les permissions sont récupérées
            <div className="flex flex-col space-y-2 px-4 py-6">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse w-2/3"></div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse w-3/4" style={{ animationDelay: "0.2s" }}></div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse w-1/2" style={{ animationDelay: "0.4s" }}></div>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full animate-pulse w-4/5" style={{ animationDelay: "0.6s" }}></div>
              </div>
            </div>
          ) : (
            // Afficher les éléments de navigation une fois les permissions chargées
            navigation.map((item) => renderNavLink(item, true))
          )}
        </nav>
        <div
          className={`mt-auto border-t p-4 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg ${
              isDarkMode
                ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.div>

      {/* Sidebar desktop */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${
          isSidebarCollapsed ? "lg:w-24" : "lg:w-72"
        } transition-all duration-300`}
      >
        <div
          className={`flex grow flex-col gap-y-5 border-r ${
            isSidebarCollapsed ? "px-4" : "px-6"
          } pb-4 overflow-y-auto transition-all duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
          ref={sidebarRef}
          style={sidebarStyle}
          onMouseEnter={() => {
            // Vérifier si le défilement est nécessaire
            if (
              sidebarRef.current &&
              sidebarRef.current.scrollHeight > sidebarRef.current.clientHeight
            ) {
              setSidebarStyle({
                overflowY: "auto",
                scrollbarWidth: "thin",
                msOverflowStyle: "auto",
              });
            }
          }}
          onMouseLeave={() =>
            setSidebarStyle({
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            })
          }
        >
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              {!isSidebarCollapsed && (
                <span
                  className={`font-semibold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  SOLIFIN
                </span>
              )}
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {loadingPermissions ? (
                    // Afficher des barres de chargement pendant que les permissions sont récupérées
                    <div className="flex flex-col space-y-2 px-4 py-6">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full animate-pulse w-2/3"></div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full animate-pulse w-3/4" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full animate-pulse w-1/2" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full animate-pulse w-4/5" style={{ animationDelay: "0.6s" }}></div>
                      </div>
                    </div>
                  ) : (
                    // Afficher les éléments de navigation une fois les permissions chargées
                    navigation.map((item) => (
                      <li key={item.name}>{renderNavLink(item)}</li>
                    ))
                  )}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  ref={showTooltip === "logout" ? tooltipTargetRef : null}
                  onMouseEnter={(e) => {
                    if (isSidebarCollapsed) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({
                        top: rect.top - 10,
                        left: rect.right + 15,
                      });
                      setShowTooltip("logout");
                    }
                  }}
                  onMouseLeave={() => setShowTooltip(null)}
                  className={`flex w-full items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    isDarkMode
                      ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                  {!isSidebarCollapsed && <span>Déconnexion</span>}
                  {isSidebarCollapsed &&
                    showTooltip === "logout" &&
                    createPortal(
                      <div
                        className="fixed z-[9999] px-3 py-2 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap ${
                      isDarkMode ? 'bg-gray-800 text-white border border-primary-600' : 'bg-white text-black border border-primary-600'
                    } animate-slideUpFade tooltip-content"
                        style={{
                          top: `${tooltipPosition.top}px`,
                          left: `${tooltipPosition.left}px`,
                          backgroundColor: isDarkMode
                            ? "rgb(31, 41, 55)"
                            : "white",
                          color: isDarkMode ? "white" : "black",
                          opacity: 1,
                        }}
                      >
                        Déconnexion
                        <div
                          style={{
                            position: "absolute",
                            left: "-4px",
                            top: "50%",
                            transform: "translateY(-50%) rotate(45deg)",
                            width: "8px",
                            height: "8px",
                            backgroundColor: isDarkMode
                              ? "rgb(31, 41, 55)"
                              : "white",
                            borderLeft: "1px solid #16a34a",
                            borderBottom: "1px solid #16a34a",
                            opacity: 1,
                          }}
                        ></div>
                      </div>,
                      document.body
                    )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div
        className={`${
          isSidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
        } transition-all duration-300`}
      >
        <div
          className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className={`${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300"
                : "text-gray-500 hover:text-gray-600"
            } lg:hidden`}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Bouton pour rétracter/déployer la sidebar (desktop) */}
          <button
            onClick={toggleSidebar}
            className={`hidden lg:flex items-center justify-center h-8 w-8 rounded-full ${
              isDarkMode
                ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isSidebarCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>

          <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Bouton retour accueil */}
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                <span className="hidden sm:block">Accueil</span>
              </Link>

              {/* Notifications */}
              <NotificationsDropdown />

              {/* Bouton thème */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                {isDarkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative ml-3" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  {userData?.picture ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={userData.picture}
                      alt={`Photo de profil de ${
                        userData.name || "l'utilisateur"
                      }`}
                    />
                  ) : (
                    <UserCircleIcon
                      className={`h-8 w-8 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {/* Dropdown menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg py-2 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
                      {userData?.picture ? (
                        <img
                          className="h-16 w-16 rounded-full object-cover mb-3"
                          src={userData.picture}
                          alt={`Photo de profil de ${
                            userData.name || "l'utilisateur"
                          }`}
                        />
                      ) : (
                        <UserCircleIcon
                          className={`h-16 w-16 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          } mb-3`}
                          aria-hidden="true"
                        />
                      )}
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {userData?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userData?.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/admin/profile"
                        className="flex items-center justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 gap-2"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        Mon profil
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileMenu(false);
                        }}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 gap-2"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className={`py-10 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
