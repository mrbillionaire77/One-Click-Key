import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDocsI18n } from '../i18n';
import { routeToHash, type AppRoute, type DocsRoute } from '../router';

interface DocsLayoutProps {
  currentRoute: DocsRoute;
  onNavigate: (route: AppRoute) => void;
  children: ReactNode;
}

const STEP_ROUTES: ReadonlyArray<DocsRoute> = [
  '/docs/setup/1',
  '/docs/setup/2',
  '/docs/setup/3',
  '/docs/setup/4',
];

/**
 * Clean, zero-overlap Docs container rendered strictly in normal document flow
 * below the main sticky AppHeader. No secondary sticky bars.
 */
export function DocsLayout({ currentRoute, onNavigate, children }: DocsLayoutProps) {
  const { docs, dir } = useDocsI18n();

  const steps: ReadonlyArray<{ route: DocsRoute; num: '1' | '2' | '3' | '4'; shortLabel: string }> =
    [
      { route: '/docs/setup/1', num: '1', shortLabel: docs.nav.step1Short },
      { route: '/docs/setup/2', num: '2', shortLabel: docs.nav.step2Short },
      { route: '/docs/setup/3', num: '3', shortLabel: docs.nav.step3Short },
      { route: '/docs/setup/4', num: '4', shortLabel: docs.nav.step4Short },
    ];

  const stepIndex = STEP_ROUTES.indexOf(currentRoute);
  const prevRoute: DocsRoute | null =
    stepIndex > 0 ? (STEP_ROUTES[stepIndex - 1] ?? null) : null;
  const nextRoute: DocsRoute | null =
    stepIndex >= 0 && stepIndex < STEP_ROUTES.length - 1
      ? (STEP_ROUTES[stepIndex + 1] ?? null)
      : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-14 sm:px-6 sm:pt-8 lg:px-8">
      {/* Top Docs Controls — strictly in normal flow, never overlapping the app header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={routeToHash('/')}
            onClick={(event) => {
              event.preventDefault();
              onNavigate('/');
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] whitespace-nowrap"
          >
            {dir === 'rtl' ? (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            ) : (
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            )}
            <span>{docs.common.backToGenerator}</span>
          </a>

          <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">{docs.common.guideTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{docs.common.stepsCountLabel}</span>
          </p>
        </div>

        {/* Clean 4-Step Horizontal Selector Bar (1, 2, 3, 4) */}
        <nav
          aria-label={docs.common.guideTitle}
          className="grid grid-cols-4 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 p-1.5"
        >
          {steps.map((step) => {
            const isActive = currentRoute === step.route;
            return (
              <a
                key={step.route}
                href={routeToHash(step.route)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${docs.common.stepOfFourPrefix} ${step.num}: ${step.shortLabel}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(step.route);
                }}
                className={cn(
                  'flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:px-3',
                  isActive
                    ? 'bg-[var(--accent)] font-semibold text-[var(--accent-foreground)] shadow-xs'
                    : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
                )}
              >
                <span
                  dir="ltr"
                  className="shrink-0 font-mono text-sm font-bold tabular-nums [unicode-bidi:isolate]"
                >
                  {step.num}
                </span>
                <span className="hidden truncate sm:inline">{step.shortLabel}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Single-Elevation Lesson Container */}
      <article className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
        <div className="space-y-8">
          {children}

          {/* Previous / Next Step Footer Navigation */}
          {stepIndex >= 0 && (
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              {prevRoute ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => onNavigate(prevRoute)}
                >
                  {dir === 'rtl' ? (
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{docs.common.previousStep}</span>
                </Button>
              ) : (
                <span className="hidden sm:inline" />
              )}

              {nextRoute ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => onNavigate(nextRoute)}
                >
                  <span>{docs.common.nextStep}</span>
                  {dir === 'rtl' ? (
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="min-h-[44px] w-full sm:w-auto"
                  onClick={() => onNavigate('/')}
                >
                  <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{docs.common.startGeneratingCta}</span>
                  {dir === 'rtl' ? (
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
