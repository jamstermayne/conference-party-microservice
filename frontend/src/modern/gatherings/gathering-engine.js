/**
 * Smart Gathering Engine
 * Intelligent spontaneous gathering creation and management
 */

export class SmartGatheringEngine {
  constructor() {
    this.gatherings = new Map();
    this.invitations = new Map();
    this.attendeeProfiles = new Map();
    this.currentConferenceId = 'gamescom-2025';
    this.aiService = null; // Will be initialized with AI service
  }
  
  /**
   * Initialize the gathering engine
   */
  async initialize() {
    // Load existing gatherings
    await this.loadGatherings();
    
    // Setup real-time listeners
    this.setupRealtimeListeners();
    
    console.log('SmartGatheringEngine initialized');
  }
  
  /**
   * Create a smart gathering with intelligent targeting
   */
  async createGathering(request) {
    console.log('Creating smart gathering:', request);
    
    // Generate targeting criteria from request
    const targeting = await this.generateTargeting(request);
    
    // Find matching attendees
    const potentialAttendees = await this.findMatchingAttendees(targeting);
    
    // Create gathering object
    const gathering = {
      id: this.generateGatheringId(),
      creatorId: request.creatorId,
      title: request.title,
      description: request.description,
      type: request.type || 'networking', // coffee, demo, discussion, networking
      maxAttendees: request.maxAttendees || 8,
      minAttendees: request.minAttendees || 2,
      location: request.location || 'TBD',
      timing: {
        preferred: request.preferredTime || new Date(),
        flexible: request.flexibleTiming !== false,
        duration: request.duration || 30, // minutes
        window: request.timeWindow || 120 // minutes of flexibility
      },
      targeting: targeting,
      status: 'inviting', // inviting, confirmed, active, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
      attendees: {
        accepted: [request.creatorId],
        pending: [],
        declined: [],
        waitlisted: []
      },
      metadata: {
        invitesSent: 0,
        responsesReceived: 0,
        averageScore: 0,
        momentum: 100 // starts at 100%, decays over time
      }
    };
    
    // Store gathering
    this.gatherings.set(gathering.id, gathering);
    await this.saveGathering(gathering);
    
    // Send smart invitations
    await this.sendSmartInvitations(gathering, potentialAttendees, targeting);
    
    // Start auto-management
    this.startGatheringManagement(gathering.id);
    
    return gathering;
  }
  
  /**
   * Generate targeting criteria from natural language request
   */
  async generateTargeting(request) {
    // Use AI or rules-based system to generate targeting
    // For now, we'll use a smart rules-based approach
    
    const targeting = {
      profiles: [],
      skills: [],
      interests: [],
      experienceLevels: [],
      companyTypes: [],
      autoAcceptThreshold: 85,
      maxInvites: 20,
      priorityFactors: []
    };
    
    // Analyze request type
    switch (request.type) {
      case 'coffee':
        targeting.profiles = ['Any'];
        targeting.experienceLevels = ['Similar'];
        targeting.autoAcceptThreshold = 75;
        targeting.maxInvites = 10;
        targeting.priorityFactors = ['availability', 'proximity', 'interests'];
        break;
      
      case 'demo':
        targeting.profiles = ['Developer', 'Designer', 'Product Manager'];
        targeting.skills = this.extractSkills(request.description);
        targeting.autoAcceptThreshold = 80;
        targeting.priorityFactors = ['technical_match', 'interest_level'];
        break;
      
      case 'discussion':
        targeting.interests = this.extractTopics(request.description);
        targeting.experienceLevels = ['Senior', 'Executive'];
        targeting.autoAcceptThreshold = 70;
        targeting.priorityFactors = ['expertise', 'discussion_history'];
        break;
      
      case 'networking':
      default:
        targeting.profiles = this.extractTargetProfiles(request);
        targeting.companyTypes = this.extractCompanyTypes(request);
        targeting.autoAcceptThreshold = 65;
        targeting.priorityFactors = ['compatibility', 'mutual_benefit'];
        break;
    }
    
    // Add creator's context
    if (request.creatorProfile) {
      targeting.creatorContext = {
        title: request.creatorProfile.title,
        company: request.creatorProfile.company,
        interests: request.creatorProfile.interests || [],
        goals: request.creatorProfile.goals || []
      };
    }
    
    // Generate scoring weights
    targeting.scoringWeights = this.generateScoringWeights(targeting);
    
    return targeting;
  }
  
