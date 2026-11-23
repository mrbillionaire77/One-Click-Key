import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ar } from './ar';
import { en } from './en';
import type { Locale, Translations } from './types';

interface I18nContextValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t: Translations;
  isSwitchingLocale: boolean;
  targetLocale: Locale | null;
  changeLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  const preferred = navigator.languages?.[0] ?? navigator.language ?? 'en';
  return preferred.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

// Apply locale and dir changes while concealed behind the full-screen overlay
const APPLY_LOCALE_DELAY_MS = 180;
const OVERLAY_TOTAL_DURATION_MS = 950;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale);
  const [isSwitchingLocale, setIsSwitchingLocale] = useState(false);
  const [targetLocale, setTargetLocale] = useState<Locale | null>(null);
  const applyTimerRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  useEffect(() => {
    return () => {
      if (applyTimerRef.current !== null) window.clearTimeout(applyTimerRef.current);
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const changeLocale = useCallback(
    (next: Locale) => {
      if (next === locale && !isSwitchingLocale) {
        return;
      }
      if (applyTimerRef.current !== null) window.clearTimeout(applyTimerRef.current);
      if (dismissTimerRef.current !== null) window.clearTimeout(dismissTimerRef.current);

      setTargetLocale(next);
      setIsSwitchingLocale(true);

      // Flip DOM dir & locale cleanly while concealed behind the opaque logo overlay
      applyTimerRef.current = window.setTimeout(() => {
        document.documentElement.lang = next;
        document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
        setLocale(next);
        applyTimerRef.current = null;
      }, APPLY_LOCALE_DELAY_MS);

      dismissTimerRef.current = window.setTimeout(() => {
        setIsSwitchingLocale(false);
        setTargetLocale(null);
        dismissTimerRef.current = null;
      }, OVERLAY_TOTAL_DURATION_MS);
    },
    [locale, isSwitchingLocale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir,
      t: locale === 'ar' ? ar : en,
      isSwitchingLocale,
      targetLocale,
      changeLocale,
    }),
    [locale, dir, isSwitchingLocale, targetLocale, changeLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
