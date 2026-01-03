import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'logo-light.svg',
        'logo-dark.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
      devOptions: {
        // Permite instalar PWA também no preview/dev (Android precisa do service worker ativo)
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Fynance - Controle Inteligente',
        short_name: 'Fynance',
        description: 'Sistema de controle financeiro inteligente',
        theme_color: '#24719C',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        // Abre direto no login quando instalado
        id: '/login',
        start_url: '/login',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png}'],
        globIgnores: [
          '**/banco-logos-temp/**',
          '**/Bancos-em-SVG-main/**',
          '**/*.svg',
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
