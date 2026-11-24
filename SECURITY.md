# Security Policy

## Architectural Privacy Guarantees

**One-Click Key** is engineered to operate with zero network trust:

- **100% Client-Side Cryptographic Execution**: RSA keypair generation (`2048-bit` or `4096-bit`), X.509v3 certificate signing (`SHA-256 with RSA`), and PKCS#12 serialization execute strictly inside an isolated browser Web Worker that is terminated immediately upon completion, error, cancellation, or timeout.
- **Hardened PKCS#12 Encryption (`v1.1.0+`)**: Private keys are encrypted inside PKCS#8 `ShroudedKeyBag` using **PBES2**, **PBKDF2-HMAC-SHA256** (`50,000` iterations, `16`-byte CSPRNG salt), and **AES-256-CBC**.
  - *Transparent Library Boundaries (`node-forge@1.4.4`):* `node-forge` hardcodes the outer PKCS#12 integrity MAC (`MacData`) digest to `HMAC-SHA1` (hardened with the same `50,000` iterations and `16`-byte salt) and stores the public X.509 certificate in an unencrypted `PKCS#7 Data` bag (certificates are public metadata embedded in every signed Android APK/AAB).
- **Zero Outbound Network Requests & Strict CSP**: Deployed with `Content-Security-Policy` enforcing `default-src 'self'`, `script-src 'self'`, `worker-src 'self'`, `manifest-src 'self'`, and `connect-src 'none'` in both `index.html` (`<meta http-equiv="Content-Security-Policy">`) and `public/_headers` (HTTP response headers on Cloudflare Pages). `style-src 'self' 'unsafe-inline'` is retained solely for runtime transform styles written by `motion/react`.
- **Zero External CDNs**: All dependencies (including `node-forge` and typography) are bundled locally through `npm` and precached by the offline Service Worker (`registerType: 'prompt'` so updates never silently reload an active session).
- **Zero Persistent Secret Storage**: Passwords, private keys, and generated binary artifacts are never written to `localStorage`, `sessionStorage`, IndexedDB, cookies, or `console.log`.
- **Secret Lifecycle & Browser Memory Boundaries**:
  - Plaintext `form.password` is cleared from React state immediately upon entering Step 4.
  - Base64 export is computed lazily on demand only when explicitly revealed or copied.
  - Leaving the page or navigating to `#/docs` while a generated keystore has not yet been downloaded triggers a `beforeunload` / inline leave-guard confirmation.
  - Clicking **Wipe Memory & Reset** (or confirming **Wipe & Leave**) zeroes the generated `Uint8Array` buffer (`fill(0)`), clears volatile React state, and terminates any active worker.
  - **Opt-In Active Clipboard Clear**: If a secret (password or Base64) was copied during the session, Step 4 offers an unchecked-by-default **"Also clear active clipboard"** checkbox. Only when explicitly checked and clicked inside **Wipe Memory & Reset** does the app call `navigator.clipboard.writeText('')` synchronously (never `readText()`, never in the background, and never on **Wipe & Leave**).
  - *Inherent JavaScript / OS Limitations:* JavaScript strings (e.g., DOM input values, revealed Base64 text) are immutable and garbage-collected asynchronously by the browser engine, and web applications cannot erase OS-level clipboard history managers or process swap memory.
- **Automated Cryptographic Interoperability Verification**: A separate CI workflow (`.github/workflows/crypto-interop.yml`) runs `scripts/verify-crypto-interop.ts` on OpenSSL and Temurin OpenJDK `17` & `21` to verify both RSA `2048` and `4096` `.p12` outputs, hardened KDF parameters, `keytool -importkeystore` JKS conversion (`0xFEEDFEED`), strict `keystore.type.compat=false` validation, certificate/public-key parity, and `jarsigner` signing/verification.

## Verifying Zero-Network Execution

1. Open the app once so the Service Worker precaches static assets.
2. Disconnect from the internet (or enable **Offline** mode in browser DevTools → Network tab).
3. Inspect the document response headers in DevTools → Network → select the root document → verify `Content-Security-Policy` contains `connect-src 'none'`.
4. Complete the wizard and confirm zero network requests occur during key generation and download.

## Supported Versions

Only the latest release on the default branch of `https://github.com/mrbillionaire77/One-Click-Key` receives security fixes.

## Reporting a Vulnerability

If you discover a cryptographic bug, XSS vector, CSP bypass, ASN.1 encoding issue, or dependency vulnerability:

1. **Do not** open a public GitHub issue with exploit details.
2. Report it privately using GitHub Security Advisories at `https://github.com/mrbillionaire77/One-Click-Key/security/advisories/new` or contact the maintainer via `https://github.com/mrbillionaire77`.
3. Include reproduction steps, browser/JDK version (e.g., `keytool` output if applicable), and impact assessment.

We aim to acknowledge reports within 72 hours and publish verified patches promptly.
