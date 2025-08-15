import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { syncUserMtm } from '../integrations/mtm/service';
import { MEETTOMATCH_CRYPTO_KEY } from '../integrations/mtm/function-config';

// Define secrets for Google OAuth (needed for mirroring)
const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_CLIENT_SECRET');

export const ingestMeetToMatch = onSchedule({
  schedule: 'every 15 minutes',
  secrets: [MEETTOMATCH_CRYPTO_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
}, async () => {
  const db = admin.firestore();
  const q = await db.collectionGroup('integrations')
    .where('status', '==', 'connected')
    .where('type', '==', 'ics')
    .get();

  const uids = new Set<string>();
  q.forEach(snap => {
    const uid = snap.ref.path.split('/')[1];
    if (uid) {
      uids.add(uid);
    }
  });

  const tasks = Array.from(uids).slice(0, 25).map(uid => syncUserMtm(uid));
  await Promise.allSettled(tasks);
});