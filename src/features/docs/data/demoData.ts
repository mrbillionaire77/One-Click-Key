/**
 * Strictly static, fictional demonstration data for the Interactive Docs & Guided Walkthrough.
 * Never imports cryptographic libraries, Web Workers, or real user wizard state.
 * DO NOT use any of these values in production applications.
 */

export const DEMO_DATA = {
  alias: 'demo-upload-key',
  password: 'DemoOnly#NotForProd2026!',
  entropyBits: 151,
  keySize: 2048 as const,
  p12Filename: 'demo-upload-key-keystore.p12',
  jksFilename: 'demo-upload-key-keystore.jks',
  dn: {
    commonName: 'Demo Mobile Release',
    organizationalUnit: 'Android Engineering',
    organization: 'Example Apps Studio LLC',
    locality: 'Riyadh',
    state: 'Riyadh Region',
    country: 'SA',
  },
  subjectSummary:
    'CN=Demo Mobile Release, OU=Android Engineering, O=Example Apps Studio LLC, L=Riyadh, ST=Riyadh Region, C=SA',
  validityYears: 30,
  sampleExpiryIso: '2056-11-23T00:00:00.000Z',
  serialHex: '0A4F91C3E82B7D1056A3F14C92B8E071',
  sha1Fingerprint: 'DE:AD:BE:EF:10:20:30:40:50:60:70:80:90:AA:BB:CC:DD:EE:FF:01',
  sha256Fingerprint:
    '01:23:45:67:89:AB:CD:EF:10:20:30:40:50:60:70:80:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F',
  base64Preview:
    'MIIKAzCC...DEMO_BASE64_SAMPLE_ONLY_DO_NOT_USE_IN_PRODUCTION...Cg==',
  githubActionsStep: `- name: Decode Android Keystore
  env:
    KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
  run: |
    echo "$KEYSTORE_BASE64" | base64 --decode > app/demo-upload-key-keystore.p12`,
  gradleKotlin: `// app/build.gradle.kts (Demo Example Only)
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "demo-upload-key-keystore.p12")
            storeType = "PKCS12"
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "demo-upload-key"
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}`,
  gradleGroovy: `// app/build.gradle (Demo Example Only)
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "demo-upload-key-keystore.p12")
            storeType "PKCS12"
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "demo-upload-key"
            keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}`,
  keytoolVerifyCommand:
    'keytool -list -v -keystore demo-upload-key-keystore.p12 -storetype PKCS12 -alias demo-upload-key',
  keytoolExpectedOutput: `Keystore type: PKCS12
Keystore provider: SUN

Alias name: demo-upload-key
Entry type: PrivateKeyEntry
Owner: CN=Demo Mobile Release, OU=Android Engineering, O=Example Apps Studio LLC, L=Riyadh, ST=Riyadh Region, C=SA
Valid until: Thu Nov 23 2056
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key`,
} as const;
