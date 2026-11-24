import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AppFooter } from '@/components/AppFooter';
import { AppHeader } from '@/components/AppHeader';
import { LanguageSwitchOverlay } from '@/components/LanguageSwitchOverlay';
import { PWAUpdateBanner } from '@/components/PWAUpdateBanner';
import { Button } from '@/components/ui/button';
import { useKeystoreWorker } from '@/crypto/useKeystoreWorker';
import {
  isDocsAppRoute,
  routeToHash,
  useHashRoute,
  type AppRoute,
  type NavigateOptions,
} from '@/features/docs/router';
import { Step1KeySecurity } from '@/features/wizard/Step1KeySecurity';
import { Step2CertificateDn } from '@/features/wizard/Step2CertificateDn';
import { Step3ReviewGenerate } from '@/features/wizard/Step3ReviewGenerate';
import { Step4DownloadWipe } from '@/features/wizard/Step4DownloadWipe';
import { DesktopStepRail, MobileStepBar } from '@/features/wizard/StepRail';
import {
  INITIAL_WIZARD_STATE,
  type WizardFormState,
  type WizardStep,
} from '@/features/wizard/types';
import { I18nProvider, useI18n } from '@/i18n';
import { keystoreInputSchema } from '@/schemas/keystore.schema';

const DocsShell = lazy(() => import('@/features/docs/DocsShell'));

function DocsLoadingFallback() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-20">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" aria-hidden="true" />
    </main>
  );
}

