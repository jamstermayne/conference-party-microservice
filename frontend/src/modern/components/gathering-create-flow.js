/**
 * Gathering Creation Flow Component
 * Multi-step gathering creation with real-time targeting preview
 */

import { gatheringEngine } from '../gatherings/gathering-engine.js';

export class GatheringCreateFlow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentStep = 1;
    this.gatheringRequest = {
      title: '',
      description: '',
      type: 'coffee',
      maxAttendees: 6,
      location: 'Conference lobby',
      preferredTime: 'now',
      duration: 30,
      flexibleTiming: true
    };
    this.estimatedAttendees = 0;
    this.targetingPreview = [];
    this.isCreating = false;
    this.previewTimeout = null;
    this.currentUser = this.loadCurrentUser();
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
  
  disconnectedCallback() {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
    }
  }
  
  loadCurrentUser() {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : {
      id: 'user_current',
      name: 'John Developer',
      title: 'Senior Developer',
      company: 'Tech Startup'
    };
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 680px;
          margin: 0 auto;
          padding: 32px 16px;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .container {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        
        /* Progress Indicator */
        .progress {
          margin-bottom: 48px;
        }
        
        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .progress-step {
          display: flex;
          align-items: center;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .step-circle.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .step-circle.completed {
          background: #10b981;
          color: white;
        }
        
        .step-circle.pending {
          background: #e5e7eb;
          color: #9ca3af;
        }
        
        .step-line {
          width: 80px;
          height: 2px;
          margin: 0 8px;
          transition: all 0.3s;
        }
        
        .step-line.completed {
          background: #10b981;
        }
        
        .step-line.pending {
          background: #e5e7eb;
        }
        
        .progress-label {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        
        /* Step Content */
        .step-content {
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 32px 0;
        }
        
        /* Step 1: Type Selection */
        .type-grid {
          display: grid;
          gap: 16px;
        }
        
        .type-card {
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
        }
        
        .type-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        
        .type-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
        }
        
        .type-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }
        
        .type-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
        }
        
        .type-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .type-desc {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }
        
        /* Step 2: Details */
        .form-group {
          margin-bottom: 24px;
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
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
          font-family: inherit;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        /* Targeting Preview */
        .targeting-preview {
          background: linear-gradient(135deg, #10b98108 0%, #065f4608 100%);
          border: 1px solid #10b981;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .targeting-title {
          font-size: 16px;
          font-weight: 600;
          color: #065f46;
          margin-bottom: 12px;
        }
        
        .targeting-profiles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .profile-chip {
          padding: 6px 12px;
          background: white;
          border: 1px solid #10b981;
          border-radius: 20px;
          font-size: 13px;
          color: #065f46;
        }
        
        /* Step 3: Review */
        .review-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        
        .review-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }
        
        .review-desc {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        
        .review-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .meta-icon {
          font-size: 18px;
        }
        
        .next-steps {
          background: linear-gradient(135deg, #3b82f608 0%, #1e40af08 100%);
          border: 1px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        
        .next-steps-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 12px;
        }
        
        .next-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .next-steps-item {
          font-size: 14px;
          color: #1e40af;
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }
        
        .next-steps-item::before {
          content: '✓';
          position: absolute;
          left: 0;
        }
        
        /* Buttons */
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }
        
        .btn {
          flex: 1;
          padding: 14px 24px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #4b5563;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-icon {
          font-size: 20px;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .container {
            padding: 24px 16px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .step-line {
            width: 40px;
          }
        }
      </style>
      
      <div class="container">
        <!-- Progress Indicator -->
        <div class="progress">
          <div class="progress-steps">
            ${this.renderProgressSteps()}
          </div>
          <div class="progress-label">
            ${this.getStepLabel()}
          </div>
        </div>
        
        <!-- Step Content -->
        <div class="step-content">
          ${this.renderStepContent()}
        </div>
      </div>
    `;
  }
  
  renderProgressSteps() {
    const steps = [1, 2, 3];
    let html = '';
    
    steps.forEach((step, index) => {
      const status = step < this.currentStep ? 'completed' : 
                    step === this.currentStep ? 'active' : 'pending';
      
      html += `
        <div class="progress-step">
          <div class="step-circle ${status}">
            ${status === 'completed' ? '✓' : step}
          </div>
          ${index < steps.length - 1 ? `
            <div class="step-line ${step < this.currentStep ? 'completed' : 'pending'}"></div>
          ` : ''}
        </div>
      `;
    });
    
    return html;
  }
  
  getStepLabel() {
    switch (this.currentStep) {
      case 1: return 'Choose gathering type';
      case 2: return 'Add details';
      case 3: return 'Review and create';
      default: return '';
    }
  }
  
  renderStepContent() {
    switch (this.currentStep) {
      case 1: return this.renderStep1();
      case 2: return this.renderStep2();
      case 3: return this.renderStep3();
      default: return '';
    }
  }
  
  renderStep1() {
    const types = [
      {
        id: 'coffee',
        name: 'Coffee Chat',
        icon: '☕',
        description: 'Casual networking over coffee'
      },
      {
        id: 'demo',
        name: 'Product Demo',
        icon: '🎮',
        description: 'Show your product to interested people'
      },
      {
        id: 'discussion',
        name: 'Topic Discussion',
        icon: '💬',
        description: 'Deep dive on a specific topic'
      },
      {
        id: 'networking',
        name: 'Open Networking',
        icon: '✨',
        description: 'Meet new people in your field'
      }
    ];
    
    return `
      <h1>What kind of gathering?</h1>
      
      <div class="type-grid">
        ${types.map(type => `
          <div class="type-card ${this.gatheringRequest.type === type.id ? 'selected' : ''}" 
               data-type="${type.id}">
            <div class="type-header">
              <div class="type-icon">${type.icon}</div>
              <div>
                <div class="type-name">${type.name}</div>
              </div>
            </div>
            <div class="type-desc">${type.description}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="button-group">
        <button class="btn btn-primary" id="next-step-1">
          Continue
          <span class="btn-icon">→</span>
        </button>
      </div>
    `;
  }
  
  renderStep2() {
    return `
      <h1>Gathering details</h1>
      
      <form id="gathering-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            type="text" 
            id="title" 
            placeholder="Coffee with fellow CTOs"
            value="${this.gatheringRequest.title}"
          >
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            placeholder="Let's chat about scaling engineering teams, technical challenges, and leadership strategies over coffee."
          >${this.gatheringRequest.description}</textarea>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label for="max-attendees">Max attendees</label>
            <select id="max-attendees">
              <option value="3" ${this.gatheringRequest.maxAttendees === 3 ? 'selected' : ''}>3 people</option>
              <option value="4" ${this.gatheringRequest.maxAttendees === 4 ? 'selected' : ''}>4 people</option>
              <option value="6" ${this.gatheringRequest.maxAttendees === 6 ? 'selected' : ''}>6 people</option>
              <option value="8" ${this.gatheringRequest.maxAttendees === 8 ? 'selected' : ''}>8 people</option>
              <option value="12" ${this.gatheringRequest.maxAttendees === 12 ? 'selected' : ''}>12 people</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="duration">Duration</label>
            <select id="duration">
              <option value="15" ${this.gatheringRequest.duration === 15 ? 'selected' : ''}>15 minutes</option>
              <option value="30" ${this.gatheringRequest.duration === 30 ? 'selected' : ''}>30 minutes</option>
              <option value="45" ${this.gatheringRequest.duration === 45 ? 'selected' : ''}>45 minutes</option>
              <option value="60" ${this.gatheringRequest.duration === 60 ? 'selected' : ''}>1 hour</option>
            </select>
          </div>
        </div>
        
        ${this.estimatedAttendees > 0 ? `
          <div class="targeting-preview">
            <div class="targeting-title">
              ~${this.estimatedAttendees} people match your criteria
            </div>
            <div class="targeting-profiles">
              ${this.targetingPreview.map(profile => `
                <span class="profile-chip">${profile}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </form>
      
      <div class="button-group">
        <button class="btn btn-secondary" id="back-step-2">
          <span class="btn-icon">←</span>
          Back
        </button>
        <button 
          class="btn btn-primary" 
          id="next-step-2"
          ${!this.gatheringRequest.title.trim() || !this.gatheringRequest.description.trim() ? 'disabled' : ''}
        >
          Review gathering
          <span class="btn-icon">→</span>
        </button>
      </div>
    `;
  }
  
  renderStep3() {
    const typeNames = {
      coffee: 'Coffee Chat',
      demo: 'Product Demo',
      discussion: 'Topic Discussion',
      networking: 'Open Networking'
    };
    
    return `
      <h1>Review gathering</h1>
      
      <div class="review-card">
        <div class="review-title">${this.gatheringRequest.title}</div>
        <div class="review-desc">${this.gatheringRequest.description}</div>
        
        <div class="review-meta">
          <div class="meta-item">
            <span class="meta-icon">👥</span>
            <span>Up to ${this.gatheringRequest.maxAttendees} people</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏱️</span>
            <span>${this.gatheringRequest.duration} minutes</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span>${this.gatheringRequest.location}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">🎯</span>
            <span>${typeNames[this.gatheringRequest.type]}</span>
          </div>
        </div>
      </div>
      
      <div class="next-steps">
        <div class="next-steps-title">What happens next?</div>
        <ul class="next-steps-list">
          <li class="next-steps-item">AI will find ~${this.estimatedAttendees || 10} matching attendees</li>
          <li class="next-steps-item">Perfect matches will be auto-accepted</li>
          <li class="next-steps-item">Others will receive personalized invitations</li>
          <li class="next-steps-item">You'll get notifications as people join</li>
        </ul>
      </div>
      
      <div class="button-group">
        <button class="btn btn-secondary" id="back-step-3">
          <span class="btn-icon">←</span>
          Edit
        </button>
        <button 
          class="btn btn-primary" 
          id="create-gathering"
          ${this.isCreating ? 'disabled' : ''}
        >
          ${this.isCreating ? `
            <div class="spinner"></div>
            <span>Creating...</span>
          ` : `
            <span class="btn-icon">✨</span>
            <span>Create gathering</span>
          `}
        </button>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Remove old listeners
    const oldRoot = this.shadowRoot.cloneNode(false);
    this.shadowRoot.parentNode.replaceChild(oldRoot, this.shadowRoot);
    this.shadowRoot = oldRoot;
    this.render();
    
    // Step 1: Type selection
    if (this.currentStep === 1) {
      this.shadowRoot.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', () => {
          this.gatheringRequest.type = card.dataset.type;
          this.render();
        });
      });
      
      const nextBtn = this.shadowRoot.querySelector('#next-step-1');
      nextBtn?.addEventListener('click', () => {
        this.currentStep = 2;
        this.render();
        this.setupEventListeners();
      });
    }
    
    // Step 2: Details
    if (this.currentStep === 2) {
      const titleInput = this.shadowRoot.querySelector('#title');
      const descInput = this.shadowRoot.querySelector('#description');
      const maxInput = this.shadowRoot.querySelector('#max-attendees');
      const durationInput = this.shadowRoot.querySelector('#duration');
      
      titleInput?.addEventListener('input', (e) => {
        this.gatheringRequest.title = e.target.value;
        this.updateTargetingPreview();
        this.updateNextButton();
      });
      
      descInput?.addEventListener('input', (e) => {
        this.gatheringRequest.description = e.target.value;
        this.updateTargetingPreview();
        this.updateNextButton();
      });
      
      maxInput?.addEventListener('change', (e) => {
        this.gatheringRequest.maxAttendees = parseInt(e.target.value);
      });
      
      durationInput?.addEventListener('change', (e) => {
        this.gatheringRequest.duration = parseInt(e.target.value);
      });
      
      const backBtn = this.shadowRoot.querySelector('#back-step-2');
      backBtn?.addEventListener('click', () => {
        this.currentStep = 1;
        this.render();
        this.setupEventListeners();
      });
      
      const nextBtn = this.shadowRoot.querySelector('#next-step-2');
      nextBtn?.addEventListener('click', () => {
        this.currentStep = 3;
        this.render();
        this.setupEventListeners();
      });
    }
    
    // Step 3: Review
    if (this.currentStep === 3) {
      const backBtn = this.shadowRoot.querySelector('#back-step-3');
      backBtn?.addEventListener('click', () => {
        this.currentStep = 2;
        this.render();
        this.setupEventListeners();
      });
      
      const createBtn = this.shadowRoot.querySelector('#create-gathering');
      createBtn?.addEventListener('click', () => {
        this.createGathering();
      });
    }
  }
  
  updateTargetingPreview() {
    // Clear previous timeout
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
    }
    
    // Debounce preview updates
    this.previewTimeout = setTimeout(async () => {
      if (this.gatheringRequest.title && this.gatheringRequest.description) {
        try {
          // Simulate targeting preview
          await this.previewTargeting();
        } catch (error) {
          console.error('Failed to preview targeting:', error);
        }
      }
    }, 500);
  }
  
  async previewTargeting() {
    // Simulate AI targeting preview
    const title = this.gatheringRequest.title.toLowerCase();
    const desc = this.gatheringRequest.description.toLowerCase();
    
    const profiles = [];
    const keywords = {
      'cto': ['CTOs', 'Tech Leaders', 'VP Engineering'],
      'developer': ['Developers', 'Engineers', 'Programmers'],
      'design': ['Designers', 'UX/UI', 'Creative Directors'],
      'product': ['Product Managers', 'Product Owners'],
      'startup': ['Founders', 'Entrepreneurs', 'Early Stage'],
      'indie': ['Indie Developers', 'Solo Developers'],
      'marketing': ['Marketing Managers', 'Growth Hackers'],
      'business': ['Business Development', 'Sales', 'Partnerships']
    };
    
    // Find matching profiles
    for (const [keyword, matches] of Object.entries(keywords)) {
      if (title.includes(keyword) || desc.includes(keyword)) {
        profiles.push(...matches);
      }
    }
    
    // If no specific matches, use generic
    if (profiles.length === 0) {
      profiles.push('Professionals', 'Conference Attendees');
    }
    
    // Estimate attendees based on specificity
    const specificity = profiles.length;
    this.estimatedAttendees = Math.max(5, Math.min(25, 30 - specificity * 3));
    this.targetingPreview = profiles.slice(0, 4);
    
    // Re-render step 2 to show preview
    if (this.currentStep === 2) {
      this.render();
      this.setupEventListeners();
    }
  }
  
  updateNextButton() {
    const nextBtn = this.shadowRoot.querySelector('#next-step-2');
    if (nextBtn) {
      const isValid = this.gatheringRequest.title.trim() && 
                     this.gatheringRequest.description.trim();
      nextBtn.disabled = !isValid;
    }
  }
  
  async createGathering() {
    if (this.isCreating) return;
    
    this.isCreating = true;
    this.render();
    this.setupEventListeners();
    
    try {
      // Initialize engine if needed
      if (!gatheringEngine.isInitialized) {
        await gatheringEngine.initialize();
      }
      
      // Create gathering
      const gathering = await gatheringEngine.createGathering({
        ...this.gatheringRequest,
        creatorId: this.currentUser.id,
        creatorProfile: this.currentUser
      });
      
      console.log('Gathering created:', gathering);
      
      // Dispatch success event
      this.dispatchEvent(new CustomEvent('gathering-created', {
        detail: gathering,
        bubbles: true
      }));
      
      // Show success state
      this.showSuccess(gathering);
      
    } catch (error) {
      console.error('Failed to create gathering:', error);
      this.showError();
    } finally {
      this.isCreating = false;
    }
  }
  
  showSuccess(gathering) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 680px;
          margin: 0 auto;
          padding: 32px 16px;
        }
        
        .success-container {
          background: white;
          border-radius: 20px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #10b981 0%, #065f46 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: white;
        }
        
        h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 16px 0;
        }
        
        p {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px 0;
        }
        
        .btn {
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
      </style>
      
      <div class="success-container">
        <div class="success-icon">✓</div>
        <h1>Gathering Created!</h1>
        <p>Invitations are being sent to ${this.estimatedAttendees} matched attendees.</p>
        <button class="btn" onclick="window.location.href='/gatherings/${gathering.id}'">
          View Gathering
        </button>
      </div>
    `;
  }
  
  showError() {
    alert('Failed to create gathering. Please try again.');
    this.isCreating = false;
    this.render();
    this.setupEventListeners();
  }
}

// Register custom element
customElements.define('gathering-create-flow', GatheringCreateFlow);