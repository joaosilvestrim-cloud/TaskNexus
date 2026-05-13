import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'TaskNexus',
        short_name: 'TaskNexus',
        description: 'Seu gerenciador de tarefas inteligente com IA',
        theme_color: '#6366f1',
        background_color: '#1a1b23',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          {
            name: 'Kanban',
            short_name: 'Kanban',
            description: 'Abrir quadro Kanban',
            url: '/?view=kanban',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Hoje',
            short_name: 'Hoje',
            description: 'Ver tarefas de hoje',
            url: '/?view=today',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['productivity', 'utilities'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
  ],
})
