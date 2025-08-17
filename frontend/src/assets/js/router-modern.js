/**
 * Modern Router - Handles all navigation
 * Ensures all components are accessible
 */

class ModernRouter {
  constructor() {
    this.routes = {
      '/home': () => this.showHome(),
      '/parties': () => this.showParties(),
      '/invites': () => this.showInvites(),
      '/calendar': () => this.showCalendar(),
      '/contacts': () => this.showContacts(),
      '/me': () => this.showAccount(),
      '/account': () => this.showAccount()
    };
    
    this.currentRoute = null;
  }

  init() {
    // Handle initial route
    this.handleRoute();
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link && !e.defaultPrevented) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#/')) {
          e.preventDefault();
          location.hash = href;
        }
      }
    });
  }

  handleRoute() {
    const hash = location.hash || '#/home';
    const route = hash.replace('#', '') || '/home';
    
    console.log('[Router] Navigating to:', route);
    
    // Close any open overlays first
    this.closeAllOverlays();
    
    // Handle the route
    if (this.routes[route]) {
      this.currentRoute = route;
      this.routes[route]();
    } else if (route.startsWith('/party/')) {
      this.showPartyDetail(route.split('/')[2]);
    } else {
      // Default to home
      location.hash = '#/home';
    }
  }

  closeAllOverlays() {
    // Close any active panels
    document.querySelectorAll('.panel--active').forEach(panel => {
      panel.classList.remove('panel--active');
    });
    
    // Close party detail if open
    const detail = document.querySelector('.party-detail');
    if (detail) detail.remove();
  }

  showHome() {
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Make sure home content is visible
    const homePanel = document.querySelector('.home-panel');
    if (homePanel) {
      homePanel.style.display = 'block';
    }
  }

  showParties() {
    // Show all parties view
    const overlay = document.getElementById('_overlay_panel');
    if (overlay) {
      overlay.classList.add('panel--active');
      // Load all parties
      if (window.mountParties) {
        const today = new Date().toISOString().split('T')[0];
        window.mountParties(today);
      }
    }
  }

  showInvites() {
    // Show invites panel
    const panel = document.getElementById('panel-invites');
    if (panel) {
      panel.classList.add('panel--active');
    } else if (window.invitesPanel) {
      window.invitesPanel.open();
    }
  }

  showCalendar() {
    // Show calendar panel
    const panel = document.getElementById('panel-calendar');
    if (panel) {
      panel.classList.add('panel--active');
    } else if (window.calendarPanel) {
      window.calendarPanel.open();
    }
  }

  showContacts() {
    // Show contacts panel
    const panel = document.getElementById('panel-contacts');
    if (panel) {
      panel.classList.add('panel--active');
    } else if (window.contactsPanel) {
      window.contactsPanel.open();
    }
  }

  showAccount() {
    // Show account panel
    const panel = document.getElementById('panel-account');
    if (panel) {
      panel.classList.add('panel--active');
    } else if (window.accountPanel) {
      window.accountPanel.open();
    }
  }

  showPartyDetail(partyId) {
    // Show party detail view
    if (window.partyFlow) {
      const party = window.partyFlow.parties.find(p => p.id === partyId);
      if (party) {
        window.partyFlow.showDetails(party);
      }
    } else if (window.partyCarouselModern) {
      window.partyCarouselModern.showDetails(partyId);
    }
  }
}

// Initialize router
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modernRouter = new ModernRouter();
    window.modernRouter.init();
  });
} else {
  window.modernRouter = new ModernRouter();
  window.modernRouter.init();
}

export default ModernRouter;