/**
 * Compatibility shim for legacy imports.
 * Some modules do:  import { Events } from './state.js'
 * We export Events here to satisfy those imports without touching callers.
 */

import Events from './foundation/events.js';

export { Events };           // supports: import { Events } from './state.js'
export default {};           // no default state exported from this shim