  /**
   * Find matching attendees based on targeting criteria
   */
  async findMatchingAttendees(targeting) {
    // Get all active attendees
    const allAttendees = await this.getActiveAttendees();
    
    // Score each attendee
    const scoredAttendees = await Promise.all(
      allAttendees.map(async (attendee) => {
        const score = await this.calculateTargetingScore(attendee, targeting);
        return {
          ...attendee,
          targetingScore: score.overall,
          scoreBreakdown: score.breakdown,
          autoAccept: score.overall >= targeting.autoAcceptThreshold,
          matchingReasons: score.reasons
        };
      })
    );
    
    // Filter and sort
    const eligibleAttendees = scoredAttendees
      .filter(a => a.targetingScore > 40) // Minimum threshold
      .sort((a, b) => b.targetingScore - a.targetingScore)
      .slice(0, targeting.maxInvites);
    
    return eligibleAttendees;
  }
  
  /**
   * Calculate targeting score for an attendee
   */
  async calculateTargetingScore(attendee, targeting) {
    const breakdown = {
      profile: 0,
      skills: 0,
      interests: 0,
      experience: 0,
      availability: 0,
      compatibility: 0
    };
    
    const reasons = [];
    
    // Profile match
    if (this.matchesProfile(attendee, targeting.profiles)) {
      breakdown.profile = 20;
      reasons.push(`Matches target profile: ${attendee.title}`);
    }
    
    // Skills match
    const skillMatch = this.calculateSkillMatch(attendee.skills, targeting.skills);
    breakdown.skills = skillMatch * 20;
    if (skillMatch > 0.5) {
      reasons.push(`Strong skill alignment (${Math.round(skillMatch * 100)}%)`);
    }
    
    // Interest match
    const interestMatch = this.calculateInterestMatch(attendee.interests, targeting.interests);
    breakdown.interests = interestMatch * 20;
    if (interestMatch > 0.5) {
      reasons.push(`Shared interests in ${this.getSharedInterests(attendee.interests, targeting.interests).join(', ')}`);
    }
    
    // Experience level match
    if (this.matchesExperience(attendee, targeting.experienceLevels)) {
      breakdown.experience = 15;
      reasons.push(`${attendee.experienceLevel} level professional`);
    }
    
    // Availability scoring
    breakdown.availability = this.calculateAvailabilityScore(attendee) * 15;
    
    // Compatibility with creator
    if (targeting.creatorContext) {
      breakdown.compatibility = this.calculateCompatibility(attendee, targeting.creatorContext) * 10;
      if (breakdown.compatibility > 5) {
        reasons.push('High compatibility with organizer');
      }
    }
    
    // Calculate weighted overall score
    const weights = targeting.scoringWeights || {
      profile: 1,
      skills: 1,
      interests: 1,
      experience: 1,
      availability: 1,
      compatibility: 1
    };
    
    let overall = 0;
    let totalWeight = 0;
    
    for (const [key, value] of Object.entries(breakdown)) {
      overall += value * (weights[key] || 1);
      totalWeight += weights[key] || 1;
    }
    
    overall = overall / totalWeight;
    
    return {
      overall: Math.min(100, Math.round(overall)),
      breakdown,
      reasons
    };
  }
  
