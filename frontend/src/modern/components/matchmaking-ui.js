/**
 * Matchmaking UI Component
 * Interactive interface for AI-powered networking matches
 */

import { CompatibilityEngine } from '../matching/compatibility-engine.js';
import { conversationGenerator } from '../matching/conversation-generator.js';

export class MatchmakingUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.compatibilityEngine = new CompatibilityEngine();
    this.matches = [];
    this.currentMatchIndex = 0;
    this.userProfile = null;
  }
  
  async connectedCallback() {
    // Load user profile
    this.userProfile = await this.loadUserProfile();
    
    // Find matches
    await this.findMatches();
    
    // Render UI
    this.render();
    this.attachEventListeners();
  }
  
  async loadUserProfile() {
    // Try to get from localStorage or session
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default profile for testing
    return {
      id: 'user_' + Date.now(),
      name: 'Current User',
      title: 'Software Engineer',
      company: 'Tech Corp',
      industry: 'Technology',
      skills: ['JavaScript', 'React', 'Node.js'],
      interests: ['Gaming', 'AI', 'Web Development'],
      goals: ['find-collaborators', 'learn-tech'],
      experience: 'mid',
      persona: 'developer',
      conferences: ['gamescom2025']
    };
  }
  
  async findMatches() {
    // Get potential matches (in production, this would come from an API)
    const potentialMatches = await this.getPotentialMatches();
    
    // Calculate compatibility scores
    const scoredMatches = await Promise.all(
      potentialMatches.map(async (candidate) => {
        const score = await this.compatibilityEngine.calculateCompatibility(
          this.userProfile,
          candidate
        );
        
        // Generate conversation starters
        const starters = await conversationGenerator.generateConversationStarters(
          this.userProfile,
          candidate,
          score
        );
        
        return {
          profile: candidate,
          score,
          starters
        };
      })
    );
    
    // Sort by overall score
    this.matches = scoredMatches
      .filter(m => m.score.overall > 30) // Minimum threshold
      .sort((a, b) => b.score.overall - a.score.overall)
      .slice(0, 20); // Top 20 matches
  }
  
  async getPotentialMatches() {
    // Mock data for demonstration
    return [
      {
        id: 'user_001',
        name: 'Sarah Chen',
        title: 'Game Designer',
        company: 'Indie Studio',
        industry: 'Gaming',
        skills: ['Unity', 'Game Design', 'Level Design'],
        interests: ['Gaming', 'VR', 'Storytelling'],
        goals: ['find-collaborators', 'showcase-solutions'],
        experience: 'senior',
        persona: 'developer',
        photo: 'https://i.pravatar.cc/150?img=1',
        conferences: ['gamescom2025']
      },
      {
        id: 'user_002',
        name: 'Michael Rodriguez',
        title: 'Publisher Relations',
        company: 'Major Publisher',
        industry: 'Publishing',
        skills: ['Business Development', 'Marketing', 'Analytics'],
        interests: ['Gaming', 'Esports', 'Mobile Gaming'],
        goals: ['find-games', 'meet-developers'],
        experience: 'lead',
        persona: 'publisher',
        photo: 'https://i.pravatar.cc/150?img=2',
        conferences: ['gamescom2025']
      },
      {
        id: 'user_003',
        name: 'Emma Watson',
        title: 'Technical Artist',
        company: 'AAA Studio',
        industry: 'Game Development',
        skills: ['3D Modeling', 'Shaders', 'Unreal Engine'],
        interests: ['Art', 'Technology', 'Gaming'],
        goals: ['learn-tech', 'find-collaborators'],
        experience: 'mid',
        persona: 'developer',
        photo: 'https://i.pravatar.cc/150?img=3',
        conferences: ['gamescom2025']
      },
      {
        id: 'user_004',
        name: 'David Kim',
        title: 'Venture Partner',
        company: 'Gaming Ventures',
        industry: 'Investment',
        skills: ['Investment', 'Due Diligence', 'Strategy'],
        interests: ['Startups', 'Gaming', 'Technology'],
        goals: ['find-investments', 'meet-founders'],
        experience: 'executive',
        persona: 'investor',
        photo: 'https://i.pravatar.cc/150?img=4',
        conferences: ['gamescom2025']
      },
      {
        id: 'user_005',
        name: 'Lisa Zhang',
        title: 'Community Manager',
        company: 'Online Gaming Co',
        industry: 'Gaming',
        skills: ['Community Building', 'Social Media', 'Content Creation'],
        interests: ['Gaming', 'Streaming', 'Esports'],
        goals: ['partnerships', 'industry-trends'],
        experience: 'mid',
        persona: 'service',
        photo: 'https://i.pravatar.cc/150?img=5',
        conferences: ['gamescom2025']
      }
    ];
  }
  
  render() {
    const currentMatch = this.matches[this.currentMatchIndex];
    
    if (!currentMatch) {
      this.renderNoMatches();
      return;
    }
    
    const { profile, score, starters } = currentMatch;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          text-align: center;
        }
        
        .header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }
        
        .match-count {
          opacity: 0.9;
          font-size: 0.875rem;
        }
        
        .match-card {
          padding: 1.5rem;
        }
        
        .profile-section {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .profile-image {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #e5e7eb;
        }
        
        .profile-info {
          flex: 1;
        }
        
        .profile-name {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }
        
        .profile-title {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
        }
        
        .profile-company {
          color: #9ca3af;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        
        .tag {
          background: #f3f4f6;
          color: #4b5563;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }
        
        .compatibility-section {
          background: #f9fafb;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .compatibility-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .compatibility-score {
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .compatibility-label {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .confidence {
          text-align: right;
        }
        
        .confidence-value {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .breakdown {
          display: grid;
          gap: 0.75rem;
        }
        
        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .breakdown-label {
          flex: 0 0 100px;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .breakdown-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .breakdown-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          border-radius: 9999px;
          transition: width 0.5s ease;
        }
        
        .breakdown-value {
          flex: 0 0 40px;
          text-align: right;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
        }
        
        .reasoning {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }
        
        .starters-section {
          margin-bottom: 1.5rem;
        }
        
        .starters-header {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 1rem 0;
        }
        
        .starter {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .starter:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }
        
        .starter-text {
          color: #1f2937;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
        }
        
        .starter-reasoning {
          color: #9ca3af;
          font-size: 0.75rem;
          font-style: italic;
        }
        
        .copy-hint {
          display: inline-block;
          margin-left: 0.5rem;
          color: #3b82f6;
          font-size: 0.75rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .starter:hover .copy-hint {
          opacity: 1;
        }
        
        .actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-skip {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .btn-skip:hover {
          background: #e5e7eb;
        }
        
        .btn-connect {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-connect:hover {
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .no-matches {
          padding: 3rem;
          text-align: center;
        }
        
        .no-matches-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          opacity: 0.3;
        }
        
        .no-matches-text {
          color: #6b7280;
          margin: 0;
        }
        
        .success-message {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transform: translateX(400px);
          transition: transform 0.3s ease;
          z-index: 1000;
        }
        
        .success-message.show {
          transform: translateX(0);
        }
      </style>
      
      <div class="container">
        <div class="header">
          <h2>AI-Powered Matches</h2>
          <div class="match-count">
            Match ${this.currentMatchIndex + 1} of ${this.matches.length}
          </div>
        </div>
        
        <div class="match-card">
          <!-- Profile Section -->
          <div class="profile-section">
            <img class="profile-image" 
                 src="${profile.photo || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)}" 
                 alt="${profile.name}">
            <div class="profile-info">
              <h3 class="profile-name">${profile.name}</h3>
              <p class="profile-title">${profile.title}</p>
              <p class="profile-company">${profile.company}</p>
              <div class="tags">
                ${profile.skills?.slice(0, 3).map(skill => 
                  `<span class="tag">${skill}</span>`
                ).join('') || ''}
              </div>
            </div>
          </div>
          
          <!-- Compatibility Section -->
          <div class="compatibility-section">
            <div class="compatibility-header">
              <div>
                <div class="compatibility-score">${score.overall}%</div>
                <div class="compatibility-label">Match Score</div>
              </div>
              <div class="confidence">
                <div class="confidence-value">${score.confidence}% confidence</div>
              </div>
            </div>
            
            <div class="breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">Professional</span>
                <div class="breakdown-bar">
                  <div class="breakdown-fill" style="width: ${score.breakdown.professional}%"></div>
                </div>
                <span class="breakdown-value">${score.breakdown.professional}%</span>
              </div>
              
              <div class="breakdown-item">
                <span class="breakdown-label">Personal</span>
                <div class="breakdown-bar">
                  <div class="breakdown-fill" style="width: ${score.breakdown.personal}%"></div>
                </div>
                <span class="breakdown-value">${score.breakdown.personal}%</span>
              </div>
              
              <div class="breakdown-item">
                <span class="breakdown-label">Contextual</span>
                <div class="breakdown-bar">
                  <div class="breakdown-fill" style="width: ${score.breakdown.contextual}%"></div>
                </div>
                <span class="breakdown-value">${score.breakdown.contextual}%</span>
              </div>
              
              <div class="breakdown-item">
                <span class="breakdown-label">Intent</span>
                <div class="breakdown-bar">
                  <div class="breakdown-fill" style="width: ${score.breakdown.intent}%"></div>
                </div>
                <span class="breakdown-value">${score.breakdown.intent}%</span>
              </div>
            </div>
            
            <div class="reasoning">
              ${score.reasoning}
            </div>
          </div>
          
          <!-- Conversation Starters -->
          <div class="starters-section">
            <h4 class="starters-header">Conversation Starters (click to copy)</h4>
            ${starters.map((starter, index) => `
              <div class="starter" data-index="${index}">
                <p class="starter-text">
                  "${starter.starter}"
                  <span class="copy-hint">Click to copy</span>
                </p>
                <div class="starter-reasoning">${starter.reasoning}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-skip" id="skip-btn">Skip</button>
          <button class="btn btn-connect" id="connect-btn">Connect</button>
        </div>
      </div>
      
      <!-- Success Message -->
      <div class="success-message" id="success-message">
        Copied to clipboard!
      </div>
    `;
  }
  
  renderNoMatches() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .container {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          text-align: center;
        }
        
        .icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          opacity: 0.3;
        }
        
        h3 {
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        
        p {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
        }
        
        .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }
      </style>
      
      <div class="container">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3>No More Matches</h3>
        <p>You've reviewed all available matches. Check back later for new connections!</p>
        <button class="btn" onclick="location.reload()">Refresh Matches</button>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Skip button
    this.shadowRoot.querySelector('#skip-btn')?.addEventListener('click', () => {
      this.nextMatch();
    });
    
    // Connect button
    this.shadowRoot.querySelector('#connect-btn')?.addEventListener('click', () => {
      this.connectWithMatch();
    });
    
    // Conversation starter copy
    this.shadowRoot.querySelectorAll('.starter').forEach(starter => {
      starter.addEventListener('click', (e) => {
        const index = parseInt(starter.dataset.index);
        this.copyStarter(index);
      });
    });
  }
  
  nextMatch() {
    this.currentMatchIndex++;
    
    if (this.currentMatchIndex >= this.matches.length) {
      this.currentMatchIndex = 0; // Loop back or show no more matches
    }
    
    this.render();
    this.attachEventListeners();
  }
  
  async connectWithMatch() {
    const currentMatch = this.matches[this.currentMatchIndex];
    
    // Save connection
    const connections = JSON.parse(localStorage.getItem('connections') || '[]');
    connections.push({
      profile: currentMatch.profile,
      score: currentMatch.score,
      connectedAt: new Date().toISOString()
    });
    localStorage.setItem('connections', JSON.stringify(connections));
    
    // Update weights based on positive feedback
    await this.compatibilityEngine.updateWeights(
      this.userProfile.id,
      {
        liked: true,
        breakdown: currentMatch.score.breakdown
      }
    );
    
    // Show success and move to next
    this.showSuccess('Connection saved! They will be notified.');
    
    setTimeout(() => {
      this.nextMatch();
    }, 2000);
  }
  
  copyStarter(index) {
    const match = this.matches[this.currentMatchIndex];
    const starter = match.starters[index];
    
    // Copy to clipboard
    navigator.clipboard.writeText(starter.starter).then(() => {
      // Track usage
      conversationGenerator.trackUsage(
        this.userProfile.id,
        match.profile.id,
        starter.starter,
        true
      );
      
      // Show success message
      this.showSuccess('Copied to clipboard!');
    });
  }
  
  showSuccess(message) {
    const successEl = this.shadowRoot.querySelector('#success-message');
    if (successEl) {
      successEl.textContent = message;
      successEl.classList.add('show');
      
      setTimeout(() => {
        successEl.classList.remove('show');
      }, 3000);
    }
  }
}

// Register the component
customElements.define('matchmaking-ui', MatchmakingUI);