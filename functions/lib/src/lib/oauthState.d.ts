/**
 * Create a new OAuth state token and store it in Firestore
 * The state itself is used as the document ID for easy lookup
 */
export declare function createState(metadata?: {
    ip?: string;
    userAgent?: string;
}): Promise<string>;
/**
 * Consume an OAuth state token (one-time use)
 * Uses a transaction to ensure atomic read-and-update
 */
export declare function consumeState(state: string): Promise<boolean>;
/**
 * Clean up expired and used states (optional - can be scheduled)
 * This can be called periodically or via a scheduled Cloud Function
 */
export declare function cleanupExpiredStates(): Promise<number>;
//# sourceMappingURL=oauthState.d.ts.map