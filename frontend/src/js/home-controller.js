// Home Controller - Initialize and open home panel
import { openHome } from './panels/home.js';

export function initHome() {
  // Open home panel immediately on load
  openHome(null);
}

// Handle browser back button
window.addEventListener('popstate', () => {
  // Stack will handle the back navigation
  if (window.Stack) {
    window.Stack.pop();
  }
});