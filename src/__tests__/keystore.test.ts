import forge from 'node-forge';
import { describe, expect, it } from 'vitest';
import { evaluatePasswordStrength, generateSafePassword } from '@/crypto/password';
import {
  buildGradleSnippet,
  buildKeytoolVerifyCommand,
  generateKeystoreSync,
  generatePositiveSerialHex,
} from '@/crypto/pkcs12';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { formatCertificateDate } from '@/lib/formatDate';
import {
  FORBIDDEN_PASSWORD_CHARS_REGEX,
  GOOGLE_PLAY_MIN_EXPIRY,
  keystoreInputSchema,
  PRINTABLE_ASCII_REGEX,
  step1Schema,
  step2Schema,
} from '@/schemas/keystore.schema';

describe('Zod Keystore Input Validation', () => {
  it('accepts valid Step 1 configuration and rejects shell/Gradle-breaking passwords', () => {
    const valid = step1Schema.safeParse({
      alias: 'upload-key_01',
      keySize: 2048,
      password: 'SafePassword#2026!',
    });
    expect(valid.success).toBe(true);

    for (const forbidden of ['pass"word123', "pass'word123", 'pass\\word123', 'pass$word123']) {
      const result = step1Schema.safeParse({
        alias: 'upload-key',
        keySize: 2048,
        password: forbidden,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('passwordForbiddenChars');
      }
    }
  });

  it('rejects non-ASCII passwords to prevent Java 17 BMPString mismatches', () => {
    const result = step1Schema.safeParse({
      alias: 'upload-key',
      keySize: 2048,
      password: 'كلمةمرور1234',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('passwordAsciiOnly');
    }
  });

  it('normalizes Country (C) to 2-letter uppercase ISO 3166-1 and rejects invalid codes', () => {
    const valid = step2Schema.safeParse({
      commonName: 'One-Click Publisher',
      organizationalUnit: 'Mobile',
      organization: 'Acme Studio',
      locality: 'Riyadh',
      state: 'Riyadh Province',
      country: 'sa',
      validityYears: 30,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.country).toBe('SA');
    }

    const badCountry = step2Schema.safeParse({
      commonName: 'Dev',
      organizationalUnit: '',
      organization: 'Org',
      locality: '',
      state: '',
      country: 'USA',
      validityYears: 30,
    });
    expect(badCountry.success).toBe(false);
    if (!badCountry.success) {
      expect(badCountry.error.issues[0]?.message).toBe('countryFormat');
    }
  });

  it('rejects ASN.1 control characters in Distinguished Name fields', () => {
    const injected = step2Schema.safeParse({
      commonName: 'Valid\nCN=Evil',
      organizationalUnit: '',
      organization: 'Acme',
      locality: '',
      state: '',
      country: 'US',
      validityYears: 30,
    });
    expect(injected.success).toBe(false);
    if (!injected.success) {
      expect(injected.error.issues[0]?.message).toBe('dnUnsafeChars');
    }
  });

  it('rejects validity periods that expire before Google Play October 22, 2033 deadline', () => {
    const tooShort = step2Schema.safeParse({
      commonName: 'Dev',
      organizationalUnit: '',
      organization: 'Org',
      locality: '',
      state: '',
      country: 'US',
      validityYears: 1,
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0]?.message).toBe('validityBeforePlayDeadline');
    }
  });
});

describe('CSPRNG Password Generator & Strength Meter', () => {
  it('generates 100 safe high-entropy passwords excluding shell/Gradle-breaking chars', () => {
    for (let i = 0; i < 100; i += 1) {
      const pw = generateSafePassword(24);
      expect(pw).toHaveLength(24);
      expect(PRINTABLE_ASCII_REGEX.test(pw)).toBe(true);
      expect(FORBIDDEN_PASSWORD_CHARS_REGEX.test(pw)).toBe(false);
      expect(evaluatePasswordStrength(pw).level).toBe('strong');
    }
  });
});

describe('PKCS#12 Cryptographic Generation & Java 17+ Interoperability', () => {
  it('generates strictly positive 128-bit X.509 serial numbers', () => {
    for (let i = 0; i < 50; i += 1) {
      const serialHex = generatePositiveSerialHex();
      expect(serialHex).toMatch(/^[0-9a-f]{32}$/);
      const firstNibble = Number.parseInt(serialHex[0] ?? 'f', 16);
      expect(firstNibble).toBeLessThan(8);
    }
  });

  it('generates a valid PKCS#12 keystore with UTF-8 Arabic DN, SHA-256 signature, and matching fingerprints', () => {
    const input = keystoreInputSchema.parse({
      alias: 'play-upload-key',
      keySize: 2048,
      password: generateSafePassword(20),
      commonName: 'مطوّر أندرويد',
      organizationalUnit: 'هندسة التطبيقات',
      organization: 'استوديو التقنية',
      locality: 'الرياض',
      state: 'منطقة الرياض',
      country: 'SA',
      validityYears: 30,
    });

    const artifact = generateKeystoreSync(input);

    // 1. Validate artifact shape and Base64 consistency
    expect(artifact.p12Bytes.byteLength).toBeGreaterThan(1000);
    expect(artifact.base64.length).toBeGreaterThan(1000);
    expect(artifact.sha1Fingerprint).toMatch(/^([0-9A-F]{2}:){19}[0-9A-F]{2}$/);
    expect(artifact.sha256Fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(new Date(artifact.notAfterIso).getTime()).toBeGreaterThan(
      GOOGLE_PLAY_MIN_EXPIRY.getTime(),
    );

    // 2. Round-trip parse the PKCS#12 binary using node-forge ASN.1 decoder
    const binaryStr = Array.from(artifact.p12Bytes, (b) => String.fromCharCode(b)).join('');
    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    const parsedP12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, true, input.password);

    const keyBagOid = forge.pki.oids.pkcs8ShroudedKeyBag ?? '1.2.840.113549.1.12.10.1.2';
    const certBagOid = forge.pki.oids.certBag ?? '1.2.840.113549.1.12.10.1.3';

    const keyBags = parsedP12.getBags({ bagType: keyBagOid })[keyBagOid];
    const certBags = parsedP12.getBags({ bagType: certBagOid })[certBagOid];

    expect(keyBags).toBeDefined();
    expect(keyBags?.length).toBe(1);
    expect(certBags).toBeDefined();
    expect(certBags?.length).toBe(1);

    const keyBag = keyBags?.[0];
    const certBag = certBags?.[0];
    const cert = certBag?.cert;
    expect(cert).toBeDefined();

    // 3. Verify friendlyName (alias) and localKeyId binding (critical for Java 17 keytool & apksigner)
    expect(keyBag?.attributes.friendlyName?.[0]).toBe('play-upload-key');
    expect(certBag?.attributes.friendlyName?.[0]).toBe('play-upload-key');
    expect(keyBag?.attributes.localKeyId?.[0]).toBeDefined();
    expect(keyBag?.attributes.localKeyId?.[0]).toBe(certBag?.attributes.localKeyId?.[0]);

    // 4. Verify SHA-256 with RSA signature algorithm OID (1.2.840.113549.1.1.11)
    expect(cert?.signatureOid).toBe(forge.pki.oids.sha256WithRSAEncryption);

    // 5. Verify exact UTF-8 Arabic Distinguished Name preservation & PrintableString for Country (C)
    const cnField = cert?.subject.getField('CN');
    const oField = cert?.subject.getField('O');
    const ouField = cert?.subject.getField('OU');
    const lField = cert?.subject.getField('L');
    const stField = cert?.subject.getField('ST');
    const cField = cert?.subject.getField('C');

    expect(cnField?.valueTagClass).toBe(forge.asn1.Type.UTF8);
    expect(forge.util.decodeUtf8(String(cnField?.value))).toBe('مطوّر أندرويد');
    expect(forge.util.decodeUtf8(String(oField?.value))).toBe('استوديو التقنية');
    expect(forge.util.decodeUtf8(String(ouField?.value))).toBe('هندسة التطبيقات');
    expect(forge.util.decodeUtf8(String(lField?.value))).toBe('الرياض');
    expect(forge.util.decodeUtf8(String(stField?.value))).toBe('منطقة الرياض');
    expect(cField?.valueTagClass).toBe(forge.asn1.Type.PRINTABLESTRING);
    expect(cField?.value).toBe('SA');

    // 6. Verify self-signature cryptographically
    expect(cert?.verify(cert)).toBe(true);
  }, 20000);

  it('builds Kotlin DSL, Groovy DSL, and Java 17 keytool verification snippets cleanly', () => {
    const kts = buildGradleSnippet('upload-key', 'kotlin', 'upload-key-keystore.jks');
    const groovy = buildGradleSnippet('upload-key', 'groovy', 'upload-key-keystore.jks');
    const cmd = buildKeytoolVerifyCommand('upload-key', 'upload-key-keystore.jks');

    expect(kts).toContain('create("release")');
    expect(kts).toContain('keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "upload-key"');
    expect(groovy).toContain('signingConfigs {');
    expect(groovy).toContain('keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "upload-key"');
    expect(cmd).toBe(
      'keytool -list -v -keystore upload-key-keystore.jks -storetype PKCS12 -alias upload-key',
    );
  });
});

function collectStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap((v) => collectStrings(v));
  }
  return [];
}

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? collectKeys(value, path) : [path];
  });
}

