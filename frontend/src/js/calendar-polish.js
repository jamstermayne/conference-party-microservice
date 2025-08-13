// Calendar polish (production)
import Store from '/js/store.js?v=b022';
import Events from '/js/events.js?v=b022';

const ENV = window.__ENV || {};
const FEED_URL = ENV.ICS_FEED_URL || '';     // e.g. https://.../calendar/feed.ics
const FEED_WEBCal = FEED_URL ? FEED_URL.replace(/^https?:\/\//, 'webcal://') : '';

function isoDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10); }
function startOfWeek(d) {
  const x = new Date(d); const day = x.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // Monday start
  x.setDate(x.getDate() + diff);
  x.setHours(0,0,0,0);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function fmtDow(d){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; }
function fmtDom(d){ return d.getDate().toString().padStart(2,'0'); }

function renderWeekStrip(container) {
  const savedISO = Store.get('calendar.day'); 
  const today = new Date();
  const start = startOfWeek(savedISO ? new Date(savedISO) : today);
  const wrap = document.createElement('div');
  wrap.className = 'cal-weekstrip';
  for (let i=0;i<7;i++){
    const d = addDays(start,i);
    const iso = isoDay(d);
    const btn = document.createElement('button');
    btn.className = 'cal-day btn-ghost';
    if ((savedISO && savedISO === iso) || (!savedISO && d.toDateString()===today.toDateString())) {
      btn.classList.add('cal-day--active');
    }
    btn.dataset.iso = iso;
    btn.innerHTML = `<span class="dow">${fmtDow(d)}</span><span class="dom">${fmtDom(d)}</span>`;
    btn.addEventListener('click', () => {
      Store.patch('calendar.day', iso);
      [...wrap.children].forEach(c => c.classList.remove('cal-day--active'));
      btn.classList.add('cal-day--active');
      Events.emit('calendar:day.changed', { day: iso });
    });
    wrap.appendChild(btn);
  }
  // mount at top of calendar route
  const headerMount = container.querySelector('[data-cal-mount="weekstrip"]') || container;
  headerMount.prepend(wrap);
}

function wireConnectButtons(container) {
  const appleBtn   = container.querySelector('[data-action="connect-apple"]');
  const outlookBtn = container.querySelector('[data-action="connect-outlook"]');
  const googleBtn  = container.querySelector('[data-action="connect-google"]'); // existing

  if (appleBtn) {
    appleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (FEED_WEBCal) {
        window.location.href = FEED_WEBCal; // Apple subscribes
        toast('Opening Apple Calendar…');
      } else {
        downloadICSFromSaved('velocity-events.ics');
      }
    });
  }
  if (outlookBtn) {
    outlookBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (FEED_URL) {
        // Outlook supports https subscription; desktop Outlook opens subscribe dialog
        window.open(FEED_URL, '_blank', 'noopener');
        toast('Opening Outlook…');
      } else {
        downloadICSFromSaved('velocity-events.ics');
      }
    });
  }
  if (googleBtn) {
    // existing flow already wires OAuth; no changes here
  }
}

function collectSavedParties() {
  // Expectation: events in Store('events') with .saved === true (or .starred/.attending)
  const list = Store.get('events') || [];
  return list.filter(e => e?.saved || e?.starred || e?.attending);
}

function icsEsc(s=''){ return String(s).replace(/([,;])/g,'\\$1'); }
function toICSDate(dt){
  const d = new Date(dt);
  const pad = n=>String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
function buildICS(events){
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Velocity//Gamescom//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'
  ];
  events.forEach(ev=>{
    const uid = ev.uid || `${(ev.id||ev.title||'event').replace(/\s+/g,'-')}@velocity`;
    const dtStart = toICSDate(ev.start || ev.datetime || new Date());
    const dtEnd   = toICSDate(ev.end || addDays(new Date(ev.start||Date.now()),0.0));
    lines.push(
      'BEGIN:VEVENT',
      `UID:${icsEsc(uid)}`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${icsEsc(ev.title||'Event')}`,
      ev.location ? `LOCATION:${icsEsc(ev.location)}` : '',
      ev.description ? `DESCRIPTION:${icsEsc(ev.description)}` : '',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}
function downloadICSFromSaved(filename='events.ics'){
  const items = collectSavedParties();
  if (!items.length) { toast('Save a few parties first.'); return; }
  const blob = new Blob([buildICS(items)], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 250);
  toast('Calendar file ready.');
}

// Normalize per-card "Add to Calendar" buttons (data-action="calendar")
function wireCardCalendar(container) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="calendar"]');
    if (!btn) return;
    e.preventDefault();
    const card = btn.closest('[data-id]');
    if (!card) return;
    // minimal single-event ICS
    const ev = {
      id: card.dataset.id,
      title: card.querySelector('.event-title,.cal-title')?.textContent?.trim(),
      start: card.dataset.start || card.getAttribute('data-start'),
      end: card.dataset.end || card.getAttribute('data-end'),
      location: card.querySelector('.event-venue,.cal-venue')?.textContent?.trim()
    };
    const blob = new Blob([buildICS([ev])], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${(ev.title||'event').replace(/\s+/g,'-')}.ics`; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 250);
  });
}

// Optional minimal toast (uses existing ui-feedback if present)
function toast(msg){ try{ document.dispatchEvent(new CustomEvent('ui:toast',{detail:{type:'ok',message:msg}})); }catch{} }

export default {
  init() {
    const route = document.querySelector('[data-route="calendar"]');
    if (!route) return;
    renderWeekStrip(route);
    wireConnectButtons(route);
    wireCardCalendar(route);

    // If controller paints list after init, we still react to day changes:
    document.addEventListener('calendar:day.changed', (e)=>{
      // Inform any controller listening; otherwise no-op
      // e.detail.day is ISO (YYYY-MM-DD)
    }, { passive:true });
  }
};