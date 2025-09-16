/**
 * Match Engine - Core matching logic with weighted scoring
 * Computes pairwise matches with explainability
 */
import { Company, Match, WeightProfile, MatchRequest, BatchResult } from './types';
export declare class MatchEngine {
    private signalEngine;
    private cache;
    private cacheTimeout;
    constructor();
    initialize(companies?: Company[]): Promise<void>;
    getWeightProfile(profileId?: string): Promise<WeightProfile>;
    calculateMatch(companyA: Company, companyB: Company, profile: WeightProfile): Promise<Match>;
    findMatches(request: MatchRequest): Promise<Match[]>;
    computeAllMatches(profileId?: string): Promise<BatchResult>;
    private calculateConfidence;
    private getMetricDisplayName;
    private getFromCache;
    private setCache;
    clearCache(): void;
}
//# sourceMappingURL=match-engine.d.ts.map