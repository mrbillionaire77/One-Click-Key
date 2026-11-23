import type { KeystoreInput } from '@/schemas/keystore.schema';

/**
 * Formats a human-readable RFC 2253 Subject Distinguished Name string for UI preview.
 * Kept separate from `pkcs12.ts` so the main UI bundle never imports `node-forge`.
 */
export function formatSubjectSummary(input: Partial<KeystoreInput>): string {
  const parts: string[] = [];
  if (input.commonName?.trim()) parts.push(`CN=${input.commonName.trim()}`);
  if (input.organizationalUnit?.trim()) parts.push(`OU=${input.organizationalUnit.trim()}`);
  if (input.organization?.trim()) parts.push(`O=${input.organization.trim()}`);
  if (input.locality?.trim()) parts.push(`L=${input.locality.trim()}`);
  if (input.state?.trim()) parts.push(`ST=${input.state.trim()}`);
  if (input.country?.trim()) parts.push(`C=${input.country.trim().toUpperCase()}`);
  return parts.join(', ');
}

/**
 * Generates an environment-variable-backed Android Gradle signingConfigs snippet
 * in either Kotlin DSL (`build.gradle.kts`) or Groovy DSL (`build.gradle`).
 */
export function buildGradleSnippet(
  alias: string,
  dsl: 'kotlin' | 'groovy',
  filename = 'release-keystore.jks',
): string {
  if (dsl === 'kotlin') {
    return `android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "${filename}")
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
            keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "${alias}"
            keyPassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
        }
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
        }
    }
}`;
  }

  return `android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "${filename}")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "${alias}"
            keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
        }
    }
}`;
}

/**
 * Generates a Java 17+ keytool verification command for inspecting the generated file locally.
 */
export function buildKeytoolVerifyCommand(alias: string, filename = 'release-keystore.jks'): string {
  return `keytool -list -v -keystore ${filename} -storetype PKCS12 -alias ${alias}`;
}
