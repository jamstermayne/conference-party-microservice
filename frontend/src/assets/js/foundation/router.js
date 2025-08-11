// Hash-based SPA router: activates [data-route], supports Events.navigate
import Events from './events.js';
import Logger from './logger.js';

class Router {
  constructor(){ this.__verified = true; this.defaultRoute = 'parties'; this.active = null; this._init(); window.Router=this; }
  _init(){
    window.addEventListener('hashchange', ()=> this._apply());
    window.addEventListener('popstate', ()=> this._apply());
    Events.on('navigate', (path)=> this.go(path));
    document.addEventListener('DOMContentLoaded', ()=> this._apply());
  }
  _findPanels(){ return Array.from(document.querySelectorAll('[data-route]')); }
  _normalize(route){
    if (!route) return this.defaultRoute;
    return route.replace(/^#\/?/,'').replace(/^\//,'');
  }
  current(){ return this._normalize(location.hash.slice(1)); }
  go(path){
    if (path.startsWith('/')) path = path.slice(1);
    if (('#' + path) === location.hash) return this._apply();
    location.hash = path;
  }
  _apply(){
    const route = this._normalize(location.hash.slice(1));
    const panels = this._findPanels();
    let shown = false;
    for (const p of panels){
      const active = p.getAttribute('data-route') === route;
      p.style.display = active ? '' : 'none';
      if (active) shown = true;
    }
    if (!shown){
      Logger.warn('Route not found, falling back', { route });
      this.go(this.defaultRoute);
      return;
    }
    this.active = route;
    // nav highlight
    document.querySelectorAll('[data-route]').forEach(()=>{});
    document.querySelectorAll('.nav-item').forEach(n=>{
      const r = n.getAttribute('data-route');
      if (!r) return;
      if (r === route) n.classList.add('active'); else n.classList.remove('active');
    });
    Events.emit('route:change', { route });
  }
}
const router = (window.Router && window.Router.__verified) ? window.Router : new Router();
export default router;