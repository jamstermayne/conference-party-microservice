/**
 * Hotspots (Heatmap v1) — pure SVG circles with intensity, no external SDK.
 * Builds density from /api/parties (venue frequency).
 */
import { emptyState } from '/js/ui-feedback.js?v=b021';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// crude mappings for Gamescom venues → pseudo positions in a 800x500 canvas
const POS = {
  'Kölnmesse Confex': [520, 240],
  'Bootshaus': [530, 320],
  'Gamescom City Hub': [480, 220],
  'Friesenplatz': [460, 210],
  'Lanxess Arena': [600, 260],
  'Koln Triangle': [580, 220],
  'Hohenzollernring': [440, 230],
};

function posFor(name) {
  if (POS[name]) return POS[name];
  // scatter unknowns
  const h = Math.abs(hash(name)) % 1000;
  const x = 120 + (h % 560);
  const y = 120 + ((h >> 3) % 260);
  return [x, y];
}
function hash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h+s.charCodeAt(i); h|=0; } return h; }

function svgHeat(dots) {
  const w=800, h=500;
  const g = dots.map(d=>{
    const r = 10 + Math.min(30, d.weight*4);
    const [x,y] = d.xy;
    const o = Math.min(0.75, 0.25 + d.weight*0.08);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#grad)" opacity="${o}"></circle>`;
  }).join('');
  return `
  <svg viewBox="0 0 ${w} ${h}" class="hs-svg" role="img" aria-label="Hotspots">
    <defs>
      <radialGradient id="grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6b7bff" stop-opacity="1"/>
        <stop offset="100%" stop-color="#2c2f7a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="16" ry="16" fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.06)"/>
    ${g}
  </svg>`;
}

function listItem(i, name, weight, max){
  const pct = Math.max(6, Math.round((weight/max)*100));
  return el(`
    <div class="hs-item">
      <div class="hs-rank">${i}</div>
      <div class="hs-name">${name}</div>
      <div class="hs-bar"><div class="hs-fill" style="width:${pct}%"></div></div>
    </div>
  `);
}

export async function renderHotspots() {
  const root = document.getElementById('route-hotspots') || document.getElementById('main');
  if (!root) return;

  root.innerHTML = `
    <div class="hotspots-wrap">
      <div class="hotspots-grid">
        <section class="hotspots-map"></section>
        <section class="hotspots-list"><h3 style="margin:6px 8px 10px;color:var(--text-secondary,#a5a7ad)">Top Venues</h3></section>
      </div>
    </div>
  `;

  const mapEl = root.querySelector('.hotspots-map');
  const listEl = root.querySelector('.hotspots-list');

  let data = [];
  try {
    const json = await getJSON(`${API_BASE}/parties?conference=gamescom2025`);
    data = Array.isArray(json?.data) ? json.data : [];
  } catch {}

  if (!data.length) {
    mapEl.append(emptyState('No data to visualize yet.'));
    listEl.append(emptyState('No hotspots.'));
    return;
  }

  // Aggregate by venue
  const byVenue = new Map();
  data.forEach(ev=>{
    const v = (ev.venue || 'Unknown').trim();
    byVenue.set(v, (byVenue.get(v)||0) + 1);
  });

  const top = [...byVenue.entries()]
    .map(([name, weight]) => ({ name, weight, xy: posFor(name) }))
    .sort((a,b)=> b.weight - a.weight);

  const maxW = top[0]?.weight || 1;

  // Render SVG heat
  mapEl.innerHTML = svgHeat(top);

  // Render ranked list (top 20)
  top.slice(0,20).forEach((t, i)=>{
    listEl.append(listItem(i+1, t.name, t.weight, maxW));
  });
}

// Auto init
try {
  document.addEventListener('route:change', (e)=>{
    if ((e.detail?.name) === 'hotspots') renderHotspots();
  });
} catch {}