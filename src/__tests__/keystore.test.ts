import forge from 'node-forge';
import { describe, expect, it } from 'vitest';
import {
  buildGradleSnippet,
  buildKeytoolConvertToJksCommand,
  buildKeytoolVerifyCommand,
  uint8ArrayToBase64,
} from '@/crypto/formatters';
import {
  evaluatePasswordStrength,
  generateSafePassword,
  PASSWORD_CHARSET,
} from '@/crypto/password';
import {
  generateKeystoreSync,
  generatePositiveSerialHex,
  PKCS12_PBKDF2_ITERATIONS,
  PKCS12_SALT_SIZE_BYTES,
} from '@/crypto/pkcs12';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { formatCertificateDate } from '@/lib/formatDate';
import {
  FORBIDDEN_PASSWORD_CHARS_REGEX,
  GOOGLE_PLAY_MIN_EXPIRY,
  keystoreInputSchema,
  MIN_PASSWORD_LENGTH,
  PRINTABLE_ASCII_REGEX,
  step1Schema,
  step2Schema,
} from '@/schemas/keystore.schema';

describe('Zod Keystore Input Validation', () => {
  it('accepts valid Step 1 configuration and rejects Gradle-breaking passwords', () => {
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

  it('enforces 12-to-128 character manual password length boundaries', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);

    const tooShort = step1Schema.safeParse({
      alias: 'upload-key',
      keySize: 2048,
      password: 'Abcdef1234!', // 11 chars
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0]?.message).toBe('passwordMinLength');
    }

    const exactMin = step1Schema.safeParse({
      alias: 'upload-key',
      keySize: 2048,
      password: 'Abcdef1234!#', // 12 chars
    });
    expect(exactMin.success).toBe(true);

    const exactMax = step1Schema.safeParse({
      alias: 'upload-key',
      keySize: 2048,
      password: 'A'.repeat(128),
    });
    expect(exactMax.success).toBe(true);

    const tooLong = step1Schema.safeParse({
      alias: 'upload-key',
      keySize: 2048,
      password: 'A'.repeat(129),
    });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues[0]?.message).toBe('passwordMaxLength');
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
  it('generates 100 safe high-entropy passwords excluding Gradle-breaking chars and estimates ~151 bits', () => {
    for (let i = 0; i < 100; i += 1) {
      const pw = generateSafePassword(24);
      expect(pw).toHaveLength(24);
      expect(PRINTABLE_ASCII_REGEX.test(pw)).toBe(true);
      expect(FORBIDDEN_PASSWORD_CHARS_REGEX.test(pw)).toBe(false);
      const strength = evaluatePasswordStrength(pw);
      expect(strength.level).toBe('strong');
      expect(strength.entropyBits).toBe(151);
    }
  });

  it('expands entropy pool size only when manually typed excluded characters are present and marks <12 chars weak', () => {
    // Passwords shorter than 12 chars are always rated weak regardless of pool size
    expect(evaluatePasswordStrength('Ab2!Ab2!Ab2').level).toBe('weak'); // 11 chars
    expect(evaluatePasswordStrength('Ab2!Ab2!Ab2!').level).not.toBe('weak'); // 12 chars

    // Ambiguity-free lowercase (25) vs lowercase including 'l' (26)
    expect(evaluatePasswordStrength('abcdefgh').entropyBits).toBe(Math.floor(8 * Math.log2(25)));
    expect(evaluatePasswordStrength('abcdefgl').entropyBits).toBe(Math.floor(8 * Math.log2(26)));

    // Ambiguity-free 80-char pool vs full 90-char pool (contains I, O, l, 0, 1, and extra symbol ~)
    expect(evaluatePasswordStrength('Ab2!Ab2!Ab2!Ab2!Ab2!Ab2!').entropyBits).toBe(
      Math.floor(24 * Math.log2(80)),
    );
    expect(evaluatePasswordStrength('IlO01~Ab2!Ab2!Ab2!Ab2!Ab').entropyBits).toBe(
      Math.floor(24 * Math.log2(90)),
    );
  });

  it('samples all 80 allowed characters without heavy statistical bias across a large sample', () => {
    expect(PASSWORD_CHARSET).toHaveLength(80);

    const counts = new Map<string, number>();
    for (const ch of PASSWORD_CHARSET) {
      counts.set(ch, 0);
    }

    // 500 passwords x 64 chars = 32,000 chars (~395-438 expected per char; +/-8 sigma tolerance avoids CI flakiness)
    const sampleCount = 500;
    const passwordLength = 64;
    for (let i = 0; i < sampleCount; i += 1) {
      const pw = generateSafePassword(passwordLength);
      for (const ch of pw) {
        const current = counts.get(ch);
        expect(current).toBeDefined();
        counts.set(ch, (current ?? 0) + 1);
      }
    }

    const values = Array.from(counts.values());
    const minCount = Math.min(...values);
    const maxCount = Math.max(...values);

    expect(counts.size).toBe(80);
    expect(minCount).toBeGreaterThanOrEqual(220);
    expect(maxCount).toBeLessThanOrEqual(600);
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

    // 1. Validate artifact shape, lazy Base64 round-trip, and ASN.1 DER PKCS#12 header (not JKS 0xFEEDFEED)
    expect(artifact.p12Bytes.byteLength).toBeGreaterThan(1000);
    expect(artifact.p12Bytes[0]).toBe(0x30);
    const firstFourHex = Array.from(artifact.p12Bytes.subarray(0, 4), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    expect(firstFourHex).not.toBe('feedfeed');

    const lazyBase64 = uint8ArrayToBase64(artifact.p12Bytes);
    expect(lazyBase64.length).toBeGreaterThan(1000);
    const decodedBinary = globalThis.atob(lazyBase64);
    expect(decodedBinary.length).toBe(artifact.p12Bytes.byteLength);
    expect(decodedBinary.charCodeAt(0)).toBe(0x30);

    expect(artifact.sha1Fingerprint).toMatch(/^([0-9A-F]{2}:){19}[0-9A-F]{2}$/);
    expect(artifact.sha256Fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(new Date(artifact.notAfterIso).getTime()).toBeGreaterThan(
      GOOGLE_PLAY_MIN_EXPIRY.getTime(),
    );

    // 2. Round-trip parse the PKCS#12 binary using node-forge ASN.1 decoder & verify wrong password rejection
    const binaryStr = Array.from(artifact.p12Bytes, (b) => String.fromCharCode(b)).join('');
    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    expect(() =>
      forge.pkcs12.pkcs12FromAsn1(p12Asn1, true, `${input.password}-wrong`),
    ).toThrow();

    // 2b. Verify hardened PKCS#12 ASN.1 parameters (MAC salt=16B, MAC iterations=50,000, PBKDF2 PRF=hmacWithSHA256)
    const pfxSequence = p12Asn1.value as forge.asn1.Asn1[];
    const macData = pfxSequence[2]?.value as forge.asn1.Asn1[] | undefined;
    expect(macData).toBeDefined();
    const macSaltBytes = String(macData?.[1]?.value ?? '');
    const macIterHex = forge.util.bytesToHex(String(macData?.[2]?.value ?? ''));
    expect(macSaltBytes.length).toBe(PKCS12_SALT_SIZE_BYTES);
    expect(Number.parseInt(macIterHex, 16)).toBe(PKCS12_PBKDF2_ITERATIONS);

    // Verify PBKDF2-HMAC-SHA256 OID (1.2.840.113549.2.9) is present in the EncryptedPrivateKeyInfo
    const hmacWithSha256Oid = forge.pki.oids.hmacWithSHA256 ?? '1.2.840.113549.2.9';
    const hmacWithSha256Der = forge.asn1.oidToDer(hmacWithSha256Oid).getBytes();
    expect(binaryStr.includes(hmacWithSha256Der)).toBe(true);

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

    // 6. Verify self-signature and private-key / public-key correspondence via sign + verify
    expect(cert?.verify(cert)).toBe(true);
    const recoveredPrivateKey = keyBag?.key as forge.pki.rsa.PrivateKey | undefined;
    const recoveredPublicKey = cert?.publicKey as forge.pki.rsa.PublicKey | undefined;
    expect(recoveredPrivateKey).toBeDefined();
    expect(recoveredPublicKey).toBeDefined();
    const payloadMd = forge.md.sha256.create().update('one-click-key-sign-verify-check');
    const signature = recoveredPrivateKey!.sign(payloadMd);
    expect(recoveredPublicKey!.verify(payloadMd.digest().bytes(), signature)).toBe(true);
  }, 20000);

  it('generates and verifies an RSA 4096-bit hardened PKCS#12 keystore', () => {
    const input = keystoreInputSchema.parse({
      alias: 'PlayRoot4096',
      keySize: 4096,
      password: generateSafePassword(24),
      commonName: 'One-Click RSA 4096',
      organizationalUnit: '',
      organization: 'One-Click Key QA',
      locality: '',
      state: '',
      country: 'US',
      validityYears: 30,
    });

    const artifact = generateKeystoreSync(input);
    expect(artifact.keySize).toBe(4096);
    expect(artifact.p12Bytes[0]).toBe(0x30);

    const binaryStr = Array.from(artifact.p12Bytes, (b) => String.fromCharCode(b)).join('');
    const parsedP12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(binaryStr), true, input.password);
    const keyBagOid = forge.pki.oids.pkcs8ShroudedKeyBag ?? '1.2.840.113549.1.12.10.1.2';
    const certBagOid = forge.pki.oids.certBag ?? '1.2.840.113549.1.12.10.1.3';

    const recoveredPrivateKey = parsedP12.getBags({ bagType: keyBagOid })[keyBagOid]?.[0]
      ?.key as forge.pki.rsa.PrivateKey | undefined;
    const recoveredCert = parsedP12.getBags({ bagType: certBagOid })[certBagOid]?.[0]?.cert;
    const recoveredPublicKey = recoveredCert?.publicKey as forge.pki.rsa.PublicKey | undefined;

    expect(recoveredPrivateKey).toBeDefined();
    expect(recoveredPublicKey).toBeDefined();
    expect(recoveredPublicKey!.n.bitLength()).toBe(4096);
    expect(recoveredCert?.verify(recoveredCert)).toBe(true);

    const md = forge.md.sha256.create().update('rsa-4096-sign-verify-check');
    const sig = recoveredPrivateKey!.sign(md);
    expect(recoveredPublicKey!.verify(md.digest().bytes(), sig)).toBe(true);
  }, 30000);

  it('builds Kotlin DSL, Groovy DSL, keytool verify, and local JKS conversion snippets cleanly', () => {
    const kts = buildGradleSnippet('upload-key', 'kotlin', 'upload-key-keystore.p12');
    const groovy = buildGradleSnippet('upload-key', 'groovy', 'upload-key-keystore.p12');
    const defaultKts = buildGradleSnippet('upload-key', 'kotlin');
    const verifyCmd = buildKeytoolVerifyCommand('upload-key', 'upload-key-keystore.p12');
    const defaultVerifyCmd = buildKeytoolVerifyCommand('upload-key');
    const convertCmd = buildKeytoolConvertToJksCommand(
      'upload-key-keystore.p12',
      'upload-key-keystore.jks',
    );

    expect(kts).toContain('create("release")');
    expect(kts).toContain('val keystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""');
    expect(kts).toContain('storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "upload-key-keystore.p12")');
    expect(kts).toContain('storeType = "PKCS12"');
    expect(kts).toContain('storePassword = keystorePassword');
    expect(kts).toContain('keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "upload-key"');
    expect(kts).toContain('keyPassword = keystorePassword');
    expect(kts).not.toContain('ANDROID_KEY_PASSWORD');
    expect(defaultKts).toContain('"release-keystore.p12"');

    expect(groovy).toContain('signingConfigs {');
    expect(groovy).toContain('def keystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""');
    expect(groovy).toContain('storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "upload-key-keystore.p12")');
    expect(groovy).toContain('storeType "PKCS12"');
    expect(groovy).toContain('storePassword keystorePassword');
    expect(groovy).toContain('keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "upload-key"');
    expect(groovy).toContain('keyPassword keystorePassword');
    expect(groovy).not.toContain('ANDROID_KEY_PASSWORD');

    expect(verifyCmd).toBe(
      'keytool -list -v -keystore upload-key-keystore.p12 -storetype PKCS12 -alias upload-key',
    );
    expect(defaultVerifyCmd).toBe(
      'keytool -list -v -keystore release-keystore.p12 -storetype PKCS12 -alias upload-key',
    );
    expect(convertCmd).toBe(
      'keytool -importkeystore -srckeystore upload-key-keystore.p12 -srcstoretype PKCS12 -destkeystore upload-key-keystore.jks -deststoretype JKS',
    );
    expect(convertCmd).not.toContain('pass');
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
