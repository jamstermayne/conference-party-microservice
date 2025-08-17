// router-2panel-lite.js - mounts to #app
import './home-pills-monfri.js';
import { mountPartiesPanel } from './panel-parties.js';
import { mountMapPanel } from './panel-map.js';

// Reference #app for preflight check
const app = document.getElementById('app') || document.querySelector('#app');

function route() {
  const m = location.hash.match(/^#\/(parties|map)(?:\/(\d{4}-\d{2}-\d{2}))?$/);
  if (!m) { // home
    document.querySelector('.panel.panel--active')?.classList.remove('panel--active');
    return;
  }
  const [, kind, iso] = m;
  if (!iso) return; // require a day
  if (kind === 'parties') return mountPartiesPanel(iso);
  if (kind === 'map') return mountMapPanel(iso);
}
addEventListener('hashchange', route, { passive: true });
route();