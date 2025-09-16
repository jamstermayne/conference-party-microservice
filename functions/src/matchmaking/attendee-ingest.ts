/**
 * Attendee Ingestion - CSV/XLS upload and badge scan processing
 * Handles consent, privacy, and actor materialization
 */

import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  Attendee,
  Actor,
  AttendeeUploadConfig,
  BadgeScan,
  ScanIngestRequest,
  ROLE_TAXONOMY,
  INTEREST_CAPABILITIES
} from './attendee-types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db, storage } from '../services/firebase-init';

// Zod schema for attendee validation
const AttendeeSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  org: z.string().default(''),
  title: z.string().default(''),
  role: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).optional(),
  needs: z.array(z.string()).optional(),
  platforms: z.array(z.string()).default([]),
  markets: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  bio: z.string().optional(),
  links: z.object({
    website: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional()
  }).default({}),
  consent: z.object({
    marketing: z.boolean().default(false),
    matchmaking: z.boolean().default(false),
    showPublicCard: z.boolean().default(false)
  }).default({
    marketing: false,
    matchmaking: false,
    showPublicCard: false
  }),
  preferences: z.object({
    meetingDurations: z.array(z.number()).default([15, 30]),
    meetingLocations: z.array(z.string()).default(['Expo Floor'])
  }).default({
    meetingDurations: [15, 30],
    meetingLocations: ['Expo Floor']
  }),
  source: z.object({
    importedFrom: z.string().optional(),
    badgeId: z.string().optional(),
    qr: z.string().optional()
  }).default({})
});

export class AttendeeIngestService {
  // Process CSV/XLS upload
  async processUpload(
    fileBuffer: Buffer,
    fileName: string,
    config: AttendeeUploadConfig
  ): Promise<{
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
    dryRun: boolean;
  }> {
    const result = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
      dryRun: config.dryRun
    };

    try {
      // Parse file based on extension
      let data: any[];
      if (fileName.endsWith('.csv')) {
        data = await this.parseCSV(fileBuffer);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        data = await this.parseExcel(fileBuffer);
      } else {
        throw new Error('Unsupported file format');
      }

      // Process each row
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          const attendee = await this.transformRow(row, config.mapping);

          if (config.dryRun) {
            // Validate only
            AttendeeSchema.parse(attendee);
            result.success++;
          } else {
            // Check duplicates
            const existing = await this.findExisting(attendee);

            if (existing && config.skipDuplicates) {
              result.skipped++;
              continue;
            }

            // Apply merge strategy
            const toSave = existing
              ? this.mergeAttendee(existing, attendee, config.mergeStrategy)
              : attendee;

            // Save to Firestore
            await this.saveAttendee(toSave);
            await this.materializeToActor(toSave);

            result.success++;
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push({ row: i + 1, error: error.message });
        }
      }

