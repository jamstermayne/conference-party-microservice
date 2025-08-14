import type { Request, Response, NextFunction } from "express";
import express from "express";
import * as admin from "firebase-admin";

// Tiny ICS parse: DTSTART, DTEND, SUMMARY, LOCATION from VEVENTs
function parseICS(ics: string) {
  const events: any[] = [];
  const lines = ics.replace(/\r/g, "").split("\n");
  let cur: any = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") { if (cur?.DTSTART && cur?.SUMMARY) events.push(cur); cur = null; }
    else if (cur) {
      const m = line.match(/^([A-Z;=0-9]+):(.+)$/);
      if (!m) continue;
      const parts = m[1]?.split(";");
      if (!parts) continue;
      const key = parts[0];
      const val = m[2];
      if (key && ["DTSTART","DTEND","SUMMARY","LOCATION","UID","DESCRIPTION"].includes(key)) cur[key] = val;
    }
  }

  const toISO = (v?: string) => {
    if (!v) return null;
    // Handle YYYYMMDD or YYYYMMDDTHHMMSSZ
    if (/^\d{8}$/.test(v)) {
      const y = v.slice(0,4), m = v.slice(4,6), d = v.slice(6,8);
      return `${y}-${m}-${d}T00:00:00Z`;
    }
    if (/^\d{8}T\d{6}Z$/.test(v)) {
      const y = v.slice(0,4), m = v.slice(4,6), d = v.slice(6,8);
      const H = v.slice(9,11), M = v.slice(11,13), S = v.slice(13,15);
      return `${y}-${m}-${d}T${H}:${M}:${S}Z`;
    }
    return null;
  };

  return events.map(e => ({
    id: e.UID || e.SUMMARY + (e.DTSTART||""),
    title: e.SUMMARY,
    location: e.LOCATION || "",
    start: toISO(e.DTSTART),
    end: toISO(e.DTEND),
    source: "m2m"
  })).filter(ev => ev.start && ev.title);
}

async function ensureAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
    if (!id) {
      res.status(401).json({ ok:false, code:"missing_auth" });
      return;
    }
    const decoded = await admin.auth().verifyIdToken(id);
    (req as any).uid = decoded.uid;
    next();
  } catch (e:any) {
    res.status(401).json({ ok:false, code:"invalid_auth" });
  }
}

type CacheMeta = { etag?: string; lastModified?: string; fetchedAt?: number; };
async function fetchICS(url: string, cache?: CacheMeta) {
  const headers: any = {};
  if (cache?.etag) headers["If-None-Match"] = cache.etag;
  if (cache?.lastModified) headers["If-Modified-Since"] = cache.lastModified;

  const resp = await fetch(url, { headers });
  if (resp.status === 304) return { ok:true, notModified:true };
  if (!resp.ok) return { ok:false, status:resp.status };
  const text = await resp.text();
  const etag = resp.headers.get("etag") || undefined;
  const lm = resp.headers.get("last-modified") || undefined;
  return { ok:true, text, etag, lastModified: lm };
}

const router = express.Router();

// POST /api/m2m/verify  { url }
router.post("/verify", ensureAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!(url && /^https?:\/\//i.test(url) && /\.ics(\?|$)/i.test(url))) {
    return res.status(400).json({ ok:false, code:"invalid_url" });
  }
  try {
    const r = await fetchICS(url);
    if (!r.ok || !r.text) return res.status(400).json({ ok:false, code:"fetch_failed", status:r.status });
    const events = parseICS(r.text);
    return res.json({ ok:true, sampleCount: events.length });
  } catch (e:any) {
    return res.status(400).json({ ok:false, code:"verify_error" });
  }
});

