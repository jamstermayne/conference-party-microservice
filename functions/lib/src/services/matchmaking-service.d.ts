/**
 * Matchmaking Service
 * Handles data flow between Firestore and matchmaking logic
 */
import { Timestamp } from 'firebase-admin/firestore';
export interface Company {
    id: string;
    name: string;
    industry: string;
    goals: string[];
    website?: string;
    description?: string;
    size?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}
export interface Match {
    company: Company;
    score: number;
    reasons: string[];
    confidence?: number;
    metrics?: Record<string, number>;
    matchedAt: string;
}
export declare class MatchmakingService {
    private companiesCollection;
    private matchesCollection;
    /**
     * Get all companies from Firestore
     */
    getAllCompanies(): Promise<Company[]>;
    /**
     * Get a single company by ID
     */
    getCompanyById(companyId: string): Promise<Company | null>;
    /**
     * Calculate matches for a company
     */
    calculateMatches(companyId: string, limit?: number): Promise<Match[]>;
    /**
     * Calculate match score between companies with sophisticated algorithms
     */
    private calculateMatchesForCompany;
    /**
     * Calculate advanced matching metrics inspired by the sophisticated system
     */
    private calculateAdvancedMetrics;
    /**
     * Calculate weighted score from metrics
     */
    private calculateWeightedScore;
    /**
     * Generate human-readable reasons from metrics
     */
    private generateReasons;
    /**
     * Calculate confidence based on data completeness
     */
    private calculateConfidence;
    /**
     * Jaccard similarity for arrays
     */
    private jaccardSimilarity;
    /**
     * Industry compatibility scoring
     */
    private industryCompatibility;
    /**
     * Advanced size compatibility
     */
    private calculateSizeCompatibilityAdvanced;
    /**
     * Basic string similarity using edit distance
     */
    private calculateStringSimilarity;
    /**
     * Basic text similarity using word overlap
     */
    private calculateTextSimilarity;
    /**
     * Simplified string similarity (basic character overlap)
     */
    private levenshteinDistance;
    /**
     * Save a match to Firestore
     */
    saveMatch(fromCompanyId: string, toCompanyId: string, score: number): Promise<void>;
    /**
     * Demo companies for testing
     */
    private getDemoCompanies;
}
export declare const matchmakingService: MatchmakingService;
//# sourceMappingURL=matchmaking-service.d.ts.map