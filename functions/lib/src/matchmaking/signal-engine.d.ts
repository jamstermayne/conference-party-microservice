/**
 * Signal Engine - Advanced metrics for company matching
 * Implements date, list, numeric, string, text, and bipartite signals
 */
import { Company } from './types';
export declare class SignalEngine {
    private tfidfEngine;
    private corpusStats;
    constructor();
    initialize(companies: Company[]): void;
    dateProximity(dateA?: Date | any, dateB?: Date | any, horizonDays?: number): number;
    jaccardSimilarity(listA: any[], listB: any[]): number;
    zExpSimilarity(valueA: number | undefined, valueB: number | undefined, field: string, temperature?: number): number;
    levenshteinSimilarity(strA: string, strB: string): number;
    textCosineSimilarity(companyA: Company, companyB: Company): number;
    bipartiteMatching(capabilitiesA: string[], needsB: string[]): number;
    bidirectionalBipartite(companyA: Company, companyB: Company): number;
    platformOverlap(platformsA: string[], platformsB: string[]): number;
    marketOverlap(marketsA: string[], marketsB: string[]): number;
    stageComplement(stageA: string, stageB: string): number;
    calculateMetrics(companyA: Company, companyB: Company): Record<string, number>;
    generateReasons(metrics: Record<string, number>, topN?: number): string[];
}
//# sourceMappingURL=signal-engine.d.ts.map