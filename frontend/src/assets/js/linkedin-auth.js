// LinkedIn auth integration (vanilla, Store/Events, Slack-dark)
import Store from './store.js';
import Events from './events.js';

// Config: server starts OAuth (server handles client_id/secret safely)
const LINKEDIN_START = '/api/auth/linkedin/start'; // GET -> redirect to LinkedIn with state
const OAUTH_TIMEOUT_MS = 90_000;

function popup(url, w=520, h=640){
  const y = window.top.outerHeight/2 + window.top.screenY - ( h/2 );
  const x = window.top.outerWidth/2  + window.top.screenX - ( w/2 );
  return window.open(url, 'oauth', `width=${w},height=${h},left=${x},top=${y}`);
}

function mapLinkedInToProfile(payload){
  // Payload expected from backend callback exchange:
  // { id, firstName, lastName, email, avatar }
  const full = `${payload.firstName||''} ${payload.lastName||''}`.trim();
  const company = inferCompanyFromEmail(payload.email);
  const prev = Store.get('profile') || {};
  return {
    ...prev,
    name: full || prev.name,
    avatar: payload.avatar || prev.avatar,
    email: { ...(prev.email||{}), work: payload.email },
    company: company || prev.company
  };
}

function inferCompanyFromEmail(email){
  if (!email || !email.includes('@')) return '';
  const domain = email.split('@')[1].toLowerCase();
  const brand = domain.replace(/\.com|\.io|\.ai|\.co|\.gg|\.net|\.org$/,'')
                      .replace(/\..*$/,'')
                      .replace(/-/g,' ')
                      .replace(/\b\w/g,m=>m.toUpperCase());
  return brand;
}

export async function signInWithLinkedIn(){
  // Create one-time message listener for the OAuth callback window
  return new Promise((resolve, reject) => {
    const oauthWin = popup(LINKEDIN_START);
    if (!oauthWin) return reject(new Error('Popup blocked'));

    let done = false;
    const to = setTimeout(() => {
      if (done) return;
      done = true;
      try { oauthWin.close(); } catch(_){}
      reject(new Error('LinkedIn sign-in timed out'));
    }, OAUTH_TIMEOUT_MS);

    function onMessage(ev){
      // Expect: { source: 'oauth', provider: 'linkedin', ok, error?, profile? }
      if (!ev.data || ev.data.source !== 'oauth' || ev.data.provider !== 'linkedin') return;
      if (done) return;
      done = true; clearTimeout(to);
      window.removeEventListener('message', onMessage);
      try { oauthWin.close(); } catch(_){}

      if (ev.data.ok && ev.data.profile){
        const profile = mapLinkedInToProfile(ev.data.profile);
        Store.patch('profile', profile);
        const ids = Store.get('auth_identities') || [];
        Store.patch('auth_identities', [...ids.filter(i=>i.provider!=='linkedin'), { provider:'linkedin', id: ev.data.profile.id }]);

        Events.emit('ui:toast', { type:'success', message:'LinkedIn connected' });
        Events.emit('auth:linkedin:connected', { id: ev.data.profile.id });
        resolve(profile);
      } else {
        Events.emit('ui:toast', { type:'error', message: ev.data.error || 'LinkedIn sign-in failed' });
        reject(new Error(ev.data.error || 'LinkedIn sign-in failed'));
      }
    }
    window.addEventListener('message', onMessage);
  });
}

// Auto-bind any LinkedIn buttons in DOM
function bindLinkedInButtons(){
  // Accept either id or data attribute (keeps compatibility)
  const btns = document.querySelectorAll('[data-provider="linkedin"], #btn-linkedin');
  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.add('is-loading');
      try {
        await signInWithLinkedIn();
        Events.emit('navigate', '/me'); // bring user to account confirm (or keep current)
      } catch(_e) {}
      btn.disabled = false;
      btn.classList.remove('is-loading');
    });
  });
}

document.addEventListener('DOMContentLoaded', bindLinkedInButtons);

export default { signInWithLinkedIn };