import * as functions from "firebase-functions";
/**
 * Aggregation function for hotspot data
 * Runs every 5 minutes to update venue attendance counts
 */
export declare const aggregateHotspots: any;
/**
 * Increment hotspot count when RSVP is created
 */
export declare const onRSVPCreated: any;
/**
 * Handle check-in events
 */
export declare const onCheckIn: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
//# sourceMappingURL=aggregation.d.ts.map