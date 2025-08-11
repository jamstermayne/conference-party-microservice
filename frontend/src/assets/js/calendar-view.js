// Calendar agenda + week strip (vanilla JS, Store/Events integration)
import Store from './foundation/store.js';
import Events from './foundation/events.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = (s='') => String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

function fmtTime(iso){
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  } catch { return ''; }
}
function dayKey(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10); }

function normalize(items=[]){
  // Expect normalized structure from your sync; accept flexible keys
  return items.map(e => ({
    id: e.uid || e.id || crypto.randomUUID(),
    title: e.title || e['Event Name'] || 'Untitled',
    start: e.start || e.startTime || e.Start || e.isoStart,
    end: e.end || e.endTime || e.End || e.isoEnd,
    location: e.location || e.venue || e.Venue || '',
    source: e.source || 'unknown',
    sourceHint: e.sourceHint || '',
    provenance: e.provenance || []
  })).filter(e => e.start);
}

function installStatusPills(){
  const s = $('#cal-status');
  if (!s) return;
  const g = Store.get('calendar.googleConnected') ? '<span class="cal-chip">Google • Connected</span>' : '';
  const i = Store.get('calendar.icsSubscribed')   ? '<span class="cal-chip">ICS • Subscribed</span>' : '';
  const m = Store.get('calendar.m2mConnected')    ? '<span class="cal-chip">M2M • Active</span>' : '';
  s.innerHTML = [g,i,m].filter(Boolean).join(' ');
}

function renderWeekStrip(anchor=new Date()){
  const wrap = $('#cal-week'); if (!wrap) return;
  const start = new Date(anchor); start.setDate(start.getDate() - start.getDay()); // Sunday start
  const todayKey = dayKey(new Date());
  const buf = [];
  for (let i=0;i<7;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = dayKey(d);
    buf.push(`
      <button class="cal-day ${key===todayKey?'active':''}" data-day="${key}">
        <span class="d1">${d.toLocaleDateString([], { weekday:'short' })}</span>
        <span class="d2">${d.getDate()}</span>
      </button>
    `);
  }
  wrap.innerHTML = buf.join('');
}

function renderAgenda(items=[], selectedDayKey=null){
  const list = $('#cal-agenda'); if (!list) return;
  const emptyTpl = $('#tpl-cal-empty');

  if (!items.length){
    const frag = emptyTpl?.content?.cloneNode(true) || document.createElement('div');
    if (!emptyTpl) frag.textContent = 'No meetings found.';
    list.replaceChildren(frag); return;
  }

  const now = Date.now();
  const html = items.map(ev => {
    const start = new Date(ev.start);
    if (selectedDayKey && dayKey(start) !== selectedDayKey) return '';
    const mins = Math.round((start.getTime() - now) / 60000);
    const soon = mins >= 0 && mins <= 60 ? `<span class="badge badge-primary">Starts in ${mins}m</span>` : '';
    return `
      <article class="card card-glass card-compact">
        <div class="flex flex-row flex-wrap">
          <div class="cal-time">${fmtTime(ev.start)}${ev.end ? '–'+fmtTime(ev.end):''}</div>
          <div class="flex-1"></div>
          ${soon}
        </div>
        <h3 class="text-heading">${esc(ev.title)}</h3>
        <div class="cal-loc">${esc(ev.location || '')}</div>
        <div class="cal-actions">
          <button class="btn btn-secondary" data-action="add-ics" data-id="${esc(ev.id)}">Add to Calendar</button>
          <button class="btn btn-ghost" data-action="navigate" data-address="${esc(ev.location||'')}">Navigate</button>
        </div>
      </article>`;
  }).join('');
  list.innerHTML = html || (emptyTpl?.innerHTML ?? '<div class="text-secondary">No meetings.</div>');
}

async function connectGoogle(){
  try {
    document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'ok', message:'Connecting Google…' }}));
    // Your existing GCal.connect() should open the OAuth popup and set tokens server-side.
    const { default: GCal } = await import('./services/googleCalendar.js');
    await GCal.connect();
    // Your CalSync orchestrator should populate Store.calendar.events
    const { default: CalSync } = await import('./services/calendarSync.js');
    await CalSync.syncNow({ window:'conference' });
    Store.patch('calendar.googleConnected', true);
    installStatusPills();
    renderAgenda(normalize(Store.get('calendar.events')||[]));
    document.dispatchEvent(new CustomEvent('ui:calendar-connected'));
  } catch (e) {
    document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'error', message:'Google connect failed' }}));
  }
}

async function addICS(){
  try{
    const url = prompt('Paste your ICS URL'); if (!url) return;
    const { default: ICS } = await import('./services/icsSync.js');
    await ICS.subscribe(url);
    const { default: CalSync } = await import('./services/calendarSync.js');
    await CalSync.pullICS();
    Store.patch('calendar.icsSubscribed', true);
    installStatusPills();
    renderAgenda(normalize(Store.get('calendar.events')||[]));
  } catch {
    document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'error', message:'ICS subscription failed' }}));
  }
}

function wire(){
  const root = $('#panel-calendar'); if (!root) return;
  root.addEventListener('click', async (e)=>{
    const b = e.target.closest('[data-action]'); if (!b) return;
    const act = b.dataset.action;
    if (act === 'cal-google') return connectGoogle();
    if (act === 'cal-ics')    return addICS();
    if (act === 'cal-m2m')    { Store.patch('calendar.m2mConnected', true); installStatusPills(); document.dispatchEvent(new CustomEvent('ui:toast',{ detail:{ type:'ok', message:'Meet-to-Match enabled' }})); }
    if (act === 'add-ics')    {
      // lightweight ICS download for a single event (fallback for Apple/Outlook)
      const id = b.dataset.id;
      const events = normalize(Store.get('calendar.events')||[]);
      const ev = events.find(x=>String(x.id)===String(id)); if (!ev) return;
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Velocity//Gamescom//EN',
        'BEGIN:VEVENT',
        `UID:${ev.id}@velocity`,
        `DTSTART:${new Date(ev.start).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,
        ev.end ? `DTEND:${new Date(ev.end).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}` : '',
        `SUMMARY:${ev.title}`,
        ev.location ? `LOCATION:${ev.location}` : '',
        'END:VEVENT','END:VCALENDAR'
      ].filter(Boolean).join('\r\n');
      const blob = new Blob([ics], {type:'text/calendar'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'event.ics'; a.click(); URL.revokeObjectURL(a.href);
      document.dispatchEvent(new CustomEvent('ui:addToCalendar'));
    }
    if (act === 'navigate'){
      const address = b.dataset.address || '';
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank', 'noopener');
    }
  });

  $('#cal-week')?.addEventListener('click', (e)=>{
    const d = e.target.closest('.cal-day'); if (!d) return;
    $$('.cal-day', $('#cal-week')).forEach(x=>x.classList.remove('active'));
    d.classList.add('active');
    renderAgenda(normalize(Store.get('calendar.events')||[]), d.dataset.day);
  });
}

function showSkeleton(on){ const s=$('#cal-skeleton'); if (s) s.style.display = on?'block':'none'; }

document.addEventListener('DOMContentLoaded', ()=>{
  wire();
  installStatusPills();
  renderWeekStrip(new Date());
  showSkeleton(true);
  const items = normalize(Store.get('calendar.events')||[]);
  renderAgenda(items);
  showSkeleton(false);
});

// Optional: when a sync elsewhere updates calendar.events, repaint
Events.on?.('calendar:updated', ()=>{
  installStatusPills();
  renderAgenda(normalize(Store.get('calendar.events')||[]));
});