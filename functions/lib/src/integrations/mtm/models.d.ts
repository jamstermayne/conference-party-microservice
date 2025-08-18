/**
 * MTM Account stored in Firestore
 */
export interface MTMAccount {
    uid: string;
    provider: 'mtm';
    sub: string;
    accessEncrypted: string;
    refreshEncrypted: string;
    connectedAt: number;
    lastSyncAt?: number;
    mirrorEnabled: boolean;
    calendarId?: string;
    expiresAt?: number;
}
/**
 * External Meeting synced from MTM
 */
export interface ExternalMeeting {
    uid: string;
    external: {
        provider: 'mtm';
        id: string;
        etag?: string;
        url?: string;
        lastSeenAt: number;
    };
    title: string;
    start: string;
    end: string;
    tz?: string;
    location?: string;
    lat?: number;
    lng?: number;
    with: Array<{
        name: string;
        org?: string;
    }>;
    status: 'accepted' | 'pending' | 'declined' | 'canceled';
    notes?: string;
    updatedAt: number;
    source: 'pull' | 'webhook';
    gEventId?: string;
}
/**
 * Create or update MTM account
 */
export declare function upsertMTMAccount(uid: string, mtmUserId: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
/**
 * Load MTM account for a user
 */
export declare function loadMTMAccount(uid: string): Promise<MTMAccount | null>;
/**
 * Get decrypted access token
 */
export declare function getAccessToken(account: MTMAccount): string;
/**
 * Get decrypted refresh token
 */
export declare function getRefreshToken(account: MTMAccount): string;
/**
 * Update tokens after refresh
 */
export declare function updateTokens(uid: string, accessToken: string, refreshToken: string | undefined, expiresIn: number): Promise<void>;
/**
 * Update last sync timestamp
 */
export declare function updateLastSync(uid: string): Promise<void>;
/**
 * Delete MTM account on disconnect
 */
export declare function deleteMTMAccount(uid: string): Promise<void>;
/**
 * Upsert an external meeting
 */
export declare function upsertExternalMeeting(uid: string, meeting: Omit<ExternalMeeting, 'uid'>): Promise<void>;
/**
 * Mark meetings as canceled that are no longer in the sync window
 */
export declare function markCanceledMeetings(uid: string, activeIds: Set<string>, fromIso: string, toIso: string): Promise<number>;
/**
 * Get meetings for a specific date range
 */
export declare function getMeetingsInRange(uid: string, fromIso: string, toIso: string): Promise<ExternalMeeting[]>;
/**
 * Get meeting count for status display
 */
export declare function getMeetingCount(uid: string): Promise<number>;
//# sourceMappingURL=models.d.ts.map