/**
 * Account Hub (velocity.ai)
 * - Safe, defensive rendering (no hard deps)
 * - Aggregates: profile, invites, selections
 * - Moves Google/LinkedIn sign-in here
 */

const q = (sel, el=document) => el.querySelector(sel);
const getStore = () => (window.Store && typeof window.Store.get === 'function') ? window.Store : null;
const Auth = () => window.Auth || {};

function fmt(v, fallback='—') { return (v===0 || v) ? v : fallback; }
function linkify(x) {
  if (!x) return '—';
  try { const u = new URL(x); return u.hostname; } catch { return x; }
}

function readState() {
  const store = getStore();
  const user = (Auth().getCurrentUser && Auth().getCurrentUser()) || null;
  const selected = store?.get?.('selections') || [];
  const invites = store?.get?.('invites') || { sent: 0, redeemed: 0, left: 0, remaining: 10 };
  const profile = store?.get?.('profile') || {};

  return {
    user,
    profile,
    stats: {
      selected: Array.isArray(selected) ? selected.length : 0,
      sent: Number(invites.sent || 0),
      redeemed: Number(invites.redeemed || 0),
      left: Number(invites.left || invites.remaining || 10),
    }
  };
}

export function renderAccount(root = document.body) {
  const mount = q('#main') || q('#page-root') || q('#app') || root;
  const { user, profile, stats } = readState();

  mount.innerHTML = `
    <div class="account-wrap">
      <div class="account-title">Account</div>
      <div class="account-subtitle">Manage your profile, connections and sync.</div>

      <!-- Your Information -->
      <section class="account-section">
        <div class="acc-list">
          <div class="acc-row">
            <div class="acc-label">Name</div>
            <div class="acc-value">${fmt(user?.displayName || profile.name)}</div>
            <div class="acc-chevron">›</div>
          </div>
          <div class="acc-row">
            <div class="acc-label">Email</div>
            <div class="acc-value">${fmt(user?.email || profile.email)}</div>
            <div class="acc-actions">
              <button class="btn btn-ghost" data-act="edit-email">Edit</button>
            </div>
          </div>
          <div class="acc-row">
            <div class="acc-label">Mobile Number</div>
            <div class="acc-value">${fmt(profile.phone)}</div>
            <div class="acc-actions">
              <button class="btn btn-ghost" data-act="edit-phone">Edit</button>
            </div>
          </div>
          <div class="acc-row">
            <div class="acc-label">LinkedIn</div>
            <div class="acc-value">${fmt(linkify(profile.linkedin))}</div>
            <div class="acc-actions">
              <button class="btn" data-act="connect-linkedin">Connect</button>
            </div>
          </div>
        </div>

        <div class="acc-stats">
          <div class="acc-chip"><div class="k">Selected Parties</div><div class="v">${stats.selected}</div></div>
          <div class="acc-chip"><div class="k">Invites Sent</div><div class="v">${stats.sent}</div></div>
          <div class="acc-chip"><div class="k">Invites Redeemed</div><div class="v">${stats.redeemed}</div></div>
          <div class="acc-chip"><div class="k">Invites Left</div><div class="v">${stats.left}</div></div>
        </div>
      </section>

      <!-- Sign-in / Providers -->
      <section class="account-section">
        <div class="acc-list">
          <div class="acc-row">
            <div class="acc-label"><span class="disc"></span>Google</div>
            <div class="acc-actions">
              <button class="btn" data-act="signin-google">Sign in</button>
            </div>
          </div>
          <div class="acc-row">
            <div class="acc-label"><span class="disc"></span>LinkedIn</div>
            <div class="acc-actions">
              <button class="btn" data-act="signin-linkedin">Sign in</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Help -->
      <section class="acc-help account-section">
        <h4>Need help?</h4>
        <div>We've got your back. Check help articles or contact us.</div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="btn">Help Center</button>
          <button class="btn btn-primary">Contact Support</button>
        </div>
      </section>
    </div>
  `;

  wireAccountActions(mount);
  try { 
    if (window.Events && window.Events.emit) {
      window.Events.emit('ui:account:rendered');
    }
  } catch {}
}

function wireAccountActions(root) {
  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.getAttribute('data-act');

    if (act === 'signin-google') {
      if (Auth().signInWithGoogle) {
        Auth().signInWithGoogle().catch(console.warn);
      } else {
        console.log('Google authentication clicked');
        alert('Google authentication coming soon!');
      }
    }
    if (act === 'signin-linkedin') {
      if (Auth().signInWithLinkedIn) {
        Auth().signInWithLinkedIn().catch(console.warn);
      } else {
        console.log('LinkedIn authentication clicked');
        alert('LinkedIn authentication coming soon!');
      }
    }
    if (act === 'edit-email') {
      const nv = prompt('Update email:', (getStore()?.get?.('profile')?.email || ''));
      if (nv) {
        getStore()?.set?.('profile.email', nv);
        renderAccount(); // Re-render to show update
      }
    }
    if (act === 'edit-phone') {
      const nv = prompt('Update phone:', (getStore()?.get?.('profile')?.phone || ''));
      if (nv) {
        getStore()?.set?.('profile.phone', nv);
        renderAccount(); // Re-render to show update
      }
    }
    if (act === 'connect-linkedin') {
      const nv = prompt('Paste LinkedIn profile URL:', (getStore()?.get?.('profile')?.linkedin || ''));
      if (nv) {
        getStore()?.set?.('profile.linkedin', nv);
        renderAccount(); // Re-render to show update
      }
    }
  });
}

// Optional auto-register if router dispatches a custom event:
document.addEventListener('route:account', ()=>renderAccount());

export default { renderAccount };