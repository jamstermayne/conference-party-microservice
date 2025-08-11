// Robust fetch: timeout, retries, backoff, JSON helpers, ETag cache, simple breaker
import Logger from './logger.js';
const DEFAULT_TIMEOUT = 10_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE = 300; // ms
const etagCache = new Map();
let breakerOpen = false, breakerUntil = 0;

function sleep(ms){ return new Promise(r=> setTimeout(r,ms)); }
function timeout(p, ms){ return Promise.race([p, new Promise((_,rej)=> setTimeout(()=> rej(new Error('timeout')), ms))]); }
function shouldRetry(res){ return res.status >= 500 || res.status === 429; }

async function coreFetch(url, options={}){
  if (breakerOpen && Date.now() < breakerUntil) throw new Error('circuit-open');
  const controller = new AbortController();
  const t = setTimeout(()=> controller.abort(), options.timeout||DEFAULT_TIMEOUT);

  const headers = new Headers(options.headers||{});
  const cached = etagCache.get(url);
  if (cached?.etag) headers.set('If-None-Match', cached.etag);

  let res;
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } finally { clearTimeout(t); }

  if (res.status === 304 && cached){
    return new Response(new Blob([cached.body]), { status:200, headers:res.headers });
  }

  const etag = res.headers.get('ETag');
  const body = await res.clone().arrayBuffer();
  if (etag && res.ok) etagCache.set(url, { etag, body });

  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, url });
  return res;
}

export async function fetchRetry(url, opts={}){
  let attempt=0, lastErr=null;
  while (attempt <= (opts.retries ?? MAX_RETRIES)){
    try {
      return await coreFetch(url, opts);
    } catch (e){
      lastErr = e;
      const retriable = e.message==='timeout' || e.status===429 || (e.status>=500);
      if (!retriable || attempt === (opts.retries ?? MAX_RETRIES)){
        // Open breaker briefly on server errors
        if (e.status>=500){ breakerOpen=true; breakerUntil=Date.now()+2000; setTimeout(()=> breakerOpen=false, 2000); }
        throw e;
      }
      const backoff = (opts.backoffBase ?? BACKOFF_BASE) * Math.pow(2, attempt);
      await sleep(backoff + Math.random()*50);
      attempt++;
    }
  }
  throw lastErr || new Error('fetch failed');
}

export async function getJSON(url, opts={}){ const res=await fetchRetry(url, { ...opts, method:'GET' }); return res.json(); }
export async function postJSON(url, body, opts={}){
  const res = await fetchRetry(url, { ...opts, method:'POST', headers:{'Content-Type':'application/json', ...(opts.headers||{})}, body: JSON.stringify(body) });
  return res.json();
}

export default { fetchRetry, getJSON, postJSON };