// Production Feature Flags (fail-open strategy)
import { getJSON } from '/assets/js/http.js';

const defaults = {
  nav: { 
    parties: true, 
    hotspots: true, 
    opportunities: true, 
    calendar: true, 
    invites: true, 
    me: true, 
    settings: true 
  }
};

const Flags = {
  data: { ...defaults },
  
  async refresh() {
    try {
      const env = window.__ENV || {};
      const url = env.FLAGS_URL || '/api/flags';
      const res = await getJSON(url);
      
      if (res && typeof res === 'object') {
        this.data = { ...defaults, ...res };
      } else {
        this.data = { ...defaults }; // fail open
      }
    } catch (e) {
      console.warn('flags fetch fail', e);
      this.data = { ...defaults };   // ✅ fail open so channels stay
    }
    
    // Emit event for listeners
    document.dispatchEvent(new CustomEvent('flags:ready', { detail: this.data }));
    return this.data;
  },
  
  get(path, fallback = true) {
    try {
      return path.split('.').reduce((o, k) => o && o[k], this.data) ?? fallback;
    } catch { 
      return fallback; 
    }
  },
  
  all() { 
    return { ...this.data }; 
  }
};

// Auto-refresh on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Flags.refresh());
} else {
  Flags.refresh();
}

export default Flags;