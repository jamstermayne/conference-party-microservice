// Account hub - aggregates user data and settings
const Store = window.Store;

export function renderAccount(){
  const root = document.getElementById('account-root') || document.getElementById('main') || document.getElementById('page-root');
  if(!root) return;

  const profile = Store.get('profile') || {};
  const invites = Store.get('invites') || { sent:0, redeemed:0, remaining:0 };
  const contacts = Store.get('contacts') || { total:0, connected:0 };

  root.innerHTML = `
  <div class="account-wrap">
    <div class="section">
      <h3>Your Information</h3>
      <div class="kv"><div class="key">Name</div><div>${escape(profile.name,'—')}</div></div>
      <div class="kv"><div class="key">Email</div><div>${escape(profile.email,'—')}</div></div>
      <div class="kv"><div class="key">Phone</div><div>${escape(profile.phone,'—')}</div></div>
      <div class="row-actions" style="margin-top:12px">
        <button class="btn" data-action="edit-email">Change email</button>
        <button class="btn" data-action="change-password">Change password</button>
        <button class="btn" data-action="connect-linkedin">Connect LinkedIn</button>
      </div>
    </div>

    <div class="section">
      <h3>Invites</h3>
      <div class="kv"><div class="key">Sent</div><div>${invites.sent}</div></div>
      <div class="kv"><div class="key">Redeemed</div><div>${invites.redeemed}</div></div>
      <div class="kv"><div class="key">Remaining</div><div>${invites.remaining}</div></div>
      <div class="row-actions" style="margin-top:12px">
        <button class="btn" data-action="invite">Invite friends</button>
        <button class="btn" data-action="view-activity">View activity</button>
      </div>
    </div>

    <div class="section">
      <h3>Contacts</h3>
      <div class="kv"><div class="key">Total</div><div>${contacts.total}</div></div>
      <div class="kv"><div class="key">Connected</div><div>${contacts.connected}</div></div>
      <div class="row-actions" style="margin-top:12px">
        <button class="btn" data-action="import-contacts">Import contacts</button>
      </div>
    </div>
  </div>`;

  wireAccountActions(root);
}

function wireAccountActions(root){
  root.addEventListener('click',(e)=>{
    const a = e.target.closest('[data-action]'); if(!a) return;
    const action = a.dataset.action;
    switch(action){
      case 'edit-email': dispatch('account:edit-email'); break;
      case 'change-password': dispatch('account:change-password'); break;
      case 'connect-linkedin': dispatch('account:connect-linkedin'); break;
      case 'invite': dispatch('invites:compose'); break;
      case 'view-activity': dispatch('activity:open'); break;
      case 'import-contacts': dispatch('contacts:import'); break;
    }
  });
}

function dispatch(name,detail){ try{ document.dispatchEvent(new CustomEvent(name,{detail})); }catch{} }
function escape(v,fallback=''){ return (v==null || v==='') ? fallback : String(v); }

// Auto-render on route
window.addEventListener('hashchange', maybeRender);
window.addEventListener('DOMContentLoaded', maybeRender);
function maybeRender(){
  if (location.hash.replace('#/','') === 'account') renderAccount();
}

console.log('✅ Account controller loaded');

export default { renderAccount };