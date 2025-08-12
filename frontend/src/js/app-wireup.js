/**
 * app-wireup.js
 * Loads nav builder + ensures app container exists.
 */
import '/js/nav-build.js';
import { currentRoute } from '/js/router.js';

(function ensureApp(){
  if (!document.getElementById('app')) {
    const shell = document.createElement('div');
    shell.id = 'app';
    shell.className = 'app-shell';
    // Assume index.html contains #sidenav already; ensure main area exists
    const main = document.createElement('main');
    main.className = 'main-panel';
    main.setAttribute('data-panel', currentRoute());
    document.body.appendChild(shell);
    shell.appendChild(main);
  }
})();

console.log('✅ App wire-up complete');