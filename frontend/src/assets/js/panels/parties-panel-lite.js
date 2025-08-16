/**
 * Parties panel (lite): renders parties for a YYYY-MM-DD date.
 * Fallback ICS add-to-calendar (client-side) to ensure UX works without backend.
 */
function escape(s=''){ return String(s).replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
function isoDate(s){ return (s||'').slice(0,10); }
function toICSDate(s){
  // accepts ISO like 2025-08-21T19:00:00Z or 2025-08-21
  const d = s && s.length>10 ? new Date(s) : new Date(s+'T00:00:00');
  const pad = n => String(n).padStart(2,'0');
  const y=d.getUTCFullYear(), m=pad(d.getUTCMonth()+1), day=pad(d.getUTCDate());
  const hh=pad(d.getUTCHours()), mm=pad(d.getUTCMinutes()), ss=pad(d.getUTCSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}
function buildICS(evt){
  const uid = `party-${(evt.id||evt.title||evt.name||'x').replace(/\W+/g,'-')}@conference-party-app`;
  const dtStart = toICSDate(evt.start || evt.startsAt || evt.date);
  const dtEnd   = toICSDate(evt.end   || evt.endsAt   || evt.start || evt.date);
  const title   = escape(evt.title || evt.name || 'Party');
  const loc     = escape(evt.venue || evt.location?.name || '');
  const desc    = escape((evt.description || '').slice(0,1000));
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Conference Party App//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    loc && `LOCATION:${loc}`,
    desc && `DESCRIPTION:${desc}`,
    'END:VEVENT','END:VCALENDAR',''
  ].filter(Boolean).join('\r\n');
}
function downloadICS(evt){
  const ics = buildICS(evt);
  const blob = new Blob([ics], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = isoDate(evt.start||evt.startsAt||evt.date)||'date';
  a.href = url; a.download = `party-${date}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function mountPartiesPanel(dateISO){
  const mount = document.getElementById('app') || document.body;
  mount.innerHTML = `
    <section class="parties-panel">
      <h2 class="home-h2">Parties • ${dateISO}</h2>
      <div class="card-grid" id="parties-list" aria-live="polite"></div>
    </section>
  `;
  const listEl = mount.querySelector('#parties-list');

  let raw;
  try {
    const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
    raw = await r.json();
  } catch (e) {
    listEl.innerHTML = `<p class="empty-state">Could not load parties.</p>`;
    return;
  }
  const all = Array.isArray(raw?.data) ? raw.data
           : Array.isArray(raw?.parties) ? raw.parties
           : Array.isArray(raw) ? raw : [];
  const items = all.filter(e => isoDate(e.start||e.startsAt||e.date) === dateISO);

  if (!items.length){
    listEl.innerHTML = `<p class="empty-state">No parties for ${dateISO}.</p>`;
    return;
  }

  listEl.innerHTML = items.map(evt => {
    const title = escape(evt.title||evt.name||'Party');
    const when  = escape((evt.start||evt.startsAt||'').replace('T',' ').slice(0,16));
    const where = escape(evt.venue || evt.location?.name || '');
    return `
      <article class="vcard">
        <header class="vcard__head"><h3>${title}</h3></header>
        <div class="vcard__body">
          ${where ? `<p>${where}</p>`:''}
          ${when  ? `<p>${when}</p>`:''}
        </div>
        <footer class="vcard__foot">
          <button class="btn-add-to-calendar" data-evt='${encodeURIComponent(JSON.stringify(evt))}'>Add to Calendar</button>
        </footer>
      </article>`;
  }).join('');

  listEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn-add-to-calendar');
    if(!btn) return;
    const evt = JSON.parse(decodeURIComponent(btn.dataset.evt||'%7B%7D'));
    downloadICS(evt);
  });
}