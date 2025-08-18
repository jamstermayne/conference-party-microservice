/**
 * MTM OAuth Configuration
 */
export declare const MTM_CONFIG: {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
};
/**
 * PKCE (Proof Key for Code Exchange) utilities
 */
export declare class PKCEChallenge {
    verifier: string;
    challenge: string;
    constructor();
}
/**
 * Generate OAuth authorization URL with PKCE
 */
export declare function generateAuthUrl(state: string, pkce: PKCEChallenge): string;
/**
 * Exchange authorization code for tokens
 */
export declare function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}>;
/**
 * Refresh access token using refresh token
 */
export declare function refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}>;
/**
 * Revoke tokens on disconnect
 */
export declare function revokeTokens(token: string): Promise<void>;
/**
 * Encrypt sensitive data for storage
 */
export declare function encryptToken(token: string): string;
/**
 * Decrypt sensitive data from storage
 */
export declare function decryptToken(encryptedData: string): string;
/**
 * Store PKCE verifier temporarily (in session or cache)
 */
export declare function storePKCEVerifier(sessionId: string, verifier: string, state: string): Promise<void>;
/**
 * Retrieve and validate PKCE verifier
 */
export declare function retrievePKCEVerifier(sessionId: string, state: string): Promise<string | null>;
//# sourceMappingURL=oauth.d.ts.map