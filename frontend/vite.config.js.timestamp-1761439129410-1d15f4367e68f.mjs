// vite.config.js
import { defineConfig } from "file:///C:/SOLIFIN/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/SOLIFIN/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { compression } from "file:///C:/SOLIFIN/frontend/node_modules/vite-plugin-compression2/dist/index.mjs";
import { VitePWA } from "file:///C:/SOLIFIN/frontend/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      exclude: [/\.(br)$/, /\.(gz)$/]
    }),
    compression({
      algorithm: "brotliCompress",
      exclude: [/\.(br)$/, /\.(gz)$/]
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Augmenter la limite de taille pour les fichiers volumineux
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // 50 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
                // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60
                // 1 heure
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
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
            type: "image/png"
          },
          {
            src: "assets/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "assets/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        start_url: "/",
        display: "standalone",
        orientation: "portrait"
      }
    })
  ],
  build: {
    sourcemap: false,
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 1e3,
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
            "@emotion/styled"
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
            "react-icons"
          ],
          // Séparer les bibliothèques utilitaires
          "utils-vendor": [
            "axios",
            "date-fns",
            "dompurify",
            "zustand",
            "file-saver"
          ],
          // Séparer les bibliothèques UI
          "ui-vendor": [
            "@headlessui/react",
            "bootstrap",
            "react-bootstrap",
            "swiper",
            "framer-motion"
          ],
          // Séparer les bibliothèques de traitement média
          "media-vendor": [
            "@ffmpeg/core",
            "@ffmpeg/ffmpeg",
            "@ffmpeg/util",
            "react-player",
            "video-react"
          ]
        },
        // Optimiser le format des noms de fichiers de sortie
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  // Optimiser le cache des dépendances
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxTT0xJRklOXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxTT0xJRklOXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9TT0xJRklOL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7IGNvbXByZXNzaW9uIH0gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uMlwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgY29tcHJlc3Npb24oe1xuICAgICAgYWxnb3JpdGhtOiBcImd6aXBcIixcbiAgICAgIGV4Y2x1ZGU6IFsvXFwuKGJyKSQvLCAvXFwuKGd6KSQvXSxcbiAgICB9KSxcbiAgICBjb21wcmVzc2lvbih7XG4gICAgICBhbGdvcml0aG06IFwiYnJvdGxpQ29tcHJlc3NcIixcbiAgICAgIGV4Y2x1ZGU6IFsvXFwuKGJyKSQvLCAvXFwuKGd6KSQvXSxcbiAgICB9KSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGNsaWVudHNDbGFpbTogdHJ1ZSxcbiAgICAgICAgc2tpcFdhaXRpbmc6IHRydWUsXG4gICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcbiAgICAgICAgLy8gQXVnbWVudGVyIGxhIGxpbWl0ZSBkZSB0YWlsbGUgcG91ciBsZXMgZmljaGllcnMgdm9sdW1pbmV1eFxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNTAgKiAxMDI0ICogMTAyNCwgLy8gNTAgTUJcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ29vZ2xlYXBpc1xcLmNvbS8sXG4gICAgICAgICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcImdvb2dsZS1mb250cy1jYWNoZVwiLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgICAgbWF4RW50cmllczogMTAsXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1LCAvLyAxIGFuXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpwbmd8anBnfGpwZWd8c3ZnfGdpZnx3ZWJwKSQvLFxuICAgICAgICAgICAgaGFuZGxlcjogXCJDYWNoZUZpcnN0XCIsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogXCJpbWFnZXMtY2FjaGVcIixcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCwgLy8gMzAgam91cnNcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcLig/OmpzfGNzcykkLyxcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcInN0YXRpYy1yZXNvdXJjZXNcIixcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDcsIC8vIDcgam91cnNcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHtcbiAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcL2FwaVxcLy8sXG4gICAgICAgICAgICBoYW5kbGVyOiBcIk5ldHdvcmtGaXJzdFwiLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwiYXBpLWNhY2hlXCIsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwLCAvLyAxIGhldXJlXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDEwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcImZhdmljb24uaWNvXCIsIFwiYXBwbGUtdG91Y2gtaWNvbi5wbmdcIiwgXCJtYXNrLWljb24uc3ZnXCJdLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogXCJTT0xJRklOIEV4cHJlc3NcIixcbiAgICAgICAgc2hvcnRfbmFtZTogXCJTT0xJRklOXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkFwcGxpY2F0aW9uIFNPTElGSU4gRXhwcmVzc1wiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMTk3NmQyXCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogXCJhc3NldHMvaWNvbnMvaWNvbi03Mng3Mi5wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjcyeDcyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBcImFzc2V0cy9pY29ucy9pY29uLTE5MngxOTIucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBcImFzc2V0cy9pY29ucy9pY29uLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBzdGFydF91cmw6IFwiL1wiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXRcIixcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICAvLyBBdWdtZW50ZXIgbGEgbGltaXRlIGQnYXZlcnRpc3NlbWVudCBwb3VyIGxlcyBjaHVua3NcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBSZWFjdCBldCBsZXMgYmlibGlvdGhcdTAwRThxdWVzIGFzc29jaVx1MDBFOWVzXG4gICAgICAgICAgXCJyZWFjdC12ZW5kb3JcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIE1hdGVyaWFsIFVJXG4gICAgICAgICAgXCJtdWktdmVuZG9yXCI6IFtcbiAgICAgICAgICAgIFwiQG11aS9tYXRlcmlhbFwiLFxuICAgICAgICAgICAgXCJAbXVpL2ljb25zLW1hdGVyaWFsXCIsXG4gICAgICAgICAgICBcIkBtdWkveC1kYXRhLWdyaWRcIixcbiAgICAgICAgICAgIFwiQG11aS94LWRhdGUtcGlja2Vyc1wiLFxuICAgICAgICAgICAgXCJAZW1vdGlvbi9yZWFjdFwiLFxuICAgICAgICAgICAgXCJAZW1vdGlvbi9zdHlsZWRcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIGRlIGdyYXBoaXF1ZXNcbiAgICAgICAgICBcImNoYXJ0LXZlbmRvclwiOiBbXCJjaGFydC5qc1wiLCBcInJlYWN0LWNoYXJ0anMtMlwiLCBcInJlY2hhcnRzXCJdLFxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIGQnaWNcdTAwRjRuZXNcbiAgICAgICAgICBcImljb25zLXZlbmRvclwiOiBbXG4gICAgICAgICAgICBcIkBoZXJvaWNvbnMvcmVhY3RcIixcbiAgICAgICAgICAgIFwiQGZvcnRhd2Vzb21lL2ZvbnRhd2Vzb21lLXN2Zy1jb3JlXCIsXG4gICAgICAgICAgICBcIkBmb3J0YXdlc29tZS9mcmVlLWJyYW5kcy1zdmctaWNvbnNcIixcbiAgICAgICAgICAgIFwiQGZvcnRhd2Vzb21lL2ZyZWUtc29saWQtc3ZnLWljb25zXCIsXG4gICAgICAgICAgICBcIkBmb3J0YXdlc29tZS9yZWFjdC1mb250YXdlc29tZVwiLFxuICAgICAgICAgICAgXCJyZWFjdC1pY29uc1wiLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgLy8gU1x1MDBFOXBhcmVyIGxlcyBiaWJsaW90aFx1MDBFOHF1ZXMgdXRpbGl0YWlyZXNcbiAgICAgICAgICBcInV0aWxzLXZlbmRvclwiOiBbXG4gICAgICAgICAgICBcImF4aW9zXCIsXG4gICAgICAgICAgICBcImRhdGUtZm5zXCIsXG4gICAgICAgICAgICBcImRvbXB1cmlmeVwiLFxuICAgICAgICAgICAgXCJ6dXN0YW5kXCIsXG4gICAgICAgICAgICBcImZpbGUtc2F2ZXJcIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIC8vIFNcdTAwRTlwYXJlciBsZXMgYmlibGlvdGhcdTAwRThxdWVzIFVJXG4gICAgICAgICAgXCJ1aS12ZW5kb3JcIjogW1xuICAgICAgICAgICAgXCJAaGVhZGxlc3N1aS9yZWFjdFwiLFxuICAgICAgICAgICAgXCJib290c3RyYXBcIixcbiAgICAgICAgICAgIFwicmVhY3QtYm9vdHN0cmFwXCIsXG4gICAgICAgICAgICBcInN3aXBlclwiLFxuICAgICAgICAgICAgXCJmcmFtZXItbW90aW9uXCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICAvLyBTXHUwMEU5cGFyZXIgbGVzIGJpYmxpb3RoXHUwMEU4cXVlcyBkZSB0cmFpdGVtZW50IG1cdTAwRTlkaWFcbiAgICAgICAgICBcIm1lZGlhLXZlbmRvclwiOiBbXG4gICAgICAgICAgICBcIkBmZm1wZWcvY29yZVwiLFxuICAgICAgICAgICAgXCJAZmZtcGVnL2ZmbXBlZ1wiLFxuICAgICAgICAgICAgXCJAZmZtcGVnL3V0aWxcIixcbiAgICAgICAgICAgIFwicmVhY3QtcGxheWVyXCIsXG4gICAgICAgICAgICBcInZpZGVvLXJlYWN0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gT3B0aW1pc2VyIGxlIGZvcm1hdCBkZXMgbm9tcyBkZSBmaWNoaWVycyBkZSBzb3J0aWVcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIixcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIixcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF1cIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgLy8gT3B0aW1pc2VyIGxlIGNhY2hlIGRlcyBkXHUwMEU5cGVuZGFuY2VzXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpUCxTQUFTLG9CQUFvQjtBQUM5USxPQUFPLFdBQVc7QUFDbEIsU0FBUyxtQkFBbUI7QUFDNUIsU0FBUyxlQUFlO0FBSXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFNBQVMsQ0FBQyxXQUFXLFNBQVM7QUFBQSxJQUNoQyxDQUFDO0FBQUEsSUFDRCxZQUFZO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxTQUFTLENBQUMsV0FBVyxTQUFTO0FBQUEsSUFDaEMsQ0FBQztBQUFBLElBQ0QsUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsU0FBUztBQUFBLFFBQ1AsY0FBYztBQUFBLFFBQ2QsYUFBYTtBQUFBLFFBQ2IsdUJBQXVCO0FBQUE7QUFBQSxRQUV2QiwrQkFBK0IsS0FBSyxPQUFPO0FBQUE7QUFBQSxRQUMzQyxnQkFBZ0I7QUFBQSxVQUNkO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBQ2hDO0FBQUEsY0FDQSxtQkFBbUI7QUFBQSxnQkFDakIsVUFBVSxDQUFDLEdBQUcsR0FBRztBQUFBLGNBQ25CO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBQ2hDO0FBQUEsY0FDQSxtQkFBbUI7QUFBQSxnQkFDakIsVUFBVSxDQUFDLEdBQUcsR0FBRztBQUFBLGNBQ25CO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBQ2hDO0FBQUEsY0FDQSxtQkFBbUI7QUFBQSxnQkFDakIsVUFBVSxDQUFDLEdBQUcsR0FBRztBQUFBLGNBQ25CO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSztBQUFBO0FBQUEsY0FDdEI7QUFBQSxjQUNBLG1CQUFtQjtBQUFBLGdCQUNqQixVQUFVLENBQUMsR0FBRyxHQUFHO0FBQUEsY0FDbkI7QUFBQSxjQUNBLHVCQUF1QjtBQUFBLFlBQ3pCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxlQUFlLENBQUMsZUFBZSx3QkFBd0IsZUFBZTtBQUFBLE1BQ3RFLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsUUFDQSxXQUFXO0FBQUEsUUFDWCxTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQTtBQUFBLElBRVgsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUV6RCxjQUFjO0FBQUEsWUFDWjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFFQSxnQkFBZ0IsQ0FBQyxZQUFZLG1CQUFtQixVQUFVO0FBQUE7QUFBQSxVQUUxRCxnQkFBZ0I7QUFBQSxZQUNkO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUVBLGdCQUFnQjtBQUFBLFlBQ2Q7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFFQSxhQUFhO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUVBLGdCQUFnQjtBQUFBLFlBQ2Q7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQTtBQUFBLFFBRUEsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLEVBQ3BEO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
