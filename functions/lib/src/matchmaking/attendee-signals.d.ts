/**
 * Attendee Signal Engine - Extended metrics for attendee matching
 * Adds role intent, scan recency, availability overlap, and location fit
 */
import { Attendee, Actor, BadgeScan, AvailabilitySlot } from './attendee-types';
import { Company } from './types';
export declare class AttendeeSignalEngine {
    private scans;
    initializeScans(scans: BadgeScan[]): void;
    roleIntentScore(attendeeRole: string[], counterpartyType: string, counterpartyData?: any): number;
    scanRecencyBoost(actorA: string, actorB: string, nowMs?: number): number;
    availabilityOverlap(attendeeAvail: AvailabilitySlot[], counterpartyAvail?: AvailabilitySlot[]): number;
    locationPreferenceFit(attendeeLocations: string[], counterpartyLocation?: string): number;
    bioSimilarity(attendeeBio: string, counterpartyText: string): number;
    interestCapabilityMatch(attendeeInterests: string[], counterpartyCapabilities: string[]): number;
    calculateAttendeeMetrics(attendee: Attendee | Actor, counterparty: Company | Actor, counterpartyType: 'company' | 'sponsor' | 'attendee'): Record<string, number>;
    generateAttendeeReasons(metrics: Record<string, number>, topN?: number): string[];
    private extractKeywords;
}
//# sourceMappingURL=attendee-signals.d.ts.map