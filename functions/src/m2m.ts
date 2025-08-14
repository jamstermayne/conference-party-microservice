import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as ical from "node-ical";
import { Response } from "express";

// Helper: verify Firebase Auth (Bearer token)
async function ensureAuth(req: functions.https.Request) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new functions.https.HttpsError("unauthenticated","missing auth");
  const token = m[1];
  if (!token) throw new functions.https.HttpsError("unauthenticated","invalid token");
  const dec = await admin.auth().verifyIdToken(token);
  return dec.uid;
}

function ok(res: Response, data: any){ res.json({ ok: true, ...data }); }
function bad(res: Response, msg: string, code=400){ res.status(code).json({ ok: false, error: msg }); }

// Normalize ICS -> events
function normalizeEvents(cal: any, fromISO?: string, toISO?: string) {
  const from = fromISO ? new Date(fromISO) : new Date(Date.now() - 6*3600e3);
  const to   = toISO   ? new Date(toISO)   : new Date(Date.now() + 14*24*3600e3);
  const out: any[] = [];
  for (const k of Object.keys(cal)) {
    const e = cal[k] as any;
    if (!e || e.type !== "VEVENT") continue;
    const start = e.start ? new Date(e.start) : null;
    const end   = e.end   ? new Date(e.end)   : null;
    if (!start || !end) continue;
    if (end < from || start > to) continue;
    out.push({
      id: e.uid || k,
      title: e.summary || "Untitled",
      location: e.location || "",
      description: e.description || "",
      start: start.toISOString(),
      end: end.toISOString(),
      source: "m2m"
    });
  }
  // sort by start
  out.sort((a,b)=> a.start.localeCompare(b.start));
  return out;
}

export const m2mVerify = functions.https.onRequest(async (req, res) => {
  try {
    await ensureAuth(req);
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return bad(res as Response, "invalid url");
    const r = await fetch(url, { method: "GET", headers: { "accept": "text/calendar,*/*" } });
    if (!r.ok) return bad(res as Response, `fetch failed: ${r.status}`, r.status);
    const text = await r.text();
    // minimal sanity
    if (!/BEGIN:VCALENDAR/i.test(text)) return bad(res as Response, "not an ICS feed");
    const parsed = ical.sync.parseICS(text);
    const sample = normalizeEvents(parsed).slice(0, 3);
    ok(res as Response, { sample });
  } catch (e: any) { bad(res as Response, e.message || "verify failed", e.code === "unauthenticated" ? 401 : 400); }
});

export const m2mSubscribe = functions.https.onRequest(async (req, res) => {
  try {
    const uid = await ensureAuth(req);
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return bad(res as Response, "invalid url");
    await admin.firestore().collection("users").doc(uid)
      .collection("prefs").doc("m2m").set({ url, savedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    ok(res as Response, { saved: true });
  } catch (e: any) { bad(res as Response, e.message || "subscribe failed", e.code === "unauthenticated" ? 401 : 400); }
});

export const m2mEvents = functions.https.onRequest(async (req, res) => {
  try {
    const uid = await ensureAuth(req);
    const pref = await admin.firestore().collection("users").doc(uid).collection("prefs").doc("m2m").get();
    const data = pref.data();
    const url = pref.exists && data ? (data["url"] as string) : "";
    if (!url) return ok(res as Response, { events: [], connected: false });
    const from = (req.query["from"] as string|undefined);
    const to   = (req.query["to"] as string|undefined);
    const r = await fetch(url, { headers: { "accept": "text/calendar,*/*" } });
    if (!r.ok) return bad(res as Response, `fetch failed: ${r.status}`, r.status);
    const text = await r.text();
    const parsed = ical.sync.parseICS(text);
    const events = normalizeEvents(parsed, from, to);
    ok(res as Response, { events, connected: true });
  } catch (e: any) { bad(res as Response, e.message || "events failed", e.code === "unauthenticated" ? 401 : 400); }
});