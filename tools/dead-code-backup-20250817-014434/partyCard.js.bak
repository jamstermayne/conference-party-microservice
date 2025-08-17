import { chips } from './provenance.js?v=b023';

export function renderPartyCard(p){
  return `
  <article class="party-card vcard" data-party-id="${p.id}"
           data-title="${escape(p.title)}"
           data-start="${p.startISO || p.start || ''}"
           data-end="${p.endISO || p.end || ''}"
           data-location="${escape(p.venue || p.location || '')}"
           data-desc="${escape(p.description || '')}"
           data-lat="${p.lat || ''}" data-lon="${p.lon || ''}">
    <div class="party-title truncate">${escape(p.title)}</div>
    <div class="party-meta">${escape(p.venue)} · ${escape(p.timeLabel)}</div>
    <div class="party-overlay">
      <span class="badge" style="background:var(--dev-color);color:var(--neutral-100)">${p.dev||0} Dev</span>
      <span class="badge" style="background:var(--pub-color);color:var(--neutral-100)">${p.pub||0} Pub</span>
      <span class="badge" style="background:var(--inv-color);color:var(--neutral-100)">${p.inv||0} Inv</span>
      <span class="badge" style="background:var(--sp-color);color:var(--neutral-100)">${p.sp||0} SP</span>
      ${chips(p.provenance||[])}
    </div>
    <footer class="card-actions">
      <button class="btn-add-to-calendar" type="button">Add to Calendar</button>
      <div class="cal-menu" hidden>
        <button class="btn-cal-google" type="button">Google</button>
        <button class="btn-cal-outlook" type="button">Outlook</button>
        <button class="btn-cal-m2m" type="button">Meet to Match</button>
      </div>
      <button class="btn-pin" type="button" aria-label="Open on map">📍</button>
      <button class="btn btn-primary" data-action="event.rsvp" data-id="${p.id}">Going</button>
      <button class="btn" data-action="event.navigate" data-id="${p.id}">🧭 Navigate</button>
    </footer>
  </article>`;
}
function escape(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }