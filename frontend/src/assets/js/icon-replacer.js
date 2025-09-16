/**
 * Icon Replacer - Automatically replaces emoji icons with professional SVGs
 * Integrates with IconSystem to provide consistent icon usage
 */

class IconReplacer {
  constructor() {
    // Map emojis to icon names
    this.emojiMap = {
      '🏆': 'trophy',
      '🎯': 'target',
      '⚡': 'zap',
      '💎': 'gem',
      '📊': 'barChart',
      '🤖': 'bot',
      '👥': 'users',
      '🎨': 'palette',
      '📈': 'trendingUp',
      '🎪': 'mapPin',
      '🔍': 'search',
      '📄': 'file',
      '🚀': 'rocket',
      '💰': 'dollarSign',
      '🏢': 'building',
      '🔥': 'flame',
      '✨': 'sparkles',
      '🎮': 'gamepad',
      '💡': 'lightbulb',
      '🔒': 'lock',
      '📱': 'smartphone',
      '💼': 'briefcase',
      '🌟': 'star',
      '✅': 'checkCircle',
      '❌': 'xCircle',
      '⚠️': 'alertTriangle',
      '📁': 'folder',
      '📝': 'edit',
      '🔧': 'settings',
      '🔔': 'bell',
      '📅': 'calendar',
      '💬': 'messageCircle',
      '🌐': 'globe',
      '📧': 'mail',
      '🔗': 'link',
      '🎬': 'film',
      '📍': 'mapPin',
      '💥': 'zap',
      '⭐': 'star',
      '🎭': 'users',
      '➡️': 'arrowRight',
      '⬅️': 'arrowLeft',
      '⬆️': 'arrowUp',
      '⬇️': 'arrowDown',
      '✓': 'check',
      '✗': 'x',
      '★': 'star',
      '▶': 'play',
      '■': 'square',
      '●': 'circle'
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Wait for IconSystem to be available
    if (!window.iconSystem) {
      console.warn('IconReplacer: Waiting for IconSystem...');
      setTimeout(() => this.init(), 100);
      return;
    }

    // Replace all emojis on initial load
    this.replaceAllEmojis();

    // Watch for DOM changes
    this.setupMutationObserver();

    // Add global helper
    window.replaceEmojis = () => this.replaceAllEmojis();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.replaceEmojisInElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  replaceAllEmojis() {
    this.replaceEmojisInElement(document.body);
  }

  replaceEmojisInElement(element) {
    // Skip if element is already processed
    if (element.dataset?.iconsReplaced === 'true') return;

    // Find all text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (parent?.tagName === 'SCRIPT' || parent?.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          // Check if text contains any emoji
          const hasEmoji = Object.keys(this.emojiMap).some(emoji =>
            node.textContent.includes(emoji)
          );
          return hasEmoji ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodesToReplace = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToReplace.push(node);
    }

    // Replace emojis in collected nodes
    nodesToReplace.forEach(textNode => {
      this.replaceEmojisInTextNode(textNode);
    });

    // Mark element as processed
    if (element.dataset) {
      element.dataset.iconsReplaced = 'true';
    }
  }

  replaceEmojisInTextNode(textNode) {
    const text = textNode.textContent;
    let hasEmoji = false;

    // Check if text contains any emoji
    for (const emoji of Object.keys(this.emojiMap)) {
      if (text.includes(emoji)) {
        hasEmoji = true;
        break;
      }
    }

    if (!hasEmoji) return;

    // Create a document fragment to hold the new content
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let hasReplacement = false;

    // Process each emoji in order
    const sortedEmojis = Object.keys(this.emojiMap).sort((a, b) => b.length - a.length);
    const replacements = [];

    // Find all emoji positions
    for (const emoji of sortedEmojis) {
      let index = text.indexOf(emoji);
      while (index !== -1) {
        replacements.push({ index, emoji, length: emoji.length });
        index = text.indexOf(emoji, index + emoji.length);
      }
    }

    // Sort replacements by position
    replacements.sort((a, b) => a.index - b.index);

    // Build the fragment with replacements
    replacements.forEach(({ index, emoji }) => {
      // Add text before emoji
      if (index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, index))
        );
      }

      // Add SVG icon
      const iconName = this.emojiMap[emoji];
      const iconHtml = window.iconSystem.getIcon(iconName, 'sm', 'inline-icon');
      const iconWrapper = document.createElement('span');
      iconWrapper.innerHTML = iconHtml;
      iconWrapper.className = 'icon-replacement';
      iconWrapper.style.display = 'inline-block';
      iconWrapper.style.verticalAlign = 'middle';
      iconWrapper.style.margin = '0 2px';
      fragment.appendChild(iconWrapper);

      lastIndex = index + emoji.length;
      hasReplacement = true;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex))
      );
    }

    // Replace the text node with the fragment
    if (hasReplacement && textNode.parentNode) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  }

  // Manual replacement for specific selectors
  replaceInSelectors(selectors) {
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.replaceEmojisInElement(element);
      });
    });
  }

  // Add custom emoji to icon mapping
  addMapping(emoji, iconName) {
    this.emojiMap[emoji] = iconName;
  }

  // Get current mappings
  getMappings() {
    return { ...this.emojiMap };
  }
}

// Auto-initialize
const iconReplacer = new IconReplacer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IconReplacer;
}

// Add to window for global access
window.IconReplacer = IconReplacer;
window.iconReplacer = iconReplacer;