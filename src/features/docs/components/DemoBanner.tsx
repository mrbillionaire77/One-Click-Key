import { AlertTriangle } from 'lucide-react';
import { useDocsI18n } from '../i18n';

/**
 * Compact warning notice rendered on walkthrough lessons so learners
 * never confuse fictional sample credentials with real signing keys.
 */
export function DemoBanner() {
  const { docs } = useDocsI18n();

  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-[var(--warning)]/35 bg-[var(--warning-subtle)] px-3.5 py-3 text-xs"
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]"
        aria-hidden="true"
      />
      <p className="min-w-0 leading-relaxed text-[var(--muted-foreground)]">
        <strong className="font-semibold text-[var(--foreground)]">
          {docs.common.demoBannerTitle}.
        </strong>{' '}
        {docs.common.demoBannerBody}
      </p>
    </div>
  );
}
