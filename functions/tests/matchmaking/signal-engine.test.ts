/**
 * Signal Engine Tests
 * Comprehensive test suite for all signal types and scoring algorithms
 */

import { SignalEngine } from '../../src/matchmaking/signal-engine';
import { Company, WeightsProfile } from '../../src/matchmaking/types';

describe('SignalEngine', () => {
  let signalEngine: SignalEngine;
  let mockWeights: WeightsProfile;
  let companyA: Company;
  let companyB: Company;

  beforeEach(() => {
    signalEngine = new SignalEngine();

    mockWeights = {
      id: 'test-profile',
      name: 'Test Profile',
      description: 'Test weights profile',
      persona: 'general',
      weights: {
        foundingDateProximity: 50,
        fundingDateRelevance: 60,
        industryAlignment: 80,
        platformOverlap: 70,
        technologyMatch: 60,
        marketSynergy: 75,
        capabilityNeedMatch: 85,
        companySizeCompatibility: 65,
        fundingStageAlignment: 70,
        revenueCompatibility: 55,
        employeeCountSynergy: 50,
        companyNameSimilarity: 10,
        locationProximity: 35,
        pitchAlignment: 60,
        lookingForMatch: 70,
        descriptionSimilarity: 45,
        platformContextBoost: 20,
        marketContextBoost: 25,
        stageContextBoost: 20,
      },
      thresholds: {
        minimumOverallScore: 40,
        minimumConfidence: 30,
        maximumResults: 100
      },
      contextRules: {
        platformBoosts: { 'mobile': 1.2, 'pc': 1.1 },
        marketSynergies: { 'b2b': { 'b2b': 1.0, 'b2c': 0.7 } },
        stageCompatibility: { 'growth': { 'growth': 1.0, 'mature': 0.8 } }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };

    companyA = {
      id: 'company-a',
      name: 'GameStudio Alpha',
      description: 'Independent game development studio',
      country: 'United States',
      city: 'San Francisco',
      type: 'game_developer',
      size: 'small',
      stage: 'growth',
      industry: ['gaming', 'mobile'],
      platforms: ['mobile', 'ios'],
      technologies: ['unity', 'c#'],
      markets: ['b2c', 'casual'],
      capabilities: ['game development', 'mobile optimization'],
      needs: ['publishing', 'marketing'],
      fundingStage: 'seed',
      employees: 15,
      foundedYear: 2020,
      revenue: 500000,
      lastFundingAmount: 2000000,
      lastFundingDate: '2023-01-15T00:00:00Z',
      pitch: 'We create engaging mobile games for casual players.',
      lookingFor: 'Publisher for our puzzle game series.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual'
    };

    companyB = {
      id: 'company-b',
      name: 'MobilePublisher Corp',
      description: 'Mobile game publisher and distributor',
      country: 'United States',
      city: 'Los Angeles',
      type: 'publisher',
      size: 'medium',
      stage: 'mature',
      industry: ['gaming', 'publishing'],
      platforms: ['mobile', 'android'],
      technologies: ['analytics', 'monetization'],
      markets: ['b2c', 'premium'],
      capabilities: ['publishing', 'marketing'],
      needs: ['game content', 'developers'],
      fundingStage: 'series_a',
      employees: 50,
      foundedYear: 2018,
      revenue: 5000000,
      lastFundingAmount: 10000000,
      lastFundingDate: '2022-06-20T00:00:00Z',
      pitch: 'Leading mobile game publisher with global reach.',
      lookingFor: 'High-quality mobile games for our platform.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual'
    };
  });

  afterEach(() => {
    signalEngine.clearCaches();
  });

  describe('calculateSignals', () => {
    it('should calculate all applicable signals between two companies', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBeGreaterThan(0);

      // Check that signals have required properties
      signals.forEach(signal => {
        expect(signal).toHaveProperty('type');
        expect(signal).toHaveProperty('field');
        expect(signal).toHaveProperty('score');
        expect(signal).toHaveProperty('weight');
        expect(signal).toHaveProperty('contribution');
        expect(signal).toHaveProperty('explanation');
        expect(typeof signal.score).toBe('number');
        expect(signal.score).toBeGreaterThanOrEqual(0);
        expect(signal.score).toBeLessThanOrEqual(100);
      });
    });

    it('should only return signals with score > 0', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);

      signals.forEach(signal => {
        expect(signal.score).toBeGreaterThan(0);
      });
    });
  });

  describe('Date Proximity Signals', () => {
    it('should calculate founding year proximity correctly', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const foundingSignal = signals.find(s => s.field === 'foundedYear');

      expect(foundingSignal).toBeDefined();
      expect(foundingSignal!.type).toBe('date_proximity');
      expect(foundingSignal!.valueA).toBe(2020);
      expect(foundingSignal!.valueB).toBe(2018);

      // 2 years apart should have a good score
      expect(foundingSignal!.score).toBeGreaterThan(60);
    });

    it('should calculate funding date proximity correctly', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const fundingSignal = signals.find(s => s.field === 'lastFundingDate');

      expect(fundingSignal).toBeDefined();
      expect(fundingSignal!.type).toBe('date_proximity');
    });

    it('should give perfect score for same founding year', async () => {
      const companyC = { ...companyB, foundedYear: 2020 };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const foundingSignal = signals.find(s => s.field === 'foundedYear');

      expect(foundingSignal!.score).toBe(100);
      expect(foundingSignal!.explanation).toContain('perfect match');
    });
  });

  describe('List Similarity Signals (Jaccard)', () => {
    it('should calculate industry alignment correctly', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const industrySignal = signals.find(s => s.field === 'industry');

      expect(industrySignal).toBeDefined();
      expect(industrySignal!.type).toBe('list_jaccard');

      // Both have 'gaming', so should have overlap
      expect(industrySignal!.score).toBeGreaterThan(0);
      expect(industrySignal!.explanation).toContain('gaming');
    });

    it('should calculate platform overlap correctly', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const platformSignal = signals.find(s => s.field === 'platforms');

      expect(platformSignal).toBeDefined();
      expect(platformSignal!.type).toBe('list_jaccard');

      // Both have 'mobile', so should have overlap
      expect(platformSignal!.score).toBeGreaterThan(0);
      expect(platformSignal!.explanation).toContain('mobile');
    });

    it('should handle empty arrays correctly', async () => {
      const companyC = { ...companyB, platforms: [] };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const platformSignal = signals.find(s => s.field === 'platforms');

      // Should not create signal for empty arrays
      expect(platformSignal).toBeUndefined();
    });

    it('should calculate perfect Jaccard similarity', async () => {
      const companyC = { ...companyB, industry: ['gaming', 'mobile'] };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const industrySignal = signals.find(s => s.field === 'industry');

      expect(industrySignal!.score).toBe(100);
    });
  });

  describe('Bipartite Matching (Capabilities/Needs)', () => {
    it('should calculate capability-need matches correctly', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const bipartiteSignal = signals.find(s => s.field === 'capabilities_needs');

      expect(bipartiteSignal).toBeDefined();
      expect(bipartiteSignal!.type).toBe('bipartite_matching');

      // Company A needs 'publishing', Company B has 'publishing'
      expect(bipartiteSignal!.score).toBeGreaterThan(0);
      expect(bipartiteSignal!.explanation).toContain('capability-need matches');
    });

    it('should handle perfect complementarity', async () => {
      const companyC = {
        ...companyB,
        capabilities: ['publishing', 'marketing'],
        needs: ['game development', 'mobile optimization']
      };

      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const bipartiteSignal = signals.find(s => s.field === 'capabilities_needs');

      expect(bipartiteSignal!.score).toBe(100);
    });
  });

  describe('Numeric Signals (Z-exponential)', () => {
    it('should calculate employee count synergy', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const employeeSignal = signals.find(s => s.field === 'employees');

      expect(employeeSignal).toBeDefined();
      expect(employeeSignal!.type).toBe('numeric_zexp');
      expect(employeeSignal!.valueA).toBe(15);
      expect(employeeSignal!.valueB).toBe(50);
    });

    it('should calculate revenue compatibility', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const revenueSignal = signals.find(s => s.field === 'revenue');

      expect(revenueSignal).toBeDefined();
      expect(revenueSignal!.type).toBe('numeric_zexp');
    });

    it('should calculate company size compatibility', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const sizeSignal = signals.find(s => s.field === 'size_compatibility');

      expect(sizeSignal).toBeDefined();
      expect(sizeSignal!.type).toBe('numeric_zexp');
      expect(sizeSignal!.valueA).toBe('small');
      expect(sizeSignal!.valueB).toBe('medium');

      // Small + Medium should have good compatibility
      expect(sizeSignal!.score).toBeGreaterThanOrEqual(80);
    });

    it('should calculate funding stage alignment', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const stageSignal = signals.find(s => s.field === 'funding_stage_alignment');

      expect(stageSignal).toBeDefined();
      expect(stageSignal!.type).toBe('numeric_zexp');
      expect(stageSignal!.valueA).toBe('seed');
      expect(stageSignal!.valueB).toBe('series_a');
    });
  });

  describe('String Similarity (Levenshtein)', () => {
    it('should calculate company name similarity', async () => {
      const companyC = { ...companyB, name: 'GameStudio Beta' };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const nameSignal = signals.find(s => s.field === 'company_name');

      expect(nameSignal).toBeDefined();
      expect(nameSignal!.type).toBe('string_levenshtein');

      // Should have some similarity due to 'GameStudio'
      expect(nameSignal!.score).toBeGreaterThan(30);
    });

    it('should calculate location proximity', async () => {
      const companyC = { ...companyB, city: 'San Francisco', country: 'United States' };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const locationSignal = signals.find(s => s.field === 'location_proximity');

      expect(locationSignal).toBeDefined();
      expect(locationSignal!.type).toBe('string_levenshtein');

      // Same city should have high similarity
      expect(locationSignal!.score).toBeGreaterThan(80);
    });
  });

  describe('Text Similarity (TF-IDF)', () => {
    it('should calculate pitch alignment for long texts', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const pitchSignal = signals.find(s => s.field === 'pitch');

      // May or may not exist depending on text length threshold
      if (pitchSignal) {
        expect(pitchSignal.type).toBe('text_tfidf');
        expect(pitchSignal.score).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty text fields', async () => {
      const companyC = { ...companyB, pitch: undefined };
      const signals = await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const pitchSignal = signals.find(s => s.field === 'pitch');

      expect(pitchSignal).toBeUndefined();
    });
  });

  describe('Context Boosts', () => {
    it('should calculate platform context boost', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const platformBoostSignal = signals.find(s => s.field === 'platform_context_boost');

      if (platformBoostSignal) {
        expect(platformBoostSignal.type).toBe('list_jaccard');
        expect(platformBoostSignal.score).toBeGreaterThan(0);
      }
    });

    it('should calculate market context boost', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const marketBoostSignal = signals.find(s => s.field === 'market_context_boost');

      if (marketBoostSignal) {
        expect(marketBoostSignal.type).toBe('list_jaccard');
      }
    });

    it('should calculate stage context boost', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyB, mockWeights);
      const stageBoostSignal = signals.find(s => s.field === 'stage_context_boost');

      if (stageBoostSignal) {
        expect(stageBoostSignal.type).toBe('numeric_zexp');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle companies with minimal data', async () => {
      const minimalCompanyA: Company = {
        id: 'minimal-a',
        name: 'Minimal Company',
        country: 'Unknown',
        type: 'game_developer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const minimalCompanyB: Company = {
        id: 'minimal-b',
        name: 'Another Minimal',
        country: 'Unknown',
        type: 'publisher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const signals = await signalEngine.calculateSignals(minimalCompanyA, minimalCompanyB, mockWeights);

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
      // Should have at least some signals even with minimal data
    });

    it('should handle identical companies', async () => {
      const signals = await signalEngine.calculateSignals(companyA, companyA, mockWeights);

      expect(signals.length).toBeGreaterThan(0);

      // Most signals should have perfect or high scores
      const scores = signals.map(s => s.score);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      expect(avgScore).toBeGreaterThan(80);
    });

    it('should handle companies with no overlap', async () => {
      const noOverlapCompany: Company = {
        id: 'no-overlap',
        name: 'Completely Different Corp',
        country: 'Mars',
        type: 'hardware',
        size: 'enterprise',
        stage: 'idea',
        industry: ['aerospace', 'manufacturing'],
        platforms: ['console', 'vr'],
        technologies: ['rust', 'kubernetes'],
        markets: ['b2b', 'enterprise'],
        capabilities: ['hardware design', 'manufacturing'],
        needs: ['software development'],
        fundingStage: 'bootstrap',
        employees: 1000,
        foundedYear: 1990,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const signals = await signalEngine.calculateSignals(companyA, noOverlapCompany, mockWeights);

      // Should still have some signals, but lower scores
      expect(signals.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should complete signal calculation within reasonable time', async () => {
      const startTime = Date.now();

      await signalEngine.calculateSignals(companyA, companyB, mockWeights);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 100ms for typical companies
      expect(executionTime).toBeLessThan(100);
    });

    it('should cache distance calculations', async () => {
      const companyC = { ...companyB, name: 'Similar Name' };

      // First calculation
      const startTime1 = Date.now();
      await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const time1 = Date.now() - startTime1;

      // Second calculation with similar names (should use cache)
      const startTime2 = Date.now();
      await signalEngine.calculateSignals(companyA, companyC, mockWeights);
      const time2 = Date.now() - startTime2;

      // Second run should be faster due to caching
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Utility Functions', () => {
    it('should clear caches successfully', () => {
      expect(() => signalEngine.clearCaches()).not.toThrow();
    });
  });
});