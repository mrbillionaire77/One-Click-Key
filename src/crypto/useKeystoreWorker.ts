import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createKeystoreWorkerController,
  type GenerateOptions,
  type KeystoreWorkerController,
  type KeystoreWorkerState,
} from './worker-controller';
import type { GeneratedKeystoreArtifact, GenerationStage } from './worker-types';
import type { KeystoreInput } from '@/schemas/keystore.schema';

interface UseKeystoreWorkerResult {
  isGenerating: boolean;
  stage: GenerationStage | null;
  error: string | null;
  artifact: GeneratedKeystoreArtifact | null;
  generate: (input: KeystoreInput, options?: GenerateOptions) => void;
  cancel: () => void;
  wipeArtifact: () => void;
}

const INITIAL_STATE: KeystoreWorkerState = {
  isGenerating: false,
  stage: null,
  error: null,
  artifact: null,
};

/**
 * Manages the isolated cryptographic Web Worker lifecycle and guarantees
 * explicit byte-buffer zeroing, stale-worker guards, timeout termination,
 * and worker cleanup upon wipe or unmount.
 */
export function useKeystoreWorker(): UseKeystoreWorkerResult {
  const [workerState, setWorkerState] = useState<KeystoreWorkerState>(INITIAL_STATE);
  const controllerRef = useRef<KeystoreWorkerController | null>(null);

  const getController = useCallback((): KeystoreWorkerController => {
    if (!controllerRef.current) {
      controllerRef.current = createKeystoreWorkerController({
        createWorker: () =>
          new Worker(new URL('./keystore.worker.ts', import.meta.url), {
            type: 'module',
          }),
        onStateChange: (next) => {
          setWorkerState(next);
        },
      });
    }
    return controllerRef.current;
  }, []);

  const generate = useCallback(
    (input: KeystoreInput, options?: GenerateOptions) => {
      getController().generate(input, options);
    },
    [getController],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
  }, []);

  const wipeArtifact = useCallback(() => {
    controllerRef.current?.wipe();
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return {
    isGenerating: workerState.isGenerating,
    stage: workerState.stage,
    error: workerState.error,
    artifact: workerState.artifact,
    generate,
    cancel,
    wipeArtifact,
  };
}
