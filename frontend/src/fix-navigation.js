/**
 * Fix Navigation - Emergency patch to make Get Started and Matchmaking work
 */

// Wait for page to load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Fix] Navigation patch loading...');

  // Fix 1: Ensure window.startApp works
  if (typeof window.startApp !== 'function') {
    window.startApp = function() {
      console.log('[Fix] startApp called - checking profile...');

      const hasProfile = localStorage.getItem('smartProfile');

      if (!hasProfile) {
        // Start smart onboarding
        if (window.smartOnboarding) {
          console.log('[Fix] Starting smart onboarding');
          window.smartOnboarding.start();
        } else {
          console.log('[Fix] Smart onboarding not found, showing app directly');
          showApp();
        }
      } else {
        // Show app directly
        console.log('[Fix] Profile exists, showing app');
        showApp();
      }
    };
  }

  // Helper function to show app
  function showApp() {
    const heroLanding = document.getElementById('hero-landing');
    const app = document.getElementById('app');

    if (heroLanding) {
      heroLanding.style.display = 'none';
    }

    if (app) {
      app.style.display = 'block';
      window.dispatchEvent(new Event('app-ready'));

      // Navigate to matchmaking after a moment
      setTimeout(() => {
        navigateToMatchmaking();
      }, 1000);
    }
  }

  // Navigate to matchmaking
  function navigateToMatchmaking() {
    console.log('[Fix] Navigating to matchmaking...');

    // Try sidebar controller first
    if (window.sidebarController) {
      console.log('[Fix] Using sidebar controller');
      window.sidebarController.navigateToSection('matchmaking');
    } else {
      // Fallback: Create matchmaking section directly
      console.log('[Fix] Creating matchmaking section directly');
      const mainContent = document.querySelector('.main-content') ||
                         document.querySelector('.panel-stack') ||
                         document.querySelector('#app-main') ||
                         document.getElementById('app');

      if (mainContent) {
        mainContent.innerHTML = `
          <div style="padding: 20px;">
            <h2>AI Matchmaking Engine</h2>
            <p>Loading matchmaking dashboard...</p>
            <iframe
              src="/matchmaking-admin.html"
              style="width: 100%; height: 80vh; border: none; border-radius: 8px; margin-top: 20px;"
            ></iframe>
          </div>
        `;
      }
    }
  }

  // Fix 2: Add matchmaking to any existing navigation
  setTimeout(() => {
    // Check for nav tabs
    const navContainer = document.querySelector('.nav-tabs') ||
                        document.querySelector('.sidebar__nav') ||
                        document.querySelector('.nav');

    if (navContainer && !navContainer.querySelector('[data-section="matchmaking"]')) {
      console.log('[Fix] Adding matchmaking to navigation');

      const matchmakingLink = document.createElement('a');
      matchmakingLink.href = '#matchmaking';
      matchmakingLink.className = 'nav-tab';
      matchmakingLink.dataset.section = 'matchmaking';
      matchmakingLink.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>Matchmaking</span>
        <span style="background: linear-gradient(135deg, #6aa2ff 0%, #b483ff 100%); color: white; font-size: 9px; padding: 2px 6px; border-radius: 8px; margin-left: 5px;">AI</span>
      `;

      matchmakingLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToMatchmaking();
      });

      navContainer.appendChild(matchmakingLink);
    }
  }, 2000);

  // Fix 3: Listen for smart onboarding complete
  window.addEventListener('smart-onboarding-complete', () => {
    console.log('[Fix] Smart onboarding complete, navigating to matchmaking');
    showApp();
  });

  // Fix 4: Handle direct navigation
  if (window.location.hash === '#matchmaking') {
    setTimeout(() => {
      navigateToMatchmaking();
    }, 1500);
  }

  console.log('[Fix] Navigation patch loaded successfully');
});

// Expose navigation function globally
window.goToMatchmaking = function() {
  const heroLanding = document.getElementById('hero-landing');
  const app = document.getElementById('app');

  if (heroLanding) {
    heroLanding.style.display = 'none';
  }

  if (app) {
    app.style.display = 'block';
  }

  setTimeout(() => {
    const mainContent = document.querySelector('.main-content') ||
                       document.querySelector('.panel-stack') ||
                       document.querySelector('#app-main') ||
                       document.getElementById('app');

    if (mainContent) {
      mainContent.innerHTML = `
        <iframe
          src="/matchmaking-admin.html"
          style="width: 100%; height: 90vh; border: none;"
        ></iframe>
      `;
    }
  }, 100);
};