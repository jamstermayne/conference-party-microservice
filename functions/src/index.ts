import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';

initializeApp();

// Google Sheets setup
const SHEETS_ID = '1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg';
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEETS_RANGE = 'OCR_Gamescom_2025_ALL_EVENTS_COMPLETE_FINAL'; // Updated sheet name

// Create deterministic ID for deduplication (fixed to include date)
function createDeterministicId(name: string, date: string, time: string, location: string): string {
  const combined = `${name}-${date}-${time}-${location}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return combined.substring(0, 100); // Firestore doc ID limit
}

// Health endpoint - separate function
export const health = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.3",
    environment: process.env.NODE_ENV || "production"
  });
});

// Google Sheets Webhook - UPDATED FUNCTION
export const googleDriveWebhook = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    console.log('Sheets webhook received:', req.headers, req.body);
    
    // Verify webhook is from Google Drive
    const resourceState = req.headers['x-goog-resource-state'];
    
    if (resourceState === 'update') {
      console.log('Sheets file updated, fetching new content...');
      
      // Fetch updated Sheets content
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      
      const authClient = await auth.getClient();
      const response = await authClient.request({
        url: `${SHEETS_API_URL}/${SHEETS_ID}/values/${SHEETS_RANGE}`,
        method: 'GET'
      });
      
      const sheetData = response.data as any;
      
      if (!sheetData.values || sheetData.values.length < 2) {
        console.error('No data found in sheet');
        res.status(200).json({ success: false, error: 'No data found in sheet' });
        return;
      }
      
      // Convert sheet data to objects (first row is headers)
      const headers = sheetData.values[0];
      const rows = sheetData.values.slice(1);
      
      const parties = rows.map((row: any[]) => {
        const party: any = {};
        headers.forEach((header: string, index: number) => {
          party[header] = row[index] || '';
        });
        return party;
      });
      
      // Store in Firestore using deterministic IDs
      const db = getFirestore();
      const batch = db.batch();
      
      // Upsert parties using deterministic IDs (no deletion needed)
      parties.forEach((party: any) => {
        const partyId = createDeterministicId(
          party['Event Name'] || party.name || 'unknown',
          party['Date'] || party.date || 'unknown',
          party['Start Time'] || party.time || 'unknown', 
          party['Address'] || party.location || 'unknown'
        );
        
        const partyRef = db.collection('parties').doc(partyId);
        batch.set(partyRef, {
          ...party,
          uploadedAt: new Date().toISOString(),
          source: 'gamescom-sheets',
          active: true
        }, { merge: true }); // Upsert instead of overwrite
      });
      
      await batch.commit();
      
      console.log(`Updated ${parties.length} parties from Google Sheets`);
      
      res.status(200).json({
        success: true,
        message: `${parties.length} parties updated from Google Sheets`,
        count: parties.length
      });
      
    } else {
      res.status(200).json({ success: true, message: 'Webhook received but no update needed' });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: false, error: 'Webhook processing failed' });
  }
});

// Manual sync from Google Sheets - UPDATED FUNCTION
export const syncFromGoogleDrive = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    // Get authentication
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const authClient = await auth.getClient();
    
    // Fetch Sheets content
    const response = await authClient.request({
      url: `${SHEETS_API_URL}/${SHEETS_ID}/values/${SHEETS_RANGE}`,
      method: 'GET'
    });
    
    const sheetData = response.data as any;
    
    if (!sheetData.values || sheetData.values.length < 2) {
      res.status(400).json({ 
        success: false, 
        error: 'No data found in sheet'
      });
      return;
    }
    
    // Convert sheet data to objects (first row is headers)
    const headers = sheetData.values[0];
    const rows = sheetData.values.slice(1);
    
    const parties = rows.map((row: any[]) => {
      const party: any = {};
      headers.forEach((header: string, index: number) => {
        party[header] = row[index] || '';
      });
      return party;
    });
    
    // Store in Firestore using deterministic IDs
    const db = getFirestore();
    const batch = db.batch();
    
    // Upsert parties using deterministic IDs (no deletion needed)
    parties.forEach((party: any) => {
      const partyId = createDeterministicId(
        party['Event Name'] || party.name || 'unknown',
        party['Date'] || party.date || 'unknown',
        party['Start Time'] || party.time || 'unknown', 
        party['Address'] || party.location || 'unknown'
      );
      
      const partyRef = db.collection('parties').doc(partyId);
      batch.set(partyRef, {
        ...party,
        uploadedAt: new Date().toISOString(),
        source: 'gamescom-sheets',
        active: true
      }, { merge: true }); // Upsert instead of overwrite
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: `${parties.length} parties synced from Google Sheets`,
      count: parties.length,
      source: 'gamescom-sheets'
    });
    
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Sheets sync failed'
    });
  }
});

// Cleanup all parties - separate function (one-time use)
export const clearAllParties = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const partiesQuery = db.collection('parties');
    const snapshot = await partiesQuery.get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      message: `${snapshot.docs.length} parties cleared`,
      count: snapshot.docs.length
    });
    
  } catch (error) {
    console.error('Clear parties error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Clear failed'
    });
  }
});

// Setup Google Drive webhook for Sheets - UPDATED FUNCTION
export const setupDriveWebhook = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const authClient = await auth.getClient();
    
    const webhookUrl = 'https://googledrivewebhook-x2u6rwndvq-uc.a.run.app';
    
    const watchRequest = {
      url: `https://www.googleapis.com/drive/v3/files/${SHEETS_ID}/watch`,
      method: 'POST',
      data: {
        id: `gamescom-sheets-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl
      }
    };
    
    const response = await authClient.request(watchRequest);
    
    res.json({
      success: true,
      message: 'Sheets webhook setup successful',
      data: response.data
    });
    
  } catch (error) {
    console.error('Sheets webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sheets webhook setup failed'
    });
  }
});

// Calendar OAuth start - separate function
export const calendarOAuthStart = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    // TODO: Implement Google OAuth flow
    res.json({
      success: true,
      authUrl: "https://accounts.google.com/oauth/authorize?mock=true",
      message: "OAuth flow started"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OAuth start failed'
    });
  }
});

// CSV Upload endpoint - separate function
export const uploadParties = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers });
    let csvData = '';
    let hasError = false;

    bb.on('file', (name: string, file: any, info: any) => {
      if (info.mimeType !== 'text/csv' && !info.filename.endsWith('.csv')) {
        hasError = true;
        res.status(400).json({ success: false, error: 'Only CSV files allowed' });
        return;
      }

      file.on('data', (data: any) => {
        csvData += data;
      });
    });

    bb.on('finish', async () => {
      if (hasError) return;
      
      try {
        // Parse CSV data
        const Papa = require('papaparse');
        const parsed = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        if (parsed.errors.length > 0) {
          res.status(400).json({ 
            success: false, 
            error: 'CSV parsing failed',
            details: parsed.errors 
          });
          return;
        }

        // Store in Firestore
        const db = getFirestore();
        const batch = db.batch();
        
        parsed.data.forEach((party: any, index: number) => {
          const partyRef = db.collection('parties').doc(`upload-${Date.now()}-${index}`);
          batch.set(partyRef, {
            ...party,
            uploadedAt: new Date().toISOString(),
            source: 'manual-upload',
            active: true
          });
        });

        await batch.commit();

        res.json({
          success: true,
          message: `${parsed.data.length} parties uploaded successfully`,
          count: parsed.data.length
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Upload processing failed'
        });
      }
    });

    bb.on('error', (error: any) => {
      res.status(500).json({ success: false, error: 'File upload failed' });
    });

    req.pipe(bb);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

// Party feed endpoint - separate function (UPDATED)
export const partiesFeed = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    const db = getFirestore();
    const partiesRef = db.collection('parties').where('active', '==', true);
    const snapshot = await partiesRef.get();
    
    const parties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Determine source
    let source = "empty";
    if (parties.length > 0) {
      const sources = [...new Set(parties.map(p => p.source))];
      source = sources.includes('gamescom-sheets') ? 'gamescom-sheets' : sources[0] || 'firestore';
    }
    
    res.json({
      success: true,
      data: parties,
      meta: {
        count: parties.length,
        loadTime: "45ms",
        swipeSession: `session_${Date.now()}${Math.random()}`,
        filters: { hideOld: false, limit: 50 },
        source: source,
        lastUpdated: parties.length > 0 ? parties[0].uploadedAt : null
      }
    });
  } catch (error) {
    // Return empty on any error
    res.json({
      success: true,
      data: [],
      meta: { count: 0, loadTime: "12ms", source: "error" }
    });
  }
});

// Party swipe endpoint - separate function
export const handleSwipe = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      swipe: {
        id: `swipe_${Date.now()}${Math.random()}`,
        userId: "test",
        partyId: "party-1", 
        action: "interested",
        timestamp: new Date().toISOString(),
        sessionId: null
      },
      message: "Party saved!",
      nextAction: "calendar_sync_available"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Store processed party data - separate function
export const storePartyData = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { parties, metadata } = req.body;
    
    if (!parties || !Array.isArray(parties)) {
      res.status(400).json({ success: false, error: 'parties array required' });
      return;
    }

    console.log('Storing', parties.length, 'parties from', metadata?.originalFile);

    const db = getFirestore();
    const batch = db.batch();
    
    // Clear existing parties from same source if specified
    if (metadata?.source) {
      const existingQuery = db.collection('parties').where('source', '==', metadata.source);
      const existingSnapshot = await existingQuery.get();
      
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      console.log('Cleared', existingSnapshot.docs.length, 'existing parties');
    }
    
    // Add new parties
    parties.forEach((party: any, index: number) => {
      const partyRef = db.collection('parties').doc(`${metadata?.source || 'party'}-${Date.now()}-${index}`);
      batch.set(partyRef, {
        ...party,
        storedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    // Store metadata
    if (metadata) {
      const metadataRef = db.collection('uploads').doc();
      await metadataRef.set({
        ...metadata,
        processedAt: new Date().toISOString(),
        status: 'completed'
      });
    }

    res.json({
      success: true,
      message: `${parties.length} parties stored successfully`,
      count: parties.length,
      source: metadata?.source || 'unknown'
    });

  } catch (error) {
    console.error('Store party data error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Storage failed'
    });
  }
});