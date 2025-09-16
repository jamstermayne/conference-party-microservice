/**
 * Smart Onboarding FTUE
 * Comprehensive profile creation for intelligent matchmaking
 */

import { getIcon } from './icon-gallery.js';

class SmartOnboarding {
  constructor() {
    this.currentStep = 0;
    this.profileData = {
      // Basic Info
      name: '',
      email: '',
      company: '',
      role: '',
      
      // LinkedIn Enrichment
      linkedinUrl: '',
      linkedinData: null,
      
      // Business Type
      businessType: '', // startup, enterprise, agency, indie, investor
      companySize: '', // 1-10, 11-50, 51-200, 201-1000, 1000+
      
      // What I Am (Multiple Selection)
      iAm: [], // developer, publisher, investor, service-provider, media, student
      
      // What I'm Looking For (Multiple Selection)
      lookingFor: [], // customers, investors, partners, talent, publishers, mentors
      
      // Industry Focus
      industries: [], // gaming, ai-ml, blockchain, metaverse, mobile, console, pc, vr-ar
      
      // Goals for Conference
      goals: [], // deal-making, learning, networking, recruiting, fundraising, showcasing
      
      // Availability
      meetingPreference: '', // in-person, virtual, both
      availability: [], // morning, lunch, afternoon, evening, after-party
      
      // Match Preferences
      matchRadius: 'quality', // quality, quantity, balanced
      introStyle: 'warm', // direct, warm, formal
    };
    
    this.init();
  }

  init() {
    this.injectStyles();
    // Don't auto-show - let it be triggered
  }

  show() {
    this.createOnboardingFlow();
    this.currentStep = 0;
    this.showStep(0);
  }

