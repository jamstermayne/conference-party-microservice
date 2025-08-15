import { Timestamp } from 'firebase-admin/firestore';

export interface MtmIntegration {
  type: 'ics';
  urlEnc: string;         // AES-GCM encrypted ICS URL
  urlSha256: string;      // SHA256 hash for idempotency/logging
  status: 'connected' | 'error';
  lastSyncAt?: Timestamp;
  lastError?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MtmEvent {
  source: 'mtm';
  icsUid: string;         // ICS UID for idempotency
  title: string;
  description?: string | undefined;
  location?: string | undefined;
  start: Timestamp;
  end: Timestamp;
  tz?: string | null;
  lat?: number | null;    // Geocoded latitude
  lon?: number | null;    // Geocoded longitude
  cancelled?: boolean;    // Mark as cancelled if removed from ICS
  googleEventId?: string | null;  // Google Calendar event ID if synced
  lastModified?: string;  // ICS last-modified field
  updatedAt: Timestamp;
}