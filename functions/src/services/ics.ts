import * as ical from 'ical';
import * as admin from 'firebase-admin';
import { MtmEvent } from '../models/mtm';

export class IcsService {
  /**
   * Parse ICS data using the ical library for more robust parsing
   */
  parseICS(icsData: string): MtmEvent[] {
    const parsedData = ical.parseICS(icsData);
    const events: MtmEvent[] = [];
    
    for (const key in parsedData) {
      const component = parsedData[key];
      
      if (!component || component.type !== 'VEVENT') {
        continue;
      }
      
      const event: MtmEvent = {
        source: 'mtm',
        icsUid: component.uid || `${component.summary}-${component.start}`,
        title: component.summary || 'Untitled Event',
        description: component.description || '',
        location: component.location || '',
        start: component.start ? admin.firestore.Timestamp.fromDate(new Date(component.start as any)) : admin.firestore.Timestamp.now(),
        end: component.end ? admin.firestore.Timestamp.fromDate(new Date(component.end as any)) : admin.firestore.Timestamp.now(),
        tz: (component as any).tz || null,
        lat: null,
        lon: null,
        updatedAt: admin.firestore.Timestamp.now(),
        googleEventId: null
      };
      
      // Extract geo coordinates if available in location
      const geoMatch = event.location.match(/geo:([-\d.]+),([-\d.]+)/);
      if (geoMatch && geoMatch[1] && geoMatch[2]) {
        event.lat = parseFloat(geoMatch[1]);
        event.lon = parseFloat(geoMatch[2]);
      }
      
      events.push(event);
    }
    
    return events;
  }
  
  /**
   * Fetch ICS file with proper caching headers
   */
  async fetchICS(url: string, etag?: string, lastModified?: string): Promise<{
    ok: boolean;
    data?: string;
    etag?: string;
    lastModified?: string;
    notModified?: boolean;
  }> {
    try {
      const headers: HeadersInit = {
        'User-Agent': 'Conference-Party-App/1.0'
      };
      
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      if (lastModified) {
        headers['If-Modified-Since'] = lastModified;
      }
      
      const response = await fetch(url, { headers });
      
      if (response.status === 304) {
        return { ok: true, notModified: true };
      }
      
      if (!response.ok) {
        console.error(`Failed to fetch ICS: ${response.status} ${response.statusText}`);
        return { ok: false };
      }
      
      const data = await response.text();
      const responseEtag = response.headers.get('etag');
      const responseLastModified = response.headers.get('last-modified');
      
      return {
        ok: true,
        data,
        ...(responseEtag && { etag: responseEtag }),
        ...(responseLastModified && { lastModified: responseLastModified })
      };
    } catch (error) {
      console.error('Error fetching ICS:', error);
      return { ok: false };
    }
  }
}

export const icsService = new IcsService();