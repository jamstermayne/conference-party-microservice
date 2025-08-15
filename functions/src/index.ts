import {onRequest} from "firebase-functions/v2/https";
// import {onSchedule} from "firebase-functions/v2/scheduler"; // Temporarily disabled - Cloud Scheduler API not enabled
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {canonicalHost} from "./middleware/canonicalHost";
import {getHotspots} from "./hotspots";
import googleCalendarRouter from "./googleCalendar/router";
import {
  googleStatus, googleStart, googleCallback,
  googleCalendarEvents, googleCalendarCreate,
  googlePeopleSearch, googleGmailDraft, googleGmailDraftIcs
} from "./google";
import { m2mVerify, m2mSubscribe, m2mEvents } from "./m2m";
import m2mRouter from "./routes/m2m";
import partiesRouter from "./routes/parties";
// import { runIngest } from "./jobs/ingest-parties"; // Temporarily disabled with scheduled function
// eslint-disable-next-line @typescript-eslint/no-var-requires
const invitesRouter = require("../../routes/invites");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const adminRouter = require("../../routes/admin");

// EventData interface - kept for reference
// interface EventData {
//   id: string;
//   title: string;
//   venue: string;
//   date: string;
//   time: string;
//   price: string;
//   source: string;
// }

try {admin.initializeApp();} catch (error) {
  // Firebase admin already initialized - this is expected in some environments
}

// const db = admin.firestore?.(); // Not used after refactoring to use routes
const app = express();
app.use(cors({origin: true, credentials: true}));
app.use(cookieParser());
app.use(express.json());

// Apply canonical host redirect to all /api routes
app.use('/api', canonicalHost);

app.use("/api/invites", invitesRouter);
app.use("/api/admin", adminRouter);
app.use("/api", googleCalendarRouter);
app.use("/api/parties", partiesRouter);

// Additional Google API endpoints
app.get("/api/google/status", (req, res) => googleStatus(req as any, res as any));
app.get("/api/google/start", (req, res) => googleStart(req as any, res as any));
app.get("/api/google/callback", (req, res) => googleCallback(req as any, res as any));
app.get("/api/google/calendar/events", (req, res) => googleCalendarEvents(req as any, res as any));
app.post("/api/google/calendar/create", (req, res) => googleCalendarCreate(req as any, res as any));
app.get("/api/google/people/search", (req, res) => googlePeopleSearch(req as any, res as any));
app.post("/api/google/gmail/draft", (req, res) => googleGmailDraft(req as any, res as any));
app.post("/api/google/gmail/draft-ics", (req, res) => googleGmailDraftIcs(req as any, res as any));

// MeetToMatch (ICS) - Router version
app.use("/api/m2m", m2mRouter);

// Legacy M2M endpoints (kept for compatibility)
app.post("/api/m2m/verify", (req, res) => m2mVerify(req as any, res as any));
app.post("/api/m2m/subscribe", (req, res) => m2mSubscribe(req as any, res as any));
app.get("/api/m2m/events", (req, res) => m2mEvents(req as any, res as any));

/* const FALLBACK_EVENTS: EventData[] = [ // Not used after refactoring to use routes
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
]; */

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

// Parties endpoint is now handled by partiesRouter
// app.get("/api/parties", async (_req: Request, res: Response) => {
//   try {
//     let data: EventData[] = [];
//     if (db) {
//       const snap = await db.collection("events").limit(100).get();
//       data = snap.docs.map((d) => ({id: d.id, ...d.data()} as EventData));
//     }
//     if (!data?.length) data = FALLBACK_EVENTS;
//     res.status(200).json({success: true, data});
//   } catch (error) {
//     res.status(200).json({success: true, data: FALLBACK_EVENTS, note: "fallback_due_to_error"});
//   }
// });

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

// Use v2 functions with public invoker for unauthenticated access
export const apiFn = onRequest({
  cors: true,
  invoker: "public",
  maxInstances: 10,
  // secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], // Temporarily disabled - secrets not configured
}, app);

// Export the Express app for testing
export const api = app;

// Scheduled function to ingest parties every 15 minutes
// TEMPORARILY DISABLED: Cloud Scheduler API not enabled in project
// export const ingestParties = onSchedule("every 15 minutes", async (_context): Promise<void> => {
//   console.log("[ingestParties] Scheduled ingestion started");
//   
//   try {
//     const result = await runIngest();
//     console.log("[ingestParties] Scheduled ingestion completed:", result);
//     // Don't return value, just log
//   } catch (error) {
//     console.error("[ingestParties] Scheduled ingestion failed:", error);
//     throw error; // Re-throw to trigger retry
//   }
// });
