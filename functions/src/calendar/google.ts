import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';

try {
  if (!admin.apps || !admin.apps.length) {
    admin.initializeApp();
  }
} catch (error) {
  // Already initialized
}

const OAUTH_REDIRECT = process.env['OAUTH_REDIRECT'] || 'https://us-central1-conference-party-app.cloudfunctions.net/api/calendar/google/callback';
const CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] || '';
const CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'] || '';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar.readonly'];

const app = express();
app.use(cors({ origin: true }));

// --- auth middleware (expects Firebase ID token in Authorization: Bearer) ---
async function requireAuth(req:any,res:any,next:any){
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'missing_auth' });
  }
}

function oauth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, OAUTH_REDIRECT);
}

async function getClientFor(uid:string): Promise<any> {
  const snap = await admin.firestore().doc(`users/${uid}/secrets/google`).get();
  const data = snap.data();
  if (!data?.['refreshToken']) return null;
  const client = oauth2Client();
  client.setCredentials({ refresh_token: data['refreshToken'] });
  return client;
}

// --- 1) start: returns Google OAuth URL ---
app.get('/calendar/google/start', requireAuth, async (_req,res)=>{
  const client = oauth2Client();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.json({ url });
});

// --- 2) callback: exchanges code, stores refresh token ---
app.get('/calendar/google/callback', async (req,res): Promise<any> =>{
  try {
    const { code, state } = req.query as { code?:string, state?:string };
    if(!code) return res.status(400).send('Missing code');
    const client = oauth2Client();
    const { tokens } = await client.getToken(code);
    const idToken = state || ''; // optionally pass Firebase ID token in state
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    if (!tokens.refresh_token) {
      return res.status(400).send('No refresh token returned. Remove the app from Google account & reconnect.');
    }
    await admin.firestore().doc(`users/${uid}/secrets/google`).set({
      provider: 'google', refreshToken: tokens.refresh_token, updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.send('<script>window.close();</script>Connected. You can close this tab.');
  } catch (e:any) {
    res.status(500).send(e.message || 'error');
  }
});

// --- helper: map Google event to our shape ---
function mapEvt(e:any){
  return {
    provider: 'google',
    providerId: e.id,
    title: e.summary || '(No title)',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || '',
    description: e.description || ''
  };
}

// --- 3) list events in range ---
app.get('/calendar/events', requireAuth, async (req,res): Promise<any> =>{
  const { from, to } = req.query as { from?:string; to?:string };
  const uid = (req as any).uid;
  const client = await getClientFor(uid);
  if(!client) return res.json({ connected:false, events:[] });

  const cal = google.calendar({ version:'v3', auth: client });
  const r = await cal.events.list({
    calendarId: 'primary',
    timeMin: new Date(from || new Date().toISOString()).toISOString(),
    timeMax: new Date(to || new Date(Date.now()+7*864e5).toISOString()).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500
  });
  res.json({ connected:true, events: (r.data.items||[]).map(mapEvt) });
});

// --- 4) create party as event ---
app.post('/calendar/create', requireAuth, express.json(), async (req,res): Promise<any> =>{
  const { partyId, title, start, end, location, description } = req.body || {};
  const uid = (req as any).uid;
  const client = await getClientFor(uid);
  if(!client) return res.status(412).json({ error:'not_connected' });

  // idempotency: store mapping users/{uid}/calendar/party:{partyId}
  const mapRef = admin.firestore().doc(`users/${uid}/calendar/party:${partyId}`);
  const existing = await mapRef.get();
  if (existing.exists) return res.json(existing.data());

  const cal = google.calendar({ version:'v3', auth: client });
  const ev = await cal.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title, location, description,
      start: { dateTime: start },
      end:   { dateTime: end   },
      source: { title: 'velocity.ai', url: 'https://conference-party-app.web.app/#/parties' }
    }
  });

  const saved = { provider:'google', providerId: ev.data.id, partyId, createdAt: Date.now() };
  await mapRef.set(saved);
  res.json(saved);
});

// --- 5) delete/unsync ---
app.post('/calendar/delete', requireAuth, express.json(), async (req,res): Promise<any> =>{
  const { partyId } = req.body || {};
  const uid = (req as any).uid;
  const client = await getClientFor(uid);
  if(!client) return res.status(412).json({ error:'not_connected' });

  const mapRef = admin.firestore().doc(`users/${uid}/calendar/party:${partyId}`);
  const m = await mapRef.get();
  if(!m.exists) return res.json({ ok:true, noop:true });

  const { providerId } = m.data() as any;
  const cal = google.calendar({ version:'v3', auth: client });
  await cal.events.delete({ calendarId:'primary', eventId: providerId });
  await mapRef.delete();
  res.json({ ok:true });
});

export const api = functions.https.onRequest(app);