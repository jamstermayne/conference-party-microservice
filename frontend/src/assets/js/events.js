/**
 * Proxy for the Events bus.
 * Supports BOTH default and named export to satisfy mixed import styles:
 *   import Events from './events.js'
 *   import { Events } from './events.js'
 */

import Events from './foundation/events.js';

export default Events;
export { Events };