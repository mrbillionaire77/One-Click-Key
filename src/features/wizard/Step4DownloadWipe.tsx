import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  buildGradleSnippet,
  buildKeytoolConvertToJksCommand,
  buildKeytoolVerifyCommand,
} from '@/crypto/formatters';
import type { GeneratedKeystoreArtifact } from '@/crypto/worker-types';
import { useI18n } from '@/i18n';
import { formatCertificateDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';

interface Step4Props {
  artifact: GeneratedKeystoreArtifact;
  onWipe: () => void;
}

type CopyKey = 'sha1' | 'sha256' | 'serial' | 'base64' | 'gradle' | 'keytool' | 'jksConvert';

export function Step4DownloadWipe({ artifact, onWipe }: Step4Props) {
  const { t, locale } = useI18n();
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);
  const [gradleDsl, setGradleDsl] = useState<'kotlin' | 'groovy'>('kotlin');
  const [revealBase64, setRevealBase64] = useState(false);
  const [showJksConvert, setShowJksConvert] = useState(false);

  const safeBaseFilename = `${artifact.alias.replace(/[^a-zA-Z0-9._-]/g, '_')}-keystore`;
  const p12Filename = `${safeBaseFilename}.p12`;
  const jksFilename = `${safeBaseFilename}.jks`;
  const jksLowercaseAlias = artifact.alias.toLowerCase();

  const gradleSnippet = buildGradleSnippet(artifact.alias, gradleDsl, p12Filename);
  const keytoolCommand = buildKeytoolVerifyCommand(artifact.alias, p12Filename);
  const jksConvertCommand = buildKeytoolConvertToJksCommand(p12Filename, jksFilename);

  const formattedExpiry = formatCertificateDate(new Date(artifact.notAfterIso), locale);

  const triggerDownload = (filename: string) => {
    // Copy bytes into a fresh Uint8Array for the Blob, wipe the temp buffer, and revoke URL after click
    const copy = new Uint8Array(artifact.p12Bytes);
    const blob = new Blob([copy], { type: 'application/x-pkcs12' });
    copy.fill(0);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyText = async (key: CopyKey, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      // Clipboard blocked by browser permissions
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Local Confirmation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t.step4.successNotice}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {t.steps.step4Title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t.steps.step4Subtitle}
        </p>
      </div>

      {/* Primary Download Section */}
      <section className="space-y-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)]/40 p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t.step4.downloadHeading}
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => triggerDownload(p12Filename)}
            className="w-full sm:w-auto sm:min-w-[280px]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t.step4.downloadP12}</span>
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
          {t.step4.downloadHint}
        </p>

        {/* Optional Local JKS Conversion Guidance */}
        <div className="border-t border-[var(--border)] pt-3">
          <button
            type="button"
            aria-expanded={showJksConvert}
            onClick={() => setShowJksConvert((prev) => !prev)}
            className="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-lg py-1 text-start text-xs font-medium text-[var(--foreground)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
          >
            <span>{t.step4.jksConvertToggle}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-150',
                showJksConvert && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {showJksConvert && (
            <div className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                {t.step4.jksConvertIntro}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <pre
                  dir="ltr"
                  className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs text-[var(--foreground)] [unicode-bidi:isolate]"
                >
                  <code>{jksConvertCommand}</code>
                </pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void copyText('jksConvert', jksConvertCommand);
                  }}
                  className="self-start shrink-0"
                >
                  {copiedKey === 'jksConvert' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                      <span>{t.step4.copiedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.step4.copyBtn}</span>
                    </>
                  )}
                </Button>
              </div>

              <ul className="list-disc space-y-1.5 ps-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
                <li>{t.step4.jksConvertSourcePassNote}</li>
                <li>{t.step4.jksConvertDestPassNote}</li>
                <li>{t.step4.jksConvertKeyPassNote}</li>
                <li>
                  <span>{t.step4.jksConvertAliasNote}</span>{' '}
                  <span className="font-medium text-[var(--foreground)]">
                    {t.step4.jksConvertAliasLowercasePrefix}{' '}
                    <code
                      dir="ltr"
                      className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--foreground)] [unicode-bidi:isolate]"
                    >
                      {jksLowercaseAlias}
                    </code>
                  </span>
                </li>
                <li>{t.step4.jksConvertGradleNote}</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* SHA-1 & SHA-256 Certificate Fingerprints */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {t.step4.fingerprintsHeading}
        </h2>
        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--background)]">
          {(
            [
              { key: 'sha256' as const, label: t.step4.sha256Label, value: artifact.sha256Fingerprint },
              { key: 'sha1' as const, label: t.step4.sha1Label, value: artifact.sha1Fingerprint },
              { key: 'serial' as const, label: t.step4.serialLabel, value: artifact.serialHex },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">{item.label}</p>
                <p
                  dir="ltr"
                  className="break-all font-mono text-xs leading-relaxed text-[var(--foreground)] [unicode-bidi:isolate]"
                >
                  {item.value}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void copyText(item.key, item.value);
                }}
                className="self-start sm:self-center shrink-0"
              >
                {copiedKey === item.key ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                    <span>{t.step4.copiedBtn}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.step4.copyBtn}</span>
                  </>
                )}
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 text-xs">
            <span className="text-[var(--muted-foreground)]">{t.step4.validUntilLabel}</span>
            <span className="inline-flex flex-wrap items-center gap-x-1.5 font-medium text-[var(--foreground)]">
              <span className="tabular-nums">{formattedExpiry}</span>
              <span aria-hidden="true" className="text-[var(--muted-foreground)]">
                ·
              </span>
              <span dir="ltr" className="font-mono tabular-nums [unicode-bidi:isolate]">
                RSA {artifact.keySize}-bit
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Gradle signingConfigs (Kotlin DSL / Groovy DSL Toggle) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t.step4.gradleHeading}
          </h2>
          <div className="flex max-w-full flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label={t.step4.gradleHeading}
              className="inline-flex max-w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={gradleDsl === 'kotlin'}
                onClick={() => setGradleDsl('kotlin')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer',
                  gradleDsl === 'kotlin'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                <span dir="ltr" className="[unicode-bidi:isolate]">
                  Kotlin DSL
                  <span className="hidden sm:inline"> (build.gradle.kts)</span>
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={gradleDsl === 'groovy'}
                onClick={() => setGradleDsl('groovy')}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer',
                  gradleDsl === 'groovy'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                <span dir="ltr" className="[unicode-bidi:isolate]">
                  Groovy DSL
                  <span className="hidden sm:inline"> (build.gradle)</span>
                </span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void copyText('gradle', gradleSnippet);
              }}
            >
              {copiedKey === 'gradle' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                  <span>{t.step4.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.step4.copyBtn}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <pre
          dir="ltr"
          className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs leading-relaxed text-[var(--foreground)] [unicode-bidi:isolate]"
        >
          <code>{gradleSnippet}</code>
        </pre>
        <p className="text-xs text-[var(--muted-foreground)]">{t.step4.gradleHint}</p>
      </section>

      {/* Java 17+ keytool Verify Command */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {t.step4.keytoolHeading}
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void copyText('keytool', keytoolCommand);
            }}
          >
            {copiedKey === 'keytool' ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                <span>{t.step4.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.step4.copyBtn}</span>
              </>
            )}
          </Button>
        </div>

        <pre
          dir="ltr"
          className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 font-mono text-xs text-[var(--foreground)] [unicode-bidi:isolate]"
        >
          <code>{keytoolCommand}</code>
        </pre>
        <p className="text-xs text-[var(--muted-foreground)]">{t.step4.keytoolHint}</p>
      </section>

      {/* Base64 Export for GitHub Actions Secrets */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t.step4.base64Heading}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRevealBase64((prev) => !prev)}
            >
              {revealBase64 ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.step4.hideBtn}</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.step4.revealBtn}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void copyText('base64', artifact.base64);
              }}
            >
              {copiedKey === 'base64' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                  <span>{t.step4.copiedBtn}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.step4.copyBtn}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {revealBase64 && (
          <pre
            dir="ltr"
            className="max-h-36 max-w-full overflow-auto break-all whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 font-mono text-xs text-[var(--foreground)] [unicode-bidi:isolate]"
          >
            <code>{artifact.base64}</code>
          </pre>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">{t.step4.base64Hint}</p>
      </section>

      {/* Wipe Memory & Reset */}
      <section className="flex flex-col gap-4 rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive-subtle)]/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.step4.wipeHeading}</h2>
          <p className="max-w-xl text-xs leading-relaxed text-[var(--muted-foreground)]">
            {t.step4.wipeBody}
          </p>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="lg"
          onClick={onWipe}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>{t.step4.wipeBtn}</span>
        </Button>
      </section>
    </div>
  );
}
