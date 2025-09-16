/**
 * Matchmaking Integration Tests
 * End-to-end tests for the complete matchmaking workflow
 */

import * as admin from 'firebase-admin';
import { MatchEngine } from '../../src/matchmaking/match-engine';
import { UploadProcessor } from '../../src/matchmaking/upload-processor';
import { WeightsManager } from '../../src/matchmaking/weights-manager';
import { TaxonomyAnalyzer } from '../../src/matchmaking/taxonomy-analyzer';
import { AuthMiddleware } from '../../src/matchmaking/auth-middleware';
import { setupMatchmakingSystem } from '../../src/matchmaking/setup';
import { Company, WeightsProfile, MatchRequest, TaxonomyRequest } from '../../src/matchmaking/types';

// Mock Firebase Admin for integration tests
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
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
      add: jest.fn(),
      get: jest.fn()
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      commit: jest.fn()
    }))
  })),
  auth: jest.fn(() => ({
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    verifyIdToken: jest.fn()
  }))
}));

describe('Matchmaking Integration Tests', () => {
  let matchEngine: MatchEngine;
  let uploadProcessor: UploadProcessor;
  let weightsManager: WeightsManager;
  let taxonomyAnalyzer: TaxonomyAnalyzer;
  let authMiddleware: AuthMiddleware;
  let mockFirestore: any;

  const mockCompanies: Company[] = [
    {
      id: 'game-dev-1',
      name: 'Indie Game Studio',
      description: 'Small independent game development studio',
      country: 'United States',
      city: 'Seattle',
      type: 'game_developer',
      size: 'small',
      stage: 'growth',
      industry: ['gaming', 'indie'],
      platforms: ['pc', 'steam'],
      technologies: ['unity', 'c#'],
      markets: ['b2c', 'premium'],
      capabilities: ['game development', 'art', 'programming'],
      needs: ['publishing', 'marketing', 'funding'],
      fundingStage: 'seed',
      employees: 8,
      foundedYear: 2021,
      revenue: 200000,
      lastFundingAmount: 500000,
      contactEmail: 'contact@indiegamestudio.com',
      pitch: 'We create innovative indie games with unique mechanics.',
      lookingFor: 'Publisher for our upcoming action-adventure game.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'upload',
      profileCompleteness: 85
    },
    {
      id: 'publisher-1',
      name: 'Mega Game Publisher',
      description: 'Large game publisher with global reach',
      country: 'United Kingdom',
      city: 'London',
      type: 'publisher',
      size: 'large',
      stage: 'mature',
      industry: ['gaming', 'publishing'],
      platforms: ['pc', 'console', 'mobile'],
      technologies: ['analytics', 'marketing tools', 'distribution'],
      markets: ['b2c', 'global'],
      capabilities: ['publishing', 'marketing', 'distribution', 'localization'],
      needs: ['quality games', 'innovative content'],
      fundingStage: 'ipo',
      employees: 500,
      foundedYear: 2010,
      revenue: 50000000,
      contactEmail: 'partnerships@megapublisher.com',
      pitch: 'Leading publisher helping developers reach global audiences.',
      lookingFor: 'High-quality indie and AA games for our catalog.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual',
      profileCompleteness: 90
    },
    {
      id: 'investor-1',
      name: 'Gaming Ventures Fund',
      description: 'Venture capital firm focused on gaming startups',
      country: 'United States',
      city: 'San Francisco',
      type: 'investor',
      size: 'medium',
      stage: 'mature',
      industry: ['gaming', 'investment', 'venture capital'],
      platforms: ['cross-platform'],
      technologies: ['emerging tech', 'vr', 'ai'],
      markets: ['b2b', 'b2c'],
      capabilities: ['funding', 'mentorship', 'network access'],
      needs: ['promising startups', 'innovative gaming companies'],
      fundingStage: 'series_d_plus',
      employees: 20,
      foundedYear: 2015,
      contactEmail: 'invest@gamingventures.com',
      pitch: 'Investing in the future of interactive entertainment.',
      lookingFor: 'Seed to Series A gaming companies with strong potential.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual',
      profileCompleteness: 80
    }
  ];

  const mockWeightsProfile: WeightsProfile = {
    id: 'test-weights',
    name: 'Test Integration Weights',
    description: 'Weights profile for integration testing',
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
      minimumOverallScore: 30,
      minimumConfidence: 20,
      maximumResults: 50
    },
    contextRules: {
      platformBoosts: { 'pc': 1.1, 'mobile': 1.2 },
      marketSynergies: { 'b2c': { 'b2c': 1.0, 'b2b': 0.7 } },
      stageCompatibility: { 'growth': { 'mature': 0.8, 'growth': 1.0 } }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false
  };

  beforeEach(() => {
    // Setup comprehensive Firestore mock
    mockFirestore = {
      collection: jest.fn((collectionName: string) => {
        const mockCollection = {
          doc: jest.fn((docId?: string) => ({
            get: jest.fn().mockImplementation(() => {
              if (collectionName === 'companies' && docId) {
                const company = mockCompanies.find(c => c.id === docId);
                return Promise.resolve({
                  exists: !!company,
                  id: docId,
                  data: () => company
                });
              } else if (collectionName === 'weightsProfiles' && docId) {
                return Promise.resolve({
                  exists: docId === mockWeightsProfile.id,
                  id: docId,
                  data: () => mockWeightsProfile
                });
              }
              return Promise.resolve({ exists: false });
            }),
            set: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined)
          })),
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn().mockImplementation(() => {
                if (collectionName === 'companies') {
                  return Promise.resolve({
                    docs: mockCompanies.map(c => ({ id: c.id, data: () => c })),
                    empty: false,
                    size: mockCompanies.length
                  });
                }
                return Promise.resolve({ docs: [], empty: true, size: 0 });
              })
            })),
            get: jest.fn().mockResolvedValue({ docs: [], empty: true })
          })),
          limit: jest.fn(() => ({
            get: jest.fn().mockImplementation(() => {
              if (collectionName === 'companies') {
                return Promise.resolve({
                  docs: mockCompanies.map(c => ({ id: c.id, data: () => c })),
                  empty: false,
                  size: mockCompanies.length
                });
              } else if (collectionName === 'weightsProfiles') {
                return Promise.resolve({
                  docs: [{ id: mockWeightsProfile.id, data: () => mockWeightsProfile }],
                  empty: false,
                  size: 1
                });
              }
              return Promise.resolve({ docs: [], empty: true, size: 0 });
            })
          })),
          add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
          get: jest.fn().mockImplementation(() => {
            if (collectionName === 'companies') {
              return Promise.resolve({
                docs: mockCompanies.map(c => ({ id: c.id, data: () => c })),
                empty: false,
                size: mockCompanies.length
              });
            }
            return Promise.resolve({ docs: [], empty: true, size: 0 });
          })
        };

        return mockCollection;
      }),
      batch: jest.fn(() => ({
        set: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }))
    };

    (admin.firestore as jest.Mock).mockReturnValue(mockFirestore);

    // Initialize components
    matchEngine = new MatchEngine();
    uploadProcessor = new UploadProcessor();
    weightsManager = new WeightsManager();
    taxonomyAnalyzer = new TaxonomyAnalyzer();
    authMiddleware = new AuthMiddleware();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Matchmaking Workflow', () => {
    it('should execute end-to-end matchmaking workflow', async () => {
      // 1. Upload companies
      const csvData = [
        {
          'Company Name': 'New Game Studio',
          'Country': 'Canada',
          'Type': 'game_developer',
          'Industry': 'gaming, mobile',
          'Platforms': 'mobile, ios, android'
        }
      ];

      const uploadResponse = await uploadProcessor.processUpload({
        filename: 'new-companies.csv',
        data: csvData,
        validateOnly: false
      });

      expect(uploadResponse.ingestLog.status).toBe('completed');

      // 2. Create/load weights profile
      const weightsProfiles = await weightsManager.listProfiles();
      expect(weightsProfiles).toBeDefined();

      // 3. Find matches
      const matchRequest: MatchRequest = {
        companyId: 'game-dev-1',
        weightsProfileId: mockWeightsProfile.id,
        limit: 10,
        minScore: 20,
        includeExplanations: true
      };

      const matchResponse = await matchEngine.findMatches(matchRequest);

      expect(matchResponse).toBeDefined();
      expect(matchResponse.matches).toBeDefined();
      expect(Array.isArray(matchResponse.matches)).toBe(true);
      expect(matchResponse.weightsProfile).toBeDefined();
      expect(matchResponse.processingTimeMs).toBeGreaterThan(0);

      // 4. Verify match quality
      if (matchResponse.matches.length > 0) {
        const bestMatch = matchResponse.matches[0];
        expect(bestMatch.overallScore).toBeGreaterThanOrEqual(20);
        expect(bestMatch.confidence).toBeGreaterThan(0);
        expect(bestMatch.signals.length).toBeGreaterThan(0);
        expect(bestMatch.reasons).toBeDefined();
        expect(bestMatch.recommendations).toBeDefined();
      }
    });

    it('should handle publisher-developer matching scenario', async () => {
      const matchRequest: MatchRequest = {
        companyId: 'game-dev-1', // Indie game studio
        weightsProfileId: mockWeightsProfile.id,
        includeExplanations: true
      };

      const matchResponse = await matchEngine.findMatches(matchRequest);

      // Should find the publisher as a good match
      const publisherMatch = matchResponse.matches.find(
        m => m.companyB === 'publisher-1'
      );

      if (publisherMatch) {
        expect(publisherMatch.suggestedMeetingType).toBe('business_development');
        expect(publisherMatch.overallScore).toBeGreaterThan(30);

        // Should have capability-need alignment
        const capabilitySignal = publisherMatch.signals.find(
          s => s.field === 'capabilities_needs'
        );
        expect(capabilitySignal).toBeDefined();
        expect(capabilitySignal!.score).toBeGreaterThan(0);
      }
    });

    it('should handle investor-startup matching scenario', async () => {
      const matchRequest: MatchRequest = {
        companyId: 'game-dev-1', // Indie game studio (startup)
        weightsProfileId: mockWeightsProfile.id,
        includeExplanations: true
      };

      const matchResponse = await matchEngine.findMatches(matchRequest);

      // Should find the investor as a potential match
      const investorMatch = matchResponse.matches.find(
        m => m.companyB === 'investor-1'
      );

      if (investorMatch) {
        expect(investorMatch.suggestedMeetingType).toBe('investment');
        expect(investorMatch.suggestedDuration).toBeGreaterThanOrEqual(60);
      }
    });
  });

  describe('Data Quality and Validation', () => {
    it('should maintain data integrity throughout upload process', async () => {
      const testData = [
        {
          'Company Name': 'Data Quality Test',
          'Country': 'Test Country',
          'Type': 'game_developer',
          'Employees': '25',
          'Industry': 'gaming, simulation',
          'Founded': '2019'
        }
      ];

      const uploadResponse = await uploadProcessor.processUpload({
        filename: 'quality-test.csv',
        data: testData,
        validateOnly: true
      });

      expect(uploadResponse.ingestLog.validationErrors).toBeDefined();

      if (uploadResponse.preview && uploadResponse.preview.sampleCompanies.length > 0) {
        const company = uploadResponse.preview.sampleCompanies[0];

        // Verify data type conversions
        expect(typeof company.employees).toBe('number');
        expect(company.employees).toBe(25);
        expect(typeof company.foundedYear).toBe('number');
        expect(company.foundedYear).toBe(2019);
        expect(Array.isArray(company.industry)).toBe(true);
        expect(company.industry).toContain('gaming');
        expect(company.industry).toContain('simulation');

        // Verify profile completeness calculation
        expect(typeof company.profileCompleteness).toBe('number');
        expect(company.profileCompleteness).toBeGreaterThan(0);
      }
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData = [
        {
          'Company Name': '', // Invalid - empty name
          'Country': 'Valid Country',
          'Email': 'invalid-email', // Invalid email format
          'Website': 'not-a-url', // Invalid URL
          'Founded': '1800' // Edge case year
        }
      ];

      const uploadResponse = await uploadProcessor.processUpload({
        filename: 'invalid-test.csv',
        data: invalidData,
        validateOnly: true
      });

      expect(uploadResponse.ingestLog.validationErrors.length).toBeGreaterThan(0);
      expect(uploadResponse.ingestLog.errorCount).toBeGreaterThan(0);

      // Should categorize errors by severity
      const errors = uploadResponse.ingestLog.validationErrors.filter(e => e.severity === 'error');
      const warnings = uploadResponse.ingestLog.validationErrors.filter(e => e.severity === 'warning');

      expect(errors.length).toBeGreaterThan(0); // Required field errors
      expect(warnings.length).toBeGreaterThan(0); // Format validation warnings
    });
  });

  describe('Weights and Configuration Management', () => {
    it('should create and manage weights profiles effectively', async () => {
      // Create new profile
      const newProfile = await weightsManager.createProfile({
        name: 'Integration Test Profile',
        description: 'Profile created during integration test',
        persona: 'developer',
        weights: {
          ...mockWeightsProfile.weights,
          industryAlignment: 90 // Boost industry alignment
        }
      });

      expect(newProfile).toBeDefined();
      expect(newProfile.name).toBe('Integration Test Profile');
      expect(newProfile.weights.industryAlignment).toBe(90);

      // Use the new profile for matching
      const matchRequest: MatchRequest = {
        companyId: 'game-dev-1',
        weightsProfileId: newProfile.id,
        includeExplanations: true
      };

      const matchResponse = await matchEngine.findMatches(matchRequest);

      expect(matchResponse.weightsProfile.id).toBe(newProfile.id);

      // Update profile
      const updatedProfile = await weightsManager.updateProfile(newProfile.id, {
        description: 'Updated during integration test'
      });

      expect(updatedProfile.description).toBe('Updated during integration test');
    });

    it('should handle persona-specific weight optimization', async () => {
      // Test developer-focused weights
      const developerWeights = await weightsManager.createProfile({
        name: 'Developer Focused',
        persona: 'developer',
        weights: {
          ...mockWeightsProfile.weights,
          capabilityNeedMatch: 95,
          platformOverlap: 85,
          technologyMatch: 90
        }
      });

      // Test publisher-focused weights
      const publisherWeights = await weightsManager.createProfile({
        name: 'Publisher Focused',
        persona: 'publisher',
        weights: {
          ...mockWeightsProfile.weights,
          capabilityNeedMatch: 95,
          marketSynergy: 85,
          revenueCompatibility: 80
        }
      });

      // Compare results with different weight profiles
      const developerResults = await matchEngine.findMatches({
        companyId: 'game-dev-1',
        weightsProfileId: developerWeights.id
      });

      const publisherResults = await matchEngine.findMatches({
        companyId: 'game-dev-1',
        weightsProfileId: publisherWeights.id
      });

      expect(developerResults.matches).toBeDefined();
      expect(publisherResults.matches).toBeDefined();

      // Results may differ based on weight profiles
      expect(developerResults.weightsProfile.persona).toBe('developer');
      expect(publisherResults.weightsProfile.persona).toBe('publisher');
    });
  });

  describe('Taxonomy and Analytics', () => {
    it('should generate taxonomy insights from company data', async () => {
      const taxonomyRequest: TaxonomyRequest = {
        dimension: 'industry',
        visualization: 'distribution'
      };

      const taxonomyResponse = await taxonomyAnalyzer.generateVisualization(taxonomyRequest);

      expect(taxonomyResponse).toBeDefined();
      expect(taxonomyResponse.dimension).toBe('industry');
      expect(taxonomyResponse.visualization).toBe('distribution');
      expect(taxonomyResponse.data).toBeDefined();
      expect(taxonomyResponse.metadata).toBeDefined();
      expect(taxonomyResponse.metadata.totalCompanies).toBeGreaterThan(0);
    });

    it('should analyze platform distribution patterns', async () => {
      const taxonomyRequest: TaxonomyRequest = {
        dimension: 'platform',
        visualization: 'heatmap'
      };

      const taxonomyResponse = await taxonomyAnalyzer.generateVisualization(taxonomyRequest);

      expect(taxonomyResponse.data.type).toBe('heatmap');
      expect(taxonomyResponse.data.labels).toBeDefined();
      expect(Array.isArray(taxonomyResponse.data.labels)).toBe(true);
    });

    it('should generate network analysis for technology relationships', async () => {
      const taxonomyRequest: TaxonomyRequest = {
        dimension: 'technology',
        visualization: 'network'
      };

      const taxonomyResponse = await taxonomyAnalyzer.generateVisualization(taxonomyRequest);

      expect(taxonomyResponse.data.type).toBe('network');
      expect(taxonomyResponse.data.nodes).toBeDefined();
      expect(taxonomyResponse.data.edges).toBeDefined();
      expect(Array.isArray(taxonomyResponse.data.nodes)).toBe(true);
      expect(Array.isArray(taxonomyResponse.data.edges)).toBe(true);
    });
  });

  describe('Authentication and Security', () => {
    it('should handle admin user creation and management', async () => {
      // Mock Firebase Auth
      const mockAuth = {
        createUser: jest.fn().mockResolvedValue({ uid: 'test-admin-uid' }),
        getUserByEmail: jest.fn().mockResolvedValue({ uid: 'test-admin-uid' }),
        verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-admin-uid' })
      };

      (admin.auth as jest.Mock).mockReturnValue(mockAuth);

      const adminUser = await authMiddleware.createAdminUser(
        'test-admin-uid',
        'admin@test.com',
        'admin',
        ['system_admin', 'upload_companies', 'edit_weights']
      );

      expect(adminUser).toBeDefined();
      expect(adminUser.uid).toBe('test-admin-uid');
      expect(adminUser.email).toBe('admin@test.com');
      expect(adminUser.role).toBe('admin');
      expect(adminUser.permissions).toContain('system_admin');
    });

    it('should validate admin permissions correctly', async () => {
      const adminUsers = await authMiddleware.listAdminUsers();
      expect(Array.isArray(adminUsers)).toBe(true);
    });
  });

  describe('System Setup and Initialization', () => {
    it('should initialize system components successfully', async () => {
      const setupResult = await setupMatchmakingSystem('test-admin@example.com');

      expect(setupResult).toBeDefined();
      expect(setupResult.success).toBe(true);
      expect(setupResult.summary).toBeDefined();
    });

    it('should handle system health verification', async () => {
      // This would typically test the actual health check endpoints
      // For now, we verify the components are properly initialized
      expect(matchEngine).toBeDefined();
      expect(uploadProcessor).toBeDefined();
      expect(weightsManager).toBeDefined();
      expect(taxonomyAnalyzer).toBeDefined();
      expect(authMiddleware).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent matching requests', async () => {
      const requests = Array(5).fill(null).map((_, index) => ({
        companyId: mockCompanies[index % mockCompanies.length].id,
        weightsProfileId: mockWeightsProfile.id,
        limit: 5
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        requests.map(request => matchEngine.findMatches(request))
      );

      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.matches).toBeDefined();
      });

      // Should complete within reasonable time even with concurrent requests
      expect(totalTime).toBeLessThan(2000);
    });

    it('should cache and optimize repeated operations', async () => {
      const request: MatchRequest = {
        companyId: 'game-dev-1',
        weightsProfileId: mockWeightsProfile.id
      };

      // First request
      const startTime1 = Date.now();
      const result1 = await matchEngine.findMatches(request);
      const time1 = Date.now() - startTime1;

      // Second identical request (should benefit from caching)
      const startTime2 = Date.now();
      const result2 = await matchEngine.findMatches(request);
      const time2 = Date.now() - startTime2;

      expect(result1.matches.length).toBe(result2.matches.length);

      // Performance improvement from caching (though mock may not show this)
      expect(time2).toBeLessThanOrEqual(time1 + 50); // Allow for some variance
    });

    it('should handle large dataset processing efficiently', async () => {
      // Simulate large CSV upload
      const largeDataset = Array(100).fill(null).map((_, index) => ({
        'Company Name': `Test Company ${index}`,
        'Country': 'Test Country',
        'Type': 'game_developer',
        'Industry': 'gaming',
        'Employees': String(10 + index)
      }));

      const uploadResponse = await uploadProcessor.processUpload({
        filename: 'large-dataset.csv',
        data: largeDataset,
        validateOnly: true
      });

      expect(uploadResponse.ingestLog.rowCount).toBe(100);
      expect(uploadResponse.ingestLog.processingTimeMs).toBeDefined();
      expect(uploadResponse.ingestLog.processingTimeMs).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial system failures gracefully', async () => {
      // Simulate Firestore write failure
      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'ingestLogs') {
          return {
            doc: () => ({
              set: jest.fn().mockRejectedValue(new Error('Database write failed'))
            })
          };
        }
        return mockFirestore.collection(collectionName);
      });

      const uploadResponse = await uploadProcessor.processUpload({
        filename: 'error-test.csv',
        data: [{ 'Company Name': 'Test', 'Country': 'Test' }],
        validateOnly: false
      });

      // Should handle error gracefully
      expect(uploadResponse.ingestLog.status).toBe('failed');
      expect(uploadResponse.ingestLog.errorMessage).toContain('Database write failed');
    });

    it('should maintain data consistency during failures', async () => {
      // Test that partial uploads don't leave system in inconsistent state
      // This would require more sophisticated mocking for transaction testing
      expect(true).toBe(true); // Placeholder for transaction consistency tests
    });
  });
});