/**
 * Profile Enrichment Service
 * Uses AI to generate professional profiles and match attendees
 */

import { companyIntelligence } from './company-intelligence.js';

export class ProfileEnrichmentService {
  constructor() {
    this.cache = new Map();
    
    // Professional personas for matching
    this.personas = {
      developer: {
        title: 'Game Developer',
        interests: ['Game Design', 'Programming', 'Unity', 'Unreal Engine'],
        goals: ['Learn new tech', 'Find collaborators', 'Join studios'],
        matchWith: ['publisher', 'investor', 'developer', 'service']
      },
      publisher: {
        title: 'Publisher',
        interests: ['Game Publishing', 'Marketing', 'Distribution', 'Monetization'],
        goals: ['Find games to publish', 'Meet developers', 'Industry trends'],
        matchWith: ['developer', 'service', 'investor']
      },
      investor: {
        title: 'Investor',
        interests: ['Funding', 'Startups', 'ROI', 'Market Analysis'],
        goals: ['Find investments', 'Meet founders', 'Industry insights'],
        matchWith: ['developer', 'publisher', 'service']
      },
      service: {
        title: 'Service Provider',
        interests: ['B2B Services', 'Tools', 'Middleware', 'Consulting'],
        goals: ['Find clients', 'Showcase solutions', 'Partnerships'],
        matchWith: ['developer', 'publisher', 'investor']
      }
    };
    
    // Industry expertise areas
    this.expertiseAreas = [
      'Mobile Gaming',
      'PC Gaming',
      'Console Gaming',
      'VR/AR',
      'Esports',
      'Game Engines',
      'Multiplayer',
      'Live Service',
      'Indie Games',
      'AAA Development',
      'Game Publishing',
      'Game Marketing',
      'Community Management',
      'Game Monetization',
      'Game Analytics'
    ];
  }
  
  /**
   * Enrich profile with AI-generated content
   */
  async enrichProfile(profile) {
    // Start with basic profile
    let enriched = { ...profile };
    
    // Add company intelligence
    if (profile.email) {
      enriched = await companyIntelligence.enrichProfile(enriched);
    }
    
    // Generate professional title if missing
    if (!enriched.title && enriched.persona) {
      enriched.title = this.generateTitle(enriched);
    }
    
    // Generate bio if missing
    if (!enriched.bio) {
      enriched.bio = this.generateBio(enriched);
    }
    
    // Generate interests based on persona
    if (!enriched.interests || enriched.interests.length === 0) {
      enriched.interests = this.generateInterests(enriched);
    }
    
    // Generate networking goals
    if (!enriched.goals) {
      enriched.goals = this.generateGoals(enriched);
    }
    
    // Generate expertise tags
    if (!enriched.expertise) {
      enriched.expertise = this.generateExpertise(enriched);
    }
    
    // Calculate profile completeness
    enriched.completeness = this.calculateCompleteness(enriched);
    
    // Generate match preferences
    enriched.matchPreferences = this.generateMatchPreferences(enriched);
    
    // Add enrichment metadata
    enriched.enrichedAt = new Date().toISOString();
    enriched.enrichmentVersion = '1.0.0';
    
    // Cache the enriched profile
    this.cache.set(profile.id || profile.email, enriched);
    
    return enriched;
  }
  
  /**
   * Generate professional title
   */
  generateTitle(profile) {
    const persona = this.personas[profile.persona];
    
    if (!persona) {
      return 'Gaming Professional';
    }
    
    // Customize based on company and experience
    if (profile.company) {
      if (profile.companySize === '10000+') {
        return `Senior ${persona.title} at ${profile.company}`;
      } else if (profile.companySize === '1000+') {
        return `${persona.title} at ${profile.company}`;
      } else {
        return `${persona.title} at ${profile.company}`;
      }
    }
    
    // Indie or freelance
    if (profile.persona === 'developer') {
      return 'Indie Game Developer';
    } else if (profile.persona === 'service') {
      return 'Freelance Game Industry Professional';
    }
    
    return persona.title;
  }
  
  /**
   * Generate professional bio
   */
  generateBio(profile) {
    const templates = {
      developer: [
        `Passionate game developer with expertise in ${this.getRandomExpertise()}. Looking to connect with publishers and fellow developers at Gamescom.`,
        `Creating innovative gaming experiences. Interested in ${this.getRandomExpertise()} and ${this.getRandomExpertise()}.`,
        `Game developer focused on ${this.getRandomExpertise()}. Open to collaboration and new opportunities.`
      ],
      publisher: [
        `Publishing professional seeking innovative games and talented developers. Specializing in ${this.getRandomExpertise()}.`,
        `Helping games reach their audience through strategic publishing and marketing. Interested in ${this.getRandomExpertise()}.`,
        `Game publisher with experience in ${this.getRandomExpertise()} and ${this.getRandomExpertise()}.`
      ],
      investor: [
        `Investing in the future of gaming. Looking for innovative studios and breakthrough technologies.`,
        `Venture investor focused on gaming and interactive entertainment. Interested in ${this.getRandomExpertise()}.`,
        `Supporting game developers and studios with funding and strategic guidance.`
      ],
      service: [
        `Providing specialized services to the game industry. Expertise in ${this.getRandomExpertise()}.`,
        `Helping game studios succeed with professional services and tools.`,
        `B2B solutions for game developers and publishers. Specializing in ${this.getRandomExpertise()}.`
      ]
    };
    
    const personaTemplates = templates[profile.persona] || [
      'Gaming industry professional attending Gamescom 2025.'
    ];
    
    // Select random template
    const template = personaTemplates[Math.floor(Math.random() * personaTemplates.length)];
    
    // Customize with company info if available
    if (profile.company) {
      return `${template} Currently at ${profile.company}.`;
    }
    
    return template;
  }
  
  /**
   * Generate interests based on persona
   */
  generateInterests(profile) {
    const persona = this.personas[profile.persona];
    
    if (!persona) {
      return ['Gaming', 'Technology', 'Networking'];
    }
    
    // Start with persona interests
    let interests = [...persona.interests];
    
    // Add random expertise areas
    const additionalInterests = this.expertiseAreas
      .filter(area => !interests.includes(area))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    interests.push(...additionalInterests);
    
    // Add industry-specific interests
    if (profile.industry === 'Gaming') {
      interests.push('Game Development');
    } else if (profile.industry === 'Technology') {
      interests.push('Tech Innovation');
    }
    
    // Limit to 6 interests
    return interests.slice(0, 6);
  }
  
  /**
   * Generate networking goals
   */
  generateGoals(profile) {
    const persona = this.personas[profile.persona];
    
    if (!persona) {
      return ['Meet industry professionals', 'Learn about trends', 'Find opportunities'];
    }
    
    return persona.goals;
  }
  
  /**
   * Generate expertise tags
   */
  generateExpertise(profile) {
    const expertise = [];
    
    // Add based on persona
    if (profile.persona === 'developer') {
      expertise.push('Game Development');
      expertise.push(Math.random() > 0.5 ? 'Unity' : 'Unreal Engine');
    } else if (profile.persona === 'publisher') {
      expertise.push('Publishing');
      expertise.push('Marketing');
    } else if (profile.persona === 'investor') {
      expertise.push('Funding');
      expertise.push('Business Development');
    } else if (profile.persona === 'service') {
      expertise.push('B2B Services');
    }
    
    // Add random expertise
    const additional = this.expertiseAreas
      .filter(area => !expertise.includes(area))
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    expertise.push(...additional);
    
    return expertise;
  }
  
  /**
   * Get random expertise area
   */
  getRandomExpertise() {
    return this.expertiseAreas[Math.floor(Math.random() * this.expertiseAreas.length)];
  }
  
  /**
   * Calculate profile completeness
   */
  calculateCompleteness(profile) {
    const fields = [
      'name',
      'email',
      'title',
      'company',
      'bio',
      'interests',
      'goals',
      'expertise',
      'photo',
      'linkedin'
    ];
    
    let completed = 0;
    
    for (const field of fields) {
      if (profile[field]) {
        if (Array.isArray(profile[field])) {
          if (profile[field].length > 0) completed++;
        } else {
          completed++;
        }
      }
    }
    
    return Math.round((completed / fields.length) * 100);
  }
  
  /**
   * Generate match preferences
   */
  generateMatchPreferences(profile) {
    const persona = this.personas[profile.persona];
    
    if (!persona) {
      return {
        personas: ['developer', 'publisher', 'investor', 'service'],
        industries: ['Gaming', 'Technology'],
        companySize: 'any'
      };
    }
    
    return {
      personas: persona.matchWith,
      industries: ['Gaming', 'Game Development', 'Technology'],
      companySize: 'any',
      interests: profile.interests || []
    };
  }
  
