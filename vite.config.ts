import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function normalizeBasePath(rawBase?: string): string {
  const trimmed = rawBase?.trim().replace(/^["']|["']$/g, '').trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig(() => {
  const base = normalizeBasePath(process.env.VITE_BASE_PATH);

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      // index.html carries the strict production CSP (connect-src 'none', script-src 'self').
      // Strip the meta tag only during local `vite dev` so Vite's module/React dev preamble can run.
      {
        name: 'strip-meta-csp-in-dev',
        apply: 'serve' as const,
        transformIndexHtml(html: string) {
          return html.replace(
            /\s*<meta\s+http-equiv="Content-Security-Policy"[^>]*\/>\s*/i,
            '\n',
          );
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        // Registered explicitly in src/main.tsx via virtual:pwa-register to keep index.html free of inline scripts
        injectRegister: null,
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: base,
          name: 'One-Click Key',
          short_name: 'One-Click',
          description:
            '100% client-side, offline-first Android Keystore PKCS#12 (.p12) generator compatible with Google Play App Signing and Android Gradle Plugin.',
          theme_color: '#0D0D0D',
          background_color: '#0D0D0D',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-maskable-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache all local bundled assets (JS, CSS, HTML, icons, WOFF2 fonts, Web Workers)
          // for complete offline-first operation with zero external runtime network calls.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build' as const,
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    worker: {
      format: 'es' as const,
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // Allow disabling HMR and file watching via DISABLE_HMR environment variable.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
