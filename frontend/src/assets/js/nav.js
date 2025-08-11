// Navigation Enhancement
import Events from './foundation/events.js';

class Navigation {
  constructor() {
    this.init();
  }

  init() {
    this.bindMobileToggle();
    this.bindRouteClicks();
    this.bindOverlayClose();
    
    // Listen for route changes to update active states
    Events.on('route:change', (data) => this.updateActiveState(data.route));
  }

  bindMobileToggle() {
    const menuBtn = document.querySelector('#menu');
    const sidenav = document.querySelector('#sidenav');
    const overlay = document.querySelector('#overlay');

    if (menuBtn && sidenav && overlay) {
      menuBtn.addEventListener('click', () => {
        sidenav.classList.toggle('open');
        overlay.classList.toggle('show');
        overlay.hidden = !overlay.classList.contains('show');
      });
    }
  }

  bindRouteClicks() {
    document.querySelectorAll('.nav-item[data-route]').forEach(item => {
      item.addEventListener('click', (e) => {
        const route = item.dataset.route;
        if (route) {
          Events.emit('navigate', route);
          this.closeMobileNav();
        }
      });
    });
  }

  bindOverlayClose() {
    const overlay = document.querySelector('#overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeMobileNav();
      });
    }
  }

  closeMobileNav() {
    const sidenav = document.querySelector('#sidenav');
    const overlay = document.querySelector('#overlay');
    
    if (sidenav && overlay) {
      sidenav.classList.remove('open');
      overlay.classList.remove('show');
      overlay.hidden = true;
    }
  }

  updateActiveState(currentRoute) {
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.dataset.route;
      if (route === currentRoute) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Emit navigation event for analytics
    Events.emit('nav:change', { route: currentRoute });
  }

  updateBadge(route, count) {
    const navItem = document.querySelector(`[data-route="${route}"]`);
    if (navItem) {
      let badge = navItem.querySelector('.pill');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'pill';
          navItem.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count.toString();
      } else if (badge) {
        badge.remove();
      }
    }
  }
}

// Initialize navigation
const navigation = new Navigation();

// Expose for external use
window.Navigation = navigation;

export default navigation;