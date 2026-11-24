import { describe, expect, it } from 'vitest';
import { DEMO_DATA } from '@/features/docs/data/demoData';
import { docsAr } from '@/features/docs/i18n/ar';
import { docsEn } from '@/features/docs/i18n/en';
import {
  isDocsAppRoute,
  parseSafeHashRoute,
  resolveGuardedHashChange,
  routeToHash,
} from '@/features/docs/router';
import { formatCertificateDate } from '@/lib/formatDate';

function collectStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (Array.isArray(obj)) return obj.flatMap((item) => collectStrings(item));
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap((v) => collectStrings(v));
  }
  return [];
}

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? collectKeys(value, path)
      : [path];
  });
}

describe('Interactive Docs — Allowlisted Hash Router & XSS Prevention', () => {
  it('accepts only explicitly allowlisted routes', () => {
    expect(parseSafeHashRoute('')).toBe('/');
    expect(parseSafeHashRoute('#')).toBe('/');
    expect(parseSafeHashRoute('#/')).toBe('/');
    expect(parseSafeHashRoute('#/docs')).toBe('/docs');
    expect(parseSafeHashRoute('#/docs/')).toBe('/docs');
    expect(parseSafeHashRoute('#/docs/setup/1')).toBe('/docs/setup/1');
    expect(parseSafeHashRoute('#/docs/setup/2')).toBe('/docs/setup/2');
    expect(parseSafeHashRoute('#/docs/setup/3')).toBe('/docs/setup/3');
    expect(parseSafeHashRoute('#/docs/setup/4')).toBe('/docs/setup/4');
  });

  it('safely falls back on unknown routes and XSS payloads without reflecting raw input', () => {
    const maliciousHashes = [
      '#/<script>alert(1)</script>',
      '#/docs/<img src=x onerror=alert(1)>',
      '#/docs/setup/5',
      '#/docs/setup/0',
      '#/docs/../../etc/passwd',
      ['javascript', ':alert(1)'].join(''),
      '#/unknown/path?x=1',
    ];

    for (const raw of maliciousHashes) {
      const resolved = parseSafeHashRoute(raw);
      expect(['/', '/docs']).toContain(resolved);
      expect(resolved).not.toContain('<');
      expect(resolved).not.toContain('script');
      expect(resolved).not.toContain('javascript');
    }
  });

  it('distinguishes docs routes from main generator route and builds clean hashes', () => {
    expect(isDocsAppRoute('/')).toBe(false);
    expect(isDocsAppRoute('/docs')).toBe(true);
    expect(isDocsAppRoute('/docs/setup/4')).toBe(true);
    expect(routeToHash('/docs/setup/2')).toBe('#/docs/setup/2');
  });

  it('blocks hashchange navigation to /docs while an un-downloaded keystore guard is active and restores #/', () => {
    const guarded = (nextRoute: '/' | '/docs' | '/docs/setup/1' | '/docs/setup/2' | '/docs/setup/3' | '/docs/setup/4') =>
      isDocsAppRoute(nextRoute);

    // Back/Forward or manual hash edit to #/docs/setup/2 while on / with active guard
    const blocked = resolveGuardedHashChange('/', '#/docs/setup/2', guarded);
    expect(blocked).toEqual({
      blocked: true,
      nextRoute: '/docs/setup/2',
      restoreHash: '#/',
    });

    // Manual hash edit to #/docs is also blocked and returns restoreHash '#/'
    const blockedRootDocs = resolveGuardedHashChange('/', '#/docs', guarded);
    expect(blockedRootDocs).toEqual({
      blocked: true,
      nextRoute: '/docs',
      restoreHash: '#/',
    });

    // Staying on '/' (or resolving an unknown non-docs hash to '/') is not blocked
    const sameRoute = resolveGuardedHashChange('/', '#/unknown-path', guarded);
    expect(sameRoute).toEqual({
      blocked: false,
      nextRoute: '/',
      restoreHash: null,
    });

    // Once downloaded or wiped (guard inactive), hashchange to #/docs/setup/1 succeeds
    const allowed = resolveGuardedHashChange('/', '#/docs/setup/1', () => false);
    expect(allowed).toEqual({
      blocked: false,
      nextRoute: '/docs/setup/1',
      restoreHash: null,
    });
  });
});

describe('Interactive Docs — Bilingual Parity, Western Numerals & Static Demo Data', () => {
  const EASTERN_INDIC_NUMERALS = /[\u0660-\u0669\u06F0-\u06F9]/;

  it('enforces zero Eastern Arabic/Indic numerals and exact EN/AR dictionary key parity', () => {
    const allStrings = [...collectStrings(docsEn), ...collectStrings(docsAr)];
    for (const text of allStrings) {
      expect(EASTERN_INDIC_NUMERALS.test(text)).toBe(false);
    }

    expect(collectKeys(docsAr).sort()).toEqual(collectKeys(docsEn).sort());
    expect(docsAr.overview.stepSummaries.length).toBe(docsEn.overview.stepSummaries.length);
    expect(docsAr.lesson1.fields.length).toBe(docsEn.lesson1.fields.length);
    expect(docsAr.lesson2.fields.length).toBe(docsEn.lesson2.fields.length);
    expect(docsAr.lesson3.fields.length).toBe(docsEn.lesson3.fields.length);
    expect(docsAr.lesson4.fields.length).toBe(docsEn.lesson4.fields.length);
  });

  it('formats demo certificate expiry with Western numerals (0-9) in both Arabic and English', () => {
    const sampleDate = new Date(DEMO_DATA.sampleExpiryIso);
    const arDate = formatCertificateDate(sampleDate, 'ar');
    const enDate = formatCertificateDate(sampleDate, 'en');

    expect(EASTERN_INDIC_NUMERALS.test(arDate)).toBe(false);
    expect(EASTERN_INDIC_NUMERALS.test(enDate)).toBe(false);
    expect(arDate).toContain('2056');
    expect(enDate).toContain('2056');
  });
});
