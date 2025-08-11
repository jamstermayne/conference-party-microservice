import { qs, setTitle } from './ui.js';
import { Store } from './state.js';
import { PartiesView } from './parties.js';
import { InvitesView } from './invites.js';
import { CalendarView } from './calendar.js';
import { ProfileView } from './profile.js';
import { SettingsView } from './settings.js';

// Simple hash-less router using data-route on sidebar
export function mountRoute(route){
  Store.route = route;
  const mount = qs('#route');
  switch(route){
    case 'parties': setTitle('Parties'); mount.replaceChildren(PartiesView()); break;
    case 'invites': setTitle('Invites'); mount.replaceChildren(InvitesView()); break;
    case 'calendar': setTitle('Calendar'); mount.replaceChildren(CalendarView()); break;
    case 'me': setTitle('Me'); mount.replaceChildren(ProfileView()); break;
    case 'settings': setTitle('Settings'); mount.replaceChildren(SettingsView()); break;
    case 'hotspots': setTitle('Hotspots'); mount.replaceChildren(hotspotsStub()); break;
    case 'opportunities': setTitle('Opportunities'); mount.replaceChildren(oppsStub()); break;
    default: mount.replaceChildren(PartiesView());
  }
  
  // Update active nav
  updateActiveNav(route);
}

function updateActiveNav(activeRoute) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.route === activeRoute) {
      item.classList.add('active');
    }
  });
}

function hotspotsStub(){
  const s = document.createElement('section');
  s.className='card';
  s.innerHTML = `<div class="card-row"><div>
    <div class="card-title">Proximity Intelligence</div>
    <div class="meta">Venue aggregation • Privacy thresholds • Persona breakdown</div>
  </div><button class="btn btn-ghost btn-small" disabled>Coming live</button></div>`;
  return s;
}

function oppsStub(){
  const s = document.createElement('section');
  s.className='card';
  s.innerHTML = `<div class="card-row"><div>
    <div class="card-title">Opportunities</div>
    <div class="meta">Consent-based intros • Inbound/Outbound split • Tag matching</div>
  </div><button class="btn btn-ghost btn-small" disabled>Coming live</button></div>`;
  return s;
}

// Views are now imported from their respective modules