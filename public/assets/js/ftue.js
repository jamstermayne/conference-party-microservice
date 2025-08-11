/**
 * 👋 PROFESSIONAL INTELLIGENCE PLATFORM - FIRST TIME USER EXPERIENCE
 * Sophisticated onboarding with professional persona setup
 */

/**
 * Initialize First Time User Experience
 */
export async function initFTUE() {
  console.log('👋 Starting First Time User Experience...');
  
  // Check if user has already completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
  if (hasCompletedOnboarding) {
    return false;
  }
  
  // Show welcome modal
  await showWelcomeModal();
  
  // Start onboarding flow
  await startOnboardingFlow();
  
  // Mark onboarding as completed
  localStorage.setItem('onboarding_completed', 'true');
  localStorage.setItem('onboarding_date', new Date().toISOString());
  
  console.log('✅ First Time User Experience completed');
  return true;
}

/**
 * Show welcome modal
 */
function showWelcomeModal() {
  return new Promise((resolve) => {
    const modalContent = `
      <div class="welcome-modal">
        <div class="welcome-header">
          <div class="welcome-logo">
            <div class="logo-icon">🎯</div>
            <h1>Welcome to the Intelligence Platform</h1>
          </div>
          <p class="welcome-subtitle">The professional networking platform designed for gaming industry excellence</p>
        </div>
        
        <div class="welcome-features">
          <div class="feature-card">
            <div class="feature-icon">🎉</div>
            <h3>Exclusive Parties</h3>
            <p>Access tonight's most important industry networking events</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📨</div>
            <h3>VIP Invitations</h3>
            <p>Receive exclusive invites to premium gaming industry gatherings</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📅</div>
            <h3>Calendar Sync</h3>
            <p>Seamlessly integrate with your professional schedule</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>Smart Networking</h3>
            <p>Connect with the right people at the right events</p>
          </div>
        </div>
        
        <div class="welcome-actions">
          <button class="btn btn-primary btn-lg" id="start-onboarding">
            Begin Professional Setup
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Create and show modal
    const modal = createModal(modalContent, {
      title: null,
      closable: false,
      size: 'large',
      className: 'welcome-modal-container'
    });

    // Handle start button
    const startBtn = modal.querySelector('#start-onboarding');
    startBtn.addEventListener('click', () => {
      closeModal();
      setTimeout(resolve, 300);
    });
  });
}

/**
 * Start the onboarding flow
 */
async function startOnboardingFlow() {
  const steps = [
    showPersonaSelection,
    showInterestsSelection,
    showNotificationPreferences,
    showCompletionScreen
  ];

  for (let i = 0; i < steps.length; i++) {
    console.log(`📋 Onboarding step ${i + 1}/${steps.length}`);
    await steps[i](i + 1, steps.length);
  }
}

/**
 * Step 1: Persona Selection
 */
function showPersonaSelection(step, total) {
  return new Promise((resolve) => {
    const modalContent = `
      <div class="onboarding-step">
        <div class="step-header">
          <div class="step-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(step / total) * 100}%"></div>
            </div>
            <span class="step-counter">Step ${step} of ${total}</span>
          </div>
          <h2>Choose Your Professional Role</h2>
          <p>This helps us customize your networking experience and connect you with relevant opportunities.</p>
        </div>
        
        <div class="persona-grid">
          <div class="persona-card" data-persona="developer">
            <div class="persona-icon">👩‍💻</div>
            <h3>Game Developer</h3>
            <p>Engineers, programmers, technical directors, and development team members</p>
            <div class="persona-features">
              <span>Tech talks</span>
              <span>Code reviews</span>
              <span>Engineering meetups</span>
            </div>
          </div>
          
          <div class="persona-card" data-persona="business">
            <div class="persona-icon">💼</div>
            <h3>Business & Publishing</h3>
            <p>Publishers, marketers, business development, and industry executives</p>
            <div class="persona-features">
              <span>Deal making</span>
              <span>Strategic partnerships</span>
              <span>Market insights</span>
            </div>
          </div>
          
          <div class="persona-card" data-persona="investor">
            <div class="persona-icon">💰</div>
            <h3>Investor & VC</h3>
            <p>Venture capitalists, angel investors, and funding professionals</p>
            <div class="persona-features">
              <span>Startup pitches</span>
              <span>Portfolio companies</span>
              <span>Investment opportunities</span>
            </div>
          </div>
          
          <div class="persona-card" data-persona="service">
            <div class="persona-icon">🛠️</div>
            <h3>Service Provider</h3>
            <p>Consultants, agencies, legal, and professional service providers</p>
            <div class="persona-features">
              <span>Client networking</span>
              <span>Professional services</span>
              <span>Industry expertise</span>
            </div>
          </div>
        </div>
        
        <div class="step-actions">
          <button class="btn btn-primary btn-lg" id="continue-persona" disabled>
            Continue
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const modal = createModal(modalContent, {
      title: 'Professional Setup',
      closable: false,
      size: 'large'
    });

    let selectedPersona = null;
    const continueBtn = modal.querySelector('#continue-persona');
    const personaCards = modal.querySelectorAll('.persona-card');

    // Handle persona selection
    personaCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove previous selection
        personaCards.forEach(c => c.classList.remove('selected'));
        
        // Select current card
        card.classList.add('selected');
        selectedPersona = card.dataset.persona;
        
        // Enable continue button
        continueBtn.disabled = false;
        
        // Add visual feedback
        card.style.transform = 'scale(1.02)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });

    // Handle continue
    continueBtn.addEventListener('click', () => {
      if (selectedPersona) {
        // Save persona to profile
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        profile.persona = selectedPersona;
        profile.personaSelectedAt = new Date().toISOString();
        localStorage.setItem('user_profile', JSON.stringify(profile));
        
        closeModal();
        setTimeout(resolve, 300);
      }
    });
  });
}

