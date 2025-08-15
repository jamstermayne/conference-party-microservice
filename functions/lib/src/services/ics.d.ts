import { MtmEvent } from '../models/mtm';
export declare class IcsService {
    /**
     * Parse ICS data using the ical library for more robust parsing
     */
    parseICS(icsData: string): MtmEvent[];
    /**
     * Fetch ICS file with proper caching headers
     */
    fetchICS(url: string, etag?: string, lastModified?: string): Promise<{
        ok: boolean;
        data?: string;
        etag?: string;
        lastModified?: string;
        notModified?: boolean;
    }>;
}
export declare const icsService: IcsService;
//# sourceMappingURL=ics.d.ts.map