import { Router, Request, Response } from "express";
import { getPartiesFromFirestore, fetchLive } from "../services/parties-live";
import { runIngest } from "../jobs/ingest-parties";
import { fetchFromGoogleSheets, mapSheetRowToParty } from "../services/sheets-client";

const router = Router();

// Cache settings
let cachedParties: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - good balance for stability

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
    
    // Try to fetch from Google Sheets using service account
    console.log("[parties] No Firestore data, fetching from Google Sheets");
    
    try {
      const sheetRows = await fetchFromGoogleSheets();
      
      if (sheetRows.length > 0) {
        // Map rows to party objects
        const parties = sheetRows
          .map((row, index) => mapSheetRowToParty(row, index))
          .filter(party => party !== null);
        
        console.log(`[parties] Mapped ${parties.length} valid parties from Google Sheets`);
        
        if (parties.length > 0) {
          // Update cache
          cachedParties = parties;
          cacheTimestamp = Date.now();
          
          return res.json({
            data: parties
          });
        }
      }
    } catch (sheetsError) {
      console.log("[parties] Google Sheets fetch failed:", sheetsError);
      
      // Try the old fetchLive method as fallback
      try {
        const liveParties = await fetchLive();
        
        if (liveParties.length > 0) {
          cachedParties = liveParties;
          cacheTimestamp = Date.now();
          
          return res.json({
            data: liveParties
          });
        }
      } catch (fetchError) {
        console.log("[parties] Live fetch also failed:", fetchError);
      }
    }
    
    // Fallback to full Gamescom 2025 data (all 67 events)
    const gamescomData = require('../data/gamescom-2025-all-67-events.json');
    
    // Add coordinates to match expected format
    const fullParties = gamescomData.map((event: any) => ({
      ...event,
      coordinates: { lat: event.lat, lng: event.lng },
      address: event.venue + ", Cologne, Germany"
    }));
    
    console.log(`[parties] Using Gamescom 2025 data - ${fullParties.length} events`);
    
    // Update cache with full data
    cachedParties = fullParties;
    cacheTimestamp = Date.now();
    
    return res.json({
      data: fullParties
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