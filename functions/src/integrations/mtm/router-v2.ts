import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import * as admin from 'firebase-admin';
import { encryptString, sha256 } from '../../lib/crypto';
import { validateIcsUrl } from './validator';
import { syncUserMtm } from './service';
import { getSecretValue } from '../util/secrets';
import { MtmIntegration } from './types';

const router = express.Router();

/**
 * Middleware to ensure authentication
 */
async function ensureAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      res.status(401).json({ ok: false, code: 'missing_auth' });
      return;
    }
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ ok: false, code: 'invalid_auth' });
    return;
  }
}

/**
 * POST /api/integrations/mtm/connect
 * Connect MTM integration with ICS URL
 */
router.post('/connect', ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  const { icsUrl } = req.body || {};
  
  // Validate URL
  const validation = await validateIcsUrl(icsUrl);
  if (!validation.valid) {
    return res.status(400).json({ 
      ok: false, 
      error: validation.error 
    });
  }
  
  try {
    // Get encryption key
    const keyB64 = await getSecretValue('MEETTOMATCH_CRYPTO_KEY');
    
    // Encrypt URL and create hash
    const urlEnc = await encryptString(icsUrl, keyB64);
    const urlSha256 = sha256(icsUrl);
    
    // Store integration
    const integration: MtmIntegration = {
      type: 'ics',
      urlEnc,
      urlSha256,
      status: 'connected',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .set(integration);
    
    // Trigger first sync (async, don't wait)
    syncUserMtm(uid).catch(error => {
      console.error(`Initial sync failed for user ${uid}:`, error);
    });
    
    return res.json({ 
      ok: true,
      message: 'MTM integration connected successfully'
    });
  } catch (error: any) {
    console.error('Error connecting MTM:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to connect MTM integration'
    });
  }
});

/**
 * POST /api/integrations/mtm/syncNow
 * Manually trigger sync
 */
router.post('/syncNow', ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    // Check rate limiting (10 minutes)
    const integDoc = await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .get();
    
    if (integDoc.exists) {
      const data = integDoc.data() as MtmIntegration;
      if (data.lastSyncAt) {
        const lastSync = data.lastSyncAt.toMillis();
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        if (lastSync > tenMinutesAgo) {
          return res.status(429).json({ 
            ok: false, 
            error: 'Please wait 10 minutes between syncs' 
          });
        }
      }
    }
    
    const result = await syncUserMtm(uid);
    
    return res.json({ 
      ok: true,
      eventCount: result.count,
      message: 'Sync completed successfully'
    });
  } catch (error: any) {
    console.error('Error syncing MTM:', error);
    
    // Update integration status on error
    await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .update({
        status: 'error',
        lastError: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
      .catch(() => {}); // Ignore update errors
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to sync MTM events'
    });
  }
});

/**
 * POST /api/integrations/mtm/disconnect
 * Disconnect MTM integration
 */
router.post('/disconnect', ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  const { deleteEvents = false } = req.body || {};
  
  try {
    const batch = admin.firestore().batch();
    
    // Delete integration
    batch.delete(admin.firestore().doc(`users/${uid}/integrations/mtm`));
    
    // Handle events
    const eventsSnapshot = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .get();
    
    if (deleteEvents) {
      // Delete all MTM events
      for (const doc of eventsSnapshot.docs) {
        batch.delete(doc.ref);
      }
    } else {
      // Mark all events as cancelled
      for (const doc of eventsSnapshot.docs) {
        batch.update(doc.ref, {
          cancelled: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    await batch.commit();
    
    return res.json({ 
      ok: true,
      message: 'MTM integration disconnected'
    });
  } catch (error: any) {
    console.error('Error disconnecting MTM:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to disconnect MTM integration'
    });
  }
});

/**
 * GET /api/integrations/mtm/status
 * Get MTM integration status
 */
router.get('/status', ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    const integrationDoc = await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .get();
    
    if (!integrationDoc.exists) {
      return res.json({ 
        ok: true,
        connected: false
      });
    }
    
    const integration = integrationDoc.data() as MtmIntegration;
    
    // Get event count
    const eventsSnapshot = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .where('cancelled', '!=', true)
      .count()
      .get();
    
    return res.json({ 
      ok: true,
      connected: true,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt?.toDate().toISOString(),
      lastError: integration.lastError,
      eventCount: eventsSnapshot.data().count
    });
  } catch (error: any) {
    console.error('Error getting MTM status:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to get MTM status'
    });
  }
});

/**
 * GET /api/integrations/mtm/events
 * Get MTM events for calendar display
 */
router.get('/events', ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    const eventsSnapshot = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .where('cancelled', '!=', true)
      .orderBy('start', 'asc')
      .get();
    
    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data['title'],
        description: data['description'],
        location: data['location'],
        start: data['start']?.toDate?.()?.toISOString() || data['start'],
        end: data['end']?.toDate?.()?.toISOString() || data['end'],
        tz: data['tz'],
        lat: data['lat'],
        lon: data['lon']
      };
    });
    
    return res.json({ 
      ok: true,
      events
    });
  } catch (error: any) {
    console.error('Error getting MTM events:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to get MTM events'
    });
  }
});

export default router;