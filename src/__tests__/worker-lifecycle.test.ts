import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createKeystoreWorkerController,
  DEFAULT_WORKER_TIMEOUT_MS,
  type KeystoreWorkerLike,
  type KeystoreWorkerState,
} from '@/crypto/worker-controller';
import type {
  GeneratedKeystoreArtifact,
  KeystoreWorkerRequest,
  KeystoreWorkerResponse,
} from '@/crypto/worker-types';
import type { KeystoreInput } from '@/schemas/keystore.schema';

class FakeKeystoreWorker implements KeystoreWorkerLike {
  onmessage: ((event: MessageEvent<KeystoreWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postedMessages: KeystoreWorkerRequest[] = [];
  terminated = false;

  postMessage(message: KeystoreWorkerRequest): void {
    this.postedMessages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emitMessage(data: KeystoreWorkerResponse): void {
    this.onmessage?.({ data } as MessageEvent<KeystoreWorkerResponse>);
  }

  emitError(): void {
    this.onerror?.({} as ErrorEvent);
  }
}

const SAMPLE_INPUT: KeystoreInput = {
  alias: 'upload-key',
  keySize: 2048,
  password: 'StrongTestPassword#2026!',
  commonName: 'One-Click QA',
  organizationalUnit: 'Security',
  organization: 'One-Click Key',
  locality: 'Riyadh',
  state: 'Riyadh',
  country: 'SA',
  validityYears: 30,
};

function createFakeArtifact(seedByte = 0x30): GeneratedKeystoreArtifact {
  const bytes = new Uint8Array([seedByte, 0x82, 0x04, 0xaa, 0xbb, 0xcc]);
  return {
    p12Bytes: bytes,
    sha1Fingerprint: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD',
    sha256Fingerprint:
      '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF',
    serialHex: '0123456789ABCDEF0123456789ABCDEF',
    notBeforeIso: '2026-01-01T00:00:00.000Z',
    notAfterIso: '2056-01-01T00:00:00.000Z',
    alias: 'upload-key',
    keySize: 2048,
    subjectSummary: 'CN=One-Click QA, O=One-Click Key, C=SA',
  };
}

describe('Keystore Worker Lifecycle Controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks progress stages, completes with artifact, terminates worker, and invokes onComplete', () => {
    const workers: FakeKeystoreWorker[] = [];
    const states: KeystoreWorkerState[] = [];
    const onComplete = vi.fn();

    const controller = createKeystoreWorkerController({
      createWorker: () => {
        const w = new FakeKeystoreWorker();
        workers.push(w);
        return w;
      },
      onStateChange: (next) => states.push(next),
    });

    controller.generate(SAMPLE_INPUT, { onComplete });
    const worker = workers[0];
    expect(worker).toBeDefined();
    expect(worker?.postedMessages).toEqual([{ type: 'GENERATE', payload: SAMPLE_INPUT }]);
    expect(controller.getState().isGenerating).toBe(true);
    expect(controller.getState().stage).toBe('validating');

    worker?.emitMessage({ type: 'PROGRESS', stage: 'generating-keypair' });
    expect(controller.getState().stage).toBe('generating-keypair');

    const artifact = createFakeArtifact();
    worker?.emitMessage({ type: 'SUCCESS', payload: artifact });

    expect(worker?.terminated).toBe(true);
    expect(controller.getState().isGenerating).toBe(false);
    expect(controller.getState().stage).toBeNull();
    expect(controller.getState().artifact).toBe(artifact);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(states.length).toBeGreaterThanOrEqual(3);
  });

  it('terminates hung workers on timeout and ignores any late messages', () => {
    const workers: FakeKeystoreWorker[] = [];
    const onComplete = vi.fn();

    const controller = createKeystoreWorkerController({
      createWorker: () => {
        const w = new FakeKeystoreWorker();
        workers.push(w);
        return w;
      },
      onStateChange: () => {},
    });

    controller.generate(SAMPLE_INPUT, {
      onComplete,
      timeoutMs: DEFAULT_WORKER_TIMEOUT_MS,
      timeoutMessage: 'Timed out after 120s.',
    });

    const worker = workers[0]!;
    vi.advanceTimersByTime(DEFAULT_WORKER_TIMEOUT_MS - 1);
    expect(worker.terminated).toBe(false);
    expect(controller.getState().isGenerating).toBe(true);

    vi.advanceTimersByTime(1);
    expect(worker.terminated).toBe(true);
    expect(controller.getState().isGenerating).toBe(false);
    expect(controller.getState().stage).toBeNull();
    expect(controller.getState().error).toBe('Timed out after 120s.');
    expect(controller.getState().artifact).toBeNull();

    // Late message from the timed-out worker must be ignored
    worker.emitMessage({ type: 'SUCCESS', payload: createFakeArtifact() });
    expect(controller.getState().artifact).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('guards against stale worker races when a new generation supersedes an older worker', () => {
    const workers: FakeKeystoreWorker[] = [];
    const onCompleteFirst = vi.fn();
    const onCompleteSecond = vi.fn();

    const controller = createKeystoreWorkerController({
      createWorker: () => {
        const w = new FakeKeystoreWorker();
        workers.push(w);
        return w;
      },
      onStateChange: () => {},
    });

    controller.generate(SAMPLE_INPUT, { onComplete: onCompleteFirst });
    const firstWorker = workers[0]!;

    controller.generate(SAMPLE_INPUT, { onComplete: onCompleteSecond });
    const secondWorker = workers[1]!;

    expect(firstWorker.terminated).toBe(true);
    expect(secondWorker.terminated).toBe(false);

    // Late PROGRESS, ERROR, onerror, and SUCCESS from firstWorker must all be ignored
    firstWorker.emitMessage({ type: 'PROGRESS', stage: 'packaging-pkcs12' });
    firstWorker.emitMessage({
      type: 'ERROR',
      code: 'GENERATION_FAILED',
      message: 'Stale error',
    });
    firstWorker.emitError();
    firstWorker.emitMessage({ type: 'SUCCESS', payload: createFakeArtifact(0x11) });

    expect(controller.getState().isGenerating).toBe(true);
    expect(controller.getState().stage).toBe('validating');
    expect(controller.getState().error).toBeNull();
    expect(controller.getState().artifact).toBeNull();
    expect(onCompleteFirst).not.toHaveBeenCalled();

    // Active secondWorker succeeds normally
    const secondArtifact = createFakeArtifact(0x30);
    secondWorker.emitMessage({ type: 'SUCCESS', payload: secondArtifact });
    expect(controller.getState().artifact).toBe(secondArtifact);
    expect(secondWorker.terminated).toBe(true);
    expect(onCompleteSecond).toHaveBeenCalledTimes(1);
  });

  it('handles worker ERROR payloads and unexpected onerror crashes cleanly', () => {
    const workers: FakeKeystoreWorker[] = [];
    const controller = createKeystoreWorkerController({
      createWorker: () => {
        const w = new FakeKeystoreWorker();
        workers.push(w);
        return w;
      },
      onStateChange: () => {},
    });

    controller.generate(SAMPLE_INPUT);
    workers[0]!.emitMessage({
      type: 'ERROR',
      code: 'VALIDATION_FAILED',
      message: 'Invalid DN field',
    });
    expect(workers[0]!.terminated).toBe(true);
    expect(controller.getState().isGenerating).toBe(false);
    expect(controller.getState().error).toBe('Invalid DN field');

    controller.generate(SAMPLE_INPUT);
    workers[1]!.emitError();
    expect(workers[1]!.terminated).toBe(true);
    expect(controller.getState().isGenerating).toBe(false);
    expect(controller.getState().error).toBe('Web Worker execution error during key generation.');
  });

  it('zeroes PKCS#12 byte buffers on wipe, replacement, and dispose', () => {
    const workers: FakeKeystoreWorker[] = [];
    const controller = createKeystoreWorkerController({
      createWorker: () => {
        const w = new FakeKeystoreWorker();
        workers.push(w);
        return w;
      },
      onStateChange: () => {},
    });

    // 1. Wipe zeroes active artifact bytes
    controller.generate(SAMPLE_INPUT);
    const firstArtifact = createFakeArtifact(0x30);
    workers[0]!.emitMessage({ type: 'SUCCESS', payload: firstArtifact });
    expect(firstArtifact.p12Bytes.some((b) => b !== 0)).toBe(true);

    controller.wipe();
    expect(firstArtifact.p12Bytes.every((b) => b === 0)).toBe(true);
    expect(controller.getState().artifact).toBeNull();

    // 2. Dispose (unmount) zeroes active artifact bytes and terminates running worker
    controller.generate(SAMPLE_INPUT);
    const secondArtifact = createFakeArtifact(0x30);
    workers[1]!.emitMessage({ type: 'SUCCESS', payload: secondArtifact });
    expect(secondArtifact.p12Bytes.some((b) => b !== 0)).toBe(true);

    controller.dispose();
    expect(secondArtifact.p12Bytes.every((b) => b === 0)).toBe(true);
    expect(controller.getState().artifact).toBeNull();

    // 3. Cancel terminates an in-flight worker without throwing
    controller.generate(SAMPLE_INPUT);
    expect(workers[2]!.terminated).toBe(false);
    controller.cancel();
    expect(workers[2]!.terminated).toBe(true);
    expect(controller.getState().isGenerating).toBe(false);
  });
});
