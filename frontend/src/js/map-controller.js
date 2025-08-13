export function renderMap(root){
  // Guard against undefined root
  if(!root) {
    console.warn('[map-controller] renderMap called with undefined root');
    return;
  }
  const wrap=document.createElement('section');
  wrap.className='section-card';
  wrap.innerHTML=`
    <div class="left-accent" aria-hidden="true"></div>
    <div class="section-body">
      <div class="header-row">
        <div class="header-title">Map</div>
        <div class="header-meta muted">Venues around Gamescom</div>
      </div>

      <div class="grid grid-3" id="map-venues">
        <div class="skeleton" style="height:140px"></div>
        <div class="skeleton" style="height:140px"></div>
        <div class="skeleton" style="height:140px"></div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const v = document.getElementById('map-venues');
  setTimeout(()=> {
    if(!v) return;
    v.innerHTML = [
      venue('Kölnmesse Confex','Messepl. 1, 50679 Köln','Kölnmesse Confex'),
      venue('Riverside','Rheinpromenade, Köln','Riverside Cologne'),
      venue('Hall 10','Kölnmesse Hall 10','Kölnmesse Hall 10')
    ].join('');
  }, 250);

  function venue(name, addr, q){
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q||name)}`;
    return `
      <article class="card">
        <div class="card-header"><div class="card-title">${name}</div></div>
        <div class="card-body">
          <div class="card-row">📍 ${addr}</div>
        </div>
        <div class="card-actions">
          <a class="btn btn-primary" target="_blank" rel="noopener" href="${url}">Open in Maps</a>
        </div>
      </article>
    `;
  }
}