  createOnboardingFlow() {
    const container = document.createElement('div');
    container.className = 'smart-onboarding-container';
    container.innerHTML = `
      <div class="so-backdrop"></div>
      <div class="so-modal">
        <div class="so-progress">
          <div class="so-progress-bar" style="width: 0%"></div>
        </div>
        
        <!-- Step 1: Welcome & Basic Info -->
        <div class="so-step" data-step="0">
          <div class="so-step-header">
            <h2>Welcome to Smart Networking</h2>
            <p>Let's build your perfect conference experience</p>
          </div>
          
          <div class="so-visual-demo">
            <div class="demo-animation">
              <div class="profile-node you">You</div>
              <div class="connection-lines">
                <div class="line line-1"></div>
                <div class="line line-2"></div>
                <div class="line line-3"></div>
              </div>
              <div class="profile-node match-1">CEO</div>
              <div class="profile-node match-2">CTO</div>
              <div class="profile-node match-3">Investor</div>
            </div>
          </div>
          
          <div class="so-form">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="so-name" placeholder="Sarah Chen" />
            </div>
            
            <div class="form-group">
              <label>Work Email</label>
              <input type="email" id="so-email" placeholder="sarah@gamesstudio.com" />
            </div>
            
            <div class="form-group">
              <label>Company</label>
              <input type="text" id="so-company" placeholder="Awesome Games Studio" />
            </div>
            
            <div class="form-group">
              <label>Role</label>
              <input type="text" id="so-role" placeholder="Head of Business Development" />
            </div>
          </div>
        </div>
        
        <!-- Step 2: LinkedIn Enrichment -->
        <div class="so-step" data-step="1" style="display: none;">
          <div class="so-step-header">
            <h2>Enrich Your Profile</h2>
            <p>Connect LinkedIn for instant credibility and better matches</p>
          </div>
          
          <div class="so-linkedin-connect">
            <button class="btn-linkedin-connect">
              ${getIcon('link', 20)}
              <span>Connect LinkedIn Profile</span>
            </button>
            
            <div class="linkedin-preview" style="display: none;">
              <div class="preview-header">
                <img src="https://ui-avatars.com/api/?name=SC&background=0077b5&color=fff" alt="Profile" />
                <div class="preview-info">
                  <h4>Sarah Chen</h4>
                  <p>500+ connections • 5 years experience</p>
                </div>
              </div>
              
              <div class="preview-skills">
                <span class="skill">Unity</span>
                <span class="skill">Game Design</span>
                <span class="skill">Business Development</span>
                <span class="skill">Publishing</span>
              </div>
              
              <div class="preview-stats">
                <div class="stat">
                  <span class="stat-value">15</span>
                  <span class="stat-label">Shipped Titles</span>
                </div>
                <div class="stat">
                  <span class="stat-value">$2M</span>
                  <span class="stat-label">Revenue Generated</span>
                </div>
                <div class="stat">
                  <span class="stat-value">50+</span>
                  <span class="stat-label">Team Managed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="so-enrichment-benefits">
            <h4>LinkedIn helps us:</h4>
            <ul>
              <li>Verify your professional identity</li>
              <li>Find mutual connections at the conference</li>
              <li>Match you with complementary skills</li>
              <li>Suggest relevant introductions</li>
            </ul>
          </div>
        </div>
        
        <!-- Step 3: Business Type & Size -->
        <div class="so-step" data-step="2" style="display: none;">
          <div class="so-step-header">
            <h2>Your Business Context</h2>
            <p>This helps us find the right level of decision makers</p>
          </div>
          
          <div class="so-business-types">
            <h4>Business Type</h4>
            <div class="type-grid">
              <button class="type-card" data-type="startup">
                ${getIcon('zap', 24)}
                <span>Startup</span>
                <small>Pre-seed to Series A</small>
              </button>
              
              <button class="type-card" data-type="enterprise">
                ${getIcon('building', 24)}
                <span>Enterprise</span>
                <small>AAA Studios</small>
              </button>
              
              <button class="type-card" data-type="agency">
                ${getIcon('briefcase', 24)}
                <span>Agency</span>
                <small>Services & Consulting</small>
              </button>
              
              <button class="type-card" data-type="indie">
                ${getIcon('star', 24)}
                <span>Indie</span>
                <small>Independent Developer</small>
              </button>
              
              <button class="type-card" data-type="investor">
                ${getIcon('trendingUp', 24)}
                <span>Investor</span>
                <small>VC & Angels</small>
              </button>
              
              <button class="type-card" data-type="platform">
                ${getIcon('grid', 24)}
                <span>Platform</span>
                <small>Steam, Epic, etc.</small>
              </button>
            </div>
          </div>
          
          <div class="so-company-size">
            <h4>Company Size</h4>
            <div class="size-selector">
              <button class="size-option" data-size="1-10">1-10</button>
              <button class="size-option" data-size="11-50">11-50</button>
              <button class="size-option" data-size="51-200">51-200</button>
              <button class="size-option" data-size="201-1000">201-1000</button>
              <button class="size-option" data-size="1000+">1000+</button>
            </div>
          </div>
        </div>
        
        <!-- Step 4: What You Are (Role) -->
        <div class="so-step" data-step="3" style="display: none;">
          <div class="so-step-header">
            <h2>What You Are</h2>
            <p>Select all that apply - helps us understand your perspective</p>
          </div>
          
          <div class="so-role-selection">
            <button class="role-card" data-role="developer">
              <div class="role-icon">${getIcon('code', 32)}</div>
              <h4>Developer</h4>
              <p>Building games & experiences</p>
              <div class="role-examples">Unity, Unreal, Mobile, Web3</div>
            </button>
            
            <button class="role-card" data-role="publisher">
              <div class="role-icon">${getIcon('globe', 32)}</div>
              <h4>Publisher</h4>
              <p>Publishing & distribution</p>
              <div class="role-examples">Marketing, Distribution, Funding</div>
            </button>
            
            <button class="role-card" data-role="investor">
              <div class="role-icon">${getIcon('dollarSign', 32)}</div>
              <h4>Investor</h4>
              <p>Funding game studios</p>
              <div class="role-examples">Seed, Series A, Acquisition</div>
            </button>
            
            <button class="role-card" data-role="service">
              <div class="role-icon">${getIcon('tools', 32)}</div>
              <h4>Service Provider</h4>
              <p>Supporting game development</p>
              <div class="role-examples">QA, Localization, Marketing</div>
            </button>
            
            <button class="role-card" data-role="media">
              <div class="role-icon">${getIcon('camera', 32)}</div>
              <h4>Media/Influencer</h4>
              <p>Content & coverage</p>
              <div class="role-examples">Press, Streaming, Reviews</div>
            </button>
            
            <button class="role-card" data-role="platform">
              <div class="role-icon">${getIcon('server', 32)}</div>
              <h4>Platform</h4>
              <p>Distribution platforms</p>
              <div class="role-examples">Steam, Epic, Console</div>
            </button>
          </div>
        </div>
        
        <!-- Step 5: What You're Looking For -->
        <div class="so-step" data-step="4" style="display: none;">
          <div class="so-step-header">
            <h2>Who You Want to Meet</h2>
            <p>We'll prioritize these connections for you</p>
          </div>
          
          <div class="so-looking-for">
            <button class="target-card" data-target="customers">
              <div class="target-visual">
                <div class="target-icon">${getIcon('users', 28)}</div>
                <div class="target-badge">B2B</div>
              </div>
              <h4>Customers</h4>
              <p>Studios who need your product</p>
            </button>
            
            <button class="target-card" data-target="investors">
              <div class="target-visual">
                <div class="target-icon">${getIcon('trendingUp', 28)}</div>
                <div class="target-badge">💰</div>
              </div>
              <h4>Investors</h4>
              <p>VCs and angels for funding</p>
            </button>
            
            <button class="target-card" data-target="publishers">
              <div class="target-visual">
                <div class="target-icon">${getIcon('globe', 28)}</div>
                <div class="target-badge">🚀</div>
              </div>
              <h4>Publishers</h4>
              <p>Get your game published</p>
            </button>
            
            <button class="target-card" data-target="partners">
              <div class="target-visual">
                <div class="target-icon">${getIcon('handshake', 28)}</div>
                <div class="target-badge">🤝</div>
              </div>
              <h4>Partners</h4>
              <p>Strategic partnerships</p>
            </button>
            
            <button class="target-card" data-target="talent">
              <div class="target-visual">
                <div class="target-icon">${getIcon('star', 28)}</div>
                <div class="target-badge">⭐</div>
              </div>
              <h4>Talent</h4>
              <p>Recruit team members</p>
            </button>
            
            <button class="target-card" data-target="mentors">
              <div class="target-visual">
                <div class="target-icon">${getIcon('award', 28)}</div>
                <div class="target-badge">🎯</div>
              </div>
              <h4>Mentors</h4>
              <p>Industry veterans & advisors</p>
            </button>
          </div>
          
          <div class="so-match-preview">
            <h4>Based on your selections, we'll find:</h4>
            <div class="preview-matches">
              <div class="preview-match">
                <span class="match-score">98%</span>
                <span class="match-type">Decision Maker</span>
                <span class="match-detail">Can sign deals</span>
              </div>
              <div class="preview-match">
                <span class="match-score">94%</span>
                <span class="match-type">Budget Holder</span>
                <span class="match-detail">Has purchasing power</span>
              </div>
              <div class="preview-match">
                <span class="match-score">89%</span>
                <span class="match-type">Influencer</span>
                <span class="match-detail">Drives decisions</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Step 6: Industry & Goals -->
        <div class="so-step" data-step="5" style="display: none;">
          <div class="so-step-header">
            <h2>Your Focus Areas</h2>
            <p>Fine-tune your matching for maximum relevance</p>
          </div>
          
          <div class="so-industries">
            <h4>Industry Focus</h4>
            <div class="industry-tags">
              <button class="tag-btn" data-industry="mobile">Mobile Gaming</button>
              <button class="tag-btn" data-industry="console">Console</button>
              <button class="tag-btn" data-industry="pc">PC Gaming</button>
              <button class="tag-btn" data-industry="vr-ar">VR/AR</button>
              <button class="tag-btn" data-industry="web3">Web3/Blockchain</button>
              <button class="tag-btn" data-industry="ai-ml">AI/ML in Gaming</button>
              <button class="tag-btn" data-industry="esports">Esports</button>
              <button class="tag-btn" data-industry="casual">Casual Games</button>
              <button class="tag-btn" data-industry="hardcore">Hardcore Games</button>
            </div>
          </div>
          
          <div class="so-goals">
            <h4>Conference Goals</h4>
            <div class="goal-cards">
              <button class="goal-card" data-goal="deals">
                <span class="goal-icon">🤝</span>
                <span>Close Deals</span>
              </button>
              <button class="goal-card" data-goal="funding">
                <span class="goal-icon">💰</span>
                <span>Raise Funding</span>
              </button>
              <button class="goal-card" data-goal="learn">
                <span class="goal-icon">🎓</span>
                <span>Learn & Grow</span>
              </button>
              <button class="goal-card" data-goal="recruit">
                <span class="goal-icon">👥</span>
                <span>Recruit Talent</span>
              </button>
              <button class="goal-card" data-goal="showcase">
                <span class="goal-icon">🎮</span>
                <span>Showcase Product</span>
              </button>
              <button class="goal-card" data-goal="network">
                <span class="goal-icon">🌐</span>
                <span>Build Network</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Step 7: Availability & Preferences -->
        <div class="so-step" data-step="6" style="display: none;">
          <div class="so-step-header">
            <h2>Your Availability</h2>
            <p>When and how you prefer to meet</p>
          </div>
          
          <div class="so-meeting-style">
            <h4>Meeting Preference</h4>
            <div class="style-options">
              <button class="style-btn" data-style="in-person">
                ${getIcon('users', 20)}
                <span>In-Person Only</span>
                <small>Face-to-face at venue</small>
              </button>
              <button class="style-btn" data-style="virtual">
                ${getIcon('video', 20)}
                <span>Virtual OK</span>
                <small>Video calls work too</small>
              </button>
              <button class="style-btn" data-style="both">
                ${getIcon('globe', 20)}
                <span>Flexible</span>
                <small>Either works</small>
              </button>
            </div>
          </div>
          
          <div class="so-time-slots">
            <h4>Best Times to Meet</h4>
            <div class="time-grid">
              <button class="time-slot" data-time="morning">
                <span class="time-icon">☕</span>
                <span>Morning</span>
                <small>9am - 12pm</small>
              </button>
              <button class="time-slot" data-time="lunch">
                <span class="time-icon">🍽️</span>
                <span>Lunch</span>
                <small>12pm - 2pm</small>
              </button>
              <button class="time-slot" data-time="afternoon">
                <span class="time-icon">☀️</span>
                <span>Afternoon</span>
                <small>2pm - 5pm</small>
              </button>
              <button class="time-slot" data-time="evening">
                <span class="time-icon">🌆</span>
                <span>Evening</span>
                <small>5pm - 8pm</small>
              </button>
              <button class="time-slot" data-time="party">
                <span class="time-icon">🎉</span>
                <span>After Party</span>
                <small>8pm+</small>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Step 8: AI Matching Preview -->
        <div class="so-step" data-step="7" style="display: none;">
          <div class="so-step-header">
            <h2>Your Smart Matching Profile</h2>
            <p>Here's how we'll find your perfect connections</p>
          </div>
          
          <div class="so-profile-summary">
            <div class="summary-header">
              <div class="summary-avatar">SC</div>
              <div class="summary-info">
                <h3>Sarah Chen</h3>
                <p>Head of BD • Awesome Games Studio</p>
                <div class="summary-badges">
                  <span class="badge">Startup</span>
                  <span class="badge">Publisher Seeking</span>
                  <span class="badge">Mobile Focus</span>
                </div>
              </div>
            </div>
            
            <div class="matching-algorithm">
              <h4>Your Matching Formula</h4>
              <div class="formula-breakdown">
                <div class="formula-item">
                  <span class="formula-weight">40%</span>
                  <span class="formula-factor">Business Fit</span>
                  <small>Publishers for mobile games</small>
                </div>
                <div class="formula-item">
                  <span class="formula-weight">30%</span>
                  <span class="formula-factor">Decision Power</span>
                  <small>Can sign deals immediately</small>
                </div>
                <div class="formula-item">
                  <span class="formula-weight">20%</span>
                  <span class="formula-factor">Mutual Value</span>
                  <small>Win-win opportunities</small>
                </div>
                <div class="formula-item">
                  <span class="formula-weight">10%</span>
                  <span class="formula-factor">Availability</span>
                  <small>Matching time slots</small>
                </div>
              </div>
            </div>
            
            <div class="expected-matches">
              <h4>Expected Matches at Conference</h4>
              <div class="match-preview-grid">
                <div class="match-preview">
                  <span class="preview-score">98%</span>
                  <span class="preview-role">Publishing Director</span>
                  <span class="preview-company">Major Publisher</span>
                  <span class="preview-reason">Seeking mobile titles</span>
                </div>
                <div class="match-preview">
                  <span class="preview-score">94%</span>
                  <span class="preview-role">Investment Partner</span>
                  <span class="preview-company">Gaming VC</span>
                  <span class="preview-reason">Series A focus</span>
                </div>
                <div class="match-preview">
                  <span class="preview-score">91%</span>
                  <span class="preview-role">Platform BD</span>
                  <span class="preview-company">Apple Arcade</span>
                  <span class="preview-reason">Exclusive deals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Navigation -->
        <div class="so-navigation">
          <button class="so-btn-back" onclick="window.smartOnboarding.previousStep()" style="display: none;">
            Back
          </button>
          <button class="so-btn-next" onclick="window.smartOnboarding.nextStep()">
            Continue
          </button>
          <button class="so-btn-finish" onclick="window.smartOnboarding.complete()" style="display: none;">
            Start Smart Networking
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.attachEventHandlers();
  }

  attachEventHandlers() {
    // Business type selection
    document.querySelectorAll('.type-card').forEach(card => {
      card.onclick = (e) => {
        document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.profileData.businessType = card.dataset.type;
      };
    });
    
    // Company size selection
    document.querySelectorAll('.size-option').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.profileData.companySize = btn.dataset.size;
      };
    });
    
    // Role selection (multiple)
    document.querySelectorAll('.role-card').forEach(card => {
      card.onclick = (e) => {
        card.classList.toggle('selected');
        const role = card.dataset.role;
        if (card.classList.contains('selected')) {
          this.profileData.iAm.push(role);
        } else {
          this.profileData.iAm = this.profileData.iAm.filter(r => r !== role);
        }
      };
    });
    
    // Target selection (multiple)
    document.querySelectorAll('.target-card').forEach(card => {
      card.onclick = (e) => {
        card.classList.toggle('selected');
        const target = card.dataset.target;
        if (card.classList.contains('selected')) {
          this.profileData.lookingFor.push(target);
        } else {
          this.profileData.lookingFor = this.profileData.lookingFor.filter(t => t !== target);
        }
      };
    });
    
    // Industry tags (multiple)
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.onclick = (e) => {
        btn.classList.toggle('selected');
        const industry = btn.dataset.industry;
        if (btn.classList.contains('selected')) {
          this.profileData.industries.push(industry);
        } else {
          this.profileData.industries = this.profileData.industries.filter(i => i !== industry);
        }
      };
    });
    
    // Goals (multiple)
    document.querySelectorAll('.goal-card').forEach(card => {
      card.onclick = (e) => {
        card.classList.toggle('selected');
        const goal = card.dataset.goal;
        if (card.classList.contains('selected')) {
          this.profileData.goals.push(goal);
        } else {
          this.profileData.goals = this.profileData.goals.filter(g => g !== goal);
        }
      };
    });
    
    // Meeting style
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.profileData.meetingPreference = btn.dataset.style;
      };
    });
    
    // Time slots (multiple)
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.onclick = (e) => {
        slot.classList.toggle('selected');
        const time = slot.dataset.time;
        if (slot.classList.contains('selected')) {
          this.profileData.availability.push(time);
        } else {
          this.profileData.availability = this.profileData.availability.filter(t => t !== time);
        }
      };
    });
    
    // LinkedIn connect button
    const linkedinBtn = document.querySelector('.btn-linkedin-connect');
    if (linkedinBtn) {
      linkedinBtn.onclick = () => {
        this.connectLinkedIn();
      };
    }
  }

  connectLinkedIn() {
    // Simulate LinkedIn connection
    const btn = document.querySelector('.btn-linkedin-connect');
    btn.innerHTML = `${getIcon('check', 20)}<span>LinkedIn Connected</span>`;
    btn.classList.add('connected');
    
    // Show preview
    const preview = document.querySelector('.linkedin-preview');
    if (preview) {
      preview.style.display = 'block';
      preview.style.animation = 'fadeIn 500ms ease';
    }
    
    // Store LinkedIn data
    this.profileData.linkedinData = {
      connections: 500,
      experience: 5,
      skills: ['Unity', 'Game Design', 'Business Development', 'Publishing']
    };
  }

  showStep(step) {
    // Hide all steps
    document.querySelectorAll('.so-step').forEach(s => {
      s.style.display = 'none';
    });
    
    // Show current step
    const currentStepEl = document.querySelector(`.so-step[data-step="${step}"]`);
    if (currentStepEl) {
      currentStepEl.style.display = 'block';
      currentStepEl.style.animation = 'fadeIn 400ms ease';
    }
    
    // Update progress
    const progress = ((step + 1) / 8) * 100;
    const progressBar = document.querySelector('.so-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    
    // Update navigation
    const backBtn = document.querySelector('.so-btn-back');
    const nextBtn = document.querySelector('.so-btn-next');
    const finishBtn = document.querySelector('.so-btn-finish');
    
    if (backBtn) backBtn.style.display = step > 0 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < 7 ? 'block' : 'none';
    if (finishBtn) finishBtn.style.display = step === 7 ? 'block' : 'none';
    
    // Collect data from current step
    if (step === 0) {
      this.collectBasicInfo();
    }
  }

  collectBasicInfo() {
    const name = document.getElementById('so-name');
    const email = document.getElementById('so-email');
    const company = document.getElementById('so-company');
    const role = document.getElementById('so-role');
    
    if (name) this.profileData.name = name.value;
    if (email) this.profileData.email = email.value;
    if (company) this.profileData.company = company.value;
    if (role) this.profileData.role = role.value;
  }

  nextStep() {
    // Validate current step
    if (this.currentStep === 0) {
      this.collectBasicInfo();
    }
    
    if (this.currentStep < 7) {
      this.currentStep++;
      this.showStep(this.currentStep);
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  complete() {
    console.log('Smart Profile Created:', this.profileData);
    
    // Store profile
    localStorage.setItem('smartProfile', JSON.stringify(this.profileData));
    
    // Show success
    this.showSuccess();
    
    // Mark as active during transition
    this.isActive = true;
    
    // Continue to networking experience after delay
    setTimeout(() => {
      this.continueToNetworking();
    }, 2000);
  }

  showSuccess() {
    const modal = document.querySelector('.so-modal');
    modal.innerHTML = `
      <div class="so-success">
        <div class="success-icon">✨</div>
        <h2>Profile Complete!</h2>
        <p>Smart matching activated. Finding your perfect connections...</p>
        <div class="success-animation">
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring"></div>
        </div>
      </div>
    `;
  }

  continueToNetworking() {
    console.log('[SmartOnboarding] Transitioning to live networking experience');
    
    // Close onboarding modal
    this.close();
    
    // Show main app
    const heroLanding = document.getElementById('hero-landing');
    const app = document.getElementById('app');
    
    if (heroLanding) {
      heroLanding.style.display = 'none';
    }
    
    if (app) {
      app.style.display = 'block';
      
      // Initialize or open proximity networking
      setTimeout(() => {
        if (!window.proximityNetworking) {
          // Initialize ProximityNetworking if not already done
          import('./proximity-networking.js').then(() => {
            if (window.proximityNetworking) {
              window.proximityNetworking.open();
              window.proximityNetworking.showToast('Welcome! Your smart profile is active. Finding matches...');
              
              // Show match results after a brief delay
              setTimeout(() => {
                window.proximityNetworking.showMatchResults();
              }, 1500);
            }
          });
        } else {
          // Open proximity panel if already initialized
          window.proximityNetworking.open();
          window.proximityNetworking.showToast('Welcome back! Finding new matches...');
          
          // Show match results after a brief delay
          setTimeout(() => {
            window.proximityNetworking.showMatchResults();
          }, 1500);
        }
      }, 500);
    }
  }
  
  close() {
    const container = document.querySelector('.smart-onboarding-container');
    if (container) {
      container.style.animation = 'fadeOut 300ms ease';
      setTimeout(() => {
        container.remove();
        this.isActive = false;
      }, 300);
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Smart Onboarding Container */
      .smart-onboarding-container {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .so-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
      }
      
      .so-modal {
        position: relative;
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        overflow-y: auto;
        padding: 40px;
      }
      
      .so-progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 24px 24px 0 0;
        overflow: hidden;
      }
      
      .so-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        transition: width 400ms ease;
      }
      
      /* Step Header */
      .so-step-header {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .so-step-header h2 {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .so-step-header p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
      }
      
      /* Visual Demo */
      .so-visual-demo {
        margin: 32px 0;
        display: flex;
        justify-content: center;
      }
      
      .demo-animation {
        position: relative;
        width: 300px;
        height: 150px;
      }
      
      .profile-node {
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 12px;
      }
      
      .profile-node.you {
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }
      
      .profile-node.match-1 {
        top: 0;
        right: 0;
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      .profile-node.match-2 {
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      
      .profile-node.match-3 {
        bottom: 0;
        right: 0;
        background: linear-gradient(135deg, #ec4899, #db2777);
      }
      
      .connection-lines {
        position: absolute;
        inset: 0;
      }
      
      .line {
        position: absolute;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
        transform-origin: left center;
        animation: pulse 2s ease-in-out infinite;
      }
      
      .line-1 {
        top: 25%;
        left: 60px;
        right: 60px;
        transform: rotate(-20deg);
      }
      
      .line-2 {
        top: 50%;
        left: 60px;
        right: 60px;
      }
      
      .line-3 {
        bottom: 25%;
        left: 60px;
        right: 60px;
        transform: rotate(20deg);
      }
      
      /* Form Styles */
      .so-form {
        max-width: 500px;
        margin: 0 auto;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      .form-group label {
        display: block;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .form-group input {
        width: 100%;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 15px;
        transition: all 200ms ease;
      }
      
      .form-group input:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.08);
        border-color: #6366f1;
      }
      
      /* LinkedIn Connect */
      .so-linkedin-connect {
        text-align: center;
        margin: 32px 0;
      }
      
      .btn-linkedin-connect {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 14px 28px;
        background: #0077b5;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .btn-linkedin-connect:hover {
        background: #005885;
        transform: translateY(-2px);
      }
      
      .btn-linkedin-connect.connected {
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid #10b981;
        color: #10b981;
      }
      
      .linkedin-preview {
        margin-top: 24px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
      }
      
      .preview-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .preview-header img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
      }
      
      .preview-info h4 {
        color: white;
        font-size: 18px;
        margin-bottom: 4px;
      }
      
      .preview-info p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
      }
      
      .preview-skills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      
      .skill {
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 20px;
        color: #a5b4fc;
        font-size: 13px;
      }
      
      .preview-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      
      .stat {
        text-align: center;
      }
      
      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: white;
      }
      
      .stat-label {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
      }
      
      /* Business Type Cards */
      .type-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      
      .type-card {
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .type-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }
      
      .type-card.selected {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
      }
      
      .type-card svg {
        width: 32px;
        height: 32px;
        color: #6366f1;
        margin-bottom: 8px;
      }
      
      .type-card span {
        display: block;
        color: white;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .type-card small {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
      }
      
      /* Size Selector */
      .size-selector {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .size-option {
        padding: 10px 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .size-option:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      
      .size-option.selected {
        background: rgba(99, 102, 241, 0.2);
        border-color: #6366f1;
        color: #a5b4fc;
      }
      
      /* Role Cards */
      .so-role-selection {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }
      
      .role-card {
        padding: 24px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .role-card:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
      }
      
      .role-card.selected {
        background: rgba(16, 185, 129, 0.05);
        border-color: #10b981;
      }
      
      .role-icon {
        margin-bottom: 12px;
        color: #6366f1;
      }
      
      .role-card h4 {
        color: white;
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .role-card p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        margin-bottom: 12px;
      }
      
      .role-examples {
        color: rgba(255, 255, 255, 0.4);
        font-size: 11px;
      }
      
      /* Target Cards */
      .so-looking-for {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }
      
      .target-card {
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .target-card:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
      }
      
      .target-card.selected {
        background: rgba(239, 68, 68, 0.05);
        border-color: #ef4444;
      }
      
      .target-visual {
        position: relative;
        margin-bottom: 12px;
      }
      
      .target-icon {
        color: #ef4444;
      }
      
      .target-badge {
        position: absolute;
        top: -5px;
        right: 50%;
        transform: translateX(50%);
        font-size: 18px;
      }
      
      .target-card h4 {
        color: white;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .target-card p {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
      
      /* Match Preview */
      .so-match-preview {
        margin-top: 32px;
        padding: 20px;
        background: rgba(16, 185, 129, 0.05);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 16px;
      }
      
      .so-match-preview h4 {
        color: white;
        font-size: 14px;
        margin-bottom: 16px;
      }
      
      .preview-matches {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      
      .preview-match {
        text-align: center;
      }
      
      .match-score {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #10b981;
        margin-bottom: 4px;
      }
      
      .match-type {
        display: block;
        color: white;
        font-size: 13px;
        margin-bottom: 2px;
      }
      
      .match-detail {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
      }
      
      /* Industry Tags */
      .industry-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 32px;
      }
      
      .tag-btn {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .tag-btn:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      
      .tag-btn.selected {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
        color: #a5b4fc;
      }
      
      /* Goal Cards */
      .goal-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
      }
      
      .goal-card {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .goal-card:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .goal-card.selected {
        background: rgba(251, 191, 36, 0.1);
        border-color: #fbbf24;
      }
      
      .goal-icon {
        display: block;
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .goal-card span:last-child {
        display: block;
        color: white;
        font-size: 13px;
      }
      
      /* Meeting Style Section */
      .so-meeting-style {
        margin-bottom: 36px;
      }
      
      .so-meeting-style h4,
      .so-time-slots h4 {
        color: white;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
      }
      
      /* Meeting Style */
      .style-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      
      .style-btn {
        padding: 20px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 110px;
      }
      
      .style-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
      }
      
      .style-btn.selected {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
      }
      
      .style-btn svg {
        width: 24px;
        height: 24px;
        color: #6366f1;
        margin-bottom: 10px;
      }
      
      .style-btn span {
        display: block;
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 6px;
        line-height: 1.2;
      }
      
      .style-btn small {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        line-height: 1.2;
      }
      
      /* Time Grid */
      .time-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 16px;
      }
      
      .time-slot {
        padding: 20px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 200ms ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 120px;
      }
      
      .time-slot:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
      }
      
      .time-slot.selected {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
      }
      
      .time-icon {
        display: block;
        font-size: 28px;
        margin-bottom: 12px;
        line-height: 1;
      }
      
      .time-slot span:nth-child(2) {
        display: block;
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 6px;
        line-height: 1.2;
      }
      
      .time-slot small {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        line-height: 1.2;
      }
      
      /* Profile Summary */
      .summary-header {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 16px;
        margin-bottom: 24px;
      }
      
      .summary-avatar {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        font-weight: 700;
      }
      
      .summary-info h3 {
        color: white;
        font-size: 20px;
        margin-bottom: 4px;
      }
      
      .summary-info p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .summary-badges {
        display: flex;
        gap: 8px;
      }
      
      .badge {
        padding: 4px 12px;
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 20px;
        color: #a5b4fc;
        font-size: 12px;
      }
      
      /* Matching Algorithm */
      .matching-algorithm {
        padding: 24px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        margin-bottom: 24px;
      }
      
      .matching-algorithm h4 {
        color: white;
        font-size: 16px;
        margin-bottom: 20px;
      }
      
      .formula-breakdown {
        display: grid;
        gap: 16px;
      }
      
      .formula-item {
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 12px;
        align-items: center;
      }
      
      .formula-weight {
        font-size: 24px;
        font-weight: 700;
        color: #10b981;
      }
      
      .formula-factor {
        color: white;
        font-weight: 600;
        font-size: 14px;
      }
      
      .formula-item small {
        grid-column: 2;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
      
      /* Expected Matches */
      .expected-matches {
        padding: 24px;
        background: rgba(16, 185, 129, 0.03);
        border: 1px solid rgba(16, 185, 129, 0.1);
        border-radius: 16px;
      }
      
      .expected-matches h4 {
        color: white;
        font-size: 16px;
        margin-bottom: 20px;
      }
      
      .match-preview-grid {
        display: grid;
        gap: 16px;
      }
      
      .match-preview {
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
      }
      
      .preview-score {
        font-size: 20px;
        font-weight: 700;
        color: #10b981;
        grid-row: span 3;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .preview-role {
        color: white;
        font-weight: 600;
        font-size: 14px;
      }
      
      .preview-company {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
      }
      
      .preview-reason {
        color: rgba(16, 185, 129, 0.8);
        font-size: 12px;
      }
      
      /* Navigation */
      .so-navigation {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
      }
      
      .so-btn-back,
      .so-btn-next,
      .so-btn-finish {
        padding: 14px 32px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        border: none;
      }
      
      .so-btn-back {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .so-btn-back:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .so-btn-next,
      .so-btn-finish {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        margin-left: auto;
      }
      
      .so-btn-next:hover,
      .so-btn-finish:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
      }
      
      /* Success State */
      .so-success {
        text-align: center;
        padding: 60px;
      }
      
      .success-icon {
        font-size: 64px;
        margin-bottom: 24px;
      }
      
      .so-success h2 {
        color: white;
        font-size: 32px;
        margin-bottom: 12px;
      }
      
      .so-success p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        margin-bottom: 32px;
      }
      
      .success-animation {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 0 auto;
      }
      
      .pulse-ring {
        position: absolute;
        inset: 0;
        border: 2px solid #10b981;
        border-radius: 50%;
        animation: pulseRing 1.5s ease-out infinite;
      }
      
      .pulse-ring:nth-child(2) {
        animation-delay: 0.5s;
      }
      
      .pulse-ring:nth-child(3) {
        animation-delay: 1s;
      }
      
      @keyframes pulseRing {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .so-modal {
          width: 95%;
          padding: 24px;
        }
        
        .type-grid,
        .so-role-selection,
        .so-looking-for {
          grid-template-columns: 1fr;
        }
        
        .style-options {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        
        .time-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .time-slot {
          min-height: 100px;
          padding: 16px 12px;
        }
        
        .style-btn {
          min-height: 90px;
          padding: 16px 12px;
        }
        
        .preview-matches {
          grid-template-columns: 1fr;
        }
      }
      
      /* Tablet Responsive */
      @media (min-width: 769px) and (max-width: 1024px) {
        .time-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        
        .style-options {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize
window.smartOnboarding = new SmartOnboarding();

// Export for use
export default window.smartOnboarding;