import * as functions from "firebase-functions";
import { google } from "googleapis";
import * as admin from "firebase-admin";

// Helper to get user ID from request
function userId(req: any): string {
  // Simple stub - in production, validate Firebase Auth token
  return req.body?.uid || "demo-user";
}

// OAuth client factory
function oauthFor(uid: string) {
  const CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] || '';
  const CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'] || '';
  const REDIRECT_URI = process.env['OAUTH_REDIRECT'] || 'https://us-central1-conference-party-app.cloudfunctions.net/api/google/callback';
  
  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  
  const setCreds = async () => {
    try {
      const snap = await admin.firestore().doc(`users/${uid}/secrets/google`).get();
      const data = snap.data();
      if (data?.['refreshToken']) {
        client.setCredentials({ refresh_token: data['refreshToken'] });
      }
    } catch (e) {
      // No credentials stored
    }
  };
  
  return { client, setCreds };
}

export const googleStatus = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const snap = await admin.firestore().doc(`users/${uid}/secrets/google`).get();
    const hasToken = !!snap.data()?.['refreshToken'];
    res.json({ connected: hasToken });
  } catch (e) {
    res.json({ connected: false });
  }
});

export const googleStart = functions.https.onRequest(async (req, res) => {
  const { client } = oauthFor('anonymous');
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/contacts.readonly'
  ];
  
  const state = Buffer.from(JSON.stringify({
    uid: userId(req),
    returnUrl: req.headers.referer || '/'
  })).toString('base64');
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

export const googleCallback = functions.https.onRequest(async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect('/?auth=error');
  }
  
  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const uid = stateData.uid;
    const { client } = oauthFor(uid);
    
    const { tokens } = await client.getToken(code as string);
    
    await admin.firestore().doc(`users/${uid}/secrets/google`).set({
      refreshToken: tokens.refresh_token,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.redirect('/?auth=connected');
  } catch (e) {
    res.redirect('/?auth=error');
  }
});

export const googleCalendarEvents = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const { client, setCreds } = oauthFor(uid);
    await setCreds();
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    res.json(response.data.items || []);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export const googleCalendarCreate = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const { client, setCreds } = oauthFor(uid);
    await setCreds();
    
    const calendar = google.calendar({ version: 'v3', auth: client });
    const event = {
      summary: req.body.title,
      location: req.body.location,
      description: req.body.description,
      start: {
        dateTime: req.body.start,
        timeZone: req.body.timeZone || 'Europe/Berlin'
      },
      end: {
        dateTime: req.body.end,
        timeZone: req.body.timeZone || 'Europe/Berlin'
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });
    
    res.json({ ok: true, id: response.data.id, link: response.data.htmlLink });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export const googlePeopleSearch = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const { client, setCreds } = oauthFor(uid);
    await setCreds();
    
    const people = google.people({ version: 'v1', auth: client });
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 100,
      personFields: 'names,emailAddresses'
    });
    
    res.json(response.data.connections || []);
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export const googleGmailDraft = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const { client, setCreds } = oauthFor(uid);
    await setCreds();
    
    const gmail = google.gmail({ version: 'v1', auth: client });
    const { to, subject, body } = req.body || {};
    
    if (!to || !subject) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing to or subject');
    }
    
    const raw = Buffer.from(
      `To: ${to}\nSubject: ${subject}\n\n${body || ''}`
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: { raw }
      }
    });
    
    res.json({ ok: true, id: draft.data.id });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Gmail: create a Draft with an .ics attachment (for Outlook/Microsoft users)
export const googleGmailDraftIcs = functions.https.onRequest(async (req, res) => {
  try {
    const uid = userId(req);
    const { client, setCreds } = oauthFor(uid);
    await setCreds();
    
    const gmail = google.gmail({ version: "v1", auth: client });
    const { to, subject, html, ics, filename = "invite.ics" } = req.body || {};
    
    if (!to || !ics) {
      throw new functions.https.HttpsError("invalid-argument", "Missing 'to' or 'ics'");
    }

    const boundary = "gcpmime_" + Math.random().toString(36).slice(2);
    const rawMime =
`To: ${to}
Subject: ${subject || "Calendar invite"}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/html; charset=UTF-8

${html || "<p>Calendar invite attached (.ics).</p>"}

--${boundary}
Content-Type: text/calendar; method=PUBLISH; charset=UTF-8; name="${filename}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${filename}"

${Buffer.from(ics, "utf8").toString("base64")}
--${boundary}--`;

    const raw = Buffer.from(rawMime)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw } }
    });
    
    res.json({ ok: true, id: draft.data.id });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});