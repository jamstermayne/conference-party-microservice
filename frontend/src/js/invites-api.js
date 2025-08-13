const API = '/api';

export async function getJSON(url){
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP '+r.status);
  return r.json();
}
export async function postJSON(url, body){
  const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body||{}) });
  if (!r.ok) throw new Error('HTTP '+r.status);
  return r.json();
}

export const InvitesAPI = {
  mine: (email)=> getJSON(`${API}/invites/mine?email=${encodeURIComponent(email)}`),
  generate: (email, count=1)=> postJSON(`${API}/invites/generate`, { email, count }),
  redeem: (code, email, invitedByEmail)=> postJSON(`${API}/invites/redeem`, { code, email, invitedByEmail }),
  me: (email)=> getJSON(`${API}/me?email=${encodeURIComponent(email)}`)
};