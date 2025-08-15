import * as admin from 'firebase-admin';
import * as ical from 'ical';
import { decryptString } from '../../lib/crypto';
import { MtmIntegration, MtmEvent } from './types';
import { google } from 'googleapis';

/**
 * Sync MTM events for a user
 */
export async function mtmSyncUser(uid: string): Promise<{ 
  success: boolean; 
  eventCount?: number; 
  error?: string 
}> {
  const db = admin.firestore();
  
  try {
    // Get user's MTM integration
    const integrationDoc = await db.doc(`users/${uid}/integrations/mtm`).get();
    if (!integrationDoc.exists) {
      return { success: false, error: 'No MTM integration found' };
    }
    
    const integration = integrationDoc.data() as MtmIntegration;
    
    // Check if recently synced (rate limit: 10 minutes)
    if (integration.lastSyncAt) {
      const lastSync = integration.lastSyncAt.toMillis();
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      if (lastSync > tenMinutesAgo) {
        return { success: true, eventCount: 0, error: 'Recently synced' };
      }
    }
    
    // Get encryption key from environment
    const keyB64 = process.env['MEETTOMATCH_CRYPTO_KEY'] || '';
    const cryptoKey = keyB64 || Buffer.from('dev-key-32-bytes-do-not-use-prod').toString('base64');
    
    // Decrypt the ICS URL
    const icsUrl = await decryptString(integration.urlEnc, cryptoKey);
    
    // Fetch ICS file
    let icsData: string;
    try {
      const response = await fetch(icsUrl, {
        headers: {
          'User-Agent': 'Conference-Party-App/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (response.status === 401 || response.status === 403) {
        // Update status to error
        await integrationDoc.ref.update({
          status: 'error',
          lastError: `Authentication failed (${response.status})`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: false, error: `Authentication failed (${response.status})` };
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      icsData = await response.text();
    } catch (error: any) {
      // Update status to error
      await integrationDoc.ref.update({
        status: 'error',
        lastError: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: false, error: error.message };
    }
    
    // Parse ICS data
    const parsedData = ical.parseICS(icsData);
    const events: MtmEvent[] = [];
    const existingEventIds = new Set<string>();
    
    // Process each VEVENT
    for (const key in parsedData) {
      const component = parsedData[key];
      
      if (!component || component.type !== 'VEVENT') {
        continue;
      }
      
      const icsUid = component.uid || `${component.summary}-${component.start}`;
      existingEventIds.add(icsUid);
      
      // Build normalized event structure
      const event: MtmEvent = {
        source: 'mtm',
        icsUid,
        title: component.summary || 'Untitled Event',
        description: component.description || undefined,
        location: component.location || undefined,
        start: component.start ? 
          admin.firestore.Timestamp.fromDate(new Date(component.start as any)) : 
          admin.firestore.Timestamp.now(),
        end: component.end ? 
          admin.firestore.Timestamp.fromDate(new Date(component.end as any)) : 
          admin.firestore.Timestamp.now(),
        tz: (component as any).tz || null,
        lastModified: (component as any)['last-modified'],
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      // Try to extract geo coordinates from location
      if (event.location) {
        const geoMatch = event.location.match(/geo:([-\d.]+),([-\d.]+)/);
        if (geoMatch && geoMatch[1] && geoMatch[2]) {
          event.lat = parseFloat(geoMatch[1]);
          event.lon = parseFloat(geoMatch[2]);
        }
        // TODO: Add venue lookup table for known locations
      }
      
      events.push(event);
    }
    
    // Batch operations
    const batch = db.batch();
    
    // Get existing events to detect deletions
    const existingEventsSnapshot = await db
      .collection(`users/${uid}/mtmEvents`)
      .where('cancelled', '!=', true)
      .get();
    
    // Mark deleted events as cancelled
    for (const doc of existingEventsSnapshot.docs) {
      if (!existingEventIds.has(doc.id)) {
        batch.update(doc.ref, {
          cancelled: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Upsert events
    for (const event of events) {
      const docRef = db.doc(`users/${uid}/mtmEvents/${event.icsUid}`);
      batch.set(docRef, event, { merge: true });
    }
    
    // Update integration status
    batch.update(integrationDoc.ref, {
      status: 'connected',
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      lastError: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await batch.commit();
    
    // Sync to Google Calendar if connected
    await syncToGoogleCalendar(uid, events);
    
    return { success: true, eventCount: events.length };
  } catch (error: any) {
    console.error(`Error syncing MTM for user ${uid}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync MTM events to Google Calendar
 */
async function syncToGoogleCalendar(uid: string, events: MtmEvent[]) {
  try {
    // Check if user has Google Calendar connected
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userDoc.data();
    
    if (!userData?.['googleCalendarConnected'] || !userData?.['googleTokens']) {
      return; // Google Calendar not connected
    }
    
    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(userData['googleTokens']);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Process each event
    for (const event of events) {
      try {
        // Check if event already exists in Google Calendar
        const existingEvents = await calendar.events.list({
          calendarId: 'primary',
          privateExtendedProperty: [`mtmUid=${event.icsUid}`],
          maxResults: 1
        });
        
        const googleEvent = {
          summary: `[MTM] ${event.title}`,
          description: event.description || null,
          location: event.location || null,
          start: {
            dateTime: event.start.toDate().toISOString(),
            timeZone: event.tz || 'Europe/Berlin'
          },
          end: {
            dateTime: event.end.toDate().toISOString(),
            timeZone: event.tz || 'Europe/Berlin'
          },
          extendedProperties: {
            private: {
              mtmUid: event.icsUid,
              source: 'mtm'
            }
          }
        };
        
        const existingEventsList = await existingEvents;
        if (existingEventsList.data.items && existingEventsList.data.items.length > 0) {
          // Update existing event
          const existingEvent = existingEventsList.data.items[0];
          if (existingEvent?.id) {
            await calendar.events.update({
              calendarId: 'primary',
              eventId: existingEvent.id,
              requestBody: googleEvent
            });
          }
          
          // Update Firestore with Google event ID
          if (existingEvent?.id) {
            await admin.firestore()
              .doc(`users/${uid}/mtmEvents/${event.icsUid}`)
              .update({ googleEventId: existingEvent.id });
          }
        } else {
          // Create new event
          const insertResult = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: googleEvent
          });
          const createdEvent = await insertResult;
          
          // Update Firestore with Google event ID
          if (createdEvent.data.id) {
            await admin.firestore()
              .doc(`users/${uid}/mtmEvents/${event.icsUid}`)
              .update({ googleEventId: createdEvent.data.id });
          }
        }
      } catch (error) {
        console.error(`Failed to sync event ${event.icsUid} to Google Calendar:`, error);
        // Continue with other events
      }
    }
  } catch (error) {
    console.error('Failed to sync to Google Calendar:', error);
    // Non-critical error, don't fail the sync
  }
}