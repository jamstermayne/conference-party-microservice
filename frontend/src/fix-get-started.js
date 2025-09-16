/**
 * Fix for Get Started button - ensures it works correctly
 */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('[FixGetStarted] Initializing...');

  // Define the startApp function immediately
  window.startApp = function() {
    console.log('[FixGetStarted] startApp called');

    // Check if user has completed smart onboarding
    const hasProfile = localStorage.getItem('smartProfile');

    if (!hasProfile) {
      // New user - show FTUE/Smart Onboarding
      console.log('[FixGetStarted] No profile found, starting FTUE');

      // Hide hero
      const heroLanding = document.getElementById('hero-landing');
      if (heroLanding) {
        heroLanding.style.display = 'none';
      }

      // Check if smart onboarding exists and start it
      if (window.smartOnboarding) {
        console.log('[FixGetStarted] Starting smart onboarding');
        window.smartOnboarding.show();
      } else {
        console.log('[FixGetStarted] Smart onboarding not ready, waiting...');
        // Wait for smart onboarding to load
        setTimeout(() => {
          if (window.smartOnboarding) {
            window.smartOnboarding.show();
          } else {
            console.error('[FixGetStarted] Smart onboarding failed to load');
            // Fallback: show app
            showAppWithEvents();
          }
        }, 500);
      }
      return;
    }

    // Existing user - show app and go to events
    console.log('[FixGetStarted] Profile exists, showing app');
    showAppWithEvents();
  };

  function showAppWithEvents() {
    const heroLanding = document.getElementById('hero-landing');
    const app = document.getElementById('app');

    if (heroLanding) {
      heroLanding.style.display = 'none';
    }

    if (app) {
      app.style.display = 'block';
      window.dispatchEvent(new Event('app-ready'));

      // Navigate to events
      setTimeout(() => {
        if (window.sidebarController && window.sidebarController.navigateToSection) {
          console.log('[FixGetStarted] Navigating to events via sidebar');
          window.sidebarController.navigateToSection('parties');
        } else {
          console.log('[FixGetStarted] Sidebar not ready, setting hash');
          window.location.hash = '#parties';
        }
      }, 500);
    }
  }

  // Also set up the matchmaking navigation
  window.goToMatchmaking = function() {
    console.log('[FixGetStarted] goToMatchmaking called');

    // Ensure app is visible
    const heroLanding = document.getElementById('hero-landing');
    const app = document.getElementById('app');

    if (heroLanding) {
      heroLanding.style.display = 'none';
    }

    if (app) {
      app.style.display = 'block';
      window.dispatchEvent(new Event('app-ready'));
    }

    // Navigate to matchmaking
    setTimeout(() => {
      if (window.sidebarController && window.sidebarController.navigateToSection) {
        console.log('[FixGetStarted] Navigating to matchmaking');
        window.sidebarController.navigateToSection('matchmaking');
      } else {
        // Fallback: load matchmaking directly
        const mainContent = document.querySelector('.main-content') ||
                           document.querySelector('.panel-stack') ||
                           document.getElementById('mainContent');

        if (mainContent) {
          console.log('[FixGetStarted] Loading matchmaking directly');
          mainContent.innerHTML = `
            <iframe
              src="/matchmaking-admin.html"
              style="width: 100%; height: 100vh; border: none;"
              onload="console.log('[FixGetStarted] Matchmaking iframe loaded')"
            ></iframe>
          `;
        }
      }
    }, 500);
  };

  // Override any later definitions
  let checkCount = 0;
  const checkInterval = setInterval(() => {
    checkCount++;

    // Make sure our function is the active one
    if (window.startApp && !window.startApp.toString().includes('[FixGetStarted]')) {
      console.log('[FixGetStarted] Overriding startApp definition');
      window.startApp = function() {
        console.log('[FixGetStarted] startApp called (override)');

        const heroLanding = document.getElementById('hero-landing');
        const app = document.getElementById('app');

        if (heroLanding) {
          heroLanding.style.display = 'none';
        }

        if (app) {
          app.style.display = 'block';
          window.dispatchEvent(new Event('app-ready'));

          setTimeout(() => {
            if (window.sidebarController && window.sidebarController.navigateToSection) {
              window.sidebarController.navigateToSection('parties');
            } else {
              window.location.hash = '#parties';
            }
          }, 500);
        }
      };
    }

    // Stop checking after 5 seconds
    if (checkCount > 50) {
      clearInterval(checkInterval);
    }
  }, 100);

  // Listen for smart onboarding completion
  window.addEventListener('smart-onboarding-complete', () => {
    console.log('[FixGetStarted] Smart onboarding completed, showing app');

    // Show app
    const app = document.getElementById('app');
    if (app) {
      app.style.display = 'block';
      window.dispatchEvent(new Event('app-ready'));

      // Navigate to matchmaking after profile creation
      setTimeout(() => {
        if (window.sidebarController && window.sidebarController.navigateToSection) {
          console.log('[FixGetStarted] Navigating to matchmaking after FTUE');
          window.sidebarController.navigateToSection('matchmaking');
        } else {
          window.location.hash = '#matchmaking';
        }
      }, 500);
    }
  });

  console.log('[FixGetStarted] Ready');
}