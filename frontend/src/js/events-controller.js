/**
 * events-controller.js
 * Parties page renderer – stable one-pass render (no duplicates),
 * resilient to double-invocation and safe if router fires twice.
 */

import { getJSON } from './http.js';

const API = '/api/parties?conference=gamescom2025';

function badge(text, kind='pill') {
  return `<span class="badge badge--${kind}">${text}</span>`;
}

function metaRow({ time, venue }) {
  return `
    <div class="event-meta">
      <span class="em-ico">📅</span><span>${time}</span>
      <span class="dot">•</span>
      <span class="em-ico">📍</span><span>${venue}</span>
    </div>
  `;
}

function actionRow(id) {
  return `
    <div class="card-actions">
      <button class="btn btn-primary" data-action="save-sync" data-id="${id}">Save & Sync</button>
      <button class="btn btn-ghost" data-action="details" data-id="${id}">Details</button>
    </div>
  `;
}

function eventCard(ev) {
  const priceBadge = ev.price ? badge(`From ${ev.price}`, 'ghost') : badge('Free', 'ghost');
  const liveBadge  = badge('live', 'live');

  return `
    <article class="event-card" data-key="${ev.id}">
      <header class="card-hd">
        <h3 class="card-title">${ev.title}</h3>
        <div class="card-badges">${priceBadge}${liveBadge}</div>
      </header>
      ${metaRow({ time: ev.time || '', venue: `${ev.venue || ''}` })}
      ${actionRow(ev.id)}
    </article>
  `;
}

function wrapperOpen() {
  return `
  <section class="section-card">
    <div class="left-accent" aria-hidden="true"></div>
    <div class="section-hd">
      <div class="section-title">Recommended events</div>
      <div class="section-sub">Scroll to explore</div>
    </div>
    <div class="events-grid">
  `;
}

function wrapperClose() {
  return `</div></section>`;
}

export async function renderParties(rootEl){
  const mount =
    rootEl ||
    document.getElementById('app') ||
    document.getElementById('route-parties') ||
    document.getElementById('main');

  if (!mount) return;

  // ---- Re-entry guard + hard clear to prevent duplicates ----
  if (mount.dataset.rendering === 'parties') return;
  mount.dataset.rendering = 'parties';
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <div class="section-hd">
        <div class="section-title">Recommended events</div>
        <div class="section-sub">Loading…</div>
      </div>
      <div class="events-grid"></div>
    </section>
  `;

  try {
    // Fetch once; if API temporarily 404s, fallback to cached SW seed (if any)
    const res = await getJSON(API);
    const list = Array.isArray(res?.data) ? res.data : [];
    // De-dup by id just in case:
    const seen = new Set();
    const dedup = [];
    for (const e of list) {
      if (!e?.id) continue;
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      dedup.push(e);
    }

    const grid = mount.querySelector('.events-grid');
    if (!grid) {
      delete mount.dataset.rendering;
      return;
    }

    // Rebuild content (no append storms)
    const html = [wrapperOpen(), ...dedup.map(eventCard), wrapperClose()].join('');
    mount.innerHTML = html;

    // Wire minimal actions
    mount.querySelectorAll('[data-action="save-sync"]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = e.currentTarget.getAttribute('data-id');
        // TODO: call your save+calendar sync (placeholder toast)
        console.log('save-sync', id);
      });
    });
    mount.querySelectorAll('[data-action="details"]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = e.currentTarget.getAttribute('data-id');
        // TODO: route to details page (placeholder)
        console.log('details', id);
      });
    });

  } catch (err) {
    console.error('Failed to load events', err);
    mount.innerHTML = `
      <section class="section-card">
        <div class="left-accent" aria-hidden="true"></div>
        <div class="section-hd">
          <div class="section-title">Recommended events</div>
          <div class="section-sub error">Failed to load events.</div>
        </div>
      </section>
    `;
  } finally {
    delete mount.dataset.rendering;
  }
}