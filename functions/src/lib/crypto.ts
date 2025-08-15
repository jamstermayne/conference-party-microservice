import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function encryptString(plaintext: string, keyB64: string): Promise<string> {
  const key = Buffer.from(keyB64, 'base64'); // 32 bytes
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64'); // iv(12)+tag(16)+cipher
}

export async function decryptString(payloadB64: string, keyB64: string): Promise<string> {
  const key = Buffer.from(keyB64, 'base64');
  const buf = Buffer.from(payloadB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}