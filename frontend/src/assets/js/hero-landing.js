/**
 * Hero Landing Controller
 * Elegant app initialization with progressive disclosure
 */

import { getIcon } from './icon-gallery.js';

class HeroLanding {
  constructor() {
    this.heroContainer = document.getElementById('hero-landing');
    this.appContainer = document.getElementById('app');
    this.hasSeenHero = sessionStorage.getItem('hero_seen') === 'true';
    this.isFirstVisit = !localStorage.getItem('user_id');
    this.features = new Map();
    
    this.init();
  }

  init() {
    // Skip hero for returning users in same session
    if (this.hasSeenHero && !this.isFirstVisit) {
      this.skipHero();
      return;
    }

    this.setupFeatures();
    this.attachEventHandlers();
    this.renderIcons();
    this.animateEntrance();
  }

  setupFeatures() {
    // Feature definitions for progressive disclosure
    this.features.set('events', {
      title: 'Event Discovery',
      icon: 'target',
      description: 'Find the perfect events for your interests',
      tutorial: [
        'Browse 50+ exclusive gaming industry parties',
        'Get AI-powered recommendations',
        'Save events to your personal calendar',
        'Never miss important networking opportunities'
      ]
    });

    this.features.set('network', {
      title: 'Professional Networking',
      icon: 'handshake',
      description: 'Build meaningful industry connections',
      tutorial: [
        'Connect with developers, publishers, and investors',
        'Proximity-based networking at venues',
        'Exchange contact info with QR codes',
        'Track your professional relationships'
      ]
    });

    this.features.set('offline', {
      title: 'Offline Access',
      icon: 'wifiOff',
      description: 'Everything works without internet',
      tutorial: [
        'Download event data for offline viewing',
        'Access your saved events anytime',
        'Sync when connection returns',
        'Install as a mobile app'
      ]
    });
  }

  attachEventHandlers() {
    // Global functions for onclick handlers
    window.startApp = () => this.startApp();
    window.exploreDemo = () => this.exploreDemo();
    window.showFeature = (feature) => this.showFeature(feature);
  }

  renderIcons() {
    // Render professional SVG icons
    const iconElements = document.querySelectorAll('[data-icon]');
    iconElements.forEach(element => {
      const iconName = element.dataset.icon;
      const iconSvg = getIcon(iconName, 48, 'hero-icon-svg');
      if (iconSvg) {
        element.innerHTML = iconSvg;
      }
    });
  }

  animateEntrance() {
    // Stagger feature card animations
    const features = document.querySelectorAll('.hero-feature');
    features.forEach((feature, index) => {
      feature.style.animationDelay = `${600 + (index * 100)}ms`;
    });
  }

  async startApp() {
    // Mark hero as seen
    sessionStorage.setItem('hero_seen', 'true');
    
    // Smooth transition
    this.heroContainer.style.transition = 'opacity 500ms ease-out';
    this.heroContainer.style.opacity = '0';
    
    setTimeout(() => {
      this.heroContainer.style.display = 'none';
      this.appContainer.style.display = 'block';
      this.appContainer.style.animation = 'fadeIn 500ms ease-out';
      
      // Trigger app initialization event
      window.dispatchEvent(new Event('app-ready'));
      
      // DISABLED - Show FTUE for first-time users
      // if (this.isFirstVisit) {
      //   setTimeout(() => this.showOnboarding(), 1000);
      // }
    }, 500);
  }

  exploreDemo() {
    // Launch the beautiful feature showcase with Jobs/Ive magic
    if (window.featureShowcase) {
      window.featureShowcase.open();
      
      // Add a subtle pulse to draw attention
      setTimeout(() => {
        const panel = document.querySelector('.showcase-panel');
        if (panel) {
          panel.style.animation = 'pulseGlow 2s ease-in-out';
        }
      }, 100);
    }
  }

