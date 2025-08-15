import type { Request, Response, NextFunction } from "express";
import express from "express";
import * as admin from "firebase-admin";
import { encryptString, decryptString, sha256 } from "../lib/crypto";
import { icsService } from "../services/ics";
import { MtmIntegration, MtmEvent } from "../models/mtm";

const router = express.Router();

/**
 * Middleware to ensure authentication
 */
async function ensureAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      res.status(401).json({ ok: false, code: "missing_auth" });
      return;
    }
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ ok: false, code: "invalid_auth" });
    return;
  }
}

/**
 * POST /api/m2m/verify - Verify an ICS URL can be fetched and parsed
 */
router.post("/verify", ensureAuth, async (req, res) => {
  const { url } = req.body || {};
  
  // Validate URL format
  if (!url || !/^https:\/\//i.test(url) || !/\.ics(\?|$)/i.test(url)) {
    return res.status(400).json({ 
      ok: false, 
      code: "invalid_url",
      message: "URL must be HTTPS and end with .ics" 
    });
  }
  
  try {
    // Fetch and parse ICS
    const fetchResult = await icsService.fetchICS(url);
    if (!fetchResult.ok || !fetchResult.data) {
      return res.status(400).json({ 
        ok: false, 
        code: "fetch_failed",
        message: "Could not fetch ICS file" 
      });
    }
    
    const events = icsService.parseICS(fetchResult.data);
    
    return res.json({ 
      ok: true, 
      eventCount: events.length,
      sample: events.slice(0, 3).map(e => ({
        title: e.title,
        start: e.start.toDate().toISOString(),
        location: e.location
      }))
    });
  } catch (error) {
    console.error("Error verifying ICS:", error);
    return res.status(400).json({ 
      ok: false, 
      code: "verify_error",
      message: "Failed to verify ICS file" 
    });
  }
});

/**
 * POST /api/m2m/connect - Connect MTM integration with encrypted URL storage
 */
router.post("/connect", ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  const { url } = req.body || {};
  
  // Validate URL
  if (!url || !/^https:\/\//i.test(url) || !/\.ics(\?|$)/i.test(url)) {
    return res.status(400).json({ 
      ok: false, 
      code: "invalid_url",
      message: "URL must be HTTPS and end with .ics" 
    });
  }
  
  try {
    // Verify URL works before storing
    const fetchResult = await icsService.fetchICS(url);
    if (!fetchResult.ok || !fetchResult.data) {
      return res.status(400).json({ 
        ok: false, 
        code: "fetch_failed",
        message: "Could not fetch ICS file" 
      });
    }
    
    const events = icsService.parseICS(fetchResult.data);
    
    // Get encryption key from environment
    const keyB64 = process.env['MEETTOMATCH_CRYPTO_KEY'] || '';
    const cryptoKey = keyB64 || Buffer.from('dev-key-32-bytes-do-not-use-prod').toString('base64');
    
    // Encrypt URL for secure storage
    const urlEnc = await encryptString(url, cryptoKey);
    const urlSha256 = sha256(url);
    
    // Store integration
    const integration: MtmIntegration = {
      type: 'ics',
      urlEnc,
      urlSha256,
      status: 'connected',
      lastSyncAt: admin.firestore.Timestamp.now(),
      lastError: null
    };
    
    await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .set(integration);
    
    // Store initial events
    const batch = admin.firestore().batch();
    for (const event of events) {
      const docRef = admin.firestore()
        .collection(`users/${uid}/mtmEvents`)
        .doc(event.icsUid);
      batch.set(docRef, event);
    }
    await batch.commit();
    
    return res.json({ 
      ok: true, 
      connected: true,
      eventCount: events.length
    });
  } catch (error) {
    console.error("Error connecting MTM:", error);
    return res.status(500).json({ 
      ok: false, 
      code: "connect_error",
      message: "Failed to connect MTM integration" 
    });
  }
});

/**
 * POST /api/m2m/sync - Sync events from ICS
 */