/**
 * Step 2: Interests Selection
 */
function showInterestsSelection(step, total) {
  return new Promise((resolve) => {
    const modalContent = `
      <div class="onboarding-step">
        <div class="step-header">
          <div class="step-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(step / total) * 100}%"></div>
            </div>
            <span class="step-counter">Step ${step} of ${total}</span>
          </div>
          <h2>Select Your Interests</h2>
          <p>Choose the topics and event types you're most interested in. Select 3-5 for the best experience.</p>
        </div>
        
        <div class="interests-grid">
          <div class="interest-tag" data-interest="mobile">📱 Mobile Games</div>
          <div class="interest-tag" data-interest="pc">💻 PC Gaming</div>
          <div class="interest-tag" data-interest="console">🎮 Console Games</div>
          <div class="interest-tag" data-interest="indie">🎨 Indie Games</div>
          <div class="interest-tag" data-interest="vr">🥽 VR/AR</div>
          <div class="interest-tag" data-interest="esports">⚡ Esports</div>
          <div class="interest-tag" data-interest="blockchain">⛓️ Blockchain Gaming</div>
          <div class="interest-tag" data-interest="ai">🤖 AI in Gaming</div>
          <div class="interest-tag" data-interest="streaming">📺 Game Streaming</div>
          <div class="interest-tag" data-interest="social">👥 Social Gaming</div>
          <div class="interest-tag" data-interest="analytics">📊 Game Analytics</div>
          <div class="interest-tag" data-interest="monetization">💳 Monetization</div>
        </div>
        
        <div class="step-actions">
          <button class="btn btn-primary btn-lg" id="continue-interests">
            Continue
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const modal = createModal(modalContent, {
      title: 'Professional Setup',
      closable: false,
      size: 'large'
    });

    const selectedInterests = new Set();
    const continueBtn = modal.querySelector('#continue-interests');
    const interestTags = modal.querySelectorAll('.interest-tag');

    // Handle interest selection
    interestTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const interest = tag.dataset.interest;
        
        if (selectedInterests.has(interest)) {
          selectedInterests.delete(interest);
          tag.classList.remove('selected');
        } else {
          selectedInterests.add(interest);
          tag.classList.add('selected');
        }
        
        // Update continue button state
        continueBtn.disabled = selectedInterests.size === 0;
        
        // Show selection count
        const count = selectedInterests.size;
        if (count > 0) {
          continueBtn.textContent = `Continue (${count} selected)`;
        } else {
          continueBtn.innerHTML = `Continue <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>`;
        }
      });
    });

    // Handle continue
    continueBtn.addEventListener('click', () => {
      if (selectedInterests.size > 0) {
        // Save interests to profile
        const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        profile.interests = Array.from(selectedInterests);
        profile.interestsSelectedAt = new Date().toISOString();
        localStorage.setItem('user_profile', JSON.stringify(profile));
        
        closeModal();
        setTimeout(resolve, 300);
      }
    });
  });
}

/**
 * Step 3: Notification Preferences
 */
function showNotificationPreferences(step, total) {
  return new Promise((resolve) => {
    const modalContent = `
      <div class="onboarding-step">
        <div class="step-header">
          <div class="step-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(step / total) * 100}%"></div>
            </div>
            <span class="step-counter">Step ${step} of ${total}</span>
          </div>
          <h2>Notification Preferences</h2>
          <p>Stay informed about exclusive invites and important opportunities. You can change these settings anytime.</p>
        </div>
        
        <div class="preferences-list">
          <div class="preference-item">
            <div class="preference-info">
              <div class="preference-icon">📨</div>
              <div>
                <h3>Exclusive Invites</h3>
                <p>Get notified about VIP events and private gatherings</p>
              </div>
            </div>
            <label class="preference-toggle">
              <input type="checkbox" id="notify-invites" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="preference-item">
            <div class="preference-info">
              <div class="preference-icon">🎉</div>
              <div>
                <h3>Tonight's Parties</h3>
                <p>Daily updates about events happening today</p>
              </div>
            </div>
            <label class="preference-toggle">
              <input type="checkbox" id="notify-parties" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="preference-item">
            <div class="preference-info">
              <div class="preference-icon">👥</div>
              <div>
                <h3>Network Updates</h3>
                <p>When people you know RSVP to the same events</p>
              </div>
            </div>
            <label class="preference-toggle">
              <input type="checkbox" id="notify-network">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="preference-item">
            <div class="preference-info">
              <div class="preference-icon">📅</div>
              <div>
                <h3>Event Reminders</h3>
                <p>Gentle reminders before events you're attending</p>
              </div>
            </div>
            <label class="preference-toggle">
              <input type="checkbox" id="notify-reminders" checked>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div class="step-actions">
          <button class="btn btn-primary btn-lg" id="continue-notifications">
            Continue
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const modal = createModal(modalContent, {
      title: 'Professional Setup',
      closable: false,
      size: 'medium'
    });

    const continueBtn = modal.querySelector('#continue-notifications');

    // Handle continue
    continueBtn.addEventListener('click', () => {
      // Save notification preferences
      const preferences = {
        invites: modal.querySelector('#notify-invites').checked,
        parties: modal.querySelector('#notify-parties').checked,
        network: modal.querySelector('#notify-network').checked,
        reminders: modal.querySelector('#notify-reminders').checked
      };
      
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      profile.notifications = preferences;
      profile.notificationsSelectedAt = new Date().toISOString();
      localStorage.setItem('user_profile', JSON.stringify(profile));
      
      closeModal();
      setTimeout(resolve, 300);
    });
  });
}

