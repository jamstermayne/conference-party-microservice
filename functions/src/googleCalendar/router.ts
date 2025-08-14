import { Router } from 'express';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

const router = Router();

// Environment config
const OAUTH_REDIRECT = process.env['OAUTH_REDIRECT'] || 'https://us-central1-conference-party-app.cloudfunctions.net/api/googleCalendar/google/callback';
const CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] || '';
const CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'] || '';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// OAuth2 client factory
function oauth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, OAUTH_REDIRECT);
}

// Get stored credentials for user
async function getClientFor(uid: string): Promise<any> {
  try {
    const snap = await admin.firestore().doc(`users/${uid}/secrets/google`).get();
    const data = snap.data();
    if (!data?.['refreshToken']) return null;
    const client = oauth2Client();
    client.setCredentials({ refresh_token: data['refreshToken'] });
    return client;
  } catch {
    return null;
  }
}

// Note: Auth middleware removed for testing
// TODO: Implement proper auth with Firebase Auth or session cookies

// GET /api/googleCalendar/status
router.get('/status', async (req: any, res) => {
  try {
    const uid = req.uid || 'demo-user';
    const client = await getClientFor(uid);
    res.json({ connected: !!client });
  } catch (error) {
    res.json({ connected: false });
  }
});

// GET /api/googleCalendar/google/start
router.get('/google/start', async (req: any, res) => {
  // Store session state for callback
  const state = Buffer.from(JSON.stringify({
    uid: req.uid || 'anonymous',
    returnUrl: req.headers.referer || '/'
  })).toString('base64');
  
  const client = oauth2Client();
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

// GET /api/googleCalendar/google/callback
router.get('/google/callback', async (req: any, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect('/?calendar=error');
  }
  
  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const uid = stateData.uid;
    
    // Exchange code for tokens
    const client = oauth2Client();
    const { tokens } = await client.getToken(code as string);
    
    // Store refresh token
    await admin.firestore().doc(`users/${uid}/secrets/google`).set({
      refreshToken: tokens.refresh_token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Redirect back to app
    res.redirect('/?calendar=connected');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/?calendar=error');
  }
});

// GET /api/googleCalendar/events
router.get('/events', async (req: any, res): Promise<any> => {
  try {
    const uid = req.uid || 'demo-user';
    const client = await getClientFor(uid);
    if (!client) {
      return res.status(401).json({ error: 'not_connected' });
    }
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    
    // Time range based on query param
    const range = req.query['range'] || 'today';
    const now = new Date();
    let timeMin = now.toISOString();
    let timeMax;
    
    switch (range) {
      case 'today':
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        timeMin = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
        timeMax = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'week':
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        timeMax = weekEnd.toISOString();
        break;
      default:
        timeMax = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    }
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary,
      location: event.location,
      start: formatDateTime(event.start),
      end: formatDateTime(event.end),
      htmlLink: event.htmlLink
    }));
    
    res.json(events);
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'failed_to_list_events' });
  }
});

// POST /api/googleCalendar/create
router.post('/create', async (req: any, res): Promise<any> => {
  try {
    const uid = req.uid || 'demo-user';
    const client = await getClientFor(uid);
    if (!client) {
      return res.status(401).json({ error: 'not_connected' });
    }
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    const { summary, location, start, end, timeZone, privateKey } = req.body;
    
    // Create event with idempotency key
    const event = {
      summary,
      location,
      start: { dateTime: start, timeZone: timeZone || 'Europe/Berlin' },
      end: { dateTime: end, timeZone: timeZone || 'Europe/Berlin' },
      extendedProperties: {
        private: privateKey || {}
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });
    
    res.json({
      id: response.data.id,
      htmlLink: response.data.htmlLink,
      status: response.data.status
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'failed_to_create_event' });
  }
});

// Helper: Format date/time
function formatDateTime(dt: any) {
  if (!dt) return '';
  const date = new Date(dt.dateTime || dt.date);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export const googleCalendarRouter = router;