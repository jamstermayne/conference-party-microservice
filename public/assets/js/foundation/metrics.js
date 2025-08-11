// Lightweight metrics queue with sendBeacon/fetch fallback
import Logger from './logger.js';
const QUEUE_KEY = 'metrics_queue';
const ENDPOINT = '/api/metrics';
const FLUSH_INTERVAL = 10_000;

function load(){ try{ return JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]'); } catch(_){ return []; } }
function save(q){ try{ localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch(e){ Logger.warn('metrics save fail', e); } }

let queue = load(), timer=null;
export function track(event, props={}){
  queue.push({ t: Date.now(), event, props });
  if (queue.length > 100) queue.shift();
  save(queue);
}
async function flush(){
  if (!queue.length) return;
  const payload = queue.slice(0);
  const ok = navigator.sendBeacon ? navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], {type:'application/json'})) : false;
  if (!ok){
    try {
      await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } catch(e){ Logger.warn('metrics flush fail', e); return; }
  }
  queue = []; save(queue);
}
function start(){ if (timer) return; timer = setInterval(flush, FLUSH_INTERVAL); document.addEventListener('visibilitychange', ()=> { if (document.hidden) flush(); }); }
start();

const Metrics = { track, flush, __verified:true };
if (!window.Metrics) window.Metrics = Metrics;
export default Metrics;