function WizardWorkspace({
  theme,
  onToggleTheme,
  onNavigate,
  onGuardChange,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: AppRoute, options?: NavigateOptions) => void;
  onGuardChange: (
    shouldBlock: () => boolean,
    onBlocked: (target: AppRoute) => void,
  ) => void;
}) {
  const { t, dir } = useI18n();
  const [step, setStep] = useState<WizardStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_WIZARD_STATE);
  const [wipedNotice, setWipedNotice] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<AppRoute | null>(null);
  const [secretCopiedInSession, setSecretCopiedInSession] = useState(false);

  const { isGenerating, stage, error, artifact, generate, cancel, wipeArtifact } =
    useKeystoreWorker();

  const hasUndownloadedArtifactRef = useRef(false);

  const updateForm = (patch: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const navigateToStep = (next: WizardStep) => {
    setStep(next);
    setMaxReachedStep((prev) => (next > prev ? next : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!artifact || hasDownloaded) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [artifact, hasDownloaded]);

  useEffect(() => {
    hasUndownloadedArtifactRef.current = artifact !== null && !hasDownloaded;
  }, [artifact, hasDownloaded]);

  useEffect(() => {
    onGuardChange(
      () => hasUndownloadedArtifactRef.current,
      (target: AppRoute) => {
        setPendingRoute(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    );
    return () => {
      onGuardChange(
        () => false,
        () => {},
      );
    };
  }, [onGuardChange]);

  const handleGuardedNavigate = useCallback(
    (target: AppRoute) => {
      if (hasUndownloadedArtifactRef.current && isDocsAppRoute(target)) {
        setPendingRoute(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      onNavigate(target);
    },
    [onNavigate],
  );

  const handleGenerate = () => {
    const parsed = keystoreInputSchema.safeParse({
      alias: form.alias,
      keySize: form.keySize,
      password: form.password,
      commonName: form.commonName,
      organizationalUnit: form.organizationalUnit,
      organization: form.organization,
      locality: form.locality,
      state: form.state,
      country: form.country,
      validityYears: form.validityYears,
    });
    if (!parsed.success) {
      return;
    }
    generate(parsed.data, {
      timeoutMessage: t.step3.timeoutError,
      onComplete: () => {
        // Clear plaintext password from React state as soon as PKCS#12 packaging finishes
        hasUndownloadedArtifactRef.current = true;
        setForm((prev) => ({ ...prev, password: '' }));
        setHasDownloaded(false);
        setPendingRoute(null);
        setStep(4);
        setMaxReachedStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  };

  const handleWipeAndReset = () => {
    hasUndownloadedArtifactRef.current = false;
    wipeArtifact();
    setSecretCopiedInSession(false);
    setForm({ ...INITIAL_WIZARD_STATE });
    setHasDownloaded(false);
    setPendingRoute(null);
    setStep(1);
    setMaxReachedStep(1);
    setWipedNotice(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} onNavigate={handleGuardedNavigate} />
      <PWAUpdateBanner suppressed={isGenerating || artifact !== null} />
      <MobileStepBar currentStep={step} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {pendingRoute && artifact && !hasDownloaded && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--warning)]/50 bg-[var(--surface)] px-4 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5 text-[var(--foreground)]">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]"
                aria-hidden="true"
              />
              <p className="leading-relaxed">{t.step4.leaveGuardMessage}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPendingRoute(null)}
              >
                {t.step4.leaveGuardStay}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  const target = pendingRoute;
                  hasUndownloadedArtifactRef.current = false;
                  wipeArtifact();
                  setSecretCopiedInSession(false);
                  setForm({ ...INITIAL_WIZARD_STATE });
                  setHasDownloaded(false);
                  setPendingRoute(null);
                  onNavigate(target, { bypassGuard: true });
                }}
              >
                {t.step4.leaveGuardLeave}
              </Button>
            </div>
          </div>
        )}

        {wipedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[var(--success)]/40 bg-[var(--success-subtle)] px-4 py-3 text-xs font-medium text-[var(--success)]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.step4.wipedToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setWipedNotice(false)}
              aria-label={t.header.close}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--background)]/40 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <DesktopStepRail
            currentStep={step}
            maxReachedStep={maxReachedStep}
            form={form}
            isLocked={isGenerating}
            onSelectStep={navigateToStep}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 1 && (
                    <Step1KeySecurity
                      form={form}
                      onChange={updateForm}
                      onSecretCopied={() => setSecretCopiedInSession(true)}
                      onNext={() => {
                        setWipedNotice(false);
                        navigateToStep(2);
                      }}
                    />
                  )}

                  {step === 2 && (
                    <Step2CertificateDn
                      form={form}
                      onChange={updateForm}
                      onBack={() => navigateToStep(1)}
                      onNext={() => navigateToStep(3)}
                    />
                  )}

                  {step === 3 && (
                    <Step3ReviewGenerate
                      form={form}
                      isGenerating={isGenerating}
                      stage={stage}
                      error={error}
                      onEditStep={(target) => navigateToStep(target)}
                      onBack={() => navigateToStep(2)}
                      onGenerate={handleGenerate}
                      onCancel={cancel}
                    />
                  )}

                  {step === 4 && artifact && (
                    <Step4DownloadWipe
                      artifact={artifact}
                      secretCopiedInSession={secretCopiedInSession}
                      onDownloaded={() => {
                        hasUndownloadedArtifactRef.current = false;
                        setHasDownloaded(true);
                        setPendingRoute(null);
                      }}
                      onSecretCopied={() => setSecretCopiedInSession(true)}
                      onWipe={handleWipeAndReset}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Subtle, understated Beginner Guide prompt */}
            <a
              href={routeToHash('/docs/setup/1')}
              onClick={(event) => {
                event.preventDefault();
                handleGuardedNavigate('/docs/setup/1');
              }}
              className="group flex min-h-[44px] flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3 text-xs sm:text-sm hover:border-[var(--border-strong)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span className="text-[var(--muted-foreground)]">{t.guidePrompt.text}</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)] group-hover:underline underline-offset-4">
                <span>{t.guidePrompt.cta}</span>
                {dir === 'rtl' ? (
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
              </span>
            </a>
          </div>
        </div>
      </main>

      <AppFooter onNavigate={handleGuardedNavigate} />
    </div>
  );
}

function AppRouterShell({
  theme,
  onToggleTheme,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) {
  const shouldBlockGuardRef = useRef<() => boolean>(() => false);
  const onBlockedGuardRef = useRef<(target: AppRoute) => void>(() => {});

  const handleGuardChange = useCallback(
    (shouldBlock: () => boolean, onBlocked: (target: AppRoute) => void) => {
      shouldBlockGuardRef.current = shouldBlock;
      onBlockedGuardRef.current = onBlocked;
    },
    [],
  );

  const { route, navigate } = useHashRoute({
    shouldBlockNavigation: (nextRoute) =>
      isDocsAppRoute(nextRoute) && shouldBlockGuardRef.current(),
    onBlockedNavigation: (blockedRoute) => {
      onBlockedGuardRef.current(blockedRoute);
    },
  });

  if (isDocsAppRoute(route)) {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AppHeader theme={theme} onToggleTheme={onToggleTheme} onNavigate={navigate} />
        <PWAUpdateBanner />
        <Suspense fallback={<DocsLoadingFallback />}>
          <DocsShell route={route} onNavigate={navigate} />
        </Suspense>
        <AppFooter onNavigate={navigate} />
      </div>
    );
  }

  return (
    <WizardWorkspace
      theme={theme}
      onToggleTheme={onToggleTheme}
      onNavigate={navigate}
      onGuardChange={handleGuardChange}
    />
  );
}

export default function App() {
  // Dark Mode is enabled by default
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#0D0D0D' : '#F7F5F2');
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    const root = document.documentElement;
    // Disable all CSS transitions synchronously for a true 0ms instant theme switch
    root.classList.add('theme-switching');
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      root.classList.toggle('dark', next === 'dark');
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', next === 'dark' ? '#0D0D0D' : '#F7F5F2');
      }
      // Flush computed styles while transitions are disabled so no element animates
      void window.getComputedStyle(root).backgroundColor;
      window.requestAnimationFrame(() => {
        root.classList.remove('theme-switching');
      });
      return next;
    });
  }, []);

  return (
    <I18nProvider>
      <LanguageSwitchOverlay />
      <AppRouterShell theme={theme} onToggleTheme={handleToggleTheme} />
    </I18nProvider>
  );
}
