import { chips } from './provenance.js?v=b022';

export function renderPartyCard(p){
  return `
  <article class="party-card" data-id="${p.id}">
    <div class="party-title truncate">${escape(p.title)}</div>
    <div class="party-meta">${escape(p.venue)} · ${escape(p.timeLabel)}</div>
    <div class="party-overlay">
      <span class="badge" style="background:var(--dev-color);color:#111">${p.dev||0} Dev</span>
      <span class="badge" style="background:var(--pub-color);color:#111">${p.pub||0} Pub</span>
      <span class="badge" style="background:var(--inv-color);color:#111">${p.inv||0} Inv</span>
      <span class="badge" style="background:var(--sp-color);color:#111">${p.sp||0} SP</span>
      ${chips(p.provenance||[])}
    </div>
    <div class="party-cta">
      <button class="btn btn-primary" data-action="event.rsvp" data-id="${p.id}">Going</button>
      <button class="btn" data-action="event.navigate" data-id="${p.id}">🧭 Navigate</button>
    </div>
  </article>`;
}
function escape(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }