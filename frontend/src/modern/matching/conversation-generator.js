/**
 * Conversation Generator
 * AI-powered conversation starters for networking
 */

export class ConversationGenerator {
  constructor() {
    this.cache = new Map();
    this.templates = this.loadTemplates();
  }
  
  /**
   * Generate conversation starters using AI or fallbacks
   */
  async generateConversationStarters(user1, user2, compatibilityScore) {
    // Check cache first
    const cacheKey = `${user1.id}_${user2.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    let starters;
    
    try {
      // Try AI generation first
      starters = await this.generateWithAI(user1, user2, compatibilityScore);
    } catch (error) {
      console.warn('AI generation failed, using fallback:', error);
      // Fall back to template-based generation
      starters = this.generateFromTemplates(user1, user2, compatibilityScore);
    }
    
    // Ensure we have at least 3 starters
    while (starters.length < 3) {
      starters.push(this.getGenericStarter(user1, user2));
    }
    
    // Cache the result
    this.cache.set(cacheKey, starters);
    
    return starters;
  }
  
  /**
   * Generate starters using AI (mock implementation)
   */
  async generateWithAI(user1, user2, compatibilityScore) {
    // In production, this would call OpenAI or another LLM
    // For now, we'll simulate AI generation with sophisticated templates
    
    const starters = [];
    
    // Analyze compatibility breakdown to focus on strengths
    const { breakdown } = compatibilityScore;
    const strongestDimension = Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    switch (strongestDimension) {
      case 'professional':
        starters.push(this.generateProfessionalStarter(user1, user2));
        break;
      case 'personal':
        starters.push(this.generatePersonalStarter(user1, user2));
        break;
      case 'contextual':
        starters.push(this.generateContextualStarter(user1, user2));
        break;
      case 'intent':
        starters.push(this.generateIntentStarter(user1, user2));
        break;
    }
    
    // Add a shared interest starter if possible
    if (user1.interests && user2.interests) {
      const sharedInterest = this.findSharedInterest(user1.interests, user2.interests);
      if (sharedInterest) {
        starters.push(this.generateInterestStarter(sharedInterest, user1, user2));
      }
    }
    
    // Add a complementary skills starter
    if (user1.skills && user2.skills) {
      const complementarySkill = this.findComplementarySkill(user1.skills, user2.skills);
      if (complementarySkill) {
        starters.push(this.generateSkillStarter(complementarySkill, user1, user2));
      }
    }
    
    return starters;
  }
  
  /**
   * Generate professional conversation starter
   */
  generateProfessionalStarter(user1, user2) {
    const templates = [
      {
        template: `Hi ${user2.name}, I noticed you're a ${user2.title} at ${user2.company}. I'm particularly interested in your experience with ${this.inferExpertise(user2)}. Would you mind sharing how you approach that in your work?`,
        reasoning: "Shows genuine professional interest and invites knowledge sharing"
      },
      {
        template: `Hey ${user2.name}, I see we're both in ${user2.industry || 'the gaming industry'}. I'm curious about the biggest challenges ${user2.company} is tackling right now. What's keeping your team busy these days?`,
        reasoning: "Opens discussion about current work and industry challenges"
      },
      {
        template: `Hi ${user2.name}, your background in ${user2.title?.split(' ')[0] || 'your field'} caught my attention. At ${user1.company}, we're exploring similar areas. I'd love to hear your perspective on where the industry is heading.`,
        reasoning: "Establishes common ground and seeks expert opinion"
      }
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Generate personal interest starter
   */
  generatePersonalStarter(user1, user2) {
    const interest = this.findSharedInterest(user1.interests, user2.interests) || 
                    user2.interests?.[0] || 'the conference';
    
    return {
      starter: `Hi ${user2.name}, I noticed we both have an interest in ${interest}. What drew you to that area? I'd love to hear your perspective.`,
      reasoning: "Connects on personal interests to build rapport"
    };
  }
  
  /**
   * Generate contextual starter (conference-specific)
   */
  generateContextualStarter(user1, user2) {
    const starters = [
      {
        template: `Hi ${user2.name}, are you attending any interesting sessions today? I'm trying to decide between a few and would love your recommendations.`,
        reasoning: "Natural conference conversation that can lead to shared experiences"
      },
      {
        template: `Hey ${user2.name}, have you had a chance to check out the ${this.getRandomBoothArea()} area yet? I heard there are some impressive demos there.`,
        reasoning: "Encourages exploration together and shared discovery"
      },
      {
        template: `Hi ${user2.name}, how are you finding Gamescom so far? Any standout moments or connections?`,
        reasoning: "Open-ended question about conference experience"
      }
    ];
    
    const starter = starters[Math.floor(Math.random() * starters.length)];
    return {
      starter: starter.template,
      reasoning: starter.reasoning
    };
  }
  
  /**
   * Generate intent-based starter
   */
  generateIntentStarter(user1, user2) {
    // Match goals to create targeted starters
    if (user1.goals?.includes('find-collaborators') && user2.goals?.includes('find-collaborators')) {
      return {
        starter: `Hi ${user2.name}, I'm looking to connect with fellow ${user2.title || 'professionals'} who might be interested in collaboration. What kind of projects are you working on?`,
        reasoning: "Direct approach aligned with mutual collaboration goals"
      };
    }
    
    if (user1.goals?.includes('learn-tech') && user2.experience?.includes('senior')) {
      return {
        starter: `Hi ${user2.name}, with your experience in ${user2.industry || 'the industry'}, I'd really value your insights on emerging technologies. What trends are you most excited about?`,
        reasoning: "Seeks mentorship and knowledge from experienced professional"
      };
    }
    
    // Default intent-based starter
    return {
      starter: `Hi ${user2.name}, I'm here to ${this.formatGoal(user1.goals?.[0])}. What brings you to Gamescom this year?`,
      reasoning: "Shares personal intent and invites reciprocal sharing"
    };
  }
  
  /**
   * Generate interest-based starter
   */
  generateInterestStarter(interest, user1, user2) {
    return {
      starter: `Hi ${user2.name}, I see we're both interested in ${interest}. Have you seen any great ${interest}-related demos or talks here? I'm always looking for new perspectives.`,
      reasoning: `Shared interest in ${interest} provides natural conversation topic`
    };
  }
  
  /**
   * Generate skill-based starter
   */
  generateSkillStarter(skill, user1, user2) {
    return {
      starter: `Hi ${user2.name}, I noticed your expertise in ${skill}. We're using similar tech at ${user1.company}. I'd love to compare notes on best practices if you have a moment.`,
      reasoning: `Technical discussion around ${skill} can lead to valuable knowledge exchange`
    };
  }
  
  /**
   * Generate starters from templates
   */
  generateFromTemplates(user1, user2, compatibilityScore) {
    const starters = [];
    
    // High compatibility starter
    if (compatibilityScore.overall > 70) {
      starters.push({
        starter: `Hi ${user2.name}, based on our profiles, it looks like we have a lot in common professionally. I'd love to hear about your journey in ${user2.industry || 'the industry'}.`,
        reasoning: "Acknowledges high compatibility and opens personal discussion"
      });
    }
    
    // Company-based starter
    if (user2.company) {
      starters.push({
        starter: `Hi ${user2.name}, I've been following ${user2.company}'s work. Your recent projects look fascinating. What's it like working there?`,
        reasoning: "Shows knowledge of their company and genuine interest"
      });
    }
    
    // Experience-based starter
    if (user2.title) {
      starters.push({
        starter: `Hi ${user2.name}, your role as ${user2.title} sounds interesting. What does a typical day look like for you?`,
        reasoning: "Invites them to share their professional experience"
      });
    }
    
    return starters;
  }
  
  /**
   * Get generic starter as fallback
   */
  getGenericStarter(user1, user2) {
    const genericStarters = [
      {
        starter: `Hi ${user2.name}, I'm ${user1.name} from ${user1.company || 'the conference'}. How's your Gamescom experience been so far?`,
        reasoning: "Friendly, open-ended introduction"
      },
      {
        starter: `Hey ${user2.name}, great to connect! What brings you to Gamescom this year?`,
        reasoning: "Simple, welcoming opener that invites sharing"
      },
      {
        starter: `Hi ${user2.name}, I'm trying to meet interesting people in ${user2.industry || 'the industry'}. Would love to hear what you're working on.`,
        reasoning: "Direct and professional approach"
      }
    ];
    
    return genericStarters[Math.floor(Math.random() * genericStarters.length)];
  }
  
  /**
   * Find shared interests
   */
  findSharedInterest(interests1, interests2) {
    if (!interests1 || !interests2) return null;
    
    for (const interest1 of interests1) {
      if (interests2.some(i => i.toLowerCase() === interest1.toLowerCase())) {
        return interest1;
      }
    }
    
    return null;
  }
  
  /**
   * Find complementary skills
   */
  findComplementarySkill(skills1, skills2) {
    if (!skills1 || !skills2) return null;
    
    // Look for skills that work well together
    const complementaryPairs = {
      'Frontend': ['Backend', 'UI/UX', 'Design'],
      'Backend': ['Frontend', 'DevOps', 'Database'],
      'Game Design': ['Programming', 'Art', 'Level Design'],
      'Marketing': ['Development', 'Design', 'Analytics'],
      'Business': ['Technical', 'Creative', 'Operations']
    };
    
    for (const skill1 of skills1) {
      const complements = complementaryPairs[skill1] || [];
      for (const skill2 of skills2) {
        if (complements.some(c => skill2.includes(c))) {
          return skill2;
        }
      }
    }
    
    // Return any skill from user2 as fallback
    return skills2[0];
  }
  
