// Contextual Reward Strip: Smart top strip showing subtle, contextual nudges
import { Store, Events } from './state.js';

const STRIP_ID = 'panel-reward-strip';
let stripTimeout = null;

export function initRewardStrip() {
  let el = document.getElementById(STRIP_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = STRIP_ID;
    el.className = 'reward-strip';
    
    // Insert at the top of main content
    const mainContent = document.getElementById('main-content') || 
                       document.getElementById('route') || 
                       document.querySelector('main');
    if (mainContent) {
      mainContent.prepend(el);
    }
  }
  
  update({ message: null }); // clear on load

  // Listen for invite stats updates
  Events.on('invites:stats', (s) => {
    if (!s) return;
    
    if (s.justAddedBonus) {
      update({ 
        type: 'success', 
        message: `Bonus +${s.justAddedBonus} invites unlocked!`, 
        icon: '✨',
        duration: 4000
      });
    } else if (s.remaining > 0) {
      update({ 
        type: 'info', 
        message: `You have ${s.remaining} invite${s.remaining === 1 ? '' : 's'} left`, 
        icon: '💌',
        duration: 2000
      });
    }
  });

  // Listen for new events loaded
  Events.on('events:loaded', ({ count }) => {
    const last = Store.get('meta.lastEventCount') || 0;
    if (count > last) {
      const diff = count - last;
      update({ 
        type: 'info', 
        message: `${diff} new part${diff === 1 ? 'y' : 'ies'} added`, 
        icon: '🎉',
        duration: 3000
      });
    }
    Store.set('meta.lastEventCount', count);
  });

  // Calendar connection prompt
  Events.on('calendar:prompt', () => {
    update({ 
      type: 'hint', 
      message: 'Connect your calendar for auto-save & reminders', 
      cta: { 
        label: 'Connect', 
        action: () => Events.emit('calendar:google:connect') 
      }, 
      icon: '📅',
      duration: 5000
    });
  });

  // Auth success celebration
  Events.on('auth:success', ({ provider }) => {
    const providerName = provider === 'google' ? 'Google' : 
                        provider === 'linkedin' ? 'LinkedIn' : 
                        'Demo';
    update({
      type: 'success',
      message: `Welcome! Signed in with ${providerName}`,
      icon: '👋',
      duration: 3000
    });
  });

  // Connection made (if you have networking features)
  Events.on('connection:made', ({ name }) => {
    update({
      type: 'success',
      message: `Connected with ${name || 'someone new'}!`,
      icon: '🤝',
      duration: 3000
    });
  });

  // Event saved feedback
  Events.on('event:saved', ({ event, saved }) => {
    if (saved) {
      update({
        type: 'success',
        message: `${event.title} saved to your calendar`,
        icon: '📅',
        duration: 2000
      });
    }
  });

  // PWA install success
  Events.on('pwa:installed', () => {
    update({
      type: 'success',
      message: 'App installed! You earned +2 bonus invites',
      icon: '📱',
      duration: 4000
    });
  });

  // Contact sync success
  Events.on('contacts:sync:success', ({ provider, contactCount, message }) => {
    const providerName = provider === 'google' ? 'Google' : 'Outlook';
    update({
      type: 'success',
      message: message || `${providerName} contacts synced! Email autocomplete is now active.`,
      icon: '📇',
      duration: 4000
    });
  });

  // Hide strip on route changes (with delay)
  Events.on('route:change', () => {
    if (stripTimeout) clearTimeout(stripTimeout);
    stripTimeout = setTimeout(() => update({ message: null }), 3000);
  });
}

function update({ type = 'info', message, icon, cta, duration = 3000 }) {
  const el = document.getElementById(STRIP_ID);
  if (!el) return;
  
  // Clear existing timeout
  if (stripTimeout) {
    clearTimeout(stripTimeout);
    stripTimeout = null;
  }
  
  if (!message) { 
    el.className = 'reward-strip'; 
    el.innerHTML = ''; 
    return; 
  }
  
  el.className = `reward-strip reward-${type}`;
  el.innerHTML = `
    <div class="reward-inner">
      ${icon ? `<span class="ri-icon">${icon}</span>` : ''}
      <span class="ri-msg">${message}</span>
      ${cta ? `<button class="btn btn-primary ri-cta">${cta.label}</button>` : ''}
      <button class="ri-close" aria-label="Dismiss">&times;</button>
    </div>`;
  
  // Wire up CTA button
  const btn = el.querySelector('.ri-cta');
  if (btn && cta?.action) {
    btn.addEventListener('click', () => {
      cta.action();
      update({ message: null }); // Hide after action
    }, { once: true });
  }
  
  // Wire up close button
  const closeBtn = el.querySelector('.ri-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      update({ message: null });
    }, { once: true });
  }
  
  // Auto-hide after duration
  if (duration > 0) {
    stripTimeout = setTimeout(() => {
      update({ message: null });
    }, duration);
  }
}

// Show a contextual hint based on user behavior
export function showContextualHint(context) {
  const hints = {
    'first-visit': {
      type: 'info',
      message: 'Welcome to Velocity! Find exclusive Gamescom parties here',
      icon: '🎉',
      duration: 5000
    },
    'no-events-saved': {
      type: 'hint', 
      message: 'Tap "Save" on parties you want to attend',
      icon: '💾',
      duration: 4000
    },
    'calendar-reminder': {
      type: 'hint',
      message: 'Connect your calendar to never miss a party',
      icon: '📅',
      cta: { 
        label: 'Connect', 
        action: () => Events.emit('calendar:google:connect') 
      },
      duration: 6000
    },
    'invite-milestone': {
      type: 'success',
      message: 'Great networking! You\'re close to unlocking bonus invites',
      icon: '🔥',
      duration: 4000
    }
  };
  
  const hint = hints[context];
  if (hint) {
    update(hint);
  }
}

// Check for contextual opportunities
export function checkContextualHints() {
  const user = Store.get('user');
  const savedEvents = Store.get('events.selected') || [];
  const inviteStats = Store.get('invites') || {};
  
  // First time user
  if (user && !Store.get('meta.hasSeenWelcome')) {
    setTimeout(() => showContextualHint('first-visit'), 1000);
    Store.set('meta.hasSeenWelcome', true);
    return;
  }
  
  // No events saved after viewing some
  const eventsViewed = Store.get('meta.eventsViewed') || 0;
  if (eventsViewed > 3 && savedEvents.length === 0) {
    setTimeout(() => showContextualHint('no-events-saved'), 2000);
    return;
  }
  
  // Calendar not connected but has saved events
  if (savedEvents.length >= 2 && !Store.get('calendar.googleConnected')) {
    setTimeout(() => showContextualHint('calendar-reminder'), 3000);
    return;
  }
  
  // Close to invite bonus
  const connections = Store.get('connections.count') || 0;
  if ((inviteStats.redeemedCount >= 7 || connections >= 7) && !inviteStats.bonusUnlocked) {
    setTimeout(() => showContextualHint('invite-milestone'), 2000);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initRewardStrip();
  
  // Check for hints after a brief delay
  setTimeout(checkContextualHints, 2000);
});

export default {
  initRewardStrip,
  showContextualHint,
  checkContextualHints,
  update
};