// Global app state + constants. Persist minimal, derive the rest.
const _state = {
  profile: null,                 // { id, name, email, picture, domain }
  invites: { left: 10, redeemed: 0, totalGranted: 10, sent: [] },
  parties: [],                   // loaded from /api/parties or /data/parties.json
  savedPartyIds: new Set(),      // FTUE selections
  calendar: { google: false, ics: false, mtm: false, lastSync: null },
  perf: { degraded: false },
  flags: { installed: false, installSnoozeAt: 0, firstShareBonus: false },
  connections: { count: 0 },     // for bonus rule (+5 when 10 connections)
  route: 'parties',
  config: {},
  events: [],
  redeemedInvites: [],
  sentInvites: [],
  user: {},
  pendingInvite: null,
  meta: { eventsViewed: 0 },
  features: {},
  contactSync: {}
};

export const Store = {
  // Initialize store
  init() {
    console.log('📊 Store initialized');
  },

  // Get value by dot notation path
  get(path) {
    if (!path) return _state;
    return this._getValue(_state, path);
  },

  // Set value by dot notation path
  set(path, value) {
    if (!path) return;
    this._setValue(_state, path, value);
    Events.emit('store:updated', { path, value });
  },

  // Patch/merge object value by dot notation path
  patch(path, value) {
    if (!path) return;
    const existing = this.get(path);
    if (typeof existing === 'object' && existing !== null && typeof value === 'object') {
      this.set(path, { ...existing, ...value });
    } else {
      this.set(path, value);
    }
  },

  // Remove a key
  remove(path) {
    if (!path) return;
    const keys = path.split('.');
    const lastKey = keys.pop();
    const parent = this._getValue(_state, keys.join('.'));
    if (parent && typeof parent === 'object') {
      delete parent[lastKey];
      Events.emit('store:updated', { path, removed: true });
    }
  },

  // Reset to default state
  reset() {
    Object.keys(_state).forEach(key => delete _state[key]);
    Object.assign(_state, {
      profile: null,
      invites: { left: 10, redeemed: 0, totalGranted: 10, sent: [] },
      parties: [],
      savedPartyIds: new Set(),
      calendar: { google: false, ics: false, mtm: false, lastSync: null },
      perf: { degraded: false },
      flags: { installed: false, installSnoozeAt: 0, firstShareBonus: false },
      connections: { count: 0 },
      route: 'parties',
      config: {},
      events: [],
      redeemedInvites: [],
      sentInvites: [],
      user: {},
      pendingInvite: null,
      meta: { eventsViewed: 0 },
      features: {},
      contactSync: {}
    });
    Events.emit('store:reset');
  },

  // Get raw state reference (for debugging)
  getState() {
    return _state;
  },

  // Internal helper to get nested value
  _getValue(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  },

  // Internal helper to set nested value
  _setValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
};

export const EVENTS = {
  SAVED_PARTIES: 'saved-parties',
  INSTALL_READY: 'install-ready',
  INSTALLED: 'installed',
  INVITES_CHANGED: 'invites-changed',
  CAL_SYNCED: 'calendar-synced',
  BONUS_UNLOCKED: 'bonus-unlocked'
};

// Event system using EventTarget for proper browser compatibility
const bus = new EventTarget();

export const Events = {
  on: (t, fn) => bus.addEventListener(t, fn),
  off: (t, fn) => bus.removeEventListener(t, fn),
  emit: (t, detail) => bus.dispatchEvent(new CustomEvent(t, { detail }))
};