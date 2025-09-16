/**
 * Attendee Types - Extended matchmaking for conference attendees
 * Privacy-first design with consent management
 */
import { Timestamp } from 'firebase-admin/firestore';
export interface Attendee {
    id: string;
    email: string;
    fullName: string;
    org: string;
    title: string;
    role: string[];
    interests: string[];
    capabilities?: string[];
    needs?: string[];
    platforms: string[];
    markets: string[];
    tags: string[];
    bio?: string;
    links: {
        website?: string;
        linkedin?: string;
        twitter?: string;
    };
    consent: {
        marketing: boolean;
        matchmaking: boolean;
        showPublicCard: boolean;
        timestamp: Timestamp;
    };
    preferences: {
        meetingDurations: number[];
        availability: AvailabilitySlot[];
        meetingLocations: string[];
    };
    scanStats: {
        scansGiven: number;
        scansReceived: number;
    };
    source: {
        importedFrom?: string;
        badgeId?: string;
        qr?: string;
    };
    updatedAt: Timestamp;
}
export interface AvailabilitySlot {
    day: string;
    slots: string[];
}
export interface Actor {
    id: string;
    actorType: 'company' | 'sponsor' | 'attendee';
    name: string;
    slug?: string;
    logoUrl?: string;
    website?: string;
    categories?: string[];
    platforms?: string[];
    markets?: string[];
    capabilities?: string[];
    needs?: string[];
    tags?: string[];
    role?: string[];
    sponsorTier?: string;
    sponsorObjectives?: any;
    piiRef?: string;
    updatedAt: Timestamp;
}
export interface BadgeScan {
    scanId: string;
    fromActorId: string;
    toActorId: string;
    context: {
        booth?: string;
        sessionId?: string;
        venue?: string;
    };
    ts: Timestamp;
}
export interface Meeting {
    id: string;
    fromActorId: string;
    toActorId: string;
    requestedSlots: string[];
    chosenSlot?: string;
    status: 'requested' | 'accepted' | 'declined' | 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface AttendeeMatch {
    edgeId: string;
    a: string;
    b: string;
    aType: 'company' | 'sponsor' | 'attendee';
    bType: 'company' | 'sponsor' | 'attendee';
    score: number;
    metrics: Record<string, number>;
    weights: Record<string, number>;
    contributions: Array<{
        key: string;
        value: number;
        weight: number;
        contribution: number;
        displayName?: string;
    }>;
    reasons: string[];
    confidence: number;
    scanBoost?: number;
    availabilityOverlap?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface AttendeeUploadConfig {
    dryRun: boolean;
    mapping: Record<string, string>;
    skipDuplicates: boolean;
    mergeStrategy: 'replace' | 'merge' | 'skip';
    validate: boolean;
    defaultConsent: {
        marketing: boolean;
        matchmaking: boolean;
        showPublicCard: boolean;
    };
}
export interface ScanIngestRequest {
    from: string;
    to: string;
    context?: {
        booth?: string;
        sessionId?: string;
        venue?: string;
    };
    timestamp?: string;
}
export interface MeetingRequest {
    fromActorId: string;
    toActorId: string;
    slots: string[];
    message?: string;
}
export interface PrivacyFilter {
    requireConsent: boolean;
    excludePII: boolean;
    respectShowPublicCard: boolean;
}
export interface AttendeeStats {
    totalAttendees: number;
    consentedForMatching: number;
    consentedForMarketing: number;
    publicProfiles: number;
    byRole: Record<string, number>;
    byInterest: Record<string, number>;
    scanActivity: {
        totalScans: number;
        uniquePairs: number;
        topScanners: Array<{
            id: string;
            count: number;
        }>;
    };
    meetingStats: {
        requested: number;
        scheduled: number;
        completed: number;
    };
}
export declare const ROLE_TAXONOMY: Record<string, string[]>;
export declare const INTEREST_CAPABILITIES: Record<string, string[]>;
export declare const MEETING_LOCATIONS: string[];
export declare const DEFAULT_MEETING_DURATIONS: number[];
export declare const SCAN_DECAY_PARAMS: {
    horizonHours: number;
    temperature: number;
    maxBoost: number;
};
//# sourceMappingURL=attendee-types.d.ts.map