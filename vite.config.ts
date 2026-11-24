import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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

// Allowlist for Google Search Console HTML verification tokens (alphanumeric, `_`, `-`, 16-128 chars).
const GOOGLE_SITE_VERIFICATION_REGEX = /^[A-Za-z0-9_-]{16,128}$/;

function parseGoogleSiteVerificationToken(rawToken?: string): string | null {
  const token = rawToken?.trim();
  if (!token || !GOOGLE_SITE_VERIFICATION_REGEX.test(token)) {
    return null;
  }
  return token;
}

export default defineConfig(() => {
  const base = normalizeBasePath(process.env.VITE_BASE_PATH);
  const googleSiteVerification = parseGoogleSiteVerificationToken(
    process.env.GOOGLE_SITE_VERIFICATION,
  );

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
      // Optional build-time Google Search Console ownership verification for official deployments.
      // Completely inert and omitted unless GOOGLE_SITE_VERIFICATION is explicitly set to a valid token;
      // injects only a static <meta> tag and performs zero network requests or tracking.
      {
        name: 'optional-google-site-verification',
        apply: 'build' as const,
        transformIndexHtml(html: string) {
          if (!googleSiteVerification) {
            return html;
          }
          return html.replace(
            '</head>',
            `    <meta name="google-site-verification" content="${googleSiteVerification}" />\n  </head>`,
          );
        },
      },
      VitePWA({
        registerType: 'prompt',
        // Registered explicitly in src/main.tsx via virtual:pwa-register to keep index.html free of inline scripts
        injectRegister: null,
        // Icons in public/ are already matched by workbox.globPatterns; disable automatic manifest icon injection to avoid duplicate precache entries on root builds
        includeManifestIcons: false,
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
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
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
