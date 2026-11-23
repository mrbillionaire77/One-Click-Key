import { Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';
import { DemoBanner } from './DemoBanner';
import { useDocsI18n } from '../i18n';
import type { DocsFieldItem } from '../i18n/types';

interface LessonIntroProps {
  stepNum: '1' | '2' | '3' | '4';
  title: string;
  whatForBody: string;
}

export function LessonIntro({ stepNum, title, whatForBody }: LessonIntroProps) {
  const { docs } = useDocsI18n();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)]">
          <span>{docs.common.stepOfFourPrefix}</span>
          <span dir="ltr" className="font-mono font-semibold tabular-nums [unicode-bidi:isolate]">
            {stepNum}
          </span>
          <span>{docs.common.stepOfFourConnector}</span>
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {title}
        </h1>
      </div>

      <section className="space-y-1.5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {docs.common.whatForHeading}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {whatForBody}
        </p>
      </section>

      <DemoBanner />
    </div>
  );
}

interface FieldBreakdownListProps {
  heading: string;
  fields: ReadonlyArray<DocsFieldItem>;
  renderSample?: (field: DocsFieldItem, index: number) => ReactNode;
}

export function FieldBreakdownList({ heading, fields, renderSample }: FieldBreakdownListProps) {
  const { docs } = useDocsI18n();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-[var(--foreground)]">{heading}</h2>

      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {fields.map((field, index) => (
          <div key={field.name} className="space-y-2.5 py-4 first:pt-3 last:pb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{field.name}</h3>
                {field.code && (
                  <span
                    dir="ltr"
                    className="font-mono text-xs font-medium text-[var(--accent)] [unicode-bidi:isolate]"
                  >
                    ({field.code})
                  </span>
                )}
              </div>

              {typeof field.required === 'boolean' && (
                <span
                  className={
                    field.required
                      ? 'text-xs font-medium text-[var(--accent)]'
                      : 'text-xs text-[var(--muted-foreground)]'
                  }
                >
                  {field.required ? docs.common.requiredLabel : docs.common.optionalLabel}
                </span>
              )}
            </div>

            {renderSample ? (
              renderSample(field, index)
            ) : (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {docs.common.sampleLabel}:
                </span>
                <code
                  dir="ltr"
                  className="min-w-0 max-w-full break-all rounded-lg bg-[var(--background)] px-3 py-1.5 font-mono text-xs text-[var(--foreground)] [unicode-bidi:isolate]"
                >
                  {field.sample}
                </code>
              </div>
            )}

            <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              {field.why}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface PracticalTipBoxProps {
  heading: string;
  body: string;
}

export function PracticalTipBox({ heading, body }: PracticalTipBoxProps) {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent-subtle)]/45 p-4">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <h2 className="text-xs font-semibold text-[var(--foreground)] sm:text-sm">{heading}</h2>
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">{body}</p>
      </div>
    </aside>
  );
}
