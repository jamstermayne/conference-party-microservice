// public/js/auth.js
// Production auth (vanilla). Google GIS + LinkedIn redirect. Invite redeem glue.

const ENV = window.__ENV || {};
const need = (k) => { const v = ENV[k]; if (!v) throw new Error(`${k} not configured`); return v; };

function loadScript(src) {
  return new Promise((res, rej) => { const s=document.createElement('script'); s.src=src; s.async=true; s.defer=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
}

async function postJSON(url, body) {
  const res = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=> '')}`);
  return res.json().catch(()=> ({}));
}

// ---- Google Sign-In (GIS) ----
async function signInWithGoogle() {
  const clientId = need('GOOGLE_CLIENT_ID');
  if (!window.google?.accounts?.id) {
    await loadScript('https://accounts.google.com/gsi/client');
  }
  return new Promise((resolve, reject) => {
    try {
      const callback = (resp) => {
        if (!resp?.credential) return reject(new Error('No Google credential'));
        sessionStorage.setItem('google_id_token', resp.credential);
        resolve({ id_token: resp.credential });
      };
      window.google.accounts.id.initialize({ client_id: clientId, callback, auto_select: false });
      window.google.accounts.id.prompt((n) => {
        if (n?.isNotDisplayed() || n?.isSkippedMoment()) {
          reject(new Error('Google prompt dismissed'));
        }
      });
    } catch (e) { reject(e); }
  });
}

// ---- Invite validation (soft-allow if API not ready) ----
async function validateInviteCode(code) {
  if (!code) return { valid: true };
  if (!ENV.INVITES_API || !ENV.BACKEND_BASE) return { valid: true };
  return postJSON(`${ENV.BACKEND_BASE}/invites/validate`, { code });
}

// ---- Redeem with Google (defined BEFORE any usage) ----
async function redeemWithGoogle(inviteCode) {
  const base = need('BACKEND_BASE');
  const idToken = sessionStorage.getItem('google_id_token');
  if (!idToken) throw new Error('Missing Google id_token');

  const payload = { code: inviteCode || null, id_token: idToken };
  const json = await postJSON(`${base}/auth/redeem/google`, payload);

  // persist light profile to Store if present
  try {
    const p = json?.profile || {};
    window.Store?.patch?.('profile', {
      id: p.id || '',
      email: p.email || '',
      name: p.name || '',
      picture: p.picture || '',
      domain: p.domain || ''
    });
  } catch {}
  return json;
}

// ---- LinkedIn OAuth (redirect) ----
async function signInWithLinkedIn() {
  const clientId = need('LINKEDIN_CLIENT_ID');
  const redirectUri = location.origin + '/auth/linkedin/callback';
  const state = Math.random().toString(36).slice(2);
  const scope = 'r_liteprofile r_emailaddress';

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', scope);

  sessionStorage.setItem('li_oauth_state', state);
  location.href = url.toString();
}

// ---- Current user (from Store if available) ----
function getCurrentUser() {
  try { return window.Store?.get?.('profile') || null; } catch { return null; }
}

// ---- Data-action bindings (safe if not present) ----
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  if (el.dataset.action === 'auth.google') {
    try {
      const code = document.querySelector('[data-invite-code]')?.value?.trim() || null;
      const ok = await validateInviteCode(code);
      if (code && ok?.valid === false) throw new Error('Invalid invite code');
      await signInWithGoogle();
      if (code) await redeemWithGoogle(code);
      window.Events?.emit?.('auth:google:ok');
    } catch (err) {
      console.error('google auth error:', err);
      window.Events?.emit?.('ui:toast', { type: 'error', message: String(err?.message || err) });
    }
  }

  if (el.dataset.action === 'auth.linkedin') {
    try { await signInWithLinkedIn(); }
    catch (err) {
      console.error('linkedin auth error:', err);
      window.Events?.emit?.('ui:toast', { type: 'error', message: String(err?.message || err) });
    }
  }
});

// ---- Single surface (avoid duplicate exports) ----
const Auth = { signInWithGoogle, signInWithLinkedIn, redeemWithGoogle, validateInviteCode, getCurrentUser };
window.Auth = Auth;
export default Auth;