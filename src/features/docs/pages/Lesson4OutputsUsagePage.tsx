import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CodeExampleBlock } from '../components/CodeExampleBlock';
import { FieldBreakdownList, LessonIntro, PracticalTipBox } from '../components/LessonPrimitives';
import { DEMO_DATA } from '../data/demoData';
import { useDocsI18n } from '../i18n';

export function Lesson4OutputsUsagePage() {
  const { docs } = useDocsI18n();
  const [dsl, setDsl] = useState<'kotlin' | 'groovy'>('kotlin');

  return (
    <div className="space-y-7">
      <LessonIntro
        stepNum={docs.lesson4.stepNum}
        title={docs.lesson4.title}
        whatForBody={docs.lesson4.whatForBody}
      />

      <FieldBreakdownList heading={docs.lesson4.breakdownHeading} fields={docs.lesson4.fields} />

      {/* Interactive Kotlin / Groovy Gradle Example */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {docs.lesson4.gradleHeading}
          </h2>

          <div
            role="tablist"
            aria-label={docs.lesson4.gradleHeading}
            className="inline-flex max-w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={dsl === 'kotlin'}
              onClick={() => setDsl('kotlin')}
              className={cn(
                'min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer',
                dsl === 'kotlin'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              <span dir="ltr" className="[unicode-bidi:isolate]">
                Kotlin DSL
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dsl === 'groovy'}
              onClick={() => setDsl('groovy')}
              className={cn(
                'min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer',
                dsl === 'groovy'
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              <span dir="ltr" className="[unicode-bidi:isolate]">
                Groovy DSL
              </span>
            </button>
          </div>
        </div>

        <CodeExampleBlock
          code={dsl === 'kotlin' ? DEMO_DATA.gradleKotlin : DEMO_DATA.gradleGroovy}
          label={dsl === 'kotlin' ? 'app/build.gradle.kts' : 'app/build.gradle'}
        />
      </section>

      <CodeExampleBlock
        code={DEMO_DATA.githubActionsStep}
        label={docs.lesson4.githubActionsLabel}
      />

      <CodeExampleBlock
        code={DEMO_DATA.keytoolVerifyCommand}
        label={docs.lesson4.keytoolLabel}
      />

      <PracticalTipBox heading={docs.lesson4.tipHeading} body={docs.lesson4.tipBody} />
    </div>
  );
}
