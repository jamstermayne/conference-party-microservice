/**
 * Weights Manager - Handles weights profiles for matchmaking
 * Supports CRUD operations, validation, and persona-based templates
 */
import { WeightsProfile, PersonaType } from './types';
export declare class WeightsManager {
    private db;
    constructor();
    /**
     * List all weights profiles
     */
    listProfiles(): Promise<WeightsProfile[]>;
    /**
     * Get specific weights profile
     */
    getProfile(id: string): Promise<WeightsProfile | null>;
    /**
     * Create new weights profile
     */
    createProfile(profileData: Partial<WeightsProfile>, createdBy?: string): Promise<WeightsProfile>;
    /**
     * Update weights profile
     */
    updateProfile(id: string, updateData: Partial<WeightsProfile>): Promise<WeightsProfile>;
    /**
     * Delete weights profile
     */
    deleteProfile(id: string): Promise<boolean>;
    /**
     * Duplicate weights profile
     */
    duplicateProfile(id: string, newName: string, createdBy?: string): Promise<WeightsProfile>;
    /**
     * Get default profile for persona
     */
    getDefaultProfileForPersona(persona: PersonaType): Promise<WeightsProfile | null>;
    /**
     * Export weights profile for backup/sharing
     */
    exportProfile(id: string): Promise<any>;
    /**
     * Import weights profile from backup/share
     */
    importProfile(importData: any, createdBy?: string): Promise<WeightsProfile>;
    /**
     * Generate A/B test variants of a weights profile
     */
    generateTestVariants(baseId: string, variations: Array<{
        name: string;
        adjustments: Partial<WeightsProfile['weights']>;
    }>, createdBy?: string): Promise<WeightsProfile[]>;
    /**
     * Generate complete profile with all required fields
     */
    private generateCompleteProfile;
    /**
     * Get template weights for persona
     */
    private getPersonaTemplate;
    /**
     * Validate weights values
     */
    private validateWeights;
    /**
     * Initialize default profiles if they don't exist
     */
    private initializeDefaultProfiles;
    /**
     * Create default profile for specific persona
     */
    private createDefaultProfile;
}
//# sourceMappingURL=weights-manager.d.ts.map