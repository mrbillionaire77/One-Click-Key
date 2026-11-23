import { CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AppFooter } from '@/components/AppFooter';
import { AppHeader } from '@/components/AppHeader';
import { LanguageSwitchOverlay } from '@/components/LanguageSwitchOverlay';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useKeystoreWorker } from '@/crypto/useKeystoreWorker';
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

function WizardWorkspace({
  theme,
  onToggleTheme,
}: {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<WizardStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_WIZARD_STATE);
  const [wipedNotice, setWipedNotice] = useState(false);

  const { isGenerating, stage, error, artifact, generate, cancel, wipeArtifact } =
    useKeystoreWorker();

  const updateForm = (patch: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const navigateToStep = (next: WizardStep) => {
    setStep(next);
    setMaxReachedStep((prev) => (next > prev ? next : prev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    generate(parsed.data, () => {
      setStep(4);
      setMaxReachedStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleWipeAndReset = () => {
    wipeArtifact();
    setForm({ ...INITIAL_WIZARD_STATE });
    setStep(1);
    setMaxReachedStep(1);
    setWipedNotice(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)] text-[var(--foreground)]">
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} />
      <MobileStepBar currentStep={step} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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

          <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
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
                  <Step4DownloadWipe artifact={artifact} onWipe={handleWipeAndReset} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

export default function App() {
  // Dark Mode by default per architectural specification
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
      <TooltipProvider delayDuration={180}>
        <LanguageSwitchOverlay />
        <WizardWorkspace theme={theme} onToggleTheme={handleToggleTheme} />
      </TooltipProvider>
    </I18nProvider>
  );
}