  /**
   * Send smart invitations to matched attendees
   */
  async sendSmartInvitations(gathering, attendees, targeting) {
    console.log(`Sending invitations to ${attendees.length} matched attendees`);
    
    for (const attendee of attendees) {
      const invitation = {
        id: this.generateInvitationId(),
        gatheringId: gathering.id,
        targetUserId: attendee.id,
        targetUserName: attendee.name,
        personalizedMessage: await this.generatePersonalizedMessage(gathering, attendee, targeting),
        matchingReasons: attendee.matchingReasons,
        score: attendee.targetingScore,
        autoAccept: attendee.autoAccept,
        priority: this.calculatePriority(attendee.targetingScore),
        status: 'pending', // pending, accepted, declined, expired
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };
      
      // Store invitation
      this.invitations.set(invitation.id, invitation);
      
      // Process based on auto-accept
      if (attendee.autoAccept) {
        await this.autoAcceptInvitation(invitation, gathering);
      } else {
        await this.sendManualInvitation(invitation, gathering);
      }
      
      // Update gathering metadata
      gathering.metadata.invitesSent++;
      gathering.attendees.pending.push(attendee.id);
    }
    
    await this.saveGathering(gathering);
  }
  
  /**
   * Generate personalized invitation message
   */
  async generatePersonalizedMessage(gathering, attendee, targeting) {
    const templates = {
      coffee: `Hi ${attendee.name}! I'm organizing a quick coffee chat about "${gathering.title}". Based on your ${attendee.matchingReasons[0]?.toLowerCase() || 'profile'}, I think you'd be a great addition to the conversation.`,
      
      demo: `Hey ${attendee.name}, I'm doing a demo of ${gathering.title}. Your experience with ${attendee.skills?.join(', ') || 'similar technologies'} would bring valuable perspective.`,
      
      discussion: `Hi ${attendee.name}, I'm gathering a small group to discuss "${gathering.title}". Your insights as a ${attendee.title} would be invaluable.`,
      
      networking: `Hi ${attendee.name}! I'm putting together a small networking group for ${gathering.title}. ${attendee.matchingReasons[0] || 'I think we have a lot in common'}.`
    };
    
    let message = templates[gathering.type] || templates.networking;
    
    // Add timing information
    const timeStr = this.formatTime(gathering.timing.preferred);
    message += ` Planning for around ${timeStr}`;
    
    if (gathering.timing.flexible) {
      message += ' (flexible on timing)';
    }
    
    message += `. ${gathering.maxAttendees - gathering.attendees.accepted.length} spots available. Interested?`;
    
    return message;
  }
  
  /**
   * Auto-accept high-scoring invitations
   */
  async autoAcceptInvitation(invitation, gathering) {
    console.log(`Auto-accepting invitation for ${invitation.targetUserName}`);
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.autoAccepted = true;
    
    // Update gathering
    gathering.attendees.accepted.push(invitation.targetUserId);
    gathering.attendees.pending = gathering.attendees.pending.filter(
      id => id !== invitation.targetUserId
    );
    
    // Send confirmation
    await this.sendAcceptanceNotification(invitation, gathering, true);
    
    // Check if gathering is ready
    await this.checkGatheringStatus(gathering);
  }
  
  /**
   * Send manual invitation requiring response
   */
  async sendManualInvitation(invitation, gathering) {
    console.log(`Sending manual invitation to ${invitation.targetUserName}`);
    
    // Create notification
    const notification = {
      type: 'gathering_invitation',
      title: `Invitation: ${gathering.title}`,
      body: invitation.personalizedMessage,
      data: {
        invitationId: invitation.id,
        gatheringId: gathering.id,
        score: invitation.score,
        reasons: invitation.matchingReasons
      },
      actions: [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
        { action: 'view', title: 'View Details' }
      ]
    };
    
    // Send via push notification or in-app
    await this.sendNotification(invitation.targetUserId, notification);
  }
  
