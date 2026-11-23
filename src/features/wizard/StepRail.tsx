import { Check, ShieldCheck, WifiOff } from 'lucide-react';
import { formatSubjectSummary } from '@/crypto/formatters';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import type { WizardFormState, WizardStep } from './types';

interface StepRailProps {
  currentStep: WizardStep;
  maxReachedStep: WizardStep;
  form: WizardFormState;
  isLocked: boolean;
  onSelectStep: (step: WizardStep) => void;
}

export function MobileStepBar({ currentStep }: { currentStep: WizardStep }) {
  const { t } = useI18n();
  const labels: Record<WizardStep, string> = {
    1: t.steps.step1Short,
    2: t.steps.step2Short,
    3: t.steps.step3Short,
    4: t.steps.step4Short,
  };
  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="sticky top-14 z-20 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 text-xs">
        <span className="font-semibold text-[var(--foreground)]">
          <span className="tabular-nums text-[var(--accent)]">
            0{currentStep} / 04
          </span>
          <span aria-hidden="true" className="mx-2 text-[var(--border-strong)]">
            ·
          </span>
          <span>{labels[currentStep]}</span>
        </span>
        <span className="text-[var(--muted-foreground)] tabular-nums">{progressPercent}%</span>
      </div>
      <div className="h-0.5 w-full bg-[var(--surface-muted)]">
        <div
          className="h-full bg-[var(--accent)] transition-transform duration-200 origin-left rtl:origin-right"
          style={{ transform: `scaleX(${currentStep / 4})` }}
        />
      </div>
    </div>
  );
}

export function DesktopStepRail({
  currentStep,
  maxReachedStep,
  form,
  isLocked,
  onSelectStep,
}: StepRailProps) {
  const { t } = useI18n();
  const isOnline = useOnlineStatus();

  const steps: Array<{ id: WizardStep; num: string; label: string }> = [
    { id: 1, num: '01', label: t.steps.step1Short },
    { id: 2, num: '02', label: t.steps.step2Short },
    { id: 3, num: '03', label: t.steps.step3Short },
    { id: 4, num: '04', label: t.steps.step4Short },
  ];

  const subjectPreview = formatSubjectSummary({
    commonName: form.commonName,
    organizationalUnit: form.organizationalUnit,
    organization: form.organization,
    locality: form.locality,
    state: form.state,
    country: form.country,
  });

  return (
    <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:gap-8">
      <nav aria-label={t.sideRail.progressHeading}>
        <h2 className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">
          {t.sideRail.progressHeading}
        </h2>
        <ol className="space-y-1">
          {steps.map((step) => {
            const isCurrent = step.id === currentStep;
            const isDone = step.id < currentStep;
            const canNavigate =
              !isLocked && step.id !== 4 && step.id <= maxReachedStep && currentStep !== 4;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => {
                    if (canNavigate) onSelectStep(step.id);
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm',
                    isCurrent
                      ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold border border-[var(--border-strong)]'
                      : 'text-[var(--muted-foreground)] border border-transparent',
                    canNavigate && !isCurrent
                      ? 'hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] cursor-pointer'
                      : 'cursor-default',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-mono tabular-nums',
                      isCurrent
                        ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold'
                        : isDone
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                          : 'bg-[var(--surface-muted)] text-[var(--muted-foreground)]',
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step.num}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="border-t border-[var(--border)] pt-6">
        <h2 className="mb-3 text-xs font-semibold text-[var(--muted-foreground)]">
          {t.sideRail.specHeading}
        </h2>
        <dl className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted-foreground)]">{t.sideRail.formatLabel}</dt>
            <dd dir="ltr" className="font-mono text-[var(--foreground)]">
              {t.sideRail.formatValue}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted-foreground)]">{t.sideRail.signatureLabel}</dt>
            <dd dir="ltr" className="font-mono text-[var(--foreground)]">
              {t.sideRail.signatureValue}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted-foreground)]">{t.sideRail.encryptionLabel}</dt>
            <dd dir="ltr" className="font-mono text-[var(--foreground)]">
              {t.sideRail.encryptionValue}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-[var(--border)] pt-6">
        <h2 className="mb-2.5 text-xs font-semibold text-[var(--muted-foreground)]">
          {t.sideRail.dnPreviewHeading}
        </h2>
        {subjectPreview ? (
          <p
            dir="ltr"
            className="break-words rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs leading-relaxed text-[var(--foreground)]"
          >
            {subjectPreview}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
            {t.sideRail.dnPreviewEmpty}
          </p>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-6">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground)]">
          {isOnline ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          ) : (
            <WifiOff className="h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
          )}
          <span>{t.sideRail.networkStatusHeading}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {isOnline ? t.meta.onlineHint : t.meta.offlineActive}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {t.sideRail.zeroNetworkNote}
        </p>
      </div>
    </aside>
  );
}
