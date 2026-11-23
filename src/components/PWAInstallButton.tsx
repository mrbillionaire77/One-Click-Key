import { Download, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useI18n } from '@/i18n';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useI18n();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowIOSGuide(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void install();
        }}
        className="hidden sm:inline-flex"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t.header.installApp}</span>
      </Button>
    );
  }

  if (isIOS) {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={t.header.installIOS}
          onClick={() => setShowIOSGuide(true)}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t.header.installIOS}</span>
        </Button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setShowIOSGuide(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-6">
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="ios-install-title"
                  className="text-base font-semibold text-[var(--foreground)]"
                >
                  {t.header.iosGuideTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t.header.close}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                <li className="flex items-start gap-2">
                  <span
                    dir="ltr"
                    className="shrink-0 font-mono font-semibold tabular-nums text-[var(--accent)] [unicode-bidi:isolate]"
                  >
                    1.
                  </span>
                  <span>{t.header.iosGuideStep1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    dir="ltr"
                    className="shrink-0 font-mono font-semibold tabular-nums text-[var(--accent)] [unicode-bidi:isolate]"
                  >
                    2.
                  </span>
                  <span>{t.header.iosGuideStep2}</span>
                </li>
              </ol>
              <Button
                type="button"
                variant="primary"
                className="mt-5 w-full"
                onClick={() => setShowIOSGuide(false)}
              >
                {t.header.close}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
