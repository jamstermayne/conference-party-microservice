import { defineSecret } from 'firebase-functions/params';

/**
 * Export the secret definition so it can be referenced by functions
 * This ensures the secret is available to any function that imports this module
 */
export const MEETTOMATCH_CRYPTO_KEY = defineSecret('MEETTOMATCH_CRYPTO_KEY');

/**
 * Function runtime options with secret access
 */
export const mtmFunctionOptions = {
  secrets: [MEETTOMATCH_CRYPTO_KEY],
  timeoutSeconds: 60,
  memory: '256MiB' as const,
};