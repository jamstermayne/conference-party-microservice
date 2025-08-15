import * as admin from 'firebase-admin';
import express from 'express';
import { sha256, encryptString } from '../../lib/crypto';
import { getSecretValue } from '../util/secrets';
import { syncUserMtm } from './service';

const router = express.Router();

// auth guard
router.use((req, res, next) => {
  const uid = (req as any).user?.uid;
  if (!uid) {
    res.status(401).json({ ok: false, error: 'auth-required' });
    return;
  }
  next();
});

router.post('/connect', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { icsUrl } = req.body as { icsUrl: string };
    if (!icsUrl || !/^https:\/\/.+/i.test(icsUrl) || !/\.ics(\?|$)/i.test(icsUrl)) {
      return res.status(400).json({ ok: false, error: 'invalid-ics-url' });
    }

    // quick reachability check
    const ping = await fetch(icsUrl, { method: 'HEAD' });
    if (!ping.ok && ping.status !== 405) { // some ICS endpoints don't allow HEAD
      return res.status(400).json({ ok: false, error: 'ics-unreachable' });
    }

    const key = await getSecretValue('MEETTOMATCH_CRYPTO_KEY');
    const urlEnc = await encryptString(icsUrl, key);
    const urlSha256 = sha256(icsUrl);

    const db = admin.firestore();
    await db.doc(`users/${uid}/integrations/mtm`).set({
      type: 'ics',
      status: 'connected',
      urlEnc,
      urlSha256,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // kick first sync
    await syncUserMtm(uid);

    return res.json({ ok: true });
  } catch (e:any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/syncNow', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const out = await syncUserMtm(uid);
    res.json({ ok: true, ...out });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const db = admin.firestore();
    await db.doc(`users/${uid}/integrations/mtm`).set({ status: 'disconnected' }, { merge: true });
    // optional: delete events
    // await deleteCollection(db, `users/${uid}/mtmEvents`, 200);
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/mirror', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { enabled, calendarId } = req.body as { enabled: boolean; calendarId?: string };
    const db = admin.firestore();
    await db.doc(`users/${uid}/integrations/mtm`).set({
      mirrorToGoogle: !!enabled,
      ...(calendarId ? { googleCalendarId: String(calendarId) } : {}),
    }, { merge: true });
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get current status including mirror settings
router.get('/status', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const db = admin.firestore();
    
    const integSnap = await db.doc(`users/${uid}/integrations/mtm`).get();
    const integ = integSnap.data();
    
    if (!integ || integ['status'] !== 'connected') {
      return res.json({ ok: true, connected: false });
    }
    
    // Check if Google integration exists
    const googleSnap = await db.doc(`users/${uid}/integrations/google`).get();
    const hasGoogleAuth = googleSnap.exists && googleSnap.data()?.['refreshToken'];
    
    return res.json({
      ok: true,
      connected: true,
      lastSyncAt: integ['lastSyncAt']?.toDate?.() || null,
      mirrorToGoogle: integ['mirrorToGoogle'] || false,
      googleCalendarId: integ['googleCalendarId'] || 'primary',
      hasGoogleAuth,
    });
  } catch (e:any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Toggle Google Calendar mirroring
router.post('/toggleMirror', async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { mirrorToGoogle, googleCalendarId } = req.body as { 
      mirrorToGoogle: boolean; 
      googleCalendarId?: string;
    };
    
    const db = admin.firestore();
    
    // Verify MTM is connected
    const integSnap = await db.doc(`users/${uid}/integrations/mtm`).get();
    if (!integSnap.exists || integSnap.data()?.['status'] !== 'connected') {
      return res.status(400).json({ ok: false, error: 'mtm-not-connected' });
    }
    
    // If enabling mirror, verify Google auth exists
    if (mirrorToGoogle) {
      const googleSnap = await db.doc(`users/${uid}/integrations/google`).get();
      if (!googleSnap.exists || !googleSnap.data()?.['refreshToken']) {
        return res.status(400).json({ ok: false, error: 'google-auth-required' });
      }
    }
    
    // Update mirror settings
    await db.doc(`users/${uid}/integrations/mtm`).update({
      mirrorToGoogle: mirrorToGoogle || false,
      googleCalendarId: googleCalendarId || 'primary',
      mirrorUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // If enabling, trigger a sync to start mirroring
    if (mirrorToGoogle) {
      try {
        await syncUserMtm(uid);
      } catch (e) {
        console.error('Failed to sync after enabling mirror:', e);
      }
    }
    
    return res.json({ ok: true, mirrorToGoogle });
  } catch (e:any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;