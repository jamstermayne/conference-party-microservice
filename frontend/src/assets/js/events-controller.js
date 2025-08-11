/**
 * EventsController (Parties route)
 * - Renders parties from /api/parties
 * - Uses emptyState() for graceful empty/error views
 * - Wires Save / Add-to-Calendar / Navigate / Share actions
 * - Vanilla JS; Slack-dark UI classes
 */

import { emptyState, toast } from './ui-feedback.js';
import Store from './foundation/store.js';
import Events from './events.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = (s='') => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

export default class EventsController {
  constructor(root) {
    this.root = root;               // <section data-route="parties">
    this.list = null;
    this.loading = false;
  }

  init() {
    if (!this.root.querySelector('[data-role="events-list"]')) {
      const header = document.createElement('header');
      header.className = 'panel-header flex flex-row flex-wrap';
      header.innerHTML = `<h1 class="text-heading">Parties</h1><div class="flex-1"></div>`;
      const list = document.createElement('div');
      list.dataset.role = 'events-list';
      list.className = 'stack-3';
      this.root.replaceChildren(header, list);
    }
    this.list = this.root.querySelector('[data-role="events-list"]');
    this.wireActions();
  }

  onEnter() {
    const cached = Store.get('events');
    if (Array.isArray(cached) && cached.length) this.paint(cached);
    else this.load();
  }
  onLeave() {}
  destroy() {}

  async load() {
    if (this.loading) return;
    this.loading = true;

    this.list.innerHTML = `
      <div class="card card-glass card-compact skeleton"></div>
      <div class="card card-glass card-compact skeleton"></div>
      <div class="card card-glass card-compact skeleton"></div>
    `;

    try {
      const res = await fetch('/api/parties', { credentials:'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      Store.patch('events', data);
      this.paint(data);
    } catch (e) {
      console.warn('events load failed', e);
      this.list.replaceChildren(emptyState('No events right now. Check back soon.'));
      toast('Unable to load events', 'error');
    } finally {
      this.loading = false;
    }
  }

  paint(items = []) {
    if (!items.length) {
      this.list.replaceChildren(emptyState('No parties available.'));
      return;
    }
    this.list.innerHTML = items.map(this.renderCard).join('');
  }

  renderCard(item={}) {
    const id    = esc(item.id || item.uid || crypto.randomUUID());
    const title = esc(item.title || item['Event Name'] || 'Untitled');
    const time  = esc(item.time  || item.Time  || '');
    const date  = esc(item.date  || item.Date  || '');
    const venue = esc(item.venue || item.Venue || item.location || '');
    const host  = esc(item.hosts || item.Hosts || '');
    const price = esc(item.price || item.Price || '');

    const persona = item.persona || {};
    const pills = [
      persona.dev ? `<span class="badge" style="background: var(--dev-color)">${persona.dev} Dev</span>` : '',
      persona.pub ? `<span class="badge" style="background: var(--pub-color)">${persona.pub} Pub</span>` : '',
      persona.inv ? `<span class="badge" style="background: var(--inv-color)">${persona.inv} Inv</span>` : '',
      persona.sp  ? `<span class="badge" style="background: var(--sp-color)">${persona.sp} SP</span>`  : ''
    ].filter(Boolean).join('');

    return `
      <article class="card card-glass card-compact party-card" data-id="${id}">
        <div class="card-header flex flex-row flex-wrap">
          <h3 class="text-heading">${title}</h3>
          <div class="flex-1"></div>
          ${date ? `<span class="badge badge-secondary">${date}</span>` : ''}
          ${time ? `<span class="badge badge-primary" style="margin-left:8px">${time}</span>` : ''}
        </div>
        ${venue ? `<div class="text-secondary">${venue}</div>` : ''}
        ${host  ? `<div class="text-muted text-caption">Host: ${host}</div>` : ''}
        ${price ? `<div class="text-muted text-caption">Price: ${price}</div>` : ''}

        ${pills ? `<div class="stack-2" style="margin-top:8px">${pills}</div>` : ''}

        <div class="flex flex-row flex-wrap" style="gap:8px; margin-top:10px">
          <button class="btn btn-primary"   data-action="save"      data-id="${id}">Save</button>
          <button class="btn btn-secondary" data-action="calendar"  data-id="${id}">Add to Calendar</button>
          <button class="btn btn-ghost"     data-action="navigate"  data-venue="${venue}">Navigate</button>
          <button class="btn btn-text"      data-action="share"     data-id="${id}">Share</button>
        </div>
      </article>
    `;
  }

  wireActions() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const act = btn.dataset.action;
      const id  = btn.dataset.id;

      if (act === 'save') {
        const saved = new Set(Store.get('events.saved') || []);
        saved.add(id);
        Store.patch('events.saved', Array.from(saved));
        toast('Saved');
        document.dispatchEvent(new CustomEvent('ui:first-save')); // PWA nudge hook
      }

      if (act === 'calendar') {
        try {
          const all = Store.get('events') || [];
          const ev = all.find(x => String(x.id) === String(id)) || {};
          const ics = [
            'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Velocity//Gamescom//EN',
            'BEGIN:VEVENT',
            `UID:${id}@velocity`,
            ev.Date && ev.Time ? `DTSTART:${EventsToISO(ev.Date, ev.Time)}` : '',
            `SUMMARY:${ev['Event Name'] || ev.title || 'Event'}`,
            ev.Venue ? `LOCATION:${ev.Venue}` : '',
            'END:VEVENT','END:VCALENDAR'
          ].filter(Boolean).join('\r\n');
          const blob = new Blob([ics], {type:'text/calendar'});
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${(ev['Event Name']||'event').toString().slice(0,40)}.ics`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast('Added to calendar');
        } catch {
          toast('Calendar add failed', 'error');
        }
      }

      if (act === 'navigate') {
        const addr = btn.dataset.venue || '';
        if (!addr) return;
        window.open(`https://maps.google.com/?q=${encodeURIComponent(addr)}`, '_blank', 'noopener');
      }

      if (act === 'share') {
        try {
          const url = location.origin + '/#parties';
          if (navigator.share) {
            navigator.share({ title: 'Gamescom Parties', text: 'Join this event', url });
          } else {
            navigator.clipboard.writeText(url);
            toast('Link copied');
          }
        } catch {
          toast('Share failed', 'error');
        }
      }
    });
  }
}

/* Helpers */

function EventsToISO(dateStr, timeStr) {
  try {
    const time = String(timeStr).split('-')[0].trim(); // take start time
    const dt = new Date(`${dateStr} ${new Date().getFullYear()} ${time}`);
    return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); // YYYYMMDDTHHMMSSZ
  } catch { return ''; }
}