/**
 * Weights Manager - Handles weights profiles for matchmaking
 * Supports CRUD operations, validation, and persona-based templates
 */

import * as admin from 'firebase-admin';
import { WeightsProfile, DEFAULT_WEIGHTS_PROFILES, PersonaType } from './types';

export class WeightsManager {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * List all weights profiles
   */
  async listProfiles(): Promise<WeightsProfile[]> {
    try {
      const snapshot = await this.db.collection('weightsProfiles')
        .orderBy('isDefault', 'desc')
        .orderBy('createdAt', 'desc')
        .get();

      const profiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeightsProfile[];

      // Ensure default profiles exist
      if (profiles.length === 0) {
        return await this.initializeDefaultProfiles();
      }

      return profiles;
    } catch (error) {
      console.error('[weights-manager] Error listing profiles:', error);
      throw new Error('Failed to list weights profiles');
    }
  }

  /**
   * Get specific weights profile
   */
  async getProfile(id: string): Promise<WeightsProfile | null> {
    try {
      const doc = await this.db.collection('weightsProfiles').doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() } as WeightsProfile;
    } catch (error) {
      console.error('[weights-manager] Error getting profile:', error);
      return null;
    }
  }

  /**
   * Create new weights profile
   */
  async createProfile(profileData: Partial<WeightsProfile>, createdBy?: string): Promise<WeightsProfile> {
    try {
      // Validate required fields
      if (!profileData.name || !profileData.persona) {
        throw new Error('Name and persona are required');
      }

      // Generate complete profile with defaults
      const profile = this.generateCompleteProfile(profileData, createdBy);

      // Validate weights
      this.validateWeights(profile);

      // Save to database
      const docRef = await this.db.collection('weightsProfiles').add(profile);

      return { id: docRef.id, ...profile };
    } catch (error) {
      console.error('[weights-manager] Error creating profile:', error);
      throw new Error(`Failed to create weights profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update weights profile
   */
  async updateProfile(id: string, updateData: Partial<WeightsProfile>): Promise<WeightsProfile> {
    try {
      const docRef = this.db.collection('weightsProfiles').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error('Weights profile not found');
      }

      const currentProfile = { id: doc.id, ...doc.data() } as WeightsProfile;

      // Merge updates with current profile
      const updatedProfile = {
        ...currentProfile,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Validate updated weights
      this.validateWeights(updatedProfile);

      // Save updates
      await docRef.update({
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return updatedProfile;
    } catch (error) {
      console.error('[weights-manager] Error updating profile:', error);
      throw new Error(`Failed to update weights profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete weights profile
   */
  async deleteProfile(id: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('weightsProfiles').doc(id).get();

      if (!doc.exists) {
        throw new Error('Weights profile not found');
      }

      const profile = doc.data() as WeightsProfile;

      // Don't allow deletion of default profiles
      if (profile.isDefault) {
        throw new Error('Cannot delete default weights profile');
      }

      await this.db.collection('weightsProfiles').doc(id).delete();

      return true;
    } catch (error) {
      console.error('[weights-manager] Error deleting profile:', error);
      throw new Error(`Failed to delete weights profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Duplicate weights profile
   */
  async duplicateProfile(id: string, newName: string, createdBy?: string): Promise<WeightsProfile> {
    try {
      const originalProfile = await this.getProfile(id);

      if (!originalProfile) {
        throw new Error('Original profile not found');
      }

      // Create copy with new name
      const duplicatedProfile: Partial<WeightsProfile> = {
        ...originalProfile,
        name: newName,
        description: `Copy of ${originalProfile.name}`,
        isDefault: false
      };

      // Remove ID to create new document
      delete (duplicatedProfile as any).id;

      return await this.createProfile(duplicatedProfile, createdBy);
    } catch (error) {
      console.error('[weights-manager] Error duplicating profile:', error);
      throw new Error(`Failed to duplicate weights profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default profile for persona
   */
  async getDefaultProfileForPersona(persona: PersonaType): Promise<WeightsProfile | null> {
    try {
      const snapshot = await this.db.collection('weightsProfiles')
        .where('persona', '==', persona)
        .where('isDefault', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Try to create default profile for this persona
        return await this.createDefaultProfile(persona);
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as WeightsProfile;
    } catch (error) {
      console.error('[weights-manager] Error getting default profile:', error);
      return null;
    }
  }

  /**
   * Export weights profile for backup/sharing
   */
  async exportProfile(id: string): Promise<any> {
    try {
      const profile = await this.getProfile(id);

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Export format
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile: {
          name: profile.name,
          description: profile.description,
          persona: profile.persona,
          weights: profile.weights,
          thresholds: profile.thresholds,
          contextRules: profile.contextRules
        }
      };
    } catch (error) {
      console.error('[weights-manager] Error exporting profile:', error);
      throw new Error('Failed to export weights profile');
    }
  }

  /**
   * Import weights profile from backup/share
   */
  async importProfile(importData: any, createdBy?: string): Promise<WeightsProfile> {
    try {
      // Validate import format
      if (!importData.profile || !importData.profile.name) {
        throw new Error('Invalid import data format');
      }

      const profileData = importData.profile;

      // Add import metadata
      profileData.description = `${profileData.description || ''} (Imported ${new Date().toLocaleDateString()})`.trim();
      profileData.isDefault = false;

      return await this.createProfile(profileData, createdBy);
    } catch (error) {
      console.error('[weights-manager] Error importing profile:', error);
      throw new Error(`Failed to import weights profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate A/B test variants of a weights profile
   */
  async generateTestVariants(
    baseId: string,
    variations: Array<{ name: string; adjustments: Partial<WeightsProfile['weights']> }>,
    createdBy?: string
  ): Promise<WeightsProfile[]> {
    try {
      const baseProfile = await this.getProfile(baseId);

      if (!baseProfile) {
        throw new Error('Base profile not found');
      }

      const variants: WeightsProfile[] = [];

      for (const variation of variations) {
        const variantProfile: Partial<WeightsProfile> = {
          ...baseProfile,
          name: `${baseProfile.name} - ${variation.name}`,
          description: `A/B test variant: ${variation.name}`,
          weights: {
            ...baseProfile.weights,
            ...variation.adjustments
          },
          isDefault: false
        };

        delete (variantProfile as any).id;

        const variant = await this.createProfile(variantProfile, createdBy);
        variants.push(variant);
      }

      return variants;
    } catch (error) {
      console.error('[weights-manager] Error generating test variants:', error);
      throw new Error('Failed to generate test variants');
    }
  }

  // ============= PRIVATE METHODS =============

  /**
   * Generate complete profile with all required fields
   */
  private generateCompleteProfile(profileData: Partial<WeightsProfile>, createdBy?: string): Omit<WeightsProfile, 'id'> {
    const now = new Date().toISOString();

    // Get template weights for persona
    const template = this.getPersonaTemplate(profileData.persona!);

    return {
      name: profileData.name!,
      description: profileData.description || '',
      persona: profileData.persona!,
      weights: {
        ...template.weights,
        ...profileData.weights
      },
      thresholds: {
        minimumOverallScore: 40,
        minimumConfidence: 30,
        maximumResults: 100,
        ...template.thresholds,
        ...profileData.thresholds
      },
      contextRules: {
        platformBoosts: {
          'mobile': 1.2,
          'pc': 1.1,
          'console': 1.3,
          'vr': 1.4,
          'web': 1.0,
          ...template.contextRules?.platformBoosts
        },
        marketSynergies: {
          'b2b': { 'b2b': 1.0, 'b2c': 0.7 },
          'b2c': { 'b2b': 0.7, 'b2c': 1.0 },
          ...template.contextRules?.marketSynergies
        },
        stageCompatibility: {
          'idea': { 'idea': 1.0, 'prototype': 0.9, 'alpha': 0.7 },
          'prototype': { 'idea': 0.9, 'prototype': 1.0, 'alpha': 0.9, 'beta': 0.8 },
          'alpha': { 'prototype': 0.9, 'alpha': 1.0, 'beta': 0.9, 'launched': 0.7 },
          'beta': { 'alpha': 0.9, 'beta': 1.0, 'launched': 0.9, 'growth': 0.8 },
          'launched': { 'beta': 0.7, 'launched': 1.0, 'growth': 0.9, 'mature': 0.8 },
          'growth': { 'launched': 0.9, 'growth': 1.0, 'mature': 0.9 },
          'mature': { 'growth': 0.9, 'mature': 1.0 },
          ...template.contextRules?.stageCompatibility
        },
        ...profileData.contextRules
      },
      createdAt: now,
      updatedAt: now,
      isDefault: profileData.isDefault || false,
      createdBy
    };
  }

  /**
   * Get template weights for persona
   */
  private getPersonaTemplate(persona: PersonaType): Partial<WeightsProfile> {
    const template = DEFAULT_WEIGHTS_PROFILES.find(p => p.persona === persona);

    if (template) {
      return template;
    }

    // Fallback to general template
    return DEFAULT_WEIGHTS_PROFILES.find(p => p.persona === 'general') || DEFAULT_WEIGHTS_PROFILES[0];
  }

  /**
   * Validate weights values
   */
  private validateWeights(profile: WeightsProfile): void {
    const errors: string[] = [];

    // Check weights range (0-100)
    for (const [key, value] of Object.entries(profile.weights)) {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`Weight '${key}' must be a number between 0 and 100`);
      }
    }

    // Check thresholds
    if (profile.thresholds.minimumOverallScore < 0 || profile.thresholds.minimumOverallScore > 100) {
      errors.push('Minimum overall score must be between 0 and 100');
    }

    if (profile.thresholds.minimumConfidence < 0 || profile.thresholds.minimumConfidence > 100) {
      errors.push('Minimum confidence must be between 0 and 100');
    }

    if (profile.thresholds.maximumResults < 1 || profile.thresholds.maximumResults > 1000) {
      errors.push('Maximum results must be between 1 and 1000');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Initialize default profiles if they don't exist
   */
  private async initializeDefaultProfiles(): Promise<WeightsProfile[]> {
    const profiles: WeightsProfile[] = [];

    for (const template of DEFAULT_WEIGHTS_PROFILES) {
      try {
        const profile = this.generateCompleteProfile({
          ...template,
          isDefault: true
        });

        const docRef = await this.db.collection('weightsProfiles').add(profile);
        profiles.push({ id: docRef.id, ...profile });

        console.log(`[weights-manager] Created default profile: ${profile.name}`);
      } catch (error) {
        console.error(`[weights-manager] Failed to create default profile ${template.name}:`, error);
      }
    }

    return profiles;
  }

  /**
   * Create default profile for specific persona
   */
  private async createDefaultProfile(persona: PersonaType): Promise<WeightsProfile | null> {
    try {
      const template = DEFAULT_WEIGHTS_PROFILES.find(p => p.persona === persona);

      if (!template) {
        return null;
      }

      const profile = this.generateCompleteProfile({
        ...template,
        isDefault: true
      });

      const docRef = await this.db.collection('weightsProfiles').add(profile);

      console.log(`[weights-manager] Created default profile for persona: ${persona}`);

      return { id: docRef.id, ...profile };
    } catch (error) {
      console.error(`[weights-manager] Failed to create default profile for ${persona}:`, error);
      return null;
    }
  }
}