/**
 * Step 4: Completion Screen
 */
function showCompletionScreen(step, total) {
  return new Promise((resolve) => {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const personaLabels = {
      developer: 'Game Developer',
      business: 'Business & Publishing',
      investor: 'Investor & VC',
      service: 'Service Provider'
    };

    const modalContent = `
      <div class="onboarding-completion">
        <div class="completion-header">
          <div class="completion-icon">🎯</div>
          <h1>Welcome to the Professional Intelligence Platform!</h1>
          <p>Your profile is now optimized for meaningful networking opportunities.</p>
        </div>
        
        <div class="profile-summary">
          <h3>Your Professional Profile</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Role:</span>
              <span class="summary-value">${personaLabels[profile.persona] || 'Not selected'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Interests:</span>
              <span class="summary-value">${(profile.interests || []).length} selected</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Notifications:</span>
              <span class="summary-value">Configured</span>
            </div>
          </div>
        </div>
        
        <div class="next-steps">
          <h3>What's Next?</h3>
          <div class="next-steps-list">
            <div class="next-step">
              <div class="step-icon">🎉</div>
              <div>
                <strong>Explore Tonight's Parties</strong>
                <p>Discover exclusive networking events happening today</p>
              </div>
            </div>
            <div class="next-step">
              <div class="step-icon">📨</div>
              <div>
                <strong>Check Your Invites</strong>
                <p>See if you have any VIP invitations waiting</p>
              </div>
            </div>
            <div class="next-step">
              <div class="step-icon">👤</div>
              <div>
                <strong>Complete Your Profile</strong>
                <p>Add more details to enhance networking opportunities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="completion-actions">
          <button class="btn btn-primary btn-lg" id="start-exploring">
            Start Exploring
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const modal = createModal(modalContent, {
      title: null,
      closable: false,
      size: 'large',
      className: 'completion-modal'
    });

    const startBtn = modal.querySelector('#start-exploring');
    startBtn.addEventListener('click', () => {
      closeModal();
      setTimeout(resolve, 300);
    });
  });
}

/**
 * Utility: Create modal
 */
function createModal(content, options = {}) {
  const modalContainer = document.getElementById('modal-container') || document.body;
  
  const modal = document.createElement('div');
  modal.className = `modal modal-${options.size || 'medium'} ${options.className || ''}`;
  modal.innerHTML = content;
  
  modalContainer.innerHTML = '';
  modalContainer.appendChild(modal);
  modalContainer.classList.add('active');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  return modal;
}

/**
 * Utility: Close modal
 */
function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) {
    modalContainer.classList.remove('active');
    setTimeout(() => {
      modalContainer.innerHTML = '';
      document.body.style.overflow = '';
    }, 250);
  }
}

/**
 * Get onboarding status
 */
export function getOnboardingStatus() {
  const completed = localStorage.getItem('onboarding_completed') === 'true';
  const date = localStorage.getItem('onboarding_date');
  const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  
  return {
    completed,
    completedAt: date,
    persona: profile.persona,
    interests: profile.interests || [],
    notifications: profile.notifications || {}
  };
}

/**
 * Reset onboarding (for testing)
 */
export function resetOnboarding() {
  localStorage.removeItem('onboarding_completed');
  localStorage.removeItem('onboarding_date');
  localStorage.removeItem('user_profile');
  console.log('🔄 Onboarding reset - user will see FTUE on next visit');
}