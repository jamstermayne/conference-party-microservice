// Motion Engine: Panel transitions + staggered reveals, View Transitions if available
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function panelEnter(el = document.getElementById('main-content')) {
  if (!el) return;
  if (reduceMotion) { 
    el.classList.add('panel-enter-noanim'); 
    return; 
  }

  if (document.startViewTransition) {
    document.startViewTransition(() => {
      el.classList.remove('panel-enter', 'panel-enter-noanim');
      void el.offsetWidth; // reflow
      el.classList.add('panel-enter');
    });
  } else {
    el.classList.remove('panel-enter');
    void el.offsetWidth;
    el.classList.add('panel-enter');
  }
}

export function staggerChildren(container, selector = '.stagger') {
  if (reduceMotion) return;
  if (!container) return;
  
  const nodes = container.querySelectorAll(selector);
  nodes.forEach((n, i) => {
    n.style.animationDelay = `${Math.min(i * 35, 300)}ms`;
    n.classList.add('stagger-in');
  });
}

export function microTapFeedback(root = document) {
  root.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.btn, .party-card, .nav-link, .nav-item, .nav-tab');
    if (!t) return;
    t.classList.add('tap');
  });
  
  root.addEventListener('pointerup', (e) => {
    const t = e.target.closest('.btn, .party-card, .nav-link, .nav-item, .nav-tab');
    if (!t) return;
    t.classList.remove('tap');
  });
  
  root.addEventListener('pointercancel', () => {
    document.querySelectorAll('.tap').forEach(el => el.classList.remove('tap'));
  });
}

// Card hover effects with performance optimization
export function initCardHovers() {
  if (reduceMotion) return;
  
  // Use intersection observer to only animate visible cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('card-observable');
      } else {
        entry.target.classList.remove('card-observable');
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '50px' 
  });
  
  // Observer for new cards
  const cardObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.matches('.party-card')) {
          observer.observe(node);
        }
        if (node.nodeType === 1) {
          const cards = node.querySelectorAll('.party-card');
          cards.forEach(card => observer.observe(card));
        }
      });
    });
  });
  
  // Start observing
  document.querySelectorAll('.party-card').forEach(card => observer.observe(card));
  cardObserver.observe(document.body, { childList: true, subtree: true });
  
  return { observer, cardObserver };
}

// Smooth scroll to element
export function smoothScrollTo(element, offset = 0) {
  if (reduceMotion) {
    element.scrollIntoView();
    return;
  }
  
  const targetPosition = element.offsetTop - offset;
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// Page transition effects
export function pageTransition(fromPage, toPage, direction = 'forward') {
  if (reduceMotion) {
    if (fromPage) fromPage.style.display = 'none';
    if (toPage) toPage.style.display = 'block';
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const duration = 300;
    
    if (fromPage) {
      fromPage.style.transition = `transform ${duration}ms var(--ease-smooth), opacity ${duration}ms var(--ease-smooth)`;
      fromPage.style.transform = direction === 'forward' ? 'translateX(-20px)' : 'translateX(20px)';
      fromPage.style.opacity = '0';
    }
    
    if (toPage) {
      toPage.style.display = 'block';
      toPage.style.transition = `transform ${duration}ms var(--ease-smooth), opacity ${duration}ms var(--ease-smooth)`;
      toPage.style.transform = direction === 'forward' ? 'translateX(20px)' : 'translateX(-20px)';
      toPage.style.opacity = '0';
      
      // Trigger reflow then animate in
      void toPage.offsetWidth;
      toPage.style.transform = 'translateX(0)';
      toPage.style.opacity = '1';
    }
    
    setTimeout(() => {
      if (fromPage) {
        fromPage.style.display = 'none';
        fromPage.style.transition = '';
        fromPage.style.transform = '';
        fromPage.style.opacity = '';
      }
      if (toPage) {
        toPage.style.transition = '';
        toPage.style.transform = '';
        toPage.style.opacity = '';
      }
      resolve();
    }, duration);
  });
}

// Initialize all motion systems
export function initMotion() {
  microTapFeedback(document);
  initCardHovers();
  
  // Add motion class to body for CSS targeting
  if (!reduceMotion) {
    document.body.classList.add('motion-enabled');
  }
  
  console.log('✨ Motion engine initialized', { reduceMotion });
}

export default {
  panelEnter,
  staggerChildren,
  microTapFeedback,
  initCardHovers,
  smoothScrollTo,
  pageTransition,
  initMotion,
  reduceMotion
};