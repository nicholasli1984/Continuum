// Continuum build config — updated 2026-04-21
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'

const BUILD_TS = Date.now().toString(36);

export default defineConfig({
  define: {
    '__BUILD_TS__': JSON.stringify(BUILD_TS),
  },
  // manualChunks split removed — it triggered a black-screen regression on
  // initial load (likely a chunk-evaluation order issue with @sentry/react
  // being split into vendor-react via the /react/ regex, creating a circular
  // load relationship with the @sentry init code). The 2.3 MB single-bundle
  // approach is slower-to-cold-load but renders reliably.
  plugins: [
    react(),
    // Replace __BUILD_TS__ in index.html and write version file for API
    {
      name: 'html-build-ts',
      transformIndexHtml(html) {
        return html.replace(/__BUILD_TS__/g, BUILD_TS);
      },
      buildStart() {
        // Write build timestamp so the API endpoint can read it
        writeFileSync('public/build-version.json', JSON.stringify({ v: BUILD_TS }));
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      // Disable the default virtual:pwa-register — we'll register manually
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Continuum — Elite Status Intelligence',
        short_name: 'Continuum',
        description: 'Track your airline, hotel, and rental car elite status across every loyalty program.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        share_target: {
          action: '/?share=1',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Push service worker removed alongside the rest of the in-house
        // notification stack — the airline's own app handles flight alerts now.
        // Only precache static assets (icons, images) — NOT JS/CSS bundles
        // JS/CSS have content hashes in filenames and are fetched fresh via NetworkFirst
        globPatterns: ['**/*.{ico,png,svg,woff2}'],
        // Large landing-page screenshots (image*.png at 1290x2796) blow past the
        // 2 MiB precache cap. They're marketing-only and fetched on demand — let
        // the runtime cache pick them up rather than baking them into the SW.
        globIgnores: ['image*.png', 'ipad*.png'],
        navigateFallback: null,
        // Clean up old precaches on activate
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // HTML pages — always go to network, never serve stale HTML
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
          },
          {
            // JS and CSS — network first with short cache
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'assets-cache', expiration: { maxEntries: 30, maxAgeSeconds: 86400 }, networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
        ],
      },
    }),
  ],
})
