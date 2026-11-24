import { useCallback, useEffect, useRef, useState } from 'react';

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

export interface GuardedHashChangeResult {
  blocked: boolean;
  nextRoute: AppRoute;
  restoreHash: string | null;
}

/**
 * Pure hash-change guard evaluator used by `useHashRoute` and unit tests.
 * When a browser Back/Forward or manual hash edit attempts to leave a guarded route,
 * returns `blocked: true` along with the hash to restore via `history.replaceState`.
 */
export function resolveGuardedHashChange(
  currentRoute: AppRoute,
  rawHash: string,
  shouldBlockNavigation?: (nextRoute: AppRoute, currentRoute: AppRoute) => boolean,
): GuardedHashChangeResult {
  const nextRoute = parseSafeHashRoute(rawHash);
  if (nextRoute !== currentRoute && shouldBlockNavigation?.(nextRoute, currentRoute)) {
    return {
      blocked: true,
      nextRoute,
      restoreHash: routeToHash(currentRoute),
    };
  }

  return {
    blocked: false,
    nextRoute,
    restoreHash: null,
  };
}

export interface UseHashRouteOptions {
  shouldBlockNavigation?: (nextRoute: AppRoute, currentRoute: AppRoute) => boolean;
  onBlockedNavigation?: (blockedRoute: AppRoute) => void;
}

export interface NavigateOptions {
  bypassGuard?: boolean;
}

export function useHashRoute(options?: UseHashRouteOptions) {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? '/' : parseSafeHashRoute(window.location.hash),
  );
  const currentRouteRef = useRef<AppRoute>(route);
  const optionsRef = useRef<UseHashRouteOptions | undefined>(options);

  useEffect(() => {
    currentRouteRef.current = route;
  }, [route]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const syncFromHash = () => {
      const result = resolveGuardedHashChange(
        currentRouteRef.current,
        window.location.hash,
        optionsRef.current?.shouldBlockNavigation,
      );

      if (result.blocked) {
        if (result.restoreHash && window.location.hash !== result.restoreHash) {
          window.history.replaceState(null, '', result.restoreHash);
        }
        optionsRef.current?.onBlockedNavigation?.(result.nextRoute);
        return;
      }

      currentRouteRef.current = result.nextRoute;
      setRoute(result.nextRoute);
    };

    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const navigate = useCallback((target: AppRoute, navOptions?: NavigateOptions) => {
    const safeTarget = parseSafeHashRoute(routeToHash(target));
    if (
      !navOptions?.bypassGuard &&
      safeTarget !== currentRouteRef.current &&
      optionsRef.current?.shouldBlockNavigation?.(safeTarget, currentRouteRef.current)
    ) {
      optionsRef.current?.onBlockedNavigation?.(safeTarget);
      return;
    }

    const nextHash = routeToHash(safeTarget);
    currentRouteRef.current = safeTarget;
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
