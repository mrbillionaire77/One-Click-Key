import { z } from 'zod';

/**
 * Characters banned from keystore passwords to prevent Gradle Groovy/Kotlin string
 * interpolation bugs, bash/cmd escaping failures, and CI secret corruption.
 */
export const FORBIDDEN_PASSWORD_CHARS_REGEX = /["'\\$]/;

/**
 * Strict printable ASCII range (0x21-0x7E) for keystore passwords.
 * Prevents RFC 7292 BMPString / UTF-8 multi-byte discrepancies between
 * node-forge and Java 17+ keytool / SunJCE.
 */
export const PRINTABLE_ASCII_REGEX = /^[\x21-\x7E]+$/;

/**
 * Minimum manual keystore password length (aligned with NIST SP 800-63B guidance
 * while preserving mobile-friendly 50,000 PBKDF2-HMAC-SHA256 iterations).
 */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Valid alias pattern for Java KeyStore / Android Gradle Plugin signingConfigs.
 * Restricts to safe ASCII tokens without whitespace or shell metacharacters.
 */
export const KEY_ALIAS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

/**
 * Reject ASCII control characters and newlines in X.509 Distinguished Name fields
 * to prevent ASN.1/DN string injection or malformed keytool display output.
 */
export const SAFE_DN_TEXT_REGEX = /^[^\p{Cc}\p{Cs}]+$/u;

/**
 * Official Google Play requirement: signing certificates must remain valid
 * past October 22, 2033.
 */
export const GOOGLE_PLAY_MIN_EXPIRY = new Date('2033-10-23T00:00:00.000Z');

export type ValidationErrorKey =
  | 'aliasRequired'
  | 'aliasFormat'
  | 'aliasMaxLength'
  | 'keySizeInvalid'
  | 'passwordMinLength'
  | 'passwordMaxLength'
  | 'passwordAsciiOnly'
  | 'passwordForbiddenChars'
  | 'dnRequired'
  | 'dnMaxLength'
  | 'dnUnsafeChars'
  | 'countryFormat'
  | 'validityRange'
  | 'validityBeforePlayDeadline';

export const keySizeSchema = z.union([z.literal(2048), z.literal(4096)], {
  message: 'keySizeInvalid',
});

export type KeySize = z.infer<typeof keySizeSchema>;

export const step1Schema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, { message: 'aliasRequired' })
    .max(64, { message: 'aliasMaxLength' })
    .regex(KEY_ALIAS_REGEX, { message: 'aliasFormat' }),
  keySize: keySizeSchema,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, { message: 'passwordMinLength' })
    .max(128, { message: 'passwordMaxLength' })
    .refine((val) => !FORBIDDEN_PASSWORD_CHARS_REGEX.test(val), {
      message: 'passwordForbiddenChars',
    })
    .refine((val) => PRINTABLE_ASCII_REGEX.test(val), {
      message: 'passwordAsciiOnly',
    }),
});

export type Step1Input = z.infer<typeof step1Schema>;

const requiredDnField = z
  .string()
  .trim()
  .min(1, { message: 'dnRequired' })
  .max(64, { message: 'dnMaxLength' })
  .regex(SAFE_DN_TEXT_REGEX, { message: 'dnUnsafeChars' });

const optionalDnField = z
  .string()
  .trim()
  .max(64, { message: 'dnMaxLength' })
  .refine((val) => val.length === 0 || SAFE_DN_TEXT_REGEX.test(val), {
    message: 'dnUnsafeChars',
  });

/**
 * Computes the certificate expiration date for a given validity duration in years.
 */
export function computeExpiryDate(validityYears: number, referenceDate: Date = new Date()): Date {
  const expiry = new Date(referenceDate.getTime());
  expiry.setFullYear(expiry.getFullYear() + validityYears);
  return expiry;
}

export const step2Schema = z.object({
  commonName: requiredDnField,
  organizationalUnit: optionalDnField,
  organization: requiredDnField,
  locality: optionalDnField,
  state: optionalDnField,
  country: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .pipe(z.string().regex(/^[A-Z]{2}$/, { message: 'countryFormat' })),
  validityYears: z.coerce
    .number()
    .int({ message: 'validityRange' })
    .min(1, { message: 'validityRange' })
    .max(100, { message: 'validityRange' })
    .refine((years) => computeExpiryDate(years) > GOOGLE_PLAY_MIN_EXPIRY, {
      message: 'validityBeforePlayDeadline',
    }),
});

export type Step2Input = z.infer<typeof step2Schema>;

export const keystoreInputSchema = step1Schema.merge(step2Schema);

export type KeystoreInput = z.infer<typeof keystoreInputSchema>;
