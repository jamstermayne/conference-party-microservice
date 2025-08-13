import { cardGrid, partyCard } from './components/cards.js?v=b018';

// --- Infinite scroll impl (30 LINES, minimal + resilient) ---
export async function renderParties(mount){
  const root = mount || document.getElementById('main') || document.getElementById('app');
  if (!root) return;

  // Shell with a dedicated scroller area; we rely on #main to scroll
  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <header class="section-head">
        <h2 class="text-heading">Recommended events</h2>
        <div class="muted" style="font-size:12px;">Scroll to explore</div>
      </header>
    </section>
    <div id="party-grid" class="hero-wrap"></div>
    <div id="party-sentinel" style="height: 1px; margin: 20px;"></div>
  `;

  const grid = root.querySelector('#party-grid');
  const sentinel = root.querySelector('#party-sentinel');

  let page = 1, loading = false, done = false;

  async function loadMore() {
    if (loading || done) return;
    loading = true;
    try {
      const items = await fetchPartiesPage(page);
      if (!items || !items.length) { done = true; return; }
      items.forEach(p => grid.appendChild(partyCard(p)));
      page += 1;
    } catch(e){ console.warn('[UI] loadMore failed', e); done = true; }
    finally { loading = false; }
  }

  // Prime first two pages for a polished feel
  await loadMore(); 
  await loadMore();

  // Infinite scroll trigger
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en => { if (en.isIntersecting) loadMore(); });
  }, { root: document.getElementById('main') || null, rootMargin: '600px 0px', threshold: 0 });
  io.observe(sentinel);

  // Wire up actions
  wirePartyActions(root);
}

// Simple page fetcher with resilient fallback
async function fetchPartiesPage(page=1){
  // Prefer API if available
  try{
    const u = `/api/parties?conference=gamescom2025&page=${page}`;
    const res = await fetch(u, { credentials:'include' });
    if (res.ok){
      const json = await res.json();
      // support {items:[], nextCursor:?} or plain array
      const list = Array.isArray(json) ? json : (json.items || json.data || []);
      return list.map(normalizeParty);
    }
  }catch(e){ /* fall through to demo */ }

  // Fallback to demo data (repeatable pages)
  const seed = [
    { id:'meet-2025', title:'MeetToMatch The Cologne Edition 2025', venue:'Kölnmesse Confex',
      when:'Fri Aug 22, 09:00 – 18:00', price:'£127.04', live:true },
    { id:'marriott-mix', title:'Marriott Rooftop Mixer', venue:'Marriott Hotel',
      when:'Fri Aug 22, 20:00 – 23:30', live:true },
    { id:'dev-conf', title:'devcom Developer Conference', venue:'Kölnmesse Confex',
      when:'Mon Aug 18, 09:00 – 23:30', price:'€299' },
    { id:'launch', title:'Gamescom Launch Party', venue:'rooftop58',
      when:'Tue Aug 19, 20:00 – 00:00', live:true },
    { id:'pocket-gamer', title:'Pocket Gamer Mobile Game Awards', venue:'Gorzenich Koln',
      when:'Tue Aug 19, 18:30 – 23:30', price:'VIP' },
    { id:'indie-reveal', title:'INDIE Reveal during Gamescom', venue:'Filmforum NRW',
      when:'Wed Aug 20, 19:30 – 22:00' },
    { id:'safe-world', title:'Safe In Our World Reception', venue:'Cologne Fair',
      when:'Thu Aug 21, 16:00 – 19:00', live:true },
    { id:'xrai-hack', title:'Global XRAI Hack', venue:'STARTPLATZ',
      when:'Sun Aug 17, 09:00 – 19:00', price:'Free' }
  ];
  // create a fake page by offsetting ids
  return seed.map((x,i)=> normalizeParty({ ...x, id:`${x.id}-p${page}-${i}` }));
}

function normalizeParty(x){
  return {
    id: x.id,
    title: x.title,
    venue: x.venue,
    when: x.when,
    price: x.price,
    live: !!x.live
  };
}

function wirePartyActions(root){
  root.addEventListener('click', e=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const act = el.dataset.action;
    const id = el.dataset.id;
    if(act==='saveSync'){ console.log('[UI] Save & Sync', id); /* call your calendar sync here */ }
    if(act==='details'){ console.log('[UI] Details', id); /* open modal */ }
  });
}

export default { renderParties };