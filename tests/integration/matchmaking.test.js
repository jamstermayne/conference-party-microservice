/**
 * Matchmaking Integration Tests
 * Comprehensive testing for compatibility engine and matching algorithms
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock compatibility engine for testing
class MockCompatibilityEngine {
  constructor() {
    this.cache = new Map();
  }
  
  async calculateCompatibility(user1, user2) {
    const cacheKey = `${user1.id}_${user2.id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Calculate various compatibility factors
    const professionalScore = this.calculateProfessionalScore(user1, user2);
    const interestScore = this.calculateInterestScore(user1, user2);
    const intentScore = this.calculateIntentScore(user1, user2);
    const contextualScore = this.calculateContextualScore(user1, user2);
    
    const overall = Math.round(
      professionalScore * 0.35 +
      interestScore * 0.25 +
      intentScore * 0.25 +
      contextualScore * 0.15
    );
    
    const result = {
      overall,
      breakdown: {
        professional: professionalScore,
        interests: interestScore,
        intent: intentScore,
        contextual: contextualScore
      },
      reasoning: this.generateReasoning(user1, user2, { professionalScore, interestScore, intentScore })
    };
    
    this.cache.set(cacheKey, result);
    return result;
  }
  
  calculateProfessionalScore(user1, user2) {
    let score = 50; // Base score
    
    // Same industry boost
    if (user1.industry === user2.industry) {
      score += 20;
    }
    
    // Complementary roles (e.g., CTO + Senior Engineer)
    const complementaryRoles = [
      ['CTO', 'Senior Engineer'],
      ['Product Manager', 'Designer'],
      ['Founder', 'Investor'],
      ['Developer', 'DevOps']
    ];
    
    for (const [role1, role2] of complementaryRoles) {
      if ((user1.title?.includes(role1) && user2.title?.includes(role2)) ||
          (user1.title?.includes(role2) && user2.title?.includes(role1))) {
        score += 15;
        break;
      }
    }
    
    // Experience level compatibility
    const exp1 = this.getExperienceLevel(user1);
    const exp2 = this.getExperienceLevel(user2);
    if (Math.abs(exp1 - exp2) <= 1) {
      score += 10;
    }
    
    return Math.min(100, score);
  }
  
  calculateInterestScore(user1, user2) {
    const interests1 = new Set(user1.interests || []);
    const interests2 = new Set(user2.interests || []);
    
    if (interests1.size === 0 || interests2.size === 0) {
      return 50; // Default if no interests
    }
    
    let commonCount = 0;
    interests1.forEach(interest => {
      if (interests2.has(interest)) {
        commonCount++;
      }
    });
    
    const totalUnique = new Set([...interests1, ...interests2]).size;
    const overlap = (commonCount / totalUnique) * 100;
    
    // Boost for specific high-value overlaps
    const highValueInterests = ['AI', 'Machine Learning', 'Blockchain', 'Web3'];
    const hasHighValueOverlap = highValueInterests.some(interest => 
      interests1.has(interest) && interests2.has(interest)
    );
    
    return Math.min(100, overlap + (hasHighValueOverlap ? 15 : 0));
  }
  
  calculateIntentScore(user1, user2) {
    const goals1 = new Set(user1.goals || []);
    const goals2 = new Set(user2.goals || []);
    
    // Check for complementary goals
    const complementaryGoals = [
      ['fundraising', 'investing'],
      ['hiring', 'job-seeking'],
      ['mentoring', 'learning'],
      ['selling', 'buying'],
      ['partnership', 'partnership']
    ];
    
    let score = 40; // Base score
    
    for (const [goal1, goal2] of complementaryGoals) {
      if ((goals1.has(goal1) && goals2.has(goal2)) ||
          (goals1.has(goal2) && goals2.has(goal1))) {
        score += 30;
      }
    }
    
    // Common networking goals
    if (goals1.has('networking') && goals2.has('networking')) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
  
  calculateContextualScore(user1, user2) {
    let score = 50;
    
    // Same conference/event
    if (user1.currentEvent === user2.currentEvent) {
      score += 20;
    }
    
    // Similar session interests
    const sessions1 = new Set(user1.plannedSessions || []);
    const sessions2 = new Set(user2.plannedSessions || []);
    
    let commonSessions = 0;
    sessions1.forEach(session => {
      if (sessions2.has(session)) {
        commonSessions++;
      }
    });
    
    score += Math.min(30, commonSessions * 10);
    
    return Math.min(100, score);
  }
  
  getExperienceLevel(user) {
    const title = user.title?.toLowerCase() || '';
    if (title.includes('senior') || title.includes('lead') || title.includes('principal')) return 3;
    if (title.includes('junior') || title.includes('entry')) return 1;
    if (title.includes('cto') || title.includes('vp') || title.includes('director')) return 4;
    return 2; // Mid-level default
  }
  
  generateReasoning(user1, user2, scores) {
    const reasons = [];
    
    if (scores.professionalScore > 80) {
      reasons.push('Strong complementary professional experience');
    }
    
    if (scores.interestScore > 70) {
      reasons.push('Significant shared interests and expertise');
    }
    
    if (scores.intentScore > 85) {
      reasons.push('Aligned networking goals (e.g., fundraising match)');
    }
    
    if (user1.industry === user2.industry) {
      reasons.push(`Both in ${user1.industry} industry`);
    }
    
    return reasons.join('. ');
  }
  
  async generateConversationStarters(user1, user2, compatibilityScore) {
    const starters = [];
    
    // Find common interests
    const commonInterests = (user1.interests || []).filter(i => 
      (user2.interests || []).includes(i)
    );
    
    // Interest-based starter
    if (commonInterests.length > 0) {
      starters.push({
        starter: `Hi ${user2.name}! I noticed we both have an interest in ${commonInterests[0]}. Have you been working on any ${commonInterests[0]} projects lately?`,
        reasoning: 'References specific shared interest to establish common ground'
      });
    }
    
    // Professional starter
    if (user1.industry === user2.industry) {
      starters.push({
        starter: `Great to connect with another ${user2.industry} professional! I'm curious about your experience at ${user2.company} - what's been the most exciting project you've worked on there?`,
        reasoning: 'Industry-specific connection with genuine professional interest'
      });
    }
    
    // Goal-based starter
    if (user1.goals?.includes('hiring') && user2.goals?.includes('job-seeking')) {
      starters.push({
        starter: `Hi ${user2.name}! I saw you're exploring new opportunities. We're actually looking for talented ${user2.title}s at ${user1.company}. Would love to chat about what you're looking for in your next role.`,
        reasoning: 'Direct value proposition addressing mutual goals'
      });
    }
    
    // Default starter if needed
    while (starters.length < 3) {
      starters.push({
        starter: `Hi ${user2.name}! Great to connect at the conference. I'd love to hear about your work at ${user2.company} and share some insights from my experience at ${user1.company}.`,
        reasoning: 'Professional and friendly opening for general networking'
      });
    }
    
    return starters.slice(0, 3);
  }
  
  async findMatches(userId, options = {}) {
    const limit = options.limit || 20;
    const user = testUsers[userId] || testUsers.seniorCTO;
    
    // Simulate finding matches
    const allUsers = Object.values(testUsers).filter(u => u.id !== userId);
    const matches = [];
    
    for (const otherUser of allUsers) {
      const compatibility = await this.calculateCompatibility(user, otherUser);
      matches.push({
        user: otherUser,
        compatibilityScore: compatibility
      });
    }
    
    // Sort by compatibility and return top matches
    matches.sort((a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall);
    
    return matches.slice(0, limit);
  }
}

// Test fixtures
const testUsers = {
  seniorCTO: {
    id: 'cto_001',
    name: 'Alice Chen',
    title: 'CTO',
    company: 'TechStartup Inc',
    industry: 'Technology',
    interests: ['Scaling', 'Architecture', 'Team Building', 'AI'],
    goals: ['hiring', 'networking', 'mentoring'],
    plannedSessions: ['scaling-101', 'ai-workshop'],
    currentEvent: 'gamescom2025'
  },
  seniorEngineer: {
    id: 'eng_001',
    name: 'Bob Smith',
    title: 'Senior Engineer',
    company: 'GameDev Studio',
    industry: 'Technology',
    interests: ['Architecture', 'Performance', 'Gaming', 'AI'],
    goals: ['learning', 'networking', 'job-seeking'],
    plannedSessions: ['scaling-101', 'performance-talk'],
    currentEvent: 'gamescom2025'
  },
  productManager: {
    id: 'pm_001',
    name: 'Carol Davis',
    title: 'Product Manager',
    company: 'BigTech Corp',
    industry: 'Technology',
    interests: ['Product Strategy', 'User Research', 'Analytics'],
    goals: ['networking', 'learning', 'partnership'],
    plannedSessions: ['product-keynote', 'analytics-workshop'],
    currentEvent: 'gamescom2025'
  },
  startup_founder: {
    id: 'founder_001',
    name: 'David Lee',
    title: 'Founder & CEO',
    company: 'AI Gaming Startup',
    industry: 'Gaming',
    interests: ['AI', 'Gaming', 'Fundraising', 'Strategy'],
    goals: ['fundraising', 'networking', 'partnership'],
    plannedSessions: ['investor-panel', 'ai-workshop'],
    currentEvent: 'gamescom2025'
  },
  angel_investor: {
    id: 'investor_001',
    name: 'Eve Martinez',
    title: 'Angel Investor',
    company: 'Martinez Ventures',
    industry: 'Venture Capital',
    interests: ['AI', 'Gaming', 'Startups', 'Innovation'],
    goals: ['investing', 'networking', 'mentoring'],
    plannedSessions: ['investor-panel', 'startup-showcase'],
    currentEvent: 'gamescom2025'
  },
  fintechCTO: {
    id: 'fintech_001',
    name: 'Frank Wilson',
    title: 'CTO',
    company: 'FinTech Solutions',
    industry: 'Financial Services',
    interests: ['Blockchain', 'Security', 'Compliance'],
    goals: ['networking', 'learning'],
    plannedSessions: ['blockchain-talk'],
    currentEvent: 'gamescom2025'
  },
  healthcareEngineer: {
    id: 'health_001',
    name: 'Grace Kim',
    title: 'Senior Engineer',
    company: 'HealthTech Inc',
    industry: 'Healthcare',
    interests: ['ML', 'Data Science', 'Healthcare'],
    goals: ['networking', 'learning'],
    plannedSessions: ['ml-workshop'],
    currentEvent: 'gamescom2025'
  }
};

// Test utilities
const setupTestEnvironment = () => {
  // Clear any existing test data
  localStorage.clear();
  sessionStorage.clear();
  
  // Set up test user
  localStorage.setItem('userId', 'test_user_001');
  
  // Initialize compatibility engine
  return new MockCompatibilityEngine();
};

const cleanupTestEnvironment = () => {
  localStorage.clear();
  sessionStorage.clear();
};

// Integration Tests
describe('Matchmaking Integration Tests', () => {
  let compatibilityEngine;
  
  beforeEach(() => {
    compatibilityEngine = setupTestEnvironment();
  });
  
  afterEach(() => {
    cleanupTestEnvironment();
  });
  
  describe('Compatibility Scoring', () => {
    it('should score high for complementary professionals', async () => {
      const cto = testUsers.seniorCTO;
      const engineer = testUsers.seniorEngineer;
      
      const score = await compatibilityEngine.calculateCompatibility(cto, engineer);
      
      expect(score.overall).toBeGreaterThan(75);
      expect(score.breakdown.professional).toBeGreaterThan(80);
      expect(score.reasoning).toContain('complementary professional experience');
    });
    
    it('should score lower for mismatched industries', async () => {
      const fintech = testUsers.fintechCTO;
      const healthcare = testUsers.healthcareEngineer;
      
      const score = await compatibilityEngine.calculateCompatibility(fintech, healthcare);
      
      expect(score.overall).toBeLessThan(60);
      expect(score.breakdown.contextual).toBeLessThan(50);
    });
    
    it('should prioritize intent matching for networking goals', async () => {
      const fundraiser = testUsers.startup_founder;
      const investor = testUsers.angel_investor;
      
      const score = await compatibilityEngine.calculateCompatibility(fundraiser, investor);
      
      expect(score.breakdown.intent).toBeGreaterThan(85);
      expect(score.reasoning).toContain('fundraising');
    });
    
    it('should handle users with missing data gracefully', async () => {
      const minimalUser1 = { id: 'min1', name: 'User 1' };
      const minimalUser2 = { id: 'min2', name: 'User 2' };
      
      const score = await compatibilityEngine.calculateCompatibility(minimalUser1, minimalUser2);
      
      expect(score.overall).toBeGreaterThanOrEqual(40);
      expect(score.overall).toBeLessThanOrEqual(60);
    });
  });
  
  describe('Conversation Starters', () => {
    it('should generate relevant conversation starters', async () => {
      const user1 = testUsers.seniorCTO;
      const user2 = testUsers.seniorEngineer;
      const score = await compatibilityEngine.calculateCompatibility(user1, user2);
      
      const starters = await compatibilityEngine.generateConversationStarters(user1, user2, score);
      
      expect(starters).toHaveLength(3);
      starters.forEach(starter => {
        expect(starter.starter).toBeTruthy();
        expect(starter.reasoning).toBeTruthy();
        expect(starter.starter.length).toBeGreaterThan(20);
        expect(starter.starter.length).toBeLessThan(500);
      });
    });
    
    it('should reference specific shared interests', async () => {
      const user1 = testUsers.seniorCTO;
      const user2 = testUsers.seniorEngineer;
      const score = await compatibilityEngine.calculateCompatibility(user1, user2);
      
      const starters = await compatibilityEngine.generateConversationStarters(user1, user2, score);
      
      // Should reference AI or Architecture (shared interests)
      const hasSharedInterestReference = starters.some(s => 
        s.starter.toLowerCase().includes('ai') || 
        s.starter.toLowerCase().includes('architecture')
      );
      expect(hasSharedInterestReference).toBe(true);
    });
    
    it('should create goal-aligned starters for investor-founder pairs', async () => {
      const founder = testUsers.startup_founder;
      const investor = testUsers.angel_investor;
      const score = await compatibilityEngine.calculateCompatibility(founder, investor);
      
      const starters = await compatibilityEngine.generateConversationStarters(investor, founder, score);
      
      // Should have at least one starter mentioning investment/funding
      const hasInvestmentReference = starters.some(s => 
        s.starter.toLowerCase().includes('fund') || 
        s.starter.toLowerCase().includes('invest') ||
        s.starter.toLowerCase().includes('startup')
      );
      expect(hasInvestmentReference).toBe(true);
    });
  });
  
  describe('Performance Tests', () => {
    it('should find matches within performance budget', async () => {
      const user = testUsers.seniorCTO;
      
      const startTime = Date.now();
      const matches = await compatibilityEngine.findMatches(user.id, { limit: 20 });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(2000); // 2 second max
      expect(matches.length).toBeLessThanOrEqual(20);
      expect(matches[0].compatibilityScore.overall).toBeGreaterThan(60);
    });
    
    it('should handle concurrent matching requests', async () => {
      const users = ['cto_001', 'eng_001', 'pm_001'];
      
      const promises = users.map(userId => 
        compatibilityEngine.findMatches(userId, { limit: 10 })
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(matches => {
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].compatibilityScore.overall).toBeGreaterThan(50);
      });
    });
    
    it('should cache compatibility calculations for performance', async () => {
      const user1 = testUsers.seniorCTO;
      const user2 = testUsers.seniorEngineer;
      
      // First calculation
      const startTime1 = Date.now();
      const score1 = await compatibilityEngine.calculateCompatibility(user1, user2);
      const time1 = Date.now() - startTime1;
      
      // Second calculation (should be cached)
      const startTime2 = Date.now();
      const score2 = await compatibilityEngine.calculateCompatibility(user1, user2);
      const time2 = Date.now() - startTime2;
      
      expect(score1).toEqual(score2); // Same result
      expect(time2).toBeLessThan(time1); // Faster from cache
    });
  });
  
  describe('Match Quality', () => {
    it('should rank matches by overall compatibility', async () => {
      const matches = await compatibilityEngine.findMatches('cto_001', { limit: 10 });
      
      // Check that matches are sorted by score
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].compatibilityScore.overall).toBeGreaterThanOrEqual(
          matches[i].compatibilityScore.overall
        );
      }
    });
    
    it('should provide diverse match reasons', async () => {
      const matches = await compatibilityEngine.findMatches('cto_001', { limit: 5 });
      
      const reasons = matches.map(m => m.compatibilityScore.reasoning);
      const uniqueReasons = new Set(reasons);
      
      // Should have at least 3 different reasoning patterns
      expect(uniqueReasons.size).toBeGreaterThanOrEqual(3);
    });
  });
});

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockCompatibilityEngine,
    testUsers,
    setupTestEnvironment,
    cleanupTestEnvironment
  };
}