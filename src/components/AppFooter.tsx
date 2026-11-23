import { GitHubIcon } from '@/components/GitHubIcon';
import { routeToHash, type AppRoute } from '@/features/docs/router';
import { useI18n } from '@/i18n';

const REPO_URL = 'https://github.com/mrbillionaire77/One-Click-Key';
const AUTHOR_URL = 'https://github.com/mrbillionaire77';

interface AppFooterProps {
  onNavigate?: (route: AppRoute) => void;
}

export function AppFooter({ onNavigate }: AppFooterProps) {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span dir="ltr" className="font-medium text-[var(--foreground)]">
            {t.meta.brandName}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t.footer.licenseNotice}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {onNavigate && (
            <>
              <a
                href={routeToHash('/docs/setup/1')}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate('/docs/setup/1');
                }}
                className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm"
              >
                {t.footer.beginnerGuide}
              </a>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>
            {t.footer.createdBy}{' '}
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="font-mono text-[var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm"
            >
              mrbillionaire77
            </a>
          </span>
          <span aria-hidden="true">·</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-sm"
          >
            <GitHubIcon className="h-3.5 w-3.5 shrink-0" />
            <span>{t.footer.sourceCode}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
