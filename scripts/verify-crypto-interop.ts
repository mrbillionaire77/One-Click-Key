import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  generateKeystoreSync,
  PKCS12_PBKDF2_ITERATIONS,
  PKCS12_SALT_SIZE_BYTES,
} from '../src/crypto/pkcs12';
import type { KeySize } from '../src/schemas/keystore.schema';

function runCommand(
  cmd: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): SpawnSyncReturns<string> {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      LC_ALL: 'C.UTF-8',
      JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8',
      ...env,
    },
  });
  if (result.error) {
    throw new Error(`Failed to spawn ${cmd}: ${result.error.message}`);
  }
  return result;
}

function assertSuccess(label: string, result: SpawnSyncReturns<string>): void {
  if (result.status !== 0) {
    throw new Error(
      `${label} failed (exit ${result.status}):\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    );
  }
}

function assertFailure(label: string, result: SpawnSyncReturns<string>): void {
  if (result.status === 0) {
    throw new Error(`${label} unexpectedly succeeded:\nSTDOUT:\n${result.stdout}`);
  }
}

function verifyKeySize(keySize: KeySize, opensslOnly: boolean): void {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `ock-interop-rsa${keySize}-`));
  const alias = 'MyUploadKey_2026';
  const lowercaseAlias = alias.toLowerCase();
  const password = 'InteropVerify#2026!SafePass';
  const wrongPassword = 'WrongPassword#9999!';
  const passEnv = { P12_PASS: password, WRONG_PASS: wrongPassword };

  try {
    console.log(`\n=== Verifying RSA ${keySize}-bit PKCS#12 & JKS Interoperability ===`);

    const artifact = generateKeystoreSync({
      alias,
      keySize,
      password,
      commonName: 'مطوّر أندرويد',
      organizationalUnit: 'هندسة التطبيقات',
      organization: 'استوديو التقنية',
      locality: 'الرياض',
      state: 'منطقة الرياض',
      country: 'SA',
      validityYears: 30,
    });

    const p12Path = path.join(tmpDir, 'release.p12');
    const jksPath = path.join(tmpDir, 'release.jks');
    const strictPropsPath = path.join(tmpDir, 'strict-jks.properties');
    const p12CertPath = path.join(tmpDir, 'p12-cert.pem');
    const p12KeyPath = path.join(tmpDir, 'p12-key.pem');
    const p12PubPath = path.join(tmpDir, 'p12-pub.pem');
    const jksCertPath = path.join(tmpDir, 'jks-cert.pem');
    const payloadPath = path.join(tmpDir, 'payload.txt');
    const sigPath = path.join(tmpDir, 'payload.sig');

    fs.writeFileSync(p12Path, Buffer.from(artifact.p12Bytes));
    fs.writeFileSync(payloadPath, `One-Click Key RSA-${keySize} signing verification payload\n`);
    fs.writeFileSync(strictPropsPath, 'keystore.type.compat=false\n');

    // 1. Check PKCS#12 ASN.1 DER magic (0x30, never JKS 0xFEEDFEED)
    assert.equal(artifact.p12Bytes[0], 0x30, 'PKCS#12 must start with ASN.1 SEQUENCE (0x30)');
    const p12HeaderHex = Buffer.from(artifact.p12Bytes.subarray(0, 4)).toString('hex');
    assert.notEqual(p12HeaderHex, 'feedfeed', 'PKCS#12 must not carry JKS magic header');

    // 2. OpenSSL PKCS#12 inspection: verify hardened PBES2/PBKDF2-HMAC-SHA256 params
    const infoOk = runCommand(
      'openssl',
      ['pkcs12', '-in', p12Path, '-passin', 'env:P12_PASS', '-info', '-noout', '-nokeys'],
      passEnv,
    );
    assertSuccess('OpenSSL pkcs12 -info', infoOk);
    assert.match(infoOk.stderr, /AES-256-CBC/, 'Expected AES-256-CBC key encryption');
    assert.match(infoOk.stderr, /hmacWithSHA256/, 'Expected PBKDF2 PRF hmacWithSHA256');
    assert.match(
      infoOk.stderr,
      new RegExp(`salt length:\\s*${PKCS12_SALT_SIZE_BYTES}`),
      `Expected ${PKCS12_SALT_SIZE_BYTES}-byte salt`,
    );
    assert.match(
      infoOk.stderr,
      new RegExp(`Iteration\\s+${PKCS12_PBKDF2_ITERATIONS}`),
      `Expected ${PKCS12_PBKDF2_ITERATIONS} iterations`,
    );

    // Reject wrong password in OpenSSL
    const infoWrong = runCommand(
      'openssl',
      ['pkcs12', '-in', p12Path, '-passin', 'env:WRONG_PASS', '-info', '-noout', '-nokeys'],
      passEnv,
    );
    assertFailure('OpenSSL pkcs12 wrong password rejection', infoWrong);

    // 3. Extract cert & private key via OpenSSL, verify SHA-256 fingerprint & RSA sign/verify
    assertSuccess(
      'OpenSSL extract cert',
      runCommand(
        'openssl',
        ['pkcs12', '-in', p12Path, '-passin', 'env:P12_PASS', '-clcerts', '-nokeys', '-out', p12CertPath],
        passEnv,
      ),
    );
    assertSuccess(
      'OpenSSL extract private key',
      runCommand(
        'openssl',
        ['pkcs12', '-in', p12Path, '-passin', 'env:P12_PASS', '-nocerts', '-nodes', '-out', p12KeyPath],
        passEnv,
      ),
    );

    const p12FpRes = runCommand('openssl', [
      'x509',
      '-in',
      p12CertPath,
      '-noout',
      '-fingerprint',
      '-sha256',
    ]);
    assertSuccess('OpenSSL p12 cert fingerprint', p12FpRes);
    const opensslP12Fp = p12FpRes.stdout.trim().replace(/^sha256 Fingerprint=/i, '');
    assert.equal(opensslP12Fp, artifact.sha256Fingerprint, 'OpenSSL SHA-256 fingerprint mismatch');

    const p12PubRes = runCommand('openssl', [
      'x509',
      '-in',
      p12CertPath,
      '-pubkey',
      '-noout',
      '-out',
      p12PubPath,
    ]);
    assertSuccess('OpenSSL p12 cert pubkey', p12PubRes);

    assertSuccess(
      'OpenSSL dgst sign',
      runCommand('openssl', ['dgst', '-sha256', '-sign', p12KeyPath, '-out', sigPath, payloadPath]),
    );
    const verifySig = runCommand('openssl', [
      'dgst',
      '-sha256',
      '-verify',
      p12PubPath,
      '-signature',
      sigPath,
      payloadPath,
    ]);
    assertSuccess('OpenSSL dgst verify', verifySig);
    assert.match(verifySig.stdout, /Verified OK/);

    console.log(`  [PASS] OpenSSL PKCS#12 hardened params, fingerprint, and RSA-${keySize} sign/verify`);

    if (opensslOnly) {
      return;
    }

    // 4. JDK keytool PKCS#12 verification
    const ktP12 = runCommand(
      'keytool',
      [
        '-list',
        '-v',
        '-keystore',
        p12Path,
        '-storetype',
        'PKCS12',
        '-alias',
        alias,
        '-storepass:env',
        'P12_PASS',
      ],
      passEnv,
    );
    assertSuccess('keytool PKCS12 -list -v', ktP12);
    assert.match(ktP12.stdout, /Entry type:\s*PrivateKeyEntry/);
    assert.match(ktP12.stdout, /SHA256withRSA/);
    assert.match(ktP12.stdout, new RegExp(`${keySize}-bit RSA key`));
    assert.ok(
      ktP12.stdout.includes(artifact.sha256Fingerprint),
      'keytool output missing expected SHA-256 fingerprint',
    );
    assert.ok(ktP12.stdout.includes('مطوّر أندرويد'), 'keytool output missing UTF-8 Arabic CN');

    assertFailure(
      'keytool PKCS12 wrong password rejection',
      runCommand(
        'keytool',
        [
          '-list',
          '-keystore',
          p12Path,
          '-storetype',
          'PKCS12',
          '-storepass:env',
          'WRONG_PASS',
        ],
        passEnv,
      ),
    );
    console.log(`  [PASS] JDK keytool PKCS#12 inspection, UTF-8 Arabic DN, and wrong-password rejection`);

    // 5. Local JKS conversion via keytool -importkeystore + 0xFEEDFEED magic check
    assertSuccess(
      'keytool -importkeystore PKCS12 -> JKS',
      runCommand(
        'keytool',
        [
          '-importkeystore',
          '-srckeystore',
          p12Path,
          '-srcstoretype',
          'PKCS12',
          '-destkeystore',
          jksPath,
          '-deststoretype',
          'JKS',
          '-srcstorepass:env',
          'P12_PASS',
          '-deststorepass:env',
          'P12_PASS',
        ],
        passEnv,
      ),
    );
    const jksMagic = fs.readFileSync(jksPath).subarray(0, 4).toString('hex');
    assert.equal(jksMagic, 'feedfeed', 'Converted JKS must begin with 0xFEEDFEED');
    console.log(`  [PASS] keytool -importkeystore produced genuine JKS (0xFEEDFEED)`);

    // 6. Strict JKS mode via Java Security Property override (keystore.type.compat=false)
    const strictFlag = `-J-Djava.security.properties=${strictPropsPath}`;
    assertFailure(
      'Strict JKS mode rejects raw .p12',
      runCommand(
        'keytool',
        [
          strictFlag,
          '-list',
          '-keystore',
          p12Path,
          '-storetype',
          'JKS',
          '-storepass:env',
          'P12_PASS',
        ],
        passEnv,
      ),
    );

    const strictJksOk = runCommand(
      'keytool',
      [
        strictFlag,
        '-list',
        '-v',
        '-keystore',
        jksPath,
        '-storetype',
        'JKS',
        '-alias',
        lowercaseAlias,
        '-storepass:env',
        'P12_PASS',
      ],
      passEnv,
    );
    assertSuccess('Strict JKS mode accepts converted .jks with lowercased alias', strictJksOk);
    assert.match(strictJksOk.stdout, new RegExp(`Alias name:\\s*${lowercaseAlias}`));
    assert.match(strictJksOk.stdout, /Entry type:\s*PrivateKeyEntry/);
    assert.ok(strictJksOk.stdout.includes(artifact.sha256Fingerprint));
    console.log(`  [PASS] Strict JKS mode (keystore.type.compat=false) + Locale.ENGLISH alias lowercasing`);

    // 7. Export certificate from JKS with keytool first, then compare pubkey & fingerprint via OpenSSL
    assertSuccess(
      'keytool -exportcert from JKS',
      runCommand(
        'keytool',
        [
          '-exportcert',
          '-rfc',
          '-keystore',
          jksPath,
          '-storetype',
          'JKS',
          '-alias',
          lowercaseAlias,
          '-storepass:env',
          'P12_PASS',
          '-file',
          jksCertPath,
        ],
        passEnv,
      ),
    );

    const jksFpRes = runCommand('openssl', [
      'x509',
      '-in',
      jksCertPath,
      '-noout',
      '-fingerprint',
      '-sha256',
    ]);
    assertSuccess('OpenSSL jks-exported cert fingerprint', jksFpRes);
    const jksPubRes = runCommand('openssl', ['x509', '-in', jksCertPath, '-pubkey', '-noout']);
    assertSuccess('OpenSSL jks-exported cert pubkey', jksPubRes);
    const p12PubPem = fs.readFileSync(p12PubPath, 'utf8').trim();

    assert.equal(
      jksFpRes.stdout.trim().replace(/^sha256 Fingerprint=/i, ''),
      artifact.sha256Fingerprint,
      'JKS exported certificate SHA-256 fingerprint mismatch',
    );
    assert.equal(jksPubRes.stdout.trim(), p12PubPem, 'JKS exported certificate public key mismatch');
    console.log(`  [PASS] JKS exported certificate public key & SHA-256 match original PKCS#12`);

    // 8. Cryptographic JAR signing & verification with jarsigner for both PKCS#12 and JKS
    const p12JarPath = path.join(tmpDir, 'p12-sample.jar');
    const jksJarPath = path.join(tmpDir, 'jks-sample.jar');

    assertSuccess('jar cf p12-sample.jar', runCommand('jar', ['cf', p12JarPath, '-C', tmpDir, 'payload.txt']));
    assertSuccess('jar cf jks-sample.jar', runCommand('jar', ['cf', jksJarPath, '-C', tmpDir, 'payload.txt']));

    assertSuccess(
      'jarsigner sign with PKCS12',
      runCommand(
        'jarsigner',
        [
          '-keystore',
          p12Path,
          '-storetype',
          'PKCS12',
          '-storepass:env',
          'P12_PASS',
          p12JarPath,
          alias,
        ],
        passEnv,
      ),
    );
    const verifyP12Jar = runCommand('jarsigner', ['-verify', '-verbose', '-certs', p12JarPath]);
    assertSuccess('jarsigner verify PKCS12 JAR', verifyP12Jar);
    assert.match(verifyP12Jar.stdout, /jar verified/i);

    assertSuccess(
      'jarsigner sign with JKS',
      runCommand(
        'jarsigner',
        [
          '-keystore',
          jksPath,
          '-storetype',
          'JKS',
          '-storepass:env',
          'P12_PASS',
          jksJarPath,
          lowercaseAlias,
        ],
        passEnv,
      ),
    );
    const verifyJksJar = runCommand('jarsigner', ['-verify', '-verbose', '-certs', jksJarPath]);
    assertSuccess('jarsigner verify JKS JAR', verifyJksJar);
    assert.match(verifyJksJar.stdout, /jar verified/i);
    console.log(`  [PASS] jarsigner private-key signing & verification passed for both PKCS#12 and JKS`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const opensslOnly = process.argv.includes('--openssl-only');
verifyKeySize(2048, opensslOnly);
verifyKeySize(4096, opensslOnly);
console.log('\nAll cryptographic interoperability checks PASSED.');
