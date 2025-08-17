/**
 * Party Card Interactions
 * Modern micro-interactions with spring physics and smooth transitions
 */

class PartyCardInteractions {
  constructor() {
    this.cards = [];
    this.activeCard = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touchStartTime = 0;
    this.touchStartY = 0;
  }

  init() {
    this.setupCards();
    this.setupIntersectionObserver();
    this.setupKeyboardNavigation();
    this.setupHapticFeedback();
    this.setupMagneticButtons();
  }

  setupCards() {
    const cardElements = document.querySelectorAll('.showcase-card');
    
    cardElements.forEach((card, index) => {
      // Add staggered entrance animation
      if (!this.isReducedMotion) {
        card.style.animationDelay = `${index * 50}ms`;
      }
      
      // 3D tilt effect on hover
      this.add3DTilt(card);
      
      // Ripple effect on click
      this.addRippleEffect(card);
      
      // Focus management
      this.setupFocusManagement(card);
      
      this.cards.push(card);
    });
  }

  add3DTilt(card) {
    if (this.isReducedMotion) return;
    
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId = null;
    
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate rotation based on mouse position
      targetX = ((e.clientY - centerY) / (rect.height / 2)) * 5;
      targetY = ((e.clientX - centerX) / (rect.width / 2)) * -5;
      
      if (!rafId) {
        rafId = requestAnimationFrame(updateTilt);
      }
    };
    