  /**
   * Infer expertise from profile
   */
  inferExpertise(user) {
    if (user.skills?.length) {
      return user.skills[0];
    }
    if (user.title) {
      // Extract key words from title
      const keywords = user.title.split(' ').filter(w => 
        !['the', 'a', 'an', 'at', 'in', 'of'].includes(w.toLowerCase())
      );
      return keywords[keywords.length - 1];
    }
    return user.industry || 'your field';
  }
  
  /**
   * Format goal for display
   */
  formatGoal(goal) {
    const goalTexts = {
      'find-collaborators': 'find collaborators',
      'learn-tech': 'learn about new technologies',
      'join-studio': 'explore studio opportunities',
      'find-games': 'discover new games',
      'meet-developers': 'meet talented developers',
      'industry-trends': 'learn about industry trends',
      'find-investments': 'find investment opportunities',
      'meet-founders': 'meet founders',
      'find-clients': 'connect with potential clients',
      'showcase-solutions': 'showcase our solutions',
      'partnerships': 'explore partnerships',
      'find-mentor': 'find mentorship',
      'career-growth': 'grow my career',
      'find-talent': 'find talented people',
      'share-knowledge': 'share knowledge'
    };
    
    return goalTexts[goal] || 'make meaningful connections';
  }
  
  /**
   * Get random booth area for conversation
   */
  getRandomBoothArea() {
    const areas = [
      'indie games', 'VR experiences', 'mobile gaming',
      'esports', 'game engines', 'publisher showcase',
      'retro gaming', 'board game crossover'
    ];
    
    return areas[Math.floor(Math.random() * areas.length)];
  }
  
  /**
   * Load conversation templates
   */
  loadTemplates() {
    return {
      professional: [
        "I noticed you work in [INDUSTRY]. What's the most exciting project you're working on?",
        "Your experience with [SKILL] is impressive. How do you see it evolving?",
        "I'd love to hear your thoughts on [TREND] in our industry."
      ],
      personal: [
        "I see we both enjoy [INTEREST]. What got you started with that?",
        "Have you had a chance to explore [VENUE] yet? Any recommendations?",
        "What's been the highlight of the conference for you so far?"
      ],
      collaborative: [
        "Your work in [AREA] aligns well with what we're doing. Perhaps we could explore synergies?",
        "I think our skills in [SKILL1] and [SKILL2] could complement each other well.",
        "Have you considered collaborations in [DOMAIN]? I'd love to discuss possibilities."
      ]
    };
  }
  
  /**
   * Personalize starter based on context
   */
  personalizeStarter(starter, context) {
    let personalized = starter;
    
    // Replace placeholders with actual values
    if (context.industry) {
      personalized = personalized.replace('[INDUSTRY]', context.industry);
    }
    if (context.skill) {
      personalized = personalized.replace('[SKILL]', context.skill);
    }
    if (context.interest) {
      personalized = personalized.replace('[INTEREST]', context.interest);
    }
    
    return personalized;
  }
  
  /**
   * Get conversation tips based on compatibility
   */
  getConversationTips(compatibilityScore) {
    const tips = [];
    
    if (compatibilityScore.breakdown.professional > 70) {
      tips.push("Focus on professional topics - you have strong career alignment");
    }
    
    if (compatibilityScore.breakdown.personal > 70) {
      tips.push("Don't hesitate to discuss personal interests - you have common ground");
    }
    
    if (compatibilityScore.breakdown.intent > 70) {
      tips.push("Be direct about your goals - they align well");
    }
    
    if (compatibilityScore.overall < 50) {
      tips.push("Embrace the diversity - different perspectives can be valuable");
    }
    
    // Add general tips
    tips.push("Listen actively and ask follow-up questions");
    tips.push("Share your own experiences to build rapport");
    
    return tips;
  }
  
  /**
   * Track conversation starter usage
   */
  trackUsage(userId1, userId2, starter, wasSuccessful) {
    const key = `usage_${userId1}_${userId2}`;
    const usage = JSON.parse(localStorage.getItem(key) || '{}');
    
    usage[starter] = {
      used: true,
      successful: wasSuccessful,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(key, JSON.stringify(usage));
    
    // Learn from feedback for future generation
    if (wasSuccessful) {
      this.updateSuccessfulPatterns(starter);
    }
  }
  
  /**
   * Update successful conversation patterns
   */
  updateSuccessfulPatterns(starter) {
    const patterns = JSON.parse(
      localStorage.getItem('successful_patterns') || '[]'
    );
    
    patterns.push({
      starter,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 patterns
    if (patterns.length > 100) {
      patterns.shift();
    }
    
    localStorage.setItem('successful_patterns', JSON.stringify(patterns));
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const conversationGenerator = new ConversationGenerator();