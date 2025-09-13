/**
 * Demo Reset Button
 * Adds a floating button to quickly reset auth for demo purposes
 */

class DemoResetButton {
  constructor() {
    this.init();
  }

  init() {
    // Only show if authenticated
    if (localStorage.getItem('auth_token')) {
      this.createButton();
    }

    // Listen for auth changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') {
        if (e.newValue) {
          this.createButton();
        } else {
          this.removeButton();
        }
      }
    });
  }

  createButton() {
    // Remove existing button if any
    this.removeButton();

    // Create button
    const button = document.createElement('button');
    button.id = 'demo-reset-btn';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M8 16H3v5"/>
      </svg>
      <span>Reset Demo</span>
    `;
    button.title = 'Reset authentication for demo (Ctrl+Shift+R)';
    
    // Style the button
    button.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      border: none;
      border-radius: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      transition: all 200ms ease;
      opacity: 0.9;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.opacity = '1';
      button.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.opacity = '0.9';
      button.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
    });

    // SVG icon styling
    const svg = button.querySelector('svg');
    svg.style.cssText = `
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    `;

    // Add click handler
    button.addEventListener('click', () => {
      if (confirm('Reset authentication for demo?\n\nThis will log you out so you can demo the magic link flow again.')) {
        // Animate button
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 200);

        // Reset auth
        if (window.resetAuth) {
          window.resetAuth();
        } else {
          // Fallback if resetAuth isn't available
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
          localStorage.removeItem('auth_timestamp');
          location.reload();
        }
      }
    });

    // Add to page
    document.body.appendChild(button);

    // Animate in
    setTimeout(() => {
      button.style.animation = 'slideInLeft 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }, 100);

    // Add animation keyframes if not already added
    if (!document.getElementById('demo-reset-styles')) {
      const style = document.createElement('style');
      style.id = 'demo-reset-styles';
      style.textContent = `
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 0.9;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          #demo-reset-btn {
            bottom: 80px !important;
            left: 12px !important;
            padding: 10px 16px !important;
            font-size: 13px !important;
          }
          
          #demo-reset-btn span {
            display: none;
          }
          
          #demo-reset-btn svg {
            margin: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  removeButton() {
    const existing = document.getElementById('demo-reset-btn');
    if (existing) {
      existing.style.animation = 'slideOutLeft 300ms ease-in';
      setTimeout(() => existing.remove(), 300);
    }
  }
}

// Initialize
const demoResetButton = new DemoResetButton();
window.demoResetButton = demoResetButton;

// Also check on page focus (in case auth changed in another tab)
window.addEventListener('focus', () => {
  if (localStorage.getItem('auth_token')) {
    demoResetButton.createButton();
  } else {
    demoResetButton.removeButton();
  }
});

export default demoResetButton;