/**
 * Meeting Scheduler - Lightweight meeting request and scheduling system
 * Handles consent validation, availability matching, and auto-packing
 */
import { Meeting, MeetingRequest } from './attendee-types';
export declare class MeetingScheduler {
    requestMeeting(request: MeetingRequest): Promise<Meeting>;
    acceptMeeting(meetingId: string, chosenSlot: string): Promise<Meeting>;
    declineMeeting(meetingId: string, reason?: string): Promise<Meeting>;
    autoPackMeetings(day: string, profileId?: string): Promise<{
        scheduled: number;
        conflicts: number;
        totalRequests: number;
    }>;
    getMeetingsForActor(actorId: string, status?: string): Promise<Meeting[]>;
    exportToICS(meetings: Meeting[]): Promise<string>;
    private validateMeetingRequest;
    private findExistingMeeting;
    private findOverlappingSlots;
    private getActorAvailability;
    private isSlotAvailable;
    private blockSlot;
    private sendMeetingNotification;
    private scoreMeetings;
    private getActorName;
    private formatICSDate;
}
//# sourceMappingURL=meeting-scheduler.d.ts.map