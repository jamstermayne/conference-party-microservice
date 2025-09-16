/**
 * HTTP Endpoints for Matchmaking System
 * Provides API endpoints for attendee ingestion and scan processing
 */
import * as functions from 'firebase-functions';
/**
 * HTTP endpoint for processing badge scans
 * POST /matchmaking-processScan
 */
export declare const processScan: functions.https.HttpsFunction;
/**
 * HTTP endpoint for bulk attendee upload
 * POST /matchmaking-ingestAttendees
 */
export declare const ingestAttendees: functions.https.HttpsFunction;
/**
 * Callable function for calculating matches
 */
export declare const calculateMatches: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    calculated: number;
    results: {
        actorId: any;
        matchCount: any;
        topMatches: any;
    }[];
}>, unknown>;
/**
 * Callable function for scheduling meetings
 */
export declare const scheduleMeeting: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    meetingId: any;
    status: "cancelled" | "accepted" | "declined" | "completed" | "requested" | "scheduled";
}>, unknown>;
/**
 * HTTP endpoint for scan webhook (for physical badge scanner integration)
 * POST /matchmaking-scanWebhook
 */
export declare const scanWebhook: functions.https.HttpsFunction;
//# sourceMappingURL=http-endpoints.d.ts.map