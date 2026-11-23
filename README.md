<p align="center">
  <img src="./public/favicon.svg" width="72" height="72" alt="One-Click Key logo" />
</p>

<h1 align="center">One-Click Key</h1>

<p align="center">
  <strong>100% Client-Side · Offline-First · Open-Source Android Keystore Generator</strong><br />
  Generate official Google Play App Signing & Android Gradle Plugin compatible <code>.jks</code> / <code>.p12</code> keystores directly in your browser with zero network calls.
</p>

<p align="center">
  <a href="https://github.com/mrbillionaire77/One-Click-Key">Source Repository</a> ·
  <a href="./DEPLOY.md">Deployment Guide</a> ·
  <a href="./SECURITY.md">Security Policy</a> ·
  <a href="./CONTRIBUTING.md">Contributing</a> ·
  <a href="./LICENSE">MIT License</a>
</p>

---

## Why One-Click Key?

- **Google Play & Java 17+ Compliant**: Produces standards-compliant **PKCS#12** containers (exportable as `.jks` or `.p12`) using **RSA 2048-bit** or **RSA 4096-bit**, **SHA-256 with RSA**, **PBES2 + AES-256-CBC** encryption, `localKeyId` private-key binding, strictly positive CSPRNG X.509 serial numbers, UTF-8 Distinguished Names, and default **30-year** validity (guaranteed past October 22, 2033).
- **Zero-Network Architecture**: Enforces `Content-Security-Policy: ... connect-src 'none'` directly via `<meta http-equiv="Content-Security-Policy">` in `index.html` (for GitHub Pages and static hosts) and via HTTP response headers in `public/_headers` (for Cloudflare Pages). No external CDNs, no Google Fonts requests, no analytics, and no server communication.
- **Dedicated Web Worker Execution**: Heavy RSA keypair generation runs off the main thread so the interface remains responsive even at 4096-bit key sizes.
- **Instant Memory Wipe**: Zeroes generated `Uint8Array` buffers, clears React state, and terminates the cryptographic worker in one click.
- **CI/CD & Gradle Ready**: Exports Base64 strings for GitHub Actions Secrets, **Kotlin DSL (`build.gradle.kts`)** and **Groovy DSL (`build.gradle`)** `signingConfigs`, locally calculated **SHA-1 / SHA-256** fingerprints, and a copy-ready `keytool` verification command.
- **Bilingual Arabic (RTL) & English (LTR)**: Automatic locale detection with explicit language selector and strict BiDi isolation (`dir="ltr"`) on all technical fields.
- **Built-In Interactive Docs (`#/docs`)**: Completely isolated, lazy-loaded 4-step beginner walkthrough powered by static demo data (zero coupling to the cryptographic worker).
- **Offline-First PWA**: Precaches all bundled scripts, styles, icons, and fonts locally via Service Worker so you can disconnect from the internet before generating keys.

## Verify Zero-Network Security (`connect-src 'none'`) in DevTools

You do not need to trust this app — verify it directly in your browser:

1. Open **One-Click Key** in Chrome, Firefox, Edge, or Brave.
2. Open **DevTools** (`F12`) → **Network** tab.
3. Reload once and click the main HTML document request → **Headers** → verify `Content-Security-Policy` includes:
   ```text
   connect-src 'none'
   ```
4. Optionally switch DevTools **Network** throttling to **Offline** (or turn on Airplane Mode).
5. Run through all 4 steps to generate and download your keystore — confirm **0 outbound network requests** appear in the Network log.
6. Verify your downloaded keystore locally with Java 17+ `keytool`:
   ```bash
   keytool -list -v -keystore release-keystore.jks -storetype PKCS12
   ```

## Project Structure

```text
├── .github/workflows/
│   └── deploy.yml               # Automated GitHub Pages CI/CD (typecheck, lint, test, build, deploy)
├── public/
│   ├── _headers                 # Strict Cloudflare Pages CSP & security headers
│   ├── favicon.svg              # Architectural custom SVG logo
│   └── pwa-*.png                # Offline PWA & Apple touch PNG icons
├── src/
│   ├── crypto/                  # Decoupled PKCS#12 engine, CSPRNG password generator, Web Worker
│   ├── features/wizard/         # 4-step wizard UI (Key, DN, Review, Download & Wipe)
│   ├── features/docs/           # Isolated, lazy-loaded Interactive Docs & Guided Walkthrough (#/docs)
│   ├── components/              # Brand logo, header, footer, PWA install prompt, UI primitives
│   ├── i18n/                    # Typed English (LTR) & Arabic (RTL) translation dictionaries
│   ├── schemas/                 # Strict Zod input validation & sanitization rules
│   └── __tests__/               # Vitest cryptographic, validation & Docs router test suite
├── DEPLOY.md                    # GitHub Pages, custom domain & Cloudflare Pages deployment guide
├── LICENSE                      # MIT License with attribution notice
├── SECURITY.md                  # Security guarantees & vulnerability reporting
└── CONTRIBUTING.md              # Contributor setup & quality standards
```

