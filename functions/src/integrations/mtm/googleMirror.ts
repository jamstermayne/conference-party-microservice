import * as admin from 'firebase-admin';
import { getGoogleAccessToken } from '../google/auth';
import { sha256 } from '../../lib/crypto';

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

function toGEvent(ev: MtmEvent) {
  const timeZone = ev.tz || 'UTC';
  const start = { dateTime: ev.start.toISOString(), timeZone };
  const end   = { dateTime: (ev.end ?? new Date(ev.start.getTime() + 60*60*1000)).toISOString(), timeZone };

  return {
    summary: ev.title,
    description: ev.description ?? '',
    location: ev.location ?? '',
    start, end,
    extendedProperties: { private: { mtmUid: ev.icsUid } },
  };
}

// Google requires [a-z0-9] ids; we derive a stable one for idempotency (optional)
const idFor = (icsUid: string) => sha256(icsUid).slice(0, 52).replace(/[^a-z0-9]/g, 'a');

export async function mirrorToGoogle(uid: string, events: MtmEvent[]): Promise<number> {
  const db = admin.firestore();

  // read MTM mirror prefs + Google status
  const integSnap = await db.doc(`users/${uid}/integrations/mtm`).get();
  const integ = (integSnap.data() || {}) as any;
  if (!integ.mirrorToGoogle) return 0;

  const calId = integ.googleCalendarId || 'primary';
  const accessToken = await getGoogleAccessToken(uid);
  if (!accessToken) return 0;

  let upserts = 0;

  for (const ev of events) {
    // Find by privateExtendedProperty (fast & exact)
    const listUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
    listUrl.searchParams.set('privateExtendedProperty', `mtmUid=${ev.icsUid}`);
    listUrl.searchParams.set('maxResults', '1');
    listUrl.searchParams.set('orderBy', 'startTime');
    listUrl.searchParams.set('singleEvents', 'true');

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const listRes = await fetch(listUrl, { headers });
    if (listRes.status === 401) break; // token expired — next scheduler will retry
    if (!listRes.ok) continue;

    const list = await listRes.json() as { items?: any[] };
    const gBody = toGEvent(ev);

    if (list.items && list.items.length) {
      // update existing
      const id = list.items[0].id;
      const patchUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(id)}`;
      const patchRes = await fetch(patchUrl, { method: 'PATCH', headers, body: JSON.stringify(gBody) });
      if (patchRes.ok) upserts++;
    } else {
      // create new (stable deterministic id keeps it idempotent on retries)
      const insertUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
      insertUrl.searchParams.set('conferenceDataVersion', '1'); // harmless
      const body = { ...gBody, id: idFor(ev.icsUid) };
      const insRes = await fetch(insertUrl, { method: 'POST', headers, body: JSON.stringify(body) });
      if (insRes.ok) upserts++;
    }
  }

  return upserts;
}