// Core App Controller
import { initFTUE } from './ftue.js';
import { initParties } from './parties.js';
import { initInvites } from './invites.js';
import { initCalendar } from './calendar.js';
import { initProfile } from './profile.js';
import { initSettings } from './settings.js';
import { initUI } from './ui.js';
import { initPersistence } from './persistence.js';
import { API } from './api.js';

class ConferenceApp {
  constructor() {
    this.currentSection = 'parties';
    this.userData = {};
    this.init();
  }

  async init() {
    // Initialize UI helpers
    initUI();
    
    // Load persisted data
    await initPersistence();
    
    // Check for first-time user
    const isFirstTime = !localStorage.getItem('conference_app_initialized');
    if (isFirstTime) {
      await initFTUE();
    }
    
    // Initialize navigation
    this.initNavigation();
    
    // Initialize sections
    await Promise.all([
      initParties(),
      initInvites(),
      initCalendar(),
      initProfile(),
      initSettings()
    ]);
    
    // Set up mobile menu
    this.initMobileMenu();
    
    // Register service worker for PWA
    this.registerServiceWorker();
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetSection = item.dataset.section;
        
        // Update active states
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show target section
        sections.forEach(section => {
          section.classList.remove('active');
          if (section.id === targetSection) {
            section.classList.add('active');
            this.currentSection = targetSection;
          }
        });
        
        // Close mobile menu if open
        this.closeMobileMenu();
      });
    });
  }

  initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenu');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeSidebar');
    
    menuBtn?.addEventListener('click', () => {
      sidebar.classList.add('open');
    });
    
    closeBtn?.addEventListener('click', () => {
      this.closeMobileMenu();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          e.target !== menuBtn) {
        this.closeMobileMenu();
      }
    });
  }

  closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ConferenceApp());
} else {
  new ConferenceApp();
}

export default ConferenceApp;