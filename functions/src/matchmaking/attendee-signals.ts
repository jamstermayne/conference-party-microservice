/**
 * Attendee Signal Engine - Extended metrics for attendee matching
 * Adds role intent, scan recency, availability overlap, and location fit
 */

import {
  Attendee,
  Actor,
  BadgeScan,
  ROLE_TAXONOMY,
  SCAN_DECAY_PARAMS,
  AvailabilitySlot
} from './attendee-types';
import { Company } from './types';
import { Timestamp } from 'firebase-admin/firestore';

export class AttendeeSignalEngine {
  private scans: Map<string, BadgeScan[]> = new Map();

  // Initialize with scan data
  initializeScans(scans: BadgeScan[]) {
    // Group scans by actor pairs
    scans.forEach(scan => {
      const key = [scan.fromActorId, scan.toActorId].sort().join('__');
      if (!this.scans.has(key)) {
        this.scans.set(key, []);
      }
      this.scans.get(key)!.push(scan);
    });
  }

  // CONTEXT: Role intent matching
  roleIntentScore(attendeeRole: string[], counterpartyType: string, counterpartyData?: any): number {
    const intentMap: Record<string, Record<string, number>> = {
      'Developer': {
        'company': 0.7,
        'sponsor': 0.9, // Developers love tooling sponsors
        'attendee': 0.5
      },
      'Publisher': {
        'company': 0.9, // Publishers seek games to publish
        'sponsor': 0.6,
        'attendee': 0.5
      },
      'Investor': {
        'company': 0.95, // Investors want startups
        'sponsor': 0.4,
        'attendee': 0.6
      },
      'Tooling': {
        'company': 0.8,
        'sponsor': 0.7,
        'attendee': 0.9 // Tool providers want developer attendees
      },
      'Brand': {
        'company': 0.7,
        'sponsor': 0.8,
        'attendee': 0.5
      }
    };

    // Calculate weighted average across all roles
    let totalScore = 0;
    let roleCount = 0;

    attendeeRole.forEach(role => {
      const score = intentMap[role]?.[counterpartyType] || 0.5;
      totalScore += score;
      roleCount++;
    });

    // Special boosts based on counterparty data
    let finalScore = roleCount > 0 ? totalScore / roleCount : 0.5;

    // Boost for specific matches
    if (counterpartyType === 'company' && counterpartyData) {
      const company = counterpartyData as Company;

      // Developer + game company
      if (attendeeRole.includes('Developer') &&
          company.categories?.includes('Gaming')) {
        finalScore *= 1.2;
      }

      // Investor + startup
      if (attendeeRole.includes('Investor') &&
          company.stage === 'Startup') {
        finalScore *= 1.3;
      }

      // Publisher + unreleased games
      if (attendeeRole.includes('Publisher') &&
          !company.dates.released) {
        finalScore *= 1.2;
      }
    }

    return Math.min(finalScore, 1);
  }

  // SCAN: Recency boost based on badge scans
  scanRecencyBoost(actorA: string, actorB: string, nowMs?: number): number {
    const key = [actorA, actorB].sort().join('__');
    const pairScans = this.scans.get(key) || [];

    if (pairScans.length === 0) return 0;

    const now = nowMs || Date.now();
    const horizonMs = SCAN_DECAY_PARAMS.horizonHours * 60 * 60 * 1000;

    // Find most recent scan
    let mostRecentMs = 0;
    pairScans.forEach(scan => {
      const scanMs = scan.ts.toDate ? scan.ts.toDate().getTime() : new Date(scan.ts as any).getTime();
      if (scanMs > mostRecentMs) {
        mostRecentMs = scanMs;
      }
    });

    if (mostRecentMs === 0) return 0;

    // Calculate time delta
    const deltaMs = now - mostRecentMs;
    if (deltaMs > horizonMs) return 0; // Outside horizon

    // Exponential decay
    const normalizedDelta = deltaMs / horizonMs;
    const boost = Math.exp(-normalizedDelta / SCAN_DECAY_PARAMS.temperature);

    return boost * SCAN_DECAY_PARAMS.maxBoost;
  }

  // AVAILABILITY: Overlap in meeting availability
  availabilityOverlap(
    attendeeAvail: AvailabilitySlot[],
    counterpartyAvail?: AvailabilitySlot[]
  ): number {
    if (!attendeeAvail?.length) return 0;
    if (!counterpartyAvail?.length) return 0.5; // Unknown availability = neutral

    let totalSlots = 0;
    let overlappingSlots = 0;

    attendeeAvail.forEach(attDay => {
      const cpDay = counterpartyAvail.find(d => d.day === attDay.day);
      if (cpDay) {
        attDay.slots.forEach(slot => {
          totalSlots++;
          if (cpDay.slots.includes(slot)) {
            overlappingSlots++;
          }
        });
      } else {
        totalSlots += attDay.slots.length;
      }
    });

    if (totalSlots === 0) return 0;
    return overlappingSlots / totalSlots;
  }

  // PREFERENCE: Meeting location fit
  locationPreferenceFit(
    attendeeLocations: string[],
    counterpartyLocation?: string
  ): number {
    if (!attendeeLocations?.length) return 0.5; // No preference = neutral
    if (!counterpartyLocation) return 0.5; // Unknown location = neutral

    // Direct match
    if (attendeeLocations.includes(counterpartyLocation)) {
      return 1.0;
    }

    // Partial matches
    const locationSimilarity: Record<string, string[]> = {
      'Expo Floor': ['Expo', 'Booth', 'Stand'],
      'Cabanas': ['Quiet Zone', 'Meeting Rooms'],
      'Quiet Zone': ['Cabanas', 'Meeting Rooms'],
      'Meeting Rooms': ['Quiet Zone', 'Cabanas'],
      'Lounge': ['Coffee Area'],
      'Coffee Area': ['Lounge']
    };

    // Check for similar locations
    for (const prefLoc of attendeeLocations) {
      const similar = locationSimilarity[prefLoc] || [];
      if (similar.some(s => counterpartyLocation.includes(s))) {
        return 0.7;
      }
    }

    return 0.3; // Mismatch but not impossible
  }

