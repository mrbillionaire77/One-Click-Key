import { CodeExampleBlock } from '../components/CodeExampleBlock';
import { FieldBreakdownList, LessonIntro, PracticalTipBox } from '../components/LessonPrimitives';
import { useDocsI18n } from '../i18n';

const CSP_POLICY_SAMPLE =
  "Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self'; manifest-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';";

export function Lesson3OfflineSecurityPage() {
  const { docs } = useDocsI18n();

  return (
    <div className="space-y-7">
      <LessonIntro
        stepNum={docs.lesson3.stepNum}
        title={docs.lesson3.title}
        whatForBody={docs.lesson3.whatForBody}
      />

      <FieldBreakdownList heading={docs.lesson3.breakdownHeading} fields={docs.lesson3.fields} />

      <CodeExampleBlock code={CSP_POLICY_SAMPLE} label={docs.lesson3.cspSnippetLabel} />

      {/* 10-Second Offline Verification Steps */}
      <section className="space-y-2.5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {docs.lesson3.offlineCheckHeading}
        </h2>
        <ol className="space-y-2 text-xs leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          {docs.lesson3.offlineCheckSteps.map((stepText, idx) => (
            <li key={stepText} className="flex items-start gap-2.5">
              <span
                dir="ltr"
                className="shrink-0 font-mono text-xs font-semibold tabular-nums text-[var(--accent)] pt-0.5 [unicode-bidi:isolate]"
              >
                {idx + 1}.
              </span>
              <span>{stepText}</span>
            </li>
          ))}
        </ol>
      </section>

      <PracticalTipBox heading={docs.lesson3.tipHeading} body={docs.lesson3.tipBody} />
    </div>
  );
}
