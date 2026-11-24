import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GeneratedKeystoreArtifact,
  GenerationStage,
  KeystoreWorkerRequest,
  KeystoreWorkerResponse,
} from './worker-types';
import type { KeystoreInput } from '@/schemas/keystore.schema';

const DEFAULT_TIMEOUT_MS = 120_000;

interface GenerateOptions {
  onComplete?: () => void;
  timeoutMs?: number;
  timeoutMessage?: string;
}

interface UseKeystoreWorkerResult {
  isGenerating: boolean;
  stage: GenerationStage | null;
  error: string | null;
  artifact: GeneratedKeystoreArtifact | null;
  generate: (input: KeystoreInput, options?: GenerateOptions) => void;
  cancel: () => void;
  wipeArtifact: () => void;
}

/**
 * Manages the isolated cryptographic Web Worker lifecycle and guarantees
 * explicit byte-buffer zeroing, stale-worker guards, timeout termination,
 * and worker cleanup upon wipe or unmount.
 */
export function useKeystoreWorker(): UseKeystoreWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const artifactRef = useRef<GeneratedKeystoreArtifact | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<GeneratedKeystoreArtifact | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const terminateWorker = useCallback(() => {
    clearTimer();
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [clearTimer]);

  const wipeArtifact = useCallback(() => {
    terminateWorker();
    if (artifactRef.current) {
      // Zero out the binary PKCS#12 buffer in RAM before releasing references
      artifactRef.current.p12Bytes.fill(0);
      artifactRef.current = null;
    }
    setArtifact(null);
    setStage(null);
    setError(null);
    setIsGenerating(false);
  }, [terminateWorker]);

  const cancel = useCallback(() => {
    terminateWorker();
    setIsGenerating(false);
    setStage(null);
  }, [terminateWorker]);

  const generate = useCallback(
    (input: KeystoreInput, options?: GenerateOptions) => {
      terminateWorker();
      if (artifactRef.current) {
        artifactRef.current.p12Bytes.fill(0);
        artifactRef.current = null;
      }

      setArtifact(null);
      setError(null);
      setStage('validating');
      setIsGenerating(true);

      const worker = new Worker(new URL('./keystore.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const timeoutMessage =
        options?.timeoutMessage ??
        'Key generation timed out after 120 seconds. Try RSA 2048-bit or close other heavy tabs.';

      timeoutRef.current = window.setTimeout(() => {
        if (workerRef.current !== worker) {
          return;
        }
        terminateWorker();
        setError(timeoutMessage);
        setIsGenerating(false);
        setStage(null);
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent<KeystoreWorkerResponse>) => {
        if (workerRef.current !== worker) {
          return;
        }
        const data = event.data;
        if (data.type === 'PROGRESS') {
          setStage(data.stage);
        } else if (data.type === 'SUCCESS') {
          artifactRef.current = data.payload;
          setArtifact(data.payload);
          setIsGenerating(false);
          setStage(null);
          terminateWorker();
          options?.onComplete?.();
        } else if (data.type === 'ERROR') {
          setError(data.message);
          setIsGenerating(false);
          setStage(null);
          terminateWorker();
        }
      };

      worker.onerror = () => {
        if (workerRef.current !== worker) {
          return;
        }
        setError('Web Worker execution error during key generation.');
        setIsGenerating(false);
        setStage(null);
        terminateWorker();
      };

      const request: KeystoreWorkerRequest = {
        type: 'GENERATE',
        payload: input,
      };
      worker.postMessage(request);
    },
    [terminateWorker],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (artifactRef.current) {
        artifactRef.current.p12Bytes.fill(0);
        artifactRef.current = null;
      }
    };
  }, []);

  return {
    isGenerating,
    stage,
    error,
    artifact,
    generate,
    cancel,
    wipeArtifact,
  };
}
