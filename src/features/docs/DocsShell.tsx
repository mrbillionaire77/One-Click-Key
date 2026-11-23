import { DocsLayout } from './components/DocsLayout';
import { DocsOverviewPage } from './pages/DocsOverviewPage';
import { Lesson1KeySecurityPage } from './pages/Lesson1KeySecurityPage';
import { Lesson2CertificateDnPage } from './pages/Lesson2CertificateDnPage';
import { Lesson3OfflineSecurityPage } from './pages/Lesson3OfflineSecurityPage';
import { Lesson4OutputsUsagePage } from './pages/Lesson4OutputsUsagePage';
import type { AppRoute, DocsRoute } from './router';

interface DocsShellProps {
  route: DocsRoute;
  onNavigate: (route: AppRoute) => void;
}

/**
 * Lazy-loaded, self-contained entry point for the Interactive Docs & Guided Walkthrough.
 * Completely isolated from the real keystore wizard, Web Worker, and cryptographic engine.
 */
export default function DocsShell({ route, onNavigate }: DocsShellProps) {
  return (
    <DocsLayout currentRoute={route} onNavigate={onNavigate}>
      {route === '/docs' && <DocsOverviewPage onNavigate={onNavigate} />}
      {route === '/docs/setup/1' && <Lesson1KeySecurityPage />}
      {route === '/docs/setup/2' && <Lesson2CertificateDnPage />}
      {route === '/docs/setup/3' && <Lesson3OfflineSecurityPage />}
      {route === '/docs/setup/4' && <Lesson4OutputsUsagePage />}
    </DocsLayout>
  );
}
