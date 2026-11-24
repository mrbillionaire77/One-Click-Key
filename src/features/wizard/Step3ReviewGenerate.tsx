import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GenerationStage } from '@/crypto/worker-types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useI18n } from '@/i18n';
import type { WizardFormState, WizardStep } from './types';

interface Step3Props {
  form: WizardFormState;
  isGenerating: boolean;
  stage: GenerationStage | null;
  error: string | null;
  onEditStep: (step: WizardStep) => void;
  onBack: () => void;
  onGenerate: () => void;
  onCancel: () => void;
}

export function Step3ReviewGenerate({
  form,
  isGenerating,
  stage,
  error,
  onEditStep,
  onBack,
  onGenerate,
  onCancel,
}: Step3Props) {
  const { t, dir } = useI18n();
  const isOnline = useOnlineStatus();
  const [revealPassword, setRevealPassword] = useState(false);

  const dnRows: Array<{ label: string; value: string; ltr?: boolean }> = [
    { label: 'CN', value: form.commonName },
    ...(form.organizationalUnit ? [{ label: 'OU', value: form.organizationalUnit }] : []),
    { label: 'O', value: form.organization },
    ...(form.locality ? [{ label: 'L', value: form.locality }] : []),
    ...(form.state ? [{ label: 'ST', value: form.state }] : []),
    { label: 'C', value: form.country.toUpperCase(), ltr: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {t.steps.step3Title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t.steps.step3Subtitle}
        </p>
      </div>

      {/* Offline-Ready / Zero Network Notice */}
      <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)]/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {isOnline ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          ) : (
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden="true" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {t.step3.offlineBannerTitle}
            </p>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              {t.step3.offlineBannerBody}
            </p>
            <p
              className={
                isOnline
                  ? 'pt-1 text-xs font-medium text-[var(--accent)]'
                  : 'pt-1 text-xs font-medium text-[var(--success)]'
              }
            >
              {isOnline ? t.step3.disconnectSuggestion : t.step3.offlineConfirmed}
            </p>
          </div>
        </div>
      </div>

      {/* Key & Security Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t.step3.keySectionTitle}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            onClick={() => onEditStep(1)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.step3.editBtn}</span>
          </Button>
        </div>

        <dl className="divide-y divide-[var(--border)] text-sm">
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[var(--muted-foreground)]">{t.step3.aliasRow}</dt>
            <dd
              dir="ltr"
              className="min-w-0 break-all font-mono font-medium text-[var(--foreground)] [unicode-bidi:isolate]"
            >
              {form.alias}
            </dd>
          </div>

          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[var(--muted-foreground)]">{t.step3.keySizeRow}</dt>
            <dd
              dir="ltr"
              className="min-w-0 font-mono font-medium tabular-nums text-[var(--foreground)] [unicode-bidi:isolate]"
            >
              RSA {form.keySize}-bit · SHA-256 · PKCS#12 (AES-256)
            </dd>
          </div>

          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[var(--muted-foreground)]">{t.step3.passwordRow}</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <span
                dir="ltr"
                className="min-w-0 break-all font-mono text-[var(--foreground)] [unicode-bidi:isolate]"
              >
                {revealPassword ? form.password : '•'.repeat(Math.min(form.password.length, 16))}
              </span>
              <button
                type="button"
                onClick={() => setRevealPassword((prev) => !prev)}
                aria-label={revealPassword ? t.step1.hidePassword : t.step1.showPassword}
                title={revealPassword ? t.step1.hidePassword : t.step1.showPassword}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
              >
                {revealPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </dd>
          </div>
        </dl>
      </section>

      {/* Certificate DN Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t.step3.dnSectionTitle}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isGenerating}
            onClick={() => onEditStep(2)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.step3.editBtn}</span>
          </Button>
        </div>

        <dl className="divide-y divide-[var(--border)] text-sm">
          {dnRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <dt
                dir="ltr"
                className="shrink-0 font-mono text-xs text-[var(--muted-foreground)] [unicode-bidi:isolate]"
              >
                {row.label}
              </dt>
              <dd
                dir={row.ltr ? 'ltr' : 'auto'}
                className={
                  row.ltr
                    ? 'min-w-0 break-all font-mono font-medium text-[var(--foreground)] [unicode-bidi:isolate]'
                    : 'min-w-0 break-words font-medium text-[var(--foreground)] [unicode-bidi:isolate]'
                }
              >
                {row.value}
              </dd>
            </div>
          ))}

          <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[var(--muted-foreground)]">{t.step3.validityRow}</dt>
            <dd className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
              <span dir="ltr" className="font-mono tabular-nums [unicode-bidi:isolate]">
                {form.validityYears}
              </span>
              <span>{t.step3.yearsUnit}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Active Web Worker Generation Progress */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col gap-3 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent-subtle)]/50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--accent)]" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {t.step3.generatingBtn}
              </p>
              {stage && (
                <p className="text-xs text-[var(--muted-foreground)]">{t.step3.stages[stage]}</p>
              )}
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.step3.cancelBtn}</span>
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive-subtle)] p-4 text-xs text-[var(--destructive)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">{t.step3.errorHeading}</p>
            <p dir="auto" className="break-words leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Navigation & Generate Trigger */}
      <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isGenerating}
          onClick={onBack}
        >
          {dir === 'rtl' ? (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{t.step3.backBtn}</span>
        </Button>

        <Button
          type="button"
          size="lg"
          disabled={isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Cpu className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isGenerating ? t.step3.generatingBtn : t.step3.generateBtn}</span>
        </Button>
      </div>
    </div>
  );
}
