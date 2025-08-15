import * as admin from 'firebase-admin';
import ical from 'ical';
import { decryptString } from '../../lib/crypto';
import { getSecretValue } from '../util/secrets';
import { mirrorToGoogle } from './googleMirror';

type MtmEvent = {
  icsUid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date | undefined;
  tz?: string | null;
  lat?: number | null;
  lon?: number | null;
};

export async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`ICS fetch failed: ${res.status}`);
  return await res.text();
}

export function parseIcs(text: string): MtmEvent[] {
  const data = ical.parseICS(text);
  const out: MtmEvent[] = [];
  for (const k of Object.keys(data)) {
    const e = data[k];
    if (!e || e.type !== 'VEVENT' || !e.uid || !e.start) continue;
    const ev: MtmEvent = {
      icsUid: String(e.uid),
      title: String(e.summary || 'Untitled'),
      description: e.description || '',
      location: e.location || '',
      start: new Date(e.start),
      end: e.end ? new Date(e.end) : undefined,
      tz: (e as any).tz || null,
      lat: (e.geo && typeof e.geo.lat === 'number') ? e.geo.lat : null,
      lon: (e.geo && typeof (e.geo as any).lon === 'number') ? (e.geo as any).lon : 
           (e.geo && typeof (e.geo as any).lng === 'number') ? (e.geo as any).lng : null,
    };
    out.push(ev);
  }
  return out;
}

export async function syncUserMtm(uid: string): Promise<{count: number}> {
  const db = admin.firestore();
  const integRef = db.doc(`users/${uid}/integrations/mtm`);
  const integSnap = await integRef.get();
  if (!integSnap.exists) return { count: 0 };

  const integ = integSnap.data() as any;
  if (integ.status !== 'connected' || !integ.urlEnc) return { count: 0 };

  const key = await getSecretValue('MEETTOMATCH_CRYPTO_KEY'); // base64
  const url = await decryptString(integ.urlEnc, key);

  const ics = await fetchIcs(url);
  const events = parseIcs(ics);

  const batch = db.batch();
  const col = db.collection(`users/${uid}/mtmEvents`);
  const now = admin.firestore.FieldValue.serverTimestamp();
  let count = 0;

  for (const ev of events) {
    const docRef = col.doc(ev.icsUid);
    batch.set(docRef, {
      source: 'mtm',
      ...ev,
      updatedAt: now,
      cancelled: false,
    }, { merge: true });
    count++;
  }

  batch.set(integRef, { lastSyncAt: now, lastError: admin.firestore.FieldValue.delete() }, { merge: true });
  await batch.commit();

  // Mirror (best-effort; never throw)
  try {
    await mirrorToGoogle(uid, events);
  } catch (_e) {}

  return { count };
}