import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.fapshi\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fapshi-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'logo.svg', 'splash-logo.svg', 'header-logo.svg'],
      manifest: {
        name: 'KwataLink - Cameroonian Food Delivery',
        short_name: 'KwataLink',
        description: 'Authentic Cameroonian cuisine delivered fresh to your doorstep',
        theme_color: '#D57A1F',
        background_color: '#FDF1E0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.svg',
            sizes: '72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          }
        ],
        screenshots: [
          {
            src: '/splash-logo.svg',
            sizes: '400x300',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'KwataLink - Cameroonian Food Delivery'
          }
        ]
      }
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          utils: ['emailjs-com', 'date-fns']
        }
      }
    },
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    } : undefined
  },
  define: {
    __DEV__: mode === 'development'
  }
}));
