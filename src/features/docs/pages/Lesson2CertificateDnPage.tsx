import { CalendarCheck2 } from 'lucide-react';
import { formatCertificateDate } from '@/lib/formatDate';
import { FieldBreakdownList, LessonIntro, PracticalTipBox } from '../components/LessonPrimitives';
import { DEMO_DATA } from '../data/demoData';
import { useDocsI18n } from '../i18n';

export function Lesson2CertificateDnPage() {
  const { docs, locale } = useDocsI18n();
  const formattedSampleExpiry = formatCertificateDate(new Date(DEMO_DATA.sampleExpiryIso), locale);

  return (
    <div className="space-y-7">
      <LessonIntro
        stepNum={docs.lesson2.stepNum}
        title={docs.lesson2.title}
        whatForBody={docs.lesson2.whatForBody}
      />

      <FieldBreakdownList heading={docs.lesson2.breakdownHeading} fields={docs.lesson2.fields} />

      {/* Sample 30-Year Post-2033 Expiry Check */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--success)]/35 bg-[var(--success-subtle)] px-4 py-3 text-xs">
        <CalendarCheck2
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold text-[var(--foreground)]">
            {docs.lesson2.sampleExpiryLabel}:{' '}
            <span className="tabular-nums text-[var(--success)]">{formattedSampleExpiry}</span>
          </p>
          <p className="text-[var(--muted-foreground)]">{docs.lesson2.playRuleNote}</p>
        </div>
      </div>

      <PracticalTipBox heading={docs.lesson2.tipHeading} body={docs.lesson2.tipBody} />
    </div>
  );
}
