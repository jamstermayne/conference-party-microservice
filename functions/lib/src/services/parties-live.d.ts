/**
 * Normalized party structure for consistent data handling
 */
export interface NormalizedParty {
    conference: string;
    externalId: string;
    title: string;
    venue: string;
    date: string;
    time: string;
    price: string;
    source: string;
    description?: string;
    link?: string;
    capacity?: number;
    tags?: string[];
    lastUpdated: string;
}
/**
 * Validates if an object is a valid NormalizedParty
 */
export declare function isValidParty(data: any): data is NormalizedParty;
/**
 * Fetches live party data from Google Sheets
 */
export declare function fetchLive(): Promise<NormalizedParty[]>;
/**
 * Gets parties from Firestore cache
 */
export declare function getPartiesFromFirestore(conference?: string): Promise<NormalizedParty[]>;
//# sourceMappingURL=parties-live.d.ts.map