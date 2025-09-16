/**
 * Gathering UI Components
 * Smart gathering creation and management interface
 */

import { gatheringEngine } from '../gatherings/gathering-engine.js';

// Gathering Creation Component
export class GatheringCreator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentUser = null;
  }
  
  connectedCallback() {
    this.loadCurrentUser();
    this.render();
    this.setupEventListeners();
  }
  
  loadCurrentUser() {
    // Load from localStorage or auth system
    const stored = localStorage.getItem('current_user');
    this.currentUser = stored ? JSON.parse(stored) : {
      id: 'user_current',
      name: 'John Developer',
      title: 'Senior Developer',
      company: 'Tech Startup',
      interests: ['AI', 'Gaming', 'Web3'],
      goals: ['networking', 'find-collaborators']
    };
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .creator-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        h2 {
          margin: 0 0 24px 0;
          font-size: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .quick-btn {
          padding: 16px;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .quick-btn:hover {
          background: white;
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .quick-btn.selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .quick-btn-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .quick-btn-label {
          font-size: 14px;
          font-weight: 500;
        }
        
        .quick-btn-time {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        
        input, textarea, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        
        .timing-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        input[type="checkbox"] {
          width: auto;
        }
        
        .advanced-options {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        
        .advanced-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .advanced-content {
          margin-top: 16px;
          display: none;
        }
        
        .advanced-content.show {
          display: block;
        }
        
        .targeting-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .chip {
          padding: 6px 12px;
          background: #e5e7eb;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .chip.selected {
          background: #667eea;
          color: white;
        }
        
        .create-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .ai-suggestion {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .ai-icon {
          font-size: 20px;
        }
      </style>
      
      <div class="creator-container">
        <h2>Create Smart Gathering ✨</h2>
        
        <div class="quick-actions">
          <button class="quick-btn" data-type="coffee">
            <div class="quick-btn-icon">☕</div>
            <div class="quick-btn-label">Coffee Chat</div>
            <div class="quick-btn-time">30 min</div>
          </button>
          
          <button class="quick-btn" data-type="demo">
            <div class="quick-btn-icon">🎮</div>
            <div class="quick-btn-label">Demo Session</div>
            <div class="quick-btn-time">45 min</div>
          </button>
          
          <button class="quick-btn" data-type="discussion">
            <div class="quick-btn-icon">💬</div>
            <div class="quick-btn-label">Discussion</div>
            <div class="quick-btn-time">60 min</div>
          </button>
          
          <button class="quick-btn" data-type="networking">
            <div class="quick-btn-icon">🤝</div>
            <div class="quick-btn-label">Networking</div>
            <div class="quick-btn-time">45 min</div>
          </button>
        </div>
        
        <div class="ai-suggestion" style="display: none;">
          <span class="ai-icon">💡</span>
          <span class="suggestion-text"></span>
        </div>
        
        <form id="gathering-form">
          <div class="form-group">
            <label for="title">What's the gathering about?</label>
            <input type="text" id="title" placeholder="e.g., Quick chat about indie game marketing" required>
          </div>
          
          <div class="form-group">
            <label for="description">Add more details (AI will help with targeting)</label>
            <textarea id="description" placeholder="What do you want to discuss? Who would be ideal to join?"></textarea>
          </div>
          
          <div class="form-group">
            <label>When?</label>
            <div class="timing-options">
              <select id="timing">
                <option value="now">Right now</option>
                <option value="15">In 15 minutes</option>
                <option value="30">In 30 minutes</option>
                <option value="60">In 1 hour</option>
                <option value="120">In 2 hours</option>
                <option value="custom">Custom time</option>
              </select>
              
              <div class="checkbox-group">
                <input type="checkbox" id="flexible" checked>
                <label for="flexible">Flexible timing</label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Group Size</label>
            <div class="timing-options">
              <select id="min-attendees">
                <option value="2">Min: 2 people</option>
                <option value="3">Min: 3 people</option>
                <option value="4">Min: 4 people</option>
              </select>
              
              <select id="max-attendees">
                <option value="4">Max: 4 people</option>
                <option value="6">Max: 6 people</option>
                <option value="8" selected>Max: 8 people</option>
                <option value="12">Max: 12 people</option>
              </select>
            </div>
          </div>
          
          <div class="advanced-options">
            <div class="advanced-toggle">
              <span>⚙️ Advanced Targeting</span>
              <span class="toggle-arrow">▼</span>
            </div>
            
            <div class="advanced-content">
              <div class="form-group">
                <label>Target Profiles</label>
                <div class="targeting-chips">
                  <span class="chip" data-profile="Developer">Developers</span>
                  <span class="chip" data-profile="Designer">Designers</span>
                  <span class="chip" data-profile="Product Manager">Product Managers</span>
                  <span class="chip" data-profile="Executive">Executives</span>
                  <span class="chip" data-profile="Marketing">Marketing</span>
                  <span class="chip selected" data-profile="Any">Anyone</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="auto-accept">Auto-accept threshold (match score)</label>
                <input type="range" id="auto-accept" min="50" max="95" value="75">
                <span id="threshold-value">75%</span>
              </div>
            </div>
          </div>
          
          <button type="submit" class="create-btn">Create Smart Gathering 🚀</button>
        </form>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Quick action buttons
    this.shadowRoot.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectQuickAction(e.target.closest('.quick-btn'));
      });
    });
    
    // Advanced toggle
    const advancedToggle = this.shadowRoot.querySelector('.advanced-toggle');
    advancedToggle.addEventListener('click', () => {
      const content = this.shadowRoot.querySelector('.advanced-content');
      content.classList.toggle('show');
      const arrow = this.shadowRoot.querySelector('.toggle-arrow');
      arrow.textContent = content.classList.contains('show') ? '▲' : '▼';
    });
    
    // Targeting chips
    this.shadowRoot.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        // If selecting "Any", deselect others
        if (chip.dataset.profile === 'Any') {
          this.shadowRoot.querySelectorAll('.chip').forEach(c => {
            c.classList.remove('selected');
          });
          chip.classList.add('selected');
        } else {
          // Deselect "Any" if selecting specific profile
          this.shadowRoot.querySelector('.chip[data-profile="Any"]').classList.remove('selected');
          chip.classList.toggle('selected');
        }
      });
    });
    
    // Auto-accept threshold slider
    const slider = this.shadowRoot.querySelector('#auto-accept');
    const value = this.shadowRoot.querySelector('#threshold-value');
    slider.addEventListener('input', () => {
      value.textContent = `${slider.value}%`;
    });
    
    // Form submission
    const form = this.shadowRoot.querySelector('#gathering-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.createGathering();
    });
    
    // Title input for AI suggestions
    const titleInput = this.shadowRoot.querySelector('#title');
    let suggestionTimeout;
    titleInput.addEventListener('input', () => {
      clearTimeout(suggestionTimeout);
      suggestionTimeout = setTimeout(() => {
        this.generateSuggestion(titleInput.value);
      }, 500);
    });
  }
  
  selectQuickAction(btn) {
    // Clear previous selection
    this.shadowRoot.querySelectorAll('.quick-btn').forEach(b => {
      b.classList.remove('selected');
    });
    
    // Select new
    btn.classList.add('selected');
    
    // Pre-fill form based on type
    const type = btn.dataset.type;
    const templates = {
      coffee: {
        title: 'Quick Coffee Chat',
        description: 'Casual conversation about our work and experiences',
        duration: 30
      },
      demo: {
        title: 'Demo Session',
        description: "I'll be showing my latest project. Looking for feedback and insights!",
        duration: 45
      },
      discussion: {
        title: 'Industry Discussion',
        description: 'Deep dive into current trends and future of gaming',
        duration: 60
      },
      networking: {
        title: 'Networking Meetup',
        description: 'Connect with fellow professionals and share experiences',
        duration: 45
      }
    };
    
    const template = templates[type];
    if (template) {
      this.shadowRoot.querySelector('#title').value = template.title;
      this.shadowRoot.querySelector('#description').value = template.description;
    }
  }
  
  async generateSuggestion(title) {
    if (!title || title.length < 5) {
      this.hideSuggestion();
      return;
    }
    
    // Generate AI-like suggestion based on title
    const suggestions = {
      'coffee': '💡 Pro tip: Coffee chats work best with 2-4 people for intimate conversations',
      'demo': '💡 Include tech stack in description to attract relevant developers',
      'discussion': '💡 Mention specific topics to attract thought leaders',
      'networking': '💡 Keep it casual and open to maximize connections',
      'game': '💡 Specify genre or platform to find your tribe',
      'indie': '💡 Indie developers love sharing experiences - mention your project!',
      'startup': '💡 Founders are most active in the morning - schedule accordingly',
      'investment': '💡 Target executives and business developers for funding discussions'
    };
    
    let suggestion = null;
    for (const [keyword, text] of Object.entries(suggestions)) {
      if (title.toLowerCase().includes(keyword)) {
        suggestion = text;
        break;
      }
    }
    
    if (suggestion) {
      this.showSuggestion(suggestion);
    } else {
      this.hideSuggestion();
    }
  }
  
  showSuggestion(text) {
    const suggestionDiv = this.shadowRoot.querySelector('.ai-suggestion');
    const suggestionText = this.shadowRoot.querySelector('.suggestion-text');
    suggestionText.textContent = text;
    suggestionDiv.style.display = 'flex';
  }
  
  hideSuggestion() {
    const suggestionDiv = this.shadowRoot.querySelector('.ai-suggestion');
    suggestionDiv.style.display = 'none';
  }
  
  async createGathering() {
    const form = this.shadowRoot.querySelector('#gathering-form');
    const submitBtn = this.shadowRoot.querySelector('.create-btn');
    
    // Get form values
    const selectedType = this.shadowRoot.querySelector('.quick-btn.selected');
    const type = selectedType ? selectedType.dataset.type : 'networking';
    
    const timingValue = this.shadowRoot.querySelector('#timing').value;
    let preferredTime = new Date();
    if (timingValue !== 'now' && timingValue !== 'custom') {
      preferredTime = new Date(Date.now() + parseInt(timingValue) * 60 * 1000);
    }
    
    // Get selected profiles
    const selectedProfiles = Array.from(
      this.shadowRoot.querySelectorAll('.chip.selected[data-profile]')
    ).map(chip => chip.dataset.profile);
    
    const request = {
      creatorId: this.currentUser.id,
      creatorProfile: this.currentUser,
      title: form.title.value,
      description: form.description.value,
      type: type,
      preferredTime: preferredTime,
      flexibleTiming: form.flexible.checked,
      minAttendees: parseInt(form['min-attendees'].value),
      maxAttendees: parseInt(form['max-attendees'].value),
      targetProfiles: selectedProfiles,
      autoAcceptThreshold: parseInt(this.shadowRoot.querySelector('#auto-accept').value)
    };
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    try {
      // Initialize engine if needed
      if (!gatheringEngine.isInitialized) {
        await gatheringEngine.initialize();
      }
      
      // Create gathering
      const gathering = await gatheringEngine.createGathering(request);
      
      console.log('Gathering created:', gathering);
      
      // Show success and redirect
      submitBtn.textContent = '✅ Created!';
      
      // Dispatch event
      this.dispatchEvent(new CustomEvent('gathering-created', {
        detail: gathering,
        bubbles: true
      }));
      
      // Reset form after delay
      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Smart Gathering 🚀';
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create gathering:', error);
      submitBtn.textContent = '❌ Failed';
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Smart Gathering 🚀';
      }, 2000);
    }
  }
}

