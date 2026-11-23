import forge from 'node-forge';
import { formatSubjectSummary } from './formatters';
import type { GeneratedKeystoreArtifact, GenerationStage } from './worker-types';
import { computeExpiryDate, keystoreInputSchema, type KeystoreInput } from '@/schemas/keystore.schema';

export { buildGradleSnippet, buildKeytoolVerifyCommand, formatSubjectSummary } from './formatters';

/**
 * Generates a cryptographically secure, strictly positive 128-bit X.509 serial number
 * as a lowercase hexadecimal string using Web Crypto CSPRNG.
 *
 * Clearing the MSB (`bytes[0] & 0x7f`) guarantees the ASN.1 INTEGER is always positive
 * (RFC 5280 §4.1.2.2) so Java 17+ keytool and Google Play never reject it as negative.
 */
export function generatePositiveSerialHex(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  // Ensure MSB is 0 (positive ASN.1 INTEGER) and leading byte is non-zero
  bytes[0] = (bytes[0] ?? 0) & 0x7f;
  if (bytes[0] === 0) {
    bytes[0] = 0x01;
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats a raw lowercase hex digest into standard colon-separated uppercase
 * Android / keytool fingerprint notation (e.g., `AA:BB:CC:...`).
 */
export function formatFingerprint(hex: string): string {
  const upper = hex.toUpperCase();
  const pairs: string[] = [];
  for (let i = 0; i < upper.length; i += 2) {
    pairs.push(upper.slice(i, i + 2));
  }
  return pairs.join(':');
}

/**
 * Converts a node-forge binary string (each char code 0..255) into a Uint8Array.
 */
export function binaryStringToUint8Array(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into standard Base64 without stack overflow on large buffers.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return forge.util.encode64(binary);
}

// @types/node-forge declares CertificateField.valueTagClass as `forge.asn1.Class`,
// while node-forge runtime expects `forge.asn1.Type` (e.g. UTF8 = 12, PRINTABLESTRING = 19).
const ASN1_UTF8_TAG = forge.asn1.Type.UTF8 as unknown as forge.asn1.Class;
const ASN1_PRINTABLE_TAG = forge.asn1.Type.PRINTABLESTRING as unknown as forge.asn1.Class;

/**
 * Builds X.509 Distinguished Name attributes with explicit UTF-8 ASN.1 encoding
 * for text fields and PrintableString for Country (C) per RFC 5280.
 *
 * NOTE: node-forge automatically invokes `forge.util.encodeUtf8(value)` inside
 * `distinguishedNameToAsn1` whenever `valueTagClass === forge.asn1.Type.UTF8`,
 * so we pass raw JavaScript strings here to avoid double-encoding.
 */
export function buildSubjectAttributes(input: KeystoreInput): forge.pki.CertificateField[] {
  const attrs: forge.pki.CertificateField[] = [
    {
      name: 'commonName',
      shortName: 'CN',
      value: input.commonName,
      valueTagClass: ASN1_UTF8_TAG,
    },
  ];

  if (input.organizationalUnit) {
    attrs.push({
      name: 'organizationalUnitName',
      shortName: 'OU',
      value: input.organizationalUnit,
      valueTagClass: ASN1_UTF8_TAG,
    });
  }

  attrs.push({
    name: 'organizationName',
    shortName: 'O',
    value: input.organization,
    valueTagClass: ASN1_UTF8_TAG,
  });

  if (input.locality) {
    attrs.push({
      name: 'localityName',
      shortName: 'L',
      value: input.locality,
      valueTagClass: ASN1_UTF8_TAG,
    });
  }

  if (input.state) {
    attrs.push({
      name: 'stateOrProvinceName',
      shortName: 'ST',
      value: input.state,
      valueTagClass: ASN1_UTF8_TAG,
    });
  }

  // RFC 5280 requires Country (C) to be encoded as PrintableString (2-letter ISO 3166-1)
  attrs.push({
    name: 'countryName',
    shortName: 'C',
    value: input.country.toUpperCase(),
    valueTagClass: ASN1_PRINTABLE_TAG,
  });

  return attrs;
}

/**
 * Generates an official Google Play & Java 17+ compatible PKCS#12 keystore synchronously.
 * Designed to be invoked inside a dedicated Web Worker (or directly in unit tests).
 */
export function generateKeystoreSync(
  rawInput: KeystoreInput,
  onProgress?: (stage: GenerationStage) => void,
): GeneratedKeystoreArtifact {
  onProgress?.('validating');
  const input = keystoreInputSchema.parse(rawInput);

  onProgress?.('generating-keypair');
  // Single-threaded inside our dedicated Web Worker — never spawns nested blob workers
  // that would violate strict `script-src 'self'` CSP headers.
  const keypair = forge.pki.rsa.generateKeyPair({
    bits: input.keySize,
    e: 0x10001,
  });

  onProgress?.('signing-certificate');
  const cert = forge.pki.createCertificate();
  cert.publicKey = keypair.publicKey;
  cert.serialNumber = generatePositiveSerialHex();

  const notBefore = new Date();
  const notAfter = computeExpiryDate(input.validityYears, notBefore);
  cert.validity.notBefore = notBefore;
  cert.validity.notAfter = notAfter;

  const subjectAttrs = buildSubjectAttributes(input);
  cert.setSubject(subjectAttrs);
  cert.setIssuer(subjectAttrs);

  // Standard X.509v3 extensions matching JDK keytool -genkeypair output
  cert.setExtensions([
    {
      name: 'subjectKeyIdentifier',
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
    },
  ]);

  // Self-sign with SHA-256 with RSA (sha256WithRSAEncryption)
  cert.sign(keypair.privateKey, forge.md.sha256.create());

  onProgress?.('packaging-pkcs12');
  // Compute SHA-1 and SHA-256 certificate fingerprints directly from X.509 DER bytes
  const certDerBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const sha1Hex = forge.md.sha1.create().update(certDerBytes).digest().toHex();
  const sha256Hex = forge.md.sha256.create().update(certDerBytes).digest().toHex();

  // Package into Java 17+ & apksigner compatible PKCS#12 container
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keypair.privateKey, [cert], input.password, {
    algorithm: 'aes256',
    friendlyName: input.alias,
    generateLocalKeyId: true,
    useMac: true,
  });

  const p12DerBinary = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Bytes = binaryStringToUint8Array(p12DerBinary);
  const base64 = uint8ArrayToBase64(p12Bytes);

  return {
    p12Bytes,
    base64,
    sha1Fingerprint: formatFingerprint(sha1Hex),
    sha256Fingerprint: formatFingerprint(sha256Hex),
    serialHex: cert.serialNumber.toUpperCase(),
    notBeforeIso: notBefore.toISOString(),
    notAfterIso: notAfter.toISOString(),
    alias: input.alias,
    keySize: input.keySize,
    subjectSummary: formatSubjectSummary(input),
  };
}
