import * as admin from "firebase-admin";
import { fetchLive, isValidParty } from "../services/parties-live";

// Initialize Firestore
const db = admin.firestore();

/**
 * Ingests party data from live source into Firestore
 * Uses composite key: {conference}:{externalId} for document IDs
 */
export async function runIngest(): Promise<{ 
  success: boolean; 
  ingested: number; 
  errors: number;
  message: string;
}> {
  const startTime = Date.now();
  let ingested = 0;
  let errors = 0;
  
  try {
    console.log("[ingest-parties] Starting ingestion job");
    
    // Fetch live data
    const parties = await fetchLive();
    console.log(`[ingest-parties] Fetched ${parties.length} parties to ingest`);
    
    if (parties.length === 0) {
      return {
        success: true,
        ingested: 0,
        errors: 0,
        message: "No parties to ingest"
      };
    }
    
    // Batch write for better performance
    const batch = db.batch();
    const batchSize = 500; // Firestore batch limit
    let batchCount = 0;
    
    for (const party of parties) {
      try {
        // Validate party data
        if (!isValidParty(party)) {
          console.warn("[ingest-parties] Skipping invalid party:", party);
          errors++;
          continue;
        }
        
        // Create document ID from conference and external ID
        const docId = `${party.conference}:${party.externalId}`;
        const docRef = db.collection('parties').doc(docId);
        
        // Upsert party data
        batch.set(docRef, {
          ...party,
          lastUpdated: new Date().toISOString(),
          _docId: docId // Store the doc ID for reference
        }, { merge: true });
        
        ingested++;
        batchCount++;
        
        // Commit batch if we hit the limit
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`[ingest-parties] Committed batch of ${batchCount} parties`);
          batchCount = 0;
        }
        
      } catch (error) {
        console.error("[ingest-parties] Error processing party:", error, party);
        errors++;
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`[ingest-parties] Committed final batch of ${batchCount} parties`);
    }
    
    // Update ingestion metadata
    await db.collection('metadata').doc('parties_ingestion').set({
      lastRun: new Date().toISOString(),
      lastRunDuration: Date.now() - startTime,
      partiesIngested: ingested,
      errors: errors,
      success: true
    });
    
    const duration = Date.now() - startTime;
    const message = `Ingested ${ingested} parties in ${duration}ms (${errors} errors)`;
    console.log(`[ingest-parties] ${message}`);
    
    return {
      success: true,
      ingested,
      errors,
      message
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[ingest-parties] Job failed:", errorMsg);
    
    // Log failure to metadata
    try {
      await db.collection('metadata').doc('parties_ingestion').set({
        lastRun: new Date().toISOString(),
        lastRunDuration: Date.now() - startTime,
        partiesIngested: ingested,
        errors: errors,
        success: false,
        lastError: errorMsg
      });
    } catch (metaError) {
      console.error("[ingest-parties] Failed to update metadata:", metaError);
    }
    
    return {
      success: false,
      ingested,
      errors: errors + 1,
      message: `Job failed: ${errorMsg}`
    };
  }
}

/**
 * Manual trigger endpoint for testing
 */
export async function triggerIngest(_req: any, res: any): Promise<void> {
  try {
    // Optional: Add auth check here
    // if (!req.headers.authorization?.includes('secret-key')) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }
    
    const result = await runIngest();
    res.json(result);
  } catch (error) {
    console.error("[ingest-parties] Trigger error:", error);
    res.status(500).json({ 
      error: 'Ingestion failed', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}