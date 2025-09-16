/**
 * Meeting Scheduler - Lightweight meeting request and scheduling system
 * Handles consent validation, availability matching, and auto-packing
 */

import {
  Meeting,
  MeetingRequest,
  Attendee,
  Actor,
  AvailabilitySlot
} from './attendee-types';
import { Company } from './types';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../services/firebase-init';
import { v4 as uuidv4 } from 'uuid';

export class MeetingScheduler {
  // Request a meeting between two actors
  async requestMeeting(request: MeetingRequest): Promise<Meeting> {
    const { fromActorId, toActorId, slots, message } = request;

    // Validate actors exist and have consent
    const validation = await this.validateMeetingRequest(fromActorId, toActorId);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid meeting request');
    }

    // Check for existing meeting
    const existing = await this.findExistingMeeting(fromActorId, toActorId);
    if (existing) {
      throw new Error('Meeting already exists between these parties');
    }

    // Find overlapping slots
    const overlappingSlots = await this.findOverlappingSlots(
      fromActorId,
      toActorId,
      slots
    );

    if (overlappingSlots.length === 0) {
      throw new Error('No overlapping availability found');
    }

    // Create meeting
    const meeting: Meeting = {
      id: uuidv4(),
      fromActorId,
      toActorId,
      requestedSlots: overlappingSlots,
      status: 'requested',
      notes: message,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Save to Firestore
    await db.collection('meetings').doc(meeting.id).set(meeting);

    // Send notification (optional)
    await this.sendMeetingNotification(meeting);

    console.log(`[MeetingScheduler] Meeting requested: ${fromActorId} -> ${toActorId}`);
    return meeting;
  }

  // Accept a meeting request
  async acceptMeeting(meetingId: string, chosenSlot: string): Promise<Meeting> {
    const doc = await db.collection('meetings').doc(meetingId).get();
    if (!doc.exists) {
      throw new Error('Meeting not found');
    }

    const meeting = { id: doc.id, ...doc.data() } as Meeting;

    if (meeting.status !== 'requested') {
      throw new Error('Meeting is not in requested state');
    }

    if (!meeting.requestedSlots.includes(chosenSlot)) {
      throw new Error('Chosen slot not in requested slots');
    }

    // Update meeting
    meeting.chosenSlot = chosenSlot;
    meeting.status = 'scheduled';
    meeting.updatedAt = Timestamp.now();

    await db.collection('meetings').doc(meetingId).update({
      chosenSlot,
      status: 'scheduled',
      updatedAt: meeting.updatedAt
    });

    // Block the slot for both parties
    await this.blockSlot(meeting.fromActorId, chosenSlot);
    await this.blockSlot(meeting.toActorId, chosenSlot);

    console.log(`[MeetingScheduler] Meeting accepted: ${meetingId} at ${chosenSlot}`);
    return meeting;
  }

  // Decline a meeting request
  async declineMeeting(meetingId: string, reason?: string): Promise<Meeting> {
    const doc = await db.collection('meetings').doc(meetingId).get();
    if (!doc.exists) {
      throw new Error('Meeting not found');
    }

    const meeting = { id: doc.id, ...doc.data() } as Meeting;

    if (meeting.status !== 'requested') {
      throw new Error('Meeting is not in requested state');
    }

    // Update meeting
    meeting.status = 'declined';
    meeting.notes = reason ? `${meeting.notes}\nDecline reason: ${reason}` : meeting.notes;
    meeting.updatedAt = Timestamp.now();

    await db.collection('meetings').doc(meetingId).update({
      status: 'declined',
      notes: meeting.notes,
      updatedAt: meeting.updatedAt
    });

    console.log(`[MeetingScheduler] Meeting declined: ${meetingId}`);
    return meeting;
  }

