/**
 * OPPORTUNITIES SERVICE
 * LinkedIn-killer consent-based networking and opportunity matching
 */

export async function setIntent(intent){
  const r = await fetch('/api/opportunities/intent', {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
    body: JSON.stringify(intent)
  });
  return r.ok;
}

export async function list(){
  try{
    const r = await fetch('/api/opportunities', { credentials:'include' });
    if(!r.ok) throw 0;
    return await r.json();
  }catch{
    return {
      inbound: [
        { id:'in1', title:'Publisher intro', context:'Your profile matched with 2 shared tags' },
        { id:'in2', title:'Investor office hours', context:'Seed, Europe focus' }
      ],
      outbound: [
        { id:'out1', title:'Applied to Audio Partner', context:'Awaiting response' }
      ]
    };
  }
}

export async function ignore(opportunityId){
  const r = await fetch(`/api/opportunities/${opportunityId}/ignore`, {
    method:'POST', credentials:'include'
  });
  return r.ok;
}

export async function accept(opportunityId){
  const r = await fetch(`/api/opportunities/${opportunityId}/accept`, {
    method:'POST', credentials:'include'
  });
  return r.ok;
}

// Legacy class-based opportunity service for backward compatibility
class OpportunityService {
  constructor() {
    this.opportunities = [];
    this.matches = [];
    this.preferences = {
      types: ['collaboration', 'hiring', 'investment', 'partnership'],
      remote: true,
      locations: [],
      skills: [],
      experience: 'any',
      availability: 'open'
    };
    this.intentEnabled = false;
    this.subscribers = [];
    this.initialized = false;
  }

  /**
   * Initialize opportunity service
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load user preferences
      await this.loadPreferences();
      
      // Load opportunities if intent is enabled
      if (this.intentEnabled) {
        await this.loadOpportunities();
      }
      
      this.initialized = true;
      console.log('✅ Opportunity service initialized');
    } catch (error) {
      console.error('Opportunity service initialization failed:', error);
    }
  }

  /**
   * Load user opportunity preferences
   */
  async loadPreferences() {
    try {
      // Load from localStorage first
      const cached = localStorage.getItem('opportunities.preferences');
      if (cached) {
        const data = JSON.parse(cached);
        this.preferences = { ...this.preferences, ...data.preferences };
        this.intentEnabled = data.intentEnabled || false;
      }

      // Sync with server
      const response = await fetch('/api/opportunities/preferences');
      if (response.ok) {
        const serverData = await response.json();
        this.preferences = { ...this.preferences, ...serverData.preferences };
        this.intentEnabled = serverData.intentEnabled || false;
        this.cachePreferences();
      }
    } catch (error) {
      console.warn('Failed to load opportunity preferences:', error);
    }
  }

  /**
   * Save preferences to cache and server
   */
  cachePreferences() {
    const data = {
      preferences: this.preferences,
      intentEnabled: this.intentEnabled,
      lastUpdate: Date.now()
    };
    localStorage.setItem('opportunities.preferences', JSON.stringify(data));
  }

