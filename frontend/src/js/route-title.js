import Events from '/assets/js/events.js';
function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }
function setTitles(r){ document.title = `velocity.ai — ${cap(r)}`; }
document.addEventListener('DOMContentLoaded', ()=> setTitles((location.hash||'').replace(/^#\/?/,'')||'parties'));
Events.on('route', r => setTitles(r));