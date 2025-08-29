/**
 * VITE PRODUCTION CONFIGURATION
 * Optimized build configuration for production deployment
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  mode: 'production',

  plugins: [
    react({
      // Enable SWC minification
      minify: true,
    }),

    // Bundle analyzer
    visualizer({
      filename: 'reports/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    // Compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),

    // PWA configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheKeyWillBeUsed: async ({ request }) => `${request.url}?${Date.now()}`,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ChopTym - Cameroonian Food Delivery',
        short_name: 'ChopTym',
        description: 'Authentic Cameroonian cuisine delivered fresh to your doorstep',
        theme_color: '#D57A1F',
        background_color: '#D57A1F',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],

  build: {
    // Output directory
    outDir: 'dist',

    // Enable source maps for production debugging
    sourcemap: false, // Set to true for debugging

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },

    // Chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          'supabase-vendor': ['@supabase/supabase-js'],

          // Feature chunks
          'payment': ['@stripe/stripe-js'],
          'maps': ['mapbox-gl'],
          'charts': ['recharts'],
        },
        // Naming pattern
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Bundle size limits
    chunkSizeWarningLimit: 1000, // 1MB warning

    // CSS configuration
    cssCodeSplit: true,
    cssMinify: true,

    // Enable tree shaking
    modulePreload: {
      polyfill: false,
    },

    // Report compressed size
    reportCompressedSize: true,

    // Empty outDir before build
    emptyOutDir: true,
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@config': path.resolve(__dirname, '../config'),
    },
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Server configuration for preview
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: true,
  },

  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // CSS optimization
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },

  // ESBuild configuration
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
});