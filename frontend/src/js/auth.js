// /js/auth.js  — ✅ Auth v2.2 (guarded)
// Google GIS + LinkedIn redirect + invite validation + redeem glue (vanilla)

const ENV = window.__ENV || {};
const API_BASE = ENV.API_BASE || ""; // e.g. "/api" or full CF URL
const INVITE_REDEEM_ENDPOINT = ENV.INVITE_REDEEM_ENDPOINT || (API_BASE ? `${API_BASE}/invites/redeem` : "");

// Replace process.env with ENV
export const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID || "";
export const LINKEDIN_CLIENT_ID = ENV.LINKEDIN_CLIENT_ID || "";
export const LINKEDIN_REDIRECT_URI = ENV.LINKEDIN_REDIRECT_URI || (location.origin + '/auth/linkedin/callback');

const need = (k) => { const v = ENV[k]; if (!v) throw new Error(`${k} not configured`); return v; };

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=> '')}`);
  return res.json().catch(() => ({}));
}

// ---------- Invite validation ----------
async function validateInviteCode(code) {
  if (!code) return { valid: true };
  if (!ENV.INVITES_API || !ENV.BACKEND_BASE) return { valid: true };
  return postJSON(`${ENV.BACKEND_BASE}/invites/validate`, { code });
}

// ---------- Google Sign-In (GIS) ----------
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
        // user may dismiss; we still resolve via button flows
        if (n?.isNotDisplayed() || n?.isSkippedMoment()) {/* no-op */}
      });
    } catch (e) { reject(e); }
  });
}

// ---------- Redeem with Google (MUST exist before any handler uses it) ----------
// Guarded no-op to silence calls until backend ready
export async function redeemWithGoogle(inviteCode = "") {
  if (!INVITE_REDEEM_ENDPOINT) {
    console.warn('[auth] redeemWithGoogle disabled (no INVITE_REDEEM_ENDPOINT)');
    return { success: false, disabled: true };
  }
  try {
    const idToken = window.__lastGoogleIdToken || sessionStorage.getItem('google_id_token') || ""; // set by your GIS handler when available
    const res = await fetch(INVITE_REDEEM_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: inviteCode, id_token: idToken })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    
    // Persist a light profile to Store if present
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
  } catch (e) {
    console.error('[auth] redeemWithGoogle failed', e);
    return { success: false, error: String(e?.message || e) };
  }
}

// ---------- LinkedIn OAuth (redirect) ----------
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

// ---------- Current user ----------
function getCurrentUser() {
  try { return window.Store?.get?.('profile') || null; } catch { return null; }
}

// ---------- data-action bindings ----------
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

// In your init block, before wiring buttons:
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Auth v2.2 (guarded) loaded');

  // Guard Google button if no client id
  const btnGoogle = document.querySelector('[data-action="auth-google"]');
  if (btnGoogle && !GOOGLE_CLIENT_ID) {
    btnGoogle.setAttribute('disabled', 'true');
    btnGoogle.title = 'Google sign-in not configured';
  }

  // Guard LinkedIn button if no client id
  const btnLinkedIn = document.querySelector('[data-action="auth-linkedin"]');
  if (btnLinkedIn && !LINKEDIN_CLIENT_ID) {
    btnLinkedIn.setAttribute('disabled', 'true');
    btnLinkedIn.title = 'LinkedIn sign-in not configured';
  }
});

const Auth = { signInWithGoogle, signInWithLinkedIn, redeemWithGoogle, validateInviteCode, getCurrentUser };
window.Auth = Auth;
export default Auth;