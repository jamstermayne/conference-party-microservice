import { Events } from './events.js';

export function render(container){
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'card card-filled card-elevated';
  card.innerHTML = `
    <div class="card-header">
      <div class="text-heading">Account</div>
      <button class="btn btn-icon" aria-label="Account settings" data-action="account:settings">⚙️</button>
    </div>
    <div class="card-body">
      <p class="text-secondary">Sign in to sync, save and invite.</p>
      <div class="stack-2">
        <button id="btn-google" class="btn btn-primary btn-connect">Sign in with Google</button>
        <button id="btn-linkedin" class="btn btn-secondary btn-connect">Sign in with LinkedIn</button>
      </div>
    </div>
  `;
  container.appendChild(card);

  // wire buttons to existing auth module
  const g = card.querySelector('#btn-google');
  const l = card.querySelector('#btn-linkedin');
  if (g) g.addEventListener('click', () => import('./auth.js').then(m => m.signInWithGoogle?.()));
  if (l) l.addEventListener('click', () => import('./auth.js').then(m => m.signInWithLinkedIn?.()));

  // settings open
  card.querySelector('[data-action="account:settings"]')?.addEventListener('click', ()=>{
    Events.emit('ui:toast', { type: 'ok', message: 'Settings coming soon.' });
  });
}

// register with Events bus
Events.on?.('navigate', ({route, container})=>{
  if (route === 'me') render(container);
});