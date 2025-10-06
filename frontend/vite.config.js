import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { compression } from "vite-plugin-compression2";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: "brotliCompress",
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Augmenter la limite de taille pour les fichiers volumineux
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 heure
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "SOLIFIN Express",
        short_name: "SOLIFIN",
        description: "Application SOLIFIN Express",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        icons: [
          {
            src: "assets/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "assets/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
      },
    }),
  ],
  build: {
    sourcemap: false,
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer React et les bibliothèques associées
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Séparer les bibliothèques Material UI
          "mui-vendor": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-data-grid",
            "@mui/x-date-pickers",
            "@emotion/react",
            "@emotion/styled",
          ],
          // Séparer les bibliothèques de graphiques
          "chart-vendor": ["chart.js", "react-chartjs-2", "recharts"],
          // Séparer les bibliothèques d'icônes
          "icons-vendor": [
            "@heroicons/react",
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/free-brands-svg-icons",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/react-fontawesome",
            "react-icons",
          ],
          // Séparer les bibliothèques utilitaires
          "utils-vendor": [
            "axios",
            "date-fns",
            "dompurify",
            "zustand",
            "file-saver",
          ],
          // Séparer les bibliothèques UI
          "ui-vendor": [
            "@headlessui/react",
            "bootstrap",
            "react-bootstrap",
            "swiper",
            "framer-motion",
          ],
          // Séparer les bibliothèques de traitement média
          "media-vendor": [
            "@ffmpeg/core",
            "@ffmpeg/ffmpeg",
            "@ffmpeg/util",
            "react-player",
            "video-react",
          ],
        },
        // Optimiser le format des noms de fichiers de sortie
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  // Optimiser le cache des dépendances
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
