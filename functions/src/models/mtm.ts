import { Timestamp } from 'firebase-admin/firestore';

export interface MtmIntegration {
  type: 'ics';
  urlEnc: string;         // encrypted ICS URL
  urlSha256: string;      // deterministic hash for idempotency/log safety
  status: 'connected' | 'error';
  lastSyncAt: Timestamp | null;
  lastError: string | null;
}

export interface MtmEvent {
  source: 'mtm';
  icsUid: string;         // ICS UID (idempotency)
  title: string;
  description: string;
  location: string;
  start: Timestamp;
  end: Timestamp;
  tz: string | null;
  lat: number | null;     // if we can parse a geocode
  lon: number | null;
  updatedAt: Timestamp;
  googleEventId: string | null;  // if we mirror to Google
}