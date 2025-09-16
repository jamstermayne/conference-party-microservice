/**
 * Compatibility Engine
 * AI-Powered matchmaking for conference networking
 */

export class CompatibilityEngine {
  constructor() {
    this.cache = new Map();
    this.weights = {
      professional: 0.35,
      personal: 0.25,
      contextual: 0.25,
      intent: 0.15
    };
  }
  
  /**
   * Calculate multi-dimensional compatibility between two users
   */
  async calculateCompatibility(user1, user2) {
    // Check cache first
    const cacheKey = this.getCacheKey(user1.id, user2.id);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Calculate all dimensions in parallel
    const [
      professionalScore,
      personalScore,
      contextualScore,
      intentScore
    ] = await Promise.all([
      this.scoreProfessional(user1, user2),
      this.scorePersonal(user1, user2),
      this.scoreContextual(user1, user2),
      this.scoreIntent(user1, user2)
    ]);
    
    // Get personalized weights if available
    const weights = await this.getPersonalizedWeights(user1.id);
    
    // Calculate weighted overall score
    const overallScore = (
      professionalScore * weights.professional +
      personalScore * weights.personal +
      contextualScore * weights.contextual +
      intentScore * weights.intent
    );
    
    const result = {
      overall: Math.round(overallScore * 100),
      breakdown: {
        professional: Math.round(professionalScore * 100),
        personal: Math.round(personalScore * 100),
        contextual: Math.round(contextualScore * 100),
        intent: Math.round(intentScore * 100)
      },
      confidence: this.calculateConfidence(user1, user2),
      reasoning: await this.generateReasoning(user1, user2, overallScore),
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Score professional compatibility
   */
  async scoreProfessional(user1, user2) {
    let score = 0;
    let factors = 0;
    
    // Industry alignment
    if (user1.industry && user2.industry) {
      const industryScore = this.calculateIndustryRelevance(user1.industry, user2.industry);
      score += industryScore * 0.3;
      factors++;
    }
    
    // Skills similarity
    if (user1.skills?.length && user2.skills?.length) {
      const skillScore = this.calculateSkillsSimilarity(user1.skills, user2.skills);
      score += skillScore * 0.4;
      factors++;
    }
    
    // Experience level compatibility
    if (user1.experience && user2.experience) {
      const expScore = this.calculateExperienceMatch(user1.experience, user2.experience);
      score += expScore * 0.2;
      factors++;
    }
    
    // Company size relevance
    if (user1.companySize && user2.companySize) {
      const sizeScore = this.calculateCompanySizeRelevance(user1.companySize, user2.companySize);
      score += sizeScore * 0.1;
      factors++;
    }
    
    // Normalize if we have factors, otherwise return 0
    return factors > 0 ? score / factors : 0;
  }
  
  /**
   * Score personal compatibility
   */
  async scorePersonal(user1, user2) {
    let score = 0;
    let factors = 0;
    
    // Interest overlap
    if (user1.interests?.length && user2.interests?.length) {
      const interestScore = this.calculateInterestOverlap(user1.interests, user2.interests);
      score += interestScore * 0.5;
      factors++;
    }
    
    // Communication style compatibility
    if (user1.communicationStyle && user2.communicationStyle) {
      const styleScore = this.calculateStyleCompatibility(
        user1.communicationStyle,
        user2.communicationStyle
      );
      score += styleScore * 0.3;
      factors++;
    }
    
    // Timezone compatibility (for follow-ups)
    if (user1.timezone && user2.timezone) {
      const tzScore = this.calculateTimezoneCompatibility(user1.timezone, user2.timezone);
      score += tzScore * 0.2;
      factors++;
    }
    
    return factors > 0 ? score / factors : 0;
  }
  
  /**
   * Score contextual compatibility (conference-specific)
   */
  async scoreContextual(user1, user2) {
    let score = 0;
    
    // Same conference attendance
    if (user1.conferences?.includes('gamescom2025') && 
        user2.conferences?.includes('gamescom2025')) {
      score += 0.3;
    }
    
    // Similar session interests
    if (user1.sessions?.length && user2.sessions?.length) {
      const sessionOverlap = this.calculateSetOverlap(user1.sessions, user2.sessions);
      score += sessionOverlap * 0.3;
    }
    
    // Booth/venue proximity
    if (user1.boothNumber && user2.boothNumber) {
      const proximity = this.calculateBoothProximity(user1.boothNumber, user2.boothNumber);
      score += proximity * 0.2;
    }
    
    // Event timing overlap
    if (user1.availability && user2.availability) {
      const timeOverlap = this.calculateAvailabilityOverlap(user1.availability, user2.availability);
      score += timeOverlap * 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Score intent-based compatibility
   */
  async scoreIntent(user1, user2) {
    const user1Goals = user1.goals || this.inferGoals(user1);
    const user2Goals = user2.goals || this.inferGoals(user2);
    
    let score = 0;
    let matches = 0;
    
    // Check goal compatibility
    for (const goal1 of user1Goals) {
      for (const goal2 of user2Goals) {
        const compatibility = this.checkGoalCompatibility(goal1, goal2);
        if (compatibility > 0.5) {
          score += compatibility;
          matches++;
        }
      }
    }
    
    // Normalize based on matches
    if (matches > 0) {
      return Math.min(score / matches, 1.0);
    }
    
    // Fallback: check if personas are complementary
    if (user1.persona && user2.persona) {
      return this.getPersonaCompatibility(user1.persona, user2.persona);
    }
    
    return 0;
  }
  
  /**
   * Calculate industry relevance
   */
  calculateIndustryRelevance(industry1, industry2) {
    // Direct match
    if (industry1 === industry2) return 1.0;
    
    // Related industries
    const relatedIndustries = {
      'Gaming': ['Game Development', 'Technology', 'Entertainment'],
      'Game Development': ['Gaming', 'Technology', 'Software'],
      'Technology': ['Gaming', 'Game Development', 'Software', 'AI/ML'],
      'Publishing': ['Gaming', 'Media', 'Entertainment'],
      'Entertainment': ['Gaming', 'Media', 'Publishing'],
      'Esports': ['Gaming', 'Entertainment', 'Media'],
      'VR/AR': ['Gaming', 'Technology', 'Entertainment']
    };
    
    const related1 = relatedIndustries[industry1] || [];
    const related2 = relatedIndustries[industry2] || [];
    
    if (related1.includes(industry2) || related2.includes(industry1)) {
      return 0.7;
    }
    
    // Check for any overlap in related industries
    const overlap = related1.filter(ind => related2.includes(ind));
    if (overlap.length > 0) {
      return 0.5;
    }
    
    return 0.2; // Different industries can still network
  }
  
  /**
   * Calculate skills similarity
   */
  calculateSkillsSimilarity(skills1, skills2) {
    if (!skills1?.length || !skills2?.length) return 0;
    
    // Direct matches
    const directMatches = skills1.filter(skill => 
      skills2.some(s => s.toLowerCase() === skill.toLowerCase())
    );
    
    // Similar skills (using simple keyword matching)
    const similarSkills = this.findSimilarSkills(skills1, skills2);
    
    const totalMatches = directMatches.length + (similarSkills.length * 0.5);
    const maxPossible = Math.min(skills1.length, skills2.length);
    
    return Math.min(totalMatches / maxPossible, 1.0);
  }
  
  /**
   * Find similar skills using keyword matching
   */
  findSimilarSkills(skills1, skills2) {
    const similar = [];
    const skillGroups = {
      'programming': ['coding', 'development', 'software', 'engineering'],
      'design': ['ui', 'ux', 'graphics', 'art', 'visual'],
      'management': ['leadership', 'project', 'team', 'agile', 'scrum'],
      'data': ['analytics', 'ml', 'ai', 'statistics', 'analysis'],
      'game': ['unity', 'unreal', 'gamedev', 'gameplay', 'level design']
    };
    
    for (const skill1 of skills1) {
      for (const skill2 of skills2) {
        // Check if skills belong to same group
        for (const [group, keywords] of Object.entries(skillGroups)) {
          const skill1Lower = skill1.toLowerCase();
          const skill2Lower = skill2.toLowerCase();
          
          const skill1InGroup = keywords.some(kw => skill1Lower.includes(kw));
          const skill2InGroup = keywords.some(kw => skill2Lower.includes(kw));
          
          if (skill1InGroup && skill2InGroup && skill1Lower !== skill2Lower) {
            similar.push({ skill1, skill2, group });
          }
        }
      }
    }
    
    return similar;
  }
  
  /**
   * Calculate experience match
   */
  calculateExperienceMatch(exp1, exp2) {
    const levels = {
      'entry': 1,
      'junior': 2,
      'mid': 3,
      'senior': 4,
      'lead': 5,
      'executive': 6
    };
    
    const level1 = levels[exp1?.toLowerCase()] || 3;
    const level2 = levels[exp2?.toLowerCase()] || 3;
    
    const diff = Math.abs(level1 - level2);
    
    // Similar levels are good for peer networking
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.8;
    
    // Mentor/mentee relationships are valuable
    if (diff === 2 || diff === 3) return 0.7;
    
    // Large gaps can still be valuable for different perspectives
    return 0.5;
  }
  
  /**
   * Calculate company size relevance
   */
  calculateCompanySizeRelevance(size1, size2) {
    const sizes = {
      'startup': 1,
      'small': 2,
      'medium': 3,
      'large': 4,
      'enterprise': 5
    };
    
    const s1 = sizes[size1?.toLowerCase()] || 3;
    const s2 = sizes[size2?.toLowerCase()] || 3;
    
    const diff = Math.abs(s1 - s2);
    
    // Similar sizes face similar challenges
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    
    // Different sizes can learn from each other
    return 0.5;
  }
  
  /**
   * Calculate interest overlap
   */
  calculateInterestOverlap(interests1, interests2) {
    if (!interests1?.length || !interests2?.length) return 0;
    
    const overlap = interests1.filter(i1 => 
      interests2.some(i2 => i1.toLowerCase() === i2.toLowerCase())
    );
    
    const total = new Set([...interests1, ...interests2]).size;
    return overlap.length / total;
  }
  
  /**
   * Calculate style compatibility
   */
  calculateStyleCompatibility(style1, style2) {
    // Compatible communication styles
    const compatibility = {
      'formal': { 'formal': 1.0, 'casual': 0.6, 'mixed': 0.8 },
      'casual': { 'formal': 0.6, 'casual': 1.0, 'mixed': 0.8 },
      'mixed': { 'formal': 0.8, 'casual': 0.8, 'mixed': 1.0 }
    };
    
    return compatibility[style1]?.[style2] || 0.5;
  }
  
  /**
   * Calculate timezone compatibility
   */
  calculateTimezoneCompatibility(tz1, tz2) {
    // For simplicity, use UTC offset
    const getOffset = (tz) => {
      const offsets = {
        'PST': -8, 'MST': -7, 'CST': -6, 'EST': -5,
        'GMT': 0, 'CET': 1, 'EET': 2,
        'JST': 9, 'AEST': 10
      };
      return offsets[tz] || 0;
    };
    
    const offset1 = getOffset(tz1);
    const offset2 = getOffset(tz2);
    const diff = Math.abs(offset1 - offset2);
    
    // Same or close timezones are best for real-time communication
    if (diff === 0) return 1.0;
    if (diff <= 3) return 0.8;
    if (diff <= 6) return 0.6;
    if (diff <= 9) return 0.4;
    return 0.2;
  }
  
  /**
   * Calculate set overlap
   */
  calculateSetOverlap(set1, set2) {
    if (!set1?.length || !set2?.length) return 0;
    
    const overlap = set1.filter(item => set2.includes(item));
    const union = new Set([...set1, ...set2]);
    
    return overlap.length / union.size;
  }
  
  /**
   * Calculate booth proximity
   */
  calculateBoothProximity(booth1, booth2) {
    // Extract hall and number from booth (e.g., "H4-210")
    const parseBooth = (booth) => {
      const match = booth.match(/([A-Z]+)(\d+)-(\d+)/);
      if (!match) return null;
      return {
        hall: match[1],
        section: parseInt(match[2]),
        number: parseInt(match[3])
      };
    };
    
    const b1 = parseBooth(booth1);
    const b2 = parseBooth(booth2);
    
    if (!b1 || !b2) return 0;
    
    // Same hall
    if (b1.hall !== b2.hall) return 0.2;
    
    // Same section
    if (b1.section === b2.section) {
      const distance = Math.abs(b1.number - b2.number);
      if (distance <= 10) return 1.0;
      if (distance <= 50) return 0.8;
      if (distance <= 100) return 0.6;
      return 0.4;
    }
    
    // Different sections in same hall
    const sectionDiff = Math.abs(b1.section - b2.section);
    if (sectionDiff === 1) return 0.5;
    if (sectionDiff === 2) return 0.3;
    return 0.2;
  }
  
  /**
   * Calculate availability overlap
   */
  calculateAvailabilityOverlap(avail1, avail2) {
    if (!avail1?.length || !avail2?.length) return 0;
    
    let overlapHours = 0;
    let totalHours = 0;
    
    for (const slot1 of avail1) {
      for (const slot2 of avail2) {
        const overlap = this.getTimeSlotOverlap(slot1, slot2);
        overlapHours += overlap;
      }
      totalHours += slot1.duration || 1;
    }
    
    return totalHours > 0 ? Math.min(overlapHours / totalHours, 1.0) : 0;
  }
  
  /**
   * Get time slot overlap
   */
  getTimeSlotOverlap(slot1, slot2) {
    // Simple day and time overlap check
    if (slot1.day !== slot2.day) return 0;
    
    const start1 = slot1.startTime || 9;
    const end1 = slot1.endTime || 17;
    const start2 = slot2.startTime || 9;
    const end2 = slot2.endTime || 17;
    
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    
    if (overlapStart < overlapEnd) {
      return (overlapEnd - overlapStart) / 8; // Normalize to 8-hour day
    }
    
    return 0;
  }
  
  /**
   * Infer goals from profile
   */
  inferGoals(user) {
    const goals = [];
    
    // Based on persona
    if (user.persona === 'developer') {
      goals.push('find-collaborators', 'learn-tech', 'join-studio');
    } else if (user.persona === 'publisher') {
      goals.push('find-games', 'meet-developers', 'industry-trends');
    } else if (user.persona === 'investor') {
      goals.push('find-investments', 'meet-founders', 'market-insights');
    } else if (user.persona === 'service') {
      goals.push('find-clients', 'showcase-solutions', 'partnerships');
    }
    
    // Based on experience level
    if (user.experience === 'entry' || user.experience === 'junior') {
      goals.push('find-mentor', 'career-growth');
    } else if (user.experience === 'senior' || user.experience === 'lead') {
      goals.push('find-talent', 'share-knowledge');
    }
    
    return goals;
  }
  
  /**
   * Check goal compatibility
   */
  checkGoalCompatibility(goal1, goal2) {
    const compatibleGoals = {
      'find-collaborators': ['find-collaborators', 'join-studio', 'find-talent'],
      'learn-tech': ['share-knowledge', 'showcase-solutions'],
      'join-studio': ['find-talent', 'find-collaborators'],
      'find-games': ['meet-publishers', 'find-investments'],
      'meet-developers': ['find-publishers', 'showcase-solutions'],
      'industry-trends': ['market-insights', 'share-knowledge'],
      'find-investments': ['find-investors', 'meet-founders'],
      'meet-founders': ['find-investments', 'find-mentor'],
      'market-insights': ['industry-trends', 'share-knowledge'],
      'find-clients': ['showcase-solutions', 'find-service-providers'],
      'showcase-solutions': ['find-clients', 'meet-developers'],
      'partnerships': ['partnerships', 'find-collaborators'],
      'find-mentor': ['share-knowledge', 'career-guidance'],
      'career-growth': ['find-mentor', 'career-guidance'],
      'find-talent': ['join-studio', 'career-growth'],
      'share-knowledge': ['learn-tech', 'find-mentor']
    };
    
    const compatible = compatibleGoals[goal1] || [];
    return compatible.includes(goal2) ? 1.0 : 0;
  }
  
  /**
   * Get persona compatibility
   */
  getPersonaCompatibility(persona1, persona2) {
    const compatibility = {
      'developer': { 'developer': 0.7, 'publisher': 0.9, 'investor': 0.8, 'service': 0.7 },
      'publisher': { 'developer': 0.9, 'publisher': 0.6, 'investor': 0.8, 'service': 0.7 },
      'investor': { 'developer': 0.8, 'publisher': 0.8, 'investor': 0.5, 'service': 0.6 },
      'service': { 'developer': 0.7, 'publisher': 0.7, 'investor': 0.6, 'service': 0.5 }
    };
    
    return compatibility[persona1]?.[persona2] || 0.5;
  }
  
  /**
   * Calculate confidence in the match
   */
  calculateConfidence(user1, user2) {
    let dataPoints = 0;
    let totalPossible = 10;
    
    // Check how many data points we have
    if (user1.skills?.length) dataPoints++;
    if (user2.skills?.length) dataPoints++;
    if (user1.interests?.length) dataPoints++;
    if (user2.interests?.length) dataPoints++;
    if (user1.goals?.length) dataPoints++;
    if (user2.goals?.length) dataPoints++;
    if (user1.experience) dataPoints++;
    if (user2.experience) dataPoints++;
    if (user1.industry) dataPoints++;
    if (user2.industry) dataPoints++;
    
    return Math.round((dataPoints / totalPossible) * 100);
  }
  
  /**
   * Generate reasoning for the match
   */
  async generateReasoning(user1, user2, score) {
    const reasons = [];
    
    if (score > 0.8) {
      reasons.push('Excellent match based on multiple compatibility factors');
    } else if (score > 0.6) {
      reasons.push('Good potential for meaningful connection');
    } else if (score > 0.4) {
      reasons.push('Some common ground for networking');
    } else {
      reasons.push('Opportunity for diverse perspectives');
    }
    
    // Add specific reasons based on data
    if (user1.industry === user2.industry) {
      reasons.push(`Both work in ${user1.industry}`);
    }
    
    if (user1.goals?.some(g => user2.goals?.includes(g))) {
      reasons.push('Aligned professional goals');
    }
    
    if (user1.skills?.some(s => user2.skills?.includes(s))) {
      reasons.push('Shared technical expertise');
    }
    
    return reasons.join('. ');
  }
  
  /**
   * Get personalized weights for scoring
   */
  async getPersonalizedWeights(userId) {
    // Check if user has custom preferences
    const preferences = localStorage.getItem(`match_weights_${userId}`);
    
    if (preferences) {
      return JSON.parse(preferences);
    }
    
    // Return default weights
    return this.weights;
  }
  
  /**
   * Update personalized weights based on feedback
   */
  async updateWeights(userId, feedback) {
    const currentWeights = await this.getPersonalizedWeights(userId);
    
    // Adjust weights based on feedback
    if (feedback.liked) {
      // Increase weight of high-scoring dimensions
      if (feedback.breakdown.professional > 70) {
        currentWeights.professional = Math.min(currentWeights.professional * 1.1, 0.5);
      }
      if (feedback.breakdown.personal > 70) {
        currentWeights.personal = Math.min(currentWeights.personal * 1.1, 0.4);
      }
    } else {
      // Decrease weight of high-scoring dimensions if disliked
      if (feedback.breakdown.professional > 70) {
        currentWeights.professional = Math.max(currentWeights.professional * 0.9, 0.1);
      }
    }
    
    // Normalize weights
    const total = Object.values(currentWeights).reduce((a, b) => a + b, 0);
    for (const key in currentWeights) {
      currentWeights[key] = currentWeights[key] / total;
    }
    
    // Save updated weights
    localStorage.setItem(`match_weights_${userId}`, JSON.stringify(currentWeights));
    
    return currentWeights;
  }
  
  /**
   * Get cache key for user pair
   */
  getCacheKey(userId1, userId2) {
    // Sort IDs to ensure consistent key regardless of order
    const ids = [userId1, userId2].sort();
    return `match_${ids[0]}_${ids[1]}`;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}