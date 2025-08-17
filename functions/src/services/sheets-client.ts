import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = "1Cq-UcdgtSz2FaROahsj7Db2nmStBFCN97EZzBEHCrKg";
// Try without sheet name - will use first sheet
const SHEET_RANGE = "A2:I1000";

/**
 * Fetches data from Google Sheets using service account authentication
 * The sheet must be shared with the service account email
 */
export async function fetchFromGoogleSheets(): Promise<any[]> {
  try {
    console.log("[sheets-client] Fetching data from Google Sheets using service account");
    
    // Get the default service account credentials with timeout
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    // Create sheets client
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch the data with timeout
    const response = await Promise.race([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_RANGE,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Sheets timeout')), 10000)
      )
    ]) as any;
    
    const rows = response.data.values || [];
    console.log(`[sheets-client] Fetched ${rows.length} rows from Google Sheets`);
    
    return rows;
  } catch (error: any) {
    console.error("[sheets-client] Error fetching from Google Sheets:", error.message);
    if (error.code === 403) {
      console.error("[sheets-client] Permission denied. Make sure the sheet is shared with the service account.");
    }
    // Don't throw - let the caller handle with fallback
    return [];
  }
}

/**
 * Maps sheet row to party data
 */
export function mapSheetRowToParty(row: any[], index: number): any {
  try {
    
    // Actual columns from your Google Sheet:
    // A: Date (Mon Aug 18), B: Start Time (09:00), C: End Time (19:00)
    // D: Duration string (09:00 - 19:00), E: Event Name, F: Link/URL
    // G: Category/Organizer, H: Venue, I: Price/Location
    const [dateStr, startTime, endTimeStr, durationStr, eventName, link, organizer, venue, priceOrLocation] = row;
    
    if (!eventName || !dateStr || !startTime) {
      return null;
    }
    
    // Parse date from "Mon Aug 18" format to ISO
    let isoDate = '2025-08-18'; // Default
    if (dateStr) {
      const dateMap: {[key: string]: string} = {
        'Mon Aug 18': '2025-08-18',
        'Tue Aug 19': '2025-08-19',
        'Wed Aug 20': '2025-08-20',
        'Thu Aug 21': '2025-08-21',
        'Fri Aug 22': '2025-08-22',
        'Sat Aug 23': '2025-08-23',
        'Sun Aug 24': '2025-08-24',
      };
      isoDate = dateMap[dateStr] || '2025-08-20';
    }
    
    return {
      id: `event-${index}-${eventName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}`,
      title: eventName.trim(),
      venue: venue?.trim() || "Cologne",
      date: isoDate,
      time: startTime.trim(),
      start: `${isoDate}T${startTime.trim()}:00`,
      end: endTimeStr ? `${isoDate}T${endTimeStr.trim()}:00` : undefined,
      duration: durationStr?.trim() || "",
      price: priceOrLocation?.trim() || "See event page",
      description: `Event by ${organizer || 'Organizer'}`,
      link: link?.trim() || "",
      tags: [organizer].filter(Boolean).map(t => t.trim()),
      category: determineCategory(eventName, organizer),
      organizer: organizer?.trim() || "",
      // Add default coordinates for Cologne (you can geocode these later)
      lat: 50.9473,
      lng: 6.9838,
    };
  } catch (error) {
    console.error(`[sheets-client] Error mapping row ${index}:`, error);
    return null;
  }
}

/**
 * Determines event category based on title and organizer field
 */
function determineCategory(title: string, organizerField?: string): string {
  const text = `${title} ${organizerField || ''}`.toLowerCase();
  
  // Check organizer field for category hints
  if (organizerField) {
    const org = organizerField.toLowerCase();
    if (org.includes('ai') || org.includes('xr')) return 'tech';
    if (org.includes('game') || org.includes('gaming')) return 'gaming';
    if (org.includes('indie')) return 'indie';
    if (org.includes('party')) return 'party';
    if (org.includes('network')) return 'networking';
    if (org === 'all') return 'conference';
  }
  
  // Fallback to title-based detection
  if (text.includes('party') || text.includes('afterparty')) return 'party';
  if (text.includes('tournament') || text.includes('esports')) return 'tournament';
  if (text.includes('conference') || text.includes('summit') || text.includes('devcom')) return 'conference';
  if (text.includes('showcase') || text.includes('demo')) return 'showcase';
  if (text.includes('meetup') || text.includes('networking') || text.includes('meettomatch')) return 'networking';
  if (text.includes('opening') || text.includes('closing')) return 'ceremony';
  if (text.includes('vip') || text.includes('exclusive')) return 'vip';
  
  return 'event';
}