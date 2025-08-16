// Reactive Store with dot-path ops, debounced persistence, change events
import Events from './events.js';
import Logger from './logger.js';

const LS_KEY = 'app_state';
const SAVE_DEBOUNCE_MS = 250;

function getPath(obj, path){
  if (!path) return obj;
  return path.split('.').reduce((o,k)=> (o && k in o) ? o[k] : undefined, obj);
}
function setPath(obj, path, value){
  const keys = path.split('.'); let o = obj;
  for (let i=0;i<keys.length-1;i++){ const k=keys[i]; if (typeof o[k]!=='object'||o[k]===null) o[k]={}; o=o[k]; }
  o[keys[keys.length-1]] = value; return obj;
}
function merge(target, src){
  if (typeof src!=='object'||!src) return src;
  const out = Array.isArray(target)? [...target] : {...target};
  for (const [k,v] of Object.entries(src)){
    if (Array.isArray(v)) out[k] = [...v];
    else if (v && typeof v==='object') out[k] = merge(out[k]||{}, v);
    else out[k] = v;
  }
  return out;
}

class StoreClass {
  constructor(){
    this.__verified = true;
    this.state = {};
    this._timer = null;
    this._load();
    window.Store = this; // global for compat
  }
  _load(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      this.state = raw ? JSON.parse(raw) : {};
    } catch(e){ Logger.warn('Store load failed, starting clean', e); this.state = {}; }
  }
  _scheduleSave(){
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(()=> this._save(), SAVE_DEBOUNCE_MS);
  }
  _save(){
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); }
    catch(e){
      // fallback to sessionStorage if quota issues
      try { sessionStorage.setItem(LS_KEY, JSON.stringify(this.state)); }
      catch(e2){ Logger.error('Store save failed', { e, e2 }); }
    }
  }
  get(path){ return getPath(this.state, path); }
  set(path, value){ setPath(this.state, path, value); this._scheduleSave(); Events.emit('store:changed', { path, value }); Events.emit(`store:changed:${path}`, value); return value; }
  patch(path, partial){ const curr = path? (getPath(this.state, path)||{}) : this.state; const next = merge(curr, partial); this.set(path||'', next); return next; }
  replace(next){ this.state = next||{}; this._scheduleSave(); Events.emit('store:changed', { path:'', value:this.state }); return this.state; }
}
const Store = (window.Store && window.Store.__verified) ? window.Store : new StoreClass();
export default Store;