// POST /api/m2m/subscribe  { url }
router.post("/subscribe", ensureAuth, async (req, res) => {
  const uid = (req as any).uid as string;
  const { url } = req.body || {};
  if (!(url && /^https?:\/\//i.test(url) && /\.ics(\?|$)/i.test(url))) {
    return res.status(400).json({ ok:false, code:"invalid_url" });
  }
  try {
    const r = await fetchICS(url);
    if (!r.ok || !r.text) return res.status(400).json({ ok:false, code:"fetch_failed", status:r.status });
    const events = parseICS(r.text);
    const meta: CacheMeta = { etag: (r as any).etag, lastModified: (r as any).lastModified, fetchedAt: Date.now() };
    await admin.firestore().doc(`users/${uid}/integrations/m2m`).set({
      icsUrl: url, verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      cache: meta, sample: Math.min(events.length, 50)
    }, { merge:true });
    return res.json({ ok:true, sampleCount: events.length });
  } catch (e:any) {
    return res.status(400).json({ ok:false, code:"subscribe_error" });
  }
});

// POST /api/m2m/refresh
router.post("/refresh", ensureAuth, async (req, res) => {
  const uid = (req as any).uid;
  const doc = await admin.firestore().doc(`users/${uid}/integrations/m2m`).get();
  const data = doc.data() as any;
  if (!data?.icsUrl) return res.status(400).json({ ok:false, code:"not_connected" });

  // cache throttle 10 min
  if (data.cache?.fetchedAt && Date.now() - data.cache.fetchedAt < 10*60*1000) {
    return res.json({ ok:true, stale:false, throttled:true });
  }
  const r = await fetchICS(data.icsUrl, data.cache);
  if (!r.ok) return res.status(400).json({ ok:false, code:"refresh_failed", status:r.status });

  if ((r as any).notModified) {
    await admin.firestore().doc(`users/${uid}/integrations/m2m`).set({
      cache: { ...data.cache, fetchedAt: Date.now() }
    }, { merge:true });
    return res.json({ ok:true, notModified:true });
  }

  const events = parseICS((r as any).text);
  const meta: CacheMeta = { etag:(r as any).etag, lastModified:(r as any).lastModified, fetchedAt: Date.now() };
  await admin.firestore().doc(`users/${uid}/integrations/m2m`).set({
    cache: meta, lastEventCount: events.length, lastRefreshed: admin.firestore.FieldValue.serverTimestamp()
  }, { merge:true });

  // store a compact cache for UI (optional)
  await admin.firestore().collection(`users/${uid}/cache`).doc("m2m-events").set({ events }, { merge:true });

  return res.json({ ok:true, count: events.length });
});

// POST /api/m2m/disconnect
router.post("/disconnect", ensureAuth, async (req, res) => {
  const uid = (req as any).uid;
  await admin.firestore().doc(`users/${uid}/integrations/m2m`).set({
    icsUrl: admin.firestore.FieldValue.delete(),
    cache: admin.firestore.FieldValue.delete(),
    verifiedAt: admin.firestore.FieldValue.delete()
  }, { merge:true });
  await admin.firestore().collection(`users/${uid}/cache`).doc("m2m-events").delete().catch(()=>{});
  return res.json({ ok:true });
});

// GET /api/m2m/events  (returns latest parsed list — refresh first if older than 10 min)
router.get("/events", ensureAuth, async (req, res) => {
  const uid = (req as any).uid;
  const integRef = admin.firestore().doc(`users/${uid}/integrations/m2m`);
  const integ = (await integRef.get()).data() as any;
  if (!integ?.icsUrl) return res.json({ ok:true, connected:false, events:[] });

  let cacheDoc = await admin.firestore().collection(`users/${uid}/cache`).doc("m2m-events").get();
  let events = (cacheDoc.data() as any)?.events || [];
  const recent = integ.cache?.fetchedAt && (Date.now() - integ.cache.fetchedAt < 10*60*1000);

  if (!recent) {
    const r = await fetchICS(integ.icsUrl, integ.cache);
    if (r.ok && (r as any).text) {
      events = parseICS((r as any).text);
      const meta: CacheMeta = { etag:(r as any).etag, lastModified:(r as any).lastModified, fetchedAt: Date.now() };
      await integRef.set({ cache: meta, lastEventCount: events.length }, { merge:true });
      await admin.firestore().collection(`users/${uid}/cache`).doc("m2m-events").set({ events }, { merge:true });
    }
  }
  return res.json({ ok:true, connected:true, events });
});

export default router;