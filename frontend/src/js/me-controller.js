import Store from './store.js?v=b011';
import { toast } from './ui-feedback.js?v=b011';
import { Events } from './events.js?v=b011';

export function renderAccount() {
  const root = document.querySelector('[data-view="me"]');
  if (!root) {
    // Fallback to legacy selector
    const fallback = document.querySelector('[data-route="me"]');
    if (fallback) {
      renderAccountToElement(fallback);
    }
    return;
  }
  renderAccountToElement(root);
}

function renderAccountToElement(root) {
  const user = Store?.get?.('user') || null;
  root.innerHTML = `
    <section class="card-pro" style="margin-bottom:16px">
      <h3>Account</h3>
      <div class="meta">${user ? `Signed in as ${user.name || user.email || 'user'}` : 'Not signed in'}</div>
    </section>

    <section class="card-pro">
      <h3>Linked Accounts</h3>
      <div class="actions" style="margin-top:10px">
        <button class="btn-soft" data-auth="google">Connect Google</button>
        <button class="btn-soft" data-auth="linkedin">Connect LinkedIn</button>
      </div>
    </section>

    <section class="card-pro">
      <h3>Settings</h3>
      <div class="meta">Manage your preferences and privacy</div>
      <div class="actions" style="margin-top:10px">
        <button class="btn-soft" data-action="settings">Open Settings</button>
      </div>
    </section>
  `;

  root.querySelector('[data-auth="google"]')?.addEventListener('click', async ()=>{
    try { 
      const authModule = await import('./auth.js?v=b011');
      await authModule.signInWithGoogle?.(); 
      toast('Google connected', 'success'); 
    } catch(e){ 
      console.error(e);
      toast('Google sign-in failed','error'); 
    }
  });
  
  root.querySelector('[data-auth="linkedin"]')?.addEventListener('click', async ()=>{
    try { 
      const authModule = await import('./auth.js?v=b011');
      await authModule.signInWithLinkedIn?.(); 
      toast('LinkedIn connected', 'success'); 
    } catch(e){ 
      console.error(e);
      toast('LinkedIn sign-in failed','error'); 
    }
  });

  root.querySelector('[data-action="settings"]')?.addEventListener('click', ()=>{
    toast('Settings coming soon', 'info');
  });
}

// on route enter
Events.on('navigate', (path)=>{
  if ((path||'').replace('#/','') === 'me') renderAccount();
});