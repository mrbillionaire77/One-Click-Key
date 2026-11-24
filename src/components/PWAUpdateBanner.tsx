import { RefreshCw, X } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

type UpdateListener = () => void;

let pwaUpdateAvailable = false;
let applyPwaUpdateHandler: (() => Promise<void> | void) | null = null;
const listeners = new Set<UpdateListener>();

function subscribe(listener: UpdateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return pwaUpdateAvailable;
}

/**
 * Called by `src/main.tsx` when `registerSW` detects a waiting Service Worker update.
 */
export function notifyPwaUpdateAvailable(): void {
  pwaUpdateAvailable = true;
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Registers the `updateSW(true)` callback created by `virtual:pwa-register`.
 */
export function registerPwaUpdateHandler(handler: () => Promise<void> | void): void {
  applyPwaUpdateHandler = handler;
}

interface PWAUpdateBannerProps {
  /**
   * When true (active key generation or an active keystore artifact in RAM),
   * suppresses the prompt so a reload never interrupts or discards unsaved keys.
   */
  suppressed?: boolean;
}

export function PWAUpdateBanner({ suppressed = false }: PWAUpdateBannerProps) {
  const { t } = useI18n();
  const available = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  if (!available || dismissed || suppressed) {
    return null;
  }

  const handleReload = () => {
    if (isReloading) {
      return;
    }
    setIsReloading(true);
    void Promise.resolve(applyPwaUpdateHandler?.()).catch(() => {
      setIsReloading(false);
    });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-[var(--border-strong)] bg-[var(--surface)]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
        <p className="min-w-0 flex-1 text-[var(--foreground)]">{t.pwaUpdate.message}</p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isReloading}
            onClick={handleReload}
          >
            <RefreshCw
              className={isReloading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
              aria-hidden="true"
            />
            <span>{t.pwaUpdate.reloadBtn}</span>
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t.pwaUpdate.dismissBtn}
            title={t.pwaUpdate.dismissBtn}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
