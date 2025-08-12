import Events from '/js/events.js';

export function setTitles(routeName){
  // Coerce to string safely
  let rn = '';
  if (typeof routeName === 'string') {
    rn = routeName;
  } else if (routeName && typeof routeName === 'object') {
    rn = routeName.name || routeName.route || routeName.id || '';
  }
  
  const pretty = rn ? `#${rn}` : '#parties';
  const h1 = document.getElementById('page-title');
  if (h1) h1.textContent = titleCase(rn || 'parties');
  
  // Only update chip if it exists and isn't duplicate
  const chip = document.getElementById('route-chip');
  if (chip && chip.style.display !== 'none') {
    chip.textContent = pretty;
  }
  
  document.title = `velocity.ai — ${titleCase(rn || 'parties')}`;
}
function titleCase(s){ 
  const str = String(s || '');
  return str ? (str.charAt(0).toUpperCase() + str.slice(1)) : ''; 
}

Events.on('route:changed', (payload) => {
  const routeName = payload?.name || payload?.route || payload;
  setTitles(routeName);
});
console.log('✅ Route title wired');
export default setTitles;