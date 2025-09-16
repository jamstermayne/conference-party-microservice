/**
 * Signal Engine - Advanced metrics for company matching
 * Implements date, list, numeric, string, text, and bipartite signals
 */

import { Company } from './types';
import * as natural from 'natural';

// TF-IDF implementation
class TfIdfEngine {
  private tfidf: any;
  private corpus: Map<string, string> = new Map();

  constructor() {
    this.tfidf = new natural.TfIdf();
  }

  addDocument(id: string, text: string) {
    this.corpus.set(id, text);
    this.tfidf.addDocument(text);
  }

  buildFromCompanies(companies: Company[]) {
    companies.forEach(company => {
      const text = [
        company.text.title,
        company.text.description,
        company.text.abstract,
        company.text.sentence1,
        company.text.sentence2,
        company.tags?.join(' ')
      ].filter(Boolean).join(' ');

      if (text) {
        this.addDocument(company.id, text);
      }
    });
  }

  cosineSimilarity(docA: string, docB: string): number {
    const indexA = Array.from(this.corpus.keys()).indexOf(docA);
    const indexB = Array.from(this.corpus.keys()).indexOf(docB);

    if (indexA === -1 || indexB === -1) return 0;

    const vectorA: number[] = [];
    const vectorB: number[] = [];
    const terms = new Set<string>();

    // Get all terms
    this.tfidf.listTerms(indexA).forEach((item: any) => terms.add(item.term));
    this.tfidf.listTerms(indexB).forEach((item: any) => terms.add(item.term));

    // Build vectors
    terms.forEach(term => {
      vectorA.push(this.tfidf.tfidf(term, indexA) || 0);
      vectorB.push(this.tfidf.tfidf(term, indexB) || 0);
    });

    // Calculate cosine similarity
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export class SignalEngine {
  private tfidfEngine: TfIdfEngine;
  private corpusStats: Map<string, { mean: number; std: number }> = new Map();

  constructor() {
    this.tfidfEngine = new TfIdfEngine();
  }

  // Initialize with company corpus
  initialize(companies: Company[]) {
    // Build TF-IDF corpus
    this.tfidfEngine.buildFromCompanies(companies);

    // Calculate corpus statistics for numeric fields
    const numericFields = ['rating', 'price', 'cost', 'team', 'float1', 'float2', 'int1'];

    numericFields.forEach(field => {
      const values = companies
        .map(c => (c.numeric as any)[field])
        .filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);

        this.corpusStats.set(field, { mean, std: std || 1 });
      }
    });
  }

  // DATE: Proximity-based similarity
  dateProximity(dateA?: Date | any, dateB?: Date | any, horizonDays: number = 365): number {
    if (!dateA || !dateB) return 0;

    const msA = dateA.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
    const msB = dateB.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();

    const horizonMs = horizonDays * 24 * 60 * 60 * 1000;
    const delta = Math.abs(msA - msB) / horizonMs;

    return Math.exp(-delta); // Exponential decay
  }

