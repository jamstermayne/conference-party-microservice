/**
 * auth.js — Firebase Auth (compat) + helpers
 * - Reads config from window.__ENV.firebase (if present) or inline fallback
 * - Exposes window.Auth: init(), signInGoogle(), signOut(), getIdToken(), onChange(cb), current()
 */
(function(){
  const FALLBACK = {
    apiKey: "AIzaSyD-fallback",
    authDomain: "conference-party-app.firebaseapp.com",
    projectId: "conference-party-app",
    appId: "1:740658808222:web:c20a2656860d3a771f828f"
  };

  function cfg(){
    try { return (window.__ENV && window.__ENV.firebase) || FALLBACK; }
    catch(e){ return FALLBACK; }
  }

  let _inited = false, _user = null, _subs = new Set();

  async function init(){
    if (_inited) return;
    // Guard: SDK present?
    if (!window.firebase?.initializeApp) {
      console.warn("[Auth] Firebase SDK missing");
      return;
    }
    firebase.initializeApp(cfg());
    firebase.auth().onAuthStateChanged(u=>{
      _user = u || null;
      document.documentElement.classList.toggle('authed', !!_user);
      _subs.forEach(fn=>{ try{ fn(_user); }catch(e){} });
    });
    _inited = true;
  }

  async function signInGoogle(){
    await init();
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  }
  function signOut(){ return firebase.auth().signOut(); }
  function current(){ return _user; }
  async function getIdToken(force=true){
    await init();
    const u = firebase.auth().currentUser;
    if(!u) throw new Error("not_authed");
    return u.getIdToken(!!force);
  }
  function onChange(fn){ _subs.add(fn); return ()=>_subs.delete(fn); }

  window.Auth = { init, signInGoogle, signOut, getIdToken, onChange, current };
  // auto-init on load
  window.addEventListener('DOMContentLoaded', ()=>init());
})();
