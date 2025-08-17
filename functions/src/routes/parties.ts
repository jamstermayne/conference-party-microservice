import { Router, Request, Response } from "express";
import { getPartiesFromFirestore, fetchLive } from "../services/parties-live";
import { runIngest } from "../jobs/ingest-parties";

const router = Router();

// Cache settings
let cachedParties: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/parties?conference=gamescom2025 - Get parties for a conference
 * First tries Firestore, falls back to legacy source if needed
 */
router.get("/", async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract and validate conference parameter
    const { conference } = req.query as { conference?: string };
    if (!conference) {
      return res.status(400).json({ 
        error: "conference required",
        message: "Please provide a conference parameter, e.g., ?conference=gamescom2025"
      });
    }
    
    // Log the conference being requested
    console.log(`[parties] Fetching parties for conference: ${conference}`);
    
    // Check cache first
    if (cachedParties && Date.now() - cacheTimestamp < CACHE_TTL) {
      console.log("[parties] Serving from cache");
      return res.json({
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
        data: firestoreParties
      });
    }
    
    // Fallback: Try to fetch live data directly
    console.log("[parties] No Firestore data, fetching live");
    
    try {
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
          data: liveParties
        });
      }
    } catch (fetchError) {
      console.log("[parties] Live fetch failed, falling back to demo data:", fetchError);
    }
    
    // Fallback to demo data with coordinates
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
        description: "The official opening ceremony",
        lat: 50.9473,
        lng: 6.9838,
        coordinates: { lat: 50.9473, lng: 6.9838 },
        address: "Messeplatz 1, 50679 Köln"
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
        description: "Professional game developers conference",
        lat: 50.9473,
        lng: 6.9838,
        coordinates: { lat: 50.9473, lng: 6.9838 },
        address: "Messeplatz 1, 50679 Köln"
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
        description: "Exclusive Xbox celebration",
        lat: 50.9620,
        lng: 6.9960,
        coordinates: { lat: 50.9620, lng: 6.9960 },
        address: "Auenweg 173, 51063 Köln"
      },
      {
        id: "unity-meetup-2025",
        title: "Unity Developer Meetup",
        venue: "Stadtgarten",
        date: "2025-08-18",
        time: "18:00",
        start: "2025-08-18T18:00:00",
        end: "2025-08-18T21:00:00",
        price: "Free",
        description: "Connect with Unity developers",
        lat: 50.9229,
        lng: 6.9302,
        coordinates: { lat: 50.9229, lng: 6.9302 },
        address: "Venloer Str. 40, 50672 Köln"
      },
      {
        id: "indie-showcase-2025",
        title: "Indie Games Showcase",
        venue: "Musical Dome",
        date: "2025-08-21",
        time: "14:00",
        start: "2025-08-21T14:00:00",
        end: "2025-08-21T18:00:00",
        price: "Free",
        description: "Discover amazing indie games",
        lat: 50.9513,
        lng: 6.9778,
        coordinates: { lat: 50.9513, lng: 6.9778 },
        address: "Goldgasse 1, 50668 Köln"
      }
    ];
    
    console.log("[parties] Using demo data fallback - v2");
    return res.json({
      data: demoParties
    });
    
  } catch (error) {
    console.error("[parties] Route error:", error);
    
    // Try to return cached data on error
    if (cachedParties) {
      return res.json({
        data: cachedParties
      });
    }
    
    return res.status(500).json({
      error: "internal",
      message: "Failed to fetch parties"
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