  /**
   * Process invitation response
   */
  async processInvitationResponse(invitationId, response) {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    const gathering = this.gatherings.get(invitation.gatheringId);
    if (!gathering) {
      throw new Error('Gathering not found');
    }
    
    // Update invitation
    invitation.status = response;
    invitation.respondedAt = new Date();
    
    // Update gathering based on response
    if (response === 'accepted') {
      gathering.attendees.accepted.push(invitation.targetUserId);
      gathering.attendees.pending = gathering.attendees.pending.filter(
        id => id !== invitation.targetUserId
      );
      
      await this.sendAcceptanceNotification(invitation, gathering, false);
    } else if (response === 'declined') {
      gathering.attendees.declined.push(invitation.targetUserId);
      gathering.attendees.pending = gathering.attendees.pending.filter(
        id => id !== invitation.targetUserId
      );
      
      // Consider sending more invitations
      await this.considerAdditionalInvites(gathering);
    }
    
    gathering.metadata.responsesReceived++;
    await this.checkGatheringStatus(gathering);
    await this.saveGathering(gathering);
    
    return { invitation, gathering };
  }
  
  /**
   * Check and update gathering status
   */
  async checkGatheringStatus(gathering) {
    const acceptedCount = gathering.attendees.accepted.length;
    const pendingCount = gathering.attendees.pending.length;
    const now = new Date();
    
    // Check if minimum attendees reached
    if (acceptedCount >= gathering.minAttendees && gathering.status === 'inviting') {
      gathering.status = 'confirmed';
      await this.sendGatheringConfirmation(gathering);
    }
    
    // Check if maximum reached
    if (acceptedCount >= gathering.maxAttendees) {
      gathering.status = 'full';
      // Move pending to waitlist
      gathering.attendees.waitlisted.push(...gathering.attendees.pending);
      gathering.attendees.pending = [];
    }
    
    // Check if time is approaching
    const timeUntil = gathering.timing.preferred - now;
    if (timeUntil < 15 * 60 * 1000 && gathering.status === 'confirmed') {
      gathering.status = 'active';
      await this.sendFinalReminders(gathering);
    }
    
    // Check if gathering should be cancelled
    if (timeUntil < 10 * 60 * 1000 && acceptedCount < gathering.minAttendees) {
      gathering.status = 'cancelled';
      await this.cancelGathering(gathering);
    }
    
    gathering.updatedAt = now;
  }
  
  /**
   * Start auto-management for a gathering
   */
  startGatheringManagement(gatheringId) {
    // Check status every minute
    const intervalId = setInterval(async () => {
      const gathering = this.gatherings.get(gatheringId);
      if (!gathering) {
        clearInterval(intervalId);
        return;
      }
      
      // Update momentum (decay over time)
      gathering.metadata.momentum = Math.max(0, gathering.metadata.momentum - 2);
      
      // Check if gathering is stale
      if (gathering.metadata.momentum < 20 && gathering.status === 'inviting') {
        await this.boostGathering(gathering);
      }
      
      // Check overall status
      await this.checkGatheringStatus(gathering);
      
      // Stop management if gathering is completed or cancelled
      if (['completed', 'cancelled'].includes(gathering.status)) {
        clearInterval(intervalId);
      }
    }, 60000); // Every minute
  }
  
  /**
   * Boost a stale gathering with additional invites
   */
  async boostGathering(gathering) {
    console.log(`Boosting gathering ${gathering.id} with additional invites`);
    
    // Relax targeting criteria
    const relaxedTargeting = {
      ...gathering.targeting,
      autoAcceptThreshold: gathering.targeting.autoAcceptThreshold - 10,
      maxInvites: 10
    };
    
    // Find additional attendees
    const additionalAttendees = await this.findMatchingAttendees(relaxedTargeting);
    
    // Filter out already invited
    const alreadyInvited = new Set([
      ...gathering.attendees.accepted,
      ...gathering.attendees.pending,
      ...gathering.attendees.declined
    ]);
    
    const newAttendees = additionalAttendees.filter(
      a => !alreadyInvited.has(a.id)
    );
    
    if (newAttendees.length > 0) {
      await this.sendSmartInvitations(gathering, newAttendees, relaxedTargeting);
      gathering.metadata.momentum += 30; // Boost momentum
    }
  }
  
