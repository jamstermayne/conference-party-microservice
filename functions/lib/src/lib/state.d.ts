/**
 * Store OAuth state in Firestore for CSRF protection
 * State is stored with the session ID as the document key
 */
export declare function putState(sid: string, state: string): Promise<void>;
/**
 * Retrieve and delete OAuth state from Firestore (one-time use)
 * Returns null if state doesn't exist or has expired
 */
export declare function takeState(sid: string): Promise<string | null>;
/**
 * Clean up expired states (can be called periodically)
 * This helps keep Firestore clean from abandoned OAuth flows
 */
export declare function cleanupExpiredStates(): Promise<number>;
//# sourceMappingURL=state.d.ts.map