## Run & Build Locally

```bash
# 1. Clone the repository
git clone https://github.com/mrbillionaire77/One-Click-Key.git
cd One-Click-Key

# 2. Install dependencies
npm install

# 3. Start local development server (port 3000)
npm run dev

# 4. Run typecheck, linter, unit tests, and production build
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deploy Your Own Instance

**One-Click Key** ships with an automated **GitHub Pages** deployment workflow (`.github/workflows/deploy.yml`) that dynamically configures subpath routing, PWA manifest paths, and a build-time `connect-src 'none'` meta CSP, alongside `public/_headers` for **Cloudflare Pages**.

See **[DEPLOY.md](./DEPLOY.md)** for full step-by-step instructions for GitHub Pages, custom domains, and Cloudflare Pages.

---

<div dir="rtl" lang="ar">

## النسخة العربية — One-Click Key

**One-Click Key** هو تطبيق ويب مفتوح المصدر يعمل بالكامل داخل متصفحك (100% Client-Side) ويدعم العمل دون اتصال بالإنترنت (Offline-First PWA) لإنشاء ملفات مفاتيح أندرويد الرسمية (`.jks` / `.p12`) المتوافقة بالكامل مع **Google Play App Signing** و **Java 17+ `keytool`** و **Android Gradle Plugin**.

### أبرز المزايا الأمنية والتقنية
- **صفر اتصال بالشبكة (Zero-Network):** يفرض سياسة أمان صارمة (`connect-src 'none'`) عبر وسم `<meta>` في `index.html` (لـ GitHub Pages) وترويسات `public/_headers` (لـ Cloudflare Pages) لمنع أي طلبات شبكة صادرة، مع تضمين جميع المكتبات والخطوط محلياً دون أي روابط CDN خارجية.
- **توليد محلي معزول (Web Worker):** يتم توليد مفاتيح RSA بحجم `2048-bit` أو `4096-bit` وتوقيع شهادة X.509 بخوارزمية `SHA-256` داخل Web Worker مستقل دون تجميد الواجهة، مع رقم تسلسلي عشوائي آمن عبر `window.crypto.getRandomValues`.
- **دعم كامل للـ UTF-8 والعربية:** تشفير حقول الشهادة (DN) بترميز `UTF8String` مع عزل اتجاه النصوص التقنية (`dir="ltr"`) لضمان التوافق التام مع `keytool` و `apksigner`.
- **دليل تعليمي تفاعلي معزول (`#/docs`):** دورة عملية من 4 خطوات ببيانات تجريبية ثابتة لشرح المفاتيح وبصمات SHA و Gradle و GitHub Actions دون المساس بمحرك التشفير.
- **جاهز للنشر والتكامل (CI/CD):** استخراج بصمات `SHA-1` و `SHA-256` محلياً، وتصدير `Base64` لـ GitHub Actions Secrets، وتوليد إعدادات Gradle بصيغتي **Kotlin DSL** و **Groovy DSL**، وأمر التحقق عبر `keytool`.
- **مسح فوري للذاكرة:** زر **مسح الذاكرة وإعادة التعيين** يقوم بتصفير مصفوفات البايتات وحذف الحالة المؤقتة وإنهاء الـ Worker فوراً.

### كيف تتحقق من عدم وجود أي اتصال بالشبكة؟
1. افتح التطبيق مرة واحدة حتى يقوم الـ Service Worker بتخزين الملفات محلياً.
2. افتح أدوات المطورين (`DevTools`) → تبويب **Network** وتأكد من وجود `connect-src 'none'` في ترويسة `Content-Security-Policy`.
3. يمكنك فصل الإنترنت بالكامل (وضع الطيران) ثم توليد وتحميل ملف المفتاح بأمان تام.

</div>

---

## License & Attribution

Released under the [MIT License](./LICENSE).
Created by [https://github.com/mrbillionaire77](https://github.com/mrbillionaire77). Any derivative work, redistribution, or deployment must credit `https://github.com/mrbillionaire77` and link back to [https://github.com/mrbillionaire77/One-Click-Key](https://github.com/mrbillionaire77/One-Click-Key).