describe('Western Numerals (0-9) & Bilingual Dictionary Integrity', () => {
  const EASTERN_INDIC_NUMERALS = /[\u0660-\u0669\u06F0-\u06F9]/;

  it('formats Arabic and English certificate dates strictly with Western digits (0-9)', () => {
    const sampleDate = new Date(Date.UTC(2056, 9, 22, 12, 0, 0));
    const arFormatted = formatCertificateDate(sampleDate, 'ar');
    const enFormatted = formatCertificateDate(sampleDate, 'en');

    expect(EASTERN_INDIC_NUMERALS.test(arFormatted)).toBe(false);
    expect(EASTERN_INDIC_NUMERALS.test(enFormatted)).toBe(false);
    expect(arFormatted).toContain('2056');
    expect(arFormatted).toContain('22');
    expect(enFormatted).toContain('2056');
    expect(enFormatted).toContain('22');
  });

  it('contains zero Eastern Arabic/Indic numerals and exact EN/AR key parity', () => {
    const arStrings = collectStrings(ar);
    const enStrings = collectStrings(en);

    for (const text of [...arStrings, ...enStrings]) {
      expect(EASTERN_INDIC_NUMERALS.test(text)).toBe(false);
    }

    expect(collectKeys(ar).sort()).toEqual(collectKeys(en).sort());
  });
});
