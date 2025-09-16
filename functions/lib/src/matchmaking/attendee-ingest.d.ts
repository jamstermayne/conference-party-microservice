/**
 * Attendee Ingestion - CSV/XLS upload and badge scan processing
 * Handles consent, privacy, and actor materialization
 */
import { AttendeeUploadConfig, BadgeScan, ScanIngestRequest } from './attendee-types';
export declare class AttendeeIngestService {
    processUpload(fileBuffer: Buffer, fileName: string, config: AttendeeUploadConfig): Promise<{
        success: number;
        failed: number;
        skipped: number;
        errors: Array<{
            row: number;
            error: string;
        }>;
        dryRun: boolean;
    }>;
    processScan(request: ScanIngestRequest): Promise<BadgeScan>;
    private parseCSV;
    private parseExcel;
    private transformRow;
    private findExisting;
    private mergeAttendee;
    private saveAttendee;
    private materializeToActor;
    private resolveActorId;
    private checkConsent;
    private updateScanStats;
    private enqueuePairRecompute;
    private logUpload;
}
//# sourceMappingURL=attendee-ingest.d.ts.map