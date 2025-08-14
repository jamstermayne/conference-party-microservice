// Simple calendar add function - compatible with existing event structure
import { ensureConnected, createEvent } from './services/gcal-clean.js?v=b036';

export async function addToCalendar(ev) {
  // Normalize event data to match Google Calendar API format
  const payload = {
    summary: ev.title || ev.summary || 'Event',
    location: ev.location || ev.venue || '',
    description: ev.description || '',
    start: ev.start || ev.startISO || new Date().toISOString(),
    end: ev.end || ev.endISO || new Date(Date.now() + 3600000).toISOString(),
    timeZone: ev.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  // The createEvent function handles OAuth automatically via ensureConnected
  return await createEvent(payload);
}

// Alternative that shows more control
export async function addToCalendarWithFeedback(ev, callbacks = {}) {
  try {
    const result = await addToCalendar(ev);
    callbacks.onSuccess?.(result);
    return result;
  } catch (error) {
    callbacks.onError?.(error);
    throw error;
  }
}