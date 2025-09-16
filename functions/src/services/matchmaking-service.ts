/**
 * Matchmaking Service
 * Handles data flow between Firestore and matchmaking logic
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firestore
const db = admin.firestore();

export interface Company {
  id: string;
  name: string;
  industry: string;
  goals: string[];
  website?: string;
  description?: string;
  size?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Match {
  company: Company;
  score: number;
  reasons: string[];
  confidence?: number;
  metrics?: Record<string, number>;
  matchedAt: string;
}

export class MatchmakingService {
  private companiesCollection = db.collection('companies');
  private matchesCollection = db.collection('matches');

  /**
   * Get all companies from Firestore
   */
  async getAllCompanies(): Promise<Company[]> {
    try {
      const snapshot = await this.companiesCollection.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Company));
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Return demo data as fallback
      return this.getDemoCompanies();
    }
  }

  /**
   * Get a single company by ID
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const doc = await this.companiesCollection.doc(companyId).get();
      if (!doc.exists) {
        return null;
      }
      return {
        id: doc.id,
        ...doc.data()
      } as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  /**
   * Calculate matches for a company
   */
  async calculateMatches(companyId: string, limit: number = 5): Promise<Match[]> {
    const company = await this.getCompanyById(companyId);
    if (!company) {
      // Try demo data
      const demoCompanies = this.getDemoCompanies();
      const demoCompany = demoCompanies.find(c => c.id === companyId);
      if (!demoCompany) {
        return [];
      }
      return this.calculateMatchesForCompany(demoCompany, demoCompanies, limit);
    }

    const allCompanies = await this.getAllCompanies();
    return this.calculateMatchesForCompany(company, allCompanies, limit);
  }

  /**
   * Calculate match score between companies with sophisticated algorithms
   */
  private calculateMatchesForCompany(company: Company, candidates: Company[], limit: number): Match[] {
    return candidates
      .filter(c => c.id !== company.id)
      .map(candidate => {
        const metrics = this.calculateAdvancedMetrics(company, candidate);
        const score = this.calculateWeightedScore(metrics);
        const reasons = this.generateReasons(metrics, company, candidate);
        const confidence = this.calculateConfidence(company, candidate);

        return {
          company: candidate,
          score: Math.round(score),
          reasons,
          confidence,
          metrics,
          matchedAt: new Date().toISOString()
        };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate advanced matching metrics inspired by the sophisticated system
   */
  private calculateAdvancedMetrics(companyA: Company, companyB: Company): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Goal alignment using Jaccard similarity
    metrics['goalAlignment'] = this.jaccardSimilarity(companyA.goals, companyB.goals);

    // Industry exact match
    metrics['industryMatch'] = companyA.industry === companyB.industry ? 1 : 0;

    // Industry semantic similarity (simplified)
    metrics['industryCompatibility'] = this.industryCompatibility(companyA.industry, companyB.industry);

    // Size compatibility
    metrics['sizeCompatibility'] = this.calculateSizeCompatibilityAdvanced(companyA.size, companyB.size);

    // Name similarity (basic edit distance)
    metrics['nameSimilarity'] = this.calculateStringSimilarity(companyA.name, companyB.name);

    // Description similarity (basic word overlap if descriptions exist)
    if (companyA.description && companyB.description) {
      metrics['descriptionSimilarity'] = this.calculateTextSimilarity(companyA.description, companyB.description);
    }

    return metrics;
  }

  /**
   * Calculate weighted score from metrics
   */
  private calculateWeightedScore(metrics: Record<string, number>): number {
    const weights = {
      goalAlignment: 40,
      industryMatch: 30,
      industryCompatibility: 15,
      sizeCompatibility: 10,
      nameSimilarity: 2,
      descriptionSimilarity: 8
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(metrics).forEach(([key, value]) => {
      const weight = weights[key as keyof typeof weights] || 1;
      weightedSum += value * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight * 100 : 0;
  }

  /**
   * Generate human-readable reasons from metrics
   */
  private generateReasons(metrics: Record<string, number>, companyA: Company, companyB: Company): string[] {
    const reasons: string[] = [];

    const goalAlignment = metrics['goalAlignment'] || 0;
    if (goalAlignment > 0.3) {
      const sharedGoals = companyA.goals.filter(g => companyB.goals.includes(g));
      sharedGoals.forEach(goal => reasons.push(`Shared interest in ${goal}`));
    }

    const industryMatch = metrics['industryMatch'] || 0;
    if (industryMatch === 1) {
      reasons.push(`Both in ${companyA.industry} industry`);
    } else {
      const industryCompatibility = metrics['industryCompatibility'] || 0;
      if (industryCompatibility > 0.5) {
        reasons.push(`Compatible industries: ${companyA.industry} & ${companyB.industry}`);
      }
    }

    const sizeCompatibility = metrics['sizeCompatibility'] || 0;
    if (sizeCompatibility > 0.7) {
      reasons.push(`Compatible company sizes`);
    }

    const descriptionSimilarity = metrics['descriptionSimilarity'];
    if (descriptionSimilarity && descriptionSimilarity > 0.4) {
      reasons.push(`Similar business focus`);
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  /**
   * Calculate confidence based on data completeness
   */
  private calculateConfidence(companyA: Company, companyB: Company): number {
    let dataPoints = 0;
    let filledPoints = 0;

    // Check basic fields
    [companyA, companyB].forEach(company => {
      dataPoints += 4; // name, industry, goals, size
      if (company.name) filledPoints++;
      if (company.industry) filledPoints++;
      if (company.goals?.length > 0) filledPoints++;
      if (company.size) filledPoints++;

      if (company.description) {
        dataPoints++;
        filledPoints++;
      }
    });

    return dataPoints > 0 ? filledPoints / dataPoints : 0.5;
  }

  /**
   * Jaccard similarity for arrays
   */
  private jaccardSimilarity(setA: string[], setB: string[]): number {
    if (!setA?.length || !setB?.length) return 0;

    const intersection = setA.filter(item => setB.includes(item));
    const union = [...new Set([...setA, ...setB])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * Industry compatibility scoring
   */
  private industryCompatibility(industryA: string, industryB: string): number {
    if (industryA === industryB) return 1;

    // Simplified industry compatibility mapping
    const compatibilityMap: Record<string, string[]> = {
      'Technology': ['Gaming', 'Software', 'AI', 'Fintech'],
      'Gaming': ['Technology', 'Entertainment', 'Media'],
      'Finance': ['Fintech', 'Technology', 'Insurance'],
      'Media': ['Entertainment', 'Gaming', 'Marketing'],
      'Healthcare': ['Technology', 'AI', 'Biotech']
    };

    const compatible = compatibilityMap[industryA] || [];
    return compatible.includes(industryB) ? 0.6 : 0.2;
  }

  /**
   * Advanced size compatibility
   */
  private calculateSizeCompatibilityAdvanced(sizeA: string = '', sizeB: string = ''): number {
    const sizeOrder = ['startup', 'small', 'medium', 'large', 'enterprise'];
    const indexA = sizeOrder.indexOf(sizeA.toLowerCase());
    const indexB = sizeOrder.indexOf(sizeB.toLowerCase());

    if (indexA === -1 || indexB === -1) return 0.5;

    const distance = Math.abs(indexA - indexB);
    // Closer sizes are more compatible
    return Math.max(0, 1 - (distance * 0.25));
  }

  /**
   * Basic string similarity using edit distance
   */
  private calculateStringSimilarity(strA: string, strB: string): number {
    if (!strA || !strB) return 0;

    const maxLength = Math.max(strA.length, strB.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(strA.toLowerCase(), strB.toLowerCase());
    return 1 - (distance / maxLength);
  }

  /**
   * Basic text similarity using word overlap
   */
  private calculateTextSimilarity(textA: string, textB: string): number {
    if (!textA || !textB) return 0;

    const wordsA = textA.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wordsB = textB.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    return this.jaccardSimilarity(wordsA, wordsB);
  }

  /**
   * Simplified string similarity (basic character overlap)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    // Simplified implementation to avoid TypeScript complexity
    if (str1 === str2) return 0;
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;

    // Use character overlap as proxy for edit distance
    const chars1 = str1.toLowerCase().split('');
    const chars2 = str2.toLowerCase().split('');
    const common = chars1.filter(c => chars2.includes(c)).length;
    const maxLength = Math.max(str1.length, str2.length);

    return maxLength - common;
  }


  /**
   * Save a match to Firestore
   */
  async saveMatch(fromCompanyId: string, toCompanyId: string, score: number): Promise<void> {
    try {
      await this.matchesCollection.add({
        fromCompanyId,
        toCompanyId,
        score,
        createdAt: Timestamp.now(),
        status: 'pending'
      });
    } catch (error) {
      console.error('Error saving match:', error);
    }
  }

  /**
   * Demo companies for testing
   */
  private getDemoCompanies(): Company[] {
    return [
      {
        id: 'c1',
        name: 'TechCorp',
        industry: 'Technology',
        goals: ['partnership', 'investment', 'talent'],
        size: 'medium',
        description: 'Leading tech company'
      },
      {
        id: 'c2',
        name: 'GameStudio',
        industry: 'Gaming',
        goals: ['publishing', 'partnership', 'marketing'],
        size: 'small',
        description: 'Indie game developer'
      },
      {
        id: 'c3',
        name: 'InvestCo',
        industry: 'Finance',
        goals: ['investment', 'acquisition'],
        size: 'large',
        description: 'Venture capital firm'
      },
      {
        id: 'c4',
        name: 'MediaHouse',
        industry: 'Media',
        goals: ['partnership', 'content', 'distribution'],
        size: 'medium',
        description: 'Digital media company'
      },
      {
        id: 'c5',
        name: 'StartupHub',
        industry: 'Technology',
        goals: ['investment', 'mentorship', 'talent'],
        size: 'startup',
        description: 'Early-stage startup'
      }
    ];
  }
}

// Export singleton instance
export const matchmakingService = new MatchmakingService();