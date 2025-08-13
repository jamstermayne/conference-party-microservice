/**
 * Hotspots (two-panel app shell: sidebar + content)
 * Renders a single main panel with heatmap canvas and a compact list below.
 * No third column, no sidebar reflow.
 */
import { setTitles } from './route-title.js';

function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
function byId(id){ return document.getElementById(id); }

export function renderHotspots(){
  const app = document.getElementById('app');
  if (!app) return;
  setTitles('hotspots');
  app.innerHTML = `
    <section class="cards-wrap">
      <div class="card" style="height:420px;display:flex;flex-direction:column;">
        <h3 style="margin-bottom:12px;">Live Heatmap</h3>
        <canvas id="heatmap" style="flex:1;border-radius:12px;background:#0f1017;box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);"></canvas>
      </div>
      <div class="card">
        <h3>Top Venues</h3>
        <div id="top-venues" class="meta"></div>
      </div>
    </section>
  `;

  // demo data
  const venues = [
    { name:'Kölnmesse Confex', score: 92 },
    { name:'Marriott Hotel',   score: 67 }
  ];

  const list = byId('top-venues');
  if (list) {
    list.innerHTML = venues.map(v => `<span class="pill">${v.name}</span>`).join(' ');
  }

  // lightweight fake heat draw
  const canvas = byId('heatmap');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const grd = ctx.createRadialGradient(120,120,10,120,120,140);
    grd.addColorStop(0,'rgba(124,138,255,.8)');
    grd.addColorStop(1,'rgba(124,138,255,0)');
    ctx.fillStyle = grd; 
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  }
}

document.addEventListener('route:hotspots', renderHotspots);

export default { renderHotspots };