  /**
   * Enable opportunity intent (consent-based)
   */
  async enableOpportunityIntent() {
    if (this.intentEnabled) return { success: true };

    try {
      const response = await fetch('/api/opportunities/enable-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: this.preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to enable opportunity intent');
      }

      this.intentEnabled = true;
      this.cachePreferences();
      
      // Start loading opportunities
      await this.loadOpportunities();
      
      this.notifySubscribers('intent_enabled');
      return { success: true };
    } catch (error) {
      console.error('Failed to enable opportunity intent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable opportunity intent
   */
  async disableOpportunityIntent() {
    try {
      await fetch('/api/opportunities/disable-intent', { method: 'POST' });
      
      this.intentEnabled = false;
      this.opportunities = [];
      this.matches = [];
      this.cachePreferences();
      
      this.notifySubscribers('intent_disabled');
      return { success: true };
    } catch (error) {
      console.error('Failed to disable opportunity intent:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update opportunity preferences
   */
  async updatePreferences(newPreferences) {
    try {
      const response = await fetch('/api/opportunities/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      this.preferences = { ...this.preferences, ...newPreferences };
      this.cachePreferences();
      
      // Refresh opportunities with new preferences
      if (this.intentEnabled) {
        await this.loadOpportunities();
      }
      
      this.notifySubscribers('preferences_updated', this.preferences);
      return { success: true };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load available opportunities
   */
  async loadOpportunities() {
    if (!this.intentEnabled) return;

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: this.preferences })
      });

      if (!response.ok) throw new Error('Failed to load opportunities');

      const data = await response.json();
      this.opportunities = data.opportunities || [];
      this.matches = data.matches || [];
      
      this.notifySubscribers('opportunities_loaded', {
        opportunities: this.opportunities,
        matches: this.matches
      });

    } catch (error) {
      console.error('Failed to load opportunities:', error);
    }
  }

  /**
   * Get personalized opportunity matches
   */
  getMatches() {
    return this.matches.map(match => ({
      ...match,
      opportunity: this.opportunities.find(opp => opp.id === match.opportunityId),
      matchScore: this.calculateMatchScore(match),
      reasons: this.getMatchReasons(match)
    }));
  }

  /**
   * Calculate match score for opportunity
   */
  calculateMatchScore(match) {
    let score = 0;
    const opportunity = this.opportunities.find(opp => opp.id === match.opportunityId);
    
    if (!opportunity) return 0;

    // Type preference match (30%)
    if (this.preferences.types.includes(opportunity.type)) {
      score += 30;
    }

    // Skills match (40%)
    const skillsMatch = this.calculateSkillsMatch(opportunity.requiredSkills || []);
    score += skillsMatch * 40;

    // Location/Remote preference (20%)
    if (opportunity.remote && this.preferences.remote) {
      score += 20;
    } else if (!opportunity.remote && this.preferences.locations.includes(opportunity.location)) {
      score += 15;
    }

    // Experience level match (10%)
    if (this.preferences.experience === 'any' || 
        opportunity.experienceLevel === this.preferences.experience) {
      score += 10;
    }

    return Math.min(score, 100) / 100; // Normalize to 0-1
  }

  /**
   * Calculate skills match percentage
   */
  calculateSkillsMatch(requiredSkills) {
    if (!requiredSkills.length || !this.preferences.skills.length) return 0;

    const matchingSkills = requiredSkills.filter(skill => 
      this.preferences.skills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    return matchingSkills.length / requiredSkills.length;
  }

  /**
   * Get match reasons for explanation
   */
  getMatchReasons(match) {
    const opportunity = this.opportunities.find(opp => opp.id === match.opportunityId);
    if (!opportunity) return [];

    const reasons = [];

    // Type match
    if (this.preferences.types.includes(opportunity.type)) {
      reasons.push(`Looking for ${opportunity.type} opportunities`);
    }

    // Skills match
    const skillsMatch = this.calculateSkillsMatch(opportunity.requiredSkills || []);
    if (skillsMatch > 0.5) {
      reasons.push(`Strong skills match (${Math.round(skillsMatch * 100)}%)`);
    }

    // Location match
    if (opportunity.remote && this.preferences.remote) {
      reasons.push('Open to remote work');
    }

    // Experience match
    if (opportunity.experienceLevel === this.preferences.experience) {
      reasons.push(`Experience level: ${opportunity.experienceLevel}`);
    }

    return reasons;
  }

  /**
   * Apply to opportunity
   */
  async applyToOpportunity(opportunityId, application = {}) {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application)
      });

      if (!response.ok) throw new Error('Failed to apply to opportunity');

      const result = await response.json();
      
      // Update local state
      const opportunity = this.opportunities.find(opp => opp.id === opportunityId);
      if (opportunity) {
        opportunity.applied = true;
        opportunity.applicationId = result.applicationId;
      }

      this.notifySubscribers('application_sent', {
        opportunityId,
        applicationId: result.applicationId
      });

      return { success: true, applicationId: result.applicationId };
    } catch (error) {
      console.error('Failed to apply to opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save opportunity for later
   */
  async saveOpportunity(opportunityId) {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/save`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to save opportunity');

      // Update local state
      const opportunity = this.opportunities.find(opp => opp.id === opportunityId);
      if (opportunity) {
        opportunity.saved = true;
      }

      this.notifySubscribers('opportunity_saved', { opportunityId });
      return { success: true };
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get saved opportunities
   */
  getSavedOpportunities() {
    return this.opportunities.filter(opp => opp.saved);
  }

  /**
   * Get applied opportunities
   */
  getAppliedOpportunities() {
    return this.opportunities.filter(opp => opp.applied);
  }

  /**
   * Create new opportunity (for opportunity creators)
   */
  async createOpportunity(opportunityData) {
    try {
      const response = await fetch('/api/opportunities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opportunityData)
      });

      if (!response.ok) throw new Error('Failed to create opportunity');

      const result = await response.json();
      
      this.notifySubscribers('opportunity_created', {
        opportunityId: result.id
      });

      return { success: true, opportunityId: result.id };
    } catch (error) {
      console.error('Failed to create opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search opportunities with filters
   */
  async searchOpportunities(searchParams) {
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await fetch(`/api/opportunities/search?${queryString}`);

      if (!response.ok) throw new Error('Search failed');

      const results = await response.json();
      
      this.notifySubscribers('search_results', {
        query: searchParams,
        results: results.opportunities
      });

      return results.opportunities;
    } catch (error) {
      console.error('Opportunity search failed:', error);
      return [];
    }
  }

  /**
   * Get opportunity recommendations based on profile
   */
  async getRecommendations(limit = 10) {
    if (!this.intentEnabled) return [];

    try {
      const response = await fetch(`/api/opportunities/recommendations?limit=${limit}`);
      
      if (response.ok) {
        const recommendations = await response.json();
        
        this.notifySubscribers('recommendations_loaded', {
          recommendations
        });

        return recommendations;
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
    
    return [];
  }

  /**
   * Track opportunity interaction (viewing, clicking, etc.)
   */
  async trackInteraction(opportunityId, action, metadata = {}) {
    try {
      // Anonymous analytics tracking
      await fetch('/api/analytics/opportunity-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          action,
          metadata,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Get opportunity statistics
   */
  getOpportunityStats() {
    const total = this.opportunities.length;
    const applied = this.opportunities.filter(opp => opp.applied).length;
    const saved = this.opportunities.filter(opp => opp.saved).length;
    const matches = this.matches.length;

    return {
      total,
      applied,
      saved,
      matches,
      applicationRate: total > 0 ? (applied / total) * 100 : 0,
      saveRate: total > 0 ? (saved / total) * 100 : 0
    };
  }

  /**
   * Get opportunity categories and counts
   */
  getOpportunityCategories() {
    const categories = {};
    
    this.opportunities.forEach(opp => {
      const type = opp.type || 'other';
      categories[type] = (categories[type] || 0) + 1;
    });

    return Object.entries(categories).map(([type, count]) => ({
      type,
      count,
      percentage: (count / this.opportunities.length) * 100
    }));
  }

  /**
   * Subscribe to opportunity events
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers of events
   */
  notifySubscribers(event, data = {}) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Opportunity subscriber error:', error);
      }
    });
  }

  /**
   * Get current state
   */
  getState() {
    return {
      intentEnabled: this.intentEnabled,
      preferences: { ...this.preferences },
      opportunities: [...this.opportunities],
      matches: [...this.matches],
      stats: this.getOpportunityStats()
    };
  }

  /**
   * Export opportunity data for user
   */
  exportData() {
    return {
      preferences: this.preferences,
      intentEnabled: this.intentEnabled,
      applications: this.opportunities
        .filter(opp => opp.applied)
        .map(opp => ({
          opportunityId: opp.id,
          appliedAt: opp.appliedAt,
          status: opp.applicationStatus
        })),
      savedOpportunities: this.opportunities
        .filter(opp => opp.saved)
        .map(opp => ({ opportunityId: opp.id, savedAt: opp.savedAt })),
      stats: this.getOpportunityStats()
    };
  }

  /**
   * Clear all opportunity data
   */
  clearData() {
    this.opportunities = [];
    this.matches = [];
    this.intentEnabled = false;
    this.preferences = {
      types: ['collaboration', 'hiring', 'investment', 'partnership'],
      remote: true,
      locations: [],
      skills: [],
      experience: 'any',
      availability: 'open'
    };
    
    localStorage.removeItem('opportunities.preferences');
  }

  /**
   * Destroy opportunity service
   */
  destroy() {
    this.clearData();
    this.subscribers = [];
    this.initialized = false;
    console.log('🗑️ Opportunity service destroyed');
  }
}

// Create singleton instance
export const opportunities = new OpportunityService();

// Export class for testing
export default OpportunityService;