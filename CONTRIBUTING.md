# Contributing to One-Click Key

Thank you for your interest in improving **One-Click Key**! Because this project generates production Android signing keys, all contributions are reviewed against strict security, offline-first, and interoperability standards.

## Development Setup

```bash
git clone https://github.com/mrbillionaire77/One-Click-Key.git
cd One-Click-Key
npm install
npm run dev
```

## Quality Checks

Run all checks locally before opening a pull request:

```bash
npm run typecheck   # Strict TypeScript check (no implicit any)
npm run lint        # ESLint security & code quality checks
npm run test        # Vitest unit tests (PKCS#12, UTF-8 DN, Zod schemas)
npm run build       # Production Vite + PWA bundle verification
```

## Non-Negotiable Contribution Rules

1. **Zero External CDNs or Telemetry**: Never add external font links, analytics, error trackers, or runtime network calls.
2. **Strict CSP Compatibility**: Do not introduce `eval()`, `new Function()`, inline script handlers, or `dangerouslySetInnerHTML`.
3. **No Secret Persistence or Logging**: Never persist passwords, private keys, or keystore bytes in `localStorage`, `sessionStorage`, IndexedDB, or `console.log`.
4. **Java 17+ & Google Play Interoperability**: Any change to `src/crypto/` must be backed by unit tests verifying positive X.509 serial numbers, UTF-8 DN encoding, `localKeyId` binding, and valid PKCS#12 parsing.
5. **Bilingual Parity**: Every user-visible string must be added to both English (`en`) and Arabic (`ar`) translation dictionaries in `src/i18n/`, preserving `dir="ltr"` isolation on technical fields.

## Attribution & License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE), maintaining attribution to `https://github.com/mrbillionaire77` and `https://github.com/mrbillionaire77/One-Click-Key`.
