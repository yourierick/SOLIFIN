import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function LegalDocumentModal({ documentKey, isOpen, onClose }) {
  const [legalDoc, setLegalDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchDocument = async () => {
      if (!isOpen || !documentKey) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/settings/load`);

        if (
          response.data.success &&
          response.data.data &&
          response.data.data.legal
        ) {
          const legalDocs = response.data.data.legal;

          if (legalDocs[documentKey]) {
            setLegalDoc(legalDocs[documentKey]);
          } else {
            setError("Document légal non trouvé");
          }
        } else {
          setError("Impossible de charger le document légal");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du document légal:", err);
        setError("Erreur lors de la récupération du document légal");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentKey, isOpen]);

  // Classes Tailwind pour le contenu Markdown
  const markdownClasses = {
    h1: `text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    h2: `text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    h3: `text-lg sm:text-xl font-bold mt-4 sm:mt-6 mb-2 sm:mb-3 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    p: `mb-3 sm:mb-4 text-sm sm:text-base ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
    ul: `list-disc pl-4 sm:pl-6 mb-3 sm:mb-4 text-sm sm:text-base ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
    ol: `list-decimal pl-4 sm:pl-6 mb-3 sm:mb-4 text-sm sm:text-base ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
    li: `mb-1.5 sm:mb-2 text-sm sm:text-base`,
    a: `text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300`,
    blockquote: `border-l-4 border-primary-500 pl-3 sm:pl-4 italic my-3 sm:my-4 text-sm sm:text-base ${
      isDarkMode ? "text-gray-400" : "text-gray-600"
    }`,
    table: `min-w-full border-collapse my-4 sm:my-6 text-sm sm:text-base`,
    th: `border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-1 sm:py-2 bg-gray-100 dark:bg-gray-800 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    td: `border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-1 sm:py-2 ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
  };

  // Empêcher le défilement du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Fermer le modal avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(5px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md transition-all"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className={`relative w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg shadow-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton de fermeture */}
              <button
                onClick={onClose}
                className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-full z-10 ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
                aria-label="Fermer"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <div className="p-4 sm:p-6 md:p-8">
                {loading ? (
                  <div className="flex justify-center items-center h-40 sm:h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 sm:py-12">
                    <h2
                      className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {error}
                    </h2>
                    <p
                      className={`mb-6 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Le document demandé n'est pas disponible.
                    </p>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Fermer
                    </button>
                  </div>
                ) : legalDoc?.content ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="prose prose-sm sm:prose-base md:prose-lg max-w-none dark:prose-invert"
                    >
                      <h2>{legalDoc?.title}</h2>
                      <ReactMarkdown
                        rehypePlugins={[rehypeSanitize]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1 className={markdownClasses.h1} {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className={markdownClasses.h2} {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className={markdownClasses.h3} {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className={markdownClasses.p} {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className={markdownClasses.ul} {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className={markdownClasses.ol} {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className={markdownClasses.li} {...props} />
                          ),
                          a: ({ node, ...props }) => (
                            <a className={markdownClasses.a} {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className={markdownClasses.blockquote}
                              {...props}
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <table
                              className={markdownClasses.table}
                              {...props}
                            />
                          ),
                          th: ({ node, ...props }) => (
                            <th className={markdownClasses.th} {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className={markdownClasses.td} {...props} />
                          ),
                        }}
                      >
                        {legalDoc?.content ?? "aucun document légal"}
                      </ReactMarkdown>
                    </motion.div>
                  </>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <h2
                      className={
                        isDarkMode
                          ? "text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white"
                          : "text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900"
                      }
                    >
                      Aucun document légal
                    </h2>
                    <p
                      className={
                        isDarkMode ? "mb-6 text-gray-400" : "mb-6 text-gray-600"
                      }
                    >
                      Le document demandé n'est pas disponible.
                    </p>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
