/**
 * Generate a secure opaque token (43-64 chars base64url)
 */
export declare function generateToken(): string;
/**
 * Generate a human-friendly code using Crockford Base32
 * @param length - Number of characters (default 10 for ~50 bits entropy)
 */
export declare function generateCode(length?: number): string;
/**
 * Normalize a code for comparison (uppercase, remove hyphens/spaces)
 */
export declare function normalizeCode(code: string): string;
/**
 * Generate a new token+code pair
 */
export declare function generateInvitePair(): {
    token: string;
    code: string;
};
/**
 * Check if an invite has expired based on event time or explicit expiry
 */
export declare function isExpired(invite: {
    end?: Date | string;
    start?: Date | string;
    expiresAt?: Date | string;
    revokedAt?: number | Date;
}): boolean;
//# sourceMappingURL=invite-codes.d.ts.map