  // Auto-pack meetings based on scores
  async autoPackMeetings(
    day: string,
    profileId: string = 'default'
  ): Promise<{
    scheduled: number;
    conflicts: number;
    totalRequests: number;
  }> {
    const result = {
      scheduled: 0,
      conflicts: 0,
      totalRequests: 0
    };

    try {
      // Get all pending meetings for the day
      const snapshot = await db.collection('meetings')
        .where('status', '==', 'requested')
        .get();

      const meetings: Meeting[] = [];
      snapshot.forEach(doc => {
        const meeting = { id: doc.id, ...doc.data() } as Meeting;
        // Filter by day
        if (meeting.requestedSlots.some(slot => slot.startsWith(day))) {
          meetings.push(meeting);
        }
      });

      result.totalRequests = meetings.length;

      // Get match scores for prioritization
      const scoredMeetings = await this.scoreMeetings(meetings, profileId);

      // Sort by score (highest first)
      scoredMeetings.sort((a, b) => b.score - a.score);

      // Track occupied slots
      const occupiedSlots = new Map<string, Set<string>>(); // actorId -> Set of slots

      // Greedy packing
      for (const { meeting, score } of scoredMeetings) {
        // Find first available slot
        let scheduledSlot: string | null = null;

        for (const slot of meeting.requestedSlots) {
          if (!slot.startsWith(day)) continue;

          const fromOccupied = occupiedSlots.get(meeting.fromActorId) || new Set();
          const toOccupied = occupiedSlots.get(meeting.toActorId) || new Set();

          if (!fromOccupied.has(slot) && !toOccupied.has(slot)) {
            scheduledSlot = slot;
            break;
          }
        }

        if (scheduledSlot) {
          // Schedule the meeting
          await this.acceptMeeting(meeting.id, scheduledSlot);

          // Mark slots as occupied
          if (!occupiedSlots.has(meeting.fromActorId)) {
            occupiedSlots.set(meeting.fromActorId, new Set());
          }
          if (!occupiedSlots.has(meeting.toActorId)) {
            occupiedSlots.set(meeting.toActorId, new Set());
          }
          occupiedSlots.get(meeting.fromActorId)!.add(scheduledSlot);
          occupiedSlots.get(meeting.toActorId)!.add(scheduledSlot);

          result.scheduled++;
        } else {
          result.conflicts++;
        }
      }

      console.log(`[MeetingScheduler] Auto-pack complete: ${result.scheduled} scheduled, ${result.conflicts} conflicts`);

    } catch (error: any) {
      console.error('[MeetingScheduler] Auto-pack failed:', error);
      throw error;
    }

    return result;
  }

  // Get meetings for an actor
  async getMeetingsForActor(
    actorId: string,
    status?: string
  ): Promise<Meeting[]> {
    let query = db.collection('meetings')
      .where('fromActorId', '==', actorId) as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const fromSnapshot = await query.get();

    query = db.collection('meetings')
      .where('toActorId', '==', actorId) as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const toSnapshot = await query.get();

    const meetings: Meeting[] = [];

    fromSnapshot.forEach(doc => {
      meetings.push({ id: doc.id, ...doc.data() } as Meeting);
    });

    toSnapshot.forEach(doc => {
      meetings.push({ id: doc.id, ...doc.data() } as Meeting);
    });

    // Remove duplicates
    const uniqueMeetings = new Map<string, Meeting>();
    meetings.forEach(m => uniqueMeetings.set(m.id, m));

    return Array.from(uniqueMeetings.values());
  }

  // Export meetings to ICS format
  async exportToICS(meetings: Meeting[]): Promise<string> {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Conference Party//Meeting Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    for (const meeting of meetings) {
      if (meeting.status !== 'scheduled' || !meeting.chosenSlot) continue;

      // Parse slot format: "2025-09-15T10:00/30m"
      const [datetime, duration] = meeting.chosenSlot.split('/');
      const startDate = new Date(datetime);
      const durationMinutes = parseInt(duration) || 30;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

      // Get actor names
      const fromName = await this.getActorName(meeting.fromActorId);
      const toName = await this.getActorName(meeting.toActorId);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${meeting.id}@conference-party.app`);
      lines.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
      lines.push(`DTSTART:${this.formatICSDate(startDate)}`);
      lines.push(`DTEND:${this.formatICSDate(endDate)}`);
      lines.push(`SUMMARY:Meeting: ${fromName} & ${toName}`);
      lines.push(`DESCRIPTION:Conference meeting between ${fromName} and ${toName}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  // Private helper methods

  private async validateMeetingRequest(
    fromActorId: string,
    toActorId: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Check both actors exist
    const fromDoc = await db.collection('actors').doc(fromActorId).get();
    const toDoc = await db.collection('actors').doc(toActorId).get();

    if (!fromDoc.exists || !toDoc.exists) {
      return { valid: false, error: 'One or both actors not found' };
    }

    // Check consent for attendees
    if (fromActorId.startsWith('a-')) {
      const attendeeDoc = await db.collection('attendees').doc(fromActorId).get();
      if (attendeeDoc.exists) {
        const attendee = attendeeDoc.data() as Attendee;
        if (!attendee.consent.matchmaking) {
          return { valid: false, error: 'From attendee has not consented to matchmaking' };
        }
      }
    }

    if (toActorId.startsWith('a-')) {
      const attendeeDoc = await db.collection('attendees').doc(toActorId).get();
      if (attendeeDoc.exists) {
        const attendee = attendeeDoc.data() as Attendee;
        if (!attendee.consent.matchmaking) {
          return { valid: false, error: 'To attendee has not consented to matchmaking' };
        }
      }
    }

    return { valid: true };
  }

  private async findExistingMeeting(
    actorA: string,
    actorB: string
  ): Promise<Meeting | null> {
    // Check both directions
    const snapshot1 = await db.collection('meetings')
      .where('fromActorId', '==', actorA)
      .where('toActorId', '==', actorB)
      .where('status', 'in', ['requested', 'scheduled'])
      .limit(1)
      .get();

    if (!snapshot1.empty) {
      return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } as Meeting;
    }

    const snapshot2 = await db.collection('meetings')
      .where('fromActorId', '==', actorB)
      .where('toActorId', '==', actorA)
      .where('status', 'in', ['requested', 'scheduled'])
      .limit(1)
      .get();

    if (!snapshot2.empty) {
      return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as Meeting;
    }

    return null;
  }

