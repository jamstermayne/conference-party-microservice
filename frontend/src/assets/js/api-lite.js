export async function getJSON(url){
  const res = await fetch(url, { headers:{ 'accept':'application/json' }});
  if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json().catch(()=> ({}));
}
const CONF = 'gamescom2025';
const API_BASE = 'https://us-central1-conference-party-app.cloudfunctions.net';
export async function fetchParties(){
  const raw = await getJSON(`${API_BASE}/api/parties?conference=${encodeURIComponent(CONF)}`);
  return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw?.parties || [];
}
export async function fetchInvites(){
  try{ const raw = await getJSON(`${API_BASE}/api/invites`); return Array.isArray(raw) ? raw : (raw.items||[]); }
  catch{ return JSON.parse(localStorage.getItem('invites')||'[]'); }
}
export function saveInvites(list){ localStorage.setItem('invites', JSON.stringify(list)); }
