import type { DocsTranslations } from './types';

export const docsEn: DocsTranslations = {
  common: {
    guideTitle: 'Beginner Guide',
    stepsCountLabel: '4 Practical Steps',
    backToGenerator: 'Back to Generator',
    previousStep: 'Previous Step',
    nextStep: 'Next Step',
    startGeneratingCta: 'Start Generating Your Real Key',
    stepOfFourPrefix: 'Step',
    stepOfFourConnector: 'of 4',
    whatForHeading: 'What is this step for?',
    demoBannerTitle: 'Sample data only — do not use in production',
    demoBannerBody:
      'Values below are fictional examples for learning. No real cryptographic keys are created here.',
    sampleLabel: 'Sample',
    requiredLabel: 'Required',
    optionalLabel: 'Optional',
    copyBtn: 'Copy Sample',
    copiedBtn: 'Copied',
  },
  nav: {
    step1Short: 'Key & Security',
    step2Short: 'Certificate (DN)',
    step3Short: 'Local Generation',
    step4Short: 'Download & Use',
  },
  overview: {
    title: 'Android Keystore Beginner Guide',
    subtitle:
      'Four quick lessons explaining every field, offline security guarantee, and output file in One-Click Key before you generate your real signing key.',
    startStep1Cta: 'Start Step 1',
    stepSummaries: [
      {
        num: '1',
        title: 'Key & Security',
        summary: 'Pick a clean Key Alias, RSA strength (2048 vs 4096), and a Gradle-safe password.',
      },
      {
        num: '2',
        title: 'Certificate Details (DN)',
        summary: 'Fill out publisher identity fields (CN, O, C) and set a post-2033 validity period.',
      },
      {
        num: '3',
        title: 'Review & Local Generation',
        summary: 'Understand how your browser generates keys offline with zero network calls.',
      },
      {
        num: '4',
        title: 'Download & Use Your Keystore',
        summary: 'Save .p12 safely (or convert locally to legacy .jks), add SHA fingerprints, configure Gradle, and verify.',
      },
    ],
  },
  lesson1: {
    stepNum: '1',
    title: 'Key & Security',
    whatForBody:
      'This step sets the name, encryption strength, and password for your Android upload key. Android Studio, Gradle, and Google Play use these exact credentials whenever you sign a release build.',
    breakdownHeading: 'Field-by-field breakdown',
    fields: [
      {
        name: 'Key Alias',
        required: true,
        sample: 'demo-upload-key',
        why: 'A short label that identifies your signing key inside the keystore file. Gradle references it as keyAlias.',
      },
      {
        name: 'RSA Key Size',
        required: true,
        sample: '2048-bit RSA (Recommended)',
        why: 'Sets cryptographic strength. 2048-bit meets Google Play requirements and generates in ~1-2 seconds; 4096-bit offers extra margin with longer generation time.',
      },
      {
        name: 'Keystore & Key Password',
        required: true,
        sample: 'DemoOnly#NotForProd2026!',
        why: 'Protects both the keystore container (storePassword) and private key (keyPassword). Use printable ASCII without quotes, backslashes, or $ signs.',
      },
    ],
    rsaCompareLabel: 'Quick comparison',
    rsa2048Note: '2048-bit: Standard for Google Play upload keys, fast (~1-2s).',
    rsa4096Note: '4096-bit: Maximum classical RSA strength, slower (~5-20s in browser).',
    showPasswordLabel: 'Show demo password',
    hidePasswordLabel: 'Hide demo password',
    tipHeading: 'Common mistake to avoid',
    tipBody:
      'Never include " \' \\ or $ in your password — those characters often break Gradle scripts and GitHub Actions shells. Use the built-in "Generate Safe Password" button and save both your alias and password in a password manager immediately.',
  },
  lesson2: {
    stepNum: '2',
    title: 'Certificate Details (DN)',
    whatForBody:
      'Every Android signing key comes with an X.509 certificate describing the app publisher. These fields are public metadata embedded in your certificate and do not need to match a registered trademark.',
    breakdownHeading: 'Field-by-field breakdown',
    fields: [
      {
        name: 'Common Name',
        code: 'CN',
        required: true,
        sample: 'Demo Mobile Release',
        why: 'Your developer name, team name, or app publisher display name.',
      },
      {
        name: 'Organization',
        code: 'O',
        required: true,
        sample: 'Example Apps Studio LLC',
        why: 'Your studio, company, or publisher name (solo developers can reuse their developer name).',
      },
      {
        name: 'Organizational Unit',
        code: 'OU',
        required: false,
        sample: 'Android Engineering',
        why: 'Department or team name. Completely safe to leave blank.',
      },
      {
        name: 'City / Locality & State',
        code: 'L / ST',
        required: false,
        sample: 'Riyadh · Riyadh Region',
        why: 'Optional city and region metadata shown when inspecting the certificate with keytool.',
      },
      {
        name: 'Country Code',
        code: 'C',
        required: true,
        sample: 'SA',
        why: 'Must be exactly 2 uppercase ISO 3166-1 letters (such as US, SA, GB, DE, AE, EG).',
      },
      {
        name: 'Certificate Validity',
        required: true,
        sample: '30 years',
        why: 'Google Play requires release certificates to remain valid past October 22, 2033 (25-30 years recommended).',
      },
    ],
    sampleExpiryLabel: 'Sample 30-year expiry',
    playRuleNote: 'Valid well past Google Play cutoff (October 22, 2033)',
    tipHeading: 'Common mistake to avoid',
    tipBody:
      'Do not type a full country name like "Saudi Arabia" or "United States" in the Country field — X.509 strictly requires a 2-letter code (SA or US). Arabic and international names in CN, O, OU, L, and ST are fully supported via UTF-8.',
  },
  lesson3: {
    stepNum: '3',
    title: 'Review & Local Generation',
    whatForBody:
      'Before creating the keystore, you review every input once more. When you click Generate, your browser computes the RSA keypair and PKCS#12 file 100% locally inside an isolated Web Worker — nothing ever leaves your device.',
    breakdownHeading: 'What happens inside your browser',
    fields: [
      {
        code: '01',
        name: 'Input & Policy Check',
        sample: 'Zod Schema Validation',
        why: 'Verifies alias syntax, Gradle-safe password characters, 2-letter country code, and post-2033 validity before allocating keys.',
      },
      {
        code: '02',
        name: 'Isolated Web Worker Keygen',
        sample: 'RSA 2048/4096 + CSPRNG Serial',
        why: 'Generates the RSA keypair and a strictly positive 128-bit random serial number off the main thread so the UI stays smooth.',
      },
      {
        code: '03',
        name: 'Java 17+ PKCS#12 Packaging',
        sample: 'SHA256withRSA · PBES2 AES-256-CBC',
        why: 'Signs the X.509v3 certificate, binds friendlyName + localKeyId, and computes SHA-1 and SHA-256 fingerprints directly in RAM.',
      },
      {
        code: '04',
        name: 'Strict Zero-Network Guard',
        sample: "Content-Security-Policy: connect-src 'none'",
        why: 'Browser-enforced CSP blocks fetch, XHR, WebSocket, and sendBeacon so secrets can never be transmitted over the network.',
      },
    ],
    cspSnippetLabel: 'Enforced Zero-Network Policy',
    offlineCheckHeading: 'Verify offline in 10 seconds',
    offlineCheckSteps: [
      'Open One-Click Key once so the offline Service Worker caches all local files.',
      'Turn on Airplane Mode (or set DevTools Network tab to Offline).',
      'Generate a keystore and confirm 0 outbound requests appear in the Network log.',
    ],
    tipHeading: 'Practical tip for maximum assurance',
    tipBody:
      'You can safely disconnect your Wi-Fi or turn on Airplane Mode right at Step 3 before clicking Generate. Because all crypto code and fonts are bundled locally, generation works identically offline.',
  },
  lesson4: {
    stepNum: '4',
    title: 'Download & Use Your Keystore',
    whatForBody:
      'After generation, you get your binary keystore file plus ready-to-paste SHA fingerprints, Base64 CI secret, Gradle config, and a local keytool verification command. Save everything securely, then wipe browser memory.',
    breakdownHeading: 'Outputs explained',
    fields: [
      {
        name: 'Keystore File (.p12 · PKCS#12)',
        sample: 'demo-upload-key-keystore.p12',
        why: 'Downloads a genuine RFC 7292 PKCS#12 container supported natively by Java 9+, Android Studio, and Gradle. If an older tool strictly requires legacy JKS, convert locally with JDK keytool -importkeystore.',
      },
      {
        name: 'SHA-1 Fingerprint',
        sample: 'DE:AD:BE:EF:10:20:30:40:50:60:70:80:90:AA:BB:CC:DD:EE:FF:01',
        why: 'Public hash needed in Firebase Console for Google Sign-In and OAuth client setup.',
      },
      {
        name: 'SHA-256 Fingerprint',
        sample:
          '01:23:45:67:89:AB:CD:EF:10:20:30:40:50:60:70:80:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F',
        why: 'Public hash used for Android App Links, Play Integrity, and verifying your upload key in Google Play Console.',
      },
      {
        name: 'Base64 String (GitHub Actions)',
        sample: 'KEYSTORE_BASE64 -> base64 --decode',
        why: 'Text representation of your keystore so you can store it safely in GitHub Actions Secrets instead of committing the file.',
      },
    ],
    gradleHeading: 'Sample Gradle signingConfigs',
    githubActionsLabel: 'Sample GitHub Actions decode step',
    keytoolLabel: 'Sample Java 17+ keytool verification command',
    tipHeading: 'Critical mistake to avoid',
    tipBody:
      'Never commit your .p12 (or converted .jks) file or password to Git (even in private repos). Keep two encrypted backups offline, and click "Wipe Memory & Reset" in Step 4 as soon as you finish downloading.',
  },
};
