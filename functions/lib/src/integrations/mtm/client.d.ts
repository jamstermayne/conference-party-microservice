import { MTMAccount } from './models';
/**
 * MTM Meeting from API
 */
export interface MTMMeeting {
    id: string;
    title: string;
    timeslot: {
        start: string;
        end: string;
        timezone: string;
    };
    participants: Array<{
        id: string;
        name: string;
        org?: string;
        role?: string;
    }>;
    location?: {
        type: 'venue' | 'online' | 'hybrid';
        venue?: string;
        address?: string;
        online?: {
            url: string;
            platform: string;
        };
    };
    status: 'confirmed' | 'pending' | 'declined' | 'canceled';
    links?: {
        joinUrl?: string;
        detailsUrl?: string;
    };
    updatedAt: string;
    etag?: string;
}
/**
 * MTM API Response
 */
interface MTMListResponse {
    meetings: MTMMeeting[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
    };
}
/**
 * Ensure access token is fresh
 */
export declare function ensureFreshToken(account: MTMAccount, uid: string): Promise<string>;
/**
 * List meetings from MTM API
 */
export declare function listMeetings(accessToken: string, from: string, to: string, page?: number, pageSize?: number): Promise<MTMListResponse>;
/**
 * Paginate through all meetings
 */
export declare function paginateMeetings(accessToken: string, from: string, to: string): AsyncGenerator<MTMMeeting>;
/**
 * Get user profile from MTM
 */
export declare function getUserProfile(accessToken: string): Promise<{
    id: string;
    name: string;
    email: string;
    org?: string;
}>;
export declare function geocodeLocation(location: string): Promise<{
    lat: number;
    lng: number;
} | null>;
/**
 * Convert MTM timezone to IANA timezone
 */
export declare function normalizeTimezone(tz: string): string;
export {};
//# sourceMappingURL=client.d.ts.map