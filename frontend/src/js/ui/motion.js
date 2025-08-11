/**
 * MOTION UI MODULE
 * Physics-based animations and micro-interactions for Professional Intelligence Platform
 */

// Tiny spring helper for "Liquid Toggle"
export function springTo(el, prop, to, { stiffness = 400, damping = 28, threshold = 0.1 } = {}) {
  let v = 0;
  let raf;
  
  const read = () => {
    const cur = parseFloat((/translateX\(([-0-9.]+)px\)/.exec(getComputedStyle(el).transform) || [0, 0])[1]);
    return isNaN(cur) ? 0 : cur;
  };
  
  let x = read();
  
  const step = () => {
    const Fspring = -stiffness * (x - to);
    const Fdamp = -damping * v;
    const a = Fspring + Fdamp;
    v += a * (1 / 60);
    x += v * (1 / 60);
    el.style.transform = `translateX(${x}px)`;
    
    if (Math.abs(v) > threshold || Math.abs(x - to) > threshold) {
      raf = requestAnimationFrame(step);
    } else {
      el.style.transform = `translateX(${to}px)`;
      cancelAnimationFrame(raf);
    }
  };
  
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(step);
}

// Extended spring physics for different properties
export function springToProperty(el, property, to, { stiffness = 400, damping = 28, threshold = 0.1 } = {}) {
  let v = 0;
  let raf;
  
  const read = () => {
    switch (property) {
      case 'opacity':
        return parseFloat(getComputedStyle(el).opacity) || 0;
      case 'scale':
        const transform = getComputedStyle(el).transform;
        const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,([^)]+)\)/);
        return match ? parseFloat(match[1]) : 1;
      case 'rotate':
        const rotateMatch = getComputedStyle(el).transform.match(/rotate\(([^)]+)deg\)/);
        return rotateMatch ? parseFloat(rotateMatch[1]) : 0;
      default:
        return parseFloat(getComputedStyle(el)[property]) || 0;
    }
  };
  
  let current = read();
  
  const step = () => {
    const Fspring = -stiffness * (current - to);
    const Fdamp = -damping * v;
    const a = Fspring + Fdamp;
    v += a * (1 / 60);
    current += v * (1 / 60);
    
    switch (property) {
      case 'opacity':
        el.style.opacity = current;
        break;
      case 'scale':
        el.style.transform = `scale(${current})`;
        break;
      case 'rotate':
        el.style.transform = `rotate(${current}deg)`;
        break;
      default:
        el.style[property] = current + 'px';
    }
    
    if (Math.abs(v) > threshold || Math.abs(current - to) > threshold) {
      raf = requestAnimationFrame(step);
    } else {
      switch (property) {
        case 'opacity':
          el.style.opacity = to;
          break;
        case 'scale':
          el.style.transform = `scale(${to})`;
          break;
        case 'rotate':
          el.style.transform = `rotate(${to}deg)`;
          break;
        default:
          el.style[property] = to + 'px';
      }
      cancelAnimationFrame(raf);
    }
  };
  
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(step);
}

class Motion {
  constructor() {
    this.animations = new Map();
    this.observers = new Map();
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animationFrame = null;
    this.pendingAnimations = [];
    
    // Listen for reduced motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  /**
   * Initialize view animations
   */
  initializeView(viewName) {
    if (this.prefersReducedMotion) return;

    switch (viewName) {
      case 'home':
        this.initHomeAnimations();
        break;
      case 'events':
        this.initEventsAnimations();
        break;
      case 'people':
        this.initPeopleAnimations();
        break;
      case 'opportunities':
        this.initOpportunitiesAnimations();
        break;
    }

    // Set up intersection observers for lazy animations
    this.setupIntersectionObservers();
  }

  /**
   * Home view animations
   */
  initHomeAnimations() {
    // Status card entrance
    this.staggerFadeIn('.status-card', 200);
    
    // Stats counter animation
    this.animateCounters('.stat-number');
    
    // Quick actions reveal
    setTimeout(() => {
      const fab = document.querySelector('.fab');
      if (fab) {
        springToProperty(fab, 'scale', 1, { stiffness: 300, damping: 25 });
        springToProperty(fab, 'opacity', 1, { stiffness: 300, damping: 25 });
      }
    }, 800);
  }

  /**
   * Events view animations
   */
  initEventsAnimations() {
    // Event cards stagger
    this.staggerFadeIn('.event-card', 100);
    
    // Map container reveal
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      this.fadeIn(mapContainer, 600);
    }
  }

