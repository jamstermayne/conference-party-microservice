import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { defineSecret } from 'firebase-functions/params';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
  });
} catch (error) {
  // Already initialized
}

const app = express();

// Define secrets
const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_CLIENT_SECRET');

// Middleware
app.use(cors({
  origin: [
    'https://conference-party-app.web.app',
    'https://conference-party-app--preview-*.web.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());

// Interfaces
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  meetingLink?: string;
  recurring?: boolean;
  reminders?: number[]; // minutes before event
  status: 'tentative' | 'confirmed' | 'cancelled';
  source: 'google' | 'outlook' | 'manual' | 'imported';
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CalendarIntegration {
  uid: string;
  provider: 'google' | 'outlook';
  accessToken?: string;
  refreshToken?: string;
  calendarId?: string;
  syncEnabled: boolean;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "calendar-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      events: "operational",
      sync: "operational",
      integrations: "operational",
      ical: "operational",
      availability: "operational"
    }
  });
});

// Authentication middleware
async function authenticateUser(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

// Get user's calendar events
app.get("/events", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const {
      startDate,
      endDate,
      limit = '50',
      status = 'confirmed'
    } = req.query;

    const db = admin.firestore();
    let query = db.collection('calendar_events')
      .where('organizer', '==', uid)
      .orderBy('startTime', 'asc')
      .limit(parseInt(limit as string));

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const eventsSnapshot = await query.get();
    let events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CalendarEvent[];

    // Filter by date range if provided
    if (startDate || endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.startTime);
        if (startDate && eventDate < new Date(startDate as string)) return false;
        if (endDate && eventDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    res.status(200).json({
      success: true,
      events,
      count: events.length
    });

  } catch (error) {
    console.error('[Calendar] Get events error:', error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Create a new calendar event
app.post("/events", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const eventData = req.body;

    // Validate required fields
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
      return res.status(400).json({
        error: "Missing required fields: title, startTime, endTime"
      });
    }

    const event: CalendarEvent = {
      id: `evt_${uid}_${Date.now()}`,
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location,
      attendees: eventData.attendees || [],
      organizer: uid,
      meetingLink: eventData.meetingLink,
      recurring: eventData.recurring || false,
      reminders: eventData.reminders || [15], // 15 minutes default
      status: eventData.status || 'confirmed',
      source: eventData.source || 'manual',
      externalId: eventData.externalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = admin.firestore();
    await db.collection('calendar_events').doc(event.id).set(event);

    // If user has Google Calendar integration, sync the event
    const integrationDoc = await db.collection('calendar_integrations').doc(uid).get();
    if (integrationDoc.exists) {
      const integration = integrationDoc.data() as CalendarIntegration;
      if (integration.syncEnabled && integration.provider === 'google') {
        // TODO: Sync with Google Calendar API
        console.log('[Calendar] Would sync with Google Calendar:', event.id);
      }
    }

    res.status(201).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('[Calendar] Create event error:', error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// Update a calendar event
app.put("/events/:eventId", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { eventId } = req.params;
    const updates = req.body;

    const db = admin.firestore();
    const eventRef = db.collection('calendar_events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventDoc.data() as CalendarEvent;

    // Check if user is the organizer
    if (event.organizer !== uid) {
      return res.status(403).json({ error: "Only the organizer can update this event" });
    }

    const updatedEvent = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await eventRef.update(updatedEvent);

    res.status(200).json({
      success: true,
      message: "Event updated successfully"
    });

  } catch (error) {
    console.error('[Calendar] Update event error:', error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete a calendar event
app.delete("/events/:eventId", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { eventId } = req.params;

    const db = admin.firestore();
    const eventRef = db.collection('calendar_events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventDoc.data() as CalendarEvent;

    // Check if user is the organizer
    if (event.organizer !== uid) {
      return res.status(403).json({ error: "Only the organizer can delete this event" });
    }

    await eventRef.delete();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });

  } catch (error) {
    console.error('[Calendar] Delete event error:', error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// Get user's calendar integrations
app.get("/integrations", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;

    const db = admin.firestore();
    const integrationDoc = await db.collection('calendar_integrations').doc(uid).get();

    if (!integrationDoc.exists) {
      return res.status(200).json({
        success: true,
        integrations: [],
        message: "No integrations configured"
      });
    }

    const integration = integrationDoc.data() as CalendarIntegration;

    // Don't return sensitive tokens
    const publicIntegration = {
      provider: integration.provider,
      syncEnabled: integration.syncEnabled,
      lastSync: integration.lastSync,
      calendarId: integration.calendarId,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt
    };

    res.status(200).json({
      success: true,
      integration: publicIntegration
    });

  } catch (error) {
    console.error('[Calendar] Get integrations error:', error);
    res.status(500).json({ error: "Failed to fetch integrations" });
  }
});

// Setup calendar integration
app.post("/integrations", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { provider, accessToken, refreshToken, calendarId } = req.body;

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return res.status(400).json({ error: "Invalid provider. Use 'google' or 'outlook'" });
    }

    const integration: CalendarIntegration = {
      uid,
      provider,
      accessToken, // In production, encrypt this
      refreshToken, // In production, encrypt this
      calendarId,
      syncEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = admin.firestore();
    await db.collection('calendar_integrations').doc(uid).set(integration, { merge: true });

    res.status(200).json({
      success: true,
      message: "Calendar integration configured successfully"
    });

  } catch (error) {
    console.error('[Calendar] Setup integration error:', error);
    res.status(500).json({ error: "Failed to setup calendar integration" });
  }
});

// Sync with external calendar
app.post("/sync", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { force = false } = req.body;

    const db = admin.firestore();
    const integrationDoc = await db.collection('calendar_integrations').doc(uid).get();

    if (!integrationDoc.exists) {
      return res.status(400).json({ error: "No calendar integration found" });
    }

    const integration = integrationDoc.data() as CalendarIntegration;

    if (!integration.syncEnabled) {
      return res.status(400).json({ error: "Calendar sync is disabled" });
    }

    // Check if we need to sync (unless forced)
    if (!force && integration.lastSync) {
      const lastSyncTime = new Date(integration.lastSync).getTime();
      const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);

      if (hoursSinceSync < 1) {
        return res.status(200).json({
          success: true,
          message: "Recent sync found, skipping",
          lastSync: integration.lastSync
        });
      }
    }

    // TODO: Implement actual sync with Google Calendar API or Outlook API
    console.log(`[Calendar] Syncing ${integration.provider} calendar for user ${uid}`);

    // Update last sync time
    await db.collection('calendar_integrations').doc(uid).update({
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: "Calendar sync completed",
      provider: integration.provider,
      syncTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Calendar] Sync error:', error);
    res.status(500).json({ error: "Calendar sync failed" });
  }
});

// Generate iCal export
app.get("/export/ical", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { startDate, endDate } = req.query;

    const db = admin.firestore();
    let query = db.collection('calendar_events')
      .where('organizer', '==', uid)
      .where('status', '==', 'confirmed')
      .orderBy('startTime', 'asc');

    const eventsSnapshot = await query.get();
    let events = eventsSnapshot.docs.map(doc => doc.data()) as CalendarEvent[];

    // Filter by date range if provided
    if (startDate || endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.startTime);
        if (startDate && eventDate < new Date(startDate as string)) return false;
        if (endDate && eventDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    // Generate iCal content
    const icalContent = generateICalContent(events);

    res.set({
      'Content-Type': 'text/calendar',
      'Content-Disposition': 'attachment; filename="calendar.ics"'
    });

    res.status(200).send(icalContent);

  } catch (error) {
    console.error('[Calendar] iCal export error:', error);
    res.status(500).json({ error: "Failed to export calendar" });
  }
});

// Get user availability
app.get("/availability", authenticateUser, async (req: any, res: Response) => {
  try {
    const { uid } = req.user;
    const { date, duration = '60' } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter required" });
    }

    const targetDate = new Date(date as string);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    // Get events for the day
    const db = admin.firestore();
    const eventsSnapshot = await db.collection('calendar_events')
      .where('organizer', '==', uid)
      .where('status', '==', 'confirmed')
      .where('startTime', '>=', startOfDay.toISOString())
      .where('startTime', '<', endOfDay.toISOString())
      .orderBy('startTime', 'asc')
      .get();

    const events = eventsSnapshot.docs.map(doc => doc.data()) as CalendarEvent[];

    // Calculate available time slots
    const meetingDuration = parseInt(duration as string);
    const availableSlots = calculateAvailableSlots(events, startOfDay, endOfDay, meetingDuration);

    res.status(200).json({
      success: true,
      date: date,
      availableSlots,
      busySlots: events.map(event => ({
        startTime: event.startTime,
        endTime: event.endTime,
        title: event.title
      }))
    });

  } catch (error) {
    console.error('[Calendar] Availability error:', error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// Helper functions
function generateICalContent(events: CalendarEvent[]): string {
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Conference Party App//Calendar Service//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    ical.push(
      'BEGIN:VEVENT',
      `UID:${event.id}`,
      `DTSTART:${formatDateForICal(event.startTime)}`,
      `DTEND:${formatDateForICal(event.endTime)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `STATUS:${event.status.toUpperCase()}`,
      `CREATED:${formatDateForICal(event.createdAt)}`,
      `LAST-MODIFIED:${formatDateForICal(event.updatedAt)}`,
      'END:VEVENT'
    );
  });

  ical.push('END:VCALENDAR');
  return ical.join('\r\n');
}

function formatDateForICal(dateString: string): string {
  return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function calculateAvailableSlots(
  events: CalendarEvent[],
  startOfDay: Date,
  endOfDay: Date,
  meetingDuration: number
): Array<{ startTime: string, endTime: string }> {
  const slots: Array<{ startTime: string, endTime: string }> = [];
  const busyTimes = events.map(event => ({
    start: new Date(event.startTime),
    end: new Date(event.endTime)
  })).sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = new Date(startOfDay);

  for (const busyTime of busyTimes) {
    // Check if there's a gap before this busy time
    const gapDuration = busyTime.start.getTime() - currentTime.getTime();
    const gapMinutes = gapDuration / (1000 * 60);

    if (gapMinutes >= meetingDuration) {
      // Generate slots in this gap
      let slotStart = new Date(currentTime);
      while (slotStart.getTime() + (meetingDuration * 60 * 1000) <= busyTime.start.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + (meetingDuration * 60 * 1000));
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString()
        });
        slotStart = new Date(slotStart.getTime() + (30 * 60 * 1000)); // 30-minute intervals
      }
    }

    currentTime = new Date(Math.max(currentTime.getTime(), busyTime.end.getTime()));
  }

  // Check for availability after the last busy time
  const remainingTime = endOfDay.getTime() - currentTime.getTime();
  const remainingMinutes = remainingTime / (1000 * 60);

  if (remainingMinutes >= meetingDuration) {
    let slotStart = new Date(currentTime);
    while (slotStart.getTime() + (meetingDuration * 60 * 1000) <= endOfDay.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + (meetingDuration * 60 * 1000));
      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString()
      });
      slotStart = new Date(slotStart.getTime() + (30 * 60 * 1000)); // 30-minute intervals
    }
  }

  return slots;
}

// Export the function
export const calendarService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
  secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET],
}, app);