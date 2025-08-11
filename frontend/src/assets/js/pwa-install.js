// PWA Install Handler
let deferredPrompt;
let installCard;

// Check if app is already installed
function isAppInstalled() {
  // Check for iOS
  if (window.navigator.standalone) {
    return true;
  }
  
  // Check for Android/Chrome
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for Safari on iOS (different method)
  if (window.navigator.standalone === false) {
    return false;
  }
  
  return false;
}

// Detect iOS Safari
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Show install prompt
function showInstallPrompt() {
  installCard = document.getElementById('install-card');
  
  if (!installCard || isAppInstalled()) {
    return;
  }
  
  // Show iOS-specific instructions
  if (isIOS()) {
    const iosHint = document.getElementById('ios-hint');
    const installBtn = document.getElementById('install-now');
    
    if (iosHint) {
      iosHint.hidden = false;
    }
    if (installBtn) {
      installBtn.textContent = 'How to Install';
      installBtn.addEventListener('click', showIOSInstructions);
    }
  }
  
  // Show the install card
  installCard.hidden = false;
  
  // Track that we've shown the prompt
  localStorage.setItem('velocity_install_prompt_shown', Date.now());
}

// Show iOS installation instructions
function showIOSInstructions() {
  const modal = document.createElement('div');
  modal.className = 'modal visible';
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-content">
      <button class="modal-close" aria-label="Close">×</button>
      <h2 class="modal-title">Install Velocity on iOS</h2>
      <div class="modal-body">
        <ol style="text-align: left; line-height: 1.8;">
          <li>Tap the <span class="ios-chip">Share ⬆</span> button at the bottom of Safari</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> in the top right corner</li>
        </ol>
        <p style="margin-top: 1rem; color: var(--muted);">
          The app will appear on your home screen like a native app!
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Got it!</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.remove();
  });
}

// Handle beforeinstallprompt event (Chrome/Edge)
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 Install prompt available');
  
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show our custom install UI
  showInstallPrompt();
});

// Handle install button click
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-now');
  const laterBtn = document.getElementById('install-later');
  
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        // iOS or already installed
        if (isIOS()) {
          showIOSInstructions();
        }
        return;
      }
      
      // Show the browser's install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ PWA install accepted');
        hideInstallCard();
        
        // Show success message
        if (window.showToast) {
          window.showToast({ 
            message: '🎉 App installed successfully!', 
            type: 'success' 
          });
        }
      } else {
        console.log('❌ PWA install dismissed');
      }
      
      // We've used the prompt, and can't use it again
      deferredPrompt = null;
    });
  }
  
  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      hideInstallCard();
      // Don't show again for 7 days
      localStorage.setItem('velocity_install_dismissed', Date.now() + (7 * 24 * 60 * 60 * 1000));
    });
  }
  
  // Check if we should show the install prompt
  checkInstallPromptTiming();
});

// Hide install card
function hideInstallCard() {
  if (installCard) {
    installCard.hidden = true;
  }
}

// Check if enough time has passed to show prompt again
function checkInstallPromptTiming() {
  if (isAppInstalled()) {
    return;
  }
  
  const dismissed = localStorage.getItem('velocity_install_dismissed');
  const shown = localStorage.getItem('velocity_install_prompt_shown');
  
  if (dismissed && Date.now() < parseInt(dismissed)) {
    // User dismissed recently, don't show
    return;
  }
  
  if (!shown || Date.now() - parseInt(shown) > 24 * 60 * 60 * 1000) {
    // Never shown or shown more than 24 hours ago
    // Wait a bit before showing to not be too aggressive
    setTimeout(() => {
      if (deferredPrompt || isIOS()) {
        showInstallPrompt();
      }
    }, 30000); // Show after 30 seconds
  }
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed');
  hideInstallCard();
  deferredPrompt = null;
  
  // Track installation
  if (window.gtag) {
    window.gtag('event', 'app_install', {
      event_category: 'PWA',
      event_label: 'Install'
    });
  }
});

// Export functions for external use
window.pwaInstall = {
  showPrompt: showInstallPrompt,
  hidePrompt: hideInstallCard,
  isInstalled: isAppInstalled,
  isIOS: isIOS
};

export { 
  showInstallPrompt, 
  hideInstallCard, 
  isAppInstalled,
  isIOS 
};