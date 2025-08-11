/**
 * SKELETON UI COMPONENT
 * Creates loading skeletons and placeholder states
 */

export const skeleton = {
  /**
   * Create a skeleton element
   */
  create(type, options = {}) {
    const element = document.createElement('div');
    element.className = `skeleton skeleton-${type}`;
    
    if (options.width) element.style.width = options.width;
    if (options.height) element.style.height = options.height;
    if (options.className) element.className += ` ${options.className}`;
    
    // Add animation
    if (options.animate !== false) {
      element.classList.add('skeleton-animate');
    }
    
    return element;
  },
  
  /**
   * Create text skeleton
   */
  text(lines = 1, options = {}) {
    if (lines === 1) {
      return this.create('text', {
        width: options.width || '100%',
        height: options.height || '1em',
        ...options
      });
    }
    
    const container = document.createElement('div');
    container.className = 'skeleton-text-block';
    
    for (let i = 0; i < lines; i++) {
      const line = this.create('text', {
        width: i === lines - 1 && options.lastLineWidth 
          ? options.lastLineWidth 
          : options.width || '100%',
        height: options.lineHeight || '1em',
        ...options
      });
      
      if (i > 0) line.style.marginTop = options.lineSpacing || '0.5em';
      container.appendChild(line);
    }
    
    return container;
  },
  
  /**
   * Create avatar skeleton
   */
  avatar(size = '40px', options = {}) {
    const avatar = this.create('avatar', {
      width: size,
      height: size,
      ...options
    });
    
    avatar.style.borderRadius = options.square ? '4px' : '50%';
    return avatar;
  },
  
  /**
   * Create button skeleton
   */
  button(options = {}) {
    return this.create('button', {
      width: options.width || '80px',
      height: options.height || '32px',
      ...options
    });
  },
  
  /**
   * Create card skeleton
   */
  card(options = {}) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    
    // Header with avatar and text
    if (options.avatar !== false) {
      const header = document.createElement('div');
      header.className = 'skeleton-card-header';
      
      header.appendChild(this.avatar(options.avatarSize || '44px'));
      
      const textGroup = document.createElement('div');
      textGroup.className = 'skeleton-card-text';
      textGroup.appendChild(this.text(1, { width: '120px', height: '16px' }));
      textGroup.appendChild(this.text(1, { width: '80px', height: '14px' }));
      
      header.appendChild(textGroup);
      card.appendChild(header);
    }
    
    // Content
    if (options.content !== false) {
      const content = document.createElement('div');
      content.className = 'skeleton-card-content';
      
      const lines = options.contentLines || 2;
      content.appendChild(this.text(lines, {
        lastLineWidth: '60%',
        lineSpacing: '0.75em'
      }));
      
      card.appendChild(content);
    }
    
    // Actions
    if (options.actions !== false) {
      const actions = document.createElement('div');
      actions.className = 'skeleton-card-actions';
      
      const actionCount = options.actionCount || 2;
      for (let i = 0; i < actionCount; i++) {
        actions.appendChild(this.button({ width: '70px' }));
      }
      
      card.appendChild(actions);
    }
    
    return card;
  },
  
  /**
   * Create connection card skeleton
   */
  connectionCard(options = {}) {
    const card = document.createElement('div');
    card.className = 'skeleton skeleton-connection-card';
    
    // Top section
    const top = document.createElement('div');
    top.className = 'skeleton-cc-top';
    
    // Avatar
    top.appendChild(this.avatar('44px'));
    
    // Identity section
    const identity = document.createElement('div');
    identity.className = 'skeleton-cc-identity';
    identity.appendChild(this.text(1, { width: '140px', height: '16px' }));
    identity.appendChild(this.text(1, { width: '100px', height: '14px' }));
    top.appendChild(identity);
    
    // CTA button
    top.appendChild(this.button({ width: '80px' }));
    
    card.appendChild(top);
    
    // Provenance badges
    const provenance = document.createElement('div');
    provenance.className = 'skeleton-cc-provenance';
    
    for (let i = 0; i < 3; i++) {
      const badge = this.create('badge', {
        width: `${60 + Math.random() * 40}px`,
        height: '20px'
      });
      provenance.appendChild(badge);
    }
    
    card.appendChild(provenance);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'skeleton-cc-actions';
    
    for (let i = 0; i < 3; i++) {
      actions.appendChild(this.button({ width: '60px', height: '28px' }));
    }
    
    card.appendChild(actions);
    
    return card;
  },
  
  /**
   * Create list skeleton
   */
  list(count, itemType = 'card', options = {}) {
    const container = document.createElement('div');
    container.className = 'skeleton-list';
    
    for (let i = 0; i < count; i++) {
      let item;
      
      switch (itemType) {
        case 'card':
          item = this.card(options);
          break;
        case 'connection':
          item = this.connectionCard(options);
          break;
        case 'text':
          item = this.text(options.lines || 1, options);
          break;
        default:
          item = this.create(itemType, options);
      }
      
      if (i > 0) item.style.marginTop = options.spacing || '16px';
      container.appendChild(item);
    }
    
    return container;
  },
  
  /**
   * Create grid skeleton
   */
  grid(count, columns = 3, itemType = 'card', options = {}) {
    const container = document.createElement('div');
    container.className = 'skeleton-grid';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gap = options.gap || '16px';
    
    for (let i = 0; i < count; i++) {
      let item;
      
      switch (itemType) {
        case 'card':
          item = this.card(options);
          break;
        case 'connection':
          item = this.connectionCard(options);
          break;
        default:
          item = this.create(itemType, options);
      }
      
      container.appendChild(item);
    }
    
    return container;
  },
  
  /**
   * Show skeleton in target element
   */
  show(target, skeletonType, options = {}) {
    if (!target) return;
    
    target.innerHTML = '';
    target.classList.add('skeleton-container');
    
    let skeleton;
    
    switch (skeletonType) {
      case 'list':
        skeleton = this.list(options.count || 5, options.itemType, options);
        break;
      case 'grid':
        skeleton = this.grid(options.count || 6, options.columns, options.itemType, options);
        break;
      case 'card':
        skeleton = this.card(options);
        break;
      case 'connection':
        skeleton = this.connectionCard(options);
        break;
      default:
        skeleton = this.create(skeletonType, options);
    }
    
    target.appendChild(skeleton);
    return skeleton;
  },
  
  /**
   * Hide skeleton and restore content
   */
  hide(target, content = '') {
    if (!target) return;
    
    target.classList.remove('skeleton-container');
    
    if (typeof content === 'string') {
      target.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      target.innerHTML = '';
      target.appendChild(content);
    } else if (Array.isArray(content)) {
      target.innerHTML = '';
      content.forEach(item => {
        if (typeof item === 'string') {
          target.innerHTML += item;
        } else {
          target.appendChild(item);
        }
      });
    }
  },
  
  /**
   * Replace skeleton with actual content
   */
  replace(skeletonElement, actualContent) {
    if (!skeletonElement || !actualContent) return;
    
    if (typeof actualContent === 'string') {
      skeletonElement.outerHTML = actualContent;
    } else {
      skeletonElement.parentNode.replaceChild(actualContent, skeletonElement);
    }
  }
};

export default skeleton;

// Simplified skeleton utilities
export function skeletonLines(n=3){ return Array.from({length:n},()=>`<div class="skel" style="height:14px"></div>`).join('<div style="height:8px"></div>'); }
export function cardSkeleton(){ return `<div class="card">${skeletonLines(4)}</div>`; }