import * as admin from 'firebase-admin';
import { encryptToken, decryptToken } from './oauth';

/**
 * MTM Account stored in Firestore
 */
export interface MTMAccount {
  uid: string;
  provider: 'mtm';
  sub: string; // MTM user id
  accessEncrypted: string;
  refreshEncrypted: string;
  connectedAt: number;
  lastSyncAt?: number;
  mirrorEnabled: boolean;
  calendarId?: string; // 'primary' or chosen calendar
  expiresAt?: number; // Access token expiry
}

/**
 * External Meeting synced from MTM
 */
export interface ExternalMeeting {
  uid: string;
  external: {
    provider: 'mtm';
    id: string; // MTM meeting id
    etag?: string; // for change detection
    url?: string; // deep link
    lastSeenAt: number;
  };
  title: string;
  start: string; // ISO
  end: string; // ISO
  tz?: string;
  location?: string; // venue or 'Online'
  lat?: number;
  lng?: number;
  with: Array<{ name: string; org?: string }>;
  status: 'accepted' | 'pending' | 'declined' | 'canceled';
  notes?: string;
  updatedAt: number;
  source: 'pull' | 'webhook';
  gEventId?: string; // Google Calendar event ID if mirrored
}

/**
 * Get Firestore database instance
 */
const getDb = () => admin.firestore();

/**
 * Create or update MTM account
 */
export async function upsertMTMAccount(
  uid: string,
  mtmUserId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const db = getDb();
  
  const account: MTMAccount = {
    uid,
    provider: 'mtm',
    sub: mtmUserId,
    accessEncrypted: encryptToken(accessToken),
    refreshEncrypted: encryptToken(refreshToken),
    connectedAt: Date.now(),
    mirrorEnabled: false,
    expiresAt: Date.now() + (expiresIn * 1000),
  };
  
  await db.collection('mtm_accounts').doc(uid).set(account, { merge: true });
}

/**
 * Load MTM account for a user
 */
export async function loadMTMAccount(uid: string): Promise<MTMAccount | null> {
  const db = getDb();
  
  const doc = await db.collection('mtm_accounts').doc(uid).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as MTMAccount;
}

/**
 * Get decrypted access token
 */
export function getAccessToken(account: MTMAccount): string {
  return decryptToken(account.accessEncrypted);
}

/**
 * Get decrypted refresh token
 */
export function getRefreshToken(account: MTMAccount): string {
  return decryptToken(account.refreshEncrypted);
}

/**
 * Update tokens after refresh
 */
export async function updateTokens(
  uid: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number
): Promise<void> {
  const db = getDb();
  
  const updates: Partial<MTMAccount> = {
    accessEncrypted: encryptToken(accessToken),
    expiresAt: Date.now() + (expiresIn * 1000),
  };
  
  if (refreshToken) {
    updates.refreshEncrypted = encryptToken(refreshToken);
  }
  
  await db.collection('mtm_accounts').doc(uid).update(updates);
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(uid: string): Promise<void> {
  const db = getDb();
  
  await db.collection('mtm_accounts').doc(uid).update({
    lastSyncAt: Date.now(),
  });
}

/**
 * Delete MTM account on disconnect
 */
export async function deleteMTMAccount(uid: string): Promise<void> {
  const db = getDb();
  
  await db.collection('mtm_accounts').doc(uid).delete();
  
  // Also delete all synced meetings
  const batch = db.batch();
  const meetings = await db
    .collection('external_meetings')
    .where('uid', '==', uid)
    .where('external.provider', '==', 'mtm')
    .get();
  
  meetings.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

/**
 * Upsert an external meeting
 */
export async function upsertExternalMeeting(
  uid: string,
  meeting: Omit<ExternalMeeting, 'uid'>
): Promise<void> {
  const db = getDb();
  
  const docId = `${uid}_mtm_${meeting.external.id}`;
  
  await db.collection('external_meetings').doc(docId).set(
    {
      uid,
      ...meeting,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/**
 * Mark meetings as canceled that are no longer in the sync window
 */
export async function markCanceledMeetings(
  uid: string,
  activeIds: Set<string>,
  fromIso: string,
  toIso: string
): Promise<number> {
  const db = getDb();
  
  const existingMeetings = await db
    .collection('external_meetings')
    .where('uid', '==', uid)
    .where('external.provider', '==', 'mtm')
    .where('start', '>=', fromIso)
    .where('start', '<=', toIso)
    .get();
  
  const batch = db.batch();
  let canceledCount = 0;
  
  existingMeetings.forEach(doc => {
    const meeting = doc.data() as ExternalMeeting;
    if (!activeIds.has(meeting.external.id) && meeting.status !== 'canceled') {
      batch.update(doc.ref, {
        status: 'canceled',
        updatedAt: Date.now(),
      });
      canceledCount++;
    }
  });
  
  if (canceledCount > 0) {
    await batch.commit();
  }
  
  return canceledCount;
}

/**
 * Get meetings for a specific date range
 */
export async function getMeetingsInRange(
  uid: string,
  fromIso: string,
  toIso: string
): Promise<ExternalMeeting[]> {
  const db = getDb();
  
  const snapshot = await db
    .collection('external_meetings')
    .where('uid', '==', uid)
    .where('external.provider', '==', 'mtm')
    .where('status', '==', 'accepted')
    .where('start', '>=', fromIso)
    .where('start', '<=', toIso)
    .orderBy('start', 'asc')
    .get();
  
  return snapshot.docs.map(doc => doc.data() as ExternalMeeting);
}

/**
 * Get meeting count for status display
 */
export async function getMeetingCount(uid: string): Promise<number> {
  const db = getDb();
  
  const now = new Date();
  const futureLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const snapshot = await db
    .collection('external_meetings')
    .where('uid', '==', uid)
    .where('external.provider', '==', 'mtm')
    .where('status', '==', 'accepted')
    .where('start', '>=', now.toISOString())
    .where('start', '<=', futureLimit.toISOString())
    .count()
    .get();
  
  return snapshot.data().count;
}