  private async findOverlappingSlots(
    fromActorId: string,
    toActorId: string,
    requestedSlots: string[]
  ): Promise<string[]> {
    // Get availability for both actors
    const fromAvail = await this.getActorAvailability(fromActorId);
    const toAvail = await this.getActorAvailability(toActorId);

    // Find overlaps
    const overlapping: string[] = [];

    for (const slot of requestedSlots) {
      // Check if slot is available for both
      const slotAvailableFrom = this.isSlotAvailable(slot, fromAvail);
      const slotAvailableTo = this.isSlotAvailable(slot, toAvail);

      if (slotAvailableFrom && slotAvailableTo) {
        overlapping.push(slot);
      }
    }

    return overlapping;
  }

  private async getActorAvailability(actorId: string): Promise<AvailabilitySlot[]> {
    if (actorId.startsWith('a-')) {
      const doc = await db.collection('attendees').doc(actorId).get();
      if (doc.exists) {
        const attendee = doc.data() as Attendee;
        return attendee.preferences.availability || [];
      }
    }

    // Companies/sponsors might have availability in a different format
    // For now, return empty (all slots available)
    return [];
  }

  private isSlotAvailable(slot: string, availability: AvailabilitySlot[]): boolean {
    if (availability.length === 0) {
      // No availability specified = all slots available
      return true;
    }

    // Parse slot format: "2025-09-15T10:00/30m"
    const [datetime] = slot.split('/');
    const date = datetime.split('T')[0];
    const time = datetime.split('T')[1];

    // Find matching day
    const dayAvail = availability.find(a => a.day === date);
    if (!dayAvail) return false;

    // Check if time slot is in availability
    // This is simplified - in production would need more sophisticated time matching
    return dayAvail.slots.some(s => s.includes(time));
  }

  private async blockSlot(actorId: string, slot: string): Promise<void> {
    // In production, this would update the actor's availability
    // to mark the slot as occupied
    console.log(`[MeetingScheduler] Blocking slot ${slot} for ${actorId}`);
  }

  private async sendMeetingNotification(meeting: Meeting): Promise<void> {
    // In production, this would send email/push notifications
    console.log(`[MeetingScheduler] Notification sent for meeting ${meeting.id}`);
  }

  private async scoreMeetings(
    meetings: Meeting[],
    profileId: string
  ): Promise<Array<{ meeting: Meeting; score: number }>> {
    const scored: Array<{ meeting: Meeting; score: number }> = [];

    for (const meeting of meetings) {
      // Get match score between the two actors
      const matchDoc = await db
        .collection('matches')
        .doc(profileId)
        .collection('pairs')
        .doc([meeting.fromActorId, meeting.toActorId].sort().join('__'))
        .get();

      const score = matchDoc.exists ? matchDoc.data()?.score || 0 : 0;
      scored.push({ meeting, score });
    }

    return scored;
  }

  private async getActorName(actorId: string): Promise<string> {
    const doc = await db.collection('actors').doc(actorId).get();
    if (!doc.exists) return 'Unknown';

    const actor = doc.data() as Actor;
    return actor.name;
  }

  private formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
}