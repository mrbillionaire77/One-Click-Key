import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocsI18n } from '../i18n';
import { routeToHash, type AppRoute, type DocsRoute } from '../router';

interface DocsOverviewPageProps {
  onNavigate: (route: AppRoute) => void;
}

const STEP_ROUTE_BY_NUM: Record<'1' | '2' | '3' | '4', DocsRoute> = {
  '1': '/docs/setup/1',
  '2': '/docs/setup/2',
  '3': '/docs/setup/3',
  '4': '/docs/setup/4',
};

export function DocsOverviewPage({ onNavigate }: DocsOverviewPageProps) {
  const { docs, dir } = useDocsI18n();

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {docs.overview.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {docs.overview.subtitle}
        </p>
      </div>

      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {docs.overview.stepSummaries.map((item) => {
          const targetRoute = STEP_ROUTE_BY_NUM[item.num];
          return (
            <a
              key={item.num}
              href={routeToHash(targetRoute)}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(targetRoute);
              }}
              className="group flex min-h-[60px] items-center justify-between gap-4 py-4 hover:bg-[var(--background)]/60 px-2 -mx-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <span
                  dir="ltr"
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-subtle)] font-mono text-xs font-bold tabular-nums text-[var(--accent)] [unicode-bidi:isolate]"
                >
                  {item.num}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <h2 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {item.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    {item.summary}
                  </p>
                </div>
              </div>

              {dir === 'rtl' ? (
                <ArrowLeft
                  className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] group-hover:text-[var(--accent)]"
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] group-hover:text-[var(--accent)]"
                  aria-hidden="true"
                />
              )}
            </a>
          );
        })}
      </div>

      <div className="pt-1">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => onNavigate('/docs/setup/1')}
        >
          <span>{docs.overview.startStep1Cta}</span>
          {dir === 'rtl' ? (
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
