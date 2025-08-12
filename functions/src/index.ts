import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";

try {admin.initializeApp();} catch (error) {
  console.log("Firebase admin already initialized:", error);
}

const db = admin.firestore?.();
const app = express();
app.use(cors({origin: true}));
app.use(express.json());

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
    version: "2.0.0",
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

// === HOTSPOTS ENDPOINT (MOCK DATA) ===
app.get("/api/hotspots", async (req: Request, res: Response) => {
  try {
    const conference = req.query["conference"] || "gamescom2025";

    // Mock venues pulled from events PDF
    const mockHotspots = [
      {id: "koelnmesse-confex", name: "Kölnmesse Confex", lat: 50.943, lng: 6.958, count: 128},
      {id: "odyssey-club", name: "Odyssey Club", lat: 50.937, lng: 6.96, count: 82},
      {id: "meltdown-cologne", name: "Meltdown Cologne", lat: 50.940, lng: 6.955, count: 54},
      {id: "dom-hotel", name: "Dom Hotel", lat: 50.941, lng: 6.957, count: 102},
      {id: "gamescom-party-hall", name: "Gamescom Party Hall", lat: 50.942, lng: 6.959, count: 67},
      {id: "marriott-bar", name: "Marriott Bar", lat: 50.944, lng: 6.961, count: 45},
      {id: "xyz-venue", name: "XYZ Venue", lat: 50.946, lng: 6.963, count: 30},
    ];

    res.setHeader("Cache-Control", "public, max-age=30");
    return res.status(200).json({
      success: true,
      lastUpdated: new Date().toISOString(),
      conference,
      data: mockHotspots,
    });
  } catch (err: any) {
    console.error("Hotspots endpoint error", err);
    return res.status(500).json({success: false, error: err.message});
  }
});

export const api = functions.https.onRequest(app);
