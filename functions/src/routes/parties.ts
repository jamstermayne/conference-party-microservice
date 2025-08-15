import { Router, Request, Response } from "express";
import { getPartiesFromFirestore, fetchLive } from "../services/parties-live";
import { runIngest } from "../jobs/ingest-parties";

const router = Router();

// Cache settings
let cachedParties: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/parties - Get all parties
 * First tries Firestore, falls back to legacy source if needed
 */
router.get("/", async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Check cache first
    if (cachedParties && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log("[parties] Serving from cache");
      return res.json({
        source: "cache",
        count: cachedParties.length,
        data: cachedParties
      });
    }
    
    // Try to get from Firestore (ingested data)
    const firestoreParties = await getPartiesFromFirestore();
    
    if (firestoreParties.length > 0) {
      console.log(`[parties] Serving ${firestoreParties.length} parties from Firestore`);
      
      // Update cache
      cachedParties = firestoreParties;
      cacheTimestamp = Date.now();
      
      return res.json({
        source: "firestore",
        count: firestoreParties.length,
        data: firestoreParties
      });
    }
    
    // Fallback: Try to fetch live data directly
    console.log("[parties] No Firestore data, fetching live");
    const liveParties = await fetchLive();
    
    if (liveParties.length > 0) {
      // Update cache
      cachedParties = liveParties;
      cacheTimestamp = Date.now();
      
      // Trigger background ingestion for next time
      runIngest().catch(err => 
        console.error("[parties] Background ingest failed:", err)
      );
      
      return res.json({
        source: "live",
        count: liveParties.length,
        data: liveParties
      });
    }
    
    // Fallback to demo data
    const demoParties = [
      {
        id: "gamescom-opening-2025",
        title: "Gamescom Opening Night Live",
        venue: "Koelnmesse",
        date: "2025-08-19",
        time: "20:00",
        start: "2025-08-19T20:00:00",
        end: "2025-08-19T22:00:00",
        price: "Free with ticket",
        description: "The official opening ceremony"
      },
      {
        id: "devcom-2025",
        title: "Devcom Developer Conference",
        venue: "Koelnmesse",
        date: "2025-08-17",
        time: "09:00",
        start: "2025-08-17T09:00:00",
        end: "2025-08-17T18:00:00",
        price: "From €399",
        description: "Professional game developers conference"
      },
      {
        id: "xbox-party-2025",
        title: "Xbox @ Gamescom Party",
        venue: "Bootshaus",
        date: "2025-08-20",
        time: "20:00",
        start: "2025-08-20T20:00:00",
        end: "2025-08-21T02:00:00",
        price: "Invite only",
        description: "Exclusive Xbox celebration"
      },
      {
        id: "unity-meetup-2025",
        title: "Unity Developer Meetup",
        venue: "Friesenplatz",
        date: "2025-08-18",
        time: "18:00",
        start: "2025-08-18T18:00:00",
        end: "2025-08-18T21:00:00",
        price: "Free",
        description: "Connect with Unity developers"
      },
      {
        id: "indie-showcase-2025",
        title: "Indie Games Showcase",
        venue: "Gamescom City Hub",
        date: "2025-08-21",
        time: "14:00",
        start: "2025-08-21T14:00:00",
        end: "2025-08-21T18:00:00",
        price: "Free",
        description: "Discover amazing indie games"
      }
    ];
    
    console.log("[parties] Using demo data fallback - v2");
    return res.json({
      source: "demo",
      count: demoParties.length,
      data: demoParties,
      message: "Using demo data (API temporarily unavailable)"
    });
    
  } catch (error) {
    console.error("[parties] Route error:", error);
    
    // Try to return cached data on error
    if (cachedParties) {
      return res.json({
        source: "cache-fallback",
        count: cachedParties.length,
        data: cachedParties,
        warning: "Using cached data due to error"
      });
    }
    
    return res.status(500).json({
      error: "Failed to fetch parties",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/parties/ingest - Manually trigger ingestion
 * Useful for testing or forced updates
 */
router.post("/ingest", async (req: Request, res: Response): Promise<Response> => {
  try {
    // Optional: Add authentication check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes("Bearer")) {
      // For now, allow unauthenticated access for testing
      // return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log("[parties] Manual ingestion triggered");
    const result = await runIngest();
    
    // Clear cache after ingestion
    cachedParties = null;
    cacheTimestamp = 0;
    
    return res.json({
      ...result,
      message: "Ingestion completed"
    });
    
  } catch (error) {
    console.error("[parties] Ingestion route error:", error);
    return res.status(500).json({
      error: "Ingestion failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/parties/status - Check ingestion status
 */
router.get("/status", async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Get metadata from Firestore
    const admin = await import("firebase-admin");
    const db = admin.firestore();
    const metaDoc = await db.collection('metadata').doc('parties_ingestion').get();
    
    if (!metaDoc.exists) {
      return res.json({
        status: "never_run",
        message: "Ingestion has never been run"
      });
    }
    
    const metadata = metaDoc.data();
    const lastRun = metadata?.['lastRun'] ? new Date(metadata['lastRun']) : null;
    const timeSinceRun = lastRun ? Date.now() - lastRun.getTime() : null;
    
    return res.json({
      status: metadata?.['success'] ? "success" : "failed",
      lastRun: metadata?.['lastRun'],
      timeSinceRun: timeSinceRun ? `${Math.round(timeSinceRun / 1000)}s ago` : null,
      lastRunDuration: metadata?.['lastRunDuration'] ? `${metadata['lastRunDuration']}ms` : null,
      partiesIngested: metadata?.['partiesIngested'] || 0,
      errors: metadata?.['errors'] || 0,
      lastError: metadata?.['lastError'],
      cacheStatus: cachedParties ? `${cachedParties.length} parties cached` : "no cache"
    });
    
  } catch (error) {
    console.error("[parties] Status route error:", error);
    return res.status(500).json({
      error: "Failed to get status",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;