  showFeature(featureName) {
    console.log('[Hero] Feature clicked:', featureName);
    
    // For Smart Discovery, show the comprehensive onboarding flow
    if (featureName === 'discovery') {
      // Check if user has already completed onboarding
      const profileExists = localStorage.getItem('smartProfile');
      
      if (!profileExists) {
        // Show smart onboarding for new users
        if (window.smartOnboarding) {
          window.smartOnboarding.show();
          // Hide hero after a brief delay
          setTimeout(() => {
            const hero = document.getElementById('hero-landing');
            if (hero) {
              hero.style.transition = 'opacity 500ms ease';
              hero.style.opacity = '0';
              setTimeout(() => {
                hero.style.display = 'none';
              }, 500);
            }
          }, 300);
        }
      } else {
        // Existing user - go directly to smart networking
        this.startApp();
        setTimeout(() => {
          if (window.proximityNetworking) {
            window.proximityNetworking.open();
          }
        }, 500);
      }
      return;
    }
    
    // For other features, go directly to the app
    this.startApp();
    return;

    // Simple modal - no fancy animations to avoid issues
    const modalHTML = `
      <div class="hero-feature-modal-simple" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      " onclick="if(event.target === this) window.heroLanding.closeSimpleModal()">
        <div style="
          background: #1a1a2e;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        " onclick="event.stopPropagation()">
          <button onclick="window.heroLanding.closeSimpleModal()" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: transparent;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
          ">×</button>
          
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              ${getIcon(feature.icon, 32, 'modal-icon-svg')}
            </div>
            <h2 style="color: white; margin: 0; font-size: 24px;">${feature.title}</h2>
          </div>
          
          <p style="color: #9ca3af; margin-bottom: 24px;">${feature.description}</p>
          
          <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
            ${feature.tutorial.map(item => `
              <li style="display: flex; align-items: center; gap: 12px; padding: 8px 0; color: #e5e7eb;">
                <span style="color: #10b981;">✓</span>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
          
          <div style="display: flex; gap: 12px;">
            <button onclick="window.heroLanding.startAppFromModal()" style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
              border: none;
              border-radius: 8px;
              color: white;
              font-weight: 600;
              cursor: pointer;
            ">Get Started</button>
            <button onclick="window.heroLanding.closeSimpleModal()" style="
              flex: 1;
              padding: 12px;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              color: white;
              font-weight: 600;
              cursor: pointer;
            ">Close</button>
          </div>
        </div>
      </div>
    `;

    // Create and insert modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    const modal = modalContainer.firstElementChild;
    document.body.appendChild(modal);

    // Store reference for cleanup
    this.currentModal = modal;

    // ESC key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeSimpleModal();
      }
    };
    this.currentEscHandler = escHandler;
    document.addEventListener('keydown', escHandler);

    console.log('[Hero] Modal created and displayed');
  }

  closeSimpleModal() {
    console.log('[Hero] Closing simple modal');
    
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    
    if (this.currentEscHandler) {
      document.removeEventListener('keydown', this.currentEscHandler);
      this.currentEscHandler = null;
    }
    
    // Clear auto-cleanup timer
    if (this.autoCleanupTimer) {
      clearTimeout(this.autoCleanupTimer);
      this.autoCleanupTimer = null;
    }
    
    // Final cleanup - remove any lingering modals
    document.querySelectorAll('.hero-feature-modal-simple, .hero-feature-modal').forEach(el => el.remove());
    
    // Reset body state to ensure page is clickable
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }

  closeFeatureModal(modal) {
    if (modal && modal.classList.contains('hero-feature-modal')) {
      // Immediately disable interaction
      modal.style.pointerEvents = 'none';
      modal.classList.remove('active');
      
      // Clean up event listener
      if (modal._escHandler) {
        document.removeEventListener('keydown', modal._escHandler);
        delete modal._escHandler;
      }
      
      // Clear failsafe timeout
      if (modal._cleanupTimeout) {
        clearTimeout(modal._cleanupTimeout);
        delete modal._cleanupTimeout;
      }
      
      // Wait for animation to complete before removing
      setTimeout(() => {
        if (modal && modal.parentNode) {
          modal.remove();
        }
        
        // Double-check cleanup of any orphaned elements
        const orphans = document.querySelectorAll('.hero-feature-modal-backdrop, .hero-feature-modal');
        orphans.forEach(el => {
          el.style.pointerEvents = 'none';
          el.remove();
        });
      }, 300);
    }
  }

  startAppFromModal() {
    console.log('[Hero] Starting app from modal');
    
    // Close the simple modal first using our cleanup method
    this.closeSimpleModal();
    
    // Also remove any other modals that might exist
    document.querySelectorAll('.hero-feature-modal-simple, .hero-feature-modal, .hero-feature-modal-backdrop').forEach(modal => {
      console.log('[Hero] Removing modal:', modal.className);
      modal.remove();
    });
    
    // Clear any stored references
    this.currentModal = null;
    this.currentEscHandler = null;
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
      console.log('[Hero] Starting app after cleanup');
      this.startApp();
    }, 100);
  }

  startAppFromCarousel() {
    // Close the carousel first
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.remove();
    }
    // Then start the app
    this.startApp();
  }

  showFeatureCarousel() {
    // Create interactive carousel of all features
    const carousel = document.createElement('div');
    carousel.className = 'hero-carousel';
    carousel.innerHTML = `
      <div class="hero-carousel-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="hero-carousel-container">
        <div class="hero-carousel-header">
          <h2>Discover Premium Features</h2>
          <button class="hero-carousel-close" onclick="this.closest('.hero-carousel').remove()">×</button>
        </div>
        <div class="hero-carousel-track">
          ${Array.from(this.features.entries()).map(([key, feature], index) => `
            <div class="hero-carousel-slide ${index === 0 ? 'active' : ''}" data-feature="${key}">
              <div class="hero-carousel-icon">${feature.icon}</div>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
              <ul class="hero-carousel-features">
                ${feature.tutorial.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        <div class="hero-carousel-nav">
          <button class="hero-carousel-prev" onclick="window.heroCarouselPrev()">←</button>
          <div class="hero-carousel-dots">
            ${Array.from(this.features.keys()).map((_, index) => `
              <span class="hero-carousel-dot ${index === 0 ? 'active' : ''}" 
                    data-index="${index}" 
                    onclick="window.heroCarouselGoTo(${index})"></span>
            `).join('')}
          </div>
          <button class="hero-carousel-next" onclick="window.heroCarouselNext()">→</button>
        </div>
        <div class="hero-carousel-actions">
          <button class="hero-btn hero-btn-primary" onclick="window.heroLanding.startAppFromCarousel()">
            Start Using App
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(carousel);
    
    // Setup carousel navigation
    let currentSlide = 0;
    const slides = carousel.querySelectorAll('.hero-carousel-slide');
    const dots = carousel.querySelectorAll('.hero-carousel-dot');
    
    window.heroCarouselNext = () => {
      currentSlide = (currentSlide + 1) % slides.length;
      this.updateCarousel(slides, dots, currentSlide);
    };
    
    window.heroCarouselPrev = () => {
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      this.updateCarousel(slides, dots, currentSlide);
    };
    
    window.heroCarouselGoTo = (index) => {
      currentSlide = index;
      this.updateCarousel(slides, dots, currentSlide);
    };
  }

  updateCarousel(slides, dots, index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  showOnboarding() {
    // Progressive onboarding for first-time users
    const onboarding = document.createElement('div');
    onboarding.className = 'hero-onboarding';
    onboarding.innerHTML = `
      <div class="hero-onboarding-overlay"></div>
      <div class="hero-onboarding-tooltip" data-step="1">
        <div class="hero-onboarding-arrow"></div>
        <div class="hero-onboarding-content">
          <h3>Welcome! Let's get you started</h3>
          <p>This is your event discovery feed. Swipe through exclusive gaming industry parties.</p>
          <div class="hero-onboarding-actions">
            <button class="hero-btn-text" onclick="window.skipOnboarding()">Skip</button>
            <button class="hero-btn hero-btn-primary" onclick="window.nextOnboardingStep()">
              Next →
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(onboarding);
    
    // Setup onboarding flow
    window.currentOnboardingStep = 1;
    window.onboardingSteps = [
      {
        target: '.party-card:first-child',
        title: 'Save Events',
        text: 'Tap the bookmark to save events to your personal collection'
      },
      {
        target: '.nav-item[data-section="people"]',
        title: 'Network with Professionals',
        text: 'Connect with developers, publishers, and industry leaders'
      },
      {
        target: '.nav-item[data-section="calendar"]',
        title: 'Sync Your Calendar',
        text: 'Export events directly to Google Calendar or Apple Calendar'
      }
    ];
    
    window.nextOnboardingStep = () => {
      if (window.currentOnboardingStep < window.onboardingSteps.length) {
        window.currentOnboardingStep++;
        this.updateOnboardingStep(onboarding);
      } else {
        this.completeOnboarding(onboarding);
      }
    };
    
    window.skipOnboarding = () => {
      this.completeOnboarding(onboarding);
    };
  }

  updateOnboardingStep(container) {
    const step = window.onboardingSteps[window.currentOnboardingStep - 1];
    const tooltip = container.querySelector('.hero-onboarding-tooltip');
    const target = document.querySelector(step.target);
    
    if (target) {
      const rect = target.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 10}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
      tooltip.style.transform = 'translateX(-50%)';
    }
    
    tooltip.querySelector('h3').textContent = step.title;
    tooltip.querySelector('p').textContent = step.text;
    
    if (window.currentOnboardingStep === window.onboardingSteps.length) {
      tooltip.querySelector('.hero-btn').textContent = 'Finish';
    }
  }

  completeOnboarding(container) {
    container.style.animation = 'fadeOut 300ms ease-out';
    setTimeout(() => container.remove(), 300);
    localStorage.setItem('onboarding_completed', 'true');
    
    // Show success toast
    this.showToast('Welcome aboard! You\'re all set up 🎉');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'hero-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideUp 300ms ease-out';
    }, 10);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 300ms ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  skipHero() {
    this.heroContainer.style.display = 'none';
    this.appContainer.style.display = 'block';
    
    // Trigger app initialization
    window.dispatchEvent(new Event('app-ready'));
  }
}