      // Log the upload
      await this.logUpload(fileName, result);

    } catch (error: any) {
      console.error('[AttendeeIngest] Upload processing failed:', error);
      throw error;
    }

    return result;
  }

  // Process badge scan
  async processScan(request: ScanIngestRequest): Promise<BadgeScan> {
    try {
      // Resolve actor IDs
      const fromActorId = await this.resolveActorId(request.from);
      const toActorId = await this.resolveActorId(request.to);

      if (!fromActorId || !toActorId) {
        throw new Error('Invalid actor IDs');
      }

      // Check consent for both parties
      const fromConsent = await this.checkConsent(fromActorId);
      const toConsent = await this.checkConsent(toActorId);

      if (!fromConsent || !toConsent) {
        console.warn('[AttendeeIngest] Scan skipped due to consent settings');
        throw new Error('Consent not granted for matchmaking');
      }

      // Create scan record
      const scan: BadgeScan = {
        scanId: uuidv4(),
        fromActorId,
        toActorId,
        context: request.context || {},
        ts: Timestamp.now()
      };

      // Save scan
      await db.collection('scans').doc(scan.scanId).set(scan);

      // Update scan counters
      await this.updateScanStats(fromActorId, toActorId);

      // Trigger light recompute for this pair
      await this.enqueuePairRecompute(fromActorId, toActorId);

      console.log(`[AttendeeIngest] Scan processed: ${fromActorId} -> ${toActorId}`);
      return scan;

    } catch (error: any) {
      console.error('[AttendeeIngest] Scan processing failed:', error);
      throw error;
    }
  }

  // Parse CSV file
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(buffer.toString(), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
  }

  // Parse Excel file
  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  // Transform row data to attendee object
  private async transformRow(row: any, mapping: Record<string, string>): Promise<Attendee> {
    const mapped: any = {};

    // Apply field mapping
    Object.entries(mapping).forEach(([source, target]) => {
      const value = row[source];
      if (value !== undefined && value !== null && value !== '') {
        // Handle nested fields
        if (target.includes('.')) {
          const [parent, child] = target.split('.');
          if (!mapped[parent]) mapped[parent] = {};
          mapped[parent][child] = value;
        } else {
          mapped[target] = value;
        }
      }
    });

    // Transform arrays (pipe-separated)
    ['role', 'interests', 'capabilities', 'needs', 'platforms', 'markets', 'tags'].forEach(field => {
      if (mapped[field] && typeof mapped[field] === 'string') {
        mapped[field] = mapped[field].split('|').map((s: string) => s.trim()).filter(Boolean);
      }
    });

    // Parse availability JSON if present
    if (mapped.preferences?.availability && typeof mapped.preferences.availability === 'string') {
      try {
        mapped.preferences.availability = JSON.parse(mapped.preferences.availability);
      } catch {
        delete mapped.preferences.availability;
      }
    }

    // Generate ID
    mapped.id = mapped.id || `a-${uuidv4()}`;

    // Add timestamps
    mapped.consent = {
      ...mapped.consent,
      timestamp: Timestamp.now()
    };
    mapped.updatedAt = Timestamp.now();

    // Initialize scan stats
    mapped.scanStats = mapped.scanStats || { scansGiven: 0, scansReceived: 0 };

    // Validate and return
    return AttendeeSchema.parse(mapped) as any;
  }

  // Find existing attendee
  private async findExisting(attendee: Attendee): Promise<Attendee | null> {
    // Check by email
    if (attendee.email) {
      const snapshot = await db.collection('attendees')
        .where('email', '==', attendee.email)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Attendee;
      }
    }

    // Check by badge ID
    if (attendee.source.badgeId) {
      const snapshot = await db.collection('attendees')
        .where('source.badgeId', '==', attendee.source.badgeId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Attendee;
      }
    }

    return null;
  }

  // Merge attendee data
  private mergeAttendee(
    existing: Attendee,
    incoming: Attendee,
    strategy: 'replace' | 'merge' | 'skip'
  ): Attendee {
    if (strategy === 'skip') {
      return existing;
    }

    if (strategy === 'replace') {
      return {
        ...incoming,
        id: existing.id,
        scanStats: existing.scanStats // Preserve scan stats
      };
    }

    // Merge strategy
    return {
      ...existing,
      ...incoming,
      id: existing.id,
      // Merge arrays
      role: [...new Set([...existing.role, ...incoming.role])],
      interests: [...new Set([...existing.interests, ...incoming.interests])],
      capabilities: [...new Set([...(existing.capabilities || []), ...(incoming.capabilities || [])])],
      needs: [...new Set([...(existing.needs || []), ...(incoming.needs || [])])],
      platforms: [...new Set([...existing.platforms, ...incoming.platforms])],
      markets: [...new Set([...existing.markets, ...incoming.markets])],
      tags: [...new Set([...existing.tags, ...incoming.tags])],
      // Preserve scan stats
      scanStats: existing.scanStats,
      // Update timestamp
      updatedAt: Timestamp.now()
    };
  }

  // Save attendee to Firestore
  private async saveAttendee(attendee: Attendee): Promise<void> {
    await db.collection('attendees').doc(attendee.id).set(attendee, { merge: true });
  }

  // Materialize attendee to actor collection
  private async materializeToActor(attendee: Attendee): Promise<void> {
    // Only materialize if consent for matchmaking
    if (!attendee.consent.matchmaking) {
      console.log(`[AttendeeIngest] Skipping actor materialization for ${attendee.id} - no consent`);
      return;
    }

    // Derive categories from role and interests
    const categories = new Set<string>();

    attendee.role.forEach(role => {
      const taxonomyCategories = ROLE_TAXONOMY[role] || [];
      taxonomyCategories.forEach(cat => categories.add(cat));
    });

    attendee.interests.forEach(interest => {
      const interestCaps = INTEREST_CAPABILITIES[interest] || [];
      interestCaps.forEach(cap => categories.add(cap));
    });

    // Create actor document
    const actor: Actor = {
      id: attendee.id,
      actorType: 'attendee',
      name: attendee.consent.showPublicCard ? attendee.fullName : `Attendee ${attendee.id.slice(-6)}`,
      website: attendee.links.website,
      categories: Array.from(categories),
      platforms: attendee.platforms,
      markets: attendee.markets,
      capabilities: attendee.capabilities || [],
      needs: attendee.needs || [],
      tags: attendee.tags,
      role: attendee.role,
      piiRef: attendee.consent.showPublicCard ? undefined : `/attendees/${attendee.id}`,
      updatedAt: Timestamp.now()
    };

    await db.collection('actors').doc(actor.id).set(actor, { merge: true });
  }

  // Resolve actor ID from various formats
  private async resolveActorId(identifier: string): Promise<string | null> {
    // Already an actor ID
    if (identifier.startsWith('a-') || identifier.startsWith('c-') || identifier.startsWith('s-')) {
      return identifier;
    }

    // Try badge ID
    const badgeSnapshot = await db.collection('attendees')
      .where('source.badgeId', '==', identifier)
      .limit(1)
      .get();

    if (!badgeSnapshot.empty) {
      return badgeSnapshot.docs[0].id;
    }

    // Try QR code
    const qrSnapshot = await db.collection('attendees')
      .where('source.qr', '==', identifier)
      .limit(1)
      .get();

    if (!qrSnapshot.empty) {
      return qrSnapshot.docs[0].id;
    }

    return null;
  }

  // Check consent for matchmaking
  private async checkConsent(actorId: string): Promise<boolean> {
    if (!actorId.startsWith('a-')) {
      // Non-attendees always have consent
      return true;
    }

    const doc = await db.collection('attendees').doc(actorId).get();
    if (!doc.exists) return false;

    const attendee = doc.data() as Attendee;
    return attendee.consent.matchmaking;
  }

  // Update scan statistics
  private async updateScanStats(fromId: string, toId: string): Promise<void> {
    const batch = db.batch();

    // Update "from" attendee
    if (fromId.startsWith('a-')) {
      const fromRef = db.collection('attendees').doc(fromId);
      batch.update(fromRef, {
        'scanStats.scansGiven': FieldValue.increment(1)
      });
    }

    // Update "to" actor
    if (toId.startsWith('a-')) {
      const toRef = db.collection('attendees').doc(toId);
      batch.update(toRef, {
        'scanStats.scansReceived': FieldValue.increment(1)
      });
    }

    await batch.commit();
  }

  // Enqueue pair for recomputation
  private async enqueuePairRecompute(actorA: string, actorB: string): Promise<void> {
    // In production, this would publish to a Pub/Sub topic or Cloud Task
    // For now, we'll just log it
    console.log(`[AttendeeIngest] Enqueuing recompute for pair: ${actorA} <-> ${actorB}`);

    // Optional: Trigger immediate recompute for this pair
    // await matchEngine.computePairMatch(actorA, actorB);
  }

  // Log upload for audit
  private async logUpload(fileName: string, result: any): Promise<void> {
    await db.collection('ingestLogs').add({
      uploadId: uuidv4(),
      fileName,
      type: 'attendees',
      result,
      timestamp: Timestamp.now()
    });
  }
}