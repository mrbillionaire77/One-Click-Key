import type { KeySize, KeystoreInput } from '@/schemas/keystore.schema';

export type GenerationStage =
  | 'validating'
  | 'generating-keypair'
  | 'signing-certificate'
  | 'packaging-pkcs12';

export interface GeneratedKeystoreArtifact {
  p12Bytes: Uint8Array;
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  serialHex: string;
  notBeforeIso: string;
  notAfterIso: string;
  alias: string;
  keySize: KeySize;
  subjectSummary: string;
}

export type KeystoreWorkerRequest = {
  type: 'GENERATE';
  payload: KeystoreInput;
};

export type CryptoErrorCode = 'VALIDATION_FAILED' | 'GENERATION_FAILED' | 'TIMEOUT';

export type KeystoreWorkerResponse =
  | {
      type: 'PROGRESS';
      stage: GenerationStage;
    }
  | {
      type: 'SUCCESS';
      payload: GeneratedKeystoreArtifact;
    }
  | {
      type: 'ERROR';
      code: CryptoErrorCode;
      message: string;
    };
