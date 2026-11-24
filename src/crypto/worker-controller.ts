import type {
  GeneratedKeystoreArtifact,
  GenerationStage,
  KeystoreWorkerRequest,
  KeystoreWorkerResponse,
} from './worker-types';
import type { KeystoreInput } from '@/schemas/keystore.schema';

export const DEFAULT_WORKER_TIMEOUT_MS = 120_000;

export interface GenerateOptions {
  onComplete?: () => void;
  timeoutMs?: number;
  timeoutMessage?: string;
}

export interface KeystoreWorkerLike {
  onmessage: ((event: MessageEvent<KeystoreWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: KeystoreWorkerRequest) => void;
  terminate: () => void;
}

export interface KeystoreWorkerState {
  isGenerating: boolean;
  stage: GenerationStage | null;
  error: string | null;
  artifact: GeneratedKeystoreArtifact | null;
}

export interface KeystoreWorkerControllerDeps {
  createWorker: () => KeystoreWorkerLike;
  onStateChange: (next: KeystoreWorkerState) => void;
  setTimer?: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
}

export interface KeystoreWorkerController {
  generate: (input: KeystoreInput, options?: GenerateOptions) => void;
  cancel: () => void;
  wipe: () => void;
  dispose: () => void;
  getState: () => KeystoreWorkerState;
}

/**
 * Pure, framework-agnostic controller for the cryptographic Web Worker lifecycle.
 * Enforces stale-worker guards, configurable timeout termination, and explicit
 * `Uint8Array.fill(0)` buffer wiping on replacement, wipe, or disposal.
 */
export function createKeystoreWorkerController(
  deps: KeystoreWorkerControllerDeps,
): KeystoreWorkerController {
  const scheduleTimer = deps.setTimer ?? ((cb, ms) => globalThis.setTimeout(cb, ms));
  const cancelTimer = deps.clearTimer ?? ((id) => globalThis.clearTimeout(id));

  let activeWorker: KeystoreWorkerLike | null = null;
  let activeTimer: ReturnType<typeof setTimeout> | null = null;
  let state: KeystoreWorkerState = {
    isGenerating: false,
    stage: null,
    error: null,
    artifact: null,
  };

  const emit = (patch: Partial<KeystoreWorkerState>) => {
    state = { ...state, ...patch };
    deps.onStateChange(state);
  };

  const clearPendingTimer = () => {
    if (activeTimer !== null) {
      cancelTimer(activeTimer);
      activeTimer = null;
    }
  };

  const terminateActiveWorker = () => {
    clearPendingTimer();
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }
  };

  const zeroActiveArtifact = () => {
    if (state.artifact) {
      state.artifact.p12Bytes.fill(0);
    }
  };

  const generate = (input: KeystoreInput, options?: GenerateOptions) => {
    terminateActiveWorker();
    zeroActiveArtifact();

    emit({
      artifact: null,
      error: null,
      stage: 'validating',
      isGenerating: true,
    });

    const worker = deps.createWorker();
    activeWorker = worker;

    const timeoutMs = options?.timeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS;
    const timeoutMessage =
      options?.timeoutMessage ??
      'Key generation timed out after 120 seconds. Try RSA 2048-bit or close other heavy tabs.';

    activeTimer = scheduleTimer(() => {
      if (activeWorker !== worker) {
        return;
      }
      terminateActiveWorker();
      emit({
        error: timeoutMessage,
        isGenerating: false,
        stage: null,
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<KeystoreWorkerResponse>) => {
      if (activeWorker !== worker) {
        return;
      }
      const data = event.data;
      if (data.type === 'PROGRESS') {
        emit({ stage: data.stage });
      } else if (data.type === 'SUCCESS') {
        terminateActiveWorker();
        emit({
          artifact: data.payload,
          isGenerating: false,
          stage: null,
        });
        options?.onComplete?.();
      } else if (data.type === 'ERROR') {
        terminateActiveWorker();
        emit({
          error: data.message,
          isGenerating: false,
          stage: null,
        });
      }
    };

    worker.onerror = () => {
      if (activeWorker !== worker) {
        return;
      }
      terminateActiveWorker();
      emit({
        error: 'Web Worker execution error during key generation.',
        isGenerating: false,
        stage: null,
      });
    };

    const request: KeystoreWorkerRequest = {
      type: 'GENERATE',
      payload: input,
    };
    worker.postMessage(request);
  };

  const cancel = () => {
    terminateActiveWorker();
    emit({
      isGenerating: false,
      stage: null,
    });
  };

  const wipe = () => {
    terminateActiveWorker();
    zeroActiveArtifact();
    emit({
      artifact: null,
      stage: null,
      error: null,
      isGenerating: false,
    });
  };

  const dispose = () => {
    terminateActiveWorker();
    zeroActiveArtifact();
    state = {
      isGenerating: false,
      stage: null,
      error: null,
      artifact: null,
    };
  };

  return {
    generate,
    cancel,
    wipe,
    dispose,
    getState: () => state,
  };
}
