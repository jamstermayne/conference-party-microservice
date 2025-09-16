/**
 * Taxonomy Analyzer - Generates visualizations and insights from company data
 * Supports heatmaps, network graphs, distributions, and correlations
 */

import * as admin from 'firebase-admin';
import { Company, TaxonomyRequest, TaxonomyResponse } from './types';

export class TaxonomyAnalyzer {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Generate taxonomy visualization based on request
   */
  async generateVisualization(request: TaxonomyRequest): Promise<TaxonomyResponse> {
    const startTime = Date.now();

    // Load companies with filters
    const companies = await this.loadFilteredCompanies(request.filters);

    if (companies.length === 0) {
      throw new Error('No companies found matching the specified filters');
    }

    let data: any;

    switch (request.visualization) {
      case 'heatmap':
        data = this.generateHeatmap(companies, request.dimension);
        break;
      case 'network':
        data = this.generateNetworkGraph(companies, request.dimension);
        break;
      case 'distribution':
        data = this.generateDistribution(companies, request.dimension);
        break;
      case 'correlation':
        data = this.generateCorrelation(companies, request.dimension);
        break;
      default:
        throw new Error(`Unsupported visualization type: ${request.visualization}`);
    }

    // Calculate metadata
    const dimensionValues = this.extractDimensionValues(companies, request.dimension);
    const coverage = this.calculateCoverage(companies, request.dimension);

    return {
      dimension: request.dimension,
      visualization: request.visualization,
      data,
      metadata: {
        totalCompanies: companies.length,
        uniqueValues: dimensionValues.size,
        coverage,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Load companies with optional filtering
   */
  private async loadFilteredCompanies(filters?: TaxonomyRequest['filters']): Promise<Company[]> {
    let query: FirebaseFirestore.Query = this.db.collection('companies');

    // Apply filters
    if (filters?.companyTypes?.length) {
      query = query.where('type', 'in', filters.companyTypes);
    }
    if (filters?.countries?.length) {
      query = query.where('country', 'in', filters.countries);
    }
    if (filters?.fundingStages?.length) {
      query = query.where('fundingStage', 'in', filters.fundingStages);
    }

    const snapshot = await query.limit(5000).get(); // Limit for performance
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Company[];
  }

  /**
   * Generate heatmap data for co-occurrence analysis
   */
  private generateHeatmap(companies: Company[], dimension: string): any {
    const values = this.extractAllDimensionValues(companies, dimension);
    const valueList = Array.from(values);

    // Create co-occurrence matrix
    const matrix: number[][] = [];
    const labels: string[] = valueList;

    // Initialize matrix
    for (let i = 0; i < valueList.length; i++) {
      matrix[i] = new Array(valueList.length).fill(0);
    }

    // Count co-occurrences
    for (const company of companies) {
      const companyValues = this.getCompanyDimensionValues(company, dimension);

      for (let i = 0; i < valueList.length; i++) {
        for (let j = 0; j < valueList.length; j++) {
          if (companyValues.has(valueList[i]) && companyValues.has(valueList[j])) {
            matrix[i][j]++;
          }
        }
      }
    }

    // Calculate percentages and format for visualization
    const maxValue = Math.max(...matrix.flat());
    const heatmapData = matrix.map((row, i) =>
      row.map((value, j) => ({
        x: j,
        y: i,
        value,
        percentage: maxValue > 0 ? (value / maxValue) * 100 : 0,
        xLabel: labels[j],
        yLabel: labels[i]
      }))
    ).flat();

    return {
      type: 'heatmap',
      labels,
      matrix,
      data: heatmapData,
      maxValue,
      totalCombinations: valueList.length * valueList.length
    };
  }

  /**
   * Generate network graph for relationship analysis
   */
  private generateNetworkGraph(companies: Company[], dimension: string): any {
    const values = this.extractAllDimensionValues(companies, dimension);
    const valueList = Array.from(values);

    // Create nodes
    const nodes = valueList.map((value, index) => ({
      id: index,
      name: value,
      label: value,
      size: this.countCompaniesWithValue(companies, dimension, value),
      group: this.getValueGroup(value, dimension)
    }));

    // Create edges based on co-occurrence
    const edges: any[] = [];
    const coOccurrence: Map<string, Map<string, number>> = new Map();

    // Calculate co-occurrences
    for (const company of companies) {
      const companyValues = Array.from(this.getCompanyDimensionValues(company, dimension));

      for (let i = 0; i < companyValues.length; i++) {
        for (let j = i + 1; j < companyValues.length; j++) {
          const value1 = companyValues[i];
          const value2 = companyValues[j];

          if (!coOccurrence.has(value1)) {
            coOccurrence.set(value1, new Map());
          }
          if (!coOccurrence.has(value2)) {
            coOccurrence.set(value2, new Map());
          }

          const count1 = coOccurrence.get(value1)!.get(value2) || 0;
          const count2 = coOccurrence.get(value2)!.get(value1) || 0;

          coOccurrence.get(value1)!.set(value2, count1 + 1);
          coOccurrence.get(value2)!.set(value1, count2 + 1);
        }
      }
    }

    // Create edges with weight threshold
    const minWeight = Math.max(1, Math.floor(companies.length * 0.02)); // 2% threshold

    for (let i = 0; i < valueList.length; i++) {
      for (let j = i + 1; j < valueList.length; j++) {
        const value1 = valueList[i];
        const value2 = valueList[j];
        const weight = coOccurrence.get(value1)?.get(value2) || 0;

        if (weight >= minWeight) {
          edges.push({
            source: i,
            target: j,
            weight,
            label: `${weight} companies`
          });
        }
      }
    }

    return {
      type: 'network',
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      minWeight,
      layout: 'force-directed'
    };
  }

  /**
   * Generate distribution analysis
   */
  private generateDistribution(companies: Company[], dimension: string): any {
    const valueCounts = new Map<string, number>();
    const companiesByValue = new Map<string, Company[]>();

    // Count occurrences
    for (const company of companies) {
      const companyValues = this.getCompanyDimensionValues(company, dimension);

      for (const value of companyValues) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);

        if (!companiesByValue.has(value)) {
          companiesByValue.set(value, []);
        }
        companiesByValue.get(value)!.push(company);
      }
    }

    // Sort by frequency
    const sortedValues = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    // Generate distribution data
    const distributionData = sortedValues.map(([value, count], index) => ({
      rank: index + 1,
      value,
      count,
      percentage: (count / companies.length) * 100,
      companies: companiesByValue.get(value)?.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      })) || []
    }));

    // Calculate statistics
    const counts = sortedValues.map(([, count]) => count);
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const median = counts[Math.floor(counts.length / 2)] || 0;
    const max = Math.max(...counts);
    const min = Math.min(...counts);

    return {
      type: 'distribution',
      data: distributionData,
      statistics: {
        totalValues: valueCounts.size,
        totalOccurrences: Array.from(valueCounts.values()).reduce((sum, c) => sum + c, 0),
        mean: Math.round(mean * 100) / 100,
        median,
        max,
        min,
        range: max - min
      },
      topValues: distributionData.slice(0, 20), // Top 20 for visualization
      longTail: distributionData.length > 20 ? distributionData.slice(20) : []
    };
  }

  /**
   * Generate correlation analysis between dimensions
   */
  private generateCorrelation(companies: Company[], primaryDimension: string): any {
    const secondaryDimensions = ['industry', 'platform', 'technology', 'market', 'capability', 'need']
      .filter(d => d !== primaryDimension);

    const correlations: any[] = [];

    for (const secondaryDimension of secondaryDimensions) {
      const correlation = this.calculateDimensionCorrelation(
        companies,
        primaryDimension,
        secondaryDimension
      );

      if (correlation) {
        correlations.push(correlation);
      }
    }

    // Sort by correlation strength
    correlations.sort((a, b) => b.strength - a.strength);

    return {
      type: 'correlation',
      primaryDimension,
      correlations,
      totalCompanies: companies.length,
      significantCorrelations: correlations.filter(c => c.strength > 0.3)
    };
  }

  /**
   * Calculate correlation between two dimensions
   */
  private calculateDimensionCorrelation(
    companies: Company[],
    dimension1: string,
    dimension2: string
  ): any | null {
    const values1 = this.extractAllDimensionValues(companies, dimension1);
    const values2 = this.extractAllDimensionValues(companies, dimension2);

    if (values1.size < 2 || values2.size < 2) {
      return null;
    }

    // Calculate Jaccard similarities for all value pairs
    const correlationPairs: any[] = [];

    for (const value1 of values1) {
      for (const value2 of values2) {
        const companies1 = companies.filter(c =>
          this.getCompanyDimensionValues(c, dimension1).has(value1)
        );
        const companies2 = companies.filter(c =>
          this.getCompanyDimensionValues(c, dimension2).has(value2)
        );

        const intersection = companies1.filter(c => companies2.includes(c));
        const union = [...new Set([...companies1, ...companies2])];

        const jaccard = union.length > 0 ? intersection.length / union.length : 0;

        if (jaccard > 0.1) { // Only include meaningful correlations
          correlationPairs.push({
            value1,
            value2,
            jaccard,
            sharedCompanies: intersection.length,
            companies1Count: companies1.length,
            companies2Count: companies2.length,
            examples: intersection.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
          });
        }
      }
    }

    // Calculate overall correlation strength
    const avgJaccard = correlationPairs.length > 0 ?
      correlationPairs.reduce((sum, p) => sum + p.jaccard, 0) / correlationPairs.length : 0;

    return {
      dimension: dimension2,
      strength: avgJaccard,
      significantPairs: correlationPairs
        .sort((a, b) => b.jaccard - a.jaccard)
        .slice(0, 10), // Top 10 pairs
      totalPairs: correlationPairs.length
    };
  }

  // ============= UTILITY METHODS =============

  /**
   * Extract all unique values for a dimension across companies
   */
  private extractAllDimensionValues(companies: Company[], dimension: string): Set<string> {
    const values = new Set<string>();

    for (const company of companies) {
      const companyValues = this.getCompanyDimensionValues(company, dimension);
      for (const value of companyValues) {
        values.add(value);
      }
    }

    return values;
  }

  /**
   * Get dimension values for a single company
   */
  private getCompanyDimensionValues(company: Company, dimension: string): Set<string> {
    const values = new Set<string>();

    switch (dimension) {
      case 'industry':
        (company.industry || []).forEach(v => values.add(v));
        break;
      case 'platform':
        (company.platforms || []).forEach(v => values.add(v));
        break;
      case 'technology':
        (company.technologies || []).forEach(v => values.add(v));
        break;
      case 'market':
        (company.markets || []).forEach(v => values.add(v));
        break;
      case 'capability':
        (company.capabilities || []).forEach(v => values.add(v));
        break;
      case 'need':
        (company.needs || []).forEach(v => values.add(v));
        break;
      default:
        // Handle single value dimensions
        const value = company[dimension as keyof Company];
        if (value && typeof value === 'string') {
          values.add(value);
        }
        break;
    }

    return values;
  }

  /**
   * Extract dimension values for metadata
   */
  private extractDimensionValues(companies: Company[], dimension: string): Set<string> {
    return this.extractAllDimensionValues(companies, dimension);
  }

  /**
   * Calculate coverage percentage for a dimension
   */
  private calculateCoverage(companies: Company[], dimension: string): number {
    let companiesWithData = 0;

    for (const company of companies) {
      const values = this.getCompanyDimensionValues(company, dimension);
      if (values.size > 0) {
        companiesWithData++;
      }
    }

    return companies.length > 0 ? (companiesWithData / companies.length) * 100 : 0;
  }

  /**
   * Count companies that have a specific value
   */
  private countCompaniesWithValue(companies: Company[], dimension: string, value: string): number {
    return companies.filter(company =>
      this.getCompanyDimensionValues(company, dimension).has(value)
    ).length;
  }

  /**
   * Get group classification for a value (for network visualization)
   */
  private getValueGroup(value: string, dimension: string): string {
    // Simple grouping logic - can be enhanced with ML clustering
    switch (dimension) {
      case 'industry':
        if (value.toLowerCase().includes('game') || value.toLowerCase().includes('gaming')) {
          return 'gaming';
        } else if (value.toLowerCase().includes('tech') || value.toLowerCase().includes('software')) {
          return 'technology';
        } else if (value.toLowerCase().includes('media') || value.toLowerCase().includes('entertainment')) {
          return 'media';
        }
        return 'other';

      case 'platform':
        if (['mobile', 'ios', 'android'].some(p => value.toLowerCase().includes(p))) {
          return 'mobile';
        } else if (['pc', 'steam', 'epic'].some(p => value.toLowerCase().includes(p))) {
          return 'pc';
        } else if (['console', 'playstation', 'xbox', 'nintendo'].some(p => value.toLowerCase().includes(p))) {
          return 'console';
        } else if (['web', 'browser'].some(p => value.toLowerCase().includes(p))) {
          return 'web';
        }
        return 'other';

      default:
        // Simple alphabetical grouping
        const firstChar = value.charAt(0).toLowerCase();
        if (firstChar >= 'a' && firstChar <= 'f') return 'a-f';
        if (firstChar >= 'g' && firstChar <= 'l') return 'g-l';
        if (firstChar >= 'm' && firstChar <= 'r') return 'm-r';
        if (firstChar >= 's' && firstChar <= 'z') return 's-z';
        return 'other';
    }
  }
}