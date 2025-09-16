/**
 * Taxonomy Analyzer - Generates visualizations and insights from company data
 * Supports heatmaps, network graphs, distributions, and correlations
 */
import { TaxonomyRequest, TaxonomyResponse } from './types';
export declare class TaxonomyAnalyzer {
    private db;
    constructor();
    /**
     * Generate taxonomy visualization based on request
     */
    generateVisualization(request: TaxonomyRequest): Promise<TaxonomyResponse>;
    /**
     * Load companies with optional filtering
     */
    private loadFilteredCompanies;
    /**
     * Generate heatmap data for co-occurrence analysis
     */
    private generateHeatmap;
    /**
     * Generate network graph for relationship analysis
     */
    private generateNetworkGraph;
    /**
     * Generate distribution analysis
     */
    private generateDistribution;
    /**
     * Generate correlation analysis between dimensions
     */
    private generateCorrelation;
    /**
     * Calculate correlation between two dimensions
     */
    private calculateDimensionCorrelation;
    /**
     * Extract all unique values for a dimension across companies
     */
    private extractAllDimensionValues;
    /**
     * Get dimension values for a single company
     */
    private getCompanyDimensionValues;
    /**
     * Extract dimension values for metadata
     */
    private extractDimensionValues;
    /**
     * Calculate coverage percentage for a dimension
     */
    private calculateCoverage;
    /**
     * Count companies that have a specific value
     */
    private countCompaniesWithValue;
    /**
     * Get group classification for a value (for network visualization)
     */
    private getValueGroup;
}
//# sourceMappingURL=taxonomy-analyzer.d.ts.map