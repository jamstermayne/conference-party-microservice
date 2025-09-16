/**
 * Match Engine - Core matching logic with weighted scoring
 * Computes pairwise matches with explainability
 */

import {
  Company,
  Match,
  WeightProfile,
  Contribution,
  MatchRequest,
  BatchResult
} from './types';
import { SignalEngine } from './signal-engine';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../services/firebase-init';

export class MatchEngine {
  private signalEngine: SignalEngine;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.signalEngine = new SignalEngine();
  }

  // Initialize the engine with company data
  async initialize(companies?: Company[]) {
    if (!companies) {
      // Load all companies from Firestore
      const snapshot = await db.collection('companies').get();
      companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    }

    this.signalEngine.initialize(companies);
    console.log(`[MatchEngine] Initialized with ${companies.length} companies`);
  }

  // Get or create default weight profile
  async getWeightProfile(profileId: string = 'default'): Promise<WeightProfile> {
    const cacheKey = `profile:${profileId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const doc = await db.collection('weights').doc(profileId).get();

    if (doc.exists) {
      const profile = doc.data() as WeightProfile;
      this.setCache(cacheKey, profile);
      return profile;
    }

    // Create default profile
    const defaultProfile: WeightProfile = {
      profileId,
      weights: {
        'date:created.prox': 1,
        'date:released.prox': 1,
        'list:platforms.jaccard': 2,
        'list:markets.jaccard': 2,
        'list:categories.jaccard': 1.5,
        'list:tags.jaccard': 1,
        'num:rating.zexp': 1,
        'num:team.zexp': 0.5,
        'num:price.zexp': 0.5,
        'str:name.lev': 0.1,
        'text:content.tfidf': 1.5,
        'bipartite:capabilities.match': 3,
        'ctx:platform.overlap': 1.5,
        'ctx:market.overlap': 1.5,
        'ctx:stage.complement': 2
      },
      normalize: {
        method: 'zexp',
        temperature: 1
      },
      topN: 10,
      threshold: 0.3
    };

    // Save default profile
    await db.collection('weights').doc(profileId).set(defaultProfile);
    this.setCache(cacheKey, defaultProfile);

    return defaultProfile;
  }

  // Calculate match score between two companies
  async calculateMatch(
    companyA: Company,
    companyB: Company,
    profile: WeightProfile
  ): Promise<Match> {
    // Calculate metrics
    const metrics = this.signalEngine.calculateMetrics(companyA, companyB);

    // Calculate contributions
    const contributions: Contribution[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(metrics).forEach(([key, value]) => {
      const weight = profile.weights[key] || 1;
      const contribution = value * weight;

      contributions.push({
        key,
        value,
        weight,
        contribution,
        displayName: this.getMetricDisplayName(key)
      });

      totalWeight += weight;
      weightedSum += contribution;
    });

    // Calculate final score
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Sort contributions by impact
    contributions.sort((a, b) => b.contribution - a.contribution);

    // Generate reasons
    const reasons = this.signalEngine.generateReasons(metrics, 3);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(companyA, companyB, metrics);

    // Create edge ID (sorted to avoid duplicates)
    const edgeId = [companyA.id, companyB.id].sort().join('__');

    return {
      edgeId,
      a: companyA.id,
      b: companyB.id,
      score,
      metrics,
      weights: profile.weights,
      contributions,
      reasons,
      confidence,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  }

  // Find best matches for a company
  async findMatches(request: MatchRequest): Promise<Match[]> {
    const {
      companyId,
      companies = [],
      profileId = 'default',
      limit = 10,
      threshold = 0.3,
      includeMetrics = true,
      includeReasons = true,
      filters = {}
    } = request;

    // Get weight profile
    const profile = await this.getWeightProfile(profileId);

    // Get source company
    let sourceCompany: Company | null = null;
    if (companyId) {
      const doc = await db.collection('companies').doc(companyId).get();
      if (doc.exists) {
        sourceCompany = { id: doc.id, ...doc.data() } as Company;
      }
    }

    // Get candidate companies
    let candidates: Company[] = [];

    if (companies.length > 0) {
      // Use specified companies
      const snapshot = await db.collection('companies')
        .where('__name__', 'in', companies)
        .get();
      candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    } else {
      // Get all companies with filters
      let query = db.collection('companies') as any;

      if (filters.platforms?.length) {
        query = query.where('platforms', 'array-contains-any', filters.platforms);
      }
      if (filters.markets?.length) {
        query = query.where('markets', 'array-contains-any', filters.markets);
      }
      if (filters.categories?.length) {
        query = query.where('categories', 'array-contains-any', filters.categories);
      }
      if (filters.stages?.length) {
        query = query.where('stage', 'in', filters.stages);
      }

      const snapshot = await query.limit(100).get();
      candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    }

    // Calculate matches
    const matches: Match[] = [];

    if (sourceCompany) {
      // Match against source company
      for (const candidate of candidates) {
        if (candidate.id === sourceCompany.id) continue;

        const match = await this.calculateMatch(sourceCompany, candidate, profile);

        if (match.score >= threshold) {
          matches.push(match);
        }
      }
    } else {
      // All-pairs matching
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const match = await this.calculateMatch(candidates[i], candidates[j], profile);

          if (match.score >= threshold) {
            matches.push(match);
          }
        }
      }
    }

    // Sort by score and limit
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, limit);

    // Clean up based on options
    if (!includeMetrics) {
      topMatches.forEach(m => delete m.metrics);
    }
    if (!includeReasons) {
      topMatches.forEach(m => delete m.reasons);
    }

    return topMatches;
  }

  // Batch compute matches for all companies
  async computeAllMatches(profileId: string = 'default'): Promise<BatchResult> {
    const startTime = Date.now();
    const result: BatchResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0
    };

    try {
      // Get all companies
      const snapshot = await db.collection('companies').get();
      const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));

      // Initialize signal engine
      await this.initialize(companies);

      // Get weight profile
      const profile = await this.getWeightProfile(profileId);

      // Batch writes
      const batch = db.batch();
      let batchCount = 0;
      const maxBatchSize = 400;

      // Compute all pairs
      for (let i = 0; i < companies.length; i++) {
        for (let j = i + 1; j < companies.length; j++) {
          try {
            const match = await this.calculateMatch(companies[i], companies[j], profile);

            if (match.score >= profile.threshold) {
              const matchRef = db
                .collection('matches')
                .doc(profileId)
                .collection('pairs')
                .doc(match.edgeId);

              batch.set(matchRef, match, { merge: true });
              batchCount++;
              result.success++;

              // Commit batch if needed
              if (batchCount >= maxBatchSize) {
                await batch.commit();
                batchCount = 0;
              }
            } else {
              result.skipped++;
            }
          } catch (error: any) {
            result.failed++;
            result.errors.push({
              id: `${companies[i].id}__${companies[j].id}`,
              error: error.message
            });
          }
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
      }

      result.duration = Date.now() - startTime;
      console.log(`[MatchEngine] Computed ${result.success} matches in ${result.duration}ms`);

    } catch (error: any) {
      console.error('[MatchEngine] Batch computation failed:', error);
      throw error;
    }

    return result;
  }

  // Calculate confidence score based on data completeness
  private calculateConfidence(companyA: Company, companyB: Company, metrics: Record<string, number>): number {
    let dataPoints = 0;
    let filledPoints = 0;

    // Check text fields
    ['title', 'description', 'abstract'].forEach(field => {
      dataPoints++;
      if (companyA.text[field as keyof typeof companyA.text] &&
          companyB.text[field as keyof typeof companyB.text]) {
        filledPoints++;
      }
    });

    // Check numeric fields
    ['rating', 'team', 'price'].forEach(field => {
      dataPoints++;
      if (companyA.numeric[field as keyof typeof companyA.numeric] !== undefined &&
          companyB.numeric[field as keyof typeof companyB.numeric] !== undefined) {
        filledPoints++;
      }
    });

    // Check lists
    ['platforms', 'markets', 'categories', 'capabilities', 'needs'].forEach(field => {
      dataPoints++;
      const aList = (companyA as any)[field];
      const bList = (companyB as any)[field];
      if (aList?.length > 0 && bList?.length > 0) {
        filledPoints++;
      }
    });

    // Check metrics coverage
    const metricCoverage = Object.keys(metrics).length / 15; // Expected ~15 metrics

    // Calculate confidence
    const dataCompleteness = dataPoints > 0 ? filledPoints / dataPoints : 0;
    const confidence = (dataCompleteness + metricCoverage) / 2;

    return Math.min(confidence, 1);
  }

  // Get display name for metric
  private getMetricDisplayName(key: string): string {
    const names: Record<string, string> = {
      'date:created.prox': 'Founded Timeline',
      'date:released.prox': 'Release Timeline',
      'list:platforms.jaccard': 'Platform Alignment',
      'list:markets.jaccard': 'Market Overlap',
      'list:categories.jaccard': 'Category Match',
      'list:tags.jaccard': 'Tag Similarity',
      'num:rating.zexp': 'Rating Alignment',
      'num:team.zexp': 'Team Size Match',
      'num:price.zexp': 'Price Range Match',
      'str:name.lev': 'Name Similarity',
      'text:content.tfidf': 'Content Similarity',
      'bipartite:capabilities.match': 'Capability-Need Fit',
      'ctx:platform.overlap': 'Platform Context',
      'ctx:market.overlap': 'Market Context',
      'ctx:stage.complement': 'Stage Synergy'
    };

    return names[key] || key;
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}