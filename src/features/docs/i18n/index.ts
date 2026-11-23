import { useI18n } from '@/i18n';
import { docsAr } from './ar';
import { docsEn } from './en';
import type { DocsTranslations } from './types';

export function useDocsI18n(): {
  docs: DocsTranslations;
  locale: 'en' | 'ar';
  dir: 'ltr' | 'rtl';
} {
  const { locale, dir } = useI18n();
  return {
    docs: locale === 'ar' ? docsAr : docsEn,
    locale,
    dir,
  };
}
