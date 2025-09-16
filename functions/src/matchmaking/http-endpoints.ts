/**
 * HTTP Endpoints for Matchmaking System
 * Provides API endpoints for attendee ingestion and scan processing
 */

import * as functions from 'firebase-functions';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { AttendeeIngestService } from './attendee-ingest';
import { MeetingScheduler } from './meeting-scheduler';
import { MatchEngine } from './match-engine';

// Initialize admin if not already initialized
try {
  admin.initializeApp();
} catch (error) {
  // Already initialized
}

const db = admin.firestore();

const corsHandler = cors({ origin: true });

/**
 * HTTP endpoint for processing badge scans
 * POST /matchmaking-processScan
 */
export const processScan = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { badgeId, scannerId, timestamp, location } = req.body;

      if (!badgeId || !scannerId) {
        res.status(400).json({
          error: 'Missing required fields: badgeId and scannerId'
        });
        return;
      }

      const ingestService = new AttendeeIngestService();

      // Process the scan
      const result = await ingestService.processScan({
        badgeID: badgeId,
        scannerID: scannerId,
        scanTime: timestamp ? new Date(timestamp) : new Date(),
        location: location || 'unknown'
      });

      res.json({
        success: true,
        badgeScan: result
      });
    } catch (error) {
      console.error('[ProcessScan] Error:', error);
      res.status(500).json({
        error: 'Failed to process scan',
        details: (error as Error).message
      });
    }
  });
});

/**
 * HTTP endpoint for bulk attendee upload
 * POST /matchmaking-ingestAttendees
 */
export const ingestAttendees = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { attendees, dryRun = false, source = 'api' } = req.body;

      if (!Array.isArray(attendees)) {
        res.status(400).json({
          error: 'attendees must be an array'
        });
        return;
      }

      const ingestService = new AttendeeIngestService();
      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        matchesCreated: 0
      };

      // Process each attendee
      for (let i = 0; i < attendees.length; i++) {
        try {
          const attendee = attendees[i];

          // Validate required fields
          if (!attendee.email) {
            results.errors.push({
              row: i + 1,
              error: 'Missing email field'
            });
            results.skipped++;
            continue;
          }

          // Check consent
          if (!attendee.consent?.matchmaking) {
            results.skipped++;
            continue;
          }

          if (!dryRun) {
            // Ingest the attendee
            const profileId = await ingestService.ingestFromWeb({
              Email: attendee.email,
              'Full Name': attendee.fullName || '',
              Organization: attendee.org || '',
              Role: Array.isArray(attendee.role) ? attendee.role.join('|') : attendee.role || '',
              Interests: Array.isArray(attendee.interests) ? attendee.interests.join('|') : attendee.interests || '',
              Capabilities: Array.isArray(attendee.capabilities) ? attendee.capabilities.join('|') : attendee.capabilities || '',
              Needs: Array.isArray(attendee.needs) ? attendee.needs.join('|') : attendee.needs || '',
              'LinkedIn URL': attendee.linkedIn || '',
              'Consent Matchmaking': attendee.consent?.matchmaking ? 'TRUE' : 'FALSE',
              'Consent Marketing': attendee.consent?.marketing ? 'TRUE' : 'FALSE',
              'Consent Show Card': attendee.consent?.showPublicCard ? 'TRUE' : 'FALSE'
            });

            if (profileId) {
              results.created++;

              // Trigger match calculation
              const matchEngine = new MatchEngine();
              const matches = await matchEngine.calculateForProfile(profileId);
              results.matchesCreated += matches.length;
            }
          } else {
            // Dry run - just validate
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        dryRun,
        source,
        ...results
      });
    } catch (error) {
      console.error('[IngestAttendees] Error:', error);
      res.status(500).json({
        error: 'Failed to process attendees',
        details: (error as Error).message
      });
    }
  });
});

/**
 * Callable function for calculating matches
 */
export const calculateMatches = functions.https.onCall(async (request) => {
  try {
    const { actorIds, profile = 'balanced', threshold = 0.3, limit = 100 } = request.data;

    const matchEngine = new MatchingEngine(db);
    const results = [];

    for (const actorId of actorIds) {
      const matches = await matchEngine.calculateForProfile(actorId, {
        profile,
        threshold,
        limit
      });
      results.push({
        actorId,
        matchCount: matches.length,
        topMatches: matches.slice(0, 5)
      });
    }

    return {
      success: true,
      calculated: results.length,
      results
    };
  } catch (error) {
    console.error('[CalculateMatches] Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to calculate matches',
      error.message
    );
  }
});

/**
 * Callable function for scheduling meetings
 */
export const scheduleMeeting = functions.https.onCall(async (request) => {
  try {
    const { matchId, requestorId, day, slot, message } = request.data;

    if (!matchId || !requestorId || !day || !slot) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    const scheduler = new MeetingScheduler();
    const result = await scheduler.requestMeeting({
      matchId,
      requestorId,
      day,
      slot,
      message
    });

    return {
      success: true,
      meetingId: result.meetingId,
      status: result.status
    };
  } catch (error) {
    console.error('[ScheduleMeeting] Error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to schedule meeting',
      error.message
    );
  }
});

/**
 * HTTP endpoint for scan webhook (for physical badge scanner integration)
 * POST /matchmaking-scanWebhook
 */
export const scanWebhook = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Handle different scanner formats
      const scanData = parseScannerData(req.body);

      if (!scanData.badgeId) {
        res.status(400).json({
          error: 'Invalid scan data: missing badge ID'
        });
        return;
      }

      const ingestService = new AttendeeIngestService();

      // Process the scan
      const result = await ingestService.processScan({
        badgeId: scanData.badgeId,
        scannerId: scanData.scannerId || 'webhook',
        scanTime: new Date(),
        location: scanData.location || 'entrance'
      });

      // Return simple success for webhook
      res.status(200).json({
        success: true,
        profileId: result.profileId
      });
    } catch (error) {
      console.error('[ScanWebhook] Error:', error);
      res.status(500).json({
        error: 'Failed to process scan'
      });
    }
  });
});

/**
 * Parse different scanner data formats
 */
function parseScannerData(body: any): {
  badgeId: string;
  scannerId?: string;
  location?: string;
} {
  // Handle different possible formats from scanner vendors

  // Format 1: Direct badge ID
  if (typeof body === 'string') {
    return { badgeId: body };
  }

  // Format 2: Standard JSON
  if (body.badgeId || body.badge_id) {
    return {
      badgeId: body.badgeId || body.badge_id,
      scannerId: body.scannerId || body.scanner_id,
      location: body.location
    };
  }

  // Format 3: QR code data
  if (body.qr_data) {
    // Parse QR code (assuming format: BADGE:12345)
    const match = body.qr_data.match(/BADGE:(\w+)/);
    if (match) {
      return {
        badgeId: match[1],
        scannerId: body.scanner,
        location: body.zone
      };
    }
  }

  // Format 4: RFID/NFC data
  if (body.rfid || body.nfc) {
    return {
      badgeId: body.rfid || body.nfc,
      scannerId: body.reader,
      location: body.gate
    };
  }

  throw new Error('Unsupported scan data format');
}