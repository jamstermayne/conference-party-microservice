import * as admin from "firebase-admin";

// Source URL for live party data (API key will be appended from secret)
const SPREADSHEET_ID = "1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg";
const SHEET_RANGE = "Sheet1!A2:ZZ1000";

// Build URL - API key is optional since we're using service account
function getSourceUrl(): string {
  // Try API key first, then fall back to no key (service account auth)
  const apiKey = process.env['GOOGLE_SHEETS_API_KEY'];
  if (apiKey) {
    return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}?key=${apiKey}`;
  }
  // No API key - will use service account authentication
  console.log("[parties-live] Using service account authentication");
  return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_RANGE}`;
}

// Initialize Firestore lazily
function getDb() {
  return admin.firestore();
}

/**
 * Normalized party structure for consistent data handling
 */
export interface NormalizedParty {
  conference: string;      // e.g., "gamescom2025"
  externalId: string;      // unique ID from source
  title: string;
  venue: string;
  date: string;           // ISO date string
  time: string;           // HH:MM format
  price: string;          // e.g., "Free", "$20"
  source: string;         // e.g., "sheets", "m2m"
  description?: string;
  link?: string;
  capacity?: number;
  tags?: string[];
  lastUpdated: string;    // ISO timestamp
}

/**
 * Validates if an object is a valid NormalizedParty
 */
export function isValidParty(data: any): data is NormalizedParty {
  if (!data || typeof data !== 'object') return false;
  
  // Required fields
  if (!data.conference || typeof data.conference !== 'string') return false;
  if (!data.externalId || typeof data.externalId !== 'string') return false;
  if (!data.title || typeof data.title !== 'string') return false;
  if (!data.venue || typeof data.venue !== 'string') return false;
  if (!data.date || typeof data.date !== 'string') return false;
  if (!data.time || typeof data.time !== 'string') return false;
  if (!data.price || typeof data.price !== 'string') return false;
  if (!data.source || typeof data.source !== 'string') return false;
  if (!data.lastUpdated || typeof data.lastUpdated !== 'string') return false;
  
  // Optional fields type check
  if (data.description && typeof data.description !== 'string') return false;
  if (data.link && typeof data.link !== 'string') return false;
  if (data.capacity && typeof data.capacity !== 'number') return false;
  if (data.tags && !Array.isArray(data.tags)) return false;
  
  return true;
}

/**
 * Maps raw sheet row to NormalizedParty
 */
function mapSheetRowToParty(row: any[], index: number): NormalizedParty | null {
  try {
    // Expected columns from Google Sheets
    // [0: Title, 1: Venue, 2: Date, 3: Time, 4: Price, 5: Description, 6: Link, 7: Tags]
    if (!row || row.length < 5) return null;
    
    const title = String(row[0] || '').trim();
    const venue = String(row[1] || '').trim();
    const dateStr = String(row[2] || '').trim();
    const time = String(row[3] || '').trim();
    const price = String(row[4] || '').trim();
    
    // Skip invalid rows
    if (!title || !venue || !dateStr || !time) return null;
    
    // Parse date (assume format like "Aug 21" or "2025-08-21")
    let isoDate = dateStr;
    if (!dateStr.includes('-')) {
      // Convert "Aug 21" to ISO format
      const year = new Date().getFullYear();
      const parsed = new Date(`${dateStr} ${year}`);
      if (!isNaN(parsed.getTime())) {
        isoDate = parsed.toISOString().split('T')[0] || dateStr;
      } else {
        // If parsing fails, use a fallback date
        isoDate = new Date().toISOString().split('T')[0] || dateStr;
      }
    }
    
    const party: NormalizedParty = {
      conference: "gamescom2025",
      externalId: `sheet_${index}_${title.toLowerCase().replace(/\s+/g, '_').substring(0, 30)}`,
      title,
      venue,
      date: isoDate,
      time,
      price: price || "Unknown",
      source: "sheets",
      lastUpdated: new Date().toISOString()
    };
    
    // Add optional fields
    const desc = row[5] ? String(row[5]).trim() : '';
    if (desc) party.description = desc;
    const link = row[6] ? String(row[6]).trim() : '';
    if (link) party.link = link;
    if (row[7]) {
      const tags = String(row[7]).split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) party.tags = tags;
    }
    
    return party;
  } catch (error) {
    console.error(`Error mapping row ${index}:`, error);
    return null;
  }
}

/**
 * Fetches live party data from Google Sheets
 */
export async function fetchLive(): Promise<NormalizedParty[]> {
  try {
    const sourceUrl = getSourceUrl();
    console.log("[parties-live] Fetching from Google Sheets");
    
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    console.log(`[parties-live] Got ${rows.length} rows from sheets`);
    
    // Map rows to normalized parties, filter out invalid ones
    const parties: NormalizedParty[] = [];
    for (let i = 0; i < rows.length; i++) {
      const party = mapSheetRowToParty(rows[i], i);
      if (party && isValidParty(party)) {
        parties.push(party);
      } else if (party) {
        console.warn(`[parties-live] Invalid party at row ${i}:`, party);
      }
    }
    
    console.log(`[parties-live] Normalized ${parties.length} valid parties`);
    return parties;
    
  } catch (error) {
    console.error("[parties-live] Fetch error:", error);
    throw error;
  }
}

/**
 * Gets parties from Firestore cache
 */
export async function getPartiesFromFirestore(conference: string = "gamescom2025"): Promise<NormalizedParty[]> {
  try {
    const snapshot = await getDb().collection('parties')
      .where('conference', '==', conference)
      .orderBy('date', 'asc')
      .orderBy('time', 'asc')
      .get();
    
    const parties: NormalizedParty[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (isValidParty(data)) {
        parties.push(data);
      }
    });
    
    return parties;
  } catch (error) {
    console.error("[parties-live] Firestore read error:", error);
    return [];
  }
}