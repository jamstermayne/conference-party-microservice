import {onRequest} from "firebase-functions/v2/https";
// import {onSchedule} from "firebase-functions/v2/scheduler"; // Temporarily disabled - Cloud Scheduler API not enabled
import * as admin from "firebase-admin";
import express, {Request, Response} from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import {canonicalHost} from "./middleware/canonicalHost";
import {performanceMonitor, cacheMiddleware, corsCache} from "./middleware/performance";
import {getHotspots} from "./hotspots";
import googleCalendarRouter from "./googleCalendar/router";
import m2mRouter from "./routes/m2m-enhanced";
import mtmRoutes from "./integrations/mtm/routes";
import partiesRouter from "./routes/parties";
import invitesRouter from "./routes/invites";
import invitesEnhancedRouter from "./routes/invites-enhanced";
import adminRouter from "./routes/admin";
// import { runIngest } from "./jobs/ingest-parties"; // Temporarily disabled with scheduled function

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

// Optimize CORS - restrict to production domain for better security and performance
app.use(cors({ 
  origin: ['https://conference-party-app.web.app', 'http://localhost:3000'],
  credentials: false,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Enable compression for all responses (reduces payload size by ~70%)
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Compress everything except server-sent events
    const contentType = res.getHeader('Content-Type');
    if (typeof contentType === 'string' && contentType.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Request logging - tiny format for minimal overhead
app.use(morgan('tiny', {
  skip: (req) => req.path === '/api/health', // Skip health check logs
  stream: {
    write: (message) => console.log(message.trim())
  }
}));

app.use(corsCache); // Additional CORS preflight caching
app.use(cookieParser());
app.use(express.json());

// Apply performance monitoring and caching
app.use(performanceMonitor);
app.use('/api', cacheMiddleware);

// Apply canonical host redirect to all /api routes
app.use('/api', canonicalHost);

// Apply authentication middleware to parse auth tokens
app.use(async (req: any, _res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = { uid: decoded.uid };
    } catch {}
  }
  next();
});

// Use enhanced invites router for new functionality
app.use("/api/invites", invitesEnhancedRouter);
// Keep old invites router as fallback at different path if needed
app.use("/api/invites-legacy", invitesRouter);
app.use("/api/admin", adminRouter);
app.use("/api", googleCalendarRouter);
app.use("/api/parties", partiesRouter);

// Party days endpoint - returns available days with events
app.get("/api/party-days", async (req, res) => {
  try {
    const { conference } = req.query as { conference?: string };
    if (!conference) {
      return res.status(400).json({ error: "conference parameter required" });
    }
    
    // For now, return static days for Gamescom 2025
    const days = [
      { date: "2025-08-20", label: "Wed, Aug 20" },
      { date: "2025-08-21", label: "Thu, Aug 21" },
      { date: "2025-08-22", label: "Fri, Aug 22" },
      { date: "2025-08-23", label: "Sat, Aug 23" },
      { date: "2025-08-24", label: "Sun, Aug 24" }
    ];
    
    return res.json(days);
  } catch (error) {
    console.error("[party-days] Error:", error);
    return res.status(500).json({ error: "Failed to fetch party days" });
  }
});

// Safety alias: redirect /parties to /api/parties
app.use("/parties", (req, res) => {
  const queryString = req.originalUrl.split('?')[1];
  const redirectUrl = queryString ? `/api/parties?${queryString}` : '/api/parties';
  res.redirect(301, redirectUrl);
});

// Google API endpoints are handled by googleCalendarRouter at /api/googleCalendar/*
// Removed duplicate endpoints to avoid conflicts

// MeetToMatch (ICS) - Router handles all /api/m2m/* endpoints
app.use("/api/m2m", m2mRouter);

// MeetToMatch Integrations - New enhanced router at /api/integrations/mtm/*
app.use("/api/integrations/mtm", mtmRoutes);

// M2M endpoints are handled by m2mRouter - removed duplicates

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

// === SHORT INVITE LINKS ===
// Redirect /i/:code to the invite page with token
app.get("/i/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    // Try to resolve the code to a token
    const resolveUrl = `https://${req.headers.host}/api/invites/public/resolve/${code}`;
    const resolveResponse = await fetch(resolveUrl);
    
    if (!resolveResponse.ok) {
      // If code not found or expired, redirect to home with error
      return res.redirect('/?error=invalid_invite');
    }
    
    const { token } = await resolveResponse.json() as { token: string };
    
    // Redirect to the invite page with the token
    return res.redirect(`/invite/${token}`);
    
  } catch (error) {
    console.error('[short-link] Error:', error);
    return res.redirect('/?error=invite_error');
  }
});

// === QR CODE GENERATION ===
app.get("/api/qr", async (req, res): Promise<any> => {
  try {
    const { text } = req.query as { text?: string };
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter required' });
    }
    
    // For now, return a placeholder or use a simple QR library
    // In production, you'd use a library like 'qrcode' package
    // npm install qrcode
    // const QRCode = require('qrcode');
    // const dataUrl = await QRCode.toDataURL(text);
    
    // Placeholder response for now
    return res.json({
      dataUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      text,
      note: 'QR generation pending library installation'
    });
    
  } catch (error) {
    console.error('[qr] Error:', error);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

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

import { MEETTOMATCH_CRYPTO_KEY } from './integrations/mtm/function-config';
import { defineSecret } from 'firebase-functions/params';

// Define Google OAuth secrets for MTM mirroring
const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_CLIENT_SECRET');
const GOOGLE_SHEETS_API_KEY = defineSecret('GOOGLE_SHEETS_API_KEY');

// Use v2 functions with public invoker for unauthenticated access
export const apiFn = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10,
  secrets: [MEETTOMATCH_CRYPTO_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SHEETS_API_KEY],
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

// Export MTM scheduler (if Cloud Scheduler is enabled)
export { ingestMeetToMatch } from './schedulers/mtm';
