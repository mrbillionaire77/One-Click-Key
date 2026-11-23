import { ArrowLeft, ArrowRight, Check, Copy, Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldTooltip } from '@/components/ui/tooltip';
import { evaluatePasswordStrength, generateSafePassword } from '@/crypto/password';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { step1Schema, type KeySize } from '@/schemas/keystore.schema';
import { extractFieldErrors, type FieldErrorMap, type WizardFormState } from './types';

interface Step1Props {
  form: WizardFormState;
  onChange: (patch: Partial<WizardFormState>) => void;
  onNext: () => void;
}

export function Step1KeySecurity({ form, onChange, onNext }: Step1Props) {
  const { t, dir } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [touched, setTouched] = useState<Partial<Record<'alias' | 'password', boolean>>>({});

  const strength = evaluatePasswordStrength(form.password);

  const validateFields = (next: WizardFormState) => {
    const result = step1Schema.safeParse({
      alias: next.alias,
      keySize: next.keySize,
      password: next.password,
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    setErrors(extractFieldErrors(result.error));
    return false;
  };

  const handleAliasChange = (value: string) => {
    const next = { ...form, alias: value };
    onChange({ alias: value });
    if (touched.alias) {
      validateFields(next);
    }
  };

  const handlePasswordChange = (value: string) => {
    const next = { ...form, password: value };
    onChange({ password: value });
    if (touched.password) {
      validateFields(next);
    }
  };

  const handleGeneratePassword = () => {
    const generated = generateSafePassword(24);
    const next = { ...form, password: generated };
    onChange({ password: generated });
    setTouched((prev) => ({ ...prev, password: true }));
    setShowPassword(true);
    validateFields(next);
  };

  const handleCopyPassword = async () => {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      setCopiedPassword(true);
      window.setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      // Ignore clipboard permission denial
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ alias: true, password: true });
    if (validateFields(form)) {
      onNext();
    }
  };

  const strengthColor =
    strength.score <= 1
      ? 'bg-[var(--destructive)]'
      : strength.score === 2
        ? 'bg-[var(--warning)]'
        : strength.score === 3
          ? 'bg-[var(--accent)]'
          : 'bg-[var(--success)]';

  const strengthTextColor =
    strength.score === 0
      ? 'text-[var(--muted-foreground)]'
      : strength.score === 1
        ? 'text-[var(--destructive)]'
        : strength.score === 2
          ? 'text-[var(--warning)]'
          : strength.score === 3
            ? 'text-[var(--accent)]'
            : 'text-[var(--success)]';

  const keySizes: Array<{ size: KeySize; title: string; desc: string; recommended: boolean }> = [
    {
      size: 2048,
      title: t.step1.keySize2048Title,
      desc: t.step1.keySize2048Desc,
      recommended: true,
    },
    {
      size: 4096,
      title: t.step1.keySize4096Title,
      desc: t.step1.keySize4096Desc,
      recommended: false,
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {t.steps.step1Title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t.steps.step1Subtitle}
        </p>
      </div>

      {/* Key Alias */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="key-alias">{t.step1.aliasLabel}</Label>
          <FieldTooltip text={t.step1.aliasTooltip} label={t.step1.aliasLabel} />
        </div>
        <Input
          id="key-alias"
          name="alias"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          value={form.alias}
          placeholder={t.step1.aliasPlaceholder}
          hasError={Boolean(touched.alias && errors.alias)}
          aria-describedby={touched.alias && errors.alias ? 'alias-error' : undefined}
          onChange={(e) => handleAliasChange(e.target.value)}
          onBlur={() => {
            setTouched((prev) => ({ ...prev, alias: true }));
            validateFields(form);
          }}
          className="font-mono"
        />
        {touched.alias && errors.alias && (
          <p id="alias-error" role="alert" className="text-xs font-medium text-[var(--destructive)]">
            {t.validation[errors.alias]}
          </p>
        )}
      </div>

      {/* Key Size Selector */}
      <fieldset className="space-y-3">
        <div className="flex items-center gap-1.5">
          <legend className="text-sm font-medium text-[var(--foreground)]">
            {t.step1.keySizeLabel}
          </legend>
          <FieldTooltip text={t.step1.keySizeTooltip} label={t.step1.keySizeLabel} />
        </div>

        <div
          role="radiogroup"
          aria-label={t.step1.keySizeLabel}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {keySizes.map((item) => {
            const isSelected = form.keySize === item.size;
            return (
              <button
                key={item.size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange({ keySize: item.size })}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer',
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]/60'
                    : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-strong)]',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="font-mono text-sm font-semibold text-[var(--foreground)] [unicode-bidi:isolate]"
                  >
                    {item.title}
                  </span>
                  {item.recommended && (
                    <span className="text-xs font-medium text-[var(--accent)]">
                      {t.step1.recommended}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Password & CSPRNG Generator */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="keystore-password">{t.step1.passwordLabel}</Label>
            <FieldTooltip text={t.step1.passwordTooltip} label={t.step1.passwordLabel} />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGeneratePassword}
          >
            <RefreshCw className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>{t.step1.generatePassword}</span>
          </Button>
        </div>

        <div
          className={cn(
            'flex min-h-[44px] w-full items-center rounded-lg border bg-[var(--background)] focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-offset-[var(--background)]',
            touched.password && errors.password
              ? 'border-[var(--destructive)] focus-within:ring-[var(--destructive)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)] focus-within:ring-[var(--ring)]',
          )}
        >
          <input
            id="keystore-password"
            name="password"
            dir="ltr"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            spellCheck={false}
            value={form.password}
            placeholder={t.step1.passwordPlaceholder}
            aria-invalid={Boolean(touched.password && errors.password) || undefined}
            aria-describedby={
              touched.password && errors.password ? 'password-note password-error' : 'password-note'
            }
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, password: true }));
              validateFields(form);
            }}
            className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex shrink-0 items-center gap-1 pe-1.5">
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t.step1.hidePassword : t.step1.showPassword}
              title={showPassword ? t.step1.hidePassword : t.step1.showPassword}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              disabled={!form.password}
              onClick={() => {
                void handleCopyPassword();
              }}
              aria-label={copiedPassword ? t.step1.copied : t.step1.copyPassword}
              title={copiedPassword ? t.step1.copied : t.step1.copyPassword}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
            >
              {copiedPassword ? (
                <Check className="h-4 w-4 text-[var(--success)]" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Real-time Strength Meter (Explicit label + entropy + bars) */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((segment) => (
              <div
                key={segment}
                className={cn(
                  'h-1.5 rounded-full',
                  strength.score >= segment ? strengthColor : 'bg-[var(--surface-muted)]',
                )}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--muted-foreground)]">
              {t.step1.strengthLabel}:{' '}
              <strong className={cn('font-semibold', strengthTextColor)}>
                {t.step1.strengthLevels[strength.level]}
              </strong>
            </span>
            {strength.entropyBits > 0 && (
              <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                <span
                  dir="ltr"
                  className="font-mono tabular-nums [unicode-bidi:isolate]"
                >
                  ~{strength.entropyBits}
                </span>
                <span>{t.step1.entropyUnit}</span>
              </span>
            )}
          </div>
        </div>

        {touched.password && errors.password && (
          <p
            id="password-error"
            role="alert"
            className="text-xs font-medium text-[var(--destructive)]"
          >
            {t.validation[errors.password]}
          </p>
        )}

        <p id="password-note" className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
          <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <span>{t.step1.safeCharsetNote}</span>
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end border-t border-[var(--border)] pt-6">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <span>{t.step1.continueBtn}</span>
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
