/**
 * Hotspots Enhancer — applies heatmap colors and renders legend
 */
const q = (s,r=document)=>r.querySelector(s);

function applyHeatmap(container){
  if (!container) return;
  container.querySelectorAll('.hotspot-card').forEach(card=>{
    const metric = parseInt(card.dataset.visits || card.dataset.count || 0,10);
    let level = 'low';
    if (metric >= 50) level = 'high';
    else if (metric >= 20) level = 'med';
    card.setAttribute('data-heat', level);
  });
}

function injectLegend(container){
  if (!container) return;
  const legend = document.createElement('div');
  legend.className = 'hotspots-legend';
  legend.innerHTML = `
    <div class="legend-item"><span class="swatch low"></span>Low</div>
    <div class="legend-item"><span class="swatch med"></span>Medium</div>
    <div class="legend-item"><span class="swatch high"></span>High</div>
  `;
  container.parentNode.insertBefore(legend, container.nextSibling);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const target = q('[data-hotspots-list]');
  if (!target) return;
  applyHeatmap(target);
  injectLegend(target);
});