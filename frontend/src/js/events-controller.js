// Parties view with polished cards + infinite scroll
import { renderPartiesInfinite } from '/js/parties-infinite.js';
import { getJSON } from '/js/http.js';
const Store = window.Store;

async function fetchEvents(){
  // Prefer your /api/parties if available; fallback to cached list
  const url = '/api/parties?conference=gamescom2025';
  try{
    const res = await getJSON(url); // { success, data: [...] }
    if(res?.success && Array.isArray(res.data)) return res.data;
  }catch(e){ console.warn('Parties API not available; using local cache', e); }
  return Store.get('events.all') || [];
}

export async function renderParties(){
  const main = document.getElementById('main') || document.getElementById('page-root');
  if (!main) return;
  
  main.innerHTML = `
    <section class="panel">
      <div class="panel-head">
        <h2>Parties</h2>
        <p class="subtle">Pick 3 parties you like • save & sync to calendar</p>
      </div>
      <div id="parties-list" data-parties-root></div>
    </section>`;
    
  const wrap = document.getElementById('parties-list');
  const events = await fetchEvents();
  Store.set('events.all', events);
  await renderPartiesInfinite(wrap, events);
  console.log('✅ Parties rendered (infinite)');
}

export default { renderParties };