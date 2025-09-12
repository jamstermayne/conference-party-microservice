/**
 * Real-time Matching UI Component
 * Live, interactive matching interface with real-time updates
 */

import { CompatibilityEngine } from '../matching/compatibility-engine.js';
import { conversationGenerator } from '../matching/conversation-generator.js';

export class RealtimeMatchingUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Core state
    this.compatibilityEngine = new CompatibilityEngine();
    this.matches = [];
    this.selectedMatch = null;
    this.conversationStarters = [];
    this.isLoading = false;
    this.filters = {
      minScore: 60,
      limit: 20,
      industry: 'all',
      experience: 'all',
      goals: 'all'
    };
    
    // User profile
    this.currentUser = null;
    
    // Real-time updates
    this.updateInterval = null;
    this.lastUpdate = Date.now();
  }
  
  async connectedCallback() {
    this.currentUser = await this.loadUserProfile();
    await this.loadMatches();
    this.render();
    this.attachEventListeners();
    this.startRealTimeUpdates();
  }
  
  disconnectedCallback() {
    this.stopRealTimeUpdates();
  }
  
  async loadUserProfile() {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      id: 'user_' + Date.now(),
      name: 'Current User',
      title: 'Software Engineer',
      company: 'Tech Company',
      industry: 'Technology',
      skills: ['JavaScript', 'React', 'Node.js'],
      interests: ['Gaming', 'AI', 'Web Development'],
      goals: ['find-collaborators', 'learn-tech'],
      experience: 'mid',
      persona: 'developer'
    };
  }
  
  async loadMatches() {
    this.isLoading = true;
    this.render();
    
    try {
      // Get all potential matches
      const candidates = await this.fetchCandidates();
      
      // Calculate compatibility scores in parallel
      const scoredMatches = await Promise.all(
        candidates.map(async (candidate) => {
          const score = await this.compatibilityEngine.calculateCompatibility(
            this.currentUser,
            candidate
          );
          
          return {
            id: `match_${candidate.id}`,
            user: candidate,
            compatibilityScore: score,
            status: 'new',
            timestamp: Date.now()
          };
        })
      );
      
      // Filter and sort matches
      this.matches = scoredMatches
        .filter(m => m.compatibilityScore.overall >= this.filters.minScore)
        .sort((a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall)
        .slice(0, this.filters.limit);
      
      // Update last update time
      this.lastUpdate = Date.now();
      
    } catch (error) {
      console.error('Failed to load matches:', error);
      this.showError('Failed to load matches. Please try again.');
    } finally {
      this.isLoading = false;
      this.render();
    }
  }
  
  async fetchCandidates() {
    // In production, this would fetch from an API
    // For demo, return mock data with variety
    return [
      {
        id: 'user_101',
        name: 'Sarah Chen',
        title: 'Senior Game Designer',
        company: 'Indie Games Studio',
        photoURL: 'https://i.pravatar.cc/150?img=1',
        industry: 'Gaming',
        skills: ['Unity', 'Game Design', 'Level Design', 'Narrative'],
        interests: ['Gaming', 'VR/AR', 'Storytelling', 'Indie Games'],
        goals: ['find-collaborators', 'showcase-solutions'],
        experience: 'senior',
        persona: 'developer',
        availability: 'Available now',
        location: 'Hall 4, Booth A-12'
      },
      {
        id: 'user_102',
        name: 'Michael Rodriguez',
        title: 'Head of Publishing',
        company: 'Global Games Publisher',
        photoURL: 'https://i.pravatar.cc/150?img=3',
        industry: 'Publishing',
        skills: ['Business Development', 'Marketing', 'Analytics', 'Strategy'],
        interests: ['Gaming', 'Esports', 'Mobile Gaming', 'Monetization'],
        goals: ['find-games', 'meet-developers', 'partnerships'],
        experience: 'lead',
        persona: 'publisher',
        availability: 'Available in 30 min',
        location: 'Hall 2, Meeting Room B'
      },
      {
        id: 'user_103',
        name: 'Emma Watson',
        title: 'Technical Artist',
        company: 'AAA Game Studio',
        photoURL: 'https://i.pravatar.cc/150?img=5',
        industry: 'Game Development',
        skills: ['3D Modeling', 'Shaders', 'Unreal Engine', 'Animation'],
        interests: ['Art', 'Technology', 'Real-time Graphics', 'VFX'],
        goals: ['learn-tech', 'find-collaborators', 'share-knowledge'],
        experience: 'mid',
        persona: 'developer',
        availability: 'In a meeting',
        location: 'Hall 6, Demo Area'
      },
      {
        id: 'user_104',
        name: 'David Kim',
        title: 'Venture Partner',
        company: 'Gaming Ventures',
        photoURL: 'https://i.pravatar.cc/150?img=7',
        industry: 'Investment',
        skills: ['Investment', 'Due Diligence', 'Strategy', 'Fundraising'],
        interests: ['Startups', 'Gaming', 'Technology', 'Web3'],
        goals: ['find-investments', 'meet-founders', 'market-insights'],
        experience: 'executive',
        persona: 'investor',
        availability: 'Available now',
        location: 'VIP Lounge'
      },
      {
        id: 'user_105',
        name: 'Lisa Zhang',
        title: 'Community Manager',
        company: 'Streaming Platform',
        photoURL: 'https://i.pravatar.cc/150?img=9',
        industry: 'Gaming',
        skills: ['Community Building', 'Social Media', 'Content Creation', 'Engagement'],
        interests: ['Gaming', 'Streaming', 'Esports', 'Content'],
        goals: ['partnerships', 'industry-trends', 'find-talent'],
        experience: 'mid',
        persona: 'service',
        availability: 'Available in 1 hour',
        location: 'Content Creator Zone'
      },
      {
        id: 'user_106',
        name: 'Alex Johnson',
        title: 'Indie Developer',
        company: 'Solo Studio',
        photoURL: 'https://i.pravatar.cc/150?img=11',
        industry: 'Gaming',
        skills: ['Programming', 'Unity', 'C#', 'Pixel Art'],
        interests: ['Indie Games', 'Game Jams', 'Retro Gaming'],
        goals: ['find-publisher', 'meet-developers', 'find-mentor'],
        experience: 'junior',
        persona: 'developer',
        availability: 'Available now',
        location: 'Indie Corner'
      },
      {
        id: 'user_107',
        name: 'Rachel Green',
        title: 'Marketing Director',
        company: 'Mobile Games Co',
        photoURL: 'https://i.pravatar.cc/150?img=20',
        industry: 'Marketing',
        skills: ['UA', 'ASO', 'Performance Marketing', 'Analytics'],
        interests: ['Mobile Gaming', 'User Acquisition', 'Data'],
        goals: ['find-clients', 'partnerships', 'industry-trends'],
        experience: 'senior',
        persona: 'service',
        availability: 'Available tomorrow',
        location: 'Business Area'
      },
      {
        id: 'user_108',
        name: 'Tom Wilson',
        title: 'Game Producer',
        company: 'Mid-size Studio',
        photoURL: 'https://i.pravatar.cc/150?img=15',
        industry: 'Game Development',
        skills: ['Project Management', 'Agile', 'Team Leadership', 'Production'],
        interests: ['Game Production', 'Team Building', 'Process'],
        goals: ['find-talent', 'share-knowledge', 'partnerships'],
        experience: 'lead',
        persona: 'developer',
        availability: 'Available now',
        location: 'Hall 3, Studio Booth'
      }
    ];
  }
  
  async selectMatch(match) {
    this.selectedMatch = match;
    
    // Generate conversation starters
    this.conversationStarters = await conversationGenerator.generateConversationStarters(
      this.currentUser,
      match.user,
      match.compatibilityScore
    );
    
    // Mark as viewed
    match.status = 'viewed';
    
    this.render();
  }
  
  async sendConnectionRequest(match, starter) {
    try {
      // Simulate API call
      await this.simulateAPICall();
      
      // Update match status
      match.status = 'request_sent';
      match.connectionMessage = starter.starter;
      match.connectedAt = Date.now();
      
      // Save to connections
      const connections = JSON.parse(localStorage.getItem('connections') || '[]');
      connections.push({
        matchId: match.id,
        user: match.user,
        score: match.compatibilityScore,
        message: starter.starter,
        timestamp: Date.now()
      });
      localStorage.setItem('connections', JSON.stringify(connections));
      
      // Update AI weights based on positive action
      await this.compatibilityEngine.updateWeights(
        this.currentUser.id,
        {
          liked: true,
          breakdown: match.compatibilityScore.breakdown
        }
      );
      
      // Show success
      this.showSuccess(`Connection request sent to ${match.user.name}!`);
      
      // Close modal
      this.selectedMatch = null;
      this.render();
      
    } catch (error) {
      console.error('Failed to send connection request:', error);
      this.showError('Failed to send connection request. Please try again.');
    }
  }
  
  async refreshMatches() {
    await this.loadMatches();
    this.showSuccess('Matches refreshed!');
  }
  
  startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    this.updateInterval = setInterval(() => {
      this.checkForNewMatches();
    }, 30000);
  }
  
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  async checkForNewMatches() {
    // Simulate checking for new matches
    const hasNewMatches = Math.random() > 0.7;
    
    if (hasNewMatches) {
      const newMatchesCount = Math.floor(Math.random() * 3) + 1;
      this.showNotification(`${newMatchesCount} new matches available!`);
      
      // Add pulse animation to refresh button
      const refreshBtn = this.shadowRoot.querySelector('#refresh-btn');
      if (refreshBtn) {
        refreshBtn.classList.add('pulse');
        setTimeout(() => refreshBtn.classList.remove('pulse'), 3000);
      }
    }
  }
  
  filterMatches(filterType, value) {
    this.filters[filterType] = value;
    this.loadMatches();
  }
  
  simulateAPICall() {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
  
  showSuccess(message) {
    this.showToast(message, 'success');
  }
  
  showError(message) {
    this.showToast(message, 'error');
  }
  
  showNotification(message) {
    this.showToast(message, 'info');
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to shadow root
    this.shadowRoot.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      
      <div class="container">
        ${this.renderHeader()}
        ${this.renderFilters()}
        ${this.renderContent()}
        ${this.selectedMatch ? this.renderMatchModal() : ''}
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  renderHeader() {
    return `
      <div class="header">
        <div class="header-content">
          <div>
            <h1 class="title">Intelligent Matches</h1>
            <p class="subtitle">AI-powered connections based on your goals and interests</p>
          </div>
          <div class="header-actions">
            <button id="refresh-btn" class="btn btn-primary">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Matches</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderFilters() {
    return `
      <div class="filters">
        <select class="filter-select" id="filter-industry">
          <option value="all">All Industries</option>
          <option value="Gaming">Gaming</option>
          <option value="Technology">Technology</option>
          <option value="Publishing">Publishing</option>
          <option value="Investment">Investment</option>
        </select>
        
        <select class="filter-select" id="filter-experience">
          <option value="all">All Experience</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid-level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
          <option value="executive">Executive</option>
        </select>
        
        <select class="filter-select" id="filter-score">
          <option value="60">60%+ Match</option>
          <option value="70">70%+ Match</option>
          <option value="80">80%+ Match</option>
          <option value="90">90%+ Match</option>
        </select>
        
        <div class="match-count">
          ${this.matches.length} matches found
        </div>
      </div>
    `;
  }
  
  renderContent() {
    if (this.isLoading) {
      return this.renderLoadingState();
    }
    
    if (this.matches.length === 0) {
      return this.renderEmptyState();
    }
    
    return `
      <div class="matches-grid">
        ${this.matches.map(match => this.renderMatchCard(match)).join('')}
      </div>
    `;
  }
  
  renderMatchCard(match) {
    const statusClass = match.status === 'request_sent' ? 'connected' : '';
    const availabilityClass = match.user.availability === 'Available now' ? 'available' : 
                             match.user.availability === 'In a meeting' ? 'busy' : 'away';
    
    return `
      <div class="match-card ${statusClass}" data-match-id="${match.id}">
        <div class="match-header">
          <img class="match-avatar" src="${match.user.photoURL}" alt="${match.user.name}">
          <div class="match-availability ${availabilityClass}"></div>
        </div>
        
        <div class="match-body">
          <h3 class="match-name">${match.user.name}</h3>
          <p class="match-title">${match.user.title}</p>
          <p class="match-company">${match.user.company}</p>
          
          <div class="match-score">
            <div class="score-value">${match.compatibilityScore.overall}%</div>
            <div class="score-label">match</div>
          </div>
          
          <div class="match-tags">
            ${match.user.skills.slice(0, 3).map(skill => 
              `<span class="tag">${skill}</span>`
            ).join('')}
          </div>
          
          <div class="match-location">
            <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>${match.user.location || 'Conference Floor'}</span>
          </div>
        </div>
        
        <div class="match-footer">
          ${match.status === 'request_sent' ? `
            <button class="btn btn-success btn-full" disabled>
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M5 13l4 4L19 7" />
              </svg>
              Connected
            </button>
          ` : `
            <button class="btn btn-primary btn-full view-match-btn" data-match-id="${match.id}">
              View Match
            </button>
          `}
        </div>
      </div>
    `;
  }
  
  renderMatchModal() {
    const match = this.selectedMatch;
    if (!match) return '';
    
    return `
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Match Details</h2>
            <button class="modal-close" id="close-modal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Profile Section -->
            <div class="profile-section">
              <img class="profile-avatar" src="${match.user.photoURL}" alt="${match.user.name}">
              <div class="profile-info">
                <h3 class="profile-name">${match.user.name}</h3>
                <p class="profile-title">${match.user.title} at ${match.user.company}</p>
                <div class="profile-badges">
                  <span class="badge badge-score">${match.compatibilityScore.overall}% match</span>
                  <span class="badge badge-${match.user.availability === 'Available now' ? 'available' : 'busy'}">
                    ${match.user.availability}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Compatibility Breakdown -->
            <div class="compatibility-section">
              <h4 class="section-title">Compatibility Analysis</h4>
              <div class="compatibility-grid">
                <div class="compatibility-item">
                  <div class="compatibility-label">Professional</div>
                  <div class="compatibility-bar">
                    <div class="compatibility-fill" style="width: ${match.compatibilityScore.breakdown.professional}%"></div>
                  </div>
                  <div class="compatibility-value">${match.compatibilityScore.breakdown.professional}%</div>
                </div>
                <div class="compatibility-item">
                  <div class="compatibility-label">Personal</div>
                  <div class="compatibility-bar">
                    <div class="compatibility-fill" style="width: ${match.compatibilityScore.breakdown.personal}%"></div>
                  </div>
                  <div class="compatibility-value">${match.compatibilityScore.breakdown.personal}%</div>
                </div>
                <div class="compatibility-item">
                  <div class="compatibility-label">Contextual</div>
                  <div class="compatibility-bar">
                    <div class="compatibility-fill" style="width: ${match.compatibilityScore.breakdown.contextual}%"></div>
                  </div>
                  <div class="compatibility-value">${match.compatibilityScore.breakdown.contextual}%</div>
                </div>
                <div class="compatibility-item">
                  <div class="compatibility-label">Intent</div>
                  <div class="compatibility-bar">
                    <div class="compatibility-fill" style="width: ${match.compatibilityScore.breakdown.intent}%"></div>
                  </div>
                  <div class="compatibility-value">${match.compatibilityScore.breakdown.intent}%</div>
                </div>
              </div>
              
              <div class="reasoning-box">
                <p class="reasoning-text">${match.compatibilityScore.reasoning}</p>
              </div>
            </div>
            
            <!-- Skills & Interests -->
            <div class="details-grid">
              <div class="details-section">
                <h4 class="section-title">Skills</h4>
                <div class="tags-list">
                  ${match.user.skills.map(skill => 
                    `<span class="tag tag-skill">${skill}</span>`
                  ).join('')}
                </div>
              </div>
              
              <div class="details-section">
                <h4 class="section-title">Interests</h4>
                <div class="tags-list">
                  ${match.user.interests.map(interest => 
                    `<span class="tag tag-interest">${interest}</span>`
                  ).join('')}
                </div>
              </div>
            </div>
            
            <!-- Conversation Starters -->
            <div class="starters-section">
              <h4 class="section-title">Conversation Starters</h4>
              <p class="section-subtitle">Click to copy and send as your connection message</p>
              <div class="starters-list">
                ${this.conversationStarters.map((starter, index) => `
                  <div class="starter-card" data-starter-index="${index}">
                    <p class="starter-text">"${starter.starter}"</p>
                    <p class="starter-reasoning">${starter.reasoning}</p>
                    <button class="btn btn-secondary btn-small use-starter-btn" 
                            data-starter-index="${index}">
                      Use this starter
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
            <button class="btn btn-primary" id="connect-direct-btn">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send Quick Message
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderLoadingState() {
    return `
      <div class="matches-grid">
        ${Array(6).fill(0).map(() => `
          <div class="match-card skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  renderEmptyState() {
    return `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="empty-title">No matches found</h3>
        <p class="empty-text">
          Complete your profile to get better matches, or adjust your preferences
        </p>
        <button class="btn btn-primary" onclick="location.href='/register.html'">
          Complete Profile
        </button>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Refresh button
    this.shadowRoot.querySelector('#refresh-btn')?.addEventListener('click', () => {
      this.refreshMatches();
    });
    
    // Filter changes
    this.shadowRoot.querySelector('#filter-industry')?.addEventListener('change', (e) => {
      this.filterMatches('industry', e.target.value);
    });
    
    this.shadowRoot.querySelector('#filter-experience')?.addEventListener('change', (e) => {
      this.filterMatches('experience', e.target.value);
    });
    
    this.shadowRoot.querySelector('#filter-score')?.addEventListener('change', (e) => {
      this.filters.minScore = parseInt(e.target.value);
      this.loadMatches();
    });
    
    // View match buttons
    this.shadowRoot.querySelectorAll('.view-match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const matchId = btn.dataset.matchId;
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
          this.selectMatch(match);
        }
      });
    });
    
    // Modal controls
    this.shadowRoot.querySelector('#close-modal')?.addEventListener('click', () => {
      this.selectedMatch = null;
      this.render();
    });
    
    this.shadowRoot.querySelector('#cancel-btn')?.addEventListener('click', () => {
      this.selectedMatch = null;
      this.render();
    });
    
    // Use starter buttons
    this.shadowRoot.querySelectorAll('.use-starter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.starterIndex);
        const starter = this.conversationStarters[index];
        if (starter && this.selectedMatch) {
          this.sendConnectionRequest(this.selectedMatch, starter);
        }
      });
    });
    
    // Direct connect button
    this.shadowRoot.querySelector('#connect-direct-btn')?.addEventListener('click', () => {
      if (this.selectedMatch && this.conversationStarters[0]) {
        this.sendConnectionRequest(this.selectedMatch, this.conversationStarters[0]);
      }
    });
    
    // Click outside modal to close
    this.shadowRoot.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.selectedMatch = null;
        this.render();
      }
    });
  }
  
  getStyles() {
    return `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      * {
        box-sizing: border-box;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      /* Header */
      .header {
        margin-bottom: 2rem;
      }
      
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .title {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.25rem 0;
      }
      
      .subtitle {
        color: #6b7280;
        margin: 0;
      }
      
      /* Filters */
      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
      }
      
      .match-count {
        margin-left: auto;
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      /* Matches Grid */
      .matches-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }
      
      /* Match Card */
      .match-card {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .match-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
      }
      
      .match-card.connected {
        border: 2px solid #10b981;
      }
      
      .match-header {
        position: relative;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .match-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid white;
        object-fit: cover;
      }
      
      .match-availability {
        position: absolute;
        bottom: 30px;
        right: calc(50% - 45px);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
      }
      
      .match-availability.available {
        background: #10b981;
      }
      
      .match-availability.busy {
        background: #f59e0b;
      }
      
      .match-availability.away {
        background: #6b7280;
      }
      
      .match-body {
        padding: 1.5rem;
      }
      
      .match-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.25rem 0;
        text-align: center;
      }
      
      .match-title {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 0.125rem 0;
        text-align: center;
      }
      
      .match-company {
        font-size: 0.875rem;
        color: #9ca3af;
        margin: 0 0 1rem 0;
        text-align: center;
      }
      
      .match-score {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      
      .score-value {
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .score-label {
        color: #6b7280;
        font-size: 0.875rem;
      }
      
      .match-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1rem;
      }
      
      .match-location {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        color: #6b7280;
        font-size: 0.75rem;
      }
      
      .location-icon {
        width: 14px;
        height: 14px;
      }
      
      .match-footer {
        padding: 0 1.5rem 1.5rem;
      }
      
      /* Tags */
      .tag {
        background: #f3f4f6;
        color: #4b5563;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
      }
      
      .tag-skill {
        background: #dbeafe;
        color: #1e40af;
      }
      
      .tag-interest {
        background: #fce7f3;
        color: #9f1239;
      }
      
      /* Buttons */
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        border: none;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .btn-primary:hover {
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }
      
      .btn-secondary:hover {
        background: #e5e7eb;
      }
      
      .btn-success {
        background: #10b981;
        color: white;
      }
      
      .btn-full {
        width: 100%;
      }
      
      .btn-small {
        padding: 0.375rem 0.75rem;
        font-size: 0.8125rem;
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .icon {
        width: 20px;
        height: 20px;
      }
      
      /* Modal */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        z-index: 1000;
        animation: fadeIn 0.2s;
      }
      
      .modal {
        background: white;
        border-radius: 1rem;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 0.3s;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
      
      .modal-close {
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 0.5rem;
        transition: background 0.2s;
      }
      
      .modal-close:hover {
        background: #f3f4f6;
      }
      
      .modal-close svg {
        width: 20px;
        height: 20px;
        stroke: #6b7280;
      }
      
      .modal-body {
        padding: 1.5rem;
      }
      
      .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
      
      /* Profile Section */
      .profile-section {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .profile-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .profile-info {
        flex: 1;
      }
      
      .profile-name {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.5rem 0;
      }
      
      .profile-title {
        color: #6b7280;
        margin: 0 0 1rem 0;
      }
      
      .profile-badges {
        display: flex;
        gap: 0.5rem;
      }
      
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .badge-score {
        background: #dcfce7;
        color: #166534;
      }
      
      .badge-available {
        background: #d1fae5;
        color: #065f46;
      }
      
      .badge-busy {
        background: #fed7aa;
        color: #92400e;
      }
      
      /* Compatibility Section */
      .compatibility-section {
        margin-bottom: 2rem;
      }
      
      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 1rem 0;
      }
      
      .section-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: -0.5rem 0 1rem 0;
      }
      
      .compatibility-grid {
        display: grid;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      
      .compatibility-item {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      .compatibility-label {
        flex: 0 0 100px;
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .compatibility-bar {
        flex: 1;
        height: 8px;
        background: #e5e7eb;
        border-radius: 9999px;
        overflow: hidden;
      }
      
      .compatibility-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
        border-radius: 9999px;
        transition: width 0.5s ease;
      }
      
      .compatibility-value {
        flex: 0 0 40px;
        text-align: right;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
      }
      
      .reasoning-box {
        background: #eff6ff;
        border: 1px solid #dbeafe;
        border-radius: 0.5rem;
        padding: 1rem;
      }
      
      .reasoning-text {
        color: #1e40af;
        font-size: 0.875rem;
        margin: 0;
        line-height: 1.5;
      }
      
      /* Details Grid */
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      
      .details-section {
        
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      /* Conversation Starters */
      .starters-section {
        
      }
      
      .starters-list {
        display: grid;
        gap: 1rem;
      }
      
      .starter-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        transition: all 0.2s;
      }
      
      .starter-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }
      
      .starter-text {
        color: #111827;
        font-size: 0.875rem;
        margin: 0 0 0.5rem 0;
        line-height: 1.5;
        font-style: italic;
      }
      
      .starter-reasoning {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0 0 0.75rem 0;
      }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
      }
      
      .empty-icon {
        width: 80px;
        height: 80px;
        stroke: #9ca3af;
        margin: 0 auto 1.5rem;
      }
      
      .empty-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.5rem 0;
      }
      
      .empty-text {
        color: #6b7280;
        margin: 0 0 1.5rem 0;
      }
      
      /* Loading State */
      .skeleton {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .skeleton-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #e5e7eb;
        margin: 20px auto;
      }
      
      .skeleton-line {
        height: 12px;
        background: #e5e7eb;
        border-radius: 0.25rem;
        margin: 0.5rem 1.5rem;
      }
      
      .skeleton-line.short {
        width: 60%;
        margin: 0.5rem auto;
      }
      
      /* Toast */
      .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-size: 0.875rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 2000;
      }
      
      .toast.show {
        transform: translateX(0);
      }
      
      .toast-success {
        background: #10b981;
      }
      
      .toast-error {
        background: #ef4444;
      }
      
      .toast-info {
        background: #3b82f6;
      }
      
      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      
      .pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .container {
          padding: 1rem;
        }
        
        .matches-grid {
          grid-template-columns: 1fr;
        }
        
        .details-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .profile-section {
          flex-direction: column;
          text-align: center;
        }
        
        .modal {
          max-height: 100vh;
          border-radius: 0;
        }
      }
    `;
  }
}

// Register the component
customElements.define('realtime-matching-ui', RealtimeMatchingUI);