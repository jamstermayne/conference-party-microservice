// Simple wrapper for adding events to calendar
// If you already import from services, keep it; else add:
import { createEvent } from './services/gcal-clean.js?v=b036';

export async function addToCalendar(ev) {
  // `ev` should include title, start, end, location, description, etc.
  // We delegate to the service which ensures session (OAuth if needed).
  return await createEvent(ev);
}