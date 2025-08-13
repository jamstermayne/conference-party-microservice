/**
 * CALENDAR CONTROLLER
 * Manages calendar connections, sync, and Meet to Match integration
 */

import { Store } from '../store.js?v=b011';
import { Events } from '../events.js?v=b011';
import * as GCal from '../services/googleCalendar.js?v=b011';
import * as ICS from '../services/icsSync.js?v=b011';
import * as CalSync from '../services/calendarSync.js?v=b011';

export function CalendarController(section) {
  const mount = section.querySelector('#calendar-connect-mount');
  const status = section.querySelector('#calendar-status');

  section.addEventListener('route:enter', () => render());

  function render() {
    const tpl = document.getElementById('tpl-calendar-connect');
    mount.replaceChildren(tpl.content.cloneNode(true));
    status.replaceChildren();
    bind();
    paintStatus();
  }

  function bind() {
    mount.querySelector('[data-action="cal.google.connect"]').addEventListener('click', onGoogleConnect);
    mount.querySelector('[data-action="cal.ics.subscribe"]').addEventListener('click', onICSSubscribe);
  }

  async function onGoogleConnect() {
    try {
      await GCal.connect(); // OAuth popup → backend session cookie
      await CalSync.syncNow({ window: 'conference' });
      paintStatus({ ok: true, msg: 'Google connected. Meet to Match meetings will appear automatically.' });
    } catch (e) {
      paintStatus({ ok: false, msg: 'Google connection failed. Please try again.' });
    }
  }

  async function onICSSubscribe() {
    const url = mount.querySelector('#m2m-ics-url').value.trim();
    if (!url) return paintStatus({ ok: false, msg: 'Please paste your Meet to Match .ics link.' });
    try {
      await ICS.subscribe(url);     // store URL on backend
      await CalSync.pullICS();      // trigger first pull
      paintStatus({ ok: true, msg: 'Subscribed to Meet to Match .ics. Syncing…' });
    } catch (e) {
      paintStatus({ ok: false, msg: 'Invalid or unreachable .ics link.' });
    }
  }

  function paintStatus(extra) {
    const s = Store.get();
    const meta = s.calendar?.meta || {};
    const row = document.createElement('div');
    row.className = 'card';
    const prov = [
      s.calendar?.googleConnected ? '<span class="badge info">Google · Connected</span>' : '<span class="badge">Google · Not connected</span>',
      s.calendar?.icsSubscribed ? '<span class="badge info">ICS · Subscribed</span>' : '<span class="badge">ICS · Not subscribed</span>',
      `<span class="badge">${meta.lastSync ? `Last sync ${timeAgo(meta.lastSync)}` : 'No sync yet'}</span>`,
      `<span class="badge success">${(meta.found || 0)} meetings found</span>`,
      `<span class="badge info">${(meta.matched || 0)} matched to venues</span>`
    ].join(' ');
    row.innerHTML = prov;
    status.replaceChildren(row);

    if (extra) {
      const note = document.createElement('div');
      note.className = 'card';
      note.style.color = extra.ok ? 'var(--accent-success)' : 'var(--accent-error)';
      note.textContent = extra.msg;
      status.appendChild(note);
    }
  }

  function timeAgo(ts) {
    const d = typeof ts === 'number' ? ts : Date.parse(ts);
    const mins = Math.round((Date.now() - d) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.round(mins / 60); 
    return `${h}h ago`;
  }
}

export default CalendarController;