import { useState, useRef, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useToast } from "../hooks/useToast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/notifications/unread");
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, link) => {
    try {
      await axios.post(`/api/notifications/${id}/read`);
      // Mettre à jour la liste des notifications après avoir marqué comme lu
      setNotifications(notifications.filter((notif) => notif.id !== id));

      // Si un lien est fourni dans les métadonnées, rediriger l'utilisateur
      if (link) {
        setIsOpen(false); // Fermer le dropdown avant la redirection
        navigate(link);
      }
    } catch (error) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post("/api/notifications/mark-all-read");
      setNotifications([]);
    } catch (error) {
      console.error(
        "Erreur lors du marquage de toutes les notifications comme lues:",
        error
      );
    }
  };

  useEffect(() => {
    // Charger les notifications au montage du composant
    fetchNotifications();

    // Configurer un intervalle pour rafraîchir les notifications
    const interval = setInterval(() => {
      if (!isOpen && document.visibilityState === 'visible') {
        // Rafraîchir seulement si le dropdown n'est pas ouvert et que la page est visible
        fetchNotifications();
      }
    }, 120000); // Rafraîchir toutes les 2 minutes au lieu de chaque minute

    // Écouter les changements de visibilité de la page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isOpen) {
        // Rafraîchir les notifications quand l'utilisateur revient sur la page
        fetchNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formater la date de la notification
  const formatNotificationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Déterminer l'icône et la couleur en fonction du type de notification
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return {
          bgColor: isDarkMode ? "bg-green-900/20" : "bg-green-100",
          textColor: isDarkMode ? "text-green-400" : "text-green-800",
          icon: <CheckCircleIcon className="h-5 w-5" />,
        };
      case "warning":
        return {
          bgColor: isDarkMode ? "bg-yellow-900/20" : "bg-yellow-100",
          textColor: isDarkMode ? "text-yellow-400" : "text-yellow-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "danger":
        return {
          bgColor: isDarkMode ? "bg-red-900/20" : "bg-red-100",
          textColor: isDarkMode ? "text-red-400" : "text-red-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          bgColor: isDarkMode ? "bg-blue-900/20" : "bg-blue-100",
          textColor: isDarkMode ? "text-blue-400" : "text-blue-800",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(); // Rafraîchir les notifications à l'ouverture
          }
        }}
        className={`relative p-2 rounded-full transition-colors ${
          isDarkMode
            ? "hover:bg-gray-700 text-gray-400 hover:text-gray-300"
            : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
        }`}
      >
        <BellIcon className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed sm:absolute right-0 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto sm:mt-2 w-[calc(100%-1rem)] sm:w-80 md:w-96 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } ring-1 ring-black ring-opacity-5 z-50 max-h-[60vh] sm:max-h-[80vh] overflow-hidden flex flex-col`}
          >
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3
                className={`text-base sm:text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="overflow-y-auto">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div
                  className={`p-4 text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Aucune nouvelle notification
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => {
                    const style = getNotificationStyle(
                      notification.data?.type || "info"
                    );
                    const notificationLink =
                      notification.data?.link ||
                      notification.data?.lien ||
                      null;

                    return (
                      <div
                        key={notification.id}
                        className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                        onClick={() =>
                          markAsRead(notification.id, notificationLink)
                        }
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className={`flex-shrink-0 p-1.5 sm:p-2 rounded-full ${style.bgColor} ${style.textColor}`}
                          >
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0 break-words">
                            <p
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {notification.data?.titre || "Notification"}
                            </p>
                            <p
                              className={`text-xs sm:text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              } mt-1 line-clamp-3`}
                            >
                              {notification.data?.message ||
                                notification.data?.content ||
                                ""}
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              } mt-1`}
                            >
                              {formatNotificationDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
