import { Timestamp } from 'firebase-admin/firestore';
export interface MtmIntegration {
    type: 'ics';
    urlEnc: string;
    urlSha256: string;
    status: 'connected' | 'error';
    lastSyncAt?: Timestamp;
    lastError?: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface MtmEvent {
    source: 'mtm';
    icsUid: string;
    title: string;
    description?: string | undefined;
    location?: string | undefined;
    start: Timestamp;
    end: Timestamp;
    tz?: string | null;
    lat?: number | null;
    lon?: number | null;
    cancelled?: boolean;
    googleEventId?: string | null;
    lastModified?: string;
    updatedAt: Timestamp;
}
//# sourceMappingURL=types.d.ts.map