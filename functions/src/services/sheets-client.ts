import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = "10c54Otn4pMYTFQ7bRQulO-qDB05aCk_l1rRtuPmwmtE"; // MAU 2025 Events
// Use first sheet without specifying name - get all columns up to T
const SHEET_RANGE = "A2:T1000";

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
    
    // MAU 2025 Google Sheet columns:
    // 0: id, 1: slug, 2: name, 3: categoryId, 4: products, 5: capabilities
    // 6: region, 7: tags, 8: status, 9: updatedAt, 10: subcategory
    // 11: hqCountry, 12: website, 13: description, 14: notableClients
    // 15: date, 16: startTime, 17: endTime, 18: venue, 19: notes
    const [
      _id, slug, name, categoryId, _products, _capabilities,
      _region, tags, _status, _updatedAt, _subcategory,
      _hqCountry, website, description, notableClients,
      date, startTime, endTime, venue, _notes
    ] = row;
    
    // Skip completely empty rows
    if (!name && !slug) {
      return null;
    }
    
    // Log what we're processing for debugging
    console.log(`[sheets-client] Processing row ${index}: name=${name}, date=${date}, startTime=${startTime}`);
    
    // Parse date (format: 2025-05-19)
    let isoDate = date || '2025-05-19'; // MAU Vegas default date
    if (isoDate === '[]' || !isoDate) {
      isoDate = '2025-05-19';
    }
    
    // Parse tags array string
    let parsedTags = [];
    try {
      if (tags && tags.startsWith('[')) {
        parsedTags = JSON.parse(tags.replace(/'/g, '"'));
      }
    } catch (e) {
      // If parsing fails, use as-is
      parsedTags = tags ? [tags] : [];
    }
    
    // Extract sponsors from tags
    const sponsors = parsedTags
      .filter((t: string) => t.startsWith('sponsor:'))
      .map((t: string) => t.replace('sponsor:', ''))
      .join(', ');
    
    return {
      id: slug || `event-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}`,
      title: name?.trim() || '',
      venue: venue?.trim() || "Las Vegas",
      date: isoDate,
      time: startTime?.trim() || '09:00',
      start: `${isoDate}T${startTime?.trim() || '09:00'}:00`,
      end: endTime ? `${isoDate}T${endTime.trim()}:00` : undefined,
      duration: startTime && endTime ? `${startTime} - ${endTime}` : "",
      price: "Invite Only",
      description: description?.trim() || `${categoryId} event`,
      link: website?.trim() || "",
      tags: parsedTags,
      category: categoryId?.toLowerCase() || 'event',
      organizer: sponsors || notableClients || 'MAU',
      // Las Vegas coordinates
      lat: 36.1699,
      lng: -115.1398,
    };
  } catch (error) {
    console.error(`[sheets-client] Error mapping row ${index}:`, error);
    return null;
  }
}