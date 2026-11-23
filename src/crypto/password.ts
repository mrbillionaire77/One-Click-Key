/**
 * Cryptographically secure password generation and strength assessment.
 * Strictly excludes shell and Gradle-breaking characters: ", ', \, $
 */

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
// Safe punctuation excluding ", ', \, $, and whitespace
const SAFE_SYMBOLS = '!@#%^&*()-_=+[]{}:;,.?/';

const COMBINED_CHARSET = `${UPPERCASE}${LOWERCASE}${DIGITS}${SAFE_SYMBOLS}`;

/**
 * Rejection-sampled uniform random integer in [0, max) using Web Crypto CSPRNG.
 * Eliminates modulo bias present in naive `randomByte % max` implementations.
 */
function getUniformRandomInt(max: number): number {
  if (max <= 0 || max > 256) {
    throw new RangeError('Charset length must be between 1 and 256');
  }
  const limit = Math.floor(256 / max) * max;
  const buf = new Uint8Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0] ?? 0;
  } while (value >= limit);
  return value % max;
}

/**
 * Generates a shell- and Gradle-safe high-entropy password using CSPRNG.
 * Guarantees at least one character from each class (upper, lower, digit, safe symbol)
 * and Fisher-Yates shuffles the output using CSPRNG.
 */
export function generateSafePassword(length = 24): string {
  const safeLength = Math.max(12, Math.min(64, length));
  const chars: string[] = [
    UPPERCASE[getUniformRandomInt(UPPERCASE.length)] ?? 'A',
    LOWERCASE[getUniformRandomInt(LOWERCASE.length)] ?? 'a',
    DIGITS[getUniformRandomInt(DIGITS.length)] ?? '7',
    SAFE_SYMBOLS[getUniformRandomInt(SAFE_SYMBOLS.length)] ?? '#',
  ];

  for (let i = chars.length; i < safeLength; i += 1) {
    chars.push(COMBINED_CHARSET[getUniformRandomInt(COMBINED_CHARSET.length)] ?? 'x');
  }

  // Cryptographic Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = getUniformRandomInt(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j] ?? '';
    chars[j] = tmp ?? '';
  }

  return chars.join('');
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: 0 | 1 | 2 | 3 | 4;
  entropyBits: number;
}

/**
 * Estimates password strength based on effective character pool size and length.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 'empty', score: 0, entropyBits: 0 };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 28;

  const entropyBits = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0;

  if (password.length < 8 || entropyBits < 40) {
    return { level: 'weak', score: 1, entropyBits };
  }
  if (entropyBits < 60) {
    return { level: 'fair', score: 2, entropyBits };
  }
  if (entropyBits < 85) {
    return { level: 'good', score: 3, entropyBits };
  }
  return { level: 'strong', score: 4, entropyBits };
}
