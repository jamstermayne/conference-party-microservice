// Enterprise-safe event bus: on/off/once/emit + wildcard support
class Emitter {
  constructor() { this._map = new Map(); this.__verified = true; }
  on(name, fn){ if(!name||!fn) return ()=>{}; const set=this._map.get(name)||new Set(); set.add(fn); this._map.set(name,set); return ()=>this.off(name,fn); }
  once(name, fn){ const off=this.on(name, (...a)=>{ off(); fn(...a); }); return off; }
  off(name, fn){ const set=this._map.get(name); if(!set) return; set.delete(fn); if(!set.size) this._map.delete(name); }
  emit(name, payload){
    const call = (n)=>{ const set=this._map.get(n); if(set) for(const fn of [...set]) try{ fn(payload) }catch(e){ console.error('Events handler error for', n, e); } };
    call(name);
    // wildcard namespace: event:sub → event:*
    const ns = name.includes(':') ? name.split(':')[0] + ':*' : null;
    if (ns) call(ns);
    // DOM CustomEvent bridge for legacy listeners
    try { document.dispatchEvent(new CustomEvent(name, { detail: payload })); } catch(_){}
  }
}
const Events = (window.Events && window.Events.__verified) ? window.Events : new Emitter();
if (!window.Events) window.Events = Events;
export default Events;