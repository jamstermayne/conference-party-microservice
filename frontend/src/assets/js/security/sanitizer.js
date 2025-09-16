/**
 * HTML Sanitization Utility
 * Protects against XSS attacks by sanitizing user input before rendering
 */

class HTMLSanitizer {
  constructor() {
    // Allowed HTML tags and attributes for rich content
    this.allowedTags = new Set([
      'div', 'span', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img'
    ]);
    
    this.allowedAttributes = new Set([
      'href', 'src', 'alt', 'title', 'class', 'id', 'data-*'
    ]);
    
    // URL protocols that are safe to use
    this.safeProtocols = new Set(['http:', 'https:', 'mailto:']);
  }

  /**
   * Sanitize HTML content by removing potentially dangerous elements
   * @param {string} html - HTML content to sanitize
   * @returns {string} - Sanitized HTML
   */
  sanitize(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Recursively clean all nodes
    this._cleanNode(tempDiv);
    
    return tempDiv.innerHTML;
  }

  /**
   * Sanitize text content (no HTML allowed)
   * @param {string} text - Text content to sanitize
   * @returns {string} - Sanitized text with HTML entities escaped
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Safe innerHTML replacement - use this instead of element.innerHTML
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML content to set
   */
  setHTML(element, html) {
    if (!element) return;
    element.innerHTML = this.sanitize(html);
  }

  /**
   * Safe textContent replacement with HTML entity escaping
   * @param {HTMLElement} element - Target element  
   * @param {string} text - Text content to set
   */
  setText(element, text) {
    if (!element) return;
    element.textContent = text;
  }

  /**
   * Create safe HTML from template with variables
   * @param {string} template - HTML template with ${var} placeholders
   * @param {Object} vars - Variables to substitute
   * @returns {string} - Sanitized HTML with variables substituted
   */
  template(template, vars = {}) {
    let html = template;
    
    // Replace variables in template
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      const sanitizedValue = this.sanitizeText(String(value));
      html = html.replace(placeholder, sanitizedValue);
    }
    
    return this.sanitize(html);
  }

  /**
   * Recursively clean DOM nodes
   * @private
   */
  _cleanNode(node) {
    const nodesToRemove = [];
    
    // Check all child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tagName = child.tagName.toLowerCase();
        
        // Remove disallowed tags
        if (!this.allowedTags.has(tagName)) {
          nodesToRemove.push(child);
          continue;
        }
        
        // Clean attributes
        this._cleanAttributes(child);
        
        // Recursively clean children
        this._cleanNode(child);
      }
    }
    
    // Remove disallowed nodes
    nodesToRemove.forEach(nodeToRemove => {
      node.removeChild(nodeToRemove);
    });
  }

  /**
   * Clean element attributes
   * @private
   */
  _cleanAttributes(element) {
    const attributesToRemove = [];
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      const attrName = attr.name.toLowerCase();
      
      // Remove event handlers (onclick, onload, etc.)
      if (attrName.startsWith('on')) {
        attributesToRemove.push(attrName);
        continue;
      }
      
      // Remove javascript: and data: URLs
      if (attrName === 'href' || attrName === 'src') {
        const url = attr.value.toLowerCase().trim();
        if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) {
          attributesToRemove.push(attrName);
          continue;
        }
      }
      
      // Check if attribute is allowed (basic check)
      const isDataAttribute = attrName.startsWith('data-');
      const isAllowed = this.allowedAttributes.has(attrName) || isDataAttribute;
      
      if (!isAllowed) {
        attributesToRemove.push(attrName);
      }
    }
    
    // Remove disallowed attributes
    attributesToRemove.forEach(attrName => {
      element.removeAttribute(attrName);
    });
  }
}

// Create singleton instance
const sanitizer = new HTMLSanitizer();

// Export for use in other modules
export default sanitizer;

// Make available globally for easy migration
if (typeof window !== 'undefined') {
  window.HTMLSanitizer = sanitizer;
  
  // Provide safe alternatives to innerHTML
  window.safeSetHTML = (element, html) => sanitizer.setHTML(element, html);
  window.safeSetText = (element, text) => sanitizer.setText(element, text);
  window.sanitizeHTML = (html) => sanitizer.sanitize(html);
  window.sanitizeText = (text) => sanitizer.sanitizeText(text);
}