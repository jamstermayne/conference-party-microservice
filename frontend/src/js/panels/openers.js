import { openParties } from './parties-day.js';
import { openCalendarPanel } from './providers-calendar.js';
import { openMapPanel } from './map.js';
import { openInvitesPanel } from './invites.js';
import { openContactsPanel } from './contacts.js';
import { openMePanel } from './me.js';
import { openSettingsPanel } from './settings.js';

export function openPartiesDay(date, activator){ openParties(date, activator); }
export function openCalendar(activator){ openCalendarPanel(activator); }
export function openMapToday(activator){ openMapPanel(new Date().toISOString().slice(0,10), activator); }
export function openInvites(activator){ openInvitesPanel(activator); }
export function openContacts(activator){ openContactsPanel(activator); }
export function openMe(activator){ openMePanel(activator); }
export function openSettings(activator){ openSettingsPanel(activator); }