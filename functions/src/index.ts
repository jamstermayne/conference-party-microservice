import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';
import { createUGCEvent, getUGCEvents } from "./ugc";

initializeApp();

// Configuration
const CONFIG = {
  SHEETS_ID: '1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg',
  SHEETS_API_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
  SHEETS_RANGE: 'OCR_Gamescom_2025_ALL_EVENTS_COMPLETE_FINAL',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_BATCH_SIZE: 500,
  WEBHOOK_URL: 'https://googledrivewebhook-x2u6rwndvq-uc.a.run.app'
};

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '3600'
};

// Utility functions
function createDeterministicId(name: string, date: string, time: string, location: string): string {
  const combined = `${name}-${date}-${time}-${location}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return combined.substring(0, 100);
}

function setCorsHeaders(res: Response): void {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

function setCacheHeaders(res: Response, maxAge: number = 300): void {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
  res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
  res.setHeader('Last-Modified', new Date().toUTCString());
}

function isValidCacheEntry(entry: any): boolean {
  return entry && (Date.now() - entry.timestamp) < CONFIG.CACHE_TTL;
}

function validateRequest(req: Request, requiredFields: string[] = []): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  requiredFields.forEach(field => {
    if (req.method === 'POST' && !req.body[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

async function getGoogleSheetsData(): Promise<any[]> {
  const cacheKey = 'sheets-data';
  const cachedData = cache.get(cacheKey);
  
  if (isValidCacheEntry(cachedData)) {
    console.log('Returning cached sheets data');
    return cachedData!.data; // Fixed: Added ! to assert non-null
  }
  
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const authClient = await auth.getClient();
    const response = await authClient.request({
      url: `${CONFIG.SHEETS_API_URL}/${CONFIG.SHEETS_ID}/values/${CONFIG.SHEETS_RANGE}`,
      method: 'GET'
    });
    
    const sheetData = response.data as any;
    
    if (!sheetData.values || sheetData.values.length < 2) {
      throw new Error('No data found in sheet');
    }
    
    // Convert sheet data to objects
    const headers = sheetData.values[0];
    const rows = sheetData.values.slice(1);
    
    const parties = rows.map((row: any[]) => {
      const party: any = {};
      headers.forEach((header: string, index: number) => {
        party[header] = row[index] || '';
      });
      return party;
    });
    
    // Cache the data
    cache.set(cacheKey, { data: parties, timestamp: Date.now() });
    console.log(`Cached ${parties.length} parties from Google Sheets`);
    
    return parties;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    // Return cached data even if expired, better than nothing
    const expiredCache = cache.get(cacheKey);
    return expiredCache?.data || [];
  }
}

async function syncPartiesToFirestore(parties: any[]): Promise<void> {
  const db = getFirestore();
  const batches: any[] = [];
  
  for (let i = 0; i < parties.length; i += CONFIG.MAX_BATCH_SIZE) {
    const batch = db.batch();
    const chunk = parties.slice(i, i + CONFIG.MAX_BATCH_SIZE);
    
    chunk.forEach((party: any) => {
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
      }, { merge: true });
    });
    
    batches.push(batch);
  }
  
  // Execute all batches
  await Promise.all(batches.map(batch => batch.commit()));
}

// CONSOLIDATED API FUNCTION
export const api = onRequest({
  invoker: "public",
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "512MiB"
}, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check request size limit (1MB)
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      setCorsHeaders(res);
      res.status(413).json({
        success: false,
        error: 'Request payload too large. Maximum size is 1MB.'
      });
      return;
    }
    
    // Set CORS headers and cache headers for all responses
    setCorsHeaders(res);
    setCacheHeaders(res);
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.status(200).send();
      return;
    }
    
    const path = req.path.replace('/api', '');
    console.log(`API Request: ${req.method} ${path}`);
    
    switch (path) {
      case '/health':
        res.json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "3.0.0",
          environment: process.env.NODE_ENV || "production",
          responseTime: `${Date.now() - startTime}ms`
        });
        break;
        
      case '/parties':
        await handlePartiesFeed(req, res, startTime);
        break;
        
      case '/swipe':
        await handleSwipeAction(req, res); // Fixed: Renamed to avoid duplicate
        break;
        
      case '/calendar/oauth/start':
        await handleCalendarOAuth(req, res);
        break;
        
      case '/upload':
        await handleUpload(req, res);
        break;
        
      case '/sync':
        await handleManualSync(req, res);
        break;
        
      case '/admin/clear':
        await handleClearParties(req, res);
        break;
        
      case '/ugc/events/create':
        if (req.method === 'POST') {
          try {
            // Basic JSON validation
            if (!req.body || typeof req.body !== 'object') {
              res.status(400).json({ success: false, error: 'Invalid JSON payload' });
              return;
            }
            await createUGCEvent(req, res);
          } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            res.status(400).json({ success: false, error: 'Malformed JSON request' });
          }
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        break;
        
      case '/ugc/events':
        if (req.method === 'GET') {
          await getUGCEvents(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
        break;
        
      default:
        res.status(404).json({
          success: false,
          error: 'Endpoint not found',
          availableEndpoints: ['/health', '/parties', '/swipe', '/sync', '/upload', '/ugc/events/create', '/ugc/events']
        });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    setCorsHeaders(res);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      res.status(400).json({
        success: false,
        error: 'Invalid JSON format in request body',
        responseTime: `${Date.now() - startTime}ms`
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        responseTime: `${Date.now() - startTime}ms`
      });
    }
  }
});

// Handler functions
async function handlePartiesFeed(req: Request, res: Response, startTime: number): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    const includeUGC = req.query.includeUGC !== 'false'; // Default to true
    
    const db = getFirestore();
    
    // Get curated parties
    const partiesRef = db.collection('parties').where('active', '==', true);
    const partiesSnapshot = await partiesRef.get();
    
    // Get UGC events if requested
    let ugcEvents: any[] = [];
    if (includeUGC) {
      const ugcRef = db.collection('events').where('status', '==', 'active').where('source', '==', 'ugc');
      const ugcSnapshot = await ugcRef.get();
      ugcEvents = ugcSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Map UGC fields to standard party fields for compatibility
          'Event Name': data.name,
          'Date': data.date,
          'Start Time': data.startTime,
          'End Time': data.endTime || '',
          'Address': data.venue || data.address,
          'Category': data.category,
          'Description': data.description,
          'Hosts': data.hosts || data.creator,
          'isUGC': true, // Flag to identify UGC events
          'creator': data.creator,
          active: true
        };
      });
    }
    
    // Combine and sort all events
    const allParties = [
      ...partiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isUGC: false
      })),
      ...ugcEvents
    ].sort((a, b) => {
      // Sort by date, then by start time
      const dateA = a.Date || a.date || '';
      const dateB = b.Date || b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      
      const timeA = a['Start Time'] || a.startTime || '';
      const timeB = b['Start Time'] || b.startTime || '';
      return timeA.localeCompare(timeB);
    });
    
    // Apply pagination
    const paginatedParties = allParties.slice(offset, offset + limit);
    
    // Determine source and count UGC events
    let source = "mixed";
    const ugcCount = allParties.filter(p => p.isUGC).length;
    const curatedCount = allParties.length - ugcCount;
    
    if (allParties.length > 0) {
      if (ugcCount === 0) {
        const sources = [...new Set(allParties.map(p => p.source))];
        source = sources.includes('gamescom-sheets') ? 'gamescom-sheets' : sources[0] || 'firestore';
      } else if (curatedCount === 0) {
        source = 'ugc';
      }
    } else {
      source = "empty";
    }
    
    res.json({
      success: true,
      data: paginatedParties,
      meta: {
        count: paginatedParties.length,
        total: allParties.length,
        ugcCount,
        curatedCount,
        page,
        limit,
        hasMore: offset + limit < allParties.length,
        loadTime: `${Date.now() - startTime}ms`,
        swipeSession: `session_${Date.now()}${Math.random()}`,
        source,
        lastUpdated: allParties.length > 0 ? (allParties[0].uploadedAt || allParties[0].createdAt) : null
      }
    });
  } catch (error) {
    // Graceful degradation - return empty array
    res.json({
      success: true,
      data: [],
      meta: {
        count: 0,
        total: 0,
        loadTime: `${Date.now() - startTime}ms`,
        source: "error",
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

async function handleSwipeAction(req: Request, res: Response): Promise<void> { // Fixed: Renamed function
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  const { isValid, errors } = validateRequest(req, ['partyId', 'action']);
  if (!isValid) {
    res.status(400).json({ success: false, errors });
    return;
  }
  
  try {
    const { partyId, action, timestamp, source } = req.body;
    
    // Store swipe data
    const db = getFirestore();
    const swipeRef = db.collection('swipes').doc();
    await swipeRef.set({
      partyId,
      action,
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'pwa-app',
      sessionId: `session_${Date.now()}`,
      userAgent: req.headers['user-agent'] || 'unknown'
    });
    
    res.json({
      success: true,
      swipe: {
        id: swipeRef.id,
        partyId,
        action,
        timestamp: new Date().toISOString()
      },
      message: action === 'like' ? 'Party saved to interested!' : 'Thanks for the feedback',
      nextAction: action === 'like' ? 'calendar_sync_available' : null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Swipe tracking failed'
    });
  }
}

async function handleCalendarOAuth(req: Request, res: Response): Promise<void> {
  // TODO: Implement proper Google Calendar OAuth
  res.json({
    success: true,
    authUrl: "https://accounts.google.com/oauth/authorize?mock=true",
    message: "OAuth flow started - TODO: implement real flow",
    status: "development"
  });
}

async function handleUpload(req: Request, res: Response): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  // TODO: Implement file upload with busboy
  res.json({
    success: false,
    error: "File upload temporarily disabled - use Google Sheets sync instead",
    alternative: "Use /sync endpoint to sync from Google Sheets"
  });
}

async function handleManualSync(req: Request, res: Response): Promise<void> {
  try {
    const parties = await getGoogleSheetsData();
    
    if (parties.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No data found in Google Sheets'
      });
      return;
    }
    
    await syncPartiesToFirestore(parties);
    
    // Clear cache to force fresh data on next request
    cache.delete('sheets-data');
    
    res.json({
      success: true,
      message: `${parties.length} parties synced from Google Sheets`,
      count: parties.length,
      source: 'gamescom-sheets',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
}

async function handleClearParties(req: Request, res: Response): Promise<void> {
  try {
    const db = getFirestore();
    const partiesQuery = db.collection('parties');
    const snapshot = await partiesQuery.get();
    
    const batches: any[] = [];
    for (let i = 0; i < snapshot.docs.length; i += CONFIG.MAX_BATCH_SIZE) {
      const batch = db.batch();
      const chunk = snapshot.docs.slice(i, i + CONFIG.MAX_BATCH_SIZE);
      
      chunk.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batches.push(batch);
    }
    
    await Promise.all(batches.map(batch => batch.commit()));
    
    // Clear cache
    cache.clear();
    
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
}

// WEBHOOK FUNCTION (separate for Google Sheets notifications)
export const webhook = onRequest({
  invoker: "public",
  maxInstances: 5,
  timeoutSeconds: 30
}, async (req: Request, res: Response) => {
  try {
    console.log('Webhook received:', req.headers);
    
    const resourceState = req.headers['x-goog-resource-state'];
    
    if (resourceState === 'update') {
      console.log('Google Sheets updated, syncing...');
      
      const parties = await getGoogleSheetsData();
      
      if (parties.length > 0) {
        await syncPartiesToFirestore(parties);
        console.log(`Webhook synced ${parties.length} parties`);
        
        res.status(200).json({
          success: true,
          message: `${parties.length} parties synced via webhook`,
          count: parties.length,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(200).json({
          success: false,
          message: 'No data found in sheets'
        });
      }
    } else {
      res.status(200).json({
        success: true,
        message: 'Webhook received but no action needed'
      });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to prevent Google from retrying
    res.status(200).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    });
  }
});

// WEBHOOK SETUP FUNCTION (one-time use)
export const setupWebhook = onRequest({ invoker: "public" }, async (req: Request, res: Response) => {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    
    const authClient = await auth.getClient();
    
    const watchRequest = {
      url: `https://www.googleapis.com/drive/v3/files/${CONFIG.SHEETS_ID}/watch`,
      method: 'POST',
      data: {
        id: `gamescom-sheets-${Date.now()}`,
        type: 'web_hook',
        address: CONFIG.WEBHOOK_URL
      }
    };
    
    const response = await authClient.request(watchRequest);
    
    res.json({
      success: true,
      message: 'Webhook setup successful',
      data: response.data,
      webhookUrl: CONFIG.WEBHOOK_URL
    });
    
  } catch (error) {
    console.error('Webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook setup failed'
    });
  }
});

// Legacy function aliases for backward compatibility
export const health = api;
export const partiesFeed = api;
export const handleSwipe = api; // This now points to api, which routes to handleSwipeAction
export const syncFromGoogleDrive = api;
export const clearAllParties = api;
export const calendarOAuthStart = api;
export const googleDriveWebhook = webhook;
export const setupDriveWebhook = setupWebhook;