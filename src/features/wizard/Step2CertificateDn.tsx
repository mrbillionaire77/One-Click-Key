import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldTooltip } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  computeExpiryDate,
  GOOGLE_PLAY_MIN_EXPIRY,
  step2Schema,
} from '@/schemas/keystore.schema';
import { extractFieldErrors, type FieldErrorMap, type WizardFormState } from './types';

interface Step2Props {
  form: WizardFormState;
  onChange: (patch: Partial<WizardFormState>) => void;
  onBack: () => void;
  onNext: () => void;
}

type Step2Field =
  | 'commonName'
  | 'organizationalUnit'
  | 'organization'
  | 'locality'
  | 'state'
  | 'country'
  | 'validityYears';

const VALIDITY_PRESETS = [25, 30, 50] as const;

export function Step2CertificateDn({ form, onChange, onBack, onNext }: Step2Props) {
  const { t, dir, locale } = useI18n();
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [touched, setTouched] = useState<Partial<Record<Step2Field, boolean>>>({});

  const validateFields = (next: WizardFormState) => {
    const result = step2Schema.safeParse({
      commonName: next.commonName,
      organizationalUnit: next.organizationalUnit,
      organization: next.organization,
      locality: next.locality,
      state: next.state,
      country: next.country,
      validityYears: next.validityYears,
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(extractFieldErrors(result.error));
    return false;
  };

  const updateField = (field: Step2Field, value: string) => {
    const normalized = field === 'country' ? value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) : value;
    const next = { ...form, [field]: normalized };
    onChange({ [field]: normalized });
    if (touched[field]) {
      validateFields(next);
    }
  };

  const markTouched = (field: Step2Field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateFields(form);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      commonName: true,
      organizationalUnit: true,
      organization: true,
      locality: true,
      state: true,
      country: true,
      validityYears: true,
    });
    if (validateFields(form)) {
      onNext();
    }
  };

  const parsedYears = Number.parseInt(form.validityYears, 10);
  const hasValidYears = Number.isInteger(parsedYears) && parsedYears >= 1 && parsedYears <= 100;
  const computedExpiry = hasValidYears ? computeExpiryDate(parsedYears) : null;
  const meetsPlayRule = computedExpiry !== null && computedExpiry > GOOGLE_PLAY_MIN_EXPIRY;

  const formattedExpiry = computedExpiry
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(computedExpiry)
    : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {t.steps.step2Title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t.steps.step2Subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Common Name (CN) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="dn-cn">{t.step2.commonNameLabel}</Label>
            <FieldTooltip text={t.step2.commonNameTooltip} label={t.step2.commonNameLabel} />
          </div>
          <Input
            id="dn-cn"
            name="commonName"
            autoComplete="name"
            value={form.commonName}
            placeholder={t.step2.commonNamePlaceholder}
            hasError={Boolean(touched.commonName && errors.commonName)}
            onChange={(e) => updateField('commonName', e.target.value)}
            onBlur={() => markTouched('commonName')}
          />
          {touched.commonName && errors.commonName && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.commonName]}
            </p>
          )}
        </div>

        {/* Organization (O) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="dn-o">{t.step2.orgLabel}</Label>
            <FieldTooltip text={t.step2.orgTooltip} label={t.step2.orgLabel} />
          </div>
          <Input
            id="dn-o"
            name="organization"
            autoComplete="organization"
            value={form.organization}
            placeholder={t.step2.orgPlaceholder}
            hasError={Boolean(touched.organization && errors.organization)}
            onChange={(e) => updateField('organization', e.target.value)}
            onBlur={() => markTouched('organization')}
          />
          {touched.organization && errors.organization && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.organization]}
            </p>
          )}
        </div>

        {/* Organizational Unit (OU) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="dn-ou">{t.step2.orgUnitLabel}</Label>
              <FieldTooltip text={t.step2.orgUnitTooltip} label={t.step2.orgUnitLabel} />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{t.step2.optionalTag}</span>
          </div>
          <Input
            id="dn-ou"
            name="organizationalUnit"
            value={form.organizationalUnit}
            placeholder={t.step2.orgUnitPlaceholder}
            hasError={Boolean(touched.organizationalUnit && errors.organizationalUnit)}
            onChange={(e) => updateField('organizationalUnit', e.target.value)}
            onBlur={() => markTouched('organizationalUnit')}
          />
          {touched.organizationalUnit && errors.organizationalUnit && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.organizationalUnit]}
            </p>
          )}
        </div>

        {/* Locality (L) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="dn-l">{t.step2.localityLabel}</Label>
              <FieldTooltip text={t.step2.localityTooltip} label={t.step2.localityLabel} />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{t.step2.optionalTag}</span>
          </div>
          <Input
            id="dn-l"
            name="locality"
            value={form.locality}
            placeholder={t.step2.localityPlaceholder}
            hasError={Boolean(touched.locality && errors.locality)}
            onChange={(e) => updateField('locality', e.target.value)}
            onBlur={() => markTouched('locality')}
          />
          {touched.locality && errors.locality && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.locality]}
            </p>
          )}
        </div>

        {/* State / Province (ST) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="dn-st">{t.step2.stateLabel}</Label>
              <FieldTooltip text={t.step2.stateTooltip} label={t.step2.stateLabel} />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{t.step2.optionalTag}</span>
          </div>
          <Input
            id="dn-st"
            name="state"
            value={form.state}
            placeholder={t.step2.statePlaceholder}
            hasError={Boolean(touched.state && errors.state)}
            onChange={(e) => updateField('state', e.target.value)}
            onBlur={() => markTouched('state')}
          />
          {touched.state && errors.state && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.state]}
            </p>
          )}
        </div>

        {/* Country Code (C) — Strict LTR 2-letter uppercase ISO 3166-1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="dn-c">{t.step2.countryLabel}</Label>
            <FieldTooltip text={t.step2.countryTooltip} label={t.step2.countryLabel} />
          </div>
          <Input
            id="dn-c"
            name="country"
            dir="ltr"
            maxLength={2}
            autoComplete="country"
            spellCheck={false}
            value={form.country}
            placeholder={t.step2.countryPlaceholder}
            hasError={Boolean(touched.country && errors.country)}
            onChange={(e) => updateField('country', e.target.value)}
            onBlur={() => markTouched('country')}
            className="font-mono uppercase tracking-widest"
          />
          {touched.country && errors.country && (
            <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
              {t.validation[errors.country]}
            </p>
          )}
        </div>
      </div>

      {/* Validity Period */}
      <div className="space-y-3 border-t border-[var(--border)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="validity-years">{t.step2.validityLabel}</Label>
            <FieldTooltip text={t.step2.validityTooltip} label={t.step2.validityLabel} />
          </div>

          <div className="flex items-center gap-1.5">
            {VALIDITY_PRESETS.map((preset) => {
              const isActive = form.validityYears === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateField('validityYears', String(preset))}
                  className={cn(
                    'min-h-[34px] rounded-md border px-2.5 text-xs font-mono tabular-nums cursor-pointer',
                    isActive
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                      : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  {preset}y
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-44">
            <Input
              id="validity-years"
              name="validityYears"
              dir="ltr"
              type="number"
              min={1}
              max={100}
              step={1}
              value={form.validityYears}
              hasError={Boolean(touched.validityYears && errors.validityYears)}
              onChange={(e) => updateField('validityYears', e.target.value)}
              onBlur={() => markTouched('validityYears')}
              className="pe-16 font-mono tabular-nums"
            />
            <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-xs text-[var(--muted-foreground)]">
              {t.step2.validityUnit}
            </span>
          </div>

          {formattedExpiry && meetsPlayRule && (
            <div className="flex items-center gap-2 text-xs text-[var(--success)]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t.step2.expiresOn}{' '}
                <strong className="font-semibold tabular-nums">{formattedExpiry}</strong>
                <span aria-hidden="true" className="mx-1.5 text-[var(--muted-foreground)]">
                  ·
                </span>
                <span className="text-[var(--muted-foreground)]">{t.step2.playCompliant}</span>
              </span>
            </div>
          )}
        </div>

        {touched.validityYears && errors.validityYears && (
          <p role="alert" className="text-xs font-medium text-[var(--destructive)]">
            {t.validation[errors.validityYears]}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          {dir === 'rtl' ? (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{t.step2.backBtn}</span>
        </Button>

        <Button type="submit" size="lg">
          <span>{t.step2.continueBtn}</span>
          {dir === 'rtl' ? (
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </form>
  );
}