  // LIST: Jaccard similarity
  jaccardSimilarity(listA: any[], listB: any[]): number {
    if (!listA?.length && !listB?.length) return 1;
    if (!listA?.length || !listB?.length) return 0;

    const setA = new Set(listA);
    const setB = new Set(listB);

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // NUMERIC: Z-score exponential similarity
  zExpSimilarity(valueA: number | undefined, valueB: number | undefined, field: string, temperature: number = 1): number {
    if (valueA === undefined || valueB === undefined) return 0;

    const stats = this.corpusStats.get(field);
    if (!stats) return 0;

    const zA = (valueA - stats.mean) / stats.std;
    const zB = (valueB - stats.mean) / stats.std;

    const diff = Math.abs(zA - zB);
    return Math.exp(-diff / temperature);
  }

  // STRING: Levenshtein normalized similarity
  levenshteinSimilarity(strA: string, strB: string): number {
    if (!strA || !strB) return 0;
    if (strA === strB) return 1;

    const matrix: number[][] = [];
    const lenA = strA.length;
    const lenB = strB.length;

    // Initialize matrix
    for (let i = 0; i <= lenB; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= lenA; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= lenB; i++) {
      for (let j = 1; j <= lenA; j++) {
        if (strB.charAt(i - 1) === strA.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[lenB][lenA];
    const maxLen = Math.max(lenA, lenB);

    return 1 - (distance / maxLen);
  }

  // TEXT: TF-IDF cosine similarity
  textCosineSimilarity(companyA: Company, companyB: Company): number {
    return this.tfidfEngine.cosineSimilarity(companyA.id, companyB.id);
  }

  // BIPARTITE: Capability-Need matching
  bipartiteMatching(capabilitiesA: string[], needsB: string[]): number {
    if (!capabilitiesA?.length || !needsB?.length) return 0;

    const matches = needsB.filter(need =>
      capabilitiesA.some(cap =>
        cap.toLowerCase().includes(need.toLowerCase()) ||
        need.toLowerCase().includes(cap.toLowerCase())
      )
    );

    return matches.length / needsB.length;
  }

  // BIPARTITE: Bidirectional matching
  bidirectionalBipartite(companyA: Company, companyB: Company): number {
    const aToB = this.bipartiteMatching(companyA.capabilities, companyB.needs);
    const bToA = this.bipartiteMatching(companyB.capabilities, companyA.needs);

    // Return max to favor any strong match
    return Math.max(aToB, bToA);
  }

  // CONTEXT: Platform overlap
  platformOverlap(platformsA: string[], platformsB: string[]): number {
    return this.jaccardSimilarity(platformsA, platformsB);
  }

  // CONTEXT: Market overlap
  marketOverlap(marketsA: string[], marketsB: string[]): number {
    return this.jaccardSimilarity(marketsA, marketsB);
  }

  // CONTEXT: Stage complementarity
  stageComplement(stageA: string, stageB: string): number {
    const complementMap: Record<string, Record<string, number>> = {
      'Startup': { 'Startup': 0.5, 'Scale': 0.8, 'Enterprise': 1.0 },
      'Scale': { 'Startup': 0.8, 'Scale': 0.7, 'Enterprise': 0.9 },
      'Enterprise': { 'Startup': 1.0, 'Scale': 0.9, 'Enterprise': 0.6 }
    };

    return complementMap[stageA]?.[stageB] || 0.5;
  }

  // Calculate all metrics for a company pair
  calculateMetrics(companyA: Company, companyB: Company): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Date metrics
    if (companyA.dates.created && companyB.dates.created) {
      metrics['date:created.prox'] = this.dateProximity(companyA.dates.created, companyB.dates.created);
    }
    if (companyA.dates.released && companyB.dates.released) {
      metrics['date:released.prox'] = this.dateProximity(companyA.dates.released, companyB.dates.released, 180);
    }

    // List metrics
    metrics['list:platforms.jaccard'] = this.jaccardSimilarity(companyA.platforms, companyB.platforms);
    metrics['list:markets.jaccard'] = this.jaccardSimilarity(companyA.markets, companyB.markets);
    metrics['list:categories.jaccard'] = this.jaccardSimilarity(companyA.categories, companyB.categories);
    metrics['list:tags.jaccard'] = this.jaccardSimilarity(companyA.tags, companyB.tags);

    // Numeric metrics
    if (companyA.numeric.rating !== undefined && companyB.numeric.rating !== undefined) {
      metrics['num:rating.zexp'] = this.zExpSimilarity(companyA.numeric.rating, companyB.numeric.rating, 'rating');
    }
    if (companyA.numeric.team !== undefined && companyB.numeric.team !== undefined) {
      metrics['num:team.zexp'] = this.zExpSimilarity(companyA.numeric.team, companyB.numeric.team, 'team');
    }
    if (companyA.numeric.price !== undefined && companyB.numeric.price !== undefined) {
      metrics['num:price.zexp'] = this.zExpSimilarity(companyA.numeric.price, companyB.numeric.price, 'price');
    }

    // String metrics
    if (companyA.name && companyB.name) {
      metrics['str:name.lev'] = this.levenshteinSimilarity(companyA.name, companyB.name);
    }

    // Text metrics
    metrics['text:content.tfidf'] = this.textCosineSimilarity(companyA, companyB);

    // Bipartite metrics
    metrics['bipartite:capabilities.match'] = this.bidirectionalBipartite(companyA, companyB);

    // Context metrics
    metrics['ctx:platform.overlap'] = this.platformOverlap(companyA.platforms, companyB.platforms);
    metrics['ctx:market.overlap'] = this.marketOverlap(companyA.markets, companyB.markets);
    metrics['ctx:stage.complement'] = this.stageComplement(companyA.stage, companyB.stage);

    // Filter out zero or invalid values
    Object.keys(metrics).forEach(key => {
      if (isNaN(metrics[key]) || metrics[key] === 0) {
        delete metrics[key];
      }
    });

    return metrics;
  }

  // Generate human-readable reasons from metrics
  generateReasons(metrics: Record<string, number>, topN: number = 3): string[] {
    const reasons: string[] = [];

    // Sort by value
    const sortedMetrics = Object.entries(metrics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN);

    sortedMetrics.forEach(([key, value]) => {
      const percentage = Math.round(value * 100);

      if (key.includes('platforms')) {
        reasons.push(`Strong platform alignment (${percentage}% match)`);
      } else if (key.includes('markets')) {
        reasons.push(`Overlapping target markets (${percentage}% similarity)`);
      } else if (key.includes('capabilities')) {
        reasons.push(`Complementary capabilities and needs (${percentage}% fit)`);
      } else if (key.includes('stage')) {
        reasons.push(`Compatible company stages (${percentage}% synergy)`);
      } else if (key.includes('rating')) {
        reasons.push(`Similar quality ratings (${percentage}% alignment)`);
      } else if (key.includes('text')) {
        reasons.push(`Strong content similarity (${percentage}% match)`);
      } else if (key.includes('categories')) {
        reasons.push(`Shared business categories (${percentage}% overlap)`);
      } else if (key.includes('tags')) {
        reasons.push(`Common interest tags (${percentage}% match)`);
      } else if (key.includes('created')) {
        reasons.push(`Similar founding timeline (${percentage}% proximity)`);
      } else {
        reasons.push(`${key.split(':')[1]?.split('.')[0]} compatibility: ${percentage}%`);
      }
    });

    return reasons;
  }
}