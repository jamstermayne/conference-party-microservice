// Lightweight aggregation for "proximity intelligence" hotspots.
// Reads events/parties for a given conference, groups by venue, returns counts.
// Falls back to 0 results if none.

import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';

type PersonaCounts = Partial<Record<'dev' | 'pub' | 'inv' | 'sp', number>>;

interface EventDoc {
  id?: string;
  conference?: string;
  venue?: string;
  venueId?: string;
  title?: string;
  start?: string; // ISO
  end?: string;   // ISO
  persona?: PersonaCounts;
  attendeesCount?: number;
  // Optional richer shapes:
  attendees?: Array<{ persona?: keyof PersonaCounts }>;
}

interface Hotspot {
  venue: string;
  venueId?: string | undefined;
  total: number;
  persona: Required<PersonaCounts>;
  sampleEvent?: { id?: string; title?: string; start?: string } | undefined;
}

/**
 * GET /api/hotspots?conference=gamescom2025
 * Optional: &window=today | now | all
 * Returns: { success: true, data: Hotspot[] }
 */
export async function getHotspots(req: Request, res: Response) {
  try {
    const db = admin.firestore();
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const conference = String(req.query["conference"] || '').trim();
    if (!conference) {
      return res.status(400).json({ success: false, error: 'conference is required' });
    }

    // Optional time window (for future use)
    // const win = String(req.query["window"] || 'conference');

    // Basic query: events collection filtered by conference
    // If your events live elsewhere, adjust the collection name.
    const snap = await db.collection('events')
      .where('conference', '==', conference)
      .limit(2000) // safety cap
      .get();

    const personaBase: Required<PersonaCounts> = { dev: 0, pub: 0, inv: 0, sp: 0 };

    const map = new Map<string, Hotspot>();

    snap.forEach(doc => {
      const e = doc.data() as EventDoc;
      const venue = (e.venue || e.venueId || 'Unknown Venue').trim();
      if (!venue) return;

      // Derive persona counts for the event
      const eventPersona: Required<PersonaCounts> = { ...personaBase };
      if (e.persona) {
        for (const k of Object.keys(e.persona) as Array<keyof PersonaCounts>) {
          const v = e.persona[k] || 0;
          if (k) (eventPersona as any)[k] = (eventPersona as any)[k] + v;
        }
      } else if (Array.isArray(e.attendees)) {
        for (const a of e.attendees) {
          if (!a?.persona) continue;
          const k = a.persona;
          if (k in eventPersona) (eventPersona as any)[k] = (eventPersona as any)[k] + 1;
        }
      } else if (typeof e.attendeesCount === 'number') {
        // If only a total is known, attribute all to "dev" as a neutral bucket (or leave 0s).
        eventPersona.dev += Math.max(0, e.attendeesCount | 0);
      }

      const totalForEvent =
        (eventPersona.dev || 0) +
        (eventPersona.pub || 0) +
        (eventPersona.inv || 0) +
        (eventPersona.sp || 0);

      // Create/update hotspot bucket
      const existing = map.get(venue) || {
        venue,
        venueId: e.venueId,
        total: 0,
        persona: { ...personaBase },
        sampleEvent: undefined,
      };

      existing.total += totalForEvent;
      existing.persona.dev += eventPersona.dev;
      existing.persona.pub += eventPersona.pub;
      existing.persona.inv += eventPersona.inv;
      existing.persona.sp += eventPersona.sp;

      // Keep a representative event for UI previews
      if (!existing.sampleEvent && (e.id || e.title)) {
        existing.sampleEvent = {};
        if (e.id) existing.sampleEvent.id = e.id;
        if (e.title) existing.sampleEvent.title = e.title;
        if (e.start) existing.sampleEvent.start = e.start;
      }

      map.set(venue, existing);
    });

    // Sort by total desc, return top 50 (UI can paginate if needed)
    const data = Array.from(map.values())
      .filter(h => h.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);

    // Cache hint for CDN/browser (30s)
    res.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('hotspots error:', err?.message || err);
    return res.status(500).json({ success: false, error: 'internal_error' });
  }
}