/**
 * Ingests party data from live source into Firestore
 * Uses composite key: {conference}:{externalId} for document IDs
 */
export declare function runIngest(): Promise<{
    success: boolean;
    ingested: number;
    errors: number;
    message: string;
}>;
/**
 * Manual trigger endpoint for testing
 */
export declare function triggerIngest(_req: any, res: any): Promise<void>;
//# sourceMappingURL=ingest-parties.d.ts.map