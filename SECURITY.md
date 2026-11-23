# Security Policy

## Architectural Privacy Guarantees

**One-Click Key** is engineered to operate with zero network trust:

- **100% Client-Side Cryptographic Execution**: RSA keypair generation (`2048-bit` or `4096-bit`), X.509v3 certificate signing (`SHA-256 with RSA`), and PKCS#12 serialization execute strictly inside an isolated browser Web Worker.
- **Zero Outbound Network Requests**: Deployed with a strict Content Security Policy (`connect-src 'none'`) in both `index.html` (`<meta http-equiv="Content-Security-Policy">`) and `public/_headers` (HTTP response headers on Cloudflare Pages) so application scripts cannot initiate `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, or `sendBeacon` requests.
- **Zero External CDNs**: All dependencies (including `node-forge` and typography) are bundled locally through `npm` and precached by the offline Service Worker.
- **Zero Persistent Secret Storage**: Passwords, private keys, and generated binary artifacts are never written to `localStorage`, `sessionStorage`, IndexedDB, cookies, or `console.log`.
- **Explicit Memory Wipe**: Step 4 provides a **Wipe Memory & Reset** control that zeroes the generated `Uint8Array` buffer (`fill(0)`), clears volatile React state, and terminates the dedicated cryptographic Web Worker.

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