// Initialize on DOM ready and expose globally
let heroLandingInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    heroLandingInstance = new HeroLanding();
    window.heroLanding = heroLandingInstance;
  });
} else {
  heroLandingInstance = new HeroLanding();
  window.heroLanding = heroLandingInstance;
}

// Listen for app-ready event to initialize the main app
window.addEventListener('app-ready', () => {
  // Import and initialize the app dynamically
  import('./app-unified.js').then(module => {
    console.log('[App] Initializing main application');
  }).catch(err => {
    console.error('[App] Failed to load:', err);
    // Fallback: just show the content
    document.getElementById('app').style.display = 'block';
  });
});

// Add required styles for modals and overlays
const style = document.createElement('style');
style.textContent = `
  /* Feature Modal */
  .hero-feature-modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--hero-space-4);
    opacity: 0;
    pointer-events: none;
    transition: opacity 300ms ease-out;
  }
  
  .hero-feature-modal.active {
    opacity: 1;
    pointer-events: auto;
  }
  
  .hero-feature-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: opacity 300ms ease-out;
  }
  
  .hero-feature-modal-content {
    position: relative;
    background: var(--hero-gray-900);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--hero-radius-xl);
    padding: var(--hero-space-6);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.9) translateY(20px);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .hero-feature-modal.active .hero-feature-modal-content {
    transform: scale(1) translateY(0);
  }
  
  .hero-feature-modal-header {
    display: flex;
    align-items: center;
    gap: var(--hero-space-4);
    margin-bottom: var(--hero-space-5);
  }
  
  .hero-feature-modal-icon {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--hero-accent) 0%, var(--hero-purple) 100%);
    border-radius: var(--hero-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
  }
  
  .hero-feature-modal-title {
    font-size: var(--hero-text-2xl);
    font-weight: 600;
    color: var(--hero-white);
  }
  
  .hero-feature-modal-description {
    color: var(--hero-gray-400);
    margin-bottom: var(--hero-space-5);
    line-height: 1.6;
  }
  
  .hero-feature-modal-list {
    list-style: none;
    margin-bottom: var(--hero-space-6);
  }
  
  .hero-feature-modal-item {
    display: flex;
    align-items: center;
    gap: var(--hero-space-3);
    padding: var(--hero-space-3) 0;
    color: var(--hero-gray-300);
  }
  
  .hero-feature-modal-check {
    color: var(--hero-green);
    font-weight: 600;
  }
  
  .hero-feature-modal-actions {
    display: flex;
    gap: var(--hero-space-3);
  }
  
  /* Carousel */
  .hero-carousel {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--hero-space-4);
  }
  
  .hero-carousel-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    cursor: pointer;
  }
  
  .hero-carousel-container {
    position: relative;
    background: var(--hero-gray-900);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--hero-radius-xl);
    padding: var(--hero-space-8);
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
  }
  
  .hero-carousel-track {
    position: relative;
    height: 400px;
    margin: var(--hero-space-6) 0;
  }
  
  .hero-carousel-slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    opacity: 0;
    transform: translateX(100%);
    transition: all 500ms var(--hero-easing);
  }
  
  .hero-carousel-slide.active {
    opacity: 1;
    transform: translateX(0);
  }
  
  /* Onboarding */
  .hero-onboarding-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
  }
  
  .hero-onboarding-tooltip {
    position: fixed;
    background: var(--hero-gray-900);
    border: 2px solid var(--hero-accent);
    border-radius: var(--hero-radius-lg);
    padding: var(--hero-space-5);
    max-width: 400px;
    z-index: 1000;
    box-shadow: 0 20px 40px rgba(0, 122, 255, 0.3);
  }
  
  /* Toast */
  .hero-toast {
    position: fixed;
    bottom: var(--hero-space-6);
    left: 50%;
    transform: translateX(-50%);
    background: var(--hero-gray-900);
    color: var(--hero-white);
    padding: var(--hero-space-4) var(--hero-space-6);
    border-radius: var(--hero-radius-full);
    box-shadow: var(--hero-shadow-xl);
    z-index: 1001;
    animation: slideUp 300ms var(--hero-easing);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(style);