  /**
   * People view animations
   */
  initPeopleAnimations() {
    // Profile cards with spring entrance
    const profileCards = document.querySelectorAll('.pi-profile');
    profileCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.95)';
      
      setTimeout(() => {
        springToProperty(card, 'opacity', 1, { stiffness: 350, damping: 30 });
        
        // Spring to position and scale simultaneously
        let yPos = 20, scale = 0.95;
        let vY = 0, vScale = 0;
        const targetY = 0, targetScale = 1;
        const stiffness = 350, damping = 30;
        
        const animate = () => {
          // Y position spring
          const FspringY = -stiffness * (yPos - targetY);
          const FdampY = -damping * vY;
          const aY = FspringY + FdampY;
          vY += aY * (1/60);
          yPos += vY * (1/60);
          
          // Scale spring
          const FspringScale = -stiffness * (scale - targetScale);
          const FdampScale = -damping * vScale;
          const aScale = FspringScale + FdampScale;
          vScale += aScale * (1/60);
          scale += vScale * (1/60);
          
          card.style.transform = `translateY(${yPos}px) scale(${scale})`;
          
          if (Math.abs(vY) > 0.1 || Math.abs(yPos) > 0.1 || Math.abs(scale - 1) > 0.01) {
            requestAnimationFrame(animate);
          } else {
            card.style.transform = 'translateY(0) scale(1)';
          }
        };
        
        requestAnimationFrame(animate);
      }, index * 100);
    });
  }

  /**
   * Opportunities view animations
   */
  initOpportunitiesAnimations() {
    // Opportunity cards with liquid toggle effect
    const opportunityCards = document.querySelectorAll('.pi-opportunity');
    opportunityCards.forEach((card, index) => {
      // Initial state
      card.style.opacity = '0';
      card.style.transform = 'translateX(-30px)';
      
      setTimeout(() => {
        springToProperty(card, 'opacity', 1);
        springTo(card, 'translateX', 0, { stiffness: 300, damping: 25 });
      }, index * 80);
    });
  }

  /**
   * Stagger fade in animation
   */
  staggerFadeIn(selector, delay = 100) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        springToProperty(el, 'opacity', 1);
        
        // Spring Y position
        let y = 20, v = 0;
        const animate = () => {
          const Fspring = -400 * y;
          const Fdamp = -28 * v;
          const a = Fspring + Fdamp;
          v += a * (1/60);
          y += v * (1/60);
          el.style.transform = `translateY(${y}px)`;
          
          if (Math.abs(v) > 0.1 || Math.abs(y) > 0.1) {
            requestAnimationFrame(animate);
          } else {
            el.style.transform = 'translateY(0)';
          }
        };
        requestAnimationFrame(animate);
      }, index * delay);
    });
  }

  /**
   * Animate numerical counters
   */
  animateCounters(selector) {
    const counters = document.querySelectorAll(selector);
    
    counters.forEach(counter => {
      const target = parseInt(counter.textContent) || 0;
      let current = 0;
      
      const animate = () => {
        const increment = target / 60; // 60 frames for 1 second
        current += increment;
        
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(animate);
        } else {
          counter.textContent = target;
        }
      };
      
      // Start after element is visible
      setTimeout(() => {
        if (this.isElementVisible(counter)) {
          animate();
        }
      }, 200);
    });
  }

  /**
   * Liquid toggle animation for switches and toggles
   */
  liquidToggle(element, isOn) {
    const handle = element.querySelector('.toggle-handle') || element;
    const track = element.querySelector('.toggle-track') || element.parentElement;
    
    if (track) {
      track.style.backgroundColor = isOn ? 'var(--accent-primary)' : 'var(--border)';
    }
    
    // Use spring physics for smooth toggle
    const targetX = isOn ? element.offsetWidth - handle.offsetWidth - 4 : 0;
    springTo(handle, 'translateX', targetX, {
      stiffness: 350,
      damping: 30,
      threshold: 0.5
    });
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  /**
   * Morphing button animation
   */
  morphButton(button, newText, newIcon, callback) {
    const originalText = button.textContent;
    const originalWidth = button.offsetWidth;
    
    // Phase 1: Collapse
    springToProperty(button, 'scale', 0.9, { stiffness: 400, damping: 30 });
    springToProperty(button, 'opacity', 0.7, { stiffness: 400, damping: 30 });
    
    setTimeout(() => {
      // Phase 2: Transform
      button.textContent = newText;
      if (newIcon) {
        button.querySelector('.icon')?.remove();
        const iconEl = document.createElement('span');
        iconEl.className = 'icon';
        iconEl.textContent = newIcon;
        button.prepend(iconEl);
      }
      
      // Phase 3: Expand
      springToProperty(button, 'scale', 1, { stiffness: 300, damping: 25 });
      springToProperty(button, 'opacity', 1, { stiffness: 300, damping: 25 });
      
      if (callback) callback();
    }, 150);
  }

  /**
   * Card swipe animation
   */
  swipeCard(card, direction = 'right', onComplete) {
    const distance = direction === 'right' ? window.innerWidth : -window.innerWidth;
    
    // Add rotation for natural feel
    card.style.transition = 'none';
    card.style.transformOrigin = 'center bottom';
    
    springTo(card, 'translateX', distance, {
      stiffness: 200,
      damping: 20
    });
    
    // Add rotation spring
    let rotation = 0, vRotation = 0;
    const targetRotation = direction === 'right' ? 15 : -15;
    
    const rotateAnimation = () => {
      const Fspring = -300 * (rotation - targetRotation);
      const Fdamp = -25 * vRotation;
      const a = Fspring + Fdamp;
      vRotation += a * (1/60);
      rotation += vRotation * (1/60);
      
      card.style.transform = `translateX(${card.style.transform.match(/translateX\(([-0-9.]+)px\)/)?.[1] || 0}px) rotate(${rotation}deg)`;
      
      if (Math.abs(vRotation) > 0.1 || Math.abs(rotation - targetRotation) > 0.1) {
        requestAnimationFrame(rotateAnimation);
      }
    };
    
    requestAnimationFrame(rotateAnimation);
    
    // Fade out
    springToProperty(card, 'opacity', 0, { stiffness: 400, damping: 30 });
    
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 600);
  }

  /**
   * Proximity radar animation
   */
  radarPulse(element) {
    if (!element) return;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    
    // Create pulse rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const pulse = document.createElement('div');
        pulse.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-primary) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1;
        `;
        
        element.appendChild(pulse);
        
        // Animate pulse
        let scale = 0, opacity = 0.8;
        let vScale = 0, vOpacity = 0;
        
        const animate = () => {
          // Scale spring
          const FspringScale = -200 * (scale - 2);
          const FdampScale = -15 * vScale;
          const aScale = FspringScale + FdampScale;
          vScale += aScale * (1/60);
          scale += vScale * (1/60);
          
          // Opacity decay
          opacity *= 0.98;
          
          pulse.style.width = pulse.style.height = (100 * scale) + 'px';
          pulse.style.opacity = opacity;
          
          if (opacity > 0.01 && scale < 1.8) {
            requestAnimationFrame(animate);
          } else {
            pulse.remove();
          }
        };
        
        requestAnimationFrame(animate);
      }, i * 300);
    }
  }

  /**
   * Setup intersection observers for scroll animations
   */
  setupIntersectionObservers() {
    if (this.prefersReducedMotion) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Trigger different animations based on class
          if (element.classList.contains('fade-in-up')) {
            this.fadeInUp(element);
          } else if (element.classList.contains('scale-in')) {
            springToProperty(element, 'scale', 1, { stiffness: 300, damping: 25 });
            springToProperty(element, 'opacity', 1, { stiffness: 300, damping: 25 });
          }
          
          observer.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    
    // Observe elements with animation classes
    document.querySelectorAll('.fade-in-up, .scale-in').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Fade in up animation
   */
  fadeInUp(element, delay = 0) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
      springToProperty(element, 'opacity', 1);
      springTo(element, 'translateY', 0);
    }, delay);
  }

  /**
   * Simple fade in
   */
  fadeIn(element, delay = 0) {
    element.style.opacity = '0';
    
    setTimeout(() => {
      springToProperty(element, 'opacity', 1, {
        stiffness: 300,
        damping: 30
      });
    }, delay);
  }

  /**
   * Check if element is visible in viewport
   */
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Generic animation utility
   */
  animate(element, keyframes, options = {}) {
    if (this.prefersReducedMotion) return Promise.resolve();
    
    const { duration = 300, easing = 'ease-out' } = options;
    
    return element.animate(keyframes, {
      duration,
      easing,
      fill: 'forwards'
    }).finished;
  }

  /**
   * Cleanup animations
   */
  cleanup() {
    this.animations.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

// Create singleton instance
export const motion = new Motion();

// Export individual functions for direct use
export { Motion };

// Attach to window for debugging
if (typeof window !== 'undefined') {
  window.motion = motion;
  window.springTo = springTo;
  window.springToProperty = springToProperty;
}