router.post("/sync", ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    // Get integration
    const integDoc = await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .get();
    
    if (!integDoc.exists) {
      return res.status(400).json({ 
        ok: false, 
        code: "not_connected",
        message: "MTM integration not connected" 
      });
    }
    
    const integration = integDoc.data() as MtmIntegration;
    
    // Check if recently synced (within 5 minutes)
    const lastSync = integration.lastSyncAt?.toMillis() || 0;
    if (Date.now() - lastSync < 5 * 60 * 1000) {
      return res.json({ 
        ok: true, 
        synced: false,
        message: "Recently synced, please wait 5 minutes" 
      });
    }
    
    // Get encryption key from environment
    const keyB64 = process.env['MEETTOMATCH_CRYPTO_KEY'] || '';
    const cryptoKey = keyB64 || Buffer.from('dev-key-32-bytes-do-not-use-prod').toString('base64');
    
    // Decrypt URL
    const url = await decryptString(integration.urlEnc, cryptoKey);
    
    // Fetch ICS
    const fetchResult = await icsService.fetchICS(url);
    if (!fetchResult.ok || !fetchResult.data) {
      // Update integration status
      await integDoc.ref.update({
        status: 'error',
        lastError: 'Failed to fetch ICS file'
      });
      
      return res.status(400).json({ 
        ok: false, 
        code: "fetch_failed",
        message: "Could not fetch ICS file" 
      });
    }
    
    const events = icsService.parseICS(fetchResult.data);
    
    // Update events in Firestore
    const batch = admin.firestore().batch();
    
    // Get existing events to detect deletions
    const existingEvents = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .get();
    
    const existingIds = new Set(existingEvents.docs.map(d => d.id));
    const newIds = new Set(events.map(e => e.icsUid));
    
    // Delete removed events
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        batch.delete(admin.firestore().doc(`users/${uid}/mtmEvents/${id}`));
      }
    }
    
    // Add/update events
    for (const event of events) {
      const docRef = admin.firestore()
        .collection(`users/${uid}/mtmEvents`)
        .doc(event.icsUid);
      batch.set(docRef, event, { merge: true });
    }
    
    // Update integration status
    batch.update(integDoc.ref, {
      status: 'connected',
      lastSyncAt: admin.firestore.Timestamp.now(),
      lastError: null
    });
    
    await batch.commit();
    
    return res.json({ 
      ok: true, 
      synced: true,
      eventCount: events.length,
      added: [...newIds].filter(id => !existingIds.has(id)).length,
      removed: [...existingIds].filter(id => !newIds.has(id)).length
    });
  } catch (error) {
    console.error("Error syncing MTM:", error);
    return res.status(500).json({ 
      ok: false, 
      code: "sync_error",
      message: "Failed to sync MTM events" 
    });
  }
});

/**
 * GET /api/m2m/events - Get all MTM events
 */
router.get("/events", ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    // Check if connected
    const integDoc = await admin.firestore()
      .doc(`users/${uid}/integrations/mtm`)
      .get();
    
    if (!integDoc.exists) {
      return res.json({ 
        ok: true, 
        connected: false,
        events: [] 
      });
    }
    
    const integration = integDoc.data() as MtmIntegration;
    
    // Get events
    const eventsSnapshot = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .orderBy('start', 'asc')
      .get();
    
    const events = eventsSnapshot.docs.map(doc => {
      const data = doc.data() as MtmEvent;
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        location: data.location,
        start: data.start.toDate().toISOString(),
        end: data.end.toDate().toISOString(),
        tz: data.tz,
        lat: data.lat,
        lon: data.lon
      };
    });
    
    return res.json({ 
      ok: true, 
      connected: true,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt?.toDate().toISOString(),
      events 
    });
  } catch (error) {
    console.error("Error getting MTM events:", error);
    return res.status(500).json({ 
      ok: false, 
      code: "get_events_error",
      message: "Failed to get MTM events" 
    });
  }
});

/**
 * POST /api/m2m/disconnect - Disconnect MTM integration
 */
router.post("/disconnect", ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  
  try {
    const batch = admin.firestore().batch();
    
    // Delete integration
    batch.delete(admin.firestore().doc(`users/${uid}/integrations/mtm`));
    
    // Delete all events
    const eventsSnapshot = await admin.firestore()
      .collection(`users/${uid}/mtmEvents`)
      .get();
    
    for (const doc of eventsSnapshot.docs) {
      batch.delete(doc.ref);
    }
    
    await batch.commit();
    
    return res.json({ 
      ok: true, 
      disconnected: true 
    });
  } catch (error) {
    console.error("Error disconnecting MTM:", error);
    return res.status(500).json({ 
      ok: false, 
      code: "disconnect_error",
      message: "Failed to disconnect MTM integration" 
    });
  }
});

export default router;