  // TEXT: Bio similarity using simple keyword matching
  bioSimilarity(attendeeBio: string, counterpartyText: string): number {
    if (!attendeeBio || !counterpartyText) return 0;

    const bioLower = attendeeBio.toLowerCase();
    const textLower = counterpartyText.toLowerCase();

    // Extract keywords (simple approach)
    const bioKeywords = this.extractKeywords(bioLower);
    const textKeywords = this.extractKeywords(textLower);

    if (bioKeywords.size === 0 || textKeywords.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set([...bioKeywords].filter(k => textKeywords.has(k)));
    const union = new Set([...bioKeywords, ...textKeywords]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // INTEREST: Match attendee interests with company capabilities
  interestCapabilityMatch(
    attendeeInterests: string[],
    counterpartyCapabilities: string[]
  ): number {
    if (!attendeeInterests?.length || !counterpartyCapabilities?.length) return 0;

    let matchCount = 0;

    attendeeInterests.forEach(interest => {
      // Direct match
      if (counterpartyCapabilities.some(cap =>
        cap.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(cap.toLowerCase())
      )) {
        matchCount++;
      }
    });

    return matchCount / attendeeInterests.length;
  }

  // Calculate all attendee-specific metrics
  calculateAttendeeMetrics(
    attendee: Attendee | Actor,
    counterparty: Company | Actor,
    counterpartyType: 'company' | 'sponsor' | 'attendee'
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Role intent
    if (attendee.role) {
      metrics['ctx:role.intent'] = this.roleIntentScore(
        attendee.role,
        counterpartyType,
        counterparty
      );
    }

    // Scan recency boost
    metrics['scan:recency.boost'] = this.scanRecencyBoost(
      attendee.id,
      counterparty.id
    );

    // Availability overlap (if both have preferences)
    if ('preferences' in attendee && 'preferences' in counterparty) {
      metrics['avail:overlap'] = this.availabilityOverlap(
        (attendee as Attendee).preferences.availability,
        (counterparty as any).preferences?.availability
      );
    }

    // Location preference fit
    if ('preferences' in attendee) {
      const attendeePref = attendee as Attendee;
      let location: string | undefined;

      if (counterpartyType === 'company' && 'sources' in counterparty) {
        location = 'Expo Floor'; // Default for companies
      } else if (counterpartyType === 'sponsor' && 'sponsorTier' in counterparty) {
        location = (counterparty as Actor).sponsorTier === 'Platinum' ? 'Cabanas' : 'Expo Floor';
      }

      if (location) {
        metrics['preference:location.fit'] = this.locationPreferenceFit(
          attendeePref.preferences.meetingLocations,
          location
        );
      }
    }

    // Bio/text similarity
    if ('bio' in attendee && 'text' in counterparty) {
      const bio = (attendee as Attendee).bio;
      const text = [
        (counterparty as Company).text?.description,
        (counterparty as Company).text?.abstract
      ].filter(Boolean).join(' ');

      if (bio && text) {
        metrics['text:bio.similarity'] = this.bioSimilarity(bio, text);
      }
    }

    // Interest-capability matching
    if ('interests' in attendee && attendee.interests && 'capabilities' in counterparty) {
      metrics['interest:capability.match'] = this.interestCapabilityMatch(
        attendee.interests as string[],
        counterparty.capabilities || []
      );
    }

    // Filter out zero or invalid values
    Object.keys(metrics).forEach(key => {
      if (isNaN(metrics[key]) || metrics[key] === 0) {
        delete metrics[key];
      }
    });

    return metrics;
  }

  // Generate human-readable reasons for attendee matches
  generateAttendeeReasons(metrics: Record<string, number>, topN: number = 3): string[] {
    const reasons: string[] = [];

    // Sort by value
    const sortedMetrics = Object.entries(metrics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN);

    sortedMetrics.forEach(([key, value]) => {
      const percentage = Math.round(value * 100);

      if (key === 'ctx:role.intent') {
        reasons.push(`Strong role alignment (${percentage}% match)`);
      } else if (key === 'scan:recency.boost') {
        reasons.push(`Recent badge scan interaction`);
      } else if (key === 'avail:overlap') {
        reasons.push(`Schedule availability overlap (${percentage}%)`);
      } else if (key === 'preference:location.fit') {
        reasons.push(`Preferred meeting location match`);
      } else if (key === 'text:bio.similarity') {
        reasons.push(`Profile content alignment (${percentage}%)`);
      } else if (key === 'interest:capability.match') {
        reasons.push(`Interest-capability synergy (${percentage}%)`);
      } else if (key.includes('bipartite')) {
        reasons.push(`Complementary needs and offerings (${percentage}%)`);
      } else {
        // Reuse existing reason generation
        if (key.includes('platforms')) {
          reasons.push(`Platform focus alignment (${percentage}%)`);
        } else if (key.includes('markets')) {
          reasons.push(`Target market overlap (${percentage}%)`);
        }
      }
    });

    return reasons;
  }

  // Helper: Extract keywords from text
  private extractKeywords(text: string): Set<string> {
    // Simple keyword extraction (can be improved with NLP)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'shall', 'it', 'this', 'that'
    ]);

    const words = text
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return new Set(words);
  }
}