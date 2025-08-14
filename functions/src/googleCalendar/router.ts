import { Router } from 'express';
import { google } from 'googleapis';
import { ensureSession, saveTokens, loadTokens, clearTokens } from '../lib/session';
import { createState, consumeState } from '../lib/oauthState';

const router = Router();

function baseUrl(req: any) {
  const proto = (req.get('x-forwarded-proto') || 'https').toLowerCase();
  const host  = (req.get('x-forwarded-host') || req.get('host')).toLowerCase();
  return `${proto}://${host}`;
}

function oauthClient() {
  const clientId     = process.env['GOOGLE_CLIENT_ID']!;
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']!;
  return new google.auth.OAuth2(clientId, clientSecret);
}

async function getAuthenticatedClient(sid: string) {
  const tokens = await loadTokens(sid);
  if (!tokens) return null;
  
  const client = oauthClient();
  client.setCredentials(tokens);
  
  // Auto-refresh if needed
  if (tokens['expiry_date'] && Date.now() >= tokens['expiry_date']) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await saveTokens(sid, credentials);
      client.setCredentials(credentials);
    } catch (err) {
      console.error('[gcal] Token refresh failed:', err);
      return null;
    }
  }
  
  return client;
}

// ---- status
router.get('/googleCalendar/status', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.json({ connected: false });
    }
    
    const client = await getAuthenticatedClient(sid);
    res.json({ connected: !!client });
  } catch (e) {
    console.error('[gcal] Status check error:', e);
    res.json({ connected: false });
  }
});

router.get('/googleCalendar/google/start', async (req: any, res: any) => {
  const state = await createState(); // one-time, stored server-side
  const redirect_uri = `${baseUrl(req)}/api/googleCalendar/google/callback`;

  const client = oauthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    redirect_uri,
  });

  // no CSRF cookie needed anymore
  res.redirect(url);
});

router.get('/googleCalendar/google/callback', async (req: any, res: any) => {
  const returnedState = String(req.query.state || '');
  const code          = String(req.query.code || '');
  const error         = req.query.error;

  // Handle user denying access
  if (error) {
    return res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authorization Cancelled</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    .error-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2d3748;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    p {
      color: #718096;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">❌</div>
    <h1>Authorization Cancelled</h1>
    <p>You can close this window and try again.</p>
  </div>
  <script>
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({
          type: 'gcal-auth',
          ok: false,
          error: 'cancelled'
        }, location.origin);
        setTimeout(() => window.close(), 1500);
      } else {
        setTimeout(() => window.location.href = '/', 1500);
      }
    } catch (e) {
      setTimeout(() => window.location.href = '/', 2000);
    }
  </script>
</body>
</html>`);
  }

  // strict server-side check
  const ok = await consumeState(returnedState);
  if (!ok) {
    return res
      .status(400)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Security Error</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    .error-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2d3748;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    p {
      color: #718096;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">⚠️</div>
    <h1>Security Check Failed</h1>
    <p>Please try connecting again from the app.</p>
  </div>
  <script>
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({
          type: 'gcal-auth',
          ok: false,
          error: 'csrf_failed'
        }, location.origin);
        setTimeout(() => window.close(), 2000);
      } else {
        setTimeout(() => window.location.href = '/', 2000);
      }
    } catch (e) {
      setTimeout(() => window.location.href = '/', 2000);
    }
  </script>
</body>
</html>`);
  }

  const redirect_uri = `${baseUrl(req)}/api/googleCalendar/google/callback`;
  const client = oauthClient();
  const { tokens } = await client.getToken({ code, redirect_uri });

  // Get user info and persist tokens
  const sid = ensureSession(req, res);
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();
  
  await saveTokens(sid, {
    ...tokens,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture
  });

  // Return HTML with postMessage for popup flow
  res
    .status(200)
    .set('Content-Type', 'text/html; charset=utf-8')
    .send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Connected</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2d3748;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    p {
      color: #718096;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1>Google Calendar Connected!</h1>
    <p>You can close this window and return to the app.</p>
  </div>
  <script>
    // Notify parent window if this was opened as a popup
    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage({
          type: 'gcal-auth',
          ok: true,
          email: ${JSON.stringify(userInfo.email || null)}
        }, location.origin);
        // Auto-close after a short delay
        setTimeout(() => window.close(), 1500);
      } else {
        // If not a popup, redirect to calendar view
        setTimeout(() => {
          window.location.href = '${baseUrl(req)}/#calendar';
        }, 1500);
      }
    } catch (e) {
      console.error('PostMessage failed:', e);
      // Fallback to redirect
      setTimeout(() => {
        window.location.href = '${baseUrl(req)}/#calendar';
      }, 2000);
    }
  </script>
</body>
</html>`);
});

// ---- list events
router.get('/googleCalendar/events', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.status(401).json({ error: 'No session' });
    }

    const client = await getAuthenticatedClient(sid);
    if (!client) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const calendar = google.calendar({ version: 'v3', auth: client });
    
    // Time range
    const range = req.query.range || 'week';
    const now = new Date();
    let timeMin = now.toISOString();
    let timeMax;

    switch (range) {
      case 'today':
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        timeMax = endOfDay.toISOString();
        break;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        timeMin = tomorrow.toISOString();
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        timeMax = endOfTomorrow.toISOString();
        break;
      case 'week':
      default:
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        timeMax = weekEnd.toISOString();
        break;
    }

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = (response.data.items || []).map(event => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description,
      location: event.location,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      htmlLink: event.htmlLink,
      attendees: event.attendees?.length || 0,
      status: event.status
    }));

    res.json({ events, count: events.length });
  } catch (err) {
    console.error('[gcal] List events error:', err);
    res.status(500).json({ error: 'Failed to list events' });
  }
});

// ---- create event
router.post('/googleCalendar/create', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.status(401).json({ error: 'No session' });
    }

    const client = await getAuthenticatedClient(sid);
    if (!client) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const calendar = google.calendar({ version: 'v3', auth: client });
    const { summary, description, location, start, end, attendees, timeZone } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: summary, start, end' });
    }

    const event: any = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: timeZone || 'Europe/Berlin'
      },
      end: {
        dateTime: end,
        timeZone: timeZone || 'Europe/Berlin'
      }
    };

    if (attendees && Array.isArray(attendees)) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all'
    });

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink
    });
  } catch (err) {
    console.error('[gcal] Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ---- disconnect
router.post('/googleCalendar/disconnect', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.status(400).json({ error: 'No session' });
    }

    await clearTokens(sid);
    res.json({ success: true, message: 'Calendar disconnected' });
  } catch (err) {
    console.error('[gcal] Disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ---- user info
router.get('/googleCalendar/user', async (req: any, res: any) => {
  try {
    const sid = req.cookies?.sid;
    if (!sid) {
      return res.status(401).json({ error: 'No session' });
    }

    const tokens = await loadTokens(sid);
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      email: tokens['email'],
      name: tokens['name'],
      picture: tokens['picture']
    });
  } catch (err) {
    console.error('[gcal] Get user error:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;