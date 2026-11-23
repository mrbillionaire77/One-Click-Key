import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { FieldBreakdownList, LessonIntro, PracticalTipBox } from '../components/LessonPrimitives';
import { DEMO_DATA } from '../data/demoData';
import { useDocsI18n } from '../i18n';

export function Lesson1KeySecurityPage() {
  const { docs } = useDocsI18n();
  const [showDemoPassword, setShowDemoPassword] = useState(true);

  return (
    <div className="space-y-7">
      <LessonIntro
        stepNum={docs.lesson1.stepNum}
        title={docs.lesson1.title}
        whatForBody={docs.lesson1.whatForBody}
      />

      <FieldBreakdownList
        heading={docs.lesson1.breakdownHeading}
        fields={docs.lesson1.fields}
        renderSample={(field, index) => {
          // Password sample row (index 2) gets a touch-friendly show/hide toggle
          if (index === 2) {
            return (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {docs.common.sampleLabel}:
                </span>
                <div className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-lg bg-[var(--background)] ps-3 pe-1 py-1">
                  <code
                    dir="ltr"
                    className="min-w-0 truncate font-mono text-xs text-[var(--foreground)] [unicode-bidi:isolate]"
                  >
                    {showDemoPassword ? DEMO_DATA.password : '•'.repeat(16)}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowDemoPassword((prev) => !prev)}
                    aria-label={
                      showDemoPassword
                        ? docs.lesson1.hidePasswordLabel
                        : docs.lesson1.showPasswordLabel
                    }
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
                  >
                    {showDemoPassword ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            );
          }

          return (
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
          );
        }}
      />

      {/* Quick RSA 2048 vs 4096 Comparison Note */}
      <section className="space-y-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
        <h2 className="font-semibold text-[var(--foreground)]">{docs.lesson1.rsaCompareLabel}</h2>
        <p>{docs.lesson1.rsa2048Note}</p>
        <p>{docs.lesson1.rsa4096Note}</p>
      </section>

      <PracticalTipBox heading={docs.lesson1.tipHeading} body={docs.lesson1.tipBody} />
    </div>
  );
}