// Gathering Card Component
export class GatheringCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.gathering = null;
    this.updateInterval = null;
  }
  
  connectedCallback() {
    this.gathering = this.data || null;
    this.render();
    this.startUpdates();
  }
  
  disconnectedCallback() {
    this.stopUpdates();
  }
  
  set data(gathering) {
    this.gathering = gathering;
    if (this.shadowRoot) {
      this.render();
    }
  }
  
  render() {
    if (!this.gathering) return;
    
    const g = this.gathering;
    const timeUntil = new Date(g.timing.preferred) - new Date();
    const timeStr = this.formatTimeUntil(timeUntil);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
        
        .card-type {
          padding: 4px 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .card-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        
        .card-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }
        
        .meta-icon {
          font-size: 16px;
        }
        
        .attendees {
          margin-bottom: 16px;
        }
        
        .attendees-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .attendees-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .attendee {
          padding: 4px 10px;
          background: #f3f4f6;
          border-radius: 16px;
          font-size: 12px;
          color: #4b5563;
        }
        
        .attendee.pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .attendee.you {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .action-btn.secondary {
          background: #f3f4f6;
          color: #4b5563;
        }
        
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-inviting {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-confirmed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-active {
          background: #fce7f3;
          color: #9f1239;
        }
        
        .status-full {
          background: #e5e7eb;
          color: #374151;
        }
        
        .momentum-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          margin-top: 12px;
          overflow: hidden;
        }
        
        .momentum-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
          transition: width 0.3s;
        }
      </style>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${g.title}</h3>
          <span class="card-type">${this.formatType(g.type)}</span>
        </div>
        
        <p class="card-description">${g.description}</p>
        
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-icon">⏰</span>
            <span>${timeStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span>${g.location || 'TBD'}</span>
          </div>
          <div class="meta-item">
            <span class="status-badge status-${g.status}">${g.status}</span>
          </div>
        </div>
        
        <div class="attendees">
          <div class="attendees-label">
            Attendees (${g.attendees.accepted.length}/${g.maxAttendees})
          </div>
          <div class="attendees-list">
            ${this.renderAttendees(g)}
          </div>
        </div>
        
        <div class="momentum-bar">
          <div class="momentum-fill" style="width: ${g.metadata.momentum}%"></div>
        </div>
        
        <div class="card-actions">
          ${this.renderActions(g)}
        </div>
      </div>
    `;
  }
  
  renderAttendees(gathering) {
    const currentUserId = this.getCurrentUserId();
    let html = '';
    
    // Show accepted attendees
    gathering.attendees.accepted.forEach(userId => {
      const isYou = userId === currentUserId;
      html += `<span class="attendee ${isYou ? 'you' : ''}">${isYou ? 'You' : this.getUserName(userId)}</span>`;
    });
    
    // Show pending count
    if (gathering.attendees.pending.length > 0) {
      html += `<span class="attendee pending">+${gathering.attendees.pending.length} pending</span>`;
    }
    
    return html;
  }
  
  renderActions(gathering) {
    const currentUserId = this.getCurrentUserId();
    const isCreator = gathering.creatorId === currentUserId;
    const isAttending = gathering.attendees.accepted.includes(currentUserId);
    
    if (isCreator) {
      return `
        <button class="action-btn secondary">Manage</button>
        <button class="action-btn primary">Share</button>
      `;
    } else if (isAttending) {
      return `
        <button class="action-btn secondary">Leave</button>
        <button class="action-btn primary">View Details</button>
      `;
    } else {
      return `
        <button class="action-btn primary">Request to Join</button>
      `;
    }
  }
  
  formatType(type) {
    const types = {
      coffee: '☕ Coffee',
      demo: '🎮 Demo',
      discussion: '💬 Discussion',
      networking: '🤝 Networking'
    };
    return types[type] || type;
  }
  
  formatTimeUntil(ms) {
    if (ms < 0) return 'Started';
    
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `In ${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `In ${minutes} min`;
    } else {
      return 'Starting soon';
    }
  }
  
  getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('current_user') || '{}');
    return user.id || 'user_current';
  }
  
  getUserName(userId) {
    // In production, would fetch from user service
    const names = {
      'user_001': 'Sarah',
      'user_002': 'Michael',
      'user_003': 'Emma',
      'user_004': 'David',
      'user_005': 'Lisa'
    };
    return names[userId] || 'User';
  }
  
  startUpdates() {
    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      if (this.gathering) {
        this.render();
      }
    }, 30000);
  }
  
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Register custom elements
customElements.define('gathering-creator', GatheringCreator);
customElements.define('gathering-card', GatheringCard);