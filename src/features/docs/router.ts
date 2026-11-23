import { useCallback, useEffect, useState } from 'react';

export type DocsRoute =
  | '/docs'
  | '/docs/setup/1'
  | '/docs/setup/2'
  | '/docs/setup/3'
  | '/docs/setup/4';

export type AppRoute = '/' | DocsRoute;

export const ALLOWED_DOCS_ROUTES: ReadonlySet<DocsRoute> = new Set<DocsRoute>([
  '/docs',
  '/docs/setup/1',
  '/docs/setup/2',
  '/docs/setup/3',
  '/docs/setup/4',
]);

/**
 * Strictly validates `window.location.hash` against an explicit allowlist.
 * Never reflects, interpolates, or returns raw user-controlled hash strings,
 * preventing DOM-based XSS and ensuring 100% reliable GitHub Pages & Offline PWA routing.
 */
export function parseSafeHashRoute(rawHash: string): AppRoute {
  if (!rawHash || rawHash === '#' || rawHash === '#/') {
    return '/';
  }

  const withoutHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const normalized = withoutHash.replace(/\/+$/, '') || '/';

  switch (normalized) {
    case '/':
      return '/';
    case '/docs':
      return '/docs';
    case '/docs/setup/1':
      return '/docs/setup/1';
    case '/docs/setup/2':
      return '/docs/setup/2';
    case '/docs/setup/3':
      return '/docs/setup/3';
    case '/docs/setup/4':
      return '/docs/setup/4';
    default:
      // Any unknown subpath under /docs safely falls back to /docs; everything else falls back to /
      return normalized.startsWith('/docs/') ? '/docs' : '/';
  }
}

export function isDocsAppRoute(route: AppRoute): route is DocsRoute {
  return route !== '/';
}

export function routeToHash(route: AppRoute): string {
  return `#${route}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? '/' : parseSafeHashRoute(window.location.hash),
  );

  useEffect(() => {
    const syncFromHash = () => {
      const next = parseSafeHashRoute(window.location.hash);
      setRoute(next);
    };

    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigate = useCallback((target: AppRoute) => {
    const safeTarget = parseSafeHashRoute(routeToHash(target));
    const nextHash = routeToHash(safeTarget);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    } else {
      setRoute(safeTarget);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    route,
    isDocsRoute: isDocsAppRoute(route),
    navigate,
  };
}