  /**
   * Calculate match score between two profiles
   */
  async calculateMatchScore(profile1, profile2) {
    let score = 0;
    
    // Persona compatibility (40%)
    if (profile1.matchPreferences?.personas?.includes(profile2.persona)) {
      score += 0.4;
    }
    
    // Interest overlap (30%)
    const sharedInterests = profile1.interests?.filter(interest =>
      profile2.interests?.includes(interest)
    ) || [];
    
    const interestScore = sharedInterests.length / Math.max(
      profile1.interests?.length || 1,
      profile2.interests?.length || 1
    );
    
    score += interestScore * 0.3;
    
    // Company compatibility (20%)
    if (profile1.company && profile2.company) {
      const companyScore = companyIntelligence.calculateMatchScore(
        { domain: profile1.companyDomain, industry: profile1.industry, tags: profile1.companyTags },
        { domain: profile2.companyDomain, industry: profile2.industry, tags: profile2.companyTags }
      );
      score += companyScore * 0.2;
    }
    
    // Expertise match (10%)
    const sharedExpertise = profile1.expertise?.filter(exp =>
      profile2.expertise?.includes(exp)
    ) || [];
    
    if (sharedExpertise.length > 0) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Find best matches for a profile
   */
  async findMatches(profile, candidates, limit = 10) {
    const matches = [];
    
    for (const candidate of candidates) {
      // Skip self
      if (candidate.id === profile.id || candidate.email === profile.email) {
        continue;
      }
      
      const score = await this.calculateMatchScore(profile, candidate);
      
      if (score > 0.3) {
        matches.push({
          profile: candidate,
          score,
          reasons: this.getMatchReasons(profile, candidate)
        });
      }
    }
    
    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Get match reasons
   */
  getMatchReasons(profile1, profile2) {
    const reasons = [];
    
    // Persona match
    if (profile1.matchPreferences?.personas?.includes(profile2.persona)) {
      reasons.push(`Looking for ${this.personas[profile2.persona]?.title || profile2.persona}`);
    }
    
    // Shared interests
    const sharedInterests = profile1.interests?.filter(interest =>
      profile2.interests?.includes(interest)
    ) || [];
    
    if (sharedInterests.length > 0) {
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    }
    
    // Company synergy
    if (profile1.industry && profile2.industry) {
      if (profile1.industry === profile2.industry) {
        reasons.push(`Both in ${profile1.industry}`);
      } else {
        reasons.push('Cross-industry opportunity');
      }
    }
    
    // Expertise match
    const sharedExpertise = profile1.expertise?.filter(exp =>
      profile2.expertise?.includes(exp)
    ) || [];
    
    if (sharedExpertise.length > 0) {
      reasons.push(`Expertise match: ${sharedExpertise[0]}`);
    }
    
    return reasons;
  }
  
  /**
   * Generate conversation starters
   */
  generateConversationStarters(profile1, profile2) {
    const starters = [];
    
    // Based on shared interests
    const sharedInterests = profile1.interests?.filter(interest =>
      profile2.interests?.includes(interest)
    ) || [];
    
    if (sharedInterests.length > 0) {
      starters.push(`I see you're also interested in ${sharedInterests[0]}. What's your experience with it?`);
    }
    
    // Based on company
    if (profile2.company) {
      starters.push(`I'd love to hear about your work at ${profile2.company}.`);
    }
    
    // Based on expertise
    if (profile2.expertise?.length > 0) {
      starters.push(`Your expertise in ${profile2.expertise[0]} is really interesting. How did you get into that?`);
    }
    
    // Based on goals
    if (profile1.persona === 'developer' && profile2.persona === 'publisher') {
      starters.push(`I'm working on a game that might interest you. Could I tell you about it?`);
    } else if (profile1.persona === 'investor' && profile2.persona === 'developer') {
      starters.push(`I'm interested in learning about your current projects and future plans.`);
    }
    
    // Generic starters
    starters.push(`What brings you to Gamescom this year?`);
    starters.push(`What sessions or booths are you most excited about?`);
    
    return starters.slice(0, 3);
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[ProfileEnrichment] Cache cleared');
  }
}

// Create singleton instance
export const profileEnrichment = new ProfileEnrichmentService();