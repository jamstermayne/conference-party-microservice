import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

/**
 * MTM OAuth Configuration
 */
export const MTM_CONFIG = {
  authorizationUrl: 'https://meettomatch.com/oauth/authorize',
  tokenUrl: 'https://meettomatch.com/oauth/token',
  clientId: process.env['MTM_CLIENT_ID'] || 'conference-party-app',
  clientSecret: process.env['MTM_CLIENT_SECRET'] || '',
  redirectUri: process.env['MTM_REDIRECT_URI'] || 'https://conference-party-app.web.app/api/integrations/mtm/callback',
  scopes: ['read:meetings', 'read:profile'],
};

/**
 * PKCE (Proof Key for Code Exchange) utilities
 */
export class PKCEChallenge {
  public verifier: string;
  public challenge: string;
  
  constructor() {
    // Generate code verifier (43-128 chars)
    this.verifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge (SHA256 of verifier)
    const hash = crypto.createHash('sha256');
    hash.update(this.verifier);
    this.challenge = hash.digest('base64url');
  }
}

/**
 * Generate OAuth authorization URL with PKCE
 */
export function generateAuthUrl(state: string, pkce: PKCEChallenge): string {
  const params = new URLSearchParams({
    client_id: MTM_CONFIG.clientId,
    redirect_uri: MTM_CONFIG.redirectUri,
    response_type: 'code',
    scope: MTM_CONFIG.scopes.join(' '),
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: 'S256',
  });
  
  return `${MTM_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: MTM_CONFIG.clientId,
    client_secret: MTM_CONFIG.clientSecret,
    code,
    redirect_uri: MTM_CONFIG.redirectUri,
    code_verifier: codeVerifier,
  });
  
  const response = await fetch(MTM_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: MTM_CONFIG.clientId,
    client_secret: MTM_CONFIG.clientSecret,
    refresh_token: refreshToken,
  });
  
  const response = await fetch(MTM_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Revoke tokens on disconnect
 */
export async function revokeTokens(token: string): Promise<void> {
  try {
    const revokeUrl = 'https://meettomatch.com/oauth/revoke';
    
    await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        client_id: MTM_CONFIG.clientId,
        client_secret: MTM_CONFIG.clientSecret,
      }).toString(),
    });
  } catch (error) {
    console.error('[MTM] Token revocation failed:', error);
    // Continue with disconnect even if revocation fails
  }
}

/**
 * Encrypt sensitive data for storage
 */
export function encryptToken(token: string): string {
  const key = (process.env['MTM_ENCRYPTION_KEY'] || 'default-encryption-key-change-me').padEnd(64, '0').substring(0, 64);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data from storage
 */
export function decryptToken(encryptedData: string): string {
  const key = (process.env['MTM_ENCRYPTION_KEY'] || 'default-encryption-key-change-me').padEnd(64, '0').substring(0, 64);
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0]!, 'hex');
  const encrypted = parts[1]!;
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Store PKCE verifier temporarily (in session or cache)
 */
export async function storePKCEVerifier(
  sessionId: string,
  verifier: string,
  state: string
): Promise<void> {
  const db = admin.firestore();
  
  // Store with 10-minute expiry
  await db.collection('oauth_sessions').doc(sessionId).set({
    verifier,
    state,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
}

/**
 * Retrieve and validate PKCE verifier
 */
export async function retrievePKCEVerifier(
  sessionId: string,
  state: string
): Promise<string | null> {
  const db = admin.firestore();
  
  const doc = await db.collection('oauth_sessions').doc(sessionId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  const data = doc.data();
  
  // Validate state and expiry
  if (data?.['state'] !== state) {
    console.error('[MTM] OAuth state mismatch');
    return null;
  }
  
  if (data?.['expiresAt'] && data['expiresAt'].toDate() < new Date()) {
    console.error('[MTM] OAuth session expired');
    return null;
  }
  
  // Clean up session after use
  await doc.ref.delete();
  
  return data?.['verifier'] || null;
}