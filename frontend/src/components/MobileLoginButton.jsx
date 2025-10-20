import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ChevronLeftIcon, ChevronRightIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const MobileLoginButton = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Vérifier si l'appareil est mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Vérifier au chargement
    checkIfMobile();

    // Vérifier lors du redimensionnement de la fenêtre
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Si l'utilisateur est connecté ou si ce n'est pas un appareil mobile, ne pas afficher le bouton
  if (isAuthenticated || !isMobile) {
    return null;
  }

  return (
    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 flex items-center">
      {/* Contrôle pour afficher/masquer le bouton */}
      <motion.button
        className={`flex items-center justify-center p-2 rounded-l-md shadow-lg ${
          isDarkMode 
            ? "bg-gray-800 text-white" 
            : "bg-white text-gray-800"
        }`}
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isVisible ? (
          <ChevronRightIcon className="h-6 w-6" />
        ) : (
          <ChevronLeftIcon className="h-6 w-6" />
        )}
      </motion.button>

      {/* Bouton de connexion */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`flex items-center justify-center py-3 px-4 shadow-lg ${
              isDarkMode 
                ? "bg-green-600 text-white" 
                : "bg-green-500 text-white"
            }`}
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">Se connecter</span>
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLoginButton;
