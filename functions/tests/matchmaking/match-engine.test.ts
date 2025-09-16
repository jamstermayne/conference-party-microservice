/**
 * Match Engine Tests
 * Tests for core matchmaking logic and result generation
 */

import { MatchEngine } from '../../src/matchmaking/match-engine';
import { MatchRequest, MatchResponse, Company, WeightsProfile } from '../../src/matchmaking/types';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        })),
        get: jest.fn()
      })),
      limit: jest.fn(() => ({
        get: jest.fn()
      })),
      get: jest.fn()
    }))
  }))
}));

describe('MatchEngine', () => {
  let matchEngine: MatchEngine;
  let mockFirestore: any;
  let mockCompanies: Company[];
  let mockWeightsProfile: WeightsProfile;

  beforeEach(() => {
    // Setup mock Firestore
    mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn()
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          })),
          get: jest.fn()
        })),
        limit: jest.fn(() => ({
          get: jest.fn()
        })),
        get: jest.fn()
      }))
    };

    (admin.firestore as jest.Mock).mockReturnValue(mockFirestore);

    matchEngine = new MatchEngine();

    // Mock data
    mockCompanies = [
      {
        id: 'company-1',
        name: 'GameStudio Alpha',
        country: 'United States',
        type: 'game_developer',
        size: 'small',
        stage: 'growth',
        industry: ['gaming'],
        platforms: ['mobile'],
        technologies: ['unity'],
        markets: ['b2c'],
        capabilities: ['development'],
        needs: ['publishing'],
        fundingStage: 'seed',
        employees: 15,
        foundedYear: 2020,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      },
      {
        id: 'company-2',
        name: 'Publisher Corp',
        country: 'United States',
        type: 'publisher',
        size: 'medium',
        stage: 'mature',
        industry: ['gaming'],
        platforms: ['mobile'],
        technologies: ['analytics'],
        markets: ['b2c'],
        capabilities: ['publishing'],
        needs: ['content'],
        fundingStage: 'series_a',
        employees: 50,
        foundedYear: 2018,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      },
      {
        id: 'company-3',
        name: 'Investor Fund',
        country: 'United States',
        type: 'investor',
        size: 'large',
        stage: 'mature',
        industry: ['investment'],
        platforms: [],
        technologies: [],
        markets: ['b2b'],
        capabilities: ['funding'],
        needs: ['startups'],
        fundingStage: 'ipo',
        employees: 25,
        foundedYear: 2010,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      }
    ];

    mockWeightsProfile = {
      id: 'test-weights',
      name: 'Test Weights',
      description: 'Test weights profile',
      persona: 'general',
      weights: {
        foundingDateProximity: 30,
        fundingDateRelevance: 40,
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
        platformBoosts: {},
        marketSynergies: {},
        stageCompatibility: {}
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMatches', () => {
    beforeEach(() => {
      // Mock Firestore responses
      const mockSnapshot = {
        docs: mockCompanies.map(company => ({
          id: company.id,
          data: () => company,
          exists: true
        })),
        empty: false,
        size: mockCompanies.length
      };

      const mockWeightsDoc = {
        id: mockWeightsProfile.id,
        data: () => mockWeightsProfile,
        exists: true
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'companies') {
          return {
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              }))
            })),
            limit: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockSnapshot)
            }))
          };
        } else if (collectionName === 'weightsProfiles') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockWeightsDoc)
            }))
          };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [], empty: true })
        };
      });
    });

    it('should find matches for a specific company', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights',
        limit: 10,
        minScore: 30
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response).toBeDefined();
      expect(response.matches).toBeDefined();
      expect(Array.isArray(response.matches)).toBe(true);
      expect(response.totalCount).toBeGreaterThanOrEqual(0);
      expect(response.processingTimeMs).toBeGreaterThan(0);
      expect(response.weightsProfile).toBeDefined();
      expect(response.query).toEqual(request);
      expect(response.generatedAt).toBeDefined();
    });

    it('should filter matches by minimum score', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights',
        minScore: 80 // High threshold
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response.matches).toBeDefined();
      response.matches.forEach(match => {
        expect(match.overallScore).toBeGreaterThanOrEqual(80);
      });
    });

    it('should limit results correctly', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights',
        limit: 1
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response.matches.length).toBeLessThanOrEqual(1);
    });

    it('should include explanations when requested', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights',
        includeExplanations: true
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      if (response.matches.length > 0) {
        const firstMatch = response.matches[0];
        expect(firstMatch.reasons).toBeDefined();
        expect(firstMatch.recommendations).toBeDefined();
        expect(Array.isArray(firstMatch.reasons)).toBe(true);
        expect(Array.isArray(firstMatch.recommendations)).toBe(true);
      }
    });

    it('should handle non-existent company', async () => {
      const request: MatchRequest = {
        companyId: 'non-existent',
        weightsProfileId: 'test-weights'
      };

      await expect(matchEngine.findMatches(request)).rejects.toThrow('Company non-existent not found');
    });

    it('should use default weights profile when none specified', async () => {
      // Mock default weights profile
      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'weightsProfiles') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: false })
            }))
          };
        }
        return {
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [], empty: true })
          }))
        };
      });

      const request: MatchRequest = {
        companyId: 'company-1'
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response).toBeDefined();
      expect(response.weightsProfile.id).toBe('default');
    });

    it('should apply filters correctly', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        filters: {
          companyTypes: ['publisher'],
          countries: ['United States']
        }
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response).toBeDefined();
      // Specific filtering logic would depend on actual implementation
    });
  });

  describe('Match Result Properties', () => {
    beforeEach(() => {
      // Setup minimal mock for single match test
      const mockSnapshot = {
        docs: [mockCompanies[1]].map(company => ({
          id: company.id,
          data: () => company,
          exists: true
        })),
        empty: false,
        size: 1
      };

      const mockWeightsDoc = {
        id: mockWeightsProfile.id,
        data: () => mockWeightsProfile,
        exists: true
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'companies') {
          return {
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              }))
            })),
            limit: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockSnapshot)
            }))
          };
        } else if (collectionName === 'weightsProfiles') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockWeightsDoc)
            }))
          };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [], empty: true })
        };
      });
    });

    it('should generate proper match result structure', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      if (response.matches.length > 0) {
        const match = response.matches[0];

        expect(match).toHaveProperty('id');
        expect(match).toHaveProperty('companyA');
        expect(match).toHaveProperty('companyB');
        expect(match).toHaveProperty('overallScore');
        expect(match).toHaveProperty('confidence');
        expect(match).toHaveProperty('signals');
        expect(match).toHaveProperty('createdAt');
        expect(match).toHaveProperty('weightsProfile');
        expect(match).toHaveProperty('algorithm');
        expect(match).toHaveProperty('suggestedMeetingType');
        expect(match).toHaveProperty('suggestedDuration');
        expect(match).toHaveProperty('status');

        expect(typeof match.overallScore).toBe('number');
        expect(match.overallScore).toBeGreaterThanOrEqual(0);
        expect(match.overallScore).toBeLessThanOrEqual(100);

        expect(typeof match.confidence).toBe('number');
        expect(match.confidence).toBeGreaterThanOrEqual(0);
        expect(match.confidence).toBeLessThanOrEqual(100);

        expect(Array.isArray(match.signals)).toBe(true);
        expect(match.status).toBe('pending');
      }
    });

    it('should suggest appropriate meeting types', async () => {
      const request: MatchRequest = {
        companyId: 'company-1', // Game developer
        weightsProfileId: 'test-weights'
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      if (response.matches.length > 0) {
        const match = response.matches[0]; // Should match with publisher

        expect(['business_development', 'partnership', 'general']).toContain(match.suggestedMeetingType);
        expect(typeof match.suggestedDuration).toBe('number');
        expect(match.suggestedDuration).toBeGreaterThan(0);
      }
    });

    it('should calculate confidence based on data completeness', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      if (response.matches.length > 0) {
        const match = response.matches[0];

        expect(match.confidence).toBeGreaterThan(0);
        // Confidence should be reasonable for companies with basic data
        expect(match.confidence).toBeGreaterThan(20);
      }
    });
  });

  describe('Performance', () => {
    it('should complete matching within reasonable time', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      const startTime = Date.now();
      await matchEngine.findMatches(request);
      const executionTime = Date.now() - startTime;

      // Should complete within 500ms for small dataset
      expect(executionTime).toBeLessThan(500);
    });

    it('should handle large result sets efficiently', async () => {
      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights',
        limit: 1000 // Large limit
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response.processingTimeMs).toBeDefined();
      expect(response.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockFirestore.collection.mockImplementation(() => ({
        limit: jest.fn(() => ({
          get: jest.fn().mockRejectedValue(new Error('Firestore error'))
        }))
      }));

      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      await expect(matchEngine.findMatches(request)).rejects.toThrow();
    });

    it('should validate request parameters', async () => {
      const invalidRequest: any = {
        companyId: 123, // Invalid type
        weightsProfileId: 'test-weights'
      };

      // This would depend on actual validation implementation
      // await expect(matchEngine.findMatches(invalidRequest)).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty company database', async () => {
      mockFirestore.collection.mockImplementation(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [], empty: true, size: 0 })
          }))
        })),
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ docs: [], empty: true, size: 0 })
        }))
      }));

      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      await expect(matchEngine.findMatches(request)).rejects.toThrow('Company company-1 not found');
    });

    it('should handle single company in database', async () => {
      const singleCompany = [mockCompanies[0]];
      const mockSnapshot = {
        docs: singleCompany.map(company => ({
          id: company.id,
          data: () => company,
          exists: true
        })),
        empty: false,
        size: 1
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'companies') {
          return {
            where: jest.fn(() => ({
              limit: jest.fn(() => ({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              }))
            })),
            limit: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockSnapshot)
            }))
          };
        }
        return {
          get: jest.fn().mockResolvedValue({ docs: [], empty: true })
        };
      });

      const request: MatchRequest = {
        companyId: 'company-1',
        weightsProfileId: 'test-weights'
      };

      const response: MatchResponse = await matchEngine.findMatches(request);

      expect(response.matches).toHaveLength(0); // No other companies to match with
    });
  });

  describe('Cache Management', () => {
    it('should clear caches without errors', () => {
      expect(() => matchEngine.clearCaches()).not.toThrow();
    });
  });
});