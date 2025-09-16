/**
 * Attendee Types - Extended matchmaking for conference attendees
 * Privacy-first design with consent management
 */

import { Timestamp } from 'firebase-admin/firestore';

// Attendee profile with PII protection
export interface Attendee {
  id: string; // Format: "a-<uuid>"
  email: string; // PII - secured
  fullName: string; // PII - secured
  org: string;
  title: string;
  role: string[]; // Developer, Publisher, Investor, Tooling, Brand
  interests: string[]; // UA, Analytics, Backend, Funding, Publishing, XR
  capabilities?: string[];
  needs?: string[];
  platforms: string[];
  markets: string[];
  tags: string[]; // speaker, vip, press, partner
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
    meetingDurations: number[]; // [15, 30] minutes
    availability: AvailabilitySlot[];
    meetingLocations: string[]; // Expo, Cabanas, Quiet
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

// Availability slot for meeting scheduling
export interface AvailabilitySlot {
  day: string; // "2025-09-15"
  slots: string[]; // ["10:00-10:30", "11:00-11:30"]
}

// Extended Actor type to include attendees
export interface Actor {
  id: string;
  actorType: 'company' | 'sponsor' | 'attendee';
  name: string;
  slug?: string;
  logoUrl?: string;
  website?: string;

  // Normalized facets for matching
  categories?: string[];
  platforms?: string[];
  markets?: string[];
  capabilities?: string[];
  needs?: string[];
  tags?: string[];
  role?: string[];

  // Sponsor-specific
  sponsorTier?: string;
  sponsorObjectives?: any;

  // Attendee reference (not exposed publicly)
  piiRef?: string; // "/attendees/{id}"

  updatedAt: Timestamp;
}

// Badge scan event
export interface BadgeScan {
  scanId: string;
  fromActorId: string; // Usually "a-..." (attendee)
  toActorId: string; // "c-...", "s-...", or "a-..."
  context: {
    booth?: string;
    sessionId?: string;
    venue?: string;
  };
  ts: Timestamp;
}

// Meeting request
export interface Meeting {
  id: string;
  fromActorId: string;
  toActorId: string;
  requestedSlots: string[]; // ["2025-09-15T10:00/30m"]
  chosenSlot?: string;
  status: 'requested' | 'accepted' | 'declined' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Extended match type for attendee matching
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
  scanBoost?: number; // Additional boost from recent scan
  availabilityOverlap?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Attendee upload configuration
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

// Scan ingestion request
export interface ScanIngestRequest {
  from: string; // Can be badgeId, QR, or actorId
  to: string;
  context?: {
    booth?: string;
    sessionId?: string;
    venue?: string;
  };
  timestamp?: string;
}

// Meeting request parameters
export interface MeetingRequest {
  fromActorId: string;
  toActorId: string;
  slots: string[];
  message?: string;
}

// Privacy filter for public display
export interface PrivacyFilter {
  requireConsent: boolean;
  excludePII: boolean;
  respectShowPublicCard: boolean;
}

// Attendee stats for analytics
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
    topScanners: Array<{ id: string; count: number }>;
  };
  meetingStats: {
    requested: number;
    scheduled: number;
    completed: number;
  };
}

// Role to category mapping for taxonomy
export const ROLE_TAXONOMY: Record<string, string[]> = {
  'Developer': ['Gaming', 'Technology', 'Engineering', 'Mobile', 'Backend'],
  'Publisher': ['Publishing', 'Marketing', 'Distribution', 'Monetization'],
  'Investor': ['Funding', 'Investment', 'VC', 'M&A', 'Growth'],
  'Tooling': ['Tools', 'Analytics', 'Infrastructure', 'DevOps', 'SDK'],
  'Brand': ['Marketing', 'Advertising', 'Sponsorship', 'Partnership']
};

// Interest to capability mapping
export const INTEREST_CAPABILITIES: Record<string, string[]> = {
  'UA': ['User Acquisition', 'Growth Marketing', 'Performance Marketing'],
  'Analytics': ['Data Analysis', 'Metrics', 'KPI Tracking', 'BI'],
  'Backend': ['Server Development', 'Cloud Infrastructure', 'APIs'],
  'Funding': ['Investment', 'Capital', 'Due Diligence'],
  'Publishing': ['Game Publishing', 'Distribution', 'Marketing'],
  'XR': ['Virtual Reality', 'Augmented Reality', 'Mixed Reality']
};

// Meeting location preferences
export const MEETING_LOCATIONS = [
  'Expo Floor',
  'Cabanas',
  'Quiet Zone',
  'Meeting Rooms',
  'Lounge',
  'Coffee Area',
  'Virtual'
];

// Default meeting durations (minutes)
export const DEFAULT_MEETING_DURATIONS = [15, 30, 45, 60];

// Scan recency decay parameters
export const SCAN_DECAY_PARAMS = {
  horizonHours: 48,
  temperature: 0.5,
  maxBoost: 0.2
};