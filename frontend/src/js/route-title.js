import Events from '/js/events.js';

export function setTitles(routeName){
  const rn = (typeof routeName === 'string') ? routeName : '';
  const pretty = rn ? `#${rn}` : '';
  const h1 = document.getElementById('page-title');
  if (h1) h1.textContent = titleCase(rn || 'Parties');
  const chip = document.getElementById('route-chip');
  if (chip) chip.textContent = pretty;
  document.title = `velocity.ai — ${titleCase(rn || 'parties')}`;
}
function titleCase(s){ return s ? (s.charAt(0).toUpperCase() + s.slice(1)) : ''; }

Events.on('route:changed', ({ name }) => setTitles(name));
console.log('✅ Route title wired');
export default setTitles;