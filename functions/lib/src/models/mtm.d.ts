import { Timestamp } from 'firebase-admin/firestore';
export interface MtmIntegration {
    type: 'ics';
    urlEnc: string;
    urlSha256: string;
    status: 'connected' | 'error';
    lastSyncAt: Timestamp | null;
    lastError: string | null;
}
export interface MtmEvent {
    source: 'mtm';
    icsUid: string;
    title: string;
    description: string;
    location: string;
    start: Timestamp;
    end: Timestamp;
    tz: string | null;
    lat: number | null;
    lon: number | null;
    updatedAt: Timestamp;
    googleEventId: string | null;
}
//# sourceMappingURL=mtm.d.ts.map