import type { ZodError } from 'zod';
import type { KeySize, ValidationErrorKey } from '@/schemas/keystore.schema';

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardFormState {
  alias: string;
  keySize: KeySize;
  password: string;
  commonName: string;
  organizationalUnit: string;
  organization: string;
  locality: string;
  state: string;
  country: string;
  validityYears: string;
}

export const INITIAL_WIZARD_STATE: WizardFormState = {
  alias: 'upload-key',
  keySize: 2048,
  password: '',
  commonName: '',
  organizationalUnit: '',
  organization: '',
  locality: '',
  state: '',
  country: '',
  validityYears: '30',
};

export type FieldErrorMap = Partial<Record<keyof WizardFormState, ValidationErrorKey>>;

export function extractFieldErrors(error: ZodError): FieldErrorMap {
  const map: FieldErrorMap = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in map)) {
      map[field as keyof WizardFormState] = issue.message as ValidationErrorKey;
    }
  }
  return map;
}
