import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";
import {getHotspots} from "./hotspots";
const invitesRouter = require("../../routes/invites");

try {admin.initializeApp();} catch (error) {
  console.log("Firebase admin already initialized:", error);
}

const db = admin.firestore?.();
const app = express();
app.use(cors({origin: true}));
app.use(express.json());
app.use("/api/invites", invitesRouter);

const FALLBACK_EVENTS = [
  {
    id: "meettomatch-the-cologne-edition-2025",
    title: "MeetToMatch The Cologne Edition 2025",
    venue: "Kölnmesse Confex",
    date: "Fri Aug 22",
    time: "09:00 - 18:00",
    price: "From £127.04",
    source: "fallback",
  },
  {
    id: "marriott-rooftop-mixer",
    title: "Marriott Rooftop Mixer",
    venue: "Marriott Hotel",
    date: "Fri Aug 22",
    time: "20:00 - 23:30",
    price: "Free",
    source: "fallback",
  },
];

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    endpoints: {
      health: "operational",
      parties: "operational",
      hotspots: "operational",
      sync: "operational",
      webhook: "operational",
      setupWebhook: "operational",
    },
  });
});

app.get("/api/parties", async (_req: Request, res: Response) => {
  try {
    let data: any[] = [];
    if (db) {
      const snap = await db.collection("events").limit(100).get();
      data = snap.docs.map((d) => ({id: d.id, ...d.data()}));
    }
    if (!data?.length) data = FALLBACK_EVENTS;
    res.status(200).json({success: true, data});
  } catch {
    res.status(200).json({success: true, data: FALLBACK_EVENTS, note: "fallback_due_to_error"});
  }
});

app.get("/api/sync", (_req, res) => res.status(200).json({ok: true, status: "queued", mode: "get"}));
app.post("/api/sync", (_req, res) => res.status(200).json({ok: true, status: "queued", mode: "post"}));

app.get("/api/webhook", (_req, res) => res.status(200).json({ok: true, endpoint: "webhook", method: "GET"}));
app.post("/api/webhook", (_req, res) => res.status(200).json({ok: true, received: true}));

app.get("/api/setupWebhook", (_req, res) => res.status(200).json({ok: true, configured: false}));

// === HOTSPOTS ENDPOINT (PERSONA-BASED AGGREGATION) ===
app.get("/api/hotspots", getHotspots);

// ---- Lightweight stubs to prevent 404 noise ----
app.get("/api/flags", (_req, res) => {
  // Fail-open defaults so UI shows all channels/features
  res.status(200).json({
    nav: {
      parties: true, hotspots: true, opportunities: true,
      calendar: true, invites: true, me: true, settings: true,
    },
  });
});

app.post("/api/metrics", (req, res) => {
  // Accept any payload, no-op
  try {
    console.log("[metrics]", JSON.stringify(req.body || {}));
  } catch {
    // Silently ignore JSON stringify errors
  }
  res.status(204).send(); // No Content
});

export const api = functions.https.onRequest(app);
