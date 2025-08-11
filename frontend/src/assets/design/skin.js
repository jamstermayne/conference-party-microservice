// Visual Polish Skin - Automatic UI Enhancement
import Events from '../js/foundation/events.js';

const SKIN_KEY = 'skin';

class SkinManager {
  constructor() {
    this.enabled = localStorage.getItem(SKIN_KEY) !== 'old';
    this.init();
  }

  init() {
    if (!this.enabled) return;
    
    // Auto-enhance interactive elements
    this.enhanceButtons();
    this.enhanceCards();
    this.enhanceInputs();
    this.enhanceLoadingStates();
    
    // Listen for dynamic content
    Events.on('dom:updated', () => this.enhanceAll());
    
    // Observe DOM mutations for new elements
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => this.enhanceAll());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  enhanceButtons() {
    document.querySelectorAll('button:not(.enhanced)').forEach(btn => {
      btn.classList.add('interactive', 'enhanced');
      if (!btn.classList.contains('btn')) {
        btn.classList.add('btn');
      }
    });
  }

  enhanceCards() {
    document.querySelectorAll('.event-card, .connection-card, .opportunity-card').forEach(card => {
      if (!card.classList.contains('enhanced')) {
        card.classList.add('interactive', 'fade-in', 'enhanced');
      }
    });
  }

  enhanceInputs() {
    document.querySelectorAll('input:not(.enhanced), textarea:not(.enhanced)').forEach(input => {
      if (!input.classList.contains('enhanced')) {
        input.classList.add('input', 'enhanced');
      }
    });
  }

  enhanceLoadingStates() {
    // Add loading states to async operations
    Events.on('api:start', (data) => {
      const target = document.querySelector(data.target || 'body');
      if (target) target.classList.add('loading');
    });

    Events.on('api:end', (data) => {
      const target = document.querySelector(data.target || 'body');
      if (target) target.classList.remove('loading');
    });
  }

  enhanceAll() {
    this.enhanceButtons();
    this.enhanceCards();
    this.enhanceInputs();
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(SKIN_KEY, this.enabled ? 'new' : 'old');
    location.reload();
  }
}

// Initialize skin manager
const skinManager = new SkinManager();

// Expose toggle for debugging
window.toggleSkin = () => skinManager.toggle();

export default skinManager;