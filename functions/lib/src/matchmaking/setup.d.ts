/**
 * Matchmaking System Setup
 * Initializes collections, default data, and admin users
 */
export declare class MatchmakingSetup {
    private db;
    private weightsManager;
    private authMiddleware;
    constructor();
    /**
     * Initialize the entire matchmaking system
     */
    initializeSystem(adminEmail: string): Promise<void>;
    /**
     * Create required Firestore indexes
     */
    private createFirestoreIndexes;
    /**
     * Initialize Firestore collections with proper structure
     */
    private initializeCollections;
    /**
     * Create default weights profiles
     */
    private createDefaultWeightsProfiles;
    /**
     * Create initial admin user
     */
    private createAdminUser;
    /**
     * Create sample company data for testing
     */
    private createSampleData;
    /**
     * Verify system health after setup
     */
    verifySystemHealth(): Promise<boolean>;
    /**
     * Generate setup summary
     */
    generateSetupSummary(): Promise<any>;
}
export declare function setupMatchmakingSystem(adminEmail: string): Promise<any>;
//# sourceMappingURL=setup.d.ts.map