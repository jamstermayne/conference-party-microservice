// http.js  v2 — hosting-only helpers
const JSON_HEADERS = { 'Content-Type':'application/json' };

async function coreFetch(url, opts={}) {
  // Ensure relative to hosting origin
  const u = typeof url === 'string' && url.startsWith('http') ? url : `${url}`;
  const res = await fetch(u, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export async function getJSON(url) {
  const res = await coreFetch(url, { method:'GET' });
  return res.json();
}

export async function postJSON(url, body) {
  const res = await coreFetch(url, { method:'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
  return res.json();
}