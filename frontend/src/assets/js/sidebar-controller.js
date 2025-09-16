/**
 * Sidebar Controller - Manages collapsible sidebar navigation
 */

class SidebarController {
  constructor() {
    this.sidebar = null;
    this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.isMobileOpen = false;
    this.activeSection = 'parties';
    
    this.init();
  }

  init() {
    this.createSidebarStructure();
    this.attachEventListeners();
    this.setActiveNavItem(this.activeSection);
    
    // Apply saved collapsed state
    if (this.isCollapsed && window.innerWidth > 768) {
      this.sidebar.classList.add('collapsed');
    }
  }

  createSidebarStructure() {
    // Update app layout
    const app = document.getElementById('app');
    if (!app) return;

    // Preserve existing content
    const existingContent = app.innerHTML;
    
    // Create new layout with sidebar
    app.innerHTML = `
      <div class="app-layout">
        <!-- Collapsible Sidebar -->
        <aside class="sidebar" id="sidebar">
          <div class="sidebar__header">
            <a href="#" class="sidebar__logo">
              <div class="sidebar__logo-icon">GC</div>
              <span class="sidebar__logo-text">Gamescom 2025</span>
            </a>
            <button class="sidebar__toggle" id="sidebarToggle" aria-label="Toggle sidebar">
              <svg class="sidebar__toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
          </div>
          
          <nav class="sidebar__nav">
            <ul class="nav__list">
              <li class="nav__item">
                <a href="#parties" class="nav__link" data-section="parties" data-tooltip="Parties">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span class="nav__label">Parties</span>
                </a>
              </li>
              <li class="nav__item">
                <a href="#calendar" class="nav__link" data-section="calendar" data-tooltip="Calendar">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
                  </svg>
                  <span class="nav__label">Calendar</span>
                </a>
              </li>
              <li class="nav__item">
                <a href="#map" class="nav__link" data-section="map" data-tooltip="Map">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span class="nav__label">Map</span>
                </a>
              </li>
              <li class="nav__item">
                <a href="#contacts" class="nav__link" data-section="contacts" data-tooltip="Contacts">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  <span class="nav__label">Contacts</span>
                </a>
              </li>
              <li class="nav__item">
                <a href="#invites" class="nav__link" data-section="invites" data-tooltip="Invites">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  <span class="nav__label">Invites</span>
                </a>
              </li>
              <li class="nav__item">
                <a href="#hotspots" class="nav__link" data-section="hotspots" data-tooltip="Hotspots">
                  <svg class="nav__icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                  </svg>
                  <span class="nav__label">Hotspots</span>
                </a>
              </li>
            </ul>
          </nav>
          
          <div class="sidebar__footer">
            <div class="user-menu" id="userMenu">
              <div class="user-avatar">U</div>
              <div class="user-info">
                <div class="user-name">User</div>
                <div class="user-role">Attendee</div>
              </div>
            </div>
          </div>
        </aside>
        
        <!-- Mobile menu button -->
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        
        <!-- Mobile backdrop -->
        <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
        
        <!-- Main content area -->
        <main class="main-content" id="mainContent">
          ${existingContent}
        </main>
      </div>
    `;
    
    this.sidebar = document.getElementById('sidebar');
  }

  attachEventListeners() {
    // Sidebar toggle button
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleSidebar());
    }

    // Mobile menu button
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Mobile backdrop
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeMobileMenu());
    }

    // Navigation links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.navigateToSection(section);
      });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isMobileOpen) {
        this.closeMobileMenu();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
      // Escape to close mobile menu
      if (e.key === 'Escape' && this.isMobileOpen) {
        this.closeMobileMenu();
      }
    });
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) return; // Don't toggle on mobile
    
    this.isCollapsed = !this.isCollapsed;
    this.sidebar.classList.toggle('collapsed');
    
    // Save state
    localStorage.setItem('sidebarCollapsed', this.isCollapsed);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('sidebarToggled', { 
      detail: { collapsed: this.isCollapsed } 
    }));
  }

  toggleMobileMenu() {
    this.isMobileOpen = !this.isMobileOpen;
    this.sidebar.classList.toggle('mobile-open');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = this.isMobileOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.isMobileOpen = false;
    this.sidebar.classList.remove('mobile-open');
    document.body.style.overflow = '';
  }

  navigateToSection(section) {
    this.activeSection = section;
    this.setActiveNavItem(section);
    
    // Close mobile menu if open
    if (this.isMobileOpen) {
      this.closeMobileMenu();
    }
    
    // Update URL hash
    window.location.hash = section;
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('sidebarNavigation', { 
      detail: { section } 
    }));
    
    // Let app-unified.js handle the actual content rendering
    if (window.conferenceApp && typeof window.conferenceApp.navigateToSection === 'function') {
      window.conferenceApp.navigateToSection(section);
    }
  }

  setActiveNavItem(section) {
    // Remove active class from all links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.remove('active');
      link.setAttribute('aria-current', 'false');
    });
    
    // Add active class to current section
    const activeLink = document.querySelector(`.nav__link[data-section="${section}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('aria-current', 'page');
    }
  }

  // Public API
  collapse() {
    if (!this.isCollapsed && window.innerWidth > 768) {
      this.toggleSidebar();
    }
  }

  expand() {
    if (this.isCollapsed && window.innerWidth > 768) {
      this.toggleSidebar();
    }
  }

  setUserInfo(name, role) {
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const avatarEl = document.querySelector('.user-avatar');
    
    if (userNameEl) userNameEl.textContent = name || 'User';
    if (userRoleEl) userRoleEl.textContent = role || 'Attendee';
    if (avatarEl && name) {
      avatarEl.textContent = name.charAt(0).toUpperCase();
    }
  }
}

// Initialize and expose globally
window.sidebarController = new SidebarController();

export default SidebarController;