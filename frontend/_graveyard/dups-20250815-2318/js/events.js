/**
 * EVENT SYSTEM MODULE
 * Simple and efficient event bus for Professional Intelligence Platform
 */

const bus = new Map();

export const Events = {
  on(topic, fn) {
    const set = bus.get(topic) || (bus.set(topic, new Set()), bus.get(topic));
    set.add(fn);
    return () => set.delete(fn);
  },
  
  emit(topic, payload) {
    bus.get(topic)?.forEach(fn => fn(payload));
  },

  // Enhanced functionality for compatibility
  once(topic, fn) {
    const unsubscribe = this.on(topic, (payload) => {
      unsubscribe();
      fn(payload);
    });
    return unsubscribe;
  },

  off(topic, fn) {
    const set = bus.get(topic);
    if (set) {
      set.delete(fn);
      if (set.size === 0) {
        bus.delete(topic);
      }
    }
  },

  clear(topic) {
    if (topic) {
      bus.delete(topic);
    } else {
      bus.clear();
    }
  },

  topics() {
    return Array.from(bus.keys());
  },

  listenerCount(topic) {
    return bus.get(topic)?.size || 0;
  },

  debug() {
    console.log('Event Bus Topics:', this.topics());
    bus.forEach((listeners, topic) => {
      console.log(`  ${topic}: ${listeners.size} listeners`);
    });
  }
};

// Centralized DOM delegation
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.preventDefault();
  Events.emit(el.dataset.action, { el, e });
});

// Additional DOM event delegation for common interactions
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  Events.emit(el.dataset.change, { el, e, value: el.value });
});

document.addEventListener('submit', e => {
  const el = e.target.closest('[data-submit]');
  if (!el) return;
  e.preventDefault();
  const formData = new FormData(el);
  Events.emit(el.dataset.submit, { el, e, data: formData });
});

// Route change events
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#/', '') || 'home';
  Events.emit('route:change', { route: hash });
});

// App lifecycle events
document.addEventListener('visibilitychange', () => {
  const event = document.hidden ? 'app:hidden' : 'app:visible';
  Events.emit(event, { timestamp: Date.now() });
});

window.addEventListener('online', () => {
  Events.emit('app:online', { timestamp: Date.now() });
});

window.addEventListener('offline', () => {
  Events.emit('app:offline', { timestamp: Date.now() });
});

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  Events.emit('app:installable', { prompt: e });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Only emit for specific key combinations
  if (e.metaKey || e.ctrlKey) {
    const key = e.key.toLowerCase();
    const shortcut = `${e.metaKey ? 'cmd' : 'ctrl'}+${key}`;
    Events.emit('shortcut:' + shortcut, { e, key, shortcut });
  }
  
  // Global escape key
  if (e.key === 'Escape') {
    Events.emit('key:escape', { e });
  }
});

// Common event patterns for Professional Intelligence Platform
export const EventPatterns = {
  // Navigation events
  navigate: (route) => Events.emit('navigate', { route }),
  routeChange: (route) => Events.emit('route:change', { route }),
  
  // Modal events
  openModal: (config) => Events.emit('modal:open', config),
  closeModal: () => Events.emit('modal:close'),
  
  // Notification events
  notify: (message, type = 'info') => Events.emit('notification', { message, type }),
  error: (error) => Events.emit('error', { error }),
  success: (message) => Events.emit('success', { message }),
  
  // Professional networking events
  profileView: (profileId) => Events.emit('profile:view', { profileId }),
  connectionRequest: (targetId) => Events.emit('connection:request', { targetId }),
  opportunityApply: (opportunityId) => Events.emit('opportunity:apply', { opportunityId }),
  eventSave: (eventId) => Events.emit('event:save', { eventId }),
  
  // Proximity events
  nearbyDetected: (professionals) => Events.emit('proximity:nearby', { professionals }),
  venueEnter: (venue) => Events.emit('proximity:venue', { venue }),
  
  // Invite events
  inviteSend: (target) => Events.emit('invite:send', { target }),
  inviteAccept: (code) => Events.emit('invite:accept', { code }),
  
  // Intent toggle
  intentToggle: (enabled) => Events.emit('intent:toggle', { enabled }),
  
  // Search and filter
  search: (query) => Events.emit('search', { query }),
  filter: (filters) => Events.emit('filter', { filters }),
  
  // Data sync
  sync: () => Events.emit('sync:request'),
  syncComplete: (data) => Events.emit('sync:complete', { data }),
  syncError: (error) => Events.emit('sync:error', { error })
};

// Professional Intelligence specific event handlers
Events.on('route:change', ({ route }) => {
  // Update document title
  const titles = {
    home: 'ProNet - Professional Intelligence',
    people: 'People - ProNet',
    opportunities: 'Opportunities - ProNet', 
    events: 'Events - ProNet',
    me: 'Profile - ProNet'
  };
  document.title = titles[route] || 'ProNet';
});

// Handle escape key globally
Events.on('key:escape', () => {
  // Close any open modals
  Events.emit('modal:close');
  
  // Clear any active searches
  const searchInputs = document.querySelectorAll('input[type="search"]');
  searchInputs.forEach(input => {
    if (input === document.activeElement) {
      input.blur();
    }
  });
});

// Handle keyboard shortcuts
Events.on('shortcut:cmd+k', Events.on('shortcut:ctrl+k', () => {
  Events.emit('search:focus');
}));

Events.on('shortcut:cmd+i', Events.on('shortcut:ctrl+i', () => {
  Events.emit('invite:open');
}));

Events.on('shortcut:cmd+/', Events.on('shortcut:ctrl+/', () => {
  Events.emit('help:open');
}));

// Initialize event system
console.log('✅ Event system initialized');

// Export for compatibility with existing code
export default {
  on: Events.on.bind(Events),
  emit: Events.emit.bind(Events),
  once: Events.once.bind(Events),
  off: Events.off.bind(Events),
  init: () => console.log('✅ Event system already initialized'),
  addEventListener: Events.on.bind(Events),
  removeEventListener: Events.off.bind(Events),
  dispatchEvent: Events.emit.bind(Events)
};

// Attach to window for debugging
if (typeof window !== 'undefined') {
  window.Events = Events;
  window.EventPatterns = EventPatterns;
}