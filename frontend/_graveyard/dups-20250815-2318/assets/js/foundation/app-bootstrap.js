// Single entry: verifies/initializes foundation modules safely
import './logger.js';
import Events from './events.js';
import Store from './store.js';
import Router from './router.js';
import './actionDelegate.js';
import Metrics from './metrics.js';
import Flags from './featureFlags.js';

// Minimal boot diagnostics
Events.emit('app:boot', { ts: Date.now(), route: location.hash });

// Optional: expose ready promise for controllers that want to wait
export const FoundationReady = Promise.resolve({ Events, Store, Router, Metrics, Flags });
if (!window.FoundationReady) window.FoundationReady = FoundationReady;

// Gentle test pings (remove if noisy)
Metrics.track('app_boot', { route: location.hash || '#parties' });
Flags.refresh();