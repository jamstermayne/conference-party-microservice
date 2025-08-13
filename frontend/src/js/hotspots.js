export async function renderHotspots(root){
  // Guard against undefined root
  if(!root) {
    console.warn('[hotspots] renderHotspots called with undefined root');
    return;
  }
  const wrap = document.createElement('section');
  wrap.className = 'section-card';
  wrap.innerHTML = `
    <div class="left-accent" aria-hidden="true"></div>
    <div class="section-body">
      <div class="header-row">
        <div class="header-title">Hotspots</div>
        <div class="header-meta muted">Trending venues</div>
      </div>
      <div class="grid grid-3" id="hotspots-grid">
        <div class="skeleton" style="height:160px"></div>
        <div class="skeleton" style="height:160px"></div>
        <div class="skeleton" style="height:160px"></div>
      </div>
    </div>
  `;
  root.appendChild(wrap);
  // Data wiring can come later; keep visual stable
  setTimeout(()=>{
    const g = document.getElementById('hotspots-grid'); if(!g) return;
    g.innerHTML = `
      <div class="card"><div class="card-header"><div class="card-title">Confex Hall A</div></div><div class="card-body"><div class="card-row">📍 Kölnmesse</div></div></div>
      <div class="card"><div class="card-header"><div class="card-title">Rheinufer Meetup</div></div><div class="card-body"><div class="card-row">📍 Riverside</div></div></div>
      <div class="card"><div class="card-header"><div class="card-title">Indie Corner</div></div><div class="card-body"><div class="card-row">📍 Hall 10</div></div></div>
    `;
  }, 300);
}