  /**
   * Get real-time updates for a gathering
   */
  subscribeToGathering(gatheringId, callback) {
    // Return unsubscribe function
    const intervalId = setInterval(() => {
      const gathering = this.gatherings.get(gatheringId);
      if (gathering) {
        callback(gathering);
      }
    }, 5000); // Update every 5 seconds
    
    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }
  
  /**
   * Helper functions
   */
  
  generateGatheringId() {
    return `gathering_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateInvitationId() {
    return `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  matchesProfile(attendee, targetProfiles) {
    if (targetProfiles.includes('Any')) return true;
    
    const attendeeProfile = this.categorizeProfile(attendee.title);
    return targetProfiles.some(p => 
      p.toLowerCase() === attendeeProfile.toLowerCase()
    );
  }
  
  categorizeProfile(title) {
    const titleLower = title?.toLowerCase() || '';
    
    if (titleLower.includes('developer') || titleLower.includes('engineer')) {
      return 'Developer';
    }
    if (titleLower.includes('design')) {
      return 'Designer';
    }
    if (titleLower.includes('product')) {
      return 'Product Manager';
    }
    if (titleLower.includes('market')) {
      return 'Marketing';
    }
    if (titleLower.includes('business') || titleLower.includes('sales')) {
      return 'Business';
    }
    if (titleLower.includes('founder') || titleLower.includes('ceo')) {
      return 'Executive';
    }
    
    return 'Professional';
  }
  
  calculateSkillMatch(attendeeSkills = [], targetSkills = []) {
    if (targetSkills.length === 0) return 0.5; // Neutral if no skills required
    if (attendeeSkills.length === 0) return 0;
    
    const matches = targetSkills.filter(skill =>
      attendeeSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return matches.length / targetSkills.length;
  }
  
  calculateInterestMatch(attendeeInterests = [], targetInterests = []) {
    if (targetInterests.length === 0) return 0.5; // Neutral if no interests required
    if (attendeeInterests.length === 0) return 0;
    
    const matches = targetInterests.filter(interest =>
      attendeeInterests.some(i => i.toLowerCase().includes(interest.toLowerCase()))
    );
    
    return matches.length / targetInterests.length;
  }
  
  getSharedInterests(attendeeInterests = [], targetInterests = []) {
    return targetInterests.filter(interest =>
      attendeeInterests.some(i => i.toLowerCase().includes(interest.toLowerCase()))
    );
  }
  
  matchesExperience(attendee, targetLevels) {
    if (targetLevels.length === 0) return true;
    if (targetLevels.includes('Similar')) return true;
    
    const attendeeLevel = this.categorizeExperience(attendee);
    return targetLevels.includes(attendeeLevel);
  }
  
  categorizeExperience(attendee) {
    const title = attendee.title?.toLowerCase() || '';
    const years = attendee.yearsExperience || 0;
    
    if (title.includes('junior') || years < 3) return 'Junior';
    if (title.includes('senior') || years > 7) return 'Senior';
    if (title.includes('executive') || title.includes('director')) return 'Executive';
    
    return 'Mid-level';
  }
  
  calculateAvailabilityScore(attendee) {
    // Mock availability scoring
    // In production, would check calendar integration
    return Math.random() * 0.5 + 0.5; // 50-100% availability
  }
  
  calculateCompatibility(attendee, creatorContext) {
    let score = 0;
    
    // Company size compatibility
    if (attendee.companySize === creatorContext.companySize) {
      score += 25;
    }
    
    // Industry compatibility
    if (attendee.industry === creatorContext.industry) {
      score += 25;
    }
    
    // Interest overlap
    const sharedInterests = this.getSharedInterests(
      attendee.interests,
      creatorContext.interests
    );
    score += (sharedInterests.length / Math.max(1, creatorContext.interests.length)) * 25;
    
    // Goal alignment
    const sharedGoals = (attendee.goals || []).filter(g =>
      (creatorContext.goals || []).includes(g)
    );
    score += (sharedGoals.length / Math.max(1, creatorContext.goals.length)) * 25;
    
    return score;
  }
  
  calculatePriority(score) {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
  
  generateScoringWeights(targeting) {
    const weights = {
      profile: 1,
      skills: 1,
      interests: 1,
      experience: 1,
      availability: 1,
      compatibility: 1
    };
    
    // Adjust weights based on gathering type
    if (targeting.skills.length > 0) {
      weights.skills = 2;
    }
    if (targeting.interests.length > 0) {
      weights.interests = 2;
    }
    if (targeting.experienceLevels.length > 0) {
      weights.experience = 1.5;
    }
    
    return weights;
  }
  
  extractSkills(description) {
    const skills = [];
    const techKeywords = [
      'javascript', 'python', 'react', 'node', 'ai', 'ml',
      'blockchain', 'web3', 'unity', 'unreal', 'game', 'design'
    ];
    
    const descLower = description.toLowerCase();
    for (const keyword of techKeywords) {
      if (descLower.includes(keyword)) {
        skills.push(keyword);
      }
    }
    
    return skills;
  }
  
  extractTopics(description) {
    const topics = [];
    const topicKeywords = [
      'future', 'trends', 'innovation', 'strategy', 'growth',
      'monetization', 'community', 'ethics', 'sustainability'
    ];
    
    const descLower = description.toLowerCase();
    for (const keyword of topicKeywords) {
      if (descLower.includes(keyword)) {
        topics.push(keyword);
      }
    }
    
    return topics;
  }
  
  extractTargetProfiles(request) {
    // Extract from description or use defaults
    const profiles = [];
    const descLower = (request.description || '').toLowerCase();
    
    if (descLower.includes('developer') || descLower.includes('engineer')) {
      profiles.push('Developer');
    }
    if (descLower.includes('design')) {
      profiles.push('Designer');
    }
    if (descLower.includes('product')) {
      profiles.push('Product Manager');
    }
    if (descLower.includes('founder') || descLower.includes('startup')) {
      profiles.push('Executive');
    }
    
    return profiles.length > 0 ? profiles : ['Any'];
  }
  
  extractCompanyTypes(request) {
    const types = [];
    const descLower = (request.description || '').toLowerCase();
    
    if (descLower.includes('startup')) types.push('startup');
    if (descLower.includes('enterprise')) types.push('enterprise');
    if (descLower.includes('indie')) types.push('indie');
    if (descLower.includes('aaa')) types.push('aaa');
    
    return types;
  }
  
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  /**
   * Mock data functions (would connect to real database in production)
   */
  
  async getActiveAttendees() {
    // Mock attendee data
    return [
      {
        id: 'user_001',
        name: 'Sarah Chen',
        title: 'Senior Game Developer',
        company: 'Indie Studio',
        skills: ['Unity', 'C#', 'Game Design'],
        interests: ['VR', 'Multiplayer', 'Innovation'],
        experienceLevel: 'Senior',
        yearsExperience: 8,
        goals: ['find-collaborators', 'learn-tech'],
        availability: 0.8
      },
      {
        id: 'user_002',
        name: 'Michael Rodriguez',
        title: 'Product Manager',
        company: 'Gaming Platform',
        skills: ['Product Strategy', 'Analytics', 'Monetization'],
        interests: ['Mobile Gaming', 'User Retention', 'Growth'],
        experienceLevel: 'Mid-level',
        yearsExperience: 5,
        goals: ['partnerships', 'market-insights'],
        availability: 0.6
      },
      {
        id: 'user_003',
        name: 'Emma Thompson',
        title: 'UX Designer',
        company: 'AAA Studio',
        skills: ['UI/UX', 'Figma', 'User Research'],
        interests: ['Accessibility', 'Player Experience', 'Design Systems'],
        experienceLevel: 'Senior',
        yearsExperience: 7,
        goals: ['share-knowledge', 'find-talent'],
        availability: 0.7
      },
      {
        id: 'user_004',
        name: 'David Kim',
        title: 'Indie Developer',
        company: 'Solo',
        skills: ['Godot', 'Pixel Art', 'Game Design'],
        interests: ['Indie Games', 'Narrative', 'Community'],
        experienceLevel: 'Mid-level',
        yearsExperience: 4,
        goals: ['find-publisher', 'networking'],
        availability: 0.9
      },
      {
        id: 'user_005',
        name: 'Lisa Anderson',
        title: 'Marketing Director',
        company: 'Publisher',
        skills: ['Marketing', 'PR', 'Community Management'],
        interests: ['Influencer Marketing', 'Social Media', 'Launch Strategy'],
        experienceLevel: 'Executive',
        yearsExperience: 12,
        goals: ['find-games', 'partnerships'],
        availability: 0.5
      }
    ];
  }
  
  async loadGatherings() {
    // Load from localStorage or database
    const stored = localStorage.getItem('smart_gatherings');
    if (stored) {
      const gatherings = JSON.parse(stored);
      for (const gathering of gatherings) {
        this.gatherings.set(gathering.id, gathering);
      }
    }
  }
  
  async saveGathering(gathering) {
    // Save to localStorage or database
    const allGatherings = Array.from(this.gatherings.values());
    localStorage.setItem('smart_gatherings', JSON.stringify(allGatherings));
  }
  
  setupRealtimeListeners() {
    // Setup WebSocket or polling for real-time updates
    // This would connect to Firebase or other real-time service
  }
  
  async sendNotification(userId, notification) {
    // Send push notification or in-app notification
    console.log(`Notification to ${userId}:`, notification);
    
    // Store for in-app display
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push({
      ...notification,
      userId,
      timestamp: new Date()
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }
  
  async sendAcceptanceNotification(invitation, gathering, isAutoAccepted) {
    const message = isAutoAccepted
      ? `${invitation.targetUserName} was auto-matched to your gathering!`
      : `${invitation.targetUserName} accepted your invitation!`;
    
    await this.sendNotification(gathering.creatorId, {
      type: 'gathering_update',
      title: gathering.title,
      body: message,
      data: { gatheringId: gathering.id }
    });
  }
  
  async sendGatheringConfirmation(gathering) {
    const message = `Your gathering "${gathering.title}" is confirmed with ${gathering.attendees.accepted.length} attendees!`;
    
    // Notify all accepted attendees
    for (const userId of gathering.attendees.accepted) {
      await this.sendNotification(userId, {
        type: 'gathering_confirmed',
        title: 'Gathering Confirmed!',
        body: message,
        data: { gatheringId: gathering.id }
      });
    }
  }
  
  async sendFinalReminders(gathering) {
    const message = `Reminder: "${gathering.title}" starts in 15 minutes at ${gathering.location}`;
    
    for (const userId of gathering.attendees.accepted) {
      await this.sendNotification(userId, {
        type: 'gathering_reminder',
        title: 'Starting Soon!',
        body: message,
        data: { gatheringId: gathering.id }
      });
    }
  }
  
  async cancelGathering(gathering) {
    const message = `Unfortunately, "${gathering.title}" has been cancelled due to insufficient attendees.`;
    
    for (const userId of gathering.attendees.accepted) {
      await this.sendNotification(userId, {
        type: 'gathering_cancelled',
        title: 'Gathering Cancelled',
        body: message,
        data: { gatheringId: gathering.id }
      });
    }
  }
  
  async considerAdditionalInvites(gathering) {
    // If too many declines, send more invites
    const acceptRate = gathering.attendees.accepted.length / 
                      (gathering.attendees.accepted.length + gathering.attendees.declined.length);
    
    if (acceptRate < 0.3 && gathering.metadata.invitesSent < 30) {
      await this.boostGathering(gathering);
    }
  }
}

// Export singleton instance
export const gatheringEngine = new SmartGatheringEngine();