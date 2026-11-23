/// <reference lib="webworker" />

import { generateKeystoreSync } from './pkcs12';
import type { KeystoreWorkerRequest, KeystoreWorkerResponse } from './worker-types';

const workerScope = self as DedicatedWorkerGlobalScope;

function postWorkerMessage(message: KeystoreWorkerResponse, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) {
    workerScope.postMessage(message, transfer);
  } else {
    workerScope.postMessage(message);
  }
}

workerScope.onmessage = (event: MessageEvent<KeystoreWorkerRequest>) => {
  const message = event.data;
  if (message.type !== 'GENERATE') {
    return;
  }

  try {
    const artifact = generateKeystoreSync(message.payload, (stage) => {
      postWorkerMessage({ type: 'PROGRESS', stage });
    });

    // Transfer underlying ArrayBuffer ownership to avoid duplicating sensitive bytes in RAM
    postWorkerMessage({ type: 'SUCCESS', payload: artifact }, [artifact.p12Bytes.buffer]);
  } catch (error: unknown) {
    const isZodError = error instanceof Error && error.name === 'ZodError';
    postWorkerMessage({
      type: 'ERROR',
      code: isZodError ? 'VALIDATION_FAILED' : 'GENERATION_FAILED',
      message: error instanceof Error ? error.message : 'Cryptographic generation failed.',
    });
  }
};