    const updateTilt = () => {
      // Spring physics for smooth animation
      const springStrength = 0.12;
      const damping = 0.85;
      
      currentX += (targetX - currentX) * springStrength;
      currentY += (targetY - currentY) * springStrength;
      
      currentX *= damping;
      currentY *= damping;
      
      card.style.transform = `
        perspective(1000px)
        rotateX(${currentX}deg)
        rotateY(${currentY}deg)
        translateZ(10px)
      `;
      
      // Add dynamic shadow
      const shadowIntensity = Math.abs(currentX) + Math.abs(currentY);
      card.style.boxShadow = `
        0 ${10 + shadowIntensity}px ${30 + shadowIntensity * 2}px 
        rgba(0, 0, 0, ${0.2 + shadowIntensity * 0.02})
      `;
      
      if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
        rafId = requestAnimationFrame(updateTilt);
      } else {
        rafId = null;
      }
    };
    
    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      
      if (!rafId) {
        rafId = requestAnimationFrame(updateTilt);
      }
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
  }

  addRippleEffect(element) {
    element.addEventListener('click', (e) => {
      if (this.isReducedMotion) return;
      
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: var(--color-accent);
        opacity: 0.3;
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: ripple-expand 0.6s ease-out;
      `;
      
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }

  setupMagneticButtons() {
    const buttons = document.querySelectorAll('.action-btn, .calendar-btn, .save-btn');
    
    buttons.forEach(button => {
      if (this.isReducedMotion) return;
      
      let rafId = null;
      let currentX = 0;
      let currentY = 0;
      
      const handleMouseMove = (e) => {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // Magnetic effect within 100px radius
        if (distance < 100) {
          const strength = (100 - distance) / 100;
          const moveX = (distanceX * strength) * 0.2;
          const moveY = (distanceY * strength) * 0.2;
          
          if (!rafId) {
            rafId = requestAnimationFrame(() => {
              currentX += (moveX - currentX) * 0.2;
              currentY += (moveY - currentY) * 0.2;
              
              button.style.transform = `translate(${currentX}px, ${currentY}px)`;
              rafId = null;
            });
          }
        }
      };
      
      const handleMouseLeave = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        
        button.style.transform = 'translate(0, 0)';
        currentX = 0;
        currentY = 0;
      };
      
      button.addEventListener('mousemove', handleMouseMove);
      button.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  setupIntersectionObserver() {
    if (this.isReducedMotion) return;
    
    const observerOptions = {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        
        if (entry.isIntersecting) {
          // Scale and fade in based on visibility
          const scale = 0.95 + (entry.intersectionRatio * 0.05);
          const opacity = 0.7 + (entry.intersectionRatio * 0.3);
          
          card.style.transform = `scale(${scale})`;
          card.style.opacity = opacity;
          
          // Parallax effect for card content
          const content = card.querySelector('.showcase-card__content');
          if (content) {
            const parallaxOffset = (1 - entry.intersectionRatio) * 20;
            content.style.transform = `translateY(${parallaxOffset}px)`;
          }
        }
      });
    }, observerOptions);
    
    this.cards.forEach(card => observer.observe(card));
  }

  setupKeyboardNavigation() {
    let currentFocusIndex = 0;
    
    document.addEventListener('keydown', (e) => {
      const focusableElements = document.querySelectorAll(
        '.action-btn, .calendar-btn, .save-btn, .showcase-nav, .showcase-dot'
      );
      
      if (!focusableElements.length) return;
      
      switch(e.key) {
        case 'Tab':
          // Let natural tab order work, but add visual enhancement
          setTimeout(() => {
            const focused = document.activeElement;
            if (focused && focused.matches('.action-btn, .calendar-btn, .save-btn')) {
              this.enhanceFocus(focused);
            }
          }, 0);
          break;
          
        case 'Enter':
        case ' ':
          if (document.activeElement && document.activeElement.matches('.showcase-card')) {
            e.preventDefault();
            this.expandCard(document.activeElement);
          }
          break;
          
        case 'Escape':
          if (this.activeCard) {
            this.collapseCard();
          }
          break;
      }
    });
  }

  enhanceFocus(element) {
    if (this.isReducedMotion) return;
    
    // Add focus pulse animation
    element.style.animation = 'focus-pulse 0.5s ease';
    
    // Add glow effect
    element.style.boxShadow = `
      0 0 0 3px var(--color-accent-weak),
      0 0 20px var(--color-accent-weak)
    `;
    
    element.addEventListener('blur', () => {
      element.style.animation = '';
      element.style.boxShadow = '';
    }, { once: true });
  }

  setupFocusManagement(card) {
    // Make card focusable
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'article');
    
    const title = card.querySelector('.showcase-card__title');
    if (title) {
      const titleText = title.textContent;
      card.setAttribute('aria-label', `Party card: ${titleText}`);
    }
    
    // Add focus styles
    card.addEventListener('focus', () => {
      card.classList.add('focus-visible');
      this.enhanceFocus(card);
    });
    
    card.addEventListener('blur', () => {
      card.classList.remove('focus-visible');
    });
  }

  setupHapticFeedback() {
    // Vibration API for mobile devices
    const buttons = document.querySelectorAll('button, .action-btn, .calendar-btn, .save-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        // Light haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        
        // Visual feedback
        this.createPressEffect(button);
      });
    });
  }

  createPressEffect(element) {
    if (this.isReducedMotion) return;
    
    // Squeeze effect
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      
      // Bounce back
      setTimeout(() => {
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 100);
      }, 100);
    }, 100);
  }

  expandCard(card) {
    if (this.activeCard) return;
    
    this.activeCard = card;
    const rect = card.getBoundingClientRect();
    
    // Create expanded view
    const expandedCard = card.cloneNode(true);
    expandedCard.className = 'showcase-card showcase-card--expanded';
    expandedCard.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 10000;
      transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    document.body.appendChild(expandedCard);
    
    // Animate to full screen
    requestAnimationFrame(() => {
      expandedCard.style.top = '50%';
      expandedCard.style.left = '50%';
      expandedCard.style.transform = 'translate(-50%, -50%)';
      expandedCard.style.width = '90vw';
      expandedCard.style.maxWidth = '800px';
      expandedCard.style.height = '80vh';
    });
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'card-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => {
      backdrop.style.opacity = '1';
    });
    
    // Close on backdrop click
    backdrop.addEventListener('click', () => this.collapseCard());
  }

  collapseCard() {
    if (!this.activeCard) return;
    
    const expandedCard = document.querySelector('.showcase-card--expanded');
    const backdrop = document.querySelector('.card-backdrop');
    
    if (expandedCard) {
      const originalRect = this.activeCard.getBoundingClientRect();
      
      expandedCard.style.top = `${originalRect.top}px`;
      expandedCard.style.left = `${originalRect.left}px`;
      expandedCard.style.width = `${originalRect.width}px`;
      expandedCard.style.height = `${originalRect.height}px`;
      expandedCard.style.transform = 'none';
      
      setTimeout(() => expandedCard.remove(), 500);
    }
    
    if (backdrop) {
      backdrop.style.opacity = '0';
      setTimeout(() => backdrop.remove(), 300);
    }
    
    this.activeCard = null;
  }
}

// Add required CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple-expand {
    to {
      width: 300px;
      height: 300px;
      opacity: 0;
    }
  }
  
  @keyframes focus-pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  
  .showcase-card {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                opacity 0.3s ease,
                box-shadow 0.3s ease;
  }
  
  .showcase-card--expanded {
    overflow-y: auto;
  }
  
  .card-backdrop {
    cursor: pointer;
  }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const interactions = new PartyCardInteractions();
    interactions.init();
  });
} else {
  const interactions = new PartyCardInteractions();
  interactions.init();
}

export default PartyCardInteractions;