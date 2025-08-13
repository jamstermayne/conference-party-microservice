export function renderMap(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <h2 class="text-heading">Map</h2>
      <div class="text-secondary">Heatmap & venue pins will appear here.</div>
      <div class="actions">
        <button class="btn btn-primary" data-action="load-heatmap">Load Heatmap</button>
      </div>
    </section>`;
  root.querySelector('[data-action="load-heatmap"]').addEventListener('click', ()=>{
    // If MAPS_KEY present, load Maps JS; else show toast
    if(!window.__ENV?.MAPS_KEY){ document.dispatchEvent(new CustomEvent('ui:toast',{detail:{message:'Maps key missing'}})); }
  });
}