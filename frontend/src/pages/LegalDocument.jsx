import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export default function LegalDocument() {
  const { documentKey } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`api/settings/load`);

        if (
          response.data.success &&
          response.data.data &&
          response.data.data.legal
        ) {
          const legalDocs = response.data.data.legal;

          if (legalDocs[documentKey]) {
            setDocument(legalDocs[documentKey]);
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
  }, [documentKey]);

  // Classes Tailwind pour le contenu Markdown
  const markdownClasses = {
    h1: `text-3xl font-bold mb-6 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    h2: `text-2xl font-bold mt-8 mb-4 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    h3: `text-xl font-bold mt-6 mb-3 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    p: `mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`,
    ul: `list-disc pl-6 mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`,
    ol: `list-decimal pl-6 mb-4 ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
    li: `mb-2`,
    a: `text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300`,
    blockquote: `border-l-4 border-primary-500 pl-4 italic my-4 ${
      isDarkMode ? "text-gray-400" : "text-gray-600"
    }`,
    table: `min-w-full border-collapse my-6`,
    th: `border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 ${
      isDarkMode ? "text-white" : "text-gray-900"
    }`,
    td: `border border-gray-300 dark:border-gray-700 px-4 py-2 ${
      isDarkMode ? "text-gray-300" : "text-gray-700"
    }`,
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden p-6 md:p-8 ${
            isDarkMode ? "border border-gray-700" : ""
          }`}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h2
                className={`text-2xl font-bold mb-4 ${
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
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : document ? (
            <>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {document.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mb-6 text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Dernière mise à jour: {document.updated_at}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="prose max-w-none dark:prose-invert"
              >
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
                      <table className={markdownClasses.table} {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className={markdownClasses.th} {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className={markdownClasses.td} {...props} />
                    ),
                  }}
                >
                  {document.content}
                </ReactMarkdown>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <Link
                  to="/"
                  className={`inline-flex items-center text-sm font-medium ${
                    isDarkMode
                      ? "text-primary-400 hover:text-primary-300"
                      : "text-primary-600 hover:text-primary-700"
                  }`}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    ></path>
                  </svg>
                  Retour à l'accueil
                </Link>
              </motion.div>
            </>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
