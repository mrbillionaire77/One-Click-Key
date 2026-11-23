import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  GeneratedKeystoreArtifact,
  GenerationStage,
  KeystoreWorkerRequest,
  KeystoreWorkerResponse,
} from './worker-types';
import type { KeystoreInput } from '@/schemas/keystore.schema';

interface UseKeystoreWorkerResult {
  isGenerating: boolean;
  stage: GenerationStage | null;
  error: string | null;
  artifact: GeneratedKeystoreArtifact | null;
  generate: (input: KeystoreInput, onComplete?: () => void) => void;
  cancel: () => void;
  wipeArtifact: () => void;
}

/**
 * Manages the isolated cryptographic Web Worker lifecycle and guarantees
 * explicit byte-buffer zeroing + worker termination upon wipe or unmount.
 */
export function useKeystoreWorker(): UseKeystoreWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const artifactRef = useRef<GeneratedKeystoreArtifact | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<GeneratedKeystoreArtifact | null>(null);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

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
    (input: KeystoreInput, onComplete?: () => void) => {
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

      worker.onmessage = (event: MessageEvent<KeystoreWorkerResponse>) => {
        const data = event.data;
        if (data.type === 'PROGRESS') {
          setStage(data.stage);
        } else if (data.type === 'SUCCESS') {
          artifactRef.current = data.payload;
          setArtifact(data.payload);
          setIsGenerating(false);
          setStage(null);
          terminateWorker();
          onComplete?.();
        } else if (data.type === 'ERROR') {
          setError(data.message);
          setIsGenerating(false);
          setStage(null);
          terminateWorker();
        }
      };

      worker.onerror = () => {
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
