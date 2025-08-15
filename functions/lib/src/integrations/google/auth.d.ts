/**
 * Google OAuth Token Management
 * Uses existing Google OAuth client secrets from Secret Manager
 */
/**
 * Get Google access token for a user
 * Reads stored refresh token and exchanges for access token
 */
export declare function getGoogleAccessToken(uid: string): Promise<string | null>;
/**
 * Store Google OAuth tokens after initial authorization
 */
export declare function storeGoogleTokens(uid: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
//# sourceMappingURL=auth.d.ts.map