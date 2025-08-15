import { MEETTOMATCH_CRYPTO_KEY } from '../mtm/function-config';

export async function getSecretValue(name: 'MEETTOMATCH_CRYPTO_KEY'): Promise<string> {
  if (name === 'MEETTOMATCH_CRYPTO_KEY') return MEETTOMATCH_CRYPTO_KEY.value();
  throw new Error('Unknown secret: ' + name);
}