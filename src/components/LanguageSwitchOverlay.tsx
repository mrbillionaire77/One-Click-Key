import { AnimatePresence, motion } from 'motion/react';
import { BrandLogo } from '@/components/BrandLogo';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { useI18n } from '@/i18n';

/**
 * Lightweight full-screen overlay displayed briefly (~950ms) when switching between
 * Arabic (RTL) and English (LTR) so direction changes apply cleanly underneath with zero glitching.
 */
export function LanguageSwitchOverlay() {
  const { isSwitchingLocale, targetLocale, locale } = useI18n();
  const activeTarget = targetLocale ?? locale;
  const targetCopy = activeTarget === 'ar' ? ar : en;

  return (
    <AnimatePresence>
      {isSwitchingLocale && (
        <motion.div
          key="language-switch-overlay"
          role="status"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)] px-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <BrandLogo size={64} />

            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                dir="ltr"
                className="text-lg font-bold tracking-tight text-[var(--foreground)]"
              >
                {targetCopy.meta.brandName}
              </span>
              <span
                dir={activeTarget === 'ar' ? 'rtl' : 'ltr'}
                className="text-xs font-medium text-[var(--muted-foreground)]"
              >
                {targetCopy.header.switchingLanguage}
              </span>
            </div>

            <div className="mt-1 h-0.5 w-32 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={
                  activeTarget === 'ar'
                    ? 'h-full w-full origin-right bg-[var(--accent)]'
                    : 'h-full w-full origin-left bg-[var(--accent)]'
                }
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
