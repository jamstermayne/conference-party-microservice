/**
 * Sidebar (single mount, never replaced)
 * Keeps channels consistent across routes and only toggles active state.
 */
import Events from '/assets/js/events.js';

export const CHANNELS = [
  { id: 'parties',   label: '#parties'   },
  { id: 'calendar',  label: '#calendar'  },
  { id: 'map',       label: '#map'       },
  { id: 'hotspots',  label: '#hotspots'  },
  { id: 'invites',   label: '#invites'   },
  { id: 'contacts',  label: '#contacts'  },
  { id: 'me',        label: '#me'        },
  { id: 'settings',  label: '#settings'  },
];

let mounted = false;

export function mountSidebar(rootSel = '#sidebar') {
  const el = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
  if (!el || mounted) return;
  el.classList.add('sidebar');
  
  const channelItems = CHANNELS.map(c => 
    `<button class="nav-item" data-route="${c.id}" aria-label="${c.label}">${c.label}</button>`
  ).join('');
  
  el.innerHTML = `
    <div class="brand">
      <div class="vlogo" aria-hidden="true">V</div>
      <div class="brand-lines">
        <div class="brand-title">velocity.ai</div>
        <div class="brand-sub">Gamescom 2025</div>
      </div>
    </div>
    <nav class="nav-list" id="navList">
      ${channelItems}
    </nav>
  `;

  el.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.preventDefault();
      const r = btn.getAttribute('data-route');
      location.hash = `#/${r}`;
    }, { passive:false });
  });

  // react to route changes
  const setActive = (r)=>{
    el.querySelectorAll('.nav-item').forEach(n=>{
      n.classList.toggle('active', n.getAttribute('data-route') === r);
    });
  };
  Events.on?.('route:changed', ({route})=> setActive(route));
  setActive((location.hash.replace(/^#\/?/,'')||'parties').split('?')[0]);

  mounted = true;
}