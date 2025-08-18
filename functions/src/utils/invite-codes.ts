import * as crypto from 'crypto';

/**
 * Crockford Base32 alphabet - excludes I, L, O, U to avoid confusion
 * Uses digits 0-9 and letters A-Z except confusing ones
 */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generate a secure opaque token (43-64 chars base64url)
 */
export function generateToken(): string {
  // 32 bytes = 256 bits of entropy, encoded as base64url (~43 chars)
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a human-friendly code using Crockford Base32
 * @param length - Number of characters (default 10 for ~50 bits entropy)
 */
export function generateCode(length: number = 10): string {
  // 10 chars in base32 = 50 bits of entropy (5 bits per char)
  // We need ceil(50/8) = 7 bytes of randomness
  const bytesNeeded = Math.ceil((length * 5) / 8);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  
  let code = '';
  let bits = 0;
  let buffer = 0;
  
  for (let i = 0; i < randomBytes.length; i++) {
    buffer = (buffer << 8) | randomBytes[i]!;
    bits += 8;
    
    while (bits >= 5 && code.length < length) {
      const index = (buffer >> (bits - 5)) & 0x1f;
      code += CROCKFORD_ALPHABET[index];
      bits -= 5;
    }
  }
  
  // Ensure we have exactly the requested length
  while (code.length < length) {
    const index = crypto.randomInt(0, CROCKFORD_ALPHABET.length);
    code += CROCKFORD_ALPHABET[index];
  }
  
  return code.substring(0, length);
}

/**
 * Normalize a code for comparison (uppercase, remove hyphens/spaces)
 */
export function normalizeCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[\s-]/g, '') // Remove spaces and hyphens
    .replace(/[ILO]/g, (char) => {
      // Handle common typos: I->1, L->1, O->0
      switch(char) {
        case 'I': return '1';
        case 'L': return '1';
        case 'O': return '0';
        default: return char;
      }
    });
}

/**
 * Generate a new token+code pair
 */
export function generateInvitePair(): { token: string; code: string } {
  return {
    token: generateToken(),
    code: generateCode(10) // 10 chars = ~50 bits entropy
  };
}

/**
 * Check if an invite has expired based on event time or explicit expiry
 */
export function isExpired(invite: {
  end?: Date | string;
  start?: Date | string;
  expiresAt?: Date | string;
  revokedAt?: number | Date;
}): boolean {
  const now = Date.now();
  
  // Check if explicitly revoked
  if (invite.revokedAt) {
    const revokedTime = invite.revokedAt instanceof Date 
      ? invite.revokedAt.getTime() 
      : invite.revokedAt;
    return now >= revokedTime;
  }
  
  // Check event end time (or start if no end)
  if (invite.end) {
    const endTime = new Date(invite.end).getTime();
    return now >= endTime;
  }
  
  if (invite.start) {
    const startTime = new Date(invite.start).getTime();
    // If no end time, expire 24 hours after start
    return now >= startTime + (24 * 60 * 60 * 1000);
  }
  
  // Check explicit expiry
  if (invite.expiresAt) {
    const expiryTime = new Date(invite.expiresAt).getTime();
    return now >= expiryTime;
  }
  
  return false;
}