/**
 * STORE MODULE
 * Simple reactive state management for Professional Intelligence Platform
 */

const LS_KEY = 'pro-intel:v1';
const subs = new Set();

let state = {
  user: null,
  presence: { level: 'city', ttlHrs: 4 },
  intent: { on: false, tags: [] },
  invites: { left: 10 },
  hotspots: [], // [{id,name,total,dev,pub,inv,sp}]
  events: [],   // normalized events list
  inbound: [],  // opportunities inbound
  outbound: [], // opportunities outbound
  network: { connections: 0, events: 0, messages: 0, history: [] },
  dnd: false,
  
  // Extended state for compatibility with existing controllers
  proximity: {
    enabled: false,
    nearbyProfessionals: []
  },
  opportunities: {
    available: [],
    matches: [],
    saved: []
  },
  ui: {
    modal: null,
    notification: null,
    error: null,
    loading: false,
    theme: 'dark'
  },
  cache: {
    lastSync: 0
  }
};

const persist = (() => {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    }, 250);
  };
})();

export const Store = {
  init() {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        state = { ...state, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
    subs.forEach(fn => fn(state));
    return state;
  },

  get(path) {
    if (!path) return state;
    
    // Support dot notation for nested access
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  },

  set(patch) {
    state = { ...state, ...patch };
    persist();
    subs.forEach(fn => fn(state));
  },

  patch(path, value) {
    // Support dot notation for nested updates
    if (path.includes('.')) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = state;
      
      for (const key of keys) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      target[lastKey] = value;
    } else {
      state[path] = value;
    }
    
    persist();
    subs.forEach(fn => fn(state));
  },

  on(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },

  // Compatibility methods for existing controllers
  subscribe(path, callback) {
    const unsubscribe = this.on((newState) => {
      const value = path ? this.get(path) : newState;
      callback(value, newState);
    });
    return unsubscribe;
  },

  // Action helpers for UI updates
  actions: {
    showModal: (modal) => Store.patch('ui.modal', modal),
    hideModal: () => Store.patch('ui.modal', null),
    showNotification: (message) => Store.patch('ui.notification', message),
    showError: (error) => Store.patch('ui.error', error),
    showLoading: () => Store.patch('ui.loading', true),
    hideLoading: () => Store.patch('ui.loading', false),
    setTheme: (theme) => Store.patch('ui.theme', theme),
    setUser: (user) => Store.patch('user', user),
    setEvents: (events) => Store.patch('events', events),
    openModal: (config) => Store.patch('ui.modal', config)
  },

  // Getters for common checks
  getters: {
    isOnboarded: () => Boolean(state.user?.onboarded || state.user),
    currentUser: () => state.user,
    nearbyCount: () => state.proximity?.nearbyProfessionals?.length || 0,
    opportunityCount: () => state.opportunities?.available?.length || 0,
    eventCount: () => state.events?.length || 0,
    invitesLeft: () => state.invites?.left || 0
  },

  // Reset state (for logout, etc.)
  reset() {
    const initialState = {
      user: null,
      presence: { level: 'city', ttlHrs: 4 },
      intent: { on: false, tags: [] },
      invites: { left: 10 },
      hotspots: [],
      events: [],
      inbound: [],
      outbound: [],
      network: { connections: 0, events: 0, messages: 0, history: [] },
      dnd: false,
      proximity: { enabled: false, nearbyProfessionals: [] },
      opportunities: { available: [], matches: [], saved: [] },
      ui: { modal: null, notification: null, error: null, loading: false, theme: 'dark' },
      cache: { lastSync: 0 }
    };
    
    state = initialState;
    localStorage.removeItem(LS_KEY);
    subs.forEach(fn => fn(state));
  },

  // Debug helper
  debug() {
    console.log('Current state:', state);
    console.log('Subscribers:', subs.size);
    return state;
  }
};

// Default export for compatibility
export default Store;

// Attach to window for debugging
if (typeof window !== 'undefined') {
  window.store = Store;
}