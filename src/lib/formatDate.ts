import type { Locale } from '@/i18n/types';

/**
 * Formats certificate dates using localized month names while strictly enforcing
 * Western Arabic numerals (0-9) via `numberingSystem: 'latn'` across all locales.
 */
export function formatCertificateDate(date: Date, locale: Locale): string {
  const localeTag = locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
  }).format(date);
}
