// js/controllers/AccountLinkController.js
import { Events } from '../events.js?v=b023';
import { Store }  from '../store.js?v=b023';

// BACKEND endpoints (implement server-side)
const LI = {
  AUTHORIZE: '/api/oauth/linkedin/authorize', // returns { authUrl }
  EXCHANGE:  '/api/oauth/linkedin/exchange'   // POST { code, state } → returns profile
};

export function AccountLinkController(section){
  const btnGoogle   = section.querySelector('#al-google');
  const btnLinkedIn = section.querySelector('#al-linkedin');
  const btnEmail    = section.querySelector('#al-email');

  section.addEventListener('route:enter', ()=> {
    // preload any needed SDKs if you wish (Google Identity loaded dynamically in your helpers)
  });

  btnGoogle.addEventListener('click', onGoogle);
  btnLinkedIn.addEventListener('click', onLinkedIn);
  btnEmail.addEventListener('click', onEmail);

  async function onGoogle(){
    try{
      // validate invites if present (optional)
      // await validateInviteCode(codeFromQueryString()) // if you use invite gating here

      // your provided helper — obtains Google JWT and persists via backend:
      const result = await redeemWithGoogle(/* optional invite code */);
      if (!result?.success) throw new Error('google redeem failed');

      Store.patch && Store.patch('profile', result.profile);
      toast('Account created with Google');
      Events.emit('auth.created', { provider:'google' });
      // proceed to calendar sync
      location.hash = '#/calendar-sync';
    }catch(e){
      toast('Google sign-in failed'); console.error(e);
    }
  }

  async function onLinkedIn(){
    try{
      // Step 1: ask backend for the LinkedIn OAuth URL (uses your registered app + scopes)
      const r = await fetch(LI.AUTHORIZE, { credentials:'include' });
      const { authUrl } = await r.json();
      // Step 2: popup
      const w = window.open(authUrl, 'li_auth', 'width=520,height=640');
      const code = await waitForOAuthCode(w, 'linkedin'); // postMessage-based
      // Step 3: exchange code on backend
      const ex = await fetch(LI.EXCHANGE, {
        method:'POST', credentials:'include',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ code: code.code, state: code.state })
      });
      const profile = await ex.json();
      if (!profile?.id) throw new Error('linkedin profile missing');

      Store.patch && Store.patch('profile', profile);
      toast('Account created with LinkedIn');
      Events.emit('auth.created', { provider:'linkedin' });
      location.hash = '#/calendar-sync';
    }catch(e){
      toast('LinkedIn sign-in failed'); console.error(e);
    }
  }

  function onEmail(){
    // fallback → route to simple email/password screen if you have it
    location.hash = '#/auth-email?source=calendar';
  }
}

// Utility: waits for OAuth popup to postMessage back { provider, code, state }
function waitForOAuthCode(popup, provider){
  return new Promise((resolve, reject)=>{
    const timer = setInterval(()=>{
      if (popup.closed){ clearInterval(timer); reject(new Error('popup closed')); }
    }, 500);
    window.addEventListener('message', function onMsg(e){
      try{
        const data = e.data || {};
        if (data.provider === provider && data.code){
          clearInterval(timer); window.removeEventListener('message', onMsg);
          popup.close(); resolve({ code:data.code, state:data.state });
        }
      }catch {}
    });
  });
}

// Tiny toast
function toast(msg){
  const tpl = document.getElementById('tpl-toast');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.msg').textContent = msg;
  document.body.appendChild(node);
  setTimeout(()=> node.remove(), 1800);
}