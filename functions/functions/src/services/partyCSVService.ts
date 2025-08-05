// PARTY-CSV-SERVICE - Process and store party events from CSV
// Genesis Compliant: Single function, single responsibility

import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

/**
 * processPartyCSV - Parse CSV file and store party events in Firestore
 * @param {string} fileId - Cloud Storage file ID
 * @returns {Object} - Processing result
 */
export async function processPartyCSV(fileId: string) {
  try {
    const db = getFirestore();
    const storage = getStorage();
    
    // Download CSV from Cloud Storage
    const bucket = storage.bucket();
    const file = bucket.file(`uploads/${fileId}`);
    const [csvContent] = await file.download();
    
    // Parse CSV content
    const parties = parseCSVContent(csvContent.toString());
    
    // Store parties in Firestore
    const batch = db.batch();
    parties.forEach((party, index) => {
      const partyRef = db.collection('parties').doc(`${fileId}_${index}`);
      batch.set(partyRef, {
        ...party,
        importedAt: new Date().toISOString(),
        sourceFile: fileId,
        status: 'active'
      });
    });
    
    await batch.commit();
    
    return {
      success: true,
      data: {
        partiesImported: parties.length,
        sourceFile: fileId,
        message: `Successfully imported ${parties.length} parties from CSV`
      },
      meta: {
        timestamp: new Date().toISOString(),
        function: 'processPartyCSV',
        service: 'party-csv-service'
      }
    };
    
  } catch (error) {
    logger.error("CSV processing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'CSV processing failed',
      meta: {
        function: 'processPartyCSV',
        service: 'party-csv-service'
      }
    };
  }
}

/**
 * parseCSVContent - Parse CSV string into party objects
 * @param {string} csvContent - Raw CSV content
 * @returns {Array} - Array of party objects
 */
function parseCSVContent(csvContent: string) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const party: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Map CSV headers to party object
      switch (header) {
        case 'name':
        case 'title':
          party.name = value;
          break;
        case 'host':
        case 'organizer':
          party.host = value;
          break;
        case 'time':
        case 'datetime':
        case 'start_time':
          party.time = value;
          break;
        case 'location':
        case 'venue':
          party.location = value;
          break;
        case 'description':
          party.description = value;
          break;
        case 'tags':
          party.tags = value.split(';').map(tag => tag.trim());
          break;
        default:
          party[header] = value;
      }
    });
    
    // Generate unique ID
    party.id = `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return party;
  });
}
