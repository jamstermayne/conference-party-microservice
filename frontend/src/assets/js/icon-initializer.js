/**
 * Icon Initializer
 * Renders all professional SVG icons on page load
 */

import { getIcon } from './icon-gallery.js';

// Export getIcon to window for non-module scripts
window.getIcon = getIcon;

// Initialize icons when DOM is ready
function initializeIcons() {
  // Find all elements with data-icon attribute
  const iconElements = document.querySelectorAll('[data-icon]');
  
  iconElements.forEach(element => {
    const iconName = element.dataset.icon;
    const size = element.dataset.iconSize || 24;
    const className = element.dataset.iconClass || '';
    
    const iconSvg = getIcon(iconName, size, className);
    if (iconSvg) {
      element.innerHTML = iconSvg;
    }
  });
  
  // Also replace common emoji patterns with professional icons
  replaceEmojiIcons();
}

// Replace emoji icons in text content
function replaceEmojiIcons() {
  const emojiMap = {
    '🎯': 'target',
    '👥': 'users',
    '🤝': 'handshake',
    '📱': 'smartphone',
    '⚡': 'zap',
    '✨': 'sparkles',
    '🔥': 'zap',
    '📍': 'mapPin',
    '👤': 'users',
    '⭐': 'star',
    '🔗': 'link',
    '📧': 'mail',
    '⚙️': 'settings',
    '➕': 'plus',
    '✅': 'checkCircle',
    '❌': 'x',
    '🔍': 'search',
    '📅': 'calendar',
    '🗺️': 'globe',
    '💬': 'message',
    '🔔': 'bell',
    '📊': 'chartBar',
    '🎉': 'gift',
    '🚀': 'zap',
    '💡': 'brain',
    '🛡️': 'shield',
    '🔒': 'lock',
    '🔑': 'key',
    '📋': 'save',
    '📈': 'trendingUp',
    '🎨': 'edit',
    '💻': 'cpu',
    '🌐': 'globe',
    '📡': 'server',
    '🔧': 'settings',
    '🏠': 'home'
  };
  
  // Find elements with .icon-emoji class for replacement
  const emojiElements = document.querySelectorAll('.icon-emoji');
  emojiElements.forEach(element => {
    const emoji = element.textContent.trim();
    const iconName = emojiMap[emoji];
    if (iconName) {
      element.innerHTML = getIcon(iconName, 24, 'replaced-icon');
    }
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeIcons);
} else {
  initializeIcons();
}

// Re-run when new content is added dynamically
export function refreshIcons() {
  initializeIcons();
}

// Expose to window for non-module usage
window.refreshIcons = refreshIcons;