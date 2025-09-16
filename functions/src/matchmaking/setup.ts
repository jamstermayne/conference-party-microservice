/**
 * Matchmaking System Setup
 * Initializes collections, default data, and admin users
 */

import * as admin from 'firebase-admin';
import { WeightsManager } from './weights-manager';
import { AuthMiddleware } from './auth-middleware';
import { DEFAULT_WEIGHTS_PROFILES } from './types';

export class MatchmakingSetup {
  private db: FirebaseFirestore.Firestore;
  private weightsManager: WeightsManager;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.db = admin.firestore();
    this.weightsManager = new WeightsManager();
    this.authMiddleware = new AuthMiddleware();
  }

  /**
   * Initialize the entire matchmaking system
   */
  async initializeSystem(adminEmail: string): Promise<void> {
    console.log('[matchmaking-setup] Starting system initialization...');

    try {
      // Check if system is already initialized
      const isInitialized = await this.authMiddleware.isSystemInitialized();

      if (isInitialized) {
        console.log('[matchmaking-setup] System already initialized');
        return;
      }

      // Create Firestore indexes
      await this.createFirestoreIndexes();

      // Initialize collections
      await this.initializeCollections();

      // Create default weights profiles
      await this.createDefaultWeightsProfiles();

      // Create admin user
      await this.createAdminUser(adminEmail);

      // Create sample data (optional)
      await this.createSampleData();

      console.log('[matchmaking-setup] System initialization completed successfully!');

    } catch (error) {
      console.error('[matchmaking-setup] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create required Firestore indexes
   */
  private async createFirestoreIndexes(): Promise<void> {
    console.log('[matchmaking-setup] Creating Firestore indexes...');

    // Note: Indexes need to be created manually in Firebase Console or via firestore.indexes.json
    // This function documents the required indexes

    const requiredIndexes = [
      {
        collection: 'companies',
        fields: [
          { field: 'type', order: 'ASCENDING' },
          { field: 'country', order: 'ASCENDING' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'companies',
        fields: [
          { field: 'industry', arrayConfig: 'CONTAINS' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'weightsProfiles',
        fields: [
          { field: 'persona', order: 'ASCENDING' },
          { field: 'isDefault', order: 'DESCENDING' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'matchResults',
        fields: [
          { field: 'companyA', order: 'ASCENDING' },
          { field: 'overallScore', order: 'DESCENDING' },
          { field: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collection: 'ingestLogs',
        fields: [
          { field: 'status', order: 'ASCENDING' },
          { field: 'uploadedAt', order: 'DESCENDING' }
        ]
      }
    ];

    console.log('[matchmaking-setup] Required indexes documented. Please create these in Firebase Console:');
    requiredIndexes.forEach((index, i) => {
      console.log(`${i + 1}. Collection: ${index.collection}`);
      console.log(`   Fields: ${JSON.stringify(index.fields, null, 2)}`);
    });
  }

  /**
   * Initialize Firestore collections with proper structure
   */
  private async initializeCollections(): Promise<void> {
    console.log('[matchmaking-setup] Initializing collections...');

    const collections = [
      'companies',
      'weightsProfiles',
      'matchResults',
      'ingestLogs',
      'adminUsers'
    ];

    // Create collections by adding a temporary document (will be removed)
    for (const collectionName of collections) {
      try {
        const docRef = this.db.collection(collectionName).doc('_init');
        await docRef.set({
          _initialized: true,
          _createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Immediately delete the temporary document
        await docRef.delete();

        console.log(`[matchmaking-setup] Collection '${collectionName}' initialized`);
      } catch (error) {
        console.warn(`[matchmaking-setup] Warning: Could not initialize collection '${collectionName}':`, error);
      }
    }
  }

  /**
   * Create default weights profiles
   */
  private async createDefaultWeightsProfiles(): Promise<void> {
    console.log('[matchmaking-setup] Creating default weights profiles...');

    for (const profile of DEFAULT_WEIGHTS_PROFILES) {
      try {
        const existingProfile = await this.db.collection('weightsProfiles')
          .where('name', '==', profile.name)
          .where('isDefault', '==', true)
          .limit(1)
          .get();

        if (existingProfile.empty) {
          const profileData = {
            ...profile,
            id: undefined, // Remove ID as it will be auto-generated
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            thresholds: {
              minimumOverallScore: 40,
              minimumConfidence: 30,
              maximumResults: 100,
              ...profile.thresholds
            },
            contextRules: {
              platformBoosts: {
                'mobile': 1.2,
                'pc': 1.1,
                'console': 1.3,
                'vr': 1.4,
                'web': 1.0
              },
              marketSynergies: {
                'b2b': { 'b2b': 1.0, 'b2c': 0.7 },
                'b2c': { 'b2b': 0.7, 'b2c': 1.0 }
              },
              stageCompatibility: {
                'idea': { 'idea': 1.0, 'prototype': 0.9, 'alpha': 0.7 },
                'prototype': { 'idea': 0.9, 'prototype': 1.0, 'alpha': 0.9, 'beta': 0.8 },
                'alpha': { 'prototype': 0.9, 'alpha': 1.0, 'beta': 0.9, 'launched': 0.7 },
                'beta': { 'alpha': 0.9, 'beta': 1.0, 'launched': 0.9, 'growth': 0.8 },
                'launched': { 'beta': 0.7, 'launched': 1.0, 'growth': 0.9, 'mature': 0.8 },
                'growth': { 'launched': 0.9, 'growth': 1.0, 'mature': 0.9 },
                'mature': { 'growth': 0.9, 'mature': 1.0 }
              },
              ...profile.contextRules
            }
          };

          await this.db.collection('weightsProfiles').add(profileData);
          console.log(`[matchmaking-setup] Created default profile: ${profile.name}`);
        } else {
          console.log(`[matchmaking-setup] Default profile already exists: ${profile.name}`);
        }
      } catch (error) {
        console.error(`[matchmaking-setup] Error creating profile ${profile.name}:`, error);
      }
    }
  }

  /**
   * Create initial admin user
   */
  private async createAdminUser(adminEmail: string): Promise<void> {
    console.log(`[matchmaking-setup] Creating admin user: ${adminEmail}`);

    try {
      const adminUser = await this.authMiddleware.initializeDefaultAdmin(adminEmail);
      console.log(`[matchmaking-setup] Admin user created successfully: ${adminUser.uid}`);
    } catch (error) {
      console.error('[matchmaking-setup] Error creating admin user:', error);
      throw error;
    }
  }

  /**
   * Create sample company data for testing
   */
  private async createSampleData(): Promise<void> {
    console.log('[matchmaking-setup] Creating sample data...');

    const sampleCompanies = [
      {
        name: 'GameStudio Alpha',
        description: 'Independent game development studio specializing in mobile games',
        website: 'https://gamestudio-alpha.com',
        country: 'United States',
        city: 'San Francisco',
        type: 'game_developer',
        size: 'small',
        stage: 'growth',
        industry: ['gaming', 'mobile'],
        platforms: ['mobile', 'ios', 'android'],
        technologies: ['unity', 'c#', 'react native'],
        markets: ['b2c', 'casual gaming'],
        capabilities: ['game development', 'mobile optimization', 'user acquisition'],
        needs: ['publishing', 'marketing', 'funding'],
        fundingStage: 'seed',
        employees: 15,
        foundedYear: 2020,
        contactEmail: 'contact@gamestudio-alpha.com',
        pitch: 'We create engaging mobile games that reach millions of players worldwide.',
        lookingFor: 'Publisher partnership for our upcoming puzzle game series.',
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleteness: 85
      },
      {
        name: 'MegaPublisher Corp',
        description: 'Leading game publisher with global reach and marketing expertise',
        website: 'https://megapublisher.com',
        country: 'United Kingdom',
        city: 'London',
        type: 'publisher',
        size: 'large',
        stage: 'mature',
        industry: ['gaming', 'publishing'],
        platforms: ['pc', 'console', 'mobile'],
        technologies: ['proprietary engine', 'analytics', 'monetization'],
        markets: ['b2c', 'premium gaming', 'f2p'],
        capabilities: ['publishing', 'marketing', 'distribution', 'funding'],
        needs: ['new game content', 'innovative developers'],
        fundingStage: 'ipo',
        employees: 500,
        foundedYear: 2005,
        contactEmail: 'partnerships@megapublisher.com',
        pitch: 'Global publisher helping developers reach their full potential.',
        lookingFor: 'High-quality indie games for our publishing pipeline.',
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleteness: 90
      },
      {
        name: 'GameTech Ventures',
        description: 'Venture capital firm focused on gaming and interactive entertainment',
        website: 'https://gametech-ventures.com',
        country: 'United States',
        city: 'Los Angeles',
        type: 'investor',
        size: 'medium',
        stage: 'mature',
        industry: ['gaming', 'investment', 'venture capital'],
        platforms: ['cross-platform'],
        technologies: ['emerging tech', 'vr', 'ar', 'blockchain'],
        markets: ['b2b', 'b2c', 'enterprise'],
        capabilities: ['funding', 'mentorship', 'network access', 'strategic guidance'],
        needs: ['innovative startups', 'scalable gaming companies'],
        fundingStage: 'series_d_plus',
        employees: 25,
        foundedYear: 2015,
        contactEmail: 'investments@gametech-ventures.com',
        pitch: 'Investing in the future of interactive entertainment.',
        lookingFor: 'Seed to Series A gaming startups with strong growth potential.',
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileCompleteness: 80
      }
    ];

    for (const company of sampleCompanies) {
      try {
        const existingCompany = await this.db.collection('companies')
          .where('name', '==', company.name)
          .limit(1)
          .get();

        if (existingCompany.empty) {
          await this.db.collection('companies').add(company);
          console.log(`[matchmaking-setup] Created sample company: ${company.name}`);
        } else {
          console.log(`[matchmaking-setup] Sample company already exists: ${company.name}`);
        }
      } catch (error) {
        console.error(`[matchmaking-setup] Error creating sample company ${company.name}:`, error);
      }
    }
  }

  /**
   * Verify system health after setup
   */
  async verifySystemHealth(): Promise<boolean> {
    console.log('[matchmaking-setup] Verifying system health...');

    try {
      // Check collections exist and have data
      const checks = await Promise.all([
        this.db.collection('companies').limit(1).get(),
        this.db.collection('weightsProfiles').limit(1).get(),
        this.db.collection('adminUsers').limit(1).get()
      ]);

      const [companiesSnap, weightsSnap, adminSnap] = checks;

      const healthStatus = {
        companies: !companiesSnap.empty,
        weightsProfiles: !weightsSnap.empty,
        adminUsers: !adminSnap.empty
      };

      console.log('[matchmaking-setup] Health check results:', healthStatus);

      const isHealthy = Object.values(healthStatus).every(status => status);

      if (isHealthy) {
        console.log('[matchmaking-setup] ✅ System is healthy and ready to use!');
      } else {
        console.log('[matchmaking-setup] ❌ System health check failed');
      }

      return isHealthy;

    } catch (error) {
      console.error('[matchmaking-setup] Health check failed:', error);
      return false;
    }
  }

  /**
   * Generate setup summary
   */
  async generateSetupSummary(): Promise<any> {
    try {
      const [companiesSnap, weightsSnap, adminSnap] = await Promise.all([
        this.db.collection('companies').get(),
        this.db.collection('weightsProfiles').get(),
        this.db.collection('adminUsers').get()
      ]);

      return {
        timestamp: new Date().toISOString(),
        collections: {
          companies: companiesSnap.size,
          weightsProfiles: weightsSnap.size,
          adminUsers: adminSnap.size
        },
        status: 'initialized',
        version: '1.0.0'
      };
    } catch (error) {
      console.error('[matchmaking-setup] Error generating summary:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export setup function for use in Cloud Functions
export async function setupMatchmakingSystem(adminEmail: string): Promise<any> {
  const setup = new MatchmakingSetup();

  try {
    await setup.initializeSystem(adminEmail);
    const isHealthy = await setup.verifySystemHealth();
    const summary = await setup.generateSetupSummary();

    return {
      success: true,
      healthy: isHealthy,
      summary,
      message: 'Matchmaking system initialized successfully'
    };
  } catch (error) {
    console.error('[setup] Matchmaking system setup failed:', error);

    return {
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Matchmaking system setup failed'
    };
  }
}